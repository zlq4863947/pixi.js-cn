import { Point, ObservablePoint, Rectangle } from '@pixi/math';
import { sign } from '@pixi/utils';
import { Texture } from '@pixi/core';
import { BLEND_MODES } from '@pixi/constants';
import { Container } from '@pixi/display';
import { settings } from '@pixi/settings';

const tempPoint = new Point();
const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);

/**
 * Sprite对象是渲染到屏幕上的所有纹理对象的基础
*
 * 可以直接从这里的图像创建精灵:
 *
 * ```js
 * let sprite = PIXI.Sprite.from('assets/image.png');
 * ```
 *
 * 创建精灵的更有效方法是使用 {@link PIXI.Spritesheet},
 * 因为在渲染到屏幕时替换基本纹理效率很低。
 *
 * ```js
 * PIXI.Loader.shared.add("assets/spritesheet.json").load(setup);
 *
 * function setup() {
 *   let sheet = PIXI.Loader.shared.resources["assets/spritesheet.json"].spritesheet;
 *   let sprite = new PIXI.Sprite(sheet.textures["image.png"]);
 *   ...
 * }
 * ```
 *
 * @class
 * @extends PIXI.Container
 * @memberof PIXI
 */
export class Sprite extends Container
{
    /**
     * @param {PIXI.Texture} [texture] - 此精灵的纹理。
     */
    constructor(texture)
    {
        super();

        /**
         * 锚点定义纹理中映射到此精灵位置的归一化坐标。
         *
         * 默认情况下，为 `(0,0)`（或 `texture.defaultAnchor`
         * 如果您已对其进行修改），则表示位置 `(x,y)` 为 `Sprite` 的左上角。
         *
         * 注意：构造`Sprite`之后更新`texture.defaultAnchor`将_不会_更新其锚点。
         *
         * {@link https://docs.cocos2d-x.org/cocos2d-x/en/sprites/manipulation.html}
         *
         * @default `texture.defaultAnchor`
         * @member {PIXI.ObservablePoint}
         * @private
         */
        this._anchor = new ObservablePoint(
            this._onAnchorUpdate,
            this,
            (texture ? texture.defaultAnchor.x : 0),
            (texture ? texture.defaultAnchor.y : 0),
        );

        /**
         * 精灵正在使用的纹理
         *
         * @private
         * @member {PIXI.Texture}
         */
        this._texture = null;

        /**
         * 精灵的宽度（最初由纹理设置）
         *
         * @private
         * @member {number}
         */
        this._width = 0;

        /**
         * 精灵的高度（最初由纹理设置）
         *
         * @private
         * @member {number}
         */
        this._height = 0;

        /**
         * 应用于精灵的色调。这是一个十六进制值。 值为0xFFFFFF时，将消除任何色调效果。
         *
         * @private
         * @member {number}
         * @default 0xFFFFFF
         */
        this._tint = null;
        this._tintRGB = null;
        this.tint = 0xFFFFFF;

        /**
         * 应用于精灵的混合模式。应用值为 `PIXI.BLEND_MODES.NORMAL` 时，将重置混合模式。
         *
         * @member {number}
         * @default PIXI.BLEND_MODES.NORMAL
         * @see PIXI.BLEND_MODES
         */
        this.blendMode = BLEND_MODES.NORMAL;

        /**
         * 将用于渲染精灵的着色器。 设置为null时，将删除当前着色器。
         *
         * @member {PIXI.Filter|PIXI.Shader}
         */
        this.shader = null;

        /**
         * 缓存的色调值，以便我们可以知道何时更改了色调。
         * 该值用于2d CanvasRenderer。
         *
         * @protected
         * @member {number}
         * @default 0xFFFFFF
         */
        this._cachedTint = 0xFFFFFF;

        /**
         *作为calculateVertices()中的vertexData
         *
         * @private
         * @member {Float32Array}
         */
        this.uvs = null;

        // call texture setter
        this.texture = texture || Texture.EMPTY;

        /**
         * 这用于存储精灵的顶点数据（一般为一个四边形）
         *
         * @private
         * @member {Float32Array}
         */
        this.vertexData = new Float32Array(8);

        /**
         * 如果它是修剪后精灵，则用于计算对象的边界
         *
         * @private
         * @member {Float32Array}
         */
        this.vertexTrimmedData = null;

        this._transformID = -1;
        this._textureID = -1;

        this._transformTrimmedID = -1;
        this._textureTrimmedID = -1;

        // Batchable stuff..
        // TODO could make this a mixin?
        this.indices = indices;
        this.size = 4;
        this.start = 0;

        /**
         * 负责渲染此元素的插件。
         * 允许自定义渲染过程，而无需覆盖 '_render' 和' '_renderCanvas' '_render' 方法。
         *
         * @member {string}
         * @default 'batch'
         */
        this.pluginName = 'batch';

        /**
         * 用于快速检查精灵是否是精灵。
         * @member {boolean}
         */
        this.isSprite = true;

        /**
         * 内部roundPixels字段
         *
         * @member {boolean}
         * @private
         */
        this._roundPixels = settings.ROUND_PIXELS;
    }

