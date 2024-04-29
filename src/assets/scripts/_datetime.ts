import { TavenemPopover, TavenemPopoverHTMLElement } from './_popover'
import { TavenemInputHtmlElement, TavenemPickerHtmlElement } from './_input'
import { randomUUID } from './tavenem-utility'
import {
    CalendarDate,
    CalendarDateTime,
    createCalendar,
    DateFormatter,
    endOfMonth,
    endOfWeek,
    endOfYear,
    fromDate,
    getDayOfWeek,
    getLocalTimeZone,
    getWeeksInMonth,
    isEqualDay,
    now,
    parseAbsolute,
    parseDate,
    parseDateTime,
    parseTime,
    parseZonedDateTime,
    startOfMonth,
    startOfWeek,
    startOfYear,
    Time,
    toCalendar,
    toCalendarDate,
    toCalendarDateTime,
    today,
    toTime,
    toTimeZone,
    toZoned,
    ZonedDateTime
} from '@internationalized/date'
import {
    defaultCalendar,
    getWeek,
    parseDateTime as parseDateTimeString,
    parseTime as parseTimeString
} from './_datetime-parser'

const internationalizedCalendars = ['buddhist', 'ethiopic', 'ethioaa', 'coptic', 'hebrew', 'indian', 'islamic-civil', 'islamic-tbla', 'islamic-umalqura', 'japanese', 'persian', 'roc', 'gregory'];
const supportedCalendars = Intl
    .supportedValuesOf('calendar')
    .filter(x => internationalizedCalendars.includes(x));
const YEAR_MONTH_RE = /^(\d{4})-(\d{2})$/;

const DateTimeType = {
    Year: 1,
    Month: 2,
    Week: 3,
    Date: 4,
} as const;
type DateTimeType = typeof DateTimeType[keyof typeof DateTimeType];

const DateTimeViewType = {
    date: 1,
    month: 2,
    year: 3,
    era: 5,
} as const;
type DateTimeViewType = typeof DateTimeViewType[keyof typeof DateTimeViewType];

interface DateButton extends HTMLButtonElement {
    date: CalendarDate | null | undefined;
}

export class TavenemDateTimeInputHtmlElement extends TavenemPickerHtmlElement {
    _displayedDate: CalendarDate;
    _displayedTime: Time;
    _max: CalendarDate | CalendarDateTime | ZonedDateTime | Time = new CalendarDate(9999, 12, 31);
    _min: CalendarDate | CalendarDateTime | ZonedDateTime | Time = new CalendarDate('BC', 9999, 12, 31);
    _settingValue = false;
    _type: DateTimeType = DateTimeType.Date;
    _value: CalendarDate | CalendarDateTime | ZonedDateTime | Time | null | undefined;
    _view: DateTimeViewType = DateTimeViewType.date;
    _yearStep: number = 1;

    static get observedAttributes() {
        return ['disabled', 'max', 'min', 'readonly', 'value'];
    }

    constructor() {
        super();

        const nowDateTime = now(new Intl.DateTimeFormat().resolvedOptions().timeZone);
        this._displayedDate = toCalendarDate(nowDateTime);
        this._displayedTime = toTime(nowDateTime);
    }

