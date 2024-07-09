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

input {
    border-radius: var(--tavenem-border-radius);
    transition: border-color .15s ease-in-out, box-shadow .15s ease-in-out;
}

:host {
    --field-active-border-color: var(--tavenem-color-primary);
    --field-active-border-hover-color: var(--tavenem-color-primary-lighten);
    --field-active-label-color: var(--tavenem-color-primary);
    --field-border-color: var(--tavenem-color-border-input);
    --field-border-hover-color: var(--tavenem-color-action);
    --field-color: var(--tavenem-color-text);
    --field-label-color: var(--tavenem-color-text-secondary);
}

:host(:not([button])) {
    border: 0;
    color: var(--tavenem-color-text);
    display: flex;
    flex-basis: auto;
    flex-direction: column;
    flex-grow: 1;
    flex-shrink: 1;
    margin: 0;
    max-width: 100%;
    padding: 0;
    position: relative;
    vertical-align: top;
}

:host(:focus-within:not([button])) {
    --field-border-color: var(--field-active-border-color);
    --field-border-hover-color: var(--field-active-border-hover-color);
}

:host(:not([button])) {
    border: none !important;
    margin-bottom: .5rem;
    margin-top: 1rem;
    min-width: 255px;
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

.expand {
    cursor: pointer;
    height: 1.5em;
    transition: .3s cubic-bezier(.25,.8,.5,1);
}

:host(:has(tf-popover:popover-open)) > tf-input > .expand {
    transform: rotate(-180deg);
}

.main-expand {
    cursor: pointer;
}

button, .btn {
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

    &.outlined {
        border-color: var(--tavenem-color-border);
        border-style: solid;
        padding: 5px;
    }

    &.active {
        background-color: var(--date-picker-active-color-hover);
        border-color: var(--date-picker-active-color);
        color: var(--date-picker-active-color);

        &:hover,
        &:focus-visible {
            background-color: var(--date-picker-active-color-darken);
            color: var(--date-picker-active-color);
        }
    }

    &:disabled, &[inert], [inert] & {
        --button-active-shadow: none;
        --button-bg: var(--tavenem-color-action-disabled-bg);
        --button-color: var(--tavenem-color-text-disabled);
        --button-hover-shadow: none;
        --button-shadow: none;
        background-color: var(--tavenem-color-action-disabled-bg);
        border-color: var(--tavenem-color-action-disabled-bg);
        color: var(--tavenem-color-text-disabled);
        cursor: default;
        pointer-events: none;
    }
}

:host(.small) > button,
button.small {
    font-size: 1.25rem;
    padding: 5px;
}

button::-moz-focus-inner,
.btn::-moz-focus-inner {
    border-style: none;
}

.btn-text {
    border-radius: var(--tavenem-border-radius);
    font-size: var(--tavenem-font-size-button);
    font-weight: var(--tavenem-font-weight-semibold);
    line-height: var(--tavenem-lineheight-button);

    &:after {
        transform: scale(10,10);
    }
}

.picker-btn {
    align-self: center;
    border-radius: inherit;
}

.input-content {
    --date-picker-active-color-darken: var(--tavenem-color-primary-hover-dark);
    --date-picker-active-color-hover: var(--tavenem-color-primary-hover);
    --date-picker-active-color-text: var(--tavenem-color-primary-text);
    --date-picker-active-color: var(--field-active-label-color);

    button, .btn {
        text-transform: none;
    }
}

:host(:invalid:state(touched)) {
    --field-active-border-color: var(--tavenem-color-error);
    --field-active-border-hover-color: var(--tavenem-color-error);
    --field-active-label-color: var(--tavenem-color-error);
    --field-border-color: var(--tavenem-color-error);
    --field-border-hover-color: var(--tavenem-color-error);
    --field-color: var(--tavenem-color-error);
    --field-label-color: var(--tavenem-color-error);

    > .picker-btn {
        border-color: var(--tavenem-color-error);
    }

    .input-content {
        --date-picker-active-color-darken: var(--tavenem-color-error-hover-dark);
        --date-picker-active-color-hover: var(--tavenem-color-error-hover);
        --date-picker-active-color-text: var(--tavenem-color-error-text);
        --date-picker-active-color: var(--tavenem-color-error);
    }
}

:host(:disabled),
:host([readonly]),
:host([inert]) {
    --tavenem-field-input-opacity: 1;

    .input-content {
        --date-picker-active-color-darken: var(--tavenem-color-default-hover-dark);
        --date-picker-active-color-hover: var(--tavenem-color-default-hover);
        --date-picker-active-color-text: var(--tavenem-color-default-text);
        --date-picker-active-color: var(--tavenem-color-default);
    }
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

.header {
    --checkbox-inherited-color: var(--date-picker-active-color-text);
    --checkbox-inherited-hover-bg: var(--date-picker-active-color-hover);
    align-items: start;
    background-color: var(--date-picker-active-color);
    color: var(--date-picker-active-color-text);
    display: flex;
    flex-direction: column;
    padding-bottom: .25rem;
    padding-left: .5rem;
    padding-right: .5rem;
    padding-top: .25rem;

    button, .btn {
        background-color: var(--date-picker-active-color);
        border-color: var(--date-picker-active-color-text);
        color: var(--date-picker-active-color-text);

        &:hover,
        &:focus-visible {
            background-color: var(--date-picker-active-color-darken);
            color: var(--date-picker-active-color-text);
        }
    }

    .inactive {
        color: var(--tavenem-color-text-disabled);
    }
}

.current-date-button {
    color: var(--date-picker-active-color-text);
    font-size: 1.75rem;
    font-weight: 400;
    line-height: 1.17;
}

.locale-controls {
    align-self: stretch;
    display: flex;
    flex-direction: column;
}

.locale-container {
    align-items: center;
    display: flex;
}

:host([inert]) * {
    cursor: default;
    pointer-events: none;
}

.current-value {
    align-self: stretch;
    display: flex;
    flex-wrap: wrap;
    gap: .5rem;
}

.current-date, .day-period, .controls, .selection {
    display: flex;
    flex-direction: column;
}

.current-date {
    align-items: flex-start;
    flex-grow: 1;

    button {
        flex-grow: 1;
    }
}

.current-time {
    align-items: center;
    display: flex;
    flex-grow: 1;
    justify-content: center;
    padding-bottom: 6px;
}

.am-button {
    padding-bottom: 0;
}

.pm-button {
    padding-top: 0;
}

.centered-grid {
    align-items: center;
    display: grid;
    justify-content: center;
    justify-items: center;
}

.text-muted {
    color: var(--tavenem-color-text-secondary);
}

.controls {
    justify-content: space-between;
    min-width: 310px;

    @media (max-width: 700px) {
        flex-direction: column;
    }
}

.nav {
    align-items: center;
    display: flex;
    padding-bottom: .5rem;
    padding-top: .5rem;

    > *:nth-child(2n) {
        flex-grow: 1;
    }
}

.selection {
    max-height: 300px;
    overflow-y: auto;

    > * {
        flex-shrink: 0;
    }
}

:host(:not(.date)) .date-control,
:host(:not([type="week"])) .week-control,
:host([type="week"]) .non-week-control,
:host(:not(.month)) .month-control,
:host(:not(.year)) .year-control,
:host(.month) .date-control,
:host(.year) .date-control {
    display: none;
}

.calendar, .months {
    display: grid;

    button {
        text-transform: none;
    }
}

.calendar {
    --date-picker-calendar-columns: 7;
    --date-picker-calendar-rows: 5;
    grid-template-columns: repeat(var(--date-picker-calendar-columns), 1fr);
    grid-template-rows: repeat(var(--date-picker-calendar-rows), 1fr);
    place-content: space-evenly;

    button.today:not(.active) {
        border-color: var(--tavenem-color-border);
        border-style: solid;
        padding: 5px;
    }
}

.months {
    grid-template-columns: 1fr 1fr 1fr;
    grid-template-rows: 1fr 1fr 1fr;
    place-content: stretch;
    row-gap: .5rem;
}

.now-container, .dialog-buttons {
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
    text-transform: var(--tavenem-texttransform-button);

    &:after {
        transform: scale(10,10);
    }
}

.clear-button {
    display: none;
    margin-inline-end: .5rem;
}

:host(.clearable) .clear-button {
    display: inline-flex;
}

:host(:disabled),
:host([readonly]),
:host([inert]),
:host([required]),
:host(:state(empty)) {
    .clear-button {
        display: none;
    }
}
`;