    /**
     * 更新纹理后，将触发此事件以更新比例和frame
     *
     * @private
     */
    _onTextureUpdate()
    {
        this._textureID = -1;
        this._textureTrimmedID = -1;
        this._cachedTint = 0xFFFFFF;

        // so if _width is 0 then width was not set..
        if (this._width)
        {
            this.scale.x = sign(this.scale.x) * this._width / this._texture.orig.width;
        }

        if (this._height)
        {
            this.scale.y = sign(this.scale.y) * this._height / this._texture.orig.height;
        }
    }

    /**
     * 在锚点位置更新时调用。
     *
     * @private
     */
    _onAnchorUpdate()
    {
        this._transformID = -1;
        this._transformTrimmedID = -1;
    }

    /**
     * 计算worldTransform * vertices，并将其存储在vertexData中
     */
    calculateVertices()
    {
        const texture = this._texture;

        if (this._transformID === this.transform._worldID && this._textureID === texture._updateID)
        {
            return;
        }

        // update texture UV here, because base texture can be changed without calling `_onTextureUpdate`
        if (this._textureID !== texture._updateID)
        {
            this.uvs = this._texture._uvs.uvsFloat32;
        }

        this._transformID = this.transform._worldID;
        this._textureID = texture._updateID;

        // set the vertex data

        const wt = this.transform.worldTransform;
        const a = wt.a;
        const b = wt.b;
        const c = wt.c;
        const d = wt.d;
        const tx = wt.tx;
        const ty = wt.ty;
        const vertexData = this.vertexData;
        const trim = texture.trim;
        const orig = texture.orig;
        const anchor = this._anchor;

        let w0 = 0;
        let w1 = 0;
        let h0 = 0;
        let h1 = 0;

        if (trim)
        {
            // if the sprite is trimmed and is not a tilingsprite then we need to add the extra
            // space before transforming the sprite coords.
            w1 = trim.x - (anchor._x * orig.width);
            w0 = w1 + trim.width;

            h1 = trim.y - (anchor._y * orig.height);
            h0 = h1 + trim.height;
        }
        else
        {
            w1 = -anchor._x * orig.width;
            w0 = w1 + orig.width;

            h1 = -anchor._y * orig.height;
            h0 = h1 + orig.height;
        }

        // xy
        vertexData[0] = (a * w1) + (c * h1) + tx;
        vertexData[1] = (d * h1) + (b * w1) + ty;

        // xy
        vertexData[2] = (a * w0) + (c * h1) + tx;
        vertexData[3] = (d * h1) + (b * w0) + ty;

        // xy
        vertexData[4] = (a * w0) + (c * h0) + tx;
        vertexData[5] = (d * h0) + (b * w0) + ty;

        // xy
        vertexData[6] = (a * w1) + (c * h0) + tx;
        vertexData[7] = (d * h0) + (b * w1) + ty;

        if (this._roundPixels)
        {
            const resolution = settings.RESOLUTION;

            for (let i = 0; i < vertexData.length; ++i)
            {
                vertexData[i] = Math.round((vertexData[i] * resolution | 0) / resolution);
            }
        }
    }

