import { BaseTextureCache, EventEmitter, isPow2, TextureCache, uid } from '@pixi/utils';
import { FORMATS, SCALE_MODES, TARGETS, TYPES, ALPHA_MODES } from '@pixi/constants';

import { Resource } from './resources/Resource';
import { BufferResource } from './resources/BufferResource';
import { autoDetectResource } from './resources/autoDetectResource';

import { settings } from '@pixi/settings';

const defaultBufferOptions = {
    scaleMode: SCALE_MODES.NEAREST,
    format: FORMATS.RGBA,
    alphaMode: ALPHA_MODES.NPM,
};

/**
 * 纹理存储表示图像的信息。
 * 所有纹理都有一个基础纹理，其中包含有关源的信息。
 * 因此，您可以使用单个BaseTexture获得许多纹理。
 *
 * @class
 * @extends PIXI.utils.EventEmitter
 * @memberof PIXI
 * @param {PIXI.resources.Resource|string|HTMLImageElement|HTMLCanvasElement|HTMLVideoElement} [resource=null]
 *        对于不是Resource的对象，要使用的当前资源将其转换为资源。
 * @param {Object} [options] - 选项集
 * @param {PIXI.MIPMAP_MODES} [options.mipmap=PIXI.settings.MIPMAP_TEXTURES] - 为纹理启用mipmapping
 * @param {number} [options.anisotropicLevel=PIXI.settings.ANISOTROPIC_LEVEL] - 各向异性过滤级别的纹理
 * @param {PIXI.WRAP_MODES} [options.wrapMode=PIXI.settings.WRAP_MODE] - 纹理包裹模式
 * @param {PIXI.SCALE_MODES} [options.scaleMode=PIXI.settings.SCALE_MODE] - 默认缩放模式, linear, nearest
 * @param {PIXI.FORMATS} [options.format=PIXI.FORMATS.RGBA] - GL格式类型
 * @param {PIXI.TYPES} [options.type=PIXI.TYPES.UNSIGNED_BYTE] - GL数据类型
 * @param {PIXI.TARGETS} [options.target=PIXI.TARGETS.TEXTURE_2D] - GL纹理目标
 * @param {PIXI.ALPHA_MODES} [options.alphaMode=PIXI.ALPHA_MODES.UNPACK] - 预乘图像alpha
 * @param {number} [options.width=0] - 纹理的宽度
 * @param {number} [options.height=0] - 纹理的高度
 * @param {number} [options.resolution] - 基础纹理的分辨率
 * @param {object} [options.resourceOptions] - 可选资源选项，
 *        查看 {@link PIXI.resources.autoDetectResource autoDetectResource}
 */
