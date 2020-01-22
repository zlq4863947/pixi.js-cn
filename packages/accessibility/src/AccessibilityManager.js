import { isMobile, removeItems } from '@pixi/utils';

import { DisplayObject } from '@pixi/display';
import { accessibleTarget } from './accessibleTarget';

// 向容器添加一些额外的变量。
DisplayObject.mixin(accessibleTarget);

const KEY_CODE_TAB = 9;

const DIV_TOUCH_SIZE = 100;
const DIV_TOUCH_POS_X = 0;
const DIV_TOUCH_POS_Y = 0;
const DIV_TOUCH_ZINDEX = 2;

const DIV_HOOK_SIZE = 1;
const DIV_HOOK_POS_X = -1000;
const DIV_HOOK_POS_Y = -1000;
const DIV_HOOK_ZINDEX = 2;

/**
 * 辅助功能管理器重新创建了选项卡功能，并允许屏幕阅读器读取内容。
 * 这非常重要，因为它可以帮助残障人士访问PixiJS内容。
 *
 * 可以使DisplayObject变得可访问，就像可以使其具有交互性一样。该管理器将映射事件，
 * 就像正在使用鼠标一样，从而最大程度地减少了实现所需的工作量。
 *
 * 此类的实例默认情况下会自动创建，可以在`renderer.plugins.accessibility`中找到
 *
 * @class
 * @memberof PIXI.accessibility
 */
export class AccessibilityManager
{
    /**
     * @param {PIXI.CanvasRenderer|PIXI.Renderer} renderer - 对当前渲染器的引用
     */
    constructor(renderer)
    {
        /**
         * @type {?HTMLElement}
         * @private
         */
        this._hookDiv = null;
        if (isMobile.tablet || isMobile.phone)
        {
            this.createTouchHook();
        }

        // 首先，我们创建一个将位于PixiJS元素上方的div。这是div叠加层所在的位置。
        const div = document.createElement('div');

        div.style.width = `${DIV_TOUCH_SIZE}px`;
        div.style.height = `${DIV_TOUCH_SIZE}px`;
        div.style.position = 'absolute';
        div.style.top = `${DIV_TOUCH_POS_X}px`;
        div.style.left = `${DIV_TOUCH_POS_Y}px`;
        div.style.zIndex = DIV_TOUCH_ZINDEX;

        /**
         * 位于PixiJS元素之上的dom元素。这是div叠加层所在的位置。
         *
         * @type {HTMLElement}
         * @private
         */
        this.div = div;

        /**
         * 一个用于存储div的简单池。
         *
         * @type {*}
         * @private
         */
        this.pool = [];

        /**
         * 这是一个记号，用于检查对象是否不再被渲染。
         *
         * @type {Number}
         * @private
         */
        this.renderId = 0;

        /**
         * 将此设置为true将直观地显示div。
         *
         * @type {boolean}
         */
        this.debug = false;

        /**
         * 此辅助功能管理器适用的渲染器。
         *
         * @member {PIXI.AbstractRenderer}
         */
        this.renderer = renderer;

        /**
         * 当前活动的辅助项的数组。
         *
         * @member {Array<*>}
         * @private
         */
        this.children = [];

        /**
         * pre-bind the functions
         *
         * @type {Function}
         * @private
         */
        this._onKeyDown = this._onKeyDown.bind(this);

        /**
         * pre-bind the functions
         *
         * @type {Function}
         * @private
         */
        this._onMouseMove = this._onMouseMove.bind(this);

        /**
         * 一个标记
         * @type {boolean}
         * @readonly
         */
        this.isActive = false;

        /**
         * 一个标记
         * @type {boolean}
         * @readonly
         */
        this.isMobileAccessibility = false;

        /**
         * 计数以限制android设备上的div更新
         * @type number
         * @private
         */
        this.androidUpdateCount = 0;

        /**
         * 更新div元素的频率 ()
         * @private
         */
        this.androidUpdateFrequency = 500; // 2fps

        // let listen for tab.. once pressed we can fire up and show the accessibility layer
        // 让我们可以监听标签。一旦点击，我们就可以启动并显示辅助层
        window.addEventListener('keydown', this._onKeyDown, false);
    }

