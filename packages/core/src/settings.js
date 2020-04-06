import { settings } from '@pixi/settings';
import { ENV } from '@pixi/constants';
import { isMobile } from '@pixi/utils';

/**
 * 对使用WebGL的最大支持。 如果设备不支持WebGL版本，例如WebGL 2，它将尝试回退对WebGL 1的支持。
 * 如果要显式删除功能支持以实现更稳定的基准，请选择较低的环境。
 *
 * 由于{@link https://bugs.chromium.org/p/chromium/issues/detail?id=934823 in chromium}，
 * 我们默认为所有非Apple移动设备禁用webgl2。
 *
 * @static
 * @name PREFER_ENV
 * @memberof PIXI.settings
 * @type {number}
 * @default PIXI.ENV.WEBGL2
 */
settings.PREFER_ENV = isMobile.any ? ENV.WEBGL : ENV.WEBGL2;

/**
 * 如果设置为 `true`，则Textures和BaseTexture对象存储在缓存中
 * ({@link PIXI.utils.TextureCache TextureCache} 和
 * {@link PIXI.utils.BaseTextureCache BaseTextureCache})
 * *只能*在调用{@link PIXI.Texture.from Texture.from} 或
 * {@link PIXI.BaseTexture.from BaseTexture.from}时使用。
 * 否则，这些`from`调用将引发异常。如果您想通过{@link PIXI.Loader Loader} 强制预加载所有资源，则使用此属性可能很有用。
 * {@link PIXI.Loader Loader}.
 *
 * @static
 * @name STRICT_TEXTURE_CACHE
 * @memberof PIXI.settings
 * @type {boolean}
 * @default false
 */
settings.STRICT_TEXTURE_CACHE = false;

export { settings };
