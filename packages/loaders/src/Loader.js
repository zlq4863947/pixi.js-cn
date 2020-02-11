import { Loader as ResourceLoader, middleware } from 'resource-loader';
import { EventEmitter } from '@pixi/utils';
import { TextureLoader } from './TextureLoader';

/**
 * 全新的加载器，扩展了Chad Engler的Resource Loader: https://github.com/englercj/resource-loader
 *
 * ```js
 * const loader = PIXI.Loader.shared; // PixiJS公开了一个预制实例供您使用。
 * //或
 * const loader = new PIXI.Loader(); // 您也可以根据需要创建自己的
 *
 * const sprites = {};
 *
 * // Chainable `add` to enqueue a resource
 * // 可链接的`add`使资源进入队列
 * loader.add('bunny', 'data/bunny.png')
 *       .add('spaceship', 'assets/spritesheet.json');
 * loader.add('scoreFont', 'assets/score.fnt');
 *
 * // 可链接的 `pre` 添加一个为每种资源运行的中间件，在加载该资源*之前*。
 * // 这对于实现自定义缓存模块（使用文件系统，indexeddb，内存等）很有用。
 * loader.pre(cachingMiddleware);
 *
 * // 可链接的 `use` 添加一个为每个资源运行的中间件，在加载该资源*之后*。
 * // 这对于实现自定义解析模块（如精灵表解析器，骨骼解析器等）很有用。
 * loader.use(parsingMiddleware);
 *
 * // `load` 方法加载资源队列，并在所有资源加载完毕后调用传入的回调。
 * loader.load((loader, resources) => {
 *     // resources是一个对象，其中key是加载的资源的名称，而value是资源对象。
 *     // 它们具有几个默认属性:
 *     // - `url`: 从中加载资源的URL
 *     // - `error`: 尝试加载时发生的错误（如果有）
 *     // - `data`: 加载的原始数据
 *     // 也可以包含其他基于运行的中间件的属性。
 *     sprites.bunny = new PIXI.TilingSprite(resources.bunny.texture);
 *     sprites.spaceship = new PIXI.TilingSprite(resources.spaceship.texture);
 *     sprites.scoreFont = new PIXI.TilingSprite(resources.scoreFont.texture);
 * });
 *
 * // 在整个过程中，可以发出多个信号。
 * loader.onProgress.add(() => {}); // 每个加载/错误的文件调用一次
 * loader.onError.add(() => {}); // 每个错误文件调用一次
 * loader.onLoad.add(() => {}); // 每个加载文件调用一次
 * loader.onComplete.add(() => {}); // 排队的资源全部加载时调用一次。
 * ```
 *
 * @see https://github.com/englercj/resource-loader
 *
 * @class Loader
 * @memberof PIXI
 * @param {string} [baseUrl=''] - 此加载器加载的所有资源的基础URL。
 * @param {number} [concurrency=10] - 要同时加载的资源数量。
 */
export class Loader extends ResourceLoader
{
    constructor(baseUrl, concurrency)
    {
        super(baseUrl, concurrency);
        EventEmitter.call(this);

        for (let i = 0; i < Loader._plugins.length; ++i)
        {
            const plugin = Loader._plugins[i];
            const { pre, use } = plugin;

            if (pre)
            {
                this.pre(pre);
            }

            if (use)
            {
                this.use(use);
            }
        }

        // Compat layer, translate the new v2 signals into old v1 events.
        this.onStart.add((l) => this.emit('start', l));
        this.onProgress.add((l, r) => this.emit('progress', l, r));
        this.onError.add((e, l, r) => this.emit('error', e, l, r));
        this.onLoad.add((l, r) => this.emit('load', l, r));
        this.onComplete.add((l, r) => this.emit('complete', l, r));

        /**
         * If this loader cannot be destroyed.
         * @member {boolean}
         * @default false
         * @private
         */
        this._protected = false;
    }

    /**
     * Destroy the loader, removes references.
     * @private
     */
    destroy()
    {
        if (!this._protected)
        {
            this.removeAllListeners();
            this.reset();
        }
    }

    /**
     * 加载器的预制实例，可用于加载资源。
     * @name shared
     * @type {PIXI.Loader}
     * @static
     * @memberof PIXI.Loader
     */
    static get shared()
    {
        let shared = Loader._shared;

        if (!shared)
        {
            shared = new Loader();
            shared._protected = true;
            Loader._shared = shared;
        }

        return shared;
    }
}

// Copy EE3 prototype (mixin)
Object.assign(Loader.prototype, EventEmitter.prototype);

/**
 * 加载器的所有已安装`use`中间件的集合。
 *
 * @static
 * @member {Array<PIXI.ILoaderPlugin>} _plugins
 * @memberof PIXI.Loader
 * @private
 */
Loader._plugins = [];

/**
 * 为全局共享的加载器和创建的所有新的Loader实例添加一个Loader插件。
 *
 * @static
 * @method registerPlugin
 * @memberof PIXI.Loader
 * @param {PIXI.ILoaderPlugin} plugin - 要添加的插件
 * @return {PIXI.Loader} PIXI.Loader的引用
 */
Loader.registerPlugin = function registerPlugin(plugin)
{
    Loader._plugins.push(plugin);

    if (plugin.add)
    {
        plugin.add();
    }

    return Loader;
};

// parse any blob into more usable objects (e.g. Image)
Loader.registerPlugin({ use: middleware.parsing });

// parse any Image objects into textures
Loader.registerPlugin(TextureLoader);

/**
 * 要安装用于处理特定加载器资源的插件。
 *
 * @memberof PIXI
 * @typedef ILoaderPlugin
 * @property {function} [add] - 注册插件后立即调用的函数。
 * @property {PIXI.Loader.loaderMiddleware} [pre] - 要在加载前运行的中间件函数，其参数为 `(resource, next)`
 * @property {PIXI.Loader.loaderMiddleware} [use] - 加载后要运行的中间件函数，其参数为 `(resource, next)`
 */

/**
 * @memberof PIXI.Loader
 * @callback loaderMiddleware
 * @param {PIXI.LoaderResource} resource
 * @param {function} next
 */

/**
 * @memberof PIXI.Loader#
 * @member {object} onStart
 */

/**
 * @memberof PIXI.Loader#
 * @member {object} onProgress
 */

/**
 * @memberof PIXI.Loader#
 * @member {object} onError
 */

/**
 * @memberof PIXI.Loader#
 * @member {object} onLoad
 */

/**
 * @memberof PIXI.Loader#
 * @member {object} onComplete
 */
