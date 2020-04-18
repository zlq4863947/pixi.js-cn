import { State } from '@pixi/core';
import { Point, Polygon } from '@pixi/math';
import { BLEND_MODES, DRAW_MODES } from '@pixi/constants';
import { Container } from '@pixi/display';
import { settings } from '@pixi/settings';
import { MeshBatchUvs } from './MeshBatchUvs';

const tempPoint = new Point();
const tempPolygon = new Polygon();

/**
 * 基础网格类
 *
 * 此类使您拥有最大的灵活性来呈现您可以想到的任何种类的WebGL视觉效果。
 * 该课假设使用者有一定程度的WebGL知识。
 * 如果您知道一点，这应该足够抽象，使您的生活更轻松！
 *
 * 几乎所有的WebGL都可以分为以下几类：
 * - 几何(Geometry) - 网格的结构和数据。这可以包括任何位置、UV、法线、颜色等。。
 * - 着色器(Shader) - 这是PixiJS用来渲染几何的着色器（着色器中的属性必须与几何匹配）
 * - 状态(State) - 这是渲染网格所需的WebGL状态。
 *
 * 通过结合以上元素，您可以渲染任何所需的2D或3D！
 *
 * @class
 * @extends PIXI.Container
 * @memberof PIXI
 */
export class Mesh extends Container
{
    /**
     * @param {PIXI.Geometry} geometry  网格将使用的几何
     * @param {PIXI.Shader|PIXI.MeshMaterial} shader  网格将使用的着色器
     * @param {PIXI.State} [state] 需要WebGL上下文才能呈现网格的状态
     *        如果未提供状态，则使用{@link PIXI.State.for2d}为PixiJS创建2D状态。
     * @param {number} [drawMode=PIXI.DRAW_MODES.TRIANGLES] drawMode可以是任何PIXI.DRAW_MODES常量
     */
    constructor(geometry, shader, state, drawMode = DRAW_MODES.TRIANGLES)// vertices, uvs, indices, drawMode)
    {
        super();

        /**
         * 在缓冲区内包括顶点位置，晶面指数，法线，颜色，UV和自定义属性，
         * 从而降低了将所有这些数据传递给GPU的成本。
         * 可以在多个Mesh对象之间共享。
         * @member {PIXI.Geometry}
         * @readonly
         */
        this.geometry = geometry;

        geometry.refCount++;

        /**
         * 表示处理几何图形并在GPU上运行的顶点和片段着色器。
         * 可以在多个Mesh对象之间共享。
         * @member {PIXI.Shader|PIXI.MeshMaterial}
         */
        this.shader = shader;

        /**
         * 表示网格渲染所需的WebGL状态，不包括着色器和几何体。
         * 例如: 混合模式，剔除，深度测试，渲染三角形的方向，背面等。
         * @member {PIXI.State}
         */
        this.state = state || State.for2d();

        /**
         * 网格的绘制方式可以是任何{@link PIXI.DRAW_MODES}常量。
         *
         * @member {number}
         * @see PIXI.DRAW_MODES
         */
        this.drawMode = drawMode;

        /**
         * 在哪里开始绘制的IndexBuffer的索引。
         * @member {number}
         * @default 0
         */
        this.start = 0;

        /**
         * 要绘制多少几何图形才渲染内容，默认情况下 `0` 将渲染所有内容。
         * @member {number}
         * @default 0
         */
        this.size = 0;

        /**
         * 它们被用作批处理的快捷方式
         * @member {Float32Array}
         * @private
         */
        this.uvs = null;

        /**
         * 它们被用作批处理的快捷方式
         * @member {Uint16Array}
         * @private
         */
        this.indices = null;

        /**
         * 这是批处理程序使用的缓存层
         * @member {Float32Array}
         * @private
         */
        this.vertexData = new Float32Array(1);

        /**
         * 如果几何形状已更改，则用于决定重新转换vertexData。
         * @member {number}
         * @private
         */
        this.vertexDirty = 0;

        this._transformID = -1;

        // Inherited from DisplayMode, set defaults
        this.tint = 0xFFFFFF;
        this.blendMode = BLEND_MODES.NORMAL;

        /**
         * 内部roundPixels字段
         *
         * @member {boolean}
         * @private
         */
        this._roundPixels = settings.ROUND_PIXELS;

        /**
         * 为atlas纹理缓存批处理的UV
         * @member {PIXI.MeshBatchUvs}
         * @private
         */
        this.batchUvs = null;
    }

