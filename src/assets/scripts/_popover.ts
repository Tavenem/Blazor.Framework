enum MouseEventType {
    None = 0,
    LeftClick = 1 << 0,
    RightClick = 1 << 1,
    Click = LeftClick | RightClick,
    MouseOver = 1 << 2,
    Any = Click | MouseOver,
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

    export function initialize() {
        resizeObserver.observe(document.body);
        document.addEventListener('scroll', placePopovers.bind(undefined), true);
        window.addEventListener('resize', placePopovers.bind(undefined), true);
    }

    export function nodeContains(container: Node, other: Node | null) {
        if (!other) {
            return false;
        }
        let node: Node | null | undefined = other;
        while (node) {
            if (node === container) {
                return true;
            }

            if (typeof (node as HTMLSlotElement).assignedElements !== 'function'
                && (node as HTMLElement).assignedSlot?.parentNode) {
                // Element is slotted
                node = (node as HTMLElement).assignedSlot?.parentNode;
            } else if (node.nodeType === 11) { // DOCUMENT_FRAGMENT
                // Element is in shadow root
                node = (node as ShadowRoot).host;
            } else if (node.parentNode?.nodeType === 11) {
                node = (node.parentNode as ShadowRoot).host;
            } else {
                node = node.parentNode;
            }
        }
        return false;
    }

    export function placePopover(popoverNode: Element): void {
        if (!popoverNode
            || !(popoverNode instanceof HTMLElement)
            || !popoverNode.matches(':popover-open')) {
            return;
        }

        let anchorElement: Element | null = null;
        if (popoverNode instanceof TavenemPopoverHTMLElement
            && popoverNode.anchor) {
            anchorElement = popoverNode.anchor;
        } else if (popoverNode.dataset.anchorId) {
            anchorElement = document.getElementById(popoverNode.dataset.anchorId);
            if (!anchorElement) {
                const root = popoverNode.getRootNode();
                if (root instanceof ShadowRoot) {
                    root.getElementById(popoverNode.dataset.anchorId);
                }
            }
        }

        let containingParent = popoverNode.parentElement;
        if (!containingParent) {
            const root = popoverNode.getRootNode();
            if (root instanceof ShadowRoot
                && root.host instanceof HTMLElement) {
                containingParent = root.host;
            }
        }

        const boundingRect = anchorElement
            ? anchorElement.getBoundingClientRect()
            : containingParent
                ? containingParent.getBoundingClientRect()
                : document.documentElement.getBoundingClientRect();

        if (anchorElement || containingParent) {
            if (popoverNode.classList.contains('match-width')) {
                popoverNode.style.minWidth = boundingRect.width + 'px';
            }
            if (popoverNode.classList.contains('limit-width')) {
                popoverNode.style.maxWidth = boundingRect.width + 'px';
            }
        }

        const selfRect = popoverNode.getBoundingClientRect();
        const classList = popoverNode.classList;
        const classListArray = Array.from(popoverNode.classList);

        let positionX = 0;
        let positionY = 0;
        if (popoverNode.dataset.positionX) {
            const parsedPositionX = parseFloat(popoverNode.dataset.positionX);
            if (!isNaN(parsedPositionX)) {
                positionX = parsedPositionX;
            }
        }
        if (popoverNode.dataset.positionY) {
            const parsedPositionY = parseFloat(popoverNode.dataset.positionY);
            if (!isNaN(parsedPositionY)) {
                positionY = parsedPositionY;
            }
        }

        let left = 0, top = 0, offsetX = 0, offsetY = 0;
        if (positionX === 0 && positionY === 0) {
            ({ left, top, offsetX, offsetY } = calculatePopoverPosition(
                classListArray,
                boundingRect,
                selfRect));
        }

        let baseOffsetX = 0;
        let baseOffsetY = 0;
        if (popoverNode.dataset.offsetX) {
            const parsedOffsetX = parseFloat(popoverNode.dataset.offsetX);
            if (!isNaN(parsedOffsetX)) {
                baseOffsetX = parsedOffsetX;
                offsetX += baseOffsetX;
            }
        }
        if (popoverNode.dataset.offsetY) {
            const parsedOffsetY = parseFloat(popoverNode.dataset.offsetY);
            if (!isNaN(parsedOffsetY)) {
                baseOffsetY = parsedOffsetY;
                offsetY += baseOffsetY;
            }
        }

        if (classList.contains('flip-onopen')
            || classList.contains('flip-always')) {
            const proposedLeft = left + offsetX + positionX;
            const proposedTop = top + offsetY + positionY;
            const proposedRight = document.documentElement.clientWidth - proposedLeft - selfRect.width;
            const proposedBottom = document.documentElement.clientHeight - proposedTop - selfRect.height;

            const originalFlipSelector = popoverNode.dataset.popoverFlipped;
            let flipSelector = originalFlipSelector;

            if (!flipSelector) {
                if (classList.contains('top-left')) {
                    if (proposedBottom < 0 && proposedRight < 0 && proposedTop >= selfRect.height && proposedLeft >= selfRect.width) {
                        flipSelector = 'top-and-left';
                    } else if (proposedBottom < 0 && proposedTop >= selfRect.height) {
                        flipSelector = 'top';
                    } else if (proposedRight < 0 && proposedLeft >= selfRect.width) {
                        flipSelector = 'left';
                    }
                } else if (classList.contains('top-center')) {
                    if (proposedBottom < 0 && proposedTop >= selfRect.height) {
                        flipSelector = 'top';
                    }
                } else if (classList.contains('top-right')) {
                    if (proposedBottom < 0 && proposedLeft < 0 && proposedTop >= selfRect.height && proposedRight >= selfRect.width) {
                        flipSelector = 'top-and-right';
                    } else if (proposedBottom < 0 && proposedTop >= selfRect.height) {
                        flipSelector = 'top';
                    } else if (proposedLeft < 0 && proposedRight >= selfRect.width) {
                        flipSelector = 'right';
                    }
                } else if (classList.contains('center-left')) {
                    if (proposedRight < 0 && proposedLeft >= selfRect.width) {
                        flipSelector = 'left';
                    }
                } else if (classList.contains('center-right')) {
                    if (proposedLeft < 0 && proposedRight >= selfRect.width) {
                        flipSelector = 'right';
                    }
                } else if (classList.contains('bottom-left')) {
                    if (proposedTop < 0 && proposedRight < 0 && proposedBottom >= 0 && proposedLeft >= selfRect.width) {
                        flipSelector = 'bottom-and-left';
                    } else if (proposedTop < 0 && proposedBottom >= 0) {
                        flipSelector = 'bottom';
                    } else if (proposedRight < 0 && proposedLeft >= selfRect.width) {
                        flipSelector = 'left';
                    }
                } else if (classList.contains('bottom-center')) {
                    if (proposedTop < 0 && proposedBottom >= 0) {
                        flipSelector = 'bottom';
                    }
                } else if (classList.contains('bottom-right')) {
                    if (proposedTop < 0 && proposedLeft < 0 && proposedBottom >= 0 && proposedRight >= selfRect.width) {
                        flipSelector = 'bottom-and-right';
                    } else if (proposedTop < 0 && proposedBottom >= 0) {
                        flipSelector = 'bottom';
                    } else if (proposedLeft < 0 && proposedRight >= selfRect.width) {
                        flipSelector = 'right';
                    }
                }
            }

            if (flipSelector && flipSelector != 'none') {
                ({ left, top, offsetX, offsetY } = getPositionForFlippedPopver(
                    classListArray,
                    flipSelector,
                    boundingRect,
                    selfRect));
                offsetX += baseOffsetX;
                offsetY += baseOffsetY;
                popoverNode.dataset.popoverFlip = 'flipped';
            } else {
                delete popoverNode.dataset.popoverFlip;
            }

            if (classList.contains('flip-onopen')
                && !originalFlipSelector) {
                popoverNode.dataset.popoverFlipped = flipSelector || 'none';
            }
        }

        left += positionX + offsetX;
        top += positionY + offsetY;
        const right = document.documentElement.clientWidth - left - selfRect.width;
        const bottom = document.documentElement.clientHeight - top - selfRect.height;

        if (right < 0
            && left >= 0
            && -right <= selfRect.width) {
            left += right;
        }
        if (bottom < 0
            && top >= 0
            && -bottom <= selfRect.height) {
            top += bottom;
        }
        if (left < 0
            && -left <= selfRect.width) {
            left += -left;
        }
        if (top < 0
            && -top <= selfRect.height) {
            top += -top;
        }

        popoverNode.style.left = left + 'px';
        popoverNode.style.top = top + 'px';
    }

    export function placePopovers(): void {
        for (const popover of document.getElementsByTagName('tf-popover')) {
            placePopover(popover);
        }
        for (const popoverContainer of document.querySelectorAll('[data-popover-container]')) {
            const shadow = popoverContainer.shadowRoot;
            if (shadow) {
                for (const popover of shadow.querySelectorAll('tf-popover')) {
                    placePopover(popover);
                }
            }
        }
    }

    function calculatePopoverPosition(
        list: string[],
        boundingRect: DOMRect,
        selfRect: DOMRect): IPopoverPosition {
        let left = boundingRect.left;
        let top = boundingRect.top;
        if (list.indexOf('anchor-top-center') >= 0
            || list.indexOf('anchor-center-center') >= 0
            || list.indexOf('anchor-bottom-center') >= 0) {
            left += boundingRect.width / 2;
        } else if (list.indexOf('anchor-top-right') >= 0
            || list.indexOf('anchor-center-right') >= 0
            || list.indexOf('anchor-bottom-right') >= 0) {
            left += boundingRect.width;
        }
        if (list.indexOf('anchor-center-left') >= 0
            || list.indexOf('anchor-center-center') >= 0
            || list.indexOf('anchor-center-right') >= 0) {
            top += boundingRect.height / 2;
        } else if (list.indexOf('anchor-bottom-left') >= 0
            || list.indexOf('anchor-bottom-center') >= 0
            || list.indexOf('anchor-bottom-right') >= 0) {
            top += boundingRect.height;
        }

        let offsetX = 0;
        let offsetY = 0;
        if (list.indexOf('top-center') >= 0
            || list.indexOf('center-center') >= 0
            || list.indexOf('bottom-center') >= 0) {
            offsetX = -selfRect.width / 2;
        } else if (list.indexOf('top-right') >= 0
            || list.indexOf('center-right') >= 0
            || list.indexOf('bottom-right') >= 0) {
            offsetX = -selfRect.width;
        }
        if (list.indexOf('center-left') >= 0
            || list.indexOf('center-center') >= 0
            || list.indexOf('center-right') >= 0) {
            offsetY = -selfRect.height / 2;
        } else if (list.indexOf('bottom-left') >= 0
            || list.indexOf('bottom-center') >= 0
            || list.indexOf('bottom-right') >= 0) {
            offsetY = -selfRect.height;
        }

        return { left, top, offsetX, offsetY };
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
    private _anchor: Element | null | undefined;
    private _mouseOver: boolean;
    private _mutationObserver: MutationObserver;
    private _parentResizeObserver: ResizeObserver;
    private _resizeObserver: ResizeObserver;

    static get observedAttributes() {
        return ['data-offset-x', 'data-offset-y', 'data-position-x', 'data-position-y'];
    }

    get anchor() { return this._anchor; }
    set anchor(value: Element | null | undefined) { this._anchor = value; }

    get mouseOver() { return this._mouseOver; }
    set mouseOver(value: boolean) { this._mouseOver = value; }

    constructor() {
        super();

        this._mouseOver = false;

        this._mutationObserver = new MutationObserver(mutations => {
            for (const mutation of mutations) {
                if (mutation.type === 'attributes'
                    && mutation.target instanceof HTMLElement) {
                    if (mutation.target.classList.contains('flip-onopen')) {
                        delete mutation.target.dataset.popoverFlipped;
                        delete mutation.target.dataset.popoverFlip;
                    }

                    TavenemPopover.placePopover(mutation.target);
                }
            }
        });

        this._parentResizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                const target = entry.target;

                for (let i = 0; i < target.childNodes.length; i++) {
                    const childNode = target.childNodes[i];
                    if (childNode instanceof HTMLElement
                        && childNode.tagName === 'TF-POPOVER') {
                        TavenemPopover.placePopover(childNode);
                    }
                }
            }
        });

        this._resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                let target = entry.target;
                if (target instanceof HTMLElement
                    && target.tagName === 'TF-POPOVER') {
                    TavenemPopover.placePopover(target);
                }
            }
        });
    }

    connectedCallback() {
        if (!this.hasAttribute('popover')) {
            this.setAttribute('popover', 'auto');
        }

        const shadow = this.attachShadow({ mode: 'open', delegatesFocus: true });

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
    border: none;
    border-radius: var(--tavenem-border-radius);
    box-shadow: var(--tavenem-shadow-2);
    color: var(--popover-color);
    font-size: var(--tavenem-font-size);
    margin: 0;
    max-width: 100vw;
    outline: 0;
    padding: 0;
    position: fixed;
    transition: opacity 250ms 0ms;
    width: max-content;

    .list {
        max-height: inherit;
        overflow-y: auto;
        padding-inline-end: 1em;
        padding-inline-start: 1em;
    }
}

