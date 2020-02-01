import { Text } from '@pixi/text';
import { Sprite } from '@pixi/sprite';

/**
 * 使用Canvas渲染器渲染对象
 *
 * @method _renderCanvas
 * @memberof PIXI.Text#
 * @private
 * @param {PIXI.CanvasRenderer} renderer - 渲染器
 */
Text.prototype._renderCanvas = function _renderCanvas(renderer)
{
    if (this._autoResolution && this._resolution !== renderer.resolution)
    {
        this._resolution = renderer.resolution;
        this.dirty = true;
    }

    this.updateText(true);

    Sprite.prototype._renderCanvas.call(this, renderer);
};
