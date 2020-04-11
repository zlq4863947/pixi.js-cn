import {
    Circle,
    Ellipse,
    PI_2,
    Point,
    Polygon,
    Rectangle,
    RoundedRectangle,
    Matrix,
    SHAPES,
} from '@pixi/math';

import {
    Texture,
    Shader,
    UniformGroup, State,
} from '@pixi/core';

import {
    BezierUtils,
    QuadraticUtils,
    ArcUtils,
    Star,
} from './utils';

import { hex2rgb, deprecation } from '@pixi/utils';
import { GraphicsGeometry } from './GraphicsGeometry';
import { FillStyle } from './styles/FillStyle';
import { LineStyle } from './styles/LineStyle';
import { BLEND_MODES } from '@pixi/constants';
import { Container } from '@pixi/display';

const temp = new Float32Array(3);

// a default shaders map used by graphics..
const DEFAULT_SHADERS = {};

/**
 * Graphics类包含一些方法，这些方法可将原始形状（例如线条，圆形和矩形）绘制到显示器上，并为它们上色和填充。
 *
 * 请注意，由于图形可以与其他实例共享GraphicsGeometry。
 * 有必要调用`destroy()` 来正确地解除对底层GraphicsGeometry的引用并避免内存泄漏。
 * 或者，继续使用相同的Graphics实例，并在重绘之间调用 `clear()`。
 *
 * @class
 * @extends PIXI.Container
 * @memberof PIXI
 */
export class Graphics extends Container
{
    /**
     * @param {PIXI.GraphicsGeometry} [geometry=null] - 要使用的Geometry（如果省略）将创建一个新的GraphicsGeometry实例。
     */
    constructor(geometry = null)
    {
        super();
        /**
         * 在缓冲区内包括顶点位置，面索引，法线，颜色，UVs和自定义属性，
         * 从而降低了将所有这些数据传递给GPU的成本。
         * 可以在多个Mesh或Graphics对象之间共享。
         * @member {PIXI.GraphicsGeometry}
         * @readonly
         */
        this.geometry = geometry || new GraphicsGeometry();

        this.geometry.refCount++;

        /**
         * 表示处理几何图形并在GPU上运行的顶点和片段着色器。
         * 可以在多个Graphics对象之间共享。
         * @member {PIXI.Shader}
         */
        this.shader = null;

        /**
         * 表示要渲染的图形所需的WebGL状态，不包括着色器和几何。 例如:
         * 混合模式，剔除，深度测试，渲染三角形的方向，背面等。
         * @member {PIXI.State}
         */
        this.state = State.for2d();

        /**
         * 当前填充样式
         *
         * @member {PIXI.FillStyle}
         * @protected
         */
        this._fillStyle = new FillStyle();

        /**
         * 当前线样式
         *
         * @member {PIXI.LineStyle}
         * @protected
         */
        this._lineStyle = new LineStyle();

        /**
         * 当前形状变换矩阵。
         *
         * @member {PIXI.Matrix}
         * @protected
         */
        this._matrix = null;

        /**
         * Current hole mode is enabled.
         *
         * @member {boolean}
         * @default false
         * @protected
         */
        this._holeMode = false;

        /**
         * 当前路径
         *
         * @member {PIXI.Polygon}
         * @protected
         */
        this.currentPath = null;

        /**
         * 当cacheAsBitmap设置为true时，图形对象将被渲染为精灵。
         * 如果您的图形元素不经常更改，这将很有用，因为它将加快对象的渲染速度，以换取占用的纹理内存。
         * 如果您需要对图形对象进行抗锯齿处理，这也很有用，因为它将使用画布进行渲染。
         * 如果您不断重绘图形元素，则不建议这样做。
         *
         * @name cacheAsBitmap
         * @member {boolean}
         * @memberof PIXI.Graphics#
         * @default false
         */

        /**
         * 批处理集合！这些可以由渲染器批处理系统绘制。
         *
         * @protected
         * @member {object[]}
         */
        this.batches = [];

        /**
         * 更新dirty以限制批处理的计算色度。
         *
         * @protected
         * @member {number}
         * @default -1
         */
        this.batchTint = -1;

        /**
         * 对象顶点数据的副本。
         *
         * @protected
         * @member {Float32Array}
         */
        this.vertexData = null;

        this._transformID = -1;
        this.batchDirty = -1;

        /**
         * 批处理渲染器插件
         *
         * @member {string}
         * @default 'batch'
         */
        this.pluginName = 'batch';

        // Set default
        this.tint = 0xFFFFFF;
        this.blendMode = BLEND_MODES.NORMAL;
    }

