enum MouseEventType {
    None = 0,
    LeftClick = 1 << 0,
    RightClick = 1 << 1,
    Click = LeftClick | RightClick,
    MouseOver = 1 << 2,
    Any = Click | MouseOver,
}

interface IPopover extends Element {
    focusTimer?: number;
}

interface IPopoverPosition {
    left: number;
    offsetX: number;
    offsetY: number;
    top: number;
}

export namespace TavenemPopover {
    const flipClassReplacements: Record<string, Record<string, string>> = {
        'top': {
            'top-left': 'bottom-left',
            'top-center': 'bottom-center',
            'anchor-bottom-center': 'anchor-top-center',
            'top-right': 'bottom-right',
        },
        'left': {
            'top-left': 'top-right',
            'center-left': 'center-right',
            'anchor-center-right': 'anchor-center-left',
            'bottom-left': 'bottom-right',
        },
        'right': {
            'top-right': 'top-left',
            'center-right': 'center-left',
            'anchor-center-left': 'anchor-center-right',
            'bottom-right': 'bottom-left',
        },
        'bottom': {
            'bottom-left': 'top-left',
            'bottom-center': 'top-center',
            'anchor-top-center': 'anchor-bottom-center',
            'bottom-right': 'top-right',
        },
        'top-and-left': {
            'top-left': 'bottom-right',
        },
        'top-and-right': {
            'top-right': 'bottom-left',
        },
        'bottom-and-left': {
            'bottom-left': 'top-right',
        },
        'bottom-and-right': {
            'bottom-right': 'top-left',
        },
    };
    const resizeObserver = new ResizeObserver(function () {
        placePopovers();
    });

    export function getPopoverParent(popover: HTMLElement) {
        const anchorId = popover.dataset.anchorId;
        const anchor = anchorId ? document.getElementById(anchorId) : null;

        let containingParent = anchor
            ? anchor.parentElement
            : popover.parentElement;
        while (containingParent
            && (!containingParent.contains(popover)
                || getComputedStyle(containingParent).position == 'static')) {
            containingParent = containingParent.parentElement;
        }
        return containingParent;
    }

    export function initialize() {
        resizeObserver.observe(document.body);
        document.addEventListener('focusin', focusPopovers.bind(undefined, true));
        document.addEventListener('focusout', focusPopovers.bind(undefined, false));
        document.addEventListener('scroll', placePopovers.bind(undefined), true);
        window.addEventListener('resize', placePopovers.bind(undefined), true);
    }

