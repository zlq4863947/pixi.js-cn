/**
 * WebGL的不同类型的环境。
 *
 * @static
 * @memberof PIXI
 * @name ENV
 * @enum {number}
 * @property {number} WEBGL_LEGACY - 用于较旧的v1 WebGL设备。
 * PixiJS将致力于确保与较旧/较不先进的设备兼容。如果您遇到无法解释的闪烁，请选择此环境。
 * @property {number} WEBGL - WebGL版本1
 * @property {number} WEBGL2 - WebGL版本2
 */
export enum ENV {
    WEBGL_LEGACY,
    WEBGL,
    WEBGL2,
}

/**
 * 标识渲染器类型的常量
 *
 * @static
 * @memberof PIXI
 * @name RENDERER_TYPE
 * @enum {number}
 * @property {number} UNKNOWN - 未知渲染器类型
 * @property {number} WEBGL - WebGL渲染器类型
 * @property {number} CANVAS - Canvas渲染器类型
 */
export enum RENDERER_TYPE {
    UNKNOWN,
    WEBGL,
    CANVAS,
}

/**
 * PIXI支持各种混合模式
 *
 * IMPORTANT - WebGL渲染器仅支持NORMAL，ADD，MULTIPLY和SCREEN混合模式。
 * 其他都会像NORMAL一样默默地进行。
 *
 * @memberof PIXI
 * @name BLEND_MODES
 * @enum {number}
 * @property {number} NORMAL 正常
 * @property {number} ADD 线性减淡，添加
 * @property {number} MULTIPLY 正片叠底
 * @property {number} SCREEN 滤色
 * @property {number} OVERLAY 叠加
 * @property {number} DARKEN 变暗
 * @property {number} LIGHTEN 变亮
 * @property {number} COLOR_DODGE 颜色减淡
 * @property {number} COLOR_BURN 颜色加深
 * @property {number} HARD_LIGHT 强光
 * @property {number} SOFT_LIGHT 柔光
 * @property {number} DIFFERENCE 差值
 * @property {number} EXCLUSION 排除
 * @property {number} HUE 色相
 * @property {number} SATURATION 饱和度
 * @property {number} COLOR 颜色
 * @property {number} LUMINOSITY 明度
 * @property {number} NORMAL_NPM
 * @property {number} ADD_NPM
 * @property {number} SCREEN_NPM
 * @property {number} NONE
 * @property {number} SRC_IN
 * @property {number} SRC_OUT
 * @property {number} SRC_ATOP
 * @property {number} DST_OVER
 * @property {number} DST_IN
 * @property {number} DST_OUT
 * @property {number} DST_ATOP
 * @property {number} SUBTRACT
 * @property {number} SRC_OVER
 * @property {number} ERASE
 * @property {number} XOR
 */
export enum BLEND_MODES {
    NORMAL = 0,
    ADD = 1,
    MULTIPLY = 2,
    SCREEN = 3,
    OVERLAY = 4,
    DARKEN = 5,
    LIGHTEN = 6,
    COLOR_DODGE = 7,
    COLOR_BURN = 8,
    HARD_LIGHT = 9,
    SOFT_LIGHT = 10,
    DIFFERENCE = 11,
    EXCLUSION = 12,
    HUE = 13,
    SATURATION = 14,
    COLOR = 15,
    LUMINOSITY = 16,
    NORMAL_NPM = 17,
    ADD_NPM = 18,
    SCREEN_NPM = 19,
    NONE = 20,

    SRC_OVER = 0,
    SRC_IN = 21,
    SRC_OUT = 22,
    SRC_ATOP = 23,
    DST_OVER = 24,
    DST_IN = 25,
    DST_OUT = 26,
    DST_ATOP = 27,
    ERASE = 26,
    SUBTRACT = 28,
    XOR = 29,
}

/**
 * 各种webgl绘制模式。这些可用于指定在某些情况和渲染器下使用的GL drawMode。
 *
 * @memberof PIXI
 * @static
 * @name DRAW_MODES
 * @enum {number}
 * @property {number} POINTS
 * @property {number} LINES
 * @property {number} LINE_LOOP
 * @property {number} LINE_STRIP
 * @property {number} TRIANGLES
 * @property {number} TRIANGLE_STRIP
 * @property {number} TRIANGLE_FAN
 */
export enum DRAW_MODES {
    POINTS,
    LINES,
    LINE_LOOP,
    LINE_STRIP,
    TRIANGLES,
    TRIANGLE_STRIP,
    TRIANGLE_FAN,
}

