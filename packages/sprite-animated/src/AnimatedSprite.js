import { Texture } from '@pixi/core';
import { Sprite } from '@pixi/sprite';
import { Ticker, UPDATE_PRIORITY } from '@pixi/ticker';

/**
 * AnimatedSprite是一种显示由纹理列表描绘的动画的简单方法。
 *
 * ```js
 * let alienImages = ["image_sequence_01.png","image_sequence_02.png","image_sequence_03.png","image_sequence_04.png"];
 * let textureArray = [];
 *
 * for (let i=0; i < 4; i++)
 * {
 *      let texture = PIXI.Texture.from(alienImages[i]);
 *      textureArray.push(texture);
 * };
 *
 * let animatedSprite = new PIXI.AnimatedSprite(textureArray);
 * ```
 *
 * 创建动画精灵的更有效，更简单的方法是使用包含动画定义的精灵表{@link PIXI.Spritesheet}:
 *
 * ```js
 * PIXI.Loader.shared.add("assets/spritesheet.json").load(setup);
 *
 * function setup() {
 *   let sheet = PIXI.Loader.shared.resources["assets/spritesheet.json"].spritesheet;
 *   animatedSprite = new PIXI.AnimatedSprite(sheet.animations["image_sequence"]);
 *   ...
 * }
 * ```
 *
 * @class
 * @extends PIXI.Sprite
 * @memberof PIXI
 */
export class AnimatedSprite extends Sprite
{
    /**
     * @param {PIXI.Texture[]|PIXI.AnimatedSprite.FrameObject[]} textures - 构成动画的{@link PIXI.Texture}数组 或 帧
     *  对象的数组。
     * @param {boolean} [autoUpdate=true] - 是否使用{@link PIXI.Ticker.shared}自动更新动画时间。
     */
    constructor(textures, autoUpdate)
    {
        super(textures[0] instanceof Texture ? textures[0] : textures[0].texture);

        /**
         * @type {PIXI.Texture[]}
         * @private
         */
        this._textures = null;

        /**
         * @type {number[]}
         * @private
         */
        this._durations = null;

        this.textures = textures;

        /**
         * `true` 为使用{@link PIXI.Ticker.shared}自动更新动画时间。
         * @type {boolean}
         * @default true
         * @private
         */
        this._autoUpdate = autoUpdate !== false;

        /**
         * AnimatedSprite播放的速度。越高速度越快，越低速度越慢。
         *
         * @member {number}
         * @default 1
         */
        this.animationSpeed = 1;

        /**
         * 是否循环播放
         *
         * @member {boolean}
         * @default true
         */
        this.loop = true;

        /**
         * 当帧更改时，将锚点更新为[纹理的defaultAnchor]{@link PIXI.Texture#defaultAnchor}。
         *
         * 可用于使用工具创建的[精灵表动画]{@link PIXI.Spritesheet#animations}。更改每个帧的描点以允许将精灵原点固定到帧的某些移动点（例如:left foot）。
         *
         * 注意: 启用此选项将覆盖每个帧通道上先前设置的任何`anchor`
         *
         * @member {boolean}
         * @default false
         */
        this.updateAnchor = false;

        /**
         * 函数在动画精灵完成播放时调用。
         *
         * @member {Function}
         */
        this.onComplete = null;

        /**
         * 函数在动画精灵更改要渲染的纹理时调用。
         *
         * @member {Function}
         */
        this.onFrameChange = null;

        /**
         * 函数在`loop`为true时调用，播放动画精灵并循环以重新开始。
         *
         * @member {Function}
         */
        this.onLoop = null;

        /**
         * 动画启动后经过的时间，用于内部显示当前纹理。
         *
         * @member {number}
         * @private
         */
        this._currentTime = 0;

        /**
         * 指示动画精灵当前是否正在播放。
         *
         * @member {boolean}
         * @readonly
         */
        this.playing = false;
    }

    /**
     * 停止AnimatedSprite
     *
     */
    stop()
    {
        if (!this.playing)
        {
            return;
        }

        this.playing = false;
        if (this._autoUpdate)
        {
            Ticker.shared.remove(this.update, this);
        }
    }

    /**
     * 播放AnimatedSprite
     *
     */
    play()
    {
        if (this.playing)
        {
            return;
        }

        this.playing = true;
        if (this._autoUpdate)
        {
            Ticker.shared.add(this.update, this, UPDATE_PRIORITY.HIGH);
        }
    }

    /**
     * 停止AnimatedSprite并转到指定的帧。
     *
     * @param {number} frameNumber - 要停止的帧索引。
     */
    gotoAndStop(frameNumber)
    {
        this.stop();

        const previousFrame = this.currentFrame;

        this._currentTime = frameNumber;

        if (previousFrame !== this.currentFrame)
        {
            this.updateTexture();
        }
    }

    /**
     * 转到指定帧并开始播放动画精灵。
     *
     * @param {number} frameNumber - 要开始的帧索引。
     */
    gotoAndPlay(frameNumber)
    {
        const previousFrame = this.currentFrame;

        this._currentTime = frameNumber;

        if (previousFrame !== this.currentFrame)
        {
            this.updateTexture();
        }

        this.play();
    }

