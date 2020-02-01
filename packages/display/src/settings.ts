import { settings } from '@pixi/settings';

/**
 * 设置容器属性'sortableChildren'的默认值。
 * 如果设置为true，则容器将在调用updateTransform()时,按zIndex值对其子项进行排序，
 * 如果调用sortChildren()则将对其进行手动排序。
 *
 * 这实际上会更改数组中元素的顺序，因此应将其视为与其他解决方案(例如: @link https://github.com/pixijs/pixi-display)
 * 相比性能不佳的基本解决方案
 *
 * 还要注意，这可能无法很好地与addChildAt()函数一起工作，
 * 因为zIndex排序可能会导致子项自动排序到另一个位置。
 *
 * @static
 * @constant
 * @name SORTABLE_CHILDREN
 * @memberof PIXI.settings
 * @type {boolean}
 * @default false
 */
settings.SORTABLE_CHILDREN = false;

export { settings };
