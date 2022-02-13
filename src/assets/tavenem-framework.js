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
                window.tavenem.framework.popoverHelper.placePopover(target);
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
        window.tavenem.framework.popoverHelper.placePopover(popoverNode);
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
                        window.tavenem.framework.popoverHelper.placePopover(childNode);
                    }
                }
            }
        });
        parentResizeObserver.observe(popoverNode.offsetParent);
        const resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                let target = entry.target;
                if (target instanceof HTMLElement) {
                    window.tavenem.framework.popoverHelper.placePopover(target);
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
                        window.tavenem.framework.popoverHelper.placePopoverByClassSelector('flip-always');
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
                window.tavenem.framework.popoverHelper.placePopoverByClassSelector();
            });
            this.contentObserver.observe(mainContent);
        }
    }
}
const whitespaceRegExp = new RegExp("\\s", "g");
class KeyListener {
    constructor(dotNetRef, options) {
        this._keyOptions = {};
        this._observedChildren = [];
        this._regexOptions = [];
        this._dotNetRef = dotNetRef;
        this._options = options;
    }
    connect(element) {
        if (!this._options) {
            return;
        }
        if (!this._options.keys) {
            throw "_options.keys: array of IKeyOptions expected";
        }
        if (!this._options.class) {
            throw "_options.class: CSS class name expected";
        }
        if (this._observer) {
            return;
        }
        this._element = element;
        this._observer = (new MutationObserver(this.onDomChanged));
        this._observer.keyListener = this;
        this._observer.observe(this._element, { attributes: false, childList: true, subtree: true });
        this._observedChildren = [];
        this._keyOptions = {};
        this._regexOptions = [];
        for (const keyOption of this._options.keys) {
            if (!keyOption || !keyOption.key) {
                continue;
            }
            this.setKeyOption(keyOption);
        }
        for (const child of this._element.getElementsByClassName(this._options.class)) {
            this.attachHandlers(child);
        }
    }
    disconnect() {
        if (!this._observer) {
            return;
        }
        this._observer.disconnect();
        this._observer = null;
        if (this._observedChildren) {
            for (const child of this._observedChildren) {
                this.detachHandlers(child);
            }
        }
    }
    setKeyOption(keyOption) {
        if (keyOption.key.length > 2 && keyOption.key.startsWith('/') && keyOption.key.endsWith('/')) {
            keyOption.regex = new RegExp(keyOption.key.substring(1, keyOption.key.length - 1));
            this._regexOptions.push(keyOption);
        }
        else {
            this._keyOptions[keyOption.key.toLowerCase()] = keyOption;
        }
        keyOption.preventDown = (keyOption.preventDown || "none").replace(whitespaceRegExp, "").toLowerCase();
        keyOption.preventUp = (keyOption.preventUp || "none").replace(whitespaceRegExp, "").toLowerCase();
        keyOption.stopDown = (keyOption.stopDown || "none").replace(whitespaceRegExp, "").toLowerCase();
        keyOption.stopUp = (keyOption.stopUp || "none").replace(whitespaceRegExp, "").toLowerCase();
    }
    attachHandlers(child) {
        if (this._observedChildren
            && this._observedChildren.indexOf(child) > -1) {
            return;
        }
        child.keyListener = this;
        child.addEventListener('keydown', this.onKeyDown);
        child.addEventListener('keyup', this.onKeyUp);
        this._observedChildren.push(child);
    }
    detachHandlers(child) {
        child.removeEventListener('keydown', this.onKeyDown);
        child.removeEventListener('keyup', this.onKeyUp);
        this._observedChildren = this._observedChildren.filter(x => x !== child);
    }
    matchesKeyCombination(option, args) {
        if (!option || option === "none") {
            return false;
        }
        if (option === "any") {
            return true;
        }
        var shift = args.shiftKey;
        var ctrl = args.ctrlKey;
        var alt = args.altKey;
        var meta = args.metaKey;
        var any = shift || ctrl || alt || meta;
        if (any && option === "key+any") {
            return true;
        }
        if (!any && option.includes("key+none")) {
            return true;
        }
        if (!any) {
            return false;
        }
        return option.includes(`key${shift ? "+shift" : ""}${ctrl ? "+ctrl" : ""}${alt ? "+alt" : ""}${meta ? "+meta" : ""}`);
    }
    onDomChanged(mutationsList) {
        var self = this.keyListener;
        if (!self) {
            return;
        }
        const targetClass = self._options.class;
        if (!targetClass) {
            return;
        }
        for (const mutation of mutationsList) {
            for (const element of mutation.addedNodes) {
                if (element instanceof Element
                    && element.classList
                    && element.classList.contains(targetClass)) {
                    self.attachHandlers(element);
                }
            }
            for (const element of mutation.removedNodes) {
                if (element instanceof Element
                    && element.classList
                    && element.classList.contains(targetClass)) {
                    self.detachHandlers(element);
                }
            }
        }
    }
    onKeyDown(args) {
        var self = this.keyListener;
        if (!self) {
            return;
        }
        if (!(args instanceof KeyboardEvent)) {
            return;
        }
        const key = args.key.toLowerCase();
        let invoke = false;
        if (self._keyOptions.hasOwnProperty(key)) {
            const keyOptions = self._keyOptions[key];
            self.processKeyDown(args, keyOptions);
            if (keyOptions.subscribeDown) {
                invoke = true;
            }
        }
        for (const keyOptions of self._regexOptions) {
            if (keyOptions.regex && keyOptions.regex.test(key)) {
                self.processKeyDown(args, keyOptions);
                if (keyOptions.subscribeDown) {
                    invoke = true;
                }
            }
        }
        if (invoke) {
            const eventArgs = self.toKeyboardEventArgs(args);
            eventArgs.Type = "keydown";
            self._dotNetRef.invokeMethodAsync('OnKeyDown', eventArgs);
        }
    }
    onKeyUp(args) {
        var self = this.keyListener;
        if (!self) {
            return;
        }
        if (!(args instanceof KeyboardEvent)) {
            return;
        }
        const key = args.key.toLowerCase();
        let invoke = false;
        if (self._keyOptions.hasOwnProperty(key)) {
            const keyOptions = self._keyOptions[key];
            self.processKeyUp(args, keyOptions);
            if (keyOptions.subscribeUp) {
                invoke = true;
            }
        }
        for (const keyOptions of self._regexOptions) {
            if (keyOptions.regex && keyOptions.regex.test(key)) {
                self.processKeyUp(args, keyOptions);
                if (keyOptions.subscribeUp) {
                    invoke = true;
                }
            }
        }
        if (invoke) {
            const eventArgs = self.toKeyboardEventArgs(args);
            eventArgs.Type = "keyup";
            self._dotNetRef.invokeMethodAsync('OnKeyUp', eventArgs);
        }
    }
    processKeyDown(args, keyOptions) {
        if (this.matchesKeyCombination(keyOptions.preventDown, args)) {
            args.preventDefault();
        }
        if (this.matchesKeyCombination(keyOptions.stopDown, args)) {
            args.stopPropagation();
        }
    }
    processKeyUp(args, keyOptions) {
        if (this.matchesKeyCombination(keyOptions.preventUp, args)) {
            args.preventDefault();
        }
        if (this.matchesKeyCombination(keyOptions.stopUp, args)) {
            args.stopPropagation();
        }
    }
    toKeyboardEventArgs(args) {
        return {
            Key: args.key,
            Code: args.code,
            Location: args.location,
            Repeat: args.repeat,
            CtrlKey: args.ctrlKey,
            ShiftKey: args.shiftKey,
            AltKey: args.altKey,
            MetaKey: args.metaKey
        };
    }
}
class KeyListenerFactory {
    connect(dotNetRef, elementId, options) {
        if (!elementId) {
            throw "elementId: expected element id!";
        }
        const element = document.getElementById(elementId);
        if (!element) {
            throw "no element found for id: " + elementId;
        }
        if (!element.keyListener) {
            element.keyListener = new KeyListener(dotNetRef, options);
        }
        element.keyListener.connect(element);
    }
    updateKey(elementId, option) {
        const element = document.getElementById(elementId);
        if (element && element.keyListener) {
            element.keyListener.setKeyOption(option);
        }
    }
    disconnect(elementId) {
        var element = document.getElementById(elementId);
        if (element && element.keyListener) {
            element.keyListener.disconnect();
        }
    }
}
class ElementReference {
    constructor() {
        this.eventListeners = {};
        this.listenerId = 0;
    }
    addEventListener(element, dotNetRef, event, callback, spec, stopPropagation) {
        const listener = function (e) {
            const args = Array.from(spec, x => serializeParameter(e, x));
            dotNetRef.invokeMethodAsync(callback, ...args);
            if (stopPropagation) {
                e.stopPropagation();
            }
        };
        element.addEventListener(event, listener);
        this.eventListeners[++this.listenerId] = listener;
        return this.listenerId;
    }
    changeCss(element, css) {
        if (element) {
            element.className = css;
        }
    }
    changeCssVariable(element, name, newValue) {
        if (element) {
            element.style.setProperty(name, newValue);
        }
    }
    focus(element) {
        if (element) {
            element.focus();
        }
    }
    focusFirst(element, skip = 0, min = 0) {
        if (element) {
            const tabbables = getTabbableElements(element);
            if (tabbables.length <= min) {
                element.focus();
            }
            else {
                const tabbable = tabbables[skip];
                if (tabbable instanceof HTMLElement) {
                    tabbable.focus();
                }
            }
        }
    }
    focusLast(element, skip = 0, min = 0) {
        if (element) {
            const tabbables = getTabbableElements(element);
            if (tabbables.length <= min) {
                element.focus();
            }
            else {
                const tabbable = tabbables[tabbables.length - skip - 1];
                if (tabbable instanceof HTMLElement) {
                    tabbable.focus();
                }
            }
        }
    }
    getBoundingClientRect(element) {
        if (!element) {
            return;
        }
        const rect = JSON.parse(JSON.stringify(element.getBoundingClientRect()));
        rect.scrollY = window.scrollY || document.documentElement.scrollTop;
        rect.scrollX = window.scrollX || document.documentElement.scrollLeft;
        rect.windowHeight = window.innerHeight;
        rect.windowWidth = window.innerWidth;
        return rect;
    }
    getClientRectFromFirstChild(element) {
        if (!element) {
            return;
        }
        const child = element.children && element.children[0];
        if (!child || !(child instanceof HTMLElement)) {
            return;
        }
        return this.getBoundingClientRect(child);
    }
    getClientRectFromParent(element) {
        if (!element) {
            return;
        }
        const parent = element.parentElement;
        if (!parent) {
            return;
        }
        return this.getBoundingClientRect(parent);
    }
    hasFixedAncestors(element) {
        for (; element && element instanceof Element; element = element.parentNode) {
            if (window.getComputedStyle(element).getPropertyValue("position") === "fixed") {
                return true;
            }
        }
        return false;
    }
    removeEventListener(element, event, eventId) {
        element.removeEventListener(event, this.eventListeners[eventId]);
        delete this.eventListeners[eventId];
    }
    restoreFocus(element) {
        if (element) {
            let previous = element.savedFocus;
            delete element.savedFocus;
            if (previous) {
                previous.focus();
            }
        }
    }
    saveFocus(element) {
        if (element && document.activeElement instanceof HTMLElement) {
            element.savedFocus = document.activeElement;
        }
    }
    select(element) {
        if (element) {
            element.select();
        }
    }
    selectRange(element, pos1, pos2) {
        if (element) {
            if (element.setSelectionRange) {
                element.setSelectionRange(pos1, pos2);
            }
            else if (element.selectionStart) {
                element.selectionStart = pos1;
                element.selectionEnd = pos2;
            }
            element.focus();
        }
    }
}
window.tavenem = window.tavenem || {};
window.tavenem.framework = window.tavenem.framework || {};
window.tavenem.framework.popover = window.tavenem.framework.popover || new Popover();
window.tavenem.framework.popoverHelper = window.tavenem.framework.popoverHelper || {
    flipClassReplacements: {
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
    },
    calculatePopoverPosition: function (list, boundingRect, anchorOffsetLeft, anchorOffsetTop, selfRect) {
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
    },
    getPositionForFlippedPopver: function (inputArray, selector, boundingRect, anchorOffsetLeft, anchorOffsetTop, selfRect) {
        const classList = [];
        for (let i = 0; i < inputArray.length; i++) {
            const item = inputArray[i];
            const replacments = window.tavenem.framework.popoverHelper.flipClassReplacements[selector][item];
            if (replacments) {
                classList.push(replacments);
            }
            else {
                classList.push(item);
            }
        }
        return window.tavenem.framework.popoverHelper.calculatePopoverPosition(classList, boundingRect, anchorOffsetLeft, anchorOffsetTop, selfRect);
    },
    placePopover: function (popoverNode, classSelector = null) {
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
        const selfRect = popoverNode.getBoundingClientRect();
        const classList = popoverNode.classList;
        const classListArray = Array.from(popoverNode.classList);
        const postion = window.tavenem.framework.popoverHelper.calculatePopoverPosition(classListArray, anchorBoundingRect, anchorOffsetLeft, anchorOffsetTop, selfRect);
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
                const newPosition = window.tavenem.framework.popoverHelper.getPositionForFlippedPopver(classListArray, selector, anchorBoundingRect, anchorOffsetLeft, anchorOffsetTop, selfRect);
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
        popoverNode.style.left = (left + offsetX) + 'px';
        popoverNode.style.top = (top + offsetY) + 'px';
    },
    placePopoverByClassSelector: function (classSelector = null) {
        var items = window.tavenem.framework.popover.getAllObservedContainers();
        for (let i = 0; i < items.length; i++) {
            const popoverNode = document.getElementById('popover-' + items[i]);
            if (popoverNode) {
                window.tavenem.framework.popoverHelper.placePopover(popoverNode, classSelector);
            }
        }
    },
};
window.tavenem.framework.keyListener = new KeyListenerFactory();
export function cancelScrollListener(selector) {
    const element = selector
        ? document.querySelector(selector)
        : document.documentElement;
    if (element instanceof HTMLElement) {
        element.removeEventListener('scroll', throttleScrollHandler);
    }
}
export function getHeadings(className) {
    const elements = document.getElementsByClassName(className);
    if (elements.length === 0) {
        return [];
    }
    let ids = [];
    for (let i = 0; i < elements.length; i++) {
        if (elements[i].id) {
            let title = elements[i].getAttribute("data-title");
            if (!title) {
                title = elements[i].textContent;
            }
            if (title) {
                let level = 0;
                if (elements[i].tagName.startsWith('H')
                    && elements[i].tagName.length === 2) {
                    level = Number.parseInt(elements[i].tagName[1]);
                }
                ids.push({
                    id: elements[i].id,
                    isActive: elements[i].classList.contains("scroll-active"),
                    level,
                    title,
                });
            }
        }
    }
    return ids;
}
export function getPreferredColorScheme() {
    if (window.tavenem.framework._manualColorTheme
        && window.tavenem.framework._theme) {
        return window.tavenem.framework._theme;
    }
    const local = localStorage.getItem('tavenem-theme');
    if (local) {
        const theme = parseInt(local);
        if (theme === 1 || theme === 2) {
            return theme;
        }
    }
    if (window.matchMedia) {
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 2;
        }
        else {
            return 1;
        }
    }
    return 1;
}
export function listenForKeyEvent(dotNetRef, elementId, options) {
    window.tavenem.framework.keyListener.connect(dotNetRef, elementId, options);
}
export function listenForScroll(dotnetReference, selector) {
    const element = selector
        ? document.querySelector(selector)
        : document;
    if (!element) {
        return;
    }
    element.addEventListener('scroll', throttleScrollHandler.bind(this, dotnetReference), false);
}
export function disconnectKeyEvent(elementId) {
    window.tavenem.framework.keyListener.disconnect(elementId);
}
export function popoverConnect(id, anchorId) {
    window.tavenem.framework.popover.connect(id, anchorId);
}
export function popoverDisconnect(id) {
    window.tavenem.framework.popover.disconnect(id);
}
export function popoverDispose() {
    window.tavenem.framework.popover.dispose();
}
export function popoverInitialize() {
    window.tavenem.framework.popover.initialize();
}
export function scrollSpy(dotnetReference, className) {
    window.tavenem.framework._spy = handleScrollSpy.bind(this, dotnetReference, className);
    document.addEventListener('scroll', window.tavenem.framework._spy, true);
    window.addEventListener('resize', window.tavenem.framework._spy, true);
    window.tavenem.framework._spy(null);
}
export function scrollToId(elementId) {
    let element = elementId
        ? document.getElementById(elementId)
        : document.documentElement;
    if (!element) {
        element = document.documentElement;
    }
    if (element instanceof HTMLElement) {
        element.scrollIntoView({
            behavior: "smooth",
            block: "start",
            inline: "nearest"
        });
        if (elementId) {
            history.replaceState(null, '', window.location.pathname + "#" + elementId);
        }
        else {
            history.replaceState(null, '', window.location.pathname);
        }
    }
}
export function scrollToTop(selector) {
    const element = selector
        ? document.querySelector(selector)
        : document;
    if (!element) {
        return;
    }
    if (element instanceof Document) {
        window.scroll({
            top: 0,
            left: 0,
            behavior: "smooth",
        });
    }
    else if (element instanceof HTMLElement) {
        element.scroll({
            top: 0,
            left: 0,
            behavior: "smooth",
        });
    }
}
export function setColorScheme(theme, manual) {
    if (manual) {
        window.tavenem.framework._manualColorTheme = (theme !== 0);
    }
    else {
        localStorage.removeItem('tavenem-theme');
        if (window.tavenem.framework._manualColorTheme) {
            return;
        }
    }
    window.tavenem.framework._theme = theme;
    if (theme === 0) {
        theme = getPreferredColorScheme();
    }
    if (theme === 2) {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
    else {
        document.documentElement.setAttribute('data-theme', 'light');
    }
    if (manual) {
        localStorage.setItem('tavenem-theme', theme.toString());
    }
}
export function shake(elementId) {
    if (!elementId) {
        return;
    }
    const element = document.getElementById(elementId);
    if (!element || element.classList.contains('shake')) {
        return;
    }
    element.classList.add('shake');
    setTimeout(() => element.classList.remove('shake'), 1000);
}
export function updateKeyEvent(elementId, option) {
    window.tavenem.framework.keyListener.updateKey(elementId, option);
}
function clearLastScrolled() {
    const lastElement = document.getElementById(window.tavenem.framework._lastElement);
    if (lastElement) {
        lastElement.classList.remove("scroll-active");
    }
}
function getTabbableElements(element) {
    return element.querySelectorAll("a[href]:not([tabindex='-1'])," +
        "area[href]:not([tabindex='-1'])," +
        "button:not([disabled]):not([tabindex='-1'])," +
        "input:not([disabled]):not([tabindex='-1']):not([type='hidden'])," +
        "select:not([disabled]):not([tabindex='-1'])," +
        "textarea:not([disabled]):not([tabindex='-1'])," +
        "iframe:not([tabindex='-1'])," +
        "details:not([tabindex='-1'])," +
        "[tabindex]:not([tabindex='-1'])," +
        "[contentEditable=true]:not([tabindex='-1']");
}
function handleScroll(dotnetReference, event) {
    try {
        const element = event.target;
        if (!(element instanceof HTMLElement)) {
            return;
        }
        const firstChild = element.firstElementChild;
        if (!firstChild) {
            return;
        }
        const firstChildBoundingClientRect = firstChild.getBoundingClientRect();
        const scrollLeft = element.scrollLeft;
        const scrollTop = element.scrollTop;
        const scrollHeight = element.scrollHeight;
        const scrollWidth = element.scrollWidth;
        const nodeName = element.nodeName;
        dotnetReference.invokeMethodAsync('RaiseOnScroll', {
            firstChildBoundingClientRect,
            scrollLeft,
            scrollTop,
            scrollHeight,
            scrollWidth,
            nodeName,
        });
    }
    catch (error) {
        console.log('Error in handleScroll: ', { error });
    }
}
function handleScrollSpy(dotnetReference, className, event) {
    const elements = document.getElementsByClassName(className);
    if (elements.length === 0) {
        clearLastScrolled();
        return;
    }
    let lowest = Number.MAX_SAFE_INTEGER;
    let lowestAboveZero = Number.MAX_SAFE_INTEGER;
    let lowestElementId = '';
    let lowestElementIdAboveZero = '';
    for (let i = 0; i < elements.length; i++) {
        const element = elements[i];
        const rect = element.getBoundingClientRect();
        if (rect.top < lowest) {
            lowest = rect.top;
            lowestElementId = element.id;
        }
        if (rect.top > 0
            && rect.top < lowestAboveZero) {
            lowestAboveZero = rect.top;
            lowestElementIdAboveZero = element.id;
        }
    }
    const element = document.getElementById(lowestElementIdAboveZero)
        ?? document.getElementById(lowestElementId);
    if (!element) {
        clearLastScrolled();
        return;
    }
    if (element.getBoundingClientRect().top < window.innerHeight * 0.8 === false) {
        return;
    }
    const elementId = element.id;
    if (elementId != window.tavenem.framework._lastElement) {
        clearLastScrolled();
        window.tavenem.framework._lastElement = elementId;
        element.classList.add("scroll-active");
        dotnetReference.invokeMethodAsync('RaiseOnScrollSpy', elementId);
    }
}
function serializeParameter(data, spec) {
    if (typeof data == "undefined" ||
        data === null) {
        return null;
    }
    if (typeof data === "number" ||
        typeof data === "string" ||
        typeof data == "boolean") {
        return data;
    }
    let res = (Array.isArray(data)) ? [] : {};
    if (!spec) {
        spec = "*";
    }
    for (let i in data) {
        let currentMember = data[i];
        if (typeof currentMember === 'function' || currentMember === null) {
            continue;
        }
        let currentMemberSpec;
        if (spec != "*") {
            currentMemberSpec = Array.isArray(data) ? spec : spec[i];
            if (!currentMemberSpec) {
                continue;
            }
        }
        else {
            currentMemberSpec = "*";
        }
        if (typeof currentMember === 'object') {
            if (Array.isArray(currentMember) || currentMember.length) {
                res[i] = [];
                for (let j = 0; j < currentMember.length; j++) {
                    const arrayItem = currentMember[j];
                    if (typeof arrayItem === 'object') {
                        res[i].push(serializeParameter(arrayItem, currentMemberSpec));
                    }
                    else {
                        res[i].push(arrayItem);
                    }
                }
            }
            else {
                if (currentMember.length === 0) {
                    res[i] = [];
                }
                else {
                    res[i] = serializeParameter(currentMember, currentMemberSpec);
                }
            }
        }
        else {
            if (currentMember === Infinity) {
                currentMember = "Infinity";
            }
            if (currentMember !== null) {
                res[i] = currentMember;
            }
        }
    }
    return res;
}
function setPreferredColorScheme() {
    setColorScheme(getPreferredColorScheme());
}
function throttleScrollHandler(dotnetReference, event) {
    clearTimeout(window.tavenem.framework._throttleScrollHandlerId);
    window.tavenem.framework._throttleScrollHandlerId = window.setTimeout(handleScroll.bind(this, dotnetReference, event), 100);
}
if (window.matchMedia) {
    const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    colorSchemeQuery.addEventListener('change', setPreferredColorScheme);
}
const currentScheme = getPreferredColorScheme();
if (currentScheme === 2) {
    setColorScheme(currentScheme);
}
window.addEventListener('resize', () => {
    window.tavenem.framework.popoverHelper.placePopoverByClassSelector();
});
//# sourceMappingURL=tavenem-framework.js.map