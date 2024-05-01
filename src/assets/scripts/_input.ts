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
        if (value) {
            this.setAttribute('display', value);
        } else {
            this.removeAttribute('display');
        }

        const root = this.shadowRoot;
        if (!root) {
            return;
        }
        const input = root.querySelector('input:not([type="hidden"])');
        if (!(input instanceof HTMLInputElement)) {
            return;
        }
        if (value && value.length) {
            input.value = value;
        } else {
            const hiddenInput = root.querySelector('input[type="hidden"]');
            if (hiddenInput instanceof HTMLInputElement) {
                const minLength = parseInt(this.dataset.minLength || '');
                if (Number.isFinite(minLength)
                    && minLength > hiddenInput.value.length) {
                    input.value = hiddenInput.value.padStart(minLength, this.dataset.paddingChar);
                } else {
                    input.value = hiddenInput.value;
                }
            } else {
                input.value = '';
            }
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
            if (hiddenInput instanceof HTMLInputElement
                && hiddenInput.value !== '') {
                hiddenInput.value = '';
                this.setAttribute('empty', '');
                this.dispatchEvent(TavenemInputHtmlElement.newValueChangeEvent(hiddenInput.value));
            }
        } else {
            this.setAttribute('value', value);
            if (hiddenInput instanceof HTMLInputElement
                && hiddenInput.value !== value) {
                hiddenInput.value = value;
                if (!value.length) {
                    this.setAttribute('empty', '');
                } else {
                    this.removeAttribute('empty');
                }
                this.dispatchEvent(TavenemInputHtmlElement.newValueChangeEvent(hiddenInput.value));
            }
            if (input instanceof HTMLInputElement) {
                const minLength = parseInt(this.dataset.minLength || '');
                if (Number.isFinite(minLength)
                    && minLength > value.length) {
                    input.value = value.padStart(minLength, this.dataset.paddingChar);
                } else {
                    input.value = value;
                }
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
    :host([readonly]):not(.clearable-readonly) &,
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
        } else {
            input.spellcheck = false;
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
        if (display && display.length) {
            input.value = display;
        } else if (hiddenInput.value && hiddenInput.value.length) {
            const minLength = parseInt(this.dataset.minLength || '');
            if (Number.isFinite(minLength)
                && minLength > hiddenInput.value.length) {
                input.value = hiddenInput.value.padStart(minLength, this.dataset.paddingChar);
            } else {
                input.value = hiddenInput.value;
            }
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

    private onChange(event: Event) {
        const root = this.shadowRoot;
        if (!root) {
            return;
        }
        this.onInput(event);
        const input = root.querySelector('input:not([type="hidden"])');
        if (input instanceof HTMLInputElement) {
            this.dispatchEvent(TavenemInputHtmlElement.newValueChangeEvent(input.value));
        }
    }

    private onClear(event: Event) {
        event.preventDefault();
        event.stopPropagation();

        const root = this.shadowRoot;
        if (!root) {
            return;
        }
        const hiddenInput = root.querySelector('input[type="hidden"]');
        const input = root.querySelector('input:not([type="hidden"])');
        if (hiddenInput instanceof HTMLInputElement
            && input instanceof HTMLInputElement) {
            hiddenInput.value = input.value = '';
            this.removeAttribute('value');
            this.setAttribute('empty', '');

            let currentLengthDisplay = this.querySelector('.current-length');
            if (!currentLengthDisplay
                && this.parentElement
                && this.parentElement.classList.contains('field')) {
                currentLengthDisplay = this.parentElement.querySelector('.current-length');
            }
            if (currentLengthDisplay instanceof HTMLElement) {
                currentLengthDisplay.innerText = '0';
            }

            this.dispatchEvent(TavenemInputHtmlElement.newValueChangeEvent(''));
        }
    }

    private onClearMouseUp(event: Event) {
        event.preventDefault();
        event.stopPropagation();
    }

    private onInput(event?: Event) {
        if (!this.onInputInner(event)) {
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
        if (input instanceof HTMLInputElement) {
            this.dispatchEvent(TavenemInputHtmlElement.newValueInputEvent(input.value));
            return;
        }
    }

    private onInputInner(event?: Event) {
        if (event instanceof InputEvent
            && event.isComposing) {
            return false;
        }

        const root = this.shadowRoot;
        if (!root) {
            return false;
        }
        const hiddenInput = root.querySelector('input[type="hidden"]');
        const input = root.querySelector('input:not([type="hidden"])');
        if (!(hiddenInput instanceof HTMLInputElement)
            || !(input instanceof HTMLInputElement)
            || hiddenInput.value === input.value
            || input.value === this.getAttribute('display')) {
            return false;
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

        return true;
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
            this.onChange(event);
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
        this.onInput(event);

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
            && typeof (this.parentElement as any).setOpen === "function"
            && this.parentElement.querySelector('tf-popover.contained-popover > .suggestion-list')) {
            (this.parentElement as any).setOpen(false);
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
        this.onInput(event);

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
