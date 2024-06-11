import { TavenemPopover, TavenemPopoverHTMLElement } from "./_popover";
import { randomUUID } from "./tavenem-utility";

export class TavenemInputHtmlElement extends HTMLElement {
    static formAssociated = true;

    private _display: string | null | undefined;
    private _initialDisplay: string | null | undefined;
    private _initialValue: string | null | undefined;
    private _inputDebounce: number = -1;
    private _internals: ElementInternals;
    private _value = '';

    static get observedAttributes() {
        return [
            'data-input-class',
            'data-input-style',
            'display',
            'readonly',
            'required',
            'value',
        ];
    }

    private static newEnterEvent() {
        return new CustomEvent('enter', { bubbles: true, composed: true });
    }

    private static newValueChangeEvent(value: string) {
        return new CustomEvent('valuechange', { bubbles: true, composed: true, detail: { value: value } });
    }

    private static newValueInputEvent(value: string) {
        return new CustomEvent('valueinput', { bubbles: true, composed: true, detail: { value: value } });
    }

    get display() {
        return this._display && this._display.length
            ? this._display
            : this._value;
    }
    set display(value: string | null | undefined) {
        this._display = value;

        let newValue = value;
        if (value == null || !value.length) {
            const padLength = parseInt(this.dataset.padLength || '');
            if (Number.isFinite(padLength)
                && padLength > this._value.length) {
                newValue = this._value.padStart(padLength, this.dataset.paddingChar);
            } else {
                newValue = this._value;
            }
        }

        if (newValue!.length) {
            this._internals.states.delete('empty');
            this._internals.states.add('has-value');
        } else {
            this._internals.states.add('empty');
            this._internals.states.delete('has-value');
        }

        const root = this.shadowRoot;
        if (root) {
            const input = root.querySelector<HTMLInputElement>('input:not([type="hidden"])');
            if (input) {
                input.value = newValue!;
            }
        }
    }

    get form() { return this._internals.form; }

    get name() { return this.getAttribute('name'); }

    get required() { return this.hasAttribute('required'); }
    set required(value: boolean) {
        if (value) {
            this.setAttribute('required', '');
        } else {
            this.removeAttribute('required');
        }
    }

    get suggestion() {
        const root = this.shadowRoot;
        if (!root) {
            return null;
        }

        const suggestion = root.querySelector('.suggestion');
        if (suggestion instanceof HTMLElement
            && suggestion.textContent) {
            return suggestion.textContent;
        }

        return null;
    }
    set suggestion(value: string | null | undefined) {
        const root = this.shadowRoot;
        if (!root) {
            return;
        }
        const suggestion = root.querySelector('.suggestion');
        if (suggestion instanceof HTMLElement) {
            suggestion.textContent = value || null;
            delete suggestion.dataset.display;
            delete suggestion.dataset.value;
        }
    }

    get suggestionDisplay() {
        const root = this.shadowRoot;
        if (!root) {
            return null;
        }

        const suggestion = root.querySelector('.suggestion');
        if (suggestion instanceof HTMLElement
            && suggestion.dataset.display
            && suggestion.dataset.display.length) {
            return suggestion.dataset.display;
        }

        return null;
    }
    set suggestionDisplay(value: string | null | undefined) {
        const root = this.shadowRoot;
        if (!root) {
            return;
        }
        const suggestion = root.querySelector('.suggestion');
        if (suggestion instanceof HTMLElement) {
            if (!value || !value.length) {
                delete suggestion.dataset.display;
            } else {
                suggestion.dataset.display = value;
            }
        }
    }

    get suggestionValue() {
        const root = this.shadowRoot;
        if (!root) {
            return null;
        }

        const suggestion = root.querySelector('.suggestion');
        if (suggestion instanceof HTMLElement
            && suggestion.dataset.value
            && suggestion.dataset.value.length) {
            return suggestion.dataset.value;
        }

        return null;
    }
    set suggestionValue(value: string | null | undefined) {
        const root = this.shadowRoot;
        if (!root) {
            return;
        }
        const suggestion = root.querySelector('.suggestion');
        if (suggestion instanceof HTMLElement) {
            if (!value || !value.length) {
                delete suggestion.dataset.value;
            } else {
                suggestion.dataset.value = value;
            }
        }
    }

