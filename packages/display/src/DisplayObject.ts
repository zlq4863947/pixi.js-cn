import { Filter, MaskData, Renderer } from '@pixi/core';
import { DEG_TO_RAD, IPoint, Matrix, ObservablePoint, Point, RAD_TO_DEG, Rectangle, Transform } from '@pixi/math';
import { EventEmitter } from '@pixi/utils';
import { Container } from './Container';
import { Bounds } from './Bounds';

export interface IDestroyOptions {
    children?: boolean;
    texture?: boolean;
    baseTexture?: boolean;
}

export interface DisplayObject extends InteractiveTarget, EventEmitter {}

/**
 * 屏幕上渲染的所有对象的基类。
 *
 * 这是一个抽象类，不应单独使用。 而是应该扩展。
 *
 * @class
 * @extends PIXI.utils.EventEmitter
 * @memberof PIXI
 */
export abstract class DisplayObject extends EventEmitter
{
    abstract sortDirty: boolean;

    public parent: DisplayObject;
    public worldAlpha: number;
    public transform: Transform;
    public alpha: number;
    public visible: boolean;
    public renderable: boolean;
    public filterArea: Rectangle;
    public filters: Filter[];
    public isSprite: boolean;
    public isMask: boolean;
    public _lastSortedIndex: number;
    public _mask: Container|MaskData;
    public _bounds: Bounds;

    protected _zIndex: number;
    protected _enabledFilters: Filter[];
    protected _boundsID: number;
    protected _boundsRect: Rectangle;
    protected _localBoundsRect: Rectangle;
    protected _destroyed: boolean;

    private tempDisplayObjectParent: TemporaryDisplayObject;
    private displayObjectUpdateTransform: () => void;

    /**
     * 将所有可枚举属性和方法从源对象混合到DisplayObject。
     *
     * @param {object} source 属性来源和可混用的方法。
     */
    static mixin(source: {[x: string]: any}): void
    {
        // in ES8/ES2017, this would be really easy:
        // Object.defineProperties(DisplayObject.prototype, Object.getOwnPropertyDescriptors(source));

        // get all the enumerable property keys
        const keys = Object.keys(source);

        // loop through properties
        for (let i = 0; i < keys.length; ++i)
        {
            const propertyName = keys[i];

            // Set the property using the property descriptor - this works for accessors and normal value properties
            Object.defineProperty(
                DisplayObject.prototype,
                propertyName,
                Object.getOwnPropertyDescriptor(source, propertyName),
            );
        }
    }

