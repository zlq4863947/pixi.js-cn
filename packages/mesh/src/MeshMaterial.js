import { Shader, Program, TextureMatrix } from '@pixi/core';
import vertex from './shader/mesh.vert';
import fragment from './shader/mesh.frag';
import { Matrix } from '@pixi/math';
import { premultiplyTintToRgba } from '@pixi/utils';

/**
 * PixiJS 2D对象的默认着色器。
 * @class
 * @memberof PIXI
 * @extends PIXI.Shader
 */
export class MeshMaterial extends Shader
{
    /**
     * @param {PIXI.Texture} uSampler - 材质用于渲染的纹理。
     * @param {object} [options] - 其他选项
     * @param {number} [options.alpha=1] - 默认Alpha。
     * @param {number} [options.tint=0xFFFFFF] - 默认色调。
     * @param {string} [options.pluginName='batch'] - 用于批处理的Renderer插件。
     * @param {PIXI.Program} [options.program=0xFFFFFF] - 自定义程序。
     * @param {object} [options.uniforms] - 自定义uniforms。
     */
    constructor(uSampler, options)
    {
        const uniforms = {
            uSampler,
            alpha: 1,
            uTextureMatrix: Matrix.IDENTITY,
            uColor: new Float32Array([1, 1, 1, 1]),
        };

        // Set defaults
        options = Object.assign({
            tint: 0xFFFFFF,
            alpha: 1,
            pluginName: 'batch',
        }, options);

        if (options.uniforms)
        {
            Object.assign(uniforms, options.uniforms);
        }

        super(options.program || Program.from(vertex, fragment), uniforms);

        /**
         * 仅在色调或Alpha更改时才更新。
         * @member {boolean}
         * @private
         * @default false
         */
        this._colorDirty = false;

        /**
         * 此Mesh的TextureMatrix实例，用于跟踪纹理变化
         *
         * @member {PIXI.TextureMatrix}
         * @readonly
         */
        this.uvMatrix = new TextureMatrix(uSampler);

        /**
         * 如果着色器可以与渲染器的批处理系统一起批处理，则为`true`。
         * @member {boolean}
         * @default true
         */
        this.batchable = options.program === undefined;

        /**
         * 批处理渲染器插件
         *
         * @member {string}
         * @default 'batch'
         */
        this.pluginName = options.pluginName;

        this.tint = options.tint;
        this.alpha = options.alpha;
    }

    /**
     * 要渲染的纹理的引用。
     * @member {PIXI.Texture}
     */
    get texture()
    {
        return this.uniforms.uSampler;
    }
    set texture(value)
    {
        if (this.uniforms.uSampler !== value)
        {
            this.uniforms.uSampler = value;
            this.uvMatrix.texture = value;
        }
    }

    /**
     * 由使用这个的对象自动设置。
     *
     * @default 1
     * @member {number}
     */
    set alpha(value)
    {
        if (value === this._alpha) return;

        this._alpha = value;
        this._colorDirty = true;
    }
    get alpha()
    {
        return this._alpha;
    }

    /**
     * 为材料增加色调。
     * @member {number}
     * @default 0xFFFFFF
     */
    set tint(value)
    {
        if (value === this._tint) return;

        this._tint = value;
        this._tintRGB = (value >> 16) + (value & 0xff00) + ((value & 0xff) << 16);
        this._colorDirty = true;
    }
    get tint()
    {
        return this._tint;
    }

    /**
     * 由网格自动调用。旨在覆盖自定义MeshMaterial对象。
     */
    update()
    {
        if (this._colorDirty)
        {
            this._colorDirty = false;
            const baseTexture = this.texture.baseTexture;

            premultiplyTintToRgba(this._tint, this._alpha, this.uniforms.uColor, baseTexture.alphaMode);
        }
        if (this.uvMatrix.update())
        {
            this.uniforms.uTextureMatrix = this.uvMatrix.mapCoord;
        }
    }
}