/**
 * 各种GL纹理/资源格式。
 *
 * @memberof PIXI
 * @static
 * @name FORMATS
 * @enum {number}
 * @property {number} RGBA=6408
 * @property {number} RGB=6407
 * @property {number} ALPHA=6406
 * @property {number} LUMINANCE=6409
 * @property {number} LUMINANCE_ALPHA=6410
 * @property {number} DEPTH_COMPONENT=6402
 * @property {number} DEPTH_STENCIL=34041
 */
export enum FORMATS {
    RGBA = 6408,
    RGB = 6407,
    ALPHA = 6406,
    LUMINANCE = 6409,
    LUMINANCE_ALPHA = 6410,
    DEPTH_COMPONENT = 6402,
    DEPTH_STENCIL = 34041,
}

/**
 * 各种GL目标类型
 *
 * @memberof PIXI
 * @static
 * @name TARGETS
 * @enum {number}
 * @property {number} TEXTURE_2D=3553
 * @property {number} TEXTURE_CUBE_MAP=34067
 * @property {number} TEXTURE_2D_ARRAY=35866
 * @property {number} TEXTURE_CUBE_MAP_POSITIVE_X=34069
 * @property {number} TEXTURE_CUBE_MAP_NEGATIVE_X=34070
 * @property {number} TEXTURE_CUBE_MAP_POSITIVE_Y=34071
 * @property {number} TEXTURE_CUBE_MAP_NEGATIVE_Y=34072
 * @property {number} TEXTURE_CUBE_MAP_POSITIVE_Z=34073
 * @property {number} TEXTURE_CUBE_MAP_NEGATIVE_Z=34074
 */
export enum TARGETS {
    TEXTURE_2D = 3553,
    TEXTURE_CUBE_MAP = 34067,
    TEXTURE_2D_ARRAY = 35866,
    TEXTURE_CUBE_MAP_POSITIVE_X = 34069,
    TEXTURE_CUBE_MAP_NEGATIVE_X = 34070,
    TEXTURE_CUBE_MAP_POSITIVE_Y = 34071,
    TEXTURE_CUBE_MAP_NEGATIVE_Y = 34072,
    TEXTURE_CUBE_MAP_POSITIVE_Z = 34073,
    TEXTURE_CUBE_MAP_NEGATIVE_Z = 34074,
}

/**
 * 各种GL数据格式类型
 *
 * @memberof PIXI
 * @static
 * @name TYPES
 * @enum {number}
 * @property {number} UNSIGNED_BYTE=5121
 * @property {number} UNSIGNED_SHORT=5123
 * @property {number} UNSIGNED_SHORT_5_6_5=33635
 * @property {number} UNSIGNED_SHORT_4_4_4_4=32819
 * @property {number} UNSIGNED_SHORT_5_5_5_1=32820
 * @property {number} FLOAT=5126
 * @property {number} HALF_FLOAT=36193
 */
export enum TYPES {
    UNSIGNED_BYTE = 5121,
    UNSIGNED_SHORT = 5123,
    UNSIGNED_SHORT_5_6_5 = 33635,
    UNSIGNED_SHORT_4_4_4_4 = 32819,
    UNSIGNED_SHORT_5_5_5_1 = 32820,
    FLOAT = 5126,
    HALF_FLOAT = 36193,
}

/**
 * pixi支持的缩放模式。
 *
 * {@link PIXI.settings.SCALE_MODE} 缩放模式会影响以后操作的默认缩放模式。
 * 可以根据适用性将其重新分配为LINEAR或NEAREST。
 *
 * @memberof PIXI
 * @static
 * @name SCALE_MODES
 * @enum {number}
 * @property {number} LINEAR 平滑缩放
 * @property {number} NEAREST 像素缩放
 */
export enum SCALE_MODES {
    NEAREST,
    LINEAR,
}

/**
 * pixi支持的循环模式。
 *
 * {@link PIXI.settings.WRAP_MODE} 循环模式会影响以后操作的默认循环模式。
 * 可以根据适用性将其重新分配给CLAMP或REPEAT。
 * 如果纹理不是2的幂，则不管WebGL是否只能在纹理为po2时使用REPEAT，都将使用clamp。
 *
 * 此属性仅影响WebGL。
 *
 * @name WRAP_MODES
 * @memberof PIXI
 * @static
 * @enum {number}
 * @property {number} CLAMP - 强制贴图边界拉伸
 * @property {number} REPEAT - 贴图重复平铺
 * @property {number} MIRRORED_REPEAT - 平铺并重复镜像
 */
export enum WRAP_MODES {
    CLAMP = 33071,
    REPEAT = 10497,
    MIRRORED_REPEAT = 33648,
}

