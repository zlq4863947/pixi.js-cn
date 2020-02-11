import { Rectangle } from './Rectangle';
import { SHAPES } from '../const';

/**
 * 椭圆对象用于帮助绘制图形，也可用于指定显示对象的命中区域。
 *
 * @class
 * @memberof PIXI
 */
export class Ellipse
{
    public x: number;
    public y: number;
    public width: number;
    public height: number;
    public readonly type: number;

    /**
     * @param {number} [x=0] - 椭圆中心的X坐标
     * @param {number} [y=0] - 椭圆中心的Y坐标
     * @param {number} [halfWidth=0] - 椭圆的半径宽度
     * @param {number} [halfHeight=0] - 椭圆的半径高度
     */
    constructor(x = 0, y = 0, halfWidth = 0, halfHeight = 0)
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
        this.width = halfWidth;

        /**
         * @member {number}
         * @default 0
         */
        this.height = halfHeight;

        /**
         * 对象的类型，主要用于避免执行 `instanceof` 检查
         *
         * @member {number}
         * @readOnly
         * @default PIXI.SHAPES.ELIP
         * @see PIXI.SHAPES
         */
        this.type = SHAPES.ELIP;
    }

    /**
     * 创建椭圆实例的克隆
     *
     * @return {PIXI.Ellipse} 椭圈的副本
     */
    clone(): Ellipse
    {
        return new Ellipse(this.x, this.y, this.width, this.height);
    }

    /**
     * 检查指定的x和y坐标是否包含在椭圆范围内
     *
     * @param {number} x - 测试点的X坐标
     * @param {number} y - 测试点的Y坐标
     * @return {boolean} x/y坐标是否包含
     */
    contains(x: number, y: number): boolean
    {
        if (this.width <= 0 || this.height <= 0)
        {
            return false;
        }

        // normalize the coords to an ellipse with center 0,0
        let normx = ((x - this.x) / this.width);
        let normy = ((y - this.y) / this.height);

        normx *= normx;
        normy *= normy;

        return (normx + normy <= 1);
    }

    /**
     * 以Rectangle对象的形式返回椭圆的矩形框架
     *
     * @return {PIXI.Rectangle} 矩形框架
     */
    getBounds(): Rectangle
    {
        return new Rectangle(this.x - this.width, this.y - this.height, this.width, this.height);
    }
}
