import { AbstractRenderer } from './AbstractRenderer';
import { sayHello, isWebGLSupported } from '@pixi/utils';
import { MaskSystem } from './mask/MaskSystem';
import { StencilSystem } from './mask/StencilSystem';
import { ScissorSystem } from './mask/ScissorSystem';
import { FilterSystem } from './filters/FilterSystem';
import { FramebufferSystem } from './framebuffer/FramebufferSystem';
import { RenderTextureSystem } from './renderTexture/RenderTextureSystem';
import { TextureSystem } from './textures/TextureSystem';
import { ProjectionSystem } from './projection/ProjectionSystem';
import { StateSystem } from './state/StateSystem';
import { GeometrySystem } from './geometry/GeometrySystem';
import { ShaderSystem } from './shader/ShaderSystem';
import { ContextSystem } from './context/ContextSystem';
import { BatchSystem } from './batch/BatchSystem';
import { TextureGCSystem } from './textures/TextureGCSystem';
import { RENDERER_TYPE } from '@pixi/constants';
import { UniformGroup } from './shader/UniformGroup';
import { Matrix } from '@pixi/math';
import { Runner } from '@pixi/runner';

/**
 * 渲染器将场景及其所有内容绘制到启用WebGL的画布上。
 *
 * 此渲染器应用于支持WebGL的浏览器。
 *
 * 该渲染器通过自动管理WebGLBatchesm来工作，因此不需要Sprite Batchs或Sprite Cloud。
 * 不要忘记将视图添加到DOM中，否则您将看不到任何内容！
 *
 * @class
 * @memberof PIXI
 * @extends PIXI.AbstractRenderer
 */
export class Renderer extends AbstractRenderer
{
    /**
     * 如果WebGL可用，则创建渲染器。 可被 **@pixi/canvas-renderer** 包重写以允许回退。
     * 如果WebGL不可用，则会引发错误。
     * @static
     * @private
     */
    static create(options)
    {
        if (isWebGLSupported())
        {
            return new Renderer(options);
        }

        throw new Error('WebGL unsupported in this browser, use "pixi.js-legacy" for fallback canvas2d support.');
    }