    /**
     * 创建一个具有与此值相同值的新Graphics对象。
     * 请注意，仅克隆对象的属性，而不克隆其变换（位置，比例等）
     *
     * @return {PIXI.Graphics} 图形对象的克隆
     */
    clone()
    {
        this.finishPoly();

        return new Graphics(this.geometry);
    }

    /**
     * 要应用于图形形状的混合模式。使用`PIXI.BLEND_MODES.NORMAL`，可以重置混合模式。
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
     * 色彩应用于图形形状。这是一个十六进制值。值为0xFFFFFF时，将消除任何色调效果。
     *
     * @member {number}
     * @default 0xFFFFFF
     */
    get tint()
    {
        return this._tint;
    }
    set tint(value)
    {
        this._tint = value;
    }

    /**
     * 当前的填充样式。
     *
     * @member {PIXI.FillStyle}
     * @readonly
     */
    get fill()
    {
        return this._fillStyle;
    }

    /**
     * 当前的线样式。
     *
     * @member {PIXI.LineStyle}
     * @readonly
     */
    get line()
    {
        return this._lineStyle;
    }

    /**
     * 指定用于随后调用Graphics方法的线样式，例如：`lineTo()`方法 或 `drawCircle()`方法
     *
     * @method PIXI.Graphics#lineStyle
     * @param {number} [width=0] - 画线的宽度，将更新对象存储的样式
     * @param {number} [color=0x0] - 绘制线条的颜色，将更新对象存储的样式
     * @param {number} [alpha=1] - 绘制线条的Alpha，将更新对象存储的样式
     * @param {number} [alignment=0.5] - 绘制线的对齐方式（0 = 内部，0.5 = 居中，1 = 外部）
     * @param {boolean} [native=false] - 如果为true，则将使用LINES来代替TRIANGLE_STRIP绘制线条
     * @return {PIXI.Graphics} 此Graphics对象。可以使用链式方法调用
     */
    /**
     * 指定用于随后调用Graphics方法的线样式，例如：`lineTo()`方法 或 `drawCircle()`方法
     *
     * @param {object} [options] - 线样式选项
     * @param {number} [options.width=0] - 画线的宽度，将更新对象存储的样式
     * @param {number} [options.color=0x0] - 绘制线条的颜色，将更新对象存储的样式
     * @param {number} [options.alpha=1] - 绘制线条的Alpha，将更新对象存储的样式
     * @param {number} [options.alignment=0.5] - 绘制线的对齐方式（0 = 内部，0.5 = 居中，1 = 外部）
     * @param {boolean} [options.native=false] - 如果为true，则将使用LINES来代替TRIANGLE_STRIP绘制线条
     * @return {PIXI.Graphics} 此Graphics对象。可以使用链式方法调用
     */
    lineStyle(options)
    {
        // Support non-object params: (width, color, alpha, alignment, native)
        if (typeof options === 'number')
        {
            const args = arguments;

            options = {
                width: args[0] || 0,
                color: args[1] || 0x0,
                alpha: args[2] !== undefined ? args[2] : 1,
                alignment: args[3] !== undefined ? args[3] : 0.5,
                native: !!args[4],
            };
        }

        return this.lineTextureStyle(options);
    }

