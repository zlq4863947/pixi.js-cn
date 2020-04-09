import { IPoint } from './IPoint';

/**
 * Point对象表示二维坐标系中的位置，其中x表示水平轴，y表示垂直轴。
 *
 * @class
 * @memberof PIXI
 * @implements IPoint
 */
export class Point implements IPoint
{
    public x: number;
    public y: number;

    /**
     * @param {number} [x=0] - point在x轴上的位置
     * @param {number} [y=0] - point在y轴上的位置
     */
    constructor(x = 0, y = 0)
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
    }

    /**
     * Creates a clone of this point
     *
     * @return {PIXI.Point} a copy of the point
     */
    clone(): Point
    {
        return new Point(this.x, this.y);
    }

    /**
     * 从指定点复制x和y
     *
     * @param {PIXI.IPoint} p - 要复制的点
     * @returns {this} Returns itself.
     */
    copyFrom(p: IPoint): this
    {
        this.set(p.x, p.y);

        return this;
    }

    /**
     * 将x和y复制到指定点
     *
     * @param {PIXI.IPoint} p - 要复制的点。
     * @returns {PIXI.IPoint} 已更新值的指定点
     */
    copyTo<T extends IPoint>(p: T): T
    {
        p.set(this.x, this.y);

        return p;
    }

    /**
     * 如果指定点等于该点，则返回true
     *
     * @param {PIXI.IPoint} p - The point to check
     * @returns {boolean} Whether the given point equal to this point
     */
    equals(p: IPoint): boolean
    {
        return (p.x === this.x) && (p.y === this.y);
    }

    /**
     * 将点设置为新的x和y位置。
     * 如果省略y，则x和y都将设置为x。
     *
     * @param {number} [x=0] - position of the point on the x axis
     * @param {number} [y=x] - position of the point on the y axis
     * @returns {this} Returns itself.
     */
    set(x = 0, y = x): this
    {
        this.x = x;
        this.y = y;

        return this;
    }
}
