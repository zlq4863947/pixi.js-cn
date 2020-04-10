/**
 * 碰撞区域类的接口。
 *
 * 它由以下类实现:
 * - {@link PIXI.Circle}
 * - {@link PIXI.Ellipse}
 * - {@link PIXI.Polygon}
 * - {@link PIXI.RoundedRectangle}
 *
 * @interface IHitArea
 * @memberof PIXI
 */

/**
 * 检查指定的x和y坐标是否包含在该区域内
 *
 * @method
 * @name contains
 * @memberof PIXI.IHitArea#
 * @param {number} x - 测试点的X坐标
 * @param {number} y - 测试点的Y坐标
 * @return {boolean} x/y 坐标是否在此区域内
 */

/**
 * 交互式对象的默认属性值
 * 使用 {@link PIXI.interaction.InteractionManager} 自动为所有DisplayObject提供这些属性
 *
 * @private
 * @name interactiveTarget
 * @type {Object}
 * @memberof PIXI.interaction
 * @example
 *      function MyObject() {}
 *
 *      Object.assign(
 *          DisplayObject.prototype,
 *          PIXI.interaction.interactiveTarget
 *      );
 */
export const interactiveTarget = {

    /**
     * 启用DisplayObject的交互事件。如果不将`interactive`设置为`true`，则不会触发触摸，指针和鼠标事件。
     *
     * @example
     * const sprite = new PIXI.Sprite(texture);
     * sprite.interactive = true;
     * sprite.on('tap', (event) => {
     *    //处理事件
     * });
     * @member {boolean}
     * @memberof PIXI.DisplayObject#
     */
    interactive: false,

    /**
     * 确定是否可以触发displayObject的子节点的clicked/touched
     * 设置为false将允许PixiJS绕过递归的`hitTest`函数
     *
     * @member {boolean}
     * @memberof PIXI.Container#
     */
    interactiveChildren: true,

    /**
     * 元素可点击范围
     * 互动形状。首先将命中子集，然后再检查此形状。
     * 设置此项将导致在命中测试中将使用此范围，而不是显示对象的边界范围。
     *
     * @example
     * const sprite = new PIXI.Sprite(texture);
     * sprite.interactive = true;
     * sprite.hitArea = new PIXI.Rectangle(0, 0, 100, 100);
     * @member {PIXI.IHitArea}
     * @memberof PIXI.DisplayObject#
     */
    hitArea: null,

    /**
     * 如果启用，则鼠标光标悬停在displayObject上时，如果它是交互式的，则使用指针行为
     * 设置此项会将'cursor'属性更改为''pointer'`。
     *
     * @example
     * const sprite = new PIXI.Sprite(texture);
     * sprite.interactive = true;
     * sprite.buttonMode = true;
     * @member {boolean}
     * @memberof PIXI.DisplayObject#
     */
    get buttonMode()
    {
        return this.cursor === 'pointer';
    },
    set buttonMode(value)
    {
        if (value)
        {
            this.cursor = 'pointer';
        }
        else if (this.cursor === 'pointer')
        {
            this.cursor = null;
        }
    },

    /**
     * 定义鼠标光标时使用的光标模式悬停在displayObject上。
     *
     * @example
     * const sprite = new PIXI.Sprite(texture);
     * sprite.interactive = true;
     * sprite.cursor = 'wait';
     * @see https://developer.mozilla.org/en/docs/Web/CSS/cursor
     *
     * @member {string}
     * @memberof PIXI.DisplayObject#
     */
    cursor: null,

    /**
     * 所有活动指针的内部集合（按标识符）
     *
     * @member {Map<number, InteractionTrackingData>}
     * @memberof PIXI.DisplayObject#
     * @private
     */
    get trackedPointers()
    {
        if (this._trackedPointers === undefined) this._trackedPointers = {};

        return this._trackedPointers;
    },

    /**
     * 所有标识符跟踪指针的映射。 使用trackedPointers进行访问。
     *
     * @private
     * @type {Map<number, InteractionTrackingData>}
     */
    _trackedPointers: undefined,
};