    /**
     * @param {object} [options] - 可选的渲染器参数。
     * @param {number} [options.width=800] - 屏幕的宽度。
     * @param {number} [options.height=600] - 屏幕的高度。
     * @param {HTMLCanvasElement} [options.view] - 用作视图的画布，可选。
     * @param {boolean} [options.transparent=false] - true时，设置渲染视图为透明
     * @param {boolean} [options.autoDensity=false] - 调整渲染器视图的CSS像素大小，以允许使用非1的分辨率。
     * @param {boolean} [options.antialias=false] - 设置抗锯齿。 如果本机不可用，则使用FXAA抗锯齿。
     * @param {boolean} [options.forceFXAA=false] - 强制在本机上使用FXAA抗锯齿。
     *  FXAA更快，但可能并不总是那么好。
     * @param {number} [options.resolution=1] - 渲染器的分辨率/设备像素比率。
     *  渲染器视网膜的分辨率为2。
     * @param {boolean} [options.clearBeforeRender=true] - 这将设置渲染器是否在新的渲染过程之前清除画布。
     * 如果您希望将其设置为false，则 *必须* 将prepareDrawingBuffer设置为 `true`。
     * @param {boolean} [options.preserveDrawingBuffer=false] - 启用绘图缓冲区保留，
     *  如果需要在WebGL上下文上调用toDataUrl，请启用此功能。
     * @param {number} [options.backgroundColor=0x000000] - 渲染区域的背景色（如果不透明则显示）。
     * @param {string} [options.powerPreference] - 传递给WebGL上下文的参数，对于具有双显卡的设备，设置为"high-performance"。
     * @param {object} [options.context] 如果WebGL上下文已经存在，则必须从中获取所有参数。
     */
    constructor(options = {})
    {
        super('WebGL', options);

        // the options will have been modified here in the super constructor with pixi's default settings..
        options = this.options;

        /**
         * 此渲染器的类型为标准化const
         *
         * @member {number}
         * @see PIXI.RENDERER_TYPE
         */
        this.type = RENDERER_TYPE.WEBGL;

        /**
         * WebGL上下文，由contextSystem（this.context）设置
         *
         * @readonly
         * @member {WebGLRenderingContext}
         */
        this.gl = null;

        this.CONTEXT_UID = 0;

        // TODO legacy!

        /**
         * 内部信号实例 **runner**，这些实例分配给创建的每个系统。
         * @see PIXI.Runner
         * @name PIXI.Renderer#runners
         * @private
         * @type {object}
         * @readonly
         * @property {PIXI.Runner} destroy - 销毁 runner
         * @property {PIXI.Runner} contextChange - 上下文变更 runner
         * @property {PIXI.Runner} reset - 重置 runner
         * @property {PIXI.Runner} update - 更新 runner
         * @property {PIXI.Runner} postrender - 后期渲染 runner
         * @property {PIXI.Runner} prerender - 预渲染 runner
         * @property {PIXI.Runner} resize - 调整大小 runner
         */
        this.runners = {
            destroy: new Runner('destroy'),
            contextChange: new Runner('contextChange', 1),
            reset: new Runner('reset'),
            update: new Runner('update'),
            postrender: new Runner('postrender'),
            prerender: new Runner('prerender'),
            resize: new Runner('resize', 2),
        };

        /**
         * 全局 uniforms
         * @member {PIXI.UniformGroup}
         */
        this.globalUniforms = new UniformGroup({
            projectionMatrix: new Matrix(),
        }, true);

        // TODO: typescript doesn't like the dynamic addition of these systems so adding them here for now
        this.mask = null;
        this.batch = null;
        this.filter = null;

        /**
         * 遮罩系统实例
         * @member {PIXI.systems.MaskSystem} mask
         * @memberof PIXI.Renderer#
         * @readonly
         */
        this.addSystem(MaskSystem, 'mask')
            /**
             * 上下文系统实例
             * @member {PIXI.systems.ContextSystem} context
             * @memberof PIXI.Renderer#
             * @readonly
             */
            .addSystem(ContextSystem, 'context')
            /**
             * 状态系统实例
             * @member {PIXI.systems.StateSystem} state
             * @memberof PIXI.Renderer#
             * @readonly
             */
            .addSystem(StateSystem, 'state')
            /**
             * 着色器系统实例
             * @member {PIXI.systems.ShaderSystem} shader
             * @memberof PIXI.Renderer#
             * @readonly
             */
            .addSystem(ShaderSystem, 'shader')
            /**
             * 纹理系统实例
             * @member {PIXI.systems.TextureSystem} texture
             * @memberof PIXI.Renderer#
             * @readonly
             */
            .addSystem(TextureSystem, 'texture')
            /**
             * 几何系统实例
             * @member {PIXI.systems.GeometrySystem} geometry
             * @memberof PIXI.Renderer#
             * @readonly
             */
            .addSystem(GeometrySystem, 'geometry')
            /**
             * 帧缓冲系统实例
             * @member {PIXI.systems.FramebufferSystem} framebuffer
             * @memberof PIXI.Renderer#
             * @readonly
             */
            .addSystem(FramebufferSystem, 'framebuffer')
            /**
             * 剪式系统实例
             * @member {PIXI.systems.ScissorSystem} scissor
             * @memberof PIXI.Renderer#
             * @readonly
             */
            .addSystem(ScissorSystem, 'scissor')
            /**
             * 模具系统实例
             * @member {PIXI.systems.StencilSystem} stencil
             * @memberof PIXI.Renderer#
             * @readonly
             */
            .addSystem(StencilSystem, 'stencil')
            /**
             * 投影系统实例
             * @member {PIXI.systems.ProjectionSystem} projection
             * @memberof PIXI.Renderer#
             * @readonly
             */
            .addSystem(ProjectionSystem, 'projection')
            /**
             * 纹理垃圾收集器系统实例
             * @member {PIXI.systems.TextureGCSystem} textureGC
             * @memberof PIXI.Renderer#
             * @readonly
             */
            .addSystem(TextureGCSystem, 'textureGC')
            /**
             * 滤镜系统实例
             * @member {PIXI.systems.FilterSystem} filter
             * @memberof PIXI.Renderer#
             * @readonly
             */
            .addSystem(FilterSystem, 'filter')
            /**
             * RenderTexture系统实例
             * @member {PIXI.systems.RenderTextureSystem} renderTexture
             * @memberof PIXI.Renderer#
             * @readonly
             */
            .addSystem(RenderTextureSystem, 'renderTexture')

            /**
             * 批处理系统实例
             * @member {PIXI.systems.BatchSystem} batch
             * @memberof PIXI.Renderer#
             * @readonly
             */
            .addSystem(BatchSystem, 'batch');

        this.initPlugins(Renderer.__plugins);

        /**
         * 传递来创建新的WebGL上下文的选项。
         */
        if (options.context)
        {
            this.context.initFromContext(options.context);
        }
        else
        {
            this.context.initFromOptions({
                alpha: this.transparent,
                antialias: options.antialias,
                premultipliedAlpha: this.transparent && this.transparent !== 'notMultiplied',
                stencil: true,
                preserveDrawingBuffer: options.preserveDrawingBuffer,
                powerPreference: this.options.powerPreference,
            });
        }

        /**
         * Flag if we are rendering to the screen vs renderTexture
         * @member {boolean}
         * @readonly
         * @default true
         */
        this.renderingToScreen = true;

        sayHello(this.context.webGLVersion === 2 ? 'WebGL 2' : 'WebGL 1');

        this.resize(this.options.width, this.options.height);
    }

