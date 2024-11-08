import { randomUUID } from "../tavenem-utility";

export class TavenemSliderHTMLElement extends HTMLElement {
    static formAssociated = true;
    static style = `
:host {
    --field-active-border-color: var(--tavenem-theme-color, var(--tavenem-color-primary));
    --field-active-border-hover-color: var(--tavenem-theme-color-lighten, var(--tavenem-color-primary-lighten));
    --field-active-label-color: var(--tavenem-theme-color, var(--tavenem-color-primary));
    --field-border-color: var(--tavenem-color-border-input);
    --field-border-hover-color: var(--tavenem-color-action);
    --field-color: var(--tavenem-color-text);
    --field-label-color: var(--tavenem-color-text-secondary);
    --output-display: none;
    --output-opacity: 0;
    --thumb-color: var(--tavenem-color-action);
    --thumb-label-color: var(--tavenem-color-default-text);
    --thumb-label-color-bg: var(--tavenem-color-default);
    --thumb-shadow-color: rgba(0,0,0,.24);
    --thumb-shadow: 0 0 0 2px var(--thumb-shadow-color);
    --track-color: rgba(var(--tavenem-color-action-rgb), .3);
    border: 0;
    color: var(--tavenem-color-text);
    display: inline-flex;
    flex-basis: auto;
    flex-direction: column;
    flex-shrink: 1;
    margin: 0;
    margin-bottom: .5rem;
    margin-top: 1rem;
    max-width: 100%;
    padding: 0;
    position: relative;
    user-select: none;
    vertical-align: top;
    width: 100%;
}

:host(.filled) {
    background: transparent !important;
}

:host(.hash-labels) {
    padding-bottom: calc(.25em + 6px);
}

:host(.show-value) {
    --output-display: block;
}

:host(:not(:disabled, [readonly], [inert])) .input:focus-within + output {
    --output-opacity: 1;
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
    transition: color 200ms cubic-bezier(0.0, 0, 0.2, 1) 0ms,transform 200ms cubic-bezier(0.0, 0, 0.2, 1) 0ms;

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

.slider {
    align-items: center;
    display: flex;
}

label + .slider {
    margin-top: 1rem;
}

.filler {
    background-color: var(--thumb-color);
    border-radius: 1px;
    display: var(--tavenem-slider-filler-display, none);
    height: 2px;
    position: absolute;
}

.input {
    display: inline-block;
    line-height: 12px;
    min-height: 12px;
    padding: 0;
    position: relative;
    width: 100%;
}

input {
    -webkit-appearance: none;
    -moz-appearance: none;
    background-color: transparent;
    cursor: pointer;
    display: block;
    height: auto;
    position: relative;
    width: 100%;

    &:focus {
        outline: none;
    }
}

output {
    align-items: center;
    background-color: var(--thumb-label-color-bg);
    border-radius: 2px;
    color: var(--thumb-label-color);
    display: var(--output-display, none);
    font-size: .75rem;
    justify-content: center;
    line-height: normal;
    opacity: var(--output-opacity, 0);
    padding: 4px 8px;
    pointer-events: none;
    position: absolute;
    text-align: center;
    top: 0;
    transform: translate(-50%, -125%);
    transition: opacity .2s ease-in-out;
    user-select: none;
}

:host(.filled) {
    --tavenem-slider-filler-display: block;
    background-color: transparent;
    color: var(--tavenem-color-text);

    > .input {
        background-color: transparent;
    }

    > label + .input {
        margin-top: 1rem;
    }
}

:host(.outlined) {
    border: 0;
}

:host(.bg-alt) {
    background-color: transparent;
}

:host(:where(
    .primary,
    .secondary,
    .tertiary,
    .danger,
    .dark,
    .default,
    .info,
    .success,
    .warning)) {
    --thumb-color: var(--tavenem-theme-color);
    --thumb-label-color: var(--tavenem-theme-color-text);
    --thumb-label-color-bg: var(--tavenem-theme-color);
    --thumb-shadow-color: var(--tavenem-theme-color-hover-bright-2);
    color: var(--tavenem-color-text);
}

:host(:where(.primary)) {
    --track-lightness: var(--tavenem-color-primary-lightness);
    --track-color: hsla(var(--tavenem-color-primary-hue), var(--tavenem-color-primary-saturation), var(--track-lightness), .3);

    &.darken {
        --track-lightness: calc(var(--tavenem-color-primary-lightness) - 10%);
    }

    &.lighten {
        --track-lightness: calc(var(--tavenem-color-primary-lightness) + 10%);
    }
}

:host(:where(.secondary)) {
    --track-lightness: var(--tavenem-color-secondary-lightness);
    --track-color: hsla(var(--tavenem-color-secondary-hue), var(--tavenem-color-secondary-saturation), var(--track-lightness), .3);

    &.darken {
        --track-lightness: calc(var(--tavenem-color-secondary-lightness) - 10%);
    }

    &.lighten {
        --track-lightness: calc(var(--tavenem-color-secondary-lightness) + 10%);
    }
}

:host(:where(.tertiary)) {
    --track-lightness: var(--tavenem-color-tertiary-lightness);
    --track-color: hsla(var(--tavenem-color-tertiary-hue), var(--tavenem-color-tertiary-saturation), var(--track-lightness), .3);

    &.darken {
        --track-lightness: calc(var(--tavenem-color-tertiary-lightness) - 10%);
    }

    &.lighten {
        --track-lightness: calc(var(--tavenem-color-tertiary-lightness) + 10%);
    }
}

:host(:where(.danger)) {
    --track-lightness: var(--tavenem-color-danger-lightness);
    --track-color: hsla(var(--tavenem-color-danger-hue), var(--tavenem-color-danger-saturation), var(--track-lightness), .3);

    &.darken {
        --track-lightness: calc(var(--tavenem-color-danger-lightness) - 10%);
    }

    &.lighten {
        --track-lightness: calc(var(--tavenem-color-danger-lightness) + 10%);
    }
}

:host(:where(.dark)) {
    --track-lightness: var(--tavenem-color-dark-lightness);
    --track-color: hsla(var(--tavenem-color-dark-hue), var(--tavenem-color-dark-saturation), var(--track-lightness), .3);

    &.darken {
        --track-lightness: calc(var(--tavenem-color-dark-lightness) - 10%);
    }

    &.lighten {
        --track-lightness: calc(var(--tavenem-color-dark-lightness) + 10%);
    }
}

:host(:where(.default)) {
    --track-lightness: var(--tavenem-color-default-lightness);
    --track-color: hsla(var(--tavenem-color-default-hue), var(--tavenem-color-default-saturation), var(--track-lightness), .3);

    &.darken {
        --track-lightness: calc(var(--tavenem-color-default-lightness) - 10%);
    }

    &.lighten {
        --track-lightness: calc(var(--tavenem-color-default-lightness) + 10%);
    }
}

:host(:where(.info)) {
    --track-lightness: var(--tavenem-color-info-lightness);
    --track-color: hsla(var(--tavenem-color-info-hue), var(--tavenem-color-info-saturation), var(--track-lightness), .3);

    &.darken {
        --track-lightness: calc(var(--tavenem-color-info-lightness) - 10%);
    }

    &.lighten {
        --track-lightness: calc(var(--tavenem-color-info-lightness) + 10%);
    }
}

:host(:where(.success)) {
    --track-lightness: var(--tavenem-color-success-lightness);
    --track-color: hsla(var(--tavenem-color-success-hue), var(--tavenem-color-success-saturation), var(--track-lightness), .3);

    &.darken {
        --track-lightness: calc(var(--tavenem-color-success-lightness) - 10%);
    }

    &.lighten {
        --track-lightness: calc(var(--tavenem-color-success-lightness) + 10%);
    }
}

:host(:where(.warning)) {
    --track-lightness: var(--tavenem-color-warning-lightness);
    --track-color: hsla(var(--tavenem-color-warning-hue), var(--tavenem-color-warning-saturation), var(--track-lightness), .3);

    &.darken {
        --track-lightness: calc(var(--tavenem-color-warning-lightness) - 10%);
    }

    &.lighten {
        --track-lightness: calc(var(--tavenem-color-warning-lightness) + 10%);
    }
}

:host(:invalid:state(touched)) {
    --thumb-color: var(--tavenem-color-error);
    --thumb-label-color: var(--tavenem-color-error-text);
    --thumb-label-color-bg: var(--tavenem-color-error);
    --thumb-shadow-color: var(--tavenem-color-error-hover-bright-2);
    --track-lightness: var(--tavenem-color-error-lightness);
    --track-color: hsla(var(--tavenem-color-error-hue), var(--tavenem-color-error-saturation), var(--track-lightness), 0.30);

    label {
        color: var(--tavenem-color-error);
    }
}

:host(:disabled) .input input,
:host(:disabled) .input input:active,
:host(:disabled) .input input:focus-visible {
    --thumb-color: var(--tavenem-color-action-disabled);
    --track-color: var(--tavenem-color-action-disabled-bg);
    cursor: default;
    opacity: 0.38;
}

:host(:disabled) > label {
    color: var(--tavenem-color-text-disabled);
}

:host([readonly], [inert]) input,
:host([readonly], [inert]) input:active,
:host([readonly], [inert]) input:focus-visible {
    cursor: default;
}

.field-helpers {
    color: var(--thumb-color);
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

:host input::-webkit-slider-runnable-track {
    background-color: var(--track-color);
    border-radius: 1px;
    height: 2px;
    margin: 10px 0;
    width: 100%;
}

:host input::-moz-range-track {
    background-color: var(--track-color);
    border-radius: 1px;
    height: 2px;
    margin: 10px 0;
    width: 100%;
}

:host input::-webkit-slider-thumb {
    appearance: none;
    -webkit-appearance: none;
    background-color: var(--thumb-color);
    border-style: none;
    border-radius: 50%;
    cursor: pointer;
    height: 2px;
    transition: box-shadow 0.2s;
    transform: scale(6, 6);
    width: 2px;
}
:host input::-webkit-slider-thumb:hover {
    box-shadow: var(--thumb-shadow);
}

:host input::-moz-range-thumb {
    appearance: none;
    -webkit-appearance: none;
    background-color: var(--thumb-color);
    border-style: none;
    border-radius: 50%;
    cursor: pointer;
    height: 2px;
    transition: box-shadow 0.2s;
    transform: scale(6, 6);
    width: 2px;
}
:host input::-moz-range-thumb:hover {
    box-shadow: var(--thumb-shadow);
}

:host input:active::-webkit-slider-thumb {
    box-shadow: var(--thumb-shadow);
}
:host input:active::-moz-range-thumb {
    box-shadow: var(--thumb-shadow);
}
:host input:focus-visible::-webkit-slider-thumb {
    box-shadow: var(--thumb-shadow);
}
:host input:focus-visible::-moz-range-thumb {
    box-shadow: var(--thumb-shadow);
}

:host(:disabled) .input input::-webkit-slider-thumb {
    box-shadow: none;
    cursor: default;
}
:host(:disabled) .input input::-moz-range-thumb {
    box-shadow: none;
    cursor: default;
}
:host(:disabled) .input input:active::-webkit-slider-thumb {
    box-shadow: none;
    cursor: default;
}
:host(:disabled) .input input:active::-moz-range-thumb {
    box-shadow: none;
    cursor: default;
}
:host(:disabled) .input input:focus-visible::-webkit-slider-thumb {
    box-shadow: none;
    cursor: default;
}
:host(:disabled) .input input:focus-visible::-moz-range-thumb {
    box-shadow: none;
    cursor: default;
}

:host([readonly]) input::-webkit-slider-thumb {
    box-shadow: none;
    cursor: default;
}
:host([readonly]) input::-moz-range-thumb {
    box-shadow: none;
    cursor: default;
}
:host([readonly]) input:active::-webkit-slider-thumb {
    box-shadow: none;
    cursor: default;
}
:host([readonly]) input:active::-moz-range-thumb {
    box-shadow: none;
    cursor: default;
}
:host([readonly]) input:focus-visible::-webkit-slider-thumb {
    box-shadow: none;
    cursor: default;
}
:host([readonly]) input:focus-visible::-moz-range-thumb {
    box-shadow: none;
    cursor: default;
}

:host([inert]) input::-webkit-slider-thumb {
    box-shadow: none;
    cursor: default;
}
:host([inert]) input::-moz-range-thumb {
    box-shadow: none;
    cursor: default;
}
:host([inert]) input:active::-webkit-slider-thumb {
    box-shadow: none;
    cursor: default;
}
:host([inert]) input:active::-moz-range-thumb {
    box-shadow: none;
    cursor: default;
}
:host([inert]) input:focus-visible::-webkit-slider-thumb {
    box-shadow: none;
    cursor: default;
}
:host([inert]) input:focus-visible::-moz-range-thumb {
    box-shadow: none;
    cursor: default;
}
`;

