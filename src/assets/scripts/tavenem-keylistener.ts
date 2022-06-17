interface IKeyOptions {
    key: string;
    preventDown: string | undefined | null;
    preventUp: string | undefined | null;
    regex: RegExp | undefined | null;
    stopDown: string | undefined | null;
    stopUp: string | undefined | null;
    subscribeDown: boolean;
    subscribeUp: boolean;
}

interface IKeyListenerOptions {
    keys: IKeyOptions[];
}

interface IKeyListenerObserver extends MutationObserver {
    keyListener?: KeyListener | undefined | null;
}

interface IKeyListenerElement extends Element {
    keyListener?: KeyListener | undefined | null;
}

interface KeyboardEventArgs {
    AltKey: boolean;
    Code: string;
    CtrlKey: boolean;
    Key: string;
    Location: number;
    MetaKey: boolean;
    Repeat: boolean;
    ShiftKey: boolean;
    Type?: string | undefined;
}

const whitespaceRegExp = new RegExp("\\s", "g");

class KeyListener {
    _dotNetRef: DotNet.DotNetObject;
    _element: IKeyListenerElement | undefined;
    _keyOptions: Record<string, IKeyOptions> = {};
    _observedChildren: IKeyListenerElement[] = [];
    _options: IKeyListenerOptions;
    _regexOptions: IKeyOptions[] = [];

    constructor(dotNetRef: DotNet.DotNetObject, options: IKeyListenerOptions) {
        this._dotNetRef = dotNetRef;
        this._options = options;
    }

    connect(element: IKeyListenerElement) {
        if (!this._options) {
            return;
        }
        if (!this._options.keys) {
            throw "_options.keys: array of IKeyOptions expected";
        }
        this._element = element;
        // transform key options into a key lookup
        this._keyOptions = {};
        this._regexOptions = [];
        for (const keyOption of this._options.keys) {
            if (!keyOption || !keyOption.key) {
                continue;
            }
            this.setKeyOption(keyOption);
        }
        // register handlers
        this.attachHandlers(this._element as IKeyListenerElement);
    }

    disconnect() {
        if (!this._element) {
            return;
        }
        this.detachHandlers(this._element);
    }

    setKeyOption(keyOption: IKeyOptions) {
        if (keyOption.key.length > 2 && keyOption.key.startsWith('/') && keyOption.key.endsWith('/')) {
            // JS regex key options such as "/[a-z]/" or "/a|b/" but NOT "/[a-z]/g" or "/[a-z]/i"
            keyOption.regex = new RegExp(keyOption.key.substring(1, keyOption.key.length - 1)); // strip the / from start and end
            this._regexOptions.push(keyOption);
        } else {
            this._keyOptions[keyOption.key.toLowerCase()] = keyOption;
        }
        keyOption.preventDown = (keyOption.preventDown || "none").replace(whitespaceRegExp, "").toLowerCase();
        keyOption.preventUp = (keyOption.preventUp || "none").replace(whitespaceRegExp, "").toLowerCase();
        keyOption.stopDown = (keyOption.stopDown || "none").replace(whitespaceRegExp, "").toLowerCase();
        keyOption.stopUp = (keyOption.stopUp || "none").replace(whitespaceRegExp, "").toLowerCase();
    }

    private attachHandlers(child: IKeyListenerElement) {
        if (this._observedChildren
            && this._observedChildren.indexOf(child) > -1) {
            return;
        }
        child.keyListener = this;
        child.addEventListener('keydown', this.onKeyDown);
        child.addEventListener('keyup', this.onKeyUp);
        this._observedChildren.push(child);
    }

    private detachHandlers(child: Element) {
        child.removeEventListener('keydown', this.onKeyDown);
        child.removeEventListener('keyup', this.onKeyUp);
        this._observedChildren = this._observedChildren.filter(x => x !== child);
    }

    private matchesKeyCombination(option: string | undefined | null, args: KeyboardEvent) {
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

    private onKeyDown(this: IKeyListenerElement, args: Event) {
        var self = this.keyListener; // func is invoked with this == child
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
            if (keyOptions.regex && keyOptions.regex.test(args.key)) {
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

    private onKeyUp(this: IKeyListenerElement, args: Event) {
        var self = this.keyListener; // func is invoked with this == child
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

    private processKeyDown(args: KeyboardEvent, keyOptions: IKeyOptions) {
        if (this.matchesKeyCombination(keyOptions.preventDown, args)) {
            args.preventDefault();
        }
        if (this.matchesKeyCombination(keyOptions.stopDown, args)) {
            args.stopPropagation();
        }
    }

    private processKeyUp(args: KeyboardEvent, keyOptions: IKeyOptions) {
        if (this.matchesKeyCombination(keyOptions.preventUp, args)) {
            args.preventDefault();
        }
        if (this.matchesKeyCombination(keyOptions.stopUp, args)) {
            args.stopPropagation();
        }
    }

    private toKeyboardEventArgs(args: KeyboardEvent): KeyboardEventArgs {
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

export function listenForKeyEvent(dotNetRef: DotNet.DotNetObject, elementId: string, options: IKeyListenerOptions) {
    if (!elementId) {
        return;
    }
    const element = document.getElementById(elementId) as IKeyListenerElement;
    if (!element) {
        return;
    }
    if (!element.keyListener) {
        element.keyListener = new KeyListener(dotNetRef, options);
    }
    element.keyListener.connect(element);
}

export function disconnectKeyEvent(elementId: string) {
    var element = document.getElementById(elementId) as IKeyListenerElement;
    if (element && element.keyListener) {
        element.keyListener.disconnect();
    }
}

export function updateKeyEvent(elementId: string, option: IKeyOptions) {
    const element = document.getElementById(elementId) as IKeyListenerElement;
    if (element && element.keyListener) {
        element.keyListener.setKeyOption(option);
    }
}