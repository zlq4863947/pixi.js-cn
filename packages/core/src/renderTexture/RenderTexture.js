import { BaseRenderTexture } from './BaseRenderTexture';
import { Texture } from '../textures/Texture';

/**
 * RenderTexture是一种特殊的纹理，它允许将任何PixiJS显示对象渲染给它。
 *
 * __Hint__: 所有渲染到RenderTexture的显示对象（即精灵）都应预加载
 * 否则将绘制黑色矩形。
 *
 * __Hint-2__: 实际内存分配将在第一次渲染时发生。
 * 您不应该仅在删除每个帧之后创建renderTextures，而是尝试重用它们。
 *
 * RenderTexture获取指定给其呈现方法的任何显示对象的快照。例如：
 *
 * ```js
 * let renderer = PIXI.autoDetectRenderer();
 * let renderTexture = PIXI.RenderTexture.create(800, 600);
 * let sprite = PIXI.Sprite.from("spinObj_01.png");
 *
 * sprite.position.x = 800/2;
 * sprite.position.y = 600/2;
 * sprite.anchor.x = 0.5;
 * sprite.anchor.y = 0.5;
 *
 * renderer.render(sprite, renderTexture);
 * ```
 *
 * 本例中的精灵将使用其局部变换进行渲染。在0,0渲染此精灵
 * 你可以清除转换
 *
 * ```js
 *
 * sprite.setTransform()
 *
 * let renderTexture = new PIXI.RenderTexture.create(100, 100);
 *
 * renderer.render(sprite, renderTexture);  // 渲染到RenderTexture的中心
 * ```
 *
 * @class
 * @extends PIXI.Texture
 * @memberof PIXI
 */
export class RenderTexture extends Texture
{
    /**
     * @param {PIXI.BaseRenderTexture} baseRenderTexture - 此纹理使用的基础纹理对象
     * @param {PIXI.Rectangle} [frame] - The rectangle frame of the texture to show
     */
    constructor(baseRenderTexture, frame)
    {
        // support for legacy..
        let _legacyRenderer = null;

        if (!(baseRenderTexture instanceof BaseRenderTexture))
        {
            /* eslint-disable prefer-rest-params, no-console */
            const width = arguments[1];
            const height = arguments[2];
            const scaleMode = arguments[3];
            const resolution = arguments[4];

            // we have an old render texture..
            console.warn(`Please use RenderTexture.create(${width}, ${height}) instead of the ctor directly.`);
            _legacyRenderer = arguments[0];
            /* eslint-enable prefer-rest-params, no-console */

            frame = null;
            baseRenderTexture = new BaseRenderTexture({
                width,
                height,
                scaleMode,
                resolution,
            });
        }

        /**
         * 此纹理使用的基础纹理对象
         *
         * @member {PIXI.BaseTexture}
         */
        super(baseRenderTexture, frame);

        this.legacyRenderer = _legacyRenderer;

        /**
         * 这将使渲染器知道纹理是否有效。 如果不是，则无法渲染。
         *
         * @member {boolean}
         */
        this.valid = true;

        /**
         * Stores 当此纹理位于当前滤镜堆栈中时存储`sourceFrame`。
         * 你可以在滤镜里面读取它。
         *
         * @readonly
         * @member {PIXI.Rectangle}
         */
        this.filterFrame = null;

        /**
         * FilterSystem混合纹理的key
         * @protected
         * @member {string}
         */
        this.filterPoolKey = null;

        this.updateUvs();
    }

    /**
     * 调整RenderTexture的大小。
     *
     * @param {number} width - 要调整大小的宽度。
     * @param {number} height - 要调整大小的高度。
     * @param {boolean} [resizeBaseTexture=true] - 是否需要baseTexture.width和height值也调整大小？
     */
    resize(width, height, resizeBaseTexture = true)
    {
        width = Math.ceil(width);
        height = Math.ceil(height);

        // TODO - could be not required..
        this.valid = (width > 0 && height > 0);

        this._frame.width = this.orig.width = width;
        this._frame.height = this.orig.height = height;

        if (resizeBaseTexture)
        {
            this.baseTexture.resize(width, height);
        }

        this.updateUvs();
    }

    /**
     * 更改baseTexture的分辨率，但不更改帧缓冲区大小。
     *
     * @param {number} resolution - 应用于RenderTexture的新分辨率
     */
    setResolution(resolution)
    {
        const { baseTexture } = this;

        if (baseTexture.resolution === resolution)
        {
            return;
        }

        baseTexture.setResolution(resolution);
        this.resize(baseTexture.width, baseTexture.height, false);
    }

    /**
     * 创建渲染纹理的简单方法。
     *
     * @param {object} [options] - Options
     * @param {number} [options.width=100] - 渲染纹理的宽度
     * @param {number} [options.height=100] - 渲染纹理的高度
     * @param {number} [options.scaleMode=PIXI.settings.SCALE_MODE] - 有关可选值，请参见{@link PIXI.SCALE_MODES}
     * @param {number} [options.resolution=1] - 生成的纹理的分辨率/设备像素比
     * @return {PIXI.RenderTexture} 新的渲染纹理
     */
    static create(options)
    {
        // fallback, old-style: create(width, height, scaleMode, resolution)
        if (typeof options === 'number')
        {
            /* eslint-disable prefer-rest-params */
            options = {
                width: options,
                height: arguments[1],
                scaleMode: arguments[2],
                resolution: arguments[3],
            };
            /* eslint-enable prefer-rest-params */
        }

        return new RenderTexture(new BaseRenderTexture(options));
    }
}
