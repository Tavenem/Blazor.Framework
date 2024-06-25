import { documentPositionComparator, randomUUID } from "./tavenem-utility";

export class TavenemCheckboxHtmlElement extends HTMLElement {
    static formAssociated = true;

    private _checked = false;
    private _indeterminate = false;
    private _internals: ElementInternals;
    private _settingValue = false;
    private _tabIndex: number = 0;
    private _value: string = '';

    static get observedAttributes() {
        return [
            'checked',
            'data-allow-null',
            'data-input-class',
            'data-input-style',
            'indeterminate',
            'readonly',
            'value',
        ];
    }

    constructor() {
        super();
        this._internals = this.attachInternals();
        this._internals.role = this.hasAttribute('radio') ? 'radio' : 'checkbox';
    }

    private static newToggleEvent(value: boolean | null) {
        return new CustomEvent('inputtoggle', { bubbles: true, composed: true, detail: { value: value } });
    }

    get checked() {
        if (this._checked) {
            return true;
        }
        if (this._indeterminate) {
            return null;
        }
        return false;
    }
    set checked(value: boolean | null) {
        const root = this.shadowRoot;
        if (!root) {
            return;
        }
        const input = root.querySelector('input');
        if (!(input instanceof HTMLInputElement)) {
            return;
        }

        this._settingValue = true;

        const isRadio = this.hasAttribute('radio');
        if (value) {
            if (input.checked) {
                this._settingValue = false;
                return;
            }
            this._checked = true;
            input.checked = true;
            this._indeterminate = false;
            input.indeterminate = false;
            this._internals.setFormValue(isRadio ? this._value : 'true');
            this._internals.ariaChecked = 'true';
            this._internals.states.add('checked');
            this._internals.states.delete('indeterminate');
            if (isRadio) {
                if (this.tabIndex < 0) {
                    this.tabIndex = this._tabIndex;
                }
            } else {
                input.value = 'true';
            }
            this.dispatchEvent(TavenemCheckboxHtmlElement.newToggleEvent(true));
        } else if (!isRadio && value == null) {
            if (input.indeterminate) {
                this._settingValue = false;
                return;
            }
            this._checked = false;
            input.checked = false;
            this._indeterminate = true;
            input.indeterminate = true;
            this._internals.setFormValue(null);
            this._internals.ariaChecked = 'mixed';
            this._internals.states.delete('checked');
            this._internals.states.add('indeterminate');
            input.value = '';
            this.dispatchEvent(TavenemCheckboxHtmlElement.newToggleEvent(null));
        } else {
            if (!input.checked && !input.indeterminate) {
                this._settingValue = false;
                return;
            }
            this._checked = false;
            input.checked = false;
            this._indeterminate = false;
            input.indeterminate = false;
            this._internals.setFormValue(isRadio ? null : 'false');
            this._internals.ariaChecked = 'false';
            this._internals.states.delete('checked');
            this._internals.states.delete('indeterminate');
            if (isRadio) {
                if (this.tabIndex >= 0) {
                    this.tabIndex = -1;
                }
            } else {
                input.value = 'false';
            }
            this.dispatchEvent(TavenemCheckboxHtmlElement.newToggleEvent(false));
        }

        this.setValidity(input);

        if (this._checked && isRadio && this.hasAttribute('name')) {
            const name = this.getAttribute('name');
            if (name) {
                document
                    .querySelectorAll<TavenemCheckboxHtmlElement>(`tf-checkbox[name="${name}"]`)
                    .forEach(x => {
                        if (x.checked && x != this) {
                            x.checked = false;
                        }
                    });
            }
        }

        this._settingValue = false;
    }

    get form() { return this._internals.form; }

    get name() { return this.getAttribute('name') || ''; }

    get required() { return this.hasAttribute('required'); }
    set required(value: boolean) {
        if (value) {
            this.setAttribute('required', '');
        } else {
            this.removeAttribute('required');
        }
    }

    get type() { return this.localName; }

    get validationMessage() { return this._internals.validationMessage; }

    get validity() { return this._internals.validity; }

