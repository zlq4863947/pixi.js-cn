import { TYPES } from '@pixi/constants';
import { Geometry } from '../geometry/Geometry';
import { Buffer } from '../geometry/Buffer';

/**
 * 用于批处理标准PIXI内容的几何（例如，Mesh，Sprite，Graphics对象）。
 *
 * @class
 * @memberof PIXI
 */
export class BatchGeometry extends Geometry
{
    /**
     * @param {boolean} [_static=false] 优化标志，其中`false`每帧更新一次，`true`不逐帧更改。
     */
    constructor(_static = false)
    {
        super();

        /**
         * 用于位置，颜色，纹理ID的缓冲区
         *
         * @member {PIXI.Buffer}
         * @protected
         */
        this._buffer = new Buffer(null, _static, false);

        /**
         * 索引缓冲区数据
         *
         * @member {PIXI.Buffer}
         * @protected
         */
        this._indexBuffer = new Buffer(null, _static, true);

        this.addAttribute('aVertexPosition', this._buffer, 2, false, TYPES.FLOAT)
            .addAttribute('aTextureCoord', this._buffer, 2, false, TYPES.FLOAT)
            .addAttribute('aColor', this._buffer, 4, true, TYPES.UNSIGNED_BYTE)
            .addAttribute('aTextureId', this._buffer, 1, true, TYPES.FLOAT)
            .addIndex(this._indexBuffer);
    }
}
