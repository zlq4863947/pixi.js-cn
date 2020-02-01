/**
 * 可用作系统渲染器插件的通用对象渲染器的基础。
 *
 * @class
 * @extends PIXI.System
 * @memberof PIXI
 */
export class ObjectRenderer
{
    /**
     * @param {PIXI.Renderer} renderer - 此管理器工作的渲染器。
     */
    constructor(renderer)
    {
        /**
         * 此管理器工作的渲染器。
         *
         * @member {PIXI.Renderer}
         */
        this.renderer = renderer;
    }

    /**
     * 应该通过现在渲染对象来清空当前批次的Stub方法。
     */
    flush()
    {
        // flush!
    }

    /**
     * 释放所有资源的通用销毁方法。 这应该由子类调用。
     */
    destroy()
    {
        this.renderer = null;
    }

    /**
     * Stub 方法，用于初始化渲染开始之前所需的任何状态。
     * 它与`prerender`信号不同，后者在每个帧中都会出现，
     * 因为每当对象专门请求_this_渲染器时都会调用该信号。
     */
    start()
    {
        // set the shader..
    }

    /**
     * 停止渲染器。 它应该释放任何状态，并变为休眠。
     */
    stop()
    {
        this.flush();
    }

    /**
     * 保留要渲染的对象。不必立即渲染。
     *
     * @param {PIXI.DisplayObject} object - 要渲染的对象。
     */
    render(object) // eslint-disable-line no-unused-vars
    {
        // render the object
    }
}
