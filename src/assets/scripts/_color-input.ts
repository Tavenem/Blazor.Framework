import { TavenemPopoverHTMLElement } from './_popover'
import { TavenemInputHtmlElement, TavenemPickerHtmlElement } from './_input'
import { randomUUID } from './tavenem-utility'

const halfSelectorSize = 13;
const overlayHeight = 250;
const overlayMargin = 40;
const overlayWidth = 255;

interface HSLA {
    alpha?: number;
    hue: number;
    lightness: number;
    saturation: number;
}

interface RGBA {
    alpha?: number;
    blue: number;
    green: number;
    red: number;
}

export class TavenemColorInputHtmlElement extends TavenemPickerHtmlElement {
    _overlayActive = false;
    _selectorX = 0;
    _selectorY = overlayHeight;

    static get observedAttributes() {
        return ['disabled', 'readonly', 'value'];
    }

    connectedCallback() {
        const shadow = this.attachShadow({ mode: 'open' });

        const style = document.createElement('style');
        style.textContent = `:host {
    position: relative;
}

:host([button]) {
    margin: 0;
}

:host(:not([button])) {
    min-width: 255px;
}

input {
    border-radius: var(--tavenem-border-radius);
    transition: border-color .15s ease-in-out, box-shadow .15s ease-in-out;
}

tf-input {
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

    &[disabled] {
        border-color: var(--tavenem-color-action-disabled);
    }

    input {
        appearance: none;
        background: none;
        border: 0;
        box-shadow: none;
        box-sizing: content-box;
        color: currentColor;
        display: block;
        font: inherit;
        height: 1.1875rem;
        margin: 0;
        min-height: calc(1.25rem + 10px);
        min-width: 0;
        padding: 0;
        position: relative;
        width: 100%;
        -webkit-tap-highlight-color: transparent;

        &:focus {
            outline: 0;
        }

        &:disabled {
            opacity: 1;
        }

        &:-webkit-autofill {
            border-radius: inherit;
        }
    }

    > .expand {
        cursor: pointer;
        transition: .3s cubic-bezier(.25,.8,.5,1),visibility 0s;
    }

    svg {
        min-height: 1.5em;
    }
}

:host(:not(.filled, .outlined, .no-label)) > tf-input {
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

:host(:not(.outlined, [disabled], [readonly])) > tf-input:hover:before {
    border-bottom-color: var(--field-border-hover-color);
}

:host(.filled) > tf-input {
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

    &[disabled] {
        background-color: rgba(0, 0, 0, 0.12);
    }

    input:-webkit-autofill {
        border-top-left-radius: inherit;
        border-top-right-radius: inherit;
    }
}

:host(.filled.no-label) > tf-input {
    padding-top: 11px;
}

:host(.filled) > .field-helpers {
    padding-left: 12px;
    padding-right: 12px;
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

:host(.outlined) > .field-helpers {
    padding-left: 8px;
    padding-right: 8px;
}

:host(.outlined.no-label),
.field > tf-input {
    padding-bottom: 2.5px;
    padding-top: 2.5px;
}

:host([data-popover-open]) > tf-input > .expand {
    transform: rotate(-180deg);
}

:host(:not([disabled], [readonly])):focus-within {
    --field-border-color: var(--field-active-border-color);
    --field-border-hover-color: var(--field-active-border-hover-color);
}

:host(:not([disabled], [readonly])) > tf-input:hover {
    border-color: var(--field-border-hover-color);
}

:host(.dense) > tf-input {
    padding-top: 3px;
    padding-bottom: 3px;
}

:host(.dense.filled) > tf-input {
    padding-bottom: 3px;
    padding-left: 3px;
    padding-right: 3px;
    padding-top: calc(1rem + 4px);

    button, svg {
        margin-top: -4px;
    }
}

:host(.dense.outlined) > tf-input {
    padding-bottom: 5px;
    padding-left: 5px;
    padding-right: 5px;
    padding-top: calc(.5rem + 2.5px);
}

:host(.dense.outlined.no-label) > tf-input {
    padding-bottom: 2.5px;
    padding-top: 2.5px;
}


.field {
    --field-border-color: var(--tavenem-color-border-input);
    --field-border-hover-color: var(--tavenem-color-action);
    --field-color: var(--tavenem-color-text);
    border: 0;
    color: var(--field-color);
    display: flex;
    flex-basis: auto;
    flex-direction: column;
    flex-grow: 1;
    flex-shrink: 1;
    margin: 0;
    margin-bottom: 2px;
    margin-top: 3px;
    max-width: 100%;
    padding: 0;
    position: relative;
    vertical-align: top;

    &:focus-within {
        --field-border-color: var(--field-active-border-color);
        --field-border-hover-color: var(--field-active-border-hover-color);
    }

    > tf-input {
        background-color: var(--tavenem-color-bg-alt);
        border-style: solid;
        border-width: 1px;
        padding-bottom: 2.5px;
        padding-left: 5px;
        padding-right: 5px;
        padding-top: 2.5px;

        &:hover {
            border-color: var(--field-border-hover-color);
        }

        > .expand {
            transform: rotate(-180deg);
        }

        input {
            text-align: center;
        }
    }

    > .field-helpers {
        padding-left: 8px;
        padding-right: 8px;
    }
}

input::placeholder {
    color: currentColor;
    opacity: 0.42;
    transition: opacity 200ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
}

:host([disabled]) > tf-input,
:host([readonly]) > tf-input,
:host([disabled]) .field > tf-input,
:host([readonly]) .field > tf-input {
    cursor: default;

    > svg {
        cursor: default;
        pointer-events: none;
    }

    input {
        opacity: 1;
    }
}

:host([disabled])
:host([disabled]) .field {
    --field-color: var(--tavenem-color-text-disabled);
    --field-label-color: var(--tavenem-color-text-disabled);

    > tf-input {
        border-color: var(--tavenem-color-action-disabled);
        color: var(--tavenem-color-text-disabled);
    }
}

:host([disabled].filled) > tf-input {
    background-color: rgba(0, 0, 0, 0.12);
}

:host([disabled].outlined) > tf-input {
    border-color: var(--tavenem-color-action-disabled);
}

.field-helpers {
    color: var(--field-label-color);
    display: flex;
    font-size: 0.75rem;
    font-weight: var(--tavenem-font-weight);
    line-height: 1.66;
    margin-top: 3px;
    overflow: hidden;
    padding-left: 8px;
    padding-right: 8px;
    text-align: start;
}

.help-text {
    margin-left: auto;
    margin-right: auto;
}

.button-swatch {
    width: 1.5em;
}

:host(:not([value])),
:host([value=""]) {
    .swatch-container {
        display: none;
    }

    .swatch-fill {
        background: none;
    }
}

svg:not(.color-selector) {
    fill: currentColor;
    height: 1em;
    width: auto;
}

.expand {
    cursor: pointer;
    height: 1.5em;
    transition: .3s cubic-bezier(.25,.8,.5,1);
}

:host(.open),
:host([data-popover-open]) {
    .expand {
        transform: rotate(-180deg);
    }
}

.inputs-container {
    align-items: flex-start;
    display: flex;
    flex: 1 1 auto;
    gap: .25rem;
    margin-top: .25rem;
}

:host([data-input-mode="hex"]) .field.alpha {
    display: none;
}

:host(:not([data-input-mode="hex"])) .field.hex {
    display: none;
}

:host(:not([data-input-mode="hsl"])) .field.hsl {
    display: none;
}

:host(:not([data-input-mode="rgb"])) .field.rgb {
    display: none;
}

tf-slider {
    --output-display: none;
    --output-opacity: 0;
    --thumb-color: var(--tavenem-color-action);
    --thumb-label-color: var(--tavenem-color-default-text);
    --thumb-label-color-bg: var(--tavenem-color-default);
    --thumb-shadow-color: rgba(0,0,0,.24);
    --thumb-shadow: 0 0 0 2px var(--thumb-shadow-color);
    --track-color: rgba(var(--tavenem-color-action-rgb), .3);
    border-radius: var(--tavenem-border-radius);
    color: var(--tavenem-color-text);
    cursor: text;
    display: inline-block;
    line-height: 0;
    padding: 0;
    position: relative;
    user-select: none;
    width: 100%;

    input {
        -webkit-appearance: none;
        -moz-appearance: none;
        background-color: transparent;
        cursor: pointer;
        display: inline-block;
        height: auto;
        margin: 0;
        position: relative;
        width: 100%;

        &:focus {
            outline: none;
        }
    }
}

tf-slider input::-webkit-slider-runnable-track {
    height: 0;
    margin: 8px 0;
    width: 100%;
}

tf-slider input::-moz-range-track {
    height: 0;
    margin: 8px 0;
    width: 100%;
}

tf-slider input::-webkit-slider-thumb {
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
tf-slider input::-webkit-slider-thumb:hover {
    box-shadow: var(--thumb-shadow);
}

tf-slider input::-moz-range-thumb {
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
tf-slider input::-moz-range-thumb:hover {
    box-shadow: var(--thumb-shadow);
}

tf-slider input:active::-webkit-slider-thumb {
    box-shadow: var(--thumb-shadow);
}
tf-slider input:active::-moz-range-thumb {
    box-shadow: var(--thumb-shadow);
}
tf-slider input:focus-visible::-webkit-slider-thumb {
    box-shadow: var(--thumb-shadow);
}
tf-slider input:focus-visible::-moz-range-thumb {
    box-shadow: var(--thumb-shadow);
}

:host([disabled]) tf-slider input {
    &, &:active, &:focus-visible {
        --thumb-color: var(--tavenem-color-action-disabled);
        --track-color: var(--tavenem-color-action-disabled-bg);
        cursor: default;
        opacity: 0.38;
    }
}

:host([readonly]) tf-slider input {
    &, &:active, &:focus-visible {
        cursor: default;
    }
}

:host([disabled]) tf-slider input::-webkit-slider-thumb {
    box-shadow: none;
    cursor: default;
}
:host([disabled]) tf-slider input::-moz-range-thumb {
    box-shadow: none;
    cursor: default;
}
:host([disabled]) tf-slider input:active::-webkit-slider-thumb {
    box-shadow: none;
    cursor: default;
}
:host([disabled]) tf-slider input:active::-moz-range-thumb {
    box-shadow: none;
    cursor: default;
}
:host([disabled]) tf-slider input:focus-visible::-webkit-slider-thumb {
    box-shadow: none;
    cursor: default;
}
:host([disabled]) tf-slider input:focus-visible::-moz-range-thumb {
    box-shadow: none;
    cursor: default;
}

:host([readonly]) tf-slider input::-webkit-slider-thumb {
    box-shadow: none;
    cursor: default;
}
:host([readonly]) tf-slider input::-moz-range-thumb {
    box-shadow: none;
    cursor: default;
}
:host([readonly]) tf-slider input:active::-webkit-slider-thumb {
    box-shadow: none;
    cursor: default;
}
:host([readonly]) tf-slider input:active::-moz-range-thumb {
    box-shadow: none;
    cursor: default;
}
:host([readonly]) tf-slider input:focus-visible::-webkit-slider-thumb {
    box-shadow: none;
    cursor: default;
}
:host([readonly]) tf-slider input:focus-visible::-moz-range-thumb {
    box-shadow: none;
    cursor: default;
}

button {
    align-items: center;
    background-color: transparent;
    border-radius: 9999px;
    border-style: none;
    box-sizing: border-box;
    color: inherit;
    cursor: pointer;
    display: inline-flex;
    flex: 0 0 auto;
    font-size: 1.5rem;
    font-weight: var(--tavenem-font-weight-semibold);
    gap: .25rem;
    justify-content: center;
    line-height: 1;
    margin: 0;
    min-width: calc(var(--tavenem-font-size-button) + 12px);
    outline: 0;
    overflow: hidden;
    padding: 6px;
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
}

button::-moz-focus-inner {
    border-style: none;
}

.picker-btn {
    align-self: center;
}

:host(.invalid) > .picker-btn {
    border-color: var(--tavenem-color-error);
}

.picker-btn:has(.swatch-fill) {
    background-color: var(--tavenem-color-default);
    border-radius: var(--tavenem-border-radius);
    min-width: calc(1.5rem + 12px);

    &:hover,
    &:focus-visible {
        background-color: var(--tavenem-color-default-darken);
    }
}

.dialog-buttons {
    display: flex;
    justify-content: flex-end;
}

.dialog-buttons button {
    border-radius: var(--tavenem-border-radius);
    font-family: var(--tavenem-font-family);
    font-size: var(--tavenem-font-size-button);
    font-weight: var(--tavenem-font-weight-semibold);
    line-height: var(--tavenem-lineheight-button);
    min-width: 0;
    padding: 6px 16px;

    &:after {
        transform: scale(10,10);
    }
}

.color-clear {
    display: none;
    margin-inline-end: .5rem;
}

:host(.clearable) .color-clear {
    display: inline-flex;
}

:host([disabled]),
:host([readonly]),
:host([required]),
:host([empty]) {
    .color-clear {
        display: none;
    }
}

.color-picker {
    height: 250px;
    position: relative;
    width: 255px;
}

.color-overlay {
    background: linear-gradient(hsl(0 0 100), hsl(0 0 100 / 0) 50%, hsl(0 0 0 / 0) 50%, hsl(0 0 0)), linear-gradient(to right, hsl(0 0 50), hsl(0 0 50 / 0));
    height: 100%;
    width: 100%;

    > div {
        height: calc(100% + 40px + 1rem);
        left: -40px;
        position: absolute;
        top: -40px;
        width: calc(100% + 80px);

        > div {
            height: 250px;
            left: 40px;
            overflow: hidden;
            pointer-events: none;
            position: absolute;
            top: 40px;
            width: 255px;
        }
    }
}

.color-selector {
    left: -13px;
    position: absolute;
    top: -13px;
}

.color-controls {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    padding: .5rem;
    width: 255px;
}

.sliders-container {
    align-items: center;
    display: flex;
}

.color-sliders {
    display: flex;
    flex: 1 0 auto;
    flex-direction: column;
    gap: .5rem;
    margin-left: 1rem;

    input.hue {
        background: linear-gradient(90deg, #f00, #ff0 16.66%, #0f0 33.33%, #0ff 50%, #00f 66.66%, #f0f 83.33%, #f00);
    }

    tf-slider.alpha {
        background-image: linear-gradient(45deg, #808080 25%, transparent 25%), linear-gradient(-45deg, #808080 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #808080 75%), linear-gradient(-45deg, transparent 75%, #808080 75%);
        background-position: 0 0, 0 5px, 5px -5px, -5px 0;
        background-size: 10px 10px;
    }

    input.alpha {
        background-image: var(--alpha-background);
    }
}

.color-sliders input::-webkit-slider-runnable-track {
    background-color: initial;
}
.color-sliders input::-moz-range-track {
    background-color: initial;
}

.color-picker-swatch {
    background-image: linear-gradient(45deg, #808080 25%, transparent 25%),
                      linear-gradient(-45deg, #808080 25%, transparent 25%),
                      linear-gradient(45deg, transparent 75%, #808080 75%),
                      linear-gradient(-45deg, transparent 75%, #808080 75%);
    background-size: 16px 16px;
    background-position: 0 0, 0 8px, 8px -8px, -8px 0px;
    border-radius: var(--tavenem-border-radius);
    box-shadow: 0 0 6px rgba(127, 130, 134, 0.18);
    height: 2.375rem;
    transition: background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,border 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
    width: 2.375rem;

    &:hover {
        box-shadow: 0px 3px 1px -2px rgba(0,0,0,0.2),0px 2px 2px 0px rgba(0,0,0,0.14),0px 1px 5px 0px rgba(0,0,0,0.12);
    }

    &.small {
        background: none;
        box-shadow: none;
        flex-shrink: 0;
        height: 1.5rem;
        width: 1.5rem;
    }
}

.swatch-container:has(.swatch-fill.transparent) {
    display: none;
}

.swatch-fill {
    align-items: center;
    border-radius: inherit;
    display: flex;
    height: 100%;
    justify-content: center;
    width: 100%;

    svg {
        height: 2rem;
    }
}
`;
        shadow.appendChild(style);

        const hasAlpha = this.hasAttribute('alpha');
        const value = this.getAttribute('value')
            || (hasAlpha ? '#00000000' : '#000000');

        const colors = TavenemColorInputHtmlElement.hexToHsla(value);
        const hsla = colors
            ? colors.hsla
            : {
                hue: 0,
                saturation: 100,
                lightness: 50,
                alpha: hasAlpha ? 0 : undefined,
            };
        const rgba = colors
            ? colors.rgba
            : {
                red: 0,
                green: 0,
                blue: 0,
                alpha: hasAlpha ? 0 : undefined,
            };
        const hex = TavenemColorInputHtmlElement.hslaToHex(hsla, hasAlpha);
        const hslaStyle = this.hasAttribute('disabled')
            ? `hsl(${hsla.hue} ${Math.round(Math.max(10, hsla.saturation / 5))} ${hsla.lightness} / ${(hasAlpha ? (hsla.alpha || 0) : 1)})`
            : `hsl(${hsla.hue} ${hsla.saturation} ${hsla.lightness} / ${(hasAlpha ? (hsla.alpha || 0) : 1)})`;

        this._selectorX = hsla.saturation / 100 * overlayWidth;
        this._selectorY = (1 - (hsla.lightness / 100)) * overlayHeight;

        let anchorId;
        let anchorOrigin;
        let input: HTMLInputElement | TavenemInputHtmlElement;
        if (this.hasAttribute('button')) {
            anchorId = this.dataset.inputId || (window.isSecureContext ? crypto.randomUUID() : randomUUID());
            anchorOrigin = 'anchor-center-center';

            const button = document.createElement('button');
            button.type = 'button';
            button.id = anchorId;
            button.className = this.dataset.inputClass || '';
            button.classList.add('picker-btn', 'btn');
            button.style.cssText = this.dataset.inputStyle || '';
            button.disabled = this.hasAttribute('disabled')
                || this.hasAttribute('readonly');
            shadow.appendChild(button);

            const slot = document.createElement('slot');
            button.appendChild(slot);

            input = document.createElement('input');
            input.classList.add('picker-value');
            input.hidden = true;
            input.readOnly = true;
            if (this.hasAttribute('name')) {
                input.name = this.getAttribute('name') || '';
            }
            input.disabled = this.hasAttribute('disabled');
            if (this.hasAttribute('value')) {
                input.value = hex || '';
            }

            shadow.appendChild(input);

            if ('showSwatch' in this.dataset) {
                const swatch = document.createElement('span');
                swatch.classList.add('swatch-fill');
                swatch.textContent = '\xa0';
                if (input.value && input.value.length) {
                    swatch.style.background = hslaStyle;
                }
                button.appendChild(swatch);
            } else {
                const buttonIcon = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
                button.appendChild(buttonIcon);
                buttonIcon.outerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="48" viewBox="0 -960 960 960" width="48"><path d="M480-80q-82 0-155-31.5t-127.5-86Q143-252 111.5-325T80-480q0-84 32-157t87.5-127q55.5-54 130-85T489-880q79 0 150 26.5T763.5-780q53.5 47 85 111.5T880-527q0 108-63 170.5T650-294h-75q-18 0-31 14t-13 31q0 20 14.5 38t14.5 43q0 26-24.5 57T480-80ZM247-454q20 0 35-15t15-35q0-20-15-35t-35-15q-20 0-35 15t-15 35q0 20 15 35t35 15Zm126-170q20 0 35-15t15-35q0-20-15-35t-35-15q-20 0-35 15t-15 35q0 20 15 35t35 15Zm214 0q20 0 35-15t15-35q0-20-15-35t-35-15q-20 0-35 15t-15 35q0 20 15 35t35 15Zm131 170q20 0 35-15t15-35q0-20-15-35t-35-15q-20 0-35 15t-15 35q0 20 15 35t35 15Z"/></svg>`;
            }
        } else {
            anchorId = (window.isSecureContext ? crypto.randomUUID() : randomUUID());
            anchorOrigin = 'anchor-bottom-left';

            input = document.createElement('tf-input') as TavenemInputHtmlElement;
            input.id = anchorId;
            if (!this.hasAttribute('inline')) {
                input.autofocus = this.hasAttribute('autofocus');
            }
            input.classList.add('input', 'picker-value');
            if (this.classList.contains('clearable')) {
                input.classList.add('clearable');
            }
            if (this.hasAttribute('disabled')) {
                input.setAttribute('disabled', '');
            }
            if (this.hasAttribute('name')) {
                input.setAttribute('name', this.getAttribute('name') || '');
            }
            if (this.hasAttribute('placeholder')) {
                input.setAttribute('placeholder', this.getAttribute('placeholder') || '');
            }
            input.setAttribute('readonly', '');
            if (this.hasAttribute('required')) {
                input.setAttribute('required', '');
            }
            input.setAttribute('size', "1");
            if (this.hasAttribute('inline')) {
                input.style.display = 'none';
            }
            if (this.hasAttribute('value')) {
                input.value = hex || '';
                const colorName = TavenemColorInputHtmlElement.rgbaToColorName(rgba);
                if (colorName) {
                    input.display = colorName;
                }
            }
            input.dataset.inputId = this.dataset.inputId;
            input.dataset.inputClass = this.dataset.inputClass;
            input.dataset.inputStyle = this.dataset.inputStyle;
            shadow.appendChild(input);

            const swatchContainer = document.createElement('div');
            swatchContainer.classList.add('swatch-container', 'color-picker-swatch', 'small');
            swatchContainer.slot = 'prefix';
            input.appendChild(swatchContainer);

            const swatch = document.createElement('div');
            swatch.classList.add('swatch-fill');
            if (this.hasAttribute('value')) {
                swatch.style.background = hslaStyle;
                if (hasAlpha && !hsla.alpha) {
                    swatch.classList.add('transparent');
                }
            } else {
                swatch.classList.add('transparent');
            }
            swatchContainer.appendChild(swatch);

            const expand = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
            input.appendChild(expand);
            expand.outerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="48" viewBox="0 -960 960 960" width="48"><path d="M480-80q-82 0-155-31.5t-127.5-86Q143-252 111.5-325T80-480q0-84 32-157t87.5-127q55.5-54 130-85T489-880q79 0 150 26.5T763.5-780q53.5 47 85 111.5T880-527q0 108-63 170.5T650-294h-75q-18 0-31 14t-13 31q0 20 14.5 38t14.5 43q0 26-24.5 57T480-80ZM247-454q20 0 35-15t15-35q0-20-15-35t-35-15q-20 0-35 15t-15 35q0 20 15 35t35 15Zm126-170q20 0 35-15t15-35q0-20-15-35t-35-15q-20 0-35 15t-15 35q0 20 15 35t35 15Zm214 0q20 0 35-15t15-35q0-20-15-35t-35-15q-20 0-35 15t-15 35q0 20 15 35t35 15Zm131 170q20 0 35-15t15-35q0-20-15-35t-35-15q-20 0-35 15t-15 35q0 20 15 35t35 15Z"/></svg>`;

            const slot = document.createElement('slot');
            shadow.appendChild(slot);
        }

        let controlContainer: Node;
        if (this.hasAttribute('inline')) {
            controlContainer = shadow;
        } else {
            const popover = document.createElement('tf-popover') as TavenemPopoverHTMLElement;
            popover.classList.add('contained-popover', 'filled', 'top-left', 'flip-onopen', anchorOrigin);
            popover.dataset.anchorId = anchorId;
            shadow.appendChild(popover);
            controlContainer = popover;
        }

        const colorPicker = document.createElement('div');
        colorPicker.classList.add('color-picker');
        controlContainer.appendChild(colorPicker);

        const overlay = document.createElement('div');
        overlay.classList.add('color-overlay');
        overlay.style.backgroundColor = this.hasAttribute('disabled')
            ? `hsl(${hsla.hue} 20 50)`
            : `hsl(${hsla.hue} 100 50)`;
        colorPicker.appendChild(overlay);

        const overlayDetector = document.createElement('div');
        overlayDetector.classList.add('color-overlay-detector');
        overlay.appendChild(overlayDetector);
        overlayDetector.addEventListener('mousedown', this.onOverlayMouseDown.bind(this));
        overlayDetector.addEventListener('mousemove', this.onOverlayInteract.bind(this));
        overlayDetector.addEventListener('mouseup', this.onOverlayMouseUp.bind(this));

        const selectorContainer = document.createElement('div');
        overlayDetector.appendChild(selectorContainer);

        const selector = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
        selectorContainer.appendChild(selector);
        selector.outerHTML = `<svg class="color-selector" xmlns="http://www.w3.org/2000/svg" height="26" width="26">
    <defs>
        <filter id="color-selector-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="1" />
            <feOffset dx="0" dy="5" result="offsetblur" />
            <feOffset dx="0" dy="-5" result="offsetblur" />
            <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
    </defs>
    <circle r="10" cx="13" cy="13" stroke="white" stroke-width="1" fill="transparent" style="filter: url(#color-selector-shadow)" />
    <circle r="11" cx="13" cy="13" stroke="white" stroke-width="1.5" fill="transparent" />
</svg>`;
        selector.style.transform = `translate(${this._selectorX}px, ${this._selectorY}px)`;
        selector.addEventListener('click', this.onSelectorClick.bind(this));

        const colorControls = document.createElement('div');
        colorControls.classList.add('color-controls');
        controlContainer.appendChild(colorControls);

        const slidersContainer = document.createElement('div');
        slidersContainer.classList.add('sliders-container');
        colorControls.appendChild(slidersContainer);

        const colorPickerSwatch = document.createElement('div');
        colorPickerSwatch.classList.add('color-picker-swatch');
        slidersContainer.appendChild(colorPickerSwatch);

        const swatchFill = document.createElement('div');
        swatchFill.classList.add('swatch-fill', 'dropper');
        colorPickerSwatch.appendChild(swatchFill);

        if (window.isSecureContext && window.EyeDropper) {
            swatchFill.addEventListener('click', this.onDropperClick.bind(this));

            const dropperIcon = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
            swatchFill.appendChild(dropperIcon);
            dropperIcon.outerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="48" viewBox="0 -960 960 960" width="48"><path d="M120-120v-168l377-377-72-72 41-41 92 92 142-142q5-5 11-8t12-3q6 0 12 3t12 8l81 81q5 6 8 12t3 12q0 6-3 12t-8 11L686-558l92 92-41 41-72-72-377 377H120Zm60-60h87l355-355-87-87-355 355v87Z"/></svg>`;
        }

        const colorSliders = document.createElement('div');
        colorSliders.classList.add('color-sliders');
        slidersContainer.appendChild(colorSliders);

        const hueSlider = document.createElement('tf-slider');
        hueSlider.classList.add('hue');
        hueSlider.dataset.value = hsla.hue.toString();
        colorSliders.appendChild(hueSlider);

        const hueSliderInput = document.createElement('input');
        hueSliderInput.classList.add('hue');
        hueSliderInput.disabled = this.hasAttribute('disabled')
            || this.hasAttribute('readonly');
        hueSliderInput.max = '359';
        hueSliderInput.min = '0';
        hueSliderInput.step = '1';
        hueSliderInput.type = 'range';
        hueSliderInput.value = hsla.hue.toString();
        if (this.hasAttribute('inline')) {
            hueSliderInput.autofocus = this.hasAttribute('autofocus');
        }
        hueSlider.appendChild(hueSliderInput);
        hueSliderInput.addEventListener('input', this.onHueInput.bind(this));

        if (hasAlpha) {
            const alphaSlider = document.createElement('tf-slider');
            alphaSlider.classList.add('alpha');
            alphaSlider.dataset.value = '1';
            colorSliders.appendChild(alphaSlider);

            const alphaSliderInput = document.createElement('input');
            alphaSliderInput.classList.add('alpha');
            alphaSliderInput.disabled = this.hasAttribute('disabled')
                || this.hasAttribute('readonly');
            alphaSliderInput.max = '1';
            alphaSliderInput.min = '0';
            alphaSliderInput.step = 'any';
            alphaSliderInput.style.setProperty('--alpha-background', 'linear-gradient(to right, transparent, hsl(0 100 50))');
            alphaSliderInput.type = 'range';
            alphaSliderInput.value = (hsla.alpha || 0).toString();
            alphaSlider.appendChild(alphaSliderInput);
            alphaSliderInput.addEventListener('input', this.onAlphaInput.bind(this));
        }

        const inputsContainer = document.createElement('div');
        inputsContainer.classList.add('inputs-container');
        colorControls.appendChild(inputsContainer);

        const hexInputField = document.createElement('div');
        hexInputField.classList.add('field', 'hex');
        inputsContainer.appendChild(hexInputField);

        const hexInput = document.createElement('tf-input') as TavenemInputHtmlElement;
        hexInput.classList.add('input', 'hex');
        hexInput.dataset.inputStyle = 'text-align:center';
        if (this.hasAttribute('disabled')) {
            hexInput.setAttribute('disabled', '');
        }
        if (this.hasAttribute('readonly')) {
            hexInput.setAttribute('readonly', '');
        }
        hexInput.setAttribute('size', '1');
        hexInput.setAttribute('type', 'text');
        hexInputField.appendChild(hexInput);
        hexInput.value = value;
        hexInput.addEventListener('valuechange', this.onHexValueChange.bind(this));

        const hexInputFieldHelpers = document.createElement('div');
        hexInputFieldHelpers.classList.add('field-helpers');
        hexInputField.appendChild(hexInputFieldHelpers);

        const hexInputHelpText = document.createElement('div');
        hexInputFieldHelpers.classList.add('help-text');
        hexInputFieldHelpers.textContent = "HEX";
        hexInputFieldHelpers.appendChild(hexInputHelpText);

        const hueInputField = document.createElement('div');
        hueInputField.classList.add('field', 'hue', 'hsl');
        inputsContainer.appendChild(hueInputField);

        const hueInput = document.createElement('tf-input') as TavenemInputHtmlElement;
        hueInput.classList.add('input', 'hue', 'hsl');
        hueInput.dataset.inputStyle = 'text-align:center';
        if (this.hasAttribute('disabled')) {
            hueInput.setAttribute('disabled', '');
        }
        if (this.hasAttribute('readonly')) {
            hueInput.setAttribute('readonly', '');
        }
        hueInput.setAttribute('inputmode', 'numeric');
        hueInput.setAttribute('max', '359');
        hueInput.setAttribute('min', '0');
        hueInput.setAttribute('size', '1');
        hueInput.setAttribute('step', '1');
        hueInputField.appendChild(hueInput);
        hueInput.value = hsla.hue.toString();
        hueInput.addEventListener('valueinput', this.onHueValueInput.bind(this));

        const hueInputFieldHelpers = document.createElement('div');
        hueInputFieldHelpers.classList.add('field-helpers');
        hueInputField.appendChild(hueInputFieldHelpers);

        const hueInputHelpText = document.createElement('div');
        hueInputFieldHelpers.classList.add('help-text');
        hueInputFieldHelpers.textContent = "H";
        hueInputFieldHelpers.appendChild(hueInputHelpText);

        const saturationInputField = document.createElement('div');
        saturationInputField.classList.add('field', 'saturation', 'hsl');
        inputsContainer.appendChild(saturationInputField);

        const saturationInput = document.createElement('tf-input') as TavenemInputHtmlElement;
        saturationInput.classList.add('input', 'saturation', 'hsl');
        saturationInput.dataset.inputStyle = 'text-align:center';
        if (this.hasAttribute('disabled')) {
            saturationInput.setAttribute('disabled', '');
        }
        if (this.hasAttribute('readonly')) {
            saturationInput.setAttribute('readonly', '');
        }
        saturationInput.setAttribute('inputmode', 'numeric');
        saturationInput.setAttribute('max', '100');
        saturationInput.setAttribute('min', '0');
        saturationInput.setAttribute('size', '1');
        saturationInput.setAttribute('step', '1');
        saturationInputField.appendChild(saturationInput);
        saturationInput.value = hsla.saturation.toString();
        saturationInput.addEventListener('valueinput', this.onSaturationValueInput.bind(this));

        const saturationInputFieldHelpers = document.createElement('div');
        saturationInputFieldHelpers.classList.add('field-helpers');
        saturationInputField.appendChild(saturationInputFieldHelpers);

        const saturationInputHelpText = document.createElement('div');
        saturationInputFieldHelpers.classList.add('help-text');
        saturationInputFieldHelpers.textContent = "S";
        saturationInputFieldHelpers.appendChild(saturationInputHelpText);

        const lightnessInputField = document.createElement('div');
        lightnessInputField.classList.add('field', 'lightness', 'hsl');
        inputsContainer.appendChild(lightnessInputField);

        const lightnessInput = document.createElement('tf-input') as TavenemInputHtmlElement;
        lightnessInput.classList.add('input', 'lightness', 'hsl');
        lightnessInput.dataset.inputStyle = 'text-align:center';
        if (this.hasAttribute('disabled')) {
            lightnessInput.setAttribute('disabled', '');
        }
        if (this.hasAttribute('readonly')) {
            lightnessInput.setAttribute('readonly', '');
        }
        lightnessInput.setAttribute('inputmode', 'numeric');
        lightnessInput.setAttribute('max', '100');
        lightnessInput.setAttribute('min', '0');
        lightnessInput.setAttribute('size', '1');
        lightnessInput.setAttribute('step', '1');
        lightnessInputField.appendChild(lightnessInput);
        lightnessInput.value = hsla.lightness.toString();
        lightnessInput.addEventListener('valueinput', this.onLightnessValueInput.bind(this));

        const lightnessInputFieldHelpers = document.createElement('div');
        lightnessInputFieldHelpers.classList.add('field-helpers');
        lightnessInputField.appendChild(lightnessInputFieldHelpers);

        const lightnessInputHelpText = document.createElement('div');
        lightnessInputFieldHelpers.classList.add('help-text');
        lightnessInputFieldHelpers.textContent = "L";
        lightnessInputFieldHelpers.appendChild(lightnessInputHelpText);

        const redInputField = document.createElement('div');
        redInputField.classList.add('field', 'red', 'rgb');
        inputsContainer.appendChild(redInputField);

        const redInput = document.createElement('tf-input') as TavenemInputHtmlElement;
        redInput.classList.add('input', 'red', 'rgb');
        redInput.dataset.inputStyle = 'text-align:center';
        if (this.hasAttribute('disabled')) {
            redInput.setAttribute('disabled', '');
        }
        if (this.hasAttribute('readonly')) {
            redInput.setAttribute('readonly', '');
        }
        redInput.setAttribute('inputmode', 'numeric');
        redInput.setAttribute('max', '255');
        redInput.setAttribute('min', '0');
        redInput.setAttribute('size', '1');
        redInput.setAttribute('step', '1');
        redInputField.appendChild(redInput);
        redInput.value = rgba.red.toString();
        redInput.addEventListener('valueinput', this.onRedValueInput.bind(this));

        const redInputFieldHelpers = document.createElement('div');
        redInputFieldHelpers.classList.add('field-helpers');
        redInputField.appendChild(redInputFieldHelpers);

        const redInputHelpText = document.createElement('div');
        redInputFieldHelpers.classList.add('help-text');
        redInputFieldHelpers.textContent = "R";
        redInputFieldHelpers.appendChild(redInputHelpText);

        const greenInputField = document.createElement('div');
        greenInputField.classList.add('field', 'green', 'rgb');
        inputsContainer.appendChild(greenInputField);

        const greenInput = document.createElement('tf-input') as TavenemInputHtmlElement;
        greenInput.classList.add('input', 'green', 'rgb');
        greenInput.dataset.inputStyle = 'text-align:center';
        if (this.hasAttribute('disabled')) {
            greenInput.setAttribute('disabled', '');
        }
        if (this.hasAttribute('readonly')) {
            greenInput.setAttribute('readonly', '');
        }
        greenInput.setAttribute('inputmode', 'numeric');
        greenInput.setAttribute('max', '100');
        greenInput.setAttribute('min', '0');
        greenInput.setAttribute('size', '1');
        greenInput.setAttribute('step', '1');
        greenInputField.appendChild(greenInput);
        greenInput.value = rgba.green.toString();
        greenInput.addEventListener('valueinput', this.onGreenValueInput.bind(this));

        const greenInputFieldHelpers = document.createElement('div');
        greenInputFieldHelpers.classList.add('field-helpers');
        greenInputField.appendChild(greenInputFieldHelpers);

        const greenInputHelpText = document.createElement('div');
        greenInputFieldHelpers.classList.add('help-text');
        greenInputFieldHelpers.textContent = "G";
        greenInputFieldHelpers.appendChild(greenInputHelpText);

        const blueInputField = document.createElement('div');
        blueInputField.classList.add('field', 'blue', 'rgb');
        inputsContainer.appendChild(blueInputField);

        const blueInput = document.createElement('tf-input') as TavenemInputHtmlElement;
        blueInput.classList.add('input', 'blue', 'rgb');
        blueInput.dataset.inputStyle = 'text-align:center';
        if (this.hasAttribute('disabled')) {
            blueInput.setAttribute('disabled', '');
        }
        if (this.hasAttribute('readonly')) {
            blueInput.setAttribute('readonly', '');
        }
        blueInput.setAttribute('inputmode', 'numeric');
        blueInput.setAttribute('max', '100');
        blueInput.setAttribute('min', '0');
        blueInput.setAttribute('size', '1');
        blueInput.setAttribute('step', '1');
        blueInputField.appendChild(blueInput);
        blueInput.value = rgba.blue.toString();
        blueInput.addEventListener('valueinput', this.onBlueValueInput.bind(this));

        const blueInputFieldHelpers = document.createElement('div');
        blueInputFieldHelpers.classList.add('field-helpers');
        blueInputField.appendChild(blueInputFieldHelpers);

        const blueInputHelpText = document.createElement('div');
        blueInputFieldHelpers.classList.add('help-text');
        blueInputFieldHelpers.textContent = "G";
        blueInputFieldHelpers.appendChild(blueInputHelpText);

        if (hasAlpha) {
            const alphaInputField = document.createElement('div');
            alphaInputField.classList.add('field', 'alpha');
            inputsContainer.appendChild(alphaInputField);

            const alphaInput = document.createElement('tf-input') as TavenemInputHtmlElement;
            alphaInput.classList.add('input', 'alpha');
            alphaInput.dataset.inputStyle = 'text-align:center';
            if (this.hasAttribute('disabled')) {
                alphaInput.setAttribute('disabled', '');
            }
            if (this.hasAttribute('readonly')) {
                alphaInput.setAttribute('readonly', '');
            }
            alphaInput.setAttribute('inputmode', 'numeric');
            alphaInput.setAttribute('max', '1');
            alphaInput.setAttribute('min', '0');
            alphaInput.setAttribute('size', '1');
            alphaInput.setAttribute('step', '0.01');
            alphaInputField.appendChild(alphaInput);
            alphaInput.value = (hsla.alpha || 0).toString();
            alphaInput.addEventListener('valueinput', this.onAlphaValueInput.bind(this));

            const alphaInputFieldHelpers = document.createElement('div');
            alphaInputFieldHelpers.classList.add('field-helpers');
            alphaInputField.appendChild(alphaInputFieldHelpers);

            const alphaInputHelpText = document.createElement('div');
            alphaInputFieldHelpers.classList.add('help-text');
            alphaInputFieldHelpers.textContent = "A";
            alphaInputFieldHelpers.appendChild(alphaInputHelpText);
        }

        const modeButton = document.createElement('button');
        modeButton.classList.add('mode-button');
        inputsContainer.appendChild(modeButton);
        modeButton.addEventListener('click', this.onCycleMode.bind(this));

        const modeButtonIcon = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
        modeButton.appendChild(modeButtonIcon);
        modeButtonIcon.outerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="48" viewBox="0 -960 960 960" width="48"><path d="M323-450v-316L202-645l-42-42 193-193 193 193-42 42-121-121v316h-60ZM607-80 414-273l42-42 121 121v-316h60v316l121-121 42 42L607-80Z"/></svg>`;

        if (this.hasAttribute('button')) {
            const buttonsDiv = document.createElement('div');
            buttonsDiv.classList.add('dialog-buttons');
            controlContainer.appendChild(buttonsDiv);

            const clearButton = document.createElement('button');
            clearButton.classList.add('color-clear');
            clearButton.textContent = "Clear";
            clearButton.disabled = this.hasAttribute('disabled')
                || this.hasAttribute('readonly');
            buttonsDiv.appendChild(clearButton);
            clearButton.addEventListener('click', this.onClearButton.bind(this));

            const okButton = document.createElement('button');
            okButton.classList.add('ok');
            okButton.textContent = "Ok";
            buttonsDiv.appendChild(okButton);
            okButton.addEventListener('click', this.onOk.bind(this));
        }

        shadow.addEventListener('focuslost', this.onOuterPopoverFocusLost.bind(this));
        shadow.addEventListener('mousedown', this.onMouseDown.bind(this));
        shadow.addEventListener('mouseup', this.onOuterMouseUp.bind(this));
        shadow.addEventListener('keyup', this.onOuterKeyUp.bind(this));
        shadow.addEventListener('valueinput', this.onOuterValueInput.bind(this));
        document.addEventListener('mousedown', this.onDocMouseDown.bind(this));
    }

    disconnectedCallback() {
        clearTimeout(this._hideTimer);
        document.removeEventListener('mousedown', this.onDocMouseDown.bind(this));

        const root = this.shadowRoot;
        if (!root) {
            return;
        }

        root.removeEventListener('focuslost', this.onOuterPopoverFocusLost.bind(this));
        root.removeEventListener('mousedown', this.onMouseDown.bind(this));
        root.removeEventListener('mouseup', this.onOuterMouseUp.bind(this));
        root.removeEventListener('keyup', this.onOuterKeyUp.bind(this));
        root.removeEventListener('valueinput', this.onOuterValueInput.bind(this));

        const overlayDetector = root.querySelector('color-overlay-detector') as HTMLElement;
        if (overlayDetector) {
            overlayDetector.removeEventListener('mousedown', this.onOverlayMouseDown.bind(this));
            overlayDetector.removeEventListener('mousemove', this.onOverlayInteract.bind(this));
            overlayDetector.removeEventListener('mouseup', this.onOverlayMouseUp.bind(this));
        }
        const selector = root.querySelector('.color-selector') as SVGSVGElement;
        if (selector) {
            selector.removeEventListener('click', this.onSelectorClick.bind(this));
        }
        const hueSlider = root.querySelector('input.hue');
        if (hueSlider) {
            hueSlider.removeEventListener('input', this.onHueInput.bind(this));
        }
        const alphaSlider = root.querySelector('input.alpha');
        if (alphaSlider) {
            alphaSlider.removeEventListener('input', this.onAlphaInput.bind(this));
        }
        if (window.isSecureContext && window.EyeDropper) {
            const dropper = root.querySelector('.dropper');
            if (dropper) {
                dropper.removeEventListener('click', this.onDropperClick.bind(this));
            }
        }
        const hexInput = root.querySelector('tf-input.hex') as HTMLElement;
        if (hexInput) {
            hexInput.removeEventListener('valuechange', this.onHexValueChange.bind(this));
        }
        const hueInput = root.querySelector('tf-input.hue') as HTMLElement;
        if (hueInput) {
            hueInput.removeEventListener('valueinput', this.onHueValueInput.bind(this));
        }
        const saturationInput = root.querySelector('tf-input.saturation') as HTMLElement;
        if (saturationInput) {
            saturationInput.removeEventListener('valueinput', this.onSaturationValueInput.bind(this));
        }
        const lightnessInput = root.querySelector('tf-input.lightness') as HTMLElement;
        if (lightnessInput) {
            lightnessInput.removeEventListener('valueinput', this.onLightnessValueInput.bind(this));
        }
        const redInput = root.querySelector('tf-input.red') as HTMLElement;
        if (redInput) {
            redInput.removeEventListener('valueinput', this.onRedValueInput.bind(this));
        }
        const greenInput = root.querySelector('tf-input.green') as HTMLElement;
        if (greenInput) {
            greenInput.removeEventListener('valueinput', this.onGreenValueInput.bind(this));
        }
        const blueInput = root.querySelector('tf-input.blue') as HTMLElement;
        if (blueInput) {
            blueInput.removeEventListener('valueinput', this.onBlueValueInput.bind(this));
        }
        const alphaInput = root.querySelector('tf-input.alpha') as HTMLElement;
        if (alphaInput) {
            alphaInput.removeEventListener('valueinput', this.onAlphaValueInput.bind(this));
        }
        const modeButton = root.querySelector('.mode-button');
        if (modeButton) {
            modeButton.removeEventListener('click', this.onCycleMode.bind(this));
        }
        const clearButton = root.querySelector('.color-clear');
        if (clearButton) {
            clearButton.removeEventListener('click', this.onClearButton.bind(this));
        }
        const okButton = root.querySelector('.ok');
        if (okButton) {
            okButton.removeEventListener('click', this.onOk.bind(this));
        }
    }

    attributeChangedCallback(name: string, oldValue: string | null | undefined, newValue: string | null | undefined) {
        if (newValue == oldValue) {
            return;
        }
        if (name === 'disabled') {
            const root = this.shadowRoot;
            if (!root) {
                return;
            }

            const input = root.querySelector('.picker-value') as TavenemInputHtmlElement;
            if (input) {
                if (newValue) {
                    input.setAttribute('disabled', '');
                } else {
                    input.removeAttribute('disabled');
                }
            }

            const hueSlider = root.querySelector('input.hue') as HTMLInputElement;
            if (hueSlider) {
                if (newValue) {
                    hueSlider.disabled = true;
                } else {
                    hueSlider.disabled = this.hasAttribute('readonly');
                }
            }

            const alphaSlider = root.querySelector('input.alpha') as HTMLInputElement;
            if (alphaSlider) {
                if (newValue) {
                    alphaSlider.disabled = true;
                } else {
                    alphaSlider.disabled = this.hasAttribute('readonly');
                }
            }

            const hexInput = root.querySelector('input.hex') as TavenemInputHtmlElement;
            if (hexInput) {
                if (newValue) {
                    hexInput.setAttribute('disabled', '');
                } else {
                    hexInput.removeAttribute('disabled');
                }
            }

            const hueInput = root.querySelector('input.hue') as TavenemInputHtmlElement;
            if (hueInput) {
                if (newValue) {
                    hueInput.setAttribute('disabled', '');
                } else {
                    hueInput.removeAttribute('disabled');
                }
            }

            const saturationInput = root.querySelector('input.saturation') as TavenemInputHtmlElement;
            if (saturationInput) {
                if (newValue) {
                    saturationInput.setAttribute('disabled', '');
                } else {
                    saturationInput.removeAttribute('disabled');
                }
            }

            const lightnessInput = root.querySelector('input.lightness') as TavenemInputHtmlElement;
            if (lightnessInput) {
                if (newValue) {
                    lightnessInput.setAttribute('disabled', '');
                } else {
                    lightnessInput.removeAttribute('disabled');
                }
            }

            const redInput = root.querySelector('input.red') as TavenemInputHtmlElement;
            if (redInput) {
                if (newValue) {
                    redInput.setAttribute('disabled', '');
                } else {
                    redInput.removeAttribute('disabled');
                }
            }

            const greenInput = root.querySelector('input.green') as TavenemInputHtmlElement;
            if (greenInput) {
                if (newValue) {
                    greenInput.setAttribute('disabled', '');
                } else {
                    greenInput.removeAttribute('disabled');
                }
            }

            const blueInput = root.querySelector('input.blue') as TavenemInputHtmlElement;
            if (blueInput) {
                if (newValue) {
                    blueInput.setAttribute('disabled', '');
                } else {
                    blueInput.removeAttribute('disabled');
                }
            }

            const alphaInput = root.querySelector('input.alpha') as TavenemInputHtmlElement;
            if (alphaInput) {
                if (newValue) {
                    alphaInput.setAttribute('disabled', '');
                } else {
                    alphaInput.removeAttribute('disabled');
                }
            }

            const modeButton = root.querySelector('.mode-button') as HTMLButtonElement;
            if (modeButton) {
                if (newValue) {
                    modeButton.disabled = true;
                } else {
                    modeButton.disabled = false;
                }
            }

            const clearButton = root.querySelector('.color-clear') as HTMLButtonElement;
            if (clearButton) {
                if (newValue) {
                    clearButton.disabled = true;
                } else {
                    clearButton.disabled = this.hasAttribute('readonly');
                }
            }

            this.setOpen(false);
        } else if (name === 'readonly') {
            const root = this.shadowRoot;
            if (!root) {
                return;
            }

            const hueSlider = root.querySelector('input.hue') as HTMLInputElement;
            if (hueSlider) {
                if (newValue) {
                    hueSlider.disabled = true;
                } else {
                    hueSlider.disabled = this.hasAttribute('disabled');
                }
            }

            const alphaSlider = root.querySelector('input.alpha') as HTMLInputElement;
            if (alphaSlider) {
                if (newValue) {
                    alphaSlider.disabled = true;
                } else {
                    alphaSlider.disabled = this.hasAttribute('disabled');
                }
            }

            const hexInput = root.querySelector('input.hex') as TavenemInputHtmlElement;
            if (hexInput) {
                if (newValue) {
                    hexInput.setAttribute('readonly', '');
                } else {
                    hexInput.removeAttribute('readonly');
                }
            }

            const hueInput = root.querySelector('input.hue') as TavenemInputHtmlElement;
            if (hueInput) {
                if (newValue) {
                    hueInput.setAttribute('readonly', '');
                } else {
                    hueInput.removeAttribute('readonly');
                }
            }

            const saturationInput = root.querySelector('input.saturation') as TavenemInputHtmlElement;
            if (saturationInput) {
                if (newValue) {
                    saturationInput.setAttribute('readonly', '');
                } else {
                    saturationInput.removeAttribute('readonly');
                }
            }

            const lightnessInput = root.querySelector('input.lightness') as TavenemInputHtmlElement;
            if (lightnessInput) {
                if (newValue) {
                    lightnessInput.setAttribute('readonly', '');
                } else {
                    lightnessInput.removeAttribute('readonly');
                }
            }

            const redInput = root.querySelector('input.red') as TavenemInputHtmlElement;
            if (redInput) {
                if (newValue) {
                    redInput.setAttribute('readonly', '');
                } else {
                    redInput.removeAttribute('readonly');
                }
            }

            const greenInput = root.querySelector('input.green') as TavenemInputHtmlElement;
            if (greenInput) {
                if (newValue) {
                    greenInput.setAttribute('readonly', '');
                } else {
                    greenInput.removeAttribute('readonly');
                }
            }

            const blueInput = root.querySelector('input.blue') as TavenemInputHtmlElement;
            if (blueInput) {
                if (newValue) {
                    blueInput.setAttribute('readonly', '');
                } else {
                    blueInput.removeAttribute('readonly');
                }
            }

            const alphaInput = root.querySelector('input.alpha') as TavenemInputHtmlElement;
            if (alphaInput) {
                if (newValue) {
                    alphaInput.setAttribute('readonly', '');
                } else {
                    alphaInput.removeAttribute('readonly');
                }
            }

            const clearButton = root.querySelector('.color-clear') as HTMLButtonElement;
            if (clearButton) {
                if (newValue) {
                    clearButton.disabled = true;
                } else {
                    clearButton.disabled = this.hasAttribute('disabled');
                }
            }

            this.setOpen(false);
        } else if (name === 'value'
            && newValue) {
            this.setValue(newValue);
        }
    }

    private static colorNameToRgba(value?: string | null): RGBA | null {
        if (!value || !value.length) {
            return null;
        }

        switch (value.toLowerCase()) {
            case "transparent": return { red: 0, green: 0, blue: 0, alpha: 0, };
            case "black": return { red: 0, green: 0, blue: 0, alpha: 1 };
            case "white": return { red: 255, green: 255, blue: 255, alpha: 1 };
            case "red": return { red: 255, green: 0, blue: 0, alpha: 1 };
            case "lime": return { red: 0, green: 255, blue: 0, alpha: 1 };
            case "blue": return { red: 0, green: 0, blue: 255, alpha: 1 };
            case "fuschia": return { red: 255, green: 0, blue: 255, alpha: 1 };
            case "yellow": return { red: 255, green: 255, blue: 0, alpha: 1 };
            case "aqua": return { red: 0, green: 255, blue: 255, alpha: 1 };
            case "silver": return { red: 192, green: 192, blue: 192, alpha: 1 };
            case "gray": return { red: 128, green: 128, blue: 128, alpha: 1 };
            case "maroon": return { red: 128, green: 0, blue: 0, alpha: 1 };
            case "purple": return { red: 128, green: 0, blue: 128, alpha: 1 };
            case "green": return { red: 0, green: 128, blue: 0, alpha: 1 };
            case "olive": return { red: 128, green: 128, blue: 0, alpha: 1 };
            case "navy": return { red: 0, green: 0, blue: 128, alpha: 1 };
            case "teal": return { red: 0, green: 128, blue: 128, alpha: 1 };
            case "orange": return { red: 255, green: 165, blue: 0, alpha: 1 };
            case "aliceblue": return { red: 240, green: 248, blue: 255, alpha: 1 };
            case "antiquewhite": return { red: 250, green: 235, blue: 215, alpha: 1 };
            case "aquamarine": return { red: 127, green: 255, blue: 212, alpha: 1 };
            case "azure": return { red: 240, green: 255, blue: 255, alpha: 1 };
            case "beige": return { red: 245, green: 245, blue: 220, alpha: 1 };
            case "bisque": return { red: 255, green: 228, blue: 196, alpha: 1 };
            case "blanchedalmond": return { red: 255, green: 235, blue: 205, alpha: 1 };
            case "blueviolet": return { red: 138, green: 43, blue: 226, alpha: 1 };
            case "brown": return { red: 165, green: 42, blue: 42, alpha: 1 };
            case "burlywood": return { red: 222, green: 184, blue: 135, alpha: 1 };
            case "cadetblue": return { red: 95, green: 158, blue: 160, alpha: 1 };
            case "chartreuse": return { red: 127, green: 255, blue: 0, alpha: 1 };
            case "chocolate": return { red: 210, green: 105, blue: 30, alpha: 1 };
            case "coral": return { red: 255, green: 127, blue: 80, alpha: 1 };
            case "cornflowerblue": return { red: 100, green: 149, blue: 237, alpha: 1 };
            case "cornsilk": return { red: 255, green: 248, blue: 220, alpha: 1 };
            case "crimson": return { red: 220, green: 20, blue: 60, alpha: 1 };
            case "darkblue": return { red: 0, green: 0, blue: 139, alpha: 1 };
            case "darkcyan": return { red: 0, green: 139, blue: 139, alpha: 1 };
            case "darkgoldenrod": return { red: 184, green: 134, blue: 11, alpha: 1 };
            case "darkgray": return { red: 169, green: 169, blue: 169, alpha: 1 };
            case "darkgreen": return { red: 0, green: 100, blue: 0, alpha: 1 };
            case "darkkhaki": return { red: 189, green: 183, blue: 107, alpha: 1 };
            case "darkmagenta": return { red: 139, green: 0, blue: 139, alpha: 1 };
            case "darkolivegreen": return { red: 85, green: 107, blue: 47, alpha: 1 };
            case "darkorange": return { red: 255, green: 140, blue: 0, alpha: 1 };
            case "darkorchid": return { red: 153, green: 50, blue: 204, alpha: 1 };
            case "darkred": return { red: 139, green: 0, blue: 0, alpha: 1 };
            case "darksalmon": return { red: 233, green: 150, blue: 122, alpha: 1 };
            case "darkseagreen": return { red: 143, green: 188, blue: 143, alpha: 1 };
            case "darkslateblue": return { red: 72, green: 61, blue: 139, alpha: 1 };
            case "darkslategray": return { red: 47, green: 79, blue: 79, alpha: 1 };
            case "darkturquoise": return { red: 0, green: 206, blue: 209, alpha: 1 };
            case "darkviolet": return { red: 148, green: 0, blue: 211, alpha: 1 };
            case "deeppink": return { red: 255, green: 20, blue: 147, alpha: 1 };
            case "deepskyblue": return { red: 0, green: 191, blue: 255, alpha: 1 };
            case "dimgray": return { red: 105, green: 105, blue: 105, alpha: 1 };
            case "dodgerblue": return { red: 30, green: 144, blue: 255, alpha: 1 };
            case "firebrick": return { red: 178, green: 34, blue: 34, alpha: 1 };
            case "floralwhite": return { red: 255, green: 250, blue: 240, alpha: 1 };
            case "forestgreen": return { red: 34, green: 139, blue: 34, alpha: 1 };
            case "gainsboro": return { red: 220, green: 220, blue: 220, alpha: 1 };
            case "ghostwhite": return { red: 248, green: 248, blue: 255, alpha: 1 };
            case "gold": return { red: 255, green: 215, blue: 0, alpha: 1 };
            case "goldenrod": return { red: 218, green: 165, blue: 32, alpha: 1 };
            case "greenyellow": return { red: 173, green: 255, blue: 47, alpha: 1 };
            case "honeydew": return { red: 240, green: 255, blue: 240, alpha: 1 };
            case "hotpink": return { red: 255, green: 105, blue: 180, alpha: 1 };
            case "indianred": return { red: 205, green: 92, blue: 92, alpha: 1 };
            case "indigo": return { red: 75, green: 0, blue: 130, alpha: 1 };
            case "ivory": return { red: 255, green: 255, blue: 240, alpha: 1 };
            case "khaki": return { red: 240, green: 230, blue: 140, alpha: 1 };
            case "lavender": return { red: 230, green: 230, blue: 250, alpha: 1 };
            case "lavenderblush": return { red: 255, green: 240, blue: 245, alpha: 1 };
            case "lawngreen": return { red: 124, green: 252, blue: 0, alpha: 1 };
            case "lemonchiffon": return { red: 255, green: 250, blue: 205, alpha: 1 };
            case "lightblue": return { red: 173, green: 216, blue: 230, alpha: 1 };
            case "lightcoral": return { red: 240, green: 128, blue: 128, alpha: 1 };
            case "lightcyan": return { red: 224, green: 255, blue: 255, alpha: 1 };
            case "lightgoldenrodyellow": return { red: 250, green: 250, blue: 210, alpha: 1 };
            case "lightgray": return { red: 211, green: 211, blue: 211, alpha: 1 };
            case "lightgreen": return { red: 144, green: 238, blue: 144, alpha: 1 };
            case "lightpink": return { red: 255, green: 182, blue: 193, alpha: 1 };
            case "lightsalmon": return { red: 255, green: 160, blue: 122, alpha: 1 };
            case "lightseagreen": return { red: 32, green: 178, blue: 170, alpha: 1 };
            case "lightskyblue": return { red: 135, green: 206, blue: 250, alpha: 1 };
            case "lightslategray": return { red: 119, green: 136, blue: 153, alpha: 1 };
            case "lightsteelblue": return { red: 176, green: 196, blue: 222, alpha: 1 };
            case "lightyellow": return { red: 255, green: 255, blue: 224, alpha: 1 };
            case "limegreen": return { red: 50, green: 205, blue: 50, alpha: 1 };
            case "linen": return { red: 250, green: 240, blue: 230, alpha: 1 };
            case "mediumaquamarine": return { red: 102, green: 205, blue: 170, alpha: 1 };
            case "mediumblue": return { red: 0, green: 0, blue: 205, alpha: 1 };
            case "mediumorchid": return { red: 186, green: 85, blue: 211, alpha: 1 };
            case "mediumpurple": return { red: 147, green: 112, blue: 219, alpha: 1 };
            case "mediumseagreen": return { red: 60, green: 179, blue: 113, alpha: 1 };
            case "mediumslateblue": return { red: 123, green: 104, blue: 238, alpha: 1 };
            case "mediumspringgreen": return { red: 0, green: 250, blue: 154, alpha: 1 };
            case "mediumturquoise": return { red: 72, green: 209, blue: 204, alpha: 1 };
            case "mediumvioletred": return { red: 199, green: 21, blue: 133, alpha: 1 };
            case "midnightblue": return { red: 25, green: 25, blue: 112, alpha: 1 };
            case "mintcream": return { red: 245, green: 255, blue: 250, alpha: 1 };
            case "mistyrose": return { red: 255, green: 228, blue: 225, alpha: 1 };
            case "moccasin": return { red: 255, green: 228, blue: 181, alpha: 1 };
            case "navajowhite": return { red: 255, green: 222, blue: 173, alpha: 1 };
            case "oldlace": return { red: 253, green: 245, blue: 230, alpha: 1 };
            case "olivedrab": return { red: 107, green: 142, blue: 35, alpha: 1 };
            case "orangered": return { red: 255, green: 69, blue: 0, alpha: 1 };
            case "orchid": return { red: 218, green: 112, blue: 214, alpha: 1 };
            case "palegoldenrod": return { red: 238, green: 232, blue: 170, alpha: 1 };
            case "palegreen": return { red: 152, green: 251, blue: 152, alpha: 1 };
            case "paleturquoise": return { red: 175, green: 238, blue: 238, alpha: 1 };
            case "palevioletred": return { red: 219, green: 112, blue: 147, alpha: 1 };
            case "papayawhip": return { red: 255, green: 239, blue: 213, alpha: 1 };
            case "peachpuff": return { red: 255, green: 218, blue: 185, alpha: 1 };
            case "peru": return { red: 205, green: 133, blue: 63, alpha: 1 };
            case "pink": return { red: 255, green: 192, blue: 203, alpha: 1 };
            case "plum": return { red: 221, green: 160, blue: 221, alpha: 1 };
            case "powderblue": return { red: 176, green: 224, blue: 230, alpha: 1 };
            case "rosybrown": return { red: 188, green: 143, blue: 143, alpha: 1 };
            case "royalblue": return { red: 65, green: 105, blue: 225, alpha: 1 };
            case "saddlebrown": return { red: 139, green: 69, blue: 19, alpha: 1 };
            case "salmon": return { red: 250, green: 128, blue: 114, alpha: 1 };
            case "sandybrown": return { red: 244, green: 164, blue: 96, alpha: 1 };
            case "seagreen": return { red: 46, green: 139, blue: 87, alpha: 1 };
            case "seashell": return { red: 255, green: 245, blue: 238, alpha: 1 };
            case "sienna": return { red: 160, green: 82, blue: 45, alpha: 1 };
            case "skyblue": return { red: 135, green: 206, blue: 235, alpha: 1 };
            case "slateblue": return { red: 106, green: 90, blue: 205, alpha: 1 };
            case "slategray": return { red: 112, green: 128, blue: 144, alpha: 1 };
            case "snow": return { red: 255, green: 250, blue: 250, alpha: 1 };
            case "springgreen": return { red: 0, green: 255, blue: 127, alpha: 1 };
            case "steelblue": return { red: 70, green: 130, blue: 180, alpha: 1 };
            case "tan": return { red: 210, green: 180, blue: 140, alpha: 1 };
            case "thistle": return { red: 216, green: 191, blue: 216, alpha: 1 };
            case "tomato": return { red: 255, green: 99, blue: 71, alpha: 1 };
            case "turquoise": return { red: 64, green: 224, blue: 208, alpha: 1 };
            case "violet": return { red: 238, green: 130, blue: 238, alpha: 1 };
            case "wheat": return { red: 245, green: 222, blue: 179, alpha: 1 };
            case "whitesmoke": return { red: 245, green: 245, blue: 245, alpha: 1 };
            case "yellowgreen": return { red: 154, green: 205, blue: 50, alpha: 1 };
            case "rebeccapurple": return { red: 102, green: 51, blue: 153, alpha: 1 };
            default: return null;
        }
    }

    private static hexToHsla(value?: string | null): ({ hsla: HSLA, rgba: RGBA }) | null {
        if (!value || !value.length) {
            return null;
        }

        const rgba = TavenemColorInputHtmlElement.hexToRgba(value);
        if (!rgba) {
            return null;
        }

        const hsla = TavenemColorInputHtmlElement.rgbaToHsla(rgba);
        if (!hsla) {
            return null;
        }

        return {
            hsla: hsla,
            rgba: rgba,
        };
    }

    private static hexToRgba(value?: string | null): RGBA | null {
        if (!value || !value.length) {
            return null;
        }

        const valid = /^#?([A-Fa-f0-9]{3,4}){1,2}$/.test(value);
        if (!valid) {
            return this.colorNameToRgba(value);
        }

        const hash = value.startsWith('#');
        const size = Math.floor((hash ? value.length - 1 : value.length) / 3);
        const values = (hash ? value.slice(1) : value).match(new RegExp(`.{${size}}`, "g"));
        if (!values || values.length < 3) {
            return null;
        }

        const r = parseInt(values[0].repeat(2 / values[0].length), 16);
        const g = parseInt(values[1].repeat(2 / values[1].length), 16);
        const b = parseInt(values[2].repeat(2 / values[2].length), 16);
        const a = values.length > 3
            ? parseInt(values[3].repeat(2 / values[3].length), 16) / 255
            : 1;
        if (Number.isNaN(r)
            || Number.isNaN(g)
            || Number.isNaN(b)
            || (a != null && Number.isNaN(a))) {
            return null;
        }

        return {
            red: Math.round(r),
            green: Math.round(g),
            blue: Math.round(b),
            alpha: a,
        };
    }

    private static hslaToHex(value?: HSLA | null, alpha?: boolean): string | null {
        if (!value) {
            return null;
        }

        let s = value.saturation / 100;
        let l = value.lightness / 100;

        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs((value.hue / 60) % 2 - 1));
        const m = l - c / 2;
        let r = 0,
            g = 0,
            b = 0;

        if (0 <= value.hue && value.hue < 60) {
            r = c; g = x; b = 0;
        } else if (60 <= value.hue && value.hue < 120) {
            r = x; g = c; b = 0;
        } else if (120 <= value.hue && value.hue < 180) {
            r = 0; g = c; b = x;
        } else if (180 <= value.hue && value.hue < 240) {
            r = 0; g = x; b = c;
        } else if (240 <= value.hue && value.hue < 300) {
            r = x; g = 0; b = c;
        } else if (300 <= value.hue && value.hue < 360) {
            r = c; g = 0; b = x;
        }

        // Having obtained RGB, convert channels to hex
        let rr = Math.round((r + m) * 255).toString(16);
        let gg = Math.round((g + m) * 255).toString(16);
        let bb = Math.round((b + m) * 255).toString(16);

        let aa = alpha && value.alpha != null
            ? Math.round(value.alpha * 255).toString(16)
            : null;

        // Prepend 0s, if necessary
        if (rr.length == 1) {
            rr = "0" + rr;
        }
        if (gg.length == 1) {
            gg = "0" + gg;
        }
        if (bb.length == 1) {
            bb = "0" + bb;
        }
        if (aa && aa.length == 1) {
            aa = "0" + aa;
        }

        if (!aa
            && (rr[0] == rr[1]
            && gg[0] == gg[1]
            && bb[0] == bb[1])) {
            rr = rr[0];
            gg = gg[0];
            bb = bb[0];
        }

        return aa
            ? "#" + rr + gg + bb + aa
            : "#" + rr + gg + bb;
    }

    private static rgbaToColorName(rgba?: RGBA | null) {
        if (!rgba) {
            return null;
        }

        if (rgba.alpha === 0) {
            return "transparent";
        }

        if (rgba.alpha && rgba.alpha < 1) {
            return null;
        }

        if (rgba.red == 0
            && rgba.green == 0
            && rgba.blue == 0) {
            return "black";
        }
        if (rgba.red == 255
            && rgba.green == 255
            && rgba.blue == 255) {
            return "white";
        }
        if (rgba.red == 255
            && rgba.green == 0
            && rgba.blue == 0) {
            return "red";
        }
        if (rgba.red == 0
            && rgba.green == 255
            && rgba.blue == 0) {
            return "lime";
        }
        if (rgba.red == 0
            && rgba.green == 0
            && rgba.blue == 255) {
            return "blue";
        }
        if (rgba.red == 255
            && rgba.green == 0
            && rgba.blue == 255) {
            return "fuschia";
        }
        if (rgba.red == 255
            && rgba.green == 255
            && rgba.blue == 0) {
            return "yellow";
        }
        if (rgba.red == 0
            && rgba.green == 255
            && rgba.blue == 255) {
            return "aqua";
        }
        if (rgba.red == 192
            && rgba.green == 192
            && rgba.blue == 192) {
            return "silver";
        }
        if (rgba.red == 128
            && rgba.green == 128
            && rgba.blue == 128) {
            return "gray";
        }
        if (rgba.red == 128
            && rgba.green == 0
            && rgba.blue == 0) {
            return "maroon";
        }
        if (rgba.red == 128
            && rgba.green == 0
            && rgba.blue == 128) {
            return "purple";
        }
        if (rgba.red == 0
            && rgba.green == 128
            && rgba.blue == 0) {
            return "green";
        }
        if (rgba.red == 128
            && rgba.green == 128
            && rgba.blue == 0) {
            return "olive";
        }
        if (rgba.red == 0
            && rgba.green == 0
            && rgba.blue == 128) {
            return "navy";
        }
        if (rgba.red == 0
            && rgba.green == 128
            && rgba.blue == 128) {
            return "teal";
        }
        if (rgba.red == 255
            && rgba.green == 165
            && rgba.blue == 0) {
            return "orange";
        }
        if (rgba.red == 240
            && rgba.green == 248
            && rgba.blue == 255) {
            return "aliceblue";
        }
        if (rgba.red == 250
            && rgba.green == 235
            && rgba.blue == 215) {
            return "antiquewhite";
        }
        if (rgba.red == 127
            && rgba.green == 255
            && rgba.blue == 212) {
            return "aquamarine";
        }
        if (rgba.red == 240
            && rgba.green == 255
            && rgba.blue == 255) {
            return "azure";
        }
        if (rgba.red == 245
            && rgba.green == 245
            && rgba.blue == 220) {
            return "beige";
        }
        if (rgba.red == 255
            && rgba.green == 228
            && rgba.blue == 196) {
            return "bisque";
        }
        if (rgba.red == 255
            && rgba.green == 235
            && rgba.blue == 205) {
            return "blanchedalmond";
        }
        if (rgba.red == 138
            && rgba.green == 43
            && rgba.blue == 226) {
            return "blueviolet";
        }
        if (rgba.red == 165
            && rgba.green == 42
            && rgba.blue == 42) {
            return "brown";
        }
        if (rgba.red == 222
            && rgba.green == 184
            && rgba.blue == 135) {
            return "burlywood";
        }
        if (rgba.red == 95
            && rgba.green == 158
            && rgba.blue == 160) {
            return "cadetblue";
        }
        if (rgba.red == 127
            && rgba.green == 255
            && rgba.blue == 0) {
            return "chartreuse";
        }
        if (rgba.red == 210
            && rgba.green == 105
            && rgba.blue == 30) {
            return "chocolate";
        }
        if (rgba.red == 255
            && rgba.green == 127
            && rgba.blue == 80) {
            return "coral";
        }
        if (rgba.red == 100
            && rgba.green == 149
            && rgba.blue == 237) {
            return "cornflowerblue";
        }
        if (rgba.red == 255
            && rgba.green == 248
            && rgba.blue == 220) {
            return "cornsilk";
        }
        if (rgba.red == 220
            && rgba.green == 20
            && rgba.blue == 60) {
            return "crimson";
        }
        if (rgba.red == 0
            && rgba.green == 0
            && rgba.blue == 139) {
            return "darkblue";
        }
        if (rgba.red == 0
            && rgba.green == 139
            && rgba.blue == 139) {
            return "darkcyan";
        }
        if (rgba.red == 184
            && rgba.green == 134
            && rgba.blue == 11) {
            return "darkgoldenrod";
        }
        if (rgba.red == 169
            && rgba.green == 169
            && rgba.blue == 169) {
            return "darkgray";
        }
        if (rgba.red == 0
            && rgba.green == 100
            && rgba.blue == 0) {
            return "darkgreen";
        }
        if (rgba.red == 189
            && rgba.green == 183
            && rgba.blue == 107) {
            return "darkkhaki";
        }
        if (rgba.red == 139
            && rgba.green == 0
            && rgba.blue == 139) {
            return "darkmagenta";
        }
        if (rgba.red == 85
            && rgba.green == 107
            && rgba.blue == 47) {
            return "darkolivegreen";
        }
        if (rgba.red == 255
            && rgba.green == 140
            && rgba.blue == 0) {
            return "darkorange";
        }
        if (rgba.red == 153
            && rgba.green == 50
            && rgba.blue == 204) {
            return "darkorchid";
        }
        if (rgba.red == 139
            && rgba.green == 0
            && rgba.blue == 0) {
            return "darkred";
        }
        if (rgba.red == 233
            && rgba.green == 150
            && rgba.blue == 122) {
            return "darksalmon";
        }
        if (rgba.red == 143
            && rgba.green == 188
            && rgba.blue == 143) {
            return "darkseagreen";
        }
        if (rgba.red == 72
            && rgba.green == 61
            && rgba.blue == 139) {
            return "darkslateblue";
        }
        if (rgba.red == 47
            && rgba.green == 79
            && rgba.blue == 79) {
            return "darkslategray";
        }
        if (rgba.red == 0
            && rgba.green == 206
            && rgba.blue == 209) {
            return "darkturquoise";
        }
        if (rgba.red == 148
            && rgba.green == 0
            && rgba.blue == 211) {
            return "darkviolet";
        }
        if (rgba.red == 255
            && rgba.green == 20
            && rgba.blue == 147) {
            return "deeppink";
        }
        if (rgba.red == 0
            && rgba.green == 191
            && rgba.blue == 255) {
            return "deepskyblue";
        }
        if (rgba.red == 105
            && rgba.green == 105
            && rgba.blue == 105) {
            return "dimgray";
        }
        if (rgba.red == 30
            && rgba.green == 144
            && rgba.blue == 255) {
            return "dodgerblue";
        }
        if (rgba.red == 178
            && rgba.green == 34
            && rgba.blue == 34) {
            return "firebrick";
        }
        if (rgba.red == 255
            && rgba.green == 250
            && rgba.blue == 240) {
            return "floralwhite";
        }
        if (rgba.red == 34
            && rgba.green == 139
            && rgba.blue == 34) {
            return "forestgreen";
        }
        if (rgba.red == 220
            && rgba.green == 220
            && rgba.blue == 220) {
            return "gainsboro";
        }
        if (rgba.red == 248
            && rgba.green == 248
            && rgba.blue == 255) {
            return "ghostwhite";
        }
        if (rgba.red == 255
            && rgba.green == 215
            && rgba.blue == 0) {
            return "gold";
        }
        if (rgba.red == 218
            && rgba.green == 165
            && rgba.blue == 32) {
            return "goldenrod";
        }
        if (rgba.red == 173
            && rgba.green == 255
            && rgba.blue == 47) {
            return "greenyellow";
        }
        if (rgba.red == 240
            && rgba.green == 255
            && rgba.blue == 240) {
            return "honeydew";
        }
        if (rgba.red == 255
            && rgba.green == 105
            && rgba.blue == 180) {
            return "hotpink";
        }
        if (rgba.red == 205
            && rgba.green == 92
            && rgba.blue == 92) {
            return "indianred";
        }
        if (rgba.red == 75
            && rgba.green == 0
            && rgba.blue == 130) {
            return "indigo";
        }
        if (rgba.red == 255
            && rgba.green == 255
            && rgba.blue == 240) {
            return "ivory";
        }
        if (rgba.red == 240
            && rgba.green == 230
            && rgba.blue == 140) {
            return "khaki";
        }
        if (rgba.red == 230
            && rgba.green == 230
            && rgba.blue == 250) {
            return "lavender";
        }
        if (rgba.red == 255
            && rgba.green == 240
            && rgba.blue == 245) {
            return "lavenderblush";
        }
        if (rgba.red == 124
            && rgba.green == 252
            && rgba.blue == 0) {
            return "lawngreen";
        }
        if (rgba.red == 255
            && rgba.green == 250
            && rgba.blue == 205) {
            return "lemonchiffon";
        }
        if (rgba.red == 173
            && rgba.green == 216
            && rgba.blue == 230) {
            return "lightblue";
        }
        if (rgba.red == 240
            && rgba.green == 128
            && rgba.blue == 128) {
            return "lightcoral";
        }
        if (rgba.red == 224
            && rgba.green == 255
            && rgba.blue == 255) {
            return "lightcyan";
        }
        if (rgba.red == 250
            && rgba.green == 250
            && rgba.blue == 210) {
            return "lightgoldenrodyellow";
        }
        if (rgba.red == 211
            && rgba.green == 211
            && rgba.blue == 211) {
            return "lightgray";
        }
        if (rgba.red == 144
            && rgba.green == 238
            && rgba.blue == 144) {
            return "lightgreen";
        }
        if (rgba.red == 255
            && rgba.green == 182
            && rgba.blue == 193) {
            return "lightpink";
        }
        if (rgba.red == 255
            && rgba.green == 160
            && rgba.blue == 122) {
            return "lightsalmon";
        }
        if (rgba.red == 32
            && rgba.green == 178
            && rgba.blue == 170) {
            return "lightseagreen";
        }
        if (rgba.red == 135
            && rgba.green == 206
            && rgba.blue == 250) {
            return "lightskyblue";
        }
        if (rgba.red == 119
            && rgba.green == 136
            && rgba.blue == 153) {
            return "lightslategray";
        }
        if (rgba.red == 176
            && rgba.green == 196
            && rgba.blue == 222) {
            return "lightsteelblue";
        }
        if (rgba.red == 255
            && rgba.green == 255
            && rgba.blue == 224) {
            return "lightyellow";
        }
        if (rgba.red == 50
            && rgba.green == 205
            && rgba.blue == 50) {
            return "limegreen";
        }
        if (rgba.red == 250
            && rgba.green == 240
            && rgba.blue == 230) {
            return "linen";
        }
        if (rgba.red == 102
            && rgba.green == 205
            && rgba.blue == 170) {
            return "mediumaquamarine";
        }
        if (rgba.red == 0
            && rgba.green == 0
            && rgba.blue == 205) {
            return "mediumblue";
        }
        if (rgba.red == 186
            && rgba.green == 85
            && rgba.blue == 211) {
            return "mediumorchid";
        }
        if (rgba.red == 147
            && rgba.green == 112
            && rgba.blue == 219) {
            return "mediumpurple";
        }
        if (rgba.red == 60
            && rgba.green == 179
            && rgba.blue == 113) {
            return "mediumseagreen";
        }
        if (rgba.red == 123
            && rgba.green == 104
            && rgba.blue == 238) {
            return "mediumslateblue";
        }
        if (rgba.red == 0
            && rgba.green == 250
            && rgba.blue == 154) {
            return "mediumspringgreen";
        }
        if (rgba.red == 72
            && rgba.green == 209
            && rgba.blue == 204) {
            return "mediumturquoise";
        }
        if (rgba.red == 199
            && rgba.green == 21
            && rgba.blue == 133) {
            return "mediumvioletred";
        }
        if (rgba.red == 25
            && rgba.green == 25
            && rgba.blue == 112) {
            return "midnightblue";
        }
        if (rgba.red == 245
            && rgba.green == 255
            && rgba.blue == 250) {
            return "mintcream";
        }
        if (rgba.red == 255
            && rgba.green == 228
            && rgba.blue == 225) {
            return "mistyrose";
        }
        if (rgba.red == 255
            && rgba.green == 228
            && rgba.blue == 181) {
            return "moccasin";
        }
        if (rgba.red == 255
            && rgba.green == 222
            && rgba.blue == 173) {
            return "navajowhite";
        }
        if (rgba.red == 253
            && rgba.green == 245
            && rgba.blue == 230) {
            return "oldlace";
        }
        if (rgba.red == 107
            && rgba.green == 142
            && rgba.blue == 35) {
            return "olivedrab";
        }
        if (rgba.red == 255
            && rgba.green == 69
            && rgba.blue == 0) {
            return "orangered";
        }
        if (rgba.red == 218
            && rgba.green == 112
            && rgba.blue == 214) {
            return "orchid";
        }
        if (rgba.red == 238
            && rgba.green == 232
            && rgba.blue == 170) {
            return "palegoldenrod";
        }
        if (rgba.red == 152
            && rgba.green == 251
            && rgba.blue == 152) {
            return "palegreen";
        }
        if (rgba.red == 175
            && rgba.green == 238
            && rgba.blue == 238) {
            return "paleturquoise";
        }
        if (rgba.red == 219
            && rgba.green == 112
            && rgba.blue == 147) {
            return "palevioletred";
        }
        if (rgba.red == 255
            && rgba.green == 239
            && rgba.blue == 213) {
            return "papayawhip";
        }
        if (rgba.red == 255
            && rgba.green == 218
            && rgba.blue == 185) {
            return "peachpuff";
        }
        if (rgba.red == 205
            && rgba.green == 133
            && rgba.blue == 63) {
            return "peru";
        }
        if (rgba.red == 255
            && rgba.green == 192
            && rgba.blue == 203) {
            return "pink";
        }
        if (rgba.red == 221
            && rgba.green == 160
            && rgba.blue == 221) {
            return "plum";
        }
        if (rgba.red == 176
            && rgba.green == 224
            && rgba.blue == 230) {
            return "powderblue";
        }
        if (rgba.red == 188
            && rgba.green == 143
            && rgba.blue == 143) {
            return "rosybrown";
        }
        if (rgba.red == 65
            && rgba.green == 105
            && rgba.blue == 225) {
            return "royalblue";
        }
        if (rgba.red == 139
            && rgba.green == 69
            && rgba.blue == 19) {
            return "saddlebrown";
        }
        if (rgba.red == 250
            && rgba.green == 128
            && rgba.blue == 114) {
            return "salmon";
        }
        if (rgba.red == 244
            && rgba.green == 164
            && rgba.blue == 96) {
            return "sandybrown";
        }
        if (rgba.red == 46
            && rgba.green == 139
            && rgba.blue == 87) {
            return "seagreen";
        }
        if (rgba.red == 255
            && rgba.green == 245
            && rgba.blue == 238) {
            return "seashell";
        }
        if (rgba.red == 160
            && rgba.green == 82
            && rgba.blue == 45) {
            return "sienna";
        }
        if (rgba.red == 135
            && rgba.green == 206
            && rgba.blue == 235) {
            return "skyblue";
        }
        if (rgba.red == 106
            && rgba.green == 90
            && rgba.blue == 205) {
            return "slateblue";
        }
        if (rgba.red == 112
            && rgba.green == 128
            && rgba.blue == 144) {
            return "slategray";
        }
        if (rgba.red == 255
            && rgba.green == 250
            && rgba.blue == 250) {
            return "snow";
        }
        if (rgba.red == 0
            && rgba.green == 255
            && rgba.blue == 127) {
            return "springgreen";
        }
        if (rgba.red == 70
            && rgba.green == 130
            && rgba.blue == 180) {
            return "steelblue";
        }
        if (rgba.red == 210
            && rgba.green == 180
            && rgba.blue == 140) {
            return "tan";
        }
        if (rgba.red == 216
            && rgba.green == 191
            && rgba.blue == 216) {
            return "thistle";
        }
        if (rgba.red == 255
            && rgba.green == 99
            && rgba.blue == 71) {
            return "tomato";
        }
        if (rgba.red == 64
            && rgba.green == 224
            && rgba.blue == 208) {
            return "turquoise";
        }
        if (rgba.red == 238
            && rgba.green == 130
            && rgba.blue == 238) {
            return "violet";
        }
        if (rgba.red == 245
            && rgba.green == 222
            && rgba.blue == 179) {
            return "wheat";
        }
        if (rgba.red == 245
            && rgba.green == 245
            && rgba.blue == 245) {
            return "whitesmoke";
        }
        if (rgba.red == 154
            && rgba.green == 205
            && rgba.blue == 50) {
            return "yellowgreen";
        }
        if (rgba.red == 102
            && rgba.green == 51
            && rgba.blue == 153) {
            return "rebeccapurple";
        }
        return null;
    }

    private static rgbaToHsla(value?: RGBA | null): HSLA | null {
        if (!value) {
            return null;
        }

        const r = value.red / 255;
        const g = value.green / 255;
        const b = value.blue / 255;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max == min) {
            h = s = 0; // achromatic
        } else {
            const d = max - min;
            s = l > 0.5
                ? d / (2 - max - min)
                : d / (max + min);
            switch (max) {
                case r:
                    h = (g - b) / d + (g < b ? 6 : 0);
                    break;
                case g:
                    h = (b - r) / d + 2;
                    break;
                default:
                    h = (r - g) / d + 4;
                    break;
            }
            h /= 6;
        }

        return {
            hue: Math.round(h * 360),
            lightness: Math.round(l * 100),
            saturation: Math.round(s * 100),
            alpha: value.alpha,
        };
    }

