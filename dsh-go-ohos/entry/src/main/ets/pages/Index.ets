import { webview } from '@kit.ArkWeb';
import { preferences } from '@kit.ArkData';
import { common } from '@kit.AbilityKit';

const STORE_NAME: string = 'dsh_go_store';
const KEY_URL: string = 'server_url';
const DEFAULT_URL: string = 'http://192.168.1.10:8080';

/**
 * 暴露给网页的桥。网页侧调用方式：
 *   dshBridge.ping()
 *   dshBridge.version()
 *   dshBridge.log('hello')
 *   dshBridge.toast('已连接')
 *
 * 注意：方法必须是同步返回 string/void，且要同步登记到 methodList。
 */
class DshBridge {
  version(): string {
    return '0.1.0-ohos';
  }

  ping(): string {
    return 'pong';
  }

  log(msg: string): void {
    console.info('[dsh-web] ' + msg);
  }

  toast(text: string): void {
    console.info('[dsh-web-toast] ' + text);
  }
}

@Entry
@Component
struct Index {
  @State serverUrl: string = DEFAULT_URL;
  @State inputText: string = DEFAULT_URL;
  @State statusText: string = '未连接';
  @State progress: number = 0;
  @State exitEnabled: boolean = false;

  private controller: webview.WebviewController = new webview.WebviewController();
  private bridge: DshBridge = new DshBridge();

  aboutToAppear(): void {
    this.restoreUrl();
  }

  private async restoreUrl(): Promise<void> {
    try {
      const ctx = this.getUIContext().getHostContext() as common.UIAbilityContext;
      const store: preferences.Preferences = await preferences.getPreferences(ctx, STORE_NAME);
      const saved: preferences.ValueType = await store.get(KEY_URL, DEFAULT_URL);
      const text: string = typeof saved === 'string' ? saved : DEFAULT_URL;
      if (text.length > 0) {
        this.serverUrl = text;
        this.inputText = text;
        this.statusText = '待连接';
      }
    } catch (err) {
      console.error('[dsh] 读取配置失败: ' + JSON.stringify(err));
    }
  }

  private async saveUrl(url: string): Promise<void> {
    try {
      const ctx = this.getUIContext().getHostContext() as common.UIAbilityContext;
      const store: preferences.Preferences = await preferences.getPreferences(ctx, STORE_NAME);
      await store.put(KEY_URL, url);
      await store.flush();
    } catch (err) {
      console.error('[dsh] 保存配置失败: ' + JSON.stringify(err));
    }
  }

  private connect(): void {
    const url: string = this.inputText.trim();
    if (url.length === 0) {
      this.statusText = '地址为空';
      return;
    }
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      this.statusText = '要以 http:// 开头';
      return;
    }
    this.serverUrl = url;
    this.statusText = '连接中…';
    this.progress = 0;
    this.saveUrl(url);
    try {
      this.controller.loadUrl(url);
    } catch (err) {
      this.statusText = '加载失败';
      console.error('[dsh] loadUrl 失败: ' + JSON.stringify(err));
    }
  }

  private reload(): void {
    try {
      this.controller.refresh();
    } catch (err) {
      console.error('[dsh] refresh 失败: ' + JSON.stringify(err));
    }
  }

  build() {
    Column() {
      // —— 顶栏 ——
      Row() {
        Text('DSH Go')
          .fontSize(20)
          .fontWeight(FontWeight.Bold)
          .fontColor('#E6F1FF')
        Blank()
        Text(this.statusText)
          .fontSize(12)
          .fontColor('#7FD1E8')
          .margin({ right: 8 })
        Button('刷新')
          .height(30)
          .fontSize(12)
          .backgroundColor('#152238')
          .fontColor('#9FC2E0')
          .onClick(() => {
            this.reload();
          })
      }
      .width('100%')
      .height(52)
      .padding({ left: 16, right: 16 })
      .backgroundColor('#0B1220')

      // —— 地址栏 ——
      Row({ space: 8 }) {
        TextInput({ text: this.inputText, placeholder: 'http://192.168.1.10:8080' })
          .type(InputType.URL)
          .layoutWeight(1)
          .height(40)
          .fontSize(14)
          .backgroundColor('#111A2B')
          .fontColor('#E6F1FF')
          .placeholderColor('#4A5A74')
          .onChange((value: string) => {
            this.inputText = value;
          })
          .onSubmit(() => {
            this.connect();
          })
        Button('连接')
          .height(40)
          .fontSize(14)
          .backgroundColor('#1F6FEB')
          .fontColor('#FFFFFF')
          .onClick(() => {
            this.connect();
          })
      }
      .width('100%')
      .padding({ left: 16, right: 16, top: 8, bottom: 8 })
      .backgroundColor('#0B1220')

      // —— 进度条 ——
      if (this.progress > 0 && this.progress < 100) {
        Progress({ value: this.progress, total: 100, type: ProgressType.Linear })
          .width('100%')
          .height(2)
          .color('#3FB9D4')
      }

      // —— 网页本体 ——
      Web({ src: this.serverUrl, controller: this.controller })
        .javaScriptAccess(true)
        .domStorageAccess(true)
        .fileAccess(false)
        .zoomAccess(true)
        .mixedMode(MixedMode.All)
        .javaScriptProxy({
          object: this.bridge,
          name: 'dshBridge',
          methodList: ['version', 'ping', 'log', 'toast'],
          controller: this.controller
        })
        .onProgressChange((event: OnProgressChangeEvent) => {
          if (event !== undefined) {
            this.progress = event.newProgress;
          }
        })
        .onPageEnd(() => {
          this.progress = 100;
          this.statusText = '已连接';
        })
        .onErrorReceive((event: OnErrorReceiveEvent) => {
          if (event !== undefined) {
            this.statusText = '加载出错';
            console.error('[dsh] web error: ' + event.error.getErrorInfo());
          }
        })
        .width('100%')
        .layoutWeight(1)
    }
    .width('100%')
    .height('100%')
    .backgroundColor('#050A14')
  }
}