export class BaseTexture extends EventEmitter
{
    constructor(resource = null, options = null)
    {
        super();

        options = options || {};

        const { alphaMode, mipmap, anisotropicLevel, scaleMode, width, height,
            wrapMode, format, type, target, resolution, resourceOptions } = options;

        // Convert the resource to a Resource object
        if (resource && !(resource instanceof Resource))
        {
            resource = autoDetectResource(resource, resourceOptions);
            resource.internal = true;
        }

        /**
         * 加载图像后设置的基础纹理的宽度
         *
         * @readonly
         * @member {number}
         */
        this.width = width || 0;

        /**
         * 加载图像后设置的基础纹理的高度
         *
         * @readonly
         * @member {number}
         */
        this.height = height || 0;

        /**
         * 分辨率/纹理的设备像素比率
         *
         * @member {number}
         * @default PIXI.settings.RESOLUTION
         */
        this.resolution = resolution || settings.RESOLUTION;

        /**
         * 纹理的Mipmap模式，影响缩小的图像
         *
         * @member {PIXI.MIPMAP_MODES}
         * @default PIXI.settings.MIPMAP_TEXTURES
         */
        this.mipmap = mipmap !== undefined ? mipmap : settings.MIPMAP_TEXTURES;

        /**
         * 各向异性过滤级别的纹理
         *
         * @member {number}
         * @default PIXI.settings.ANISOTROPIC_LEVEL
         */
        this.anisotropicLevel = anisotropicLevel !== undefined ? anisotropicLevel : settings.ANISOTROPIC_LEVEL;

        /**
         * 纹理如何包裹
         * @member {number}
         */
        this.wrapMode = wrapMode || settings.WRAP_MODE;

        /**
         * 缩放此纹理时应用的缩放模式
         *
         * @member {PIXI.SCALE_MODES}
         * @default PIXI.settings.SCALE_MODE
         */
        this.scaleMode = scaleMode !== undefined ? scaleMode : settings.SCALE_MODE;

        /**
         * 纹理的像素格式
         *
         * @member {PIXI.FORMATS}
         * @default PIXI.FORMATS.RGBA
         */
        this.format = format || FORMATS.RGBA;

        /**
         * 资源数据的类型
         *
         * @member {PIXI.TYPES}
         * @default PIXI.TYPES.UNSIGNED_BYTE
         */
        this.type = type || TYPES.UNSIGNED_BYTE;

        /**
         * 目标类型
         *
         * @member {PIXI.TARGETS}
         * @default PIXI.TARGETS.TEXTURE_2D
         */
        this.target = target || TARGETS.TEXTURE_2D;

        /**
         * 如何处理预乘alpha, 查看 {@link PIXI.ALPHA_MODES}.
         *
         * @member {PIXI.ALPHA_MODES}
         * @default PIXI.ALPHA_MODES.UNPACK
         */
        this.alphaMode = alphaMode !== undefined ? alphaMode : ALPHA_MODES.UNPACK;

        if (options.premultiplyAlpha !== undefined)
        {
            // triggers deprecation
            this.premultiplyAlpha = options.premultiplyAlpha;
        }

        /**
         * 此BaseTexture的全局唯一标识符
         *
         * @member {string}
         * @protected
         */
        this.uid = uid();

        /**
         *由自动纹理垃圾收集使用，存储绑定时的最后GC的tick
         *
         * @member {number}
         * @protected
         */
        this.touched = 0;

        /**
         * 不论纹理是否为2的幂，请尝试尽可能多地使用2的幂
         *
         * @readonly
         * @member {boolean}
         * @default false
         */
        this.isPowerOfTwo = false;
        this._refreshPOT();

        /**
         * 绑定此渲染上下文纹理的映射
         *
         * @member {Object}
         * @private
         */
        this._glTextures = {};

        /**
         * TextureSystem用于仅在需要时将纹理更新到GPU。
         * 请调用 `update()` 增加它。
         *
         * @readonly
         * @member {number}
         */
        this.dirtyId = 0;

        /**
         * 由TextureSystem使用，仅在需要时更新纹理样式。
         *
         * @protected
         * @member {number}
         */
        this.dirtyStyleId = 0;

        /**
         * 当前默认的缓存ID。
         *
         * @member {string}
         */
        this.cacheId = null;

        /**
         * Generally speaking means when resource is loaded.
         * @readonly
         * @member {boolean}
         */
        this.valid = width > 0 && height > 0;

        /**
         * 备用缓存ID的集合，因为某些BaseTextures可以具有多个ID，短名称和更长的完整URL
         *
         * @member {Array<string>}
         * @readonly
         */
        this.textureCacheIds = [];

        /**
         * 标记BaseTexture是否已被销毁。
         *
         * @member {boolean}
         * @readonly
         */
        this.destroyed = false;

        /**
         * 此BaseTexture使用的资源，每个BaseTexture只能有一个资源，但是纹理可以共享资源。
         *
         * @member {PIXI.resources.Resource}
         * @readonly
         */
        this.resource = null;

        /**
         * 多纹理渲染器使用的纹理批处理编号
         *
         * @member {number}
         */
        this._batchEnabled = 0;

        /**
         * 纹理批处理中的位置，由多纹理渲染器使用
         *
         * @member {number}
         */
        this._batchLocation = 0;

        /**
         * 当非立即可用的源完成加载时触发。
         *
         * @protected
         * @event PIXI.BaseTexture#loaded
         * @param {PIXI.BaseTexture} baseTexture - Resource loaded.
         */

        /**
         * 当非立即可用的源未能加载时触发。
         *
         * @protected
         * @event PIXI.BaseTexture#error
         * @param {PIXI.BaseTexture} baseTexture - 资源错误。
         * @param {ErrorEvent} event - 加载错误事件。
         */

        /**
         * 在更新BaseTexture时触发。
         *
         * @protected
         * @event PIXI.BaseTexture#loaded
         * @param {PIXI.BaseTexture} baseTexture - 资源已加载。
         */

        /**
         * 在更新BaseTexture时触发。
         *
         * @protected
         * @event PIXI.BaseTexture#update
         * @param {PIXI.BaseTexture} baseTexture - 正在更新纹理的实例。
         */

        /**
         * BaseTexture被销毁时触发。
         *
         * @protected
         * @event PIXI.BaseTexture#dispose
         * @param {PIXI.BaseTexture} baseTexture - Instance of texture being destroyed.
         */

        // Set the resource
        this.setResource(resource);
    }

    /**
     * 此纹理来源的像素宽度
     *
     * @readonly
     * @member {number}
     */
    get realWidth()
    {
        return Math.ceil((this.width * this.resolution) - 1e-4);
    }