    /**
     * 创建触摸钩子
     *
     * @private
     */
    createTouchHook()
    {
        const hookDiv = document.createElement('button');

        hookDiv.style.width = `${DIV_HOOK_SIZE}px`;
        hookDiv.style.height = `${DIV_HOOK_SIZE}px`;
        hookDiv.style.position = 'absolute';
        hookDiv.style.top = `${DIV_HOOK_POS_X}px`;
        hookDiv.style.left = `${DIV_HOOK_POS_Y}px`;
        hookDiv.style.zIndex = DIV_HOOK_ZINDEX;
        hookDiv.style.backgroundColor = '#FF0000';
        hookDiv.title = 'select to enable accessability for this content';

        hookDiv.addEventListener('focus', () =>
        {
            this.isMobileAccessibility = true;
            this.activate();
            this.destroyTouchHook();
        });

        document.body.appendChild(hookDiv);
        this._hookDiv = hookDiv;
    }

    /**
     * 销毁触摸钩子
     *
     * @private
     */
    destroyTouchHook()
    {
        if (!this._hookDiv)
        {
            return;
        }
        document.body.removeChild(this._hookDiv);
        this._hookDiv = null;
    }

    /**
     * 激活将导致显示“辅助功能”层。
     * 用户按下Tab键时将调用此方法。
     *
     * @private
     */
    activate()
    {
        if (this.isActive)
        {
            return;
        }

        this.isActive = true;

        window.document.addEventListener('mousemove', this._onMouseMove, true);
        window.removeEventListener('keydown', this._onKeyDown, false);

        this.renderer.on('postrender', this.update, this);

        if (this.renderer.view.parentNode)
        {
            this.renderer.view.parentNode.appendChild(this.div);
        }
    }

    /**
     * 停用将导致可访问性层被隐藏。
     * 用户移动鼠标时将调用此方法。
     *
     * @private
     */
    deactivate()
    {
        if (!this.isActive || this.isMobileAccessibility)
        {
            return;
        }

        this.isActive = false;

        window.document.removeEventListener('mousemove', this._onMouseMove, true);
        window.addEventListener('keydown', this._onKeyDown, false);

        this.renderer.off('postrender', this.update);

        if (this.div.parentNode)
        {
            this.div.parentNode.removeChild(this.div);
        }
    }

    /**
     * 该递归函数将遍历场景图，并将所有新的辅助对象添加到DOM层。
     *
     * @private
     * @param {PIXI.Container} displayObject - 要检查的DisplayObject。
     */
    updateAccessibleObjects(displayObject)
    {
        if (!displayObject.visible || !displayObject.accessibleChildren)
        {
            return;
        }

        if (displayObject.accessible && displayObject.interactive)
        {
            if (!displayObject._accessibleActive)
            {
                this.addChild(displayObject);
            }

            displayObject.renderId = this.renderId;
        }

        const children = displayObject.children;

        for (let i = 0; i < children.length; i++)
        {
            this.updateAccessibleObjects(children[i]);
        }
    }