    /**
     * 类似于线条样式，并且支持线条填充纹理。
     *
     * @param {object} [options] - 设置线条样式的选项集合。
     * @param {number} [options.width=0] - 画线的宽度，将更新对象存储的样式
     * @param {PIXI.Texture} [options.texture=PIXI.Texture.WHITE] - 使用的纹理
     * @param {number} [options.color=0x0] - 绘制线条的颜色，将更新对象存储的样式。
     *  如果存在纹理，则默认为0xFFFFFF。
     * @param {number} [options.alpha=1] - 要绘制的线的alpha，将更新存储的对象样式
     * @param {PIXI.Matrix} [options.matrix=null] 纹理矩阵转换纹理
     * @param {number} [options.alignment=0.5] - 绘制线的对齐方式（0 = 内部，0.5 = 居中，1 = 外部）
     * @param {boolean} [options.native=false] - 如果为true，则将使用LINES来代替TRIANGLE_STRIP绘制线条
     * @return {PIXI.Graphics} 此Graphics对象。可以使用链式方法调用
     */
    lineTextureStyle(options)
    {
        // backward compatibility with params: (width, texture,
        // color, alpha, matrix, alignment, native)
        if (typeof options === 'number')
        {
            deprecation('v5.2.0', 'Please use object-based options for Graphics#lineTextureStyle');

            const [width, texture, color, alpha, matrix, alignment, native] = arguments;

            options = { width, texture, color, alpha, matrix, alignment, native };

            // Remove undefined keys
            Object.keys(options).forEach((key) => options[key] === undefined && delete options[key]);
        }

        // Apply defaults
        options = Object.assign({
            width: 0,
            texture: Texture.WHITE,
            color: (options && options.texture) ? 0xFFFFFF : 0x0,
            alpha: 1,
            matrix: null,
            alignment: 0.5,
            native: false,
        }, options);

        if (this.currentPath)
        {
            this.startPoly();
        }

        const visible = options.width > 0 && options.alpha > 0;

        if (!visible)
        {
            this._lineStyle.reset();
        }
        else
        {
            if (options.matrix)
            {
                options.matrix = options.matrix.clone();
                options.matrix.invert();
            }

            Object.assign(this._lineStyle, { visible }, options);
        }

        return this;
    }

    /**
     * 在内部开启多边形对象
     * @protected
     */
    startPoly()
    {
        if (this.currentPath)
        {
            const points = this.currentPath.points;
            const len = this.currentPath.points.length;

            if (len > 2)
            {
                this.drawShape(this.currentPath);
                this.currentPath = new Polygon();
                this.currentPath.closeStroke = false;
                this.currentPath.points.push(points[len - 2], points[len - 1]);
            }
        }
        else
        {
            this.currentPath = new Polygon();
            this.currentPath.closeStroke = false;
        }
    }

    /**
     * 完成多边形对象。
     * @protected
     */
    finishPoly()
    {
        if (this.currentPath)
        {
            if (this.currentPath.points.length > 2)
            {
                this.drawShape(this.currentPath);
                this.currentPath = null;
            }
            else
            {
                this.currentPath.points.length = 0;
            }
        }
    }

    /**
     * 将当前图形位置移动到x,y。
     *
     * @param {number} x - 要移动到的X坐标
     * @param {number} y - 要移动到的Y坐标
     * @return {PIXI.Graphics} 此Graphics对象。可以使用链式方法调用
     */
    moveTo(x, y)
    {
        this.startPoly();
        this.currentPath.points[0] = x;
        this.currentPath.points[1] = y;

        return this;
    }

    /**
     * 使用当前线样式从当前绘图位置到 (x, y )绘制一条线；
     * 然后将当前图形位置设置为 (x, y)。
     *
     * @param {number} x - 要绘制到的X坐标
     * @param {number} y - 要绘制到的Y坐标
     * @return {PIXI.Graphics} 此Graphics对象。可以使用链式方法调用
     */
    lineTo(x, y)
    {
        if (!this.currentPath)
        {
            this.moveTo(0, 0);
        }

        // remove duplicates..
        const points = this.currentPath.points;
        const fromX = points[points.length - 2];
        const fromY = points[points.length - 1];

        if (fromX !== x || fromY !== y)
        {
            points.push(x, y);
        }

        return this;
    }

    /**
     * 初始化曲线
     *
     * @protected
     * @param {number} [x=0]
     * @param {number} [y=0]
     */
    _initCurve(x = 0, y = 0)
    {
        if (this.currentPath)
        {
            if (this.currentPath.points.length === 0)
            {
                this.currentPath.points = [x, y];
            }
        }
        else
        {
            this.moveTo(x, y);
        }
    }

    /**
     * 计算二次贝塞尔曲线的点，然后绘制它。
     * 基于: https://stackoverflow.com/questions/785097/how-do-i-implement-a-bezier-curve-in-c
     *
     * @param {number} cpX - 控制点x
     * @param {number} cpY - 控制点y
     * @param {number} toX - 目的点x
     * @param {number} toY - 目的点y
     * @return {PIXI.Graphics} 此Graphics对象。可以使用链式方法调用
     */
    quadraticCurveTo(cpX, cpY, toX, toY)
    {
        this._initCurve();

        const points = this.currentPath.points;

        if (points.length === 0)
        {
            this.moveTo(0, 0);
        }

        QuadraticUtils.curveTo(cpX, cpY, toX, toY, points);

        return this;
    }

