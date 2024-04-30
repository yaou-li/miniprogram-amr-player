# 微信小程序AMR播放器

## 说明

- 仅支持微信小程序
- 安卓可以使用小程序中的[wx.InnerAudioContext](https://developers.weixin.qq.com/minigame/dev/api/media/audio/InnerAudioContext.html)，支持amr格式，无需使用本方案
- 可使用useWorker()配置多线程[wx.Worker](https://developers.weixin.qq.com/miniprogram/dev/framework/workers.html), 由于wx.Worker最大并发数量限制为1个，使用前需要保证其他worker已经结束，并保证app.json中配置好workers路径
- 如使用url地址作为amr资源，需要将对应url域名增加到小程序白名单下，可参考[微信小程序官方配置流程](https://developers.weixin.qq.com/miniprogram/dev/framework/ability/network.html#1)为wx.request增加域名白名单
- npm包在小程序中引用需在小程序中构建, 详见[小程序npm构建](https://developers.weixin.qq.com/miniprogram/dev/devtools/npm.html#_1-%E5%AE%89%E8%A3%85-npm-%E5%8C%85)


## 安装

```
npm install miniprogram-amr-player
```

## 使用
加载并播放amr资源：

```javascript
const AMRPlayer = require('miniprogram-amr-player/amrPlayer');
let armSrc;
AMRPlayer.loadWithUrl('https://test.com/test.amr').then((src) => {
    armSrc = src;
    armSrc.onPlay(() => {
        console.log('voice play');
    });
    armSrc.onEnded(() => {
        console.log('voice ended');
    });
    armSrc._onStop(() => {
        console.log('voice stopped');
    });
    ARMPlayer.play(amrSrc);
}, (err) => {
    console.err(err);
});

AMRPlayer.stop();
```

如果使用useWorker()开启多线程，则需要在小程序app.json中增加以下配置，并在app.json同级文件夹下创建workers目录，最后将[构建](https://developers.weixin.qq.com/miniprogram/dev/devtools/npm.html#_1-%E5%AE%89%E8%A3%85-npm-%E5%8C%85)好的miniprogram-amr-player/arm.min.js文件拷贝到workers目录中
```json
{
    "workers": "workers"
}
```
# 许可

MIT.
