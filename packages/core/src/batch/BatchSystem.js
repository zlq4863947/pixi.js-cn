import { System } from '../System';
import { ObjectRenderer } from './ObjectRenderer';

/**
 * 渲染器的系统插件，用于管理批处理。
 *
 * @class
 * @extends PIXI.System
 * @memberof PIXI.systems
 */
export class BatchSystem extends System
{
    /**
     * @param {PIXI.Renderer} renderer - 此系统适用的渲染器。
     */
    constructor(renderer)
    {
        super(renderer);

        /**
         * 一个空的渲染器。
         *
         * @member {PIXI.ObjectRenderer}
         */
        this.emptyRenderer = new ObjectRenderer(renderer);

        /**
         * 当前活动的ObjectRenderer。
         *
         * @member {PIXI.ObjectRenderer}
         */
        this.currentRenderer = this.emptyRenderer;
    }

    /**
     * 将当前渲染器更改为参数中指定的渲染器
     *
     * @param {PIXI.ObjectRenderer} objectRenderer - 要使用的对象渲染器。
     */
    setObjectRenderer(objectRenderer)
    {
        if (this.currentRenderer === objectRenderer)
        {
            return;
        }

        this.currentRenderer.stop();
        this.currentRenderer = objectRenderer;

        this.currentRenderer.start();
    }

    /**
     * 如果您希望进行一些自定义渲染，则应调用此方法
     * 它基本上可以渲染任何可以成批渲染的对象，比如精灵
     */
    flush()
    {
        this.setObjectRenderer(this.emptyRenderer);
    }

    /**
     * 将系统重置为空渲染器
     */
    reset()
    {
        this.setObjectRenderer(this.emptyRenderer);
    }

    /**
     * 批处理渲染器的便捷功能：将第一个maxTextures位置中的绑定纹理复制到数组中
     * 为他们设置实际的_batchLocation
     *
     * @param arr
     * @param maxTextures
     */
    copyBoundTextures(arr, maxTextures)
    {
        const { boundTextures } = this.renderer.texture;

        for (let i = maxTextures - 1; i >= 0; --i)
        {
            arr[i] = boundTextures[i] || null;
            if (arr[i])
            {
                arr[i]._batchLocation = i;
            }
        }
    }

    /**
     * 根据boundTextures状态将批处理位置分配给数组中的纹理。
     * texArray中的所有纹理都应具有`_batchEnabled = _batchId`，
     * 并且其数量应小于“ maxTextures”。
     *
     * @param {PIXI.BatchTextureArray} texArray 要绑定的纹理
     * @param {PIXI.BaseTexture[]} boundTextures 绑定纹理的当前状态
     * @param {number} batchId texArray中纹理的_batchEnabled参数的标记
     * @param {number} maxTextures 要操纵的纹理位置数
     */
    boundArray(texArray, boundTextures, batchId, maxTextures)
    {
        const { elements, ids, count } = texArray;
        let j = 0;

        for (let i = 0; i < count; i++)
        {
            const tex = elements[i];
            const loc = tex._batchLocation;

            if (loc >= 0 && loc < maxTextures
                && boundTextures[loc] === tex)
            {
                ids[i] = loc;
                continue;
            }

            while (j < maxTextures)
            {
                const bound = boundTextures[j];

                if (bound && bound._batchEnabled === batchId
                    && bound._batchLocation === j)
                {
                    j++;
                    continue;
                }

                ids[i] = j;
                tex._batchLocation = j;
                boundTextures[j] = tex;
                break;
            }
        }
    }
}