    protected clear() {
        this.removeAttribute('value');

        this._selectorX = overlayWidth;
        this._selectorY = overlayHeight / 2;

        const root = this.shadowRoot;
        if (!root) {
            return;
        }

        const hueSlider = root.querySelector('input.hue') as HTMLInputElement;
        if (hueSlider) {
            hueSlider.value = '0';
        }

        const alphaSlider = root.querySelector('input.alpha') as HTMLInputElement;
        if (alphaSlider) {
            alphaSlider.value = '0';
        }

        const selector = root.querySelector('.color-selector') as SVGSVGElement;
        if (selector) {
            selector.style.transform = `translate(${this._selectorX.toFixed(0)}px, ${this._selectorY.toFixed(0)}px)`;
        }

        const input = root.querySelector('.picker-value') as TavenemInputHtmlElement;
        if (input) {
            input.value = '';
        }

        const swatches = root.querySelectorAll('.swatch-fill');
        for (const swatch of swatches) {
            if (swatch instanceof HTMLElement) {
                swatch.style.background = 'transparent';
                swatch.classList.add('transparent');
            }
        }

        const overlay = root.querySelector('.color-overlay');
        if (overlay instanceof HTMLElement) {
            overlay.style.backgroundColor = this.hasAttribute('disabled')
                ? 'hsl(0 20 50)'
                : 'hsl(0 100 50)';
        }

        const hexInput = root.querySelector('tf-input.hex') as TavenemInputHtmlElement;
        if (hexInput) {
            hexInput.value = '';
        }

        const hueInput = root.querySelector('tf-input.hue') as TavenemInputHtmlElement;
        if (hueInput) {
            hueInput.value = '0';
        }

        const saturationInput = root.querySelector('tf-input.saturation') as TavenemInputHtmlElement;
        if (saturationInput) {
            saturationInput.value = '0';
        }

        const lightnessInput = root.querySelector('tf-input.lightness') as TavenemInputHtmlElement;
        if (lightnessInput) {
            lightnessInput.value = '0';
        }

        const redInput = root.querySelector('tf-input.red') as TavenemInputHtmlElement;
        if (redInput) {
            redInput.value = '0';
        }

        const greenInput = root.querySelector('tf-input.green') as TavenemInputHtmlElement;
        if (greenInput) {
            greenInput.value = '0';
        }

        const blueInput = root.querySelector('tf-input.blue') as TavenemInputHtmlElement;
        if (blueInput) {
            blueInput.value = '0';
        }

        const alphaInput = root.querySelector('tf-input.alpha') as TavenemInputHtmlElement;
        if (alphaInput) {
            alphaInput.value = '0';
        }
    }

