import { BLEND_MODES } from '@pixi/constants';
import { hex2rgb } from '@pixi/utils';
import { Container } from '@pixi/display';

/**
 * ParticleContainer类是专为快速构建的容器的一个非常快速的版本，因此在需要大量精灵或粒子时使用。
 *
 * ParticleContainer的权衡在于，大多数高级功能将不起作用。
 * ParticleContainer实现基本的对象变换（位置，比例，旋转）
 * 以及一些高级功能，例如色调（自v4.5.6起）。
 *
 * 其他更高级的功能（如遮罩，子级，滤镜等）将不适用于该批处理中的sprite。
 *
 * 它非常容易使用:
 * ```js
 * let container = new ParticleContainer();
 *
 * for (let i = 0; i < 100; ++i)
 * {
 *     let sprite = PIXI.Sprite.from("myImage.png");
 *     container.addChild(sprite);
 * }
 * ```
 *
 * 在这里，您将有一百个精灵以光速渲染。
 *
 * @class
 * @extends PIXI.Container
 * @memberof PIXI
 */
export class ParticleContainer extends Container
{
    /**
     * @param {number} [maxSize=1500] - 容器可以渲染的最大粒子数。
     *  影响分配的缓冲区的大小。
     * @param {object} [properties] - 将上载到gpu并应用的子级属性。
     * @param {boolean} [properties.vertices=false] - 如果为true，则将上载和应用顶点。
     *                  如果 sprite 的 ` scale/anchor/trim/frame/orig` 是动态的，请设置为 `true`.
     * @param {boolean} [properties.position=true] - 为true时，位置将被上传并应用。
     * @param {boolean} [properties.rotation=false] - 如果为true，则上传并应用旋转。
     * @param {boolean} [properties.uvs=false] - 如果为true，则将上载并应用uvs。
     * @param {boolean} [properties.tint=false] - 如果为true，则将上载和应用alpha和色调。
     * @param {number} [batchSize=16384] - 每批次的粒子数。 如果小于maxSize，则改用maxSize。
     * @param {boolean} [autoResize=false] 如果为true，则容器分配更多批次，以防存在超过 `maxSize` 个粒子的情况。
     */
    constructor(maxSize = 1500, properties, batchSize = 16384, autoResize = false)
    {
        super();

        // 确保批次大小有效
        // 65535是索引缓冲区中的最大顶点索引（请参阅ParticleRenderer）
        // 所以最大粒子数是 65536 / 4 = 16384
        const maxBatchSize = 16384;

        if (batchSize > maxBatchSize)
        {
            batchSize = maxBatchSize;
        }

        /**
         * 将属性设置为动态(true)/静态(false)
         *
         * @member {boolean[]}
         * @private
         */
        this._properties = [false, true, false, false, false];

        /**
         * @member {number}
         * @private
         */
        this._maxSize = maxSize;

        /**
         * @member {number}
         * @private
         */
        this._batchSize = batchSize;

        /**
         * @member {Array<PIXI.Buffer>}
         * @private
         */
        this._buffers = null;

        /**
         * 对于每个批次，存储与该批次中的最后更改相对应的_updateID
         * @member {number[]}
         * @private
         */
        this._bufferUpdateIDs = [];

        /**
         * 当子节点插入，移除或更改位置时，此数字会上升
         * @member {number[]}
         * @private
         */
        this._updateID = 0;

        /**
         * @member {boolean}
         *
         */
        this.interactiveChildren = false;

        /**
         * 要应用于精灵的混合模式。应用值`PIXI.BLEND_MODES.NORMAL`, 以重置混合模式。
         *
         * @member {number}
         * @default PIXI.BLEND_MODES.NORMAL
         * @see PIXI.BLEND_MODES
         */
        this.blendMode = BLEND_MODES.NORMAL;

        /**
         * If true, container allocates more batches in case there are more than `maxSize` particles.
         * 如果为true，则容器会分配更多的批处理，以防出现超出`maxSize`的粒子。
         * @member {boolean}
         * @default false
         */
        this.autoResize = autoResize;

        /**
         * 如果为true，则在渲染时，PixiJS将使用Math.floor() x/y值，从而停止像素插值。
         * 优点包括更清晰的图像质量（如文本）和在canvas上更快的渲染。
         * 主要缺点是物体的运动可能看起来不太平滑。
         * 这里默认为true，因为性能通常是粒子的优先级。
         *
         * @member {boolean}
         * @default true
         */
        this.roundPixels = true;

        /**
         * 用于渲染子对象的纹理。
         *
         * @readonly
         * @member {PIXI.BaseTexture}
         */
        this.baseTexture = null;

        this.setProperties(properties);

        /**
         * 应用于容器的色调。
         * 16进制值。 0xFFFFFF将消除调色效果
         *
         * @private
         * @member {number}
         * @default 0xFFFFFF
         */
        this._tint = 0;
        this.tintRgb = new Float32Array(4);
        this.tint = 0xFFFFFF;
    }