    get type() { return this.localName; }

    get validity() { return this._internals.validity; }
    get validationMessage() { return this._internals.validationMessage; }

    get value() { return this._value; }
    set value(v: string) { this.setValue(v); }

    get willValidate() { return this._internals.willValidate; }

    constructor() {
        super();

        this._internals = this.attachInternals();
    }

    connectedCallback() {
        const shadow = this.attachShadow({ mode: 'open', delegatesFocus: true });

        const style = document.createElement('style');
        style.textContent = `
:host {
    align-items: center;
    border-color: var(--field-border-color);
    border-radius: var(--tavenem-border-radius);
    box-sizing: content-box;
    color: var(--field-color);
    column-gap: 8px;
    cursor: text;
    display: inline-flex;
    flex-grow: 1;
    font-size: 1rem;
    font-weight: var(--tavenem-font-weight);
    line-height: 1.1875rem;
    min-height: 1.1875rem;
    padding-bottom: 7px;
    padding-top: 6px;
    position: relative;
    transition: border-width,border-color 200ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
}

:host(.field) {
    flex-direction: row;
}

:host(:disabled),
:host([inert]) {
    border-color: var(--tavenem-color-action-disabled);
}

input {
    appearance: none;
    background: none;
    border: 0;
    border-radius: var(--tavenem-border-radius);
    box-shadow: none;
    box-sizing: content-box;
    color: currentColor;
    display: block;
    font: inherit;
    height: 1.1875rem;
    margin: 0;
    min-height: calc(1.25rem + 10px);
    min-width: 0;
    opacity: var(--tavenem-field-input-opacity, unset);
    overflow: visible;
    padding: 0;
    position: relative;
    transition: border-color .15s ease-in-out, box-shadow .15s ease-in-out;
    width: 100%;
    -webkit-tap-highlight-color: transparent;

    &:focus {
        outline: 0;
    }

    &:disabled,
    &[readonly] {
        background-color: var(--tavenem-color-bg-alt);
        opacity: 1;
    }

    &:invalid {
        box-shadow: none;
        color: var(--tavenem-color-error);
    }

    &[type=search] {
        -moz-appearance: textfield;
        -webkit-appearance: textfield;
    }
}

input:-webkit-autofill {
    border-radius: inherit;
}

input:hover:not(:disabled):not([readonly])::file-selector-button {
    background-color: var(--tavenem-color-bg-alt);
}

input::-webkit-date-and-time-value {
    height: calc(var(--tavenem-lineheight-body) * 1rem);
}

input::placeholder {
    color: currentColor;
    opacity: 0.42;
    transition: opacity 200ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
}

input::file-selector-button {
    border-color: inherit;
    border-inline-end-width: 1px;
    border-radius: 0;
    border-style: solid;
    border-width: 0;
    color: var(--tavenem-color-text);
    margin: -6px -.75rem;
    margin-inline-end: .75rem;
    padding: 6px .75rem;
    pointer-events: none;
    transition: color .15s ease-in-out, background-color .15s ease-in-out, border-color .15s ease-in-out, box-shadow .15s ease-in-out;
}
input[type="file"]::file-selector-button {
    background: var(--tavenem-color-default);
    color: var(--tavenem-color-default-text);
}
input[type="file"]::file-selector-button:hover {
    background: var(--tavenem-color-default-darken);
}

input[type="color"] {
    height: auto;
    padding: 6px;
    width: 3rem;
}
input[type="color"]:not(:disabled):not([readonly]) {
    cursor: pointer;
}
input[type="color"]::-moz-color-swatch {
    border-radius: var(--tavenem-border-radius);
    height: calc(var(--tavenem-lineheight-body) * 1rem);
}
input[type="color"]::-webkit-color-swatch {
    border-radius: var(--tavenem-border-radius);
    height: calc(var(--tavenem-lineheight-body) * 1rem);
}

[list]::-webkit-calendar-picker-indicator {
    display: none;
}

::-moz-focus-inner {
    padding: 0;
    border-style: none;
}

::-webkit-datetime-edit-fields-wrapper,
::-webkit-datetime-edit-text,
::-webkit-datetime-edit-minute,
::-webkit-datetime-edit-hour-field,
::-webkit-datetime-edit-day-field,
::-webkit-datetime-edit-month-field,
::-webkit-datetime-edit-year-field {
    padding: 0;
}

::-webkit-inner-spin-button {
    height: auto;
}

[type="search"] {
    outline-offset: -2px;
    -webkit-appearance: textfield;
}

::-webkit-search-decoration {
    -webkit-appearance: none;
}

::-webkit-color-swatch-wrapper {
    padding: 0;
}

::file-selector-button {
    font: inherit;
    -webkit-appearance: button;
}

.suggestion {
    color: var(--tavenem-color-text-disabled);
    pointer-events: none;
    position: absolute;
}

button.clear {
    align-items: center;
    background-color: transparent;
    border-radius: 9999px;
    border-style: none;
    box-sizing: border-box;
    color: inherit;
    cursor: pointer;
    display: none;
    flex: 0 0 auto;
    font-size: 1.25rem;
    font-weight: var(--tavenem-font-weight-semibold);
    gap: .25rem;
    justify-content: center;
    line-height: 1;
    margin: 0;
    margin-top: var(--tavenem-field-input-button-margin-top, 0);
    min-width: calc(var(--button-font-size) + (var(--button-padding-x) * 2));
    outline: 0;
    overflow: hidden;
    padding: 5px;
    position: relative;
    text-align: center;
    text-decoration: none;
    text-transform: var(--tavenem-texttransform-button);
    transition: background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
    user-select: none;
    vertical-align: middle;
    -moz-appearance: none;
    -webkit-appearance: none;
    -webkit-tap-highlight-color: transparent;

    &:after {
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

    &:focus:not(:focus-visible) {
        outline: 0;
    }

    &:hover,
    &:focus-visible {
        background-color: var(--tavenem-color-action-hover-bg);
    }

    &:active:after {
        transform: scale(0,0);
        opacity: .1;
        transition: 0s;
    }

    :host(.clearable) & {
        display: inline-flex;
    }

    :host(:disabled) &,
    :host([readonly]):not(.clearable-readonly) &,
    :host(:required) &,
    :host(:state(empty)) & {
        display: none;
    }
}
button.clear::-moz-focus-inner {
    border-style: none;
}`;
        shadow.appendChild(style);

        const prefixSlot = document.createElement('slot');
        prefixSlot.name = 'prefix';
        shadow.appendChild(prefixSlot);

        const hiddenInput = document.createElement('input');
        hiddenInput.disabled = this.matches(':disabled');
        hiddenInput.hidden = true;
        hiddenInput.type = 'hidden';
        shadow.appendChild(hiddenInput);

        const suggestion = document.createElement('span');
        suggestion.classList.add('suggestion');
        shadow.appendChild(suggestion);

        const inputId = randomUUID();
        const input = document.createElement('input');
        input.id = inputId;
        if (this.hasAttribute('autocomplete')) {
            input.autocomplete = this.getAttribute('autocomplete') as AutoFill || 'off';
        }
        if (this.hasAttribute('autocorrect')) {
            input.setAttribute('autocorrect', this.getAttribute('autocorrect') || 'off');
        }
        input.autofocus = this.hasAttribute('autofocus');
        input.className = this.dataset.inputClass || '';
        input.disabled = hiddenInput.disabled;

        if (this.hasAttribute('inputmode')) {
            const inputModeValue = this.getAttribute('inputmode');
            if (inputModeValue) {
                input.inputMode = inputModeValue;
            }
        }
        if (this.hasAttribute('maxlength')) {
            const maxLengthValue = this.getAttribute('maxlength');
            if (maxLengthValue) {
                const maxLength = parseInt(maxLengthValue);
                input.maxLength = maxLength;
            }
        }
        if (this.hasAttribute('minlength')) {
            const minLengthValue = this.getAttribute('minlength');
            if (minLengthValue) {
                const minLength = parseInt(minLengthValue);
                input.minLength = minLength;
            }
        }
        if (this.hasAttribute('pattern')) {
            input.pattern = this.getAttribute('pattern') || '';
        }
        if (this.hasAttribute('placeholder')) {
            input.placeholder = this.getAttribute('placeholder') || '';
        }
        input.readOnly = this.hasAttribute('readonly');

        let setSize = false;
        if (this.hasAttribute('size')) {
            const sizeValue = this.getAttribute('size');
            if (sizeValue) {
                const size = parseFloat(sizeValue);
                if (size >= 1) {
                    input.size = size;
                    setSize = true;
                }
            }
        }
        if (!setSize) {
            input.size = Math.max(
                1,
                (this.getAttribute('placeholder') || '').length,
                this.hasAttribute('id') ? document.querySelector(`label[for="${this.getAttribute('id')}"]`)?.textContent?.length || 0 : 0);
        }

        if (this.hasAttribute('spellcheck')) {
            input.spellcheck = this.hasAttribute('spellcheck');
        } else {
            input.spellcheck = false;
        }
        input.style.cssText = this.dataset.inputStyle || '';
        if (this.hasAttribute('type')) {
            input.type = this.getAttribute('type') || 'text';
        }

        shadow.appendChild(input);

        const clear = document.createElement('button');
        clear.classList.add('clear');
        clear.tabIndex = -1;
        shadow.appendChild(clear);

        const icon = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
        icon.setAttributeNS(null, 'viewBox', '0 0 24 24');
        icon.setAttributeNS(null, 'height', '1rem');
        icon.setAttributeNS(null, 'width', '1rem');
        icon.innerHTML = '<path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>';
        clear.appendChild(icon);

        if ('showEmoji' in this.dataset) {
            const emoji = document.createElement('tf-emoji-input');
            emoji.classList.add('nested');
            emoji.style.margin = '0';
            emoji.tabIndex = -1;
            shadow.appendChild(emoji);
            emoji.addEventListener('valuechange', this.onEmoji.bind(this));

            const emojiTooltip = document.createElement('tf-tooltip');
            emojiTooltip.textContent = 'insert emoji';
            emoji.appendChild(emojiTooltip);
        }

        const slot = document.createElement('slot');
        shadow.appendChild(slot);

        if (this.hasAttribute('value')) {
            this.setValue(this.getAttribute('value'));
            this._initialValue = this._value;
        }

        if (this.hasAttribute('display')) {
            this.display = this.getAttribute('display');
            this._initialDisplay = this._display;
        }

        input.addEventListener('change', this.onChange.bind(this));
        input.addEventListener('input', this.onInput.bind(this));
        input.addEventListener('keydown', this.onKeyDown.bind(this));
        clear.addEventListener('mouseup', this.onClearMouseUp.bind(this));
        clear.addEventListener('click', this.onClear.bind(this));
    }

