import { randomUUID } from "../tavenem-utility";

export class TavenemSwitchHtmlElement extends HTMLElement {
    static formAssociated = true;
    static style = `
:host {
    --button-inherited-padding-y-icon: 6px;
    display: inline-flex;
    flex: 0 0 auto;
    flex-direction: column;
    margin: 0;
}

:host(:has(:focus-visible):not(.disabled, [inert])) {
    background-color: var(--switch-inherited-hover-bg, var(--tavenem-color-action-hover-bg));
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

:host(.filled) {
    background-color: transparent;
    color: var(--tavenem-color-action);
}

:host(.outlined) {
    border-style: none;
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
    --switch-inherited-active-color: var(--tavenem-theme-color);
    --switch-inherited-active-hover-bg: var(--tavenem-theme-color-hover);
    color: var(--tavenem-color-action);
}

:host(:disabled, [inert]) {
    --switch-inherited-color: var(--tavenem-color-action-disabled);
    --switch-inherited-active-color: var(--tavenem-color-action-disabled);
    --switch-inherited-hover-bg: transparent;
    --switch-inherited-active-hover-bg: transparent;

    .switch, .switch:hover, .switch:focus-visible {
        color: var(--tavenem-color-action-disabled);
        cursor: default;

        * {
            cursor: default;
        }

        * {
            color: var(--tavenem-color-text-disabled);
        }

        ::slotted(tf-icon) {
            var(--tavenem-light-color-text-disabled)) !important;
        }
    }

    .switch-track {
        opacity: .12;
    }
}

:host([readonly], [readonly]:hover) {
    --switch-inherited-hover-bg: transparent;
    cursor: default;
    pointer-events: none;

    * {
        cursor: default;
        pointer-events: none;
    }
}

:host(:invalid:state(touched)) {
    --switch-inherited-color: var(--tavenem-color-error);
    --switch-inherited-active-color: var(--tavenem-color-error);
    --switch-inherited-hover-bg: var(--tavenem-color-error-hover);
    --switch-inherited-active-hover-bg: var(--tavenem-color-error-hover);

    .switch {
        color: var(--tavenem-color-error);
    }
}

:host(:state(checked)) {
    --switch-inherited-color: var(--switch-inherited-active-color);
    --switch-inherited-hover-bg: var(--switch-inherited-active-hover-bg);
}

*, *::before, *::after {
    box-sizing: border-box;
}

.switch {
    align-items: center;
    cursor: pointer;
    display: inline-flex;
    margin-right: 16px;
    pointer-events: auto;
    position: relative;
    transform: none;
    vertical-align: middle;
    z-index: auto;
    -webkit-tap-highlight-color: transparent;

    &:after {
        transform: scale(7,7);
    }
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
    --button-hover-bg: var(--switch-inherited-hover-bg, var(--tavenem-color-action-hover-bg));
    --button-hover-color: inherit;
    --button-padding-x: 6px;
    --button-padding-y: 6px;
    align-items: center;
    background-color: transparent;
    border: none;
    border-radius: 9999px;
    box-sizing: border-box;
    color: var(--switch-inherited-color, var(--tavenem-color-action));
    cursor: pointer;
    display: inline-flex;
    flex: 0 0 auto;
    font-size: 1.5rem;
    font-weight: var(--tavenem-font-weight-semibold);
    gap: .25rem;
    justify-content: center;
    left: 0;
    line-height: 1;
    margin: 0;
    min-width: calc(1.5rem + (var(--button-padding-x) * 2));
    outline: 0;
    overflow: hidden;
    padding: 9px;
    position: absolute;
    text-align: center;
    text-decoration: none;
    text-transform: var(--tavenem-texttransform-button);
    top: 0;
    transition: left 150ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,transform 150ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
    user-select: none;
    vertical-align: middle;
    z-index: 1;
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

    &:focus-visible {
        color: var(--button-hover-color);
    }

    &:hover {
        background-color: var(--switch-inherited-hover-bg, var(--tavenem-color-action-hover-bg));
    }

    &:active:after {
        transform: scale(0,0);
        opacity: .1;
        transition: 0s;
    }

    &:has(> input:checked) {
        transform: translateX(20px);

        + .switch-track {
            opacity: .5;
        }
    }
}
.btn::-moz-focus-inner {
    border-style: none;
}

::slotted(tf-icon) {
    color: var(--tavenem-theme-color-text, var(--tavenem-light-color-text)) !important;
    font-size: 1rem !important;

    &:hover {
        background-color: var(--switch-inherited-hover-bg, var(--tavenem-color-action-hover-bg)) !important;
    }
}

slot[name="checked"] {
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

label {
    align-items: center;
    color: var(--tavenem-color-action);
    cursor: pointer;
    display: inline-flex;
    margin-right: 16px;
    pointer-events: auto;
    position: relative;
    transform: none;
    vertical-align: middle;
    z-index: auto;
    -webkit-tap-highlight-color: transparent;
}

.toggle {
    box-sizing: border-box;
    display: inline-flex;
    flex-shrink: 0;
    height: 38px;
    overflow: hidden;
    padding: 12px;
    position: relative;
    width: 58px;
    vertical-align: middle;
    z-index: 0;
}

.switch-thumb {
    align-items: center;
    background-color: currentColor;
    border-bottom-left-radius: 50%;
    border-bottom-right-radius: 50%;
    border-top-left-radius: 50%;
    border-top-right-radius: 50%;
    box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12);
    display: flex;
    height: 20px;
    justify-content: center;
    width: 20px;
}

.switch-track {
    background-color: var(--tavenem-theme-color, black);
    border-radius: 7px;
    height: 100%;
    opacity: 0.48;
    transition: opacity 150ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,background-color 150ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
    width: 100%;
    z-index: -1;
}

input {
    -webkit-appearance: none;
    appearance: none;
    background: none;
    border: none;
    cursor: inherit;
    height: 100%;
    left: 0;
    margin: 0;
    padding: 0;
    position: absolute;
    top: 0;
    width: 100%;
    z-index: 1;
}

:host(.dense) .toggle {
    height: 26px;
    padding-bottom: 6px;
    padding-top: 6px;

    > .btn {
        padding-bottom: 3px;
        padding-top: 3px;
    }
}

.field-helpers {
    color: var(--switch-inherited-color, var(--tavenem-color-action));
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

    .switch-thumb {
        background-color: currentColor;
    }

    ::slotted(tf-icon) {
        color: var(--tavenem-light-color-text-disabled)) !important;
    }
}`;

