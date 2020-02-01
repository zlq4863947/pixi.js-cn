import { AbstractRenderer, resources } from '@pixi/core';
import { CanvasRenderTarget, sayHello } from '@pixi/utils';
import { CanvasMaskManager } from './utils/CanvasMaskManager';
import { mapCanvasBlendModesToPixi } from './utils/mapCanvasBlendModesToPixi';
import { RENDERER_TYPE, SCALE_MODES, BLEND_MODES } from '@pixi/constants';
import { settings } from '@pixi/settings';

/**
 * CanvasRenderer 将场景及其所有内容绘制到二维画布上。
 *
 * 此渲染器应用于不支持WebGL的浏览器。
 * 不要忘记将CanvasRenderer.view添加到您的DOM中，否则您将看不到任何东西！
 *
 * @class
 * @memberof PIXI
 * @extends PIXI.AbstractRenderer
 */
export class CanvasRenderer extends AbstractRenderer
{
    /**
     * @param {object} [options] - 可选的渲染器参数
     * @param {number} [options.width=800] - 屏幕的宽度
     * @param {number} [options.height=600] - 屏幕的高度
     * @param {HTMLCanvasElement} [options.view] - 用作视图的画布，可选
     * @param {boolean} [options.transparent=false] - 渲染视图是f\否透明的，则默认为false
     * @param {boolean} [options.autoDensity=false] - 调整CSS像素中渲染器视图的大小，以允许使用非1的分辨率
     * @param {boolean} [options.antialias=false] - 设置抗锯齿
     * @param {number} [options.resolution=1] - 渲染器的分辨率/设备像素比率。 渲染器视网膜的分辨率为2。
     * @param {boolean} [options.preserveDrawingBuffer=false] - 启用绘图缓冲区保留，如果需要在webgl上下文上调用toDataUrl，请启用此功能。
     * @param {boolean} [options.clearBeforeRender=true] - 这将设置渲染器是否在新的渲染过程之前清除画布。
     * @param {number} [options.backgroundColor=0x000000] - 渲染区域的背景色（如果不透明则显示）。
     */
    constructor(options, arg2, arg3)
    {
        super('Canvas', options, arg2, arg3);

        this.type = RENDERER_TYPE.CANVAS;

        /**
         * 绘制所有内容的根画布2d上下文。
         *
         * @member {CanvasRenderingContext2D}
         */
        this.rootContext = this.view.getContext('2d', { alpha: this.transparent });

        /**
         * 当前活动的canvas 2d上下文（可以通过renderTextures更改）
         *
         * @member {CanvasRenderingContext2D}
         */
        this.context = this.rootContext;

        /**
         * 布尔值标志，用于控制画布刷新。
         *
         * @member {boolean}
         */
        this.refresh = true;

        /**
         * CanvasMaskManager的实例，在使用画布渲染器时处理遮罩。
         *
         * @member {PIXI.CanvasMaskManager}
         */
        this.maskManager = new CanvasMaskManager(this);

        /**
         * canvas属性用于设置画布平滑属性。
         *
         * @member {string}
         */
        this.smoothProperty = 'imageSmoothingEnabled';

        if (!this.rootContext.imageSmoothingEnabled)
        {
            if (this.rootContext.webkitImageSmoothingEnabled)
            {
                this.smoothProperty = 'webkitImageSmoothingEnabled';
            }
            else if (this.rootContext.mozImageSmoothingEnabled)
            {
                this.smoothProperty = 'mozImageSmoothingEnabled';
            }
            else if (this.rootContext.oImageSmoothingEnabled)
            {
                this.smoothProperty = 'oImageSmoothingEnabled';
            }
            else if (this.rootContext.msImageSmoothingEnabled)
            {
                this.smoothProperty = 'msImageSmoothingEnabled';
            }
        }

        this.initPlugins(CanvasRenderer.__plugins);

        /**
         * 跟踪对该渲染器的混合模式。
         *
         * @member {object<number, string>}
         */
        this.blendModes = mapCanvasBlendModesToPixi();
        this._activeBlendMode = null;
        this._outerBlend = false;

        this.renderingToScreen = false;

        sayHello('Canvas');

        /**
         * 渲染完成后触发。
         *
         * @event PIXI.CanvasRenderer#postrender
         */

        /**
         * 在开始渲染之前触发。
         *
         * @event PIXI.CanvasRenderer#prerender
         */

        this.resize(this.options.width, this.options.height);
    }

