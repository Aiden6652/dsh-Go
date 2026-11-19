# DSH Go · 鸿蒙（HarmonyOS）壳体工程

[中文](#中文) · [한국어](#한국어)

---

# 中文

一个可以直接用 **DevEco Studio 打开**的 Stage Model 工程：用 ArkTS 的 `Web` 组件承载
DeepSeek Harness 的网页端，做成鸿蒙原生 App 的壳。

> 说清楚是什么、不是什么，别自己骗自己：
>
> - ✅ **这是**一个能编译、能安装、能跑的鸿蒙原生工程骨架：启动页、地址栏、`Web` 组件、
>   ArkTS ↔ JS 桥、偏好持久化都写好了。
> - ❌ **这不是** iOS 版那个 DSH Go 的完整移植。手机操控、插件、宠物、酒馆、本地引擎
>   这些能力它都没有 —— 那些是 iOS App 用 Flutter 原生写的，鸿蒙没有对应实现。
> - ⚠️ 鸿蒙端**没有本地 dsh 引擎**。所以网页端必须指向一台已经在跑 `dsh web` 的电脑
>   （Mac / Windows / Linux 都行），通过局域网访问。地址栏就是干这个的。

## 1. 怎么跑起来

1. 装 **DevEco Studio 5.0+**（自带 HarmonyOS SDK 和 hvigor）。
2. `File → Open`，选中 `dsh-go-ohos` 这个目录。
3. 首次打开会提示 `Sync`，点 **Sync Now**，等它拉依赖。
4. 在电脑上启动 Harness 网页服务：
   ```bash
   dsh web --host 0.0.0.0 --port 8080
   ```
   记住电脑的局域网 IP，比如 `192.168.1.10`。
5. 手机和电脑连同一个 Wi-Fi，App 里地址栏填 `http://192.168.1.10:8080`，点**连接**。
6. 真机调试：`Run → Run 'entry'`。

## 2. 签名与出包（这步只能你本地做）

鸿蒙的 HAP **必须签名**才能装。这一步没有任何云端捷径，因为证书绑你的开发者账号：

1. DevEco Studio → `File → Project Structure → Signing Configs`
2. 勾 **Automatically generate signature**，登录你的**华为开发者账号**
   （没有就先去 [developer.huawei.com](https://developer.huawei.com/consumer/cn/) 注册，个人开发者够用）
3. 让它自动创建调试证书 + Profile，回写 `build-profile.json5`
4. 打完包：`Build → Build Hap(s)/APP(s) → Build Hap(s)`

产物在：

```
entry/build/default/outputs/default/entry-default-signed.hap
```

拖进手机用「华为分享」或 `hdc install` 安装：

```bash
hdc install entry-default-signed.hap
```

> ⚠️ 上架应用市场要走 **AppGallery Connect** 申请正式发布证书 + 正式 Profile，
> 调试证书只能自己装。这一步我帮不了，得你账号本人操作。

## 3. 工程结构

```
dsh-go-ohos/
├── AppScope/
│   ├── app.json5                     # bundleName / 版本 / 图标
│   └── resources/base/
│       ├── element/string.json       # 应用名
│       └── media/app_icon.png         # 图标（512×512，已生成）
├── build-profile.json5               # 产品 / 签名 / SDK 版本
├── hvigorfile.ts                     # 根构建脚本
├── oh-package.json5
└── entry/
    ├── build-profile.json5
    ├── hvigorfile.ts
    ├── oh-package.json5
    └── src/main/
        ├── module.json5              # 模块 / Ability / 权限
        ├── ets/
        │   ├── entryability/EntryAbility.ets   # 入口，加载 pages/Index
        │   └── pages/Index.ets                 # 顶栏 + 地址栏 + Web + JS 桥
        └── resources/base/
            ├── element/{string,color}.json
            ├── media/startIcon.png
            └── profile/main_pages.json
```

## 4. 网页 ↔ 鸿蒙 桥怎么用

`Index.ets` 里注册了一个全局对象 `dshBridge`，网页里直接调：

```js
dshBridge.version()        // → "0.1.0-ohos"
dshBridge.ping()           // → "pong"
dshBridge.log('hello')     // → 打到 hilog
dshBridge.toast('已连接')   // → 现在是打日志，想弹真 toast 就换成 promptAction.showToast
```

**要加新方法**：在 `DshBridge` 类里写一个**同步**方法，然后把名字加进
`javaScriptProxy` 的 `methodList` 数组里。少写一个都调不通，这点容易忘。

## 5. 想让它更像「真 App」的下一步

按优先级：

1. **记住上次地址**：已经做了（`preferences`）。
2. **全屏沉浸**：`EntryAbility` 里 `windowStage.getMainWindowSync().setWindowLayoutFullScreen(true)`。
3. **下拉刷新**：外面套 `Refresh` 组件，`onRefreshing` 里调 `controller.refresh()`。
4. **返回键接管**：`onBackPress` 里判断 `controller.accessBackward()`，能后退就后退，不能才退出。
5. **深色适配**：把硬编码的颜色抽到 `resources/dark/element/color.json`。

## 6. 换图标

`AppScope/resources/base/media/app_icon.png` 和
`entry/src/main/resources/base/media/startIcon.png` 现在是我画的占位图
（蓝色渐变 + `>_`）。想换就把同名文件覆盖掉，尺寸 512×512 PNG 即可。

---

# 한국어

**DevEco Studio로 바로 열 수 있는** Stage Model 프로젝트입니다. ArkTS의 `Web` 컴포넌트로
DeepSeek Harness 웹 화면을 띄워서 HarmonyOS 네이티브 앱의 셸로 만든 것입니다.

> 무엇이고 무엇이 아닌지 분명히 합시다:
>
> - ✅ **이것은** 컴파일·설치·실행이 가능한 HarmonyOS 네이티브 프로젝트 골격입니다.
>   시작 화면, 주소 표시줄, `Web` 컴포넌트, ArkTS ↔ JS 브리지, 설정 저장까지 작성되어 있습니다.
> - ❌ **이것은** iOS 버전 DSH Go의 완전한 이식이 **아닙니다**. 휴대폰 제어, 플러그인,
>   펫, 선술집(tavern), 로컬 엔진 같은 기능은 없습니다. 그건 iOS 앱이 Flutter로
>   네이티브 구현한 것이고, HarmonyOS에는 대응 구현이 없습니다.
> - ⚠️ HarmonyOS에는 **로컬 dsh 엔진이 없습니다**. 그래서 웹 화면은 반드시 `dsh web`이
>   실행 중인 PC(Mac / Windows / Linux)를 같은 LAN으로 바라봐야 합니다.
>   주소 표시줄이 바로 그 역할입니다.

## 1. 실행 방법

1. **DevEco Studio 5.0+** 설치 (HarmonyOS SDK와 hvigor 포함).
2. `File → Open`으로 `dsh-go-ohos` 디렉터리를 선택.
3. 처음 열면 `Sync` 안내가 뜹니다. **Sync Now**를 누르고 의존성 다운로드를 기다립니다.
4. PC에서 Harness 웹 서비스를 실행합니다:
   ```bash
   dsh web --host 0.0.0.0 --port 8080
   ```
   PC의 LAN IP를 기억해 두세요. 예: `192.168.1.10`
5. 휴대폰과 PC를 같은 Wi-Fi에 연결하고, 앱 주소 표시줄에
   `http://192.168.1.10:8080`을 입력한 뒤 **연결**을 누릅니다.
6. 실기기 디버깅: `Run → Run 'entry'`.

## 2. 서명과 패키징 (로컬에서만 가능)

HarmonyOS의 HAP은 **반드시 서명**해야 설치됩니다. 인증서가 개발자 계정에 묶여 있어서
클라우드에서 대신 해 줄 방법은 없습니다:

1. DevEco Studio → `File → Project Structure → Signing Configs`
2. **Automatically generate signature** 체크, **Huawei 개발자 계정**으로 로그인
   (없으면 [developer.huawei.com](https://developer.huawei.com/consumer/cn/)에서 가입, 개인 개발자로 충분)
3. 디버그 인증서 + Profile 자동 생성 → `build-profile.json5`에 반영
4. 패키징: `Build → Build Hap(s)/APP(s) → Build Hap(s)`

산출물:

```
entry/build/default/outputs/default/entry-default-signed.hap
```

휴대폰으로 옮겨 「Huawei Share」또는 `hdc install`로 설치:

```bash
hdc install entry-default-signed.hap
```

> ⚠️ 앱 마켓 출시는 **AppGallery Connect**에서 정식 배포 인증서 + 정식 Profile을
> 발급받아야 합니다. 디버그 인증서는 자기 기기에만 설치 가능합니다.
> 이 단계는 계정 본인이 직접 해야 합니다.

## 3. 프로젝트 구조

```
dsh-go-ohos/
├── AppScope/
│   ├── app.json5                     # bundleName / 버전 / 아이콘
│   └── resources/base/
│       ├── element/string.json       # 앱 이름
│       └── media/app_icon.png        # 아이콘 (512×512, 생성됨)
├── build-profile.json5               # 제품 / 서명 / SDK 버전
├── hvigorfile.ts                     # 루트 빌드 스크립트
├── oh-package.json5
└── entry/
    ├── build-profile.json5
    ├── hvigorfile.ts
    ├── oh-package.json5
    └── src/main/
        ├── module.json5              # 모듈 / Ability / 권한
        ├── ets/
        │   ├── entryability/EntryAbility.ets   # 진입점, pages/Index 로드
        │   └── pages/Index.ets                 # 상단바 + 주소창 + Web + JS 브리지
        └── resources/base/
            ├── element/{string,color}.json
            ├── media/startIcon.png
            └── profile/main_pages.json
```

## 4. 웹 ↔ HarmonyOS 브리지 사용법

`Index.ets`에 전역 객체 `dshBridge`가 등록되어 있습니다. 웹에서 바로 호출:

```js
dshBridge.version()        // → "0.1.0-ohos"
dshBridge.ping()           // → "pong"
dshBridge.log('hello')     // → hilog로 출력
dshBridge.toast('연결됨')   // → 지금은 로그만, 실제 토스트는 promptAction.showToast 로 교체
```

**새 메서드 추가 시**: `DshBridge` 클래스에 **동기** 메서드를 만들고, 이름을
`javaScriptProxy`의 `methodList` 배열에 넣어야 합니다. 하나라도 빠지면 호출이 안 됩니다.

## 5. 더 「진짜 앱」답게 만드는 다음 단계

우선순위 순:

1. **마지막 주소 기억**: 이미 구현됨 (`preferences`).
2. **전체 화면 몰입**: `EntryAbility`에서 `windowStage.getMainWindowSync().setWindowLayoutFullScreen(true)`.
3. **당겨서 새로고침**: `Refresh` 컴포넌트로 감싸고 `onRefreshing`에서 `controller.refresh()` 호출.
4. **뒤로 가기 키 처리**: `onBackPress`에서 `controller.accessBackward()` 확인 후 뒤로 가기, 아니면 종료.
5. **다크 모드 대응**: 하드코딩된 색상을 `resources/dark/element/color.json`으로 분리.

## 6. 아이콘 교체

`AppScope/resources/base/media/app_icon.png` 와
`entry/src/main/resources/base/media/startIcon.png` 은 현재 임시 이미지입니다
(파란 그라데이션 + `>_`). 교체하려면 같은 이름의 512×512 PNG로 덮어쓰면 됩니다.
