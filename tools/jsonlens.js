#!/usr/bin/env node
/**
 * jsonlens —— 专啃大体积 DeepSeek 会话导出 JSON
 *
 * 为什么要有它：DSH 的 read 工具会把超长单行截在 2000 字符，
 * 而导出的会话 JSON 整份只有一行。grep 在附件目录又被沙箱挡住。
 * 所以用 Node 自己解析、自己切段、自己输出。
 *
 * 用法：
 *   node jsonlens.js stats  <文件>
 *   node jsonlens.js list   <文件> [--from 1] [--to 50] [--chars 80]
 *   node jsonlens.js show   <文件> [--from 1] [--to 5] [--chars 4000]
 *   node jsonlens.js search <文件> <关键词> [--limit 20] [--ctx 120]
 *   node jsonlens.js md     <文件> <输出.md>
 */
"use strict";

const fs = require("fs");
const path = require("path");

const ROLE = { USER: "我", ASSISTANT: "AI", SYSTEM: "系统" };

function die(msg) {
  console.error("✗ " + msg);
  process.exit(1);
}

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const val = argv[i + 1];
      if (val !== undefined && !val.startsWith("--")) {
        out[key] = val;
        i++;
      } else {
        out[key] = true;
      }
    } else {
      out._.push(a);
    }
  }
  return out;
}

function loadSession(file) {
  const abs = path.resolve(file);
  if (!fs.existsSync(abs)) die("文件不存在：" + abs);
  const raw = fs.readFileSync(abs, "utf8");
  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    die("不是合法 JSON：" + e.message);
  }
  const msgs = Array.isArray(data) ? data : data.messages || [];
  return { data, msgs, bytes: Buffer.byteLength(raw, "utf8") };
}

/** 把一个 fragment 压成纯文本 */
function fragText(f) {
  if (f === null || f === undefined) return "";
  if (typeof f === "string") return f;
  if (typeof f !== "object") return String(f);
  if (typeof f.content === "string" && f.content.length) return f.content;
  if (Array.isArray(f.files)) {
    const names = f.files.map(function (x) {
      return x && x.file_name ? x.file_name : "?";
    });
    return "[附件] " + names.join(", ");
  }
  if (Array.isArray(f.queries)) {
    return "[搜索] " + f.queries.join("  |  ");
  }
  if (typeof f.text === "string") return f.text;
  return "[" + (f.type || "未知fragment") + "]";
}

function msgText(m) {
  const frags = m.fragments || [];
  const parts = [];
  for (let i = 0; i < frags.length; i++) {
    const t = fragText(frags[i]);
    if (t && t.trim().length) parts.push(t);
  }
  return parts.join("\n\n");
}

function clip(s, n) {
  if (!s) return "";
  if (s.length <= n) return s;
  return s.slice(0, n) + "\n…（截断，原长 " + s.length + " 字符）";
}

function oneLine(s, n) {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length <= n ? t : t.slice(0, n) + "…";
}

function fmtDate(iso) {
  if (!iso) return "?";
  return String(iso).replace("T", " ").replace(/\.\d+Z$/, "Z");
}

// ---------------------------------------------------------------- commands

function cmdStats(file) {
  const s = loadSession(file);
  const d = s.data;
  let chars = 0;
  const roleCount = {};
  for (let i = 0; i < s.msgs.length; i++) {
    const m = s.msgs[i];
    chars += msgText(m).length;
    roleCount[m.role] = (roleCount[m.role] || 0) + 1;
  }
  const roles = Object.keys(roleCount)
    .map(function (k) {
      return (ROLE[k] || k) + "=" + roleCount[k];
    })
    .join("  ");

  console.log("标题      " + (d.title || "(无标题)"));
  console.log("文件      " + path.resolve(file));
  console.log("体积      " + (s.bytes / 1024 / 1024).toFixed(2) + " MB");
  console.log("消息数    " + s.msgs.length);
  console.log("正文字数  " + chars);
  console.log("角色分布  " + roles);
  console.log("创建      " + fmtDate(d.inserted_at));
  console.log("更新      " + fmtDate(d.updated_at));
}

