PixiJS中文开发文档
=============

![pixi.js logo](https://pixijs.download/pixijs-banner-v5.png)

[![Inline docs](http://inch-ci.org/github/pixijs/pixi.js.svg?branch=dev)](http://inch-ci.org/github/pixijs/pixi.js)
[![Build Status](https://travis-ci.org/pixijs/pixi.js.svg?branch=dev)](https://travis-ci.org/pixijs/pixi.js)

## 中文文档简介
本文档翻译自: [https://github.com/pixijs/pixi.js](https://github.com/pixijs/pixi.js), 英文好的同学可以直接看官方项目。

### 在线地址

[http://b.aitrade.ga/pixi.js-cn](http://b.aitrade.ga/pixi.js-cn)

### 中文示例地址

[https://b.aitrade.ga/pixi.js-cn.examples](https://b.aitrade.ga/pixi.js-cn.examples)

### 开发交流QQ群

<img src="images/qq_group.png" onerror="this.src = 'qq_group.png'" alt="PixiJS开发交流: 1014241826">

## PixiJS简介

本项目的目标为提供一个可以在所有设备上运行的快速轻量级2D库。PixiJS渲染引擎让每个人都能享受无需事先熟悉WebGL即可进行硬件加速。而且，它很快。真快。

如果您想随时了解PixiJS的最新消息，请随时在Twitter
([@doormat23](https://twitter.com/doormat23), [@rolnaaba](https://twitter.com/rolnaaba), [@bigtimebuddy](https://twitter.com/bigtimebuddy), [@ivanpopelyshev](https://twitter.com/ivanpopelyshev))
上关注我们，我们将随时为您发布消息！您也可以访问[我们的网站](http://www.pixijs.com)
如果有任何突破都将发布在我们的网站上！

**我们目前众筹在[Open Collective](https://opencollective.com/pixijs) ，您的支持将帮助我们使PixiJS变得更好 要捐款，只需单击下面的按钮，我们将永远爱你！**

<div align="center">
  <a href="https://opencollective.com/pixijs/donate" target="_blank">
    <img src="https://opencollective.com/pixijs/donate/button@2x.png?color=blue" width=250 />
  </a>
</div>

### 为什么使用PixiJS以及何时使用

PixiJS是一个渲染库，可让您创建丰富的交互式图形，跨平台应用程序和游戏，而无需深入研究WebGL API或处理浏览器和设备兼容性。

PixiJS具有完整的[WebGL](https://en.wikipedia.org/wiki/WebGL)支持，并在需要时无缝地退回到HTML5的[canvas](https://en.wikipedia.org/wiki/Canvas_element)。作为一个框架，PixiJS是创作交互内容的绝佳工具, *尤其是近年来随着Adobe Flash的退出*。将其用于图形丰富的交互式网站，应用程序和HTML5游戏。开箱即用的跨平台兼容性和优雅降级意味着您要做的工作更少，并且做起来会更有趣！如果您想相对快速地创建优美而精致的体验，而又不必钻研密集的低级代码，同时又避免了浏览器不一致的麻烦，那么请在下一个项目中撒些PixiJS魔术吧！

**帮助您的开发，尽情发挥您的想象力！**
入门：查看@kittykattack的详细教程。
### 学习 ###
- 网站: 在[官方网站](http://www.pixijs.com/)上了解更多关于PixiJS的信息。
- 入门: 查看@kittykatattack的[详细教程](https://github.com/kittykatattack/learningPixi)。
- 例子: 深入并玩转PixiJS代码及功能特性的[示例](http://pixijs.github.io/examples/)!
- 文档: 通过查看[文档](https://pixijs.github.io/docs/)了解PixiJS API。
- Wiki: [Wiki](https://github.com/pixijs/pixi.js/wiki)上还有其他教程和资源。

### 社区 ###
- 论坛: 查看[论坛](http://www.html5gamedevs.com/forum/15-pixijs/) 和 [Stackoverflow](http://stackoverflow.com/search?q=pixi.js), 这两个地方都可以问您的PixiJS问题。
- 灵感: 参观[画廊](http://www.pixijs.com/gallery) 看看其他人创造的令人惊讶的东西！
- 交流: 您可以加入我们的[Gitter](https://gitter.im/pixijs/pixi.js) 交流PixiJS。我们现在也有Slack频道。如果您想加入，请发邮件给我(mat@goodboydigital.com) ，我会邀请您加入。

### 安装 ###

PixiJS非常容易入门! 只需下载一个[预先构建](https://github.com/pixijs/pixi.js/wiki/FAQs#where-can-i-get-a-build)的版本!

或者，可以使用[npm](https://docs.npmjs.com/getting-started/what-is-npm)安装PixiJS，或仅使用内容分发网络(CDN)URL将PixiJS直接嵌入HTML页面中。

_注意: 在v4.5.0之后，不再提供对[Bower](https://bower.io)软件包管理器的支持。 请参阅[发行说明(https://github.com/pixijs/pixi.js/releases/tag/v4.5.0)以获取更多信息。_

#### NPM安装

```sh
npm install pixi.js
```
没有默认导出。导入PixiJS的正确方法是:

```js
import * as PIXI from 'pixi.js'
```

#### CDN安装 (通过cdnjs)

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/pixi.js/5.1.3/pixi.min.js"></script>
```

_注: `5.1.3` 可以替换为任意[发行版本](https://github.com/pixijs/pixi.js/releases)。_

### 示例 ###

- [Filters Demo](http://pixijs.io/pixi-filters/tools/demo/)
- [Run Pixie Run](http://work.goodboydigital.com/runpixierun/)
- [Flash vs HTML](http://flashvhtml.com)
- [Bunny Demo](http://www.goodboydigital.com/pixijs/bunnymark)
- [Storm Brewing](http://www.goodboydigital.com/pixijs/storm)
- [Render Texture Demo](http://www.goodboydigital.com/pixijs/examples/11)
- [Primitives Demo](http://www.goodboydigital.com/pixijs/examples/13)
- [Masking Demo](http://www.goodboydigital.com/pixijs/examples/14)
- [Interaction Demo](http://www.goodboydigital.com/pixijs/examples/6)
- [photonstorm's Balls Demo](http://gametest.mobi/pixi/balls)
- [photonstorm's Morph Demo](http://gametest.mobi/pixi/morph)

感谢[@photonstorm](https://twitter.com/photonstorm) 最后两个示例，并允许我们共享源代码 :)

### 当前功能 ###

- WebGL渲染器（具有自动智能批处理功能，可实现非常快速的性能）
- Canvas渲染器 (城里最快!)
- 全部场景图
- 超级易用的API (类似于Flash显示列表API)
- 支持纹理图集
- 资源加载器 / 精灵表加载器
- 自动检测应使用哪个渲染器
- 全鼠标和多点触控交互
- 文本
- 位图字体文本
- 多行文本
- 渲染纹理
- 绘图基元
- 遮眼罩
- 过滤器
- [用户插件](https://github.com/pixijs/pixi.js/wiki/v5-Resources)

### 基本用法示例 ###

```js
import * as PIXI from 'pixi.js';

// 如果可能，应用程序将使用WebGL创建渲染器
// 否则退回到canvas渲染器，同时设置ticker
// 同时创建ticker和主舞台PIXI.Container
const app = new PIXI.Application();

// 该应用程序将为您创建一个canvas元素
// 然后可以放入DOM中
document.body.appendChild(app.view);

// 加载我们需要的纹理
app.loader.add('bunny', 'bunny.png').load((loader, resources) => {
    // 使用'bunny.png'图像创建纹理
    const bunny = new PIXI.Sprite(resources.bunny.texture);

    // 设置bunny的位置
    bunny.x = app.renderer.width / 2;
    bunny.y = app.renderer.height / 2;

    // 设置描点(旋转中心)为中心
    bunny.anchor.x = 0.5;
    bunny.anchor.y = 0.5;

    // 将bunny添加到我们正在构建的场景中
    app.stage.addChild(bunny);

    // 监听帧更新
    app.ticker.add(() => {
         // 每帧我们都会旋转bunny一点
        bunny.rotation += 0.01;
    });
});
```

### 如何构建 ###

请注意，对于大多数用户，不需要构建此项目。
如果您想要使用PixiJS，那么只需下载我们的[发布](https://github.com/pixijs/pixi.js/releases)的任何一个版本。
实际上，只有当您正在开发PixiJS时，才需要构建它。

如果您还没有Node.js和NPM，请安装它们。然后，在您克隆的文件夹中
在存储库中，使用npm安装构建依赖项：

```sh
npm install
```

然后构建源码:

```sh
npm run build
```

### 如何生成文档 ###

生成文档请执行:

```sh
npm run docs
```

该文档将JSDocs与模板[pixi-jsdoc-template](https://github.com/pixijs/pixi-jsdoc-template)结合使用。可以在jsdoc.conf.json中找到配置文件。

### 许可 ###

该资源使用[MIT许可](http://opensource.org/licenses/MIT)发布。

[![Analytics](https://ga-beacon.appspot.com/UA-39213431-2/pixi.js/index)](https://github.com/igrigorik/ga-beacon)
