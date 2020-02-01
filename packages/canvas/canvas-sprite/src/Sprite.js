import { Sprite } from '@pixi/sprite';

/**
 * 缓存有色纹理。
 * @memberof PIXI.Sprite#
 * @member {HTMLCanvasElement} _tintedCanvas
 * @protected
 */
Sprite.prototype._tintedCanvas = null;

/**
* 使用Canvas渲染器渲染对象
*
* @private
* @method _renderCanvas
* @memberof PIXI.Sprite#
* @param {PIXI.CanvasRenderer} renderer -渲染器
*/
Sprite.prototype._renderCanvas = function _renderCanvas(renderer)
{
    renderer.plugins.sprite.render(this);
};
