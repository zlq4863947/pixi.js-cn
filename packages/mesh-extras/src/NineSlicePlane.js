import { Texture } from '@pixi/core';
import { SimplePlane } from './SimplePlane';

const DEFAULT_BORDER_SIZE = 10;

/**
 * NineSlicePlane允许您使用9切片缩放来拉伸纹理。
 * 角度将保持未缩放状态（例如，对于带有圆角的按钮很有用），其他区域将水平或垂直缩放。
 *
 *```js
 * let Plane9 = new PIXI.NineSlicePlane(PIXI.Texture.from('BoxWithRoundedCorners.png'), 15, 15, 15, 15);
 *  ```
 * <pre>
 *      A                          B
 *    +---+----------------------+---+
 *  C | 1 |          2           | 3 |
 *    +---+----------------------+---+
 *    |   |                      |   |
 *    | 4 |          5           | 6 |
 *    |   |                      |   |
 *    +---+----------------------+---+
 *  D | 7 |          8           | 9 |
 *    +---+----------------------+---+

 *  更改此对象的宽度 和/或 高度时：
 *     区域1 3 7和9将保持未缩放状态。
 *     区域2和8将被水平拉伸
 *     区域4和6将被垂直拉伸
 *     区域5将水平和垂直拉伸
 * </pre>
 *
 * @class
 * @extends PIXI.SimplePlane
 * @memberof PIXI
 *
 */
export class NineSlicePlane extends SimplePlane
{
    /**
     * @param {PIXI.Texture} texture - 在NineSlicePlane上使用的纹理。
     * @param {number} [leftWidth=10] 左侧竖条的大小（A）
     * @param {number} [topHeight=10] 顶部横条的大小（C）
     * @param {number} [rightWidth=10] 右侧竖条的大小（B）
     * @param {number} [bottomHeight=10] 底部横条的大小（D）
     */
    constructor(texture, leftWidth, topHeight, rightWidth, bottomHeight)
    {
        super(Texture.WHITE, 4, 4);

        this._origWidth = texture.orig.width;
        this._origHeight = texture.orig.height;

        /**
         * NineSlicePlane的宽度，设置此宽度实际上将修改此平面的顶点和UV
         *
         * @member {number}
         * @override
         */
        this._width = this._origWidth;

        /**
         * NineSlicePlane的高度，设置此高度实际上将修改此平面的顶点和UV
         *
         * @member {number}
         * @override
         */
        this._height = this._origHeight;

        /**
         * 左列的宽度（a）
         *
         * @member {number}
         * @private
         */
        this._leftWidth = typeof leftWidth !== 'undefined' ? leftWidth : DEFAULT_BORDER_SIZE;

        /**
         * 右列的宽度（b）
         *
         * @member {number}
         * @private
         */
        this._rightWidth = typeof rightWidth !== 'undefined' ? rightWidth : DEFAULT_BORDER_SIZE;

        /**
         * 第一行的高度（c）
         *
         * @member {number}
         * @private
         */
        this._topHeight = typeof topHeight !== 'undefined' ? topHeight : DEFAULT_BORDER_SIZE;

        /**
         * The height of the bottom row (d)
         *
         * @member {number}
         * @private
         */
        this._bottomHeight = typeof bottomHeight !== 'undefined' ? bottomHeight : DEFAULT_BORDER_SIZE;

        // lets call the setter to ensure all necessary updates are performed
        this.texture = texture;
    }

    textureUpdated()
    {
        this._textureID = this.shader.texture._updateID;
        this._refresh();
    }

    get vertices()
    {
        return this.geometry.getBuffer('aVertexPosition').data;
    }

    set vertices(value)
    {
        this.geometry.getBuffer('aVertexPosition').data = value;
    }

    /**
     * 更新水平顶点。
     *
     */
    updateHorizontalVertices()
    {
        const vertices = this.vertices;

        const scale = this._getMinScale();

        vertices[9] = vertices[11] = vertices[13] = vertices[15] = this._topHeight * scale;
        vertices[17] = vertices[19] = vertices[21] = vertices[23] = this._height - (this._bottomHeight * scale);
        vertices[25] = vertices[27] = vertices[29] = vertices[31] = this._height;
    }