    export function placePopover(popoverNode: Element): void {
        if (!popoverNode
            || !(popoverNode instanceof HTMLElement)) {
            return;
        }

        if (!popoverNode.classList.contains('open')) {
            const parent = popoverNode.parentElement; ('tf-tooltip');
            if (!parent
                || !parent.hasAttribute('data-popover-container')
                || !('popoverOpen' in parent.dataset)) {
                return;
            }
        }

        const offsetParent = getOffsetParent(popoverNode);
        const offsetBoundingRect = offsetParent.getBoundingClientRect();

        let anchorElement: HTMLElement | null = null;
        if (popoverNode instanceof TavenemPopoverHTMLElement
            && popoverNode.anchor) {
            anchorElement = popoverNode.anchor;
        } else if (popoverNode.dataset.anchorId) {
            anchorElement = document.getElementById(popoverNode.dataset.anchorId);
        }
        const anchorBoundingRect = anchorElement
            ? anchorElement.getBoundingClientRect()
            : null;

        const containingParent = getPopoverParent(popoverNode);
        const boundingRect = anchorElement
            ? anchorBoundingRect!
            : containingParent
                ? containingParent.getBoundingClientRect()
                : offsetBoundingRect;

        if (popoverNode.classList.contains('match-width')) {
            popoverNode.style.minWidth = boundingRect.width + 'px';
        }
        if (popoverNode.classList.contains('limit-width')) {
            popoverNode.style.maxWidth = boundingRect.width + 'px';
        }

        const selfRect = popoverNode.getBoundingClientRect();
        const classList = popoverNode.classList;
        const classListArray = Array.from(popoverNode.classList);

        const postion = calculatePopoverPosition(
            classListArray,
            boundingRect,
            selfRect);
        let left = postion.left;
        let top = postion.top;
        let offsetX = postion.offsetX;
        let offsetY = postion.offsetY;

        const positionXStr = popoverNode.dataset.positionX;
        const positionX = positionXStr ? parseFloat(positionXStr) : undefined;
        const positionYStr = popoverNode.dataset.positionY;
        const positionY = positionYStr ? parseFloat(positionYStr) : undefined;

        if (classList.contains('flip-onopen')
            || classList.contains('flip-always')) {
            let absLeft = boundingRect.left + left;
            let absTop = boundingRect.top + top;
            if (positionX && positionY) {
                absLeft = positionX + left;
                absTop = positionY + top;
            }

            const deltaToLeft = absLeft + offsetX;
            const deltaToRight = window.innerWidth - absLeft - selfRect.width;
            const deltaTop = absTop - selfRect.height;
            const spaceToTop = absTop;
            const deltaBottom = window.innerHeight - absTop - selfRect.height;

            const originalFlipSelector = popoverNode.dataset.popoverFlipped;
            let flipSelector = originalFlipSelector;

            if (!flipSelector) {
                if (classList.contains('top-left')) {
                    if (deltaBottom < 0 && deltaToRight < 0 && spaceToTop >= selfRect.height && deltaToLeft >= selfRect.width) {
                        flipSelector = 'top-and-left';
                    } else if (deltaBottom < 0 && spaceToTop >= selfRect.height) {
                        flipSelector = 'top';
                    } else if (deltaToRight < 0 && deltaToLeft >= selfRect.width) {
                        flipSelector = 'left';
                    }
                } else if (classList.contains('top-center')) {
                    if (deltaBottom < 0 && spaceToTop >= selfRect.height) {
                        flipSelector = 'top';
                    }
                } else if (classList.contains('top-right')) {
                    if (deltaBottom < 0 && deltaToLeft < 0 && spaceToTop >= selfRect.height && deltaToRight >= selfRect.width) {
                        flipSelector = 'top-and-right';
                    } else if (deltaBottom < 0 && spaceToTop >= selfRect.height) {
                        flipSelector = 'top';
                    } else if (deltaToLeft < 0 && deltaToRight >= selfRect.width) {
                        flipSelector = 'right';
                    }
                } else if (classList.contains('center-left')) {
                    if (deltaToRight < 0 && deltaToLeft >= selfRect.width) {
                        flipSelector = 'left';
                    }
                } else if (classList.contains('center-right')) {
                    if (deltaToLeft < 0 && deltaToRight >= selfRect.width) {
                        flipSelector = 'right';
                    }
                } else if (classList.contains('bottom-left')) {
                    if (deltaTop < 0 && deltaToRight < 0 && deltaBottom >= 0 && deltaToLeft >= selfRect.width) {
                        flipSelector = 'bottom-and-left';
                    } else if (deltaTop < 0 && deltaBottom >= 0) {
                        flipSelector = 'bottom';
                    } else if (deltaToRight < 0 && deltaToLeft >= selfRect.width) {
                        flipSelector = 'left';
                    }
                } else if (classList.contains('bottom-center')) {
                    if (deltaTop < 0 && deltaBottom >= 0) {
                        flipSelector = 'bottom';
                    }
                } else if (classList.contains('bottom-right')) {
                    if (deltaTop < 0 && deltaToLeft < 0 && deltaBottom >= 0 && deltaToRight >= selfRect.width) {
                        flipSelector = 'bottom-and-right';
                    } else if (deltaTop < 0 && deltaBottom >= 0) {
                        flipSelector = 'bottom';
                    } else if (deltaToLeft < 0 && deltaToRight >= selfRect.width) {
                        flipSelector = 'right';
                    }
                }
            }

            if (flipSelector && flipSelector != 'none') {
                const newPosition = getPositionForFlippedPopver(
                    classListArray,
                    flipSelector,
                    boundingRect,
                    selfRect);
                left = newPosition.left;
                top = newPosition.top;
                offsetX = newPosition.offsetX;
                offsetY = newPosition.offsetY;
                popoverNode.dataset.popoverFlip = 'flipped';
            } else {
                delete popoverNode.dataset.popoverFlip;
            }

            if (classList.contains('flip-onopen')
                && !originalFlipSelector) {
                popoverNode.dataset.popoverFlipped = flipSelector || 'none';
            }
        }

        if (positionX && positionY) {
            offsetX += positionX;
            offsetY += positionY;
        } else {
            offsetX += boundingRect.left - offsetBoundingRect.left;
            offsetY += boundingRect.top - offsetBoundingRect.top;
        }

        const offsetXStr = popoverNode.dataset.offsetX;
        const popoverOffsetX = offsetXStr ? parseFloat(offsetXStr) : undefined;
        if (popoverOffsetX) {
            offsetX += popoverOffsetX;
        }

        const offsetYStr = popoverNode.dataset.offsetY;
        const popoverOffsetY = offsetYStr ? parseFloat(offsetYStr) : undefined;
        if (popoverOffsetY) {
            offsetY += popoverOffsetY;
        }

        left += offsetX;
        top += offsetY;
        const viewLeft = offsetBoundingRect.left + left;
        const viewTop = offsetBoundingRect.top + top;
        const viewRight = window.innerWidth - viewLeft - selfRect.width;
        const viewBottom = window.innerHeight - viewTop - selfRect.height;

        if (viewRight < 0
            && viewLeft >= 0
            && -viewRight <= selfRect.width) {
            left += viewRight;
        }
        if (viewBottom < 0
            && viewTop >= 0
            && -viewBottom <= selfRect.height) {
            top += viewBottom;
        }
        if (viewLeft < 0
            && -viewLeft <= selfRect.width) {
            left += -viewLeft;
        }
        if (viewTop < 0
            && -viewTop <= selfRect.height) {
            top += -viewTop;
        }

        popoverNode.style.left = left + 'px';
        popoverNode.style.top = top + 'px';
    }

    export function placePopovers(): void {
        for (const popover of document.getElementsByTagName('tf-popover')) {
            placePopover(popover);
        }
    }

    function newFocusLostEvent(parentId?: string) {
        return new CustomEvent('focuslost', { bubbles: true, detail: { parentId: parentId } });
    }

