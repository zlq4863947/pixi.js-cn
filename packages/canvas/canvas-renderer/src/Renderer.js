import { Renderer } from '@pixi/core';
import { CanvasRenderer } from './CanvasRenderer';

// Reference to Renderer.create static function
const parentCreate = Renderer.create;

/**
 * 重写Renderer.create以回退使用CanvasRenderer。
 * 还支持forceCanvas选项和Application或autoDetectRenderer。
 * @private
 */
Renderer.create = function create(options)
{
    const forceCanvas = options && options.forceCanvas;

    if (!forceCanvas)
    {
        try
        {
            return parentCreate(options);
        }
        catch (err)
        {
            // swallow WebGL-unsupported error
        }
    }

    return new CanvasRenderer(options);
};