    /**
     * 计算贝塞尔曲线的点，然后绘制它。
     *
     * @param {number} cpX - 控制点x
     * @param {number} cpY - 控制点y
     * @param {number} cpX2 - 第二控制点x
     * @param {number} cpY2 - 第二控制点y
     * @param {number} toX - 目的点x
     * @param {number} toY - 目的点y
     * @return {PIXI.Graphics} 此Graphics对象。可以使用链式方法调用
     */
    bezierCurveTo(cpX, cpY, cpX2, cpY2, toX, toY)
    {
        this._initCurve();

        BezierUtils.curveTo(cpX, cpY, cpX2, cpY2, toX, toY, this.currentPath.points);

        return this;
    }

    /**
     * arcTo()方法在画布上的两个切线之间创建弧/曲线。
     *
     * 来自 https://code.google.com/p/fxcanvas/ 的 "borrowed" - 感谢 google!
     *
     * @param {number} x1 - 圆弧的第一个切点的x坐标
     * @param {number} y1 - 圆弧的第一个切点的y坐标
     * @param {number} x2 - 圆弧末端的x坐标
     * @param {number} y2 - 圆弧末端的y坐标
     * @param {number} radius - 圆弧半径
     * @return {PIXI.Graphics} 此Graphics对象。可以使用链式方法调用
     */
    arcTo(x1, y1, x2, y2, radius)
    {
        this._initCurve(x1, y1);

        const points = this.currentPath.points;

        const result = ArcUtils.curveTo(x1, y1, x2, y2, radius, points);

        if (result)
        {
            const { cx, cy, radius, startAngle, endAngle, anticlockwise } = result;

            this.arc(cx, cy, radius, startAngle, endAngle, anticlockwise);
        }

        return this;
    }

    /**
     * 圆弧方法创建圆弧/曲线（用于创建圆或圆的一部分）。
     *
     * @param {number} cx - 圆心的x坐标
     * @param {number} cy - 圆心的y坐标
     * @param {number} radius - 圆的半径
     * @param {number} startAngle - 起始角度，以弧度为单位（0是圆弧的3点位置）
     * @param {number} endAngle - 终止角度，以弧度为单位
     * @param {boolean} [anticlockwise=false] - 指定图形是逆时针还是顺时针。
     *  `false` 是默认值，表示顺时针，而`true`表示逆时针。
     * @return {PIXI.Graphics} 此Graphics对象。可以使用链式方法调用
     */
    arc(cx, cy, radius, startAngle, endAngle, anticlockwise = false)
    {
        if (startAngle === endAngle)
        {
            return this;
        }

        if (!anticlockwise && endAngle <= startAngle)
        {
            endAngle += PI_2;
        }
        else if (anticlockwise && startAngle <= endAngle)
        {
            startAngle += PI_2;
        }

        const sweep = endAngle - startAngle;

        if (sweep === 0)
        {
            return this;
        }

        const startX = cx + (Math.cos(startAngle) * radius);
        const startY = cy + (Math.sin(startAngle) * radius);
        const eps = this.geometry.closePointEps;

        // If the currentPath exists, take its points. Otherwise call `moveTo` to start a path.
        let points = this.currentPath ? this.currentPath.points : null;

        if (points)
        {
            // TODO: make a better fix.

            // We check how far our start is from the last existing point
            const xDiff = Math.abs(points[points.length - 2] - startX);
            const yDiff = Math.abs(points[points.length - 1] - startY);

            if (xDiff < eps && yDiff < eps)
            {
                // If the point is very close, we don't add it, since this would lead to artifacts
                // during tessellation due to floating point imprecision.
            }
            else
            {
                points.push(startX, startY);
            }
        }
        else
        {
            this.moveTo(startX, startY);
            points = this.currentPath.points;
        }

        ArcUtils.arc(startX, startY, cx, cy, radius, startAngle, endAngle, anticlockwise, points);

        return this;
    }

    /**
     * 指定一个简单的单色填充，随后调用其他Graphics方法
     * (such as lineTo() or drawCircle()) use when drawing.
     * （例如：`lineTo()`或`drawCircle()`）在绘制时使用。
     *
     * @param {number} [color=0] - 填充的颜色
     * @param {number} [alpha=1] - 填充的Alpha
     * @return {PIXI.Graphics} 此Graphics对象。可以使用链式方法调用
     */
    beginFill(color = 0, alpha = 1)
    {
        return this.beginTextureFill({ texture: Texture.WHITE, color, alpha });
    }

