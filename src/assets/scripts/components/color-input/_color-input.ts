import { TavenemPopoverHTMLElement } from '../_popover'
import { TavenemInputHtmlElement } from '../_input'
import { TavenemPickerHtmlElement } from '../_picker'
import { randomUUID } from '../../tavenem-utility'
import { TavenemInputFieldHtmlElement } from '../_input-field';
import { elementStyle } from './_element-style';
import { HSLA, RGBA, hexToHsla, hexToRgba, hslaToHex, rgbaToColorName, rgbaToHsla } from './_color-conversion';
import { TavenemSliderHTMLElement } from '../_slider';

const halfSelectorSize = 13;
const overlayHeight = 250;
const overlayMargin = 40;
const overlayWidth = 255;

export class TavenemColorInputHtmlElement extends TavenemPickerHtmlElement {
    static formAssociated = true;

    private _initialValue = '';
    private _internals: ElementInternals;
    private _overlayActive = false;
    private _selectorX = 0;
    private _selectorY = overlayHeight;
    private _settingValue = false;
    private _value = '';

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

    get type() { return this.localName; }

    get validity() { return this._internals.validity; }
    get validationMessage() { return this._internals.validationMessage; }

    get value() { return this._value; }
    set value(v: string) { this.setValue(v); }

    get willValidate() { return this._internals.willValidate; }

    static get observedAttributes() {
        return ['data-label', 'readonly', 'value'];
    }

    constructor() {
        super();
        this._internals = this.attachInternals();
    }

