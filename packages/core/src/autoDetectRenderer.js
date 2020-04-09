import { Renderer } from './Renderer';

/**
 * 此辅助函数将自动检测您应该使用哪个渲染器。
 * WebGL是首选的渲染器，因为它速度更快。 如果浏览器不支持WebGL，则此函数将返回画布渲染器。
 *
 * @memberof PIXI
 * @function autoDetectRenderer
 * @param {object} [options] - 可选的渲染器参数
 * @param {number} [options.width=800] - 渲染器视图的宽度
 * @param {number} [options.height=600] - 渲染器视图的高度
 * @param {HTMLCanvasElement} [options.view] - 用作视图的canvas元素
 * @param {boolean} [options.transparent=false] - true的时候，渲染视图是透明的，默认为false
 * @param {boolean} [options.autoDensity=false] - 调整CSS像素中渲染器视图的大小，以允许使用非1的分辨率
 * @param {boolean} [options.antialias=false] - 设置抗锯齿
 * @param {boolean} [options.preserveDrawingBuffer=false] - 启用绘图缓冲区保留，如果需要在webgl上下文上调用toDataUrl，请启用此选项
 * @param {number} [options.backgroundColor=0x000000] - 渲染区域的背景色 (不为透明时显示).
 * @param {boolean} [options.clearBeforeRender=true] - 这将设置渲染器是否在新的渲染过程之前清除canvas。
 * @param {number} [options.resolution=1] - 渲染器的分辨率/设备像素比，retina为2
 * @param {boolean} [options.forceCanvas=false] - 阻止选择WebGL渲染器，即使存在，也仅当使用 **pixi.js-legacy** 或 **@pixi/canvas-renderer** 模块时，
 * 此选项才可用，否则将被忽略。
 * @param {boolean} [options.forceFXAA=false] - 强制在本机上使用FXAA抗锯齿。 FXAA更快，但可能并不总是看起来比 **webgl**出色
 * @param {string} [options.powerPreference] - 传递给webgl上下文的参数，对于具有双显卡的设备，可以设置为"high-performance" **仅适用于webgl**
 * @return {PIXI.Renderer|PIXI.CanvasRenderer} 返回WebGL渲染器（如果可用），否则返回CanvasRenderer
 */
export function autoDetectRenderer(options)
{
    return Renderer.create(options);
}
