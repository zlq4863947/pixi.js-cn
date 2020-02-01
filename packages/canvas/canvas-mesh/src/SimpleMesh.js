import { SimpleMesh } from '@pixi/mesh-extras';

/**
 * 使用Canvas渲染器渲染对象
 *
 * @private
 * @method _renderCanvas
 * @memberof PIXI.Mesh#
 * @param {PIXI.CanvasRenderer} renderer - 画布渲染器。
 */
SimpleMesh.prototype._renderCanvas = function _renderCanvas(renderer)
{
    if (this.autoUpdate)
    {
        this.geometry.getBuffer('aVertexPosition').update();
    }

    if (this.shader.update)
    {
        this.shader.update();
    }

    this.calculateUvs();

    this.material._renderCanvas(renderer, this);
};
