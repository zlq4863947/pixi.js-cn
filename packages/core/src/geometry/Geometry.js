import { Attribute } from './Attribute';
import { Buffer } from './Buffer';
import { interleaveTypedArrays } from './utils/interleaveTypedArrays';
import { getBufferType } from './utils/getBufferType';
import { Runner } from '@pixi/runner';

const byteSizeMap = { 5126: 4, 5123: 2, 5121: 1 };
let UID = 0;

/* eslint-disable object-shorthand */
const map = {
    Float32Array: Float32Array,
    Uint32Array: Uint32Array,
    Int32Array: Int32Array,
    Uint8Array: Uint8Array,
    Uint16Array: Uint16Array,
};

/* eslint-disable max-len */

/**
 * 几何表示模型。它由两个部分组成：
 * - GeometryStyle - 模型的结构，例如属性布局
 * - GeometryData - 模型数据 - 由缓冲区组成。
 * 这可以包括位置，uv，法线，颜色等中的任何内容。
 *
 * 可以在不需要传递样式或数据的情况下定义几何（这就是我的偏爱！）
 *
 * ```js
 * let geometry = new PIXI.Geometry();
 *
 * geometry.addAttribute('positions', [0, 0, 100, 0, 100, 100, 0, 100], 2);
 * geometry.addAttribute('uvs', [0,0,1,0,1,1,0,1],2)
 * geometry.addIndex([0,1,2,1,3,2])
 *
 * ```
 * @class
 * @memberof PIXI
 */
export class Geometry
{
    /**
     * @param {PIXI.Buffer[]} [buffers]  缓冲区数组。可选的。
     * @param {object} [attributes] 几何形状，属性布局的可选结构
     */
    constructor(buffers = [], attributes = {})
    {
        this.buffers = buffers;

        this.indexBuffer = null;

        this.attributes = attributes;

        /**
         * 渲染器ID到webgl VAO的映射
         *
         * @protected
         * @type {object}
         */
        this.glVertexArrayObjects = {};

        this.id = UID++;

        this.instanced = false;

        /**
         * 此几何中的实例数，将其传递给 `GeometrySystem.draw()`
         * @member {number}
         * @default 1
         */
        this.instanceCount = 1;

        this.disposeRunner = new Runner('disposeGeometry', 2);

        /**
         * 引用此几何体的现有（未破坏）网格的数量
         * @member {number}
         */
        this.refCount = 0;
    }

    /**
    *
    * 向几何添加属性
    *
    * @param {String} id - 属性的名称（与着色器匹配）
    * @param {PIXI.Buffer|number[]} [buffer] 存放属性数据的缓冲区。 您还可以提供一个Array，并从中创建一个缓冲区。
    * @param {Number} [size=0] 属性的大小。 如果每个顶点有2个浮点数（例如位置x和y），则为2
    * @param {Boolean} [normalized=false] 数据是否应该归一化。
    * @param {Number} [type=PIXI.TYPES.FLOAT] 属性是什么类型的数字。检查{@link PIXI.TYPES}以查看可用值
    * @param {Number} [stride=0] 每个值的起始位置相距多远（以浮点数表示）。 （用于交错数据）
    * @param {Number} [start=0] 数组开始读取值的距离（用于交错数据）
    *
    * @return {PIXI.Geometry} 返回自身，用于链式引用
    */
    addAttribute(id, buffer, size, normalized = false, type, stride, start, instance = false)
    {
        if (!buffer)
        {
            throw new Error('You must pass a buffer when creating an attribute');
        }

        // check if this is a buffer!
        if (!buffer.data)
        {
            // its an array!
            if (buffer instanceof Array)
            {
                buffer = new Float32Array(buffer);
            }

            buffer = new Buffer(buffer);
        }

        const ids = id.split('|');

        if (ids.length > 1)
        {
            for (let i = 0; i < ids.length; i++)
            {
                this.addAttribute(ids[i], buffer, size, normalized, type);
            }

            return this;
        }

        let bufferIndex = this.buffers.indexOf(buffer);

        if (bufferIndex === -1)
        {
            this.buffers.push(buffer);
            bufferIndex = this.buffers.length - 1;
        }

        this.attributes[id] = new Attribute(bufferIndex, size, normalized, type, stride, start, instance);

        // assuming that if there is instanced data then this will be drawn with instancing!
        this.instanced = this.instanced || instance;

        return this;
    }

    /**
     * 返回请求的属性
     *
     * @param {String} id  属性的名称
     * @return {PIXI.Attribute} 请求的属性。
     */
    getAttribute(id)
    {
        return this.attributes[id];
    }

    /**
     * 返回请求的缓冲区
     *
     * @param {String} id  缓冲区的名称
     * @return {PIXI.Buffer} 请求的缓冲区。
     */
    getBuffer(id)
    {
        return this.buffers[this.getAttribute(id).buffer];
    }

    /**
    *
    * 向几何图形添加索引缓冲区
     * 索引缓冲区包含整数，对于几何体中的每个三角形有三个整数，这些整数了引用各种属性缓冲区（位置、颜色、紫外线坐标、其他紫外线坐标、法线…）。只有一个索引缓冲区。
    *
    * @param {PIXI.Buffer|number[]} [buffer] 存放索引缓冲区数据的缓冲区。 您还可以提供一个Array，并从中创建一个缓冲区。
    * @return {PIXI.Geometry} 返回自身，用于链式引用
    */
    addIndex(buffer)
    {
        if (!buffer.data)
        {
            // its an array!
            if (buffer instanceof Array)
            {
                buffer = new Uint16Array(buffer);
            }

            buffer = new Buffer(buffer);
        }

        buffer.index = true;
        this.indexBuffer = buffer;

        if (this.buffers.indexOf(buffer) === -1)
        {
            this.buffers.push(buffer);
        }

        return this;
    }