    /**
     * 要更改网格uv，请更改其uvBuffer数据并增加_updateID。
     * @member {PIXI.Buffer}
     * @readonly
     */
    get uvBuffer()
    {
        return this.geometry.buffers[1];
    }

    /**
     * 要更改网格顶点，请更改其uvBuffer数据并增加_updateID。
     * 递增_updateID是可选的，因为大多数网格对象都会这样做。
     * @member {PIXI.Buffer}
     * @readonly
     */
    get verticesBuffer()
    {
        return this.geometry.buffers[0];
    }

    /**
     * {@link PIXI.Mesh#shader}的别名。
     * @member {PIXI.Shader|PIXI.MeshMaterial}
     */
    set material(value)
    {
        this.shader = value;
    }

    get material()
    {
        return this.shader;
    }

    /**
     * 要应用于网格的混合模式。使用`PIXI.BLEND_MODES.NORMAL`重置混合模式。
     *
     * @member {number}
     * @default PIXI.BLEND_MODES.NORMAL;
     * @see PIXI.BLEND_MODES
     */
    set blendMode(value)
    {
        this.state.blendMode = value;
    }

    get blendMode()
    {
        return this.state.blendMode;
    }

    /**
     * 如果为true，则在渲染时，PixiJS将使用Math.floor() x/y值，从而停止像素插值。
     * 优点包括更清晰的图像质量（如文本）和在canvas上更快的渲染。
     * 主要缺点是物体的运动可能看起来不太平滑。
     * To set the global default, change {@link PIXI.settings.ROUND_PIXELS}
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
     * 应用于网格的倍增色调。这是十六进制值。值`0xFFFFFF`将删除任何色调效果。
     *
     * @member {number}
     * @default 0xFFFFFF
     */
    get tint()
    {
        return this.shader.tint;
    }

    set tint(value)
    {
        this.shader.tint = value;
    }

    /**
     * 网格使用的纹理。
     *
     * @member {PIXI.Texture}
     */
    get texture()
    {
        return this.shader.texture;
    }

    set texture(value)
    {
        this.shader.texture = value;
    }

    /**
     * 标准渲染器绘制。
     * @protected
     * @param {PIXI.Renderer} renderer - 渲染器实例。
     */
    _render(renderer)
    {
        // set properties for batching..
        // TODO could use a different way to grab verts?
        const vertices = this.geometry.buffers[0].data;

        // TODO benchmark check for attribute size..
        if (this.shader.batchable && this.drawMode === DRAW_MODES.TRIANGLES && vertices.length < Mesh.BATCHABLE_SIZE * 2)
        {
            this._renderToBatch(renderer);
        }
        else
        {
            this._renderDefault(renderer);
        }
    }

    /**
     * 标准的非批处理渲染方式。
     * @protected
     * @param {PIXI.Renderer} renderer - 渲染器实例。
     */
    _renderDefault(renderer)
    {
        const shader = this.shader;

        shader.alpha = this.worldAlpha;
        if (shader.update)
        {
            shader.update();
        }

        renderer.batch.flush();

        if (shader.program.uniformData.translationMatrix)
        {
            shader.uniforms.translationMatrix = this.transform.worldTransform.toArray(true);
        }

        // bind and sync uniforms..
        renderer.shader.bind(shader);

        // set state..
        renderer.state.set(this.state);

        // bind the geometry...
        renderer.geometry.bind(this.geometry, shader);

        // then render it
        renderer.geometry.draw(this.drawMode, this.size, this.start, this.geometry.instanceCount);
    }

    /**
     * 使用批处理系统进行渲染。
     * @protected
     * @param {PIXI.Renderer} renderer - 渲染器实例。
     */
    _renderToBatch(renderer)
    {
        const geometry = this.geometry;

        if (this.shader.uvMatrix)
        {
            this.shader.uvMatrix.update();
            this.calculateUvs();
        }

        // set properties for batching..
        this.calculateVertices();
        this.indices = geometry.indexBuffer.data;
        this._tintRGB = this.shader._tintRGB;
        this._texture = this.shader.texture;

        const pluginName = this.material.pluginName;

        renderer.batch.setObjectRenderer(renderer.plugins[pluginName]);
        renderer.plugins[pluginName].render(this);
    }