    /**
     * 在每个渲染之前，此函数将确保所有div正确映射到其DisplayObject。
     *
     * @private
     */
    update()
    {
        /* 在Android默认的网页浏览器上，标签顺序似乎是根据位置而不是tabIndex计算的，
        *  移动按钮可能会导致焦点在两个按钮之间闪烁，从而使其难以导航，
        *  所以每半秒运行一次更新，似乎可以解决它。
        */
        const now = performance.now();

        if (isMobile.android.device && now < this.androidUpdateCount)
        {
            return;
        }

        this.androidUpdateCount = now + this.androidUpdateFrequency;

        if (!this.renderer.renderingToScreen)
        {
            return;
        }

        // update children...
        this.updateAccessibleObjects(this.renderer._lastObjectRendered);

        const rect = this.renderer.view.getBoundingClientRect();

        const resolution = this.renderer.resolution;

        const sx = (rect.width / this.renderer.width) * resolution;
        const sy = (rect.height / this.renderer.height) * resolution;

        let div = this.div;

        div.style.left = `${rect.left}px`;
        div.style.top = `${rect.top}px`;
        div.style.width = `${this.renderer.width}px`;
        div.style.height = `${this.renderer.height}px`;

        for (let i = 0; i < this.children.length; i++)
        {
            const child = this.children[i];

            if (child.renderId !== this.renderId)
            {
                child._accessibleActive = false;

                removeItems(this.children, i, 1);
                this.div.removeChild(child._accessibleDiv);
                this.pool.push(child._accessibleDiv);
                child._accessibleDiv = null;

                i--;
            }
            else
            {
                // map div to display..
                div = child._accessibleDiv;
                let hitArea = child.hitArea;
                const wt = child.worldTransform;

                if (child.hitArea)
                {
                    div.style.left = `${(wt.tx + (hitArea.x * wt.a)) * sx}px`;
                    div.style.top = `${(wt.ty + (hitArea.y * wt.d)) * sy}px`;

                    div.style.width = `${hitArea.width * wt.a * sx}px`;
                    div.style.height = `${hitArea.height * wt.d * sy}px`;
                }
                else
                {
                    hitArea = child.getBounds();

                    this.capHitArea(hitArea);

                    div.style.left = `${hitArea.x * sx}px`;
                    div.style.top = `${hitArea.y * sy}px`;

                    div.style.width = `${hitArea.width * sx}px`;
                    div.style.height = `${hitArea.height * sy}px`;

                    // update button titles and hints if they exist and they've changed
                    if (div.title !== child.accessibleTitle && child.accessibleTitle !== null)
                    {
                        div.title = child.accessibleTitle;
                    }
                    if (div.getAttribute('aria-label') !== child.accessibleHint
                        && child.accessibleHint !== null)
                    {
                        div.setAttribute('aria-label', child.accessibleHint);
                    }
                }

                // the title or index may have changed, if so lets update it!
                if (child.accessibleTitle !== div.title || child.tabIndex !== div.tabIndex)
                {
                    div.title = child.accessibleTitle;
                    div.tabIndex = child.tabIndex;
                    if (this.debug) this.updateDebugHTML(div);
                }
            }
        }

        // increment the render id..
        this.renderId++;
    }

    /**
     * 私有函数，将在视觉上显示的信息添加到辅助div上
     *
     * @param {HTMLDivElement} div
     */
    updateDebugHTML(div)
    {
        div.innerHTML = `type: ${div.type}</br> title : ${div.title}</br> tabIndex: ${div.tabIndex}`;
    }

    /**
     * 根据显示对象的边界调整点击区域
     *
     * @param {PIXI.Rectangle} hitArea - 子节点的边界
     */
    capHitArea(hitArea)
    {
        if (hitArea.x < 0)
        {
            hitArea.width += hitArea.x;
            hitArea.x = 0;
        }

        if (hitArea.y < 0)
        {
            hitArea.height += hitArea.y;
            hitArea.y = 0;
        }

        if (hitArea.x + hitArea.width > this.renderer.width)
        {
            hitArea.width = this.renderer.width - hitArea.x;
        }

        if (hitArea.y + hitArea.height > this.renderer.height)
        {
            hitArea.height = this.renderer.height - hitArea.y;
        }
    }

