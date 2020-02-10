import { BatchShaderGenerator } from './BatchShaderGenerator';
import { BatchGeometry } from './BatchGeometry';
import { AbstractBatchRenderer } from './AbstractBatchRenderer';

import defaultVertex from './texture.vert';
import defaultFragment from './texture.frag';

/**
 * @class
 * @memberof PIXI
 * @hideconstructor
 */
export class BatchPluginFactory
{
    /**
     * 为Renderer创建一个新的BatchRenderer插件。
     * 这种便利可以提供一种简便的方法来扩展BatchRenderer的所有必要部分。
     * @example
     * const fragment = `
     * varying vec2 vTextureCoord;
     * varying vec4 vColor;
     * varying float vTextureId;
     * uniform sampler2D uSamplers[%count%];
     *
     * void main(void){
     *     vec4 color;
     *     %forloop%
     *     gl_FragColor = vColor * vec4(color.a - color.rgb, color.a);
     * }
     * `;
     * const InvertBatchRenderer = PIXI.BatchPluginFactory.create({ fragment });
     * PIXI.Renderer.registerPlugin('invert', InvertBatchRenderer);
     * const sprite = new PIXI.Sprite();
     * sprite.pluginName = 'invert';
     *
     * @static
     * @param {object} [options]
     * @param {string} [options.vertex=PIXI.BatchPluginFactory.defaultVertexSrc] - 顶点着色器源
     * @param {string} [options.fragment=PIXI.BatchPluginFactory.defaultFragmentTemplate] - 片段着色器模板
     * @param {number} [options.vertexSize=6] - Vertex size
     * @param {object} [options.geometryClass=PIXI.BatchGeometry]
     * @return {*} New batch renderer plugin
     */
    static create(options)
    {
        const { vertex, fragment, vertexSize, geometryClass } = Object.assign({
            vertex: defaultVertex,
            fragment: defaultFragment,
            geometryClass: BatchGeometry,
            vertexSize: 6,
        }, options);

        return class BatchPlugin extends AbstractBatchRenderer
        {
            constructor(renderer)
            {
                super(renderer);

                this.shaderGenerator = new BatchShaderGenerator(vertex, fragment);
                this.geometryClass = geometryClass;
                this.vertexSize = vertexSize;
            }
        };
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
    static get defaultFragmentTemplate()
    {
        return defaultFragment;
    }
}

// Setup the default BatchRenderer plugin, this is what
// we'll actually export at the root level
export const BatchRenderer = BatchPluginFactory.create();
