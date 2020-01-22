import { hex2string, hex2rgb, deprecation, EventEmitter } from '@pixi/utils';
import { Matrix, Rectangle } from '@pixi/math';
import { RENDERER_TYPE } from '@pixi/constants';
import { settings } from '@pixi/settings';
import { Container } from '@pixi/display';
import { RenderTexture } from './renderTexture/RenderTexture';

const tempMatrix = new Matrix();

/**
 * AbstractRenderer是PixiJS渲染器的基类。它由{@link PIXI.CanvasRenderer}
 * 和{@link PIXI.Renderer}扩展而来，可用于渲染PixiJS场景。
 *
 * @abstract
 * @class
 * @extends PIXI.utils.EventEmitter
 * @memberof PIXI
 */
export class AbstractRenderer extends EventEmitter
{
    /**
     * @param {string} system - 该渲染器用于的系统的名称。
     * @param {object} [options] - 可选的渲染器参数。
     * @param {number} [options.width=800] - 屏幕的宽度。
     * @param {number} [options.height=600] - 屏幕的高度。
     * @param {HTMLCanvasElement} [options.view] - 用作视图的canvas，可选。
     * @param {boolean} [options.transparent=false] - 渲染器视图是否为透明。
     * @param {boolean} [options.autoDensity=false] - 调整渲染器视图的CSS像素大小，以允许使用非1的分辨率。
     * @param {boolean} [options.antialias=false] - 设置抗锯齿
     * @param {number} [options.resolution=1] - 渲染器的分辨率/设备像素比率。 渲染器视网膜的分辨率为2。
     * @param {boolean} [options.preserveDrawingBuffer=false] - 启用绘图缓冲区保留，如果需要在WebGL上下文上调用toDataUrl，请启用此功能。
     * @param {boolean} [options.clearBeforeRender=true] - 这将设置渲染器是否在新的渲染过程之前清除canvas。
     * @param {number} [options.backgroundColor=0x000000] - 渲染区域的背景色
     */
    constructor(system, options)
    {
        super();

        // Add the default render options
        options = Object.assign({}, settings.RENDER_OPTIONS, options);

        // Deprecation notice for renderer roundPixels option
        if (options.roundPixels)
        {
            settings.ROUND_PIXELS = options.roundPixels;
            deprecation('5.0.0', 'Renderer roundPixels option is deprecated, please use PIXI.settings.ROUND_PIXELS', 2);
        }

        /**
         * 构造函数选项
         *
         * @member {Object}
         * @readOnly
         */
        this.options = options;

        /**
         * 渲染器类型
         *
         * @member {number}
         * @default PIXI.RENDERER_TYPE.UNKNOWN
         * @see PIXI.RENDERER_TYPE
         */
        this.type = RENDERER_TYPE.UNKNOWN;

        /**
         * 屏幕尺寸 (0, 0, screenWidth, screenHeight).
         *
         * Its safe to use as filterArea or hitArea for the whole stage.
         *
         * @member {PIXI.Rectangle}
         */
        this.screen = new Rectangle(0, 0, options.width, options.height);

        /**
         * 绘制所有内容的canvas元素。
         *
         * @member {HTMLCanvasElement}
         */
        this.view = options.view || document.createElement('canvas');

        /**
         * 渲染器的分辨率/设备像素比率。
         *
         * @member {number}
         * @default 1
         */
        this.resolution = options.resolution || settings.RESOLUTION;

        /**
         * 渲染视图是否透明。
         *
         * @member {boolean}
         */
        this.transparent = options.transparent;

        /**
         * canvas视图的CSS尺寸是否应自动调整为屏幕尺寸。
         *
         * @member {boolean}
         */
        this.autoDensity = options.autoDensity || options.autoResize || false;
        // autoResize is deprecated, provides fallback support

        /**
         * reserveDrawingBuffer标志的值影响渲染后是否保留模板缓冲区的内容。
         *
         * @member {boolean}
         */
        this.preserveDrawingBuffer = options.preserveDrawingBuffer;

        /**
         * 设置CanvasRenderer是否在新的渲染过程之前清除canvas。
         * 如果场景不是透明的，PixiJS将在每一帧使用画布大小的fillRect操作来设置画布背景颜色。
         * 如果场景是透明的，PixiJS将使用clearRect在每一帧清除画布。
         * 将此设置为false可禁用此功能。 例如，如果您的游戏具有画布填充背景图像，则通常不需要此设置。
         *
         * @member {boolean}
         * @default
         */
        this.clearBeforeRender = options.clearBeforeRender;

        /**
         * 背景颜色数值
         *
         * @member {number}
         * @protected
         */
        this._backgroundColor = 0x000000;

        /**
         * 背景颜色[R, G, B]数组
         *
         * @member {number[]}
         * @protected
         */
        this._backgroundColorRgba = [0, 0, 0, 0];

        /**
         * 背景颜色字符串
         *
         * @member {string}
         * @protected
         */
        this._backgroundColorString = '#000000';

        this.backgroundColor = options.backgroundColor || this._backgroundColor; // run bg color setter

        /**
         * 此临时显示对象用于当前呈现项的父对象。
         *
         * @member {PIXI.DisplayObject}
         * @protected
         */
        this._tempDisplayObjectParent = new Container();

        /**
         * 渲染器尝试渲染的最后一个根对象。
         *
         * @member {PIXI.DisplayObject}
         * @protected
         */
        this._lastObjectRendered = this._tempDisplayObjectParent;

        /**
         * 插件集合
         * @readonly
         * @member {object}
         */
        this.plugins = {};
    }

