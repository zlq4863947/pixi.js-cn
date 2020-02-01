/**
 * 创建一个小的彩色画布
 *
 * @ignore
 * @param {string} color - 画布的颜色
 * @return {canvas} 小画布元素
 */
function createColoredCanvas(color)
{
    const canvas = document.createElement('canvas');

    canvas.width = 6;
    canvas.height = 1;

    const context = canvas.getContext('2d');

    context.fillStyle = color;
    context.fillRect(0, 0, 6, 1);

    return canvas;
}

/**
 * 检查当前浏览器是否支持画布BlendModes
 *
 * @private
 * @return {boolean} 是否得到支持
 */
export function canUseNewCanvasBlendModes()
{
    if (typeof document === 'undefined')
    {
        return false;
    }

    const magenta = createColoredCanvas('#ff00ff');
    const yellow = createColoredCanvas('#ffff00');

    const canvas = document.createElement('canvas');

    canvas.width = 6;
    canvas.height = 1;

    const context = canvas.getContext('2d');

    context.globalCompositeOperation = 'multiply';
    context.drawImage(magenta, 0, 0);
    context.drawImage(yellow, 2, 0);

    const imageData = context.getImageData(2, 0, 1, 1);

    if (!imageData)
    {
        return false;
    }

    const data = imageData.data;

    return (data[0] === 255 && data[1] === 0 && data[2] === 0);
}
