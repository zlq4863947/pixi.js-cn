/**
 * {@link PIXI.accessibility.AccessibilityManager}使用的可访问对象的默认属性值
 *
 * @private
 * @function accessibleTarget
 * @memberof PIXI.accessibility
 * @type {Object}
 * @example
 *      function MyObject() {}
 *
 *      Object.assign(
 *          MyObject.prototype,
 *          PIXI.accessibility.accessibleTarget
 *      );
 */
export const accessibleTarget = {
    /**
     * 标记对象是否可访问。 如果为true，AccessibilityManager将使用属性集覆盖阴影div
     *
     * @member {boolean}
     * @memberof PIXI.DisplayObject#
     */
    accessible: false,

    /**
     * 设置阴影div的title属性。如果尚未设置accessibleTitle和accessibleHint，则默认为 'displayObject [tabIndex]'
     *
     * @member {?string}
     * @memberof PIXI.DisplayObject#
     */
    accessibleTitle: null,

    /**
     * 设置阴影div的aria-label属性
     *
     * @member {string}
     * @memberof PIXI.DisplayObject#
     */
    accessibleHint: null,

    /**
     * @member {number}
     * @memberof PIXI.DisplayObject#
     * @private
     * @todo Needs docs.
     */
    tabIndex: 0,

    /**
     * @member {boolean}
     * @memberof PIXI.DisplayObject#
     * @todo Needs docs.
     */
    _accessibleActive: false,

    /**
     * @member {boolean}
     * @memberof PIXI.DisplayObject#
     * @todo Needs docs.
     */
    _accessibleDiv: false,

    /**
     * 指定可访问层的div的类型。 屏幕阅读器会根据此类型对元素进行不同的处理。
     * 默认为 button.
     *
     * @member {string}
     * @memberof PIXI.DisplayObject#
     * @default 'button'
     */
    accessibleType: 'button',

    /**
     * 指定可访问的div将使用的指针事件
     * 默认为'auto'
     *
     * @member {string}
     * @memberof PIXI.DisplayObject#
     * @default 'auto'
     */
    accessiblePointerEvents: 'auto',

    /**
     * 设置为false将阻止访问此容器中的所有子级。 默认为true。
     *
     * @member {boolean}
     * @memberof PIXI.DisplayObject#
     * @default true
     */
    accessibleChildren: true,
};
