import { Graphics } from '@pixi/graphics';
import { CanvasRenderer } from '@pixi/canvas-renderer';
import { RenderTexture, Texture } from '@pixi/core';
import { Matrix } from '@pixi/math';

let canvasRenderer;
const tempMatrix = new Matrix();

/**
 * 生成画布纹理。 仅适用于 **pixi.js-legacy** 包或 **@pixi/canvas-graphics** 包。
 * @method generateCanvasTexture
 * @memberof PIXI.Graphics#
 * @param {number} scaleMode - 纹理的缩放模式。
 * @param {number} resolution - 纹理的分辨率。
 * @return {PIXI.Texture} 新的纹理
 */
Graphics.prototype.generateCanvasTexture = function generateCanvasTexture(scaleMode, resolution = 1)
{
    const bounds = this.getLocalBounds();

    const canvasBuffer = RenderTexture.create(bounds.width, bounds.height, scaleMode, resolution);

    if (!canvasRenderer)
    {
        canvasRenderer = new CanvasRenderer();
    }

    this.transform.updateLocalTransform();
    this.transform.localTransform.copyTo(tempMatrix);

    tempMatrix.invert();

    tempMatrix.tx -= bounds.x;
    tempMatrix.ty -= bounds.y;

    canvasRenderer.render(this, canvasBuffer, true, tempMatrix);

    const texture = Texture.from(canvasBuffer.baseTexture._canvasRenderTarget.canvas, {
        scaleMode,
    });

    texture.baseTexture.resolution = resolution;
    texture.baseTexture.update();

    return texture;
};

Graphics.prototype.cachedGraphicsData = [];

/**
 * 使用Canvas渲染器渲染对象
 *
 * @method _renderCanvas
 * @memberof PIXI.Graphics#
 * @private
 * @param {PIXI.CanvasRenderer} renderer - 渲染器
 */
Graphics.prototype._renderCanvas = function _renderCanvas(renderer)
{
    if (this.isMask === true)
    {
        return;
    }

    this.finishPoly();
    renderer.plugins.graphics.render(this);
};
