import { RenderTexture } from '@pixi/core';
import { CanvasRenderTarget } from '@pixi/utils';
import { Rectangle } from '@pixi/math';

const TEMP_RECT = new Rectangle();

/**
 * 提取管理器提供了从渲染器导出内容的功能。
 *
 * 此类的实例默认情况下会自动创建，可以在`renderer.plugins.extract`中找到
 *
 * @class
 * @memberof PIXI
 */
export class CanvasExtract
{
    /**
     * @param {PIXI.CanvasRenderer} renderer - 对当前渲染器的引用
     */
    constructor(renderer)
    {
        this.renderer = renderer;
        /**
         * 从显示对象或渲染纹理中提取数据（图像，像素等）的方法集合
         *
         * @member {PIXI.CanvasExtract} extract
         * @memberof PIXI.CanvasRenderer#
         * @see PIXI.CanvasExtract
         */
        renderer.extract = this;
    }

    /**
     * 将返回目标的HTML图像
     *
     * @param {PIXI.DisplayObject|PIXI.RenderTexture} target - 要转换的displayObject或renderTexture。如果留空，将使用主渲染器
     * @param {string} [format] - 图像格式，例如. "image/jpeg" 或 "image/webp".
     * @param {number} [quality] - JPEG或Webp压缩从0到1。默认值为0.92。
     * @return {HTMLImageElement} 目标的HTML图像
     */
    image(target, format, quality)
    {
        const image = new Image();

        image.src = this.base64(target, format, quality);

        return image;
    }

    /**
     * 将返回此目标的base64编码字符串。它的工作方式是调用`CanvasExtract.getCanvas`，然后在上面运行toDataURL。
     *
     * @param {PIXI.DisplayObject|PIXI.RenderTexture} target - 要转换的displayObject或renderTexture。如果留空，将使用主渲染器
     * @param {string} [format] - 图像格式，例如. "image/jpeg" 或 "image/webp".
     * @param {number} [quality] - JPEG或Webp压缩从0到1。默认值为0.92。
     * @return {string} 纹理的base64编码字符串。
     */
    base64(target, format, quality)
    {
        return this.canvas(target).toDataURL(format, quality);
    }

    /**
     * 创建画布元素，将此目标渲染给它，然后返回它。
     *
     * @param {PIXI.DisplayObject|PIXI.RenderTexture} target - 要转换的displayObject或renderTexture。如果留空，将使用主渲染器
     * @return {HTMLCanvasElement} 具有渲染纹理的画布元素。
     */
    canvas(target)
    {
        const renderer = this.renderer;
        let context;
        let resolution;
        let frame;
        let renderTexture;

        if (target)
        {
            if (target instanceof RenderTexture)
            {
                renderTexture = target;
            }
            else
            {
                renderTexture = renderer.generateTexture(target);
            }
        }

        if (renderTexture)
        {
            context = renderTexture.baseTexture._canvasRenderTarget.context;
            resolution = renderTexture.baseTexture._canvasRenderTarget.resolution;
            frame = renderTexture.frame;
        }
        else
        {
            context = renderer.rootContext;
            resolution = renderer.resolution;
            frame = TEMP_RECT;
            frame.width = this.renderer.width;
            frame.height = this.renderer.height;
        }

        const width = Math.floor((frame.width * resolution) + 1e-4);
        const height = Math.floor((frame.height * resolution) + 1e-4);

        const canvasBuffer = new CanvasRenderTarget(width, height, 1);
        const canvasData = context.getImageData(frame.x * resolution, frame.y * resolution, width, height);

        canvasBuffer.context.putImageData(canvasData, 0, 0);

        // send the canvas back..
        return canvasBuffer.canvas;
    }

    /**
     * 将返回一维数组，该数组以RGBA顺序包含整个纹理的像素数据，且整数值介于0和255之间（包括）。
     *
     * @param {PIXI.DisplayObject|PIXI.RenderTexture} target - 要转换的displayObject或renderTexture。如果留空，将使用主渲染器
     * @return {Uint8ClampedArray} 一维数组，包含整个纹理的像素数据
     */
    pixels(target)
    {
        const renderer = this.renderer;
        let context;
        let resolution;
        let frame;
        let renderTexture;

        if (target)
        {
            if (target instanceof RenderTexture)
            {
                renderTexture = target;
            }
            else
            {
                renderTexture = renderer.generateTexture(target);
            }
        }

        if (renderTexture)
        {
            context = renderTexture.baseTexture._canvasRenderTarget.context;
            resolution = renderTexture.baseTexture._canvasRenderTarget.resolution;
            frame = renderTexture.frame;
        }
        else
        {
            context = renderer.rootContext;

            frame = TEMP_RECT;
            frame.width = renderer.width;
            frame.height = renderer.height;
        }

        return context.getImageData(0, 0, frame.width * resolution, frame.height * resolution).data;
    }

    /**
     * 销毁提取管理器
     *
     */
    destroy()
    {
        this.renderer.extract = null;
        this.renderer = null;
    }
}