    /**
     * 开始纹理填充
     *
     * @param {object} [options] - Object object.
     * @param {PIXI.Texture} [options.texture=PIXI.Texture.WHITE] - 填充纹理
     * @param {number} [options.color=0xffffff] - 填充纹理的背景
     * @param {number} [options.alpha=1] - 填充Alpha
     * @param {PIXI.Matrix} [options.matrix=null] - 变换矩阵
     * @return {PIXI.Graphics} 此Graphics对象。可以使用链式方法调用
     */
    beginTextureFill(options)
    {
        // backward compatibility with params: (texture, color, alpha, matrix)
        if (options instanceof Texture)
        {
            deprecation('v5.2.0', 'Please use object-based options for Graphics#beginTextureFill');

            const [texture, color, alpha, matrix] = arguments;

            options = { texture, color, alpha, matrix };

            // Remove undefined keys
            Object.keys(options).forEach((key) => options[key] === undefined && delete options[key]);
        }

        // Apply defaults
        options = Object.assign({
            texture: Texture.WHITE,
            color: 0xFFFFFF,
            alpha: 1,
            matrix: null,
        }, options);

        if (this.currentPath)
        {
            this.startPoly();
        }

        const visible = options.alpha > 0;

        if (!visible)
        {
            this._fillStyle.reset();
        }
        else
        {
            if (options.matrix)
            {
                options.matrix = options.matrix.clone();
                options.matrix.invert();
            }

            Object.assign(this._fillStyle, { visible }, options);
        }

        return this;
    }

    /**
     * 对自上一次调用beginFill()方法以来添加的线条和形状应用填充。
     *
     * @return {PIXI.Graphics} 此Graphics对象。可以使用链式方法调用
     */
    endFill()
    {
        this.finishPoly();

        this._fillStyle.reset();

        return this;
    }

    /**
     * 绘制一个矩形。
     *
     * @param {number} x - 矩形左上角的X坐标
     * @param {number} y - 矩形左上角的Y坐标
     * @param {number} width - 矩形的宽度
     * @param {number} height - 矩形的高度
     * @return {PIXI.Graphics} 此Graphics对象。可以使用链式方法调用
     */
    drawRect(x, y, width, height)
    {
        return this.drawShape(new Rectangle(x, y, width, height));
    }

    /**
     * 绘制一个带有圆角/斜角的矩形。
     *
     * @param {number} x - 矩形左上角的X坐标
     * @param {number} y - 矩形左上角的Y坐标
     * @param {number} width - 矩形的宽度
     * @param {number} height - 矩形的高度
     * @param {number} radius - 矩形角度的半径
     * @return {PIXI.Graphics} 此Graphics对象。可以使用链式方法调用
     */
    drawRoundedRect(x, y, width, height, radius)
    {
        return this.drawShape(new RoundedRectangle(x, y, width, height, radius));
    }

    /**
     * 绘制一个圆。
     *
     * @param {number} x - 圆心的X坐标
     * @param {number} y - 圆心的Y坐标
     * @param {number} radius - 圆的半径
     * @return {PIXI.Graphics} 此Graphics对象。可以使用链式方法调用
     */
    drawCircle(x, y, radius)
    {
        return this.drawShape(new Circle(x, y, radius));
    }

    /**
     * 绘制一个椭圆。
     *
     * @param {number} x - 椭圆中心的X坐标
     * @param {number} y - 椭圆中心的Y坐标
     * @param {number} width - 椭圆的半宽
     * @param {number} height - 椭圆的半高
     * @return {PIXI.Graphics} 此Graphics对象。可以使用链式方法调用
     */
    drawEllipse(x, y, width, height)
    {
        return this.drawShape(new Ellipse(x, y, width, height));
    }

    /**
     * 使用指定的路径绘制多边形。
     *
     * @param {number[]|PIXI.Point[]|PIXI.Polygon} path - 用于构造多边形的路径数据。
     * @return {PIXI.Graphics} 此Graphics对象。可以使用链式方法调用
     */
    drawPolygon(path)
    {
        // prevents an argument assignment deopt
        // see section 3.1: https://github.com/petkaantonov/bluebird/wiki/Optimization-killers#3-managing-arguments
        let points = path;

        let closeStroke = true;// !!this._fillStyle;

        // check if data has points..
        if (points.points)
        {
            closeStroke = points.closeStroke;
            points = points.points;
        }

        if (!Array.isArray(points))
        {
            // prevents an argument leak deopt
            // see section 3.2: https://github.com/petkaantonov/bluebird/wiki/Optimization-killers#3-managing-arguments
            points = new Array(arguments.length);

            for (let i = 0; i < points.length; ++i)
            {
                points[i] = arguments[i]; // eslint-disable-line prefer-rest-params
            }
        }

        const shape = new Polygon(points);

        shape.closeStroke = closeStroke;

        this.drawShape(shape);

        return this;
    }

