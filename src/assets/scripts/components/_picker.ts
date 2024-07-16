import { TavenemPopover, TavenemPopoverHTMLElement } from './_popover'
import { TavenemInputHtmlElement } from './_input'

export class TavenemPickerHtmlElement extends HTMLElement {
    protected _hideTimer: number;
    protected _popover: TavenemPopoverHTMLElement | undefined;

    private _closeCooldownTimer: number;
    private _closed: boolean;

    static get observedAttributes() {
        return ['disabled', 'readonly'];
    }

    constructor() {
        super();

        this._closeCooldownTimer = -1;
        this._closed = false;
        this._hideTimer = -1;
    }

    protected static newValueChangeEvent(value: string) {
        return new CustomEvent('valuechange', { bubbles: true, composed: true, detail: { value: value } });
    }

    connectedCallback() {
        this.addEventListener('mousedown', this.onMouseDown.bind(this));
        this.addEventListener('mouseup', this.onMouseUp.bind(this));
        this.addEventListener('keyup', this.onKeyUp.bind(this));

        document.addEventListener('mousedown', this.onDocMouseDown.bind(this));
    }

    disconnectedCallback() {
        clearTimeout(this._hideTimer);
        this.removeEventListener('mousedown', this.onMouseDown.bind(this));
        this.removeEventListener('mouseup', this.onMouseUp.bind(this));
        this.removeEventListener('keyup', this.onKeyUp.bind(this));
        document.removeEventListener('mousedown', this.onDocMouseDown.bind(this));
    }

    attributeChangedCallback(name: string, _oldValue: string | null | undefined, newValue: string | null | undefined) {
        if ((name === 'disabled'
            || name === 'readonly')
            && newValue) {
            this.close();
        }
    }

    setOpen(value: boolean) {
        clearTimeout(this._hideTimer);

        if (value) {
            this.openInner();
        } else {
            this.closeInner();
        }
    }

    toggle() {
        if (!this._popover) {
            return;
        }

        if (this._popover.matches(':popover-open')) {
            this.close();
        } else if (!this.hasAttribute('disabled')
            && !this.hasAttribute('readonly')) {
            this.open();
        }
    }

    protected clear() {
        const root = this.shadowRoot;
        if (!root) {
            return;
        }
        const input = root.querySelector<TavenemInputHtmlElement>('.input');
        if (input) {
            input.value = '';
        }
    }

    protected onArrowDown(event: KeyboardEvent) {
        if (this._popover && !this._popover.matches(':popover-open')) {
            event.preventDefault();
            event.stopPropagation();
            this.open();
        }
    }

    protected onArrowUp(event: KeyboardEvent) {
        if (this._popover && this._popover.matches(':popover-open')) {
            event.preventDefault();
            event.stopPropagation();
            this.open();
        }
    }

    protected onClosing() { }

    protected onDocMouseDown(event: MouseEvent) {
        if (event.target !== this
            && event.target instanceof Node
            && !TavenemPopover.nodeContains(this, event.target)) {
            this.close();
        }
    }

    protected onKeyUp(event: KeyboardEvent) {
        if (event.isComposing) {
            return;
        }
        if (event.key === "Enter") {
            this.onSubmit(event);
        } else if (event.key === " ") {
            if ('hasTextInput' in this.dataset) {
                if (!event.altKey
                    && !event.ctrlKey
                    && !event.metaKey) {
                    this.onSearchInput(event);
                }
            } else {
                this.onSubmit(event);
            }
        } else if (event.key === "ArrowDown") {
            if (event.altKey) {
                if (this._popover && !this._popover.matches(':popover-open')) {
                    event.preventDefault();
                    event.stopPropagation();
                    this.open();
                }
            } else {
                this.onArrowDown(event);
            }
        } else if (event.key === "ArrowUp") {
            if (event.altKey) {
                if (this._popover && this._popover.matches(':popover-open')) {
                    event.preventDefault();
                    event.stopPropagation();
                    this.open();
                }
            } else {
                this.onArrowUp(event);
            }
        } else if (event.key === "Delete"
            || event.key === "Backspace"
            || event.key === "Clear") {
            if ('hasTextInput' in this.dataset) {
                this.onSearchInput(event);
            } else {
                this.onClear(event);
            }
        } else if (event.key === "Escape") {
            if (this._popover && this._popover.matches(':popover-open')) {
                event.preventDefault();
                event.stopPropagation();
                this.close();
            }
        } else if (event.key === "a") {
            if (event.ctrlKey && this.hasAttribute('multiple')) {
                this.onSelectAll(event);
            } else {
                this.onSearchInput(event);
            }
        } else if (event.key.length === 1
            && !event.altKey
            && !event.ctrlKey
            && !event.metaKey) {
            this.onSearchInput(event);
        }
    }