    /**
     * 根据传递的属性对象将私有属性数组设置为动态/静态
     *
     * @param {object} properties - 要上载的属性
     */
    setProperties(properties)
    {
        if (properties)
        {
            this._properties[0] = 'vertices' in properties || 'scale' in properties
                ? !!properties.vertices || !!properties.scale : this._properties[0];
            this._properties[1] = 'position' in properties ? !!properties.position : this._properties[1];
            this._properties[2] = 'rotation' in properties ? !!properties.rotation : this._properties[2];
            this._properties[3] = 'uvs' in properties ? !!properties.uvs : this._properties[3];
            this._properties[4] = 'tint' in properties || 'alpha' in properties
                ? !!properties.tint || !!properties.alpha : this._properties[4];
        }
    }

    /**
     * 更新对象转换以进行渲染
     *
     * @private
     */
    updateTransform()
    {
        // TODO don't need to!
        this.displayObjectUpdateTransform();
        //  PIXI.Container.prototype.updateTransform.call( this );
    }

    /**
     * 应用于容器的色调。16进制值。
     * A value of 0xFFFFFF will remove any tint effect.
     ** 重要提示：这是一个WebGL独有的功能，将被canvas渲染器忽略。
     * @member {number}
     * @default 0xFFFFFF
     */
    get tint()
    {
        return this._tint;
    }

    set tint(value) // eslint-disable-line require-jsdoc
    {
        this._tint = value;
        hex2rgb(value, this.tintRgb);
    }

    /**
     * 使用WebGL渲染器渲染容器
     *
     * @private
     * @param {PIXI.Renderer} renderer - The webgl renderer
     */
    render(renderer)
    {
        if (!this.visible || this.worldAlpha <= 0 || !this.children.length || !this.renderable)
        {
            return;
        }

        if (!this.baseTexture)
        {
            this.baseTexture = this.children[0]._texture.baseTexture;
            if (!this.baseTexture.valid)
            {
                this.baseTexture.once('update', () => this.onChildrenChange(0));
            }
        }

        renderer.batch.setObjectRenderer(renderer.plugins.particle);
        renderer.plugins.particle.render(this);
    }

    /**
     * 设置将静态数据更新为true的标志
     *
     * @private
     * @param {number} smallestChildIndex - 最小子索引
     */
    onChildrenChange(smallestChildIndex)
    {
        const bufferIndex = Math.floor(smallestChildIndex / this._batchSize);

        while (this._bufferUpdateIDs.length < bufferIndex)
        {
            this._bufferUpdateIDs.push(0);
        }
        this._bufferUpdateIDs[bufferIndex] = ++this._updateID;
    }

    dispose()
    {
        if (this._buffers)
        {
            for (let i = 0; i < this._buffers.length; ++i)
            {
                this._buffers[i].destroy();
            }

            this._buffers = null;
        }
    }

    /**
     * 销毁容器
     *
     * @param {object|boolean} [options] - Options parameter. A boolean will act as if all options
     *  have been set to that value
     * @param {boolean} [options.children=false] - if set to true, all the children will have their
     *  destroy method called as well. 'options' will be passed on to those calls.
     * @param {boolean} [options.texture=false] - Only used for child Sprites if options.children is set to true
     *  Should it destroy the texture of the child sprite
     * @param {boolean} [options.baseTexture=false] - Only used for child Sprites if options.children is set to true
     *  Should it destroy the base texture of the child sprite
     */
    destroy(options)
    {
        super.destroy(options);

        this.dispose();

        this._properties = null;
        this._buffers = null;
        this._bufferUpdateIDs = null;
    }
}