    disconnectedCallback() {
        const root = this.shadowRoot;
        if (!root) {
            return;
        }
        const input = root.querySelector<HTMLInputElement>('input:not([hidden])');
        if (input) {
            input.removeEventListener('change', this.onChange.bind(this));
            input.removeEventListener('input', this.onInput.bind(this));
            input.removeEventListener('keydown', this.onKeyDown.bind(this));
        }
        const clear = root.querySelector('button.clear');
        if (clear) {
            clear.removeEventListener('mousedown', this.onClearMouseUp.bind(this));
            clear.removeEventListener('click', this.onClear.bind(this));
        }

        const emoji = root.querySelector('tf-emoji-input');
        if (emoji) {
            emoji.removeEventListener('valuechange', this.onEmoji.bind(this));
        }
    }

    attributeChangedCallback(name: string, oldValue: string | null | undefined, newValue: string | null | undefined) {
        if (newValue == oldValue) {
            return;
        }

        const root = this.shadowRoot;
        if (!root) {
            return;
        }
        const hiddenInput = root.querySelector<HTMLInputElement>('input[type="hidden"]');
        const input = root.querySelector<HTMLInputElement>('input:not([type="hidden"])');
        if (!hiddenInput || !input) {
            return;
        }
        if (name === 'data-input-class') {
            input.className = newValue || '';
        } else if (name === 'data-input-style') {
            input.style.cssText = newValue || '';
        } else if (name === 'display') {
            if (this._display !== newValue) {
                this.display = newValue;
            }
        } else if (name === 'readonly') {
            input.readOnly = !!newValue;
        } else if (name === 'required') {
            this.setValidity();
        } else if (name === 'value') {
            this.setValue(newValue);
        }
    }

