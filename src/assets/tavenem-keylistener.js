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
const keyListener = new KeyListenerFactory();
export function listenForKeyEvent(dotNetRef, elementId, options) {
    keyListener.connect(dotNetRef, elementId, options);
}
export function disconnectKeyEvent(elementId) {
    keyListener.disconnect(elementId);
}
export function updateKeyEvent(elementId, option) {
    keyListener.updateKey(elementId, option);
}
//# sourceMappingURL=tavenem-keylistener.js.map