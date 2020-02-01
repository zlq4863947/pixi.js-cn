import { Mesh } from '@pixi/mesh';
import { settings } from './settings';

/**
 * 使用Canvas渲染器渲染对象
 *
 * @private
 * @method _renderCanvas
 * @memberof PIXI.Mesh#
 * @param {PIXI.CanvasRenderer} renderer - Canvas渲染器
 */
Mesh.prototype._renderCanvas = function _renderCanvas(renderer)
{
    if (this.shader.uvMatrix)
    {
        this.shader.uvMatrix.update();
        this.calculateUvs();
    }

    this.material._renderCanvas(renderer, this);
};

// 重要提示：请不要将此作为先例，在创建对象后使用`settings`，这仅仅是为了将画布与基础网格类完全解耦而创建的，
// 并且我们无法再在构造函数中添加`canvasPadding`，适用于PixiJS v4。

/**
 * Internal variable for `canvasPadding`.
 *
 * @private
 * @memberof PIXI.Mesh
 * @member {number}
 * @default null
 */
Mesh.prototype._canvasPadding = null;

/**
 * Triangles in canvas mode are automatically antialiased, use this value to force triangles
 * to overlap a bit with each other. To set the global default, set {@link PIXI.settings.MESH_CANVAS_PADDING}
 *
 * @see PIXI.settings.MESH_CANVAS_PADDING
 * @member {number} canvasPadding
 * @memberof PIXI.SimpleMesh#
 * @default 0
 */
Object.defineProperty(Mesh.prototype, 'canvasPadding', {
    get()
    {
        return this._canvasPadding !== null ? this._canvasPadding : settings.MESH_CANVAS_PADDING;
    },
    set(value)
    {
        this._canvasPadding = value;
    },
});