    /**
     * 计算带有修剪的非纹理的worldTransform * vertices。 将其存储在vertexTrimmedData中
     * 这用于确保获得修剪出的纹理的真实宽度和高度
     */
    calculateTrimmedVertices()
    {
        if (!this.vertexTrimmedData)
        {
            this.vertexTrimmedData = new Float32Array(8);
        }
        else if (this._transformTrimmedID === this.transform._worldID && this._textureTrimmedID === this._texture._updateID)
        {
            return;
        }

        this._transformTrimmedID = this.transform._worldID;
        this._textureTrimmedID = this._texture._updateID;

        // lets do some special trim code!
        const texture = this._texture;
        const vertexData = this.vertexTrimmedData;
        const orig = texture.orig;
        const anchor = this._anchor;

        // lets calculate the new untrimmed bounds..
        const wt = this.transform.worldTransform;
        const a = wt.a;
        const b = wt.b;
        const c = wt.c;
        const d = wt.d;
        const tx = wt.tx;
        const ty = wt.ty;

        const w1 = -anchor._x * orig.width;
        const w0 = w1 + orig.width;

        const h1 = -anchor._y * orig.height;
        const h0 = h1 + orig.height;

        // xy
        vertexData[0] = (a * w1) + (c * h1) + tx;
        vertexData[1] = (d * h1) + (b * w1) + ty;

        // xy
        vertexData[2] = (a * w0) + (c * h1) + tx;
        vertexData[3] = (d * h1) + (b * w0) + ty;

        // xy
        vertexData[4] = (a * w0) + (c * h0) + tx;
        vertexData[5] = (d * h0) + (b * w0) + ty;

        // xy
        vertexData[6] = (a * w1) + (c * h0) + tx;
        vertexData[7] = (d * h0) + (b * w1) + ty;
    }

    /**
    *
    * 使用WebGL渲染器渲染对象
    *
    * @protected
    * @param {PIXI.Renderer} renderer - The webgl renderer to use.
    */
    _render(renderer)
    {
        this.calculateVertices();

        renderer.batch.setObjectRenderer(renderer.plugins[this.pluginName]);
        renderer.plugins[this.pluginName].render(this);
    }

    /**
     * 更新精灵的边界。
     *
     * @protected
     */
    _calculateBounds()
    {
        const trim = this._texture.trim;
        const orig = this._texture.orig;

        // 首先让我们检查一下当前纹理是否有修剪..
        if (!trim || (trim.width === orig.width && trim.height === orig.height))
        {
            // 不有修剪！ 让我们使用通常的计算..
            this.calculateVertices();
            this._bounds.addQuad(this.vertexData);
        }
        else
        {
            // 让我们计算一个特殊的修剪范围...
            this.calculateTrimmedVertices();
            this._bounds.addQuad(this.vertexTrimmedData);
        }
    }

    /**
     * 获取子画面对象的局部边界。
     *
     * @param {PIXI.Rectangle} [rect] - 输出矩形。
     * @return {PIXI.Rectangle} 边界
     */
    getLocalBounds(rect)
    {
        // we can do a fast local bounds if the sprite has no children!
        if (this.children.length === 0)
        {
            this._bounds.minX = this._texture.orig.width * -this._anchor._x;
            this._bounds.minY = this._texture.orig.height * -this._anchor._y;
            this._bounds.maxX = this._texture.orig.width * (1 - this._anchor._x);
            this._bounds.maxY = this._texture.orig.height * (1 - this._anchor._y);

            if (!rect)
            {
                if (!this._localBoundsRect)
                {
                    this._localBoundsRect = new Rectangle();
                }

                rect = this._localBoundsRect;
            }

            return this._bounds.getRectangle(rect);
        }

        return super.getLocalBounds.call(this, rect);
    }

    /**
     * 测试点是否在此精灵内
     *
     * @param {PIXI.Point} point - 要测试的点
     * @return {boolean} 测试结果
     */
    containsPoint(point)
    {
        this.worldTransform.applyInverse(point, tempPoint);

        const width = this._texture.orig.width;
        const height = this._texture.orig.height;
        const x1 = -width * this.anchor.x;
        let y1 = 0;

        if (tempPoint.x >= x1 && tempPoint.x < x1 + width)
        {
            y1 = -height * this.anchor.y;

            if (tempPoint.y >= y1 && tempPoint.y < y1 + height)
            {
                return true;
            }
        }

        return false;
    }

    /**
     * 销毁该精灵，并销毁其纹理和子元素
     *
     * @param {object|boolean} [options] - Options parameter. A boolean will act as if all options
     *  have been set to that value
     * @param {boolean} [options.children=false] - if set to true, all the children will have their destroy
     *      method called as well. 'options' will be passed on to those calls.
     * @param {boolean} [options.texture=false] - Should it destroy the current texture of the sprite as well
     * @param {boolean} [options.baseTexture=false] - Should it destroy the base texture of the sprite as well
     */
    destroy(options)
    {
        super.destroy(options);

        this._texture.off('update', this._onTextureUpdate, this);

        this._anchor = null;

        const destroyTexture = typeof options === 'boolean' ? options : options && options.texture;

        if (destroyTexture)
        {
            const destroyBaseTexture = typeof options === 'boolean' ? options : options && options.baseTexture;

            this._texture.destroy(!!destroyBaseTexture);
        }

        this._texture = null;
        this.shader = null;
    }