    /**
     * 绘制任意形状。
     *
     * @param {PIXI.Circle|PIXI.Ellipse|PIXI.Polygon|PIXI.Rectangle|PIXI.RoundedRectangle} shape - 绘制形状
     * @return {PIXI.Graphics} 此Graphics对象。可以使用链式方法调用
     */
    drawShape(shape)
    {
        if (!this._holeMode)
        {
            this.geometry.drawShape(
                shape,
                this._fillStyle.clone(),
                this._lineStyle.clone(),
                this._matrix,
            );
        }
        else
        {
            this.geometry.drawHole(shape, this._matrix);
        }

        return this;
    }

    /**
     * 用任意数量的点画一个星形。
     *
     * @param {number} x - 星的中心X位置
     * @param {number} y - 星的中心Y位置
     * @param {number} points - 星星的点数必须 > 1
     * @param {number} radius - 星星的外半径
     * @param {number} [innerRadius] - 点之间的内半径，默认为`radius`的一半
     * @param {number} [rotation=0] - 星星自转的弧度，其中0为垂直
     * @return {PIXI.Graphics} 此Graphics对象。可以使用链式方法调用
     */
    drawStar(x, y, points, radius, innerRadius, rotation = 0)
    {
        return this.drawPolygon(new Star(x, y, points, radius, innerRadius, rotation));
    }

    /**
     * 清除绘制到此Graphics对象的图形，并重置填充和线条样式设置。
     *
     * @return {PIXI.Graphics} 此Graphics对象。可以使用链式方法调用
     */
    clear()
    {
        this.geometry.clear();
        this._lineStyle.reset();
        this._fillStyle.reset();

        this._matrix = null;
        this._holeMode = false;
        this.currentPath = null;

        return this;
    }

    /**
     * 如果图形由一个矩形组成，则为true，因此可以像Sprite一样绘制并用gl.scissor遮罩。
     *
     * @returns {boolean} 如果只有一个矩形，则为true。
     */
    isFastRect()
    {
        return this.geometry.graphicsData.length === 1
        && this.geometry.graphicsData[0].shape.type === SHAPES.RECT
        && !this.geometry.graphicsData[0].lineWidth;
    }

    /**
     * 使用WebGL渲染器渲染对象
     *
     * @protected
     * @param {PIXI.Renderer} renderer - 渲染器
     */
    _render(renderer)
    {
        this.finishPoly();

        const geometry = this.geometry;

        // batch part..
        // batch it!
        geometry.updateBatches();

        if (geometry.batchable)
        {
            if (this.batchDirty !== geometry.batchDirty)
            {
                this._populateBatches();
            }

            this._renderBatched(renderer);
        }
        else
        {
            // no batching...
            renderer.batch.flush();

            this._renderDirect(renderer);
        }
    }

    /**
     * 填充要渲染的批处理
     *
     * @protected
     */
    _populateBatches()
    {
        const geometry = this.geometry;
        const blendMode = this.blendMode;

        this.batches = [];
        this.batchTint = -1;
        this._transformID = -1;
        this.batchDirty = geometry.batchDirty;

        this.vertexData = new Float32Array(geometry.points);

        for (let i = 0, l = geometry.batches.length; i < l; i++)
        {
            const gI = geometry.batches[i];
            const color = gI.style.color;
            const vertexData = new Float32Array(this.vertexData.buffer,
                gI.attribStart * 4 * 2,
                gI.attribSize * 2);

            const uvs = new Float32Array(geometry.uvsFloat32.buffer,
                gI.attribStart * 4 * 2,
                gI.attribSize * 2);

            const indices = new Uint16Array(geometry.indicesUint16.buffer,
                gI.start * 2,
                gI.size);

            const batch = {
                vertexData,
                blendMode,
                indices,
                uvs,
                _batchRGB: hex2rgb(color),
                _tintRGB: color,
                _texture: gI.style.texture,
                alpha: gI.style.alpha,
                worldAlpha: 1 };

            this.batches[i] = batch;
        }
    }

