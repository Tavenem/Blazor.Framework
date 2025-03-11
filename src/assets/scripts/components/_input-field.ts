import { TavenemInputHtmlElement } from './_input'
import { randomUUID } from '../tavenem-utility'

export class TavenemInputFieldHtmlElement extends HTMLElement {
    static formAssociated = true;
    static style = `:host {
    --field-active-border-color: var(--tavenem-color-primary);
    --field-active-border-hover-color: var(--tavenem-color-primary-lighten);
    --field-active-label-color: var(--tavenem-color-primary);
    --field-border-color: var(--tavenem-color-border-input);
    --field-border-hover-color: var(--tavenem-color-action);
    --field-color: var(--tavenem-color-text);
    --field-label-color: var(--tavenem-color-text-secondary);
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

:host([inert]) {
    --field-border-color: var(--tavenem-color-action-disabled);
    cursor: default;
    pointer-events: none;
}

:host(:not(.filled, .outlined)) > tf-input:has(~ label) {
    margin-top: 1rem;
}

:host > tf-input {
    flex-grow: 1;
}

:host(:not(.outlined)) > tf-input {
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

:host(:not(.outlined, :disabled, [readonly], [inert])) > tf-input:hover:before {
    border-bottom-color: var(--field-border-hover-color);
}

:host(.filled) {
    background-color: transparent !important;
    color: var(--tavenem-color-text) !important;

    > tf-input {
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

:host(.filled) > tf-input:not(:has(~ label)) {
    padding-top: 11px;
}

:host(.outlined) > tf-input {
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

:host(.outlined) > tf-input:not(:has(~ label)) {
    padding-bottom: 2.5px;
    padding-top: 2.5px;
}

:host(:focus-within:not(:disabled, [readonly], [inert])) {
    --field-border-color: var(--field-active-border-color);
    --field-border-hover-color: var(--field-active-border-hover-color);
}

:host(:not(:disabled, [readonly], [inert])) > tf-input:hover {
    border-color: var(--field-border-hover-color);
}

:host([inline]:not(.filled, .outlined)) > label,
:host(:focus-within:not(.filled, .outlined)) > label,
:host([placeholder]:not(.filled, .outlined)) > label,
:host(:state(has-value):not(.filled, .outlined)) > label,
:host(.prefixed:not(.filled, .outlined)) > label {
    transform: translate(0, 1.5px) scale(.75);
}

:host([inline].filled) > label,
:host(.filled:focus-within) > label,
:host([placeholder].filled) > label,
:host(.filled:state(has-value)) > label,
:host(.prefixed.filled) > label {
    transform: translate(12px, 10px) scale(.75);

    *[dir="rtl"] & {
        transform: translate(-12px, 10px) scale(.75);
    }
}

:host([inline].outlined) > label,
:host(.outlined:focus-within) > label,
:host([placeholder].outlined) > label,
:host(.outlined:state(has-value)) > label,
:host(.prefixed.outlined) > label {
    transform: translate(14px, -6px) scale(.75);

    *[dir="rtl"] & {
        transform: translate(-14px, -6px) scale(.75);
    }
}

:host(.dense) {
    margin-bottom: 2px;
    margin-top: 3px;

    > tf-input {
        padding-top: 3px;
        padding-bottom: 3px;
    }

    > label {
        transform: translate(0, calc(1.25rem + 8px)) scale(1);
    }
}

:host(.dense.filled) {
    --tavenem-field-input-button-margin-top: -7px;

    > tf-input {
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

:host(.dense.outlined) > tf-input {
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

:host(.dense.outlined) > tf-input:not(:has(~ label)) {
    padding-bottom: 2.5px;
    padding-top: 2.5px;
}

:host([inline].dense:not(.filled, .outlined)) > label,
:host(.dense:focus-within:not(.filled, .outlined)) > label,
:host([placeholder].dense:not(.filled, .outlined)) > label,
:host(.dense:not(.filled, .outlined):state(has-value)) > label,
:host(.prefixed.dense:not(.filled, .outlined)) > label {
    transform: translate(0, 1.5px) scale(.75);
}

:host([inline].dense.filled) > label,
:host(.dense.filled:focus-within) > label,
:host([placeholder].dense.filled) > label,
:host(.dense.filled:state(has-value)) > label,
:host(.prefixed.dense.filled) > label {
    transform: translate(3px, 4px) scale(.75);

    *[dir="rtl"] & {
        transform: translate(-3px, 4px) scale(.75);
    }
}

:host([inline].dense.outlined) > label,
:host(.dense.outlined:focus-within) > label,
:host([placeholder].dense.outlined) > label,
:host(.dense.outlined:state(has-value)) > label,
:host(.prefixed.dense.outlined) > label {
    transform: translate(5px, -6px) scale(.75);

    *[dir="rtl"] & {
        transform: translate(-5px, -6px) scale(.75);
    }
}

:host(:disabled) tf-input,
:host([readonly]) tf-input,
:host([inert]) tf-input {
    > svg {
        cursor: default;
        pointer-events: none;
    }

    input {
        opacity: 1;
    }
}

:host(:disabled) tf-input,
:host([inert]) tf-input {
    cursor: default;
}

:host(.filled:disabled) tf-input,
:host([inert].filled) tf-input {
    background-color: rgba(0, 0, 0, 0.12);
}

:host(.outlined:disabled) tf-input,
:host([inert].outlined) tf-input {
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

    > tf-input {
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

    > tf-input {
        border-color: var(--tavenem-color-action-disabled);
        color: var(--tavenem-color-text-disabled);
    }
}

:host(.filled:disabled) > tf-input,
:host([inert].filled) > tf-input {
    background-color: rgba(0, 0, 0, 0.12);
}

:host(.outlined:disabled) > tf-input,
:host([inert].outlined) > tf-input {
    border-color: var(--tavenem-color-action-disabled);
}

input::placeholder {
    color: currentColor;
    opacity: 0.42;
    transition: opacity 200ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
}

tf-input svg {
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
`;