    private _assigningValue = false;
    private _formValue = '0';
    private _initialValue: string | null | undefined;
    private _inputDebounce: number = -1;
    private _internals: ElementInternals;
    private _max = 100;
    private _min = 0;
    private _settingValue = false;
    private _value = 0;

    static get observedAttributes() {
        return ['data-label', 'max', 'min', 'readonly', 'value'];
    }

    private static newValueChangeEvent(value: string) {
        return new CustomEvent('valuechange', { bubbles: true, composed: true, detail: { value: value } });
    }

    get form() { return this._internals.form; }

    get name() { return this.getAttribute('name'); }

    get type() { return this.localName; }

    get validity() { return this._internals.validity; }
    get validationMessage() { return this._internals.validationMessage; }

    get value() { return this._formValue; }
    set value(v: string) { this.setTextValue(v); }

    get willValidate() { return this._internals.willValidate; }

    constructor() {
        super();

        this._internals = this.attachInternals();
    }

    connectedCallback() {
        this._max = Number.parseFloat(this.getAttribute('max') || '100') || 100;
        this._min = Number.parseFloat(this.getAttribute('min') || '0') || 0;

        const shadow = this.attachShadow({ mode: 'open', delegatesFocus: true });

        const style = document.createElement('style');
        style.textContent = TavenemSliderHTMLElement.style;
        shadow.appendChild(style);

        const inputId = randomUUID();
        if ('label' in this.dataset
            && this.dataset.label
            && this.dataset.label.length) {
            const label = document.createElement('label');
            label.htmlFor = inputId;
            label.innerText = this.dataset.label;
            shadow.appendChild(label);
        }

        const slider = document.createElement('div');
        slider.classList.add('slider');
        if (this.matches(':disabled')
            || this.hasAttribute('readonly')) {
            slider.inert = true;
        }
        shadow.appendChild(slider);

        const filler = document.createElement('div');
        filler.classList.add('filler');
        slider.appendChild(filler);

        const div = document.createElement('div');
        div.classList.add('input');
        slider.appendChild(div);

        const hashSlot = document.createElement('slot');
        hashSlot.name = 'hashes';
        div.appendChild(hashSlot);

        const input = document.createElement('input');
        input.id = inputId;
        input.max = this._max.toString();
        input.min = this._min.toString();
        if (this.hasAttribute('step')) {
            input.step = this.getAttribute('step') || '';
        }
        input.type = 'range';
        input.value = this._formValue;
        input.addEventListener('input', this.onInput.bind(this));
        div.appendChild(input);

        const output = document.createElement('output');
        slider.appendChild(output);

        const slot = document.createElement('slot');
        shadow.appendChild(slot);

        if ('value' in this.dataset) {
            this._assigningValue = true;
            this.setTextValue(this.dataset.value);
            this._initialValue = this._formValue;
            this._assigningValue = false;
        }
    }