    private _checked = false;
    private _internals: ElementInternals;
    private _settingValue = false;

    static get observedAttributes() {
        return [
            'checked',
            'data-label',
            'readonly',
            'value',
        ];
    }

    constructor() {
        super();
        this._internals = this.attachInternals();
        this._internals.role = 'checkbox';
    }

    private static newToggleEvent(value: boolean | null) {
        return new CustomEvent('inputtoggle', { bubbles: true, composed: true, detail: { value: value } });
    }

    get checked() { return this._checked; }
    set checked(value: boolean | null) {
        if (this._settingValue) {
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

        this._settingValue = true;

        if (value) {
            if (input.checked) {
                this._settingValue = false;
                return;
            }
            this._checked = true;
            input.checked = true;
            this._internals.setFormValue('true');
            this._internals.ariaChecked = 'true';
            this._internals.states.add('checked');
            input.value = 'true';
            this.dispatchEvent(TavenemSwitchHtmlElement.newToggleEvent(true));
        } else {
            if (!input.checked) {
                this._settingValue = false;
                return;
            }
            this._checked = false;
            input.checked = false;
            this._internals.setFormValue('false');
            this._internals.ariaChecked = 'false';
            this._internals.states.delete('checked');
            input.value = 'false';
            this.dispatchEvent(TavenemSwitchHtmlElement.newToggleEvent(false));
        }

        this.setValidity(input);

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
        return this._checked
            ? 'true'
            : 'false';
    }
    set value(v: string) {
        if (this._settingValue) {
            return;
        }

        if (!v || !v.length) {
            this._checked = false;
        } else {
            const l = v.toLowerCase();
            if (l === 'null'
                || l === 'false'
                || l === '0'
                || l === 'f') {
                this._checked = false;
            } else {
                this._checked = true;
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

        if (this._checked) {
            this._internals.setFormValue('true');
            this._internals.ariaChecked = 'true';
            this._internals.states.add('checked');
            input.value = 'true';
        } else {
            this._internals.setFormValue('false');
            this._internals.ariaChecked = 'false';
            this._internals.states.delete('checked');
            input.value = 'false';
        }

        this.setValidity(input);

        this._settingValue = false;
    }

    get willValidate() { return this._internals.willValidate; }

    connectedCallback() {
        const shadow = this.attachShadow({ mode: 'open', delegatesFocus: true });

        const style = document.createElement('style');
        style.textContent = TavenemSwitchHtmlElement.style;
        shadow.appendChild(style);

        const field = document.createElement('div');
        field.classList.add('switch');
        field.inert = this.matches(':disabled')
            || this.hasAttribute('readonly');
        field.addEventListener('click', this.onChange.bind(this));
        shadow.appendChild(field);

        const inputId = randomUUID();

        if ('uncheckedLabel' in this.dataset
            && this.dataset.uncheckedLabel
            && this.dataset.uncheckedLabel.length) {
            const label = document.createElement('label');
            label.htmlFor = inputId;
            label.textContent = this.dataset.uncheckedLabel;
            field.appendChild(label);
        } else {
            const labelSlot = document.createElement('slot');
            labelSlot.name = 'unchecked-label'
            field.appendChild(labelSlot);
        }

        const toggle = document.createElement('span');
        toggle.classList.add('toggle');
        field.appendChild(toggle);

        const span = document.createElement('span');
        span.classList.add('btn');
        toggle.appendChild(span);

        const input = document.createElement('input');
        input.id = inputId;

        input.autofocus = this.hasAttribute('autofocus');

        if (this.hasAttribute('checked')) {
            this._checked = true;
            input.checked = true;
            this._internals.setFormValue('true');
            this._internals.ariaChecked = 'true';
            this._internals.states.add('checked');
        } else {
            this._internals.setFormValue('false');
            this._internals.ariaChecked = 'false';
            this._internals.states.delete('checked');
        }

        input.type = 'checkbox';

        if (this._checked) {
            input.value = 'true';
        } else {
            input.value = 'false';
        }

        input.addEventListener('change', this.onChange.bind(this));
        input.addEventListener('input', this.onChange.bind(this));
        input.addEventListener('keydown', this.onKeyDown.bind(this));

        span.appendChild(input);

        const thumb = document.createElement('span');
        thumb.classList.add('switch-thumb');
        span.appendChild(thumb);

        const checkedSlot = document.createElement('slot');
        checkedSlot.name = 'checked'
        thumb.appendChild(checkedSlot);

        const uncheckedSlot = document.createElement('slot');
        uncheckedSlot.name = 'unchecked'
        thumb.appendChild(uncheckedSlot);

        const track = document.createElement('span');
        track.classList.add('switch-track');
        toggle.appendChild(track);

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
            && !this.hasAttribute('checked')) {
            this.value = this.getAttribute('value') || '';
        }

        this.setValidity(input);
    }

    disconnectedCallback() {
        const root = this.shadowRoot;
        if (!root) {
            return;
        }

        const field = root.querySelector('.switch');
        if (field) {
            field.removeEventListener('click', this.onChange.bind(this));
        }

        const input = root.querySelector('input');
        if (input) {
            input.removeEventListener('change', this.onChange.bind(this));
            input.removeEventListener('input', this.onChange.bind(this));
            input.removeEventListener('keydown', this.onKeyDown.bind(this));
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

        if (name === 'checked') {
            if (!this._settingValue && newValue != null) {
                this.checked = true;
            }
        } else if (name === 'readonly') {
            const field = root.querySelector('.switch');
            if (field instanceof HTMLElement) {
                field.inert = (newValue != null);
            }
        } else if (name === 'required') {
            if ((newValue != null)
                && !this._checked) {
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
                    const labelSlot = document.createElement('slot');
                    labelSlot.name = 'label'
                    label.replaceWith(labelSlot);
                }
            } else if (newValue != null && newValue.length) {
                const input = root.querySelector('input');
                const labelSlot = root.querySelector('slot[name="label"]');
                if (input && labelSlot) {
                    const label = document.createElement('label');
                    label.htmlFor = input.id;
                    label.textContent = newValue;
                    labelSlot.replaceWith(label);
                }
            }
        }
    }

    formDisabledCallback(disabled: boolean) {
        const root = this.shadowRoot;
        if (!root) {
            return;
        }
        const field = root.querySelector('.switch');
        if (field instanceof HTMLElement) {
            field.inert = disabled;
        }
    }

    formResetCallback() { this.reset(); }

    formStateRestoreCallback(state: string | File | FormData | null, _mode: 'restore' | 'autocomplete') {
        if (typeof state === 'string') {
            this.value = state;
        } else if (state == null) {
            this._checked = false;
            this._internals.states.delete('checked');

            const root = this.shadowRoot;
            if (!root) {
                return;
            }
            const input = root.querySelector('input');
            if (!input) {
                return;
            }

            this._settingValue = true;

            this._internals.setFormValue('false');
            input.value = 'false';

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

        if (this.hasAttribute('checked')) {
            if (this._checked) {
                this._settingValue = false;
                return;
            }
            this._checked = true;
            input.checked = true;
            this._internals.setFormValue('true');
            this._internals.states.add('checked');
            this._internals.ariaChecked = 'true';
            input.value = 'true';
            this.dispatchEvent(TavenemSwitchHtmlElement.newToggleEvent(true));
        } else if (this._checked) {
            this._checked = false;
            input.checked = false;
            this._internals.states.delete('checked');
            this._internals.setFormValue('false');
            this._internals.ariaChecked = 'false';
            input.value = 'false';
            this.dispatchEvent(TavenemSwitchHtmlElement.newToggleEvent(false));
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
            || input.checked === this._checked) {
            return;
        }

        this._settingValue = true;

        this._internals.states.add('touched');

        if (input.checked) {
            this._checked = true;
            this._internals.setFormValue('true');
            this._internals.ariaChecked = 'true';
            this._internals.states.add('checked');
            input.value = 'true';
        } else {
            this._checked = false;
            this._internals.states.delete('checked');
            this._internals.setFormValue('false');
            this._internals.ariaChecked = 'false';
            input.value = 'false';
        }

        this.setValidity(input);

        this.dispatchEvent(TavenemSwitchHtmlElement.newToggleEvent(this._checked));

        this._settingValue = false;
    }

    private onKeyDown(event: KeyboardEvent) {
        if (event.key === 'ArrowLeft') {
            if (this._checked) {
                event.preventDefault();
                event.stopPropagation();

                this.checked = false;
            }
        } else if (event.key === 'ArrowRight') {
            if (!this._checked) {
                event.preventDefault();
                event.stopPropagation();

                this.checked = true;
            }
        } else if (event.key === ' '
            || event.key === 'Enter') {
            event.preventDefault();
            event.stopPropagation();

            this.checked = !this._checked;
        }
    }

    private setValidity(input?: HTMLInputElement | null) {
        if (!input) {
            const root = this.shadowRoot;
            if (root) {
                input = root.querySelector('input');
            }
        }
        if (this.hasAttribute('required')
            && !this._checked) {
            this._internals.setValidity({
                valueMissing: true,
            }, 'required', input || undefined);
        } else {
            this._internals.setValidity({});
        }
    }
}