:host(:popover-open) {
    animation: fade-in 250ms ease-out;
}

@keyframes fade-in {
  0% {
    opacity: 0;
  }

  100% {
    opacity: 1;
  }
}

:host(:where(
    .primary,
    .secondary,
    .tertiary,
    .danger,
    .dark,
    .default,
    .info,
    .success,
    .warning)) {
    --popover-color: var(--tavenem-theme-color-text);
    --popover-color-bg: var(--tavenem-theme-color-hover);
}

@media print {
    :host {
        display: none;
    }
}

:host(.filled) {
    --popover-color: var(--tavenem-theme-color-text, var(--tavenem-color-text));
    --popover-color-bg: var(--tavenem-theme-color, var(--tavenem-color-bg-alt));
}`;
        shadow.appendChild(style);

        const slot = document.createElement('slot');
        shadow.appendChild(slot);

        this.addEventListener('mouseleave', this.onMouseLeave.bind(this));
        this.addEventListener('mouseover', this.onMouseOver.bind(this));
        this.addEventListener('toggle', this.position.bind(this));

        this._mutationObserver.observe(this, { attributeFilter: ['class'] });
        this._resizeObserver.observe(this);

        let containingParent = this.parentElement;
        if (!containingParent) {
            const root = this.getRootNode();
            if (root instanceof ShadowRoot
                && root.host instanceof HTMLElement) {
                containingParent = root.host;
            }
        }
        if (containingParent) {
            this._parentResizeObserver.observe(containingParent);
        }

        if ('open' in this.dataset) {
            if (!this.hasAttribute('popover')) {
                this.setAttribute('popover', 'manual');
            }
            this.show();
        } else if (!this.hasAttribute('popover')) {
            this.setAttribute('popover', 'auto');
        }
    }

    disconnectedCallback() {
        this.removeEventListener('mouseleave', this.onMouseLeave.bind(this));
        this.removeEventListener('mouseover', this.onMouseOver.bind(this));
        this.removeEventListener('toggle', this.position.bind(this));
        this._mutationObserver.disconnect();
        this._parentResizeObserver.disconnect();
        this._resizeObserver.disconnect();
    }

    attributeChangedCallback(name: string, oldValue: string | null | undefined, newValue: string | null | undefined) {
        if (newValue == oldValue) {
            return;
        }

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

    hide() {
        if (this.matches(":popover-open")) {
            this.hidePopover();
        }
    }

    show() {
        if (!this.matches(":popover-open")) {
            this.showPopover();
        }
    }

    toggle() {
        if (this.matches(":popover-open")) {
            this.hidePopover();
        } else {
            TavenemPopover.placePopover(this);
            this.showPopover();
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

        if (this.previousSibling instanceof TavenemDropdownHTMLElement) {
            this.previousSibling.onPopoverMouseLeave();
        }

        if (this.classList.contains('tooltip')) {
            const tooltip = this.closest<TavenemTooltipHTMLElement>('tf-tooltip');
            if (tooltip) {
                tooltip.onPopoverMouseLeave(this, event);
            }
        }
    }

    private onMouseOver() {
        this._mouseOver = true;

        if (this.classList.contains('tooltip')) {
            const tooltip = this.closest<TavenemTooltipHTMLElement>('tf-tooltip');
            if (tooltip) {
                tooltip.onPopoverMouseOver();
            }
        }
    }

    private position() {
        TavenemPopover.placePopover(this);
    }
}

export class TavenemTooltipHTMLElement extends HTMLElement {
    private _anchor: Element | null | undefined;
    private _hideTimer: number;
    private _mouseOver: boolean;
    private _showTimer: number;

    constructor() {
        super();

        this._hideTimer = -1;
        this._mouseOver = false;
        this._showTimer = -1;
    }

    connectedCallback() {
        const shadow = this.attachShadow({ mode: 'open', delegatesFocus: true });

        const style = document.createElement('style');

        if ('tooltipButton' in this.dataset) {
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
}`;
            shadow.appendChild(style);
        }

        style.innerHTML += `
tf-poopover {
    --tooltip-color: var(--tavenem-color-text);
    --tooltip-color-bg: var(--tavenem-color-bg-surface);
    align-items: center;
    background-color: var(--tooltip-color-bg);
    border-radius: var(--tavenem-border-radius);
    color: var(--tooltip-color);
    cursor: auto;
    font-size: .75rem;
    font-weight: var(--tavenem-font-weight-semibold);
    justify-content: center;
    line-height: 1.4rem;
    padding: .25rem .5rem;
    pointer-events: auto;
    text-align: center;
    text-transform: none;
    user-select: text;
    z-index: var(--tavenem-zindex-tooltip);

    &.top-center,
    &.bottom-center,
    &.center-left,
    &.center-right {
        &.arrow:after {
            border-color: var(--tooltip-color-bg) transparent transparent transparent;
            border-style: solid;
            border-width: 6px;
            content: "";
            position: absolute;
        }
    }

    &.bottom-center, &.top-center {
        &.arrow:after {
            left: calc(50% - 3px);
        }
    }

    &.center-right, &.center-left {
        &.arrow:after {
            top: calc(50% - 3px);
        }
    }

    &.bottom-center:not([data-popover-flip]), &.top-center[data-popover-flip] {
        transform: translateY(-10px);

        &.arrow:after {
            top: 100%;
            transform: rotate(0deg);
        }
    }

    &.center-right:not([data-popover-flip]), &.center-left[data-popover-flip] {
        transform: translateX(-10px);

        &.arrow:after {
            left: 100%;
            transform: rotate(270deg);
        }
    }

    &.center-left:not([data-popover-flip]), &.center-right[data-popover-flip] {
        transform: translateX(10px);

        &.arrow:after {
            right: 100%;
            transform: rotate(90deg);
        }
    }

    &.top-center:not([data-popover-flip]), &.bottom-center[data-popover-flip] {
        transform: translateY(10px);

        &.arrow:after {
            bottom: 100%;
            transform: rotate(180deg);
        }
    }

    &.filled {
        --tooltip-color: var(--tavenem-theme-color-text, var(--tavenem-color-text));
        --tooltip-color-bg: var(--tavenem-theme-color, var(--tavenem-color-bg-alt));
    }

    &:where(
        .primary,
        .secondary,
        .tertiary,
        .danger,
        .dark,
        .default,
        .info,
        .success,
        .warning) {
        --tooltip-color: var(--tavenem-theme-color-text);
        --tooltip-color-bg: var(--tavenem-theme-color-darken);
    }
}
`;

        const root = this.getRootNode();
        root.addEventListener('focusin', this.onAttentionOnTarget.bind(this));
        root.addEventListener('focusout', this.onAttentionOutTarget.bind(this));
        root.addEventListener('mouseover', this.onAttentionOnTarget.bind(this));
        root.addEventListener('mouseout', this.onAttentionOutTarget.bind(this));

        const popover = document.createElement('tf-popover');
        popover.popover = 'auto';

        if ('popoverClass' in this.dataset
            && this.dataset.popoverClass
            && this.dataset.popoverClass.length) {
            popover.classList.add(...this.dataset.popoverClass.split(' '));
        }
        if ('popoverOrigin' in this.dataset
            && this.dataset.popoverOrigin
            && this.dataset.popoverOrigin.length) {
            popover.classList.add(this.dataset.popoverOrigin);
        } else {
            popover.classList.add('top-center');
        }
        if ('anchorOrigin' in this.dataset
            && this.dataset.anchorOrigin
            && this.dataset.anchorOrigin.length) {
            popover.classList.add(this.dataset.anchorOrigin);
        } else {
            popover.classList.add('anchor-bottom-center');
        }
        popover.classList.add('flip-always');
        if ('arrow' in this.dataset) {
            popover.classList.add('arrow');
        }

        if ('popoverStyle' in this.dataset
            && this.dataset.popoverStyle
            && this.dataset.popoverStyle.length) {
            popover.style.cssText = this.dataset.popoverStyle;
        }
        if ('maxHeight' in this.dataset
            && this.dataset.maxHeight
            && this.dataset.maxHeight.length) {
            popover.style.maxHeight = this.dataset.maxHeight;
            popover.style.overflowY = 'auto';
        }

        if ('delay' in this.dataset
            && this.dataset.delay
            && this.dataset.delay.length) {
            popover.style.transitionDelay = this.dataset.delay + 'ms';
        } else {
            popover.style.transitionDelay = '750ms';
        }

        popover.tabIndex = -1;
        shadow.appendChild(popover);

        const slot = document.createElement('slot');
        popover.appendChild(slot);

        if (this.childElementCount === 0
            && this.textContent
            && this.textContent.length) {
            slot.textContent = this.textContent;
        }

        this.addEventListener('mousedown', this.stopEvent.bind(this));
        this.addEventListener('mouseup', this.stopEvent.bind(this));
        this.addEventListener('click', this.onClick.bind(this));
    }

    disconnectedCallback() {
        clearTimeout(this._hideTimer);
        clearTimeout(this._showTimer);

        const root = this.getRootNode();
        root.removeEventListener('focusin', this.onAttentionOnTarget.bind(this));
        root.removeEventListener('focusout', this.onAttentionOutTarget.bind(this));
        root.removeEventListener('mouseover', this.onAttentionOnTarget.bind(this));
        root.removeEventListener('mouseout', this.onAttentionOutTarget.bind(this));

        this.removeEventListener('mousedown', this.stopEvent.bind(this));
        this.removeEventListener('mouseup', this.stopEvent.bind(this));
        this.removeEventListener('click', this.onClick.bind(this));

        const button = this.shadowRoot
            ? this.shadowRoot.querySelector('button')
            : null;
        if (button) {
            button.removeEventListener('click', this.toggle.bind(this));
            button.removeEventListener('focusin', this.onAttentionOnButton.bind(this));
            button.removeEventListener('focusout', this.onAttentionOutButton.bind(this));
            button.removeEventListener('mouseover', this.onAttentionOnButton.bind(this));
            button.removeEventListener('mouseleave', this.onAttentionOutButton.bind(this));
        }
    }

    onAttentionOut() {
        this._mouseOver = false;

        const root = this.shadowRoot;
        if (!root) {
            return;
        }
        const tooltip = root.querySelector<TavenemPopoverHTMLElement>('tf-popover');
        if (!tooltip || !tooltip.mouseOver) {
            clearTimeout(this._showTimer);
            this._hideTimer = setTimeout(this.hide.bind(this), 200);
        }
    }

    onPopoverMouseLeave(popover: TavenemPopoverHTMLElement, event: MouseEvent) {
        const root = this.shadowRoot;
        if (root
            && root.contains(popover)
            && (!(event.relatedTarget instanceof Node)
                || !this.contains(event.relatedTarget))) {
            this._mouseOver = false;
        }
        if (popover.matches(':popover-open') && !this._mouseOver) {
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
    }

    showDelayed(element?: Element) {
        const delayStr = this.dataset.delay;
        const delay = delayStr ? parseInt(delayStr) : 0;
        if (delay > 0) {
            clearTimeout(this._showTimer);
            clearTimeout(this._hideTimer);
            this._showTimer = setTimeout(this.show.bind(this, element), delay);
        } else {
            this.show(element);
        }
    }

    toggleVisibility() {
        clearTimeout(this._hideTimer);
        clearTimeout(this._showTimer);
        const root = this.shadowRoot;
        if (!root) {
            return;
        }
        const tooltip = root.querySelector<TavenemPopoverHTMLElement>('tf-popover');
        if (tooltip) {
            tooltip.toggle();
        }
    }

    private hide() {
        clearTimeout(this._hideTimer);
        clearTimeout(this._showTimer);
        this._anchor = null;
        const root = this.shadowRoot;
        if (!root) {
            return;
        }
        const tooltip = root.querySelector<TavenemPopoverHTMLElement>('tf-popover.tooltip');
        if (tooltip) {
            tooltip.hide();
        }
    }

    private onAttentionOn() {
        this._mouseOver = true;
        this.showDelayed();
    }

    private onAttentionOnButton(event: Event) {
        event.stopPropagation();
        this._anchor = event.target instanceof Element ? event.target : null;
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

    private onClick(event: Event) {
        event.stopPropagation();
        if (event.target instanceof Node
            && this.contains(event.target)
            && 'dismissOnTap' in this.dataset) {
            event.preventDefault();
            this.hide();
        }
    }

    private show(element?: Element) {
        clearTimeout(this._hideTimer);
        clearTimeout(this._showTimer);
        const root = this.shadowRoot;
        if (!root) {
            return;
        }
        const tooltip = root.querySelector<TavenemPopoverHTMLElement>('tf-popover');
        if (tooltip) {
            tooltip.anchor = element || this._anchor;
            tooltip.show();
        }
    }

    private stopEvent(event: Event) {
        event.stopPropagation();
    }

    private toggle(event: Event) {
        event.stopPropagation();
        this.toggleVisibility();
    }

    private verifyTarget(event: Event) {
        if (event.target === this) {
            return this;
        }

        if (!(event.target instanceof HTMLElement)
            && !(event.target instanceof SVGElement)) {
            return null;
        }

        if ('tooltipId' in event.target.dataset) {
            return event.target.dataset.tooltipId === this.id
                ? event.target
                : null;
        }

        if ('containerNoTrigger' in this.dataset) {
            return null;
        }

        const target = event.target.closest<HTMLElement | SVGElement>(':has(> tf-tooltip)');
        if (!target) {
            return null;
        }

        const tooltipElement = target.querySelector(':scope > tf-tooltip');
        if (tooltipElement !== this) {
            return null;
        }

        let popover = target.querySelector('[popover]:popover-open');
        if (!popover
            && 'popoverContainer' in target.dataset
            && target.shadowRoot instanceof ShadowRoot) {
            popover = target.shadowRoot.querySelector('[popover]:popover-open');
        }
        if (popover && !this.contains(popover) && !popover.contains(this)) {
            return null;
        }

        return target;
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

    connectedCallback() {
        const shadow = this.attachShadow({ mode: 'open', delegatesFocus: true });

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
        this.addEventListener('mousedown', this.onMouseDown.bind(this));
        this.addEventListener('mouseenter', this.onTriggerMouseEnter.bind(this));
        this.addEventListener('mouseleave', this.onTriggerMouseLeave.bind(this));
        this.addEventListener('mouseup', this.toggle.bind(this));
    }

    disconnectedCallback() {
        clearTimeout(this._hideTimer);
        clearTimeout(this._showTimer);
        this.removeEventListener('contextmenu', this.onContext.bind(this));
        this.removeEventListener('mousedown', this.onMouseDown.bind(this));
        this.removeEventListener('mouseenter', this.onTriggerMouseEnter.bind(this));
        this.removeEventListener('mouseleave', this.onTriggerMouseLeave.bind(this));
        this.removeEventListener('mouseup', this.toggle.bind(this));
    }

    attributeChangedCallback(name: string, oldValue: string | null | undefined, newValue: string | null | undefined) {
        if (name === 'disabled' && newValue) {
            this.close();
        }
    }

    onPopoverMouseLeave() {
        if (this._activation !== MouseEventType.MouseOver) {
            return;
        }

        const popover = this.querySelector<TavenemPopoverHTMLElement>('tf-popover');
        if (popover && popover.matches(':popover-open')) {
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
        const popover = this.querySelector<TavenemPopoverHTMLElement>('tf-popover');
        if (popover) {
            if (popover.matches(':popover-open')) {
                this.closeInner();
            } else {
                this.openInner();
            }
        }
        clearTimeout(this._hideTimer);
        clearTimeout(this._showTimer);
    }

    private close() {
        clearTimeout(this._hideTimer);
        clearTimeout(this._showTimer);
        this._activation = MouseEventType.None;
        this.closeInner();
    }

    private closeInner() {
        this._closed = true;
        const popover = this.querySelector<TavenemPopoverHTMLElement>('tf-popover');
        if (popover) {
            popover.hide();
        }
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

    private onMouseDown() { clearTimeout(this._hideTimer); }

    private open(event?: MouseEvent) {
        clearTimeout(this._hideTimer);
        clearTimeout(this._showTimer);

        if (this._closed
            || this.hasAttribute('disabled')) {
            return;
        }

        if ('openAtPointer' in this.dataset) {
            const popover = this.querySelector<TavenemPopoverHTMLElement>('tf-popover');
            if (popover) {
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
            const popover = this.querySelector<TavenemPopoverHTMLElement>('tf-popover');
            if (popover) {
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

        const popover = this.querySelector<TavenemPopoverHTMLElement>('tf-popover');
        if (popover) {
            TavenemPopover.placePopover(popover);
            popover.show();
        }
    }

    private onTriggerMouseEnter(event: MouseEvent) {
        const popover = this.querySelector<TavenemPopoverHTMLElement>('tf-popover');
        if (!popover || popover.matches(':popover-open')) {
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
        const popover = this.querySelector<TavenemPopoverHTMLElement>('tf-popover');
        if (!popover || !popover.matches(':popover-open')) {
            return;
        }

        this._hideTimer = setTimeout(() => {
            if (this._activation !== MouseEventType.MouseOver) {
                return;
            }

            if (!popover.mouseOver) {
                this.close();
            }
        }, 100);
    }

    private toggle(event?: MouseEvent) {
        const mouseEventType = this.getMouseEvent(event);

        const activationStr = this.dataset.activation;
        const activation = activationStr ? parseInt(activationStr) : 0;
        const correctButton = (activation & mouseEventType) != MouseEventType.None;

        const popover = this.querySelector<TavenemPopoverHTMLElement>('tf-popover');
        if (popover) {
            if (popover.matches(':popover-open')) {
                if (correctButton
                    && 'openAtPointer' in this.dataset) {
                    if (event) {
                        const popoverBounds = popover.getBoundingClientRect();
                        if (event.clientX < popoverBounds.left
                            || event.clientX > popoverBounds.right
                            || event.clientY < popoverBounds.top
                            || event.clientY > popoverBounds.bottom) {
                            this._closed = false;
                            TavenemPopover.placePopover(popover);
                            return;
                        }
                    }
                }
                this.close();
            } else if (!this.hasAttribute('disabled') && correctButton) {
                this.open(event);
            }
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