function cmdList(file, opt) {
  const s = loadSession(file);
  const from = parseInt(opt.from || "1", 10);
  const to = parseInt(opt.to || String(s.msgs.length), 10);
  const n = parseInt(opt.chars || "80", 10);

  console.log("[" + (s.data.title || "无标题") + "] 共 " + s.msgs.length + " 条，输出 " + from + "-" + to);
  for (let i = 0; i < s.msgs.length; i++) {
    const idx = i + 1;
    if (idx < from || idx > to) continue;
    const m = s.msgs[i];
    const t = msgText(m);
    console.log(
      "#" + idx + "  " + (ROLE[m.role] || m.role) + "  " + t.length + "字  " + oneLine(t, n)
    );
  }
}

function cmdShow(file, opt) {
  const s = loadSession(file);
  const from = parseInt(opt.from || "1", 10);
  const to = parseInt(opt.to || String(from), 10);
  const n = parseInt(opt.chars || "4000", 10);

  for (let i = 0; i < s.msgs.length; i++) {
    const idx = i + 1;
    if (idx < from || idx > to) continue;
    const m = s.msgs[i];
    console.log("\n═══ #" + idx + "  " + (ROLE[m.role] || m.role) + "  " + fmtDate(m.inserted_at) + " ═══\n");
    console.log(clip(msgText(m), n));
  }
}

function cmdSearch(file, kw, opt) {
  const s = loadSession(file);
  const limit = parseInt(opt.limit || "20", 10);
  const ctx = parseInt(opt.ctx || "120", 10);
  let re;
  try {
    re = new RegExp(kw, "gi");
  } catch (e) {
    re = new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
  }

  let hits = 0;
  let scanned = 0;
  for (let i = 0; i < s.msgs.length; i++) {
    const m = s.msgs[i];
    const t = msgText(m);
    if (!t) continue;
    scanned++;
    let mm;
    re.lastIndex = 0;
    while ((mm = re.exec(t)) !== null) {
      hits++;
      const start = Math.max(0, mm.index - ctx);
      const end = Math.min(t.length, mm.index + mm[0].length + ctx);
      const before = t.slice(start, mm.index).replace(/\s+/g, " ");
      const hit = mm[0];
      const after = t.slice(mm.index + hit.length, end).replace(/\s+/g, " ");
      console.log("\n#" + (i + 1) + " [" + (ROLE[m.role] || m.role) + "]");
      console.log("  …" + before + "【" + hit + "】" + after + "…");
      if (hits >= limit) {
        console.log("\n（已达上限 " + limit + " 条，缩小关键词或调 --limit）");
        return;
      }
      if (mm[0].length === 0) re.lastIndex++;
    }
  }
  console.log("\n命中 " + hits + " 处，扫描 " + scanned + " 条消息");
}

function cmdMd(file, out) {
  const s = loadSession(file);
  const lines = [];
  lines.push("# " + (s.data.title || "未命名会话"));
  lines.push("");
  lines.push("- 会话 ID：" + (s.data.id || "?"));
  lines.push("- 消息数：" + s.msgs.length);
  lines.push("- 时间：" + fmtDate(s.data.inserted_at) + " → " + fmtDate(s.data.updated_at));
  lines.push("");
  for (let i = 0; i < s.msgs.length; i++) {
    const m = s.msgs[i];
    lines.push("---");
    lines.push("");
    lines.push("### #" + (i + 1) + " " + (ROLE[m.role] || m.role) + " · " + fmtDate(m.inserted_at));
    lines.push("");
    lines.push(msgText(m));
    lines.push("");
  }
  fs.writeFileSync(path.resolve(out), lines.join("\n"), "utf8");
  console.log("✓ 已导出：" + path.resolve(out) + "（" + lines.length + " 行）");
}

// ---------------------------------------------------------------- main

function main() {
  const argv = process.argv.slice(2);
  const opt = parseArgs(argv);
  const cmd = opt._[0];
  const file = opt._[1];

  if (!cmd || cmd === "help" || cmd === "--help") {
    console.log(require("fs").readFileSync(__filename, "utf8").split("*/")[0].replace(/^\/\*\*?/, ""));
    return;
  }
  if (!file) die("缺少文件参数");

  switch (cmd) {
    case "stats":
      return cmdStats(file);
    case "list":
      return cmdList(file, opt);
    case "show":
      return cmdShow(file, opt);
    case "search":
      if (!opt._[2]) die("缺少关键词");
      return cmdSearch(file, opt._[2], opt);
    case "md":
      if (!opt._[2]) die("缺少输出文件名");
      return cmdMd(file, opt._[2]);
    default:
      die("未知命令：" + cmd + "（stats / list / show / search / md）");
  }
}

main();
