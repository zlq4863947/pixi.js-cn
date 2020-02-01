import { Rectangle, IPoint, Transform, Matrix } from '@pixi/math';

/**
 * 边界矩形的'Builder'模式。
 *
 * 这可以称为“轴对齐边界框”。
 * 它不是实际形状。 这是可变的。 没有'EMPTY'或此类问题。
 *
 * @class
 * @memberof PIXI
 */
export class Bounds
{
    public minX: number;
    public minY: number;
    public maxX: number;
    public maxY: number;
    public rect: Rectangle;
    public updateID: number;

    constructor()
    {
        /**
         * @member {number}
         * @default 0
         */
        this.minX = Infinity;

        /**
         * @member {number}
         * @default 0
         */
        this.minY = Infinity;

        /**
         * @member {number}
         * @default 0
         */
        this.maxX = -Infinity;

        /**
         * @member {number}
         * @default 0
         */
        this.maxY = -Infinity;

        this.rect = null;

        /**
         * 它将更新为相应对象的_boundsID，以保持边界与内容同步。
         * 从外部更新，因此是public修饰符。
         *
         * @member {number}
         * @public
         */
        this.updateID = -1;
    }

    /**
     * 检查边界是否为空。
     *
     * @return {boolean} True if empty.
     */
    isEmpty(): boolean
    {
        return this.minX > this.maxX || this.minY > this.maxY;
    }

    /**
     * 清除边界并重设
     *
     */
    clear(): void
    {
        this.minX = Infinity;
        this.minY = Infinity;
        this.maxX = -Infinity;
        this.maxY = -Infinity;
    }

    /**
     * 可以返回Rectangle.EMPTY常量，可以构造新的矩形，也可以使用你的矩形
     * 不保证它将返回tempRect
     *
     * @param {PIXI.Rectangle} rect - 如果AABB不为空，将使用临时对象
     * @returns {PIXI.Rectangle} 边界的矩形
     */
    getRectangle(rect: Rectangle): Rectangle
    {
        if (this.minX > this.maxX || this.minY > this.maxY)
        {
            return Rectangle.EMPTY;
        }

        rect = rect || new Rectangle(0, 0, 1, 1);

        rect.x = this.minX;
        rect.y = this.minY;
        rect.width = this.maxX - this.minX;
        rect.height = this.maxY - this.minY;

        return rect;
    }

    /**
     * 此方法应尽可能内联。
     *
     * @param {PIXI.IPoint} point - The point to add.
     */
    addPoint(point: IPoint): void
    {
        this.minX = Math.min(this.minX, point.x);
        this.maxX = Math.max(this.maxX, point.x);
        this.minY = Math.min(this.minY, point.y);
        this.maxY = Math.max(this.maxY, point.y);
    }

    /**
     * 添加四边形，而不是变换
     *
     * @param {Float32Array} vertices - 要添加的顶点。
     */
    addQuad(vertices: Float32Array): void
    {
        let minX = this.minX;
        let minY = this.minY;
        let maxX = this.maxX;
        let maxY = this.maxY;

        let x = vertices[0];
        let y = vertices[1];

        minX = x < minX ? x : minX;
        minY = y < minY ? y : minY;
        maxX = x > maxX ? x : maxX;
        maxY = y > maxY ? y : maxY;

        x = vertices[2];
        y = vertices[3];
        minX = x < minX ? x : minX;
        minY = y < minY ? y : minY;
        maxX = x > maxX ? x : maxX;
        maxY = y > maxY ? y : maxY;

        x = vertices[4];
        y = vertices[5];
        minX = x < minX ? x : minX;
        minY = y < minY ? y : minY;
        maxX = x > maxX ? x : maxX;
        maxY = y > maxY ? y : maxY;

        x = vertices[6];
        y = vertices[7];
        minX = x < minX ? x : minX;
        minY = y < minY ? y : minY;
        maxX = x > maxX ? x : maxX;
        maxY = y > maxY ? y : maxY;

        this.minX = minX;
        this.minY = minY;
        this.maxX = maxX;
        this.maxY = maxY;
    }

    /**
     * 添加精灵帧，变换。
     *
     * @param {PIXI.Transform} transform - 要应用的转换
     * @param {number} x0 - 帧的左X
     * @param {number} y0 - 帧的上Y
     * @param {number} x1 - 帧的右X
     * @param {number} y1 - 帧的下Y
     */
    addFrame(transform: Transform, x0: number, y0: number, x1: number, y1: number): void
    {
        this.addFrameMatrix(transform.worldTransform, x0, y0, x1, y1);
    }