    get value() {
        if (this.hasAttribute('radio')) {
            return this._value;
        }
        if (this._checked) {
            return 'true';
        }
        if ('allowNull' in this.dataset && this._indeterminate) {
            return 'null';
        }
        return 'false';
    }
    set value(v: string) {
        this._value = v || '';

        const isRadio = this.hasAttribute('radio');
        if (!isRadio) {
            if (!v || !v.length) {
                this._checked = false;
                this._indeterminate = 'allowNull' in this.dataset;
            } else if (v.toLowerCase() === 'null') {
                this._checked = false;
                this._indeterminate = true;
            } else if (v.toLowerCase() === 'false'
                || v.toLowerCase() === '0'
                || v.toLowerCase() === 'f') {
                this._checked = false;
                this._indeterminate = false;
            } else {
                this._checked = true;
                this._indeterminate = false;
            }
        }

        const root = this.shadowRoot;
        if (!root) {
            return;
        }
        const input = root.querySelector('input');
        if (!input) {
            return;
        }

        this._settingValue = true;

        if (isRadio) {
            input.value = this._value;
        }

        if (this._checked) {
            this._internals.setFormValue(isRadio ? this._value : 'true');
            this._internals.ariaChecked = 'true';
            this._internals.states.add('checked');
            this._internals.states.delete('indeterminate');
            if (isRadio) {
                if (this.tabIndex < 0) {
                    this.tabIndex = this._tabIndex;
                }
            } else {
                input.value = 'true';
            }
        } else if (!isRadio && this._indeterminate) {
            this._internals.setFormValue(null);
            this._internals.ariaChecked = 'mixed';
            this._internals.states.delete('checked');
            this._internals.states.add('indeterminate');
            input.value = '';
        } else {
            this._internals.setFormValue(isRadio ? null : 'false');
            this._internals.ariaChecked = 'false';
            this._internals.states.delete('checked');
            this._internals.states.delete('indeterminate');
            if (isRadio) {
                if (this.tabIndex >= 0) {
                    this.tabIndex = -1;
                }
            } else {
                input.value = 'false';
            }
        }

        this.setValidity(input);

        if (this._checked && isRadio && this.hasAttribute('name')) {
            const name = this.getAttribute('name');
            if (name) {
                document
                    .querySelectorAll<TavenemCheckboxHtmlElement>(`tf-checkbox[name="${name}"]`)
                    .forEach(x => {
                        if (x.checked && x != this) {
                            x.checked = false;
                        }
                    });
            }
        }

        this._settingValue = false;
    }

    get willValidate() { return this._internals.willValidate; }