    function calculatePopoverPosition(
        list: string[],
        boundingRect: DOMRect,
        selfRect: DOMRect): IPopoverPosition {
        let top = 0;
        let left = 0;
        if (list.indexOf('anchor-top-left') >= 0) {
            left = 0;
            top = 0;
        } else if (list.indexOf('anchor-top-center') >= 0) {
            left = 0 + boundingRect.width / 2;
            top = 0;
        } else if (list.indexOf('anchor-top-right') >= 0) {
            left = 0 + boundingRect.width;
            top = 0;
        } else if (list.indexOf('anchor-center-left') >= 0) {
            left = 0;
            top = 0 + boundingRect.height / 2;
        } else if (list.indexOf('anchor-center-center') >= 0) {
            left = 0 + boundingRect.width / 2;
            top = 0 + boundingRect.height / 2;
        } else if (list.indexOf('anchor-center-right') >= 0) {
            left = 0 + boundingRect.width;
            top = 0 + boundingRect.height / 2;
        } else if (list.indexOf('anchor-bottom-left') >= 0) {
            left = 0;
            top = 0 + boundingRect.height;
        } else if (list.indexOf('anchor-bottom-center') >= 0) {
            left = 0 + boundingRect.width / 2;
            top = 0 + boundingRect.height;
        } else if (list.indexOf('anchor-bottom-right') >= 0) {
            left = 0 + boundingRect.width;
            top = 0 + boundingRect.height;
        }

        let offsetX = 0;
        let offsetY = 0;
        if (list.indexOf('top-left') >= 0) {
            offsetX = 0;
            offsetY = 0;
        } else if (list.indexOf('top-center') >= 0) {
            offsetX = -selfRect.width / 2;
            offsetY = 0;
        } else if (list.indexOf('top-right') >= 0) {
            offsetX = -selfRect.width;
            offsetY = 0;
        } else if (list.indexOf('center-left') >= 0) {
            offsetX = 0;
            offsetY = -selfRect.height / 2;
        } else if (list.indexOf('center-center') >= 0) {
            offsetX = -selfRect.width / 2;
            offsetY = -selfRect.height / 2;
        } else if (list.indexOf('center-right') >= 0) {
            offsetX = -selfRect.width;
            offsetY = -selfRect.height / 2;
        } else if (list.indexOf('bottom-left') >= 0) {
            offsetX = 0;
            offsetY = -selfRect.height;
        } else if (list.indexOf('bottom-center') >= 0) {
            offsetX = -selfRect.width / 2;
            offsetY = -selfRect.height;
        } else if (list.indexOf('bottom-right') >= 0) {
            offsetX = -selfRect.width;
            offsetY = -selfRect.height;
        }

        return {
            top: top, left: left, offsetX: offsetX, offsetY: offsetY
        };
    }

    function focusPopovers(isIn: boolean, e: FocusEvent) {
        const popovers: Element[] = [];
        if (e.target instanceof Element) {
            let popover: Element | null | undefined = e.target.closest('tf-popover');
            if (!popover && isIn) {
                for (const popover of document.getElementsByTagName('tf-popover')) {
                    const focusId = popover.getAttribute('data-focus-id');
                    if (focusId) {
                        const focusElement = e.target.closest(`#${focusId}`);
                        if (focusElement) {
                            popovers.unshift(popover);
                        }
                    }
                }
            } else {
                while (popover) {
                    popovers.unshift(popover);
                    popover = popover.parentElement?.closest('tf-popover');
                }
            }
            if (popovers.length == 0) {
                const childPopover = e.target.querySelector('tf-popover');
                if (childPopover) {
                    const focusId = childPopover.getAttribute('data-focus-id');
                    if (focusId == e.target.id) {
                        popovers.unshift(childPopover);
                    }
                }
            }
        }

        for (const popoverElement of document.getElementsByTagName('tf-popover')) {
            if (!popoverElement.classList.contains('open')) {
                continue;
            }

            const popover = popoverElement as IPopover

            const withinPopover = popovers.indexOf(popover) != -1;
            if (isIn) {
                if (withinPopover) {
                    if (popover.focusTimer) {
                        clearTimeout(popover.focusTimer);
                        delete popover.focusTimer;
                        setTimeout(() => {
                            clearTimeout(popover.focusTimer);
                            delete popover.focusTimer;
                        }, 100);
                    }
                    continue;
                }
            } else if (withinPopover
                && e.relatedTarget instanceof Element
                && e.relatedTarget.closest('tf-popover') == popover) {
                continue;
            }

            popover.focusTimer = setTimeout(() => {
                popover.dispatchEvent(newFocusLostEvent(popover.id));
            }, 150);
        }
    }

    function getOffsetParent(element: Element) {
        if (!element) {
            return document.documentElement;
        }

        let offsetParent: Element | null = null;
        while (offsetParent === null) {
            if (element.parentElement) {
                element = element.parentElement;
            } else {
                break;
            }
            if (element.nodeName == 'HTML') {
                return element;
            }
            const style = window.getComputedStyle(element);
            if (style.transform != 'none'
                || style.perspective != 'none'
                || style.willChange == 'transform'
                || style.willChange == 'perspective'
                || style.willChange == 'filter'
                || style.filter != 'none'
                || style.contain == 'paint'
                || style.getPropertyValue('backdrop-filter') != 'none') {
                return element;
            }
        }

        return offsetParent || document.documentElement;
    }

    function getPositionForFlippedPopver(
        inputArray: string[],
        selector: string,
        boundingRect: DOMRect,
        selfRect: DOMRect): IPopoverPosition {
        const classList = [];
        for (let i = 0; i < inputArray.length; i++) {
            const item = inputArray[i];
            const replacments = flipClassReplacements[selector][item];
            if (replacments) {
                classList.push(replacments);
            }
            else {
                classList.push(item);
            }
        }

        return calculatePopoverPosition(
            classList,
            boundingRect,
            selfRect);
    }
}

export class TavenemPopoverHTMLElement extends HTMLElement {
    private _anchor: HTMLElement | null | undefined;
    private _mouseOver: boolean;
    private _mutationObserver: MutationObserver;
    private _parentMutationObserver: MutationObserver;
    private _parentResizeObserver: ResizeObserver;
    private _resizeObserver: ResizeObserver;

    static get observedAttributes() {
        return ['data-offset-x', 'data-offset-y', 'data-position-x', 'data-position-y'];
    }

