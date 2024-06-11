import { TavenemInputHtmlElement } from './_input'
import { TavenemPickerHtmlElement } from './_picker'
import { TavenemPopover, TavenemPopoverHTMLElement } from './_popover';
import { documentPositionComparator, randomUUID } from './tavenem-utility'

export class TavenemSelectInputHtmlElement extends TavenemPickerHtmlElement {
    static formAssociated = true;

    private _display: string | null | undefined;
    private _initialDisplay: string | null | undefined;
    private _initialValue: string | null | undefined;
    private _internals: ElementInternals;
    private _searchText: string | null | undefined;
    private _searchTimer: number = -1;
    private _settingValue = false;
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

    private static newSearchInputEvent(value: string) {
        return new CustomEvent('searchinput', { bubbles: true, composed: true, detail: { value: value } });
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
        style.textContent = `:host {
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
    flex-grow: 1;
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
}

:host([readonly]),
:host([inert]) {
    cursor: default;
    pointer-events: none;
}

:host(:not(.filled, .outlined)) > tf-input:has(~ label) {
    margin-top: 1rem;
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
:host(:state(has-value):not(.filled, .outlined)) > label {
    transform: translate(0, 1.5px) scale(.75);
}

:host([inline].filled) > label,
:host(.filled:focus-within) > label,
:host([placeholder].filled) > label,
:host(.filled:state(has-value)) > label {
    transform: translate(12px, 10px) scale(.75);

    *[dir="rtl"] & {
        transform: translate(-12px, 10px) scale(.75);
    }
}

:host([inline].outlined) > label,
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
:host(.dense:not(.filled, .outlined):state(has-value)) > label {
    transform: translate(0, 1.5px) scale(.75);
}

:host([inline].dense.filled) > label,
:host(.dense.filled:focus-within) > label,
:host([placeholder].dense.filled) > label,
:host(.dense.filled:state(has-value)) > label {
    transform: translate(3px, 4px) scale(.75);

    *[dir="rtl"] & {
        transform: translate(-3px, 4px) scale(.75);
    }
}

:host([inline].dense.outlined) > label,
:host(.dense.outlined:focus-within) > label,
:host([placeholder].dense.outlined) > label,
:host(.dense.outlined:state(has-value)) > label {
    transform: translate(5px, -6px) scale(.75);

    *[dir="rtl"] & {
        transform: translate(-5px, -6px) scale(.75);
    }
}

:host(:disabled) tf-input,
:host([readonly]) tf-input,
:host([inert]) tf-input {
    cursor: default;

    > svg {
        cursor: default;
        pointer-events: none;
    }

    input {
        opacity: 1;
    }
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

tf-input > .expand {
    cursor: pointer;
    transition: .3s cubic-bezier(.25,.8,.5,1),visibility 0s;
}

:host(:has(tf-popover.select-popover:popover-open)) tf-input > .expand {
    transform: rotate(-180deg);
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

slot([name="helpers"])::slotted(.onfocus) {
    display: none;
}

:host(:focus-within) slot([name="helpers"])::slotted(.onfocus) {
    display: initial;
}

slot:not([name])::slotted(.option-list) {
    > * > .selected-icon {
        visibility: hidden;
    }

    > * > .unselected-icon {
        display: none;
    }

    > .active > .selected-icon {
        visibility: visible;
    }
}

:host([multiple]) slot:not([name])::slotted(.option-list) {
    > * > .selected-icon {
        display: none;
    }

    > * > .unselected-icon {
        display: inline-block;
    }

    > .active > .selected-icon {
        display: inline-block;
    }

    > .active > .unselected-icon {
        display: none;
    }
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
        shadow.appendChild(style);

        const anchorId = randomUUID();
        const input = document.createElement('tf-input') as TavenemInputHtmlElement;
        input.id = anchorId;
        if (this.hasAttribute('autocomplete')) {
            input.setAttribute('autocomplete', this.getAttribute('autocomplete') || 'off');
        }
        if (this.hasAttribute('autocorrect')) {
            input.setAttribute('autocorrect', this.getAttribute('autocorrect') || 'off');
        }
        input.autofocus = this.hasAttribute('autofocus');
        input.classList.add('input');
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

        shadow.appendChild(input);
        input.addEventListener('valuechange', this.onValueChange.bind(this));
        input.addEventListener('valueinput', this.onValueInput.bind(this));

        const prefixSlot = document.createElement('slot');
        prefixSlot.name = 'prefix';
        prefixSlot.slot = 'prefix';
        input.appendChild(prefixSlot);

        if (!('hideExpand' in this.dataset)) {
            const expand = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
            input.appendChild(expand);
            expand.outerHTML = `<svg class="main-expand" data-picker-toggle xmlns="http://www.w3.org/2000/svg" height="48" viewBox="0 -960 960 960" width="48"><path d="M480-400q-17 0-28.5-11.5T440-440q0-17 11.5-28.5T480-480q17 0 28.5 11.5T520-440q0 17-11.5 28.5T480-400Zm-160 0q-17 0-28.5-11.5T280-440q0-17 11.5-28.5T320-480q17 0 28.5 11.5T360-440q0 17-11.5 28.5T320-400Zm320 0q-17 0-28.5-11.5T600-440q0-17 11.5-28.5T640-480q17 0 28.5 11.5T680-440q0 17-11.5 28.5T640-400ZM480-240q-17 0-28.5-11.5T440-280q0-17 11.5-28.5T480-320q17 0 28.5 11.5T520-280q0 17-11.5 28.5T480-240Zm-160 0q-17 0-28.5-11.5T280-280q0-17 11.5-28.5T320-320q17 0 28.5 11.5T360-280q0 17-11.5 28.5T320-240Zm320 0q-17 0-28.5-11.5T600-280q0-17 11.5-28.5T640-320q17 0 28.5 11.5T680-280q0 17-11.5 28.5T640-240ZM180-80q-24 0-42-18t-18-42v-620q0-24 18-42t42-18h65v-60h65v60h340v-60h65v60h65q24 0 42 18t18 42v620q0 24-18 42t-42 18H180Zm0-60h600v-430H180v430Z"/></svg>`;
        }

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
            label.htmlFor = anchorId;
            label.textContent = this.dataset.label;
            shadow.appendChild(label);
        }

        const slot = document.createElement('slot');
        shadow.appendChild(slot);

        const popover = document.createElement('tf-popover') as TavenemPopoverHTMLElement;
        popover.classList.add('filled', 'top-left', 'flip-onopen', 'anchor-bottom-left', 'match-width');
        popover.dataset.anchorId = anchorId;
        popover.popover = 'auto';
        if ('popoverLimitHeight' in this.dataset) {
            popover.style.maxHeight = 'min(300px,90vh)';
            popover.style.overflowY = 'auto';
        }
        shadow.appendChild(popover);

        const popoverSlot = document.createElement('slot');
        popoverSlot.name = 'popover';
        popover.appendChild(popoverSlot);

        if (this.hasAttribute('value')) {
            this.setValue(this.getAttribute('value'), this.getAttribute('display'));
            this._initialValue = this._value;
            this._initialDisplay = this._display;
        } else if (this.hasAttribute('display')) {
            this.display = this.getAttribute('display');
            this._initialDisplay = this._display;
        }
        
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

        const root = this.shadowRoot;
        if (!root) {
            return;
        }
        const input = root.querySelector<TavenemInputHtmlElement>('tf-input');
        if (input) {
            input.removeEventListener('valuechange', this.onValueChange.bind(this));
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
        } else if (name === 'value'
            && newValue) {
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
        } else if (name === 'readonly') {
            if (newValue) {
                this.setOpen(false);
                if (input) {
                    input.setAttribute('readonly', '');
                }
            } else if (input && !('inputReadonly' in this.dataset)) {
                input.removeAttribute('readonly');
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
        }
    }

    formDisabledCallback(disabled: boolean) {
        if (disabled) {
            this.setOpen(false);
        }

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

        this.querySelectorAll('option, [data-close-picker-value], [data-picker-select-all]')
            .forEach(x => x.classList.remove('active'));
        if (this.shadowRoot) {
            this.shadowRoot.querySelectorAll('option, [data-close-picker-value], [data-picker-select-all]')
                .forEach(x => x.classList.remove('active'));
        }

        this._settingValue = false;
    }

    protected onArrowDown(event: KeyboardEvent) {
        if (!event.target) {
            return;
        }
        const root = this.shadowRoot;
        if (event.target !== this) {
            const popover = root ? root.querySelector('tf-popover') : null;
            if (popover
                && event.target instanceof Node
                && !popover.matches(':popover-open')
                && TavenemPopover.nodeContains(popover, event.target)) {
                return;
            }
        }

        const selectedIndices = this.getSelectedIndices();
        if (!selectedIndices.options
            || (selectedIndices.lastSelectedIndex != null
                && selectedIndices.lastSelectedIndex >= selectedIndices.options.length - 1)) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        let newOption = selectedIndices.options[(selectedIndices.lastSelectedIndex || -1) + 1];

        let input: TavenemInputHtmlElement | null | undefined;
        if (root) {
            input = root.querySelector<TavenemInputHtmlElement>('tf-input');
        }
        if (input) {
            const currentOption = selectedIndices.options[(selectedIndices.lastSelectedIndex || 0)];
            let currentOptionValue;
            if (!('pickerSelectAll' in currentOption.dataset)) {
                if ('closePickerValue' in currentOption.dataset) {
                    currentOptionValue = currentOption.dataset.closePickerValue;
                } else if (currentOption instanceof HTMLOptionElement) {
                    currentOptionValue = currentOption.value;
                    if ((!currentOptionValue || !currentOptionValue.length)
                        && currentOption.innerText
                        && currentOption.innerText.length) {
                        currentOptionValue = currentOption.innerText;
                    }
                }
            }
            if (input.value.toLowerCase() != (currentOptionValue || '').toLowerCase()) {
                newOption = currentOption;
            }
        }

        this.onSubmitOption(newOption);
    }

    protected onArrowUp(event: KeyboardEvent) {
        if (!event.target) {
            return;
        }
        const root = this.shadowRoot;
        if (event.target !== this) {
            const popover = root ? root.querySelector('tf-popover') : null;
            if (popover
                && event.target instanceof Node
                && !popover.matches(':popover-open')
                && TavenemPopover.nodeContains(popover, event.target)) {
                return;
            }
        }

        const selectedIndices = this.getSelectedIndices();
        if (!selectedIndices.options
            || (selectedIndices.firstSelectedIndex != null
                && selectedIndices.firstSelectedIndex <= 0)) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        let newOption = selectedIndices.options[(selectedIndices.lastSelectedIndex || -1) - 1];

        let input: TavenemInputHtmlElement | null | undefined;
        if (root) {
            input = root.querySelector<TavenemInputHtmlElement>('tf-input');
        }
        if (input) {
            const currentOption = selectedIndices.options[(selectedIndices.lastSelectedIndex || 0)];
            let currentOptionValue;
            if (!('pickerSelectAll' in currentOption.dataset)) {
                if ('closePickerValue' in currentOption.dataset) {
                    currentOptionValue = currentOption.dataset.closePickerValue;
                } else if (currentOption instanceof HTMLOptionElement) {
                    currentOptionValue = currentOption.value;
                    if ((!currentOptionValue || !currentOptionValue.length)
                        && currentOption.innerText
                        && currentOption.innerText.length) {
                        currentOptionValue = currentOption.innerText;
                    }
                }
            }
            if (input.value.toLowerCase() != (currentOptionValue || '').toLowerCase()) {
                newOption = currentOption;
            }
        }

        this.onSubmitOption(newOption);
    }

    protected onOpening() {
        if ('searchFilter' in this.dataset) {
            this.clearSearchFilter();
        }
    }

    protected onSearchInput(event: KeyboardEvent) {
        if (!event.target) {
            return;
        }

        let input: TavenemInputHtmlElement | null | undefined;
        const root = this.shadowRoot;
        if (root) {
            input = root.querySelector<TavenemInputHtmlElement>('tf-input');
        }
        if (input && event.target === input) {
            return;
        }

        if (event.target !== this) {
            const popover = root ? root.querySelector('tf-popover') : null;
            if (popover
                && event.target instanceof Node
                && !popover.matches(':popover-open')
                && TavenemPopover.nodeContains(popover, event.target)) {
                return;
            }
        }

        clearTimeout(this._searchTimer);

        if (this._searchText) {
            if (event.key === "Delete" || event.key === "Clear") {
                this._searchText = null;
            } else if (event.key === "Backspace") {
                if (this._searchText.length > 1) {
                    this._searchText = this._searchText.substring(0, this._searchText.length - 1);
                } else {
                    this._searchText = null;
                }
            } else {
                this._searchText += event.key.toLowerCase();
            }
        } else if (event.key !== "Delete"
            && event.key !== "Backspace"
            && event.key !== "Clear") {
            this._searchText = event.key.toLowerCase();
        }

        if (!this._searchText || !this._searchText.length) {
            return;
        }

        this.onValueInput(event);

        this._searchTimer = setTimeout(() => this._searchText = null, 2000);
    }

    protected onSelectAll(event: Event) {
        if (!event.target) {
            return;
        }
        if (event.target !== this) {
            const root = this.shadowRoot;
            const popover = root ? root.querySelector('tf-popover') : null;
            if (popover
                && event.target instanceof Node
                && !popover.matches(':popover-open')
                && TavenemPopover.nodeContains(popover, event.target)) {
                return;
            }
        }

        event.preventDefault();
        event.stopPropagation();

        this.selectAll(false);
    }

    protected onSubmitOption(element: HTMLElement | SVGElement) {
        if ('pickerSelectAll' in element.dataset) {
            this.selectAll(true);
            return;
        }

        if ('closePickerValue' in element.dataset) {
            if (!element.hasAttribute('disabled')) {
                this.onSubmitValue(
                    element.dataset.closePickerValue || '',
                    element.dataset.closePickerDisplay);
                return;
            }
        }

        if (element instanceof HTMLOptionElement
            && !element.disabled) {
            let value = element.value;
            if ((!value || !value.length)
                && element.innerText
                && element.innerText.length) {
                value = element.innerText;
            }

            let display: string | null = element.label;
            if (!display || !display.length) {
                display = element.value;
            }
            if (!display || !display.length) {
                display = element.innerText;
            }
            if (display && !display.length) {
                display = null;
            }
            this.onSubmitValue(value, display);
        }
    }

    private clearSearchFilter() {
        const shadowOptions = this.shadowRoot?.querySelectorAll('option, [data-close-picker-value]');
        const options = Array
            .from(shadowOptions && shadowOptions.length
                ? shadowOptions
                : this.querySelectorAll('option, [data-close-picker-value]'))
            .sort(documentPositionComparator);
        for (var option of options) {
            option.classList.remove('search-nonmatch');
        }
    }

    private getSelectedIndices(): {
        options?: HTMLElement[],
        firstSelectedIndex?: number,
        lastSelectedIndex?: number
    } {
        if (!this._value) {
            return {};
        }

        const shadowOptions = this.shadowRoot?.querySelectorAll('option, [data-close-picker-value]');
        const options = Array
            .from(shadowOptions && shadowOptions.length
                ? shadowOptions
                : this.querySelectorAll('option, [data-close-picker-value]'))
            .filter<HTMLElement>((x): x is HTMLElement => x instanceof HTMLElement)
            .sort(documentPositionComparator);
        if (!options.length) {
            return {};
        }
        let firstSelectedIndex: number | undefined;
        let lastSelectedIndex: number | undefined;
        for (var i = 0; i < options.length; i++) {
            const option = options[i];
            if ('pickerSelectAll' in option.dataset) {
                continue;
            }
            if ('closePickerValue' in option.dataset) {
                if (option.dataset.closePickerValue === this._value) {
                    if (firstSelectedIndex == null) {
                        firstSelectedIndex = i;
                    }
                    lastSelectedIndex = i;
                }
            } else if (option instanceof HTMLOptionElement
                && option.value === this._value) {
                if (firstSelectedIndex == null) {
                    firstSelectedIndex = i;
                }
                lastSelectedIndex = i;
            }
        }

        if (firstSelectedIndex == null) {
            for (var i = 0; i < options.length; i++) {
                const option = options[i];
                if (option instanceof HTMLElement
                    && option.classList.contains('active')) {
                    if (firstSelectedIndex == null) {
                        firstSelectedIndex = i;
                    }
                    lastSelectedIndex = i;
                }
            }
        }

        return {
            options,
            firstSelectedIndex,
            lastSelectedIndex
        };
    }

    protected onValueInput(event: Event) {
        if (this._settingValue
            || !event.target
            || !(event instanceof CustomEvent)
            || !event.detail) {
            return;
        }

        const searchText = typeof event.detail.value === 'string'
            ? (event.detail.value as string).toLowerCase()
            : null;

        let input: TavenemInputHtmlElement | null | undefined;
        const root = this.shadowRoot;
        if (root) {
            input = root.querySelector<TavenemInputHtmlElement>('tf-input');
        }

        if (input) {
            if (input.shadowRoot) {
                input.suggestion = null;
            }
        }

        const shadowOptions = this.shadowRoot?.querySelectorAll('option, [data-close-picker-value]');
        const options = Array
            .from(shadowOptions && shadowOptions.length
                ? shadowOptions
                : this.querySelectorAll('option, [data-close-picker-value]'))
            .filter<HTMLElement>((x): x is HTMLElement => x instanceof HTMLElement)
            .sort(documentPositionComparator);
        if (!options.length) {
            return;
        }

        if (!searchText || !searchText.length) {
            for (var option of options) {
                if (option instanceof HTMLElement) {
                    option.classList.remove('search-nonmatch');
                }
            }
            return;
        }

        let match;
        if (searchText.length === 1) {
            for (var option of options) {
                if ('pickerSelectAll' in option.dataset) {
                    continue;
                }

                if ('closePickerValue' in option.dataset) {
                    if (!option.hasAttribute('disabled')
                        && (('closePickerDisplay' in option.dataset
                            && option.dataset.closePickerDisplay
                            && option.dataset.closePickerDisplay.toLowerCase().startsWith(searchText))
                            || (!('closePickerDisplay' in option.dataset)
                                && option.dataset.closePickerValue
                                && option.dataset.closePickerValue.toLowerCase().startsWith(searchText)))) {
                        if (!match) {
                            match = option;
                        }
                    }
                } else if (option instanceof HTMLOptionElement
                    && !option.disabled
                    && (option.label.startsWith(searchText)
                        || (!option.label
                            && option.textContent
                            && option.textContent.toLowerCase().startsWith(searchText))
                        || (!option.label
                            && !option.textContent
                            && option.value.toLowerCase().startsWith(searchText)))) {
                    if (!match) {
                        match = option;
                    }
                }
            }
        }

        for (var option of options) {
            if ('pickerSelectAll' in option.dataset) {
                continue;
            }

            if ('closePickerValue' in option.dataset) {
                if (!option.hasAttribute('disabled')
                    && (('closePickerDisplay' in option.dataset
                        && option.dataset.closePickerDisplay
                        && option.dataset.closePickerDisplay.toLowerCase().includes(searchText))
                        || (!('closePickerDisplay' in option.dataset)
                            && option.dataset.closePickerValue
                            && option.dataset.closePickerValue.toLowerCase().includes(searchText)))) {
                    if (!match) {
                        match = option;
                    }
                    option.classList.remove('search-nonmatch');
                } else if ('searchFilter' in this.dataset) {
                    option.classList.remove('active');
                    option.classList.add('search-nonmatch');
                }
            } else if (option instanceof HTMLOptionElement
                && !option.disabled
                && (option.label.includes(searchText)
                    || (!option.label
                        && option.textContent
                        && option.textContent.toLowerCase().includes(searchText))
                    || (!option.label
                        && !option.textContent
                        && option.value.toLowerCase().includes(searchText)))) {
                if (!match) {
                    match = option;
                }
                option.classList.remove('search-nonmatch');
            } else if ('searchFilter' in this.dataset) {
                option.classList.remove('active');
                option.classList.add('search-nonmatch');
            }
        }

        if (!match) {
            this.dispatchEvent(TavenemSelectInputHtmlElement.newSearchInputEvent(searchText));
            return;
        }

        const popover = root ? root.querySelector('tf-popover') : null;
        if (popover && !popover.matches(':popover-open')) {
            if (!this.matches(':disabled')
                && !this.hasAttribute('readonly')) {
                this.open();
            }

            if ('disableAutosearch' in this.dataset) {
                return;
            }
        }

        let value: string;
        let display: string | null | undefined;
        if ('closePickerValue' in match.dataset) {
            value = match.dataset.closePickerValue || '';
            display = match.dataset.closePickerDisplay;
        } else if (match instanceof HTMLOptionElement) {
            value = match.value;
            display = match.label || match.textContent;
        } else {
            return;
        }

        if (input instanceof TavenemInputHtmlElement) {
            const current: string = input.display || event.detail.value;
            const suggestionDisplay = display || value;
            if (suggestionDisplay.toLowerCase().startsWith(current.toLowerCase())
                && suggestionDisplay.length > current.length) {
                input.suggestion = current + suggestionDisplay.substring(current.length);
                if (!suggestionDisplay.startsWith(current)) {
                    input.suggestionDisplay = suggestionDisplay;
                }
                if (display && display.length) {
                    input.suggestionValue = value;
                }
            }
        }

        if ('disableAutosearch' in this.dataset) {
            for (var i = 0; i < options.length; i++) {
                const option = options[i];
                if ('pickerSelectAll' in option.dataset) {
                    continue;
                }
                if ('closePickerValue' in option.dataset) {
                    if (option.dataset.closePickerValue === value) {
                        option.classList.add('active');
                    } else {
                        option.classList.remove('active');
                    }
                } else if (option instanceof HTMLOptionElement) {
                    if (option.value === value) {
                        option.classList.add('active');
                    } else {
                        option.classList.remove('active');
                    }
                }
            }
        } else {
            event.preventDefault();
            event.stopPropagation();

            if (popover && popover.matches(':popover-open')) {
                match.focus();
                match.scrollIntoView({ behavior: 'smooth' });
            }

            this.onSubmitValue(value, display);
        }
    }

    private onSubmitValue(value?: string, display?: string | null) {
        if (!value) {
            return;
        }

        this.setValue(value, display);
        this._internals.states.add('touched');
    }

    private onValueChange(event: Event) {
        if (this._settingValue
            || !event.target
            || !(event instanceof CustomEvent)
            || !event.detail) {
            return;
        }
        if (typeof event.detail.value !== 'string'
            || !(event.detail.value as string).length) {
            this.clear();
        } else {
            this.setValue((event.detail.value as string));
        }
        this._internals.states.add('touched');
    }

    private selectAll(toggle: boolean) {
        const shadowOptions = this.shadowRoot?.querySelectorAll('option, [data-close-picker-value]');
        const options = Array
            .from(shadowOptions && shadowOptions.length
                ? shadowOptions
                : this.querySelectorAll('option, [data-close-picker-value]'))
            .filter<HTMLElement>((x): x is HTMLElement => x instanceof HTMLElement)
            .filter(x => {
                if ('pickerSelectAll' in x.dataset) {
                    return false;
                }

                if ('closePickerValue' in x.dataset) {
                    return x.dataset.closePickerValue
                        && x.dataset.closePickerValue.length;
                }

                if (x instanceof HTMLOptionElement) {
                    return x.value && x.value.length;
                }

                return false;
            });
        if (options.length === 0) {
            return;
        }

        if (toggle) {
            const allSelected = options.every(x => x.hasAttribute('disabled')
                || x.classList.contains('active'));
            if (allSelected) {
                this.clear();
                this._internals.states.add('touched');
                return;
            }
        }

        const enabledOptions = options
            .filter(x => !x.hasAttribute('disabled'));
        if (enabledOptions.length === 0) {
            return;
        }

        const values = enabledOptions.map<string>(x => {
            if ('closePickerValue' in x.dataset
                && x.dataset.closePickerValue
                && x.dataset.closePickerValue.length) {
                return x.dataset.closePickerValue;
            }

            if (x instanceof HTMLOptionElement) {
                return x.value;
            }

            return '';
        });

        const value = JSON.stringify(values);

        let input: TavenemInputHtmlElement | null | undefined;
        const root = this.shadowRoot;
        if (root) {
            input = root.querySelector<TavenemInputHtmlElement>('tf-input');
        }
        if (input) {
            if (input.shadowRoot) {
                input.value = value;
            } else {
                input.setAttribute('value', value);
            }
        }

        const displayOption = enabledOptions[0];
        let display = '';
        if ('closePickerValue' in displayOption.dataset) {
            display = displayOption.dataset.closePickerDisplay
                || displayOption.dataset.closePickerValue
                || '';
        } else if (displayOption instanceof HTMLOptionElement) {
            display = displayOption.label;
            if (!display || !display.length) {
                display = displayOption.value;
            }
            if (!display || !display.length) {
                display = displayOption.innerText;
            }
        }

        if (options.length > 1) {
            if (display.length) {
                display += " +" + (options.length - 1).toFixed(0);
            } else {
                display = options.length.toFixed(0);
            }
        } else if (options.length === 1
            && (!display || !display.length)) {
            display = "1";
        }

        if (display) {
            this.display = display;
        }

        for (var i = 0; i < enabledOptions.length; i++) {
            enabledOptions[i].classList.add('active');
        }

        if (enabledOptions.length === options.length) {
            const shadowAllOptions = this.shadowRoot?.querySelectorAll('[data-picker-select-all]');
            (shadowAllOptions && shadowAllOptions.length
                ? shadowAllOptions
                : this.querySelectorAll('shadowAllOptions'))
                .forEach(x => {
                    x.classList.add('active');
                });
        }
        this._internals.states.add('touched');
    }

    private setOptions(input?: TavenemInputHtmlElement | null, value?: string | null, display?: string | null) {
        let useShadowOptions = false;
        let options = Array
            .from(this.querySelectorAll('option, [data-close-picker-value]'))
            .filter<HTMLElement>((x): x is HTMLElement => x instanceof HTMLElement);
        if (!options.length && this.shadowRoot) {
            useShadowOptions = true;
            options = Array
                .from(this.shadowRoot.querySelectorAll('option, [data-close-picker-value]'))
                .filter<HTMLElement>((x): x is HTMLElement => x instanceof HTMLElement);
        }
        let anyNotSelected = false;
        for (var i = 0; i < options.length; i++) {
            const option = options[i];
            if ('pickerSelectAll' in option.dataset) {
                continue;
            }
            if ('closePickerValue' in option.dataset
                || option instanceof HTMLOptionElement) {
                const optionValue = 'closePickerValue' in option.dataset
                    ? option.dataset.closePickerValue
                    : (option as HTMLOptionElement).value;
                if (optionValue === value) {
                    option.classList.add('active');
                    if (!display
                        && 'closePickerDisplay' in option.dataset
                        && option.dataset.closePickerDisplay
                        && option.dataset.closePickerDisplay.length) {
                        if (input) {
                            if (input.shadowRoot) {
                                input.display = option.dataset.closePickerDisplay;
                            } else {
                                input.setAttribute('display', option.dataset.closePickerDisplay);
                            }
                        }
                    }
                } else {
                    anyNotSelected = true;
                    option.classList.remove('active');
                }
            }
        }

        const selectAllOptions = Array
            .from((useShadowOptions ? this.shadowRoot! : this).querySelectorAll('[data-picker-select-all]'))
            .filter<HTMLElement>((x): x is HTMLElement => x instanceof HTMLElement);
        for (var i = 0; i < selectAllOptions.length; i++) {
            if (anyNotSelected) {
                selectAllOptions[i].classList.remove('active');
            } else {
                selectAllOptions[i].classList.add('active');
            }
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

        if (this.hasAttribute('multiple')) {
            this.setValueForMultiple(value, display);
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

        this.setOptions(input, this._value, this.display);

        this._settingValue = false;
    }

    private setValueForMultiple(value: string, display?: string | null) {
        let currentValue: string | string[] | undefined;

        let input: TavenemInputHtmlElement | null | undefined;
        const root = this.shadowRoot;
        if (root) {
            input = root.querySelector<TavenemInputHtmlElement>('tf-input');
        }

        if (input) {
            currentValue = input.value;
            if (currentValue
                && currentValue.startsWith('[')
                && currentValue.endsWith(']')) {
                var a = JSON.parse(currentValue);
                if (a instanceof Array) {
                    currentValue = a;
                }
            }
        }

        if (currentValue instanceof Array) {
            const index = currentValue.indexOf(value);
            if (index >= 0) {
                currentValue.splice(index, 1);
            } else {
                currentValue.push(value);
            }

            if (currentValue.length) {
                value = JSON.stringify(currentValue);
            } else {
                currentValue = '';
                value = '';
                display = null;
            }
        } else if (currentValue === value) {
            currentValue = '';
            value = '';
            display = null;
        } else if (currentValue && currentValue.length) {
            currentValue = [currentValue, value];
            value = JSON.stringify(currentValue);
        } else {
            currentValue = value;
        }

        this._settingValue = true;

        this._value = value;

        if (input) {
            if (input.shadowRoot) {
                input.value = value;
            } else {
                input.setAttribute('value', value);
            }
        }

        const shadowOptions = this.shadowRoot?.querySelectorAll('option, [data-close-picker-value]');
        const options = Array
            .from(shadowOptions && shadowOptions.length
                ? shadowOptions
                : this.querySelectorAll('option, [data-close-picker-value]'))
            .filter<HTMLElement>((x): x is HTMLElement => x instanceof HTMLElement)
            .filter(x => {
                if ('pickerSelectAll' in x.dataset) {
                    return false;
                }

                if ('closePickerValue' in x.dataset) {
                    return x.dataset.closePickerValue
                        && x.dataset.closePickerValue.length;
                }

                if (x instanceof HTMLOptionElement) {
                    return x.value && x.value.length;
                }

                return false;
            })
            .sort(documentPositionComparator);

        let firstSelected: HTMLElement | undefined;
        let anyUnselected = false;
        let selectedCount = 0;
        for (var i = 0; i < options.length; i++) {
            const option = options[i];
            if ('closePickerValue' in option.dataset) {
                if (currentValue instanceof Array) {
                    if (option.dataset.closePickerValue
                        && currentValue.includes(option.dataset.closePickerValue)) {
                        option.classList.add('active');
                        selectedCount++;
                        if (!firstSelected) {
                            firstSelected = option;
                        }
                    } else {
                        anyUnselected = true;
                        option.classList.remove('active');
                    }
                } else if (option.dataset.closePickerValue == currentValue) {
                    option.classList.add('active');
                    selectedCount++;
                    if (!firstSelected) {
                        firstSelected = option;
                    }
                } else {
                    anyUnselected = true;
                    option.classList.remove('active');
                }
            } else if (option instanceof HTMLOptionElement) {
                if (currentValue instanceof Array) {
                    if (currentValue.includes(option.value)) {
                        option.classList.add('active');
                        selectedCount++;
                        if (!firstSelected) {
                            firstSelected = option;
                        }
                    } else {
                        anyUnselected = true;
                        option.classList.remove('active');
                    }
                } else if (option.value == currentValue) {
                    option.classList.add('active');
                    selectedCount++;
                    if (!firstSelected) {
                        firstSelected = option;
                    }
                } else {
                    anyUnselected = true;
                    option.classList.remove('active');
                }
            }
        }

        if (firstSelected) {
            if ('closePickerValue' in firstSelected.dataset) {
                display = firstSelected.dataset.closePickerDisplay
                    || firstSelected.dataset.closePickerValue
                    || '';
            } else if (firstSelected instanceof HTMLOptionElement) {
                display = firstSelected.label;
                if (!display || !display.length) {
                    display = firstSelected.value;
                }
                if (!display || !display.length) {
                    display = firstSelected.innerText;
                }
            }
        }

        if (selectedCount > 1) {
            if (display && display.length) {
                display += " +" + (selectedCount - 1).toFixed(0);
            } else {
                display = selectedCount.toFixed(0);
            }
        } else if (selectedCount === 1
            && (!display || !display.length)) {
            display = "1";
        }

        this.display = display;

        const shadowAllOptions = this.shadowRoot?.querySelectorAll('[data-picker-select-all]');
        (shadowAllOptions && shadowAllOptions.length
            ? shadowAllOptions
            : this.querySelectorAll('[data-picker-select-all]'))
            .forEach(x => {
                if (anyUnselected) {
                    x.classList.remove('active');
                } else {
                    x.classList.add('active');
                }
            });

        this._settingValue = false;
    }
}