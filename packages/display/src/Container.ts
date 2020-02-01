import { MaskData, Renderer } from '@pixi/core';
import { settings } from '@pixi/settings';
import { removeItems } from '@pixi/utils';
import { DisplayObject, IDestroyOptions } from './DisplayObject';

function sortChildren(a: DisplayObject, b: DisplayObject): number
{
    if (a.zIndex === b.zIndex)
    {
        return a._lastSortedIndex - b._lastSortedIndex;
    }

    return a.zIndex - b.zIndex;
}

/**
 * 容器代表显示对象的集合。
 *
 * 它是所有显示对象的基类，这些显示对象充当其他对象（例如Sprites）的容器。
 *
 *```js
 * let container = new PIXI.Container();
 * container.addChild(sprite);
 * ```
 *
 * @class
 * @extends PIXI.DisplayObject
 * @memberof PIXI
 */
export class Container extends DisplayObject
{
    public readonly children: DisplayObject[];
    public sortableChildren: boolean;
    public sortDirty: boolean;
    public containerUpdateTransform: () => void;

    protected _width: number;
    protected _height: number;

    constructor()
    {
        super();

        /**
         * 此容器的子级数组。
         *
         * @member {PIXI.DisplayObject[]}
         * @readonly
         */
        this.children = [];

        /**
         * 如果设置为true，则在调用updateTransform()时容器将按zIndex值对其子级进行排序，
         * 或者在调用sortChildren()时手动排序。
         *
         * 这实际上会更改数组中元素的顺序，因此应将其视为与其他解决方案相比性能不佳的基本解决方案，
         * 例如 @link https://github.com/pixijs/pixi-display
         *
         * 还要注意，这可能无法很好地与addChildAt()函数一起工作，
         * 因为zIndex排序可能会导致子项自动排序到另一个位置。
         *
         * @see PIXI.settings.SORTABLE_CHILDREN
         *
         * @member {boolean}
         */
        this.sortableChildren = settings.SORTABLE_CHILDREN;

        /**
         * 在下一次updateTransform调用时，是否应按zIndex对子级进行排序。
         * 如果添加了新子级或子级的zIndex更改，则将自动设置为true。
         *
         * @member {boolean}
         */
        this.sortDirty = false;

        // performance increase to avoid using call.. (10x faster)
        this.containerUpdateTransform = this.updateTransform;

        /**
         * 向此容器中添加DisplayObject时触发。
         *
         * @event PIXI.Container#childAdded
         * @param {PIXI.DisplayObject} child - 添加到容器中的子项。
         * @param {PIXI.Container} container - 添加子项的容器。
         * @param {number} index - 添加子项的子项索引。
         */

        /**
         * 从该容器中删除DisplayObject时触发。
         *
         * @event PIXI.DisplayObject#removedFrom
         * @param {PIXI.DisplayObject} child - 从容器中取出的子项。
         * @param {PIXI.Container} container - 移除子项的容器。
         * @param {number} index - 删除子项的子项索引。
         */
    }