    get anchor() { return this._anchor; }
    set anchor(value: HTMLElement | null | undefined) { this._anchor = value; }

    get mouseOver() { return this._mouseOver; }
    set mouseOver(value: boolean) { this._mouseOver = value; }

    constructor() {
        super();

        this._mouseOver = false;

        this._mutationObserver = new MutationObserver(mutations => {
            for (const mutation of mutations) {
                if (mutation.type === 'attributes'
                    && mutation.target instanceof HTMLElement) {
                    if (mutation.target.classList.contains('flip-onopen') &&
                        mutation.target.classList.contains('open') == false) {
                        delete mutation.target.dataset.popoverFlipped;
                        delete mutation.target.dataset.popoverFlip;
                    }

                    TavenemPopover.placePopover(mutation.target);
                }
            }
        });

        this._parentMutationObserver = new MutationObserver(mutations => {
            for (const mutation of mutations) {
                if (mutation.type === 'attributes'
                    && mutation.target instanceof HTMLElement) {
                    const popover = mutation.target.querySelector('tf-popover');
                    if (popover) {
                        if (popover.classList.contains('flip-onopen') &&
                            !('popoverOpen' in mutation.target.dataset)) {
                            delete mutation.target.dataset.popoverFlipped;
                            delete mutation.target.dataset.popoverFlip;
                        }

                        TavenemPopover.placePopover(popover);
                    }
                }
            }
        });

        this._parentResizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                const target = entry.target;

                for (let i = 0; i < target.childNodes.length; i++) {
                    const childNode = target.childNodes[i];
                    if (childNode instanceof HTMLElement
                        && childNode.id
                        && childNode.id.startsWith('popover-')) {
                        TavenemPopover.placePopover(childNode);
                    }
                }
            }
        });

        this._resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                let target = entry.target;
                if (target instanceof HTMLElement) {
                    TavenemPopover.placePopover(target);
                }
            }
        });
    }

    connectedCallback() {
        const shadow = this.attachShadow({ mode: 'open' });

        const style = document.createElement('style');
        style.innerHTML = `:host {
    --popover-color: var(--tavenem-color-text);
    --popover-color-bg: var(--tavenem-color-bg-surface);
    --tavenem-theme-color: var(--tavenem-color-bg-alt);
    --tavenem-theme-color-bg-alt: var(--tavenem-color-bg);
    --tavenem-theme-color-hover: var(--tavenem-color-bg-surface);
    --tavenem-theme-color-text: var(--tavenem-color-text);
    -webkit-backdrop-filter: blur(12px);
    backdrop-filter: blur(12px);
    background-color: var(--popover-color-bg);
    border-radius: var(--tavenem-border-radius);
    box-shadow: var(--tavenem-shadow-2);
    color: var(--popover-color);
    max-width: 100vw;
    opacity: 0;
    outline: 0;
    pointer-events: none;
    position: fixed;
    transition: box-shadow 0ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
    visibility: hidden;
    width: max-content;
    z-index: var(--tavenem-zindex-tooltip);
}

@media print {
    :host {
        display: none;
    }
}

:host(.fixed) {
    z-index: var(--tavenem-zindex-tooltip);
}

:host(.filled) {
    --popover-color: var(--tavenem-theme-color-text, var(--tavenem-color-text));
    --popover-color-bg: var(--tavenem-theme-color, var(--tavenem-color-bg-alt));
}`;
        shadow.appendChild(style);

        const slot = document.createElement('slot');
        shadow.appendChild(slot);

        const containingParent = TavenemPopover.getPopoverParent(this);
        if (!containingParent) {
            return;
        }

        this.addEventListener('click', this.cancelFocusLoss.bind(this));
        this.addEventListener('contextmenu', this.cancelFocusLoss.bind(this));
        this.addEventListener('mouseleave', this.onMouseLeave.bind(this));
        this.addEventListener('mouseover', this.onMouseOver.bind(this));
        this.addEventListener('touchstart', this.cancelFocusLoss.bind(this));

        this._mutationObserver.observe(this, { attributeFilter: ['class'] });
        this._parentResizeObserver.observe(containingParent);
        this._resizeObserver.observe(this);

        if (this.parentElement
            && this.parentElement.hasAttribute('data-popover-container')) {
            this._parentMutationObserver.observe(this.parentElement, { attributeFilter: ['data-popover-open'] });
        }
    }

    disconnectedCallback() {
        this.removeEventListener('click', this.cancelFocusLoss.bind(this));
        this.removeEventListener('contextmenu', this.cancelFocusLoss.bind(this));
        this.removeEventListener('mouseleave', this.onMouseLeave.bind(this));
        this.removeEventListener('mouseover', this.onMouseOver.bind(this));
        this.removeEventListener('touchstart', this.cancelFocusLoss.bind(this));
        this._mutationObserver.disconnect();
        this._parentMutationObserver.disconnect();
        this._parentResizeObserver.disconnect();
        this._resizeObserver.disconnect();
    }

    attributeChangedCallback(name: string, oldValue: string | null | undefined, newValue: string | null | undefined) {
        if (name === 'data-offset-x') {
            this.changeOffsetX(oldValue, newValue);
        } else if (name === 'data-offset-y') {
            this.changeOffsetY(oldValue, newValue);
        } else if (name === 'data-position-x') {
            this.changePositionX(newValue);
        } else if (name === 'data-position-y') {
            this.changePositionY(newValue);
        }
    }

    private cancelFocusLoss(e: Event) {
        const popovers: IPopover[] = [];
        if (e.target instanceof Element) {
            let popover: Element | null | undefined = e.target.closest('tf-popover');
            while (popover) {
                popovers.push(popover as IPopover);
                popover = popover.parentElement?.closest('tf-popover');
            }
        }
        if (!popovers.length) {
            return;
        }

        for (const popover of popovers) {
            if (popover.focusTimer) {
                clearTimeout(popover.focusTimer);
                delete popover.focusTimer;
            }
        }
    }

    private changeOffsetX(oldValue: string | null | undefined, newValue: string | null | undefined) {
        const offsetX = newValue ? parseFloat(newValue) : undefined;
        const prevX = oldValue ? parseFloat(oldValue) : undefined;

        if (prevX || offsetX) {
            let left = 0;
            if (this.style.left) {
                left = Number.parseFloat(this.style.left.substring(0, this.style.left.length - 2));
            }
            if (prevX) {
                left -= prevX;
            }
            if (offsetX) {
                left += offsetX;
            }
            this.style.left = +left.toFixed(2) + 'px';
        }
    }

    private changeOffsetY(oldValue: string | null | undefined, newValue: string | null | undefined) {
        const offsetY = newValue ? parseFloat(newValue) : undefined;
        const prevY = oldValue ? parseFloat(oldValue) : undefined;

        if (prevY || offsetY) {
            let top = 0;
            if (this.style.top) {
                top = Number.parseFloat(this.style.top.substring(0, this.style.top.length - 2));
            }
            if (prevY) {
                top -= prevY;
            }
            if (offsetY) {
                top += offsetY;
            }
            this.style.top = +top.toFixed(2) + 'px';
        }
    }

    private changePositionX(newValue: string | null | undefined) {
        const positionX = newValue ? parseFloat(newValue) : undefined;
        if (positionX) {
            this.style.left = positionX.toFixed(2) + 'px';
        }
    }

    private changePositionY(newValue: string | null | undefined) {
        const positionY = newValue ? parseFloat(newValue) : undefined;
        if (positionY) {
            this.style.top = positionY.toFixed(2) + 'px';
        }
    }

    private onMouseLeave(event: MouseEvent) {
        this._mouseOver = false;

        if (this.previousSibling
            && this.previousSibling instanceof TavenemDropdownHTMLElement) {
            this.previousSibling.onPopoverMouseLeave();
        }

        if (this.classList.contains('tooltip')) {
            const tooltip = this.closest('tf-tooltip');
            if (tooltip
                && tooltip instanceof TavenemTooltipHTMLElement) {
                tooltip.onPopoverMouseLeave(this, event);
            }
        }
    }

    private onMouseOver() {
        this._mouseOver = true;

        if (this.classList.contains('tooltip')) {
            const tooltip = this.closest('tf-tooltip');
            if (tooltip
                && tooltip instanceof TavenemTooltipHTMLElement) {
                tooltip.onPopoverMouseOver();
            }
        }
    }
}

