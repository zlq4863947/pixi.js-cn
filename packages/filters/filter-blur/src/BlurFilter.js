import { Filter } from '@pixi/core';
import { settings } from '@pixi/settings';
import { BlurFilterPass } from './BlurFilterPass';
import { CLEAR_MODES } from '@pixi/constants';

/**
 * BlurFilter将高斯模糊应用于对象。
 *
 * 可以分别为x轴和y轴设置模糊强度。
 *
 * @class
 * @extends PIXI.Filter
 * @memberof PIXI.filters
 */
export class BlurFilter extends Filter
{
    /**
     * @param {number} [strength=8] - 模糊滤镜的强度。
     * @param {number} [quality=4] - 模糊滤镜的质量。
     * @param {number} [resolution] - 模糊滤镜的分辨率。
     * @param {number} [kernelSize=5] - 模糊滤镜的kernelSize选项：5、7、9、11、13、15
     */
    constructor(strength, quality, resolution, kernelSize)
    {
        super();

        this.blurXFilter = new BlurFilterPass(true, strength, quality, resolution, kernelSize);
        this.blurYFilter = new BlurFilterPass(false, strength, quality, resolution, kernelSize);

        this.resolution = resolution || settings.RESOLUTION;
        this.quality = quality || 4;
        this.blur = strength || 8;

        this.repeatEdgePixels = false;
    }

    /**
     * 应用滤镜。
     *
     * @param {PIXI.systems.FilterSystem} filterManager - 管理器。
     * @param {PIXI.RenderTexture} input - 输入目标。
     * @param {PIXI.RenderTexture} output - 输出目标。
     * @param {PIXI.CLEAR_MODES} clearMode - 如何清除
     */
    apply(filterManager, input, output, clearMode)
    {
        const xStrength = Math.abs(this.blurXFilter.strength);
        const yStrength = Math.abs(this.blurYFilter.strength);

        if (xStrength && yStrength)
        {
            const renderTarget = filterManager.getFilterTexture();

            this.blurXFilter.apply(filterManager, input, renderTarget, CLEAR_MODES.CLEAR);
            this.blurYFilter.apply(filterManager, renderTarget, output, clearMode);

            filterManager.returnFilterTexture(renderTarget);
        }
        else if (yStrength)
        {
            this.blurYFilter.apply(filterManager, input, output, clearMode);
        }
        else
        {
            this.blurXFilter.apply(filterManager, input, output, clearMode);
        }
    }

    updatePadding()
    {
        if (this._repeatEdgePixels)
        {
            this.padding = 0;
        }
        else
        {
            this.padding = Math.max(Math.abs(this.blurXFilter.strength), Math.abs(this.blurYFilter.strength)) * 2;
        }
    }

    /**
     * 同时设置蓝色和模糊属性的强度
     *
     * @member {number}
     * @default 2
     */
    get blur()
    {
        return this.blurXFilter.blur;
    }

    set blur(value) // eslint-disable-line require-jsdoc
    {
        this.blurXFilter.blur = this.blurYFilter.blur = value;
        this.updatePadding();
    }

    /**
     * 设置模糊的通过次数。 通过次数越多意味着质量越高。
     *
     * @member {number}
     * @default 1
     */
    get quality()
    {
        return this.blurXFilter.quality;
    }

    set quality(value) // eslint-disable-line require-jsdoc
    {
        this.blurXFilter.quality = this.blurYFilter.quality = value;
    }

    /**
     * 设置blurX属性的强度
     *
     * @member {number}
     * @default 2
     */
    get blurX()
    {
        return this.blurXFilter.blur;
    }

    set blurX(value) // eslint-disable-line require-jsdoc
    {
        this.blurXFilter.blur = value;
        this.updatePadding();
    }

    /**
     * 设置blurY属性的强度
     *
     * @member {number}
     * @default 2
     */
    get blurY()
    {
        return this.blurYFilter.blur;
    }

    set blurY(value) // eslint-disable-line require-jsdoc
    {
        this.blurYFilter.blur = value;
        this.updatePadding();
    }

    /**
     * 设置滤镜的混合模式
     *
     * @member {number}
     * @default PIXI.BLEND_MODES.NORMAL
     */
    get blendMode()
    {
        return this.blurYFilter.blendMode;
    }

    set blendMode(value) // eslint-disable-line require-jsdoc
    {
        this.blurYFilter.blendMode = value;
    }

    /**
     * 如果设置为true，则目标的边缘将被夹紧
     *
     * @member {bool}
     * @default false
     */
    get repeatEdgePixels()
    {
        return this._repeatEdgePixels;
    }

    set repeatEdgePixels(value)
    {
        this._repeatEdgePixels = value;
        this.updatePadding();
    }
}
