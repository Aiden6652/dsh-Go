# DSH Go · 鸿蒙（HarmonyOS）壳体工程

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

---

## 1. 怎么跑起来

1. 装 **DevEco Studio 5.0+**（自带 HarmonyOS SDK 和 hvigor）。
2. `File → Open`，选中 `dsh-go-ohos` 这个目录。
3. 首次打开会提示 `Sync`，点 **Sync Now**，等它拉依赖。
4. 在电脑上启动 Harness 网页服务（任选其一）：
   ```bash
   # 在本机开一个对局域网可见的 web 服务
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
