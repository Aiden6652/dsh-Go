# jsonlens —— 专啃大体积会话 JSON

## 为什么需要它

DSH 的 `read` 工具有个硬限制：**超长单行会被截在 2000 字符**。而导出的
DeepSeek 会话 JSON 整份就是一行 —— 所以一个 5.6 MB、3729 条消息的会话，
用 `read` 只能看到第 1 轮。`grep` 在附件目录又会被沙箱挡掉。

`jsonlens` 用 Node 自己解析、自己切段，**绕开这两个限制**。

## 用法

先把文件放进 `DSH-Go/` 目录（文件 App 导入，或让 DSH 工作区可见），然后：

```bash
# 1. 先摸清这文件是什么
node tools/jsonlens.js stats tools/_sample_session.json

# 2. 列出所有消息，只看开头 50 字
node tools/jsonlens.js list 会话.json --from 1 --to 100 --chars 50

# 3. 看某几轮完整内容
node tools/jsonlens.js show 会话.json --from 97 --to 103 --chars 8000

# 4. 全文搜关键词（找报错、找 R103、找某个符号）
node tools/jsonlens.js search 会话.json "vm_read" --limit 30 --ctx 150

# 5. 整份导成 Markdown，方便慢慢看
node tools/jsonlens.js md 会话.json 输出.md
```

## 命令速查

| 命令 | 作用 | 常用参数 |
|---|---|---|
| `stats` | 标题、体积、消息数、字数、角色分布、时间范围 | — |
| `list` | 每条一行：编号 / 角色 / 字数 / 摘要 | `--from` `--to` `--chars` |
| `show` | 输出指定范围的全文 | `--from` `--to` `--chars` |
| `search` | 正则搜索，带上下文 | `--limit` `--ctx` |
| `md` | 整份导出 Markdown | — |

`list` / `show` 的 `--from` / `--to` 都是**从 1 开始**的消息序号，跟 `list` 打出来的 `#N` 对齐。

## 关于附件

`search` 和 `list` 会把你上传的附件显示成 `[附件] 文件名`，
但**没法把附件里的内容读出来**——附件本身是二进制（图片、zip），
或者体积太大。需要看附件内容的话，还是得把原文件放进工作区。

## 自检

仓库里带了一个 `_sample_session.json`，就是拿来验证工具是否正常的：

```bash
node tools/jsonlens.js stats tools/_sample_session.json
# 应该输出：6 条消息，我=3 AI=3，550 字
```

跑不通就说明 Node 环境有问题，而不是文件有问题。
