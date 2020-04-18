import { Shader } from '../shader/Shader';
import { Program } from '../shader/Program';
import { State } from '../state/State';
import { settings } from '@pixi/settings';
import defaultVertex from './defaultFilter.vert';
import defaultFragment from './defaultFilter.frag';

/**
 * 滤镜是应用于屏幕的一种特殊类型的WebGL着色器。
 *
 * {@link PIXI.filters.BlurFilter BlurFilter}的{@link http://pixijs.io/examples/#/filters/blur-filter.js 示例} 。
 *
 * ### 用法
 * 滤镜可以应用于任何DisplayObject或Container。
 * PixiJS的`FilterSystem`将容器渲染到临时的Framebuffer中，然后滤镜将其渲染到屏幕上。
 * 可以将多个滤镜添加到`filters`数组属性并相互堆叠。
 *
 * ```
 * const filter = new PIXI.Filter(myShaderVert, myShaderFrag, { myUniform: 0.5 });
 * const container = new PIXI.Container();
 * container.filters = [filter];
 * ```
 *
 * ### 过去版本的差异
 *
 * PixiJS **v3**, 滤镜始终应用于 _整个屏幕_ 。
 *
 * PixiJS **v4**, 滤镜只能应用于 _部分屏幕_ 。
 * 开发人员必须创建一套uniforms来处理坐标。
 *
 * PixiJS **v5** 结合了 _两种方法_ 。
 * 开发人员可以使用v3的法线坐标，然后允许滤镜使用部分Framebuffer，从而将这些额外的uniform考虑在内。
 *
 * 另请注意，我们已更改了默认的顶点着色器，请参见
 * {@link https://github.com/zlq4863947/pixi.js-cn/wiki/v5-Creating-filters Wiki}.
 *
 * ### 内置Uniforms
 *
 * PixiJS视口使用屏幕 (CSS) 坐标, `(0, 0, renderer.screen.width, renderer.screen.height)`,
 * 和 `projectionMatrix` uniform 将其映射到gl视口。
 *
 * **uSampler**
 *
 * 最重要的uniform是渲染到容器的输入纹理。
 * 重要说明：与PixiJS中的所有帧缓冲区一样，输入和输出都将预先乘以alpha。
 *
 * 默认情况下，输入的归一化坐标通过`vTextureCoord`传递给片段着色器。
 * 用它来采样输入。
 *
 * ```
 * const fragment = `
 * varying vec2 vTextureCoord;
 * uniform sampler2D uSampler;
 * void main(void)
 * {
 *    gl_FragColor = texture2D(uSampler, vTextureCoord);
 * }
 * `;
 *
 * const myFilter = new PIXI.Filter(null, fragment);
 * ```
 *
 * 该滤镜仅比{@link PIXI.filters.AlphaFilter AlphaFilter}小一个uniform。
 *
 * **outputFrame**
 *
 * `outputFrame` 是包含在屏幕 (CSS) 坐标中应用滤镜的矩形。
 * 它与全屏滤镜 `renderer.screen` 相同。
 * 临时Framebuffer仅使用`outputFrame.zw`大小的一部分，
 * `(0, 0, outputFrame.width, outputFrame.height)`,
 *
 * 滤镜使用此四边形归一化（0-1）空间，并将其传递到 `aVertexPosition` 属性中。
 * 要使用归一化（0-1）空间来计算屏幕空间中的顶点位置：
 *
 * ```
 * vec4 filterVertexPosition( void )
 * {
 *     vec2 position = aVertexPosition * max(outputFrame.zw, vec2(0.)) + outputFrame.xy;
 *     return vec4((projectionMatrix * vec3(position, 1.0)).xy, 0.0, 1.0);
 * }
 * ```
 *
 * **inputSize**
 *
 * 临时帧缓冲区不同，它可以是屏幕的大小，也可以是2的幂。
 * `inputSize.xy` 是保存输入的临时帧缓冲区的大小。
 * `inputSize.zw` 是反转的，这是一个避免在着色器中划分的快捷方式。
 *
 * Set `inputSize.xy = outputFrame.zw` for a fullscreen filter.
 * 为全屏滤镜设置 `inputSize.xy = outputFrame.zw` 。
 *
 * 要计算输入归一化坐标，必须将其映射到滤镜归一化空间。
 * 乘以 `outputFrame.zw` 以获取输入坐标。
 * 除以 `inputSize.xy` 以获得输入归一化坐标。
 *
 * ```
 * vec2 filterTextureCoord( void )
 * {
 *     return aVertexPosition * (outputFrame.zw * inputSize.zw); // same as /inputSize.xy
 * }
 * ```
 * **resolution**
 *
 * `resolution` 是屏幕（CSS）像素与实际像素的比率。
 *
 * **inputPixel**
 *
 * `inputPixel.xy` is the size of framebuffer in real pixels, same as `inputSize.xy * resolution`
 * `inputPixel.xy` 是帧缓冲区的实际像素大小，与`inputSize.xy * resolution`相同
 * `inputPixel.zw` 与 `inputPixel.xy` 相反。
 *
 * 对于使用相邻像素的滤镜，例如{@link PIXI.filters.FXAAFilter FXAAFilter}，它非常方便。
 *
 * **inputClamp**
 *
 * 如果您尝试从Framebuffer的已使用部分之外获取信息 - 您将获得未定义行为。
 * 对于位移，必须夹紧坐标。
 *
 * `inputClamp.xy` 是左上像素中心，您可以忽略它，因为我们使用Framebuffer的左上部分
 * `inputClamp.zw` 是右下像素中心。
 *
 * ```
 * vec4 color = texture2D(uSampler, clamp(modifigedTextureCoord, inputClamp.xy, inputClamp.zw))
 * ```
 * 或
 * ```
 * vec4 color = texture2D(uSampler, min(modifigedTextureCoord, inputClamp.zw))
 * ```
 *
 * ### 附加信息
 *
 * 有关滤镜使用情况的完整文档位于
 * {@link https://github.com/zlq4863947/pixi.js-cn/wiki/v5-Creating-filters Wiki}.
 *
 * 由于PixiJS仅具有少数内置滤镜，因此可以从{@link https://github.com/pixijs/pixi-filters 这里}获取其他过滤器。
 *
 * @class
 * @memberof PIXI
 * @extends PIXI.Shader
 */