    disconnectedCallback() {
        const root = this.shadowRoot;
        if (!root) {
            return;
        }
        const input = root.querySelector('input');
        if (input) {
            input.removeEventListener('input', this.onInput.bind(this));
        }
    }

    attributeChangedCallback(name: string, oldValue: string | null | undefined, newValue: string | null | undefined) {
        if (newValue == oldValue) {
            return;
        }

        if (name === 'value') {
            this.setTextValue(newValue);
        } else if (name === 'max') {
            this._max = newValue ? Number.parseFloat(newValue) || this._max : this._max;
            if (this._value > this._max) {
                this.setValue(this._max);
            }
        } else if (name === 'min') {
            this._min = newValue ? Number.parseFloat(newValue) || this._min : this._min;
            if (this._value < this._min) {
                this.setValue(this._min);
            }
        } else if (name === 'readonly') {
            const root = this.shadowRoot;
            if (!root) {
                return;
            }

            const slider = root.querySelector<HTMLElement>('.slider');
            if (slider) {
                slider.inert = (newValue != null) || this.matches(':disabled');
            }
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
                const slider = root.querySelector('.slider');
                if (input && slider) {
                    const label = document.createElement('label');
                    label.htmlFor = input.id;
                    label.innerText = newValue;
                    root.insertBefore(label, slider);
                }
            }
        }
    }

    formDisabledCallback(disabled: boolean) {
        const root = this.shadowRoot;
        if (!root) {
            return;
        }

        const slider = root.querySelector<HTMLElement>('.slider');
        if (slider) {
            slider.inert = disabled || this.hasAttribute('readonly');
        }
    }

    formResetCallback() { this.reset(); }

    formStateRestoreCallback(state: string | File | FormData | null, _mode: 'restore' | 'autocomplete') {
        if (typeof state === 'string') {
            this.value = state;
        } else if (state == null) {
            this.setTextValue(null);
        }
    }

    checkValidity() { return this._internals.checkValidity(); }

    reportValidity() { return this._internals.reportValidity(); }

    reset() { this.setTextValue(this._initialValue); }

    private onInput(event: Event) {
        event.stopPropagation();

        if (event.target instanceof HTMLInputElement) {
            this.setTextValue(event.target.value);
        }
    }

    private setTextValue(value?: string | null) {
        if (this._settingValue) {
            return;
        }

        if (value == null) {
            this.setValue(this._min);
        } else {
            const v = parseFloat(value);
            if (Number.isFinite(v)) {
                this.setValue(v);
            } else {
                this.setValue(this._min);
            }
        }
    }

    private setValue(value: number) {
        if (this._settingValue) {
            return;
        }

        const root = this.shadowRoot;
        if (!root) {
            return;
        }

        const original = this._formValue;

        this._settingValue = true;

        if (Number.isNaN(value) || !Number.isFinite(value)) {
            value = 0;
        }

        value = Math.max(this._min, Math.min(this._max, value));
        this._value = value;

        const barWidth = Math.max(0, Math.min(100, 100 * (value - this._min) / (this._max - this._min)));
        const barWidthStyle = `${trimChar(trimChar(barWidth.toFixed(2), '0'), '.')}%`;

        const filler = root.querySelector('.filler') as HTMLDivElement;
        if (filler) {
            filler.style.width = barWidthStyle;
        }

        let outputValue: string;
        const step = this.querySelector('input')?.step || 'any';
        if (step === 'any') {
            this._formValue = value.toString();
            outputValue = value.toString();
        } else {
            const stepValue = step === 'any' ? 1 : (parseFloat(step) || 1);

            const stepString = stepValue.toString();
            const decimalIndex = stepString.indexOf('.');
            let fractionDigits = 0;
            let precision = 1;
            if (decimalIndex >= 0) {
                fractionDigits = stepString.length - decimalIndex - 1;
                precision = fractionDigits * 10;
            }

            this._formValue = value.toFixed(fractionDigits);

            outputValue = (Math.round(value * precision) / precision).toString();
        }

        const output = root.querySelector('output') as HTMLOutputElement;
        if (output) {
            output.style.left = barWidthStyle;
            output.innerText = outputValue;
        }

        const input = root.querySelector<HTMLInputElement>('input');
        if (input) {
            input.value = this._formValue;
        }

        if (!this._assigningValue
            && this._formValue !== original
            && this._inputDebounce === -1) {
            let debounce = 'inputDebounce' in this.dataset
                ? parseInt(this.dataset.inputDebounce || '')
                : 100;
            if (!Number.isFinite(debounce) || debounce < 100) {
                debounce = 100;
            }
            this._inputDebounce = setTimeout(this.updateInputDebounced.bind(this), debounce);
        }

        this._settingValue = false;
    }

    private updateInputDebounced() {
        clearTimeout(this._inputDebounce);
        this._inputDebounce = -1;

        this.dispatchEvent(TavenemSliderHTMLElement.newValueChangeEvent(this._formValue));
    }
}

function trimChar(str: string, ch: string) {
    let start = 0;
    let end = str.length;

    while (start < end && str[start] === ch) {
        ++start;
    }

    while (end > start && str[end - 1] === ch) {
        --end;
    }

    return (start > 0 || end < str.length)
        ? str.substring(start, end)
        : str;
}