    private onAlphaInput(event: Event) {
        if (!(event.target instanceof HTMLInputElement)) {
            return;
        }
        this.onHSLAChanged(
            undefined,
            undefined,
            undefined,
            event.target.value);
    }

    private onAlphaValueInput(event: Event) {
        if (event instanceof CustomEvent
            && event.detail) {
            this.onHSLAChanged(
                undefined,
                undefined,
                undefined,
                event.detail.value);
        }
    }

    private onBlueValueInput(event: Event) {
        if (event instanceof CustomEvent
            && event.detail) {
            this.onRGBChanged(undefined, undefined, event.detail.value);
        }
    }

    private onClearButton(event: Event) {
        event.preventDefault();
        event.stopPropagation();

        if (!this.hasAttribute('disabled')
            && !this.hasAttribute('readonly')) {
            this.clear();
        }
        this.setOpen(false);
    }

    private onCycleMode(event: Event) {
        event.preventDefault();
        event.stopPropagation();

        let mode = this.dataset.inputMode || 'hex';
        switch (mode) {
            case 'hsl':
                mode = 'hex';
                break;
            case 'rgb':
                mode = 'hsl';
                break;
            default:
                mode = 'rgb';
                break;
        }
        this.dataset.inputMode = mode;
    }

    private onDropperClick(event: Event) {
        if (this.hasAttribute('disabled')
            || this.hasAttribute('readonly')) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();

        new EyeDropper()
            .open()
            .then((result) => {
                this.setValue(result.sRGBHex);
            });
    }