export class Filter extends Shader
{
    /**
     * @param {string} [vertexSrc] - 顶点着色器的源。
     * @param {string} [fragmentSrc] - 片段着色器的源。
     * @param {object} [uniforms] - 自定义uniforms，用于增强内置uniforms。
     */
    constructor(vertexSrc, fragmentSrc, uniforms)
    {
        const program = Program.from(vertexSrc || Filter.defaultVertexSrc,
            fragmentSrc || Filter.defaultFragmentSrc);

        super(program, uniforms);

        /**
         * 滤镜的填充。一些滤镜需要额外的空间呼吸运动，例如模糊。
         * 增大此值将为应用滤镜的对象的边界增加额外的宽度和高度。
         *
         * @member {number}
         */
        this.padding = 0;

        /**
         * 滤镜的分辨率。将此值设置得较低会降低质量，但会提高滤镜的性能。
         *
         * @member {number}
         */
        this.resolution = settings.FILTER_RESOLUTION;

        /**
         * 如果启用为true，则应用过滤器；如果为false，则不应用过滤器。
         *
         * @member {boolean}
         */
        this.enabled = true;

        /**
         * 如果启用，PixiJS将使滤镜区域适合边界以提高性能。
         * 如果它不适用于指定的着色器，请将其关闭。
         *
         * @member {boolean}
         */
        this.autoFit = true;

        /**
         * 传统过滤器使用属性中的位置和uvs
         * @member {boolean}
         * @readonly
         */
        this.legacy = !!this.program.attributeData.aTextureCoord;

        /**
         * 滤镜需要渲染的WebGL状态
         * @member {PIXI.State}
         */
        this.state = new State();
    }

    /**
     * 应用滤镜
     *
     * @param {PIXI.systems.FilterSystem} filterManager - 渲染器从中检索滤镜
     * @param {PIXI.RenderTexture} input - 输入的渲染目标。
     * @param {PIXI.RenderTexture} output - 要输出到的目标。
     * @param {PIXI.CLEAR_MODES} clearMode - 在渲染到输出之前是否清除输出。
     * @param {object} [currentState] - 它是滤镜的当前状态。
     *        currentState中有一些有用的属性：
     *        target, filters, sourceFrame, destinationFrame, renderTarget, resolution
     */
    apply(filterManager, input, output, clearMode, currentState)
    {
        // do as you please!

        filterManager.applyFilter(this, input, output, clearMode, currentState);

        // or just do a regular render..
    }

    /**
     * 设置滤镜的混合模式
     *
     * @member {number}
     * @default PIXI.BLEND_MODES.NORMAL
     */
    get blendMode()
    {
        return this.state.blendMode;
    }

    set blendMode(value) // eslint-disable-line require-jsdoc
    {
        this.state.blendMode = value;
    }

    /**
     * 默认的顶点着色器源
     *
     * @static
     * @type {string}
     * @constant
     */
    static get defaultVertexSrc()
    {
        return defaultVertex;
    }

    /**
     * 默认片段着色器源
     *
     * @static
     * @type {string}
     * @constant
     */
    static get defaultFragmentSrc()
    {
        return defaultFragment;
    }
}

/**
 * 用于缓存着色器ID
 *
 * @static
 * @type {object}
 * @protected
 */
Filter.SOURCE_KEY_MAP = {};

