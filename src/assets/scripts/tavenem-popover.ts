﻿interface IPopoverPosition {
    left: number;
    offsetX: number;
    offsetY: number;
    top: number;
}

interface IPopoverScroller extends HTMLElement {
    listeningForPopoverScroll?: boolean | undefined | null;
}

interface IPopoverElement extends HTMLElement {
    anchorId?: string | null;
    offsetX?: number;
    offsetY?: number;
    parent?: HTMLElement | null;
    popoverFlipped?: string | null;
    popoverMark?: string;
}

interface IPopoverMapItem {
    anchorId: string | null;
    mutationObserver: MutationObserver;
    parentResizeObserver: ResizeObserver;
    resizeObserver: ResizeObserver;
}

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
const map: Record<string, IPopoverMapItem> = {};

let contentObserver: ResizeObserver | null = null;

export function popoverConnect(id: string, anchorId: string | null) {
    popoverInitialize();

    const popoverNode = document.getElementById('popover-' + id) as IPopoverElement;
    if (!popoverNode) {
        return;
    }

    popoverNode.anchorId = anchorId;
    const anchor = anchorId ? document.getElementById(anchorId) : null;

    let containingParent = anchor
        ? anchor.parentElement
        : popoverNode.parentElement;
    while (containingParent
        && (!containingParent.contains(popoverNode)
            || getComputedStyle(containingParent).position == 'static')) {
        containingParent = containingParent.parentElement;
    }
    if (!containingParent) {
        return;
    }
    popoverNode.parent = containingParent;

    placePopover(popoverNode);

    const observer = new MutationObserver(callback);
    observer.observe(
        popoverNode,
        { attributeFilter: ['class'] });

    const parentResizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
            const target = entry.target;

            for (let i = 0; i < target.childNodes.length; i++) {
                const childNode = target.childNodes[i];
                if (childNode instanceof HTMLElement
                    && childNode.id
                    && childNode.id.startsWith('popover-')) {
                    placePopover(childNode);
                }
            }
        }
    });
    parentResizeObserver.observe(containingParent);

    const resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
            let target = entry.target;
            if (target instanceof HTMLElement) {
                placePopover(target);
            }
        }
    });
    resizeObserver.observe(popoverNode);

    let style = getComputedStyle(popoverNode);
    const overflowRegex = /(auto|scroll)/;
    let parent = popoverNode.parentElement as IPopoverScroller;
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
            parent.addEventListener('scroll', () => {
                placePopovers();
            });
            parent.listeningForPopoverScroll = true;
        }
        parent = parent.parentElement as IPopoverScroller;
    }

    map[id] = {
        anchorId: anchorId,
        mutationObserver: observer,
        parentResizeObserver: parentResizeObserver,
        resizeObserver: resizeObserver,
    };
}

export function popoverDisconnect(id: string) {
    const item = map[id];
    if (item) {
        item.resizeObserver.disconnect();
        item.mutationObserver.disconnect();
        item.parentResizeObserver.disconnect();
        delete map[id];
    }
}

export function popoverDispose() {
    for (const i in map) {
        popoverDisconnect(i);
    }

    if (contentObserver) {
        contentObserver.disconnect();
        contentObserver = null;
    }
}

export function popoverInitialize() {
    const mainContent = document.getElementById('main-container') as IPopoverElement;
    if (!mainContent) {
        return;
    }

    if (!mainContent.popoverMark) {
        mainContent.popoverMark = "marked";
        if (contentObserver != null) {
            contentObserver.disconnect();
            contentObserver = null;
        }

        contentObserver = new ResizeObserver(entries => {
            placePopovers();
        });

        contentObserver.observe(mainContent);
    }
}

export function setPopoverOffset(id: string, offsetX: number | null, offsetY: number | null) {
    const popoverNode = document.getElementById('popover-' + id) as IPopoverElement;
    if (!popoverNode
        || !popoverNode.parent) {
        return;
    }
    const boundingRect = popoverNode.parent.getBoundingClientRect();

    const prevX = popoverNode.offsetX;
    const prevY = popoverNode.offsetY;

    popoverNode.offsetX = offsetX ? offsetX : undefined;
    popoverNode.offsetY = offsetY ? offsetY : undefined;

    if (prevX || popoverNode.offsetX) {
        let left = 0;
        if (popoverNode.style.left) {
            left = Number.parseFloat(popoverNode.style.left.substr(0, popoverNode.style.left.length - 2));
        }
        if (prevX || prevX === 0) {
            left -= prevX - boundingRect.left;
        }
        if (popoverNode.offsetX || popoverNode.offsetX === 0) {
            left += popoverNode.offsetX - boundingRect.left;
        }
        popoverNode.style.left = +left.toFixed(2) + 'px';
    }

    if (prevY || popoverNode.offsetY) {
        let top = 0;
        if (popoverNode.style.top) {
            top = Number.parseFloat(popoverNode.style.top.substr(0, popoverNode.style.top.length - 2));
        }
        if (prevY || prevY === 0) {
            top -= prevY - boundingRect.top;
        }
        if (popoverNode.offsetY || popoverNode.offsetY === 0) {
            top += popoverNode.offsetY - boundingRect.top;
        }
        popoverNode.style.top = +top.toFixed(2) + 'px';
    }
}