    /**
     * 添加精灵帧，乘以矩阵
     *
     * @param {PIXI.Matrix} matrix - 要应用的矩阵
     * @param {number} x0 - 帧的左X
     * @param {number} y0 - 帧的上Y
     * @param {number} x1 - 帧的右X
     * @param {number} y1 - 帧的下Y
     */
    addFrameMatrix(matrix: Matrix, x0: number, y0: number, x1: number, y1: number): void
    {
        const a = matrix.a;
        const b = matrix.b;
        const c = matrix.c;
        const d = matrix.d;
        const tx = matrix.tx;
        const ty = matrix.ty;

        let minX = this.minX;
        let minY = this.minY;
        let maxX = this.maxX;
        let maxY = this.maxY;

        let x = (a * x0) + (c * y0) + tx;
        let y = (b * x0) + (d * y0) + ty;

        minX = x < minX ? x : minX;
        minY = y < minY ? y : minY;
        maxX = x > maxX ? x : maxX;
        maxY = y > maxY ? y : maxY;

        x = (a * x1) + (c * y0) + tx;
        y = (b * x1) + (d * y0) + ty;
        minX = x < minX ? x : minX;
        minY = y < minY ? y : minY;
        maxX = x > maxX ? x : maxX;
        maxY = y > maxY ? y : maxY;

        x = (a * x0) + (c * y1) + tx;
        y = (b * x0) + (d * y1) + ty;
        minX = x < minX ? x : minX;
        minY = y < minY ? y : minY;
        maxX = x > maxX ? x : maxX;
        maxY = y > maxY ? y : maxY;

        x = (a * x1) + (c * y1) + tx;
        y = (b * x1) + (d * y1) + ty;
        minX = x < minX ? x : minX;
        minY = y < minY ? y : minY;
        maxX = x > maxX ? x : maxX;
        maxY = y > maxY ? y : maxY;

        this.minX = minX;
        this.minY = minY;
        this.maxX = maxX;
        this.maxY = maxY;
    }

    /**
     * 从数组中添加屏幕顶点
     *
     * @param {Float32Array} vertexData - 计算顶点
     * @param {number} beginOffset - 开始位置的偏移
     * @param {number} endOffset - 结束位置的偏移，不包含
     */
    addVertexData(vertexData: Float32Array, beginOffset: number, endOffset: number): void
    {
        let minX = this.minX;
        let minY = this.minY;
        let maxX = this.maxX;
        let maxY = this.maxY;

        for (let i = beginOffset; i < endOffset; i += 2)
        {
            const x = vertexData[i];
            const y = vertexData[i + 1];

            minX = x < minX ? x : minX;
            minY = y < minY ? y : minY;
            maxX = x > maxX ? x : maxX;
            maxY = y > maxY ? y : maxY;
        }

        this.minX = minX;
        this.minY = minY;
        this.maxX = maxX;
        this.maxY = maxY;
    }

    /**
     * 添加网格顶点数组
     *
     * @param {PIXI.Transform} transform - 网格变换
     * @param {Float32Array} vertices - 数组中的网格坐标
     * @param {number} beginOffset - 开始位置的偏移
     * @param {number} endOffset - 结束位置的偏移，不包含
     */
    addVertices(transform: Transform, vertices: Float32Array, beginOffset: number, endOffset: number): void
    {
        this.addVerticesMatrix(transform.worldTransform, vertices, beginOffset, endOffset);
    }

    /**
     * 添加一个网格顶点数组。
     *
     * @param {PIXI.Matrix} matrix - 网格矩阵
     * @param {Float32Array} vertices - 数组中的网格坐标
     * @param {number} beginOffset - 开始位置的偏移
     * @param {number} endOffset - 结束位置的偏移，不包含
     * @param {number} [padX=0] - x padding
     * @param {number} [padY=0] - y padding
     */
    addVerticesMatrix(matrix: Matrix, vertices: Float32Array, beginOffset: number,
        endOffset: number, padX = 0, padY = padX): void
    {
        const a = matrix.a;
        const b = matrix.b;
        const c = matrix.c;
        const d = matrix.d;
        const tx = matrix.tx;
        const ty = matrix.ty;

        let minX = this.minX;
        let minY = this.minY;
        let maxX = this.maxX;
        let maxY = this.maxY;

        for (let i = beginOffset; i < endOffset; i += 2)
        {
            const rawX = vertices[i];
            const rawY = vertices[i + 1];
            const x = (a * rawX) + (c * rawY) + tx;
            const y = (d * rawY) + (b * rawX) + ty;

            minX = Math.min(minX, x - padX);
            maxX = Math.max(maxX, x + padX);
            minY = Math.min(minY, y - padY);
            maxY = Math.max(maxY, y + padY);
        }

        this.minX = minX;
        this.minY = minY;
        this.maxX = maxX;
        this.maxY = maxY;
    }