export class TavenemTooltipHTMLElement extends HTMLElement {
    private _anchor: HTMLElement | null | undefined;
    private _button: HTMLButtonElement | undefined;
    private _dismissed: boolean;
    private _hasButton: boolean;
    private _hideTimer: number;
    private _mouseOver: boolean;
    private _showTimer: number;

    constructor() {
        super();

        this._dismissed = false;
        this._hasButton = false;
        this._hideTimer = -1;
        this._mouseOver = false;
        this._showTimer = -1;
    }

    connectedCallback() {
        const shadow = this.attachShadow({ mode: 'open' });

        const style = document.createElement('style');

        if ('tooltipButton' in this.dataset) {
            this._hasButton = true;

            style.innerHTML = `:host {
    position: relative;
}

button {
    background-color: transparent;
    border-color: var(--tavenem-theme-color-text);
    border-radius: 9999px;
    border-style: none;
    border-width: 1px;
    box-shadow: none;
    box-sizing: content-box;
    color: var(--tavenem-theme-color);
    cursor: pointer;
    display: inline-flex;
    fill: currentColor;
    flex: 0 0 auto;
    height: 1rem;
    margin: 0;
    outline: 0;
    overflow: hidden;
    position: absolute;
    stroke: currentColor;
    stroke-width: 1px;
    top: -.25em;
    transition: background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,border 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,fill 200ms cubic-bezier(.4,0,.2,1) 0ms;
    user-select: none;
    width: 1rem;
    -moz-appearance: none;
    -webkit-appearance: none;
    -webkit-tap-highlight-color: transparent;
}

    button:after {
        background-image: radial-gradient(circle,#000 10%,transparent 10.01%);
        background-position: 50%;
        background-repeat: no-repeat;
        content: "";
        display: block;
        height: 100%;
        left: 0;
        opacity: 0;
        pointer-events: none;
        position: absolute;
        top: 0;
        transform: scale(7,7);
        transition: transform .3s,opacity 1s;
        width: 100%;
    }

    button:active:after {
        transform: scale(0,0);
        opacity: .1;
        transition: 0s;
    }

    button::-moz-focus-inner {
        border-style: none;
    }

    button:hover,
    button:focus-visible {
        background-color: var(--tavenem-theme-color-hover);
    }

slot {
    display: none;
}

    :host([data-popover-open]) slot {
        display: block;
    }`;
            shadow.appendChild(style);

            const button = document.createElement('button');
            button.tabIndex = -1;
            button.addEventListener('click', this.toggle.bind(this));
            button.addEventListener('focusin', this.onAttentionOnButton.bind(this));
            button.addEventListener('focusout', this.onAttentionOutButton.bind(this));
            button.addEventListener('mouseover', this.onAttentionOnButton.bind(this));
            button.addEventListener('mouseleave', this.onAttentionOutButton.bind(this));
            shadow.appendChild(button);
            this._button = button;

            const icon = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
            icon.setAttributeNS(null, 'viewBox', "0 0 24 24");
            icon.setAttributeNS(null, 'height', "1rem");
            icon.setAttributeNS(null, 'width', "1rem");
            icon.setAttributeNS(null, 'fill', "currentColor");
            icon.innerHTML = '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>';
            button.appendChild(icon);
        } else {
            style.innerHTML = `:host {
    left: 0;
    position: absolute;
    top: 0;
}

slot {
    display: none;
}

    :host([data-popover-open]) slot {
        display: block;
    }`;
            shadow.appendChild(style);
        }

        document.addEventListener('click', this.dismissTarget.bind(this));
        document.addEventListener('focusin', this.onAttentionOnTarget.bind(this));
        document.addEventListener('focusout', this.onAttentionOutTarget.bind(this));
        document.addEventListener('mouseover', this.onAttentionOnTarget.bind(this));
        document.addEventListener('mouseout', this.onAttentionOutTarget.bind(this));

        const slot = document.createElement('slot');
        shadow.appendChild(slot);

        this.addEventListener('click', this.dismiss.bind(this));
    }

