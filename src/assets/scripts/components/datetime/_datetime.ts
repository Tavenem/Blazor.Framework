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
import { randomUUID } from '../../tavenem-utility'
import { TavenemInputHtmlElement } from '../_input'
import { TavenemPickerHtmlElement } from '../_picker'
import { TavenemSelectInputHtmlElement } from '../_select'
import { TavenemPopoverHTMLElement } from '../_popover'
import {
    defaultCalendar,
    getWeek,
    parseDateTime as parseDateTimeString,
    parseTime as parseTimeString
} from './_datetime-parser'
import { elementStyle } from './_element-style'

const internationalizedCalendars = [
    'buddhist',
    'ethiopic',
    'ethioaa',
    'coptic',
    'hebrew',
    'indian',
    'islamic-civil',
    'islamic-tbla',
    'islamic-umalqura',
    'japanese',
    'persian',
    'roc',
    'gregory'
];
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
    static formAssociated = true;

    _max: CalendarDate | CalendarDateTime | ZonedDateTime | Time = new CalendarDate(9999, 12, 31);
    _maxDisplay: string | null | undefined;
    _min: CalendarDate | CalendarDateTime | ZonedDateTime | Time = new CalendarDate('BC', 9999, 12, 31);
    _minDisplay: string | null | undefined;
    _value: CalendarDate | CalendarDateTime | ZonedDateTime | Time | null | undefined;

    private _displayedDate: CalendarDate;
    private _displayedTime: Time;
    private _formValue = '';
    private _initialValue: CalendarDate | CalendarDateTime | ZonedDateTime | Time | null | undefined;
    private _internals: ElementInternals;
    private _localTimeZone: string | undefined;
    private _settingValue = false;
    private _type: DateTimeType = DateTimeType.Date;
    private _view: DateTimeViewType = DateTimeViewType.date;
    private _yearStep: number = 1;

    static get observedAttributes() {
        return ['data-label', 'max', 'min', 'readonly', 'value'];
    }

    get form() { return this._internals.form; }

    get max() {
        if (!this._maxDisplay) {
            const { display, value } = this.getValueAndDisplay(this._max);
            this._maxDisplay = display || value;
        }
        return this._maxDisplay;
    }
    set max(v: string | null | undefined) {
        let newMax: CalendarDate | CalendarDateTime | ZonedDateTime | Time | null | undefined;
        if (v && v.length) {
            newMax = this.parseValue(v);
        }
        if (!newMax) {
            newMax = fromDate(new Date(8.64e15), this.getOptions().timeZone);
        }
        this._max = newMax;
        delete this._maxDisplay;
        this.setValidity();
    }

    get min() {
        if (!this._minDisplay) {
            const { display, value } = this.getValueAndDisplay(this._min);
            this._minDisplay = display || value;
        }
        return this._minDisplay;
    }
    set min(v: string | null | undefined) {
        let newMin: CalendarDate | CalendarDateTime | ZonedDateTime | Time | null | undefined;
        if (v && v.length) {
            newMin = this.parseValue(v);
        }
        if (!newMin) {
            newMin = fromDate(new Date(-8.64e15), this.getOptions().timeZone);
        }
        this._min = newMin;
        delete this._minDisplay;
        this.setValidity();
    }

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

    get value() { return this._formValue; }
    set value(v: string) { this.setValue(v); }

    get willValidate() { return this._internals.willValidate; }

    constructor() {
        super();

        const nowDateTime = now(new Intl.DateTimeFormat().resolvedOptions().timeZone);
        this._displayedDate = toCalendarDate(nowDateTime);
        this._displayedTime = toTime(nowDateTime);
        this._internals = this.attachInternals();
    }

    connectedCallback() {
        this._settingValue = true;
        this.dataset.popoverContainer = '';
        this.dataset.hasTextInput = '';

        if (this.hasAttribute('type')) {
            const type = this.getAttribute('type');
            if (type && type.length) {
                switch (type.toLowerCase()) {
                    case 'year':
                        this._type = DateTimeType.Year;
                        this._view = DateTimeViewType.year;
                        break;
                    case 'month':
                        this._type = DateTimeType.Month;
                        this._view = DateTimeViewType.month;
                        break;
                    case 'week':
                        this._type = DateTimeType.Week;
                        break;
                }
            }
        }

        const shadow = this.attachShadow({ mode: 'open', delegatesFocus: true });

        const style = document.createElement('style');
        style.textContent = elementStyle;
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
                        this._initialValue = this._value = parsedValue;
                    } else if (parsedValue instanceof CalendarDate
                        || parsedValue instanceof CalendarDateTime) {
                        this._initialValue = this._value = toZoned(parsedValue, timeZone);
                    }
                } else if (parsedValue instanceof Time) {
                    this._initialValue = this._value = parsedValue;
                } else if (parsedValue instanceof ZonedDateTime) {
                    this._initialValue = this._value = toTime(parsedValue);
                }
            } else if (parsedValue instanceof CalendarDate) {
                this._initialValue = this._value = parsedValue;
            } else if (parsedValue instanceof ZonedDateTime
                || parsedValue instanceof CalendarDateTime) {
                this._initialValue = this._value = toCalendarDate(parsedValue);
            }
        }

        let display = this.getValueAndDisplay(this._value);
        if (this._value && display.value.length) {
            this._internals.setFormValue(display.value);
        } else {
            this._internals.setFormValue(null);
        }

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
            input.disabled = this.hasAttribute('disabled');
            if (this._value) {
                input.value = display.value;
            }

            shadow.appendChild(input);

            const buttonIcon = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
            button.appendChild(buttonIcon);
            buttonIcon.outerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="48" viewBox="0 -960 960 960" width="48"><path d="M480-400q-17 0-28.5-11.5T440-440q0-17 11.5-28.5T480-480q17 0 28.5 11.5T520-440q0 17-11.5 28.5T480-400Zm-160 0q-17 0-28.5-11.5T280-440q0-17 11.5-28.5T320-480q17 0 28.5 11.5T360-440q0 17-11.5 28.5T320-400Zm320 0q-17 0-28.5-11.5T600-440q0-17 11.5-28.5T640-480q17 0 28.5 11.5T680-440q0 17-11.5 28.5T640-400ZM480-240q-17 0-28.5-11.5T440-280q0-17 11.5-28.5T480-320q17 0 28.5 11.5T520-280q0 17-11.5 28.5T480-240Zm-160 0q-17 0-28.5-11.5T280-280q0-17 11.5-28.5T320-320q17 0 28.5 11.5T360-280q0 17-11.5 28.5T320-240Zm320 0q-17 0-28.5-11.5T600-280q0-17 11.5-28.5T640-320q17 0 28.5 11.5T680-280q0 17-11.5 28.5T640-240ZM180-80q-24 0-42-18t-18-42v-620q0-24 18-42t42-18h65v-60h65v60h340v-60h65v60h65q24 0 42 18t18 42v620q0 24-18 42t-42 18H180Zm0-60h600v-430H180v430Z"/></svg>`;
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
            if (this.hasAttribute('readonly')) {
                input.setAttribute('readonly', '');
            }
            input.setAttribute('size', "1");
            if (this.hasAttribute('inline')) {
                input.style.display = 'none';
            }
            input.dataset.pickerNoToggle = '';
            input.addEventListener('valueinput', this.onInput.bind(this));
            input.addEventListener('valuechange', this.stopEvent.bind(this));
            shadow.appendChild(input);
            if (this._value) {
                input.value = display.value;
                if (display.display) {
                    input.display = display.display;
                }
            }

            if ((display.display && display.display.length)
                || display.value.length) {
                this._internals.states.delete('empty');
                this._internals.states.add('has-value');
            } else {
                this._internals.states.add('empty');
                this._internals.states.delete('has-value');
            }

            const expand = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
            input.appendChild(expand);
            expand.outerHTML = `<svg class="main-expand" data-picker-toggle xmlns="http://www.w3.org/2000/svg" height="48" viewBox="0 -960 960 960" width="48"><path d="M480-400q-17 0-28.5-11.5T440-440q0-17 11.5-28.5T480-480q17 0 28.5 11.5T520-440q0 17-11.5 28.5T480-400Zm-160 0q-17 0-28.5-11.5T280-440q0-17 11.5-28.5T320-480q17 0 28.5 11.5T360-440q0 17-11.5 28.5T320-400Zm320 0q-17 0-28.5-11.5T600-440q0-17 11.5-28.5T640-480q17 0 28.5 11.5T680-440q0 17-11.5 28.5T640-400ZM480-240q-17 0-28.5-11.5T440-280q0-17 11.5-28.5T480-320q17 0 28.5 11.5T520-280q0 17-11.5 28.5T480-240Zm-160 0q-17 0-28.5-11.5T280-280q0-17 11.5-28.5T320-320q17 0 28.5 11.5T360-280q0 17-11.5 28.5T320-240Zm320 0q-17 0-28.5-11.5T600-280q0-17 11.5-28.5T640-320q17 0 28.5 11.5T680-280q0 17-11.5 28.5T640-240ZM180-80q-24 0-42-18t-18-42v-620q0-24 18-42t42-18h65v-60h65v60h340v-60h65v60h65q24 0 42 18t18 42v620q0 24-18 42t-42 18H180Zm0-60h600v-430H180v430Z"/></svg>`;

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

        const inputContent = document.createElement('div');
        inputContent.classList.add('input-content');
        if (this.hasAttribute('disabled') || this.hasAttribute('readonly')) {
            inputContent.inert = true;
        }
        controlContainer.appendChild(inputContent);

        const header = document.createElement('div');
        header.classList.add('header');
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

                const select = document.createElement('tf-select') as TavenemSelectInputHtmlElement;
                select.classList.add('dense', 'calendar-select');
                select.dataset.inputStyle = `min-width: ${calendars.map(x => x.length).reduce((x, y) => Math.max(x, y), -Infinity)}ch`;
                select.dataset.popoverLimitHeight = '';
                select.style.backgroundColor = 'var(--tavenem-color-bg-input)';
                select.addEventListener('valuechange', this.onCalendarChange.bind(this));
                select.addEventListener('valueinput', this.stopEvent.bind(this));
                calendarContainer.appendChild(select);
                select.value = calendar.identifier;
                select.display = dn.of(calendar.identifier);

                const list = document.createElement('div');
                list.classList.add('option-list', 'calendars-option-list');
                list.slot = 'popover';
                select.appendChild(list);

                for (const c of calendars) {
                    const option = document.createElement('div');
                    option.dataset.closePicker = '';
                    option.dataset.closePickerValue = c;
                    option.dataset.closePickerDisplay = dn.of(c);
                    option.textContent = dn.of(c) || c;
                    list.appendChild(option);
                }

                if (calendars.length < supportedCalendars.length) {
                    const allCalendarsCheckbox = document.createElement('tf-checkbox');
                    allCalendarsCheckbox.dataset.label = 'Show All';
                    allCalendarsCheckbox.classList.add('all-calendars-input');
                    allCalendarsCheckbox.addEventListener('inputtoggle', this.onShowAllCalendars.bind(this));
                    calendarContainer.appendChild(allCalendarsCheckbox);
                }
            }

            if (showTimeZone) {
                let timeZoneContainer = localeControls;
                if (allTimeZones.length) {
                    timeZoneContainer = document.createElement('div');
                    timeZoneContainer.classList.add('locale-container');
                    localeControls.appendChild(timeZoneContainer);
                }

                const select = document.createElement('tf-select') as TavenemSelectInputHtmlElement;
                select.classList.add('dense', 'timezone-select');
                select.dataset.inputStyle = `min-width: ${timeZones.map(x => x.length).reduce((x, y) => Math.max(x, y), -Infinity)}ch`;
                select.dataset.popoverLimitHeight = '';
                select.style.backgroundColor = 'var(--tavenem-color-bg-input)';
                select.addEventListener('valuechange', this.onTimeZoneChange.bind(this));
                select.addEventListener('valueinput', this.stopEvent.bind(this));
                timeZoneContainer.appendChild(select);
                select.value = timeZone;

                const list = document.createElement('div');
                list.classList.add('option-list', 'timezone-option-list');
                list.slot = 'popover';
                select.appendChild(list);

                for (const z of timeZones) {
                    const option = document.createElement('div');
                    option.dataset.closePicker = '';
                    option.dataset.closePickerValue = z;
                    option.textContent = z;
                    list.appendChild(option);
                }

                if (allTimeZones.length) {
                    const allTimeZonesCheckbox = document.createElement('tf-checkbox');
                    allTimeZonesCheckbox.dataset.label = 'Show All';
                    allTimeZonesCheckbox.classList.add('all-time-zones-input');
                    allTimeZonesCheckbox.addEventListener('inputtoggle', this.onShowAllTimeZones.bind(this));
                    timeZoneContainer.appendChild(allTimeZonesCheckbox);
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
            yearButton.addEventListener('click', this.setView.bind(this, DateTimeViewType.year, 1));
            currentDateSection.appendChild(yearButton);

            if (this._type != DateTimeType.Year) {
                const currentButton = document.createElement('button');
                currentButton.type = 'button';
                currentButton.classList.add('btn-text', 'current-date-button');
                currentButton.textContent = display.currentDate || '';
                currentButton.addEventListener('click', this.onShowNow.bind(this));
                currentDateSection.appendChild(currentButton);
            }
        }

        if (hasTime) {
            const currentTime = document.createElement('div');
            currentTime.classList.add('current-time');
            currentValueSection.appendChild(currentTime);

            const hourInput = document.createElement('tf-numeric-input');
            hourInput.classList.add('hour-input', 'dense');
            hourInput.dataset.inputStyle = 'text-align:right';
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
                hourInput.dataset.padLength = '2';
                hourInput.dataset.paddingChar = '0';
                hourInput.setAttribute('value', this._displayedTime.hour.toString());
            }
            hourInput.style.backgroundColor = 'var(--tavenem-color-bg-input)';
            hourInput.addEventListener('valueinput', this.onHourInput.bind(this));
            hourInput.addEventListener('valuechange', this.stopEvent.bind(this));
            currentTime.appendChild(hourInput);

            const timeSeparator = document.createElement('span');
            timeSeparator.classList.add('centered-grid');
            timeSeparator.textContent = this.dataset.timeSeparator || ':';
            currentTime.appendChild(timeSeparator);

            const minuteInput = document.createElement('tf-numeric-input');
            minuteInput.classList.add('minute-input', 'dense');
            minuteInput.setAttribute('inputmode', 'numeric');
            minuteInput.setAttribute('max', '60');
            minuteInput.setAttribute('min', '-1');
            minuteInput.setAttribute('size', '2');
            minuteInput.setAttribute('step', '1');
            minuteInput.dataset.padLength = '2';
            minuteInput.dataset.paddingChar = '0';
            minuteInput.style.backgroundColor = 'var(--tavenem-color-bg-input)';
            minuteInput.setAttribute('value', this._displayedTime.minute.toString());
            minuteInput.addEventListener('valueinput', this.onMinuteInput.bind(this));
            minuteInput.addEventListener('valuechange', this.stopEvent.bind(this));
            currentTime.appendChild(minuteInput);

            if (this.hasAttribute('seconds')) {
                const secondSeparator = document.createElement('span');
                secondSeparator.classList.add('centered-grid');
                secondSeparator.textContent = this.dataset.timeSeparator || ':';
                currentTime.appendChild(secondSeparator);

                const secondInput = document.createElement('tf-numeric-input');
                secondInput.classList.add('second-input', 'dense');
                secondInput.setAttribute('inputmode', 'numeric');
                secondInput.setAttribute('max', '60');
                secondInput.setAttribute('min', '-1');
                secondInput.setAttribute('size', '2');
                secondInput.setAttribute('step', '1');
                secondInput.dataset.padLength = '2';
                secondInput.dataset.paddingChar = '0';
                secondInput.style.backgroundColor = 'var(--tavenem-color-bg-input)';
                secondInput.setAttribute('value', this._displayedTime.second.toString());
                secondInput.addEventListener('valueinput', this.onSecondInput.bind(this));
                secondInput.addEventListener('valuechange', this.stopEvent.bind(this));
                currentTime.appendChild(secondInput);
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
                amButton.addEventListener('click', this.onAM.bind(this));
                dayPeriodContainer.appendChild(amButton);

                const pmButton = document.createElement('button');
                pmButton.classList.add('pm-button', 'btn-text');
                if (this._displayedTime.hour < 12) {
                    pmButton.classList.add('inactive');
                }
                pmButton.textContent = this.dataset.pm || 'pm';
                pmButton.addEventListener('click', this.onPM.bind(this));
                dayPeriodContainer.appendChild(pmButton);
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
            previous.addEventListener('click', this.onPrevious.bind(this));
            nav.appendChild(previous);

            const previousIcon = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
            previous.appendChild(previousIcon);
            previousIcon.outerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px"><path d="M0 0h24v24H0z" fill="none"/><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>`;

            const expandViewButton = document.createElement('button');
            expandViewButton.type = 'button';
            expandViewButton.classList.add('btn-text', 'outlined', 'expand-view');
            expandViewButton.addEventListener('click', this.onExpandView.bind(this));
            nav.appendChild(expandViewButton);

            const next = document.createElement('button');
            next.type = 'button';
            next.classList.add('next');
            next.addEventListener('click', this.onNext.bind(this));
            nav.appendChild(next);

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
        nowButton.addEventListener('click', this.onNow.bind(this));
        nowContainer.appendChild(nowButton);

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
            clearButton.addEventListener('click', this.onClearButton.bind(this));
            buttonsDiv.appendChild(clearButton);

            const okButton = document.createElement('button');
            okButton.classList.add('ok');
            okButton.textContent = "Ok";
            okButton.addEventListener('click', this.onOk.bind(this));
            buttonsDiv.appendChild(okButton);
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

        this.setValidity();

        shadow.addEventListener('mousedown', this.onMouseDown.bind(this));
        shadow.addEventListener('mouseup', this.onOuterMouseUp.bind(this));
        shadow.addEventListener('keyup', this.onOuterKeyUp.bind(this));
        document.addEventListener('mousedown', this.onDocMouseDown.bind(this));
        this._settingValue = false;
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

        const input = root.querySelector('.input');
        if (input) {
            input.removeEventListener('valueinput', this.onInput.bind(this));
            input.removeEventListener('valuechange', this.stopEvent.bind(this));
        }
        const calendarSelect = root.querySelector('.calendar-select');
        if (calendarSelect) {
            calendarSelect.removeEventListener('valueinput', this.stopEvent.bind(this));
            calendarSelect.removeEventListener('valuechange', this.onCalendarChange.bind(this));
        }
        const timezoneSelect = root.querySelector('.timezone-select');
        if (timezoneSelect) {
            timezoneSelect.removeEventListener('valueinput', this.stopEvent.bind(this));
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
            hourInput.removeEventListener('valuechange', this.stopEvent.bind(this));
        }
        const minuteInput = root.querySelector('.minute-input');
        if (minuteInput) {
            minuteInput.removeEventListener('valueinput', this.onMinuteInput.bind(this));
            minuteInput.removeEventListener('valuechange', this.stopEvent.bind(this));
        }
        const secondInput = root.querySelector('.second-input');
        if (secondInput) {
            secondInput.removeEventListener('valueinput', this.onSecondInput.bind(this));
            secondInput.removeEventListener('valuechange', this.stopEvent.bind(this));
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
        if (name === 'max') {
            this.max = newValue;
        } else if (name === 'min') {
            this.min = newValue;
        } else if (name === 'readonly') {
            const root = this.shadowRoot;
            if (!root) {
                return;
            }

            const input = root.querySelector<TavenemInputHtmlElement>('.input');
            if (input) {
                if (newValue) {
                    input.setAttribute('readonly', '');
                } else {
                    input.removeAttribute('readonly');
                }
            }

            const header = root.querySelector('.header');
            if (header instanceof HTMLElement) {
                if (newValue) {
                    header.inert = true;
                } else {
                    header.inert = this.matches(':disabled');
                }
            }

            const clearButton = root.querySelector<HTMLButtonElement>('.color-clear');
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

        const header = root.querySelector('.header');
        if (header instanceof HTMLElement) {
            if (disabled) {
                header.inert = true;
            } else {
                header.inert = this.hasAttribute('readonly');
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

    formResetCallback() { this.reset(); }

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
        let display = this.getValueAndDisplay(this._value);
        if (this._value && display.value.length) {
            this._internals.setFormValue(display.value);
        } else {
            this._internals.setFormValue(null);
        }
        this.setValidity();
    }

    protected clear() {
        if (!this._value) {
            return;
        }

        this._settingValue = true;

        const root = this.shadowRoot;
        if (root) {
            const input = root.querySelector<TavenemInputHtmlElement>('.input');
            if (input) {
                input.value = '';
            }
        }

        this._value = null;
        this._formValue = '';
        this._internals.setFormValue(null);
        this._internals.states.add('empty');
        this._internals.states.delete('has-value');
        this.setValidity();

        this.dispatchEvent(TavenemPickerHtmlElement.newValueChangeEvent(''));

        this._settingValue = false;
    }

    protected onClosing() {
        const root = this.shadowRoot;
        if (root) {
            const pickers = root.querySelectorAll<TavenemSelectInputHtmlElement>('tf-select');
            for (const picker of pickers) {
                picker.setOpen(false);
            }
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

    protected stringValue() { return this._formValue; }

    private getNow() {
        return now(this.getOptions().timeZone);
    }

    private getOptions() {
        let calendar = this.dataset.calendar;
        let timeZone = this.dataset.timeZone;
        const root = this.shadowRoot;
        if (root) {
            const calendarInput = root.querySelector<TavenemSelectInputHtmlElement>('.calendar-select');
            if (calendarInput
                && calendarInput.value
                && calendarInput.value.length) {
                calendar = calendarInput.value;
            }

            const timeZoneInput = root.querySelector<TavenemSelectInputHtmlElement>('.timezone-select');
            if (timeZoneInput
                && timeZoneInput.value
                && timeZoneInput.value.length) {
                timeZone = timeZoneInput.value;
            }
        }

        if (!timeZone && !this._localTimeZone) {
            this._localTimeZone = getLocalTimeZone();
        }

        return new DateFormatter(this.dataset.locale || 'en-US', {
            calendar: calendar && supportedCalendars.includes(calendar) ? calendar : "gregory",
            timeZone: timeZone || this._localTimeZone,
        }).resolvedOptions();
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

        const options = this.getOptions();
        const calendar = options.calendar;
        const locale = options.locale;
        const timeZone = options.timeZone;

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
                    if ('showTimeZone' in this.dataset) {
                        options = {
                            ...options,
                            timeZoneName: "short",
                        }
                    }
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
        this._internals.states.add('touched');
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

        this._internals.states.add('touched');

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

        if (!this.matches(':disabled')
            && !this.hasAttribute('readonly')) {
            this._internals.states.add('touched');
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

    private onHourInput(event: Event) {
        event.preventDefault();
        event.stopPropagation();

        if (this._settingValue
            || !(event instanceof CustomEvent)
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

        if ('hour12' in this.dataset) {
            const currentValue = this._value
                && !(this._value instanceof CalendarDate)
                ? this._value
                : this._displayedTime;
            if (currentValue.hour > 12) {
                value += 12;
            } else if (currentValue.hour === 0
                && value >= 11) {
                value -= 12;
            }
        }

        this._internals.states.add('touched');

        this._settingValue = true;
        if (value >= 24) {
            if (this._value) {
                this.setDateTimeValue(this._value.add({ days: 1 }).set({ hour: value - 24 }));
            } else if (this.hasAttribute('date')) {
                const dateTime = toZoned(toCalendarDateTime(this._displayedDate, this._displayedTime), this.getOptions().timeZone);
                this.setDateTimeValue(dateTime.add({ days: 1 }).set({ hour: value - 24 }));
            } else {
                this.setDateTimeValue(this._displayedTime.set({ hour: value - 24 }));
            }
        } else if (value < 0) {
            if (this._value) {
                this.setDateTimeValue(this._value.subtract({ days: 1 }).set({ hour: value + 24 }));
            } else if (this.hasAttribute('date')) {
                const dateTime = toZoned(toCalendarDateTime(this._displayedDate, this._displayedTime), this.getOptions().timeZone);
                this.setDateTimeValue(dateTime.subtract({ days: 1 }).set({ hour: value + 24 }));
            } else {
                this.setDateTimeValue(this._displayedTime.set({ hour: value + 24 }));
            }
        } else if (this._value) {
            if ((this._value instanceof CalendarDateTime
                || this._value instanceof ZonedDateTime
                || this._value instanceof Time)
                && this._value.hour === value) {
                this._settingValue = false;
                return;
            }
            this.setDateTimeValue(this._value.set({ hour: value }));
        } else if (this.hasAttribute('date')) {
            const dateTime = toZoned(toCalendarDateTime(this._displayedDate, this._displayedTime), this.getOptions().timeZone);
            this.setDateTimeValue(dateTime.set({ hour: value }));
        } else {
            this.setDateTimeValue(this._displayedTime.set({ hour: value }));
        }
        this._settingValue = false;
    }

    private onMinuteInput(event: Event) {
        event.preventDefault();
        event.stopPropagation();

        if (this._settingValue
            || !(event instanceof CustomEvent)
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

        this._internals.states.add('touched');

        this._settingValue = true;
        if (value >= 60) {
            if (this._value) {
                this.setDateTimeValue(this._value.add({ hours: 1 }).set({ minute: value - 60 }));
            } else if (this.hasAttribute('date')) {
                const dateTime = toZoned(toCalendarDateTime(this._displayedDate, this._displayedTime), this.getOptions().timeZone);
                this.setDateTimeValue(dateTime.add({ hours: 1 }).set({ minute: value - 60 }));
            } else {
                this.setDateTimeValue(this._displayedTime.set({ minute: value - 60 }));
            }
        } else if (value < 0) {
            if (this._value) {
                this.setDateTimeValue(this._value.subtract({ hours: 1 }).set({ minute: value + 60 }));
            } else if (this.hasAttribute('date')) {
                const dateTime = toZoned(toCalendarDateTime(this._displayedDate, this._displayedTime), this.getOptions().timeZone);
                this.setDateTimeValue(dateTime.subtract({ hours: 1 }).set({ minute: value + 60 }));
            } else {
                this.setDateTimeValue(this._displayedTime.set({ minute: value + 60 }));
            }
        } else if (this._value) {
            if ((this._value instanceof CalendarDateTime
                || this._value instanceof ZonedDateTime
                || this._value instanceof Time)
                && this._value.minute === value) {
                this._settingValue = false;
                return;
            }
            this.setDateTimeValue(this._value.set({ minute: value }));
        } else if (this.hasAttribute('date')) {
            const dateTime = toZoned(toCalendarDateTime(this._displayedDate, this._displayedTime), this.getOptions().timeZone);
            this.setDateTimeValue(dateTime.set({ minute: value }));
        } else {
            this.setDateTimeValue(this._displayedTime.set({ minute: value }));
        }
        this._settingValue = false;
    }

    private onOk(event: Event) {
        event.preventDefault();
        event.stopPropagation();

        this.setOpen(false);
    }

    private onOuterKeyUp(event: Event) { this.onKeyUp(event as KeyboardEvent); }

    private onOuterMouseUp(event: Event) { this.onMouseUp(event as MouseEvent); }

    private onInput(event: Event) {
        event.preventDefault();
        event.stopPropagation();

        if (this._settingValue
            || !(event instanceof CustomEvent)
            || !event.detail) {
            return;
        }

        this._internals.states.add('touched');
        this.setValue(event.detail.value);

        if (this._popover && this._popover.matches(':popover-open')) {
            this.setOpen(false);
            return;
        }

        this.dispatchEvent(TavenemPickerHtmlElement.newValueChangeEvent(event.detail.value));
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

        this._internals.states.add('touched');
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
        this._internals.states.add('touched');
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

    private onSecondInput(event: Event) {
        event.preventDefault();
        event.stopPropagation();

        if (this._settingValue
            || !(event instanceof CustomEvent)
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

        this._internals.states.add('touched');

        this._settingValue = true;
        if (value >= 60) {
            if (this._value) {
                if ((this._value instanceof CalendarDateTime
                    || this._value instanceof ZonedDateTime
                    || this._value instanceof Time)
                    && this._value.second === value) {
                    this._settingValue = false;
                    return;
                }
                this.setDateTimeValue(this._value.add({ minutes: 1 }).set({ second: value - 60 }));
            } else if (this.hasAttribute('date')) {
                const dateTime = toZoned(toCalendarDateTime(this._displayedDate, this._displayedTime), this.getOptions().timeZone);
                this.setDateTimeValue(dateTime.add({ minutes: 1 }).set({ second: value - 60 }));
            } else {
                this.setDateTimeValue(this._displayedTime.set({ second: value - 60 }));
            }
        } else if (value < 0) {
            if (this._value) {
                this.setDateTimeValue(this._value.subtract({ minutes: 1 }).set({ second: value + 60 }));
            } else if (this.hasAttribute('date')) {
                const dateTime = toZoned(toCalendarDateTime(this._displayedDate, this._displayedTime), this.getOptions().timeZone);
                this.setDateTimeValue(dateTime.subtract({ minutes: 1 }).set({ second: value + 60 }));
            } else {
                this.setDateTimeValue(this._displayedTime.set({ second: value + 60 }));
            }
        } else if (this._value) {
            this.setDateTimeValue(this._value.set({ second: value }));
        } else if (this.hasAttribute('date')) {
            const dateTime = toZoned(toCalendarDateTime(this._displayedDate, this._displayedTime), this.getOptions().timeZone);
            this.setDateTimeValue(dateTime.set({ second: value }));
        } else {
            this.setDateTimeValue(this._displayedTime.set({ second: value }));
        }
        this._settingValue = false;
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

        this._internals.states.add('touched');
        if (this._value) {
            if (this._value instanceof ZonedDateTime) {
                this.setDateTimeValue(toZoned(toCalendarDateTime(value, toTime(this._value)), this._value.timeZone), true);
            } else if (this._value instanceof CalendarDateTime) {
                this.setDateTimeValue(toCalendarDateTime(value, toTime(this._value)), true);
            } else {
                this.setDateTimeValue(value, true);
            }
        } else if (this.hasAttribute('time')) {
            if ('timeZone' in this.dataset || 'showTimeZone' in this.dataset) {
                this.setDateTimeValue(toZoned(toCalendarDateTime(value, this._displayedTime), this.getOptions().timeZone), true);
            } else {
                this.setDateTimeValue(toCalendarDateTime(value, this._displayedTime), true);
            }
        } else {
            this.setDateTimeValue(value, true);
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
        const list = root.querySelector('.calendars-option-list');
        if (!list) {
            return;
        }

        let calendars: string[] = [];
        if (event instanceof CustomEvent
            && event.detail
            && event.detail.value) {
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
        const list = root.querySelector('.timezone-option-list');
        if (!list) {
            return;
        }

        let timeZones: string[] = [];
        if (event instanceof CustomEvent
            && event.detail
            && event.detail.value) {
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
                this._internals.states.add('touched');
                this.setDateTimeValue(toTimeZone(this._value, event.detail.value));
            } else {
                const root = this.shadowRoot;
                if (root) {
                    const timeZoneInput = root.querySelector<TavenemSelectInputHtmlElement>('.timezone-select');
                    if (timeZoneInput
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

        const options = this.getOptions();
        const calendar = options.calendar;
        const locale = options.locale;
        const timeZone = options.timeZone;

        const parseOptions: Intl.DateTimeFormatOptions = {
            calendar: calendar,
            timeZone: timeZone,
        };

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
            value = parseDateTimeString(input, locale, parseOptions);
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
        value = parseDateTimeString(input, locale, parseOptions);
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

        const options = this.getOptions();
        const calendar = options.calendar;
        const locale = options.locale;
        const timeZone = options.timeZone;

        const nowDateTime = now(timeZone);
        
        const firstOfMonth = startOfMonth(this._displayedDate);
        let displayedDate = startOfWeek(firstOfMonth, locale);
        const { weekNumber } = getWeek(firstOfMonth);
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
                    dateButton.addEventListener('click', this.onSelectDate.bind(this, displayedDate));
                    selection.appendChild(dateButton);
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

        const options = this.getOptions();
        const calendar = options.calendar;
        const locale = options.locale;
        const timeZone = options.timeZone;

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
            if (this._type === DateTimeType.Month) {
                monthButton.addEventListener('click', this.onSelectDate.bind(this, monthDate));
            } else {
                monthButton.addEventListener('click', this.onSelectViewDate.bind(this, monthDate, DateTimeViewType.date, 1));
            }
            selection.appendChild(monthButton);

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

        const options = this.getOptions();
        const calendar = options.calendar;
        const locale = options.locale;
        const timeZone = options.timeZone;

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
            if (this._yearStep === 1) {
                if (this._type === DateTimeType.Year) {
                    periodButton.addEventListener('click', this.onSelectDate.bind(this, displayedDate));
                } else {
                    periodButton.addEventListener('click', this.onSelectViewDate.bind(this, displayedDate, DateTimeViewType.month, 1));
                }
            } else {
                periodButton.addEventListener('click', this.onSelectViewDate.bind(this, displayedDate, DateTimeViewType.year, getDividedByTen(this._yearStep)));
            }
            selection.appendChild(periodButton);

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

        const options = this.getOptions();
        const calendar = options.calendar;
        const locale = options.locale;
        const timeZone = options.timeZone;

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

    private setDateTimeValue(value?: CalendarDate | CalendarDateTime | ZonedDateTime | Time | null, preserveView?: boolean) {
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

        const display = this.getValueAndDisplay(this._value);

        if (this._value && display.value.length) {
            this._formValue = display.value;
            this._internals.setFormValue(display.value);
        } else {
            this._formValue = '';
            this._internals.setFormValue(null);
        }

        if ((display.display && display.display.length)
            || display.value.length) {
            this._internals.states.delete('empty');
            this._internals.states.add('has-value');
        } else {
            this._internals.states.add('empty');
            this._internals.states.delete('has-value');
        }

        if (!preserveView) {
            this.setView(this._view);
        }

        this.dispatchEvent(TavenemPickerHtmlElement.newValueChangeEvent(display.value));

        const root = this.shadowRoot;
        if (!root) {
            this.setValidity();
            return;
        }

        const input = root.querySelector('.input') as TavenemInputHtmlElement;
        if (input) {
            const wasSettingValue = this._settingValue;
            this._settingValue = true;
            input.value = display.value;
            if (display.display) {
                input.display = display.display;
            }
            this._settingValue = wasSettingValue;
        }

        this.setValidity();

        const options = this.getOptions();
        const calendar = options.calendar;
        const locale = options.locale;
        const timeZone = options.timeZone;

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
        const hourInput = root.querySelector<TavenemInputHtmlElement>('.hour-input');
        if (hourInput) {
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
        const minuteInput = root.querySelector<TavenemInputHtmlElement>('.minute-input');
        if (minuteInput) {
            minuteInput.value = this._displayedTime.minute.toString();
        }
        const secondInput = root.querySelector<TavenemInputHtmlElement>('.second-input');
        if (secondInput) {
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

    private setValidity() {
        const flags: ValidityStateFlags = {};
        const messages: string[] = [];

        if (!this._value) {
            const root = this.shadowRoot;
            const input = root ? root.querySelector('.input') as TavenemInputHtmlElement : null;
            const value = input ? input.value : null;
            if (value) {
                flags.badInput = true;
                messages.push('value cannot be converted to a date/time');
            }
            if (this.hasAttribute('required')) {
                flags.valueMissing = true;
                messages.push('required');
            }
        } else {
            if (this._value instanceof Time) {
                if (this._max instanceof Time) {
                    if (this._value.compare(this._max) > 0) {
                        flags.rangeOverflow = true;
                        messages.push('value above maximum');
                    }
                }
                if (this._min instanceof Time) {
                    if (this._value.compare(this._min) < 0) {
                        flags.rangeUnderflow = true;
                        messages.push('value below minimum');
                    }
                }
            } else {
                if (!(this._max instanceof Time)) {
                    if (this._value.compare(this._max) > 0) {
                        flags.rangeOverflow = true;
                        messages.push('value above maximum');
                    }
                }
                if (!(this._min instanceof Time)) {
                    if (this._value.compare(this._min) < 0) {
                        flags.rangeUnderflow = true;
                        messages.push('value below minimum');
                    }
                }
            }
        }

        const root = this.shadowRoot;
        if (Object.keys(flags).length > 0) {
            this._internals.setValidity(
                flags,
                messages.join('; '),
                root?.querySelector('.input') || undefined);
        } else {
            this._internals.setValidity({});
        }

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

        const dateTimeValue = this.parseValue(value);
        if (!dateTimeValue) {
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

    private stopEvent(event: Event) {
        event.preventDefault();
        event.stopPropagation();
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