    formDisabledCallback(disabled: boolean) {
        const root = this.shadowRoot;
        if (!root) {
            return;
        }

        const hiddenInput = root.querySelector('input[type="hidden"]');
        if (hiddenInput instanceof HTMLInputElement) {
            hiddenInput.disabled = disabled;
        }

        const input = root.querySelector<HTMLInputElement>('input:not([type="hidden"])');
        if (input) {
            input.disabled = disabled;
        }

        const clear = root.querySelector<HTMLButtonElement>('button.clear');
        if (clear) {
            clear.disabled = disabled;
        }
    }

    formResetCallback() { this.reset(); }

    formStateRestoreCallback(state: string | File | FormData | null, mode: 'restore' | 'autocomplete') {
        if (typeof state === 'string') {
            this.value = state;
        } else if (state == null) {
            this.setValue(null);
        }
    }

    checkValidity() { return this._internals.checkValidity(); }

    focusInnerInput() {
        const root = this.shadowRoot;
        if (!root) {
            this.focus();
            return;
        }
        const input = root.querySelector('input:not([type="hidden"])');
        if (input instanceof HTMLElement) {
            input.focus();
            return;
        }
        this.focus();
    }

    reportValidity() { return this._internals.reportValidity(); }

    reset() {
        this.setValue(this._initialValue);
        if (this._initialDisplay
            && this._initialDisplay.length) {
            this.display = this._initialDisplay;
        }
    }

