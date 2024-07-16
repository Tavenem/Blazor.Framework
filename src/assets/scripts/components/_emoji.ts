import { TavenemPopover, TavenemPopoverHTMLElement } from './_popover'
import { TavenemInputHtmlElement } from './_input'
import { TavenemPickerHtmlElement } from './_picker'
import { randomUUID } from '../tavenem-utility'

interface Emoji {
    category: string;
    codepoint: string;
    codepoints?: string[];
    hasSkinTones: boolean;
    keywords: string[];
    name: string;
    shortName: string;
    shortNames?: string[];
}

interface EmojiCategory {
    id: string,
    name: string,
    svg: string,
}

interface HtmlEmojiButtonElement extends HTMLButtonElement {
    emoji: Emoji | undefined;
}

let emojiData: Emoji[];

const emojiCategories: EmojiCategory[] = [
    {
        id: "latest",
        name: "Latest",
        svg: `<svg xmlns="http://www.w3.org/2000/svg" height="48" viewBox="0 -960 960 960" width="48"><path d="M477-120q-149 0-253-105.5T120-481h60q0 125 86 213t211 88q127 0 215-89t88-216q0-124-89-209.5T477-780q-68 0-127.5 31T246-667h105v60H142v-208h60v106q52-61 123.5-96T477-840q75 0 141 28t115.5 76.5Q783-687 811.5-622T840-482q0 75-28.5 141t-78 115Q684-177 618-148.5T477-120Zm128-197L451-469v-214h60v189l137 134-43 43Z"/></svg>`,
    }, {
        id: "smileys-emotion",
        name: "Smileys & Emotion",
        svg: `<svg xmlns="http://www.w3.org/2000/svg" height="48" viewBox="0 -960 960 960" width="48"><path d="M626-533q22.5 0 38.25-15.75T680-587q0-22.5-15.75-38.25T626-641q-22.5 0-38.25 15.75T572-587q0 22.5 15.75 38.25T626-533Zm-292 0q22.5 0 38.25-15.75T388-587q0-22.5-15.75-38.25T334-641q-22.5 0-38.25 15.75T280-587q0 22.5 15.75 38.25T334-533Zm146 272q66 0 121.5-35.5T682-393H278q26 61 81 96.5T480-261Zm0 181q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z"/></svg>`,
    }, {
        id: "people-body",
        name: "People & Body",
        svg: `<svg xmlns="http://www.w3.org/2000/svg" height="48" viewBox="0 -960 960 960" width="48"><path d="M368-80v-538q-95-20-152.5-85.5T158-856h60q0 78 60.5 131T426-672h100q38 0 56 6.5t46 30.5l184 172-43 43-185-174v514h-60v-255h-96v255h-60Zm108.08-654q-30.08 0-51.58-21.42-21.5-21.421-21.5-51.5 0-30.08 21.42-51.58 21.421-21.5 51.5-21.5 30.08 0 51.58 21.42 21.5 21.421 21.5 51.5 0 30.08-21.42 51.58-21.421 21.5-51.5 21.5Z"/></svg>`,
    }, {
        id: "animals-nature",
        name: "Animals & Nature",
        svg: `<svg xmlns="http://www.w3.org/2000/svg" height="48" viewBox="0 -960 960 960" width="48"><path d="m723-611-38 34q-11 10-28 11.5t-31-8.5q-14-10-16.5-27t1.5-30l17-58-43-24q-14-8-18-22.5t1-30.5q5-16 17-24t29-8h49l15-45q5-15 16.5-26.5T723-881q17 0 28.5 11.5T768-843l15 45h49q15 0 28 8.5t18 23.5q5 14 1 29.5T860-713l-43 24 17 58q5 14 2.5 30.5T820-574q-14 9-31 8t-28-11l-38-34Zm0-60q17 0 28.5-11.5T763-711q0-17-11.5-28.5T723-751q-17 0-28.5 11.5T683-711q0 17 11.5 28.5T723-671ZM529-231q22 54-15.5 102.5T415-80q-32 0-58-15.5T316-143q-67 7-122-47.5T143-312q-30-16-46.5-48.5T80-422q0-67 47-99.5t113-3.5l60 24q17-37 49.5-57.5T421-581v-86h49v90q41 8 72 43t38 67h90v50h-86q-3 39-23 71.5T504-296l25 65ZM224-355q40 0 84.5-21.5T368-408l-142-58q-25-11-55.5 2.5T140-424q0 26 33.5 47.5T224-355Zm191 215q31 0 49.5-20.5T472-209l-60-155q-18 29-36 61.5T358-220q0 20 14.5 50t42.5 30Zm65-212q26-15 35-36t9-45q0-35-25.5-60.5T438-519q-24 0-46.5 11T358-472l87 34 35 86Z"/></svg>`,
    }, {
        id: "food-drink",
        name: "Food & Drink",
        svg: `<svg xmlns="http://www.w3.org/2000/svg" height="48" viewBox="0 -960 960 960" width="48"><path d="M160-120v-60h640v60H160Zm564-500h96v-160h-96v160ZM311-260q-63 0-107-43.5T160-410v-430h197v93l-72 58q-3 2-9 18v150q0 9.6 7 16.8 7 7.2 18 7.2h151q11 0 18-7.2t7-16.8v-150q0-3-9-18l-71-58v-93h423q24.75 0 42.375 17.625T880-780v160q0 24.75-17.625 42.375T820-560h-96v150q0 63-44 106.5T573-260H311Z"/></svg>`,
    }, {
        id: "activities",
        name: "Activities",
        svg: `<svg xmlns="http://www.w3.org/2000/svg" height="48" viewBox="0 -960 960 960" width="48"><path d="M298-120v-60h152v-148q-54-11-96-46.5T296-463q-74-8-125-60t-51-125v-44q0-25 17.5-42.5T180-752h104v-88h392v88h104q25 0 42.5 17.5T840-692v44q0 73-51 125t-125 60q-16 53-58 88.5T510-328v148h152v60H298Zm-14-406v-166H180v44q0 45 29.5 78.5T284-526Zm392 0q45-10 74.5-43.5T780-648v-44H676v166Z"/></svg>`,
    }, {
        id: "travel-places",
        name: "Travel & Places",
        svg: `<svg xmlns="http://www.w3.org/2000/svg" height="48" viewBox="0 -960 960 960" width="48"><path d="M413-102v-227l57-168q2-7 8-12t17-5h303q11 0 16.5 4.5T823-497l57 168v227q0 9.308-6.346 15.654T858-80h-22.256Q827-80 820.5-86.346T814-102v-45H479v45q0 9.308-6.346 15.654T457-80h-22.256Q426-80 419.5-86.346T413-102Zm53-257h361l-38-115H504l-38 115Zm54 146q16.575 0 27.787-11.212Q559-235.425 559-252q0-16.575-11.213-27.788Q536.575-291 520-291t-27.788 11.212Q481-268.575 481-252q0 16.575 11.212 27.788Q503.425-213 520-213Zm253 0q16.575 0 27.787-11.212Q812-235.425 812-252q0-16.575-11.213-27.788Q789.575-291 773-291t-27.787 11.212Q734-268.575 734-252q0 16.575 11.213 27.788Q756.425-213 773-213ZM240-388v-73h73v73h-73Zm207-259v-73h73v73h-73ZM240-234v-73h73v73h-73Zm0 154v-73h73v73h-73ZM80-80v-541h207v-259h393v260h-60v-200H347v259H140v481H80Z"/></svg>`,
    }, {
        id: "objects",
        name: "Objects",
        svg: `<svg xmlns="http://www.w3.org/2000/svg" height="48" viewBox="0 -960 960 960" width="48"><path d="M480-80q-27 0-47.5-13T406-129h-14q-24 0-42-18t-18-42v-143q-66-43-104-110t-38-148q0-121 84.5-205.5T480-880q121 0 205.5 84.5T770-590q0 81-38 148T628-332v143q0 24-18 42t-42 18h-14q-6 23-26.5 36T480-80Zm-88-109h176v-44H392v44Zm0-84h176v-40H392v40Zm111-100v-137l92-92-31-31-84 84-84-84-31 31 92 92v137h46Z"/></svg>`,
    }, {
        id: "symbols",
        name: "Symbols",
        svg: `<svg xmlns="http://www.w3.org/2000/svg" height="48" viewBox="0 -960 960 960" width="48"><path d="M120-820v-60h313v60H120Zm127 285v-183H120v-60h313v60H306v183h-59ZM547-96l-43-43 313-313 43 43L547-96Zm37-229q-23 0-38.5-15.5T530-379q0-23 15.5-38.5T584-433q23 0 38.5 15.5T638-379q0 23-15.5 38.5T584-325Zm202 207q-23 0-38.5-15.5T732-172q0-23 15.5-38.5T786-226q23 0 38.5 15.5T840-172q0 23-15.5 38.5T786-118ZM628-520q-38 0-64-27.5T538-610q0-38 26-64t64-26q13 0 23.5 3.5T670-688v-163q0-12 8.5-20.5T699-880h141v59H718v211q0 38-26 64t-64 26ZM211-80q-38 0-64.5-26.5T120-171q0-20 7-36.5t21-30.5l52-52-20-20q-14-14-21.5-31.5T151-376q0-38 26.5-64.5T242-467q38 0 64.5 26.5T333-376q0 17-5.5 34.5T308-310l-20 20 50 50 60-60 42 42-63 63 53 53-41 41-59-59-51 51q-14 14-31 21.5T211-80Zm31-250 23-23q5-5 6.5-10t1.5-13q0-14-8.5-22.5T242-407q-14 0-22.5 8.5T211-376q0 8 1.5 13t6.5 10l23 23Zm-31 190q5 0 12-3t12-8l52-52-43-43-53 53q-5 5-7.5 11t-2.5 12q0 14 8 22t22 8Z"/></svg>`,
    }, {
        id: "flags",
        name: "Flags",
        svg: `<svg xmlns="http://www.w3.org/2000/svg" height="48" viewBox="0 -960 960 960" width="48"><path d="M200-120v-680h343l19 86h238v370H544l-19-85H260v309h-60Z"/></svg>`,
    },
];