    connectedCallback() {
        this._tabIndex = this.tabIndex;
        this._value = this.getAttribute('value') || '';

        const isRadio = this.hasAttribute('radio');

        const shadow = this.attachShadow({ mode: 'open', delegatesFocus: true });

        const style = document.createElement('style');
        style.textContent = `
:host {
    --button-inherited-padding-y-icon: 6px;
    border: 0;
    color: var(--tavenem-color-text);
    display: inline-flex;
    flex-basis: auto;
    flex-direction: column;
    flex-grow: 0;
    flex-shrink: 0;
    margin: 0;
    max-width: 100%;
    padding: 0;
    position: relative;
    vertical-align: top;
}

:host(:has(:focus-visible):not(.disabled, [inert])) {
    background-color: var(--checkbox-inherited-hover-bg, var(--tavenem-color-action-hover-bg));
}

:host(.small) {
    --button-inherited-font-size-icon: 1.25rem;
    --button-inherited-padding-y-icon: 5px;
}

:host(.large) {
    --button-inherited-font-size-icon: 2rem;
    --button-inherited-padding-y-icon: 5px;
}

:host(.dense) {
    --button-inherited-padding-y-icon: 2px;
}

:host(:disabled, [inert]) {
    --checkbox-inherited-color: var(--tavenem-color-action-disabled);
    --checkbox-inherited-hover-bg: transparent;
}

:host([readonly], [readonly]:hover) {
    --checkbox-inherited-hover-bg: transparent;
    cursor: default;
    pointer-events: none;

    * {
        cursor: default;
        pointer-events: none;
    }
}

:host(:invalid:state(touched)) {
    --checkbox-inherited-color: var(--tavenem-color-error);
    --checkbox-inherited-hover-bg: var(--tavenem-color-error-hover);
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
    --checkbox-inherited-color: var(--tavenem-theme-color);
    --checkbox-inherited-hover-bg: var(--tavenem-theme-color-hover);
    color: var(--tavenem-color-action);
}

*, *::before, *::after {
    box-sizing: border-box;
}

.checkbox {
    align-items: center;
    box-sizing: border-box;
    color: var(--checkbox-inherited-color, var(--tavenem-color-action));
    cursor: pointer;
    display: inline-flex;
    pointer-events: auto;
    position: relative;
    transform: none;
    vertical-align: middle;
    z-index: auto;
    -webkit-tap-highlight-color: transparent;
}

input {
    -webkit-appearance: none;
    appearance: none;
    background: none;
    border: none;
    border-radius: var(--tavenem-border-radius);
    box-shadow: none;
    box-sizing: content-box;
    color: currentColor;
    cursor: inherit;
    display: block;
    font: inherit;
    height: 100%;
    left: 0;
    margin: 0;
    min-height: calc(1.25rem + 10px);
    min-width: 0;
    opacity: var(--tavenem-field-input-opacity, unset);
    overflow: visible;
    padding: 0;
    position: absolute;
    top: 0;
    transition: border-color .15s ease-in-out, box-shadow .15s ease-in-out;
    width: 100%;
    z-index: 1;
    -webkit-tap-highlight-color: transparent;

    &:focus {
        outline: 0;
    }

    &:disabled,
    &[readonly] {
        opacity: 1;
    }
}

input:-webkit-autofill {
    border-radius: inherit;
}

::-moz-focus-inner {
    padding: 0;
    border-style: none;
}

.btn {
    --button-hover-bg: var(--tavenem-color-action-hover-bg);
    --button-hover-color: inherit;
    --button-padding-x: 6px;
    --button-padding-y: 6px;
    align-items: center;
    background-color: transparent;
    border: none;
    border-radius: 9999px;
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
    min-width: calc(1.5rem + (var(--button-padding-x) * 2));
    outline: 0;
    overflow: hidden;
    padding: var(--button-padding-y) var(--button-padding-x);
    position: relative;
    text-align: center;
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
        transform: scale(7,7);
        transition: transform .3s,opacity 1s;
        width: 100%;
    }

    &:hover,
    &:focus-visible {
        background-color: var(--checkbox-inherited-hover-bg, var(--tavenem-color-action-hover-bg));
        color: var(--button-hover-color);
    }

    &:active:after {
        transform: scale(0,0);
        opacity: .1;
        transition: 0s;
    }

    :host(.primary) &,
    :host(.secondary) &,
    :host(.tertiary) &,
    :host(.danger) &,
    :host(.dark) &,
    :host(.default) &,
    :host(.info) &,
    :host(.success) &,
    :host(.warning) & {
        --button-hover-bg: var(--tavenem-theme-color-hover);
        --button-hover-color: var(--tavenem-theme-color);
    }
}
.btn::-moz-focus-inner {
    border-style: none;
}

::slotted(tf-icon) {
    color: var(--checkbox-inherited-color, var(--tavenem-color-action)) !important;
    font-size: inherit !important;

    &:hover {
        background-color: var(--checkbox-inherited-hover-bg, var(--tavenem-color-action-hover-bg)) !important;
    }
}

svg {
    color: var(--checkbox-inherited-color, var(--tavenem-color-action));
    height: 1.5em;
    fill: currentColor;
    flex-shrink: 0;
    max-height: 1em;
    width: auto;

    &:hover {
        background-color: var(--checkbox-inherited-hover-bg, var(--tavenem-color-action-hover-bg));
    }
}

slot[name="checked"],
slot[name="indeterminate"] {
    display: none;
}

:host(:state(checked)) {
    slot[name="checked"] {
        display: contents;
    }

    slot[name="unchecked"] {
        display: none;
    }
}

:host(:state(indeterminate)) {
    slot[name="indeterminate"] {
        display: contents;
    }

    slot[name="unchecked"] {
        display: none;
    }
}

label {
    display: inline-block;
}

.field-helpers {
    color: var(--checkbox-inherited-color, var(--tavenem-color-action));
    display: none;
    font-size: 0.75rem;
    font-weight: var(--tavenem-font-weight);
    line-height: 1.66;
    margin-top: 3px;
    overflow: hidden;
    padding-inline-start: var(--button-inherited-padding-y-icon);
    text-align: start;

    :has(slot::slotted(*)) {
        display: flex;
    }
}

:host([readonly]) {
    cursor: default;
    pointer-events: none;

    * {
        cursor: default;
        pointer-events: none;
    }
}

:host([required]) label:after {
    color: var(--tavenem-color-error);
    content: " *";
}

:host([disabled]), :host([inert]) {
    background-color: transparent;
    color: var(--tavenem-color-action-disabled);
    cursor: default;

    * {
        background-color: transparent;
        color: var(--tavenem-color-text-disabled);
        cursor: default;
    }

    svg,
    ::slotted(tf-icon) {
        color: var(--tavenem-color-action-disabled) !important;
    }
}`;
        shadow.appendChild(style);

        const field = document.createElement('div');
        field.classList.add('checkbox');
        shadow.appendChild(field);

        const span = document.createElement('span');
        span.classList.add('btn');
        field.appendChild(span);

        const input = document.createElement('input');

        input.autofocus = this.hasAttribute('autofocus');

        if (this.hasAttribute('checked')) {
            this._checked = true;
            input.checked = true;
            this._internals.setFormValue(isRadio ? this._value : 'true');
            this._internals.ariaChecked = 'true';
            this._internals.states.add('checked');
            this._internals.states.delete('indeterminate');
        } else if (!isRadio && this.hasAttribute('indeterminate')) {
            this._indeterminate = true;
            input.indeterminate = true;
            input.multiple = true;
            this._internals.setFormValue(null);
            this._internals.ariaChecked = 'mixed';
            this._internals.states.delete('checked');
            this._internals.states.add('indeterminate');
        } else {
            this._internals.setFormValue(isRadio ? null : 'false');
            this._internals.ariaChecked = 'false';
            this._internals.states.delete('checked');
            this._internals.states.delete('indeterminate');
        }
        input.className = this.dataset.inputClass || '';
        input.disabled = this.hasAttribute('disabled');

        const inputId = randomUUID();
        input.id = inputId;

        input.readOnly = this.hasAttribute('readonly');
        input.style.cssText = this.dataset.inputStyle || '';
        if (this.hasAttribute('tabindex')) {
            const tabIndexValue = this.getAttribute('tabindex');
            if (tabIndexValue) {
                const tabIndex = parseInt(tabIndexValue);
                input.tabIndex = tabIndex;
            }
        }

        input.type = isRadio ? 'radio' : 'checkbox';

        if (isRadio) {
            input.value = this._value;
            if (!this._checked) {
                this.tabIndex = -1;
            }
        } else if (this._checked) {
            input.value = 'true';
        } else if (this._indeterminate) {
            input.value = '';
        } else {
            input.value = 'false';
        }

        span.appendChild(input);

        const checkedSlot = document.createElement('slot');
        checkedSlot.name = 'checked'
        span.appendChild(checkedSlot);

        const checkedIcon = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
        checkedIcon.setAttributeNS(null, 'viewBox', '0 -960 960 960');
        checkedIcon.setAttributeNS(null, 'height', '48');
        checkedIcon.setAttributeNS(null, 'width', '48');
        if (isRadio) {
            checkedIcon.innerHTML = 'checkedOutlined' in this.dataset
                ? '<path d="M480-294q78 0 132-54t54-132q0-78-54-132t-132-54q-78 0-132 54t-54 132q0 78 54 132t132 54Zm0 214q-82 0-155-31.5t-127.5-86Q143-252 111.5-325T80-480q0-83 31.5-156t86-127Q252-817 325-848.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 82-31.5 155T763-197.5q-54 54.5-127 86T480-80Zm0-60q142 0 241-99.5T820-480q0-142-99-241t-241-99q-141 0-240.5 99T140-480q0 141 99.5 240.5T480-140Zm0-340Z"/>'
                : '<path d="M480-294q78 0 132-54t54-132q0-78-54-132t-132-54q-78 0-132 54t-54 132q0 78 54 132t132 54Zm0 214q-82 0-155-31.5t-127.5-86Q143-252 111.5-325T80-480q0-83 31.5-156t86-127Q252-817 325-848.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 82-31.5 155T763-197.5q-54 54.5-127 86T480-80Z"/>';
        } else {
            checkedIcon.innerHTML = 'checkedOutlined' in this.dataset
                ? '<path d="m419-321 289-289-43-43-246 246-119-119-43 43 162 162ZM180-120q-24 0-42-18t-18-42v-600q0-24 18-42t42-18h600q24 0 42 18t18 42v600q0 24-18 42t-42 18H180Zm0-60h600v-600H180v600Zm0-600v600-600Z"/>'
                : '<path d="m419-321 289-290-43-43-246 247-119-119-43 43 162 162ZM180-120q-24 0-42-18t-18-42v-600q0-24 18-42t42-18h600q24 0 42 18t18 42v600q0 24-18 42t-42 18H180Z"/>';
        }
        checkedSlot.appendChild(checkedIcon);

        const uncheckedSlot = document.createElement('slot');
        uncheckedSlot.name = 'unchecked'
        span.appendChild(uncheckedSlot);

        const uncheckedIcon = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
        uncheckedIcon.setAttributeNS(null, 'viewBox', '0 -960 960 960');
        uncheckedIcon.setAttributeNS(null, 'height', '48');
        uncheckedIcon.setAttributeNS(null, 'width', '48');
        if (isRadio) {
            uncheckedIcon.innerHTML = 'uncheckedOutlined' in this.dataset
                ? '<path d="M480-80q-82 0-155-31.5t-127.5-86Q143-252 111.5-325T80-480q0-83 31.5-156t86-127Q252-817 325-848.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 82-31.5 155T763-197.5q-54 54.5-127 86T480-80Zm0-60q142 0 241-99.5T820-480q0-142-99-241t-241-99q-141 0-240.5 99T140-480q0 141 99.5 240.5T480-140Zm0-340Z"/>'
                : '<path d="M480-80q-82 0-155-31.5t-127.5-86Q143-252 111.5-325T80-480q0-83 31.5-156t86-127Q252-817 325-848.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 82-31.5 155T763-197.5q-54 54.5-127 86T480-80Zm0-60q142 0 241-99.5T820-480q0-142-99-241t-241-99q-141 0-240.5 99T140-480q0 141 99.5 240.5T480-140Zm0 0q-141 0-240.5-99.5T140-480q0-142 99.5-241T480-820q142 0 241 99t99 241q0 141-99 240.5T480-140Z"/>';
        } else {
            uncheckedIcon.innerHTML = '<path d="M180-120q-24 0-42-18t-18-42v-600q0-24 18-42t42-18h600q24 0 42 18t18 42v600q0 24-18 42t-42 18H180Zm0-60h600v-600H180v600Z"/>';
        }
        uncheckedSlot.appendChild(uncheckedIcon);

        const indeterminateSlot = document.createElement('slot');
        indeterminateSlot.name = 'indeterminate'
        span.appendChild(indeterminateSlot);

        const indeterminateIcon = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
        indeterminateIcon.setAttributeNS(null, 'viewBox', '0 -960 960 960');
        indeterminateIcon.setAttributeNS(null, 'height', '48');
        indeterminateIcon.setAttributeNS(null, 'width', '48');
        indeterminateIcon.innerHTML = 'indeterminateOutlined' in this.dataset
            ? '<path d="M250-452h461v-60H250v60Zm-70 332q-24 0-42-18t-18-42v-600q0-24 18-42t42-18h600q24 0 42 18t18 42v600q0 24-18 42t-42 18H180Zm0-60h600v-600H180v600Zm0-600v600-600Z"/>'
            : '<path d="M250-452h461v-60H250v60Zm-70 332q-24 0-42-18t-18-42v-600q0-24 18-42t42-18h600q24 0 42 18t18 42v600q0 24-18 42t-42 18H180Z"/>';
        indeterminateSlot.appendChild(indeterminateIcon);

        if ('label' in this.dataset
            && this.dataset.label
            && this.dataset.label.length) {
            const label = document.createElement('label');
            label.htmlFor = inputId;
            label.textContent = this.dataset.label;
            field.appendChild(label);
        } else {
            const labelSlot = document.createElement('slot');
            labelSlot.name = 'label'
            field.appendChild(labelSlot);
        }

        const helpers = document.createElement('div');
        helpers.classList.add('field-helpers');
        field.appendChild(helpers);

        const helperSlot = document.createElement('slot');
        helperSlot.name = 'helpers';
        helpers.appendChild(helperSlot);

        const slot = document.createElement('slot');
        shadow.appendChild(slot);

        if (this.hasAttribute('value')
            && this.getAttribute('value')?.length
            && !this.hasAttribute('checked')
            && !this.hasAttribute('indeterminate')) {
            this.value = this.getAttribute('value') || '';
        }

        this.setValidity(input);

        input.addEventListener('change', this.onChange.bind(this));
        input.addEventListener('input', this.onChange.bind(this));

        if (isRadio) {
            this.addEventListener('keypress', this.onKeyPress.bind(this));
        }
    }

