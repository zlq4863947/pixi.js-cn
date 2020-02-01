import { SimpleRope } from '@pixi/mesh-extras';

/**
 * 使用Canvas渲染器渲染对象
 *
 * @protected
 * @method _renderCanvas
 * @memberof PIXI.Mesh#
 * @param {PIXI.CanvasRenderer} renderer - 画布渲染器。
 */
SimpleRope.prototype._renderCanvas = function _renderCanvas(renderer)
{
    if (this.autoUpdate
        || this.geometry.width !== this.shader.texture.height)
    {
        this.geometry.width = this.shader.texture.height;
        this.geometry.update();
    }

    if (this.shader.update)
    {
        this.shader.update();
    }

    this.calculateUvs();

    this.material._renderCanvas(renderer, this);
};