    select() {
        const root = this.shadowRoot;
        if (!root) {
            return;
        }
        const input = root.querySelector('input:not([type="hidden"])');
        if (input instanceof HTMLInputElement) {
            input.select();
        }
    }

    selectRange(start: number, end?: number) {
        const root = this.shadowRoot;
        if (!root) {
            return;
        }
        const input = root.querySelector('input:not([type="hidden"])');
        if (input instanceof HTMLInputElement) {
            input.setSelectionRange(start, end || null);
            input.focus();
        }
    }

    private onChange(event: Event) {
        if (event instanceof InputEvent
            && event.isComposing) {
            return;
        }

        const root = this.shadowRoot;
        if (!root) {
            return;
        }

        const input = root.querySelector('input:not([type="hidden"])');
        if (input instanceof HTMLInputElement
            && this._value !== input.value
            && this._display !== input.value) {
            this.dispatchEvent(TavenemInputHtmlElement.newValueChangeEvent(input.value));
        }
    }

    private onClear(event: Event) {
        event.preventDefault();
        event.stopPropagation();

        if ((this._value && this._value.length)
            || (this._display && this._display.length)) {
            this.setValue(null);
            this.dispatchEvent(TavenemInputHtmlElement.newValueChangeEvent(this._value));
        }
    }

    private onClearMouseUp(event: Event) {
        event.preventDefault();
        event.stopPropagation();
    }

    private onInput(event?: Event) {
        if (event instanceof InputEvent
            && event.isComposing) {
            return;
        }

        if ('inputDebounce' in this.dataset) {
            const debounce = parseInt(this.dataset.inputDebounce || '');
            if (Number.isFinite(debounce)
                && debounce > 0) {
                clearTimeout(this._inputDebounce);
                this._inputDebounce = setTimeout(this.updateInputDebounced.bind(this), debounce);
                return;
            }
        }

        const root = this.shadowRoot;
        if (!root) {
            return;
        }

        const input = root.querySelector('input:not([type="hidden"])');
        if (input instanceof HTMLInputElement
            && this._value !== input.value
            && this._display !== input.value) {
            this.value = input.value;
        }
    }

    private onKeyDown(event: KeyboardEvent) {
        if (event.isComposing) {
            return;
        }
        if (event.key === "Enter") {
            event.preventDefault();
            event.stopPropagation();
            this.onChange(event);
            this.dispatchEvent(TavenemInputHtmlElement.newEnterEvent());
        } else if (event.key === "Tab") {
            this.onTab(event);
        }
    }

