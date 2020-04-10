import { Rectangle } from '@pixi/math';
import { Texture } from '@pixi/core';
import { getResolutionOfUrl } from '@pixi/utils';

/**
 * 用于维护对单个Spritesheet上纹理集合的工具类。
 *
 * 要通过您的代码访问精灵表，请将其JSON数据文件传递给Pixi的加载器:
 *
 * ```js
 * PIXI.Loader.shared.add("images/spritesheet.json").load(setup);
 *
 * function setup() {
 *   let sheet = PIXI.Loader.shared.resources["images/spritesheet.json"].spritesheet;
 *   ...
 * }
 * ```
 * 使用 `sheet.textures` 可以创建Sprite对象，`sheet.animations` 可以用来创建AnimatedSprite。
 *
 * 可以使用 {@link https://codeandweb.com/texturepacker|TexturePacker},
 * {@link https://renderhjs.net/shoebox/|Shoebox} 或 {@link https://github.com/krzysztof-o/spritesheet.js|Spritesheet.js}。
 * 当前仅由TexturePacker支持默认锚点（请参阅 {@link PIXI.Texture#defaultAnchor}）和动画精灵的分组。
 *
 * @class
 * @memberof PIXI
 */
export class Spritesheet
{
    /**
     * 每个进程要生成的最大纹理数。
     *
     * @type {number}
     * @default 1000
     */
    static get BATCH_SIZE()
    {
        return 1000;
    }

    /**
     * @param {PIXI.BaseTexture} baseTexture 源BaseTexture对象的引用。
     * @param {Object} data - Spritesheet图像数据。
     * @param {string} [resolutionFilename] - 在确定spritesheet的分辨率时要考虑的文件名。如果没有提供，imageUrl将用于BaseTexture。
     */
    constructor(baseTexture, data, resolutionFilename = null)
    {
        /**
         * 源纹理的引用
         * @type {PIXI.BaseTexture}
         */
        this.baseTexture = baseTexture;

        /**
         * 包含精灵表所有纹理的图集。
         * 可以用来创建一个{@link PIXI.Sprite|Sprite}:
         * ```js
         * new PIXI.Sprite(sheet.textures["image.png"]);
         * ```
         * @member {Object}
         */
        this.textures = {};

        /**
         * 包含每个动画的纹理的贴图。
         * 可以用来创建一个 {@link PIXI.AnimatedSprite|AnimatedSprite}:
         * ```js
         * new PIXI.AnimatedSprite(sheet.animations["anim_name"])
         * ```
         * @member {Object}
         */
        this.animations = {};

        /**
         * 原始JSON数据的引用。
         * @type {Object}
         */
        this.data = data;

        /**
         * 精灵表的分辨率。
         * @type {number}
         */
        this.resolution = this._updateResolution(
            resolutionFilename
            || (this.baseTexture.resource ? this.baseTexture.resource.url : null),
        );

        /**
         * 精灵表中的一组子帧
         * @type {Object}
         * @private
         */
        this._frames = this.data.frames;

        /**
         * 帧名称的集合。
         * @type {string[]}
         * @private
         */
        this._frameKeys = Object.keys(this._frames);

        /**
         * 当前正在处理的批次索引。
         * @type {number}
         * @private
         */
        this._batchIndex = 0;

        /**
         * 解析完成时的回调。
         * @type {Function}
         * @private
         */
        this._callback = null;
    }

    /**
     * 从文件名或回退到JSON数据的meta.scale字段生成分辨率。
     *
     * @private
     * @param {string} resolutionFilename - 用于解析默认分辨率的文件名。
     * @return {number} 用于精灵表的分辨率。
     */
    _updateResolution(resolutionFilename)
    {
        const scale = this.data.meta.scale;

        // Use a defaultValue of `null` to check if a url-based resolution is set
        let resolution = getResolutionOfUrl(resolutionFilename, null);

        // No resolution found via URL
        if (resolution === null)
        {
            // Use the scale value or default to 1
            resolution = scale !== undefined ? parseFloat(scale) : 1;
        }

        // For non-1 resolutions, update baseTexture
        if (resolution !== 1)
        {
            this.baseTexture.setResolution(resolution);
        }

        return resolution;
    }

