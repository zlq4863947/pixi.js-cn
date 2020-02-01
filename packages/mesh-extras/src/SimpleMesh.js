import { Mesh, MeshGeometry, MeshMaterial } from '@pixi/mesh';
import { Texture } from '@pixi/core';

/**
 * Simple Mesh类模仿PixiJS v4中的Mesh，提供了易于使用的构造函数参数。
 * 要进行更强大的自定义，请使用 {@link PIXI.Mesh}.
 *
 * @class
 * @extends PIXI.Mesh
 * @memberof PIXI
 */
export class SimpleMesh extends Mesh
{
    /**
     * @param {PIXI.Texture} [texture=Texture.EMPTY] - 使用的纹理
     * @param {Float32Array} [vertices] - 如果要指定顶点
     * @param {Float32Array} [uvs] - 如果要指定uvs
     * @param {Uint16Array} [indices] - 如果要指定索引
     * @param {number} [drawMode] - drawMode可以是任何Mesh.DRAW_MODES consts
     */
    constructor(texture = Texture.EMPTY, vertices, uvs, indices, drawMode)
    {
        const geometry = new MeshGeometry(vertices, uvs, indices);

        geometry.getBuffer('aVertexPosition').static = false;

        const meshMaterial = new MeshMaterial(texture);

        super(geometry, meshMaterial, null, drawMode);

        /**
         * 每帧上载顶点缓冲
         * @member {boolean}
         */
        this.autoUpdate = true;
    }

    /**
     * 顶点数据的收集。
     * @member {Float32Array}
     */
    get vertices()
    {
        return this.geometry.getBuffer('aVertexPosition').data;
    }
    set vertices(value)
    {
        this.geometry.getBuffer('aVertexPosition').data = value;
    }

    _render(renderer)
    {
        if (this.autoUpdate)
        {
            this.geometry.getBuffer('aVertexPosition').update();
        }

        super._render(renderer);
    }
}