    /**
     * 将对象渲染到此画布视图
     *
     * @param {PIXI.DisplayObject} displayObject - 要渲染的对象
     * @param {PIXI.RenderTexture} [renderTexture] - 要渲染到的渲染纹理。
     *  如果未设置，它将渲染到root context.。
     * @param {boolean} [clear=false] - 绘制前是否清除画布
     * @param {PIXI.Matrix} [transform] - 要应用的转换
     * @param {boolean} [skipUpdateTransform=false] - 是否跳过更新转换
     */
    render(displayObject, renderTexture, clear, transform, skipUpdateTransform)
    {
        if (!this.view)
        {
            return;
        }

        // can be handy to know!
        this.renderingToScreen = !renderTexture;

        this.emit('prerender');

        const rootResolution = this.resolution;

        if (renderTexture)
        {
            renderTexture = renderTexture.baseTexture || renderTexture;

            if (!renderTexture._canvasRenderTarget)
            {
                renderTexture._canvasRenderTarget = new CanvasRenderTarget(
                    renderTexture.width,
                    renderTexture.height,
                    renderTexture.resolution,
                );
                renderTexture.resource = new resources.CanvasResource(renderTexture._canvasRenderTarget.canvas);
                renderTexture.valid = true;
            }

            this.context = renderTexture._canvasRenderTarget.context;
            this.resolution = renderTexture._canvasRenderTarget.resolution;
        }
        else
        {
            this.context = this.rootContext;
        }

        const context = this.context;

        if (!renderTexture)
        {
            this._lastObjectRendered = displayObject;
        }

        if (!skipUpdateTransform)
        {
            // update the scene graph
            const cacheParent = displayObject.parent;
            const tempWt = this._tempDisplayObjectParent.transform.worldTransform;

            if (transform)
            {
                transform.copyTo(tempWt);
                // Canvas Renderer doesn't use "context.translate"
                // nor does it store current translation in projectionSystem
                // we re-calculate all matrices,
                // its not like CanvasRenderer can survive more than 1000 elements
                displayObject.transform._parentID = -1;
            }
            else
            {
                // in this case matrix cache in displayObject works like expected
                tempWt.identity();
            }

            displayObject.parent = this._tempDisplayObjectParent;

            displayObject.updateTransform();
            displayObject.parent = cacheParent;
            if (transform)
            {
                // Clear the matrix cache one more time,
                // we dont have our computations to affect standard "transform=null" case
                displayObject.transform._parentID = -1;
            }
            // displayObject.hitArea = //TODO add a temp hit area
        }

        context.save();
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.globalAlpha = 1;
        this._activeBlendMode = BLEND_MODES.NORMAL;
        this._outerBlend = false;
        context.globalCompositeOperation = this.blendModes[BLEND_MODES.NORMAL];

        if (clear !== undefined ? clear : this.clearBeforeRender)
        {
            if (this.renderingToScreen)
            {
                if (this.transparent)
                {
                    context.clearRect(0, 0, this.width, this.height);
                }
                else
                {
                    context.fillStyle = this._backgroundColorString;
                    context.fillRect(0, 0, this.width, this.height);
                }
            } // else {
            // TODO: implement background for CanvasRenderTarget or RenderTexture?
            // }
        }

        // TODO RENDER TARGET STUFF HERE..
        const tempContext = this.context;

        this.context = context;
        displayObject.renderCanvas(this);
        this.context = tempContext;

        context.restore();

        this.resolution = rootResolution;

        this.emit('postrender');
    }