    connectedCallback() {
        if (this.hasAttribute('type')) {
            const type = this.getAttribute('type');
            if (type && type.length) {
                switch (type.toLowerCase()) {
                    case 'year':
                        this._type = DateTimeType.Year;
                        break;
                    case 'month':
                        this._type = DateTimeType.Month;
                        break;
                    case 'week':
                        this._type = DateTimeType.Week;
                        break;
                }
            }
        }

        const shadow = this.attachShadow({ mode: 'open' });

        const style = document.createElement('style');
        style.textContent = `:host {
    position: relative;
}

* {
    font-family: var(--tavenem-font-family);
}

svg {
    fill: currentColor;
    height: 1em;
    width: auto;
}

[data-popover-open] {
    --tavenem-popover-opacity: 1;
    --tavenem-popover-events: auto;
    --tavenem-popover-visibility: visible;
}

[data-popover-container]:not([data-popover-open]) {
    --tavenem-popover-opacity: 0;
    --tavenem-popover-events: none;
    --tavenem-popover-visibility: hidden;
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

.field {
    --field-active-border-color: var(--tavenem-color-primary);
    --field-active-border-hover-color: var(--tavenem-color-primary-lighten);
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

    > .field-helpers {
        padding-left: 8px;
        padding-right: 8px;
    }
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

    &.field {
        flex-direction: row;
    }

    &[disabled],
    &[inert],
    [inert] & {
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

:host(:not(.outlined, [disabled], [readonly], [inert])) > tf-input:hover:before {
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

    &[disabled],
    &[inert],
    [inert] & {
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

:host(:not([disabled], [readonly], [inert])):focus-within {
    --field-border-color: var(--field-active-border-color);
    --field-border-hover-color: var(--field-active-border-hover-color);
}

:host(:not([disabled], [readonly], [inert])) > tf-input:hover {
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

tf-input.field,
.field > tf-input {
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

input::placeholder {
    color: currentColor;
    opacity: 0.42;
    transition: opacity 200ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
}

:host([disabled]) tf-input,
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

:host([disabled]),
:host([disabled]) .field,
:host([inert]),
:host([inert]) .field {
    --field-color: var(--tavenem-color-text-disabled);
    --field-label-color: var(--tavenem-color-text-disabled);
}

:host([disabled]) tf-input,
:host([inert]) tf-input {
    border-color: var(--tavenem-color-action-disabled);
    color: var(--tavenem-color-text-disabled);
}

:host([disabled].filled) tf-input,
:host([inert].filled) tf-input{
    background-color: rgba(0, 0, 0, 0.12);
}

:host([disabled].outlined) tf-input,
:host([inert].outlined) tf-input{
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
}

:host(.invalid) > .picker-btn {
    border-color: var(--tavenem-color-error);
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

:host([disabled]) .input-content,
:host([inert]) .input-content {
    --date-picker-active-color-darken: var(--tavenem-color-default-hover-dark);
    --date-picker-active-color-hover: var(--tavenem-color-default-hover);
    --date-picker-active-color-text: var(--tavenem-color-default-text);
    --date-picker-active-color: var(--tavenem-color-default);
}

:host(.invalid) .input-content {
    --date-picker-active-color-darken: var(--tavenem-color-error-hover-dark);
    --date-picker-active-color-hover: var(--tavenem-color-error-hover);
    --date-picker-active-color-text: var(--tavenem-color-error-text);
    --date-picker-active-color: var(--tavenem-color-error);
}

.header {
    align-items: start;
    background-color: var(--date-picker-active-color);
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

    .select {
        &, tf-input {
            margin-top: 0;
        }
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

.checkbox {
    --button-inherited-padding-y-icon: 6px;
    --checkbox-inherited-color: var(--tavenem-color-action);
    --checkbox-inherited-hover-bg: var(--tavenem-color-action-hover-bg);
    display: inline-flex;
    flex: 0 0 auto;
    flex-direction: column;
    margin: 0;

    &:has(:focus-visible):not(.disabled, [inert]) {
        background-color: var(--tavenem-color-action-hover-bg);
    }

    > label {
        align-items: center;
        color: var(--tavenem-color-action);
        cursor: pointer;
        display: inline-flex;
        pointer-events: auto;
        position: relative;
        transform: none;
        vertical-align: middle;
        z-index: auto;
        -webkit-tap-highlight-color: transparent;

        > .btn {
            background-color: transparent;
            color: inherit;
            cursor: pointer;
            display: inline-flex;
            vertical-align: middle;

            &:hover,
            &:focus-visible {
                background-color: var(--checkbox-inherited-hover-bg);
            }

            > input[type="checkbox"] {
                -webkit-appearance: none;
                appearance: none;
                background: none;
                border: none;
                color: inherit;
                cursor: inherit;
                height: 100%;
                left: 0;
                margin: 0;
                padding: 0;
                position: absolute;
                top: 0;
                width: 100%;
                z-index: 1;

                ~ .checked {
                    display: none;
                }

                &:checked {
                    ~ .checked {
                        display: inline-block;
                    }

                    ~ .unchecked {
                        display: none;
                    }
                }
            }

            > svg {
                color: var(--checkbox-inherited-color);

                &:hover {
                    background-color: var(--checkbox-inherited-hover-bg);
                }
            }
        }
    }

    &[inert], [inert] & {
        --checkbox-inherited-color: var(--tavenem-color-action-disabled);
        --checkbox-inherited-hover-bg: transparent;

        label {
            &, &:hover, &:focus-visible {
                color: var(--tavenem-color-action-disabled);

                &, * {
                    background-color: transparent;
                    cursor: default;
                }

                * {
                    color: var(--tavenem-color-text-disabled);
                }

                svg {
                    color: var(--tavenem-color-action-disabled);
                }
            }
        }
    }
}

.select {
    > tf-input > .expand {
        transition: .3s cubic-bezier(.25,.8,.5,1);
    }

    &.open, &[data-popover-open] {
        > tf-input > .expand {
            transform: rotate(-180deg);
        }
    }

    &.read-only, &[readonly] {
        cursor: default;
        pointer-events: none;
    }

    > tf-popover.contained-popover > .option-list {
        color: var(--tavenem-color-action);
        display: flex;
        flex-direction: column;
        list-style: none;
        margin: 0;
        overflow: auto;
        padding-bottom: .25em;
        padding-left: .75em;
        padding-right: .75em;
        padding-top: .25em;
        position: relative;
        scrollbar-gutter: stable;
        transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;

        > * {
            align-items: center;
            background-color: transparent;
            border: 0;
            border-radius: 0;
            box-sizing: border-box;
            color: inherit;
            column-gap: .5em;
            cursor: pointer;
            display: flex;
            flex: 0 0 auto;
            flex-wrap: wrap;
            justify-content: flex-start;
            list-style: none;
            margin: 0;
            outline: 0;
            overflow: hidden;
            padding-bottom: .25em;
            padding-inline-end: .25em;
            padding-inline-start: .25em;
            padding-top: .25em;
            position: relative;
            text-align: start;
            text-decoration: none;
            transition: background-color 150ms cubic-bezier(.4,0,.2,1) 0ms;
            user-select: none;
            vertical-align: middle;
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
                transform: scale(10,10);
                transition: transform .3s,opacity 1s;
                width: 100%;
            }

            &:focus-visible, &:hover {
                background-color: transparent;
                color: inherit;
            }

            &:hover, &:focus {
                background-color: var(--list-hover-bg);
            }
        }
    }
}

.number-field input[type=number] {
    -moz-appearance: textfield;
}
.number-field input::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
}
.number-field input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
}

.numeric-spin {
    display: inline-flex;
    flex-direction: column;
    justify-content: space-between;
    order: 9999;

    button {
        background-color: transparent;
        color: inherit;
        flex-shrink: 1;
        font-size: 1rem;
        max-height: .9375rem;
        min-height: unset;
        min-width: unset;
        padding: 2px 0;

        &:hover,
        &:focus-visible {
            background-color: var(--tavenem-color-action-hover-bg);
        }
    }
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

    .field {
        padding-bottom: 0;
    }
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

:host([disabled]),
:host([readonly]),
:host([inert]),
:host([required]),
:host([empty]) {
    .clear-button {
        display: none;
    }
}
`;
        shadow.appendChild(style);

        const hasTime = this._type === DateTimeType.Date && this.hasAttribute('time');
        const hasDate = !hasTime || this.hasAttribute('date');

        const showCalendar = hasDate
            && 'showCalendar' in this.dataset
            && supportedCalendars.length > 0;
        let calendarName = this.dataset.calendar?.toLowerCase();
        calendarName = calendarName && supportedCalendars.includes(calendarName) ? calendarName : "gregory";

        let timeZone = this.dataset.timeZone?.toLowerCase()
            || getLocalTimeZone();

        const options = new DateFormatter(this.dataset.locale || 'en-US', {
            calendar: calendarName,
            timeZone: timeZone,
        }).resolvedOptions();
        const locale = options.locale;
        calendarName = options.calendar;

        const calendar = createCalendar(calendarName);
        timeZone = options.timeZone;

        const nowDateTime = now(timeZone);
        const todayDate = today(timeZone);

        let hasMax = false;
        if (this.hasAttribute('max')) {
            const parsedMax = this.parseValue(this.getAttribute('max'));
            if (parsedMax) {
                if (hasTime) {
                    if (hasDate) {
                        if (parsedMax instanceof ZonedDateTime) {
                            this._max = parsedMax;
                            hasMax = true;
                        } else if (parsedMax instanceof CalendarDate
                            || parsedMax instanceof CalendarDateTime) {
                            this._max = toZoned(parsedMax, timeZone);
                            hasMax = true;
                        }
                    } else if (parsedMax instanceof Time) {
                        this._max = parsedMax;
                        hasMax = true;
                    } else if (parsedMax instanceof ZonedDateTime) {
                        this._max = toTime(parsedMax);
                        hasMax = true;
                    }
                } else if (parsedMax instanceof CalendarDate) {
                    this._max = parsedMax;
                    hasMax = true;
                } else if (parsedMax instanceof ZonedDateTime
                    || parsedMax instanceof CalendarDateTime) {
                    this._max = toCalendarDate(parsedMax);
                    hasMax = true;
                }
            }
        }
        if (!hasMax) {
            if (hasTime) {
                if (hasDate) {
                    this._max = nowDateTime.add({ years: Number.MAX_SAFE_INTEGER - nowDateTime.year - 1 });
                } else {
                    this._max = new Time(23, 59, 59, 999);
                }
            } else {
                this._max = todayDate.add({ years: Number.MAX_SAFE_INTEGER - todayDate.year - 1 });
            }
        }

        let hasMin = false;
        if (this.hasAttribute('min')) {
            const parsedMin = this.parseValue(this.getAttribute('min'));
            if (parsedMin) {
                if (hasTime) {
                    if (hasDate) {
                        if (parsedMin instanceof ZonedDateTime) {
                            this._min = parsedMin;
                            hasMin = true;
                        } else if (parsedMin instanceof CalendarDate
                            || parsedMin instanceof CalendarDateTime) {
                            this._min = toZoned(parsedMin, timeZone);
                            hasMin = true;
                        }
                    } else if (parsedMin instanceof Time) {
                        this._min = parsedMin;
                        hasMin = true;
                    } else if (parsedMin instanceof ZonedDateTime) {
                        this._min = toTime(parsedMin);
                        hasMin = true;
                    }
                } else if (parsedMin instanceof CalendarDate) {
                    this._min = parsedMin;
                    hasMin = true;
                } else if (parsedMin instanceof ZonedDateTime
                    || parsedMin instanceof CalendarDateTime) {
                    this._min = toCalendarDate(parsedMin);
                    hasMin = true;
                }
            }
        }
        if (!hasMin) {
            if (hasTime) {
                if (hasDate) {
                    this._min = nowDateTime.subtract({ years: Number.MAX_SAFE_INTEGER - nowDateTime.year - 1 });
                } else {
                    this._min = new Time();
                }
            } else {
                this._min = todayDate.subtract({ years: Number.MAX_SAFE_INTEGER - todayDate.year - 1 });
            }
        }

        if (this._min && this._max) {
            if (hasTime) {
                if (hasDate) {
                    if ((this._min instanceof ZonedDateTime
                        || this._min instanceof CalendarDateTime)
                        && (this._max instanceof ZonedDateTime
                        || this._max instanceof CalendarDateTime)
                        && this._min.compare(this._max) > 0) {
                        this._max = this._min;
                    }
                } else if (this._min instanceof Time
                    && this._max instanceof Time
                    && this._min.compare(this._max) > 0) {
                    this._max = this._min;
                }
            } else if (this._min instanceof CalendarDate
                && this._max instanceof CalendarDate
                && this._min.compare(this._max) > 0) {
                this._max = this._min;
            }
        }

        const valueStr = this.hasAttribute('value')
            ? this.getAttribute('value')
            : null;
        const hasValue = valueStr && valueStr.length;
        if (hasValue) {
            const parsedValue = this.parseValue(valueStr);
            if (hasTime) {
                if (hasDate) {
                    if (parsedValue instanceof ZonedDateTime) {
                        this._max = parsedValue;
                        hasMax = true;
                    } else if (parsedValue instanceof CalendarDate
                        || parsedValue instanceof CalendarDateTime) {
                        this._max = toZoned(parsedValue, timeZone);
                        hasMax = true;
                    }
                } else if (parsedValue instanceof Time) {
                    this._max = parsedValue;
                    hasMax = true;
                } else if (parsedValue instanceof ZonedDateTime) {
                    this._max = toTime(parsedValue);
                    hasMax = true;
                }
            } else if (parsedValue instanceof CalendarDate) {
                this._max = parsedValue;
                hasMax = true;
            } else if (parsedValue instanceof ZonedDateTime
                || parsedValue instanceof CalendarDateTime) {
                this._max = toCalendarDate(parsedValue);
                hasMax = true;
            }
        }
        if ((hasValue && this._value == null)
            || (this._value
                && (this._value > this._max
                || this._value < this._min))) {
            this.classList.add('invalid');
        }

        let display = this.getValueAndDisplay(this._value);

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
            if (this._value) {
                input.value = display.value;
            }

            shadow.appendChild(input);

            const buttonIcon = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
            button.appendChild(buttonIcon);
            buttonIcon.outerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="48" viewBox="0 -960 960 960" width="48"><path d="M480-400q-17 0-28.5-11.5T440-440q0-17 11.5-28.5T480-480q17 0 28.5 11.5T520-440q0 17-11.5 28.5T480-400Zm-160 0q-17 0-28.5-11.5T280-440q0-17 11.5-28.5T320-480q17 0 28.5 11.5T360-440q0 17-11.5 28.5T320-400Zm320 0q-17 0-28.5-11.5T600-440q0-17 11.5-28.5T640-480q17 0 28.5 11.5T680-440q0 17-11.5 28.5T640-400ZM480-240q-17 0-28.5-11.5T440-280q0-17 11.5-28.5T480-320q17 0 28.5 11.5T520-280q0 17-11.5 28.5T480-240Zm-160 0q-17 0-28.5-11.5T280-280q0-17 11.5-28.5T320-320q17 0 28.5 11.5T360-280q0 17-11.5 28.5T320-240Zm320 0q-17 0-28.5-11.5T600-280q0-17 11.5-28.5T640-320q17 0 28.5 11.5T680-280q0 17-11.5 28.5T640-240ZM180-80q-24 0-42-18t-18-42v-620q0-24 18-42t42-18h65v-60h65v60h340v-60h65v60h65q24 0 42 18t18 42v620q0 24-18 42t-42 18H180Zm0-60h600v-430H180v430Z"/></svg>`;
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
            if (this._value) {
                input.value = display.value;
                if (display.display) {
                    input.display = display.display;
                }
            }
            input.dataset.inputId = this.dataset.inputId;
            input.dataset.inputClass = this.dataset.inputClass;
            input.dataset.inputStyle = this.dataset.inputStyle;
            shadow.appendChild(input);
            input.addEventListener('valuechange', this.onInput.bind(this));

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

        const inputContent = document.createElement('div');
        inputContent.classList.add('input-content');
        controlContainer.appendChild(inputContent);

        const header = document.createElement('div');
        header.classList.add('header');
        if (this.hasAttribute('disabled') || this.hasAttribute('readonly')) {
            header.inert = true;
        }
        inputContent.appendChild(header);

        let calendars: string[] = [];
        let timeZones: string[] = [];
        let allTimeZones: string[] = [];
        if (showCalendar
            || (hasTime
                && 'showTimeZone' in this.dataset)) {
            const intlLocale = 'locale' in this.dataset
                && this.dataset.locale
                && this.dataset.locale.length
                ? new Intl.Locale(locale)
                : undefined;

            if (showCalendar) {
                if (intlLocale) {
                    let localeCalendars: string[] = [];
                    if (typeof (intlLocale as any).getCalendars === "function") {
                        localeCalendars = (intlLocale as any).getCalendars();
                    } else if (typeof (intlLocale as any).calendars !== "undefined") {
                        localeCalendars = (intlLocale as any).calendars;
                    }
                    if (localeCalendars.length) {
                        calendars = supportedCalendars.filter(x => localeCalendars.includes(x));
                        if (calendars.length <= 1
                            || !calendars.includes(calendarName)) {
                            calendars = supportedCalendars;
                        }
                    } else {
                        calendars = supportedCalendars;
                    }
                } else {
                    calendars = supportedCalendars;
                }
            }

            if (hasTime
                && 'showTimeZone' in this.dataset) {
                if (intlLocale) {
                    let localeTimeZones: string[] = [];
                    if (typeof (intlLocale as any).getTimeZones === "function") {
                        localeTimeZones = (intlLocale as any).getTimeZones();
                    } else if (typeof (intlLocale as any).timeZones !== "undefined") {
                        localeTimeZones = (intlLocale as any).timeZones;
                    }
                    if (localeTimeZones.length) {
                        allTimeZones = Intl.supportedValuesOf('timeZone');
                        timeZones = allTimeZones.filter(x => localeTimeZones.includes(x));
                        if (timeZone && !timeZones.includes(timeZone)) {
                            timeZones = allTimeZones;
                        }
                    } else {
                        timeZones = Intl.supportedValuesOf('timeZone');
                    }
                } else {
                    timeZones = Intl.supportedValuesOf('timeZone');
                }
            }
        }
        const showTimeZone = timeZones.length > 0;

        if (showCalendar || showTimeZone) {
            const localeControls = document.createElement('div');
            localeControls.classList.add('locale-controls');
            header.appendChild(localeControls);

            if (showCalendar) {
                let calendarContainer = localeControls;
                if (calendars.length < supportedCalendars.length) {
                    calendarContainer = document.createElement('div');
                    calendarContainer.classList.add('locale-container');
                    localeControls.appendChild(calendarContainer);
                }

                const dn = new Intl.DisplayNames("en", { type: "calendar" });

                const select = document.createElement('tf-picker') as TavenemPickerHtmlElement;
                select.classList.add('field', 'select', 'calendar-select');
                select.dataset.popoverContainer = '';
                select.tabIndex = -1;
                select.setAttribute('value', calendar.identifier);
                calendarContainer.appendChild(select);
                select.addEventListener('valuechange', this.onCalendarChange.bind(this));

                const inputId = window.isSecureContext ? crypto.randomUUID() : randomUUID();
                const input = document.createElement('tf-input') as TavenemInputHtmlElement;
                input.id = inputId;
                input.classList.add('picker-value', 'calendar-input');
                input.dataset.inputStyle = `min-width: ${calendars.map(x => x.length).reduce((x, y) => Math.max(x, y), -Infinity)}ch`;
                select.appendChild(input);
                input.value = calendar.identifier;
                input.display = dn.of(calendar.identifier);

                const icon = document.createElementNS("", 'svg');
                input.appendChild(icon);
                icon.outerHTML = `<svg class="expand" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px"><path d="M0 0h24v24H0z" fill="none"/><path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"/></svg>`;

                const popover = document.createElement('tf-popover');
                popover.dataset.anchorId = inputId;
                popover.classList.add('contained-popover', 'filled', 'top-left', 'anchor-bottom-left', 'flip-onopen', 'match-width');
                popover.style.maxHeight = 'min(300px,90vh)';
                popover.style.overflowY = 'auto';
                select.appendChild(popover);

                const list = document.createElement('div');
                list.classList.add('option-list', 'calendars-option-list');
                popover.appendChild(list);

                for (const c of calendars) {
                    const option = document.createElement('div');
                    option.dataset.closePicker = '';
                    option.dataset.closePickerValue = c;
                    option.dataset.closePickerDisplay = dn.of(c);
                    option.textContent = dn.of(c) || c;
                    list.appendChild(option);
                }

                if (calendars.length < supportedCalendars.length) {
                    const allCalendarsCheckbox = document.createElement('div');
                    allCalendarsCheckbox.classList.add('checkbox');
                    calendarContainer.appendChild(allCalendarsCheckbox);

                    const allCalendarsCheckboxLabel = document.createElement('label');
                    allCalendarsCheckbox.appendChild(allCalendarsCheckboxLabel);

                    const allCalendarsCheckboxSpan = document.createElement('span');
                    allCalendarsCheckboxSpan.classList.add('btn');
                    allCalendarsCheckboxLabel.appendChild(allCalendarsCheckboxSpan);

                    const allCalendarsCheckboxInputId = window.isSecureContext ? crypto.randomUUID() : randomUUID();
                    const allCalendarsCheckboxInput = document.createElement('input');
                    allCalendarsCheckboxInput.id = allCalendarsCheckboxInputId;
                    allCalendarsCheckboxInput.type = 'checkbox';
                    allCalendarsCheckboxInput.classList.add('all-calendars-input');
                    allCalendarsCheckboxSpan.appendChild(allCalendarsCheckboxInput);
                    allCalendarsCheckboxInput.addEventListener('change', this.onShowAllCalendars.bind(this));

                    const allCalendarsCheckboxCheckedIcon = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
                    allCalendarsCheckboxSpan.appendChild(allCalendarsCheckboxCheckedIcon);
                    allCalendarsCheckboxCheckedIcon.outerHTML = `<svg class="checked" xmlns="http://www.w3.org/2000/svg" height="48" viewBox="0 -960 960 960" width="48"><path d="m419-321 289-289-43-43-246 246-119-119-43 43 162 162ZM180-120q-24 0-42-18t-18-42v-600q0-24 18-42t42-18h600q24 0 42 18t18 42v600q0 24-18 42t-42 18H180Zm0-60h600v-600H180v600Zm0-600v600-600Z"/></svg>`;

                    const allCalendarsCheckboxUncheckedIcon = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
                    allCalendarsCheckboxSpan.appendChild(allCalendarsCheckboxUncheckedIcon);
                    allCalendarsCheckboxUncheckedIcon.outerHTML = `<svg class="unchecked" xmlns="http://www.w3.org/2000/svg" height="48" viewBox="0 -960 960 960" width="48"><path d="M180-120q-24 0-42-18t-18-42v-600q0-24 18-42t42-18h600q24 0 42 18t18 42v600q0 24-18 42t-42 18H180Zm0-60h600v-600H180v600Z"/></svg>`;

                    const allCalendarsCheckboxInnerLabel = document.createElement('label');
                    allCalendarsCheckboxInnerLabel.classList.add('label');
                    allCalendarsCheckboxInnerLabel.htmlFor = allCalendarsCheckboxInputId;
                    allCalendarsCheckboxInnerLabel.textContent = 'Show All';
                    allCalendarsCheckboxLabel.appendChild(allCalendarsCheckboxInnerLabel);
                }
            }

            if (showTimeZone) {
                let timeZoneContainer = localeControls;
                if (allTimeZones.length) {
                    timeZoneContainer = document.createElement('div');
                    timeZoneContainer.classList.add('locale-container');
                    localeControls.appendChild(timeZoneContainer);
                }

                const select = document.createElement('tf-picker');
                select.classList.add('field', 'select', 'timezone-select');
                select.dataset.popoverContainer = '';
                select.tabIndex = -1;
                select.setAttribute('value', timeZone);
                timeZoneContainer.appendChild(select);
                select.addEventListener('valuechange', this.onTimeZoneChange.bind(this));

                const inputId = window.isSecureContext ? crypto.randomUUID() : randomUUID();
                const input = document.createElement('tf-input');
                input.id = inputId;
                input.classList.add('picker-value', 'timezone-input');
                input.setAttribute('value', timeZone);
                input.dataset.inputStyle = `min-width: ${timeZones.map(x => x.length).reduce((x, y) => Math.max(x, y), -Infinity)}ch`;
                select.appendChild(input);

                const icon = document.createElementNS("", 'svg');
                input.appendChild(icon);
                icon.outerHTML = `<svg class="expand" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px"><path d="M0 0h24v24H0z" fill="none"/><path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"/></svg>`;

                const popover = document.createElement('tf-popover');
                popover.dataset.anchorId = inputId;
                popover.classList.add('contained-popover', 'filled', 'top-left', 'anchor-bottom-left', 'flip-onopen', 'match-width');
                popover.style.maxHeight = 'min(300px,90vh)';
                popover.style.overflowY = 'auto';
                select.appendChild(popover);

                const list = document.createElement('div');
                list.classList.add('option-list', 'timezone-option-list');
                popover.appendChild(list);

                for (const z of timeZones) {
                    const option = document.createElement('div');
                    option.dataset.closePicker = '';
                    option.dataset.closePickerValue = z;
                    option.textContent = z;
                    list.appendChild(option);
                }

                if (allTimeZones.length) {
                    const allTimeZonesCheckbox = document.createElement('div');
                    allTimeZonesCheckbox.classList.add('checkbox');
                    timeZoneContainer.appendChild(allTimeZonesCheckbox);

                    const allTimeZonesCheckboxLabel = document.createElement('label');
                    allTimeZonesCheckbox.appendChild(allTimeZonesCheckboxLabel);

                    const allTimeZonesCheckboxSpan = document.createElement('span');
                    allTimeZonesCheckboxSpan.classList.add('btn');
                    allTimeZonesCheckboxLabel.appendChild(allTimeZonesCheckboxSpan);

                    const allTimeZonesCheckboxInputId = window.isSecureContext ? crypto.randomUUID() : randomUUID();
                    const allTimeZonesCheckboxInput = document.createElement('input');
                    allTimeZonesCheckboxInput.id = allTimeZonesCheckboxInputId;
                    allTimeZonesCheckboxInput.type = 'checkbox';
                    allTimeZonesCheckboxInput.classList.add('all-time-zones-input');
                    allTimeZonesCheckboxSpan.appendChild(allTimeZonesCheckboxInput);
                    allTimeZonesCheckboxInput.addEventListener('change', this.onShowAllTimeZones.bind(this));

                    const allTimeZonesCheckboxCheckedIcon = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
                    allTimeZonesCheckboxSpan.appendChild(allTimeZonesCheckboxCheckedIcon);
                    allTimeZonesCheckboxCheckedIcon.outerHTML = `<svg class="checked" xmlns="http://www.w3.org/2000/svg" height="48" viewBox="0 -960 960 960" width="48"><path d="m419-321 289-289-43-43-246 246-119-119-43 43 162 162ZM180-120q-24 0-42-18t-18-42v-600q0-24 18-42t42-18h600q24 0 42 18t18 42v600q0 24-18 42t-42 18H180Zm0-60h600v-600H180v600Zm0-600v600-600Z"/></svg>`;

                    const allTimeZonesCheckboxUncheckedIcon = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
                    allTimeZonesCheckboxSpan.appendChild(allTimeZonesCheckboxUncheckedIcon);
                    allTimeZonesCheckboxUncheckedIcon.outerHTML = `<svg class="unchecked" xmlns="http://www.w3.org/2000/svg" height="48" viewBox="0 -960 960 960" width="48"><path d="M180-120q-24 0-42-18t-18-42v-600q0-24 18-42t42-18h600q24 0 42 18t18 42v600q0 24-18 42t-42 18H180Zm0-60h600v-600H180v600Z"/></svg>`;

                    const allTimeZonesCheckboxInnerLabel = document.createElement('label');
                    allTimeZonesCheckboxInnerLabel.classList.add('label');
                    allTimeZonesCheckboxInnerLabel.htmlFor = allTimeZonesCheckboxInputId;
                    allTimeZonesCheckboxInnerLabel.textContent = 'Show All';
                    allTimeZonesCheckboxLabel.appendChild(allTimeZonesCheckboxInnerLabel);
                }
            }
        }

        const currentValueSection = document.createElement('div');
        currentValueSection.classList.add('current-value');
        header.appendChild(currentValueSection);

        const valueOrNow = this._value || nowDateTime;
        if (valueOrNow instanceof Time) {
            this._displayedDate = today(timeZone);
        } else if (valueOrNow instanceof ZonedDateTime
            || valueOrNow instanceof CalendarDateTime) {
            this._displayedDate = toCalendarDate(valueOrNow);
        } else {
            this._displayedDate = valueOrNow;
        }
        display = this.getValueAndDisplay(valueOrNow);

        const nowTime = toTime(nowDateTime);
        if (valueOrNow instanceof CalendarDate) {
            this._displayedTime = nowTime;
        } else if (valueOrNow instanceof ZonedDateTime
            || valueOrNow instanceof CalendarDateTime) {
            this._displayedTime = toTime(valueOrNow);
        } else {
            this._displayedTime = valueOrNow;
        }

        if (hasDate) {
            const currentDateSection = document.createElement('div');
            currentDateSection.classList.add('current-date');
            currentValueSection.appendChild(currentDateSection);

            const yearButton = document.createElement('button');
            yearButton.type = 'button';
            yearButton.classList.add('btn-text', 'year-button');
            yearButton.textContent = getLocaleString(valueOrNow, locale, timeZone, calendarName, { era: 'short', year: 'numeric' });
            currentDateSection.appendChild(yearButton);
            yearButton.addEventListener('click', this.setView.bind(this, DateTimeViewType.year, 1));

            if (this._type != DateTimeType.Year) {
                const currentButton = document.createElement('button');
                currentButton.type = 'button';
                currentButton.classList.add('btn-text', 'current-date-button');
                currentButton.textContent = display.currentDate || '';
                currentDateSection.appendChild(currentButton);
                currentButton.addEventListener('click', this.onShowNow.bind(this));
            }
        }

        if (hasTime) {
            const currentTime = document.createElement('div');
            currentTime.classList.add('current-time');
            currentValueSection.appendChild(currentTime);

            const hourInput = document.createElement('tf-input');
            hourInput.classList.add('field', 'number-field', 'hour-input');
            hourInput.setAttribute('inputmode', 'numeric');
            const hour12 = 'hour12' in this.dataset;
            hourInput.setAttribute('max', hour12 ? '13' : '24');
            hourInput.setAttribute('min', hour12 ? '0' : '-1');
            hourInput.setAttribute('size', '2');
            hourInput.setAttribute('step', '1');
            if (hour12) {
                if (this._displayedTime.hour === 0) {
                    hourInput.setAttribute('value', '12');
                } else if (this._displayedTime.hour > 12) {
                    hourInput.setAttribute('value', (this._displayedTime.hour - 12).toString());
                } else {
                    hourInput.setAttribute('value', this._displayedTime.hour.toString());
                }
            } else {
                hourInput.dataset.minLength = '2';
                hourInput.dataset.paddingChar = '0';
                hourInput.setAttribute('value', this._displayedTime.hour.toString());
            }
            currentTime.appendChild(hourInput);
            hourInput.addEventListener('valueinput', this.onHourInput.bind(this));

            const hourInputSpin = document.createElement('div');
            hourInputSpin.classList.add('numeric-spin');
            hourInput.appendChild(hourInputSpin);

            const hourInputSpinUp = document.createElement('button');
            hourInputSpinUp.type = 'button';
            hourInputSpinUp.classList.add('hour-up', 'btn-text');
            hourInputSpinUp.tabIndex = -1;
            hourInputSpin.appendChild(hourInputSpinUp);
            hourInputSpinUp.addEventListener('click', this.onHourUp.bind(this));

            const hourInputSpinUpIcon = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
            hourInputSpinUp.appendChild(hourInputSpinUpIcon);
            hourInputSpinUpIcon.outerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px"><path d="M0 0h24v24H0z" fill="none"/><path d="M7.41 15.41 12 10.83l4.59 4.58L18 14l-6-6-6 6z"/></svg>`;

            const hourInputSpinDown = document.createElement('button');
            hourInputSpinDown.type = 'button';
            hourInputSpinDown.classList.add('hour-down', 'btn-text');
            hourInputSpinDown.tabIndex = -1;
            hourInputSpin.appendChild(hourInputSpinDown);
            hourInputSpinDown.addEventListener('click', this.onHourDown.bind(this));

            const hourInputSpinDownIcon = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
            hourInputSpinDown.appendChild(hourInputSpinDownIcon);
            hourInputSpinDownIcon.outerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/></svg>`;

            const timeSeparator = document.createElement('span');
            timeSeparator.classList.add('centered-grid');
            timeSeparator.textContent = this.dataset.timeSeparator || ':';
            currentTime.appendChild(timeSeparator);

            const minuteInput = document.createElement('tf-input');
            minuteInput.classList.add('field', 'number-field', 'minute-input');
            minuteInput.setAttribute('inputmode', 'numeric');
            minuteInput.setAttribute('max', '60');
            minuteInput.setAttribute('min', '-1');
            minuteInput.setAttribute('size', '2');
            minuteInput.setAttribute('step', '1');
            minuteInput.dataset.minLength = '2';
            minuteInput.dataset.paddingChar = '0';
            minuteInput.setAttribute('value', this._displayedTime.minute.toString());
            currentTime.appendChild(minuteInput);
            minuteInput.addEventListener('valueinput', this.onMinuteInput.bind(this));

            const minuteInputSpin = document.createElement('div');
            minuteInputSpin.classList.add('numeric-spin');
            minuteInput.appendChild(minuteInputSpin);

            const minuteInputSpinUp = document.createElement('button');
            minuteInputSpinUp.type = 'button';
            minuteInputSpinUp.classList.add('minute-up', 'btn-text');
            minuteInputSpinUp.tabIndex = -1;
            minuteInputSpin.appendChild(minuteInputSpinUp);
            minuteInputSpinUp.addEventListener('click', this.onMinuteUp.bind(this));

            const minuteInputSpinUpIcon = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
            minuteInputSpinUp.appendChild(minuteInputSpinUpIcon);
            minuteInputSpinUpIcon.outerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px"><path d="M0 0h24v24H0z" fill="none"/><path d="M7.41 15.41 12 10.83l4.59 4.58L18 14l-6-6-6 6z"/></svg>`;

            const minuteInputSpinDown = document.createElement('button');
            minuteInputSpinDown.type = 'button';
            minuteInputSpinDown.classList.add('minute-down', 'btn-text');
            minuteInputSpinDown.tabIndex = -1;
            minuteInputSpin.appendChild(minuteInputSpinDown);
            minuteInputSpinDown.addEventListener('click', this.onMinuteDown.bind(this));

            const minuteInputSpinDownIcon = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
            minuteInputSpinDown.appendChild(minuteInputSpinDownIcon);
            minuteInputSpinDownIcon.outerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/></svg>`;

            if (this.hasAttribute('seconds')) {
                const secondSeparator = document.createElement('span');
                secondSeparator.classList.add('centered-grid');
                secondSeparator.textContent = this.dataset.timeSeparator || ':';
                currentTime.appendChild(secondSeparator);

                const secondInput = document.createElement('tf-input');
                secondInput.classList.add('field', 'number-field', 'second-input');
                secondInput.setAttribute('inputmode', 'numeric');
                secondInput.setAttribute('max', '60');
                secondInput.setAttribute('min', '-1');
                secondInput.setAttribute('size', '2');
                secondInput.setAttribute('step', '1');
                secondInput.dataset.minLength = '2';
                secondInput.dataset.paddingChar = '0';
                secondInput.setAttribute('value', this._displayedTime.second.toString());
                currentTime.appendChild(secondInput);
                secondInput.addEventListener('valueinput', this.onSecondInput.bind(this));

                const secondInputSpin = document.createElement('div');
                secondInputSpin.classList.add('numeric-spin');
                secondInput.appendChild(secondInputSpin);

                const secondInputSpinUp = document.createElement('button');
                secondInputSpinUp.type = 'button';
                secondInputSpinUp.classList.add('second-up', 'btn-text');
                secondInputSpinUp.tabIndex = -1;
                secondInputSpin.appendChild(secondInputSpinUp);
                secondInputSpinUp.addEventListener('click', this.onSecondUp.bind(this));

                const secondInputSpinUpIcon = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
                secondInputSpinUp.appendChild(secondInputSpinUpIcon);
                secondInputSpinUpIcon.outerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px"><path d="M0 0h24v24H0z" fill="none"/><path d="M7.41 15.41 12 10.83l4.59 4.58L18 14l-6-6-6 6z"/></svg>`;

                const secondInputSpinDown = document.createElement('button');
                secondInputSpinDown.type = 'button';
                secondInputSpinDown.classList.add('second-down', 'btn-text');
                secondInputSpinDown.tabIndex = -1;
                secondInputSpin.appendChild(secondInputSpinDown);
                secondInputSpinDown.addEventListener('click', this.onSecondDown.bind(this));

                const secondInputSpinDownIcon = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
                secondInputSpinDown.appendChild(secondInputSpinDownIcon);
                secondInputSpinDownIcon.outerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/></svg>`;
            }

            if (hour12) {
                const dayPeriodContainer = document.createElement('div');
                dayPeriodContainer.classList.add('day-period');
                currentTime.appendChild(dayPeriodContainer);

                const amButton = document.createElement('button');
                amButton.classList.add('am-button', 'btn-text');
                if (this._displayedTime.hour >= 12) {
                    amButton.classList.add('inactive');
                }
                amButton.textContent = this.dataset.am || 'am';
                dayPeriodContainer.appendChild(amButton);
                amButton.addEventListener('click', this.onAM.bind(this));

                const pmButton = document.createElement('button');
                pmButton.classList.add('pm-button', 'btn-text');
                if (this._displayedTime.hour < 12) {
                    pmButton.classList.add('inactive');
                }
                pmButton.textContent = this.dataset.pm || 'pm';
                dayPeriodContainer.appendChild(pmButton);
                pmButton.addEventListener('click', this.onPM.bind(this));
            }
        }

        const controls = document.createElement('div');
        controls.classList.add('controls');
        inputContent.appendChild(controls);

        if (hasDate) {
            const nav = document.createElement('div');
            nav.classList.add('nav');
            controls.appendChild(nav);

            const previous = document.createElement('button');
            previous.type = 'button';
            previous.classList.add('previous');
            nav.appendChild(previous);
            previous.addEventListener('click', this.onPrevious.bind(this));

            const previousIcon = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
            previous.appendChild(previousIcon);
            previousIcon.outerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px"><path d="M0 0h24v24H0z" fill="none"/><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>`;

            const expandViewButton = document.createElement('button');
            expandViewButton.type = 'button';
            expandViewButton.classList.add('btn-text', 'outlined', 'expand-view');
            nav.appendChild(expandViewButton);
            expandViewButton.addEventListener('click', this.onExpandView.bind(this));

            const next = document.createElement('button');
            next.type = 'button';
            next.classList.add('next');
            nav.appendChild(next);
            next.addEventListener('click', this.onNext.bind(this));

            const nextIcon = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
            next.appendChild(nextIcon);
            nextIcon.outerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px"><path d="M0 0h24v24H0z" fill="none"/><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>`;

            const selection = document.createElement('div');
            selection.classList.add('selection');
            controls.appendChild(selection);

            const weekLabel = document.createElement('span');
            weekLabel.classList.add('text-muted', 'centered-grid', 'date-control', 'week-control');
            weekLabel.textContent = 'W';
            selection.appendChild(weekLabel);

            let weekDay = startOfWeek(this._displayedDate, locale);
            let nextWeekDay = endOfWeek(weekDay, locale).add({ days: 1 });
            while (getDayOfWeek(nextWeekDay, locale) !== getDayOfWeek(weekDay, locale)) {
                weekDay = nextWeekDay;
                nextWeekDay = endOfWeek(weekDay, locale).add({ days: 1 });
            }
            for (var i = 0; i < 7; i++) {
                const weekdayLabel = document.createElement('span');
                weekdayLabel.classList.add('text-muted', 'centered-grid', 'date-control', 'non-week-control');
                weekdayLabel.classList.add(`weekday-label-${i}`);
                weekdayLabel.textContent = getLocaleString(weekDay, locale, timeZone, calendarName, { weekday: 'short' });
                selection.appendChild(weekdayLabel);
                weekDay = weekDay.add({ days: 1 });
            }
        }