    constructor()
    {
        super();

        this.tempDisplayObjectParent = null;

        // TODO: need to create Transform from factory
        /**
         * 该对象的世界变换和局部变换。
         * 稍后它将变为只读，除非您知道自己在做什么，否则请不要在其中分配任何内容。
         *
         * @member {PIXI.Transform}
         */
        this.transform = new Transform();

        /**
         * 对象的不透明度。
         *
         * @member {number}
         */
        this.alpha = 1;

        /**
         * 对象的可见性。 如果为false，则不会绘制对象，并且不会调用updateTransform函数。
         *
         * 仅影响来自父级的递归调用。 您可以请求边界或手动调用updateTransform。
         *
         * @member {boolean}
         */
        this.visible = true;

        /**
         * 是否可以渲染此对象，如果为false，则不会绘制对象，但仍将调用updateTransform方法。
         *
         * 仅影响来自父级的递归调用。 您可以手动请求边界。
         *
         * @member {boolean}
         */
        this.renderable = true;

        /**
         * 包含此显示对象的显示对象容器。
         *
         * @member {PIXI.Container}
         */
        this.parent = null;

        /**
         * displayObject的相乘alpha。
         *
         * @member {number}
         * @readonly
         */
        this.worldAlpha = 1;

        /**
         * 显示组件在子数组中的哪个索引在上一个zIndex排序之前。
         * 由容器使用，通过使用前一个数组索引作为决策器，帮助对具有相同zIndex的对象进行排序。
         *
         * @member {number}
         * @protected
         */
        this._lastSortedIndex = 0;

        /**
         * displayObject的zIndex。
         * 较高的值意味着它将呈现在同一容器中其他显示对象的顶部。
         *
         * @member {number}
         * @protected
         */
        this._zIndex = 0;

        /**
         * 设置滤镜的区域。这更多的是用作优化，而不是计算可以设置此矩形的每个帧的displayObject的尺寸。
         *
         * 也可用作交互掩罩。
         *
         * @member {?PIXI.Rectangle}
         */
        this.filterArea = null;

        /**
         * 设置displayObject的滤镜。
         * * 重要提示：这是一个WebGL独有的功能，将被画布渲染器忽略。
         * 若要删除滤镜，只需将此属性设置为`'null'`。
         *
         * @member {?PIXI.Filter[]}
         */
        this.filters = null;

        /**
         * 当前启用的滤镜
         * @member {PIXI.Filter[]}
         * @protected
         */
        this._enabledFilters = null;

        /**
         * bounds对象，用于计算和存储displayObject的边界。
         *
         * @member {PIXI.Bounds}
         */
        this._bounds = new Bounds();

        /**
         * TODO
         *
         * @member {number}
         * @protected
         */
        this._boundsID = 0;

        /**
         * TODO
         *
         * @member {PIXI.Bounds}
         * @protected
         */
        this._boundsRect = null;

        /**
         * TODO
         *
         * @member {PIXI.Bounds}
         * @protected
         */
        this._localBoundsRect = null;

        /**
         * 对象的原始缓存掩罩。
         *
         * @member {PIXI.Graphics|PIXI.Sprite|null}
         * @protected
         */
        this._mask = null;

        /**
         * 将此DisplayObject添加到容器时触发。
         *
         * @event PIXI.DisplayObject#added
         * @param {PIXI.Container} container - 添加到的容器。
         */

        /**
         * 从容器中移除此DisplayObject时触发。
         *
         * @event PIXI.DisplayObject#removed
         * @param {PIXI.Container} container - 从中移除的容器。
         */

        /**
         * 如果对象已通过destroy()销毁, 则为true，此属性不应被使用。
         *
         * @member {boolean}
         * @protected
         */
        this._destroyed = false;

        /**
         * 用于快速检查精灵是否是.. 一个精灵!
         * @member {boolean}
         */
        this.isSprite = false;

        /**
         * 是否还有其他displayObject将此对象用作遮罩？
         * @member {boolean}
         */
        this.isMask = false;

        /**
         * DisplayObject默认为updateTransform，不更新容器的子级。
         * 如果没有父元素，则会崩溃。
         *
         * @memberof PIXI.DisplayObject#
         * @function displayObjectUpdateTransform
         */
        this.displayObjectUpdateTransform = this.updateTransform;
    }

    /**
     * 重新计算显示对象的边界。
     */
    abstract calculateBounds(): void;

    abstract removeChild(child: DisplayObject): void;

    /**
     * 使用WebGL渲染器渲染对象。
     *
     * @param {PIXI.Renderer} renderer - 渲染器
     */
    abstract render(renderer: Renderer): void;

    /**
     * 递归地将所有对象的转换从根更新为此toLocal()的一个内部函数
     */
    private _recursivePostUpdateTransform(): void
    {
        if (this.parent)
        {
            this.parent._recursivePostUpdateTransform();
            this.transform.updateTransform(this.parent.transform);
        }
        else
        {
            this.transform.updateTransform(this._tempDisplayObjectParent.transform);
        }
    }

    /**
     * 更新要渲染的对象变换。
     *
     * TODO - 优化通过！
     */
    updateTransform(): void
    {
        this._boundsID++;

        this.transform.updateTransform(this.parent.transform);
        // multiply the alphas..
        this.worldAlpha = this.alpha * this.parent.worldAlpha;
    }

