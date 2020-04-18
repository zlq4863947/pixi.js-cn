import { System } from '../System';
import { GLProgram } from './GLProgram';
import { generateUniformsSync,
    unsafeEvalSupported,
    defaultValue,
    compileProgram } from './utils';

let UID = 0;
// defualt sync data so we don't create a new one each time!
const defaultSyncData = { textureCount: 0 };

/**
 * 渲染器的系统插件，用于管理着色器。
 *
 * @class
 * @memberof PIXI.systems
 * @extends PIXI.System
 */
export class ShaderSystem extends System
{
    /**
     * @param {PIXI.Renderer} renderer - 此系统适用的渲染器。
     */
    constructor(renderer)
    {
        super(renderer);

        // Validation check that this environment support `new Function`
        this.systemCheck();

        /**
         * 当前的WebGL渲染上下文
         *
         * @member {WebGLRenderingContext}
         */
        this.gl = null;

        this.shader = null;
        this.program = null;

        /**
         * 缓存以保存生成的函数。 针对UniformObjects唯一签名存储
         * @type {Object}
         * @private
         */
        this.cache = {};

        this.id = UID++;
    }

    /**
     * 如果平台不支持unsafe-evals，`@pixi/unsafe-eval`可以重写的方法以停止抛出错误。
     *
     * @private
     */
    systemCheck()
    {
        if (!unsafeEvalSupported())
        {
            throw new Error('Current environment does not allow unsafe-eval, '
                + 'please use @pixi/unsafe-eval module to enable support.');
        }
    }

    contextChange(gl)
    {
        this.gl = gl;
        this.reset();
    }

    /**
     * 将当前着色器更改为参数中指定的着色器
     *
     * @param {PIXI.Shader} shader - 新的着色器
     * @param {boolean} [dontSync] - 如果着色器应自动同步其uniforms，则为false。
     * @returns {PIXI.GLProgram} 属于着色器的glProgram。
     */
    bind(shader, dontSync)
    {
        shader.uniforms.globals = this.renderer.globalUniforms;

        const program = shader.program;
        const glProgram = program.glPrograms[this.renderer.CONTEXT_UID] || this.generateShader(shader);

        this.shader = shader;

        // TODO - some current Pixi plugins bypass this.. so it not safe to use yet..
        if (this.program !== program)
        {
            this.program = program;
            this.gl.useProgram(glProgram.program);
        }

        if (!dontSync)
        {
            defaultSyncData.textureCount = 0;

            this.syncUniformGroup(shader.uniformGroup, defaultSyncData);
        }

        return glProgram;
    }

    /**
     * 将uniforms值上传到当前绑定的着色器。
     *
     * @param {object} uniforms - 应用于当前着色器的uniforms值
     */
    setUniforms(uniforms)
    {
        const shader = this.shader.program;
        const glProgram = shader.glPrograms[this.renderer.CONTEXT_UID];

        shader.syncUniforms(glProgram.uniformData, uniforms, this.renderer);
    }

    /**
     *
     * 同步组中的 uniforms
     * @param {*} group 要同步的 uniform 组
     * @param {*} syncData 这是传递给同步方法和任何嵌套同步方法的数据
     */
    syncUniformGroup(group, syncData)
    {
        const glProgram = this.getglProgram();

        if (!group.static || group.dirtyId !== glProgram.uniformGroups[group.id])
        {
            glProgram.uniformGroups[group.id] = group.dirtyId;

            this.syncUniforms(group, glProgram, syncData);
        }
    }

    /**
     * 可由 @pixi/unsafe-eval 包重写以使用静态syncUnforms代替。
     *
     * @private
     */
    syncUniforms(group, glProgram, syncData)
    {
        const syncFunc = group.syncUniforms[this.shader.program.id] || this.createSyncGroups(group);

        syncFunc(glProgram.uniformData, group.uniforms, this.renderer, syncData);
    }

    createSyncGroups(group)
    {
        const id = this.getSignature(group, this.shader.program.uniformData);

        if (!this.cache[id])
        {
            this.cache[id] = generateUniformsSync(group, this.shader.program.uniformData);
        }

        group.syncUniforms[this.shader.program.id] = this.cache[id];

        return group.syncUniforms[this.shader.program.id];
    }

    /**
     * 获取uniform组和数据，并为其生成唯一的签名。
     *
     * @param {PIXI.UniformGroup} group 获得签名的uniform组
     * @param {Object} uniformData 着色器生成的uniform信息
     * @returns {String} uniform组的唯一签名
     * @private
     */
    getSignature(group, uniformData)
    {
        const uniforms = group.uniforms;

        const strings = [];

        for (const i in uniforms)
        {
            strings.push(i);

            if (uniformData[i])
            {
                strings.push(uniformData[i].type);
            }
        }

        return strings.join('-');
    }

    /**
     * 返回基础GLShade rof当前绑定的着色器。
     * 当您对uniforms的设置有更多控制时，这可能很方便。
     *
     * @return {PIXI.GLProgram} 在此上下文中，当前绑定的着色器的glProgram
     */
    getglProgram()
    {
        if (this.shader)
        {
            return this.shader.program.glPrograms[this.renderer.CONTEXT_UID];
        }

        return null;
    }

    /**
     * 生成提供的Shader的glProgram版本。
     *
     * @private
     * @param {PIXI.Shader} shader glProgram将基于的着色器。
     * @return {PIXI.GLProgram} 闪亮的新glProgram！
     */
    generateShader(shader)
    {
        const gl = this.gl;

        const program = shader.program;

        const attribMap = {};

        for (const i in program.attributeData)
        {
            attribMap[i] = program.attributeData[i].location;
        }

        const shaderProgram = compileProgram(gl, program.vertexSrc, program.fragmentSrc, attribMap);
        const uniformData = {};

        for (const i in program.uniformData)
        {
            const data = program.uniformData[i];

            uniformData[i] = {
                location: gl.getUniformLocation(shaderProgram, i),
                value: defaultValue(data.type, data.size),
            };
        }

        const glProgram = new GLProgram(shaderProgram, uniformData);

        program.glPrograms[this.renderer.CONTEXT_UID] = glProgram;

        return glProgram;
    }

    /**
     * 重置着色器系统状态，不影响WebGL状态
     */
    reset()
    {
        this.program = null;
        this.shader = null;
    }

    /**
     * 销毁该系统并删除其所有纹理
     */
    destroy()
    {
        // TODO implement destroy method for ShaderSystem
        this.destroyed = true;
    }
}
