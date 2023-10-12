interface IPopover extends Element {
    focusTimer?: number;
}

interface IPopoverPosition {
    left: number;
    offsetX: number;
    offsetY: number;
    top: number;
}

interface IPopoverScroller extends HTMLElement {
    listeningForPopoverScroll?: boolean | undefined | null;
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
    const focusLostEvent = new Event('focuslost', { bubbles: true });
    //const map: Record<string, IPopoverMapItem> = {};
    const resizeObserver = new ResizeObserver(function () {
        placePopovers();
    });

    export function getPopoverParent(popover: Element) {
        const anchorId = popover.getAttribute('anchor-id');
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
        window.addEventListener('resize', () => {
            placePopovers();
        });
    }

    export function placePopover(popoverNode: Element): void {
        if (!popoverNode
            || !(popoverNode instanceof HTMLElement)
            || !popoverNode.classList.contains('open')) {
            return;
        }

        const offsetParent = getOffsetParent(popoverNode);
        const offsetBoundingRect = offsetParent.getBoundingClientRect();

        const anchorElementId = popoverNode.getAttribute('anchor-id');
        const anchorElement = anchorElementId
            ? document.getElementById(anchorElementId)
            : null;
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

        const positionXStr = popoverNode.getAttribute('position-x');
        const positionX = positionXStr ? parseFloat(positionXStr) : undefined;
        const positionYStr = popoverNode.getAttribute('position-y');
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

            const originalFlipSelector = popoverNode.getAttribute('popover-flipped');
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
                popoverNode.setAttribute('data-popover-flip', 'flipped');
            } else {
                popoverNode.removeAttribute('data-popover-flip');
            }

            if (classList.contains('flip-onopen')
                && !originalFlipSelector) {
                popoverNode.setAttribute('popover-flipped', flipSelector || 'none');
            }
        }

        if (positionX && positionY) {
            offsetX += positionX;
            offsetY += positionY;
        } else {
            offsetX += boundingRect.left - offsetBoundingRect.left;
            offsetY += boundingRect.top - offsetBoundingRect.top;
        }

        const offsetXStr = popoverNode.getAttribute('offset-x');
        const popoverOffsetX = offsetXStr ? parseFloat(offsetXStr) : undefined;
        if (popoverOffsetX) {
            offsetX += popoverOffsetX;
        }

        const offsetYStr = popoverNode.getAttribute('offset-y');
        const popoverOffsetY = offsetYStr ? parseFloat(offsetYStr) : undefined;
        if (popoverOffsetY) {
            offsetY += popoverOffsetY;
        }

        popoverNode.style.left = (left + offsetX) + 'px';
        popoverNode.style.top = (top + offsetY) + 'px';
    }

    export function placePopovers(): void {
        for (const popover of document.getElementsByTagName('tf-popover')) {
            placePopover(popover);
        }
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
                    const focusId = popover.getAttribute('focus-id');
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
                    const focusId = childPopover.getAttribute('focus-id');
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
                popover.dispatchEvent(focusLostEvent);
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

export class TavenemHTMLPopoverElement extends HTMLElement {
    _mutationObserver: MutationObserver;
    _parentResizeObserver: ResizeObserver;
    _resizeObserver: ResizeObserver;

    constructor() {
        super();

        this._mutationObserver = new MutationObserver(mutations => {
            for (const mutation of mutations) {
                if (mutation.type === 'attributes'
                    && mutation.target instanceof HTMLElement) {
                    if (mutation.target.classList.contains('flip-onopen') &&
                        mutation.target.classList.contains('open') == false) {
                        mutation.target.removeAttribute('popover-flipped');
                        mutation.target.removeAttribute('data-popover-flip');
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

    static get observedAttributes() {
        return ['offset-x', 'offset-y', 'position-x', 'position-y'];
    }

    connectedCallback() {
        const containingParent = TavenemPopover.getPopoverParent(this);
        if (!containingParent) {
            return;
        }

        this.addEventListener('click', this.cancelFocusLoss.bind(this));
        this.addEventListener('touchstart', this.cancelFocusLoss.bind(this));
        this.addEventListener('contextmenu', this.cancelFocusLoss.bind(this));

        TavenemPopover.placePopover(this);

        this._mutationObserver.observe(this, { attributeFilter: ['class'] });

        this._parentResizeObserver.observe(containingParent);
        this._resizeObserver.observe(this);

        let style: CSSStyleDeclaration;
        const overflowRegex = /(auto|scroll)/;
        let parent = this.parentElement as IPopoverScroller;
        while (parent) {
            if (parent.listeningForPopoverScroll) {
                break;
            }
            style = getComputedStyle(parent);
            if (style.position === 'static') {
                parent = parent.parentElement as IPopoverScroller;
                continue;
            }
            if (overflowRegex.test(style.overflow + style.overflowY + style.overflowX)) {
                parent.addEventListener('scroll', TavenemPopover.placePopovers);
                parent.listeningForPopoverScroll = true;
            }
            parent = parent.parentElement as IPopoverScroller;
        }
    }

    disconnectedCallback() {
        this.removeEventListener('click', this.cancelFocusLoss.bind(this));
        this.removeEventListener('touchstart', this.cancelFocusLoss.bind(this));
        this.removeEventListener('contextmenu', this.cancelFocusLoss.bind(this));
        this._mutationObserver.disconnect();
        this._parentResizeObserver.disconnect();
        this._resizeObserver.disconnect();
    }

    attributeChangedCallback(name: string, oldValue: string | null | undefined, newValue: string | null | undefined) {
        if (name === 'offset-x') {
            this.changeOffsetX(oldValue, newValue);
        } else if (name === 'offset-y') {
            this.changeOffsetY(oldValue, newValue);
        } else if (name === 'position-x') {
            this.changePositionX(newValue);
        } else if (name === 'position-y') {
            this.changePositionY(newValue);
        }
    }

    cancelFocusLoss(e: Event) {
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

    changeOffsetX(oldValue: string | null | undefined, newValue: string | null | undefined) {
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

    changeOffsetY(oldValue: string | null | undefined, newValue: string | null | undefined) {
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

    changePositionX(newValue: string | null | undefined) {
        const positionX = newValue ? parseFloat(newValue) : undefined;
        if (positionX) {
            this.style.left = positionX.toFixed(2) + 'px';
        }
    }

    changePositionY(newValue: string | null | undefined) {
        const positionY = newValue ? parseFloat(newValue) : undefined;
        if (positionY) {
            this.style.top = positionY.toFixed(2) + 'px';
        }
    }
}