import { randomUUID } from "../tavenem-utility";

export class TavenemNumericInputHtmlElement extends HTMLElement {
    static formAssociated = true;

    private _display: string | null | undefined;
    private _initialDisplay: string | null | undefined;
    private _initialValue: number | null | undefined;
    private _inputDebounce: number = -1;
    private _internals: ElementInternals;
    private _max: number | null | undefined;
    private _min: number | null | undefined;
    private _numericValue: number | null | undefined;
    private _step: number | null | undefined;
    private _value = '';

    static get observedAttributes() {
        return [
            'data-input-class',
            'data-input-style',
            'display',
            'max',
            'min',
            'readonly',
            'value'
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

    get max() { return this._max; }
    set max(value: number | null | undefined) {
        this._max = value;
        this.setValidity();
    }

    get min() { return this._min; }
    set min(value: number | null | undefined) {
        this._min = value;
        this.setValidity();
    }

    get name() { return this.getAttribute('name'); }

    get numericValue() { return this._numericValue; }
    set numericValue(value: number | null | undefined) {
        if (value == null) {
            if (this._numericValue == null) {
                return;
            }
        } else if (this._numericValue === value) {
            return;
        }

        this._numericValue = value;

        const newValue = this._numericValue == null
            ? ''
            : this._numericValue.toString();

        if (this._value === newValue) {
            return;
        }

        this._value = newValue;

        if (newValue.length) {
            this._internals.setFormValue(newValue);
        } else {
            this._internals.setFormValue(null);
        }

        this.display = null;

        this.setValidity();

        const root = this.shadowRoot;
        if (root) {
            const hiddenInput = root.querySelector<HTMLInputElement>('input[type="hidden"]');
            if (hiddenInput) {
                hiddenInput.value = newValue;
            }

            if (!this.matches(':disabled')) {
                const spinUpButton = root.querySelector<HTMLButtonElement>('.spin-up');
                if (spinUpButton) {
                    spinUpButton.disabled = this._numericValue == null
                        || !Number.isFinite(this._numericValue)
                        || (this._max != null && this._numericValue >= this._max);
                }
                const spinDownButton = root.querySelector<HTMLButtonElement>('.spin-down');
                if (spinDownButton) {
                    spinDownButton.disabled = this._numericValue == null
                        || !Number.isFinite(this._numericValue)
                        || (this._min != null && this._numericValue <= this._min);
                }
            }
        }

        this.dispatchEvent(TavenemNumericInputHtmlElement.newValueInputEvent(newValue));
    }

    get required() { return this.hasAttribute('required'); }
    set required(value: boolean) {
        if (value) {
            this.setAttribute('required', '');
        } else {
            this.removeAttribute('required');
        }
    }

    get step() { return this._step; }
    set step(value: number | null | undefined) { this._step = value; }

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
    --field-active-border-color: var(--tavenem-color-primary);
    --field-active-border-hover-color: var(--tavenem-color-primary-lighten);
    --field-active-label-color: var(--tavenem-color-primary);
    --field-border-color: var(--tavenem-color-border-input);
    --field-border-hover-color: var(--tavenem-color-action);
    --field-color: var(--tavenem-color-text);
    --field-label-color: var(--tavenem-color-text-secondary);
    --number-field-inherited-hover-bg: var(--tavenem-color-action-hover-bg);
    border: none !important;
    color: var(--tavenem-color-text);
    display: flex;
    flex-basis: auto;
    flex-direction: column;
    flex-shrink: 1;
    margin-bottom: .5rem;
    margin-left: 0;
    margin-right: 0;
    margin-top: 1rem;
    max-width: 100%;
    padding: 0;
    position: relative;
    vertical-align: top;
}

* {
    font-family: var(--tavenem-font-family);
}

:host > label {
    color: var(--field-label-color);
    display: block;
    font-size: 1rem;
    font-weight: var(--tavenem-font-weight);
    left: 0;
    line-height: 1;
    padding: 0;
    pointer-events: none;
    position: absolute;
    top: 0;
    transform: translate(0, calc(1.25rem + 11px)) scale(1);
    transform-origin: top left;
    transition: color 200ms cubic-bezier(0.0, 0, 0.2, 1) 0ms,transform 200ms cubic-bezier(0.0, 0, 0.2, 1) 0ms;
    z-index: 0;

    *[dir="rtl"] & {
        left: unset;
        right: 0;
        transform-origin: top right;
    }
}

:host([required]) > label:after {
    color: var(--tavenem-color-error);
    content: " *";
}

:host(:not(.filled, .outlined)) > .input:has(~ label) {
    margin-top: 1rem;
}

:host(:not(.outlined)) > .input {
    &:before {
        border-color: var(--field-border-color);
        border-bottom-style: solid;
        border-bottom-width: 1px;
        bottom: 0;
        content: "\xa0";
        left: 0;
        right: 0;
        pointer-events: none;
        position: absolute;
        transition: border-bottom 0.2s, border-bottom-color 200ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, background-color 0.2s;
    }
}

:host(:not(.outlined, :disabled, [readonly], [inert])) > .input:hover:before {
    border-bottom-color: var(--field-border-hover-color);
}

:host(.filled) {
    background-color: transparent !important;
    color: var(--tavenem-color-text) !important;

    > .input {
        background-color: rgba(0, 0, 0, 0.09);
        border-top-left-radius: var(--tavenem-border-radius);
        border-top-right-radius: var(--tavenem-border-radius);
        padding-bottom: 10px;
        padding-left: 12px;
        padding-right: 12px;
        padding-top: calc(1rem + 11px);
        position: relative;
        transition: background-color 200ms cubic-bezier(0, 0, 0.2, 1) 0ms;

        &:hover {
            background-color: rgba(0, 0, 0, 0.13);
        }

        &:disabled,
        &[inert],
        [inert] & {
            background-color: rgba(0, 0, 0, 0.12);
        }

        input:-webkit-autofill {
            border-top-left-radius: inherit;
            border-top-right-radius: inherit;
        }
    }

    > label {
        pointer-events: none;
        transform: translate(12px, calc(1.25rem + 16px)) scale(1);
        z-index: 1;

        *[dir="rtl"] & {
            transform: translate(-12px, calc(1.25rem + 16px)) scale(1);
        }
    }

    > .field-helpers {
        padding-left: 12px;
        padding-right: 12px;
    }
}

:host(.filled) > .input:not(:has(~ label)) {
    padding-top: 11px;
}

:host(.outlined) > .input {
    background-color: var(--tavenem-color-bg-alt);
    border-color: var(--tavenem-border-color);
    border-style: solid;
    border-width: 1px;
    padding-bottom: 5px;
    padding-left: 14px;
    padding-right: 14px;
    padding-top: calc(.5rem + 2.5px);
}

:host(.outlined) > label {
    background-color: var(--tavenem-color-bg-alt);
    padding: 0px 5px;
    pointer-events: none;
    transform: translate(14px, calc(.75rem + 7.5px)) scale(1);

    *[dir="rtl"] & {
        transform: translate(-14px, calc(.75rem + 7.5px)) scale(1);
    }
}

:host(.outlined) > .field-helpers {
    padding-left: 8px;
    padding-right: 8px;
}

:host(.outlined) > .input:not(:has(~ label)) {
    padding-bottom: 2.5px;
    padding-top: 2.5px;
}

:host(:focus-within:not(:disabled, [readonly], [inert])) {
    --field-border-color: var(--field-active-border-color);
    --field-border-hover-color: var(--field-active-border-hover-color);
}

:host(:not(:disabled, [readonly], [inert])) > .input:hover {
    border-color: var(--field-border-hover-color);
}

:host(:focus-within:not(.filled, .outlined)) > label,
:host([placeholder]:not(.filled, .outlined)) > label,
:host(:state(has-value):not(.filled, .outlined)) > label {
    transform: translate(0, 1.5px) scale(.75);
}

:host(.filled:focus-within) > label,
:host([placeholder].filled) > label,
:host(.filled:state(has-value)) > label {
    transform: translate(12px, 10px) scale(.75);

    *[dir="rtl"] & {
        transform: translate(-12px, 10px) scale(.75);
    }
}

:host(.outlined:focus-within) > label,
:host([placeholder].outlined) > label,
:host(.outlined:state(has-value)) > label {
    transform: translate(14px, -6px) scale(.75);

    *[dir="rtl"] & {
        transform: translate(-14px, -6px) scale(.75);
    }
}

:host(.dense) {
    margin-bottom: 2px;
    margin-top: 3px;

    > .input {
        padding-top: 3px;
        padding-bottom: 3px;
    }

    > label {
        transform: translate(0, calc(1.25rem + 8px)) scale(1);
    }
}

:host(.dense.filled) {
    --tavenem-field-input-button-margin-top: -7px;

    > .input {
        padding-bottom: 3px;
        padding-left: 3px;
        padding-right: 3px;
        padding-top: calc(1rem + 4px);

        button, svg {
            margin-top: -4px;
        }
    }

    > label {
        transform: translate(3px, calc(1.25rem + 9px)) scale(1);

        *[dir="rtl"] & {
            transform: translate(-3px, calc(1.25rem + 9px)) scale(1);
        }
    }
}

:host(.dense.outlined) > .input {
    padding-bottom: 5px;
    padding-left: 5px;
    padding-right: 5px;
    padding-top: calc(.5rem + 2.5px);
}

:host(.dense.outlined) > label {
    transform: translate(5px, calc(.75rem + 7.5px)) scale(1);

    *[dir="rtl"] & {
        transform: translate(-5px, calc(.75rem + 7.5px)) scale(1);
    }
}

:host(.dense.outlined) > .input:not(:has(~ label)) {
    padding-bottom: 2.5px;
    padding-top: 2.5px;
}

:host(.dense:focus-within:not(.filled, .outlined)) > label,
:host([placeholder].dense:not(.filled, .outlined)) > label,
:host(.dense:not(.filled, .outlined):state(has-value)) > label {
    transform: translate(0, 1.5px) scale(.75);
}

:host(.dense.filled:focus-within) > label,
:host([placeholder].dense.filled) > label,
:host(.dense.filled:state(has-value)) > label {
    transform: translate(3px, 4px) scale(.75);

    *[dir="rtl"] & {
        transform: translate(-3px, 4px) scale(.75);
    }
}

:host(.dense.outlined:focus-within) > label,
:host([placeholder].dense.outlined) > label,
:host(.dense.outlined:state(has-value)) > label {
    transform: translate(5px, -6px) scale(.75);

    *[dir="rtl"] & {
        transform: translate(-5px, -6px) scale(.75);
    }
}

:host(:disabled) .input,
:host([readonly]) .input,
:host([inert]) .input {
    cursor: default;

    > svg {
        cursor: default;
        pointer-events: none;
    }

    input {
        opacity: 1;
    }
}

:host(.filled:disabled) .input,
:host([inert].filled) .input {
    background-color: rgba(0, 0, 0, 0.12);
}

:host(.outlined:disabled) .input,
:host([inert].outlined) .input {
    border-color: var(--tavenem-color-action-disabled);
}

:host(:invalid:state(touched)) {
    --field-active-border-color: var(--tavenem-color-error);
    --field-active-border-hover-color: var(--tavenem-color-error);
    --field-active-label-color: var(--tavenem-color-error);
    --field-border-color: var(--tavenem-color-error);
    --field-border-hover-color: var(--tavenem-color-error);
    --field-color: var(--tavenem-color-error);
    --field-label-color: var(--tavenem-color-error);
}

:host(:disabled),
:host([readonly]),
:host([inert]) {
    --tavenem-field-input-opacity: 1;
}

:host(:where(.primary,
    .secondary,
    .tertiary,
    .danger,
    .dark,
    .default,
    .info,
    .success,
    .warning):not(:invalid, :disabled, [inert])) {
    --field-active-border-color: var(--tavenem-theme-color);
    --field-active-border-hover-color: var(--tavenem-theme-color-lighten);
    --field-active-label-color: var(--tavenem-theme-color);
    --field-border-color: var(--tavenem-theme-color);
    --field-border-hover-color: var(--tavenem-theme-color-lighten);
    --field-label-color: var(--tavenem-theme-color);
}

:host(.filled:where(.primary,
    .secondary,
    .tertiary,
    .danger,
    .dark,
    .default,
    .info,
    .success,
    .warning)) {
    background-color: transparent;

    > .input {
        background-color: hsla(var(--tavenem-theme-color-hue), var(--tavenem-theme-color-saturation), var(--tavenem-theme-color-lightness), .09);

        &:hover {
            background-color: hsla(var(--tavenem-theme-color-hue), var(--tavenem-theme-color-saturation), var(--tavenem-theme-color-lightness), 0.13);
        }

        &:disabled, &[inert], [inert] & {
            background-color: var(--tavenem-theme-color-hover-bright);
        }
    }
}

:host(:disabled),
:host([inert]) {
    --field-color: var(--tavenem-color-text-disabled);
    --field-label-color: var(--tavenem-color-text-disabled);

    > .input {
        border-color: var(--tavenem-color-action-disabled);
        color: var(--tavenem-color-text-disabled);
    }
}

:host(.filled:disabled) > .input,
:host([inert].filled) > .input {
    background-color: rgba(0, 0, 0, 0.12);
}

:host(.outlined:disabled) > .input,
:host([inert].outlined) > .input {
    border-color: var(--tavenem-color-action-disabled);
}

input::placeholder {
    color: currentColor;
    opacity: 0.42;
    transition: opacity 200ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
}

.input svg {
    min-height: 1.5em;
}

.field-helpers {
    color: var(--field-label-color);
    display: contents;
    font-size: 0.75rem;
    font-weight: var(--tavenem-font-weight);
    line-height: 1.66;
    overflow: hidden;
    text-align: start;

    > * {
        margin-top: 3px;
        padding-left: 8px;
        padding-right: 8px;
    }
}

.validation-messages {
    display: none;
    list-style: none;
    margin-right: auto;
    margin-bottom: 0;
    margin-top: 0;
    padding-left: 0;
}

:host(:state(touched)) .validation-messages {
    display: initial;
}

slot[name="helpers"]::slotted(.onfocus) {
    display: none;
}

:host(:focus-within) slot[name="helpers"]::slotted(.onfocus) {
    display: initial;
}

:host(.primary:not(:invalid, :disabled, [inert])),
:host(.secondary:not(:invalid, :disabled, [inert])),
:host(.tertiary:not(:invalid, :disabled, [inert])),
:host(.danger:not(:invalid, :disabled, [inert])),
:host(.dark:not(:invalid, :disabled, [inert])),
:host(.default:not(:invalid, :disabled, [inert])),
:host(.info:not(:invalid, :disabled, [inert])),
:host(.success:not(:invalid, :disabled, [inert])),
:host(.warning:not(:invalid, :disabled, [inert])) {
    --field-active-label-color: var(--tavenem-theme-color);
}

:host(:invalid) {
    --field-active-label-color: var(--tavenem-color-error);
}

slot {
    border-radius: inherit;
}

.input {
    align-items: center;
    box-sizing: content-box;
    color: var(--field-color);
    column-gap: 8px;
    cursor: text;
    display: inline-flex;
    font-size: 1rem;
    font-weight: var(--tavenem-font-weight);
    line-height: 1.1875rem;
    min-height: 1.1875rem;
    padding-bottom: 7px;
    padding-top: 6px;
    position: relative;
}

:host(:where(.primary,
    .secondary,
    .tertiary,
    .danger,
    .dark,
    .default,
    .info,
    .success,
    .warning)) {
    --number-field-inherited-hover-bg: var(--tavenem-theme-color-hover);
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

input[type=number] {
    -moz-appearance: textfield;
}

input:-webkit-autofill {
    border-radius: inherit;
}

input::placeholder {
    color: currentColor;
    opacity: 0.42;
    transition: opacity 200ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
}

input::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
}
input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
}

::-moz-focus-inner {
    padding: 0;
    border-style: none;
}

::-webkit-inner-spin-button {
    height: auto;
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
button::-moz-focus-inner {
    border-style: none;
}

.spin-buttons {
    display: inline-flex;
    flex-direction: column;
    justify-content: space-between;

    button {
        align-items: center;
        background-color: transparent;
        border: none;
        border-radius: var(--tavenem-border-radius);
        box-sizing: border-box;
        color: inherit;
        cursor: pointer;
        display: inline-flex;
        flex: 0 1 auto;
        font-size: 1rem;
        font-weight: var(--tavenem-font-weight-semibold);
        gap: .25rem;
        justify-content: center;
        line-height: var(--tavenem-lineheight-button);
        margin: 0;
        max-height: .9375rem;
        outline: 0;
        overflow: hidden;
        padding: 2px 0;
        position: relative;
        text-decoration: none;
        text-transform: var(--tavenem-texttransform-button);
        transition: background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,border 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
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
            transform: scale(10,10);
            transition: transform .3s,opacity 1s;
            width: 100%;
        }

        &:hover,
        &:focus-visible {
            background-color: var(--number-field-inherited-hover-bg, var(--tavenem-color-action-hover-bg));
        }

        &:active:after {
            transform: scale(0,0);
            opacity: .1;
            transition: 0s;
        }

        &:disabled, [inert] & {
            color: var(--tavenem-color-text-disabled);
            cursor: default;
            pointer-events: none;
        }

        svg {
            height: 1.5em;
            fill: currentColor;
            flex-shrink: 0;
            width: auto;
        }
    }
}

:host([readonly]) .spin-buttons {
    display: none;
}

:host([inert]) {
    --field-border-color: var(--tavenem-color-action-disabled);
}

:host([readonly]),
:host([inert]) {
    cursor: default;
    pointer-events: none;
}
`;
        shadow.appendChild(style);

        const outerInput = document.createElement('div');
        outerInput.classList.add('input');
        shadow.appendChild(outerInput);

        const prefixSlot = document.createElement('slot');
        prefixSlot.name = 'prefix'
        outerInput.appendChild(prefixSlot);

        const hiddenInput = document.createElement('input');
        hiddenInput.disabled = this.matches(':disabled');
        hiddenInput.hidden = true;
        hiddenInput.type = 'hidden';
        outerInput.appendChild(hiddenInput);

        const inputId = randomUUID();
        const input = document.createElement('input');
        input.id = inputId;
        if (this.hasAttribute('autocomplete')) {
            input.autocomplete = this.getAttribute('autocomplete') as AutoFill || 'off';
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

        if (this.hasAttribute('step')) {
            const stepValue = this.getAttribute('step')?.toLowerCase();
            if (stepValue) {
                input.step = stepValue;

                if (stepValue !== 'any') {
                    const step = stepValue.includes('.')
                        || stepValue.includes('e')
                        ? parseFloat(stepValue)
                        : parseInt(stepValue);
                    if (Number.isFinite(step)) {
                        this._step = step;
                    }
                }
            }
        }
        input.style.cssText = this.dataset.inputStyle || '';
        input.type = 'text';

        outerInput.appendChild(input);

        const clear = document.createElement('button');
        clear.classList.add('clear');
        clear.tabIndex = -1;
        outerInput.appendChild(clear);

        const icon = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
        icon.setAttributeNS(null, 'viewBox', '0 0 24 24');
        icon.setAttributeNS(null, 'height', '1rem');
        icon.setAttributeNS(null, 'width', '1rem');
        icon.innerHTML = '<path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>';
        clear.appendChild(icon);

        const postfixSlot = document.createElement('slot');
        postfixSlot.name = 'postfix';
        outerInput.appendChild(postfixSlot);

        if (!('hideSteppers' in this.dataset)) {
            const spinButtons = document.createElement('div');
            spinButtons.classList.add('spin-buttons');
            outerInput.appendChild(spinButtons);

            const spinUpButton = document.createElement('button');
            spinUpButton.classList.add('spin-up');
            spinUpButton.disabled = true;
            spinUpButton.tabIndex = -1;
            spinButtons.appendChild(spinUpButton);
            spinUpButton.addEventListener('mouseup', this.onButtonMouseUp.bind(this));
            spinUpButton.addEventListener('click', this.increment.bind(this));

            const spinUpIcon = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
            spinUpButton.appendChild(spinUpIcon);
            spinUpIcon.outerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px"><path d="M0 0h24v24H0z" fill="none"/><path d="M7.41 15.41 12 10.83l4.59 4.58L18 14l-6-6-6 6z"/></svg>`;

