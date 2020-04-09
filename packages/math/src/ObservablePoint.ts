import { IPoint } from './IPoint';

/**
 * Point对象表示二维坐标系中的位置，其中x表示水平轴，y表示垂直轴。
 *
 * ObservablePoint是一个指针，当该指针的位置更改时，它将触发回调。
 *
 * @class
 * @memberof PIXI
 * @implements IPoint
 */
export class ObservablePoint<T = any> implements IPoint
{
    public cb: (this: T) => any;
    public scope: any;
    protected _x: number;
    protected _y: number;

    /**
     * @param {Function} cb - 更改时回调
     * @param {object} scope - 回调的所有者
     * @param {number} [x=0] - 点在x轴上的位置
     * @param {number} [y=0] - 点在y轴上的位置
     */
    constructor(cb: (this: T) => any, scope: T, x = 0, y = 0)
    {
        this._x = x;
        this._y = y;

        this.cb = cb;
        this.scope = scope;
    }

    /**
     * 创建此点的副本。
     * 回调和范围参数可以被覆盖，不填时，它们将默认为克隆对象的值。
     *
     * @override
     * @param {Function} [cb=null] - 更改时回调
     * @param {object} [scope=null] - 回调的所有者
     * @return {PIXI.ObservablePoint} 点的副本
     */
    clone(cb = this.cb, scope = this.scope): ObservablePoint
    {
        return new ObservablePoint(cb, scope, this._x, this._y);
    }

    /**
     * 将点设置为新的x和y位置。
     * 如果省略y，则x和y都将设置为x。
     *
     * @param {number} [x=0] - 点在x轴上的位置
     * @param {number} [y=x] - 点在y轴上的位置
     * @returns {this} Returns itself.
     */
    set(x = 0, y = x): this
    {
        if (this._x !== x || this._y !== y)
        {
            this._x = x;
            this._y = y;
            this.cb.call(this.scope);
        }

        return this;
    }

    /**
     * 从指定点复制x和y
     *
     * @param {PIXI.IPoint} p - 要复制的点。
     * @returns {this} Returns itself.
     */
    copyFrom(p: IPoint): this
    {
        if (this._x !== p.x || this._y !== p.y)
        {
            this._x = p.x;
            this._y = p.y;
            this.cb.call(this.scope);
        }

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
        p.set(this._x, this._y);

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
        return (p.x === this._x) && (p.y === this._y);
    }

    /**
     * displayObject在x轴上相对于父级本地坐标的位置。
     *
     * @member {number}
     */
    get x(): number
    {
        return this._x;
    }

    set x(value) // eslint-disable-line require-jsdoc
    {
        if (this._x !== value)
        {
            this._x = value;
            this.cb.call(this.scope);
        }
    }

    /**
     * displayObject在y轴上相对于父级本地坐标的位置
     *
     * @member {number}
     */
    get y(): number
    {
        return this._y;
    }

    set y(value) // eslint-disable-line require-jsdoc
    {
        if (this._y !== value)
        {
            this._y = value;
            this.cb.call(this.scope);
        }
    }
}