    disconnectedCallback() {
        this.removeEventListener('keypress', this.onKeyPress.bind(this));

        const root = this.shadowRoot;
        if (root) {
            const input = root.querySelector('input');
            if (input) {
                input.removeEventListener('change', this.onChange.bind(this));
                input.removeEventListener('input', this.onChange.bind(this));
            }
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
        const input = root.querySelector('input');
        if (!(input instanceof HTMLInputElement)) {
            return;
        }

        const isRadio = this.hasAttribute('radio');

        if (name === 'checked') {
            this.checked = !!newValue;
        } else if (name === 'data-allow-null') {
            if (!!newValue
                && this.hasAttribute('indeterminate')
                && !this.hasAttribute('checked')) {
                this._settingValue = true;
                this._checked = false;
                input.checked = false;
                this._indeterminate = true;
                input.indeterminate = true;
                this._internals.setFormValue(null);
                this._internals.ariaChecked = 'mixed';
                this._internals.states.delete('checked');
                this._internals.states.add('indeterminate');
                input.value = '';
                this.dispatchEvent(TavenemCheckboxHtmlElement.newToggleEvent(null));
                this._settingValue = false;

                this.setValidity(input);
            }
        } else if (name === 'data-input-class') {
            input.className = newValue || '';
        } else if (name === 'data-input-style') {
            input.style.cssText = newValue || '';
        } else if (name === 'indeterminate') {
            if (input.indeterminate != !!newValue) {
                this._settingValue = true;
                if (newValue) {
                    this._checked = false;
                    input.checked = false;
                    this._indeterminate = true;
                    input.indeterminate = true;
                    this._internals.setFormValue(null);
                    this._internals.ariaChecked = 'mixed';
                    this._internals.states.delete('checked');
                    this._internals.states.add('indeterminate');
                    input.value = '';
                    this.dispatchEvent(TavenemCheckboxHtmlElement.newToggleEvent(null));
                } else {
                    this._indeterminate = false;
                    input.indeterminate = false;
                    this._internals.states.delete('indeterminate');
                    if (this._checked) {
                        this._internals.setFormValue(isRadio ? this._value : 'true');
                    } else {
                        this._internals.setFormValue(isRadio ? null : 'false');
                    }
                    this._internals.ariaChecked = 'false';
                    if (isRadio) {
                        if (this._checked) {
                            if (this.tabIndex < 0) {
                                this.tabIndex = this._tabIndex;
                            }
                        } else if (this.tabIndex >= 0) {
                            this.tabIndex = -1;
                        }
                    } else {
                        input.value = this._checked ? 'true' : 'false';
                    }
                    this.dispatchEvent(TavenemCheckboxHtmlElement.newToggleEvent(this._checked));
                }

                this.setValidity(input);

                this._settingValue = false;
            }
        } else if (name === 'readonly') {
            input.readOnly = !!newValue;
        } else if (name === 'required') {
            if (!!newValue
                && (this._indeterminate
                    || ('requiresTrue' in this.dataset
                        && !this._checked))) {
                this._internals.setValidity({
                    valueMissing: true,
                }, 'required', input);
            } else {
                this._internals.setValidity({});
            }
        } else if (name === 'value') {
            if (newValue && newValue.length) {
                this.value = newValue || '';
            }
        }
    }

    formDisabledCallback(disabled: boolean) {
        const root = this.shadowRoot;
        if (!root) {
            return;
        }
        const input = root.querySelector('input');
        if (!(input instanceof HTMLInputElement)) {
            return;
        }
        input.disabled = disabled;
    }

    formResetCallback() { this.reset(); }

    formStateRestoreCallback(state: string | File | FormData | null, mode: 'restore' | 'autocomplete') {
        if (typeof state === 'string') {
            this.value = state;
        } else if (state == null) {
            this._checked = false;
            this._indeterminate = 'allowNull' in this.dataset;
            this._internals.states.delete('checked');

            const isRadio = this.hasAttribute('radio');

            const root = this.shadowRoot;
            if (!root) {
                return;
            }
            const input = root.querySelector('input');
            if (!input) {
                return;
            }

            this._settingValue = true;

            if (!isRadio && this._indeterminate) {
                this._internals.setFormValue(null);
                this._internals.states.add('indeterminate');
                input.value = '';
            } else {
                this._internals.setFormValue(isRadio ? null : 'false');
                this._internals.states.delete('indeterminate');
                if (isRadio) {
                    if (this.tabIndex >= 0) {
                        this.tabIndex = -1;
                    }
                } else {
                    input.value = 'false';
                }
            }

            this.setValidity(input);

            this._settingValue = false;
        }
    }

    checkValidity() { return this._internals.checkValidity(); }

    focusInnerInput() {
        const root = this.shadowRoot;
        if (!root) {
            this.focus();
            return;
        }
        const input = root.querySelector('input');
        if (input instanceof HTMLElement) {
            input.focus();
            return;
        }
        this.focus();
    }

    reportValidity() { return this._internals.reportValidity(); }

    reset() {
        const root = this.shadowRoot;
        if (!root) {
            return;
        }
        const input = root.querySelector('input');
        if (!(input instanceof HTMLInputElement)) {
            return;
        }

        this._settingValue = true;

        this._internals.states.delete('touched');

        const isRadio = this.hasAttribute('radio');

        if (this.hasAttribute('checked')) {
            if (this._checked) {
                this._settingValue = false;
                return;
            }
            this._checked = true;
            input.checked = true;
            this._indeterminate = false;
            input.indeterminate = false;
            this._internals.setFormValue(isRadio ? this._value : 'true');
            this._internals.states.add('checked');
            this._internals.states.delete('indeterminate');
            this._internals.ariaChecked = 'true';
            if (isRadio) {
                if (this.tabIndex < 0) {
                    this.tabIndex = this._tabIndex;
                }
            } else {
                input.value = 'true';
            }
            this.dispatchEvent(TavenemCheckboxHtmlElement.newToggleEvent(true));
        } else if (!isRadio
            && this.hasAttribute('indeterminate')) {
            if (!this._checked && this._indeterminate) {
                this._settingValue = false;
                return;
            }
            this._checked = false;
            input.checked = false;
            this._indeterminate = true;
            input.indeterminate = true;
            this._internals.setFormValue(null);
            this._internals.ariaChecked = 'mixed';
            this._internals.states.delete('checked');
            this._internals.states.add('indeterminate');
            input.value = '';
            this.dispatchEvent(TavenemCheckboxHtmlElement.newToggleEvent(null));
        } else if (this._checked || this._indeterminate) {
            this._checked = false;
            input.checked = false;
            this._indeterminate = false;
            input.indeterminate = false;
            this._internals.states.delete('checked');
            this._internals.states.delete('indeterminate');
            this._internals.setFormValue(isRadio ? null : 'false');
            this._internals.ariaChecked = 'false';
            if (isRadio) {
                if (this.tabIndex >= 0) {
                    this.tabIndex = -1;
                }
            } else {
                input.value = 'false';
            }
            this.dispatchEvent(TavenemCheckboxHtmlElement.newToggleEvent(false));
        }

        this.setValidity(input);

        this._settingValue = false;
    }

    private onChange() {
        if (this._settingValue) {
            return;
        }

        const root = this.shadowRoot;
        if (!root) {
            return;
        }
        const input = root.querySelector('input');
        if (!(input instanceof HTMLInputElement)
            || (input.checked === this._checked
                && input.indeterminate === this._indeterminate)) {
            return;
        }

        this._settingValue = true;

        this._internals.states.add('touched');

        const isRadio = this.hasAttribute('radio');

        if (input.checked) {
            if (this._indeterminate) {
                this._checked = false;
                input.checked = false;
                this._indeterminate = false;
                input.indeterminate = false;
                this._internals.setFormValue(isRadio ? null : 'false');
                this._internals.ariaChecked = 'false';
                this._internals.states.delete('checked');
                this._internals.states.delete('indeterminate');
                if (isRadio) {
                    if (this.tabIndex >= 0) {
                        this.tabIndex = -1;
                    }
                } else {
                    input.value = 'false';
                }
            } else {
                this._checked = true;
                this._indeterminate = false;
                this._internals.setFormValue(isRadio ? this._value : 'true');
                this._internals.ariaChecked = 'true';
                this._internals.states.add('checked');
                this._internals.states.delete('indeterminate');
                if (isRadio) {
                    if (this.tabIndex < 0) {
                        this.tabIndex = this._tabIndex;
                    }
                } else {
                    input.value = 'true';
                }
            }
        } else {
            this._checked = false;
            this._internals.states.delete('checked');

            if (!isRadio
                && 'allowNull' in this.dataset
                && !this._indeterminate) {
                this._indeterminate = true;
                input.indeterminate = true;
                this._internals.setFormValue(null);
                this._internals.ariaChecked = 'mixed';
                this._internals.states.add('indeterminate');
                input.value = '';
            }

            if (!this._indeterminate) {
                this._indeterminate = false;
                input.indeterminate = false;
                this._internals.setFormValue(isRadio ? null : 'false');
                this._internals.ariaChecked = 'false';
                this._internals.states.delete('indeterminate');
                if (isRadio) {
                    if (this.tabIndex >= 0) {
                        this.tabIndex = -1;
                    }
                } else {
                    input.value = 'false';
                }
            }
        }

        this.setValidity(input);

        if (this._checked) {
            this.dispatchEvent(TavenemCheckboxHtmlElement.newToggleEvent(true));
        } else if (this._indeterminate) {
            this.dispatchEvent(TavenemCheckboxHtmlElement.newToggleEvent(null));
        } else {
            this.dispatchEvent(TavenemCheckboxHtmlElement.newToggleEvent(false));
        }

        if (this._checked && isRadio && this.hasAttribute('name')) {
            const name = this.getAttribute('name');
            if (name) {
                document
                    .querySelectorAll<TavenemCheckboxHtmlElement>(`tf-checkbox[name="${name}"]`)
                    .forEach(x => {
                        if (x.checked && x != this) {
                            x.checked = false;
                        }
                    });
            }
        }

        this._settingValue = false;
    }

    private onKeyPress(event: KeyboardEvent) {
        if (!event
            || !this.hasAttribute('radio')
            || (event.key !== 'ArrowDown'
            && event.key !== 'ArrowLeft'
            && event.key !== 'ArrowRight'
            && event.key !== 'ArrowUp')) {
            return;
        }

        const name = this.getAttribute('name');
        if (!name) {
            return;
        }

        const group = document.querySelectorAll<TavenemCheckboxHtmlElement>(`tf-checkbox[radio][name="${name}"]`);
        if (group.length <= 1) {
            return;
        }

        const groupArray = Array
            .from(group)
            .sort(documentPositionComparator);

        const index = groupArray.indexOf(this);
        if (index === -1) {
            return;
        }

        event.stopPropagation();
        event.preventDefault();

        let newIndex: number;
        if (event.key === 'ArrowLeft'
            || event.key === 'ArrowUp') {
            newIndex = index === 0
                ? groupArray.length - 1
                : index - 1;
        } else {
            newIndex = index === groupArray.length - 1
                ? 0
                : index + 1;
        }

        const newTarget = groupArray[newIndex];
        newTarget.tabIndex = newTarget._tabIndex;
        this.tabIndex = -1;
        newTarget.focusInnerInput();
    }

    private setValidity(input?: HTMLInputElement | null) {
        if (!input) {
            const root = this.shadowRoot;
            if (root) {
                input = root.querySelector('input');
            }
        }
        if (this.hasAttribute('required')
            && (this._indeterminate
                || ('requiresTrue' in this.dataset
                    && !this._checked))) {
            this._internals.setValidity({
                valueMissing: true,
            }, 'required', input || undefined);
        } else {
            this._internals.setValidity({});
        }
    }
}