    /**
     * 将新系统添加到渲染器。
     * @param {Function} ClassRef - 类引用
     * @param {string} [name] - 系统的属性名称（如果未指定）将在类本身上使用静态的 `name` 属性。
     *        此名称将在Renderer上分配为s属性，因此请确保它不会与Renderer上的属性冲突。
     * @return {PIXI.Renderer} 返回渲染器实例
     */
    addSystem(ClassRef, name)
    {
        if (!name)
        {
            name = ClassRef.name;
        }

        const system = new ClassRef(this);

        if (this[name])
        {
            throw new Error(`Whoops! The name "${name}" is already in use`);
        }

        this[name] = system;

        for (const i in this.runners)
        {
            this.runners[i].add(system);
        }

        /**
         * 渲染完成后触发。
         *
         * @event PIXI.Renderer#postrender
         */

        /**
         * 在渲染开始之前触发。
         *
         * @event PIXI.Renderer#prerender
         */

        /**
         * 设置WebGL上下文时触发。
         *
         * @event PIXI.Renderer#context
         * @param {WebGLRenderingContext} gl - WebGL context.
         */

        return this;
    }

    /**
     * 将对象渲染到其WebGL视图
     *
     * @param {PIXI.DisplayObject} displayObject - 要渲染的对象。
     * @param {PIXI.RenderTexture} [renderTexture] - 要渲染到的渲染纹理。
     * @param {boolean} [clear=true] - 在新渲染之前清除画布。
     * @param {PIXI.Matrix} [transform] - 在渲染之前应用于渲染纹理的变换。
     * @param {boolean} [skipUpdateTransform=false] - 我们应该跳过更新转换吗？
     */
    render(displayObject, renderTexture, clear, transform, skipUpdateTransform)
    {
        // can be handy to know!
        this.renderingToScreen = !renderTexture;

        this.runners.prerender.run();
        this.emit('prerender');

        // apply a transform at a GPU level
        this.projection.transform = transform;

        // no point rendering if our context has been blown up!
        if (this.context.isLost)
        {
            return;
        }

        if (!renderTexture)
        {
            this._lastObjectRendered = displayObject;
        }

        if (!skipUpdateTransform)
        {
            // update the scene graph
            const cacheParent = displayObject.parent;

            displayObject.parent = this._tempDisplayObjectParent;
            displayObject.updateTransform();
            displayObject.parent = cacheParent;
            // displayObject.hitArea = //TODO add a temp hit area
        }

        this.renderTexture.bind(renderTexture);
        this.batch.currentRenderer.start();

        if (clear !== undefined ? clear : this.clearBeforeRender)
        {
            this.renderTexture.clear();
        }

        displayObject.render(this);

        // apply transform..
        this.batch.currentRenderer.flush();

        if (renderTexture)
        {
            renderTexture.baseTexture.update();
        }

        this.runners.postrender.run();

        // reset transform after render
        this.projection.transform = null;

        this.emit('postrender');
    }

    /**
     * 将WebGL视图调整为指定的宽度和高度。
     *
     * @param {number} screenWidth - 屏幕的新宽度。
     * @param {number} screenHeight - 屏幕的新高度。
     */
    resize(screenWidth, screenHeight)
    {
        super.resize(screenWidth, screenHeight);

        this.runners.resize.run(screenWidth, screenHeight);
    }

    /**
     * 重置WebGL状态，以便您可以根据自己的喜好渲染事物！
     *
     * @return {PIXI.Renderer} Returns itself.
     */
    reset()
    {
        this.runners.reset.run();

        return this;
    }

    /**
     * 清除帧缓冲区
     */
    clear()
    {
        this.framebuffer.bind();
        this.framebuffer.clear();
    }

    /**
     * 从渲染器中删除所有内容（事件监听器，spritebatch等）
     *
     * @param {boolean} [removeView=false] - 从DOM中删除Canvas元素。
     *  See: https://github.com/pixijs/pixi.js/issues/2233
     */
    destroy(removeView)
    {
        this.runners.destroy.run();

        for (const r in this.runners)
        {
            this.runners[r].destroy();
        }

        // call base destroy
        super.destroy(removeView);

        // TODO nullify all the managers..
        this.gl = null;
    }

    /**
     * 已安装插件的集合。 这些默认包含在PIXI中，但可以通过创建自定义版本来排除。
     * 有关创建自定义版本和排除插件的更多信息，请查阅README。
     * @name PIXI.Renderer#plugins
     * @type {object}
     * @readonly
     * @property {PIXI.accessibility.AccessibilityManager} accessibility 支持制表互动元素。
     * @property {PIXI.Extract} extract 从渲染器提取图像数据。.
     * @property {PIXI.interaction.InteractionManager} interaction 处理鼠标，触摸和指针事件。
     * @property {PIXI.Prepare} prepare 预渲染显示对象。
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
        Renderer.__plugins = Renderer.__plugins || {};
        Renderer.__plugins[pluginName] = ctor;
    }
}