    disconnectedCallback() {
        clearTimeout(this._hideTimer);
        clearTimeout(this._showTimer);

        document.removeEventListener('click', this.dismissTarget.bind(this));
        document.removeEventListener('focusin', this.onAttentionOnTarget.bind(this));
        document.removeEventListener('focusout', this.onAttentionOutTarget.bind(this));
        document.removeEventListener('mouseover', this.onAttentionOnTarget.bind(this));
        document.removeEventListener('mouseout', this.onAttentionOutTarget.bind(this));

        this.removeEventListener('click', this.dismiss.bind(this));
        
        if (this._button) {
            this._button.removeEventListener('click', this.toggle.bind(this));
            this._button.removeEventListener('focusin', this.onAttentionOnButton.bind(this));
            this._button.removeEventListener('focusout', this.onAttentionOutButton.bind(this));
            this._button.removeEventListener('mouseover', this.onAttentionOnButton.bind(this));
            this._button.removeEventListener('mouseleave', this.onAttentionOutButton.bind(this));
        }
    }

    onPopoverMouseLeave(popover: TavenemPopoverHTMLElement, event: MouseEvent) {
        if (this.contains(popover)
            && (!(event.relatedTarget instanceof Node)
            || !this.contains(event.relatedTarget))) {
            this._mouseOver = false;
        }
        if ('popoverOpen' in this.dataset && !this._mouseOver) {
            this._dismissed = false;
            clearTimeout(this._showTimer);
            this._hideTimer = setTimeout(this.hide.bind(this), 200);
        }
    }

    onPopoverMouseOver() {
        clearTimeout(this._hideTimer);
    }

    setVisibility(value: boolean) {
        if (value) {
            this.show();
        } else {
            this.hide();
        }
        this._dismissed = false;
    }

    toggleVisibility() {
        if ('popoverOpen' in this.dataset) {
            this.hide();
        } else {
            this.show();
        }
        this._dismissed = false;
    }

    private dismiss() {
        this._dismissed = true;
        clearTimeout(this._showTimer);
        this._hideTimer = setTimeout(this.hide.bind(this), 200);
    }

    private dismissTarget(event: Event) {
        const target = this.verifyTarget(event);
        if (!target
            || (target === this
            && !('dismissOnTap' in this.dataset))) {
            return;
        }

        this.dismiss();
    }

    private hide() {
        this._mouseOver = false;
        delete this.dataset.popoverOpen;
        clearTimeout(this._hideTimer);
        clearTimeout(this._showTimer);
        this._anchor = null;
    }

    private onAttentionOn() {
        this._mouseOver = true;
        if (this._dismissed) {
            return;
        }
        const delayStr = this.dataset.delay;
        const delay = delayStr ? parseInt(delayStr) : 0;
        if (delay > 0) {
            clearTimeout(this._showTimer);
            clearTimeout(this._hideTimer);
            this._showTimer = setTimeout(this.show.bind(this), delay);
        } else {
            this.show();
        }
    }

    private onAttentionOnButton(event: Event) {
        event.stopPropagation();
        this._anchor = this._button;
        this.onAttentionOn();
    }

    private onAttentionOnTarget(event: Event) {
        const target = this.verifyTarget(event);
        if (!target) {
            return;
        }
        this._anchor = target;
        this.onAttentionOn();
    }

    private onAttentionOut() {
        this._mouseOver = false;

        const tooltip = this.querySelector('.tooltip');
        if (!tooltip
            || !(tooltip instanceof TavenemPopoverHTMLElement)
            || !tooltip.mouseOver) {
            this._dismissed = false;
            clearTimeout(this._showTimer);
            this._hideTimer = setTimeout(this.hide.bind(this), 200);
        }
    }

    private onAttentionOutButton(event: Event) {
        event.stopPropagation();
        this.onAttentionOut();
    }

    private onAttentionOutTarget(event: Event) {
        if (!this.verifyTarget(event)) {
            return;
        }
        if (event.target instanceof Node) {
            if (event instanceof MouseEvent
                && event.target instanceof Node
                && event.relatedTarget instanceof Node
                && event.target.contains(event.relatedTarget)) {
                return;
            } else if (event instanceof FocusEvent
                && event.target instanceof Node
                && event.relatedTarget instanceof Node
                && event.target.contains(event.relatedTarget)) {
                return;
            }
        }
        this.onAttentionOut();
    }

