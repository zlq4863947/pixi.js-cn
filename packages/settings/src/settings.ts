import { isMobile } from './utils/isMobile';
import { maxRecommendedTextures } from './utils/maxRecommendedTextures';
import { canUploadSameBuffer } from './utils/canUploadSameBuffer';

export interface IRenderOptions {
    view: HTMLCanvasElement;
    antialias: boolean;
    forceFXAA: boolean;
    autoDensity: boolean;
    transparent: boolean;
    backgroundColor: number;
    clearBeforeRender: boolean;
    preserveDrawingBuffer: boolean;
    width: number;
    height: number;
    legacy: boolean;
}

export interface ISettings {
    MIPMAP_TEXTURES: number;
    ANISOTROPIC_LEVEL: number;
    RESOLUTION: number;
    FILTER_RESOLUTION: number;
    SPRITE_MAX_TEXTURES: number;
    SPRITE_BATCH_SIZE: number;
    RENDER_OPTIONS: IRenderOptions;
    GC_MODE: number;
    GC_MAX_IDLE: number;
    GC_MAX_CHECK_COUNT: number;
    WRAP_MODE: number;
    SCALE_MODE: number;
    PRECISION_VERTEX: string;
    PRECISION_FRAGMENT: string;
    CAN_UPLOAD_SAME_BUFFER: boolean;
    CREATE_IMAGE_BITMAP: boolean;
    ROUND_PIXELS: boolean;
    RETINA_PREFIX?: RegExp;
    FAIL_IF_MAJOR_PERFORMANCE_CAVEAT?: boolean;
    UPLOADS_PER_FRAME?: number;
    SORTABLE_CHILDREN?: boolean;
    PREFER_ENV?: number;
    STRICT_TEXTURE_CACHE?: boolean;
    MESH_CANVAS_PADDING?: number;
    TARGET_FPMS?: number;
}

/**
 * 用户自定义的全局变量，用于覆盖默认的PIXI设置，例如
 * 作为渲染器的默认分辨率、帧率、浮点精度等。
 * @example
 * // 使用本机窗口分辨率作为默认分辨率
 * // 渲染时支持高密度显示
 * PIXI.settings.RESOLUTION = window.devicePixelRatio;
 *
 * // 缩放时禁用插值，将使纹理像素化
 * PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
 * @namespace PIXI.settings
 */
