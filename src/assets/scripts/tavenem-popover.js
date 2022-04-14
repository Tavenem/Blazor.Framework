const flipClassReplacements = {
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
class Popover {
    constructor() {
        this.map = {};
        this.contentObserver = null;
    }
    callback(mutationsList) {
        for (const mutation of mutationsList) {
            if (mutation.type === 'attributes'
                && mutation.target instanceof HTMLElement) {
                const target = mutation.target;
                if (target.classList.contains('flip-onopen') &&
                    target.classList.contains('open') == false) {
                    target.popoverFlipped = null;
                    target.removeAttribute('data-popover-flip');
                }
                this.placePopover(target);
            }
        }
    }
    connect(id, anchorId = null) {
        this.initialize();
        const popoverNode = document.getElementById('popover-' + id);
        if (!popoverNode
            || !popoverNode.offsetParent
            || !(popoverNode.offsetParent instanceof Element)) {
            return;
        }
        popoverNode.anchorId = anchorId;
        this.placePopover(popoverNode);
        const observer = new MutationObserver(this.callback.bind(this));
        observer.observe(popoverNode, { attributeFilter: ['class'] });
        const parentResizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                const target = entry.target;
                for (let i = 0; i < target.childNodes.length; i++) {
                    const childNode = target.childNodes[i];
                    if (childNode instanceof HTMLElement
                        && childNode.id
                        && childNode.id.startsWith('popover-')) {
                        this.placePopover(childNode);
                    }
                }
            }
        });
        parentResizeObserver.observe(popoverNode.offsetParent);
        const resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                let target = entry.target;
                if (target instanceof HTMLElement) {
                    this.placePopover(target);
                }
            }
        });
        resizeObserver.observe(popoverNode);
        let style = getComputedStyle(popoverNode);
        if (style.position != 'fixed') {
            const overflowRegex = /(auto|scroll)/;
            let parent = popoverNode.parentElement;
            while (parent) {
                if (parent.listeningForPopoverScroll) {
                    break;
                }
                style = getComputedStyle(parent);
                if (style.position === 'static') {
                    parent = parent.parentElement;
                    continue;
                }
                if (overflowRegex.test(style.overflow + style.overflowY + style.overflowX)) {
                    parent.addEventListener('scroll', () => {
                        this.placePopoverByClassSelector('flip-always');
                    });
                    parent.listeningForPopoverScroll = true;
                }
                parent = parent.parentElement;
            }
        }
        this.map[id] = {
            anchorId: anchorId,
            mutationObserver: observer,
            parentResizeObserver: parentResizeObserver,
            resizeObserver: resizeObserver,
        };
    }
    disconnect(id) {
        if (this.map[id]) {
            const item = this.map[id];
            item.resizeObserver.disconnect();
            item.mutationObserver.disconnect();
            item.parentResizeObserver.disconnect();
            delete this.map[id];
        }
    }
    dispose() {
        for (let i in this.map) {
            this.disconnect(i);
        }
        if (this.contentObserver) {
            this.contentObserver.disconnect();
            this.contentObserver = null;
        }
    }
    getAllObservedContainers() {
        const result = [];
        for (let i in this.map) {
            result.push(i);
        }
        return result;
    }
    initialize() {
        const mainContent = document.getElementById('main-container');
        if (!mainContent) {
            return;
        }
        if (!mainContent.popoverMark) {
            mainContent.popoverMark = "marked";
            if (this.contentObserver != null) {
                this.contentObserver.disconnect();
                this.contentObserver = null;
            }
            this.contentObserver = new ResizeObserver(entries => {
                this.placePopoverByClassSelector();
            });
            this.contentObserver.observe(mainContent);
        }
    }
    placePopoverByClassSelector(classSelector = null) {
        var items = this.getAllObservedContainers();
        for (let i = 0; i < items.length; i++) {
            const popoverNode = document.getElementById('popover-' + items[i]);
            if (popoverNode) {
                this.placePopover(popoverNode, classSelector);
            }
        }
    }
    setOffset(id, offsetX, offsetY) {
        const popoverNode = document.getElementById('popover-' + id);
        if (popoverNode && popoverNode.offsetParent) {
            const boundingRect = popoverNode.offsetParent.getBoundingClientRect();
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
    }
    calculatePopoverPosition(list, boundingRect, anchorOffsetLeft, anchorOffsetTop, selfRect) {
        let top = anchorOffsetLeft;
        let left = anchorOffsetTop;
        if (list.indexOf('anchor-top-left') >= 0) {
            left = anchorOffsetLeft;
            top = anchorOffsetTop;
        }
        else if (list.indexOf('anchor-top-center') >= 0) {
            left = anchorOffsetLeft + boundingRect.width / 2;
            top = anchorOffsetTop;
        }
        else if (list.indexOf('anchor-top-right') >= 0) {
            left = anchorOffsetLeft + boundingRect.width;
            top = anchorOffsetTop;
        }
        else if (list.indexOf('anchor-center-left') >= 0) {
            left = anchorOffsetLeft;
            top = anchorOffsetTop + boundingRect.height / 2;
        }
        else if (list.indexOf('anchor-center-center') >= 0) {
            left = anchorOffsetLeft + boundingRect.width / 2;
            top = anchorOffsetTop + boundingRect.height / 2;
        }
        else if (list.indexOf('anchor-center-right') >= 0) {
            left = anchorOffsetLeft + boundingRect.width;
            top = anchorOffsetTop + boundingRect.height / 2;
        }
        else if (list.indexOf('anchor-bottom-left') >= 0) {
            left = anchorOffsetLeft;
            top = anchorOffsetTop + boundingRect.height;
        }
        else if (list.indexOf('anchor-bottom-center') >= 0) {
            left = anchorOffsetLeft + boundingRect.width / 2;
            top = anchorOffsetTop + boundingRect.height;
        }
        else if (list.indexOf('anchor-bottom-right') >= 0) {
            left = anchorOffsetLeft + boundingRect.width;
            top = anchorOffsetTop + boundingRect.height;
        }
        let offsetX = 0;
        let offsetY = 0;
        if (list.indexOf('top-left') >= 0) {
            offsetX = 0;
            offsetY = 0;
        }
        else if (list.indexOf('top-center') >= 0) {
            offsetX = -selfRect.width / 2;
            offsetY = 0;
        }
        else if (list.indexOf('top-right') >= 0) {
            offsetX = -selfRect.width;
            offsetY = 0;
        }
        else if (list.indexOf('center-left') >= 0) {
            offsetX = 0;
            offsetY = -selfRect.height / 2;
        }
        else if (list.indexOf('center-center') >= 0) {
            offsetX = -selfRect.width / 2;
            offsetY = -selfRect.height / 2;
        }
        else if (list.indexOf('center-right') >= 0) {
            offsetX = -selfRect.width;
            offsetY = -selfRect.height / 2;
        }
        else if (list.indexOf('bottom-left') >= 0) {
            offsetX = 0;
            offsetY = -selfRect.height;
        }
        else if (list.indexOf('bottom-center') >= 0) {
            offsetX = -selfRect.width / 2;
            offsetY = -selfRect.height;
        }
        else if (list.indexOf('bottom-right') >= 0) {
            offsetX = -selfRect.width;
            offsetY = -selfRect.height;
        }
        return {
            top: top, left: left, offsetX: offsetX, offsetY: offsetY
        };
    }
    getPositionForFlippedPopver(inputArray, selector, boundingRect, anchorOffsetLeft, anchorOffsetTop, selfRect) {
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
        return this.calculatePopoverPosition(classList, boundingRect, anchorOffsetLeft, anchorOffsetTop, selfRect);
    }
    placePopover(popoverNode, classSelector = null) {
        if (!popoverNode
            || !popoverNode.classList.contains('open')
            || !popoverNode.offsetParent
            || !(popoverNode.offsetParent instanceof HTMLElement)) {
            return;
        }
        if (classSelector
            && !popoverNode.classList.contains(classSelector)) {
            return;
        }
        const anchorElementId = popoverNode.anchorId;
        let anchorElement = anchorElementId ? document.getElementById(anchorElementId) : null;
        let anchorOffsetLeft = 0;
        let anchorOffsetTop = 0;
        if (anchorElement) {
            if (anchorElement.offsetParent != popoverNode.offsetParent) {
                anchorElement = null;
            }
            else {
                anchorOffsetLeft = anchorElement.offsetLeft;
                anchorOffsetTop = anchorElement.offsetTop;
            }
        }
        const boundingRect = popoverNode.offsetParent.getBoundingClientRect();
        const anchorBoundingRect = anchorElement
            ? anchorElement.getBoundingClientRect()
            : boundingRect;
        if (popoverNode.classList.contains('match-width')) {
            popoverNode.style.width = anchorBoundingRect.width + 'px';
            popoverNode.style.minWidth = anchorBoundingRect.width + 'px';
            popoverNode.style.maxWidth = anchorBoundingRect.width + 'px';
        }
        else if (popoverNode.classList.contains('limit-width')) {
            popoverNode.style.maxWidth = anchorBoundingRect.width + 'px';
        }
        const selfRect = popoverNode.getBoundingClientRect();
        const classList = popoverNode.classList;
        const classListArray = Array.from(popoverNode.classList);
        const postion = this.calculatePopoverPosition(classListArray, anchorBoundingRect, anchorOffsetLeft, anchorOffsetTop, selfRect);
        let left = postion.left;
        let top = postion.top;
        let offsetX = postion.offsetX;
        let offsetY = postion.offsetY;
        if (classList.contains('flip-onopen')
            || classList.contains('flip-always')) {
            const appBarElements = document.getElementsByClassName('appbar');
            const appBarArray = Array.from(appBarElements);
            const topAppBar = appBarArray.find((v) => { v.classList.contains('top'); });
            let topAppBarOffset = 0;
            if (topAppBar) {
                topAppBarOffset = topAppBar.getBoundingClientRect().height;
            }
            const bottomAppBar = appBarArray.find((v) => { v.classList.contains('bottom'); });
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
            let selector = popoverNode.popoverFlipped;
            if (!selector) {
                if (classList.contains('top-left')) {
                    if (deltaBottom < 0 && deltaToRight < 0 && spaceToTop >= selfRect.height && deltaToLeft >= selfRect.width) {
                        selector = 'top-and-left';
                    }
                    else if (deltaBottom < 0 && spaceToTop >= selfRect.height) {
                        selector = 'top';
                    }
                    else if (deltaToRight < 0 && deltaToLeft >= selfRect.width) {
                        selector = 'left';
                    }
                }
                else if (classList.contains('top-center')) {
                    if (deltaBottom < 0 && spaceToTop >= selfRect.height) {
                        selector = 'top';
                    }
                }
                else if (classList.contains('top-right')) {
                    if (deltaBottom < 0 && deltaToLeft < 0 && spaceToTop >= selfRect.height && deltaToRight >= selfRect.width) {
                        selector = 'top-and-right';
                    }
                    else if (deltaBottom < 0 && spaceToTop >= selfRect.height) {
                        selector = 'top';
                    }
                    else if (deltaToLeft < 0 && deltaToRight >= selfRect.width) {
                        selector = 'right';
                    }
                }
                else if (classList.contains('center-left')) {
                    if (deltaToRight < 0 && deltaToLeft >= selfRect.width) {
                        selector = 'left';
                    }
                }
                else if (classList.contains('center-right')) {
                    if (deltaToLeft < 0 && deltaToRight >= selfRect.width) {
                        selector = 'right';
                    }
                }
                else if (classList.contains('bottom-left')) {
                    if (deltaTop < 0 && deltaToRight < 0 && deltaBottom >= 0 && deltaToLeft >= selfRect.width) {
                        selector = 'bottom-and-left';
                    }
                    else if (deltaTop < 0 && deltaBottom >= 0) {
                        selector = 'bottom';
                    }
                    else if (deltaToRight < 0 && deltaToLeft >= selfRect.width) {
                        selector = 'left';
                    }
                }
                else if (classList.contains('bottom-center')) {
                    if (deltaTop < 0 && deltaBottom >= 0) {
                        selector = 'bottom';
                    }
                }
                else if (classList.contains('bottom-right')) {
                    if (deltaTop < 0 && deltaToLeft < 0 && deltaBottom >= 0 && deltaToRight >= selfRect.width) {
                        selector = 'bottom-and-right';
                    }
                    else if (deltaTop < 0 && deltaBottom >= 0) {
                        selector = 'bottom';
                    }
                    else if (deltaToLeft < 0 && deltaToRight >= selfRect.width) {
                        selector = 'right';
                    }
                }
            }
            if (selector && selector != 'none') {
                const newPosition = this.getPositionForFlippedPopver(classListArray, selector, anchorBoundingRect, anchorOffsetLeft, anchorOffsetTop, selfRect);
                left = newPosition.left;
                top = newPosition.top;
                offsetX = newPosition.offsetX;
                offsetY = newPosition.offsetY;
                popoverNode.setAttribute('data-popover-flip', 'flipped');
            }
            else {
                popoverNode.removeAttribute('data-popover-flip');
            }
            if (classList.contains('flip-onopen')
                && !popoverNode.popoverFlipped) {
                popoverNode.popoverFlipped = selector || 'none';
            }
        }
        if (window.getComputedStyle(popoverNode).position == 'fixed') {
            offsetX += boundingRect.left;
            offsetY += boundingRect.top;
        }
        if (popoverNode.offsetX) {
            offsetX += popoverNode.offsetX - boundingRect.left;
        }
        if (popoverNode.offsetY) {
            offsetY += popoverNode.offsetY - boundingRect.top;
        }
        popoverNode.style.left = (left + offsetX) + 'px';
        popoverNode.style.top = (top + offsetY) + 'px';
    }
}
const popover = new Popover();
export function popoverConnect(id, anchorId) {
    popover.connect(id, anchorId);
}
export function popoverDisconnect(id) {
    popover.disconnect(id);
}
export function popoverDispose() {
    popover.dispose();
}
export function popoverInitialize() {
    popover.initialize();
}
export function setPopoverOffset(id, offsetX, offsetY) {
    popover.setOffset(id, offsetX, offsetY);
}
window.addEventListener('resize', () => {
    popover.placePopoverByClassSelector();
});
//# sourceMappingURL=tavenem-popover.js.map