    private show() {
        clearTimeout(this._hideTimer);
        clearTimeout(this._showTimer);
        const popover = this.querySelector('tf-popover');
        if (popover instanceof TavenemPopoverHTMLElement) {
            popover.anchor = this._anchor;
        }
        this.dataset.popoverOpen = '';
    }

    private toggle(event: Event) {
        event.stopPropagation();
        this.toggleVisibility();
    }

    private verifyTarget(event: Event) {
        if (event.target === this) {
            return this;
        }

        if (!(event.target instanceof HTMLElement)) {
            return null;
        }

        if ('tooltipId' in event.target.dataset) {
            const tooltipId = event.target.dataset.tooltipId;
            if (tooltipId === this.id) {
                return event.target;
            }
            return null;
        }

        if (!this._hasButton
            && 'tooltipContainerTrigger' in this.dataset) {
            let tooltipElement = event.target.querySelector(':scope > tf-tooltip');
            if (!tooltipElement
                && event.target.parentElement) {
                tooltipElement = event.target.parentElement.querySelector(':scope > tf-tooltip');
                if (tooltipElement === this) {
                    return event.target.parentElement;
                }
            }
            if (tooltipElement === this) {
                return event.target;
            }
        }

        return null;
    }
}

export class TavenemDropdownHTMLElement extends HTMLElement {
    _activation: MouseEventType;
    _closeCooldownTimer: number;
    _closed: boolean;
    _hideTimer: number;
    _showTimer: number;

    static get observedAttributes() {
        return ['disabled'];
    }

    constructor() {
        super();

        this._activation = MouseEventType.None;
        this._closeCooldownTimer = -1;
        this._closed = false;
        this._hideTimer = -1;
        this._showTimer = -1;
    }

    private static newDropdownToggleEvent(value: boolean) {
        return new CustomEvent('dropdowntoggle', { bubbles: true, detail: { value: value } });
    }

    connectedCallback() {
        const shadow = this.attachShadow({ mode: 'open' });

        const style = document.createElement('style');
        style.textContent = `:host {
    position: relative;
}

slot {
    border-radius: inherit;
}`;
        shadow.appendChild(style);

        const slot = document.createElement('slot');
        shadow.appendChild(slot);

        this.addEventListener('contextmenu', this.onContext.bind(this));
        this.addEventListener('focuslost', this.onPopoverFocusLost.bind(this));
        this.addEventListener('mousedown', this.onMouseDown.bind(this));
        this.addEventListener('mouseenter', this.onTriggerMouseEnter.bind(this));
        this.addEventListener('mouseleave', this.onTriggerMouseLeave.bind(this));
        this.addEventListener('mouseup', this.toggle.bind(this));

        document.addEventListener('mousedown', this.onDocMouseDown.bind(this));
    }

    disconnectedCallback() {
        clearTimeout(this._hideTimer);
        clearTimeout(this._showTimer);
        this.removeEventListener('contextmenu', this.onContext.bind(this));
        this.removeEventListener('focuslost', this.onPopoverFocusLost.bind(this));
        this.removeEventListener('mousedown', this.onMouseDown.bind(this));
        this.removeEventListener('mouseenter', this.onTriggerMouseEnter.bind(this));
        this.removeEventListener('mouseleave', this.onTriggerMouseLeave.bind(this));
        this.removeEventListener('mouseup', this.toggle.bind(this));
        document.removeEventListener('mousedown', this.onDocMouseDown.bind(this));
    }

    attributeChangedCallback(name: string, oldValue: string | null | undefined, newValue: string | null | undefined) {
        if (name === 'disabled' && newValue) {
            this.close();
        }
    }

    onPopoverMouseLeave() {
        if (this._activation == MouseEventType.MouseOver
            && 'popoverOpen' in this.dataset) {
            this.close();
        }
    }

    setOpen(value: boolean) {
        if (value) {
            this.openInner();
        } else {
            this.closeInner();
        }
        clearTimeout(this._hideTimer);
        clearTimeout(this._showTimer);
    }

    toggleOpen() {
        if ('popoverOpen' in this.dataset) {
            this.closeInner();
        } else {
            this.openInner();
        }
        clearTimeout(this._hideTimer);
        clearTimeout(this._showTimer);
    }

    private close() {
        clearTimeout(this._hideTimer);
        clearTimeout(this._showTimer);
        if ('popoverOpen' in this.dataset) {
            this._activation = MouseEventType.None;
            this.closeInner();
            const popover = this.querySelector('tf-popover.contained-popover');
            if (popover && popover instanceof TavenemPopoverHTMLElement) {
                popover.mouseOver = false;
            }
        }
    }

    private closeInner() {
        this._closed = true;
        delete this.dataset.popoverOpen;
        this.dispatchEvent(TavenemDropdownHTMLElement.newDropdownToggleEvent(false));
        this._closeCooldownTimer = setTimeout(() => this._closed = false, 200);
    }

    private getMouseEvent(event?: MouseEvent) {
        if (!event) {
            return MouseEventType.None;
        } else if (event?.type === 'mouseenter') {
            return MouseEventType.MouseOver;
        } else if (event.button === 0) {
            return MouseEventType.LeftClick;
        } else if (event.button === 2) {
            return MouseEventType.RightClick;
        } else {
            return MouseEventType.None;
        }
    }

    private onContext(event: MouseEvent) {
        const activationStr = this.dataset.activation;
        const activation = activationStr ? parseInt(activationStr) : 0;
        if ((activation & MouseEventType.RightClick) !== MouseEventType.None) {
            event.preventDefault();
        }
    }

    private onDocMouseDown(event: MouseEvent) {
        if (event.target
            && event.target !== this
            && event.target instanceof Node
            && !this.contains(event.target)) {
            this.close();
        }
    }