            const spinDownButton = document.createElement('button');
            spinDownButton.classList.add('spin-down');
            spinDownButton.disabled = true;
            spinDownButton.tabIndex = -1;
            spinButtons.appendChild(spinDownButton);
            spinDownButton.addEventListener('mouseup', this.onButtonMouseUp.bind(this));
            spinDownButton.addEventListener('click', this.decrement.bind(this));

            const spinDownIcon = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
            spinDownButton.appendChild(spinDownIcon);
            spinDownIcon.outerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/></svg>`;
        }

        const helpers = document.createElement('div');
        helpers.classList.add('field-helpers');
        shadow.appendChild(helpers);

        const validationList = document.createElement('ul');
        validationList.classList.add('validation-messages');
        helpers.appendChild(validationList);

        const helperSlot = document.createElement('slot');
        helperSlot.name = 'helpers';
        helpers.appendChild(helperSlot);

        if ('label' in this.dataset
            && this.dataset.label
            && this.dataset.label.length) {
            const label = document.createElement('label');
            label.htmlFor = inputId;
            label.textContent = this.dataset.label;
            shadow.appendChild(label);
        }

        const slot = document.createElement('slot');
        shadow.appendChild(slot);

        if (this.hasAttribute('max')) {
            this.setMax(this.getAttribute('max'));
        }
        if (this.hasAttribute('min')) {
            this.setMin(this.getAttribute('min'));
        }

        if (this.hasAttribute('value')) {
            this.setValue(this.getAttribute('value'));
            this._initialValue = this._numericValue;
        }

        this.display = this.getAttribute('display');
        this._initialDisplay = this._display;

        input.addEventListener('change', this.onChange.bind(this));
        input.addEventListener('input', this.onInput.bind(this));
        input.addEventListener('keydown', this.onKeyDown.bind(this));
        clear.addEventListener('mouseup', this.onButtonMouseUp.bind(this));
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
            clear.removeEventListener('mousedown', this.onButtonMouseUp.bind(this));
            clear.removeEventListener('click', this.onClear.bind(this));
        }
        const spinUpButton = root.querySelector('.spin-up');
        if (spinUpButton) {
            spinUpButton.removeEventListener('mouseup', this.onButtonMouseUp.bind(this));
            spinUpButton.removeEventListener('click', this.increment.bind(this));
        }
        const spinDownButton = root.querySelector('.spin-down');
        if (spinDownButton) {
            spinDownButton.removeEventListener('mouseup', this.onButtonMouseUp.bind(this));
            spinDownButton.removeEventListener('click', this.decrement.bind(this));
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
        } else if (name === 'max') {
            this.setMax(newValue);
        } else if (name === 'min') {
            this.setMin(newValue);
        } else if (name === 'readonly') {
            input.readOnly = (newValue != null);
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

        const spinUpButton = root.querySelector<HTMLButtonElement>('.spin-up');
        if (spinUpButton) {
            spinUpButton.disabled = disabled
                || this._numericValue == null
                || !Number.isFinite(this._numericValue)
                || (this._max != null && this._numericValue >= this._max);
        }
        const spinDownButton = root.querySelector<HTMLButtonElement>('.spin-down');
        if (spinDownButton) {
            spinDownButton.disabled = disabled
                || this._numericValue == null
                || !Number.isFinite(this._numericValue)
                || (this._min != null && this._numericValue <= this._min);
        }
    }

    formResetCallback() { this.reset(); }

    formStateRestoreCallback(state: string | File | FormData | null, mode: 'restore' | 'autocomplete') {
        if (typeof state === 'string') {
            this.value = state;
        } else if (state == null) {
            this.numericValue = null;
        }
    }

    checkValidity() { return this._internals.checkValidity(); }

    decrement(event?: Event) {
        this.stepValue(true, event);
    }

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

    increment(event?: Event) {
        this.stepValue(false, event);
    }

    reportValidity() { return this._internals.reportValidity(); }

    reset() {
        this._internals.states.delete('touched');
        this.numericValue = this._initialValue;
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

    private static getPrecision(value: number) {
        if (isNaN(value)
            || value % 1 === 0) {
            return 0;
        }

        let [i, p, d, e, n] = value.toString().split(/(\.|[eE][\-+])/g);
        if (e) {
            e = e.toLowerCase();
        }
        if (p && p !== '.') {
            p = p.toLowerCase();
        }
        const f = e === 'e-';
        return (+(p === '.'
            && (!e || f)
            && d.length)
            + +(f && parseInt(n)))
            || (p === 'e-' && parseInt(d))
            || 0;
    }

    private onButtonMouseUp(event: Event) {
        event.preventDefault();
        event.stopPropagation();
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
            this._internals.states.add('touched');
            this.value = input.value;
            this.dispatchEvent(TavenemNumericInputHtmlElement.newValueChangeEvent(this._value));
        }
    }

    private onClear(event: Event) {
        event.preventDefault();
        event.stopPropagation();

        if (this._numericValue != null
            || (this._display && this._display.length)) {
            this._internals.states.add('touched');
            this.numericValue = null;
            this.dispatchEvent(TavenemNumericInputHtmlElement.newValueChangeEvent(this._value));
        }
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
            this._internals.states.add('touched');
            this.value = input.value;
        }
    }

    private onKeyDown(event: KeyboardEvent) {
        if (event.isComposing) {
            return;
        }
        if (event.key === "ArrowDown") {
            this.decrement(event);
        } else if (event.key === "ArrowUp") {
            this.increment(event);
        } else if (event.key === "Enter") {
            event.preventDefault();
            event.stopPropagation();
            this.onChange(event);
            this.dispatchEvent(TavenemNumericInputHtmlElement.newEnterEvent());
        }
    }

    private setMax(value?: string | null) {
        if (value == null) {
            this.max = null;
            return;
        }

        const max = value.includes('.')
            || value.includes('e')
            ? parseFloat(value)
            : parseInt(value);
        if (Number.isNaN(max)) {
            this.max = null;
        } else {
            this.max = max;
        }
    }

    private setMin(value?: string | null) {
        if (value == null) {
            this.min = null;
            return;
        }

        const min = value.includes('.')
            || value.includes('e')
            ? parseFloat(value)
            : parseInt(value);
        if (Number.isNaN(min)) {
            this.min = null;
        } else {
            this.min = min;
        }
    }

    private setValidity() {
        const flags: ValidityStateFlags = {};
        const messages: string[] = [];

        if (this._numericValue == null) {
            if (this.hasAttribute('value')
                && this.getAttribute('value')?.length) {
                flags.badInput = true;
                messages.push('value cannot be converted to a number');
            }
            if (this.hasAttribute('required')) {
                flags.valueMissing = true;
                messages.push('value required');
            }
        } else {
            if (this._max != null && this._numericValue > this._max) {
                flags.rangeOverflow = true;
                messages.push('value above maximum');
            } else if (this._min != null && this._numericValue < this._min) {
                flags.rangeUnderflow = true;
                messages.push('value below minimum');
            }
        }

        const root = this.shadowRoot;
        if (Object.keys(flags).length > 0) {
            this._internals.setValidity(
                flags,
                messages.join('; '),
                root?.querySelector<HTMLInputElement>('input:not([type="hidden"])') || undefined);
        } else {
            this._internals.setValidity({});
        }

        if (!root) {
            return;
        }
        const validationList = root.querySelector('.validation-messages');
        if (validationList) {
            validationList.replaceChildren(...messages.map(m => {
                const li = document.createElement('li');
                li.textContent = m;
                return li;
            }));
        }
    }

    private setValue(value?: string | null) {
        if (value == null || !value.length) {
            this.numericValue = null;
        } else {
            this.numericValue = this._step != null
                && Number.isInteger(this._step)
                && (this._initialValue == null
                    || Number.isInteger(this._initialValue))
                ? parseInt(value)
                : parseFloat(value);
        }
    }

    private stepValue(down: boolean, event?: Event) {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }

        if (this._numericValue == null
            || !Number.isFinite(this._numericValue)) {
            return;
        }

        const step = this._step || 1;

        let newValue = this._numericValue;
        if (down) {
            newValue -= step;
        } else {
            newValue += step;
        }

        const precision = TavenemNumericInputHtmlElement.getPrecision(step);
        if (precision === 0) {
            newValue = Math.round(newValue);
        } else {
            const factor = precision * 10;
            newValue = Math.round(newValue * factor) / factor;
        }

        const max = parseFloat(this.getAttribute('max') || '');
        if (!Number.isNaN(max)) {
            newValue = Math.min(max, newValue);
        }

        const min = parseFloat(this.getAttribute('min') || '');
        if (!Number.isNaN(min)) {
            newValue = Math.max(min, newValue);
        }

        if (this._numericValue !== newValue) {
            this.numericValue = newValue;
        }

        if (event) {
            this._internals.states.add('touched');
        }
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
