/**
 * 批处理程序用于构建纹理批处理。
 * 存放纹理及其各自位置的列表。
 *
 * @class
 * @memberof PIXI
 */
export class BatchTextureArray
{
    constructor()
    {
        /**
         * 内部纹理数组
         * @member {PIXI.BaseTexture[]}
         */
        this.elements = [];
        /**
         * 各个纹理位置
         * @member {number[]}
         */
        this.ids = [];
        /**
         * 填充元素数
         * @member {number}
         */
        this.count = 0;
    }

    clear()
    {
        for (let i = 0; i < this.count; i++)
        {
            this.elements[i] = null;
        }
        this.count = 0;
    }
}