    private onMouseDown() { clearTimeout(this._hideTimer); }

    private open(event?: MouseEvent) {
        clearTimeout(this._hideTimer);
        clearTimeout(this._showTimer);

        if (this._closed
            || this.hasAttribute('disabled')) {
            return;
        }

        if ('openAtPointer' in this.dataset) {
            const popover = this.querySelector('tf-popover.contained-popover');
            if (popover && popover instanceof TavenemPopoverHTMLElement) {
                const clientX = event?.clientX;
                if (clientX) {
                    popover.dataset.positionX = clientX.toString();
                } else {
                    delete popover.dataset.positionX;
                }
                const clientY = event?.clientY;
                if (clientY) {
                    popover.dataset.positionY = clientY.toString();
                } else {
                    delete popover.dataset.positionY;
                }
            }
        }

        this._activation = this.getMouseEvent(event);

        this.openInner();
    }

    private openAfterDelay() {
        clearTimeout(this._hideTimer);
        clearTimeout(this._showTimer);
        if (this._closed
            || this.hasAttribute('disabled')) {
            return;
        }

        this._activation = MouseEventType.MouseOver;

        this.openInner();
    }

    private openDelayed(delay: number, event?: MouseEvent) {
        clearTimeout(this._showTimer);
        if (this._closed
            || this.hasAttribute('disabled')) {
            return;
        }

        if ('openAtPointer' in this.dataset) {
            const popover = this.querySelector('tf-popover.contained-popover');
            if (popover && popover instanceof TavenemPopoverHTMLElement) {
                const clientX = event?.clientX;
                if (clientX) {
                    popover.dataset.positionX = clientX.toString();
                } else {
                    delete popover.dataset.positionX;
                }
                const clientY = event?.clientY;
                if (clientY) {
                    popover.dataset.positionY = clientY.toString();
                } else {
                    delete popover.dataset.positionY;
                }
            }
        }

        this._showTimer = setTimeout(this.openAfterDelay.bind(this), delay);
    }

    private openInner() {
        if (this._closed) {
            return;
        }

        const popover = this.querySelector('tf-popover.contained-popover');
        if (popover) {
            TavenemPopover.placePopover(popover);
        }
        this.dataset.popoverOpen = '';
        this.dispatchEvent(TavenemDropdownHTMLElement.newDropdownToggleEvent(true));
    }

    private onPopoverFocusLost(event: Event) {
        if (event.target
            && event.target instanceof TavenemPopoverHTMLElement
            && event.target.parentElement === this) {
            this._hideTimer = setTimeout(this.close.bind(this), 100);
        }
    }

    private onTriggerMouseEnter(event: MouseEvent) {
        if ('popoverOpen' in this.dataset) {
            return;
        }
        const activationStr = this.dataset.activation;
        const activation = activationStr ? parseInt(activationStr) : 0;
        if ((activation & MouseEventType.MouseOver) != MouseEventType.None) {
            const delayStr = this.dataset.delay;
            const delay = delayStr ? parseInt(delayStr) : 0;
            if (delay <= 0) {
                this.open(event);
            } else {
                this.openDelayed(delay, event);
            }
        }
    }

    private onTriggerMouseLeave() {
        clearTimeout(this._showTimer);
        if (!('popoverOpen' in this.dataset)) {
            return;
        }

        this._hideTimer = setTimeout(() => {
            if (this._activation !== MouseEventType.MouseOver) {
                return;
            }

            const popover = this.querySelector('tf-popover.contained-popover');
            if (!popover
                || !(popover instanceof TavenemPopoverHTMLElement)
                || !popover.mouseOver) {
                this.close();
            }
        }, 100);
    }

    private toggle(event?: MouseEvent) {
        const mouseEventType = this.getMouseEvent(event);

        const activationStr = this.dataset.activation;
        const activation = activationStr ? parseInt(activationStr) : 0;
        const correctButton = (activation & mouseEventType) != MouseEventType.None;

        if ('popoverOpen' in this.dataset) {
            this.close();
            if (correctButton
                && 'openAtPointer' in this.dataset) {
                this._closed = false;
                this.open(event);
            }
        }
        else if (!this.hasAttribute('disabled') && correctButton) {
            this.open(event);
        }
    }
}

export function setDropdownOpen(id: string, value: boolean) {
    const dropdown = document.getElementById(id);
    if (dropdown) {
        const dropdownClass = window.customElements.get('tf-dropdown');
        if (dropdownClass
            && dropdown instanceof dropdownClass) {
            (dropdown as TavenemDropdownHTMLElement).setOpen(value);
        }
    }
}

export function setTooltipVisibility(id: string, value: boolean) {
    const tooltip = document.getElementById(id);
    if (tooltip) {
        const tooltipClass = window.customElements.get('tf-tooltip');
        if (tooltipClass
            && tooltip instanceof tooltipClass) {
            (tooltip as TavenemTooltipHTMLElement).setVisibility(value);
        }
    }
}

export function toggleDropdown(id: string) {
    const dropdown = document.getElementById(id);
    if (dropdown) {
        const dropdownClass = window.customElements.get('tf-dropdown');
        if (dropdownClass
            && dropdown instanceof dropdownClass) {
            (dropdown as TavenemDropdownHTMLElement).toggleOpen();
        }
    }
}

export function toggleTooltip(id: string) {
    const tooltip = document.getElementById(id);
    if (tooltip) {
        const tooltipClass = window.customElements.get('tf-tooltip');
        if (tooltipClass
            && tooltip instanceof tooltipClass) {
            (tooltip as TavenemTooltipHTMLElement).toggleVisibility();
        }
    }
}