    /**
     * 以矩形对象的形式获取displayObject的边界。
     *
     * @param {boolean} [skipUpdate] - 设置为`true`将阻止场景图的变换被更新。这意味着返回的计算可能已经过时，
     *  但会给您带来很好的性能提升。
     * @param {PIXI.Rectangle} [rect] - 可选的矩形，用于存储边界计算的结果。
     * @return {PIXI.Rectangle} 矩形边界区域
     */
    getBounds(skipUpdate?: boolean, rect?: Rectangle): Rectangle
    {
        if (!skipUpdate)
        {
            if (!this.parent)
            {
                this.parent = this._tempDisplayObjectParent;
                this.updateTransform();
                this.parent = null;
            }
            else
            {
                this._recursivePostUpdateTransform();
                this.updateTransform();
            }
        }

        if (this._bounds.updateID !== this._boundsID)
        {
            this.calculateBounds();
            this._bounds.updateID = this._boundsID;
        }

        if (!rect)
        {
            if (!this._boundsRect)
            {
                this._boundsRect = new Rectangle();
            }

            rect = this._boundsRect;
        }

        return this._bounds.getRectangle(rect);
    }

    /**
     * 以矩形对象的形式获取displayObject的局部范围。
     *
     * @param {PIXI.Rectangle} [rect] - 可选的矩形，用于存储边界计算的结果。
     * @return {PIXI.Rectangle} 矩形边界区域
     */
    getLocalBounds(rect?: Rectangle): Rectangle
    {
        const transformRef = this.transform;
        const parentRef = this.parent;

        this.parent = null;
        this.transform = this._tempDisplayObjectParent.transform;

        if (!rect)
        {
            if (!this._localBoundsRect)
            {
                this._localBoundsRect = new Rectangle();
            }

            rect = this._localBoundsRect;
        }

        const bounds = this.getBounds(false, rect);

        this.parent = parentRef;
        this.transform = transformRef;

        return bounds;
    }

    /**
     * 计算显示对象的世界位置。
     *
     * @param {PIXI.IPoint} position - 要计算的世界原点。
     * @param {PIXI.Point} [point] - 存储值的Point对象，可选
     *  (为空时，会创建一个新的Point).
     * @param {boolean} [skipUpdate=false] - 是否跳过更新转换
     * @return {PIXI.Point} 表示此对象位置的Point对象。
     */
    toGlobal(position: IPoint, point?: Point, skipUpdate = false): Point
    {
        if (!skipUpdate)
        {
            this._recursivePostUpdateTransform();

            // this parent check is for just in case the item is a root object.
            // If it is we need to give it a temporary parent so that displayObjectUpdateTransform works correctly
            // this is mainly to avoid a parent check in the main loop. Every little helps for performance :)
            if (!this.parent)
            {
                this.parent = this._tempDisplayObjectParent;
                this.displayObjectUpdateTransform();
                this.parent = null;
            }
            else
            {
                this.displayObjectUpdateTransform();
            }
        }

        // don't need to update the lot
        return this.worldTransform.apply(position, point);
    }

    /**
     * 计算显示对象相对于另一点的局部位置。
     *
     * @param {PIXI.IPoint} position - 要计算的世界原点。
     * @param {PIXI.DisplayObject} [from] - 从中计算世界位置的DisplayObject。
     * @param {PIXI.Point} [point] - 存储值的Point对象，可选
     *  (为空时，会创建一个新的Point).
     * @param {boolean} [skipUpdate=false] - 是否跳过更新转换
     * @return {PIXI.Point} 表示此对象位置的Point对象
     */
    toLocal(position: IPoint, from: DisplayObject, point?: Point, skipUpdate?: boolean): Point
    {
        if (from)
        {
            position = from.toGlobal(position, point, skipUpdate);
        }

        if (!skipUpdate)
        {
            this._recursivePostUpdateTransform();

            // this parent check is for just in case the item is a root object.
            // If it is we need to give it a temporary parent so that displayObjectUpdateTransform works correctly
            // this is mainly to avoid a parent check in the main loop. Every little helps for performance :)
            if (!this.parent)
            {
                this.parent = this._tempDisplayObjectParent;
                this.displayObjectUpdateTransform();
                this.parent = null;
            }
            else
            {
                this.displayObjectUpdateTransform();
            }
        }

        // simply apply the matrix..
        return this.worldTransform.applyInverse(position, point);
    }

    /**
     * 设置此DisplayObject的父容器。
     *
     * @param {PIXI.Container} container - 要将此DisplayObject添加到的容器。
     * @return {PIXI.Container} 此DisplayObject添加到的容器。
     */
    setParent(container: Container): Container
    {
        if (!container || !container.addChild)
        {
            throw new Error('setParent: Argument must be a Container');
        }

        container.addChild(this);

        return container;
    }

