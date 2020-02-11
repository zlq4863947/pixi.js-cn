import { SHAPES } from '../const';

/**
 * Size object, contains width and height
 *
 * @memberof PIXI
 * @typedef {object} ISize
 * @property {number} width - Width component
 * @property {number} height - Height component
 */

/**
 * 矩形对象是由其位置定义的区域, 由其左上角点（x，y）及其宽度和高度所示。
 *
 * @class
 * @memberof PIXI
 */
export class Rectangle
{
    public x: number;
    public y: number;
    public width: number;
    public height: number;
    public readonly type: number;

    /**
     * @param {number} [x=0] - 矩形左上角的X坐标
     * @param {number} [y=0] - 矩形左上角的Y坐标
     * @param {number} [width=0] - 矩形的整体宽度
     * @param {number} [height=0] - 矩形的整体高度
     */
    constructor(x = 0, y = 0, width = 0, height = 0)
    {
        /**
         * @member {number}
         * @default 0
         */
        this.x = Number(x);

        /**
         * @member {number}
         * @default 0
         */
        this.y = Number(y);

        /**
         * @member {number}
         * @default 0
         */
        this.width = Number(width);

        /**
         * @member {number}
         * @default 0
         */
        this.height = Number(height);

        /**
         * 对象的类型，主要用于避免执行 `instanceof` 检查
         *
         * @member {number}
         * @readOnly
         * @default PIXI.SHAPES.RECT
         * @see PIXI.SHAPES
         */
        this.type = SHAPES.RECT;
    }

    /**
     * 返回矩形的左边缘
     *
     * @member {number}
     */
    get left(): number
    {
        return this.x;
    }

    /**
     * 返回矩形的右边缘
     *
     * @member {number}
     */
    get right(): number
    {
        return this.x + this.width;
    }

    /**
     * 返回矩形的顶部边缘
     *
     * @member {number}
     */
    get top(): number
    {
        return this.y;
    }

    /**
     * 返回矩形的底部边缘
     *
     * @member {number}
     */
    get bottom(): number
    {
        return this.y + this.height;
    }

    /**
     * 一个常量的空矩形。
     *
     * @static
     * @constant
     * @member {PIXI.Rectangle}
     * @return {PIXI.Rectangle} 空矩形
     */
    static get EMPTY(): Rectangle
    {
        return new Rectangle(0, 0, 0, 0);
    }

    /**
     * 创建此Rectangle的副本
     *
     * @return {PIXI.Rectangle} 矩形的副本
     */
    clone(): Rectangle
    {
        return new Rectangle(this.x, this.y, this.width, this.height);
    }

    /**
     * 将另一个矩形复制到该矩形。
     *
     * @param {PIXI.Rectangle} rectangle - 要复制的矩形。
     * @return {PIXI.Rectangle} 返回自身。
     */
    copyFrom(rectangle: Rectangle): Rectangle
    {
        this.x = rectangle.x;
        this.y = rectangle.y;
        this.width = rectangle.width;
        this.height = rectangle.height;

        return this;
    }

    /**
     * 将此矩形复制到另一个矩形。
     *
     * @param {PIXI.Rectangle} rectangle - 要复制到的矩形。
     * @return {PIXI.Rectangle} 返回自身。
     */
    copyTo(rectangle: Rectangle): Rectangle
    {
        rectangle.x = this.x;
        rectangle.y = this.y;
        rectangle.width = this.width;
        rectangle.height = this.height;

        return rectangle;
    }

    /**
     * 检查指定的x和y坐标是否包含在此Rectangle中
     *
     * @param {number} x - 测试点的X坐标
     * @param {number} y - 测试点的Y坐标
     * @return {boolean} x/y坐标是否在此Rectangle之内
     */
    contains(x: number, y: number): boolean
    {
        if (this.width <= 0 || this.height <= 0)
        {
            return false;
        }

        if (x >= this.x && x < this.x + this.width)
        {
            if (y >= this.y && y < this.y + this.height)
            {
                return true;
            }
        }

        return false;
    }

    /**
     * 填充矩形使其沿所有方向生长。
     * 如果省略paddingY，则paddingX和paddingY都将设置为paddingX。
     *
     * @param {number} [paddingX=0] - 水平填充量。
     * @param {number} [paddingY=0] - 垂直填充量。
     * @return {PIXI.Rectangle} 返回自身。
     */
    pad(paddingX = 0, paddingY = paddingX): this
    {
        this.x -= paddingX;
        this.y -= paddingY;

        this.width += paddingX * 2;
        this.height += paddingY * 2;

        return this;
    }

    /**
     * 使该矩形适合所传递的矩形。
     *
     * @param {PIXI.Rectangle} rectangle - 要适合的矩形。
     * @return {PIXI.Rectangle} 返回自身。
     */
    fit(rectangle: Rectangle): this
    {
        const x1 = Math.max(this.x, rectangle.x);
        const x2 = Math.min(this.x + this.width, rectangle.x + rectangle.width);
        const y1 = Math.max(this.y, rectangle.y);
        const y2 = Math.min(this.y + this.height, rectangle.y + rectangle.height);

        this.x = x1;
        this.width = Math.max(x2 - x1, 0);
        this.y = y1;
        this.height = Math.max(y2 - y1, 0);

        return this;
    }

    /**
     * 放大矩形，使其角位于网格上
     *
     * @param {number} [resolution=1] 分辨率
     * @param {number} [eps=0.001] 精度
     * @return {PIXI.Rectangle} 返回自身。
     */
    ceil(resolution = 1, eps = 0.001): this
    {
        const x2 = Math.ceil((this.x + this.width - eps) * resolution) / resolution;
        const y2 = Math.ceil((this.y + this.height - eps) * resolution) / resolution;

        this.x = Math.floor((this.x + eps) * resolution) / resolution;
        this.y = Math.floor((this.y + eps) * resolution) / resolution;

        this.width = x2 - this.x;
        this.height = y2 - this.y;

        return this;
    }

    /**
     * 放大此矩形以包括传递的矩形。
     *
     * @param {PIXI.Rectangle} rectangle - 要包含的矩形。
     * @return {PIXI.Rectangle} 返回自身。
     */
    enlarge(rectangle: Rectangle): this
    {
        const x1 = Math.min(this.x, rectangle.x);
        const x2 = Math.max(this.x + this.width, rectangle.x + rectangle.width);
        const y1 = Math.min(this.y, rectangle.y);
        const y2 = Math.max(this.y + this.height, rectangle.y + rectangle.height);

        this.x = x1;
        this.width = x2 - x1;
        this.y = y1;
        this.height = y2 - y1;

        return this;
    }
}