    /**
     * 此纹理来源的像素高度
     *
     * @readonly
     * @member {number}
     */
    get realHeight()
    {
        return Math.ceil((this.height * this.resolution) - 1e-4);
    }

    /**
     * 更改BaseTexture的样式选项
     *
     * @param {PIXI.SCALE_MODES} [scaleMode] - Pixi scalemode
     * @param {PIXI.MIPMAP_MODES} [mipmap] - 开启mipmaps
     * @returns {PIXI.BaseTexture} this
     */
    setStyle(scaleMode, mipmap)
    {
        let dirty;

        if (scaleMode !== undefined && scaleMode !== this.scaleMode)
        {
            this.scaleMode = scaleMode;
            dirty = true;
        }

        if (mipmap !== undefined && mipmap !== this.mipmap)
        {
            this.mipmap = mipmap;
            dirty = true;
        }

        if (dirty)
        {
            this.dirtyStyleId++;
        }

        return this;
    }

    /**
     * 更改w/h/分辨率。 如果宽度和高度大于零，则纹理变为有效。
     *
     * @param {number} width 视觉宽度
     * @param {number} height 视觉高度
     * @param {number} [resolution] （可选）设置分辨率
     * @returns {PIXI.BaseTexture} this
     */
    setSize(width, height, resolution)
    {
        this.resolution = resolution || this.resolution;
        this.width = width;
        this.height = height;
        this._refreshPOT();
        this.update();

        return this;
    }

    /**
     * 设置baseTexture的实际大小，保留当前分辨率。
     *
     * @param {number} realWidth 全渲染宽度
     * @param {number} realHeight 全渲染高度
     * @param {number} [resolution] （可选）设置分辨率
     * @returns {PIXI.BaseTexture} this
     */
    setRealSize(realWidth, realHeight, resolution)
    {
        this.resolution = resolution || this.resolution;
        this.width = realWidth / this.resolution;
        this.height = realHeight / this.resolution;
        this._refreshPOT();
        this.update();

        return this;
    }

    /**
     * 根据大小刷新检查isPowerOfTwo纹理
     *
     * @private
     */
    _refreshPOT()
    {
        this.isPowerOfTwo = isPow2(this.realWidth) && isPow2(this.realHeight);
    }

    /**
     * 更改分辨率
     *
     * @param {number} [resolution] res
     * @returns {PIXI.BaseTexture} this
     */
    setResolution(resolution)
    {
        const oldResolution = this.resolution;

        if (oldResolution === resolution)
        {
            return this;
        }

        this.resolution = resolution;

        if (this.valid)
        {
            this.width = this.width * oldResolution / resolution;
            this.height = this.height * oldResolution / resolution;
            this.emit('update', this);
        }

        this._refreshPOT();

        return this;
    }

    /**
     * 设置资源（如果未设置）。 如果资源已经存在，则引发错误
     *
     * @param {PIXI.resources.Resource} resource - 管理的BaseTexture
     * @returns {PIXI.BaseTexture} this
     */
    setResource(resource)
    {
        if (this.resource === resource)
        {
            return this;
        }

        if (this.resource)
        {
            throw new Error('Resource can be set only once');
        }

        resource.bind(this);

        this.resource = resource;

        return this;
    }

    /**
     * 使对象无效。如果宽度和高度大于零，则纹理变为有效。
     */
    update()
    {
        if (!this.valid)
        {
            if (this.width > 0 && this.height > 0)
            {
                this.valid = true;
                this.emit('loaded', this);
                this.emit('update', this);
            }
        }
        else
        {
            this.dirtyId++;
            this.dirtyStyleId++;
            this.emit('update', this);
        }
    }

    /**
     * 处理资源错误。
     * @private
     * @param {ErrorEvent} event - 发出错误事件。
     */
    onError(event)
    {
        this.emit('error', this, event);
    }

    /**
     * 销毁此基础纹理。
     * 如果资源不希望销毁此纹理，则不应该使用此方法。
     * 从所有缓存中删除纹理。
     */
    destroy()
    {
        // remove and destroy the resource
        if (this.resource)
        {
            this.resource.unbind(this);
            // only destroy resourced created internally
            if (this.resource.internal)
            {
                this.resource.destroy();
            }
            this.resource = null;
        }

        if (this.cacheId)
        {
            delete BaseTextureCache[this.cacheId];
            delete TextureCache[this.cacheId];

            this.cacheId = null;
        }

        // finally let the WebGL renderer know..
        this.dispose();

        BaseTexture.removeFromCache(this);
        this.textureCacheIds = null;

        this.destroyed = true;
    }

    /**
     * 从WebGL内存中释放纹理，而不会销毁该纹理对象。
     * 这意味着您以后仍然可以使用纹理，它将再次将其上传到GPU内存。
     *
     * @fires PIXI.BaseTexture#dispose
     */
    dispose()
    {
        this.emit('dispose', this);
    }