    /**
     * 更新要渲染的对象变换。
     *
     * @private
     * @param {number} deltaTime - 自上一个tick开始的时间。
     */
    update(deltaTime)
    {
        const elapsed = this.animationSpeed * deltaTime;
        const previousFrame = this.currentFrame;

        if (this._durations !== null)
        {
            let lag = this._currentTime % 1 * this._durations[this.currentFrame];

            lag += elapsed / 60 * 1000;

            while (lag < 0)
            {
                this._currentTime--;
                lag += this._durations[this.currentFrame];
            }

            const sign = Math.sign(this.animationSpeed * deltaTime);

            this._currentTime = Math.floor(this._currentTime);

            while (lag >= this._durations[this.currentFrame])
            {
                lag -= this._durations[this.currentFrame] * sign;
                this._currentTime += sign;
            }

            this._currentTime += lag / this._durations[this.currentFrame];
        }
        else
        {
            this._currentTime += elapsed;
        }

        if (this._currentTime < 0 && !this.loop)
        {
            this._currentTime = 0;
            this.stop();

            if (this.onComplete)
            {
                this.onComplete();
            }
        }
        else if (this._currentTime >= this._textures.length && !this.loop)
        {
            this._currentTime = this._textures.length - 1;
            this.stop();

            if (this.onComplete)
            {
                this.onComplete();
            }
        }
        else if (previousFrame !== this.currentFrame)
        {
            if (this.loop && this.onLoop)
            {
                if (this.animationSpeed > 0 && this.currentFrame < previousFrame)
                {
                    this.onLoop();
                }
                else if (this.animationSpeed < 0 && this.currentFrame > previousFrame)
                {
                    this.onLoop();
                }
            }

            this.updateTexture();
        }
    }

    /**
     * 更新显示的纹理以匹配当前帧索引。
     *
     * @private
     */
    updateTexture()
    {
        this._texture = this._textures[this.currentFrame];
        this._textureID = -1;
        this._textureTrimmedID = -1;
        this._cachedTint = 0xFFFFFF;
        this.uvs = this._texture._uvs.uvsFloat32;

        if (this.updateAnchor)
        {
            this._anchor.copyFrom(this._texture.defaultAnchor);
        }

        if (this.onFrameChange)
        {
            this.onFrameChange(this.currentFrame);
        }
    }

    /**
     * 停止动画精灵并将其销毁。
     *
     * @param {object|boolean} [options] - 可选参数。可用于一次性设置全部选项
     * @param {boolean} [options.children=false] - 如果设置为true，则所有子项也将调用其destroy方法。'options'将传递给这些调用。
     * @param {boolean} [options.texture=false] - 是否破坏精灵的当前纹理。
     * @param {boolean} [options.baseTexture=false] - 是否破坏精灵的基本纹理
     */
    destroy(options)
    {
        this.stop();
        super.destroy(options);

        this.onComplete = null;
        this.onFrameChange = null;
        this.onLoop = null;
    }

    /**
     * 根据帧ID数组创建AnimatedSprite的简便方法。
     *
     * @static
     * @param {string[]} frames - AnimatedSprite将使用的帧ID数组作为其纹理帧。
     * @return {AnimatedSprite} 具有指定帧的新动画精灵。
     */
    static fromFrames(frames)
    {
        const textures = [];

        for (let i = 0; i < frames.length; ++i)
        {
            textures.push(Texture.from(frames[i]));
        }

        return new AnimatedSprite(textures);
    }

    /**
     * 通过图像ID数组创建AnimatedSprite的简便方法。
     *
     * @static
     * @param {string[]} images - AnimatedSprite将用作其纹理帧的图像URL数组。
     * @return {AnimatedSprite} 具有指定图像的新动画帧数组。
     */
    static fromImages(images)
    {
        const textures = [];

        for (let i = 0; i < images.length; ++i)
        {
            textures.push(Texture.from(images[i]));
        }

        return new AnimatedSprite(textures);
    }

    /**
     * AnimatedSprite中的帧总数。与分配给AnimatedSprite的纹理数量相同。
     *
     * @readonly
     * @member {number}
     * @default 0
     */
    get totalFrames()
    {
        return this._textures.length;
    }

    /**
     * AnimatedSprite的纹理数组。
     *
     * @member {PIXI.Texture[]}
     */
    get textures()
    {
        return this._textures;
    }

    set textures(value) // eslint-disable-line require-jsdoc
    {
        if (value[0] instanceof Texture)
        {
            this._textures = value;
            this._durations = null;
        }
        else
        {
            this._textures = [];
            this._durations = [];

            for (let i = 0; i < value.length; i++)
            {
                this._textures.push(value[i].texture);
                this._durations.push(value[i].time);
            }
        }
        this.gotoAndStop(0);
        this.updateTexture();
    }

    /**
    * AnimatedSprites当前帧索引。
    *
    * @member {number}
    * @readonly
    */
    get currentFrame()
    {
        let currentFrame = Math.floor(this._currentTime) % this._textures.length;

        if (currentFrame < 0)
        {
            currentFrame += this._textures.length;
        }

        return currentFrame;
    }
}

/**
 * @memberof PIXI.AnimatedSprite
 * @typedef {object} FrameObject
 * @type {object}
 * @property {PIXI.Texture} texture - {@link PIXI.Texture}的帧
 * @property {number} time - 帧的持续时间（毫秒）
 */