    private onGreenValueInput(event: Event) {
        if (event instanceof CustomEvent
            && event.detail) {
            this.onRGBChanged(undefined, event.detail.value);
        }
    }

    private onHexValueChange(event: Event) {
        if (event instanceof CustomEvent
            && event.detail
            && event.detail.value) {
            this.setValue(event.detail.value);
        }
    }

    private onHSLAChanged(newHue?: string, newSaturation?: string, newLightness?: string, newAlpha?: string) {
        let hsla: HSLA | null = null;
        if (this.hasAttribute('value')) {
            const colors = TavenemColorInputHtmlElement.hexToHsla(this.getAttribute('value'));
            if (colors) {
                hsla = colors.hsla;
            }
        }
        const hasAlpha = this.hasAttribute('alpha');
        if (!hsla) {
            hsla = {
                hue: 0,
                saturation: 100,
                lightness: 50,
                alpha: hasAlpha ? 1 : undefined,
            };
        }

        if (newAlpha && hasAlpha) {
            const alpha = Math.max(0, Math.min(1, parseFloat(newAlpha) || 1));
            if (!hsla.alpha && alpha) {
                if (hsla.saturation === 0) {
                    hsla.saturation = 100;
                }
                if (hsla.lightness === 0) {
                    hsla.lightness = 50;
                }
            }
            hsla.alpha = alpha;
        }

        if (newHue) {
            const hue = parseInt(newHue);
            hsla.hue = Math.max(0, Math.min(359, Number.isNaN(hue) ? 0 : hue));
        }

        if (newSaturation) {
            const saturation = parseInt(newSaturation);
            hsla.saturation = Math.max(0, Math.min(100, Number.isNaN(saturation) ? 100 : saturation));
        }

        if (newLightness) {
            const lightness = parseInt(newLightness);
            hsla.lightness = Math.max(0, Math.min(100, Number.isNaN(lightness) ? 50 : lightness));
        }

        this.setValueFromHSLA(hsla);
    }