    /**
     * Adds a DisplayObject to the accessibility manager
     *
     * @private
     * @param {PIXI.DisplayObject} displayObject - The child to make accessible.
     */
    addChild(displayObject)
    {
        //    this.activate();

        let div = this.pool.pop();

        if (!div)
        {
            div = document.createElement('button');

            div.style.width = `${DIV_TOUCH_SIZE}px`;
            div.style.height = `${DIV_TOUCH_SIZE}px`;
            div.style.backgroundColor = this.debug ? 'rgba(255,255,255,0.5)' : 'transparent';
            div.style.position = 'absolute';
            div.style.zIndex = DIV_TOUCH_ZINDEX;
            div.style.borderStyle = 'none';

            // ARIA attributes ensure that button title and hint updates are announced properly
            if (navigator.userAgent.toLowerCase().indexOf('chrome') > -1)
            {
                // Chrome doesn't need aria-live to work as intended; in fact it just gets more confused.
                div.setAttribute('aria-live', 'off');
            }
            else
            {
                div.setAttribute('aria-live', 'polite');
            }

            if (navigator.userAgent.match(/rv:.*Gecko\//))
            {
                // FireFox needs this to announce only the new button name
                div.setAttribute('aria-relevant', 'additions');
            }
            else
            {
                // required by IE, other browsers don't much care
                div.setAttribute('aria-relevant', 'text');
            }

            div.addEventListener('click', this._onClick.bind(this));
            div.addEventListener('focus', this._onFocus.bind(this));
            div.addEventListener('focusout', this._onFocusOut.bind(this));
        }

        // set pointer events
        div.style.pointerEvents = displayObject.accessiblePointerEvents;
        // set the type, this defaults to button!
        div.type = displayObject.accessibleType;

        if (displayObject.accessibleTitle && displayObject.accessibleTitle !== null)
        {
            div.title = displayObject.accessibleTitle;
        }
        else if (!displayObject.accessibleHint
                 || displayObject.accessibleHint === null)
        {
            div.title = `displayObject ${displayObject.tabIndex}`;
        }

        if (displayObject.accessibleHint
            && displayObject.accessibleHint !== null)
        {
            div.setAttribute('aria-label', displayObject.accessibleHint);
        }

        if (this.debug) this.updateDebugHTML(div);

        displayObject._accessibleActive = true;
        displayObject._accessibleDiv = div;
        div.displayObject = displayObject;

        this.children.push(displayObject);
        this.div.appendChild(displayObject._accessibleDiv);
        displayObject._accessibleDiv.tabIndex = displayObject.tabIndex;
    }

    /**
     * Maps the div button press to pixi's InteractionManager (click)
     *
     * @private
     * @param {MouseEvent} e - The click event.
     */
    _onClick(e)
    {
        const interactionManager = this.renderer.plugins.interaction;

        interactionManager.dispatchEvent(e.target.displayObject, 'click', interactionManager.eventData);
        interactionManager.dispatchEvent(e.target.displayObject, 'pointertap', interactionManager.eventData);
        interactionManager.dispatchEvent(e.target.displayObject, 'tap', interactionManager.eventData);
    }

    /**
     * Maps the div focus events to pixi's InteractionManager (mouseover)
     *
     * @private
     * @param {FocusEvent} e - The focus event.
     */
    _onFocus(e)
    {
        if (!e.target.getAttribute('aria-live', 'off'))
        {
            e.target.setAttribute('aria-live', 'assertive');
        }
        const interactionManager = this.renderer.plugins.interaction;

        interactionManager.dispatchEvent(e.target.displayObject, 'mouseover', interactionManager.eventData);
    }

    /**
     * Maps the div focus events to pixi's InteractionManager (mouseout)
     *
     * @private
     * @param {FocusEvent} e - The focusout event.
     */
    _onFocusOut(e)
    {
        if (!e.target.getAttribute('aria-live', 'off'))
        {
            e.target.setAttribute('aria-live', 'polite');
        }
        const interactionManager = this.renderer.plugins.interaction;

        interactionManager.dispatchEvent(e.target.displayObject, 'mouseout', interactionManager.eventData);
    }

    /**
     * Is called when a key is pressed
     *
     * @private
     * @param {KeyboardEvent} e - The keydown event.
     */
    _onKeyDown(e)
    {
        if (e.keyCode !== KEY_CODE_TAB)
        {
            return;
        }

        this.activate();
    }

    /**
     * Is called when the mouse moves across the renderer element
     *
     * @private
     * @param {MouseEvent} e - The mouse event.
     */
    _onMouseMove(e)
    {
        if (e.movementX === 0 && e.movementY === 0)
        {
            return;
        }

        this.deactivate();
    }

    /**
     * 销毁辅助功能管理器
     *
     */
    destroy()
    {
        this.destroyTouchHook();
        this.div = null;

        for (let i = 0; i < this.children.length; i++)
        {
            this.children[i].div = null;
        }

        window.document.removeEventListener('mousemove', this._onMouseMove, true);
        window.removeEventListener('keydown', this._onKeyDown);

        this.pool = null;
        this.children = null;
        this.renderer = null;
    }
}