    /**
     * 添加其他边界。
     *
     * @param {PIXI.Bounds} bounds - 要添加的边界
     */
    addBounds(bounds: Bounds): void
    {
        const minX = this.minX;
        const minY = this.minY;
        const maxX = this.maxX;
        const maxY = this.maxY;

        this.minX = bounds.minX < minX ? bounds.minX : minX;
        this.minY = bounds.minY < minY ? bounds.minY : minY;
        this.maxX = bounds.maxX > maxX ? bounds.maxX : maxX;
        this.maxY = bounds.maxY > maxY ? bounds.maxY : maxY;
    }

    /**
     * 添加其他边界，并用边界遮罩。
     *
     * @param {PIXI.Bounds} bounds - 要添加的边界。
     * @param {PIXI.Bounds} mask - TODO
     */
    addBoundsMask(bounds: Bounds, mask: Bounds): void
    {
        const _minX = bounds.minX > mask.minX ? bounds.minX : mask.minX;
        const _minY = bounds.minY > mask.minY ? bounds.minY : mask.minY;
        const _maxX = bounds.maxX < mask.maxX ? bounds.maxX : mask.maxX;
        const _maxY = bounds.maxY < mask.maxY ? bounds.maxY : mask.maxY;

        if (_minX <= _maxX && _minY <= _maxY)
        {
            const minX = this.minX;
            const minY = this.minY;
            const maxX = this.maxX;
            const maxY = this.maxY;

            this.minX = _minX < minX ? _minX : minX;
            this.minY = _minY < minY ? _minY : minY;
            this.maxX = _maxX > maxX ? _maxX : maxX;
            this.maxY = _maxY > maxY ? _maxY : maxY;
        }
    }

    /**
     * 将其他边界乘以矩阵。 边界不应为空。
     *
     * @param {PIXI.Bounds} bounds 其他边界
     * @param {PIXI.Matrix} matrix 乘数
     */
    addBoundsMatrix(bounds: Bounds, matrix: Matrix): void
    {
        this.addFrameMatrix(matrix, bounds.minX, bounds.minY, bounds.maxX, bounds.maxY);
    }

    /**
     * 添加其他矩形包围的边界。
     *
     * @param {PIXI.Bounds} bounds - TODO
     * @param {PIXI.Rectangle} area - TODO
     */
    addBoundsArea(bounds: Bounds, area: Rectangle): void
    {
        const _minX = bounds.minX > area.x ? bounds.minX : area.x;
        const _minY = bounds.minY > area.y ? bounds.minY : area.y;
        const _maxX = bounds.maxX < area.x + area.width ? bounds.maxX : (area.x + area.width);
        const _maxY = bounds.maxY < area.y + area.height ? bounds.maxY : (area.y + area.height);

        if (_minX <= _maxX && _minY <= _maxY)
        {
            const minX = this.minX;
            const minY = this.minY;
            const maxX = this.maxX;
            const maxY = this.maxY;

            this.minX = _minX < minX ? _minX : minX;
            this.minY = _minY < minY ? _minY : minY;
            this.maxX = _maxX > maxX ? _maxX : maxX;
            this.maxY = _maxY > maxY ? _maxY : maxY;
        }
    }

    /**
     * 填充边界对象，使其向各个方向延伸。
     * 如果省略paddingY，则paddingX和paddingY都将设置为paddingX。
     *
     * @param {number} [paddingX=0] - 水平填充量。
     * @param {number} [paddingY=0] - 垂直填充量。
     */
    pad(paddingX = 0, paddingY = paddingX): void
    {
        if (!this.isEmpty())
        {
            this.minX -= paddingX;
            this.maxX += paddingX;
            this.minY -= paddingY;
            this.maxY += paddingY;
        }
    }

    /**
     * 添加填充的帧. (x0, y0) 应该严格小于 (x1, y1)
     *
     * @param {number} x0 - 帧的左X
     * @param {number} y0 - 帧的上Y
     * @param {number} x1 - 帧的右X
     * @param {number} y1 - 帧的下Y
     * @param {number} padX - padding X
     * @param {number} padY - padding Y
     */
    addFramePad(x0: number, y0: number, x1: number, y1: number, padX: number, padY: number): void
    {
        x0 -= padX;
        y0 -= padY;
        x1 += padX;
        y1 += padY;

        this.minX = this.minX < x0 ? this.minX : x0;
        this.maxX = this.maxX > x1 ? this.maxX : x1;
        this.minY = this.minY < y0 ? this.minY : y0;
        this.maxY = this.maxY > y1 ? this.maxY : y1;
    }
}