    private onHueInput(event: Event) {
        if (event.target instanceof HTMLInputElement) {
            this.onHSLAChanged(event.target.value);
        }
    }

    private onHueValueInput(event: Event) {
        if (event instanceof CustomEvent
            && event.detail) {
            this.onHSLAChanged(event.detail.value);
        }
    }

    private onLightnessValueInput(event: Event) {
        if (event instanceof CustomEvent
            && event.detail) {
            this.onHSLAChanged(undefined, undefined, event.detail.value);
        }
    }

    private onOk(event: Event) {
        event.preventDefault();
        event.stopPropagation();

        this.setOpen(false);
    }

    private onOuterKeyUp(event: Event) { this.onKeyUp(event as KeyboardEvent); }

    private onOuterMouseUp(event: Event) { this.onMouseUp(event as MouseEvent); }

    private onOuterPopoverFocusLost(event: Event) { this.onPopoverFocusLost(event); }

    private onOuterValueInput(event: Event) { this.onValueInput(event); }

    private onOverlayInteract(event: MouseEvent) {
        if (event.button !== 0
            || this.hasAttribute('disabled')
            || this.hasAttribute('readonly')
            || !this._overlayActive
            || !(event.target instanceof Element)) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();

        const offset = event.target.getBoundingClientRect();
        const offsetX = event.clientX - offset.x;
        const offsetY = event.clientY - offset.y;
        this._selectorX = Math.max(0, Math.min(overlayWidth, offsetX - overlayMargin));
        this._selectorY = Math.max(0, Math.min(overlayHeight, offsetY - overlayMargin));

        this.updateColorFromSelector();

    }

