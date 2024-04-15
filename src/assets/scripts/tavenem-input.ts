import { TavenemPopover, TavenemPopoverHTMLElement } from './tavenem-popover'

export class TavenemInputHtmlElement extends HTMLElement {
    _inputDebounce: number = -1;

    static get observedAttributes() {
        return [
            'data-input-class',
            'data-input-style',
            'disabled',
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
        const display = this.getAttribute('display');
        if (display) {
            return display;
        }

        const root = this.shadowRoot;
        if (!root) {
            return this.getAttribute('value');
        }

        const input = root.querySelector('input:not([type="hidden"])');
        if (input instanceof HTMLInputElement
            && input.value) {
            return input.value;
        } else {
            const input = root.querySelector('input');
            if (input instanceof HTMLInputElement
                && input.value) {
                return input.value;
            }
        }

        return this.getAttribute('value');
    }

    set display(value: string | null | undefined) {
        const root = this.shadowRoot;
        if (!root) {
            return;
        }
        const input = root.querySelector('input:not([type="hidden"])');
        if (input instanceof HTMLInputElement) {
            input.value = value || '';
        }
    }

    get value() {
        return this.getAttribute('value') || '';
    }

    set value(value: string) {
        const root = this.shadowRoot;
        if (!root) {
            return;
        }
        const hiddenInput = root.querySelector('input[type="hidden"]');
        const input = root.querySelector('input:not([type="hidden"])');
        if (!value && value != '0') {
            this.removeAttribute('value');
            if (input instanceof HTMLInputElement) {
                input.value = '';
            }
            if (hiddenInput instanceof HTMLInputElement) {
                hiddenInput.value = '';
                this.setAttribute('empty', '');
                this.dispatchEvent(TavenemInputHtmlElement.newValueChangeEvent(hiddenInput.value));
            }
        } else {
            this.setAttribute('value', value);
            if (input instanceof HTMLInputElement) {
                input.value = value;
            }
            if (hiddenInput instanceof HTMLInputElement) {
                hiddenInput.value = value;
                if (!value.length) {
                    this.setAttribute('empty', '');
                } else {
                    this.removeAttribute('empty');
                }
                this.dispatchEvent(TavenemInputHtmlElement.newValueChangeEvent(hiddenInput.value));
            }
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
            return suggestion.dataset.value;
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

    connectedCallback() {
        const shadow = this.attachShadow({ mode: 'open' });

        const style = document.createElement('style');
        style.textContent = `
:host {
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

:host(.input-content) {
    align-self: flex-start;
    flex-direction: column;
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
    :host([readonly]) &,
    :host(:required) &,
    :host([empty]) & {
        display: none;
    }
}
button.clear::-moz-focus-inner {
    border-style: none;
}`;
        shadow.appendChild(style);

        const prefixSlot = document.createElement('slot');
        prefixSlot.name = 'prefix'
        shadow.appendChild(prefixSlot);

        const hiddenInput = document.createElement('input');
        hiddenInput.disabled = this.hasAttribute('disabled');
        hiddenInput.hidden = true;
        if (this.hasAttribute('name')) {
            hiddenInput.name = this.getAttribute('name') || '';
        }
        hiddenInput.required = this.hasAttribute('required');
        hiddenInput.type = 'hidden';
        if (this.hasAttribute('value')) {
            hiddenInput.value = this.getAttribute('value') || '';
        }
        shadow.appendChild(hiddenInput);

        if (!hiddenInput.value || !hiddenInput.value.length) {
            this.setAttribute('empty', '');
        }

        const suggestion = document.createElement('span');
        suggestion.classList.add('suggestion');
        shadow.appendChild(suggestion);

        const input = document.createElement('input');
        if (this.hasAttribute('autocomplete')) {
            input.autocomplete = this.getAttribute('autocomplete') as AutoFill || 'off';
        }
        if (this.hasAttribute('autocorrect')) {
            input.setAttribute('autocorrect', this.getAttribute('autocorrect') || 'off');
        }
        input.autofocus = this.hasAttribute('autofocus');
        input.className = this.dataset.inputClass || '';
        input.disabled = hiddenInput.disabled;
        input.id = this.dataset.inputId || '';
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
        if (this.hasAttribute('pattern')) {
            input.pattern = this.getAttribute('pattern') || '';
        }
        if (this.hasAttribute('placeholder')) {
            input.placeholder = this.getAttribute('placeholder') || '';
        }
        input.readOnly = this.hasAttribute('readonly');
        if (this.hasAttribute('size')) {
            const sizeValue = this.getAttribute('size');
            if (sizeValue) {
                const size = parseFloat(sizeValue);
                input.size = size;
            }
        }
        if (this.hasAttribute('step')) {
            const stepValue = this.getAttribute('step');
            if (stepValue) {
                input.step = stepValue;
            }
        }
        if (this.hasAttribute('spellcheck')) {
            input.spellcheck = this.hasAttribute('spellcheck');
        }
        input.style.cssText = this.dataset.inputStyle || '';
        if (this.hasAttribute('tabindex')) {
            const tabIndexValue = this.getAttribute('tabindex');
            if (tabIndexValue) {
                const tabIndex = parseInt(tabIndexValue);
                input.tabIndex = tabIndex;
            }
        }
        if (this.hasAttribute('type')) {
            input.type = this.getAttribute('type') || 'text';
        }

        const display = this.getAttribute('display');
        if ((display && display.length)
            || (hiddenInput.value && hiddenInput.value.length)) {
            input.value = display || hiddenInput.value;
        }

        shadow.appendChild(input);

        if (display && !display.length) {
            this.setAttribute('empty', '');
        }

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

        const slot = document.createElement('slot');
        shadow.appendChild(slot);

        input.addEventListener('change', this.onChange.bind(this));
        input.addEventListener('input', this.onInput.bind(this));
        input.addEventListener('keydown', this.onKeyDown.bind(this));
        clear.addEventListener('mouseup', this.onClearMouseUp.bind(this));
        clear.addEventListener('click', this.onClear.bind(this));
        this.addEventListener('valuechange', this.onNestedValueChange.bind(this));
    }

    disconnectedCallback() {
        this.removeEventListener('valuechange', this.onNestedValueChange.bind(this));
        const root = this.shadowRoot;
        let input = this.querySelector('input:not([hidden])');
        if (!input && root) {
            input = root.querySelector('input:not([hidden])');
        }
        if (input) {
            input.removeEventListener('change', this.onChange.bind(this));
            input.removeEventListener('input', this.onInput.bind(this));
            if (input instanceof HTMLElement) {
                input.removeEventListener('keydown', this.onKeyDown.bind(this));
            }
        }
        let clear = this.querySelector('button.clear');
        if (!clear && root) {
            clear = root.querySelector('button.clear');
        }
        if (clear) {
            clear.removeEventListener('mousedown', this.onClearMouseUp.bind(this));
            clear.removeEventListener('click', this.onClear.bind(this));
        }
    }

    attributeChangedCallback(name: string, oldValue: string | null | undefined, newValue: string | null | undefined) {
        const root = this.shadowRoot;
        if (!root) {
            return;
        }
        const hiddenInput = root.querySelector('input[type="hidden"]');
        const input = root.querySelector('input:not([type="hidden"])');
        if (!hiddenInput
            || !(hiddenInput instanceof HTMLInputElement)
            || !input
            || !(input instanceof HTMLInputElement)) {
            return;
        }
        if (name === 'data-input-class') {
            input.className = newValue || '';
        } else if (name === 'data-input-style') {
            input.style.cssText = newValue || '';
        } else if (name === 'disabled') {
            input.disabled = hiddenInput.disabled = !!newValue;
        } else if (name === 'display') {
            input.value = newValue || '';
            if (!newValue
                || !newValue.length) {
                this.setAttribute('empty', '');
            } else {
                this.removeAttribute('empty');
            }
        } else if (name === 'max') {
            if (newValue) {
                const max = parseFloat(newValue);
                if (!Number.isNaN(max)) {
                    const value = parseFloat(hiddenInput.value);
                    if (!Number.isNaN(value) && value > max) {
                        input.value = hiddenInput.value = max.toString();
                        this.dispatchEvent(TavenemInputHtmlElement.newValueChangeEvent(input.value));
                    }
                }
            }
        } else if (name === 'min') {
            if (newValue) {
                const min = parseFloat(newValue);
                if (!Number.isNaN(min)) {
                    const value = parseFloat(hiddenInput.value);
                    if (!Number.isNaN(value) && value < min) {
                        input.value = hiddenInput.value = min.toString();
                        this.dispatchEvent(TavenemInputHtmlElement.newValueChangeEvent(input.value));
                    }
                }
            }
        } else if (name === 'readonly') {
            input.readOnly = !!newValue;
        } else if (name === 'required') {
            hiddenInput.required = !!newValue;
        } else if (name === 'value') {
            hiddenInput.value = newValue || '';
            const display = this.getAttribute('display');
            if (!display || !display.length) {
                input.value = hiddenInput.value;
                if (!input.value
                    || !input.value.length) {
                    this.setAttribute('empty', '');
                } else {
                    this.removeAttribute('empty');
                }
            } else if (!hiddenInput.value
                || !hiddenInput.value.length) {
                this.setAttribute('empty', '');
            }
        }
    }

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

    private onChange() {
        const root = this.shadowRoot;
        if (!root) {
            return;
        }
        this.onInput();
        const input = root.querySelector('input:not([type="hidden"])');
        if (input
            && input instanceof HTMLInputElement) {
            this.dispatchEvent(TavenemInputHtmlElement.newValueChangeEvent(input.value));
        }
    }

    private onClear(e: Event) {
        e.preventDefault();
        e.stopPropagation();

        const root = this.shadowRoot;
        if (!root) {
            return;
        }
        const hiddenInput = root.querySelector('input[type="hidden"]');
        const input = root.querySelector('input:not([type="hidden"])');
        if (hiddenInput
            && hiddenInput instanceof HTMLInputElement
            && input
            && input instanceof HTMLInputElement) {
            hiddenInput.value = input.value = '';
            this.onInput();
        }
    }

    private onClearMouseUp(e: Event) {
        e.preventDefault();
        e.stopPropagation();
    }

    private onInput() {
        const root = this.shadowRoot;
        if (!root) {
            return;
        }
        const hiddenInput = root.querySelector('input[type="hidden"]');
        const input = root.querySelector('input:not([type="hidden"])');
        if (!hiddenInput
            || !(hiddenInput instanceof HTMLInputElement)
            || !input
            || !(input instanceof HTMLInputElement)) {
            return;
        }

        hiddenInput.value = input.value;
        if ((!input.value || !input.value.length)
            && input.value != '0') {
            this.removeAttribute('value');
            this.setAttribute('empty', '');
        } else {
            this.setAttribute('value', input.value);
            this.removeAttribute('empty');
        }

        let currentLengthDisplay = this.querySelector('.current-length');
        if (!currentLengthDisplay
            && this.parentElement
            && this.parentElement.classList.contains('field')) {
            currentLengthDisplay = this.parentElement.querySelector('.current-length');
        }
        if (currentLengthDisplay instanceof HTMLElement) {
            currentLengthDisplay.innerText = hiddenInput.value.length.toString();
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

        this.dispatchEvent(TavenemInputHtmlElement.newValueInputEvent(input.value));
    }

    private onKeyDown(event: KeyboardEvent) {
        if (event.isComposing) {
            return;
        }
        if (event.key === "ArrowDown") {
            this.decrement();
        } else if (event.key === "ArrowUp") {
            this.increment();
        } else if (event.key === "Enter") {
            event.preventDefault();
            event.stopPropagation();
            this.dispatchEvent(TavenemInputHtmlElement.newEnterEvent());
            this.onChange();
        } else if (event.key === "Tab") {
            this.onTab(event);
        }
    }

    private onNestedValueChange(event: Event) {
        if (event.target === this
            || !(event instanceof CustomEvent)
            || !event.detail
            || !event.detail.value
            || typeof event.detail.value !== 'string') {
            return;
        }
        const root = this.shadowRoot;
        if (!root) {
            return;
        }
        const input = root.querySelector('input:not([type="hidden"])');
        if (!input
            || !(input instanceof HTMLInputElement)) {
            return;
        }

        input.value += event.detail.value;
        this.onInput();

        event.preventDefault();
        event.stopPropagation();
    }

    private onTab(event: KeyboardEvent) {
        if (!event.target) {
            return;
        }
        if (event.target !== this) {
            const popover = this.querySelector('tf-popover.contained-popover');
            if (popover
                && event.target instanceof Node
                && popover.contains(event.target)) {
                return;
            }
        }

        const root = this.shadowRoot;
        if (!root) {
            return null;
        }

        const suggestion = root.querySelector('.suggestion');
        if (!(suggestion instanceof HTMLElement)) {
            return;
        }

        const suggestionDisplay = suggestion.dataset.display && suggestion.dataset.display.length
            ? suggestion.dataset.display
            : suggestion.textContent;

        const suggestionValue = suggestion.dataset.value && suggestion.dataset.value.length
            ? suggestion.dataset.value
            : suggestionDisplay;
        if (!suggestionValue
            || !suggestionValue.length) {
            return;
        }

        const hiddenInput = root.querySelector('input[type="hidden"]');
        const input = root.querySelector('input:not([type="hidden"])');
        if (!hiddenInput
            || !(hiddenInput instanceof HTMLInputElement)
            || !input
            || !(input instanceof HTMLInputElement)) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        this.setAttribute('value', suggestionValue);
        hiddenInput.value = suggestionValue;
        input.value = suggestionDisplay || suggestionValue;
        this.removeAttribute('empty');

        suggestion.textContent = null;

        if (this.parentElement
            && this.parentElement instanceof TavenemPickerHtmlElement
            && this.parentElement.querySelector('tf-popover.contained-popover > .suggestion-list')) {
            this.parentElement.setOpen(false);
        }

        this.dispatchEvent(TavenemInputHtmlElement.newValueChangeEvent(suggestionValue));
    }

    private stepValue(down: boolean, event?: Event) {
        const root = this.shadowRoot;
        if (!root) {
            return;
        }
        const input = root.querySelector('input:not([type="hidden"])');
        if (!input
            || !(input instanceof HTMLInputElement)) {
            return;
        }

        let value = parseFloat(input.value);
        if (Number.isNaN(value)) {
            return;
        }

        let stepString = this.getAttribute('step') || 'any';
        if (stepString === 'any') {
            stepString = '1';
        }
        let step = parseFloat(stepString);
        if (!Number.isFinite(step)
            || step <= 0) {
            step = 1;
        }

        if (down) {
            value -= step;
        } else {
            value += step;
        }

        const precision = TavenemInputHtmlElement.getPrecision(step);
        if (precision === 0) {
            value = Math.round(value);
        } else {
            const factor = precision * 10;
            value = Math.round(value * factor) / factor;
        }

        const max = parseFloat(this.getAttribute('max') || '');
        if (!Number.isNaN(max)) {
            value = Math.min(max, value);
        }

        const min = parseFloat(this.getAttribute('min') || '');
        if (!Number.isNaN(min)) {
            value = Math.max(min, value);
        }

        input.value = value.toString();
        this.onInput();

        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
    }

    private updateInputDebounced() {
        const root = this.shadowRoot;
        if (!root) {
            return;
        }
        const input = root.querySelector('input:not([type="hidden"])');
        if (input
            && input instanceof HTMLInputElement) {
            input.dispatchEvent(TavenemInputHtmlElement.newValueInputEvent(input.value));
        }
    }
}

export class TavenemPickerHtmlElement extends HTMLElement {
    _closeCooldownTimer: number;
    _closed: boolean;
    _hideTimer: number;
    _searchText: string | null | undefined;
    _searchTimer: number = -1;

    static get observedAttributes() {
        return ['disabled', 'readonly', 'value'];
    }

    constructor() {
        super();

        this._closeCooldownTimer = -1;
        this._closed = false;
        this._hideTimer = -1;
    }

    private static newSearchInputEvent(value: string) {
        return new CustomEvent('searchinput', { bubbles: true, composed: true, detail: { value: value } });
    }

    private static newValueChangeEvent(value: string) {
        return new CustomEvent('valuechange', { bubbles: true, composed: true, detail: { value: value } });
    }

    connectedCallback() {
        const shadow = this.attachShadow({ mode: 'open' });

        const style = document.createElement('style');
        style.textContent = `:host {
    position: relative;
}

slot {
    border-radius: inherit;
}
`;
        shadow.appendChild(style);

        const slot = document.createElement('slot');
        shadow.appendChild(slot);

        this.addEventListener('focuslost', this.onPopoverFocusLost.bind(this));
        this.addEventListener('mousedown', this.onMouseDown.bind(this));
        this.addEventListener('mouseup', this.onMouseUp.bind(this));
        this.addEventListener('keyup', this.onKeyUp.bind(this));
        this.addEventListener('valueinput', this.onValueInput.bind(this));

        document.addEventListener('mousedown', this.onDocMouseDown.bind(this));
    }

    disconnectedCallback() {
        clearTimeout(this._hideTimer);
        this.removeEventListener('focuslost', this.onPopoverFocusLost.bind(this));
        this.removeEventListener('mousedown', this.onMouseDown.bind(this));
        this.removeEventListener('mouseup', this.onMouseUp.bind(this));
        this.removeEventListener('keyup', this.onKeyUp.bind(this));
        this.removeEventListener('valueinput', this.onValueInput.bind(this));
        document.removeEventListener('mousedown', this.onDocMouseDown.bind(this));
    }

    attributeChangedCallback(name: string, oldValue: string | null | undefined, newValue: string | null | undefined) {
        if ((name === 'disabled'
            || name === 'readonly')
            && newValue) {
            this.close();
        } else if (name === 'value'
            && newValue) {
            this.onSubmitValue(newValue);
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
        let input = this.querySelector('.picker-value');
        if (!input && this.shadowRoot) {
            input = this.shadowRoot.querySelector('.picker-value');
        }
        if (input instanceof HTMLInputElement
            || input instanceof TavenemInputHtmlElement) {
            input.value = '';
        }

        this.querySelectorAll('option, [data-close-picker-value], [data-picker-select-all]')
            .forEach(x => x.classList.remove('active'));
        if (this.shadowRoot) {
            this.shadowRoot.querySelectorAll('option, [data-close-picker-value], [data-picker-select-all]')
                .forEach(x => x.classList.remove('active'));
        }
    }

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
        if (event.key === "Enter" || event.key === " ") {
            this.onSubmit(event);
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
            if ('allowDelete' in this.dataset) {
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

    protected onToggle(event: Event) {
        event.preventDefault();
        event.stopPropagation();

        this.toggle();
    }

    protected onValueInput(event: Event) {
        if (!event.target) {
            return;
        }

        let searchText = this._searchText;
        let input = this.querySelector('.picker-value');
        if (!input && this.shadowRoot) {
            input = this.shadowRoot.querySelector('.picker-value');
        }
        if (event.target === input
            && (input instanceof HTMLInputElement
                || input instanceof TavenemInputHtmlElement)) {
            searchText = input.value.toLowerCase();
        }

        if (input instanceof TavenemInputHtmlElement) {
            input.suggestion = null;
        }

        let options = Array
            .from(this.querySelectorAll('option, [data-close-picker-value]'))
            .filter<HTMLElement>((x): x is HTMLElement => x instanceof HTMLElement)
            .sort(TavenemPickerHtmlElement.documentPositionComparator);
        if (!options.length && this.shadowRoot) {
            options = Array
                .from(this.shadowRoot.querySelectorAll('option, [data-close-picker-value]'))
                .filter<HTMLElement>((x): x is HTMLElement => x instanceof HTMLElement)
                .sort(TavenemPickerHtmlElement.documentPositionComparator);
            if (!options.length) {
                return;
            }
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
            this.dispatchEvent(TavenemPickerHtmlElement.newSearchInputEvent(searchText));
            return;
        }

        if (!('popoverOpen' in this.dataset)) {
            if (!this.hasAttribute('disabled')
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
            const current = input.display || input.value;
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

            if ('popoverOpen' in this.dataset) {
                match.focus();
                match.scrollIntoView({ behavior: 'smooth' });
            }

            this.onSubmitValue(value, display);
        }
    }

    private static documentPositionComparator(a: Node, b: Node) {
        if (a === b) {
            return 0;
        }

        var position = a.compareDocumentPosition(b);

        if (position & Node.DOCUMENT_POSITION_FOLLOWING || position & Node.DOCUMENT_POSITION_CONTAINED_BY) {
            return -1;
        } else if (position & Node.DOCUMENT_POSITION_PRECEDING || position & Node.DOCUMENT_POSITION_CONTAINS) {
            return 1;
        } else {
            return 0;
        }
    }

    private clearSearchFilter() {
        let options = Array
            .from(this.querySelectorAll('option, [data-close-picker-value]'))
            .sort(TavenemPickerHtmlElement.documentPositionComparator);
        if (!options.length && this.shadowRoot) {
            options = Array
                .from(this.shadowRoot.querySelectorAll('option, [data-close-picker-value]'))
                .sort(TavenemPickerHtmlElement.documentPositionComparator);
            if (!options.length) {
                return;
            }
        }
        for (var option of options) {
            if (!(option instanceof HTMLElement)) {
                continue;
            }
            option.classList.remove('search-nonmatch');
        }
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

        let input = this.querySelector('.picker-value');
        if (!input && this.shadowRoot) {
            input = this.shadowRoot.querySelector('.picker-value');
        }
        if (input
            && (input instanceof HTMLInputElement
                || input instanceof TavenemInputHtmlElement)) {
            this.dispatchEvent(TavenemPickerHtmlElement.newValueChangeEvent(input.value));
        }

        this._closeCooldownTimer = setTimeout(() => this._closed = false, 200);
    }

    private getSelectedIndices(): {
        options?: HTMLElement[],
        firstSelectedIndex?: number,
        lastSelectedIndex?: number
    } {
        let value: string | undefined;
        let input = this.querySelector('.picker-value');
        if (!input && this.shadowRoot) {
            input = this.shadowRoot.querySelector('.picker-value');
        }
        if (input
            && (input instanceof HTMLInputElement
                || input instanceof TavenemInputHtmlElement)) {
            value = input.value;
        }
        if (!value) {
            return {};
        }

        let options = Array
            .from(this.querySelectorAll('option, [data-close-picker-value]'))
            .filter<HTMLElement>((x): x is HTMLElement => x instanceof HTMLElement)
            .sort(TavenemPickerHtmlElement.documentPositionComparator);
        if (!options.length && this.shadowRoot) {
            options = Array
                .from(this.shadowRoot.querySelectorAll('option, [data-close-picker-value]'))
                .filter<HTMLElement>((x): x is HTMLElement => x instanceof HTMLElement)
                .sort(TavenemPickerHtmlElement.documentPositionComparator);
        }
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
                if (option.dataset.closePickerValue === value) {
                    if (firstSelectedIndex == null) {
                        firstSelectedIndex = i;
                    }
                    lastSelectedIndex = i;
                }
            } else if (option instanceof HTMLOptionElement
                && option.value === value) {
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

    private onArrowDown(event: KeyboardEvent) {
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

        const selectedIndices = this.getSelectedIndices();
        if (!selectedIndices.options
            || (selectedIndices.lastSelectedIndex != null
                && selectedIndices.lastSelectedIndex >= selectedIndices.options.length - 1)) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        let newOption = selectedIndices.options[(selectedIndices.lastSelectedIndex || -1) + 1];

        let input = this.querySelector('.picker-value');
        if (!input && this.shadowRoot) {
            input = this.shadowRoot.querySelector('.picker-value');
        }
        if (input instanceof HTMLInputElement
            || input instanceof TavenemInputHtmlElement) {
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

    private onArrowUp(event: KeyboardEvent) {
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

        const selectedIndices = this.getSelectedIndices();
        if (!selectedIndices.options
            || (selectedIndices.firstSelectedIndex != null
                && selectedIndices.firstSelectedIndex <= 0)) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        let newOption = selectedIndices.options[(selectedIndices.lastSelectedIndex || -1) - 1];

        let input = this.querySelector('.picker-value');
        if (!input && this.shadowRoot) {
            input = this.shadowRoot.querySelector('.picker-value');
        }
        if (input instanceof HTMLInputElement
            || input instanceof TavenemInputHtmlElement) {
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

    private onSelectAll(event: Event) {
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

        this.selectAll(false);
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

    private onSubmitOption(element: HTMLElement | SVGElement) {
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

    private onSubmitValue(value?: string, display?: string | null) {
        if (!value) {
            return;
        }

        if (this.hasAttribute('multiple')) {
            this.onSubmitValueForMultiple(value, display);
            return;
        }

        let input = this.querySelector('.picker-value');
        if (!input && this.shadowRoot) {
            input = this.shadowRoot.querySelector('.picker-value');
        }
        if (input instanceof HTMLInputElement
            || input instanceof TavenemInputHtmlElement) {
            input.value = value;
        }

        if (display && input instanceof TavenemInputHtmlElement) {
            input.display = display;
        }

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
            if ('closePickerValue' in option.dataset) {
                if (option.dataset.closePickerValue === value) {
                    option.classList.add('active');
                } else {
                    anyNotSelected = true;
                    option.classList.remove('active');
                }
            } else if (option instanceof HTMLOptionElement) {
                if (option.value === value) {
                    option.classList.add('active');
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

    private onSubmitValueForMultiple(value: string, display?: string | null) {
        let currentValue: string | string[] | undefined;
        let useShadow = false;
        let input = this.querySelector('.picker-value');
        if (!input && this.shadowRoot) {
            useShadow = true;
            input = this.shadowRoot.querySelector('.picker-value');
        }
        if (input instanceof HTMLInputElement
            || input instanceof TavenemInputHtmlElement) {
            currentValue = input.value;
            if (currentValue.startsWith('[')
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
                value = '';
                display = null;
            }
        } else if (currentValue === value) {
            value = '';
            display = null;
        } else if (currentValue && currentValue.length) {
            currentValue = [currentValue, value];
            value = JSON.stringify(currentValue);
        } else {
            currentValue = value;
        }

        if (input instanceof HTMLInputElement
            || input instanceof TavenemInputHtmlElement) {
            input.value = value;
        }

        let options = Array
            .from((useShadow ? this.shadowRoot! : this).querySelectorAll('option, [data-close-picker-value]'))
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
            .sort(TavenemPickerHtmlElement.documentPositionComparator);

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

        if (display && input instanceof TavenemInputHtmlElement) {
            input.display = display;
        }

        (useShadow ? this.shadowRoot! : this).querySelectorAll('[data-picker-select-all]')
            .forEach(x => {
                if (anyUnselected) {
                    x.classList.remove('active');
                } else {
                    x.classList.add('active');
                }
            });
    }

    private open() {
        clearTimeout(this._hideTimer);

        if (this._closed
            || this.hasAttribute('disabled')
            || this.hasAttribute('readonly')) {
            return;
        }

        this.openInner();
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
            TavenemPopover.placePopover(popover);
            this.dataset.popoverOpen = '';
        }

        if ('searchFilter' in this.dataset) {
            this.clearSearchFilter();
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

    private onSearchInput(event: KeyboardEvent) {
        if (!event.target) {
            return;
        }

        let input = this.querySelector('.picker-value');
        if (!input && this.shadowRoot) {
            input = this.shadowRoot.querySelector('.picker-value');
        }
        if (event.target === input
            && (input instanceof HTMLInputElement
                || input instanceof TavenemInputHtmlElement)) {
            return;
        }

        if (event.target !== this) {
            let popover = this.querySelector('tf-popover.contained-popover');
            if (!popover && this.shadowRoot) {
                popover = this.shadowRoot.querySelector('tf-popover.contained-popover');
            }
            if (popover
                && event.target instanceof Node
                && popover.contains(event.target)
                && !('popoverOpen' in this.dataset)) {
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

    private selectAll(toggle: boolean) {
        let options = Array
            .from(this.querySelectorAll('option, [data-close-picker-value]'))
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
        let useShadowOptions = false;
        if (options.length === 0) {
            if (this.shadowRoot) {
                useShadowOptions = true;
                options = Array
                    .from(this.shadowRoot.querySelectorAll('option, [data-close-picker-value]'))
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
            }
            if (options.length === 0) {
                return;
            }
        }

        if (toggle) {
            const allSelected = options.every(x => x.hasAttribute('disabled')
                || x.classList.contains('active'));
            if (allSelected) {
                this.clear();
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

        let input = this.querySelector('.picker-value');
        if (!input && this.shadowRoot) {
            input = this.shadowRoot.querySelector('.picker-value');
        }
        if (input instanceof HTMLInputElement
            || input instanceof TavenemInputHtmlElement) {
            input.value = value;
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

        if (display && input instanceof TavenemInputHtmlElement) {
            input.display = display;
        }

        for (var i = 0; i < enabledOptions.length; i++) {
            enabledOptions[i].classList.add('active');
        }

        if (enabledOptions.length === options.length) {
            (useShadowOptions ? this.shadowRoot! : this).querySelectorAll('[data-picker-select-all]')
                .forEach(x => {
                    x.classList.add('active');
                });
        }
    }
}