    /**
     * 更新垂直顶点。
     *
     */
    updateVerticalVertices()
    {
        const vertices = this.vertices;

        const scale = this._getMinScale();

        vertices[2] = vertices[10] = vertices[18] = vertices[26] = this._leftWidth * scale;
        vertices[4] = vertices[12] = vertices[20] = vertices[28] = this._width - (this._rightWidth * scale);
        vertices[6] = vertices[14] = vertices[22] = vertices[30] = this._width;
    }

    /**
     * 返回一组九个切片角的垂直和水平比例尺中的较小者。
     *
     * @return {number} 较少的垂直和水平比例尺。
     * @private
     */
    _getMinScale()
    {
        const w = this._leftWidth + this._rightWidth;
        const scaleW = this._width > w ? 1.0 : this._width / w;

        const h = this._topHeight + this._bottomHeight;
        const scaleH = this._height > h ? 1.0 : this._height / h;

        const scale = Math.min(scaleW, scaleH);

        return scale;
    }

    /**
     * NineSlicePlane的宽度，设置此宽度实际上将修改此平面的顶点和UV
     *
     * @member {number}
     */
    get width()
    {
        return this._width;
    }

    set width(value) // eslint-disable-line require-jsdoc
    {
        this._width = value;
        this._refresh();
    }

    /**
     * NineSlicePlane的高度，设置此高度实际上将修改此平面的顶点和UV
     *
     * @member {number}
     */
    get height()
    {
        return this._height;
    }

    set height(value) // eslint-disable-line require-jsdoc
    {
        this._height = value;
        this._refresh();
    }

    /**
     * 左栏宽度
     *
     * @member {number}
     */
    get leftWidth()
    {
        return this._leftWidth;
    }

    set leftWidth(value) // eslint-disable-line require-jsdoc
    {
        this._leftWidth = value;
        this._refresh();
    }

    /**
     * 右栏宽度
     *
     * @member {number}
     */
    get rightWidth()
    {
        return this._rightWidth;
    }

    set rightWidth(value) // eslint-disable-line require-jsdoc
    {
        this._rightWidth = value;
        this._refresh();
    }

    /**
     * 第一行的高度
     *
     * @member {number}
     */
    get topHeight()
    {
        return this._topHeight;
    }

    set topHeight(value) // eslint-disable-line require-jsdoc
    {
        this._topHeight = value;
        this._refresh();
    }

    /**
     * 底行高度
     *
     * @member {number}
     */
    get bottomHeight()
    {
        return this._bottomHeight;
    }

    set bottomHeight(value) // eslint-disable-line require-jsdoc
    {
        this._bottomHeight = value;
        this._refresh();
    }

    /**
     * 刷新NineSlicePlane坐标。
     */
    _refresh()
    {
        const texture = this.texture;

        const uvs = this.geometry.buffers[1].data;

        this._origWidth = texture.orig.width;
        this._origHeight = texture.orig.height;

        const _uvw = 1.0 / this._origWidth;
        const _uvh = 1.0 / this._origHeight;

        uvs[0] = uvs[8] = uvs[16] = uvs[24] = 0;
        uvs[1] = uvs[3] = uvs[5] = uvs[7] = 0;
        uvs[6] = uvs[14] = uvs[22] = uvs[30] = 1;
        uvs[25] = uvs[27] = uvs[29] = uvs[31] = 1;

        uvs[2] = uvs[10] = uvs[18] = uvs[26] = _uvw * this._leftWidth;
        uvs[4] = uvs[12] = uvs[20] = uvs[28] = 1 - (_uvw * this._rightWidth);
        uvs[9] = uvs[11] = uvs[13] = uvs[15] = _uvh * this._topHeight;
        uvs[17] = uvs[19] = uvs[21] = uvs[23] = 1 - (_uvh * this._bottomHeight);

        this.updateHorizontalVertices();
        this.updateVerticalVertices();

        this.geometry.buffers[0].update();
        this.geometry.buffers[1].update();
    }
}