    /**
     * 清除渲染器的画布。
     *
     * @param {string} [clearColor] - 使用此颜色清除画布，除非画布已为透明。
     */
    clear(clearColor)
    {
        const context = this.context;

        clearColor = clearColor || this._backgroundColorString;

        if (!this.transparent && clearColor)
        {
            context.fillStyle = clearColor;
            context.fillRect(0, 0, this.width, this.height);
        }
        else
        {
            context.clearRect(0, 0, this.width, this.height);
        }
    }

    /**
     * 设置渲染器的混合模式。
     *
     * @param {number} blendMode - 参考 {@link PIXI.BLEND_MODES} 的有效值。
     * @param {boolean} [readyForOuterBlend=false] - 一些混合模式是危险的，它们影响精灵的外层空间。
     * 只有当你准备好使用它们的时候，才能通过`true`。
     */
    setBlendMode(blendMode, readyForOuterBlend)
    {
        const outerBlend = blendMode === BLEND_MODES.SRC_IN
            || blendMode === BLEND_MODES.SRC_OUT
            || blendMode === BLEND_MODES.DST_IN
            || blendMode === BLEND_MODES.DST_ATOP;

        if (!readyForOuterBlend && outerBlend)
        {
            blendMode = BLEND_MODES.NORMAL;
        }

        if (this._activeBlendMode === blendMode)
        {
            return;
        }

        this._activeBlendMode = blendMode;
        this._outerBlend = outerBlend;
        this.context.globalCompositeOperation = this.blendModes[blendMode];
    }

    /**
     * 从渲染器中移除所有内容，并可选地移除Canvas DOM元素。
     *
     * @param {boolean} [removeView=false] - 从DOM中移除Canvas元素。
     */
    destroy(removeView)
    {
        // call the base destroy
        super.destroy(removeView);

        this.context = null;

        this.refresh = true;

        this.maskManager.destroy();
        this.maskManager = null;

        this.smoothProperty = null;
    }

    /**
     * 将画布视图调整为指定的宽度和高度。
     *
     * @extends PIXI.AbstractRenderer#resize
     *
     * @param {number} screenWidth - 屏幕的新宽度
     * @param {number} screenHeight - 屏幕的新高度
     */
    resize(screenWidth, screenHeight)
    {
        super.resize(screenWidth, screenHeight);

        // reset the scale mode.. oddly this seems to be reset when the canvas is resized.
        // surely a browser bug?? Let PixiJS fix that for you..
        if (this.smoothProperty)
        {
            this.rootContext[this.smoothProperty] = (settings.SCALE_MODE === SCALE_MODES.LINEAR);
        }
    }

    /**
     * 检查混合模式是否已更改。
     */
    invalidateBlendMode()
    {
        this._activeBlendMode = this.blendModes.indexOf(this.context.globalCompositeOperation);
    }

    /**
     * 已安装插件的集合。默认情况下，它们包含在PIXI中，但可以通过创建自定义生成来排除。
     * 有关创建自定义生成和排除插件的详细信息，请参阅自述文件。
     * @name PIXI.CanvasRenderer#plugins
     * @type {object}
     * @readonly
     * @property {PIXI.accessibility.AccessibilityManager} accessibility 支持切换交互元素。
     * @property {PIXI.CanvasExtract} extract 从渲染器提取图像数据。
     * @property {PIXI.interaction.InteractionManager} interaction 处理鼠标、触摸和指针事件。
     * @property {PIXI.CanvasPrepare} prepare 预渲染显示对象。
     */

    /**
     * 将插件添加到渲染器。
     *
     * @method
     * @param {string} pluginName - 插件的名称。
     * @param {Function} ctor - 插件的构造函数或类。
     */
    static registerPlugin(pluginName, ctor)
    {
        CanvasRenderer.__plugins = CanvasRenderer.__plugins || {};
        CanvasRenderer.__plugins[pluginName] = ctor;
    }
}
