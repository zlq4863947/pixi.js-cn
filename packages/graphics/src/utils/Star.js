import { Polygon, PI_2 } from '@pixi/math';

/**
 * Draw a star shape with an arbitrary number of points.
 *
 * @class
 * @extends PIXI.Polygon
 * @memberof PIXI
 * @param {number} x - 星的中心X位置
 * @param {number} y - 星的中心Y位置
 * @param {number} points - 星星的点数必须 > 1
 * @param {number} radius - 星星的外半径
 * @param {number} [innerRadius] - 点之间的内半径，默认为`radius`的一半
 * @param {number} [rotation=0] - 星星自转的弧度，其中0为垂直
 * @return {PIXI.Graphics} 此Graphics对象。可以使用链式方法调用
 */
export class Star extends Polygon
{
    constructor(x, y, points, radius, innerRadius, rotation)
    {
        innerRadius = innerRadius || radius / 2;

        const startAngle = (-1 * Math.PI / 2) + rotation;
        const len = points * 2;
        const delta = PI_2 / len;
        const polygon = [];

        for (let i = 0; i < len; i++)
        {
            const r = i % 2 ? innerRadius : radius;
            const angle = (i * delta) + startAngle;

            polygon.push(
                x + (r * Math.cos(angle)),
                y + (r * Math.sin(angle)),
            );
        }

        super(polygon);
    }
}
