import { BaseTexture } from '@pixi/core';
import { BasePrepare } from '@pixi/prepare';

const CANVAS_START_SIZE = 16;

/**
 * 准备管理器提供了将内容上传到GPU的功能。
 *
 * 不能像WebGL中那样直接对Canvas进行此操作，但是可以通过将纹理绘制到脱机画布上来实现效果。
 * 该绘制调用将强制将纹理移至GPU上。
 *
 * 此类的实例默认情况下会自动创建，可以在`renderer.plugins.prepare`中找到
 *
 * @class
 * @extends PIXI.BasePrepare
 * @memberof PIXI
 */
export class CanvasPrepare extends BasePrepare
{
    /**
     * @param {PIXI.CanvasRenderer} renderer - 对当前渲染器的引用
     */
    constructor(renderer)
    {
        super(renderer);

        this.uploadHookHelper = this;

        /**
        * 离线画布以将纹理渲染到
        * @type {HTMLCanvasElement}
        * @private
        */
        this.canvas = document.createElement('canvas');
        this.canvas.width = CANVAS_START_SIZE;
        this.canvas.height = CANVAS_START_SIZE;

        /**
         * 画布的上下文
        * @type {CanvasRenderingContext2D}
        * @private
        */
        this.ctx = this.canvas.getContext('2d');

        // Add textures to upload
        this.registerUploadHook(uploadBaseTextures);
    }

    /**
     * 销毁插件，此后请勿使用。
     *
     */
    destroy()
    {
        super.destroy();
        this.ctx = null;
        this.canvas = null;
    }
}

/**
 * 内置钩子将PIXI.Texture对象上传到GPU。
 *
 * @private
 * @param {*} prepare - CanvasPrepare实例
 * @param {*} item - 检查项目
 * @return {boolean} true:项目已上传。
 */
function uploadBaseTextures(prepare, item)
{
    if (item instanceof BaseTexture)
    {
        const image = item.source;

        // Sometimes images (like atlas images) report a size of zero, causing errors on windows phone.
        // So if the width or height is equal to zero then use the canvas size
        // Otherwise use whatever is smaller, the image dimensions or the canvas dimensions.
        const imageWidth = image.width === 0 ? prepare.canvas.width : Math.min(prepare.canvas.width, image.width);
        const imageHeight = image.height === 0 ? prepare.canvas.height : Math.min(prepare.canvas.height, image.height);

        // Only a small subsections is required to be drawn to have the whole texture uploaded to the GPU
        // A smaller draw can be faster.
        prepare.ctx.drawImage(image, 0, 0, imageWidth, imageHeight, 0, 0, prepare.canvas.width, prepare.canvas.height);

        return true;
    }

    return false;
}