        const nowContainer = document.createElement('div');
        nowContainer.classList.add('now-container');
        controls.appendChild(nowContainer);

        const nowButton = document.createElement('button');
        nowButton.type = 'button';
        nowButton.classList.add('now-button');
        if (this._value instanceof CalendarDate
            || this._value instanceof CalendarDateTime
            || this._value instanceof ZonedDateTime) {
            nowButton.disabled = isEqualDay(this._value, todayDate);
        } else if (this._value instanceof Time) {
            nowButton.disabled = this._value.compare(nowTime) === 0;
        }
        nowContainer.appendChild(nowButton);
        nowButton.addEventListener('click', this.onNow.bind(this));

        const nowIcon = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
        nowButton.appendChild(nowIcon);
        nowIcon.outerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="48" viewBox="0 -960 960 960" width="48"><path d="M352.82-310Q312-310 284-338.18q-28-28.19-28-69Q256-448 284.18-476q28.19-28 69-28Q394-504 422-475.82q28 28.19 28 69Q450-366 421.82-338q-28.19 28-69 28ZM180-80q-24 0-42-18t-18-42v-620q0-24 18-42t42-18h65v-60h65v60h340v-60h65v60h65q24 0 42 18t18 42v620q0 24-18 42t-42 18H180Zm0-60h600v-430H180v430Z"/></svg>`;

        if (this.hasAttribute('button')) {
            const buttonsDiv = document.createElement('div');
            buttonsDiv.classList.add('dialog-buttons');
            inputContent.appendChild(buttonsDiv);

            const clearButton = document.createElement('button');
            clearButton.classList.add('clear-button');
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

        switch (this._type) {
            case DateTimeType.Year:
                this.setView(DateTimeViewType.year);
                break;
            case DateTimeType.Month:
                this.setView(DateTimeViewType.month);
                break;
            default:
                this.setView(DateTimeViewType.date);
                break;
        }

        shadow.addEventListener('focuslost', this.onOuterPopoverFocusLost.bind(this));
        shadow.addEventListener('mousedown', this.onOuterMouseDown.bind(this));
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

        root.removeEventListener('focuslost', this.onOuterPopoverFocusLost.bind(this));
        root.removeEventListener('mousedown', this.onOuterMouseDown.bind(this));
        root.removeEventListener('mouseup', this.onOuterMouseUp.bind(this));
        root.removeEventListener('keyup', this.onOuterKeyUp.bind(this));

        const input = root.querySelector('.picker-value');
        if (input) {
            input.removeEventListener('valuechange', this.onInput.bind(this));
        }
        const calendarSelect = root.querySelector('.calendar-select');
        if (calendarSelect) {
            calendarSelect.removeEventListener('valuechange', this.onCalendarChange.bind(this));
        }
        const timezoneSelect = root.querySelector('.timezone-select');
        if (timezoneSelect) {
            timezoneSelect.removeEventListener('valuechange', this.onTimeZoneChange.bind(this));
        }
        const allCalendarsCheckboxInput = root.querySelector('.all-calendars-input');
        if (allCalendarsCheckboxInput) {
            allCalendarsCheckboxInput.removeEventListener('change', this.onShowAllCalendars.bind(this));
        }
        const allTimeZonesCheckboxInput = root.querySelector('.all-time-zones-input');
        if (allTimeZonesCheckboxInput) {
            allTimeZonesCheckboxInput.removeEventListener('change', this.onShowAllTimeZones.bind(this));
        }
        const yearButton = root.querySelector('year-button');
        if (yearButton) {
            yearButton.removeEventListener('click', this.setView.bind(this, DateTimeViewType.year, 1));
        }
        const currentButton = root.querySelector('.current-date-button');
        if (currentButton) {
            currentButton.removeEventListener('click', this.onShowNow.bind(this));
        }
        const hourInput = root.querySelector('.hour-input');
        if (hourInput) {
            hourInput.removeEventListener('valueinput', this.onHourInput.bind(this));
        }
        const hourInputSpinUp = root.querySelector('hour-up');
        if (hourInputSpinUp) {
            hourInputSpinUp.removeEventListener('click', this.onHourUp.bind(this));
        }
        const hourInputSpinDown = root.querySelector('hour-down');
        if (hourInputSpinDown) {
            hourInputSpinDown.removeEventListener('click', this.onHourDown.bind(this));
        }
        const minuteInput = root.querySelector('.minute-input');
        if (minuteInput) {
            minuteInput.removeEventListener('valueinput', this.onMinuteInput.bind(this));
        }
        const minuteInputSpinUp = root.querySelector('minute-up');
        if (minuteInputSpinUp) {
            minuteInputSpinUp.removeEventListener('click', this.onMinuteUp.bind(this));
        }
        const minuteInputSpinDown = root.querySelector('minute-down');
        if (minuteInputSpinDown) {
            minuteInputSpinDown.removeEventListener('click', this.onMinuteDown.bind(this));
        }
        const secondInput = root.querySelector('.second-input');
        if (secondInput) {
            secondInput.removeEventListener('valueinput', this.onSecondInput.bind(this));
        }
        const secondInputSpinUp = root.querySelector('second-up');
        if (secondInputSpinUp) {
            secondInputSpinUp.removeEventListener('click', this.onSecondUp.bind(this));
        }
        const secondInputSpinDown = root.querySelector('second-down');
        if (secondInputSpinDown) {
            secondInputSpinDown.removeEventListener('click', this.onSecondDown.bind(this));
        }
        const amButton = root.querySelector('.am-button');
        if (amButton) {
            amButton.removeEventListener('click', this.onAM.bind(this));
        }
        const pmButton = root.querySelector('.pm-button');
        if (pmButton) {
            pmButton.removeEventListener('click', this.onPM.bind(this));
        }
        const previous = root.querySelector('.previous');
        if (previous) {
            previous.removeEventListener('click', this.onPrevious.bind(this));
        }
        const expandViewButton = root.querySelector('.expand-view');
        if (expandViewButton) {
            expandViewButton.removeEventListener('click', this.onExpandView.bind(this));
        }
        const next = root.querySelector('.next');
        if (next) {
            next.removeEventListener('click', this.onNext.bind(this));
        }
        const dayButtons = root.querySelectorAll('day-button');
        dayButtons.forEach(x => x.remove());
        const monthButtons = root.querySelectorAll('month-button');
        monthButtons.forEach(x => x.remove());
        const yearButtons = root.querySelectorAll('year-button');
        yearButtons.forEach(x => x.remove());
        const decadeButtons = root.querySelectorAll('decade-button');
        decadeButtons.forEach(x => x.remove());
        const clearButton = root.querySelector('.color-clear');
        if (clearButton) {
            clearButton.removeEventListener('click', this.onClearButton.bind(this));
        }
        const nowButton = root.querySelector('.now-button');
        if (nowButton) {
            nowButton.removeEventListener('click', this.onNow.bind(this));
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

            const header = root.querySelector('.header');
            if (header instanceof HTMLElement) {
                if (newValue) {
                    header.inert = true;
                } else {
                    header.inert = this.hasAttribute('readonly');
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
        } else if (name === 'max') {
            let newMax: CalendarDate | CalendarDateTime | ZonedDateTime | Time | null | undefined;
            if (newValue && newValue.length) {
                newMax = this.parseValue(newValue);
            }
            if (!newMax) {
                let timeZone = this.dataset.timeZone;
                const root = this.shadowRoot;
                if (root) {
                    const timeZoneInput = root.querySelector('.timezone-input');
                    if (timeZoneInput instanceof TavenemInputHtmlElement
                        && timeZoneInput.value
                        && timeZoneInput.value.length) {
                        timeZone = timeZoneInput.value;
                    }
                }
                const options = new DateFormatter(this.dataset.locale || 'en-US', {
                    timeZone: timeZone || getLocalTimeZone(),
                }).resolvedOptions();
                timeZone = options.timeZone;

                newMax = fromDate(new Date(8.64e15), timeZone);
            }
            this._max = newMax;
            if (this._value && this._value > this._max) {
                this.classList.add('invalid');
            }
        } else if (name === 'min') {
            let newMin: CalendarDate | CalendarDateTime | ZonedDateTime | Time | null | undefined;
            if (newValue && newValue.length) {
                newMin = this.parseValue(newValue);
            }
            if (!newMin) {
                let timeZone = this.dataset.timeZone;
                const root = this.shadowRoot;
                if (root) {
                    const timeZoneInput = root.querySelector('.timezone-input');
                    if (timeZoneInput instanceof TavenemInputHtmlElement
                        && timeZoneInput.value
                        && timeZoneInput.value.length) {
                        timeZone = timeZoneInput.value;
                    }
                }
                const options = new DateFormatter(this.dataset.locale || 'en-US', {
                    timeZone: timeZone || getLocalTimeZone(),
                }).resolvedOptions();
                timeZone = options.timeZone;

                newMin = fromDate(new Date(-8.64e15), timeZone);
            }
            this._min = newMin;
            if (this._value && this._value < this._min) {
                this.classList.add('invalid');
            }
        } else if (name === 'readonly') {
            const root = this.shadowRoot;
            if (!root) {
                return;
            }

            const header = root.querySelector('.header');
            if (header instanceof HTMLElement) {
                if (newValue) {
                    header.inert = true;
                } else {
                    header.inert = this.hasAttribute('disabled');
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

    protected clear() {
        if (!this._value) {
            return;
        }

        this._value = null;

        this.removeAttribute('value');
        this.classList.remove('invalid');

        const root = this.shadowRoot;
        if (!root) {
            return;
        }

        const input = root.querySelector('.picker-value') as TavenemInputHtmlElement;
        if (input) {
            input.value = '';
        }
    }

    protected onOpening() {
        let date: CalendarDate | undefined;
        if (this._value instanceof CalendarDate) {
            date = this._value;
        } else if (this._value instanceof ZonedDateTime
            || this._value instanceof CalendarDateTime) {
            date = toCalendarDate(this._value);
        }
        if (date && !isEqualDay(this._displayedDate, date)) {
            this._displayedDate = date;
            this.refreshView();
        }
    }

    private getNow() {
        let calendar = this.dataset.calendar;
        let timeZone = this.dataset.timeZone;
        const root = this.shadowRoot;
        if (root) {
            const calendarInput = root.querySelector('.calendar-input');
            if (calendarInput instanceof TavenemInputHtmlElement
                && calendarInput.value
                && calendarInput.value.length) {
                calendar = calendarInput.value;
            }

            const timeZoneInput = root.querySelector('.timezone-input');
            if (timeZoneInput instanceof TavenemInputHtmlElement
                && timeZoneInput.value
                && timeZoneInput.value.length) {
                timeZone = timeZoneInput.value;
            }
        }

        const options = new DateFormatter(this.dataset.locale || 'en-US', {
            calendar: calendar && supportedCalendars.includes(calendar) ? calendar : "gregory",
            timeZone: timeZone || getLocalTimeZone(),
        }).resolvedOptions();

        return now(options.timeZone);
    }

    private getValueAndDisplay(value?: CalendarDate | CalendarDateTime | ZonedDateTime | Time | null): {
        value: string,
        display?: string | null,
        currentDate?: string | null
    } {
        if (!value) {
            return {
                value: '',
                display: undefined,
                currentDate: undefined,
            };
        }
        
        let calendar = this.dataset.calendar;
        let timeZone = this.dataset.timeZone;
        const root = this.shadowRoot;
        if (root) {
            const calendarInput = root.querySelector('.calendar-input');
            if (calendarInput instanceof TavenemInputHtmlElement
                && calendarInput.value
                && calendarInput.value.length) {
                calendar = calendarInput.value;
            }

            const timeZoneInput = root.querySelector('.timezone-input');
            if (timeZoneInput instanceof TavenemInputHtmlElement
                && timeZoneInput.value
                && timeZoneInput.value.length) {
                timeZone = timeZoneInput.value;
            }
        }
        calendar = calendar && supportedCalendars.includes(calendar) ? calendar : "gregory";
        const locale = this.dataset.locale || 'en-US';
        timeZone = timeZone || getLocalTimeZone();

        switch (this._type) {
            case DateTimeType.Year:
                return {
                    value: value instanceof CalendarDate
                        || value instanceof CalendarDateTime
                        || value instanceof ZonedDateTime
                        ? toCalendar(value, defaultCalendar).year.toString()
                        : '',
                    display: getLocaleString(value, locale, timeZone, calendar, { year: 'numeric' }),
                    currentDate: undefined,
                };
            case DateTimeType.Month:
                const gregoryDate = value instanceof CalendarDate
                    || value instanceof CalendarDateTime
                    || value instanceof ZonedDateTime
                    ? toCalendar(value, defaultCalendar)
                    : null;
                return {
                    value: gregoryDate
                        ? `${gregoryDate.year.toString()}-${gregoryDate.month.toString().padStart(2, '0')}`
                        : '',
                    display: getLocaleString(value, locale, timeZone, calendar, { month: 'short', year: 'numeric' }),
                    currentDate: getLocaleString(value, locale, timeZone, calendar, { month: 'short' }),
                };
            case DateTimeType.Week:
                if (value instanceof Time) {
                    return {
                        value: '',
                        display: undefined,
                        currentDate: undefined,
                    };
                }
                const { weekYear, weekNumber, weekday } = getWeek(value);
                return {
                    value: `${weekYear.toString()}-W${weekNumber.toString().padStart(2, '0')}-${weekday}`,
                    display: `${weekYear.toString()} W${weekNumber.toString().padStart(2, '0')} ${weekday}`,
                    currentDate: `W${weekNumber.toString()} ${weekday}`,
                };
            default:
                if (this.hasAttribute('time')) {
                    let options: Intl.DateTimeFormatOptions = {
                        hour: 'numeric',
                        minute: 'numeric',
                    };
                    if (this.hasAttribute('seconds')) {
                        options = {
                            ...options,
                            second: 'numeric',
                        };
                    }
                    if (this.hasAttribute('date')) {
                        options = {
                            ...options,
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                        };
                        return {
                            value: value.toString(),
                            display: getLocaleString(
                                value,
                                locale,
                                timeZone,
                                calendar,
                                options),
                            currentDate: getLocaleString(
                                value,
                                locale,
                                timeZone,
                                calendar,
                                {
                                    day: 'numeric',
                                    month: 'short',
                                    weekday: 'short',
                                }),
                        };
                    }
                    return {
                        value: value.toString() || '',
                        display: getLocaleString(
                            value,
                            locale,
                            timeZone,
                            calendar,
                            options),
                        currentDate: undefined,
                    };
                }
                return {
                    value: value.toString(),
                    display: getLocaleString(
                        value,
                        locale,
                        timeZone,
                        calendar,
                        {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                        }),
                    currentDate: getLocaleString(
                        value,
                        locale,
                        timeZone,
                        calendar,
                        {
                            month: 'short',
                            day: 'numeric',
                            weekday: 'short',
                        }),
                };
        }
    }

    private onAM(event: Event) {
        event.preventDefault();
        event.stopPropagation();

        if (this._value instanceof CalendarDate) {
            return;
        }
        const value = this._value
            ? this._value
            : this._displayedTime;
        if (value.hour >= 12) {
            this.setDateTimeValue(value.cycle('hour', -12));

            const root = this.shadowRoot;
            if (root) {
                const amButton = root.querySelector('.am-button');
                if (amButton) {
                    if (this._displayedTime.hour >= 12) {
                        amButton.classList.add('inactive');
                    } else {
                        amButton.classList.remove('inactive');
                    }
                }
                const pmButton = root.querySelector('.pm-button');
                if (pmButton) {
                    if (this._displayedTime.hour < 12) {
                        pmButton.classList.add('inactive');
                    } else {
                        pmButton.classList.remove('inactive');
                    }
                }
            }
        }
    }

    private onCalendarChange(event: Event) {
        event.preventDefault();
        event.stopPropagation();

        if (!(event instanceof CustomEvent)
            || !event.detail
            || typeof event.detail.value !== 'string') {
            return;
        }

        const root = this.shadowRoot;
        if (!root) {
            return;
        }

        let timeZone = this.dataset.timeZone?.toLowerCase()
            || getLocalTimeZone();
        const options = new DateFormatter(this.dataset.locale || 'en-US', {
            calendar: event.detail.value,
            timeZone: timeZone,
        }).resolvedOptions();
        const locale = options.locale;
        const calendarName = options.calendar;
        const calendar = createCalendar(calendarName);
        timeZone = options.timeZone;

        if (this._value) {
            if (!(this._value instanceof Time)) {
                this.setDateTimeValue(toCalendar(this._value, calendar));
                this.setView(this._view);
            }
        } else {
            this._displayedDate = toCalendar(this._displayedDate, calendar);
            this.setView(this._view);
        }

        const valueOrNow = this._value || now(timeZone);
        const display = this.getValueAndDisplay(valueOrNow);

        const yearButton = root.querySelector('.year-button');
        if (yearButton) {
            yearButton.textContent = getLocaleString(valueOrNow, locale, timeZone, calendarName, { era: 'short', year: 'numeric' });
        }

        const currentButton = root.querySelector('.current-date-button');
        if (currentButton) {
            currentButton.textContent = display.currentDate || '';
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

    private onExpandView(event: Event) {
        event.preventDefault();
        event.stopPropagation();

        if (this._view < DateTimeViewType.year) {
            this.setView((this._view + 1) as DateTimeViewType);
        } else if (this._view === DateTimeViewType.year) {
            const yearStep = getMultipliedByTen(this._yearStep);
            const period = getMultipliedByTen(yearStep);
            const eraEndDate = this._displayedDate.calendar.getYearsInEra(this._displayedDate);
            if ((this._displayedDate.year - (this._displayedDate.year % period)) + period > eraEndDate) {
                this.setView(DateTimeViewType.era);
            } else {
                this.setView(DateTimeViewType.year, yearStep);
            }
        }
    }

    private onHourDown(event: Event) {
        event.preventDefault();
        event.stopPropagation();

        if (this._value) {
            this.setDateTimeValue(this._value.subtract({ hours: 1 }));
        } else if (this.hasAttribute('date')) {
            let timeZone = this.dataset.timeZone;
            const root = this.shadowRoot;
            if (root) {
                const timeZoneInput = root.querySelector('.timezone-input');
                if (timeZoneInput instanceof TavenemInputHtmlElement
                    && timeZoneInput.value
                    && timeZoneInput.value.length) {
                    timeZone = timeZoneInput.value;
                }
            }
            const options = new DateFormatter(this.dataset.locale || 'en-US', {
                timeZone: timeZone || getLocalTimeZone(),
            }).resolvedOptions();
            timeZone = options.timeZone;
            const dateTime = toZoned(toCalendarDateTime(this._displayedDate, this._displayedTime), timeZone);
            this.setDateTimeValue(dateTime.subtract({ hours: 1 }));
        } else {
            this.setDateTimeValue(this._displayedTime.subtract({ hours: 1 }));
        }
    }

    private onHourInput(event: Event) {
        event.preventDefault();
        event.stopPropagation();

        if (!(event instanceof CustomEvent)
            || !event.detail
            || !event.detail.value
            || typeof event.detail.value !== 'string'
            || !event.detail.value.length) {
            return;
        }

        let value = parseInt(event.detail.value);
        if (!Number.isFinite(value)) {
            return;
        }

        if (this._value) {
            this.setDateTimeValue(this._value.set({ hour: value }));
        } else if (this.hasAttribute('date')) {
            let timeZone = this.dataset.timeZone;
            const root = this.shadowRoot;
            if (root) {
                const timeZoneInput = root.querySelector('.timezone-input');
                if (timeZoneInput instanceof TavenemInputHtmlElement
                    && timeZoneInput.value
                    && timeZoneInput.value.length) {
                    timeZone = timeZoneInput.value;
                }
            }
            const options = new DateFormatter(this.dataset.locale || 'en-US', {
                timeZone: timeZone || getLocalTimeZone(),
            }).resolvedOptions();
            timeZone = options.timeZone;
            const dateTime = toZoned(toCalendarDateTime(this._displayedDate, this._displayedTime), timeZone);
            this.setDateTimeValue(dateTime.set({ hour: value }));
        } else {
            this.setDateTimeValue(this._displayedTime.set({ hour: value }));
        }
    }

    private onHourUp(event: Event) {
        event.preventDefault();
        event.stopPropagation();


        if (this._value) {
            this.setDateTimeValue(this._value.add({ hours: 1 }));
        } else if (this.hasAttribute('date')) {
            let timeZone = this.dataset.timeZone;
            const root = this.shadowRoot;
            if (root) {
                const timeZoneInput = root.querySelector('.timezone-input');
                if (timeZoneInput instanceof TavenemInputHtmlElement
                    && timeZoneInput.value
                    && timeZoneInput.value.length) {
                    timeZone = timeZoneInput.value;
                }
            }
            const options = new DateFormatter(this.dataset.locale || 'en-US', {
                timeZone: timeZone || getLocalTimeZone(),
            }).resolvedOptions();
            timeZone = options.timeZone;
            const dateTime = toZoned(toCalendarDateTime(this._displayedDate, this._displayedTime), timeZone);
            this.setDateTimeValue(dateTime.add({ hours: 1 }));
        } else {
            this.setDateTimeValue(this._displayedTime.add({ hours: 1 }));
        }
    }

    private onMinuteDown(event: Event) {
        event.preventDefault();
        event.stopPropagation();

        if (this._value) {
            this.setDateTimeValue(this._value.subtract({ minutes: 1 }));
        } else if (this.hasAttribute('date')) {
            let timeZone = this.dataset.timeZone;
            const root = this.shadowRoot;
            if (root) {
                const timeZoneInput = root.querySelector('.timezone-input');
                if (timeZoneInput instanceof TavenemInputHtmlElement
                    && timeZoneInput.value
                    && timeZoneInput.value.length) {
                    timeZone = timeZoneInput.value;
                }
            }
            const options = new DateFormatter(this.dataset.locale || 'en-US', {
                timeZone: timeZone || getLocalTimeZone(),
            }).resolvedOptions();
            timeZone = options.timeZone;
            const dateTime = toZoned(toCalendarDateTime(this._displayedDate, this._displayedTime), timeZone);
            this.setDateTimeValue(dateTime.subtract({ minutes: 1 }));
        } else {
            this.setDateTimeValue(this._displayedTime.subtract({ minutes: 1 }));
        }
    }

    private onMinuteInput(event: Event) {
        event.preventDefault();
        event.stopPropagation();

        if (!(event instanceof CustomEvent)
            || !event.detail
            || !event.detail.value
            || typeof event.detail.value !== 'string'
            || !event.detail.value.length) {
            return;
        }

        let value = parseInt(event.detail.value);
        if (!Number.isFinite(value)) {
            return;
        }

        if (this._value) {
            this.setDateTimeValue(this._value.set({ minute: 1 }));
        } else if (this.hasAttribute('date')) {
            let timeZone = this.dataset.timeZone;
            const root = this.shadowRoot;
            if (root) {
                const timeZoneInput = root.querySelector('.timezone-input');
                if (timeZoneInput instanceof TavenemInputHtmlElement
                    && timeZoneInput.value
                    && timeZoneInput.value.length) {
                    timeZone = timeZoneInput.value;
                }
            }
            const options = new DateFormatter(this.dataset.locale || 'en-US', {
                timeZone: timeZone || getLocalTimeZone(),
            }).resolvedOptions();
            timeZone = options.timeZone;
            const dateTime = toZoned(toCalendarDateTime(this._displayedDate, this._displayedTime), timeZone);
            this.setDateTimeValue(dateTime.set({ minute: 1 }));
        } else {
            this.setDateTimeValue(this._displayedTime.set({ minute: 1 }));
        }
    }

    private onMinuteUp(event: Event) {
        event.preventDefault();
        event.stopPropagation();

        if (this._value) {
            this.setDateTimeValue(this._value.add({ minutes: 1 }));
        } else if (this.hasAttribute('date')) {
            let timeZone = this.dataset.timeZone;
            const root = this.shadowRoot;
            if (root) {
                const timeZoneInput = root.querySelector('.timezone-input');
                if (timeZoneInput instanceof TavenemInputHtmlElement
                    && timeZoneInput.value
                    && timeZoneInput.value.length) {
                    timeZone = timeZoneInput.value;
                }
            }
            const options = new DateFormatter(this.dataset.locale || 'en-US', {
                timeZone: timeZone || getLocalTimeZone(),
            }).resolvedOptions();
            timeZone = options.timeZone;
            const dateTime = toZoned(toCalendarDateTime(this._displayedDate, this._displayedTime), timeZone);
            this.setDateTimeValue(dateTime.add({ minutes: 1 }));
        } else {
            this.setDateTimeValue(this._displayedTime.add({ minutes: 1 }));
        }
    }

    private onOk(event: Event) {
        event.preventDefault();
        event.stopPropagation();

        this.setOpen(false);
    }

    private onOuterKeyUp(event: Event) { this.onKeyUp(event as KeyboardEvent); }

    private onOuterMouseDown(event: Event) {
        this.onMouseDown();
        if (event.target
            && event.target instanceof Node) {
            const root = this.shadowRoot;
            if (root) {
                const pickers = root.querySelectorAll<TavenemPickerHtmlElement>('tf-picker');
                for (const picker of pickers) {
                    if (!TavenemPopover.nodeContains(picker, event.target)) {
                        picker.setOpen(false);
                    }
                }
            }
        }
    }

    private onOuterMouseUp(event: Event) {
        this.onMouseUp(event as MouseEvent);
    }

    private onOuterPopoverFocusLost(event: Event) { this.onPopoverFocusLost(event); }

    private onInput(event: Event) {
        if (this._settingValue) {
            return;
        }
        const root = this.shadowRoot;
        if (!root) {
            return;
        }
        const input = root.querySelector('.picker-value');
        if (!(input instanceof TavenemInputHtmlElement)) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        this.setValue(input.value);

        if ('popoverOpen' in this.dataset) {
            this.setOpen(false);
        } else {
            this.dispatchEvent(TavenemPickerHtmlElement.newValueChangeEvent(input.value));
        }
    }

    private onNext(event: Event) {
        event.preventDefault();
        event.stopPropagation();

        if (this._view === DateTimeViewType.date) {
            this._displayedDate = endOfMonth(this._displayedDate).add({ days: 1 });
        } else if (this._view === DateTimeViewType.month) {
            this._displayedDate = endOfYear(this._displayedDate).add({ days: 1 });
        } else if (this._view === DateTimeViewType.year) {
            const period = getMultipliedByTen(this._yearStep);
            this._displayedDate = this._displayedDate.add({ years: period - (this._displayedDate.year % period) });
        } else if (this._view === DateTimeViewType.era) {
            const eraEndYear = this._displayedDate.calendar.getYearsInEra(this._displayedDate);
            this._displayedDate = this._displayedDate.add({ years: eraEndYear - this._displayedDate.year + 1 });
        }

        this.refreshView();
    }

    private onNow(event: Event) {
        event.preventDefault();
        event.stopPropagation();

        const hasTime = this._type === DateTimeType.Date && this.hasAttribute('time');
        const hasDate = !hasTime || this.hasAttribute('date');
        if (hasTime) {
            if (hasDate) {
                this.setDateTimeValue(this.getNow());
            } else {
                this.setDateTimeValue(toTime(this.getNow()));
            }
        } else {
            this.setDateTimeValue(toCalendarDate(this.getNow()));
        }
    }

    private onPM(event: Event) {
        event.preventDefault();
        event.stopPropagation();

        if (this._value instanceof CalendarDate) {
            return;
        }
        const value = this._value
            ? this._value
            : this._displayedTime;
        if (value.hour < 12) {
            this.setDateTimeValue(value.cycle('hour', 12));

            const root = this.shadowRoot;
            if (root) {
                const amButton = root.querySelector('.am-button');
                if (amButton && this._displayedTime.hour >= 12) {
                    amButton.classList.add('inactive');
                }
                const pmButton = root.querySelector('.pm-button');
                if (pmButton && this._displayedTime.hour < 12) {
                    pmButton.classList.add('inactive');
                }
            }
        }
    }

    private onPrevious(event: Event) {
        event.preventDefault();
        event.stopPropagation();

        if (this._view === DateTimeViewType.date) {
            this._displayedDate = startOfMonth(this._displayedDate).subtract({ days: 1 });
        } else if (this._view === DateTimeViewType.month) {
            this._displayedDate = startOfYear(this._displayedDate).subtract({ days: 1 });
        } else if (this._view === DateTimeViewType.year) {
            this._displayedDate = this._displayedDate.subtract({ years: this._displayedDate.year % getMultipliedByTen(this._yearStep) });
        } else if (this._view === DateTimeViewType.era) {
            this._displayedDate = this._displayedDate.subtract({ years: this._displayedDate.year });
        }

        this.refreshView();
    }

    private onSecondDown(event: Event) {
        event.preventDefault();
        event.stopPropagation();

        if (this._value) {
            this.setDateTimeValue(this._value.subtract({ seconds: 1 }));
        } else if (this.hasAttribute('date')) {
            let timeZone = this.dataset.timeZone;
            const root = this.shadowRoot;
            if (root) {
                const timeZoneInput = root.querySelector('.timezone-input');
                if (timeZoneInput instanceof TavenemInputHtmlElement
                    && timeZoneInput.value
                    && timeZoneInput.value.length) {
                    timeZone = timeZoneInput.value;
                }
            }
            const options = new DateFormatter(this.dataset.locale || 'en-US', {
                timeZone: timeZone || getLocalTimeZone(),
            }).resolvedOptions();
            timeZone = options.timeZone;
            const dateTime = toZoned(toCalendarDateTime(this._displayedDate, this._displayedTime), timeZone);
            this.setDateTimeValue(dateTime.subtract({ seconds: 1 }));
        } else {
            this.setDateTimeValue(this._displayedTime.subtract({ seconds: 1 }));
        }
    }

    private onSecondInput(event: Event) {
        event.preventDefault();
        event.stopPropagation();

        if (!(event instanceof CustomEvent)
            || !event.detail
            || !event.detail.value
            || typeof event.detail.value !== 'string'
            || !event.detail.value.length) {
            return;
        }

        let value = parseInt(event.detail.value);
        if (!Number.isFinite(value)) {
            return;
        }

        if (this._value) {
            this.setDateTimeValue(this._value.set({ second: 1 }));
        } else if (this.hasAttribute('date')) {
            let timeZone = this.dataset.timeZone;
            const root = this.shadowRoot;
            if (root) {
                const timeZoneInput = root.querySelector('.timezone-input');
                if (timeZoneInput instanceof TavenemInputHtmlElement
                    && timeZoneInput.value
                    && timeZoneInput.value.length) {
                    timeZone = timeZoneInput.value;
                }
            }
            const options = new DateFormatter(this.dataset.locale || 'en-US', {
                timeZone: timeZone || getLocalTimeZone(),
            }).resolvedOptions();
            timeZone = options.timeZone;
            const dateTime = toZoned(toCalendarDateTime(this._displayedDate, this._displayedTime), timeZone);
            this.setDateTimeValue(dateTime.set({ second: 1 }));
        } else {
            this.setDateTimeValue(this._displayedTime.set({ second: 1 }));
        }
    }

    private onSecondUp(event: Event) {
        event.preventDefault();
        event.stopPropagation();

        if (this._value) {
            this.setDateTimeValue(this._value.add({ seconds: 1 }));
        } else if (this.hasAttribute('date')) {
            let timeZone = this.dataset.timeZone;
            const root = this.shadowRoot;
            if (root) {
                const timeZoneInput = root.querySelector('.timezone-input');
                if (timeZoneInput instanceof TavenemInputHtmlElement
                    && timeZoneInput.value
                    && timeZoneInput.value.length) {
                    timeZone = timeZoneInput.value;
                }
            }
            const options = new DateFormatter(this.dataset.locale || 'en-US', {
                timeZone: timeZone || getLocalTimeZone(),
            }).resolvedOptions();
            timeZone = options.timeZone;
            const dateTime = toZoned(toCalendarDateTime(this._displayedDate, this._displayedTime), timeZone);
            this.setDateTimeValue(dateTime.add({ seconds: 1 }));
        } else {
            this.setDateTimeValue(this._displayedTime.add({ seconds: 1 }));
        }
    }

    private onSelectViewDate(value: CalendarDate, view: DateTimeViewType, periodStep: number, event: Event) {
        event.preventDefault();
        event.stopPropagation();

        this._displayedDate = value;
        this.setView(view, periodStep);
    }

    private onSelectDate(value: CalendarDate, event: Event) {
        event.preventDefault();
        event.stopPropagation();

        if (this._value) {
            if (this._value instanceof ZonedDateTime) {
                this.setDateTimeValue(toZoned(toCalendarDateTime(value, toTime(this._value)), this._value.timeZone));
            } else if (this._value instanceof CalendarDateTime) {
                this.setDateTimeValue(toCalendarDateTime(value, toTime(this._value)));
            } else {
                this.setDateTimeValue(value);
            }
        } else if (this.hasAttribute('time')) {
            if ('timeZone' in this.dataset || 'showTimeZone' in this.dataset) {
                let timeZone = this.dataset.timeZone;
                const root = this.shadowRoot;
                if (root) {
                    const timeZoneInput = root.querySelector('.timezone-input');
                    if (timeZoneInput instanceof TavenemInputHtmlElement
                        && timeZoneInput.value
                        && timeZoneInput.value.length) {
                        timeZone = timeZoneInput.value;
                    }
                }
                const options = new DateFormatter(this.dataset.locale || 'en-US', {
                    timeZone: timeZone || getLocalTimeZone(),
                }).resolvedOptions();
                timeZone = options.timeZone;
                this.setDateTimeValue(toZoned(toCalendarDateTime(value, this._displayedTime), timeZone));
            } else {
                this.setDateTimeValue(toCalendarDateTime(value, this._displayedTime));
            }
        } else {
            this.setDateTimeValue(value);
        }

        this.setOpen(false);
    }

    private onShowAllCalendars(event: Event) {
        event.preventDefault();
        event.stopPropagation();

        if ((this._type === DateTimeType.Date
            && this.hasAttribute('time')
            && !this.hasAttribute('date'))
            || !('showCalendar' in this.dataset)
            || supportedCalendars.length === 0) {
            return;
        }
        const root = this.shadowRoot;
        if (!root) {
            return;
        }
        const allCalendarsCheckboxInput = root.querySelector('.all-calendars-input');
        if (!(allCalendarsCheckboxInput instanceof HTMLInputElement)) {
            return;
        }

        const list = root.querySelector('.calendars-option-list');
        if (!list) {
            return;
        }

        let calendars: string[] = [];
        if (allCalendarsCheckboxInput.checked) {
            calendars = supportedCalendars;
        } else {
            let calendarName = this.dataset.calendar?.toLowerCase();
            calendarName = calendarName && supportedCalendars.includes(calendarName) ? calendarName : "gregory";
            const options = new DateFormatter(this.dataset.locale || 'en-US', {
                calendar: calendarName,
            }).resolvedOptions();
            const locale = options.locale;
            calendarName = options.calendar;

            if (locale && locale.length) {
                const intlLocale = new Intl.Locale(locale);
                let localeCalendars: string[] = [];
                if (typeof (intlLocale as any).getCalendars === "function") {
                    localeCalendars = (intlLocale as any).getCalendars();
                } else if (typeof (intlLocale as any).calendars !== "undefined") {
                    localeCalendars = (intlLocale as any).calendars;
                }
                if (localeCalendars.length) {
                    calendars = supportedCalendars.filter(x => localeCalendars.includes(x));
                    if (calendars.length <= 1
                        || !calendars.includes(calendarName)) {
                        calendars = supportedCalendars;
                    }
                } else {
                    calendars = supportedCalendars;
                }
            } else {
                calendars = supportedCalendars;
            }
        }

        const dn = new Intl.DisplayNames("en", { type: "calendar" });
        const newChildren: Node[] = [];
        for (const z of calendars) {
            const option = document.createElement('div');
            option.dataset.closePicker = '';
            option.dataset.closePickerValue = z;
            option.dataset.closePickerDisplay = dn.of(z);
            option.textContent = dn.of(z) || z;
            newChildren.push(option);
        }
        list.replaceChildren(...newChildren);
    }

    private onShowAllTimeZones(event: Event) {
        event.preventDefault();
        event.stopPropagation();

        if (this._type !== DateTimeType.Date
            || !this.hasAttribute('time')
            || !('showTimeZone' in this.dataset)) {
            return;
        }
        const root = this.shadowRoot;
        if (!root) {
            return;
        }
        const allTimeZonesCheckboxInput = root.querySelector('.all-time-zones-input');
        if (!(allTimeZonesCheckboxInput instanceof HTMLInputElement)) {
            return;
        }

        const list = root.querySelector('.timezone-option-list');
        if (!list) {
            return;
        }

        let timeZones: string[] = [];
        if (allTimeZonesCheckboxInput.checked) {
            timeZones = Intl.supportedValuesOf('timeZone');
        } else {
            if ('locale' in this.dataset
                && this.dataset.locale
                && this.dataset.locale.length) {
                let timeZone = this.dataset.timeZone?.toLowerCase()
                    || getLocalTimeZone();
                const options = new DateFormatter(this.dataset.locale || 'en-US', {
                    timeZone: timeZone,
                }).resolvedOptions();
                const locale = options.locale;
                timeZone = options.timeZone;

                let localeTimeZones: string[] = [];
                const intlLocale = new Intl.Locale(locale);
                if (typeof (intlLocale as any).getTimeZones === "function") {
                    localeTimeZones = (intlLocale as any).getTimeZones();
                } else if (typeof (intlLocale as any).timeZones !== "undefined") {
                    localeTimeZones = (intlLocale as any).timeZones;
                }
                if (localeTimeZones.length) {
                    const allTimeZones = Intl.supportedValuesOf('timeZone');
                    timeZones = allTimeZones.filter(x => localeTimeZones.includes(x));
                    if (timeZone && !timeZones.includes(timeZone)) {
                        timeZones = allTimeZones;
                    }
                } else {
                    timeZones = Intl.supportedValuesOf('timeZone');
                }
            } else {
                timeZones = Intl.supportedValuesOf('timeZone');
            }
        }

        const newChildren: Node[] = [];
        for (const z of timeZones) {
            const option = document.createElement('div');
            option.dataset.closePicker = '';
            option.dataset.closePickerValue = z;
            option.textContent = z;
            newChildren.push(option);
        }
        list.replaceChildren(...newChildren);
    }

    private onShowNow() {
        if (!this._value) {
            return;
        }

        if (this._value instanceof CalendarDate) {
            this._displayedDate = this._value;
        } else if (this._value instanceof ZonedDateTime
            || this._value instanceof CalendarDateTime) {
            this._displayedDate = toCalendarDate(this._value);
        }
        if (this._type > DateTimeType.Month) {
            this.setView(DateTimeViewType.date);
        } else {
            this.refreshView();
        }
    }

    private onTimeZoneChange(event: Event) {
        event.preventDefault();
        event.stopPropagation();

        if (this._value instanceof ZonedDateTime) {
            if (event instanceof CustomEvent
                && event.detail
                && typeof event.detail.value === 'string'
                && event.detail.value.length) {
                this.setDateTimeValue(toTimeZone(this._value, event.detail.value));
            } else {
                const root = this.shadowRoot;
                if (root) {
                    const timeZoneInput = root.querySelector('.timezone-input');
                    if (timeZoneInput instanceof TavenemInputHtmlElement
                        && timeZoneInput.value
                        && timeZoneInput.value.length) {
                        timeZoneInput.value = this._value.timeZone;
                    }
                }
            }
        }
    }

    private parseValue(input?: string | null) {
        if (!input || !input.length) {
            return undefined;
        }

        let calendar = this.dataset.calendar;
        let timeZone = this.dataset.timeZone;
        const root = this.shadowRoot;
        if (root) {
            const calendarInput = root.querySelector('.calendar-input');
            if (calendarInput instanceof TavenemInputHtmlElement
                && calendarInput.value
                && calendarInput.value.length) {
                calendar = calendarInput.value;
            }

            const timeZoneInput = root.querySelector('.timezone-input');
            if (timeZoneInput instanceof TavenemInputHtmlElement
                && timeZoneInput.value
                && timeZoneInput.value.length) {
                timeZone = timeZoneInput.value;
            }
        }

        calendar = calendar && supportedCalendars.includes(calendar) ? calendar : "gregory";

        const options = new DateFormatter(this.dataset.locale || 'en-US', {
            calendar: calendar,
            timeZone: timeZone || getLocalTimeZone(),
        }).resolvedOptions();
        calendar = options.calendar;
        timeZone = options.timeZone;

        const hasTime = this._type === DateTimeType.Date && this.hasAttribute('time');
        const hasDate = !hasTime || this.hasAttribute('date');
        let value: CalendarDate | CalendarDateTime | Time | ZonedDateTime | undefined;
        if (hasTime) {
            if (hasDate) {
                try {
                    value = parseZonedDateTime(input);
                    if (value) {
                        if (value.calendar.identifier !== calendar) {
                            value = toCalendar(value, createCalendar(calendar));
                        }
                        return value;
                    }
                } catch { }
                try {
                    value = parseAbsolute(input, timeZone);
                    if (value) {
                        if (value.calendar.identifier !== calendar) {
                            value = toCalendar(value, createCalendar(calendar));
                        }
                        return value;
                    }
                } catch { }
                try {
                    value = parseDateTime(input);
                    if (value) {
                        if (value.calendar.identifier !== calendar) {
                            value = toCalendar(value, createCalendar(calendar));
                        }
                        if ('timeZone' in this.dataset || 'showTimeZone' in this.dataset) {
                            return toZoned(value, timeZone);
                        }
                        return value;
                    }
                } catch { }
                value = parseDateTimeString(input);
                if (value instanceof Time) {
                    value = undefined;
                } else if (value instanceof CalendarDate
                    || value instanceof CalendarDateTime) {
                    value = toZoned(value, timeZone);
                } else if (value instanceof ZonedDateTime
                    && value.timeZone !== timeZone) {
                    value = toTimeZone(value, timeZone);
                }
                if (value && value.calendar.identifier !== calendar) {
                    value = toCalendar(value, createCalendar(calendar));
                }
                if (value && value.calendar.identifier !== calendar) {
                    value = toCalendar(value, createCalendar(calendar));
                }
                return value;
            }
            try {
                value = parseTime(input);
                if (value) {
                    return value;
                }
            } catch { }
            value = parseTimeString(input);
            if (value) {
                return value;
            }
            value = parseDateTimeString(input);
            if (value instanceof CalendarDate) {
                value = undefined;
            } else if (value instanceof ZonedDateTime
                || value instanceof CalendarDateTime) {
                value = toTime(value);
            }
            return value;
        }
        switch (this._type) {
            case DateTimeType.Year:
                try {
                    const year = parseInt(input);
                    if (Number.isFinite(year) && year >= 0) {
                        return new CalendarDate(createCalendar(calendar), year, 1, 1);
                    }
                } catch { }
                break;
            case DateTimeType.Month:
                const m = input.match(YEAR_MONTH_RE);
                if (m) {
                    const year = parseInt(m[1]);
                    const month = parseInt(m[2]);
                    if (Number.isFinite(year) && year >= 0 && year <= 9999
                        && Number.isFinite(month) && month >= 1 && month <= 12) {
                        return new CalendarDate(createCalendar(calendar), year, month, 1);
                    }
                }
                break;
            case DateTimeType.Date:
                try {
                    return parseDate(input);
                } catch { }
                break;
        }
        value = parseDateTimeString(input);
        if (value instanceof Time) {
            value = undefined;
        } else if (value instanceof ZonedDateTime
            || value instanceof CalendarDateTime) {
            value = toCalendarDate(value);
        }
        if (value && value.calendar.identifier !== calendar) {
            value = toCalendar(value, createCalendar(calendar));
        }
        return value;
    }

    private refreshDateView() {
        const root = this.shadowRoot;
        if (!root) {
            return;
        }
        const selection = root.querySelector('.selection');
        if (!(selection instanceof HTMLElement)) {
            return;
        }
        selection.classList.remove('months');
        selection.classList.add('calendar');

        root.querySelectorAll('.calendar-control')
            .forEach(x => x.remove());

        let calendar = this.dataset.calendar;
        let timeZone = this.dataset.timeZone;

        const calendarInput = root.querySelector('.calendar-input');
        if (calendarInput instanceof TavenemInputHtmlElement
            && calendarInput.value
            && calendarInput.value.length) {
            calendar = calendarInput.value;
        }

        const timeZoneInput = root.querySelector('.timezone-input');
        if (timeZoneInput instanceof TavenemInputHtmlElement
            && timeZoneInput.value
            && timeZoneInput.value.length) {
            timeZone = timeZoneInput.value;
        }

        const options = new DateFormatter(this.dataset.locale || 'en-US', {
            calendar: calendar && supportedCalendars.includes(calendar) ? calendar : "gregory",
            timeZone: timeZone || getLocalTimeZone(),
        }).resolvedOptions();
        const locale = options.locale;
        calendar = options.calendar;
        timeZone = options.timeZone;

        const nowDateTime = now(timeZone);
        
        const firstOfMonth = startOfMonth(this._displayedDate);
        let displayedDate = startOfWeek(firstOfMonth, locale);
        const { weekYear, weekNumber, weekday } = getWeek(firstOfMonth);
        const weeks = getWeeksInMonth(this._displayedDate, locale);
        for (let week = 0; week < weeks; week++) {
            if (this._type === DateTimeType.Week) {
                const weekLabel = document.createElement('span');
                weekLabel.classList.add('calendar-control', 'week-label');
                weekLabel.textContent = `W${(weekNumber + week).toString()}`;
                selection.appendChild(weekLabel);
            }

            let noMoreDates = false;
            for (var i = 0; i < 7; i++) {
                const dayOfWeek = getDayOfWeek(displayedDate, locale);
                if (dayOfWeek !== i) {
                    const placeholder = document.createElement('span');
                    placeholder.classList.add('calendar-control', 'missing-day');
                    selection.appendChild(placeholder);
                } else {
                    const dateButton = document.createElement('button') as DateButton;
                    dateButton.date = displayedDate;
                    dateButton.type = 'button';
                    dateButton.classList.add('btn-text', 'calendar-control', 'date-button');
                    if ((this._value instanceof CalendarDate
                        || this._value instanceof CalendarDateTime
                        || this._value instanceof ZonedDateTime)
                        && isEqualDay(displayedDate, this._value)) {
                        dateButton.classList.add('active');
                    }
                    if (isEqualDay(displayedDate, nowDateTime)) {
                        dateButton.classList.add('today');
                    }
                    if (displayedDate.month !== this._displayedDate.month) {
                        dateButton.classList.add('text-muted');
                    }
                    dateButton.disabled = (!(this._min instanceof Time) && displayedDate.compare(this._min) < 0)
                        || (!(this._max instanceof Time) && displayedDate.compare(this._max) > 0);
                    dateButton.textContent = getLocaleString(displayedDate, locale, timeZone, calendar, { day: 'numeric' });
                    selection.appendChild(dateButton);
                    dateButton.addEventListener('click', this.onSelectDate.bind(this, displayedDate));
                }
                
                const newDisplayedDate = displayedDate.add({ days: 1 });
                if (newDisplayedDate.day === displayedDate.day) {
                    noMoreDates = true;
                    break;
                }
                displayedDate = newDisplayedDate;
            }
            if (noMoreDates) {
                break;
            }
        }
    }

    private refreshEraView() {
        const eraEndYear = this._displayedDate.calendar.getYearsInEra(this._displayedDate);
        if (eraEndYear < 20) {
            this.refreshYearView();
            return;
        }

        this._yearStep = Math.pow(10, Math.floor(Math.log10(eraEndYear)));
        this.refreshYearView();
    }

    private refreshMonthView() {
        const root = this.shadowRoot;
        if (!root) {
            return;
        }
        const selection = root.querySelector('.selection');
        if (!(selection instanceof HTMLElement)) {
            return;
        }
        selection.classList.add('months');
        selection.classList.remove('calendar');

        root.querySelectorAll('.calendar-control')
            .forEach(x => x.remove());

        let calendar = this.dataset.calendar;
        let timeZone = this.dataset.timeZone;

        const calendarInput = root.querySelector('.calendar-input');
        if (calendarInput instanceof TavenemInputHtmlElement
            && calendarInput.value
            && calendarInput.value.length) {
            calendar = calendarInput.value;
        }

        const timeZoneInput = root.querySelector('.timezone-input');
        if (timeZoneInput instanceof TavenemInputHtmlElement
            && timeZoneInput.value
            && timeZoneInput.value.length) {
            timeZone = timeZoneInput.value;
        }

        const options = new DateFormatter(this.dataset.locale || 'en-US', {
            calendar: calendar && supportedCalendars.includes(calendar) ? calendar : "gregory",
            timeZone: timeZone || getLocalTimeZone(),
        }).resolvedOptions();
        const locale = options.locale;
        calendar = options.calendar;
        timeZone = options.timeZone;

        const nowDateTime = now(timeZone);

        const months = this._displayedDate.calendar.getMonthsInYear(this._displayedDate);

        let monthDate = startOfYear(this._displayedDate);
        for (let i = 1; i <= months; i++) {
            const monthEnd = endOfMonth(monthDate);

            const monthButton = document.createElement('button') as DateButton;
            monthButton.date = monthDate;
            monthButton.type = 'button';
            monthButton.classList.add('btn-text', 'calendar-control', 'month-button');
            if ((this._value instanceof CalendarDate
                || this._value instanceof CalendarDateTime
                || this._value instanceof ZonedDateTime)
                && this._value.compare(monthDate) >= 0
                && this._value.compare(monthEnd) <= 0) {
                monthButton.classList.add('active');
            }
            if (nowDateTime.compare(monthDate) >= 0
                && nowDateTime.compare(monthEnd) <= 0) {
                monthButton.classList.add('today');
            }
            monthButton.disabled = (!(this._min instanceof Time) && monthEnd.compare(this._min) < 0)
                || (!(this._max instanceof Time) && monthDate.compare(this._max) > 0);
            monthButton.textContent = getLocaleString(monthDate, locale, timeZone, calendar, { month: 'short' });
            selection.appendChild(monthButton);
            monthButton.addEventListener('click', this.onSelectViewDate.bind(this, monthDate, DateTimeViewType.date, 1));

            const newMonth = monthDate.add({ months: 1 });
            if (newMonth.month === monthDate.month) {
                break;
            }
            monthDate = newMonth;
        }
    }

    private refreshYearView() {
        const root = this.shadowRoot;
        if (!root) {
            return;
        }
        const selection = root.querySelector('.selection');
        if (!(selection instanceof HTMLElement)) {
            return;
        }
        selection.classList.remove('calendar', 'months');

        root.querySelectorAll('.calendar-control')
            .forEach(x => x.remove());

        let calendar = this.dataset.calendar;
        let timeZone = this.dataset.timeZone;

        const calendarInput = root.querySelector('.calendar-input');
        if (calendarInput instanceof TavenemInputHtmlElement
            && calendarInput.value
            && calendarInput.value.length) {
            calendar = calendarInput.value;
        }

        const timeZoneInput = root.querySelector('.timezone-input');
        if (timeZoneInput instanceof TavenemInputHtmlElement
            && timeZoneInput.value
            && timeZoneInput.value.length) {
            timeZone = timeZoneInput.value;
        }

        const options = new DateFormatter(this.dataset.locale || 'en-US', {
            calendar: calendar && supportedCalendars.includes(calendar) ? calendar : "gregory",
            timeZone: timeZone || getLocalTimeZone(),
        }).resolvedOptions();
        const locale = options.locale;
        calendar = options.calendar;
        timeZone = options.timeZone;

        const nowDateTime = now(timeZone);

        const period = getMultipliedByTen(this._yearStep);
        const startYear = this._displayedDate.year - (this._displayedDate.year % period);
        const endYear = Math.min(
            this._displayedDate.calendar.getYearsInEra(this._displayedDate),
            startYear + (startYear === 1 ? period - 2 : period - 1));
        let displayedDate = startOfYear(this._displayedDate).set({ year: startYear });
        while (displayedDate.year >= startYear
            && displayedDate.year <= endYear) {
            const displayedEndDate = endOfYear(this._yearStep === 1
                ? displayedDate
                : displayedDate.add({ years: (this._yearStep - 1) - (displayedDate.year % this._yearStep) }));

            const periodButton = document.createElement('button') as DateButton;
            periodButton.date = displayedDate;
            periodButton.type = 'button';
            periodButton.classList.add('btn-text', 'calendar-control', 'period-button');
            if ((this._value instanceof CalendarDate
                || this._value instanceof CalendarDateTime
                || this._value instanceof ZonedDateTime)
                && (this._value.compare(displayedDate) >= 0
                    || this._value.compare(displayedEndDate) <= 0)) {
                periodButton.classList.add('active');
            }
            if (nowDateTime.compare(displayedDate) >= 0
                && nowDateTime.compare(displayedEndDate) <= 0) {
                periodButton.classList.add('today');
            }
            periodButton.disabled = (!(this._min instanceof Time) && displayedEndDate.compare(this._min) < 0)
                || (!(this._max instanceof Time) && displayedDate.compare(this._max) > 0);
            periodButton.textContent = displayedEndDate.year > displayedDate.year
                ? `${getLocaleString(displayedDate, locale, timeZone, calendar, { year: 'numeric' })}-${getLocaleString(displayedEndDate, locale, timeZone, calendar, { year: 'numeric' })}`
                : getLocaleString(displayedDate, locale, timeZone, calendar, { year: 'numeric' });
            selection.appendChild(periodButton);
            if (this._yearStep === 1) {
                periodButton.addEventListener('click', this.onSelectViewDate.bind(this, displayedDate, DateTimeViewType.month, 1));
            } else {
                periodButton.addEventListener('click', this.onSelectViewDate.bind(this, displayedDate, DateTimeViewType.year, getDividedByTen(this._yearStep)));
            }

            const newDisplayedDate = displayedDate.add({ years: this._yearStep - (displayedDate.year % this._yearStep) });
            if (newDisplayedDate.year === displayedEndDate.year) {
                break;
            }
            displayedDate = newDisplayedDate;
        }
    }

    private refreshView() {
        const root = this.shadowRoot;
        if (!root) {
            return;
        }

        const period = getMultipliedByTen(this._yearStep);

        const previous = root.querySelector('.previous');
        if (previous instanceof HTMLButtonElement) {
            let referenceDate: CalendarDate | undefined;
            switch (this._view) {
                case DateTimeViewType.date:
                    referenceDate = startOfMonth(this._displayedDate);
                    break;
                case DateTimeViewType.month:
                    referenceDate = startOfYear(this._displayedDate);
                    break;
                case DateTimeViewType.year:
                    referenceDate = startOfYear(this._displayedDate
                        .subtract({ years: this._displayedDate.year % period }));
                    break;
                case DateTimeViewType.era:
                    referenceDate = startOfYear(this._displayedDate.set({ year: 1 }));
                    break;
            }
            if (!referenceDate) {
                previous.disabled = true;
            } else {
                const previousDate = referenceDate.subtract({ days: 1 });
                previous.disabled = isEqualDay(previousDate, referenceDate)
                    || (!(this._min instanceof Time) && previousDate.compare(this._min) < 0);
            }
        }

        const next = root.querySelector('.next');
        if (next instanceof HTMLButtonElement) {
            let referenceDate: CalendarDate | undefined;
            switch (this._view) {
                case DateTimeViewType.date:
                    referenceDate = endOfMonth(this._displayedDate);
                    break;
                case DateTimeViewType.month:
                    referenceDate = endOfYear(this._displayedDate);
                    break;
                case DateTimeViewType.year:
                    referenceDate = endOfYear(this._displayedDate
                        .add({ years: (period - 1) - (this._displayedDate.year % period) }));
                    break;
                case DateTimeViewType.era:
                    referenceDate = endOfYear(this._displayedDate.set({ year: this._displayedDate.calendar.getYearsInEra(this._displayedDate) }));
                    break;
            }
            if (!referenceDate) {
                next.disabled = true;
            } else {
                const nextDate = referenceDate.add({ days: 1 });
                next.disabled = isEqualDay(nextDate, referenceDate)
                    || (!(this._max instanceof Time) && nextDate.compare(this._max) > 0);
            }
        }

        let calendar = this.dataset.calendar;
        let timeZone = this.dataset.timeZone;

        const calendarInput = root.querySelector('.calendar-input');
        if (calendarInput instanceof TavenemInputHtmlElement
            && calendarInput.value
            && calendarInput.value.length) {
            calendar = calendarInput.value;
        }

        const timeZoneInput = root.querySelector('.timezone-input');
        if (timeZoneInput instanceof TavenemInputHtmlElement
            && timeZoneInput.value
            && timeZoneInput.value.length) {
            timeZone = timeZoneInput.value;
        }

        const options = new DateFormatter(this.dataset.locale || 'en-US', {
            calendar: calendar && supportedCalendars.includes(calendar) ? calendar : "gregory",
            timeZone: timeZone || getLocalTimeZone(),
        }).resolvedOptions();
        const locale = options.locale;
        calendar = options.calendar;
        timeZone = options.timeZone;

        const expandViewButton = root.querySelector('.expand-view');
        if (expandViewButton) {
            switch (this._view) {
                case DateTimeViewType.date:
                    expandViewButton.textContent = getLocaleString(
                        this._displayedDate,
                        locale,
                        timeZone,
                        calendar,
                        { month: 'long', year: 'numeric' });
                    break;
                case DateTimeViewType.month:
                    expandViewButton.textContent = getLocaleString(
                        this._displayedDate,
                        locale,
                        timeZone,
                        calendar,
                        { year: 'numeric' });
                    break;
                case DateTimeViewType.year:
                    const start = startOfYear(this._displayedDate
                        .subtract({ years: this._displayedDate.year % period }));
                    const end = endOfYear(this._displayedDate
                        .add({ years: (period - 1) - (this._displayedDate.year % period) }));
                    const startYear = getLocaleString(
                        start,
                        locale,
                        timeZone,
                        calendar,
                        { year: 'numeric' });
                    const endYear = getLocaleString(
                        end,
                        locale,
                        timeZone,
                        calendar,
                        { year: 'numeric' });
                    expandViewButton.textContent = `${startYear}-${endYear}`;
                    break;
                case DateTimeViewType.era:
                    expandViewButton.textContent = this._displayedDate.era;
                    break;
            }
        }

        switch (this._view) {
            case DateTimeViewType.date:
                this.refreshDateView();
                break;
            case DateTimeViewType.month:
                this.refreshMonthView();
                break;
            case DateTimeViewType.year:
                this.refreshYearView();
                break;
            case DateTimeViewType.era:
                this.refreshEraView();
                break;
        }
    }

    private setDateTimeValue(value?: CalendarDate | CalendarDateTime | ZonedDateTime | Time | null) {
        if (!value) {
            this.clear();
            return;
        }

        if (this._value instanceof CalendarDate) {
            if (value instanceof CalendarDate
                && this._value.compare(value) == 0) {
                return;
            }
        } else if (this._value instanceof CalendarDateTime) {
            if (value instanceof CalendarDateTime
                && this._value.compare(value) === 0) {
                return;
            }
        } else if (this._value instanceof ZonedDateTime) {
            if (value instanceof ZonedDateTime
                && this._value.compare(value) === 0) {
                return;
            }
        } else if (this._value instanceof Time) {
            if (value instanceof Time
                && this._value.compare(value) === 0) {
                return;
            }
        }

        this._value = value;
        if (this._value instanceof Time) {
            if ((this._max instanceof Time && this._value.compare(this._max) > 0)
                || (this._min instanceof Time && this._value.compare(this._min) < 0)) {
                this.classList.add('invalid');
            } else {
                this.classList.remove('invalid');
            }
        } else if ((!(this._max instanceof Time) && this._value.compare(this._max) > 0)
            || (!(this._min instanceof Time) && this._value.compare(this._min) < 0)) {
            this.classList.add('invalid');
        } else {
            this.classList.remove('invalid');
        }

        const display = this.getValueAndDisplay(this._value);
        if (display.value.length) {
            this.setAttribute('value', display.value);
        } else {
            this.removeAttribute('value');
        }

        const root = this.shadowRoot;
        if (!root) {
            return;
        }

        const input = root.querySelector('.picker-value') as TavenemInputHtmlElement;
        if (input) {
            this._settingValue = true;
            input.value = display.value;
            if (display.display) {
                input.display = display.display;
            }
            this._settingValue = false;
        }

        let calendar = this.dataset.calendar;
        let timeZone = this.dataset.timeZone;

        const calendarInput = root.querySelector('.calendar-input');
        if (calendarInput instanceof TavenemInputHtmlElement
            && calendarInput.value
            && calendarInput.value.length) {
            calendar = calendarInput.value;
        }

        const timeZoneInput = root.querySelector('.timezone-input');
        if (timeZoneInput instanceof TavenemInputHtmlElement
            && timeZoneInput.value
            && timeZoneInput.value.length) {
            timeZone = timeZoneInput.value;
        }

        const options = new DateFormatter(this.dataset.locale || 'en-US', {
            calendar: calendar && supportedCalendars.includes(calendar) ? calendar : "gregory",
            timeZone: timeZone || getLocalTimeZone(),
        }).resolvedOptions();
        const locale = options.locale;
        calendar = options.calendar;
        timeZone = options.timeZone;

        const nowDateTime = now(timeZone);
        const valueOrNow = this._value || nowDateTime;
        const valueOrNowDisplay = this._value ? display : this.getValueAndDisplay(valueOrNow);
        if (valueOrNow instanceof CalendarDate) {
            this._displayedTime = toTime(nowDateTime);
        } else if (valueOrNow instanceof ZonedDateTime
            || valueOrNow instanceof CalendarDateTime) {
            this._displayedTime = toTime(valueOrNow);
        } else {
            this._displayedTime = valueOrNow;
        }

        const yearButton = root.querySelector('.year-button');
        if (yearButton) {
            yearButton.textContent = getLocaleString(
                valueOrNow,
                locale,
                timeZone,
                calendar,
                { era: 'short', year: 'numeric' });
        }
        const currentButton = root.querySelector('.current-date-button');
        if (currentButton) {
            currentButton.textContent = valueOrNowDisplay.currentDate || '';
        }
        const hourInput = root.querySelector('.hour-input');
        if (hourInput instanceof TavenemInputHtmlElement) {
            const hour12 = 'hour12' in this.dataset;
            if (hour12) {
                if (this._displayedTime.hour === 0) {
                    hourInput.value = '12';
                } else if (this._displayedTime.hour > 12) {
                    hourInput.value = (this._displayedTime.hour - 12).toString();
                } else {
                    hourInput.value = this._displayedTime.hour.toString();
                }
            } else {
                hourInput.value = this._displayedTime.hour.toString();
            }
        }
        const minuteInput = root.querySelector('.minute-input');
        if (minuteInput instanceof TavenemInputHtmlElement) {
            minuteInput.value = this._displayedTime.minute.toString();
        }
        const secondInput = root.querySelector('.second-input');
        if (secondInput instanceof TavenemInputHtmlElement) {
            secondInput.value = this._displayedTime.second.toString();
        }
        const amButton = root.querySelector('.am-button');
        if (amButton) {
            if (this._displayedTime.hour >= 12) {
                amButton.classList.add('inactive');
            } else {
                amButton.classList.remove('inactive');
            }
        }
        const pmButton = root.querySelector('.pm-button');
        if (pmButton) {
            if (this._displayedTime.hour < 12) {
                pmButton.classList.add('inactive');
            } else {
                pmButton.classList.remove('inactive');
            }
        }

        const todayDate = today(timeZone);
        const selectedDay = this._value && !(this._value instanceof Time)
            ? toCalendarDate(this._value)
            : null;
        const dayButtons = root.querySelectorAll('.date-button');
        dayButtons.forEach(x => {
            const dayButton = x as DateButton;
            if (!dayButton.date) {
                return;
            }
            if (selectedDay && isEqualDay(dayButton.date, selectedDay)) {
                dayButton.classList.add('active');
            } else {
                dayButton.classList.remove('active');
            }
            if (isEqualDay(dayButton.date, todayDate)) {
                dayButton.classList.add('today');
            } else {
                dayButton.classList.remove('today');
            }
        });
        const monthButtons = root.querySelectorAll('.month-button');
        monthButtons.forEach(x => {
            const monthButton = x as DateButton;
            if (!monthButton.date) {
                return;
            }
            const monthEnd = endOfMonth(monthButton.date);
            if (selectedDay
                && selectedDay.compare(monthButton.date) >= 0
                && selectedDay.compare(monthEnd) <= 0) {
                monthButton.classList.add('active');
            } else {
                monthButton.classList.remove('active');
            }
            if (todayDate.compare(monthButton.date) >= 0
                && todayDate.compare(monthEnd) <= 0) {
                monthButton.classList.add('today');
            } else {
                monthButton.classList.remove('today');
            }
        });
        const yearButtons = root.querySelectorAll('.period-button');
        yearButtons.forEach(x => {
            const yearButton = x as DateButton;
            if (!yearButton.date) {
                return;
            }
            const periodEnd = endOfYear(this._yearStep === 1
                ? yearButton.date
                : yearButton.date.add({ years: (this._yearStep - 1) - (yearButton.date.year % this._yearStep) }));
            if (selectedDay
                && selectedDay.compare(yearButton.date) >= 0
                && selectedDay.compare(periodEnd) <= 0) {
                yearButton.classList.add('active');
                yearButton.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                    inline: "nearest"
                });
            } else {
                yearButton.classList.remove('active');
            }
            if (todayDate.compare(yearButton.date) >= 0
                && todayDate.compare(periodEnd) <= 0) {
                yearButton.classList.add('today');
            } else {
                yearButton.classList.remove('today');
            }
        });
        const nowButton = root.querySelector('.now-button');
        if (nowButton instanceof HTMLButtonElement) {
            if (this._value instanceof CalendarDate
                || this._value instanceof CalendarDateTime
                || this._value instanceof ZonedDateTime) {
                nowButton.disabled = isEqualDay(this._value, todayDate);
            } else if (this._value instanceof Time) {
                nowButton.disabled = this._value.compare(toTime(nowDateTime)) === 0;
            }
        }
    }

    private setValue(value?: string | null) {
        if (!value || !value.length) {
            this.clear();
            return;
        }

        const dateTimeValue = this.parseValue(value);
        if (!dateTimeValue) {
            this.clear();
            this.classList.add('invalid');
        } else {
            this.setDateTimeValue(dateTimeValue);
        }
    }

    private setView(view: DateTimeViewType, yearStep?: number) {
        const currentType = Object.keys(DateTimeViewType).find(x => (DateTimeViewType as any)[x] === view);
        if (currentType) {
            this.classList.remove(currentType);
        }

        const type = Object.keys(DateTimeViewType).find(x => (DateTimeViewType as any)[x] === view);
        if (!type) {
            return;
        }

        this._yearStep = yearStep || 1;
        this.classList.add(type);
        this._view = view;
        this.refreshView();
    }
}

function getDividedByTen(value: number) {
    let result = Math.floor(value / 10);
    const mod = result % 10;
    if (mod === 0) {
        return result;
    } else if (mod < 5) {
        return Math.floor(result - mod);
    } else {
        return Math.floor(result + (10 - mod));
    }
}

function getLocaleString(
    value: CalendarDate | CalendarDateTime | ZonedDateTime | Time | null | undefined,
    locale: string,
    timeZone: string,
    calendar?: string,
    options?: Intl.DateTimeFormatOptions | null) {
    if (value instanceof CalendarDate
        || value instanceof CalendarDateTime) {
        return new DateFormatter(locale, {
            calendar: calendar,
            timeZone: timeZone,
            ...options,
        }).format(value.toDate(timeZone));
    } else if (value instanceof ZonedDateTime) {
        return new DateFormatter(locale, {
            calendar: calendar,
            timeZone: timeZone,
            ...options,
        }).format(value.toDate());
    } else if (value instanceof Time) {
        return new DateFormatter(locale, {
            calendar: calendar,
            timeZone: timeZone,
            ...options,
        }).format(toCalendarDateTime(today(timeZone), value).toDate(timeZone));
    }
    return null;
}

function getMultipliedByTen(value: number) {
    let result = Math.floor(value * 10);
    const mod = result % 10;
    if (mod === 0) {
        return result;
    } else if (mod < 5) {
        return Math.floor(result - mod);
    } else {
        return Math.floor(result + (10 - mod));
    }
}