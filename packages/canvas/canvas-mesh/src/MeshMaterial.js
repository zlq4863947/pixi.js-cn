import { MeshMaterial } from '@pixi/mesh';

/**
 * 使用画布渲染器渲染网格
 *
 * @protected
 * @method render
 * @memberof PIXI.MeshMaterial#
 * @param {PIXI.CanvasRenderer} renderer - 画布渲染器。
 * @param {PIXI.Mesh} mesh - 要渲染的网格。
 */
MeshMaterial.prototype._renderCanvas = function _renderCanvas(renderer, mesh)
{
    renderer.plugins.mesh.render(mesh);
};