    /**
     * 返回索引缓冲区
     *
     * @return {PIXI.Buffer} 索引缓冲区。
     */
    getIndex()
    {
        return this.indexBuffer;
    }

    /**
     * 此函数修改结构，以便所有当前属性都交错到单个缓冲区中
     * 如果您的模型保持静态，这会很有用，因为它会带来一点性能提升
     *
     * @return {PIXI.Geometry} 返回自身，用于链式引用
     */
    interleave()
    {
        // a simple check to see if buffers are already interleaved..
        if (this.buffers.length === 1 || (this.buffers.length === 2 && this.indexBuffer)) return this;

        // assume already that no buffers are interleaved
        const arrays = [];
        const sizes = [];
        const interleavedBuffer = new Buffer();
        let i;

        for (i in this.attributes)
        {
            const attribute = this.attributes[i];

            const buffer = this.buffers[attribute.buffer];

            arrays.push(buffer.data);

            sizes.push((attribute.size * byteSizeMap[attribute.type]) / 4);

            attribute.buffer = 0;
        }

        interleavedBuffer.data = interleaveTypedArrays(arrays, sizes);

        for (i = 0; i < this.buffers.length; i++)
        {
            if (this.buffers[i] !== this.indexBuffer)
            {
                this.buffers[i].destroy();
            }
        }

        this.buffers = [interleavedBuffer];

        if (this.indexBuffer)
        {
            this.buffers.push(this.indexBuffer);
        }

        return this;
    }

    getSize()
    {
        for (const i in this.attributes)
        {
            const attribute = this.attributes[i];
            const buffer = this.buffers[attribute.buffer];

            return buffer.data.length / ((attribute.stride / 4) || attribute.size);
        }

        return 0;
    }

    /**
     * 释放连接到此几何的WebGL资源
     */
    dispose()
    {
        this.disposeRunner.run(this, false);
    }

    /**
     * 销毁几何
     */
    destroy()
    {
        this.dispose();

        this.buffers = null;
        this.indexBuffer = null;
        this.attributes = null;
    }

    /**
     * 返回几何体的副本
     *
     * @returns {PIXI.Geometry} 几何的新副本
     */
    clone()
    {
        const geometry = new Geometry();

        for (let i = 0; i < this.buffers.length; i++)
        {
            geometry.buffers[i] = new Buffer(this.buffers[i].data.slice());
        }

        for (const i in this.attributes)
        {
            const attrib = this.attributes[i];

            geometry.attributes[i] = new Attribute(
                attrib.buffer,
                attrib.size,
                attrib.normalized,
                attrib.type,
                attrib.stride,
                attrib.start,
                attrib.instance,
            );
        }

        if (this.indexBuffer)
        {
            geometry.indexBuffer = geometry.buffers[this.buffers.indexOf(this.indexBuffer)];
            geometry.indexBuffer.index = true;
        }

        return geometry;
    }

    /**
     * 将一组几何图形合并到一个新的单个几何图形中，该属性必须匹配才能使此操作起作用
     *
     * @param {PIXI.Geometry[]} 要合并的几何数组
     * @returns {PIXI.Geometry} 闪亮的新几何！
     */
    static merge(geometries)
    {
        // todo add a geometry check!
        // also a size check.. cant be too big!]

        const geometryOut = new Geometry();

        const arrays = [];
        const sizes = [];
        const offsets = [];

        let geometry;

        // pass one.. get sizes..
        for (let i = 0; i < geometries.length; i++)
        {
            geometry = geometries[i];

            for (let j = 0; j < geometry.buffers.length; j++)
            {
                sizes[j] = sizes[j] || 0;
                sizes[j] += geometry.buffers[j].data.length;
                offsets[j] = 0;
            }
        }

        // build the correct size arrays..
        for (let i = 0; i < geometry.buffers.length; i++)
        {
            // TODO types!
            arrays[i] = new map[getBufferType(geometry.buffers[i].data)](sizes[i]);
            geometryOut.buffers[i] = new Buffer(arrays[i]);
        }

        // pass to set data..
        for (let i = 0; i < geometries.length; i++)
        {
            geometry = geometries[i];

            for (let j = 0; j < geometry.buffers.length; j++)
            {
                arrays[j].set(geometry.buffers[j].data, offsets[j]);
                offsets[j] += geometry.buffers[j].data.length;
            }
        }

        geometryOut.attributes = geometry.attributes;

        if (geometry.indexBuffer)
        {
            geometryOut.indexBuffer = geometryOut.buffers[geometry.buffers.indexOf(geometry.indexBuffer)];
            geometryOut.indexBuffer.index = true;

            let offset = 0;
            let stride = 0;
            let offset2 = 0;
            let bufferIndexToCount = 0;

            // get a buffer
            for (let i = 0; i < geometry.buffers.length; i++)
            {
                if (geometry.buffers[i] !== geometry.indexBuffer)
                {
                    bufferIndexToCount = i;
                    break;
                }
            }

            // figure out the stride of one buffer..
            for (const i in geometry.attributes)
            {
                const attribute = geometry.attributes[i];

                if ((attribute.buffer | 0) === bufferIndexToCount)
                {
                    stride += ((attribute.size * byteSizeMap[attribute.type]) / 4);
                }
            }

            // time to off set all indexes..
            for (let i = 0; i < geometries.length; i++)
            {
                const indexBufferData = geometries[i].indexBuffer.data;

                for (let j = 0; j < indexBufferData.length; j++)
                {
                    geometryOut.indexBuffer.data[j + offset2] += offset;
                }

                offset += geometry.buffers[bufferIndexToCount].data.length / (stride);
                offset2 += indexBufferData.length;
            }
        }

        return geometryOut;
    }
}