    protected onMouseDown(event: Event) {
        event.stopPropagation();

        clearTimeout(this._hideTimer);
    }

    protected onMouseUp(event: MouseEvent) {
        if (event.button === 0) {
            this.onSubmit(event);
        }
    }

    protected onOpening() { }

    protected onSearchInput(event: KeyboardEvent) { }

    protected onSelectAll(event: Event) { }

    protected onSubmitOption(element: HTMLElement | SVGElement) { }

    protected open() {
        clearTimeout(this._hideTimer);

        if (this._closed
            || this.hasAttribute('disabled')
            || this.hasAttribute('readonly')) {
            return;
        }

        this.openInner();
    }

    protected stringValue(): string | null { return null; }

    private close() {
        clearTimeout(this._hideTimer);
        this.closeInner();
    }

    private closeInner() {
        if (!this._popover || !this._popover.matches(':popover-open')) {
            return;
        }
        this._popover.hide();

        this._closed = true;

        let value = this.stringValue();
        if (value == null) {
            const root = this.shadowRoot;
            if (root) {
                const input = root.querySelector<TavenemInputHtmlElement>('.input');
                if (input) {
                    value = input.getAttribute('value') || '';
                }
            }
        }
        if (value != null) {
            this.dispatchEvent(TavenemPickerHtmlElement.newValueChangeEvent(value));
        }

        clearTimeout(this._closeCooldownTimer);
        this._closeCooldownTimer = setTimeout(() => this._closed = false, 200);

        this.onClosing();
    }

    private onClear(event: Event) {
        if (!event.target) {
            return;
        }
        if (event.target !== this
            && this._popover
            && event.target instanceof Node
            && this._popover.contains(event.target)) {
            if (!this._popover.matches(':popover-open')) {
                return;
            }
        }

        event.preventDefault();
        event.stopPropagation();

        this.clear();
    }

    private onSubmit(event: Event) {
        if (!event.target) {
            return;
        }

        if (event.target === this
            && 'pickerNoToggle' in this.dataset) {
            return;
        } else if (event.target instanceof HTMLElement
            || event.target instanceof SVGElement) {
            let e: HTMLElement | SVGElement | null = event.target;
            while (e
                && e !== this
                && e.tagName !== 'tf-popover'
                && !('pickerToggle' in e.dataset)) {
                if ('pickerNoToggle' in e.dataset) {
                    return;
                }
                e = e.parentElement;
            }
        }

        if (!this._popover) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        if (event.target !== this
            && (event.target instanceof HTMLElement
                || event.target instanceof SVGElement)
            && TavenemPopover.nodeContains(this._popover, event.target)) {
            if (!this._popover.matches(':popover-open')) {
                return;
            }

            let e: HTMLElement | SVGElement | null = event.target;
            let closePicker = false;
            while (e && e !== this._popover) {
                if ('closePicker' in e.dataset
                    || e instanceof HTMLOptionElement) {
                    closePicker = true;
                    break;
                }
                e = e.parentElement;
            }
            if (!e || !closePicker) {
                return;
            }

            this.onSubmitOption(e);

            if (this._popover.matches(':popover-open')
                && !this.hasAttribute('multiple')) {
                this.toggle();
            }
        } else if (!this._popover.matches(':popover-open')
            || !this.hasAttribute('multiple')) {
            this.toggle();
        }
    }

    private openInner() {
        if (this._closed) {
            return;
        }

        if (!this._popover || this._popover.matches(':popover-open')) {
            return;
        }
        if (typeof this._popover.show === 'function') {
            this._popover.show();
        }

        const root = this.shadowRoot;
        if (root) {
            const input = root.querySelector<TavenemInputHtmlElement>('.input');
            if (input) {
                if (input.shadowRoot) {
                    input.focusInnerInput();
                } else {
                    input.focus();
                }
            }
        }

        this.onOpening();
    }
}