import { BatchDrawCall } from './BatchDrawCall';
import { BatchTextureArray } from './BatchTextureArray';
import { BaseTexture } from '../textures/BaseTexture';
import { ObjectRenderer } from './ObjectRenderer';
import { State } from '../state/State';
import { ViewableBuffer } from '../geometry/ViewableBuffer';

import { checkMaxIfStatementsInShader } from '../shader/utils/checkMaxIfStatementsInShader';

import { settings } from '@pixi/settings';
import { premultiplyBlendMode, premultiplyTint, nextPow2, log2 } from '@pixi/utils';
import { ENV } from '@pixi/constants';

/**
 * 用于绘制和批处理精灵的渲染器。
 *
 * 这是默认的批处理渲染器。它使用基于纹理的几何体缓冲对象并成批渲染它们。
 * 它将多个纹理上传到GPU以减少draw调用的次数。
 *
 * @class
 * @protected
 * @memberof PIXI
 * @extends PIXI.ObjectRenderer
 */
export class AbstractBatchRenderer extends ObjectRenderer
{
    /**
     * 这将挂接渲染器的`contextChange`和`prerender`信号。
     *
     * @param {PIXI.Renderer} renderer - 为此工作的渲染器。
     */
    constructor(renderer)
    {
        super(renderer);

        /**
         * 用于生成着色器，该着色器可以根据指向`uSampler`中纹理的`aTextureId`属性为每个顶点着色。
         *
         * 这样可以在同一绘制调用中绘制具有不同纹理的对象。
         *
         * 您可以通过创建自定义着色器生成器来自定义着色器。
         *
         * @member {PIXI.BatchShaderGenerator}
         * @protected
         */
        this.shaderGenerator = null;

        /**
         * 表示将要与此批处理的对象的几何形状的类。
         *
         * @member {object}
         * @default PIXI.BatchGeometry
         * @protected
         */
        this.geometryClass = null;

        /**
         * 每个顶点在属性缓冲区中缓冲的数据大小（以浮点数表示）。
         * 默认情况下，批处理渲染器插件使用6：
         *
         * | aVertexPosition | 2 |
         * |-----------------|---|
         * | aTextureCoords  | 2 |
         * | aColor          | 1 |
         * | aTextureId      | 1 |
         *
         * @member {number}
         * @readonly
         */
        this.vertexSize = null;

        /**
         * 渲染器将在其中工作的WebGL状态。
         *
         * @member {PIXI.State}
         * @readonly
         */
        this.state = State.for2d();

        /**
         * 自动进行刷新之前可缓冲对象的数量。
         *
         * @member {number}
         * @default settings.SPRITE_BATCH_SIZE * 4
         */
        this.size = settings.SPRITE_BATCH_SIZE * 4;

        /**
         * 当前缓冲对象使用的所有顶点的总数。
         *
         * @member {number}
         * @private
         */
        this._vertexCount = 0;

        /**
         * 当前缓冲的对象使用的所有索引的总数。
         *
         * @member {number}
         * @private
         */
        this._indexCount = 0;

        /**
         * 尚未渲染的对象的缓冲区。
         *
         * @member {PIXI.DisplayObject[]}
         * @private
         */
        this._bufferedElements = [];

        /**
         * 用于纹理批处理构建器的数据，有助于节省一次传递的CPU
         * @type {PIXI.BaseTexture[]}
         * @private
         */
        this._bufferedTextures = [];

        /**
         * 已缓冲并等待刷新的元素数。
         *
         * @member {number}
         * @private
         */
        this._bufferSize = 0;

        /**
         * 该着色器由`this.shaderGenerator`生成。
         *
         * 它是专门为处理所需数量的纹理而生成的。
         *
         * @member {PIXI.Shader}
         * @protected
         */
        this._shader = null;

        /**
         * 存储缓冲区的`this.geometryClass`几何对象池。
         * 它们用于在每次绘制调用时将数据传递给着色器。
         *
         * 除非发生上下文更改，否则永远不会重新分配；
         * 但是，如果需要，可以扩展池。
         *
         * @member {PIXI.Geometry[]}
         * @private
         * @see PIXI.AbstractBatchRenderer.contextChange
         */
        this._packedGeometries = [];

        /**
         * `this._packedGeometries`的大小。
         * 如果在单个帧中发生超过`this._packedGeometries`的刷新，则可以扩展它。
         *
         * @member {number}
         * @private
         */
        this._packedGeometryPoolSize = 2;

        /**
         * 同一帧中可能发生多次刷新。
         * 在iOS设备上或当`settings.CAN_UPLOAD_SAME_BUFFER`为false时，
         * 出于性能原因，批处理渲染器不会将数据上传到同一`WebGLBuffer`上。
         *
         * 这是`packedGeometries`的索引，该索引指向保存最新缓冲区的几何。
         *
         * @member {number}
         * @private
         */
        this._flushId = 0;

        /**
         * 按大小递增顺序排序的“ ViewableBuffer”对象池。
         * 刷新方法使用的缓冲区的大小要比其所需的大小小。
         * 它们用于传递属性。
         *
         * 第一个缓冲区的大小为8；
         * 每个后续缓冲区的容量是其先前缓冲区的两倍。
         *
         * @member {PIXI.ViewableBuffer[]}
         * @private
         * @see PIXI.AbstractBatchRenderer#getAttributeBuffer
         */
        this._aBuffers = {};

        /**
         * 按大小递增顺序排序的`Uint16Array`对象池。
         * flush方法使用的缓冲区的最小大小超过了它所需的大小。
         * 它们用于传递索引。
         *
         * 第一个缓冲区的大小为12；
         * 每个后续缓冲区的容量是前一个缓冲区的两倍。
         *
         * @member {Uint16Array[]}
         * @private
         * @see PIXI.AbstractBatchRenderer#getIndexBuffer
         */
        this._iBuffers = {};

        /**
         * 在当前上下文下可以上载到GPU的最大纹理数。
         * 它已在`this.contextChange`中正确初始化。
         *
         * @member {number}
         * @see PIXI.AbstractBatchRenderer#contextChange
         * @readonly
         */
        this.MAX_TEXTURES = 1;

        this.renderer.on('prerender', this.onPrerender, this);
        renderer.runners.contextChange.add(this);

        this._dcIndex = 0;
        this._aIndex = 0;
        this._iIndex = 0;
        this._attributeBuffer = null;
        this._indexBuffer = null;
        this._tempBoundTextures = [];
    }

