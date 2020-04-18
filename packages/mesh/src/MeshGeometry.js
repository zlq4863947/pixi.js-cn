import { TYPES } from '@pixi/constants';
import { Buffer, Geometry } from '@pixi/core';

/**
 * PixiJS中使用的标准2D几何。
 *
 * 如果需要，可以在不传递样式或数据的情况下定义几何。
 *
 * ```js
 * const geometry = new PIXI.Geometry();
 *
 * geometry.addAttribute('positions', [0, 0, 100, 0, 100, 100, 0, 100], 2);
 * geometry.addAttribute('uvs', [0,0,1,0,1,1,0,1], 2);
 * geometry.addIndex([0,1,2,1,3,2]);
 *
 * ```
 * @class
 * @memberof PIXI
 * @extends PIXI.Geometry
 */
export class MeshGeometry extends Geometry
{
    /**
     * @param {Float32Array|number[]} vertices - 几何位置数据。
     * @param {Float32Array|number[]} uvs - 纹理UV。
     * @param {Uint16Array|number[]} index - IndexBuffer
     */
    constructor(vertices, uvs, index)
    {
        super();

        const verticesBuffer = new Buffer(vertices);
        const uvsBuffer = new Buffer(uvs, true);
        const indexBuffer = new Buffer(index, true, true);

        this.addAttribute('aVertexPosition', verticesBuffer, 2, false, TYPES.FLOAT)
            .addAttribute('aTextureCoord', uvsBuffer, 2, false, TYPES.FLOAT)
            .addIndex(indexBuffer);

        /**
         * 脏标志以限制对网格的更新调用。 例如，
         * 在渲染循环内使用共享的Geometry限制单个Mesh实例的更新。
         * @private
         * @member {number}
         * @default -1
         */
        this._updateId = -1;
    }

    /**
     * If the vertex position is updated.
     * @member {number}
     * @readonly
     * @private
     */
    get vertexDirtyId()
    {
        return this.buffers[0]._updateID;
    }
}
