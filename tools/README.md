# jsonlens —— 专啃大体积会话 JSON

[中文](#中文) · [한국어](#한국어)

---

# 中文

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

---

# 한국어

## 왜 필요한가

DSH의 `read` 도구에는 한계가 있습니다: **너무 긴 한 줄은 2000자에서 잘립니다**.
그런데 내보낸 DeepSeek 세션 JSON은 파일 전체가 한 줄입니다. 그래서 5.6MB,
3729개 메시지짜리 세션도 `read`로는 1번째 턴밖에 볼 수 없습니다.
첨부 디렉터리에서는 `grep`도 샌드박스에 막힙니다.

`jsonlens`는 Node로 직접 파싱하고 직접 잘라서 **이 두 제약을 우회**합니다.

## 사용법

먼저 파일을 `DSH-Go/` 디렉터리에 넣으세요(파일 앱으로 가져오기, 또는 DSH 워크스페이스에
보이게 하기). 그다음:

```bash
# 1. 이 파일이 뭔지 먼저 파악
node tools/jsonlens.js stats tools/_sample_session.json

# 2. 전체 메시지 목록, 앞 50자만
node tools/jsonlens.js list 세션.json --from 1 --to 100 --chars 50

# 3. 특정 턴의 전체 내용
node tools/jsonlens.js show 세션.json --from 97 --to 103 --chars 8000

# 4. 전문 키워드 검색 (에러, R103, 특정 심볼 찾기)
node tools/jsonlens.js search 세션.json "vm_read" --limit 30 --ctx 150

# 5. 전체를 Markdown으로 내보내기
node tools/jsonlens.js md 세션.json 출력.md
```

## 명령 요약

| 명령 | 기능 | 주요 옵션 |
|---|---|---|
| `stats` | 제목, 크기, 메시지 수, 글자 수, 역할 분포, 시간 범위 | — |
| `list` | 한 줄씩: 번호 / 역할 / 글자 수 / 요약 | `--from` `--to` `--chars` |
| `show` | 지정 범위의 전문 출력 | `--from` `--to` `--chars` |
| `search` | 정규식 검색, 문맥 포함 | `--limit` `--ctx` |
| `md` | 전체를 Markdown으로 내보내기 | — |

`list` / `show`의 `--from` / `--to`는 **1부터 시작하는** 메시지 번호이며,
`list`가 출력하는 `#N`과 일치합니다.

## 첨부 파일에 대해

`search`와 `list`는 업로드한 첨부를 `[첨부] 파일명`으로 표시하지만,
**첨부 내용 자체는 읽지 못합니다**. 첨부는 바이너리(이미지, zip)이거나
크기가 너무 크기 때문입니다. 첨부 내용을 봐야 한다면 원본 파일을
워크스페이스에 넣어야 합니다.

## 자체 점검

저장소에 `_sample_session.json`이 포함되어 있어 도구가 정상인지 확인할 수 있습니다:

```bash
node tools/jsonlens.js stats tools/_sample_session.json
# 출력: 메시지 6개, 나=3 AI=3, 550자
```

안 되면 파일 문제가 아니라 Node 환경 문제입니다.