    // some helper functions..

    /**
     * 可以根据您提供的源创建一个新的精灵的辅助函数。
     * 源可以是-帧id、图像url、视频url、canvas元素、video元素、base texture
     *
     * @static
     * @param {string|PIXI.Texture|HTMLCanvasElement|HTMLVideoElement} source 从中创建纹理的来源
     * @param {object} [options] 请参见 {@link PIXI.BaseTexture} 的构造函数。
     * @return {PIXI.Sprite} 新创建的精灵
     */
    static from(source, options)
    {
        const texture = (source instanceof Texture)
            ? source
            : Texture.from(source, options);

        return new Sprite(texture);
    }

    /**
     * 如果为true，则在渲染时，PixiJS将使用Math.floor() x/y值，从而停止像素插值。
     * 优点包括更清晰的图像质量（如文本）和在canvas上更快的渲染。
     * 主要缺点是物体的运动可能看起来不太平滑。
     * 要设置全局默认值，请更改 {@link PIXI.settings.ROUND_PIXELS}
     *
     * @member {boolean}
     * @default false
     */
    set roundPixels(value)
    {
        if (this._roundPixels !== value)
        {
            this._transformID = -1;
        }
        this._roundPixels = value;
    }

    get roundPixels()
    {
        return this._roundPixels;
    }

    /**
     * 精灵的宽度，设置该值实际上将修改比例，以实现设置的值
     *
     * @member {number}
     */
    get width()
    {
        return Math.abs(this.scale.x) * this._texture.orig.width;
    }

    set width(value) // eslint-disable-line require-jsdoc
    {
        const s = sign(this.scale.x) || 1;

        this.scale.x = s * value / this._texture.orig.width;
        this._width = value;
    }

    /**
     * 精灵的高度，设置该值实际上将修改比例以达到设置的值
     *
     * @member {number}
     */
    get height()
    {
        return Math.abs(this.scale.y) * this._texture.orig.height;
    }

    set height(value) // eslint-disable-line require-jsdoc
    {
        const s = sign(this.scale.y) || 1;

        this.scale.y = s * value / this._texture.orig.height;
        this._height = value;
    }

    /**
     * 锚点设置文本的原点。 默认值取自 {@link PIXI.Texture|Texture}
     * 并传递给构造函数。
     *
     * 默认值为 `(0,0)`，这意味着文本的原点位于左上方。
     *
     * 将锚点设置为 `(0.5,0.5)` 意味着文本的原点居中。
     *
     * 将锚点设置为 `(1,1)` 意味着文本的原点将在右下角。
     *
     * 如果仅传递单个参数，则它将x和y设置为相同的值，如下例所示。
     *
     * @example
     * const sprite = new PIXI.Sprite(texture);
     * sprite.anchor.set(0.5); // 这会将原点设置为居中。(0.5)与(0.5, 0.5)相同。
     *
     * @member {PIXI.ObservablePoint}
     */
    get anchor()
    {
        return this._anchor;
    }

    set anchor(value) // eslint-disable-line require-jsdoc
    {
        this._anchor.copyFrom(value);
    }

    /**
     * 应用于精灵的色调。 这是一个十六进制值。
     * 值为0xFFFFFF将消除色调效果。
     *
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
        this._tintRGB = (value >> 16) + (value & 0xff00) + ((value & 0xff) << 16);
    }

    /**
     * 精灵正在使用的纹理
     *
     * @member {PIXI.Texture}
     */
    get texture()
    {
        return this._texture;
    }

    set texture(value) // eslint-disable-line require-jsdoc
    {
        if (this._texture === value)
        {
            return;
        }

        if (this._texture)
        {
            this._texture.off('update', this._onTextureUpdate, this);
        }

        this._texture = value || Texture.EMPTY;
        this._cachedTint = 0xFFFFFF;

        this._textureID = -1;
        this._textureTrimmedID = -1;

        if (value)
        {
            // wait for the texture to load
            if (value.baseTexture.valid)
            {
                this._onTextureUpdate();
            }
            else
            {
                value.once('update', this._onTextureUpdate, this);
            }
        }
    }
}