function calculatePopoverPosition(
    list: string[],
    boundingRect: DOMRect,
    anchorOffsetLeft: number,
    anchorOffsetTop: number,
    selfRect: DOMRect): IPopoverPosition {
    let top = anchorOffsetLeft;
    let left = anchorOffsetTop;
    if (list.indexOf('anchor-top-left') >= 0) {
        left = anchorOffsetLeft;
        top = anchorOffsetTop;
    } else if (list.indexOf('anchor-top-center') >= 0) {
        left = anchorOffsetLeft + boundingRect.width / 2;
        top = anchorOffsetTop;
    } else if (list.indexOf('anchor-top-right') >= 0) {
        left = anchorOffsetLeft + boundingRect.width;
        top = anchorOffsetTop;
    } else if (list.indexOf('anchor-center-left') >= 0) {
        left = anchorOffsetLeft;
        top = anchorOffsetTop + boundingRect.height / 2;
    } else if (list.indexOf('anchor-center-center') >= 0) {
        left = anchorOffsetLeft + boundingRect.width / 2;
        top = anchorOffsetTop + boundingRect.height / 2;
    } else if (list.indexOf('anchor-center-right') >= 0) {
        left = anchorOffsetLeft + boundingRect.width;
        top = anchorOffsetTop + boundingRect.height / 2;
    } else if (list.indexOf('anchor-bottom-left') >= 0) {
        left = anchorOffsetLeft;
        top = anchorOffsetTop + boundingRect.height;
    } else if (list.indexOf('anchor-bottom-center') >= 0) {
        left = anchorOffsetLeft + boundingRect.width / 2;
        top = anchorOffsetTop + boundingRect.height;
    } else if (list.indexOf('anchor-bottom-right') >= 0) {
        left = anchorOffsetLeft + boundingRect.width;
        top = anchorOffsetTop + boundingRect.height;
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

function callback(mutationsList: MutationRecord[]): void {
    for (const mutation of mutationsList) {
        if (mutation.type === 'attributes'
            && mutation.target instanceof HTMLElement) {
            const target = mutation.target as IPopoverElement;
            if (target.classList.contains('flip-onopen') &&
                target.classList.contains('open') == false) {
                target.popoverFlipped = null;
                target.removeAttribute('data-popover-flip');
            }

            placePopover(target);
        }
    }
}

function getAllObservedContainers(): string[] {
    const result = [];
    for (const i in map) {
        result.push(i);
    }
    return result;
}

function getPositionForFlippedPopver(
    inputArray: string[],
    selector: string,
    boundingRect: DOMRect,
    anchorOffsetLeft: number,
    anchorOffsetTop: number,
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
        anchorOffsetLeft,
        anchorOffsetTop,
        selfRect);
}

function placePopover(popoverNode: IPopoverElement): void {
    if (!popoverNode
        || !popoverNode.classList.contains('open')
        || !popoverNode.parent) {
        return;
    }

    const anchorElementId = popoverNode.anchorId;
    let anchorElement = anchorElementId ? document.getElementById(anchorElementId) : null;
    let anchorOffsetLeft = 0;
    let anchorOffsetTop = 0;
    if (anchorElement) {
        if (anchorElement.offsetParent != popoverNode.parent) {
            anchorElement = null;
        } else {
            anchorOffsetLeft = anchorElement.offsetLeft;
            anchorOffsetTop = anchorElement.offsetTop;
        }
    }

    const boundingRect = popoverNode.parent.getBoundingClientRect();
    const anchorBoundingRect = anchorElement
        ? anchorElement.getBoundingClientRect()
        : boundingRect;

    if (popoverNode.classList.contains('match-width')) {
        popoverNode.style.width = anchorBoundingRect.width + 'px';
        popoverNode.style.minWidth = anchorBoundingRect.width + 'px';
        popoverNode.style.maxWidth = anchorBoundingRect.width + 'px';
    } else if (popoverNode.classList.contains('limit-width')) {
        popoverNode.style.maxWidth = anchorBoundingRect.width + 'px';
    }

    const selfRect = popoverNode.getBoundingClientRect();
    const classList = popoverNode.classList;
    const classListArray = Array.from(popoverNode.classList);

    const postion = calculatePopoverPosition(
        classListArray,
        anchorBoundingRect,
        anchorOffsetLeft,
        anchorOffsetTop,
        selfRect);
    let left = postion.left;
    let top = postion.top;
    let offsetX = postion.offsetX;
    let offsetY = postion.offsetY;

    if (classList.contains('flip-onopen')
        || classList.contains('flip-always')) {
        const appBarElements = document.getElementsByClassName('appbar');
        const appBarArray = Array.from(appBarElements);

        const topAppBar = appBarArray.find((v) => { v.classList.contains('top') });
        let topAppBarOffset = 0;
        if (topAppBar) {
            topAppBarOffset = topAppBar.getBoundingClientRect().height;
        }

        const bottomAppBar = appBarArray.find((v) => { v.classList.contains('bottom') });
        let bottomAppBarOffset = 0;
        if (bottomAppBar) {
            bottomAppBarOffset = bottomAppBar.getBoundingClientRect().height;
        }

        const absLeft = boundingRect.left + left;
        const absTop = boundingRect.top + top;
        const deltaToLeft = absLeft + offsetX;
        const deltaToRight = window.innerWidth - absLeft - selfRect.width;
        const deltaTop = absTop - selfRect.height - topAppBarOffset;
        const spaceToTop = absTop - topAppBarOffset;
        const deltaBottom = window.innerHeight - bottomAppBarOffset - absTop - selfRect.height;

        let selector = popoverNode.popoverFlipped as string;

        if (!selector) {
            if (classList.contains('top-left')) {
                if (deltaBottom < 0 && deltaToRight < 0 && spaceToTop >= selfRect.height && deltaToLeft >= selfRect.width) {
                    selector = 'top-and-left';
                } else if (deltaBottom < 0 && spaceToTop >= selfRect.height) {
                    selector = 'top';
                } else if (deltaToRight < 0 && deltaToLeft >= selfRect.width) {
                    selector = 'left';
                }
            } else if (classList.contains('top-center')) {
                if (deltaBottom < 0 && spaceToTop >= selfRect.height) {
                    selector = 'top';
                }
            } else if (classList.contains('top-right')) {
                if (deltaBottom < 0 && deltaToLeft < 0 && spaceToTop >= selfRect.height && deltaToRight >= selfRect.width) {
                    selector = 'top-and-right';
                } else if (deltaBottom < 0 && spaceToTop >= selfRect.height) {
                    selector = 'top';
                } else if (deltaToLeft < 0 && deltaToRight >= selfRect.width) {
                    selector = 'right';
                }
            } else if (classList.contains('center-left')) {
                if (deltaToRight < 0 && deltaToLeft >= selfRect.width) {
                    selector = 'left';
                }
            } else if (classList.contains('center-right')) {
                if (deltaToLeft < 0 && deltaToRight >= selfRect.width) {
                    selector = 'right';
                }
            } else if (classList.contains('bottom-left')) {
                if (deltaTop < 0 && deltaToRight < 0 && deltaBottom >= 0 && deltaToLeft >= selfRect.width) {
                    selector = 'bottom-and-left';
                } else if (deltaTop < 0 && deltaBottom >= 0) {
                    selector = 'bottom';
                } else if (deltaToRight < 0 && deltaToLeft >= selfRect.width) {
                    selector = 'left';
                }
            } else if (classList.contains('bottom-center')) {
                if (deltaTop < 0 && deltaBottom >= 0) {
                    selector = 'bottom';
                }
            } else if (classList.contains('bottom-right')) {
                if (deltaTop < 0 && deltaToLeft < 0 && deltaBottom >= 0 && deltaToRight >= selfRect.width) {
                    selector = 'bottom-and-right';
                } else if (deltaTop < 0 && deltaBottom >= 0) {
                    selector = 'bottom';
                } else if (deltaToLeft < 0 && deltaToRight >= selfRect.width) {
                    selector = 'right';
                }
            }
        }

        if (selector && selector != 'none') {
            const newPosition = getPositionForFlippedPopver(
                classListArray,
                selector,
                anchorBoundingRect,
                anchorOffsetLeft,
                anchorOffsetTop,
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
            && !popoverNode.popoverFlipped) {
            popoverNode.popoverFlipped = selector || 'none';
        }
    }

    offsetX += boundingRect.left;
    offsetY += boundingRect.top;

    if (popoverNode.offsetX) {
        offsetX += popoverNode.offsetX - boundingRect.left;
    }
    if (popoverNode.offsetY) {
        offsetY += popoverNode.offsetY - boundingRect.top;
    }
    popoverNode.style.left = (left + offsetX) + 'px';
    popoverNode.style.top = (top + offsetY) + 'px';
}

function placePopovers(): void {
    var items = getAllObservedContainers();

    for (let i = 0; i < items.length; i++) {
        const popoverNode = document.getElementById('popover-' + items[i]);
        if (popoverNode) {
            placePopover(popoverNode);
        }
    }
}

window.addEventListener('resize', () => {
    placePopovers();
});