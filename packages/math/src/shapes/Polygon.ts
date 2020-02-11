import { SHAPES } from '../const';
import { Point } from '../Point';

/**
 * 通过用户定义的坐标自定义形状的类。
 *
 * @class
 * @memberof PIXI
 */
export class Polygon
{
    public points: number[];
    public closeStroke: boolean;
    public readonly type: number;

    /**
     * @param {PIXI.Point[]|number[]|number[][]} points - 可以为形成多边形的Point数组
     *  也可以是[x,y, x,y, ...]的打平坐标数组，或者 传递的参数可以是多边形的所有点，例如
     *  `new PIXI.Polygon(new PIXI.Point(), new PIXI.Point(), ...)`, 或者传递的参数可以是打平的
     *  x,y 值 例如: `new Polygon(x,y, x,y, x,y, ...)` 其中`x`和`y`是数字类型。
     */
    constructor(...points: Point[]|number[]|number[][])
    {
        if (Array.isArray(points[0]))
        {
            points = points[0];
        }

        // if this is an array of points, convert it to a flat array of numbers
        if (points[0] instanceof Point)
        {
            points = points as Point[];

            const p: number[] = [];

            for (let i = 0, il = points.length; i < il; i++)
            {
                p.push(points[i].x, points[i].y);
            }

            points = p;
        }

        /**
         * 多边形的点数组
         *
         * @member {number[]}
         */
        this.points = points as number[];

        /**
         * 对象的类型，主要用于避免执行 `instanceof` 检查
         *
         * @member {number}
         * @readOnly
         * @default PIXI.SHAPES.POLY
         * @see PIXI.SHAPES
         */
        this.type = SHAPES.POLY;

        /**
         * moveTo之后为`false`，closePath之后为`true`。 所有其他情况为`true`。
         * @member {boolean}
         * @default true
         */
        this.closeStroke = true;
    }

    /**
     * 创建多边形实例的克隆
     *
     * @return {PIXI.Polygon} 多边形的副本
     */
    clone(): Polygon
    {
        const points = this.points.slice();
        const polygon = new Polygon(points);

        polygon.closeStroke = this.closeStroke;

        return polygon;
    }

    /**
     * 检查传递给此函数的x和y坐标是否包含在此多边形内
     *
     * @param {number} x - 测试点的X坐标
     * @param {number} y - 测试点的Y坐标
     * @return {boolean} x/y坐标是否包含
     */
    contains(x: number, y: number): boolean
    {
        let inside = false;

        // use some raycasting to test hits
        // https://github.com/substack/point-in-polygon/blob/master/index.js
        const length = this.points.length / 2;

        for (let i = 0, j = length - 1; i < length; j = i++)
        {
            const xi = this.points[i * 2];
            const yi = this.points[(i * 2) + 1];
            const xj = this.points[j * 2];
            const yj = this.points[(j * 2) + 1];
            const intersect = ((yi > y) !== (yj > y)) && (x < ((xj - xi) * ((y - yi) / (yj - yi))) + xi);

            if (intersect)
            {
                inside = !inside;
            }
        }

        return inside;
    }
}
