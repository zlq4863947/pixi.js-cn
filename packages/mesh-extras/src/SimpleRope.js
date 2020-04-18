import { Mesh, MeshMaterial } from '@pixi/mesh';
import { WRAP_MODES } from '@pixi/constants';
import { RopeGeometry } from './geometry/RopeGeometry';

/**
 * 绳索使您可以在多个点上绘制纹理，然后操纵这些点
 *
 *```js
 * for (let i = 0; i < 20; i++) {
 *     points.push(new PIXI.Point(i * 50, 0));
 * };
 * let rope = new PIXI.SimpleRope(PIXI.Texture.from("snake.png"), points);
 *  ```
 *
 * @class
 * @extends PIXI.Mesh
 * @memberof PIXI
 *
 */
export class SimpleRope extends Mesh
{
    /**
     * @param {PIXI.Texture} texture - 在绳索上使用的纹理。
     * @param {PIXI.Point[]} points - {@link PIXI.Point}对象的数组来构造此绳索。
     * @param {number} [textureScale=0] - 可选的。正值可缩放绳索纹理，并保持其长宽比。
     * 您可以通过在此处提供较大的纹理和下采样来减少Alpha通道伪像。 如果设置为零，则将拉伸纹理。
     */
    constructor(texture, points, textureScale = 0)
    {
        const ropeGeometry = new RopeGeometry(texture.height, points, textureScale);
        const meshMaterial = new MeshMaterial(texture);

        if (textureScale > 0)
        {
            // attempt to set UV wrapping, will fail on non-power of two textures
            texture.baseTexture.wrapMode = WRAP_MODES.REPEAT;
        }
        super(ropeGeometry, meshMaterial);

        /**
         * 通过每帧的绳索点重新计算顶点
         *
         * @member {boolean}
         */
        this.autoUpdate = true;
    }

    _render(renderer)
    {
        if (this.autoUpdate
            || this.geometry.width !== this.shader.texture.height)
        {
            this.geometry.width = this.shader.texture.height;
            this.geometry.update();
        }

        super._render(renderer);
    }
}
