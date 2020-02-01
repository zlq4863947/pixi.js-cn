import { Container } from '@pixi/display';
import { autoDetectRenderer } from '@pixi/core';

/**
 * 创建新的PIXI应用程序的便利类。
 *
 * 这个类自动创建渲染器、ticker和根容器。
 *
 * @example
 * // 创建应用程序
 * const app = new PIXI.Application();
 *
 * // 将视图添加到DOM
 * document.body.appendChild(app.view);
 *
 * // 例如，添加显示对象
 * app.stage.addChild(PIXI.Sprite.from('something.png'));
 *
 * @class
 * @memberof PIXI
 */
export class Application
{
    /**
     * @param {object} [options] - 可选的渲染器参数。
     * @param {boolean} [options.autoStart=true] - Automatically 在构造之后开始渲染。
     *     **提示**: 如果已将options.sharedTicker设置为true，则将此参数设置为false不会停止共享代码。需要手动停止。
     * @param {number} [options.width=800] - 渲染器视图的宽度。
     * @param {number} [options.height=600] - 渲染器视图的高度。
     * @param {HTMLCanvasElement} [options.view] - 用作视图的画布，可选。
     * @param {boolean} [options.transparent=false] - true为设置渲染视图为透明。
     * @param {boolean} [options.autoDensity=false] - 调整渲染器视图的CSS像素大小，以允许使用非1的分辨率。
     * @param {boolean} [options.antialias=false] - 设置抗锯齿
     * @param {boolean} [options.preserveDrawingBuffer=false] - 启用图形缓冲区保留，如果需要在WebGL上下文上调用toDataUrl，请启用此功能。
     * @param {number} [options.resolution=1] - 渲染器的分辨率/设备像素比率, 视网膜为2。
     * @param {boolean} [options.forceCanvas=false] - 阻止选择WebGL渲染器，即使存在，也只有在使用 **pixi.js-legacy**
     *   或 **@pixi/canvas-renderer** 模块时才可用，否则将忽略该选项。
     * @param {number} [options.backgroundColor=0x000000] - 渲染区域的背景色（如果不透明则显示）。
     * @param {boolean} [options.clearBeforeRender=true] - 设置渲染器是否在新的渲染过程之前清除画布。
     * @param {boolean} [options.forceFXAA=false] - 强制在本机上使用FXAA抗锯齿。 FXAA更快，但可能并不总是那么好。 **（仅适用于WebGL）**。
     * @param {string} [options.powerPreference] - 传递给webgl上下文的参数，对于具有双显卡的设备，设置为“高性能”。 **（仅适用于WebGL）**。
     * @param {boolean} [options.sharedTicker=false] - `true` 为使用 PIXI.Ticker.shared, `false` 为创建新的ticker。
     *  如果设置为false，则不能将处理程序注册为在共享ticker上运行的任何操作之前发生。
     *  系统ticker将始终在共享ticker和应用程序ticker之前运行。
     * @param {boolean} [options.sharedLoader=false] - `true` 为使用 PIXI.Loader.shared, `false` 创建新的 Loader.
     * @param {Window|HTMLElement} [options.resizeTo] - 要自动调整舞台大小的元素。
     */
    constructor(options)
    {
        // The default options
        options = Object.assign({
            forceCanvas: false,
        }, options);

        /**
         * WebGL渲染器（如果可用），否则为CanvasRenderer。
         * @member {PIXI.Renderer|PIXI.CanvasRenderer}
         */
        this.renderer = autoDetectRenderer(options);

        /**
         * 渲染的根显示容器。
         * @member {PIXI.Container}
         */
        this.stage = new Container();

        // install plugins here
        Application._plugins.forEach((plugin) =>
        {
            plugin.init.call(this, options);
        });
    }

    /**
     * 注册该应用程序的中间件插件
     * @static
     * @param {PIXI.Application.Plugin} plugin - 正在安装插件
     */
    static registerPlugin(plugin)
    {
        Application._plugins.push(plugin);
    }

    /**
     * 渲染当前舞台。
     */
    render()
    {
        this.renderer.render(this.stage);
    }

    /**
     * 对渲染器画布元素的引用。
     * @member {HTMLCanvasElement}
     * @readonly
     */
    get view()
    {
        return this.renderer.view;
    }

    /**
     * 引用渲染器的屏幕矩形。 可以安全地在整个屏幕上用作`filterArea`或`hitArea`。
     * @member {PIXI.Rectangle}
     * @readonly
     */
    get screen()
    {
        return this.renderer.screen;
    }

    /**
     * 销毁后不要再使用。
     * @param {Boolean} [removeView=false] 自动从DOM中删除画布。
     * @param {object|boolean} [stageOptions] - 选项参数。布尔值为true时，所有选项都设置为该值
     * @param {boolean} [stageOptions.children=false] - 如果设置为true，所有的子元素也将调用他们的销毁方法'stageOptions'将传递给这些调用。
     * @param {boolean} [stageOptions.texture=false] - 如果stageOptions.children设置为true，则仅用于子精灵。将销毁子精灵纹理
     * @param {boolean} [stageOptions.baseTexture=false] - 如果stageOptions.children设置为true，则仅用于子精灵。将销毁子精灵基础纹理
     */
    destroy(removeView, stageOptions)
    {
        // Destroy plugins in the opposite order
        // which they were constructed
        const plugins = Application._plugins.slice(0);

        plugins.reverse();
        plugins.forEach((plugin) =>
        {
            plugin.destroy.call(this);
        });

        this.stage.destroy(stageOptions);
        this.stage = null;

        this.renderer.destroy(removeView);
        this.renderer = null;

        this._options = null;
    }
}

/**
 * @memberof PIXI.Application
 * @typedef {object} Plugin
 * @property {function} init - 在构造Application时调用，范围为Application实例。
 *   传递`options` 作为唯一的参数，它们是Application构造函数选项。
 * @property {function} destroy - 销毁应用程序时调用，范围为应用程序实例
 */

/**
 * 已安装插件的集合。
 * @static
 * @private
 * @type {PIXI.Application.Plugin[]}
 */
Application._plugins = [];
