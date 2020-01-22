PixiJS — HTML5渲染引擎
=============

![pixi.js logo](https://pixijs.download/pixijs-banner-v5.png)

[![Inline docs](http://inch-ci.org/github/pixijs/pixi.js.svg?branch=dev)](http://inch-ci.org/github/pixijs/pixi.js)
[![Build Status](https://travis-ci.org/pixijs/pixi.js.svg?branch=dev)](https://travis-ci.org/pixijs/pixi.js)

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

PixiJS入门很容易！只需下载一个[预先构建](https://github.com/pixijs/pixi.js/wiki/FAQs#where-can-i-get-a-build)的版本！

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

Thanks to [@photonstorm](https://twitter.com/photonstorm) for providing
those last 2 examples and allowing us to share the source code :)

### Contribute ###

Want to be part of the PixiJS project? Great! All are welcome! We will get there quicker
together :) Whether you find a bug, have a great feature request or you fancy owning a task
from the road map above feel free to get in touch.

Make sure to read the [Contributing Guide](.github/CONTRIBUTING.md)
before submitting changes.

### Current features ###

- WebGL renderer (with automatic smart batching allowing for REALLY fast performance)
- Canvas renderer (Fastest in town!)
- Full scene graph
- Super easy to use API (similar to the flash display list API)
- Support for texture atlases
- Asset loader / sprite sheet loader
- Auto-detect which renderer should be used
- Full Mouse and Multi-touch Interaction
- Text
- BitmapFont text
- Multiline Text
- Render Texture
- Primitive Drawing
- Masking
- Filters
- [User Plugins](https://github.com/pixijs/pixi.js/wiki/v5-Resources)

### Basic Usage Example ###

```js
import * as PIXI from 'pixi.js';

// The application will create a renderer using WebGL, if possible,
// with a fallback to a canvas render. It will also setup the ticker
// and the root stage PIXI.Container
const app = new PIXI.Application();

// The application will create a canvas element for you that you
// can then insert into the DOM
document.body.appendChild(app.view);

// load the texture we need
app.loader.add('bunny', 'bunny.png').load((loader, resources) => {
    // This creates a texture from a 'bunny.png' image
    const bunny = new PIXI.Sprite(resources.bunny.texture);

    // Setup the position of the bunny
    bunny.x = app.renderer.width / 2;
    bunny.y = app.renderer.height / 2;

    // Rotate around the center
    bunny.anchor.x = 0.5;
    bunny.anchor.y = 0.5;

    // Add the bunny to the scene we are building
    app.stage.addChild(bunny);

    // Listen for frame updates
    app.ticker.add(() => {
         // each frame we spin the bunny around a bit
        bunny.rotation += 0.01;
    });
});
```

### How to build ###

Note that for most users you don't need to build this project. If all you want is to use PixiJS, then
just download one of our [prebuilt releases](https://github.com/pixijs/pixi.js/releases). Really
the only time you should need to build PixiJS is if you are developing it.

If you don't already have Node.js and NPM, go install them. Then, in the folder where you have cloned
the repository, install the build dependencies using npm:

```sh
npm install
```

Then, to build the source, run:

```sh
npm run build
```

### How to generate the documentation ###

The docs can be generated using npm:

```sh
npm run docs
```

The documentation uses JSDocs in combination with this template [pixi-jsdoc-template](https://github.com/pixijs/pixi-jsdoc-template). The configuration file can be found at [jsdoc.conf.json](jsdoc.conf.json)

### License ###

This content is released under the (http://opensource.org/licenses/MIT) MIT License.

[![Analytics](https://ga-beacon.appspot.com/UA-39213431-2/pixi.js/index)](https://github.com/igrigorik/ga-beacon)
