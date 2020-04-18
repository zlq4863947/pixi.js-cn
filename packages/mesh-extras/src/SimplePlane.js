import { Texture } from '@pixi/core';
import { Mesh, MeshMaterial } from '@pixi/mesh';
import { PlaneGeometry } from './geometry/PlaneGeometry';

/**
 * SimplePlane允许您在多个点上绘制纹理，然后操纵这些点
 *
 *```js
 * for (let i = 0; i < 20; i++) {
 *     points.push(new PIXI.Point(i * 50, 0));
 * };
 * let SimplePlane = new PIXI.SimplePlane(PIXI.Texture.from("snake.png"), points);
 *  ```
 *
 * @class
 * @extends PIXI.Mesh
 * @memberof PIXI
 *
 */
export class SimplePlane extends Mesh
{
    /**
     * @param {PIXI.Texture} texture - 在SimplePlane上使用的纹理。
     * @param {number} verticesX - x轴上的顶点数
     * @param {number} verticesY - y轴上的顶点数
     */
    constructor(texture, verticesX, verticesY)
    {
        const planeGeometry = new PlaneGeometry(texture.width, texture.height, verticesX, verticesY);
        const meshMaterial = new MeshMaterial(Texture.WHITE);

        super(planeGeometry, meshMaterial);

        // lets call the setter to ensure all necessary updates are performed
        this.texture = texture;
    }

    /**
     * 用于覆盖的方法，以防万一纹理帧被更改。
     * 基于平面的网格可以覆盖它，并可以基于纹理更改更多细节。
     */
    textureUpdated()
    {
        this._textureID = this.shader.texture._updateID;

        this.geometry.width = this.shader.texture.width;
        this.geometry.height = this.shader.texture.height;

        this.geometry.build();
    }

    set texture(value)
    {
        // Track texture same way sprite does.
        // For generated meshes like NineSlicePlane it can change the geometry.
        // Unfortunately, this method might not work if you directly change texture in material.

        if (this.shader.texture === value)
        {
            return;
        }

        this.shader.texture = value;
        this._textureID = -1;

        if (value.baseTexture.valid)
        {
            this.textureUpdated();
        }
        else
        {
            value.once('update', this.textureUpdated, this);
        }
    }

    get texture()
    {
        return this.shader.texture;
    }

    _render(renderer)
    {
        if (this._textureID !== this.shader.texture._updateID)
        {
            this.textureUpdated();
        }

        super._render(renderer);
    }
}