    /**
     * 使用BathedRenderer插件渲染批处理
     *
     * @protected
     * @param {PIXI.Renderer} renderer - 渲染器
     */
    _renderBatched(renderer)
    {
        if (!this.batches.length)
        {
            return;
        }

        renderer.batch.setObjectRenderer(renderer.plugins[this.pluginName]);

        this.calculateVertices();
        this.calculateTints();

        for (let i = 0, l = this.batches.length; i < l; i++)
        {
            const batch = this.batches[i];

            batch.worldAlpha = this.worldAlpha * batch.alpha;

            renderer.plugins[this.pluginName].render(batch);
        }
    }

    /**
     * 直接渲染图形
     *
     * @protected
     * @param {PIXI.Renderer} renderer - 渲染器
     */
    _renderDirect(renderer)
    {
        const shader = this._resolveDirectShader(renderer);

        const geometry = this.geometry;
        const tint = this.tint;
        const worldAlpha = this.worldAlpha;
        const uniforms = shader.uniforms;
        const drawCalls = geometry.drawCalls;

        // lets set the transfomr
        uniforms.translationMatrix = this.transform.worldTransform;

        // and then lets set the tint..
        uniforms.tint[0] = (((tint >> 16) & 0xFF) / 255) * worldAlpha;
        uniforms.tint[1] = (((tint >> 8) & 0xFF) / 255) * worldAlpha;
        uniforms.tint[2] = ((tint & 0xFF) / 255) * worldAlpha;
        uniforms.tint[3] = worldAlpha;

        // the first draw call, we can set the uniforms of the shader directly here.

        // this means that we can tack advantage of the sync function of pixi!
        // bind and sync uniforms..
        // there is a way to optimise this..
        renderer.shader.bind(shader);
        renderer.geometry.bind(geometry, shader);

        // set state..
        renderer.state.set(this.state);

        // then render the rest of them...
        for (let i = 0, l = drawCalls.length; i < l; i++)
        {
            this._renderDrawCallDirect(renderer, geometry.drawCalls[i]);
        }
    }

    /**
     * 渲染指定的DrawCall
     *
     * @param {PIXI.Renderer} renderer
     * @param {PIXI.BatchDrawCall} drawCall
     */
    _renderDrawCallDirect(renderer, drawCall)
    {
        const { textures, type, size, start } = drawCall;
        const groupTextureCount = textures.count;

        for (let j = 0; j < groupTextureCount; j++)
        {
            renderer.texture.bind(textures.elements[j], j);
        }

        renderer.geometry.draw(type, size, start);
    }

    /**
     * 解析着色器以直接渲染
     *
     * @protected
     * @param {PIXI.Renderer} renderer - The renderer
     */
    _resolveDirectShader(renderer)
    {
        let shader = this.shader;

        const pluginName = this.pluginName;

        if (!shader)
        {
            // if there is no shader here, we can use the default shader.
            // and that only gets created if we actually need it..
            // but may be more than one plugins for graphics
            if (!DEFAULT_SHADERS[pluginName])
            {
                const sampleValues = new Int32Array(16);

                for (let i = 0; i < 16; i++)
                {
                    sampleValues[i] = i;
                }

                const uniforms = {
                    tint: new Float32Array([1, 1, 1, 1]),
                    translationMatrix: new Matrix(),
                    default: UniformGroup.from({ uSamplers: sampleValues }, true),
                };

                const program = renderer.plugins[pluginName]._shader.program;

                DEFAULT_SHADERS[pluginName] = new Shader(program, uniforms);
            }

            shader = DEFAULT_SHADERS[pluginName];
        }

        return shader;
    }

    /**
     * 以矩形对象的形式检索图形形状的边界
     *
     * @protected
     */
    _calculateBounds()
    {
        this.finishPoly();

        const geometry = this.geometry;

        // skipping when graphics is empty, like a container
        if (!geometry.graphicsData.length)
        {
            return;
        }

        const { minX, minY, maxX, maxY } = geometry.bounds;

        this._bounds.addFrame(this.transform, minX, minY, maxX, maxY);
    }

    /**
     * 测试点是否在此图形对象内
     *
     * @param {PIXI.Point} point - the point to test
     * @return {boolean} the result of the test
     */
    containsPoint(point)
    {
        this.worldTransform.applyInverse(point, Graphics._TEMP_POINT);

        return this.geometry.containsPoint(Graphics._TEMP_POINT);
    }

