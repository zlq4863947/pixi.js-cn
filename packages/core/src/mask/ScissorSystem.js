import { AbstractMaskSystem } from './AbstractMaskSystem';

/**
 * 渲染器的系统插件，用于管理剪刀矩形（用于遮罩）。
 *
 * @class
 * @extends PIXI.System
 * @memberof PIXI.systems
 */
export class ScissorSystem extends AbstractMaskSystem
{
    /**
     * @param {PIXI.Renderer} renderer - 此系统适用的渲染器。
     */
    constructor(renderer)
    {
        super(renderer);

        this.glConst = WebGLRenderingContext.SCISSOR_TEST;
    }

    getStackLength()
    {
        const maskData = this.maskStack[this.maskStack.length - 1];

        if (maskData)
        {
            return maskData._scissorCounter;
        }

        return 0;
    }

    /**
     * 应用遮罩并将其添加到当前的模板堆栈中。@alvin
     *
     * @param {PIXI.MaskData} maskData - 遮罩数据
     */
    push(maskData)
    {
        const maskObject = maskData.maskObject;

        maskObject.renderable = true;

        const prevData = maskData._scissorRect;
        const bounds = maskObject.getBounds(true);
        const { gl } = this.renderer;

        maskObject.renderable = false;

        if (prevData)
        {
            bounds.fit(prevData);
        }
        else
        {
            gl.enable(gl.SCISSOR_TEST);
        }

        maskData._scissorCounter++;
        maskData._scissorRect = bounds;
        this._useCurrent();
    }

    /**
     * Pops scissor mask. MaskData is already removed from stack
     */
    pop()
    {
        const { gl } = this.renderer;

        if (this.getStackLength() > 0)
        {
            this._useCurrent();
        }
        else
        {
            gl.disable(gl.SCISSOR_TEST);
        }
    }

    /**
     * Setup renderer to use the current scissor data.
     * @private
     */
    _useCurrent()
    {
        const rect = this.maskStack[this.maskStack.length - 1]._scissorRect;
        const rt = this.renderer.renderTexture.current;
        const { transform, sourceFrame, destinationFrame } = this.renderer.projection;
        const resolution = rt ? rt.resolution : this.renderer.resolution;
        let x = ((rect.x - sourceFrame.x) * resolution) + destinationFrame.x;
        let y = ((rect.y - sourceFrame.y) * resolution) + destinationFrame.y;
        const width = rect.width * resolution;
        const height = rect.height * resolution;

        if (transform)
        {
            x += transform.tx * resolution;
            y += transform.ty * resolution;
        }
        if (!rt)
        {
            // flipY. In future we'll have it over renderTextures as an option
            y = this.renderer.height - height - y;
        }

        this.renderer.gl.scissor(x, y, width, height);
    }
}