    /**
     * 便捷方法，可同时设置位置，比例，倾斜和枢轴。
     *
     * @param {number} [x=0] - X位置
     * @param {number} [y=0] - Y位置
     * @param {number} [scaleX=1] - X标度值
     * @param {number} [scaleY=1] - Y标度值
     * @param {number} [rotation=0] - 旋转
     * @param {number} [skewX=0] - X偏斜值
     * @param {number} [skewY=0] - Y偏斜值
     * @param {number} [pivotX=0] - X轴值
     * @param {number} [pivotY=0] - Y轴值
     * @return {PIXI.DisplayObject} DisplayObject实例
     */
    setTransform(x = 0, y = 0, scaleX = 1, scaleY = 1, rotation = 0, skewX = 0, skewY = 0, pivotX = 0, pivotY = 0): this
    {
        this.position.x = x;
        this.position.y = y;
        this.scale.x = !scaleX ? 1 : scaleX;
        this.scale.y = !scaleY ? 1 : scaleY;
        this.rotation = rotation;
        this.skew.x = skewX;
        this.skew.y = skewY;
        this.pivot.x = pivotX;
        this.pivot.y = pivotY;

        return this;
    }

    /**
     * 通用显示对象的基础销毁方法。这将自动从其父容器中删除显示对象，并删除所有当前事件侦听器和内部引用。
     * 调用`destroy()`之后请勿使用DisplayObject。
     *
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    destroy(_options?: IDestroyOptions|boolean): void
    {
        if (this.parent)
        {
            this.parent.removeChild(this);
        }
        this.removeAllListeners();
        this.transform = null;

        this.parent = null;
        this._bounds = null;
        this._mask = null;

        this.filters = null;
        this.filterArea = null;
        this.hitArea = null;

        this.interactive = false;
        this.interactiveChildren = false;

        this._destroyed = true;
    }

    /**
     * @protected
     * @member {PIXI.Container}
     */
    get _tempDisplayObjectParent(): TemporaryDisplayObject
    {
        if (this.tempDisplayObjectParent === null)
        {
            // eslint-disable-next-line @typescript-eslint/no-use-before-define
            this.tempDisplayObjectParent = new TemporaryDisplayObject();
        }

        return this.tempDisplayObjectParent;
    }

    /**
     * displayObject在x轴上相对于父级本地坐标的位置。
     * position.x的别名
     *
     * @member {number}
     */
    get x(): number
    {
        return this.position.x;
    }

    set x(value) // eslint-disable-line require-jsdoc
    {
        this.transform.position.x = value;
    }

    /**
     * displayObject在y轴上相对于父级本地坐标的位置
     * position.y的别名
     *
     * @member {number}
     */
    get y(): number
    {
        return this.position.y;
    }

    set y(value) // eslint-disable-line require-jsdoc
    {
        this.transform.position.y = value;
    }

    /**
     * 基于世界（父）因素的对象的当前变换。
     *
     * @member {PIXI.Matrix}
     * @readonly
     */
    get worldTransform(): Matrix
    {
        return this.transform.worldTransform;
    }

    /**
     * 基于局部因素的当前对象变换：位置、比例、其他内容。
     *
     * @member {PIXI.Matrix}
     * @readonly
     */
    get localTransform(): Matrix
    {
        return this.transform.localTransform;
    }

    /**
     * 对象相对于父对象的局部坐标的坐标。
     * pixi-v4开始按值传递。
     *
     * @member {PIXI.ObservablePoint}
     */
    get position(): ObservablePoint
    {
        return this.transform.position;
    }

    set position(value) // eslint-disable-line require-jsdoc
    {
        this.transform.position.copyFrom(value);
    }

    /**
     * 对象的比例因子。
     * pixi-v4开始按值传递。
     *
     * @member {PIXI.ObservablePoint}
     */
    get scale(): ObservablePoint
    {
        return this.transform.scale;
    }

    set scale(value) // eslint-disable-line require-jsdoc
    {
        this.transform.scale.copyFrom(value);
    }