/**
 * pixi支持的Mipmap过滤模式。
 *
 * {@link PIXI.settings.MIPMAP_TEXTURES} 影响默认的纹理过滤。
 * 如果baseTexture的`mipmap`字段为'ON'，则会生成Mipmap。
 * 否则，为`POW2`和纹理尺寸为2的n次幂。
 * 由于平台限制，ON` 选项将像webgl-1的`POW2`一样工作。
 *
 * 此属性仅影响WebGL。
 *
 * @name MIPMAP_MODES
 * @memberof PIXI
 * @static
 * @enum {number}
 * @property {number} OFF - 没有mipmaps
 * @property {number} POW2 - 如果纹理维度为pow2，则生成mipmaps
 * @property {number} ON - 始终生成mipmaps
 */
export enum MIPMAP_MODES {
    OFF,
    POW2,
    ON,
}

/**
 * 如何使用预乘透明度处理纹理
 *
 * @name ALPHA_MODES
 * @memberof PIXI
 * @static
 * @enum {number}
 * @property {number} NO_PREMULTIPLIED_ALPHA - 来源未预乘。
 *  从类型化数组创建的压缩和数据纹理的选项。
 * @property {number} PREMULTIPLY_ON_UPLOAD - 来源未预乘，上传时未预乘。 默认选项，用于所有加载的图像。
 * @property {number} PREMULTIPLIED_ALPHA - 来源已被预乘示例：带有`_pma`后缀的骨骼图集。
 * @property {number} NPM - NO_PREMULTIPLIED_ALPHA的别名
 * @property {number} UNPACK - 默认选项，PREMULTIPLY_ON_UPLOAD的别名。
 * @property {number} PMA - PREMULTIPLIED_ALPHA的别名。
 */
export enum ALPHA_MODES {
    NPM = 0,
    UNPACK = 1,
    PMA = 2,
    NO_PREMULTIPLIED_ALPHA = 0,
    PREMULTIPLY_ON_UPLOAD = 1,
    PREMULTIPLY_ALPHA = 2,
}

/**
 * 如何清除滤镜中的renderTextures
 *
 * @name CLEAR_MODES
 * @memberof PIXI
 * @static
 * @enum {number}
 * @property {number} BLEND - 保留纹理中的信息，在上面混合
 * @property {number} CLEAR - 必须使用`gl.clear`操作
 * @property {number} BLIT - 清除或变白，取决于设备和程度
 * @property {number} NO - BLEND的别名，与早期版本中的`false`相同
 * @property {number} YES - CLEAR的别名，与早期版本中的`true`相同
 * @property {number} AUTO - BLIT的别名
 */
export enum CLEAR_MODES {
    NO = 0,
    YES = 1,
    AUTO = 2,
    BLEND = 0,
    CLEAR = 1,
    BLIT = 2,
}

/**
 * pixi支持的gc模式。
 *
 * PixiJS纹理的 {@link PIXI.settings.GC_MODE} 垃圾回收模式为 AUTO
 * 如果设置 GC_MODE, 渲染器会定时检查纹理使用情况。
 * 如果在指定的时间段内没有使用它们，它们将从GPU中删除。
 * 他们会在需要时再次上传。这是一个静默的幕后过程，应该确保GPU不会被填满。
 *
 * 方便移动设备使用!
 * 此属性仅影响WebGL。
 *
 * @name GC_MODES
 * @enum {number}
 * @static
 * @memberof PIXI
 * @property {number} AUTO - 垃圾收集将自动定期进行
 * @property {number} MANUAL - 垃圾收集将需要手动调用
 */
export enum GC_MODES {
    AUTO,
    MANUAL,
}

/**
 * 在着色器中指定浮点精度的常量。
 *
 * @name PRECISION
 * @memberof PIXI
 * @constant
 * @static
 * @enum {string}
 * @property {string} LOW='lowp'
 * @property {string} MEDIUM='mediump'
 * @property {string} HIGH='highp'
 */
export enum PRECISION {
    LOW = 'lowp',
    MEDIUM = 'mediump',
    HIGH = 'highp',
}

/**
 * 遮罩的实现常量。
 * 我们使用`type`后缀，因为它导致非常不同的行为
 *
 * @name MASK_TYPES
 * @memberof PIXI
 * @static
 * @enum {number}
 * @property {number} NONE - 忽略遮罩
 * @property {number} SCISSOR - 剪裁遮罩, 屏幕矩形, cheap
 * @property {number} STENCIL - 模板遮罩, 1-bit, 中等, 仅在渲染器支持模板时有效
 * @property {number} SPRITE - 使用SpriteMaskFilter的蒙版使用临时的RenderTexture
 */
export enum MASK_TYPES {
    NONE = 0,
    SCISSOR = 1,
    STENCIL = 2,
    SPRITE = 3,
}