const latestEmojiStorageKey = "tavenem.latest-emoji";
const people = ["1F466", "1F467", "1F468", "1F469", "1F476", "1F9D1", "1F9D2", "1F9D3", "1F9D4"];

export class TavenemEmojiHTMLElement extends HTMLElement {
    private _mutationObserver: MutationObserver;
    private _replacing: boolean = false;

    constructor() {
        super();

        this._mutationObserver = new MutationObserver(mutations => {
            if (this._replacing) {
                return;
            }
            let updated = false;
            for (const mutation of mutations) {
                if (mutation.type === 'childList'
                    || mutation.type === 'characterData') {
                    updated = true;
                    break;
                }
            }
            if (updated) {
                this.refreshEmoji();
            }
        });
    }

    connectedCallback() {
        const shadow = this.attachShadow({ mode: 'open' });

        const style = document.createElement('style');
        style.textContent = `span {
    font-family: "Noto Color Emoji",
                 system-ui,
                 "Apple Color Emoji",
                 "Segoe UI Emoji",
                 "Segoe UI Symbol",
                 "EmojiOne Color",
                 "Android Emoji",
                 sans-serif;
    font-style: normal;
    font-weight: 400;
}

slot {
    display: none;
}
`;
        shadow.appendChild(style);

        const slot = document.createElement('slot');
        shadow.appendChild(slot);

        const span = document.createElement('span');
        shadow.appendChild(span);

        this.refreshEmoji();

        this._mutationObserver.observe(this, { characterData: true, childList: true, subtree: true });
    }

    private refreshEmoji() {
        if (this._replacing) {
            return;
        }
        if (!emojiData) {
            fetch("_content/Tavenem.Blazor.Framework/emoji.json")
                .then(response => response.json())
                .then(data => {
                    emojiData = data;
                    this.refreshEmojiInner();
                });
        } else if (emojiData
            && emojiData.length) {
            this.refreshEmojiInner();
        }
    }

    private refreshEmojiInner() {
        if (this._replacing
            || !emojiData
            || !emojiData.length) {
            return;
        }

        const root = this.shadowRoot;
        if (!root) {
            return;
        }

        const span = root.querySelector('span');
        if (!span) {
            return;
        }

        if (!this.textContent
            || !this.textContent.length) {
            this._replacing = true;
            span.textContent = null;
            this._replacing = false;
            return;
        }

        const text = trimChar(this.textContent.trim(), ':').trim().toLowerCase();
        if (!text
            || !text.length) {
            this._replacing = true;
            span.textContent = null;
            this._replacing = false;
            return;
        }

        const emoji = emojiData.find(v => v.shortName === text || v.shortNames?.includes(text));
        if (!emoji) {
            this._replacing = true;
            span.textContent = this.textContent;
            this._replacing = false;
            return;
        }

        let emojiText = `&#x${emoji.codepoint};`;
        if (emoji.codepoints
            && emoji.codepoints.length) {
            for (let i = 0; i < emoji.codepoints.length; i++) {
                emojiText += `&#x${emoji.codepoints[i]};`;
            }
        }

        this._replacing = true;
        span.innerHTML = emojiText;
        this._replacing = false;
    }
}

