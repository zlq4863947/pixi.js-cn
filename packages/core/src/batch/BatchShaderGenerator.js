import { Shader } from '../shader/Shader';
import { Program } from '../shader/Program';
import { UniformGroup } from '../shader/UniformGroup';
import { Matrix } from '@pixi/math';

/**
 * 生成批处理多纹理着色器的帮助类。与new BatchRenderer一起使用
 *
 * @class
 * @memberof PIXI
 */
export class BatchShaderGenerator
{
    /**
     * @param {string} vertexSrc - 顶点着色器
     * @param {string} fragTemplate - 片段着色器模板
     */
    constructor(vertexSrc, fragTemplate)
    {
        /**
         * 引用的顶点着色器源。
         *
         * @member {string}
         */
        this.vertexSrc = vertexSrc;

        /**
         * 引用的顶片段着色器模板。 必须包含"％count％"和"％forloop％"。
         *
         * @member {string}
         */
        this.fragTemplate = fragTemplate;

        this.programCache = {};
        this.defaultGroupCache = {};

        if (fragTemplate.indexOf('%count%') < 0)
        {
            throw new Error('Fragment template must contain "%count%".');
        }

        if (fragTemplate.indexOf('%forloop%') < 0)
        {
            throw new Error('Fragment template must contain "%forloop%".');
        }
    }

    generateShader(maxTextures)
    {
        if (!this.programCache[maxTextures])
        {
            const sampleValues = new Int32Array(maxTextures);

            for (let i = 0; i < maxTextures; i++)
            {
                sampleValues[i] = i;
            }

            this.defaultGroupCache[maxTextures] = UniformGroup.from({ uSamplers: sampleValues }, true);

            let fragmentSrc = this.fragTemplate;

            fragmentSrc = fragmentSrc.replace(/%count%/gi, `${maxTextures}`);
            fragmentSrc = fragmentSrc.replace(/%forloop%/gi, this.generateSampleSrc(maxTextures));

            this.programCache[maxTextures] = new Program(this.vertexSrc, fragmentSrc);
        }

        const uniforms = {
            tint: new Float32Array([1, 1, 1, 1]),
            translationMatrix: new Matrix(),
            default: this.defaultGroupCache[maxTextures],
        };

        return new Shader(this.programCache[maxTextures], uniforms);
    }

    generateSampleSrc(maxTextures)
    {
        let src = '';

        src += '\n';
        src += '\n';

        for (let i = 0; i < maxTextures; i++)
        {
            if (i > 0)
            {
                src += '\nelse ';
            }

            if (i < maxTextures - 1)
            {
                src += `if(vTextureId < ${i}.5)`;
            }

            src += '\n{';
            src += `\n\tcolor = texture2D(uSamplers[${i}], vTextureCoord);`;
            src += '\n}';
        }

        src += '\n';
        src += '\n';

        return src;
    }
}
