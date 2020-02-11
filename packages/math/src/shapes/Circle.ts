import { SHAPES } from './../const';
import { Rectangle } from './Rectangle';

/**
 * 圆对象用于帮助绘制图形，也可用于指定显示对象的命中区域。
 *
 * @class
 * @memberof PIXI
 */
export class Circle
{
    public x: number;
    public y: number;
    public radius: number;
    public readonly type: number;

    /**
     * @param {number} [x=0] - 圆中心的X坐标
     * @param {number} [y=0] - 圆中心的Y坐标
     * @param {number} [radius=0] - 圆的半径
     */
    constructor(x = 0, y = 0, radius = 0)
    {
        /**
         * @member {number}
         * @default 0
         */
        this.x = x;

        /**
         * @member {number}
         * @default 0
         */
        this.y = y;

        /**
         * @member {number}
         * @default 0
         */
        this.radius = radius;

        /**
         * 对象的类型，主要用于避免执行 `instanceof` 检查
         *
         * @member {number}
         * @readOnly
         * @default PIXI.SHAPES.CIRC
         * @see PIXI.SHAPES
         */
        this.type = SHAPES.CIRC;
    }

    /**
     * 创建圆实例的克隆
     *
     * @return {PIXI.Circle} 圈的副本
     */
    clone(): Circle
    {
        return new Circle(this.x, this.y, this.radius);
    }

    /**
     * 检查指定的x和y坐标是否包含在圆的范围内
     *
     * @param {number} x -测试点的X坐标
     * @param {number} y - 测试点的Y坐标
     * @return {boolean} x/y坐标是否包含
     */
    contains(x: number, y: number): boolean
    {
        if (this.radius <= 0)
        {
            return false;
        }

        const r2 = this.radius * this.radius;
        let dx = (this.x - x);
        let dy = (this.y - y);

        dx *= dx;
        dy *= dy;

        return (dx + dy <= r2);
    }

    /**
    * 以Rectangle对象的形式返回圆的矩形框架
    *
    * @return {PIXI.Rectangle} 矩形框架
    */
    getBounds(): Rectangle
    {
        return new Rectangle(this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2);
    }
}