export class TavenemEmojiPickerHTMLElement extends TavenemPickerHtmlElement {
    static formAssociated = true;

    private _categorizedEmoji: Record<string, Emoji[]> = {};
    private _filteredEmoji: Record<string, Emoji[]> = {};
    private _internals: ElementInternals;
    private _latestEmoji: Emoji[] = [];
    private _skinTone1 = 0;
    private _skinTone2 = 0;
    private _value = '';

    static get observedAttributes() {
        return ['readonly', 'value'];
    }

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

    constructor() {
        super();

        this._internals = this.attachInternals();
    }

    async connectedCallback() {
        this.dataset.popoverContainer = '';

        const shadow = this.attachShadow({ mode: 'open', delegatesFocus: true });

        const style = document.createElement('style');
        style.textContent = `:host {
    margin: 0;
    position: relative;
    width: fit-content;
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

input {
    --field-border-color: var(--tavenem-color-border-input);
    --field-border-hover-color: var(--tavenem-color-action);
    --field-color: var(--tavenem-color-text);
    appearance: none;
    background: none;
    border: 0;
    border-color: var(--field-border-color);
    border-radius: var(--tavenem-border-radius);
    box-shadow: none;
    box-sizing: content-box;
    color: var(--field-color);
    cursor: text;
    flex-basis: auto;
    flex-grow: 1;
    flex-shrink: 1;
    font: inherit;
    font-size: 1rem;
    font-weight: var(--tavenem-font-weight);
    height: 1.1875rem;
    line-height: 1.1875rem;
    margin: 0;
    margin-bottom: 2px;
    margin-top: 3px;
    max-width: 100%;
    min-height: calc(1.25rem + 10px);
    min-width: 0;
    padding: 0;
    position: relative;
    transition: border-color .15s ease-in-out, box-shadow .15s ease-in-out;
    vertical-align: top;
    width: 100%;
    -webkit-tap-highlight-color: transparent;
    -moz-appearance: textfield;
    -webkit-appearance: textfield;

    &:focus {
        outline: 0;
    }

    &:focus-within {
        --field-border-color: var(--field-active-border-color);
        --field-border-hover-color: var(--field-active-border-hover-color);
    }

    &:-webkit-autofill {
        border-radius: inherit;
    }

    svg {
        min-height: 1.5em;
    }

    &:disabled,
    &[disabled] {
        --field-color: var(--tavenem-color-text-disabled);
        border-color: var(--tavenem-color-action-disabled);
        cursor: default;
        opacity: 1;
    }
}

input::placeholder {
    color: currentColor;
    opacity: 0.42;
    transition: opacity 200ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
}

:host([disabled]) input {
    --field-color: var(--tavenem-color-text-disabled);
    border-color: var(--tavenem-color-action-disabled);
    color: var(--tavenem-color-text-disabled);
    cursor: default;
    opacity: 1;

    svg {
        cursor: default;
        pointer-events: none;
    }
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

:host(.small) > button,
button.small {
    font-size: 1.25rem;
    padding: 5px;
}

button::-moz-focus-inner {
    border-style: none;
}

.picker-btn {
    padding: 0;

    &:has(svg) {
        color: var(--tavenem-theme-color, inherit);
    }
}

:host(.nested) {
    .picker-btn {
        padding: 0;
    }
}

.input-content {
    padding: .25rem;
}

.category-tabs {
    display: flex;
    flex-wrap: wrap;
    list-style: none;
    margin: 0;
    padding: 0;
}

.category-button {
    font-size: 1.25rem;
    padding: 2px;
}

.search-bar {
    align-items: center;
    display: flex;
    gap: .25rem;
}

.search-icon {
    fill: var(--tavenem-color-text-disabled);
    font-size: 1.25em;
}

.skin-tone-popover > div {
    display: flex;
    flex-direction: column;
    gap: .25rem;
    padding: .25rem;
}

.skin-tones {
    display: flex;
    flex-wrap: wrap;
    gap: .25rem;
    justify-content: center;
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

.skin-tones-button {
    padding: 2px 5px;
}

.skin-tones-button,
.skin-tone-button {
    font-size: 1rem;
    min-height: 1rem;
    min-width: 1rem;

    &:not([data-tone1]):not([data-tone2]),
    &[data-tone1=""][data-tone2=""],
    &[data-tone1="0"][data-tone2=""],
    &[data-tone1=""]:not([data-tone2]),
    &[data-tone1="0"]:not([data-tone2]) {
        background-color: #ffc83e;
    }
    &[data-tone1="1"][data-tone2="1"],
    &[data-tone1="1"][data-tone2=""],
    &[data-tone1="1"]:not([data-tone2]) {
        background-color: #ffd6c2;
    }
    &[data-tone1="2"][data-tone2="2"],
    &[data-tone1="2"][data-tone2=""],
    &[data-tone1="2"]:not([data-tone2]) {
        background-color: #eebfaa;
    }
    &[data-tone1="3"][data-tone2="3"],
    &[data-tone1="3"][data-tone2=""],
    &[data-tone1="3"]:not([data-tone2]) {
        background-color: #c78d7b;
    }
    &[data-tone1="4"][data-tone2="4"],
    &[data-tone1="4"][data-tone2=""],
    &[data-tone1="4"]:not([data-tone2]) {
        background-color: #966661;
    }
    &[data-tone1="5"][data-tone2="5"],
    &[data-tone1="5"][data-tone2=""],
    &[data-tone1="5"]:not([data-tone2]) {
        background-color: #57373a;
    }
    &[data-tone1=""][data-tone2="1"],
    &[data-tone2="1"]:not([data-tone1]) {
        background: linear-gradient(to right, #ffc83e, #ffd6c2);
    }
    &[data-tone1=""][data-tone2="2"],
    &[data-tone2="2"]:not([data-tone1]) {
        background: linear-gradient(to right, #ffc83e, #eebfaa);
    }
    &[data-tone1=""][data-tone2="3"],
    &[data-tone2="3"]:not([data-tone1]) {
        background: linear-gradient(to right, #ffc83e, #c78d7b);
    }
    &[data-tone1=""][data-tone2="4"],
    &[data-tone2="4"]:not([data-tone1]) {
        background: linear-gradient(to right, #ffc83e, #966661);
    }
    &[data-tone1=""][data-tone2="5"],
    &[data-tone2="5"]:not([data-tone1]) {
        background: linear-gradient(to right, #ffc83e, #57373a);
    }
    &[data-tone1="1"][data-tone2="0"] {
        background: linear-gradient(to right, #ffd6c2, #ffc83e);
    }
    &[data-tone1="1"][data-tone2="2"] {
        background: linear-gradient(to right, #ffd6c2, #eebfaa);
    }
    &[data-tone1="1"][data-tone2="2"] {
        background: linear-gradient(to right, #ffd6c2, #c78d7b);
    }
    &[data-tone1="1"][data-tone2="4"] {
        background: linear-gradient(to right, #ffd6c2, #966661);
    }
    &[data-tone1="1"][data-tone2="5"] {
        background: linear-gradient(to right, #ffd6c2, #57373a);
    }
    &[data-tone1="2"][data-tone2="0"] {
        background: linear-gradient(to right, #eebfaa, #ffc83e);
    }
    &[data-tone1="2"][data-tone2="1"] {
        background: linear-gradient(to right, #eebfaa, #ffd6c2);
    }
    &[data-tone1="2"][data-tone2="3"] {
        background: linear-gradient(to right, #eebfaa, #c78d7b);
    }
    &[data-tone1="2"][data-tone2="4"] {
        background: linear-gradient(to right, #eebfaa, #966661);
    }
    &[data-tone1="2"][data-tone2="5"] {
        background: linear-gradient(to right, #eebfaa, #57373a);
    }
    &[data-tone1="3"][data-tone2="0"] {
        background: linear-gradient(to right, #c78d7b, #ffc83e);
    }
    &[data-tone1="3"][data-tone2="1"] {
        background: linear-gradient(to right, #c78d7b, #ffd6c2);
    }
    &[data-tone1="3"][data-tone2="2"] {
        background: linear-gradient(to right, #c78d7b, #eebfaa);
    }
    &[data-tone1="3"][data-tone2="4"] {
        background: linear-gradient(to right, #c78d7b, #966661);
    }
    &[data-tone1="3"][data-tone2="5"] {
        background: linear-gradient(to right, #c78d7b, #57373a);
    }
    &[data-tone1="4"][data-tone2="0"] {
        background: linear-gradient(to right, #966661, #ffc83e);
    }
    &[data-tone1="4"][data-tone2="1"] {
        background: linear-gradient(to right, #966661, #ffd6c2);
    }
    &[data-tone1="4"][data-tone2="2"] {
        background: linear-gradient(to right, #966661, #eebfaa);
    }
    &[data-tone1="4"][data-tone2="3"] {
        background: linear-gradient(to right, #966661, #c78d7b);
    }
    &[data-tone1="4"][data-tone2="5"] {
        background: linear-gradient(to right, #966661, #57373a);
    }
    &[data-tone1="5"][data-tone2="0"] {
        background: linear-gradient(to right, #57373a, #ffc83e);
    }
    &[data-tone1="5"][data-tone2="1"] {
        background: linear-gradient(to right, #57373a, #ffd6c2);
    }
    &[data-tone1="5"][data-tone2="2"] {
        background: linear-gradient(to right, #57373a, #eebfaa);
    }
    &[data-tone1="5"][data-tone2="3"] {
        background: linear-gradient(to right, #57373a, #c78d7b);
    }
    &[data-tone1="5"][data-tone2="4"] {
        background: linear-gradient(to right, #57373a, #966661);
    }
}

.skin-tone-button {
    border-width: 1px;
    min-height: 1rem;
    min-width: 1rem;

    &.active {
        border-color: var(--tavenem-color-border);
        border-style: solid;
    }
}

.emoji-categories {
    display: flex;
    flex-direction: column;
    gap: .25rem;
    max-height: calc(10.5rem + 28px);
    overflow-y: auto;
}

.category {
    margin-top: .25em;
}

.emoji-list {
    display: grid;
    grid-template-columns: repeat(9, 1fr);
    justify-content: center;
    place-items: center;

    button {
        font-size: 1.25rem;
        line-height: 1.2;
        padding: 2px 2px;
    }

    .active {
        border-color: var(--tavenem-color-border);
        border-style: solid;
    }
}

.dialog-buttons {
    display: flex;
    justify-content: flex-end;
}

.dialog-buttons button {
    min-width: 0;
    padding: 6px 16px;
}

.emoji-clear {
    display: none;
    margin-inline-end: .5rem;
}

:host(.clearable) .emoji-clear {
    display: inline-flex;
}

:host(:disabled),
:host([readonly]),
:host([required]),
:host([empty]) {
    .emoji-clear {
        display: none;
    }
}

.tooltip {
    --tooltip-color: var(--tavenem-color-text);
    --tooltip-color-bg: var(--tavenem-color-bg-surface);
    align-items: center;
    background-color: var(--tooltip-color-bg);
    border-radius: var(--tavenem-border-radius);
    color: var(--tooltip-color);
    font-size: .75rem;
    font-weight: var(--tavenem-font-weight-semibold);
    justify-content: center;
    line-height: 1.4rem;
    padding: .25rem .5rem;
    text-align: center;
    z-index: var(--tavenem-zindex-tooltip);

    &:after {
        border-color: var(--tooltip-color-bg) transparent transparent transparent;
        border-style: solid;
        border-width: 6px;
        content: "";
        position: absolute;
    }

    &[data-popover-flip] {
        transform: translateY(-10px);

        &:after {
            top: 100%;
            transform: rotate(0deg);
        }
    }

    &:not([data-popover-flip]) {
        transform: translateY(10px);

        &:after {
            bottom: 100%;
            transform: rotate(180deg);
        }
    }
}
`;
        shadow.appendChild(style);

        const anchorId = randomUUID();

        const button = document.createElement('button');
        button.type = 'button';
        button.id = anchorId;
        button.className = this.dataset.inputClass || '';
        button.classList.add('picker-btn');
        button.style.cssText = this.dataset.inputStyle || '';
        button.disabled = this.hasAttribute('disabled')
            || this.hasAttribute('readonly');
        shadow.appendChild(button);

        if ('showEmoji' in this.dataset) {
            const emojiSpan = document.createElement('span');
            emojiSpan.classList.add('current-emoji', 'emoji');
            emojiSpan.textContent = this.getAttribute('value') || '☺️';
            button.appendChild(emojiSpan);
        } else {
            const buttonIcon = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
            button.appendChild(buttonIcon);
            buttonIcon.outerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="48" viewBox="0 -960 960 960" width="48"><path d="M626-533q22.5 0 38.25-15.75T680-587q0-22.5-15.75-38.25T626-641q-22.5 0-38.25 15.75T572-587q0 22.5 15.75 38.25T626-533Zm-292 0q22.5 0 38.25-15.75T388-587q0-22.5-15.75-38.25T334-641q-22.5 0-38.25 15.75T280-587q0 22.5 15.75 38.25T334-533Zm146 272q66 0 121.5-35.5T682-393H278q26 61 81 96.5T480-261Zm0 181q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z"/></svg>`;
        }

        const slot = document.createElement('slot');
        button.appendChild(slot);

        const input = document.createElement('input');
        input.classList.add('input');
        input.hidden = true;
        input.readOnly = true;
        input.disabled = this.hasAttribute('disabled');
        if (this.hasAttribute('value')) {
            input.value = this._value = this.getAttribute('value') || '';
            this._internals.setFormValue(this._value);
        }

        shadow.appendChild(input);

        const popover = document.createElement('tf-popover') as TavenemPopoverHTMLElement;
        popover.classList.add('filled', 'flip-onopen');
        popover.dataset.origin = 'top-left';
        popover.dataset.anchorOrigin = 'center-center';
        popover.dataset.anchorId = anchorId;
        shadow.appendChild(popover);
        this._popover = popover;

        const inputContent = document.createElement('div');
        inputContent.classList.add('input-content');
        popover.appendChild(inputContent);

        const categoryTabs = document.createElement('ul');
        categoryTabs.classList.add('category-tabs');
        inputContent.appendChild(categoryTabs);

        for (let i = 0; i < emojiCategories.length; i++) {
            const category = document.createElement('li');
            categoryTabs.appendChild(category);

            const categoryButton = document.createElement('button');
            categoryButton.type = 'button';
            categoryButton.classList.add('category-button');
            categoryButton.disabled = this.hasAttribute('disabled');
            categoryButton.dataset.categoryId = emojiCategories[i].id;
            category.appendChild(categoryButton);
            categoryButton.addEventListener('click', this.onCategoryClick.bind(this, emojiCategories[i].id));

            const categoryIcon = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
            categoryButton.appendChild(categoryIcon);
            categoryIcon.outerHTML = emojiCategories[i].svg;

            const categoryTooltip = document.createElement('tf-tooltip');
            categoryTooltip.textContent = emojiCategories[i].name;
            categoryButton.appendChild(categoryTooltip);
        }

        const searchBar = document.createElement('div');
        searchBar.classList.add('search-bar');
        inputContent.appendChild(searchBar);

        const searchIcon = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
        searchBar.appendChild(searchIcon);
        searchIcon.outerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="search-icon" height="48" viewBox="0 -960 960 960" width="48"><path d="M796-121 533-384q-30 26-69.959 40.5T378-329q-108.162 0-183.081-75Q120-479 120-585t75-181q75-75 181.5-75t181 75Q632-691 632-584.85 632-542 618-502q-14 40-42 75l264 262-44 44ZM377-389q81.25 0 138.125-57.5T572-585q0-81-56.875-138.5T377-781q-82.083 0-139.542 57.5Q180-666 180-585t57.458 138.5Q294.917-389 377-389Z"/></svg>`;

        const searchInput = document.createElement('input');
        searchInput.type = 'search';
        searchInput.classList.add('search');
        searchInput.placeholder = 'Search';
        searchBar.appendChild(searchInput);
        searchInput.addEventListener('input', this.onSearch.bind(this));

        const skinTonesPicker = document.createElement('tf-picker');
        skinTonesPicker.dataset.popoverContainer = '';
        skinTonesPicker.tabIndex = -1;
        searchBar.appendChild(skinTonesPicker);

        const skinTonesButton = document.createElement('button');
        skinTonesButton.type = 'button';
        skinTonesButton.classList.add('skin-tones-button');
        skinTonesButton.dataset.popoverContainer = '';
        skinTonesPicker.appendChild(skinTonesButton);
        skinTonesButton.addEventListener('click', this.onToggleSkinTones.bind(this));

        const skinToneIcon = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
        skinTonesButton.appendChild(skinToneIcon);
        skinToneIcon.outerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="48" viewBox="0 -960 960 960" width="48"><path d="M480-80q-82 0-155-31.5t-127.5-86Q143-252 111.5-325T80-480q0-84 32-157t87.5-127q55.5-54 130-85T489-880q79 0 150 26.5T763.5-780q53.5 47 85 111.5T880-527q0 108-63 170.5T650-294h-75q-18 0-31 14t-13 31q0 20 14.5 38t14.5 43q0 26-24.5 57T480-80ZM247-454q20 0 35-15t15-35q0-20-15-35t-35-15q-20 0-35 15t-15 35q0 20 15 35t35 15Zm126-170q20 0 35-15t15-35q0-20-15-35t-35-15q-20 0-35 15t-15 35q0 20 15 35t35 15Zm214 0q20 0 35-15t15-35q0-20-15-35t-35-15q-20 0-35 15t-15 35q0 20 15 35t35 15Zm131 170q20 0 35-15t15-35q0-20-15-35t-35-15q-20 0-35 15t-15 35q0 20 15 35t35 15Z"/></svg>`;

        const skinToneTooltip = document.createElement('tf-tooltip');
        skinToneTooltip.textContent = 'Select skin tone(s)';
        skinTonesButton.appendChild(skinToneTooltip);

        const skinTonePopover = document.createElement('tf-popover');
        skinTonePopover.classList.add('skin-tone-popover', 'flip-onopen', 'filled');
        skinTonePopover.dataset.origin = 'top-center';
        skinTonePopover.dataset.anchorOrigin = 'bottom-center';
        skinTonesPicker.appendChild(skinTonePopover);

        const skinTonePopoverContainer = document.createElement('div');
        skinTonePopover.appendChild(skinTonePopoverContainer);

        const skinTones1 = document.createElement('div');
        skinTones1.classList.add('skin-tones');
        skinTonePopoverContainer.appendChild(skinTones1);

        for (let i = 0; i < 6; i++) {
            const skinToneButton = document.createElement('button');
            skinToneButton.classList.add('skin-tone-button', 'skin-tone1-button', 'btn-text');
            skinToneButton.dataset.tone1 = i.toString();
            if (i === 0) {
                skinToneButton.classList.add('active');
            }
            skinTones1.appendChild(skinToneButton);
            skinToneButton.addEventListener('click', this.onSkinTone1.bind(this));
        }

        const skinTones2 = document.createElement('div');
        skinTones2.classList.add('skin-tones');
        skinTonePopoverContainer.appendChild(skinTones2);

        for (let i = 0; i < 6; i++) {
            const skinToneButton = document.createElement('button');
            skinToneButton.classList.add('skin-tone-button', 'skin-tone2-button', 'btn-text');
            skinToneButton.dataset.tone1 = i.toString();
            if (i === 0) {
                skinToneButton.classList.add('active');
            }
            skinTones2.appendChild(skinToneButton);
            skinToneButton.addEventListener('click', this.onSkinTone2.bind(this));
        }

        const emojiCategoryLists = document.createElement('div');
        emojiCategoryLists.classList.add('emoji-categories');
        inputContent.appendChild(emojiCategoryLists);

        const buttonsDiv = document.createElement('div');
        buttonsDiv.classList.add('dialog-buttons');
        inputContent.appendChild(buttonsDiv);

        const clearButton = document.createElement('button');
        clearButton.classList.add('emoji-clear', 'btn-text');
        clearButton.textContent = "Clear";
        clearButton.type = 'button';
        clearButton.disabled = this.hasAttribute('disabled')
            || this.hasAttribute('readonly');
        buttonsDiv.appendChild(clearButton);
        clearButton.addEventListener('click', this.onClearButton.bind(this));

        const cancelButton = document.createElement('button');
        cancelButton.classList.add('cancel', 'btn-text');
        cancelButton.textContent = "Cancel";
        cancelButton.type = 'button';
        buttonsDiv.appendChild(cancelButton);
        cancelButton.addEventListener('click', this.onCancel.bind(this));
        
        shadow.addEventListener('mousedown', this.onOuterMouseDown.bind(this));
        shadow.addEventListener('mouseup', this.onOuterMouseUp.bind(this));
        shadow.addEventListener('keyup', this.onOuterKeyUp.bind(this));
        document.addEventListener('mousedown', this.onDocMouseDown.bind(this));

        const response = await fetch("_content/Tavenem.Blazor.Framework/emoji.json");
        const emoji = await response.json() as Emoji[];
        const s: Record<string, Emoji[]> = {};
        this._categorizedEmoji = emoji.reduce((p, c) => {
            const category = c.category.replace('&', '-').replaceAll(' ', '').toLowerCase();
            p[category] = p[category] || [];
            p[category].push(c);
            return p;
        }, s);
        this._filteredEmoji = this._categorizedEmoji;

        this.listEmoji(emojiCategoryLists);
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

        const categoryButtons = root.querySelectorAll('.category-button');
        categoryButtons.forEach(x => {
            if (x instanceof HTMLButtonElement) {
                const categoryId = x.dataset.categoryId;
                if (categoryId) {
                    x.removeEventListener('click', this.onCategoryClick.bind(this, categoryId));
                }
            }
        });

        const searchInput = root.querySelector('.search');
        if (searchInput) {
            searchInput.removeEventListener('input', this.onSearch.bind(this));
        }

        const skinTonesButton = root.querySelector('skin-tones-button');
        if (skinTonesButton) {
            skinTonesButton.removeEventListener('click', this.onToggleSkinTones.bind(this));
        }

        const skinTone1Buttons = root.querySelectorAll('.skin-tone1-button');
        skinTone1Buttons.forEach(x => {
            if (x instanceof HTMLButtonElement) {
                x.removeEventListener('click', this.onSkinTone1.bind(this));
            }
        });

        const skinTone2Buttons = root.querySelectorAll('.skin-tone2-button');
        skinTone2Buttons.forEach(x => {
            if (x instanceof HTMLButtonElement) {
                x.removeEventListener('click', this.onSkinTone2.bind(this));
            }
        });

        const emojiButtons = root.querySelectorAll('.emoji-button');
        emojiButtons.forEach(x => {
            if (x instanceof HTMLButtonElement) {
                x.removeEventListener('click', this.onEmojiButton.bind(this));
            }
        });

        const clearButton = root.querySelector('.emoji-clear');
        if (clearButton) {
            clearButton.removeEventListener('click', this.onClearButton.bind(this));
        }
        const cancelButton = root.querySelector('.cancel');
        if (cancelButton) {
            cancelButton.removeEventListener('click', this.onCancel.bind(this));
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

            const skinToneButton = root.querySelector('.skin-tone-button') as HTMLButtonElement;
            if (skinToneButton) {
                if (newValue) {
                    skinToneButton.disabled = true;
                } else {
                    skinToneButton.disabled = this.matches(':disabled');
                }
            }

            const emojiButtons = root.querySelectorAll('.emoji-button');
            emojiButtons.forEach(x => {
                if (x instanceof HTMLButtonElement) {
                    if (newValue) {
                        x.disabled = true;
                    } else {
                        x.disabled = this.matches(':disabled');
                    }
                }
            });

            const clearButton = root.querySelector('.emoji-clear') as HTMLButtonElement;
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

        const categoryButtons = root.querySelectorAll('.category-button');
        categoryButtons.forEach(x => {
            if (x instanceof HTMLButtonElement) {
                if (disabled) {
                    x.disabled = true;
                } else {
                    x.disabled = false;
                }
            }
        });

        const searchInput = root.querySelector('.search') as HTMLInputElement;
        if (searchInput) {
            if (disabled) {
                searchInput.disabled = true;
            } else {
                searchInput.disabled = false;
            }
        }

        const skinToneButton = root.querySelector('.skin-tones-button') as HTMLButtonElement;
        if (skinToneButton) {
            if (disabled) {
                skinToneButton.disabled = true;
            } else {
                skinToneButton.disabled = this.hasAttribute('readonly');
            }
        }

        const emojiButtons = root.querySelectorAll('.emoji-button');
        emojiButtons.forEach(x => {
            if (x instanceof HTMLButtonElement) {
                if (disabled) {
                    x.disabled = true;
                } else {
                    x.disabled = this.hasAttribute('readonly');
                }
            }
        });

        const clearButton = root.querySelector('.emoji-clear') as HTMLButtonElement;
        if (clearButton) {
            if (disabled) {
                clearButton.disabled = true;
            } else {
                clearButton.disabled = this.hasAttribute('readonly');
            }
        }

        this.setOpen(false);
    }

    formResetCallback() {
        if (this.hasAttribute('value')) {
            this._value = this.getAttribute('value') || '';
            this._internals.setFormValue(this._value);
        } else {
            this._value = '';
            this._internals.setFormValue(null);
        }

        const root = this.shadowRoot;
        if (!root) {
            return;
        }
        const input = root.querySelector<HTMLInputElement>('.input');
        if (input) {
            input.value = this._value;
        }
    }

    formStateRestoreCallback(state: string | File | FormData | null, mode: 'restore' | 'autocomplete') {
        if (typeof state === 'string') {
            this.setValue(state);
        } else if (state == null) {
            this.clear();
        }
    }

    checkValidity() { return this._internals.checkValidity(); }

    reportValidity() { return this._internals.reportValidity(); }

    protected clear() {
        this._value = '';
        this._internals.setFormValue(null);
        this.dispatchEvent(TavenemPickerHtmlElement.newValueChangeEvent(''));

        const root = this.shadowRoot;
        if (!root) {
            return;
        }

        const input = root.querySelector('.input') as TavenemInputHtmlElement;
        if (input) {
            input.value = '';
        }

        const emojiSpan = root.querySelector('.current-emoji');
        if (emojiSpan) {
            emojiSpan.textContent = '☺️';
        }
    }

    protected onOpening() {
        const localLatest = localStorage.getItem(latestEmojiStorageKey);
        if (localLatest) {
            const latest = JSON.parse(localLatest);
            if (latest) {
                this._latestEmoji = latest;
                this.refreshLatest();
            }
        }
    }

    protected stringValue() { return this._value; }

    private static getSkinTone(value: number) {
        switch (value) {
            case 1: return [0xD83C, 0xDFFB];
            case 2: return [0xD83C, 0xDFFC];
            case 3: return [0xD83C, 0xDFFD];
            case 4: return [0xD83C, 0xDFFE];
            case 5: return [0xD83C, 0xDFFF];
            default: return [0xFFFD];
        };
    }

    private static getEmojiText(emoji: Emoji) {
        const codepoints = [parseInt(emoji.codepoint, 16)];
        if (emoji.codepoints) {
            codepoints.push(...emoji.codepoints.map(x => parseInt(x, 16)));
        }
        return String.fromCodePoint(...codepoints);
    }

    private static emojiWithSkinTones(emoji: Emoji, tone1?: number | null, tone2?: number | null) {
        if (!emoji.hasSkinTones || !tone1 || tone1 < 1 || tone1 > 5)
        {
            return TavenemEmojiPickerHTMLElement.getEmojiText(emoji);
        }
        const codepoints = [parseInt(emoji.codepoint, 16)];
        const skinTone1 = TavenemEmojiPickerHTMLElement.getSkinTone(tone1);
        codepoints.push(...skinTone1);
        if (!emoji.codepoints)
        {
            return String.fromCodePoint(...codepoints);
        }
        const startIndex = emoji.codepoints[0] === "FE0F" ? 1 : 0; // variation selector should be omitted when using a skin tone modifier
        for (let i = startIndex; i < emoji.codepoints.length; i++) {
            codepoints.push(parseInt(emoji.codepoints[i], 16));
            if (people.includes(emoji.codepoints[i])) {
                codepoints.push(...(!tone2 || tone2 < 1 || tone2 > 5 ? skinTone1 : TavenemEmojiPickerHTMLElement.getSkinTone(tone2)));
                if (i < emoji.codepoints.length - 1
                    && emoji.codepoints[i + 1] === "FE0F") {
                    i++; // if the next codepoint would be the variation selector, skip it
                }
            }
        }
        return String.fromCodePoint(...codepoints);
    }

    private listEmoji(container: Element) {
        const nodes: Node[] = [];
        for (const category of emojiCategories) {
            this.addEmojiCategory(category.id, category.name, nodes);
        }
        container.replaceChildren(...nodes);
    }

    private addEmojiCategory(id: string, name: string, nodes: Node[]) {
        const list = id === 'latest'
            ? this._latestEmoji
            : this._filteredEmoji[id];

        if (!list || !list.length) {
            return;
        }

        const title = document.createElement('div');
        title.classList.add('category', id);
        title.textContent = name;
        nodes.push(title);

        const listDiv = document.createElement('div');
        listDiv.classList.add('emoji-list', id);

        const current = this.getAttribute('emoji') || '';
        for (let i = 0; i < list.length; i++) {
            const button = document.createElement('button') as HtmlEmojiButtonElement;
            button.emoji = list[i];
            button.type = 'button';
            button.classList.add('emoji-button', 'btn-text');
            button.disabled = this.hasAttribute('disabled')
                || this.hasAttribute('readonly');
            button.title = list[i].name;
            if (button.title === current) {
                button.classList.add('active');
            }
            if (list[i].hasSkinTones) {
                button.classList.add('has-skin-tones');
            }

            const emoji = TavenemEmojiPickerHTMLElement.emojiWithSkinTones(list[i], this._skinTone1, this._skinTone2);
            button.textContent = emoji;

            button.addEventListener('click', this.onEmojiButton.bind(this));
            listDiv.appendChild(button);
        }
        nodes.push(listDiv);
    }

    private onCategoryClick(id: string, event: Event) {
        event.preventDefault();
        event.stopPropagation();

        const root = this.shadowRoot;
        if (!root) {
            return;
        }
        const element = root.querySelector(`.category.${id}`);
        if (!(element instanceof HTMLElement)) {
            return;
        }
        element.scrollIntoView({
            behavior: "smooth",
            block: "start",
            inline: "nearest"
        });
    }

    private onClearButton(event: Event) {
        event.preventDefault();
        event.stopPropagation();

        if (!this.hasAttribute('disabled')
            && !this.hasAttribute('readonly')) {
            this.clear();
        }
        this.setOpen(false);
        this._filteredEmoji = this._categorizedEmoji;
    }

    private onCancel(event: Event) {
        event.preventDefault();
        event.stopPropagation();

        this.setOpen(false);
        this._filteredEmoji = this._categorizedEmoji;
    }

    private onEmojiButton(event: Event) {
        event.preventDefault();
        event.stopPropagation();

        if (!(event.currentTarget instanceof HTMLElement)) {
            return;
        }

        const value = event.currentTarget.textContent;
        if (!value || !value.length) {
            return;
        }

        this.setAttribute('value', value);

        const root = this.shadowRoot;
        if (!root) {
            return;
        }

        const input = root.querySelector('.input') as TavenemInputHtmlElement;
        if (input) {
            input.value = value;
        }

        const emojiSpan = root.querySelector('.current-emoji');
        if (emojiSpan) {
            emojiSpan.textContent = value;
        }

        root.querySelectorAll('.emoji-button')
            .forEach(x => x.classList.remove('active'));
        event.currentTarget.classList.add('active');

        this.setOpen(false);

        const button = event.currentTarget as HtmlEmojiButtonElement;
        if (!button.emoji) {
            return;
        }

        if (this._latestEmoji.length > 0
            && this._latestEmoji[0].name === button.emoji.name) {
            return;
        }
        this._latestEmoji = this._latestEmoji.filter(x => x.name !== button.emoji!.name);
        if (this._latestEmoji.length >= 9) {
            this._latestEmoji.splice(this._latestEmoji.length - 1, 1);
        }
        this._latestEmoji.splice(0, 0, button.emoji);

        localStorage.setItem(latestEmojiStorageKey, JSON.stringify(this._latestEmoji));

        this.refreshLatest();
    }

    private onOuterKeyUp(event: Event) { this.onKeyUp(event as KeyboardEvent); }

    private onOuterMouseDown(event: Event) {
        this.onMouseDown(event);
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

    private onOuterMouseUp(event: Event) { this.onMouseUp(event as MouseEvent); }

    private onSearch(event: Event) {
        if (!(event.target instanceof HTMLInputElement)
            || !(event instanceof InputEvent)
            || event.isComposing) {
            return;
        }

        const root = this.shadowRoot;
        if (!root) {
            return;
        }

        const searchText = event.target.value;
        if (!searchText || !searchText.length) {
            this._filteredEmoji = this._categorizedEmoji;
        } else {
            const searchTerms = searchText
                .split(' ')
                .map(x => x.trim().toLowerCase())
                .filter(x => x.length);

            this._filteredEmoji = {};
            for (const category in this._categorizedEmoji) {
                const emojiList = this._categorizedEmoji[category]
                    .filter(x => x.keywords.some(y => searchTerms.some(z => y.includes(z))));
                if (emojiList.length) {
                    this._filteredEmoji[category] = emojiList;
                }
            }
        }

        const emojiCategoryLists = root.querySelector('.emoji-categories');
        if (emojiCategoryLists) {
            this.listEmoji(emojiCategoryLists);
        }

    }

    private onToggleSkinTones() {
        const root = this.shadowRoot;
        if (!root) {
            return;
        }

        const picker = root.querySelector<TavenemPickerHtmlElement>('.skin-tone-popover');
        if (picker) {
            picker.toggle();
        }
    }

    private onSkinTone1(event: Event) {
        event.preventDefault();
        event.stopPropagation();

        this.onToggleSkinTones();

        if (!(event.currentTarget instanceof HTMLElement)
            || !('tone1' in event.currentTarget.dataset)) {
            return;
        }

        this._skinTone1 = parseInt(event.currentTarget.dataset.tone1 || '0');

        const root = this.shadowRoot;
        if (!root) {
            return;
        }
        const skinTonesButton = root.querySelector('.skin-tones-button');
        if (!(skinTonesButton instanceof HTMLElement)) {
            return;
        }
        skinTonesButton.dataset.tone1 = this._skinTone1.toString();

        const skinTone1Buttons = root.querySelectorAll('.skin-tone1-button');
        for (const skinTone1Button of skinTone1Buttons) {
            if (!(skinTone1Button instanceof HTMLElement)
                || !('tone1' in skinTone1Button.dataset)) {
                continue;
            }
            if (skinTone1Button.dataset.tone1 === skinTonesButton.dataset.tone1) {
                skinTone1Button.classList.add('active');
            } else {
                skinTone1Button.classList.remove('active');
            }
        }

        for (const button of root.querySelectorAll('.emoji-button.has-skin-tones')) {
            const emojiButton = button as HtmlEmojiButtonElement;
            if (!emojiButton || !emojiButton.emoji) {
                continue;
            }
            const emoji = TavenemEmojiPickerHTMLElement.emojiWithSkinTones(emojiButton.emoji, this._skinTone1, this._skinTone2);
            button.textContent = emoji;
        }
    }

    private onSkinTone2(event: Event) {
        event.preventDefault();
        event.stopPropagation();

        this.onToggleSkinTones();

        if (!(event.currentTarget instanceof HTMLElement)
            || !('tone1' in event.currentTarget.dataset)) {
            return;
        }

        this._skinTone2 = parseInt(event.currentTarget.dataset.tone1 || '0');

        const root = this.shadowRoot;
        if (!root) {
            return;
        }
        const skinTonesButton = root.querySelector('.skin-tones-button');
        if (!(skinTonesButton instanceof HTMLElement)) {
            return;
        }
        skinTonesButton.dataset.tone2 = this._skinTone2.toString();

        const skinTone2Buttons = root.querySelectorAll('.skin-tone2-button');
        for (const skinTone2Button of skinTone2Buttons) {
            if (!(skinTone2Button instanceof HTMLElement)
                || !('tone1' in skinTone2Button.dataset)) {
                continue;
            }
            if (skinTone2Button.dataset.tone1 === skinTonesButton.dataset.tone2) {
                skinTone2Button.classList.add('active');
            } else {
                skinTone2Button.classList.remove('active');
            }
        }

        for (const button of root.querySelectorAll('.emoji-button.has-skin-tones')) {
            const emojiButton = button as HtmlEmojiButtonElement;
            if (!emojiButton || !emojiButton.emoji) {
                continue;
            }
            const emoji = TavenemEmojiPickerHTMLElement.emojiWithSkinTones(emojiButton.emoji, this._skinTone1, this._skinTone2);
            button.textContent = emoji;
        }
    }

    private refreshLatest() {
        const root = this.shadowRoot;
        if (!root) {
            return;
        }

        const emojiCategoryLists = root.querySelector('.emoji-categories');
        if (!emojiCategoryLists) {
            return;
        }

        let list = emojiCategoryLists.querySelector('.emoji-list.latest');
        if (!list) {
            list = document.createElement('div');
            list.classList.add('emoji-list', 'latest');
            emojiCategoryLists.prepend(list);

            const title = document.createElement('div');
            title.classList.add('category', 'latest');
            title.textContent = 'Latest';
            emojiCategoryLists.prepend(title);
        }

        const nodes: Node[] = [];
        const current = this.getAttribute('emoji') || '';
        for (let i = 0; i < this._latestEmoji.length; i++) {
            const button = document.createElement('button') as HtmlEmojiButtonElement;
            button.emoji = this._latestEmoji[i];
            button.type = 'button';
            button.classList.add('emoji-button', 'btn-text');
            button.title = this._latestEmoji[i].name;
            if (button.title === current) {
                button.classList.add('active');
            }

            const emoji = TavenemEmojiPickerHTMLElement.emojiWithSkinTones(this._latestEmoji[i], this._skinTone1, this._skinTone2);
            button.textContent = emoji;

            button.addEventListener('click', this.onEmojiButton.bind(this));
            nodes.push(button);
        }
        list.replaceChildren(...nodes);
    }

    private setValue(value?: string | null) {
        if (!value || !value.length) {
            this.clear();
            return;
        }

        this._value = value;
        this._internals.setFormValue(value);
        this.dispatchEvent(TavenemPickerHtmlElement.newValueChangeEvent(value));

        const root = this.shadowRoot;
        if (!root) {
            return;
        }

        const input = root.querySelector('.input') as TavenemInputHtmlElement;
        if (input) {
            input.value = value;
        }

        const emojiSpan = root.querySelector('.current-emoji');
        if (emojiSpan) {
            emojiSpan.textContent = value;
        }

        const buttons = root.querySelectorAll('.emoji-button');
        for (const button of buttons) {
            if (button.textContent === value) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        }
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