    /**
     * 根据变换和顶点更新vertexData字段
     */
    calculateVertices()
    {
        const geometry = this.geometry;
        const vertices = geometry.buffers[0].data;

        if (geometry.vertexDirtyId === this.vertexDirty && this._transformID === this.transform._worldID)
        {
            return;
        }

        this._transformID = this.transform._worldID;

        if (this.vertexData.length !== vertices.length)
        {
            this.vertexData = new Float32Array(vertices.length);
        }

        const wt = this.transform.worldTransform;
        const a = wt.a;
        const b = wt.b;
        const c = wt.c;
        const d = wt.d;
        const tx = wt.tx;
        const ty = wt.ty;

        const vertexData = this.vertexData;

        for (let i = 0; i < vertexData.length / 2; i++)
        {
            const x = vertices[(i * 2)];
            const y = vertices[(i * 2) + 1];

            vertexData[(i * 2)] = (a * x) + (c * y) + tx;
            vertexData[(i * 2) + 1] = (b * x) + (d * y) + ty;
        }

        if (this._roundPixels)
        {
            const resolution = settings.RESOLUTION;

            for (let i = 0; i < vertexData.length; ++i)
            {
                vertexData[i] = Math.round((vertexData[i] * resolution | 0) / resolution);
            }
        }

        this.vertexDirty = geometry.vertexDirtyId;
    }

    /**
     * 根据几何uv或batchUvs更新uv字段
     */
    calculateUvs()
    {
        const geomUvs = this.geometry.buffers[1];

        if (!this.shader.uvMatrix.isSimple)
        {
            if (!this.batchUvs)
            {
                this.batchUvs = new MeshBatchUvs(geomUvs, this.shader.uvMatrix);
            }
            this.batchUvs.update();
            this.uvs = this.batchUvs.data;
        }
        else
        {
            this.uvs = geomUvs.data;
        }
    }

    /**
     * 将网格的边界更新为矩形。 边界计算将worldTransform考虑在内。
     * 几何中必须存在aVertexPosition属性，才能正确计算边界。
     *
     * @protected
     */
    _calculateBounds()
    {
        this.calculateVertices();

        this._bounds.addVertexData(this.vertexData, 0, this.vertexData.length);
    }

    /**
     * 测试点是否在此网格内。 仅适用于PIXI.DRAW_MODES.TRIANGLES。
     *
     * @param {PIXI.Point} point 测试点
     * @return {boolean} 测试结果
     */
    containsPoint(point)
    {
        if (!this.getBounds().contains(point.x, point.y))
        {
            return false;
        }

        this.worldTransform.applyInverse(point, tempPoint);

        const vertices = this.geometry.getBuffer('aVertexPosition').data;

        const points = tempPolygon.points;
        const indices =  this.geometry.getIndex().data;
        const len = indices.length;
        const step = this.drawMode === 4 ? 3 : 1;

        for (let i = 0; i + 2 < len; i += step)
        {
            const ind0 = indices[i] * 2;
            const ind1 = indices[i + 1] * 2;
            const ind2 = indices[i + 2] * 2;

            points[0] = vertices[ind0];
            points[1] = vertices[ind0 + 1];
            points[2] = vertices[ind1];
            points[3] = vertices[ind1 + 1];
            points[4] = vertices[ind2];
            points[5] = vertices[ind2 + 1];

            if (tempPolygon.contains(tempPoint.x, tempPoint.y))
            {
                return true;
            }
        }

        return false;
    }
    /**
     * 销毁网格物体。
     *
     * @param {object|boolean} [options] - 选项参数。 布尔值将充当所有选项都已设置为该值的作用
     * @param {boolean} [options.children=false] - 如果设置为true，则所有子项也将调用其destroy方法。 'options' 将传递给这些调用。
     */
    destroy(options)
    {
        super.destroy(options);

        this.geometry.refCount--;
        if (this.geometry.refCount === 0)
        {
            this.geometry.dispose();
        }

        this.geometry = null;
        this.shader = null;
        this.state = null;
        this.uvs = null;
        this.indices = null;
        this.vertexData = null;
    }
}

/**
 * 要考虑可批处理的最大顶点数。一般用于，复杂几何。
 * @memberof PIXI.Mesh
 * @static
 * @member {number} BATCHABLE_SIZE
 */
Mesh.BATCHABLE_SIZE = 100;
