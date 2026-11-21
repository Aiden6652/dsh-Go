# 导入 DDI（手机操控） / DDI 가져오기 (휴대폰 제어)

[中文](#中文) · [한국어](#한국어)

---

# 中文

## 为什么需要这个

iOS 的手机操控要先挂载 **DDI（Developer Disk Image）**。默认路径是从固定镜像下载，
但开启 **LocalDevVPN** 之后，下载请求走不通；关了 VPN 又会被要求重新打开，形成死锁。

现在可以绕开下载：**把 DDI 文件放进 App 的 `Documents/DDI/`，App 会自己导入。**

## 用法

1. 用「文件」App 打开 **DSH Go** 文件夹，新建目录 `DDI`。
2. 把 DDI 文件放进去。两种放法都行：

   ```
   Documents/DDI/
   ├── BuildManifest.plist
   ├── Image.dmg
   └── Image.dmg.trustcache
   ```

   或者按变体分目录（和镜像仓库的结构一致）：

   ```
   Documents/DDI/
   ├── personalized/
   │   ├── BuildManifest.plist
   │   ├── Image.dmg
   │   └── Image.dmg.trustcache
   └── cryptex/
       ├── BuildManifest.plist
       ├── Image.dmg
       ├── Image.dmg.trustcache
       ├── Image.dmg.cryptex_info
       └── Image.dmg.root_hash
   ```

3. 回到 App，重新进手机操控。`prepare` 会先检查这个目录，**有就导入，没有才走下载**。

## 导入和下载的区别

| | 下载（默认） | 导入（新增） |
|---|---|---|
| 来源 | 固定镜像仓库 | 你自己的文件 |
| 校验 | 文件名 + 字节数 + SHA-256 全对才用 | 只查文件名、大小上限、`BuildManifest.plist` 能否解析 |
| 网络 | 需要 | **不需要** |
| catalogId | `ddi-e2aae…-v1` | `ddi-imported-v1` |

导入的包没有固定哈希，因为你自己导出的 DDI 不可能和镜像的字节一致。所以导入模式
**只做结构校验**：文件齐、大小合理、manifest 能解析。挂载本身仍然由设备的 TSS
做真实验证，签名不对一样挂不上。

## 注意

- **变体要对**：iOS 27 及以上且有 `CryptexInstall` 的用 `cryptex`，否则用 `personalized`。
  放错变体等于没放，App 会继续尝试下载。
- **文件要完整**：`Image.dmg` 缺了或者截断了，导入会失败并退回下载。
- **不会自动清理**：导入之后 `imported` 一直是 true，直到进程重启。
  想回到下载模式，删掉 `Documents/DDI/` 再重启 App。

---

# 한국어

## 왜 필요한가

iOS 휴대폰 제어는 먼저 **DDI(Developer Disk Image)** 를 마운트해야 합니다.
기본 경로는 고정 미러에서 내려받는 것인데, **LocalDevVPN** 을 켜면 다운로드가 막히고,
끄면 다시 켜라고 요구해서 교착 상태가 됩니다.

이제 다운로드를 우회할 수 있습니다: **DDI 파일을 앱의 `Documents/DDI/` 에 넣으면
앱이 직접 가져옵니다.**

## 사용법

1. 「파일」앱에서 **DSH Go** 폴더를 열고 `DDI` 디렉터리를 만듭니다.
2. DDI 파일을 그 안에 넣습니다. 두 가지 배치 모두 지원됩니다:

   ```
   Documents/DDI/
   ├── BuildManifest.plist
   ├── Image.dmg
   └── Image.dmg.trustcache
   ```

   또는 변형별 하위 폴더(미러 저장소 구조와 동일):

   ```
   Documents/DDI/
   ├── personalized/
   │   ├── BuildManifest.plist
   │   ├── Image.dmg
   │   └── Image.dmg.trustcache
   └── cryptex/
       ├── BuildManifest.plist
       ├── Image.dmg
       ├── Image.dmg.trustcache
       ├── Image.dmg.cryptex_info
       └── Image.dmg.root_hash
   ```

3. 앱으로 돌아가 휴대폰 제어를 다시 시작합니다. `prepare` 가 이 디렉터리를 먼저 확인하고,
   **있으면 가져오고 없으면 다운로드**합니다.

## 가져오기와 다운로드의 차이

| | 다운로드(기본) | 가져오기(신규) |
|---|---|---|
| 출처 | 고정 미러 저장소 | 사용자 본인의 파일 |
| 검증 | 파일명 + 크기 + SHA-256 전부 일치해야 사용 | 파일명, 크기 상한, `BuildManifest.plist` 파싱 가능 여부만 확인 |
| 네트워크 | 필요 | **불필요** |
| catalogId | `ddi-e2aae…-v1` | `ddi-imported-v1` |

가져온 번들에는 고정 해시가 없습니다. 직접 내보낸 DDI 가 미러의 바이트와 같을 수 없기
때문입니다. 그래서 가져오기 모드는 **구조 검증만** 합니다: 파일이 모두 있는지, 크기가
합리적인지, manifest 가 파싱되는지. 마운트 자체는 여전히 기기의 TSS 가 실제로 검증하며,
서명이 맞지 않으면 마운트되지 않습니다.

## 주의

- **변형이 맞아야 합니다**: iOS 27 이상이고 `CryptexInstall` 이 있으면 `cryptex`,
  그 외에는 `personalized` 입니다. 변형이 틀리면 없는 것과 같고, 앱은 계속 다운로드를 시도합니다.
- **파일이 온전해야 합니다**: `Image.dmg` 가 없거나 잘렸으면 가져오기가 실패하고
  다운로드로 돌아갑니다.
- **자동 정리 없음**: 가져온 뒤에는 프로세스가 재시작될 때까지 `imported` 가 true 입니다.
  다운로드 모드로 돌아가려면 `Documents/DDI/` 를 지우고 앱을 재시작하세요.