    /**
     * 通过对使用图形色调的批处理应用色调来重新计算色调。
     * @protected
     */
    calculateTints()
    {
        if (this.batchTint !== this.tint)
        {
            this.batchTint = this.tint;

            const tintRGB = hex2rgb(this.tint, temp);

            for (let i = 0; i < this.batches.length; i++)
            {
                const batch = this.batches[i];

                const batchTint = batch._batchRGB;

                const r = (tintRGB[0] * batchTint[0]) * 255;
                const g = (tintRGB[1] * batchTint[1]) * 255;
                const b = (tintRGB[2] * batchTint[2]) * 255;

                // TODO Ivan, can this be done in one go?
                const color = (r << 16) + (g << 8) + (b | 0);

                batch._tintRGB = (color >> 16)
                        + (color & 0xff00)
                        + ((color & 0xff) << 16);
            }
        }
    }

    /**
     * 如果存在变换更新或几何形状的更改，请重新计算顶点。
     * @protected
     */
    calculateVertices()
    {
        if (this._transformID === this.transform._worldID)
        {
            return;
        }

        this._transformID = this.transform._worldID;

        const wt = this.transform.worldTransform;
        const a = wt.a;
        const b = wt.b;
        const c = wt.c;
        const d = wt.d;
        const tx = wt.tx;
        const ty = wt.ty;

        const data = this.geometry.points;// batch.vertexDataOriginal;
        const vertexData = this.vertexData;

        let count = 0;

        for (let i = 0; i < data.length; i += 2)
        {
            const x = data[i];
            const y = data[i + 1];

            vertexData[count++] = (a * x) + (c * y) + tx;
            vertexData[count++] = (d * y) + (b * x) + ty;
        }
    }

    /**
     * 关闭当前路径。
     *
     * @return {PIXI.Graphics} 返回自身。
     */
    closePath()
    {
        const currentPath = this.currentPath;

        if (currentPath)
        {
            // we don't need to add extra point in the end because buildLine will take care of that
            currentPath.closeStroke = true;
        }

        return this;
    }

    /**
     * 将矩阵应用于位置数据。
     *
     * @param {PIXI.Matrix} matrix - 用于变换当前形状的矩阵。
     * @return {PIXI.Graphics} 返回自身。
     */
    setMatrix(matrix)
    {
        this._matrix = matrix;

        return this;
    }

    /**
     * 开始向最后的绘制形状添加孔
     * 重要提示：孔必须完全在形状内才能起作用
     * 如果孔重叠，也会产生怪异！
     * 在CanvasRenderer中，椭圆，圆，矩形和圆形矩形不能是孔或孔的宿主，
     * 如果您依赖pixi-legacy捆绑包，请使用`moveTo`、`lineTo`、`quadraticCurveTo`。
     * @return {PIXI.Graphics} Returns itself.
     */
    beginHole()
    {
        this.finishPoly();
        this._holeMode = true;

        return this;
    }

    /**
     * 结束向最后的绘制形状添加孔
     * @return {PIXI.Graphics} Returns itself.
     */
    endHole()
    {
        this.finishPoly();
        this._holeMode = false;

        return this;
    }

    /**
     * 销毁Graphics对象。
     *
     * @param {object|boolean} [options] - Options parameter. A boolean will act as if all
     *  options have been set to that value
     * @param {boolean} [options.children=false] - if set to true, all the children will have
     *  their destroy method called as well. 'options' will be passed on to those calls.
     * @param {boolean} [options.texture=false] - Only used for child Sprites if options.children is set to true
     *  Should it destroy the texture of the child sprite
     * @param {boolean} [options.baseTexture=false] - Only used for child Sprites if options.children is set to true
     *  Should it destroy the base texture of the child sprite
     */
    destroy(options)
    {
        super.destroy(options);

        this.geometry.refCount--;
        if (this.geometry.refCount === 0)
        {
            this.geometry.dispose();
        }

        this._matrix = null;
        this.currentPath = null;
        this._lineStyle.destroy();
        this._lineStyle = null;
        this._fillStyle.destroy();
        this._fillStyle = null;
        this.geometry = null;
        this.shader = null;
        this.vertexData = null;
        this.batches.length = 0;
        this.batches = null;

        super.destroy(options);
    }
}

/**
 * 用于containsPoint的临时点
 *
 * @static
 * @private
 * @member {PIXI.Point}
 */
Graphics._TEMP_POINT = new Point();
