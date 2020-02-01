import { hex2rgb, rgb2hex } from '@pixi/utils';
import { canUseNewCanvasBlendModes } from './utils/canUseNewCanvasBlendModes';

/**
 * 精灵/纹理着色的实用方法。
 *
 * 使用CanvasRenderer进行着色涉及创建一个新的画布以用作纹理，因此请注意性能影响。
 *
 * @namespace PIXI.canvasUtils
 * @memberof PIXI
 */
export const canvasUtils = {
    /**
     * 基本上，此方法只需要一个精灵和一种颜色，并使用指定的颜色对该精灵进行着色。
     *
     * @memberof PIXI.canvasUtils
     * @param {PIXI.Sprite} sprite - 要着色的精灵
     * @param {number} color - 用于将精灵着色的颜色
     * @return {HTMLCanvasElement} 着色后的canvas
     */
    getTintedCanvas: (sprite, color) =>
    {
        const texture = sprite.texture;

        color = canvasUtils.roundColor(color);

        const stringColor = `#${(`00000${(color | 0).toString(16)}`).substr(-6)}`;

        texture.tintCache = texture.tintCache || {};

        const cachedCanvas = texture.tintCache[stringColor];

        let canvas;

        if (cachedCanvas)
        {
            if (cachedCanvas.tintId === texture._updateID)
            {
                return texture.tintCache[stringColor];
            }

            canvas = texture.tintCache[stringColor];
        }
        else
        {
            canvas = canvasUtils.canvas || document.createElement('canvas');
        }

        canvasUtils.tintMethod(texture, color, canvas);

        canvas.tintId = texture._updateID;

        if (canvasUtils.convertTintToImage)
        {
            // is this better?
            const tintImage = new Image();

            tintImage.src = canvas.toDataURL();

            texture.tintCache[stringColor] = tintImage;
        }
        else
        {
            texture.tintCache[stringColor] = canvas;
            // if we are not converting the texture to an image then we need to lose the reference to the canvas
            canvasUtils.canvas = null;
        }

        return canvas;
    },

    /**
     * 使用'multiply'操作着色纹理。
     * @memberof PIXI.canvasUtils
     * @param {PIXI.Texture} texture - 要着色的纹理
     * @param {number} color - 用于将精灵着色的颜色
     * @param {HTMLCanvasElement} canvas - 当前canvas
     */
    tintWithMultiply: (texture, color, canvas) =>
    {
        const context = canvas.getContext('2d');
        const crop = texture._frame.clone();
        const resolution = texture.baseTexture.resolution;

        crop.x *= resolution;
        crop.y *= resolution;
        crop.width *= resolution;
        crop.height *= resolution;

        canvas.width = Math.ceil(crop.width);
        canvas.height = Math.ceil(crop.height);

        context.save();
        context.fillStyle = `#${(`00000${(color | 0).toString(16)}`).substr(-6)}`;

        context.fillRect(0, 0, crop.width, crop.height);

        context.globalCompositeOperation = 'multiply';

        const source = texture.baseTexture.getDrawableSource();

        context.drawImage(
            source,
            crop.x,
            crop.y,
            crop.width,
            crop.height,
            0,
            0,
            crop.width,
            crop.height,
        );

        context.globalCompositeOperation = 'destination-atop';

        context.drawImage(
            source,
            crop.x,
            crop.y,
            crop.width,
            crop.height,
            0,
            0,
            crop.width,
            crop.height,
        );
        context.restore();
    },

    /**
     * 使用'overlay'操作着色纹理。
     *
     * @memberof PIXI.canvasUtils
     * @param {PIXI.Texture} texture - 要着色的纹理
     * @param {number} color - 用于将精灵着色的颜色
     * @param {HTMLCanvasElement} canvas - 当前canvas
     */
    tintWithOverlay(texture, color, canvas)
    {
        const context = canvas.getContext('2d');
        const crop = texture._frame.clone();
        const resolution = texture.baseTexture.resolution;

        crop.x *= resolution;
        crop.y *= resolution;
        crop.width *= resolution;
        crop.height *= resolution;

        canvas.width = Math.ceil(crop.width);
        canvas.height = Math.ceil(crop.height);

        context.save();
        context.globalCompositeOperation = 'copy';
        context.fillStyle = `#${(`00000${(color | 0).toString(16)}`).substr(-6)}`;
        context.fillRect(0, 0, crop.width, crop.height);

        context.globalCompositeOperation = 'destination-atop';
        context.drawImage(
            texture.baseTexture.getDrawableSource(),
            crop.x,
            crop.y,
            crop.width,
            crop.height,
            0,
            0,
            crop.width,
            crop.height,
        );

        // context.globalCompositeOperation = 'copy';
        context.restore();
    },

    /**
     * 为每个像素着色纹理像素。
     *
     * @memberof PIXI.canvasUtils
     * @param {PIXI.Texture} texture - 要着色的纹理
     * @param {number} color - 用于将精灵着色的颜色
     * @param {HTMLCanvasElement} canvas - 当前canvas
     */
    tintWithPerPixel: (texture, color, canvas) =>
    {
        const context = canvas.getContext('2d');
        const crop = texture._frame.clone();
        const resolution = texture.baseTexture.resolution;

        crop.x *= resolution;
        crop.y *= resolution;
        crop.width *= resolution;
        crop.height *= resolution;

        canvas.width = Math.ceil(crop.width);
        canvas.height = Math.ceil(crop.height);

        context.save();
        context.globalCompositeOperation = 'copy';
        context.drawImage(
            texture.baseTexture.getDrawableSource(),
            crop.x,
            crop.y,
            crop.width,
            crop.height,
            0,
            0,
            crop.width,
            crop.height,
        );
        context.restore();

        const rgbValues = hex2rgb(color);
        const r = rgbValues[0];
        const g = rgbValues[1];
        const b = rgbValues[2];

        const pixelData = context.getImageData(0, 0, crop.width, crop.height);

        const pixels = pixelData.data;

        for (let i = 0; i < pixels.length; i += 4)
        {
            pixels[i + 0] *= r;
            pixels[i + 1] *= g;
            pixels[i + 2] *= b;
        }

        context.putImageData(pixelData, 0, 0);
    },

    /**
     * 根据canvasUtils.cacheStepsPerColorChannel舍入指定的颜色
     *
     * @memberof PIXI.canvasUtils
     * @param {number} color - 要舍入的颜色，应该是十六进制的颜色
     * @return {number} 舍入的颜色
     */
    roundColor: (color) =>
    {
        const step = canvasUtils.cacheStepsPerColorChannel;

        const rgbValues = hex2rgb(color);

        rgbValues[0] = Math.min(255, (rgbValues[0] / step) * step);
        rgbValues[1] = Math.min(255, (rgbValues[1] / step) * step);
        rgbValues[2] = Math.min(255, (rgbValues[2] / step) * step);

        return rgb2hex(rgbValues);
    },

    /**
     * 四舍五入时将用作上限的步骤数。
     *
     * @memberof PIXI.canvasUtils
     * @type {number}
     */
    cacheStepsPerColorChannel: 8,

    /**
     * 着色缓存布尔标志
     *
     * @memberof PIXI.canvasUtils
     * @type {boolean}
     */
    convertTintToImage: false,

    /**
     * 无论是否支持Canvas 混合模式(BlendModes)，都可以使用multiply方法进行着色。
     *
     * @memberof PIXI.canvasUtils
     * @type {boolean}
     */
    canUseMultiply: canUseNewCanvasBlendModes(),

    /**
     * 将要使用的着色方法。
     *
     * @memberof PIXI.canvasUtils
     * @type {Function}
     */
    tintMethod: () =>
    { // jslint-disable no-empty-function

    },
};

canvasUtils.tintMethod = canvasUtils.canUseMultiply ? canvasUtils.tintWithMultiply : canvasUtils.tintWithPerPixel;