    /**
     * Handles the `contextChange` signal.
     * 处理`contextChange`信号。
     *
     * 它计算`this.MAX_TEXTURES`并分配压缩几何对象池。
     */
    contextChange()
    {
        const gl = this.renderer.gl;

        if (settings.PREFER_ENV === ENV.WEBGL_LEGACY)
        {
            this.MAX_TEXTURES = 1;
        }
        else
        {
            // step 1: first check max textures the GPU can handle.
            this.MAX_TEXTURES = Math.min(
                gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS),
                settings.SPRITE_MAX_TEXTURES);

            // step 2: check the maximum number of if statements the shader can have too..
            this.MAX_TEXTURES = checkMaxIfStatementsInShader(
                this.MAX_TEXTURES, gl);
        }

        this._shader = this.shaderGenerator.generateShader(this.MAX_TEXTURES);

        // we use the second shader as the first one depending on your browser
        // may omit aTextureId as it is not used by the shader so is optimized out.
        for (let i = 0; i < this._packedGeometryPoolSize; i++)
        {
            /* eslint-disable max-len */
            this._packedGeometries[i] = new (this.geometryClass)();
        }

        this.initFlushBuffers();
    }

    /**
     * 确保静态和动态刷新池对象的尺寸正确
     */
    initFlushBuffers()
    {
        const {
            _drawCallPool,
            _textureArrayPool,
        } = AbstractBatchRenderer;
        // max draw calls
        const MAX_SPRITES = this.size / 4;
        // max texture arrays
        const MAX_TA = Math.floor(MAX_SPRITES / this.MAX_TEXTURES) + 1;

        while (_drawCallPool.length < MAX_SPRITES)
        {
            _drawCallPool.push(new BatchDrawCall());
        }
        while (_textureArrayPool.length < MAX_TA)
        {
            _textureArrayPool.push(new BatchTextureArray());
        }
        for (let i = 0; i < this.MAX_TEXTURES; i++)
        {
            this._tempBoundTextures[i] = null;
        }
    }

    /**
     * 处理`prerender`信号。
     *
     * 它确保刷新从第一个几何对象开始。
     */
    onPrerender()
    {
        this._flushId = 0;
    }

    /**
     * 缓冲“可批量”对象。 它不需要立即渲染。
     *
     * @param {PIXI.DisplayObject} element - 使用此渲染器时要渲染的元素
     */
    render(element)
    {
        if (!element._texture.valid)
        {
            return;
        }

        if (this._vertexCount + (element.vertexData.length / 2) > this.size)
        {
            this.flush();
        }

        this._vertexCount += element.vertexData.length / 2;
        this._indexCount += element.indices.length;
        this._bufferedTextures[this._bufferSize] = element._texture.baseTexture;
        this._bufferedElements[this._bufferSize++] = element;
    }

    buildTexturesAndDrawCalls()
    {
        const {
            _bufferedTextures: textures,
            MAX_TEXTURES,
        } = this;
        const textureArrays = AbstractBatchRenderer._textureArrayPool;
        const batch = this.renderer.batch;
        const boundTextures = this._tempBoundTextures;
        const touch = this.renderer.textureGC.count;

        let TICK = ++BaseTexture._globalBatch;
        let countTexArrays = 0;
        let texArray = textureArrays[0];
        let start = 0;

        batch.copyBoundTextures(boundTextures, MAX_TEXTURES);

        for (let i = 0; i < this._bufferSize; ++i)
        {
            const tex = textures[i];

            textures[i] = null;
            if (tex._batchEnabled === TICK)
            {
                continue;
            }

            if (texArray.count >= MAX_TEXTURES)
            {
                batch.boundArray(texArray, boundTextures, TICK, MAX_TEXTURES);
                this.buildDrawCalls(texArray, start, i);
                start = i;
                texArray = textureArrays[++countTexArrays];
                ++TICK;
            }

            tex._batchEnabled = TICK;
            tex.touched = touch;
            texArray.elements[texArray.count++] = tex;
        }

        if (texArray.count > 0)
        {
            batch.boundArray(texArray, boundTextures, TICK, MAX_TEXTURES);
            this.buildDrawCalls(texArray, start, this._bufferSize);
            ++countTexArrays;
            ++TICK;
        }

        // Clean-up

        for (let i = 0; i < boundTextures.length; i++)
        {
            boundTextures[i] = null;
        }
        BaseTexture._globalBatch = TICK;
    }

    /**
     * 绘制的填充drawcalls
     *
     * @param {PIXI.BatchTextureArray} texArray
     * @param {number} start
     * @param {number} finish
     */
    buildDrawCalls(texArray, start, finish)
    {
        const {
            _bufferedElements: elements,
            _attributeBuffer,
            _indexBuffer,
            vertexSize,
        } = this;
        const drawCalls = AbstractBatchRenderer._drawCallPool;

        let dcIndex = this._dcIndex;
        let aIndex = this._aIndex;
        let iIndex = this._iIndex;

        let drawCall = drawCalls[dcIndex];

        drawCall.start = this._iIndex;
        drawCall.texArray = texArray;

        for (let i = start; i < finish; ++i)
        {
            const sprite = elements[i];
            const tex = sprite._texture.baseTexture;
            const spriteBlendMode = premultiplyBlendMode[
                tex.alphaMode ? 1 : 0][sprite.blendMode];

            elements[i] = null;

            if (start < i && drawCall.blend !== spriteBlendMode)
            {
                drawCall.size = iIndex - drawCall.start;
                start = i;
                drawCall = drawCalls[++dcIndex];
                drawCall.texArray = texArray;
                drawCall.start = iIndex;
            }

            this.packInterleavedGeometry(sprite, _attributeBuffer, _indexBuffer, aIndex, iIndex);
            aIndex += sprite.vertexData.length / 2 * vertexSize;
            iIndex += sprite.indices.length;

            drawCall.blend = spriteBlendMode;
        }

        if (start < finish)
        {
            drawCall.size = iIndex - drawCall.start;
            ++dcIndex;
        }

        this._dcIndex = dcIndex;
        this._aIndex = aIndex;
        this._iIndex = iIndex;
    }

    /**
     * 绑定纹理以进行当前渲染绑定纹理以进行当前渲染
     *
     * @param {PIXI.BatchTextureArray} texArray
     */
    bindAndClearTexArray(texArray)
    {
        const textureSystem = this.renderer.texture;

        for (let j = 0; j < texArray.count; j++)
        {
            textureSystem.bind(texArray.elements[j], texArray.ids[j]);
            texArray.elements[j] = null;
        }
        texArray.count = 0;
    }

    updateGeometry()
    {
        const {
            _packedGeometries: packedGeometries,
            _attributeBuffer: attributeBuffer,
            _indexBuffer: indexBuffer,
        } = this;

        if (!settings.CAN_UPLOAD_SAME_BUFFER)
        { /* Usually on iOS devices, where the browser doesn't
            like uploads to the same buffer in a single frame. */
            if (this._packedGeometryPoolSize <= this._flushId)
            {
                this._packedGeometryPoolSize++;
                packedGeometries[this._flushId] = new (this.geometryClass)();
            }

            packedGeometries[this._flushId]._buffer.update(attributeBuffer.rawBinaryData);
            packedGeometries[this._flushId]._indexBuffer.update(indexBuffer);

            this.renderer.geometry.bind(packedGeometries[this._flushId]);
            this.renderer.geometry.updateBuffers();
            this._flushId++;
        }
        else
        {
            // lets use the faster option, always use buffer number 0
            packedGeometries[this._flushId]._buffer.update(attributeBuffer.rawBinaryData);
            packedGeometries[this._flushId]._indexBuffer.update(indexBuffer);

            this.renderer.geometry.updateBuffers();
        }
    }

    drawBatches()
    {
        const dcCount = this._dcIndex;
        const { gl, state: stateSystem } = this.renderer;
        const drawCalls = AbstractBatchRenderer._drawCallPool;

        let curTexArray = null;

        // Upload textures and do the draw calls
        for (let i = 0; i < dcCount; i++)
        {
            const { texArray, type, size, start, blend } = drawCalls[i];

            if (curTexArray !== texArray)
            {
                curTexArray = texArray;
                this.bindAndClearTexArray(texArray);
            }

            this.state.blendMode = blend;
            stateSystem.set(this.state);
            gl.drawElements(type, size, gl.UNSIGNED_SHORT, start * 2);
        }
    }

    /**
     * 立刻渲染内容并清空当前批处理。
     */
    flush()
    {
        if (this._vertexCount === 0)
        {
            return;
        }

        this._attributeBuffer = this.getAttributeBuffer(this._vertexCount);
        this._indexBuffer = this.getIndexBuffer(this._indexCount);
        this._aIndex = 0;
        this._iIndex = 0;
        this._dcIndex = 0;

        this.buildTexturesAndDrawCalls();
        this.updateGeometry();
        this.drawBatches();

        // reset elements buffer for the next flush
        this._bufferSize = 0;
        this._vertexCount = 0;
        this._indexCount = 0;
    }

    /**
     * 开始新的精灵批处理。
     */
    start()
    {
        this.renderer.state.set(this.state);

        this.renderer.shader.bind(this._shader);

        if (settings.CAN_UPLOAD_SAME_BUFFER)
        {
            // bind buffer #0, we don't need others
            this.renderer.geometry.bind(this._packedGeometries[this._flushId]);
        }
    }

    /**
     * 停止并刷新当前批处理。
     */
    stop()
    {
        this.flush();
    }

    /**
     * 销毁此`AbstractBatchRenderer`。不能再被调用。
     */
    destroy()
    {
        for (let i = 0; i < this._packedGeometryPoolSize; i++)
        {
            if (this._packedGeometries[i])
            {
                this._packedGeometries[i].destroy();
            }
        }

        this.renderer.off('prerender', this.onPrerender, this);

        this._aBuffers = null;
        this._iBuffers = null;
        this._packedGeometries = null;
        this._attributeBuffer = null;
        this._indexBuffer = null;

        if (this._shader)
        {
            this._shader.destroy();
            this._shader = null;
        }

        super.destroy();
    }

    /**
     * 从`this._aBuffers`取得一个属性缓冲区，该缓冲区可以容纳至少`size`个浮点数。
     *
     * @param {number} size - 所需的最小容量
     * @return {ViewableBuffer} - 缓冲区可以容纳至少`size`个浮点数
     * @private
     */
    getAttributeBuffer(size)
    {
        // 8 vertices is enough for 2 quads
        const roundedP2 = nextPow2(Math.ceil(size / 8));
        const roundedSizeIndex = log2(roundedP2);
        const roundedSize = roundedP2 * 8;

        if (this._aBuffers.length <= roundedSizeIndex)
        {
            this._iBuffers.length = roundedSizeIndex + 1;
        }

        let buffer = this._aBuffers[roundedSize];

        if (!buffer)
        {
            this._aBuffers[roundedSize] = buffer = new ViewableBuffer(roundedSize * this.vertexSize * 4);
        }

        return buffer;
    }

    /**
     * 从`this._aBuffers`取得一个索引缓冲区，该缓冲区可以容纳至少`size`的容量。
     *
     * @param {number} size - 最小所需容量
     * @return {Uint16Array} - 可以容纳`size`索引的缓冲区。
     * @private
     */
    getIndexBuffer(size)
    {
        // 12 indices is enough for 2 quads
        const roundedP2 = nextPow2(Math.ceil(size / 12));
        const roundedSizeIndex = log2(roundedP2);
        const roundedSize = roundedP2 * 12;

        if (this._iBuffers.length <= roundedSizeIndex)
        {
            this._iBuffers.length = roundedSizeIndex + 1;
        }

        let buffer = this._iBuffers[roundedSizeIndex];

        if (!buffer)
        {
            this._iBuffers[roundedSizeIndex] = buffer = new Uint16Array(roundedSize);
        }

        return buffer;
    }

    /**
     * 接受元素的四个批处理参数，交织并将其推入指定的批处理属性/索引缓冲区。
     *
     * 它使用以下属性：`vertexData`，`uvs`，`textureId`和`indicies`。
     * 如果存在，它也会使用基础纹理的"tint"。
     *
     * @param {PIXI.Sprite} element - 被渲染的元素
     * @param {PIXI.ViewableBuffer} attributeBuffer - 属性缓冲区。
     * @param {Uint16Array} indexBuffer - 索引缓冲区
     * @param {number} aIndex -  `attributeBuffer`中已经存在的浮点数
     * @param {number} iIndex - `indexBuffer`中已经存在的索引数
     */
    packInterleavedGeometry(element, attributeBuffer, indexBuffer, aIndex, iIndex)
    {
        const {
            uint32View,
            float32View,
        } = attributeBuffer;

        const packedVertices = aIndex / this.vertexSize;
        const uvs = element.uvs;
        const indicies = element.indices;
        const vertexData = element.vertexData;
        const textureId = element._texture.baseTexture._batchLocation;

        const alpha = Math.min(element.worldAlpha, 1.0);
        const argb = (alpha < 1.0
            && element._texture.baseTexture.alphaMode)
            ? premultiplyTint(element._tintRGB, alpha)
            : element._tintRGB + (alpha * 255 << 24);

        // lets not worry about tint! for now..
        for (let i = 0; i < vertexData.length; i += 2)
        {
            float32View[aIndex++] = vertexData[i];
            float32View[aIndex++] = vertexData[i + 1];
            float32View[aIndex++] = uvs[i];
            float32View[aIndex++] = uvs[i + 1];
            uint32View[aIndex++] = argb;
            float32View[aIndex++] = textureId;
        }

        for (let i = 0; i < indicies.length; i++)
        {
            indexBuffer[iIndex++] = packedVertices + indicies[i];
        }
    }
}

/**
 * `flush`用于创建要渲染对象的"batches"的`BatchDrawCall`对象池。
 *
 * 这些再也不会重新分配。
 * 在所有批处理渲染器之间共享，因为目前只能进行一个“刷新”操作。
 *
 * @static
 * @member {PIXI.BatchDrawCall[]}
 */
AbstractBatchRenderer._drawCallPool = [];

/**
 * `flush`用于创建要渲染对象的"batches"的`BatchDrawCall`对象池。
 *
 * 这些再也不会重新分配。
 * Shared between all batch renderers because it can be only one "flush" working at the moment.
 * 在所有批处理渲染器之间共享，因为目前只能进行一个“刷新”操作。
 *
 * @static
 * @member {PIXI.BatchTextureArray[]}
 */
AbstractBatchRenderer._textureArrayPool = [];