    private onOverlayMouseDown(event: MouseEvent) {
        if (event.button !== 0
            || this.hasAttribute('disabled')
            || this.hasAttribute('readonly')) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        this._overlayActive = true;
        this.onOverlayInteract(event);
    }

    private onOverlayMouseUp(event: MouseEvent) {
        event.preventDefault();
        event.stopPropagation();
        this._overlayActive = false;
    }

    private onRedValueInput(event: Event) {
        if (event instanceof CustomEvent
            && event.detail) {
            this.onRGBChanged(event.detail.value);
        }
    }

    private onRGBChanged(newRed?: string, newGreen?: string, newBlue?: string) {
        let rgba: RGBA | null = null;
        if (this.hasAttribute('value')) {
            rgba = TavenemColorInputHtmlElement.hexToRgba(this.getAttribute('value'));
        }
        if (!rgba) {
            rgba = {
                red: 255,
                green: 0,
                blue: 0,
                alpha: this.hasAttribute('alpha') ? 0 : undefined,
            };
        }

        if (newRed) {
            const red = parseInt(newRed);
            rgba.red = Math.max(0, Math.min(255, Number.isNaN(red) ? 0 : red));
        }

        if (newGreen) {
            const green = parseInt(newGreen);
            rgba.green = Math.max(0, Math.min(255, Number.isNaN(green) ? 0 : green));
        }

        if (newBlue) {
            const blue = parseInt(newBlue);
            rgba.blue = Math.max(0, Math.min(255, Number.isNaN(blue) ? 0 : blue));
        }

        const hsla = TavenemColorInputHtmlElement.rgbaToHsla(rgba);
        if (hsla) {
            this.setValueFromHSLA(hsla, rgba);
        }
    }

