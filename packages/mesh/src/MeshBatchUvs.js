/**
 * 类控制用于从Texture正规空间到BaseTexture正规空间的UV映射的缓存。
 *
 * @class
 * @memberof PIXI
 */
export class MeshBatchUvs
{
    /**
     * @param {PIXI.Buffer} uvBuffer - 归一化uv的缓冲区
     * @param {PIXI.TextureMatrix} uvMatrix - 材质UV矩阵
     */
    constructor(uvBuffer, uvMatrix)
    {
        /**
         * 具有归一化UV的缓冲区
         * @member {PIXI.Buffer}
         */
        this.uvBuffer = uvBuffer;

        /**
         * 材质UV矩阵
         * @member {PIXI.TextureMatrix}
         */
        this.uvMatrix = uvMatrix;

        /**
         * UV缓冲数据
         * @member {Float32Array}
         * @readonly
         */
        this.data = null;

        this._bufferUpdateId = -1;

        this._textureUpdateId = -1;

        this._updateID = 0;
    }

    /**
     * updates
     *
     * @param {boolean} forceUpdate - 强制更新
     */
    update(forceUpdate)
    {
        if (!forceUpdate
            && this._bufferUpdateId === this.uvBuffer._updateID
            && this._textureUpdateId === this.uvMatrix._updateID)
        {
            return;
        }

        this._bufferUpdateId = this.uvBuffer._updateID;
        this._textureUpdateId = this.uvMatrix._updateID;

        const data = this.uvBuffer.data;

        if (!this.data || this.data.length !== data.length)
        {
            this.data = new Float32Array(data.length);
        }

        this.uvMatrix.multiplyUvs(data, this.data);

        this._updateID++;
    }
}
