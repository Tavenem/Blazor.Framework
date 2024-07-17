export const elementStyle = `:host {
    position: relative;
}

* {
    font-family: var(--tavenem-font-family);
}

svg {
    fill: currentColor;
    flex-shrink: 0;
    height: 1em;
    width: auto;
}

:host([button]) {
    border-radius: 9999px;
    margin: 0;
}

:host(:not([button])) {
    --field-active-border-color: var(--tavenem-theme-color, var(--tavenem-color-primary));
    --field-active-border-hover-color: var(--tavenem-theme-color-lighten, var(--tavenem-color-primary-lighten));
    --field-active-label-color: var(--tavenem-theme-color, var(--tavenem-color-primary));
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
    min-width: 255px;
    padding: 0;
    position: relative;
    vertical-align: top;
}

:host(:focus-within:not([button])) {
    --field-border-color: var(--field-active-border-color);
    --field-border-hover-color: var(--field-active-border-hover-color);
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

tf-input > .expand {
    cursor: pointer;
    transition: .3s cubic-bezier(.25,.8,.5,1),visibility 0s;
}

tf-input svg {
    min-height: 1.5em;
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

input::placeholder {
    color: currentColor;
    opacity: 0.42;
    transition: opacity 200ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
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

input {
    border-radius: var(--tavenem-border-radius);
    transition: border-color .15s ease-in-out, box-shadow .15s ease-in-out;
}

.help-text {
    margin-left: auto;
    margin-right: auto;
}

.button-swatch {
    width: 1.5em;
}

:host(:state(empty)) {
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

:host(:has(tf-popover:popover-open)) .expand {
    transform: rotate(-180deg);
}

.inputs-container {
    align-items: center;
    display: flex;
    flex: 1 1 auto;
    gap: .25rem;
    margin-top: .25rem;

    > tf-input-field {
        flex-grow: 1;
    }
}

:host([data-input-mode="hex"]) .alpha {
    display: none;
}

:host(:not([data-input-mode="hex"])) .hex {
    display: none;
}

:host(:not([data-input-mode="hsl"])) .hsl {
    display: none;
}

:host(:not([data-input-mode="rgb"])) .rgb {
    display: none;
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

:host(.small) button,
button.small {
    font-size: 1.25rem;
    padding: 5px;
}

button::-moz-focus-inner {
    border-style: none;
}

.picker-btn {
    align-self: center;
    border-radius: inherit;
}

:host(.invalid) > .picker-btn {
    border-color: var(--tavenem-color-error);
}

.picker-btn:not(:has(.swatch-fill)) {
    color: var(--tavenem-theme-color, inherit);
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

:host(:disabled),
:host([readonly]),
:host([required]),
:host(:state(empty)) {
    .color-clear {
        display: none;
    }
}

.color-picker {
    height: 250px;
    overflow: hidden;
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
:host(:disabled) .field,
:host([inert]),
:host([inert]) .field {
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

:host([inert]) * {
    cursor: default;
    pointer-events: none;
}
`;