    /**
     * 显示对象绕其旋转的轴心点。
     * pixi-v4开始按值传递。
     *
     * @member {PIXI.ObservablePoint}
     */
    get pivot(): ObservablePoint
    {
        return this.transform.pivot;
    }

    set pivot(value) // eslint-disable-line require-jsdoc
    {
        this.transform.pivot.copyFrom(value);
    }

    /**
     * 对象的歪斜因子，以弧度为单位。
     * pixi-v4开始按值传递。
     *
     * @member {PIXI.ObservablePoint}
     */
    get skew(): ObservablePoint
    {
        return this.transform.skew;
    }

    set skew(value) // eslint-disable-line require-jsdoc
    {
        this.transform.skew.copyFrom(value);
    }

    /**
     * 物体的弧度旋转。
     * 'rotation' 和 'angle' 对显示对象具有相同的效果； 旋转单位为弧度，角度单位为度。
     *
     * @member {number}
     */
    get rotation(): number
    {
        return this.transform.rotation;
    }

    set rotation(value) // eslint-disable-line require-jsdoc
    {
        this.transform.rotation = value;
    }

    /**
     * 物体的角度，以度为单位。
     * 'rotation' 和 'angle' 对显示对象具有相同的效果； 旋转单位为弧度，角度单位为度。
     *
     * @member {number}
     */
    get angle(): number
    {
        return this.transform.rotation * RAD_TO_DEG;
    }

    set angle(value) // eslint-disable-line require-jsdoc
    {
        this.transform.rotation = value * DEG_TO_RAD;
    }

    /**
     * displayObject的zIndex。
     * 如果容器的sortableChildren属性设置为true，则子容器将按zIndex值自动排序；值越大，则表示它将移向数组的末尾，
     * 并以此渲染在同一容器中的其他displayObjects之上。
     *
     * @member {number}
     */
    get zIndex(): number
    {
        return this._zIndex;
    }

    set zIndex(value) // eslint-disable-line require-jsdoc
    {
        this._zIndex = value;
        if (this.parent)
        {
            this.parent.sortDirty = true;
        }
    }

    /**
     * 指示对象是否世界可见。
     *
     * @member {boolean}
     * @readonly
     */
    get worldVisible(): boolean
    {
        let item = this as DisplayObject;

        do
        {
            if (!item.visible)
            {
                return false;
            }

            item = item.parent;
        } while (item);

        return true;
    }

    /**
     * 设置displayObject的遮罩。遮罩是将对象的可见性限制为应用于其的遮罩形状的对象。
     * 在PixiJS中，常规遮罩必须是{@link PIXI.Graphics}或{@link PIXI.Sprite}对象。
     * {@link PIXI.Graphics} or a {@link PIXI.Sprite} object. This allows for much faster masking in canvas as it
     * 这样可以在画布中更快地进行遮罩，因为它实用程序形状剪辑。若要删除掩码，请将此属性设置为`null`。
     *
     * 对于精灵遮罩，使用alpha和red通道。黑色遮罩与透明遮罩相同。
     * @example
     * const graphics = new PIXI.Graphics();
     * graphics.beginFill(0xFF3300);
     * graphics.drawRect(50, 250, 100, 100);
     * graphics.endFill();
     *
     * const sprite = new PIXI.Sprite(texture);
     * sprite.mask = graphics;
     * @todo 目前，PIXI.CanvasRenderer不支持PIXI.Sprite作为遮罩。
     *
     * @member {PIXI.Container|PIXI.MaskData}
     */
    get mask(): Container|MaskData
    {
        return this._mask;
    }

    set mask(value) // eslint-disable-line require-jsdoc
    {
        if (this._mask)
        {
            const maskObject = (this._mask as MaskData).maskObject || (this._mask as Container);

            maskObject.renderable = true;
            maskObject.isMask = false;
        }

        this._mask = value;

        if (this._mask)
        {
            const maskObject = (this._mask as MaskData).maskObject || (this._mask as Container);

            maskObject.renderable = false;
            maskObject.isMask = true;
        }
    }
}

class TemporaryDisplayObject extends DisplayObject
{
    calculateBounds: () => {} = null;
    removeChild: (child: DisplayObject) => {} = null;
    render: (renderer: Renderer) => {} = null;
    sortDirty: boolean = null;
}