    private onSaturationValueInput(event: Event) {
        if (event instanceof CustomEvent
            && event.detail) {
            this.onHSLAChanged(undefined, event.detail.value);
        }
    }

    private onSelectorClick(event: MouseEvent) {
        if (this.hasAttribute('disabled')
            || this.hasAttribute('readonly')) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        this._selectorX = Math.max(0, Math.min(overlayWidth, event.offsetX - halfSelectorSize + this._selectorX));
        this._selectorY = Math.max(0, Math.min(overlayHeight, event.offsetY - halfSelectorSize + this._selectorY));
        this.updateColorFromSelector();
    }

    private setValue(value?: string | null) {
        if (!value || !value.length) {
            this.clear();
            return;
        }

        const colors = TavenemColorInputHtmlElement.hexToHsla(value);
        if (!colors) {
            this.clear();
            return;
        }

        this.setValueFromHSLA(colors.hsla, colors.rgba);
    }

    private setValueFromHSLA(hsla: HSLA, rgba?: RGBA | null) {
        this._selectorX = hsla.saturation / 100 * overlayWidth;
        this._selectorY = (1 - (hsla.lightness / 100)) * overlayHeight;

        const hasAlpha = this.hasAttribute('alpha');
        const hex = TavenemColorInputHtmlElement.hslaToHex(hsla, hasAlpha) || '';
        this.setAttribute('value', hex);

        const root = this.shadowRoot;
        if (!root) {
            return;
        }

        if (!rgba) {
            rgba = TavenemColorInputHtmlElement.hexToRgba(hex)
                || {
                red: 0,
                green: 0,
                blue: 0,
                alpha: hasAlpha ? 0 : undefined,
            };
        }

        const hue = hsla.hue.toString();
        const hueSlider = root.querySelector('input.hue') as HTMLInputElement;
        if (hueSlider && hueSlider.value != hue) {
            hueSlider.value = hue;
        }

        const alpha = (hsla.alpha || 0).toString();
        const alphaSlider = root.querySelector('input.alpha') as HTMLInputElement;
        if (alphaSlider && alphaSlider.value != alpha) {
            alphaSlider.style.setProperty('--alpha-background', `linear-gradient(to right, transparent, hsl(${hsla.hue} 100 50))`);
            alphaSlider.value = alpha;
        }

        const selector = root.querySelector('.color-selector') as SVGSVGElement;
        if (selector) {
            selector.style.transform = `translate(${this._selectorX.toFixed(0)}px, ${this._selectorY.toFixed(0)}px)`;
        }

        const input = root.querySelector('.picker-value') as TavenemInputHtmlElement;
        if (input) {
            input.value = hex;

            const colorName = TavenemColorInputHtmlElement.rgbaToColorName(rgba);
            if (colorName) {
                input.display = colorName;
            }
        }

        const swatches = root.querySelectorAll('.swatch-fill');
        const hslaStyle = this.hasAttribute('disabled')
            ? `hsl(${hsla.hue} ${Math.round(Math.max(10, hsla.saturation / 5))} ${hsla.lightness} / ${(hasAlpha ? (hsla.alpha || 0) : 1)})`
            : `hsl(${hsla.hue} ${hsla.saturation} ${hsla.lightness} / ${(hasAlpha ? (hsla.alpha || 0) : 1)})`;
        for (const swatch of swatches) {
            if (swatch instanceof HTMLElement) {
                swatch.style.background = hslaStyle;
                if (hasAlpha && !hsla.alpha) {
                    swatch.classList.add('transparent');
                } else {
                    swatch.classList.remove('transparent');
                }
            }
        }

        const overlay = root.querySelector('.color-overlay');
        if (overlay instanceof HTMLElement) {
            overlay.style.backgroundColor = this.hasAttribute('disabled')
                ? `hsl(${hsla.hue} 20 50)`
                : `hsl(${hsla.hue} 100 50)`;
        }

        const hexInput = root.querySelector('tf-input.hex') as TavenemInputHtmlElement;
        if (hexInput && hexInput.value != hex) {
            hexInput.value = hex;
        }

        const hueInput = root.querySelector('tf-input.hue') as TavenemInputHtmlElement;
        if (hueInput && hueInput.value != hue) {
            hueInput.value = hue;
        }

        const saturation = hsla.saturation.toString();
        const saturationInput = root.querySelector('tf-input.saturation') as TavenemInputHtmlElement;
        if (saturationInput && saturationInput.value != saturation) {
            saturationInput.value = saturation;
        }

        const lightness = hsla.lightness.toString();
        const lightnessInput = root.querySelector('tf-input.lightness') as TavenemInputHtmlElement;
        if (lightnessInput && lightnessInput.value != lightness) {
            lightnessInput.value = lightness;
        }

        const red = rgba.red.toString();
        const redInput = root.querySelector('tf-input.red') as TavenemInputHtmlElement;
        if (redInput && redInput.value != red) {
            redInput.value = red;
        }

        const green = rgba.green.toString();
        const greenInput = root.querySelector('tf-input.green') as TavenemInputHtmlElement;
        if (greenInput && greenInput.value != green) {
            greenInput.value = green;
        }

        const blue = rgba.blue.toString();
        const blueInput = root.querySelector('tf-input.blue') as TavenemInputHtmlElement;
        if (blueInput && blueInput.value != blue) {
            blueInput.value = blue;
        }

        const alphaInput = root.querySelector('tf-input.alpha') as TavenemInputHtmlElement;
        if (alphaInput && alphaInput.value != alpha) {
            alphaInput.value = alpha;
        }
    }

    private updateColorFromSelector() {
        const x = Math.max(0, Math.min(1, this._selectorX / overlayWidth));
        const y = Math.max(0, Math.min(1, this._selectorY / overlayHeight));

        let hue = 0, alpha = 1;
        if (this.hasAttribute('value')) {
            const colors = TavenemColorInputHtmlElement.hexToHsla(this.getAttribute('value'));
            if (colors) {
                hue = colors.hsla.hue;
                alpha = colors.hsla.alpha || 1;
            }
        }

        this.setValueFromHSLA({
            hue: hue,
            lightness: Math.round(100 * (1 - y)),
            saturation: Math.round(100 * x),
            alpha: this.hasAttribute('alpha') ? alpha : undefined,
        });
    }
}