    /**
     * 从加载的数据中解析精灵表。这是异步完成的，以防止在单个进程中创建过多的纹理。
     *
     * @param {Function} callback - 完成时回调返回此精灵表的纹理数组。
     */
    parse(callback)
    {
        this._batchIndex = 0;
        this._callback = callback;

        if (this._frameKeys.length <= Spritesheet.BATCH_SIZE)
        {
            this._processFrames(0);
            this._processAnimations();
            this._parseComplete();
        }
        else
        {
            this._nextBatch();
        }
    }

    /**
     * 处理一批帧
     *
     * @private
     * @param {number} initialFrameIndex - 要开始的帧的索引。
     */
    _processFrames(initialFrameIndex)
    {
        let frameIndex = initialFrameIndex;
        const maxFrames = Spritesheet.BATCH_SIZE;

        while (frameIndex - initialFrameIndex < maxFrames && frameIndex < this._frameKeys.length)
        {
            const i = this._frameKeys[frameIndex];
            const data = this._frames[i];
            const rect = data.frame;

            if (rect)
            {
                let frame = null;
                let trim = null;
                const sourceSize = data.trimmed !== false && data.sourceSize
                    ? data.sourceSize : data.frame;

                const orig = new Rectangle(
                    0,
                    0,
                    Math.floor(sourceSize.w) / this.resolution,
                    Math.floor(sourceSize.h) / this.resolution,
                );

                if (data.rotated)
                {
                    frame = new Rectangle(
                        Math.floor(rect.x) / this.resolution,
                        Math.floor(rect.y) / this.resolution,
                        Math.floor(rect.h) / this.resolution,
                        Math.floor(rect.w) / this.resolution,
                    );
                }
                else
                {
                    frame = new Rectangle(
                        Math.floor(rect.x) / this.resolution,
                        Math.floor(rect.y) / this.resolution,
                        Math.floor(rect.w) / this.resolution,
                        Math.floor(rect.h) / this.resolution,
                    );
                }

                //  Check to see if the sprite is trimmed
                if (data.trimmed !== false && data.spriteSourceSize)
                {
                    trim = new Rectangle(
                        Math.floor(data.spriteSourceSize.x) / this.resolution,
                        Math.floor(data.spriteSourceSize.y) / this.resolution,
                        Math.floor(rect.w) / this.resolution,
                        Math.floor(rect.h) / this.resolution,
                    );
                }

                this.textures[i] = new Texture(
                    this.baseTexture,
                    frame,
                    orig,
                    trim,
                    data.rotated ? 2 : 0,
                    data.anchor,
                );

                // lets also add the frame to pixi's global cache for 'from' and 'fromLoader' functions
                Texture.addToCache(this.textures[i], i);
            }

            frameIndex++;
        }
    }

    /**
     * 解析动画配置
     *
     * @private
     */
    _processAnimations()
    {
        const animations = this.data.animations || {};

        for (const animName in animations)
        {
            this.animations[animName] = [];
            for (let i = 0; i < animations[animName].length; i++)
            {
                const frameName = animations[animName][i];

                this.animations[animName].push(this.textures[frameName]);
            }
        }
    }

    /**
     * 解析已完成。
     *
     * @private
     */
    _parseComplete()
    {
        const callback = this._callback;

        this._callback = null;
        this._batchIndex = 0;
        callback.call(this, this.textures);
    }

    /**
     * 开始下一批纹理。
     *
     * @private
     */
    _nextBatch()
    {
        this._processFrames(this._batchIndex * Spritesheet.BATCH_SIZE);
        this._batchIndex++;
        setTimeout(() =>
        {
            if (this._batchIndex * Spritesheet.BATCH_SIZE < this._frameKeys.length)
            {
                this._nextBatch();
            }
            else
            {
                this._processAnimations();
                this._parseComplete();
            }
        }, 0);
    }

    /**
     * 销毁精灵表后不再使用。
     *
     * @param {boolean} [destroyBase=false] 是否也要销毁基础纹理
     */
    destroy(destroyBase = false)
    {
        for (const i in this.textures)
        {
            this.textures[i].destroy();
        }
        this._frames = null;
        this._frameKeys = null;
        this.data = null;
        this.textures = null;
        if (destroyBase)
        {
            this.baseTexture.destroy();
        }
        this.baseTexture = null;
    }
}
