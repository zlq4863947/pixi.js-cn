import { BaseTexture } from '@pixi/core';

/**
 * 获取可绘制的源，例如HTMLCanvasElement或HTMLImageElement，
 * 它们适合使用CanvasRenderer进行渲染。由 **@pixi/canvas-renderer** 包提供。
 * @method getDrawableSource
 * @memberof PIXI.BaseTexture#
 * @return {PIXI.ICanvasImageSource} 使用CanvasRenderer渲染的源
 */
BaseTexture.prototype.getDrawableSource = function getDrawableSource()
{
    const resource = this.resource;

    return resource ? (resource.bitmap || resource.source) : this.source;
};