    /**
     * 辅助函数，可根据您提供的源创建基础纹理。
     * 来源可以是-图片网址，图片元素，画布元素。 如果源是图像url或图像元素，
     * 如果不在基础纹理缓存中，则将创建并加载它。
     *
     * @static
     * @param {string|HTMLImageElement|HTMLCanvasElement|SVGElement|HTMLVideoElement} source - 从中创建基础纹理的源。
     * @param {object} [options] 请参见 {@link PIXI.BaseTexture} 的构造函数。
     * @param {boolean} [strict] 强制执行严格模式，请参见 {@link PIXI.settings.STRICT_TEXTURE_CACHE}。
     * @returns {PIXI.BaseTexture} 新的基础纹理。
     */
    static from(source, options, strict = settings.STRICT_TEXTURE_CACHE)
    {
        const isFrame = typeof source === 'string';
        let cacheId = null;

        if (isFrame)
        {
            cacheId = source;
        }
        else
        {
            if (!source._pixiId)
            {
                source._pixiId = `pixiid_${uid()}`;
            }

            cacheId = source._pixiId;
        }

        let baseTexture = BaseTextureCache[cacheId];

        // Strict-mode rejects invalid cacheIds
        if (isFrame && strict && !baseTexture)
        {
            throw new Error(`The cacheId "${cacheId}" does not exist in BaseTextureCache.`);
        }

        if (!baseTexture)
        {
            baseTexture = new BaseTexture(source, options);
            baseTexture.cacheId = cacheId;
            BaseTexture.addToCache(baseTexture, cacheId);
        }

        return baseTexture;
    }

    /**
     * 使用Float32Array的BufferResource创建一个新的BaseTexture。
     * RGBA值是从0到1的浮点数。
     * @static
     * @param {Float32Array|Uint8Array} buffer 要使用的可选数组，如果未提供数据，则创建一个新的Float32Array。
     * @param {number} width - 资源宽度
     * @param {number} height - 资源高度
     * @param {object} [options] 请参见 {@link PIXI.BaseTexture} 的构造函数。
     * @return {PIXI.BaseTexture} 新的基础纹理
     */
    static fromBuffer(buffer, width, height, options)
    {
        buffer = buffer || new Float32Array(width * height * 4);

        const resource = new BufferResource(buffer, { width, height });
        const type = buffer instanceof Float32Array ? TYPES.FLOAT : TYPES.UNSIGNED_BYTE;

        return new BaseTexture(resource, Object.assign(defaultBufferOptions, options || { width, height, type }));
    }

    /**
     * 将BaseTexture添加到全局BaseTextureCache。 该缓存在整个PIXI对象之间共享。
     *
     * @static
     * @param {PIXI.BaseTexture} baseTexture - 要添加到缓存的BaseTexture。
     * @param {string} id - BaseTexture将针对其存储的ID。
     */
    static addToCache(baseTexture, id)
    {
        if (id)
        {
            if (baseTexture.textureCacheIds.indexOf(id) === -1)
            {
                baseTexture.textureCacheIds.push(id);
            }

            if (BaseTextureCache[id])
            {
                // eslint-disable-next-line no-console
                console.warn(`BaseTexture added to the cache with an id [${id}] that already had an entry`);
            }

            BaseTextureCache[id] = baseTexture;
        }
    }

    /**
     * 从全局BaseTextureCache中删除BaseTexture。
     *
     * @static
     * @param {string|PIXI.BaseTexture} baseTexture - 要删除的BaseTexture的ID或BaseTexture实例本身。
     * @return {PIXI.BaseTexture|null} 已删除的BaseTexture。
     */
    static removeFromCache(baseTexture)
    {
        if (typeof baseTexture === 'string')
        {
            const baseTextureFromCache = BaseTextureCache[baseTexture];

            if (baseTextureFromCache)
            {
                const index = baseTextureFromCache.textureCacheIds.indexOf(baseTexture);

                if (index > -1)
                {
                    baseTextureFromCache.textureCacheIds.splice(index, 1);
                }

                delete BaseTextureCache[baseTexture];

                return baseTextureFromCache;
            }
        }
        else if (baseTexture && baseTexture.textureCacheIds)
        {
            for (let i = 0; i < baseTexture.textureCacheIds.length; ++i)
            {
                delete BaseTextureCache[baseTexture.textureCacheIds[i]];
            }

            baseTexture.textureCacheIds.length = 0;

            return baseTexture;
        }

        return null;
    }
}

/**
 * 多纹理渲染器使用的纹理批处理的全局编号
 *
 * @static
 * @member {number}
 */
BaseTexture._globalBatch = 0;
