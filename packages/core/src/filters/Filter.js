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
 * PixiJS **v3**, 滤镜始终应用于_整个屏幕_。
 *
 * PixiJS **v4**, 滤镜只能应用于_部分屏幕_。
 * 开发人员必须创建一套uniforms来处理坐标。
 *
 * PixiJS **v5** 结合了_两种方法_。
 * 开发人员可以使用v3的法线坐标，然后允许滤镜使用部分Framebuffer，从而将这些额外的uniform考虑在内。
 *
 * 另请注意，我们已更改了默认的顶点着色器，请参见
 * {@link https://github.com/pixijs/pixi.js/wiki/v5-Creating-filters Wiki}.
 *
 * ### 内置Uniforms
 *
 * PixiJS视口使用屏幕 (CSS) 坐标, `(0, 0, renderer.screen.width, renderer.screen.height)`,
 * 和 `projectionMatrix` uniform 将其映射到gl视口。
 *
 * **uSampler**
 *
 * 最重要的uniform是渲染到容器的输入纹理。
 * _重要说明：与PixiJS中的所有帧缓冲区一样，输入和输出都将预先乘以alpha。
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
 *
 * To calculate input normalized coordinate, you have to map it to filter normalized space.
 * Multiply by `outputFrame.zw` to get input coordinate.
 * Divide by `inputSize.xy` to get input normalized coordinate.
 *
 * ```
 * vec2 filterTextureCoord( void )
 * {
 *     return aVertexPosition * (outputFrame.zw * inputSize.zw); // same as /inputSize.xy
 * }
 * ```
 * **resolution**
 *
 * The `resolution` is the ratio of screen (CSS) pixels to real pixels.
 *
 * **inputPixel**
 *
 * `inputPixel.xy` is the size of framebuffer in real pixels, same as `inputSize.xy * resolution`
 * `inputPixel.zw` is inverted `inputPixel.xy`.
 *
 * It's handy for filters that use neighbour pixels, like {@link PIXI.filters.FXAAFilter FXAAFilter}.
 *
 * **inputClamp**
 *
 * If you try to get info from outside of used part of Framebuffer - you'll get undefined behaviour.
 * For displacements, coordinates has to be clamped.
 *
 * The `inputClamp.xy` is left-top pixel center, you may ignore it, because we use left-top part of Framebuffer
 * `inputClamp.zw` is bottom-right pixel center.
 *
 * ```
 * vec4 color = texture2D(uSampler, clamp(modifigedTextureCoord, inputClamp.xy, inputClamp.zw))
 * ```
 * OR
 * ```
 * vec4 color = texture2D(uSampler, min(modifigedTextureCoord, inputClamp.zw))
 * ```
 *
 * ### Additional Information
 *
 * Complete documentation on Filter usage is located in the
 * {@link https://github.com/pixijs/pixi.js/wiki/v5-Creating-filters Wiki}.
 *
 * Since PixiJS only had a handful of built-in filters, additional filters can be downloaded
 * {@link https://github.com/pixijs/pixi-filters here} from the PixiJS Filters repository.
 *
 * @class
 * @memberof PIXI
 * @extends PIXI.Shader
 */
export class Filter extends Shader
{
    /**
     * @param {string} [vertexSrc] - The source of the vertex shader.
     * @param {string} [fragmentSrc] - The source of the fragment shader.
     * @param {object} [uniforms] - Custom uniforms to use to augment the built-in ones.
     */
    constructor(vertexSrc, fragmentSrc, uniforms)
    {
        const program = Program.from(vertexSrc || Filter.defaultVertexSrc,
            fragmentSrc || Filter.defaultFragmentSrc);

        super(program, uniforms);

        /**
         * The padding of the filter. Some filters require extra space to breath such as a blur.
         * Increasing this will add extra width and height to the bounds of the object that the
         * filter is applied to.
         *
         * @member {number}
         */
        this.padding = 0;

        /**
         * The resolution of the filter. Setting this to be lower will lower the quality but
         * increase the performance of the filter.
         *
         * @member {number}
         */
        this.resolution = settings.FILTER_RESOLUTION;

        /**
         * If enabled is true the filter is applied, if false it will not.
         *
         * @member {boolean}
         */
        this.enabled = true;

        /**
         * If enabled, PixiJS will fit the filter area into boundaries for better performance.
         * Switch it off if it does not work for specific shader.
         *
         * @member {boolean}
         */
        this.autoFit = true;

        /**
         * Legacy filters use position and uvs from attributes
         * @member {boolean}
         * @readonly
         */
        this.legacy = !!this.program.attributeData.aTextureCoord;

        /**
         * The WebGL state the filter requires to render
         * @member {PIXI.State}
         */
        this.state = new State();
    }

    /**
     * Applies the filter
     *
     * @param {PIXI.systems.FilterSystem} filterManager - The renderer to retrieve the filter from
     * @param {PIXI.RenderTexture} input - The input render target.
     * @param {PIXI.RenderTexture} output - The target to output to.
     * @param {PIXI.CLEAR_MODES} clearMode - Should the output be cleared before rendering to it.
     * @param {object} [currentState] - It's current state of filter.
     *        There are some useful properties in the currentState :
     *        target, filters, sourceFrame, destinationFrame, renderTarget, resolution
     */
    apply(filterManager, input, output, clearMode, currentState)
    {
        // do as you please!

        filterManager.applyFilter(this, input, output, clearMode, currentState);

        // or just do a regular render..
    }

    /**
     * Sets the blendmode of the filter
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
     * The default vertex shader source
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
     * The default fragment shader source
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
 * Used for caching shader IDs
 *
 * @static
 * @type {object}
 * @protected
 */
Filter.SOURCE_KEY_MAP = {};

