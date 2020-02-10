import { System } from '../System';
import { settings } from '../settings';
import { ENV } from '@pixi/constants';

let CONTEXT_UID = 0;

/**
 * 渲染器的系统插件，用于管理上下文。
 *
 * @class
 * @extends PIXI.System
 * @memberof PIXI.systems
 */
export class ContextSystem extends System
{
    /**
     * @param {PIXI.Renderer} renderer - 此系统适用的渲染器。
     */
    constructor(renderer)
    {
        super(renderer);

        /**
         * 1或2以反映所使用的WebGL版本
         * @member {number}
         * @readonly
         */
        this.webGLVersion = 1;

        /**
         * 使用的扩展名
         * @member {object}
         * @readonly
         * @property {WEBGL_draw_buffers} drawBuffers - WebGL v1 extension
         * @property {WEBGL_depth_texture} depthTexture - WebGL v1 extension
         * @property {OES_texture_float} floatTexture - WebGL v1 extension
         * @property {WEBGL_lose_context} loseContext - WebGL v1 extension
         * @property {OES_vertex_array_object} vertexArrayObject - WebGL v1 extension
         * @property {EXT_texture_filter_anisotropic} anisotropicFiltering - WebGL v1 and v2 extension
         */
        this.extensions = {};

        // Bind functions
        this.handleContextLost = this.handleContextLost.bind(this);
        this.handleContextRestored = this.handleContextRestored.bind(this);

        renderer.view.addEventListener('webglcontextlost', this.handleContextLost, false);
        renderer.view.addEventListener('webglcontextrestored', this.handleContextRestored, false);
    }

    /**
     * `true` 为上下文丢失
     * @member {boolean}
     * @readonly
     */
    get isLost()
    {
        return (!this.gl || this.gl.isContextLost());
    }

    /**
     * 处理上下文更改事件
     * @param {WebGLRenderingContext} gl new webgl context
     */
    contextChange(gl)
    {
        this.gl = gl;
        this.renderer.gl = gl;
        this.renderer.CONTEXT_UID = CONTEXT_UID++;

        // restore a context if it was previously lost
        if (gl.isContextLost() && gl.getExtension('WEBGL_lose_context'))
        {
            gl.getExtension('WEBGL_lose_context').restoreContext();
        }
    }

    /**
     * 初始化上下文
     *
     * @protected
     * @param {WebGLRenderingContext} gl - WebGL上下文
     */
    initFromContext(gl)
    {
        this.gl = gl;
        this.validateContext(gl);
        this.renderer.gl = gl;
        this.renderer.CONTEXT_UID = CONTEXT_UID++;
        this.renderer.runners.contextChange.run(gl);
    }

    /**
     * 从上下文选项初始化
     *
     * @protected
     * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/getContext
     * @param {object} options - 上下文属性
     */
    initFromOptions(options)
    {
        const gl = this.createContext(this.renderer.view, options);

        this.initFromContext(gl);
    }

    /**
     * 创建WebGL上下文的Helper类
     *
     * @param canvas {HTMLCanvasElement} 我们将从中获取上下文的canvas元素
     * @param options {object} 一个选项对象，该对象传递给包含上下文属性的canvas元素
     * @see https://developer.mozilla.org/zh/docs/Web/API/HTMLCanvasElement/getContext
     * @return {WebGLRenderingContext} WebGL上下文
     */
    createContext(canvas, options)
    {
        let gl;

        if (settings.PREFER_ENV >= ENV.WEBGL2)
        {
            gl = canvas.getContext('webgl2', options);
        }

        if (gl)
        {
            this.webGLVersion = 2;
        }
        else
        {
            this.webGLVersion = 1;

            gl = canvas.getContext('webgl', options)
            || canvas.getContext('experimental-webgl', options);

            if (!gl)
            {
                // fail, not able to get a context
                throw new Error('This browser does not support WebGL. Try using the canvas renderer');
            }
        }

        this.gl = gl;

        this.getExtensions();

        return gl;
    }

    /**
     * 自动填充扩展名
     *
     * @protected
     */
    getExtensions()
    {
        // time to set up default extensions that Pixi uses.
        const { gl } = this;

        if (this.webGLVersion === 1)
        {
            Object.assign(this.extensions, {
                drawBuffers: gl.getExtension('WEBGL_draw_buffers'),
                depthTexture: gl.getExtension('WEBKIT_WEBGL_depth_texture'),
                loseContext: gl.getExtension('WEBGL_lose_context'),
                vertexArrayObject: gl.getExtension('OES_vertex_array_object')
                    || gl.getExtension('MOZ_OES_vertex_array_object')
                    || gl.getExtension('WEBKIT_OES_vertex_array_object'),
                anisotropicFiltering: gl.getExtension('EXT_texture_filter_anisotropic'),
                uint32ElementIndex: gl.getExtension('OES_element_index_uint'),
                // Floats and half-floats
                floatTexture: gl.getExtension('OES_texture_float'),
                floatTextureLinear: gl.getExtension('OES_texture_float_linear'),
                textureHalfFloat: gl.getExtension('OES_texture_half_float'),
                textureHalfFloatLinear: gl.getExtension('OES_texture_half_float_linear'),
            });
        }
        else if (this.webGLVersion === 2)
        {
            Object.assign(this.extensions, {
                anisotropicFiltering: gl.getExtension('EXT_texture_filter_anisotropic'),
                // Floats and half-floats
                colorBufferFloat: gl.getExtension('EXT_color_buffer_float'),
                floatTextureLinear: gl.getExtension('OES_texture_float_linear'),
            });
        }
    }

    /**
     * 处理丢失的webgl上下文
     *
     * @protected
     * @param {WebGLContextEvent} event - 上下文丢失事件。
     */
    handleContextLost(event)
    {
        event.preventDefault();
    }

    /**
     * 处理还原的webgl上下文
     *
     * @protected
     */
    handleContextRestored()
    {
        this.renderer.runners.contextChange.run(this.gl);
    }

    destroy()
    {
        const view = this.renderer.view;

        // remove listeners
        view.removeEventListener('webglcontextlost', this.handleContextLost);
        view.removeEventListener('webglcontextrestored', this.handleContextRestored);

        this.gl.useProgram(null);

        if (this.extensions.loseContext)
        {
            this.extensions.loseContext.loseContext();
        }
    }

    /**
     * 处理渲染后runner事件
     *
     * @protected
     */
    postrender()
    {
        if (this.renderer.renderingToScreen)
        {
            this.gl.flush();
        }
    }

    /**
     * 验证上下文
     *
     * @protected
     * @param {WebGLRenderingContext} gl - 渲染器上下文
     */
    validateContext(gl)
    {
        const attributes = gl.getContextAttributes();

        // this is going to be fairly simple for now.. but at least we have room to grow!
        if (!attributes.stencil)
        {
            /* eslint-disable max-len */

            /* eslint-disable no-console */
            console.warn('Provided WebGL context does not have a stencil buffer, masks may not render correctly');
            /* eslint-enable no-console */

            /* eslint-enable max-len */
        }
    }
}
