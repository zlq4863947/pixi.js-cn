import { RenderTexture } from '@pixi/core';
import { CanvasRenderTarget } from '@pixi/utils';
import { Rectangle } from '@pixi/math';

const TEMP_RECT = new Rectangle();
const BYTES_PER_PIXEL = 4;

/**
 * 此类提供了特定于渲染器的插件，用于从渲染器中导出内容。
 * 例如，这些插件可用于保存Image，Canvas元素或导出原始图像数据（像素）。
 *
 * 不要直接实例化这些插件 可以通过 `renderer.plugins` 属性获得。
 * 查看 {@link PIXI.CanvasRenderer#plugins} 或 {@link PIXI.Renderer#plugins}.
 * @example
 * // 创建一个新应用（将提取插件自动添加到渲染器）
 * const app = new PIXI.Application();
 *
 * // 画一个红色圆圈
 * const graphics = new PIXI.Graphics()
 *     .beginFill(0xFF0000)
 *     .drawCircle(0, 0, 50);
 *
 * // 将图形渲染为HTMLImageElement
 * const image = app.renderer.plugins.extract.image(graphics);
 * document.body.appendChild(image);
 * @class
 * @memberof PIXI
 */
export class Extract
{
    /**
     * @param {PIXI.Renderer} renderer - A reference to the current renderer
     */
    constructor(renderer)
    {
        this.renderer = renderer;
        /**
         * Collection of methods for extracting data (image, pixels, etc.) from a display object or render texture
         *
         * @member {PIXI.Extract} extract
         * @memberof PIXI.Renderer#
         * @see PIXI.Extract
         */
        renderer.extract = this;
    }

    /**
     * 将返回目标的HTML图像
     *
     * @param {PIXI.DisplayObject|PIXI.RenderTexture} target - 要转换的displayObject或renderTexture。
     *  如果保留为空，将使用主渲染器
     * @param {string} [format] - 图像格式，例如 "image/jpeg" 或 "image/webp"。
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
     * 将返回目标的base64编码的字符串。 它通过调用`Extract.getCanvas`，然后在其上运行toDataURL来工作。
     *
     * @param {PIXI.DisplayObject|PIXI.RenderTexture} target - A displayObject or renderTexture
     *  to convert. If left empty will use the main renderer
     * @param {string} [format] - Image format, e.g. "image/jpeg" or "image/webp".
     * @param {number} [quality] - JPEG or Webp compression from 0 to 1. Default is 0.92.
     * @return {string} A base64 encoded string of the texture.
     */
    base64(target, format, quality)
    {
        return this.canvas(target).toDataURL(format, quality);
    }

    /**
     * Creates a Canvas element, renders this target to it and then returns it.
     *
     * @param {PIXI.DisplayObject|PIXI.RenderTexture} target - A displayObject or renderTexture
     *  to convert. If left empty will use the main renderer
     * @return {HTMLCanvasElement} A Canvas element with the texture rendered on.
     */
    canvas(target)
    {
        const renderer = this.renderer;
        let resolution;
        let frame;
        let flipY = false;
        let renderTexture;
        let generated = false;

        if (target)
        {
            if (target instanceof RenderTexture)
            {
                renderTexture = target;
            }
            else
            {
                renderTexture = this.renderer.generateTexture(target);
                generated = true;
            }
        }

        if (renderTexture)
        {
            resolution = renderTexture.baseTexture.resolution;
            frame = renderTexture.frame;
            flipY = false;
            renderer.renderTexture.bind(renderTexture);
        }
        else
        {
            resolution = this.renderer.resolution;

            flipY = true;

            frame = TEMP_RECT;
            frame.width = this.renderer.width;
            frame.height = this.renderer.height;

            renderer.renderTexture.bind(null);
        }

        const width = Math.floor((frame.width * resolution) + 1e-4);
        const height = Math.floor((frame.height * resolution) + 1e-4);

        const canvasBuffer = new CanvasRenderTarget(width, height, 1);

        const webglPixels = new Uint8Array(BYTES_PER_PIXEL * width * height);

        // read pixels to the array
        const gl = renderer.gl;

        gl.readPixels(
            frame.x * resolution,
            frame.y * resolution,
            width,
            height,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            webglPixels,
        );

        // add the pixels to the canvas
        const canvasData = canvasBuffer.context.getImageData(0, 0, width, height);

        Extract.arrayPostDivide(webglPixels, canvasData.data);

        canvasBuffer.context.putImageData(canvasData, 0, 0);

        // pulling pixels
        if (flipY)
        {
            canvasBuffer.context.scale(1, -1);
            canvasBuffer.context.drawImage(canvasBuffer.canvas, 0, -height);
        }

        if (generated)
        {
            renderTexture.destroy(true);
        }

        // send the canvas back..
        return canvasBuffer.canvas;
    }

    /**
     * Will return a one-dimensional array containing the pixel data of the entire texture in RGBA
     * order, with integer values between 0 and 255 (included).
     *
     * @param {PIXI.DisplayObject|PIXI.RenderTexture} target - A displayObject or renderTexture
     *  to convert. If left empty will use the main renderer
     * @return {Uint8Array} One-dimensional array containing the pixel data of the entire texture
     */
    pixels(target)
    {
        const renderer = this.renderer;
        let resolution;
        let frame;
        let renderTexture;
        let generated = false;

        if (target)
        {
            if (target instanceof RenderTexture)
            {
                renderTexture = target;
            }
            else
            {
                renderTexture = this.renderer.generateTexture(target);
                generated = true;
            }
        }

        if (renderTexture)
        {
            resolution = renderTexture.baseTexture.resolution;
            frame = renderTexture.frame;

            // bind the buffer
            renderer.renderTexture.bind(renderTexture);
        }
        else
        {
            resolution = renderer.resolution;

            frame = TEMP_RECT;
            frame.width = renderer.width;
            frame.height = renderer.height;

            renderer.renderTexture.bind(null);
        }

        const width = frame.width * resolution;
        const height = frame.height * resolution;

        const webglPixels = new Uint8Array(BYTES_PER_PIXEL * width * height);

        // read pixels to the array
        const gl = renderer.gl;

        gl.readPixels(
            frame.x * resolution,
            frame.y * resolution,
            width,
            height,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            webglPixels,
        );

        if (generated)
        {
            renderTexture.destroy(true);
        }

        Extract.arrayPostDivide(webglPixels, webglPixels);

        return webglPixels;
    }

    /**
     * Destroys the extract
     *
     */
    destroy()
    {
        this.renderer.extract = null;
        this.renderer = null;
    }

    /**
     * Takes premultiplied pixel data and produces regular pixel data
     *
     * @private
     * @param pixels {number[] | Uint8Array | Uint8ClampedArray} array of pixel data
     * @param out {number[] | Uint8Array | Uint8ClampedArray} output array
     */
    static arrayPostDivide(pixels, out)
    {
        for (let i = 0; i < pixels.length; i += 4)
        {
            const alpha = out[i + 3] = pixels[i + 3];

            if (alpha !== 0)
            {
                out[i] = Math.round(Math.min(pixels[i] * 255.0 / alpha, 255.0));
                out[i + 1] = Math.round(Math.min(pixels[i + 1] * 255.0 / alpha, 255.0));
                out[i + 2] = Math.round(Math.min(pixels[i + 2] * 255.0 / alpha, 255.0));
            }
            else
            {
                out[i] = pixels[i];
                out[i + 1] = pixels[i + 1];
                out[i + 2] = pixels[i + 2];
            }
        }
    }
}