    private onEmoji(event: Event) {
        event.stopPropagation();

        if (!(event instanceof CustomEvent)
            || !event.detail
            || !event.detail.value
            || typeof event.detail.value !== 'string') {
            return;
        }

        const root = this.shadowRoot;
        if (!root) {
            return;
        }

        const input = root.querySelector<HTMLInputElement>('input:not([type="hidden"])');
        if (input) {
            this.value = input.value + event.detail.value;
        }
    }

    private onTab(event: KeyboardEvent) {
        if (!event.target) {
            return;
        }

        const root = this.shadowRoot;
        if (!root) {
            return;
        }

        const hiddenInput = root.querySelector<HTMLInputElement>('input[type="hidden"]');
        const input = root.querySelector<HTMLInputElement>('input:not([type="hidden"])');
        if (!hiddenInput || !input) {
            return;
        }

        const suggestion = root.querySelector<HTMLElement>('.suggestion');
        if (!suggestion) {
            return;
        }

        const suggestionDisplay = suggestion.dataset.display && suggestion.dataset.display.length
            ? suggestion.dataset.display
            : suggestion.textContent;

        const suggestionValue = suggestion.dataset.value && suggestion.dataset.value.length
            ? suggestion.dataset.value
            : suggestionDisplay;
        if (suggestionValue
            && suggestionValue.length) {
            event.preventDefault();
            event.stopPropagation();

            this.value = suggestionValue;
            if (suggestionDisplay && suggestionDisplay.length) {
                this.display = suggestionDisplay;
            }

            delete suggestion.dataset.display;
            delete suggestion.dataset.value;
            suggestion.textContent = null;
            return;
        }
    }

    private setValidity() {
        const flags: ValidityStateFlags = {};
        let message: string | undefined;

        if (!this._value || !this._value.length) {
            if (this.hasAttribute('required')) {
                flags.valueMissing = true;
                message = 'value required';
            }
        } else {
            if (this.hasAttribute('minlength')) {
                const minLengthValue = this.getAttribute('minlength');
                if (minLengthValue) {
                    const minLength = parseInt(minLengthValue);
                    if (Number.isFinite(minLength)
                        && this._value.length < minLength) {
                        flags.tooShort = true;
                        message = `value must have at least ${minLength} characters`;
                    }
                }
            }
            if (this.hasAttribute('maxlength')) {
                const maxLengthValue = this.getAttribute('maxlength');
                if (maxLengthValue) {
                    const maxLength = parseInt(maxLengthValue);
                    if (Number.isFinite(maxLength)
                        && this._value.length > maxLength) {
                        flags.tooLong = true;
                        message = `value must have no more than ${maxLength} characters`;
                    }
                }
            }
        }

        if (Object.keys(flags).length > 0) {
            let input: HTMLInputElement | null | undefined;
            const root = this.shadowRoot;
            if (root) {
                input = root.querySelector<HTMLInputElement>('input:not([type="hidden"])');
            }
            this._internals.setValidity(flags, message, input || undefined);
        } else {
            this._internals.setValidity({});
        }
    }

    private setValue(value?: string | null) {
        if (value == null) {
            if (this._value == null) {
                return;
            }
        } else if (this._value === value) {
            return;
        }

        this._value = value == null ? '' : value;

        if (this._value.length) {
            this._internals.setFormValue(this._value);
        } else {
            this._internals.setFormValue(null);
        }

        this.display = null;

        this.setValidity();

        const root = this.shadowRoot;
        if (root) {
            const hiddenInput = root.querySelector<HTMLInputElement>('input[type="hidden"]');
            if (hiddenInput) {
                hiddenInput.value = this._value;
            }
        }

        this.dispatchEvent(TavenemInputHtmlElement.newValueInputEvent(this._value));
    }

    private updateInputDebounced() {
        const root = this.shadowRoot;
        if (!root) {
            return;
        }
        const input = root.querySelector('input:not([type="hidden"])');
        if (input instanceof HTMLInputElement
            && this._value !== input.value
            && this._display !== input.value) {
            this.value = input.value;
        }
    }
}