export const settings: ISettings = {

    /**
     * 如果设置为true，WebGL将尝试在默认情况下将纹理设为mimpaped。
     * Mipmapping只有在上传的基础纹理具有二维能力时才会成功。
     *
     * @static
     * @name MIPMAP_TEXTURES
     * @memberof PIXI.settings
     * @type {PIXI.MIPMAP_MODES}
     * @default PIXI.MIPMAP_MODES.POW2
     */
    MIPMAP_TEXTURES: 1,

    /**
     * 纹理的默认各向异性过滤级别。
     * Usually from 0 to 16
     *
     * @static
     * @name ANISOTROPIC_LEVEL
     * @memberof PIXI.settings
     * @type {number}
     * @default 0
     */
    ANISOTROPIC_LEVEL: 0,

    /**
     * 渲染器的默认分辨率/设备像素比率。
     *
     * @static
     * @name RESOLUTION
     * @memberof PIXI.settings
     * @type {number}
     * @default 1
     */
    RESOLUTION: 1,

    /**
     * 默认滤镜分辨率。
     *
     * @static
     * @name FILTER_RESOLUTION
     * @memberof PIXI.settings
     * @type {number}
     * @default 1
     */
    FILTER_RESOLUTION: 1,

    /**
     * 此设备支持的最大纹理。
     *
     * @static
     * @name SPRITE_MAX_TEXTURES
     * @memberof PIXI.settings
     * @type {number}
     * @default 32
     */
    SPRITE_MAX_TEXTURES: maxRecommendedTextures(32),

    // TODO: maybe change to SPRITE.BATCH_SIZE: 2000
    // TODO: maybe add PARTICLE.BATCH_SIZE: 15000

    /**
     * 默认的精灵批处理大小。
     *
     * 默认的目标是平衡桌面和移动设备。
     *
     * @static
     * @name SPRITE_BATCH_SIZE
     * @memberof PIXI.settings
     * @type {number}
     * @default 4096
     */
    SPRITE_BATCH_SIZE: 4096,

    /**
     * 默认渲染选项，如果没有提供{@link PIXI.Renderer}
     * or {@link PIXI.CanvasRenderer}.
     *
     * @static
     * @name RENDER_OPTIONS
     * @memberof PIXI.settings
     * @type {object}
     * @property {HTMLCanvasElement} view=null
     * @property {number} resolution=1
     * @property {boolean} antialias=false
     * @property {boolean} forceFXAA=false
     * @property {boolean} autoDensity=false
     * @property {boolean} transparent=false
     * @property {number} backgroundColor=0x000000
     * @property {boolean} clearBeforeRender=true
     * @property {boolean} preserveDrawingBuffer=false
     * @property {number} width=800
     * @property {number} height=600
     * @property {boolean} legacy=false
     */
    RENDER_OPTIONS: {
        view: null,
        antialias: false,
        forceFXAA: false,
        autoDensity: false,
        transparent: false,
        backgroundColor: 0x000000,
        clearBeforeRender: true,
        preserveDrawingBuffer: false,
        width: 800,
        height: 600,
        legacy: false,
    },

    /**
     * 默认垃圾回收模式。
     *
     * @static
     * @name GC_MODE
     * @memberof PIXI.settings
     * @type {PIXI.GC_MODES}
     * @default PIXI.GC_MODES.AUTO
     */
    GC_MODE: 0,

    /**
     * 默认垃圾回收最大空闲。
     *
     * @static
     * @name GC_MAX_IDLE
     * @memberof PIXI.settings
     * @type {number}
     * @default 3600
     */
    GC_MAX_IDLE: 60 * 60,

    /**
     * 默认垃圾收集最大检查计数。
     *
     * @static
     * @name GC_MAX_CHECK_COUNT
     * @memberof PIXI.settings
     * @type {number}
     * @default 600
     */
    GC_MAX_CHECK_COUNT: 60 * 10,

    /**
     * pixi支持的默认循环模式。
     *
     * @static
     * @name WRAP_MODE
     * @memberof PIXI.settings
     * @type {PIXI.WRAP_MODES}
     * @default PIXI.WRAP_MODES.CLAMP
     */
    WRAP_MODE: 33071,

    /**
     * 纹理的默认缩放模式。
     *
     * @static
     * @name SCALE_MODE
     * @memberof PIXI.settings
     * @type {PIXI.SCALE_MODES}
     * @default PIXI.SCALE_MODES.LINEAR
     */
    SCALE_MODE: 1,

    /**
     * 默认在顶点着色器中指定浮点精度。
     *
     * @static
     * @name PRECISION_VERTEX
     * @memberof PIXI.settings
     * @type {PIXI.PRECISION}
     * @default PIXI.PRECISION.HIGH
     */
    PRECISION_VERTEX: 'highp',

    /**
     * 默认在片段着色器中指定浮点精度。
     * iOS最好设置为highp，原因是 https://github.com/pixijs/pixi.js/issues/3742
     *
     * @static
     * @name PRECISION_FRAGMENT
     * @memberof PIXI.settings
     * @type {PIXI.PRECISION}
     * @default PIXI.PRECISION.MEDIUM
     */
    PRECISION_FRAGMENT: isMobile.apple.device ? 'highp' : 'mediump',

    /**
     * 我们能在一个帧中上传相同的缓冲区吗？
     *
     * @static
     * @name CAN_UPLOAD_SAME_BUFFER
     * @memberof PIXI.settings
     * @type {boolean}
     */
    CAN_UPLOAD_SAME_BUFFER: canUploadSameBuffer(),

    /**
     * 在图像加载之前启用位图创建。此功能是实验性的。
     *
     * @static
     * @name CREATE_IMAGE_BITMAP
     * @memberof PIXI.settings
     * @type {boolean}
     * @default false
     */
    CREATE_IMAGE_BITMAP: false,

    /**
     * 如果为true，则在渲染时，PixiJS将使用Math.floor() x/y值，从而停止像素插值。
     * 优点包括更清晰的图像质量（如文本）和在canvas上更快的渲染。
     * 主要缺点是物体的运动可能看起来不太平滑。
     *
     * @static
     * @constant
     * @memberof PIXI.settings
     * @type {boolean}
     * @default false
     */
    ROUND_PIXELS: false,
};
