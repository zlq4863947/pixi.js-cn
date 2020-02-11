import { SHAPES } from '../const';

/**
 * 圆角矩形对象是一个具有圆角的区域，由其左上角点（x，y）以及其宽度，高度和半径表示。
 *
 * @class
 * @memberof PIXI
 */
export class RoundedRectangle
{
    public x: number;
    public y: number;
    public width: number;
    public height: number;
    public radius: number;
    public readonly type: number;

    /**
     * @param {number} [x=0] - 圆角矩形左上角的X坐标
     * @param {number} [y=0] - 圆角矩形左上角的Y坐标
     * @param {number} [width=0] - 圆角矩形的整体宽度
     * @param {number} [height=0] - 圆角矩形的整体高度
     * @param {number} [radius=20] - 控制圆角的半径
     */
    constructor(x = 0, y = 0, width = 0, height = 0, radius = 20)
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
        this.width = width;

        /**
         * @member {number}
         * @default 0
         */
        this.height = height;

        /**
         * @member {number}
         * @default 20
         */
        this.radius = radius;

        /**
         * 对象的类型，主要用于避免执行 `instanceof` 检查
         *
         * @member {number}
         * @readonly
         * @default PIXI.SHAPES.RREC
         * @see PIXI.SHAPES
         */
        this.type = SHAPES.RREC;
    }

    /**
     * 创建圆角矩形实例的克隆
     *
     * @return {PIXI.RoundedRectangle} 圆角矩形的副本
     */
    clone(): RoundedRectangle
    {
        return new RoundedRectangle(this.x, this.y, this.width, this.height, this.radius);
    }

    /**
     * 检查传递给此函数的x和y坐标是否包含在此圆角矩形内
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
        if (x >= this.x && x <= this.x + this.width)
        {
            if (y >= this.y && y <= this.y + this.height)
            {
                if ((y >= this.y + this.radius && y <= this.y + this.height - this.radius)
                || (x >= this.x + this.radius && x <= this.x + this.width - this.radius))
                {
                    return true;
                }
                let dx = x - (this.x + this.radius);
                let dy = y - (this.y + this.radius);
                const radius2 = this.radius * this.radius;

                if ((dx * dx) + (dy * dy) <= radius2)
                {
                    return true;
                }
                dx = x - (this.x + this.width - this.radius);
                if ((dx * dx) + (dy * dy) <= radius2)
                {
                    return true;
                }
                dy = y - (this.y + this.height - this.radius);
                if ((dx * dx) + (dy * dy) <= radius2)
                {
                    return true;
                }
                dx = x - (this.x + this.radius);
                if ((dx * dx) + (dy * dy) <= radius2)
                {
                    return true;
                }
            }
        }

        return false;
    }
}
