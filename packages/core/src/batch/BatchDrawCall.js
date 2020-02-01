import { DRAW_MODES } from '@pixi/constants';

/**
 * 由批处理程序用于批量绘制。
 * 其中的每一个都包含绘制绑定的几何所需的所有信息。
 *
 * @class
 * @memberof PIXI
 */
export class BatchDrawCall
{
    constructor()
    {
        this.texArray = null;
        this.blend = 0;
        this.type = DRAW_MODES.TRIANGLES;

        this.start = 0;
        this.size = 0;

        /**
         * uniforms或自定义webgl状态的数据
         * @member {object}
         */
        this.data = null;
    }
}
