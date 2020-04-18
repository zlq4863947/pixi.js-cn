import { Program } from './Program';
import { UniformGroup } from './UniformGroup';

/**
 * 着色器的辅助类
 *
 * @class
 * @memberof PIXI
 */
export class Shader
{
    /**
     * @param {PIXI.Program} [program] - 着色器将使用的程序。
     * @param {object} [uniforms] - 自定义uniforms，用于增强内置uniforms。
     */
    constructor(program, uniforms)
    {
        /**
         * 着色器使用的程序
         *
         * @member {PIXI.Program}
         */
        this.program = program;

        // lets see whats been passed in
        // uniforms should be converted to a uniform group
        if (uniforms)
        {
            if (uniforms instanceof UniformGroup)
            {
                this.uniformGroup = uniforms;
            }
            else
            {
                this.uniformGroup = new UniformGroup(uniforms);
            }
        }
        else
        {
            this.uniformGroup = new UniformGroup({});
        }

        // time to build some getters and setters!
        // I guess down the line this could sort of generate an instruction list rather than use dirty ids?
        // does the trick for now though!
        for (const i in program.uniformData)
        {
            if (this.uniformGroup.uniforms[i] instanceof Array)
            {
                this.uniformGroup.uniforms[i] = new Float32Array(this.uniformGroup.uniforms[i]);
            }
        }
    }

    // TODO move to shader system..
    checkUniformExists(name, group)
    {
        if (group.uniforms[name])
        {
            return true;
        }

        for (const i in group.uniforms)
        {
            const uniform = group.uniforms[i];

            if (uniform.group)
            {
                if (this.checkUniformExists(name, uniform))
                {
                    return true;
                }
            }
        }

        return false;
    }

    destroy()
    {
        // usage count on programs?
        // remove if not used!
        this.uniformGroup = null;
    }

    /**
     * 着色器uniform统，`uniformGroup.uniforms` 的快捷方式
     * @readonly
     * @member {object}
     */
    get uniforms()
    {
        return this.uniformGroup.uniforms;
    }

    /**
     * 创建基于顶点和片段着色器的着色器快捷功能
     *
     * @param {string} [vertexSrc] - 顶点着色器的源。
     * @param {string} [fragmentSrc] - 片段着色器的源。
     * @param {object} [uniforms] - 自定义uniforms，用于增强内置uniforms。
     *
     * @returns {PIXI.Shader} 闪闪亮的新Pixi着色器！
     */
    static from(vertexSrc, fragmentSrc, uniforms)
    {
        const program = Program.from(vertexSrc, fragmentSrc);

        return new Shader(program, uniforms);
    }
}
