/**
 * 创建WebGL程序的辅助类
 *
 * @class
 * @memberof PIXI
 */
export class GLProgram
{
    /**
     * 制作新的Pixi程序
     *
     * @param program {WebGLProgram} webgl程序
     * @param uniformData {Object} uniforms
     */
    constructor(program, uniformData)
    {
        /**
         * 着色器程序
         *
         * @member {WebGLProgram}
         */
        this.program = program;

        /**
         * 保存uniform数据，该数据包含用于缓存和防止不必要的GPU命令uniform位置和当前uniform值
         * @member {Object}
         */
        this.uniformData = uniformData;

        /**
         * UniformGroups拥有着色器的各种上传方法。 每个uniform组和程序都有一个唯一的上传方法。
         * @member {Object}
         */
        this.uniformGroups = {};
    }

    /**
     * 销毁该程序
     */
    destroy()
    {
        this.uniformData = null;
        this.uniformGroups = null;
        this.program = null;
    }
}
