// import * as from '../systems/shader/shader';
import { setPrecision,
    defaultValue,
    compileProgram,
    mapSize,
    mapType,
    getTestContext,
    getMaxFragmentPrecision } from './utils';
import { ProgramCache } from '@pixi/utils';
import defaultFragment from './defaultProgram.frag';
import defaultVertex from './defaultProgram.vert';
import { settings } from '@pixi/settings';
import { PRECISION } from '@pixi/constants';

let UID = 0;

const nameCache = {};

/**
 * 用于创建着色器程序的辅助类
 *
 * @class
 * @memberof PIXI
 */
export class Program
{
    /**
     * @param {string} [vertexSrc] - 顶点着色器的源。
     * @param {string} [fragmentSrc] - 片段着色器的源。
     * @param {string} [name] - 着色器的名称
     */
    constructor(vertexSrc, fragmentSrc, name = 'pixi-shader')
    {
        this.id = UID++;

        /**
         * 顶点着色器。
         *
         * @member {string}
         */
        this.vertexSrc = vertexSrc || Program.defaultVertexSrc;

        /**
         * 片段着色器。
         *
         * @member {string}
         */
        this.fragmentSrc = fragmentSrc || Program.defaultFragmentSrc;

        this.vertexSrc = this.vertexSrc.trim();
        this.fragmentSrc = this.fragmentSrc.trim();

        if (this.vertexSrc.substring(0, 8) !== '#version')
        {
            name = name.replace(/\s+/g, '-');

            if (nameCache[name])
            {
                nameCache[name]++;
                name += `-${nameCache[name]}`;
            }
            else
            {
                nameCache[name] = 1;
            }

            this.vertexSrc = `#define SHADER_NAME ${name}\n${this.vertexSrc}`;
            this.fragmentSrc = `#define SHADER_NAME ${name}\n${this.fragmentSrc}`;

            this.vertexSrc = setPrecision(this.vertexSrc, settings.PRECISION_VERTEX, PRECISION.HIGH);
            this.fragmentSrc = setPrecision(this.fragmentSrc, settings.PRECISION_FRAGMENT, getMaxFragmentPrecision());
        }

        // currently this does not extract structs only default types
        this.extractData(this.vertexSrc, this.fragmentSrc);

        // this is where we store shader references..
        this.glPrograms = {};

        this.syncUniforms = null;
    }

    /**
     * 提取数据，以创建一个小型测试程序或直接读取src。
     * @protected
     *
     * @param {string} [vertexSrc] - 顶点着色器的源。
     * @param {string} [fragmentSrc] - 片段着色器的源。
     */
    extractData(vertexSrc, fragmentSrc)
    {
        const gl = getTestContext();

        if (gl)
        {
            const program = compileProgram(gl, vertexSrc, fragmentSrc);

            this.attributeData = this.getAttributeData(program, gl);
            this.uniformData = this.getUniformData(program, gl);

            gl.deleteProgram(program);
        }
        else
        {
            this.uniformData = {};
            this.attributeData = {};
        }
    }

    /**
     * 从程序返回属性数据
     * @private
     *
     * @param {WebGLProgram} [program] - WebGL程序
     * @param {WebGLRenderingContext} [gl] - WebGL上下文
     *
     * @returns {object} 该程序的属性数据
     */
    getAttributeData(program, gl)
    {
        const attributes = {};
        const attributesArray = [];

        const totalAttributes = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);

        for (let i = 0; i < totalAttributes; i++)
        {
            const attribData = gl.getActiveAttrib(program, i);
            const type = mapType(gl, attribData.type);

            /*eslint-disable */
            const data = {
                type: type,
                name: attribData.name,
                size: mapSize(type),
                location: 0,
            };
            /* eslint-enable */

            attributes[attribData.name] = data;
            attributesArray.push(data);
        }

        attributesArray.sort((a, b) => (a.name > b.name) ? 1 : -1); // eslint-disable-line no-confusing-arrow

        for (let i = 0; i < attributesArray.length; i++)
        {
            attributesArray[i].location = i;
        }

        return attributes;
    }

    /**
     * 从程序返回的 uniform 数据
     * @private
     *
     * @param {webGL-program} [program] - webgl程序
     * @param {context} [gl] - WebGL上下文
     *
     * @returns {object} 该程序的 uniform 数据
     */
    getUniformData(program, gl)
    {
        const uniforms = {};

        const totalUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);

        // TODO expose this as a prop?
        // const maskRegex = new RegExp('^(projectionMatrix|uSampler|translationMatrix)$');
        // const maskRegex = new RegExp('^(projectionMatrix|uSampler|translationMatrix)$');

        for (let i = 0; i < totalUniforms; i++)
        {
            const uniformData = gl.getActiveUniform(program, i);
            const name = uniformData.name.replace(/\[.*?\]/, '');

            const isArray = uniformData.name.match(/\[.*?\]/, '');
            const type = mapType(gl, uniformData.type);

            /*eslint-disable */
            uniforms[name] = {
                type: type,
                size: uniformData.size,
                isArray:isArray,
                value: defaultValue(type, uniformData.size),
            };
            /* eslint-enable */
        }

        return uniforms;
    }

    /**
     * 默认的顶点着色器源
     *
     * @static
     * @constant
     * @member {string}
     */
    static get defaultVertexSrc()
    {
        return defaultVertex;
    }

    /**
     * 默认片段着色器源
     *
     * @static
     * @constant
     * @member {string}
     */
    static get defaultFragmentSrc()
    {
        return defaultFragment;
    }

    /**
     * 创建基于顶点和片段着色器的程序的快捷方法，此方法还将检查是否有缓存的程序。
     *
     * @param {string} [vertexSrc] - 顶点着色器的源。
     * @param {string} [fragmentSrc] - 片段着色器的源。
     * @param {string} [name=pixi-shader] - 着色器的名称
     *
     * @returns {PIXI.Program} 闪闪亮的新Pixi着色器！
     */
    static from(vertexSrc, fragmentSrc, name)
    {
        const key = vertexSrc + fragmentSrc;

        let program = ProgramCache[key];

        if (!program)
        {
            ProgramCache[key] = program = new Program(vertexSrc, fragmentSrc, name);
        }

        return program;
    }
}
