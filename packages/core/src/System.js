/**
 * System是一个基类，用于扩展{@link PIXI.Renderer}使用的系统
 *
 * @see PIXI.Renderer#addSystem
 * @class
 * @memberof PIXI
 */
export class System
{
    /**
     * @param {PIXI.Renderer} renderer - 此管理器作用的渲染器
     */
    constructor(renderer)
    {
        /**
         * 此管理器作用的渲染器。
         *
         * @member {PIXI.Renderer}
         */
        this.renderer = renderer;
    }

    /**
     * 子类将覆盖通用销毁方法
     */
    destroy()
    {
        this.renderer = null;
    }
}
