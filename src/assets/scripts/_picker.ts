import { TavenemPopover, TavenemPopoverHTMLElement } from './_popover'
import { TavenemInputHtmlElement } from './_input'

export class TavenemPickerHtmlElement extends HTMLElement {
    protected _hideTimer: number;

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
        this.addEventListener('focuslost', this.onPopoverFocusLost.bind(this));
        this.addEventListener('mousedown', this.onMouseDown.bind(this));
        this.addEventListener('mouseup', this.onMouseUp.bind(this));
        this.addEventListener('keyup', this.onKeyUp.bind(this));

        document.addEventListener('mousedown', this.onDocMouseDown.bind(this));
    }

    disconnectedCallback() {
        clearTimeout(this._hideTimer);
        this.removeEventListener('focuslost', this.onPopoverFocusLost.bind(this));
        this.removeEventListener('mousedown', this.onMouseDown.bind(this));
        this.removeEventListener('mouseup', this.onMouseUp.bind(this));
        this.removeEventListener('keyup', this.onKeyUp.bind(this));
        document.removeEventListener('mousedown', this.onDocMouseDown.bind(this));
    }

    attributeChangedCallback(name: string, oldValue: string | null | undefined, newValue: string | null | undefined) {
        if ((name === 'disabled'
            || name === 'readonly')
            && newValue) {
            this.close();
        }
    }

    setOpen(value: boolean) {
        clearTimeout(this._hideTimer);
        if (value) {
            if (!('popoverOpen' in this.dataset)) {
                this.openInner();
            }
        } else if ('popoverOpen' in this.dataset) {
            this.closeInner();
        }
    }

    toggle() {
        if ('popoverOpen' in this.dataset) {
            this.close();
        } else if (!this.hasAttribute('disabled')
            && !this.hasAttribute('readonly')) {
            this.open();
        }
    }

    protected clear() {
        let input = this.querySelector<HTMLInputElement | TavenemInputHtmlElement>('.picker-value');
        if (!input && this.shadowRoot) {
            input = this.shadowRoot.querySelector<HTMLInputElement | TavenemInputHtmlElement>('.picker-value');
        }
        if (input) {
            input.value = '';
        }
    }

    protected onArrowDown(event: KeyboardEvent) { }

    protected onArrowUp(event: KeyboardEvent) { }

    protected onClosing() { }

    protected onDocMouseDown(event: MouseEvent) {
        if (event.target
            && event.target !== this
            && event.target instanceof Node
            && !TavenemPopover.nodeContains(this, event.target)) {
            const root = this.getRootNode();
            if (!root
                || !(root instanceof ShadowRoot)
                || !root.host
                || root.host !== event.target) {
                this.close();
            }
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
                if (!('popoverOpen' in this.dataset)) {
                    this.onToggle(event);
                }
            } else {
                this.onArrowDown(event);
            }
        } else if (event.key === "ArrowUp") {
            if (event.altKey) {
                if ('popoverOpen' in this.dataset) {
                    this.onToggle(event);
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
            if ('popoverOpen' in this.dataset) {
                this.onToggle(event);
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

    protected onMouseDown() { clearTimeout(this._hideTimer); }

    protected onMouseUp(event: MouseEvent) {
        if (event.button === 0) {
            this.onSubmit(event);
        }
    }

    protected onOpening() { }

    protected onPopoverFocusLost(event: Event) {
        if (event.target
            && event.target instanceof TavenemPopoverHTMLElement
            && event.target.parentElement === this) {
            this._hideTimer = setTimeout(this.close.bind(this), 100);
        }
    }

    protected onSearchInput(event: KeyboardEvent) { }

    protected onSelectAll(event: Event) { }

    protected onSubmitOption(element: HTMLElement | SVGElement) { }

    protected onToggle(event: Event) {
        event.preventDefault();
        event.stopPropagation();

        this.toggle();
    }

    protected open() {
        clearTimeout(this._hideTimer);

        if (this._closed
            || this.hasAttribute('disabled')
            || this.hasAttribute('readonly')) {
            return;
        }

        this.openInner();
    }

    private close() {
        clearTimeout(this._hideTimer);
        if ('popoverOpen' in this.dataset) {
            this.closeInner();
        }
    }

    private closeInner() {
        this._closed = true;
        delete this.dataset.popoverOpen;

        let input = this.querySelector<HTMLInputElement | TavenemInputHtmlElement>('.picker-value');
        if (!input && this.shadowRoot) {
            input = this.shadowRoot.querySelector<HTMLInputElement | TavenemInputHtmlElement>('.picker-value');
        }
        if (input) {
            this.dispatchEvent(TavenemPickerHtmlElement.newValueChangeEvent(input.value));
        }

        clearTimeout(this._closeCooldownTimer);
        this._closeCooldownTimer = setTimeout(() => this._closed = false, 200);

        this.onClosing();
    }

    private onClear(event: Event) {
        if (!event.target) {
            return;
        }
        if (event.target !== this) {
            let popover = this.querySelector('tf-popover.contained-popover');
            if (!popover && this.shadowRoot) {
                popover = this.shadowRoot.querySelector('tf-popover.contained-popover');
            }
            if (popover
                && event.target instanceof Node
                && popover.contains(event.target)) {
                if (!('popoverOpen' in this.dataset)) {
                    return;
                }
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
                && e.tagName !== 'tf-popover') {
                if ('pickerNoToggle' in e.dataset) {
                    return;
                }
                e = e.parentElement;
            }
        }

        let popover = this.querySelector('tf-popover.contained-popover');
        if (!popover) {
            if (this.shadowRoot) {
                popover = this.shadowRoot.querySelector('tf-popover.contained-popover');
            }
            if (!popover) {
                return;
            }
        }

        if (event.target !== this
            && (event.target instanceof HTMLElement
                || event.target instanceof SVGElement)
            && popover.contains(event.target)) {
            event.preventDefault();
            event.stopPropagation();

            if (!('popoverOpen' in this.dataset)) {
                return;
            }

            let e: HTMLElement | SVGElement | null = event.target;
            let closePicker = false;
            while (e && e !== popover) {
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
        }

        event.preventDefault();
        event.stopPropagation();

        if (!('popoverOpen' in this.dataset)
            || !this.hasAttribute('multiple')) {
            this.toggle();
        }
    }

    private openInner() {
        if (this._closed) {
            return;
        }

        let popover = this.querySelector('tf-popover.contained-popover');
        if (!popover && this.shadowRoot) {
            popover = this.shadowRoot.querySelector('tf-popover.contained-popover');
        }
        if (popover) {
            this.dataset.popoverOpen = '';
            TavenemPopover.placePopover(popover);
        }

        let input = this.querySelector('.picker-value');
        if (!input && this.shadowRoot) {
            input = this.shadowRoot.querySelector('.picker-value');
        }
        if (input) {
            if (input instanceof TavenemInputHtmlElement) {
                input.focusInnerInput();
            } else if (input instanceof HTMLElement) {
                input.focus();
            }
        }

        this.onOpening();
    }
}