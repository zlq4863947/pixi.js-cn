PixiJS中文开发文档 PixiJSDoc
=============

![pixi.js logo](https://pixijs.download/pixijs-banner-v5.png)

[![Inline docs](http://inch-ci.org/github/pixijs/pixi.js.svg?branch=dev)](http://inch-ci.org/github/pixijs/pixi.js)
[![Build Status](https://travis-ci.org/pixijs/pixi.js.svg?branch=dev)](https://travis-ci.org/pixijs/pixi.js)

## 中文文档简介
本文档翻译自: [https://github.com/pixijs/pixi.js](https://github.com/pixijs/pixi.js)
旨在帮助大家更好的学习PixiJS。


### 中文文档在线地址

[http://b.aitrade.ga/pixi.js-cn](http://b.aitrade.ga/pixi.js-cn)

### 中文示例地址

[https://b.aitrade.ga/pixi.js-cn.examples](https://b.aitrade.ga/pixi.js-cn.examples)

### 开发交流QQ群

<img src="images/qq_group.png" onerror="this.src = 'qq_group.png'" alt="PixiJS开发交流: 1014241826">

## PixiJS简介

PixiJS项目的目标为提供一个可以在所有设备上运行的快速轻量级2D库。

PixiJS渲染引擎让每个人都能享受无需事先熟悉WebGL即可进行硬件加速。而且，它很快。真快。

如果您想了解PixiJS的最新消息，可以访问[PixiJS的官网](https://www.pixijs.com/), [PixiJS的Github](https://github.com/pixijs/)等。


### 为什么使用PixiJS以及何时使用

PixiJS是一个渲染库，可让您创建丰富的交互式图形，跨平台应用程序和游戏，而无需深入研究WebGL API或处理浏览器和设备兼容性。

PixiJS具有完整的[WebGL](https://en.wikipedia.org/wiki/WebGL)支持，并在需要时无缝地退回到HTML5的[canvas](https://en.wikipedia.org/wiki/Canvas_element)。作为一个框架，PixiJS是创作交互内容的绝佳工具, *尤其是近年来随着Adobe Flash的退出*。将其用于图形丰富的交互式网站，应用程序和HTML5游戏。开箱即用的跨平台兼容性和优雅降级意味着您要做的工作更少，并且做起来会更有趣！如果您想相对快速地创建优美而精致的体验，而又不必钻研密集的低级代码，同时又避免了浏览器不一致的麻烦，那么请在下一个项目中使用PixiJS吧！

### 相关学习资料 ###
- 网站: 在[官方网站](http://www.pixijs.com/)上了解更多关于PixiJS的信息。
- 入门: 查看官方推荐的@kittykatattack的[详细教程](https://github.com/kittykatattack/learningPixi)。
- 例子: 深入并玩转PixiJS代码及功能特性的[官方英文示例](http://pixijs.github.io/examples/) 或[我们的中文示例](https://b.aitrade.ga/pixi.js-cn.examples)
- 文档: 通过查看[官方英语文档](https://pixijs.github.io/docs/) 或 [我们的中文文档](http://b.aitrade.ga/pixi.js-cn) 了解PixiJS API。
- Wiki: [Wiki](https://github.com/pixijs/pixi.js/wiki)上还有其他教程和资源。
- 论坛: 查看[论坛](http://www.html5gamedevs.com/forum/15-pixijs/) 和 [Stackoverflow](http://stackoverflow.com/search?q=pixi.js), 这两个地方都可以请教国内外的PixiJS开发者讨论您问题。
- 灵感: 参观[官网的画廊](http://www.pixijs.com/gallery) 看看其他人创造的令人惊讶的东西！
- 交流: 您可以加入PixiJS开发交流QQ群: 1014241826
- 把PixiJS使用在微信小游戏上: 您可以参看[使用PixiJS V4版本成功适配在微信小游戏上的demo](https://github.com/LeedaCode/pixijs-adaptation-wechat)

### 安装 ###

#### NPM安装

```sh
npm install pixi.js
```
没有默认导出。导入PixiJS的正确方法是:

```js
import * as PIXI from 'pixi.js'
```

#### CDN(通过cdnjs)

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/pixi.js/5.1.3/pixi.min.js"></script>
```

_注: `5.1.3` 可以替换为任意[发行版本](https://github.com/pixijs/pixi.js/releases)。_


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
    // 使用'bunny.png' 纹理创建Sprite精灵
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
   //您应该看到一个兔子在您的画布中央并且不停旋转，您可以在浏览器看到Console控制台成功输出了您的PixiJs版本。
```

### 贡献中文文档指南 ###

如果您想要贡献PixiJS Doc的中文翻译
您应该对PixiJS有一定的了解能够使用相关技术，将JSDocs与[pixi-jsdoc-template ](https://github.com/pixijs/pixi-jsdoc-template)风格模板结合使用。