    connectedCallback() {
        this.dataset.popoverContainer = '';

        const shadow = this.attachShadow({ mode: 'open', delegatesFocus: true });

        const style = document.createElement('style');
        style.textContent = elementStyle;
        shadow.appendChild(style);

        this._settingValue = true;

        const hasAlpha = this.hasAttribute('alpha');
        this._initialValue = this._value = this.getAttribute('value')
            || (hasAlpha ? '#00000000' : '#000000');

        const colors = hexToHsla(this._value);
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
        const hex = hslaToHex(hsla, hasAlpha);
        const hslaStyle = this.hasAttribute('disabled')
            ? `hsl(${hsla.hue} ${Math.round(Math.max(10, hsla.saturation / 5))} ${hsla.lightness} / ${(hasAlpha ? (hsla.alpha || 0) : 1)})`
            : `hsl(${hsla.hue} ${hsla.saturation} ${hsla.lightness} / ${(hasAlpha ? (hsla.alpha || 0) : 1)})`;

        this._selectorX = hsla.saturation / 100 * overlayWidth;
        this._selectorY = (1 - (hsla.lightness / 100)) * overlayHeight;

        let anchorId;
        let anchorOrigin;
        let input: HTMLInputElement | TavenemInputHtmlElement;
        if (this.hasAttribute('button')) {
            anchorId = randomUUID();
            anchorOrigin = 'center-center';

            const button = document.createElement('button');
            button.type = 'button';
            button.id = anchorId;
            button.classList.add('picker-btn', 'btn');
            button.disabled = this.hasAttribute('disabled')
                || this.hasAttribute('readonly');
            shadow.appendChild(button);

            const slot = document.createElement('slot');
            button.appendChild(slot);

            input = document.createElement('input');
            input.classList.add('input');
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
                let usedIcon = false;
                if ('icon' in this.dataset && this.dataset.icon) {
                    if (this.dataset.icon.startsWith('&lt;svg')) {
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(this.dataset.icon, 'text/html');
                        if (!doc.querySelector('parsererror')) {
                            const body = doc.documentElement.querySelector('body');
                            if (body?.textContent) {
                                const svgDocument = parser.parseFromString(body.textContent, 'image/svg+xml');
                                if (!svgDocument.querySelector('parsererror')
                                    && svgDocument.firstElementChild?.outerHTML) {
                                    const buttonIcon = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
                                    button.appendChild(buttonIcon);
                                    buttonIcon.outerHTML = svgDocument.firstElementChild.outerHTML;
                                    usedIcon = true;
                                }
                            }
                        }
                    } else {
                        const buttonIcon = document.createElement('tf-icon');
                        buttonIcon.textContent = this.dataset.icon;
                        button.appendChild(buttonIcon);
                        usedIcon = true;
                    }
                }
                if (!usedIcon) {
                    const buttonIcon = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
                    button.appendChild(buttonIcon);
                    buttonIcon.outerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="48" viewBox="0 -960 960 960" width="48"><path d="M480-80q-82 0-155-31.5t-127.5-86Q143-252 111.5-325T80-480q0-84 32-157t87.5-127q55.5-54 130-85T489-880q79 0 150 26.5T763.5-780q53.5 47 85 111.5T880-527q0 108-63 170.5T650-294h-75q-18 0-31 14t-13 31q0 20 14.5 38t14.5 43q0 26-24.5 57T480-80ZM247-454q20 0 35-15t15-35q0-20-15-35t-35-15q-20 0-35 15t-15 35q0 20 15 35t35 15Zm126-170q20 0 35-15t15-35q0-20-15-35t-35-15q-20 0-35 15t-15 35q0 20 15 35t35 15Zm214 0q20 0 35-15t15-35q0-20-15-35t-35-15q-20 0-35 15t-15 35q0 20 15 35t35 15Zm131 170q20 0 35-15t15-35q0-20-15-35t-35-15q-20 0-35 15t-15 35q0 20 15 35t35 15Z"/></svg>`;
                }
            }
        } else {
            anchorId = randomUUID();
            anchorOrigin = 'bottom-left';

            input = document.createElement('tf-input') as TavenemInputHtmlElement;
            input.id = anchorId;
            if (!this.hasAttribute('inline')) {
                input.autofocus = this.hasAttribute('autofocus');
            }
            input.classList.add('input');
            if (this.classList.contains('clearable')) {
                input.classList.add('clearable');
            }
            if (this.hasAttribute('disabled')) {
                input.setAttribute('disabled', '');
            }
            if (this.hasAttribute('placeholder')) {
                input.setAttribute('placeholder', this.getAttribute('placeholder') || '');
            }
            input.setAttribute('readonly', '');
            input.setAttribute('size', "1");
            if (this.hasAttribute('inline')) {
                input.style.display = 'none';
            }
            if (this.hasAttribute('value')) {
                input.value = hex || '';
                const colorName = rgbaToColorName(rgba);
                if (colorName) {
                    input.display = colorName;
                }
            }
            if (input.value.length || (input.display && input.display.length)) {
                this._internals.states.add('has-value');
            } else {
                this._internals.states.add('empty');
            }
            input.addEventListener('valueinput', this.onHexValueChange.bind(this));
            input.addEventListener('valuechange', this.stopEvent.bind(this));
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
        }

        let controlContainer: Node;
        if (this.hasAttribute('inline')) {
            controlContainer = shadow;
        } else {
            const popover = document.createElement('tf-popover') as TavenemPopoverHTMLElement;
            popover.classList.add('filled', 'flip-onopen');
            popover.dataset.anchorId = anchorId;
            popover.dataset.anchorOrigin = anchorOrigin;
            popover.dataset.origin = 'top-left';
            shadow.appendChild(popover);
            controlContainer = popover;
            this._popover = popover;
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
        overlayDetector.addEventListener('mousedown', this.onOverlayMouseDown.bind(this));
        overlayDetector.addEventListener('mousemove', this.onOverlayInteract.bind(this));
        overlayDetector.addEventListener('mouseup', this.onOverlayMouseUp.bind(this));
        overlay.appendChild(overlayDetector);

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
        if (this.hasAttribute('inline')) {
            hueSlider.autofocus = this.hasAttribute('autofocus');
        }
        if (this.hasAttribute('disabled')) {
            hueSlider.setAttribute('disabled', '');
        }
        hueSlider.setAttribute('max', '359');
        hueSlider.setAttribute('min', '0');
        if (this.hasAttribute('readonly')) {
            hueSlider.setAttribute('readonly', '');
        }
        hueSlider.setAttribute('step', '1');
        hueSlider.setAttribute('value', hsla.hue.toString());
        hueSlider.addEventListener('valuechange', this.onHueInput.bind(this));
        colorSliders.appendChild(hueSlider);

        if (hasAlpha) {
            const alphaSlider = document.createElement('tf-slider');
            alphaSlider.classList.add('alpha');
            alphaSlider.dataset.value = '1';
            if (this.hasAttribute('disabled')) {
                alphaSlider.setAttribute('disabled', '');
            }
            alphaSlider.setAttribute('max', '1');
            alphaSlider.setAttribute('min', '0');
            if (this.hasAttribute('readonly')) {
                alphaSlider.setAttribute('readonly', '');
            }
            alphaSlider.setAttribute('step', 'any');
            alphaSlider.style.setProperty('--alpha-background', 'linear-gradient(to right, transparent, hsl(0 100 50))');
            alphaSlider.setAttribute('value', (hsla.alpha || 0).toString());
            alphaSlider.addEventListener('valuechange', this.onAlphaInput.bind(this));
            colorSliders.appendChild(alphaSlider);
        }

        const inputsContainer = document.createElement('div');
        inputsContainer.classList.add('inputs-container');
        colorControls.appendChild(inputsContainer);

        const hexInput = document.createElement('tf-input-field') as TavenemInputFieldHtmlElement;
        hexInput.classList.add('hex');
        hexInput.dataset.inputStyle = 'text-align:center';
        if (this.hasAttribute('disabled')) {
            hexInput.setAttribute('disabled', '');
        }
        if (this.hasAttribute('readonly')) {
            hexInput.setAttribute('readonly', '');
        }
        hexInput.setAttribute('size', '1');
        hexInput.setAttribute('type', 'text');
        hexInput.setAttribute('value', this._value);
        hexInput.addEventListener('valueinput', this.onHexValueChange.bind(this));
        hexInput.addEventListener('valuechange', this.stopEvent.bind(this));
        inputsContainer.appendChild(hexInput);

        const hexInputFieldHelpers = document.createElement('div');
        hexInputFieldHelpers.classList.add('help-text');
        hexInputFieldHelpers.slot = 'helpers';
        hexInputFieldHelpers.textContent = "HEX";
        hexInput.appendChild(hexInputFieldHelpers);

        const hueInput = document.createElement('tf-input-field') as TavenemInputFieldHtmlElement;
        hueInput.classList.add('hue', 'hsl');
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
        hueInput.setAttribute('value', hsla.hue.toString());
        hueInput.addEventListener('valueinput', this.onHueValueInput.bind(this));
        hueInput.addEventListener('valuechange', this.stopEvent.bind(this));
        inputsContainer.appendChild(hueInput);

        const hueInputFieldHelpers = document.createElement('div');
        hueInputFieldHelpers.classList.add('help-text');
        hueInputFieldHelpers.slot = 'helpers';
        hueInputFieldHelpers.textContent = "H";
        hueInput.appendChild(hueInputFieldHelpers);

        const saturationInput = document.createElement('tf-input-field') as TavenemInputFieldHtmlElement;
        saturationInput.classList.add('saturation', 'hsl');
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
        saturationInput.setAttribute('value', hsla.saturation.toString());
        saturationInput.addEventListener('valueinput', this.onSaturationValueInput.bind(this));
        saturationInput.addEventListener('valuechange', this.stopEvent.bind(this));
        inputsContainer.appendChild(saturationInput);

        const saturationInputFieldHelpers = document.createElement('div');
        saturationInputFieldHelpers.classList.add('help-text');
        saturationInputFieldHelpers.slot = 'helpers';
        saturationInputFieldHelpers.textContent = "S";
        saturationInput.appendChild(saturationInputFieldHelpers);

        const lightnessInput = document.createElement('tf-input-field') as TavenemInputFieldHtmlElement;
        lightnessInput.classList.add('lightness', 'hsl');
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
        lightnessInput.setAttribute('value', hsla.lightness.toString());
        lightnessInput.addEventListener('valueinput', this.onLightnessValueInput.bind(this));
        lightnessInput.addEventListener('valuechange', this.stopEvent.bind(this));
        inputsContainer.appendChild(lightnessInput);

        const lightnessInputFieldHelpers = document.createElement('div');
        lightnessInputFieldHelpers.classList.add('help-text');
        lightnessInputFieldHelpers.slot = 'helpers';
        lightnessInputFieldHelpers.textContent = "L";
        lightnessInput.appendChild(lightnessInputFieldHelpers);

        const redInput = document.createElement('tf-input-field') as TavenemInputFieldHtmlElement;
        redInput.classList.add('red', 'rgb');
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
        redInput.setAttribute('value', rgba.red.toString());
        redInput.addEventListener('valueinput', this.onRedValueInput.bind(this));
        redInput.addEventListener('valuechange', this.stopEvent.bind(this));
        inputsContainer.appendChild(redInput);

        const redInputFieldHelpers = document.createElement('div');
        redInputFieldHelpers.classList.add('help-text');
        redInputFieldHelpers.slot = 'helpers';
        redInputFieldHelpers.textContent = "R";
        redInput.appendChild(redInputFieldHelpers);

        const greenInput = document.createElement('tf-input-field') as TavenemInputFieldHtmlElement;
        greenInput.classList.add('green', 'rgb');
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
        greenInput.setAttribute('value', rgba.green.toString());
        greenInput.addEventListener('valueinput', this.onGreenValueInput.bind(this));
        greenInput.addEventListener('valuechange', this.stopEvent.bind(this));
        inputsContainer.appendChild(greenInput);

        const greenInputFieldHelpers = document.createElement('div');
        greenInputFieldHelpers.classList.add('help-text');
        greenInputFieldHelpers.slot = 'helpers';
        greenInputFieldHelpers.textContent = "G";
        greenInput.appendChild(greenInputFieldHelpers);

        const blueInput = document.createElement('tf-input-field') as TavenemInputFieldHtmlElement;
        blueInput.classList.add('blue', 'rgb');
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
        blueInput.setAttribute('value', rgba.blue.toString());
        blueInput.addEventListener('valueinput', this.onBlueValueInput.bind(this));
        blueInput.addEventListener('valuechange', this.stopEvent.bind(this));
        inputsContainer.appendChild(blueInput);

        const blueInputFieldHelpers = document.createElement('div');
        blueInputFieldHelpers.classList.add('help-text');
        blueInputFieldHelpers.slot = 'helpers';
        blueInputFieldHelpers.textContent = "G";
        blueInput.appendChild(blueInputFieldHelpers);

        if (hasAlpha) {
            const alphaInput = document.createElement('tf-input-field') as TavenemInputFieldHtmlElement;
            alphaInput.classList.add('alpha');
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
            alphaInput.setAttribute('value', (hsla.alpha || 0).toString());
            alphaInput.addEventListener('valueinput', this.onAlphaValueInput.bind(this));
            alphaInput.addEventListener('valuechange', this.stopEvent.bind(this));
            inputsContainer.appendChild(alphaInput);

            const alphaInputFieldHelpers = document.createElement('div');
            alphaInputFieldHelpers.classList.add('help-text');
            alphaInputFieldHelpers.slot = 'helpers';
            alphaInputFieldHelpers.textContent = "A";
            alphaInput.appendChild(alphaInputFieldHelpers);
        }

        const modeButton = document.createElement('button');
        modeButton.classList.add('mode-button');
        modeButton.addEventListener('click', this.onCycleMode.bind(this));
        inputsContainer.appendChild(modeButton);

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
            clearButton.addEventListener('click', this.onClearButton.bind(this));
            buttonsDiv.appendChild(clearButton);

            const okButton = document.createElement('button');
            okButton.classList.add('ok');
            okButton.textContent = "Ok";
            okButton.addEventListener('click', this.onOk.bind(this));
            buttonsDiv.appendChild(okButton);
        }

        this.setValidity();

        this._settingValue = false;
        
        shadow.addEventListener('mousedown', this.onMouseDown.bind(this));
        shadow.addEventListener('mouseup', this.onOuterMouseUp.bind(this));
        shadow.addEventListener('keyup', this.onOuterKeyUp.bind(this));
        document.addEventListener('mousedown', this.onDocMouseDown.bind(this));
    }

    disconnectedCallback() {
        clearTimeout(this._hideTimer);
        document.removeEventListener('mousedown', this.onDocMouseDown.bind(this));

        const root = this.shadowRoot;
        if (!root) {
            return;
        }
        
        root.removeEventListener('mousedown', this.onMouseDown.bind(this));
        root.removeEventListener('mouseup', this.onOuterMouseUp.bind(this));
        root.removeEventListener('keyup', this.onOuterKeyUp.bind(this));

        const input = root.querySelector<TavenemInputHtmlElement>('.input');
        if (input) {
            input.removeEventListener('valueinput', this.onHexValueChange.bind(this));
            input.removeEventListener('valuechange', this.stopEvent.bind(this));
        }

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
        const hueSlider = root.querySelector('tf-slider.hue');
        if (hueSlider) {
            hueSlider.removeEventListener('valuechange', this.onHueInput.bind(this));
        }
        const alphaSlider = root.querySelector('tf-slider.alpha');
        if (alphaSlider) {
            alphaSlider.removeEventListener('valuechange', this.onAlphaInput.bind(this));
        }
        if (window.isSecureContext && window.EyeDropper) {
            const dropper = root.querySelector('.dropper');
            if (dropper) {
                dropper.removeEventListener('click', this.onDropperClick.bind(this));
            }
        }
        const hexInput = root.querySelector('.hex') as HTMLElement;
        if (hexInput) {
            hexInput.removeEventListener('valueinput', this.onHexValueChange.bind(this));
            hexInput.removeEventListener('valuechange', this.stopEvent.bind(this));
        }
        const hueInput = root.querySelector('tf-input-field.hue') as HTMLElement;
        if (hueInput) {
            hueInput.removeEventListener('valueinput', this.onHueValueInput.bind(this));
            hueInput.removeEventListener('valuechange', this.stopEvent.bind(this));
        }
        const saturationInput = root.querySelector('.saturation') as HTMLElement;
        if (saturationInput) {
            saturationInput.removeEventListener('valueinput', this.onSaturationValueInput.bind(this));
            saturationInput.removeEventListener('valuechange', this.stopEvent.bind(this));
        }
        const lightnessInput = root.querySelector('.lightness') as HTMLElement;
        if (lightnessInput) {
            lightnessInput.removeEventListener('valueinput', this.onLightnessValueInput.bind(this));
            lightnessInput.removeEventListener('valuechange', this.stopEvent.bind(this));
        }
        const redInput = root.querySelector('.red') as HTMLElement;
        if (redInput) {
            redInput.removeEventListener('valueinput', this.onRedValueInput.bind(this));
            redInput.removeEventListener('valuechange', this.stopEvent.bind(this));
        }
        const greenInput = root.querySelector('.green') as HTMLElement;
        if (greenInput) {
            greenInput.removeEventListener('valueinput', this.onGreenValueInput.bind(this));
            greenInput.removeEventListener('valuechange', this.stopEvent.bind(this));
        }
        const blueInput = root.querySelector('.blue') as HTMLElement;
        if (blueInput) {
            blueInput.removeEventListener('valueinput', this.onBlueValueInput.bind(this));
            blueInput.removeEventListener('valuechange', this.stopEvent.bind(this));
        }
        const alphaInput = root.querySelector('tf-input-field.alpha') as HTMLElement;
        if (alphaInput) {
            alphaInput.removeEventListener('valueinput', this.onAlphaValueInput.bind(this));
            alphaInput.removeEventListener('valuechange', this.stopEvent.bind(this));
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
        if (name === 'readonly') {
            const root = this.shadowRoot;
            if (!root) {
                return;
            }

            const hueSlider = root.querySelector('tf-slider.hue');
            if (hueSlider) {
                if (newValue) {
                    hueSlider.setAttribute('readonly', '');
                } else {
                    hueSlider.removeAttribute('readonly');
                }
            }

            const alphaSlider = root.querySelector('tf-slider.alpha');
            if (alphaSlider) {
                if (newValue) {
                    alphaSlider.setAttribute('readonly', '');
                } else {
                    alphaSlider.removeAttribute('readonly');
                }
            }

            const hexInput = root.querySelector('input.hex');
            if (hexInput) {
                if (newValue) {
                    hexInput.setAttribute('readonly', '');
                } else {
                    hexInput.removeAttribute('readonly');
                }
            }

            const hueInput = root.querySelector('tf-input-field.hue');
            if (hueInput) {
                if (newValue) {
                    hueInput.setAttribute('readonly', '');
                } else {
                    hueInput.removeAttribute('readonly');
                }
            }

            const saturationInput = root.querySelector('input.saturation');
            if (saturationInput) {
                if (newValue) {
                    saturationInput.setAttribute('readonly', '');
                } else {
                    saturationInput.removeAttribute('readonly');
                }
            }

            const lightnessInput = root.querySelector('input.lightness');
            if (lightnessInput) {
                if (newValue) {
                    lightnessInput.setAttribute('readonly', '');
                } else {
                    lightnessInput.removeAttribute('readonly');
                }
            }

            const redInput = root.querySelector('input.red');
            if (redInput) {
                if (newValue) {
                    redInput.setAttribute('readonly', '');
                } else {
                    redInput.removeAttribute('readonly');
                }
            }

            const greenInput = root.querySelector('input.green');
            if (greenInput) {
                if (newValue) {
                    greenInput.setAttribute('readonly', '');
                } else {
                    greenInput.removeAttribute('readonly');
                }
            }

            const blueInput = root.querySelector('input.blue');
            if (blueInput) {
                if (newValue) {
                    blueInput.setAttribute('readonly', '');
                } else {
                    blueInput.removeAttribute('readonly');
                }
            }

            const alphaInput = root.querySelector('tf-input-field.alpha');
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
                    clearButton.disabled = this.matches(':disabled');
                }
            }

            this.setOpen(false);
        } else if (name === 'value'
            && newValue) {
            this.setValue(newValue);
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
                const slot = root.querySelector('slot');
                if (input && slot) {
                    const label = document.createElement('label');
                    label.htmlFor = input.id;
                    label.innerText = newValue;
                    root.insertBefore(label, slot);
                }
            }
        }
    }

    formDisabledCallback(disabled: boolean) {
        const root = this.shadowRoot;
        if (!root) {
            return;
        }

        const input = root.querySelector('.input') as TavenemInputHtmlElement;
        if (input) {
            if (disabled) {
                input.setAttribute('disabled', '');
            } else {
                input.removeAttribute('disabled');
            }
        }

        const hueSlider = root.querySelector('tf-slider.hue');
        if (hueSlider) {
            if (disabled) {
                hueSlider.setAttribute('disabled', '');
            } else {
                hueSlider.removeAttribute('disabled');
            }
        }

        const alphaSlider = root.querySelector('tf-slider.alpha');
        if (alphaSlider) {
            if (disabled) {
                alphaSlider.setAttribute('disabled', '');
            } else {
                alphaSlider.removeAttribute('disabled');
            }
        }

        const hexInput = root.querySelector('.hex') as TavenemInputFieldHtmlElement;
        if (hexInput) {
            if (disabled) {
                hexInput.setAttribute('disabled', '');
            } else {
                hexInput.removeAttribute('disabled');
            }
        }

        const hueInput = root.querySelector('tf-input-field.hue') as TavenemInputFieldHtmlElement;
        if (hueInput) {
            if (disabled) {
                hueInput.setAttribute('disabled', '');
            } else {
                hueInput.removeAttribute('disabled');
            }
        }

        const saturationInput = root.querySelector('.saturation') as TavenemInputFieldHtmlElement;
        if (saturationInput) {
            if (disabled) {
                saturationInput.setAttribute('disabled', '');
            } else {
                saturationInput.removeAttribute('disabled');
            }
        }

        const lightnessInput = root.querySelector('.lightness') as TavenemInputFieldHtmlElement;
        if (lightnessInput) {
            if (disabled) {
                lightnessInput.setAttribute('disabled', '');
            } else {
                lightnessInput.removeAttribute('disabled');
            }
        }

        const redInput = root.querySelector('.red') as TavenemInputFieldHtmlElement;
        if (redInput) {
            if (disabled) {
                redInput.setAttribute('disabled', '');
            } else {
                redInput.removeAttribute('disabled');
            }
        }

        const greenInput = root.querySelector('.green') as TavenemInputFieldHtmlElement;
        if (greenInput) {
            if (disabled) {
                greenInput.setAttribute('disabled', '');
            } else {
                greenInput.removeAttribute('disabled');
            }
        }

        const blueInput = root.querySelector('.blue') as TavenemInputFieldHtmlElement;
        if (blueInput) {
            if (disabled) {
                blueInput.setAttribute('disabled', '');
            } else {
                blueInput.removeAttribute('disabled');
            }
        }

        const alphaInput = root.querySelector('tf-input-field.alpha') as TavenemInputFieldHtmlElement;
        if (alphaInput) {
            if (disabled) {
                alphaInput.setAttribute('disabled', '');
            } else {
                alphaInput.removeAttribute('disabled');
            }
        }

        const modeButton = root.querySelector('.mode-button') as HTMLButtonElement;
        if (modeButton) {
            if (disabled) {
                modeButton.disabled = true;
            } else {
                modeButton.disabled = false;
            }
        }

        const clearButton = root.querySelector('.color-clear') as HTMLButtonElement;
        if (clearButton) {
            if (disabled) {
                clearButton.disabled = true;
            } else {
                clearButton.disabled = this.hasAttribute('readonly');
            }
        }

        this.setOpen(false);
    }

    formResetCallback() { this.setValue(this._initialValue); }

    formStateRestoreCallback(state: string | File | FormData | null, _mode: 'restore' | 'autocomplete') {
        if (typeof state === 'string') {
            this.setValue(state);
        } else if (state == null) {
            this.clear();
        }
    }

    checkValidity() { return this._internals.checkValidity(); }

    reportValidity() { return this._internals.reportValidity(); }

    reset() {
        this._internals.states.delete('touched');
        this._value = this._initialValue;
        if (this._value) {
            this.setValue(this._value);
        } else {
            this.clear();
        }
    }

    protected clear() {
        const root = this.shadowRoot;
        if (!root) {
            return;
        }

        this._settingValue = true;

        const hueSlider = root.querySelector('tf-slider.hue') as TavenemSliderHTMLElement;
        if (hueSlider) {
            hueSlider.value = '0';
        }

        const alphaSlider = root.querySelector('tf-slider.alpha') as TavenemSliderHTMLElement;
        if (alphaSlider) {
            alphaSlider.value = '0';
        }

        const hexInput = root.querySelector('.hex') as TavenemInputFieldHtmlElement;
        if (hexInput) {
            hexInput.value = '';
        }

        const hueInput = root.querySelector('tf-input-field.hue') as TavenemInputFieldHtmlElement;
        if (hueInput) {
            hueInput.value = '0';
        }

        const saturationInput = root.querySelector('.saturation') as TavenemInputFieldHtmlElement;
        if (saturationInput) {
            saturationInput.value = '0';
        }

        const lightnessInput = root.querySelector('.lightness') as TavenemInputFieldHtmlElement;
        if (lightnessInput) {
            lightnessInput.value = '0';
        }

        const redInput = root.querySelector('.red') as TavenemInputFieldHtmlElement;
        if (redInput) {
            redInput.value = '0';
        }

        const greenInput = root.querySelector('.green') as TavenemInputFieldHtmlElement;
        if (greenInput) {
            greenInput.value = '0';
        }

        const blueInput = root.querySelector('.blue') as TavenemInputFieldHtmlElement;
        if (blueInput) {
            blueInput.value = '0';
        }

        const alphaInput = root.querySelector('tf-input-field.alpha') as TavenemInputHtmlElement;
        if (alphaInput) {
            alphaInput.value = '0';
        }

        const swatches = root.querySelectorAll('.swatch-fill');
        for (const swatch of swatches) {
            if (swatch instanceof HTMLElement) {
                swatch.style.background = 'transparent';
                swatch.classList.add('transparent');
            }
        }

        this._selectorX = overlayWidth;
        this._selectorY = overlayHeight / 2;

        const selector = root.querySelector('.color-selector') as SVGSVGElement;
        if (selector) {
            selector.style.transform = `translate(${this._selectorX.toFixed(0)}px, ${this._selectorY.toFixed(0)}px)`;
        }

        const overlay = root.querySelector('.color-overlay');
        if (overlay instanceof HTMLElement) {
            overlay.style.backgroundColor = this.hasAttribute('disabled')
                ? 'hsl(0 20 50)'
                : 'hsl(0 100 50)';
        }

        const input = root.querySelector('.input') as TavenemInputHtmlElement;
        if (input) {
            input.value = '';
        }

        this._value = '';
        this._internals.setFormValue(null);
        this._internals.states.add('empty');
        this._internals.states.delete('has-value');
        this.setValidity();
        this.dispatchEvent(TavenemPickerHtmlElement.newValueChangeEvent(''));

        this._settingValue = false;
    }

    protected stringValue() { return this._value; }

    private onAlphaInput(event: Event) {
        event.preventDefault();
        event.stopPropagation();

        if (this._settingValue
            || !(event.target instanceof TavenemSliderHTMLElement)) {
            return;
        }
        this._internals.states.add('touched');
        this.onHSLAChanged(
            undefined,
            undefined,
            undefined,
            event.target.value);
    }

    private onAlphaValueInput(event: Event) {
        event.preventDefault();
        event.stopPropagation();

        if (!this._settingValue
            && event instanceof CustomEvent
            && event.detail) {
            this._internals.states.add('touched');
            this.onHSLAChanged(
                undefined,
                undefined,
                undefined,
                event.detail.value);
        }
    }

    private onBlueValueInput(event: Event) {
        event.preventDefault();
        event.stopPropagation();

        if (!this._settingValue
            && event instanceof CustomEvent
            && event.detail) {
            this._internals.states.add('touched');
            this.onRGBChanged(undefined, undefined, event.detail.value);
        }
    }

    private onClearButton(event: Event) {
        event.preventDefault();
        event.stopPropagation();

        if (!this.matches(':disabled')
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
        event.preventDefault();
        event.stopPropagation();

        if (this.hasAttribute('disabled')
            || this.hasAttribute('readonly')) {
            return;
        }
        new EyeDropper()
            .open()
            .then((result) => {
                this._internals.states.add('touched');
                this.setValue(result.sRGBHex);
            });
    }

    private onGreenValueInput(event: Event) {
        event.preventDefault();
        event.stopPropagation();

        if (!this._settingValue
            && event instanceof CustomEvent
            && event.detail) {
            this._internals.states.add('touched');
            this.onRGBChanged(undefined, event.detail.value);
        }
    }

    private onHexValueChange(event: Event) {
        event.preventDefault();
        event.stopPropagation();

        if (!this._settingValue) {
            this._internals.states.add('touched');
            this.setValue(event instanceof CustomEvent
                ? event.detail.value
                : null);
        }
    }

    private onHSLAChanged(newHue?: string, newSaturation?: string, newLightness?: string, newAlpha?: string) {
        let hsla: HSLA | null = null;
        if (this._value) {
            const colors = hexToHsla(this._value);
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
        event.preventDefault();
        event.stopPropagation();

        if (!this._settingValue
            && event.target instanceof TavenemSliderHTMLElement) {
            this._internals.states.add('touched');
            this.onHSLAChanged(event.target.value);
        }
    }

    private onHueValueInput(event: Event) {
        event.preventDefault();
        event.stopPropagation();

        if (!this._settingValue
            && event instanceof CustomEvent
            && event.detail) {
            this._internals.states.add('touched');
            this.onHSLAChanged(event.detail.value);
        }
    }

    private onLightnessValueInput(event: Event) {
        event.preventDefault();
        event.stopPropagation();

        if (!this._settingValue
            && event instanceof CustomEvent
            && event.detail) {
            this._internals.states.add('touched');
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

        this._internals.states.add('touched');
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
        event.preventDefault();
        event.stopPropagation();

        if (!this._settingValue
            && event instanceof CustomEvent
            && event.detail) {
            this._internals.states.add('touched');
            this.onRGBChanged(event.detail.value);
        }
    }

    private onRGBChanged(newRed?: string, newGreen?: string, newBlue?: string) {
        let rgba: RGBA | null = null;
        if (this._value) {
            rgba = hexToRgba(this._value);
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

        const hsla = rgbaToHsla(rgba);
        if (hsla) {
            this.setValueFromHSLA(hsla, rgba);
        }
    }

    private onSaturationValueInput(event: Event) {
        event.preventDefault();
        event.stopPropagation();

        if (!this._settingValue
            && event instanceof CustomEvent
            && event.detail) {
            this._internals.states.add('touched');
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
        this._internals.states.add('touched');
        this.updateColorFromSelector();
    }

    private setValidity() {
        const flags: ValidityStateFlags = {};
        const messages: string[] = [];

        if (!this._value) {
            const root = this.shadowRoot;
            const input = root ? root.querySelector('.input') as TavenemInputHtmlElement : null;
            const value = input ? input.value : null;
            if (value) {
                flags.badInput = true;
                messages.push('value cannot be converted to a color');
            }
            if (this.hasAttribute('required')) {
                flags.valueMissing = true;
                messages.push('required');
            }
        }

        if (Object.keys(flags).length > 0) {
            this._internals.setValidity(flags, messages.join('; '), this.shadowRoot?.querySelector('.input') || undefined);
        } else {
            this._internals.setValidity({});
        }

        const root = this.shadowRoot;
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
        if (!value || !value.length) {
            this.clear();
            return;
        }

        const colors = hexToHsla(value);
        if (!colors) {
            this.clear();

            const root = this.shadowRoot;
            let input: TavenemInputHtmlElement | null | undefined;
            if (root) {
                input = root.querySelector<TavenemInputHtmlElement>('.input');
                if (input) {
                    input.display = value;
                }
            }

            this._internals.setFormValue(null);
            this._internals.setValidity({
                badInput: true,
            }, 'value cannot be converted to a date/time', input || undefined);

            if (value.length) {
                this._internals.states.delete('empty');
                this._internals.states.add('has-value');
            } else {
                this._internals.states.add('empty');
                this._internals.states.delete('has-value');
            }
        } else {
            this.setValueFromHSLA(colors.hsla, colors.rgba);
        }
    }

    private setValueFromHSLA(hsla: HSLA, rgba?: RGBA | null) {
        this._selectorX = hsla.saturation / 100 * overlayWidth;
        this._selectorY = (1 - (hsla.lightness / 100)) * overlayHeight;

        const hasAlpha = this.hasAttribute('alpha');
        const hex = hslaToHex(hsla, hasAlpha) || '';
        this._value = hex;
        this._internals.setFormValue(hex.length ? hex : null);
        this.dispatchEvent(TavenemPickerHtmlElement.newValueChangeEvent(hex));

        const root = this.shadowRoot;
        if (!root) {
            this.setValidity();
            return;
        }

        this._settingValue = true;

        if (!rgba) {
            rgba = hexToRgba(hex)
                || {
                red: 0,
                green: 0,
                blue: 0,
                alpha: hasAlpha ? 0 : undefined,
            };
        }

        const hue = hsla.hue.toString();
        const hueSlider = root.querySelector('tf-slider.hue') as TavenemSliderHTMLElement;
        if (hueSlider && hueSlider.value != hue) {
            hueSlider.value = hue;
        }

        const alpha = (hsla.alpha || 0).toString();
        const alphaSlider = root.querySelector('tf-slider.alpha') as TavenemSliderHTMLElement;
        if (alphaSlider) {
            alphaSlider.style.setProperty('--alpha-background', `linear-gradient(to right, transparent, hsl(${hsla.hue} 100 50))`);

            if (alphaSlider.value != alpha) {
                alphaSlider.value = alpha;
            }
        }

        const selector = root.querySelector('.color-selector') as SVGSVGElement;
        if (selector) {
            selector.style.transform = `translate(${this._selectorX.toFixed(0)}px, ${this._selectorY.toFixed(0)}px)`;
        }

        const input = root.querySelector('.input') as TavenemInputHtmlElement;
        if (input) {
            input.value = hex;

            const colorName = rgbaToColorName(rgba);
            if (colorName) {
                input.display = colorName;
            }
        }
        if (input.value.length || (input.display && input.display.length)) {
            this._internals.states.delete('empty');
            this._internals.states.add('has-value');
        } else {
            this._internals.states.add('empty');
            this._internals.states.delete('has-value');
        }

        this.setValidity();

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

        const hexInput = root.querySelector('.hex') as TavenemInputFieldHtmlElement;
        if (hexInput && hexInput.value != hex) {
            hexInput.value = hex;
        }

        const hueInput = root.querySelector('tf-input-field.hue') as TavenemInputFieldHtmlElement;
        if (hueInput && hueInput.value != hue) {
            hueInput.value = hue;
        }

        const saturation = hsla.saturation.toString();
        const saturationInput = root.querySelector('.saturation') as TavenemInputFieldHtmlElement;
        if (saturationInput && saturationInput.value != saturation) {
            saturationInput.value = saturation;
        }

        const lightness = hsla.lightness.toString();
        const lightnessInput = root.querySelector('.lightness') as TavenemInputFieldHtmlElement;
        if (lightnessInput && lightnessInput.value != lightness) {
            lightnessInput.value = lightness;
        }

        const red = rgba.red.toString();
        const redInput = root.querySelector('.red') as TavenemInputFieldHtmlElement;
        if (redInput && redInput.value != red) {
            redInput.value = red;
        }

        const green = rgba.green.toString();
        const greenInput = root.querySelector('.green') as TavenemInputFieldHtmlElement;
        if (greenInput && greenInput.value != green) {
            greenInput.value = green;
        }

        const blue = rgba.blue.toString();
        const blueInput = root.querySelector('.blue') as TavenemInputFieldHtmlElement;
        if (blueInput && blueInput.value != blue) {
            blueInput.value = blue;
        }

        const alphaInput = root.querySelector('tf-input-field.alpha') as TavenemInputFieldHtmlElement;
        if (alphaInput && alphaInput.value != alpha) {
            alphaInput.value = alpha;
        }

        this._settingValue = false;
    }

    private stopEvent(event: Event) {
        event.preventDefault();
        event.preventDefault();
    }

    private updateColorFromSelector() {
        const x = Math.max(0, Math.min(1, this._selectorX / overlayWidth));
        const y = Math.max(0, Math.min(1, this._selectorY / overlayHeight));

        let hue = 0, alpha = 1;
        if (this._value) {
            const colors = hexToHsla(this._value);
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