    private _display: string | null | undefined;
    private _initialDisplay: string | null | undefined;
    private _initialValue: string | null | undefined;
    private _internals: ElementInternals;
    private _settingValue = false;
    private _value = '';

    static get observedAttributes() {
        return [
            'data-input-class',
            'data-input-style',
            'data-label',
            'display',
            'placeholder',
            'readonly',
            'required',
            'value',
        ];
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
        if (!root) {
            return;
        }
        const input = root.querySelector<TavenemInputHtmlElement>('tf-input');
        if (input) {
            input.display = newValue;
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
        const input = root.querySelector<TavenemInputHtmlElement>('tf-input');
        if (input) {
            return input.suggestion;
        }

        return null;
    }
    set suggestion(value: string | null | undefined) {
        const root = this.shadowRoot;
        if (!root) {
            return;
        }
        const input = root.querySelector<TavenemInputHtmlElement>('tf-input');
        if (input) {
            input.suggestion = value;
        }
    }

    get suggestionDisplay() {
        const root = this.shadowRoot;
        if (!root) {
            return null;
        }
        const input = root.querySelector<TavenemInputHtmlElement>('tf-input');
        if (input) {
            return input.suggestionDisplay;
        }

        return null;
    }
    set suggestionDisplay(value: string | null | undefined) {
        const root = this.shadowRoot;
        if (!root) {
            return;
        }
        const input = root.querySelector<TavenemInputHtmlElement>('tf-input');
        if (input) {
            input.suggestionDisplay = value;
        }
    }

    get suggestionValue() {
        const root = this.shadowRoot;
        if (!root) {
            return null;
        }
        const input = root.querySelector<TavenemInputHtmlElement>('tf-input');
        if (input) {
            return input.suggestionValue;
        }

        return null;
    }
    set suggestionValue(value: string | null | undefined) {
        const root = this.shadowRoot;
        if (!root) {
            return;
        }
        const input = root.querySelector<TavenemInputHtmlElement>('tf-input');
        if (input) {
            input.suggestionValue = value;
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
        style.textContent = TavenemInputFieldHtmlElement.style;
        shadow.appendChild(style);

        const inputId = randomUUID();
        const input = document.createElement('tf-input') as TavenemInputHtmlElement;
        input.id = inputId;
        if (this.hasAttribute('autocomplete')) {
            input.setAttribute('autocomplete', this.getAttribute('autocomplete') || 'off');
        }
        if (this.hasAttribute('autocorrect')) {
            input.setAttribute('autocorrect', this.getAttribute('autocorrect') || 'off');
        }
        input.autofocus = this.hasAttribute('autofocus');
        if (this.classList.contains('clearable')) {
            input.classList.add('clearable');
        }
        if ('inputClass' in this.dataset) {
            input.dataset.inputClass = this.dataset.inputClass;
        }
        if ('inputDebounce' in this.dataset) {
            input.dataset.inputDebounce = this.dataset.inputDebounce;
        }
        if ('inputStyle' in this.dataset) {
            input.dataset.inputStyle = this.dataset.inputStyle;
        }
        if ('showEmoji' in this.dataset) {
            input.dataset.showEmoji = '';
        }
        if (this.hasAttribute('disabled')) {
            input.setAttribute('disabled', '');
        }
        if (this.hasAttribute('inputmode')) {
            input.setAttribute('inputmode', this.getAttribute('inputmode') || '');
        }
        if (this.hasAttribute('maxlength')) {
            input.setAttribute('maxlength', this.getAttribute('maxlength') || '');
        }
        if (this.hasAttribute('minlength')) {
            input.setAttribute('minlength', this.getAttribute('minlength') || '');
        }
        if (this.hasAttribute('pattern')) {
            input.setAttribute('pattern', this.getAttribute('pattern') || '');
        }
        if (this.hasAttribute('placeholder')) {
            input.setAttribute('placeholder', this.getAttribute('placeholder') || '');
        }
        if (this.hasAttribute('readonly')
            || 'inputReadonly' in this.dataset) {
            input.setAttribute('readonly', '');
        }
        if (this.hasAttribute('required')) {
            input.setAttribute('required', '');
        }

        let setSize = false;
        if (this.hasAttribute('size')) {
            const sizeValue = this.getAttribute('size');
            if (sizeValue) {
                const size = parseFloat(sizeValue);
                if (size >= 1) {
                    input.setAttribute('size', sizeValue);
                    setSize = true;
                }
            }
        }
        if (!setSize) {
            input.setAttribute(
                'size',
                Math.max(
                    1,
                    (this.getAttribute('placeholder') || '').length,
                    (this.dataset.label || '').length)
                    .toString());
        }

        if (this.hasAttribute('spellcheck')) {
            input.setAttribute('spellcheck', this.getAttribute('spellcheck') || 'false');
        }

        if (this.hasAttribute('type')) {
            input.setAttribute('type', this.getAttribute('type') || 'text');
        }

        input.addEventListener('valuechange', this.onValueInput.bind(this));
        input.addEventListener('valueinput', this.onValueInput.bind(this));
        shadow.appendChild(input);

        const prefixSlot = document.createElement('slot');
        prefixSlot.name = 'prefix';
        prefixSlot.slot = 'prefix';
        input.appendChild(prefixSlot);

        const postfixSlot = document.createElement('slot');
        postfixSlot.name = 'postfix';
        input.appendChild(postfixSlot);

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

        if (this.hasAttribute('value')) {
            this._value = this.getAttribute('value') || '';

            if (this._value.length) {
                this._internals.setFormValue(this._value);
            } else {
                this._internals.setFormValue(null);
            }

            this.display = this.getAttribute('display');

            this.setValidity();

            input.value = this._value;

            this._initialValue = this._value;
            this._initialDisplay = this._display;
        } else if (this.hasAttribute('display')) {
            this.display = this.getAttribute('display');
            this._initialDisplay = this._display;
        }
    }

    disconnectedCallback() {
        const root = this.shadowRoot;
        if (!root) {
            return;
        }
        const input = root.querySelector<TavenemInputHtmlElement>('tf-input');
        if (input) {
            input.removeEventListener('valuechange', this.onValueInput.bind(this));
            input.removeEventListener('valueinput', this.onValueInput.bind(this));
        }
    }

    attributeChangedCallback(name: string, oldValue: string | null | undefined, newValue: string | null | undefined) {
        if (newValue == oldValue) {
            return;
        }

        if (name === 'display') {
            if (this._display !== newValue) {
                this.display = newValue;
            }
            return;
        } else if (name === 'value') {
            this.setValue(newValue);
            return;
        }

        let input: TavenemInputHtmlElement | null | undefined;
        const root = this.shadowRoot;
        if (root) {
            input = root.querySelector<TavenemInputHtmlElement>('tf-input');
        }

        if (name === 'data-input-class') {
            if (input) {
                input.setAttribute('data-input-class', newValue || '');
            }
        } else if (name === 'data-input-style') {
            if (input) {
                input.setAttribute('data-input-style', newValue || '');
            }
        } else if (name === 'placeholder') {
            if (newValue) {
                if (input) {
                    input.setAttribute('placeholder', newValue);
                }
            } else if (input) {
                input.removeAttribute('placeholder');
            }
        } else if (name === 'readonly') {
            if (input) {
                if (newValue) {
                    input.setAttribute('readonly', '');
                } else if (!('inputReadonly' in this.dataset)) {
                    input.removeAttribute('readonly');
                }
            }
        } else if (name === 'required') {
            if (input) {
                if (newValue) {
                    input.setAttribute('required', '');
                } else {
                    input.removeAttribute('required');
                }
            }
            this.setValidity();
        } else if (name === 'data-label') {
            const root = this.shadowRoot;
            if (!root) {
                return;
            }
            const label = root.querySelector('label');
            if (label) {
                if (newValue != null && newValue.length) {
                    label.textContent = newValue;
                } else {
                    label.remove();
                }
            } else if (newValue != null && newValue.length) {
                const input = root.querySelector('input');
                const slot = root.querySelector('slot[name="helpers"]');
                if (input && slot) {
                    const label = document.createElement('label');
                    label.htmlFor = input.id;
                    label.innerText = newValue;
                    root.insertBefore(label, slot.nextSibling);
                }
            }
        }
    }

    formDisabledCallback(disabled: boolean) {
        const root = this.shadowRoot;
        if (!root) {
            return;
        }

        const input = root.querySelector<TavenemInputHtmlElement>('tf-input');
        if (input) {
            input.formDisabledCallback(disabled);
        }
    }

    formResetCallback() { this.reset(); }

    formStateRestoreCallback(state: string | File | FormData | null, mode: 'restore' | 'autocomplete') {
        if (typeof state === 'string') {
            this.value = state;
        } else if (state == null) {
            this.clear();
        }
    }

    checkValidity() { return this._internals.checkValidity(); }

    focusInnerInput() {
        const root = this.shadowRoot;
        if (!root) {
            this.focus();
            return;
        }
        const input = root.querySelector<TavenemInputHtmlElement>('tf-input');
        if (input) {
            input.focusInnerInput();
            return;
        }
        this.focus();
    }

    reportValidity() { return this._internals.reportValidity(); }

    reset() {
        this.setValue(this._initialValue);
        this._internals.states.delete('touched');
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
        const input = root.querySelector<TavenemInputHtmlElement>('tf-input');
        if (input) {
            input.select();
        }
    }

    selectRange(start: number, end?: number) {
        const root = this.shadowRoot;
        if (!root) {
            return;
        }
        const input = root.querySelector<TavenemInputHtmlElement>('tf-input');
        if (input) {
            input.selectRange(start, end);
        }
    }

    protected clear() {
        this._settingValue = true;

        this._value = '';
        this._internals.setFormValue(null);
        this.display = null;

        this.setValidity();

        const root = this.shadowRoot;
        if (root) {
            const input = root.querySelector<TavenemInputHtmlElement>('tf-input');
            if (input) {
                if (input.shadowRoot) {
                    input.value = '';
                } else {
                    input.removeAttribute('value');
                }
            }
        }

        this._settingValue = false;
    }

    protected onValueInput(event: Event) {
        if (this._settingValue
            || !event.target
            || !(event instanceof CustomEvent)
            || !event.detail) {
            return;
        }

        this._internals.states.add('touched');
        if (typeof event.detail.value !== 'string'
            || !(event.detail.value as string).length) {
            this.clear();
        } else {
            this.setValue((event.detail.value as string));
        }
    }

    private setValidity() {
        const flags: ValidityStateFlags = {};
        const messages: string[] = [];

        if (!this._value || !this._value.length) {
            if (this.hasAttribute('required')) {
                flags.valueMissing = true;
                messages.push('value required');
            }
        } else {
            if (this.hasAttribute('minlength')) {
                const minLengthValue = this.getAttribute('minlength');
                if (minLengthValue) {
                    const minLength = parseInt(minLengthValue);
                    if (Number.isFinite(minLength)
                        && this._value.length < minLength) {
                        flags.tooShort = true;
                        messages.push(`value must have at least ${minLength} characters`);
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
                        messages.push(`value must have no more than ${maxLength} characters`);
                    }
                }
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

    private setValue(value?: string | null, display?: string | null) {
        if (value == null) {
            if (this._value == null) {
                return;
            }
        } else if (this._value === value) {
            return;
        }

        if (!value) {
            this.clear();
            return;
        }

        this._settingValue = true;

        this._value = value;

        if (this._value.length) {
            this._internals.setFormValue(this._value);
        } else {
            this._internals.setFormValue(null);
        }

        let input: TavenemInputHtmlElement | null | undefined;
        const root = this.shadowRoot;
        if (root) {
            input = root.querySelector<TavenemInputHtmlElement>('tf-input');
        }

        this.display = display;

        this.setValidity();

        if (input) {
            if (input.shadowRoot) {
                input.value = this._value;
            } else {
                input.setAttribute('value', this._value);
            }
        }

        this._settingValue = false;
    }
}