    /**
     * 可重写的方法，每当修改子数组时，容器子类都可以使用该方法
     *
     * @protected
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected onChildrenChange(_length: number): void
    {
        /* empty */
    }

    /**
     * 将一个或多个子项添加到容器中。
     *
     * 可以像这样添加多个项: `myContainer.addChild(thingOne, thingTwo, thingThree)`
     *
     * @param {...PIXI.DisplayObject} children - 要添加到容器的显示对象(可以为复数个)
     * @return {PIXI.DisplayObject} 添加的第一个子项。
     */
    addChild<T extends DisplayObject[]>(...children: T): T[0]
    {
        // if there is only one argument we can bypass looping through the them
        if (children.length > 1)
        {
            // loop through the array and add all children
            for (let i = 0; i < children.length; i++)
            {
                // eslint-disable-next-line prefer-rest-params
                this.addChild(children[i]);
            }
        }
        else
        {
            const child = children[0];
            // if the child has a parent then lets remove it as PixiJS objects can only exist in one place

            if (child.parent)
            {
                child.parent.removeChild(child);
            }

            child.parent = this;
            this.sortDirty = true;

            // ensure child transform will be recalculated
            child.transform._parentID = -1;

            this.children.push(child);

            // ensure bounds will be recalculated
            this._boundsID++;

            // TODO - lets either do all callbacks or all events.. not both!
            this.onChildrenChange(this.children.length - 1);
            this.emit('childAdded', child, this, this.children.length - 1);
            child.emit('added', this);
        }

        return children[0];
    }

    /**
     * 在指定索引处向容器添加子项。如果索引超出界限，将抛出一个错误
     *
     * @param {PIXI.DisplayObject} child - 要添加的子项
     * @param {number} index - 放置子项的索引
     * @return {PIXI.DisplayObject} 添加的子项。
     */
    addChildAt<T extends DisplayObject>(child: T, index: number): T
    {
        if (index < 0 || index > this.children.length)
        {
            throw new Error(`${child}addChildAt: The index ${index} supplied is out of bounds ${this.children.length}`);
        }

        if (child.parent)
        {
            child.parent.removeChild(child);
        }

        child.parent = this;
        this.sortDirty = true;

        // ensure child transform will be recalculated
        child.transform._parentID = -1;

        this.children.splice(index, 0, child);

        // ensure bounds will be recalculated
        this._boundsID++;

        // TODO - lets either do all callbacks or all events.. not both!
        this.onChildrenChange(index);
        child.emit('added', this);
        this.emit('childAdded', child, this, index);

        return child;
    }

    /**
     * 交换此容器中两个显示对象的位置。
     *
     * @param {PIXI.DisplayObject} child - 要交换的第一个显示对象
     * @param {PIXI.DisplayObject} child2 - 要交换的第二个显示对象
     */
    swapChildren(child: DisplayObject, child2: DisplayObject): void
    {
        if (child === child2)
        {
            return;
        }

        const index1 = this.getChildIndex(child);
        const index2 = this.getChildIndex(child2);

        this.children[index1] = child2;
        this.children[index2] = child;
        this.onChildrenChange(index1 < index2 ? index1 : index2);
    }

    /**
     * 返回子DisplayObject实例的索引位置
     *
     * @param {PIXI.DisplayObject} child - 要标识的DisplayObject实例
     * @return {number} 要标识的子显示对象的索引位置
     */
    getChildIndex(child: DisplayObject): number
    {
        const index = this.children.indexOf(child);

        if (index === -1)
        {
            throw new Error('The supplied DisplayObject must be a child of the caller');
        }

        return index;
    }

    /**
     * 更改现有子项在显示对象容器中的位置
     *
     * @param {PIXI.DisplayObject} child - 要为其更改索引号的子DisplayObject实例
     * @param {number} index - 子显示对象的结果索引
     */
    setChildIndex(child: DisplayObject, index: number): void
    {
        if (index < 0 || index >= this.children.length)
        {
            throw new Error(`The index ${index} supplied is out of bounds ${this.children.length}`);
        }

        const currentIndex = this.getChildIndex(child);

        removeItems(this.children, currentIndex, 1); // remove from old position
        this.children.splice(index, 0, child); // add at new position

        this.onChildrenChange(index);
    }

    /**
     * 返回指定索引处的子级
     *
     * @param {number} index - 查找的子项索引
     * @return {PIXI.DisplayObject} 给定索引处的子级（如果有）。
     */
    getChildAt(index: number): DisplayObject
    {
        if (index < 0 || index >= this.children.length)
        {
            throw new Error(`getChildAt: Index (${index}) does not exist.`);
        }

        return this.children[index];
    }

    /**
     * 从容器中取出一个或多个子项。
     *
     * @param {...PIXI.DisplayObject} children - 要删除的DisplayObject(可以为复数个)
     * @return {PIXI.DisplayObject} 被删除的第一个子项目。
     */
    removeChild<T extends DisplayObject[]>(...children: T): T[0]
    {
        // if there is only one argument we can bypass looping through the them
        if (children.length > 1)
        {
            // loop through the arguments property and remove all children
            for (let i = 0; i < children.length; i++)
            {
                this.removeChild(children[i]);
            }
        }
        else
        {
            const child = children[0];
            const index = this.children.indexOf(child);

            if (index === -1) return null;

            child.parent = null;
            // ensure child transform will be recalculated
            child.transform._parentID = -1;
            removeItems(this.children, index, 1);

            // ensure bounds will be recalculated
            this._boundsID++;

            // TODO - lets either do all callbacks or all events.. not both!
            this.onChildrenChange(index);
            child.emit('removed', this);
            this.emit('childRemoved', child, this, index);
        }

        return children[0];
    }

    /**
     * 从指定的索引位置删除子项。
     *
     * @param {number} index - 要删除的子项索引
     * @return {PIXI.DisplayObject} 被删除的子项。
     */
    removeChildAt(index: number): DisplayObject
    {
        const child = this.getChildAt(index);

        // ensure child transform will be recalculated..
        child.parent = null;
        child.transform._parentID = -1;
        removeItems(this.children, index, 1);

        // ensure bounds will be recalculated
        this._boundsID++;

        // TODO - lets either do all callbacks or all events.. not both!
        this.onChildrenChange(index);
        child.emit('removed', this);
        this.emit('childRemoved', child, this, index);

        return child;
    }

    /**
     * 从此容器中删除在开始索引和结束索引内的所有子项。
     *
     * @param {number} [beginIndex=0] - 起始位置。
     * @param {number} [endIndex=this.children.length] - 结束位置。 默认值是容器的大小。
     * @returns {PIXI.DisplayObject[]} 被删除的子项列表
     */
    removeChildren(beginIndex = 0, endIndex = this.children.length): DisplayObject[]
    {
        const begin = beginIndex;
        const end = endIndex;
        const range = end - begin;
        let removed;

        if (range > 0 && range <= end)
        {
            removed = this.children.splice(begin, range);

            for (let i = 0; i < removed.length; ++i)
            {
                removed[i].parent = null;
                if (removed[i].transform)
                {
                    removed[i].transform._parentID = -1;
                }
            }

            this._boundsID++;

            this.onChildrenChange(beginIndex);

            for (let i = 0; i < removed.length; ++i)
            {
                removed[i].emit('removed', this);
                this.emit('childRemoved', removed[i], this, i);
            }

            return removed;
        }
        else if (range === 0 && this.children.length === 0)
        {
            return [];
        }

        throw new RangeError('removeChildren: numeric values are outside the acceptable range.');
    }

    /**
     * 按zIndex对子项进行排序。对于具有相同zIndex的2个子项，将维持先前的顺序。
     */
    sortChildren(): void
    {
        let sortRequired = false;

        for (let i = 0, j = this.children.length; i < j; ++i)
        {
            const child = this.children[i];

            child._lastSortedIndex = i;

            if (!sortRequired && child.zIndex !== 0)
            {
                sortRequired = true;
            }
        }

        if (sortRequired && this.children.length > 1)
        {
            this.children.sort(sortChildren);
        }

        this.sortDirty = false;
    }

    /**
     * 更新此容器的所有子项的变换以进行渲染
     */
    updateTransform(): void
    {
        if (this.sortableChildren && this.sortDirty)
        {
            this.sortChildren();
        }

        this._boundsID++;

        this.transform.updateTransform(this.parent.transform);

        // TODO: check render flags, how to process stuff here
        this.worldAlpha = this.alpha * this.parent.worldAlpha;

        for (let i = 0, j = this.children.length; i < j; ++i)
        {
            const child = this.children[i];

            if (child.visible)
            {
                child.updateTransform();
            }
        }
    }

    /**
     * Recalculates the bounds of the container.
     *
     */
    calculateBounds(): void
    {
        this._bounds.clear();

        this._calculateBounds();

        for (let i = 0; i < this.children.length; i++)
        {
            const child = this.children[i];

            if (!child.visible || !child.renderable)
            {
                continue;
            }

            child.calculateBounds();

            // TODO: filter+mask, need to mask both somehow
            if (child._mask)
            {
                const maskObject = ((child._mask as MaskData).maskObject || child._mask) as Container;

                maskObject.calculateBounds();
                this._bounds.addBoundsMask(child._bounds, maskObject._bounds);
            }
            else if (child.filterArea)
            {
                this._bounds.addBoundsArea(child._bounds, child.filterArea);
            }
            else
            {
                this._bounds.addBounds(child._bounds);
            }
        }

        this._bounds.updateID = this._boundsID;
    }

    /**
     * 重新计算对象的边界。重写此项以计算特定对象（不包括子项）的边界。
     *
     * @protected
     */
    protected _calculateBounds(): void
    {
        // FILL IN//
    }

    /**
     * 使用WebGL渲染器渲染对象
     *
     * @param {PIXI.Renderer} renderer - 渲染器
     */
    render(renderer: Renderer): void
    {
        // if the object is not visible or the alpha is 0 then no need to render this element
        if (!this.visible || this.worldAlpha <= 0 || !this.renderable)
        {
            return;
        }

        // do a quick check to see if this element has a mask or a filter.
        if (this._mask || (this.filters && this.filters.length))
        {
            this.renderAdvanced(renderer);
        }
        else
        {
            this._render(renderer);

            // simple render children!
            for (let i = 0, j = this.children.length; i < j; ++i)
            {
                this.children[i].render(renderer);
            }
        }
    }

    /**
     * 使用WebGL渲染器和高级功能渲染对象。
     *
     * @protected
     * @param {PIXI.Renderer} renderer - 渲染器
     */
    protected renderAdvanced(renderer: Renderer): void
    {
        renderer.batch.flush();

        const filters = this.filters;
        const mask = this._mask;

        // push filter first as we need to ensure the stencil buffer is correct for any masking
        if (filters)
        {
            if (!this._enabledFilters)
            {
                this._enabledFilters = [];
            }

            this._enabledFilters.length = 0;

            for (let i = 0; i < filters.length; i++)
            {
                if (filters[i].enabled)
                {
                    this._enabledFilters.push(filters[i]);
                }
            }

            if (this._enabledFilters.length)
            {
                renderer.filter.push(this, this._enabledFilters);
            }
        }

        if (mask)
        {
            renderer.mask.push(this, this._mask);
        }

        // add this object to the batch, only rendered if it has a texture.
        this._render(renderer);

        // now loop through the children and make sure they get rendered
        for (let i = 0, j = this.children.length; i < j; i++)
        {
            this.children[i].render(renderer);
        }

        renderer.batch.flush();

        if (mask)
        {
            renderer.mask.pop(this, this._mask);
        }

        if (filters && this._enabledFilters && this._enabledFilters.length)
        {
            renderer.filter.pop();
        }
    }

    /**
     * 被子类覆盖。
     *
     * @protected
     * @param {PIXI.Renderer} renderer - 渲染器
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected _render(_renderer: Renderer): void // eslint-disable-line no-unused-vars
    {
        // this is where content itself gets rendered...
    }

    /**
     * 删除所有内部引用和侦听器，并从显示列表中删除子项。
     * 调用`destroy`后不要再使用容器。
     *
     * @param {object|boolean} [options] - 可选参数，布尔值将充当所有选项都已设置为该值的作用
     * @param {boolean} [options.children=false] - 如果设置为true，则所有子项也将调用其destroy方法。
     *  'options'将传递给这些调用。
     * @param {boolean} [options.texture=false] - 仅在options.children设置为true时，应用用于子精灵
     * 将销毁子精灵的纹理
     * @param {boolean} [options.baseTexture=false] - 仅在options.children设置为true时，应用用于子精灵
     *  将销毁子精灵的基础纹理
     */
    destroy(options?: IDestroyOptions|boolean): void
    {
        super.destroy();

        this.sortDirty = false;

        const destroyChildren = typeof options === 'boolean' ? options : options && options.children;

        const oldChildren = this.removeChildren(0, this.children.length);

        if (destroyChildren)
        {
            for (let i = 0; i < oldChildren.length; ++i)
            {
                oldChildren[i].destroy(options);
            }
        }
    }

    /**
     * 容器的宽度，设置此值实际上会修改比例，以达到设置的值
     *
     * @member {number}
     */
    get width(): number
    {
        return this.scale.x * this.getLocalBounds().width;
    }

    set width(value) // eslint-disable-line require-jsdoc
    {
        const width = this.getLocalBounds().width;

        if (width !== 0)
        {
            this.scale.x = value / width;
        }
        else
        {
            this.scale.x = 1;
        }

        this._width = value;
    }

    /**
     * 容器的高度，设置此高度实际上会修改比例，以达到设置的值
     *
     * @member {number}
     */
    get height(): number
    {
        return this.scale.y * this.getLocalBounds().height;
    }

    set height(value) // eslint-disable-line require-jsdoc
    {
        const height = this.getLocalBounds().height;

        if (height !== 0)
        {
            this.scale.y = value / height;
        }
        else
        {
            this.scale.y = 1;
        }

        this._height = value;
    }
}