    /**
     * 初始化插件
     *
     * @protected
     * @param {object} staticMap - 静态保存的插件字典。
     */
    initPlugins(staticMap)
    {
        for (const o in staticMap)
        {
            this.plugins[o] = new (staticMap[o])(this);
        }
    }

    /**
     * 与view.width相同，水平方向上canvas的实际像素数。
     *
     * @member {number}
     * @readonly
     * @default 800
     */
    get width()
    {
        return this.view.width;
    }

    /**
     * 与view.height，垂直方向上canvas的实际像素数。
     *
     * @member {number}
     * @readonly
     * @default 600
     */
    get height()
    {
        return this.view.height;
    }

    /**
     * 将屏幕和canvas调整为指定的宽度和高度。
     * Canvas尺寸乘以分辨率。
     *
     * @param {number} screenWidth - 屏幕的新宽度。
     * @param {number} screenHeight - 屏幕的新高度。
     */
    resize(screenWidth, screenHeight)
    {
        this.screen.width = screenWidth;
        this.screen.height = screenHeight;

        this.view.width = screenWidth * this.resolution;
        this.view.height = screenHeight * this.resolution;

        if (this.autoDensity)
        {
            this.view.style.width = `${screenWidth}px`;
            this.view.style.height = `${screenHeight}px`;
        }
    }

    /**
     * 返回可用于创建精灵的显示对象纹理的有用函数
     * 如果您的displayObject很复杂，需要多次重用，那么这非常实用。
     *
     * @param {PIXI.DisplayObject} displayObject - 将从中生成对象的displayObject。
     * @param {number} scaleMode - 应该是scaleMode常量之一。
     * @param {number} resolution - 生成的纹理的分辨率/设备像素比率。
     * @param {PIXI.Rectangle} [region] - displayObject的应该呈现的区域，
     *        如果未指定区域，则默认为displayObject的本身范围。
     * @return {PIXI.RenderTexture} 图形对象的纹理。
     */
    generateTexture(displayObject, scaleMode, resolution, region)
    {
        region = region || displayObject.getLocalBounds();

        // minimum texture size is 1x1, 0x0 will throw an error
        if (region.width === 0) region.width = 1;
        if (region.height === 0) region.height = 1;

        const renderTexture = RenderTexture.create(region.width | 0, region.height | 0, scaleMode, resolution);

        tempMatrix.tx = -region.x;
        tempMatrix.ty = -region.y;

        this.render(displayObject, renderTexture, false, tempMatrix, !!displayObject.parent);

        return renderTexture;
    }

    /**
     * 从渲染器清除所有内容，并可以选择从DOM中删除Canvas元素。
     *
     * @param {boolean} [removeView=false] - 从DOM中删除Canvas元素。
     */
    destroy(removeView)
    {
        for (const o in this.plugins)
        {
            this.plugins[o].destroy();
            this.plugins[o] = null;
        }

        if (removeView && this.view.parentNode)
        {
            this.view.parentNode.removeChild(this.view);
        }

        this.plugins = null;

        this.type = RENDERER_TYPE.UNKNOWN;

        this.view = null;

        this.screen = null;

        this.resolution = 0;

        this.transparent = false;

        this.autoDensity = false;

        this.blendModes = null;

        this.options = null;

        this.preserveDrawingBuffer = false;
        this.clearBeforeRender = false;

        this._backgroundColor = 0;
        this._backgroundColorRgba = null;
        this._backgroundColorString = null;

        this._tempDisplayObjectParent = null;
        this._lastObjectRendered = null;
    }

    /**
     * 如果不透明则填充的背景色
     *
     * @member {number}
     */
    get backgroundColor()
    {
        return this._backgroundColor;
    }

    set backgroundColor(value) // eslint-disable-line require-jsdoc
    {
        this._backgroundColor = value;
        this._backgroundColorString = hex2string(value);
        hex2rgb(value, this._backgroundColorRgba);
    }
}
