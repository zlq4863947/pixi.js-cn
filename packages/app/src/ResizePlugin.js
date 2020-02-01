/**
 * 用于应用程序调整大小功能的中间件
 * @private
 * @class
 */
export class ResizePlugin
{
    /**
     * 使用应用程序实例的范围初始化插件
     * @static
     * @private
     * @param {object} [options] - 查看应用程序选项
     */
    static init(options)
    {
        /**
         * 调整应用程序大小的元素或窗口。
         * @type {Window|HTMLElement}
         * @name resizeTo
         * @memberof PIXI.Application#
         */
        Object.defineProperty(this, 'resizeTo',
            {
                set(dom)
                {
                    window.removeEventListener('resize', this.resize);
                    this._resizeTo = dom;
                    if (dom)
                    {
                        window.addEventListener('resize', this.resize);
                        this.resize();
                    }
                },
                get()
                {
                    return this._resizeTo;
                },
            });

        /**
         * 如果设置了`resizeTo`，则调用此函数重置该元素的宽度和高度。
         * @method PIXI.Application#resize
         */
        this.resize = () =>
        {
            if (this._resizeTo)
            {
                // Resize to the window
                if (this._resizeTo === window)
                {
                    this.renderer.resize(
                        window.innerWidth,
                        window.innerHeight,
                    );
                }
                // Resize to other HTML entities
                else
                {
                    this.renderer.resize(
                        this._resizeTo.clientWidth,
                        this._resizeTo.clientHeight,
                    );
                }
            }
        };

        // On resize
        this._resizeTo = null;
        this.resizeTo = options.resizeTo || null;
    }

    /**
     * 清理应用程序范围内的ticker
     * @static
     * @private
     */
    static destroy()
    {
        this.resizeTo = null;
        this.resize = null;
    }
}
