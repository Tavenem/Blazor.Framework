import { randomUUID } from "../tavenem-utility";

export class TavenemPaginationHtmlElement extends HTMLElement {
    static formAssociated = true;

    static style = `
:host {
    --pagination-active-color: var(--tavenem-theme-color, var(--tavenem-color-primary));
    --pagination-active-text-color: var(--tavenem-theme-color-text, var(--tavenem-color-primary-text));
}

nav {
    align-items: center;
    color: var(--tavenem-color-action);
    display: inline-flex;
    flex-direction: column;
    flex-wrap: wrap;
    font-size: 1rem;
    gap: .5rem;
}

ol {
    align-items: center;
    display: inline-flex;
    flex-wrap: wrap;
    gap: 6px;
    list-style: none;
    margin: 0;
    padding: 0;

    [dir="rtl"] & {
        flex-direction: row-reverse;
    }
}

button, .btn {
    --button-default-active-shadow: 0px 5px 5px -3px rgba(0, 0, 0, 0.2), 0px 8px 10px 1px rgba(0, 0, 0, 0.14), 0px 3px 14px 2px rgba(0,0,0,.12);
    --button-default-bg: var(--tavenem-color-default);
    --button-default-color: var(--tavenem-color-default-text);
    --button-default-hover-bg: var(--tavenem-color-default-darken);
    --button-default-hover-shadow: 0px 2px 4px -1px rgba(0, 0, 0, 0.2), 0px 4px 5px 0px rgba(0, 0, 0, 0.14), 0px 1px 10px 0px rgba(0,0,0,.12);
    --button-default-padding-x: 16px;
    --button-default-padding-y: 6px;
    --button-default-shadow: 0px 3px 1px -2px rgba(0,0,0,0.2),0px 2px 2px 0px rgba(0,0,0,0.14),0px 1px 5px 0px rgba(0,0,0,0.12);
    --button-active-shadow: var(--button-inherited-active-shadow, var(--button-default-active-shadow));
    --button-bg: var(--button-inherited-bg, var(--button-default-bg));
    --button-border-color: var(--button-inherited-border-color, var(--tavenem-color-border));
    --button-border-style: var(--button-inherited-border-style, none);
    --button-color: var(--button-inherited-color, var(--button-default-color));
    --button-font-size: var(--button-inherited-font-size, var(--tavenem-font-size-button));
    --button-hover-bg: var(--button-inherited-hover-bg, var(--button-default-hover-bg));
    --button-hover-color: var(--button-inherited-hover-color, var(--tavenem-color-default-text));
    --button-hover-shadow: var(--button-inherited-hover-shadow, var(--button-default-hover-shadow));
    --button-padding-x: var(--button-inherited-padding-x, var(--button-default-padding-x));
    --button-padding-y: var(--button-inherited-padding-y, var(--button-default-padding-y));
    --button-shadow: var(--button-inherited-shadow, var(--button-default-shadow));
    align-items: center;
    background-color: var(--button-bg);
    border-color: var(--button-border-color);
    border-radius: var(--tavenem-border-radius);
    border-style: var(--button-border-style);
    border-width: 1px;
    box-shadow: var(--button-shadow);
    box-sizing: border-box;
    color: var(--button-color);
    cursor: pointer;
    display: inline-flex;
    flex: 0 0 auto;
    font-size: var(--button-font-size);
    font-weight: var(--tavenem-font-weight-semibold);
    gap: .25rem;
    justify-content: center;
    line-height: var(--tavenem-lineheight-button);
    margin: 0;
    min-width: 4rem;
    outline: 0;
    overflow: hidden;
    padding: var(--button-padding-y) var(--button-padding-x);
    position: relative;
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
        transform: scale(10,10);
        transition: transform .3s,opacity 1s;
        width: 100%;
    }

    > *:first-child {
        border-top-left-radius: inherit;
        border-bottom-left-radius: inherit;
    }

    > *:last-child {
        border-top-right-radius: inherit;
        border-bottom-right-radius: inherit;
    }

    > *:only-child {
        border-radius: inherit;
    }

    svg {
        max-height: 1em;
    }

    &:hover,
    &:focus-visible {
        background-color: var(--button-hover-bg);
        box-shadow: var(--button-hover-shadow);
        color: var(--button-hover-color);
    }

    &:active {
        box-shadow: var(--button-active-shadow);

        &:after {
            transform: scale(0,0);
            opacity: .1;
            transition: 0s;
        }
    }

    :host(.small) & {
        --button-font-size: calc(var(--tavenem-font-size-button) - 1px);
        --button-default-padding-x: 10px;
        --button-default-padding-y: 4px;
    }

    :host(.large) & {
        --button-font-size: calc(var(--tavenem-font-size-button) + 1px);
        --button-default-padding-x: 22px;
        --button-default-padding-y: 8px;
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
button::-moz-focus-inner {
    border-style: none;
}

.btn-text {
    --button-default-active-shadow: none;
    --button-default-bg: transparent;
    --button-default-color: inherit;
    --button-default-hover-bg: var(--tavenem-color-action-hover-bg);
    --button-default-hover-shadow: none;
    --button-default-shadow: none;
    --button-hover-color: var(--button-inherited-hover-color, inherit);
    min-width: 0;

    :host(.small) & {
        --button-font-size: calc(var(--tavenem-font-size-button) - 1px);
        --button-padding-x: 5px;
    }

    :host(.large) & {
        --button-font-size: calc(var(--tavenem-font-size-button) + 1px);
        --button-padding-x: 11px;
    }

    &:disabled, &[inert], [inert] & {
        --button-bg: transparent;
        background-color: transparent;
    }
}

.btn-icon {
    --button-default-active-shadow: none;
    --button-default-bg: transparent;
    --button-default-color: inherit;
    --button-default-hover-bg: var(--tavenem-color-action-hover-bg);
    --button-default-hover-shadow: none;
    --button-default-shadow: none;
    --button-font-size: var(--button-inherited-font-size-icon, 1.5rem);
    --button-hover-color: var(--button-inherited-hover-color, inherit);
    --button-padding-x: var(--button-inherited-padding-x-icon, var(--button-default-padding-y));
    --button-padding-y: var(--button-inherited-padding-y-icon, var(--button-default-padding-y));
    border-radius: 9999px;
    flex: 0 0 auto;
    line-height: 1;
    min-width: calc(var(--button-font-size) + (var(--button-padding-x) * 2));
    padding: var(--button-padding-y) var(--button-padding-x);
    text-align: center;

    &:after {
        transform: scale(7,7);
    }

    :host(.small) & {
        --button-font-size: 1.25rem;
        --button-default-padding-y: 5px;
    }

    :host(.large) & {
        --button-font-size: 2rem;
        --button-default-padding-y: 5px;
    }

    &:disabled, &[inert], [inert] & {
        --button-bg: transparent;
        background-color: transparent;
    }
}

svg {
    height: 1.5em;
    fill: currentColor;
    flex-shrink: 0;
    width: auto;
}

li {
    &.btn,
    > .btn-text {
        border-radius: 9999px;
        height: 2rem;
        min-width: 2rem;
        padding: 0 6px;
        text-align: center;
    }

    &:not(.active) > .btn-text {
        box-shadow: none;
    }

    &.btn.active,
    &.active {
        background-color: var(--pagination-active-color);
        color: var(--pagination-active-text-color);
    }

    &[inert], [inert] &,
    &[inert].btn, [inert] &.btn {
        --pagination-active-color: var(--tavenem-color-action-disabled-bg);
        --pagination-active-text-color: var(--tavenem-color-action-disabled);
        color: var(--tavenem-color-action-disabled);
    }
}

:host(.filled) {
    background-color: transparent;
    color: var(--tavenem-color-action);
}

:host(.outlined) {
    border-style: none;

    li {
        border: 1px solid var(--tavenem-color-border);

        &.active {
            background-color: transparent;
            border-color: (--pagination-active-color);
        }
    }
}

:host(.bg-alt) {
    background-color: transparent;
}

:host(:disabled, &[inert]) {
    --pagination-active-color: var(--tavenem-color-action-disabled-bg);
    --pagination-active-text-color: var(--tavenem-color-action-disabled);

    li.btn,
    li > .btn-text {
        box-shadow: none;
        color: var(--tavenem-color-action-disabled);
        cursor: default;
        pointer-events: none;
    }
}

:host(.small) {
    --button-inherited-font-size: 0.7109375rem;
    font-size: .8125rem;

    li.btn,
    li > .btn-text {
        height: 1.625rem;
        min-width: 1.625rem;
    }
}

:host(.large) {
    --button-inherited-font-size: 1.3125rem;
    font-size: 1.5rem;

    li.btn,
    li > .btn-text {
        height: 2.5rem;
        min-width: 2.5rem;
    }
}`;

    private _currentPage: number = 1;
    private _initialValue: string | null | undefined;
    private _internals: ElementInternals;
    private _pageCount: number | null | undefined;
    private _value = '';

    static get observedAttributes() {
        return [
            'data-links',
            'data-max-pages',
            'data-page-count',
            'value',
        ];
    }

    private static newNextPageEvent() {
        return new CustomEvent('nextpage', { bubbles: true, composed: true });
    }

    private static newValueChangeEvent(value: string) {
        return new CustomEvent('valuechange', { bubbles: true, composed: true, detail: { value: value } });
    }

    get currentPage() { return this._currentPage; }
    set currentPage(v: number) { this.setCurrentPage(v); }

    get form() { return this._internals.form; }

    get name() { return this.getAttribute('name'); }

    get type() { return this.localName; }

    get value() { return this._value; }
    set value(v: string) { this.setValue(v); }

    get willValidate() { return this._internals.willValidate; }

    constructor() {
        super();

        this._internals = this.attachInternals();
    }

    connectedCallback() {
        const shadow = this.attachShadow({ mode: 'open', delegatesFocus: true });

        if (!this.id.length) {
            this.id = randomUUID();
        }

        const pageCount = parseInt(this.dataset.pageCount || '');
        this._pageCount = Number.isFinite(pageCount) && pageCount > 0
            ? pageCount
            : null;

        const style = document.createElement('style');
        style.textContent = TavenemPaginationHtmlElement.style;
        shadow.appendChild(style);

        const nav = document.createElement('nav');
        nav.role = 'navigation';
        if (this.matches(':disabled')) {
            nav.inert = true;
        }
        shadow.appendChild(nav);

        const list = document.createElement('ol');
        nav.appendChild(list);

        const slot = document.createElement('slot');
        shadow.appendChild(slot);

        if (this.hasAttribute('value')) {
            this.setValue(this.getAttribute('value'));
            this._initialValue = this._value;
        }

        if (list.childElementCount === 0) {
            this.addPageLinks();
        }
    }

    disconnectedCallback() {
        const root = this.shadowRoot;
        if (!root) {
            return;
        }

        const list = root.querySelector('ol');
        if (list) {
            list.replaceChildren();
        }
    }

    attributeChangedCallback(name: string, oldValue: string | null | undefined, newValue: string | null | undefined) {
        if (newValue == oldValue) {
            return;
        }

        if (name === 'value') {
            this.setValue(newValue);
        } else if (name === 'data-max-pages'
            || name === 'data-links') {
            this.addPageLinks();
        } else if (name === 'data-page-count') {
            if (newValue == null) {
                this.setPageCount(null);
            } else {
                const value = parseInt(newValue);
                this.setPageCount(Number.isFinite(value) && value > 0
                    ? value
                    : null);
            }
        }
    }

    formDisabledCallback(disabled: boolean) {
        const root = this.shadowRoot;
        if (!root) {
            return;
        }

        const nav = root.querySelector('nav');
        if (nav) {
            nav.inert = disabled;
        }
    }

    formResetCallback() { this.reset(); }

    formStateRestoreCallback(state: string | File | FormData | null, _mode: 'restore' | 'autocomplete') {
        if (typeof state === 'string') {
            this.value = state;
        } else if (state == null) {
            this.setValue(null);
        }
    }

    checkValidity() { return this._internals.checkValidity(); }

    reportValidity() { return this._internals.reportValidity(); }

    reset() { this.setValue(this._initialValue); }

    private addPageLinks() {
        const root = this.shadowRoot;
        if (!root) {
            return;
        }

        const list = root.querySelector('ol');
        if (!list) {
            return;
        }

        const links = 'links' in this.dataset;

        const nodes: Node[] = [];

        const first = document.createElement('li');
        let control: HTMLElement;
        if (links && this._currentPage > 1) {
            const link = document.createElement('a');
            control = link;
            link.classList.add('btn', 'btn-icon');
            const url = new URL(location.href);
            const params = new URLSearchParams(url.search);
            params.set(`${this.id}-p`, '1');
            url.search = `?${params.toString()}`;
            link.href = url.toString();
            first.appendChild(link);
        } else {
            const button = document.createElement('button');
            button.classList.add('btn-icon');
            button.disabled = this._currentPage <= 1;
            control = button;
            if (this._currentPage > 1) {
                button.addEventListener('click', this.setCurrentPage.bind(this, 1));
            }
            first.appendChild(button);
        }

        const firstIcon = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
        control.appendChild(firstIcon);
        firstIcon.outerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px"><path d="M18.41 16.59L13.82 12l4.59-4.59L17 6l-6 6 6 6zM6 6h2v12H6z"/><path d="M24 24H0V0h24v24z" fill="none"/></svg>`;

        nodes.push(first);

        const previous = document.createElement('li');
        if (links && this._currentPage > 1) {
            const link = document.createElement('a');
            control = link;
            link.classList.add('btn', 'btn-icon');
            const url = new URL(location.href);
            const params = new URLSearchParams(url.search);
            params.set(`${this.id}-p`, (this._currentPage - 1).toFixed(0));
            url.search = `?${params.toString()}`;
            link.href = url.toString();
            previous.appendChild(link);
        } else {
            const button = document.createElement('button');
            button.classList.add('btn-icon');
            button.disabled = this._currentPage <= 1;
            control = button;
            if (this._currentPage > 1) {
                button.addEventListener('click', this.setCurrentPage.bind(this, this._currentPage - 1));
            }
            previous.appendChild(button);
        }

        const previousIcon = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
        control.appendChild(previousIcon);
        previousIcon.outerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px"><path d="M0 0h24v24H0z" fill="none"/><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>`;

        nodes.push(previous);

        let firstPage = 1, lastPage = this._pageCount || this._currentPage;
        const maxPages = parseInt(this.dataset.maxPages || '');
        if (maxPages) {
            var half = Math.floor(maxPages / 2);
            firstPage = half >= this._currentPage
                ? 1
                : this._currentPage - half;

            if (firstPage > 1
                && this._pageCount != null
                && this._currentPage + half > this._pageCount) {
                firstPage -= this._currentPage + half - this._pageCount;
            }

            firstPage = Math.max(firstPage, 1);

            if (this._pageCount != null) {
                lastPage = Math.min(
                    firstPage + maxPages - 1,
                    this._pageCount);
            }
        }

        if (firstPage > 1) {
            const ellipsis = document.createElement('li');
            ellipsis.innerHTML = '&hellip;';
            nodes.push(ellipsis);
        }

        for (let i = firstPage; i <= lastPage; i++) {
            const item = document.createElement('li');

            if (i === this._currentPage) {
                item.classList.add('active', 'btn', 'btn-text');
                item.textContent = i.toFixed(0);
            } else if (links) {
                const link = document.createElement('a');
                link.classList.add('active', 'btn', 'btn-text');
                const url = new URL(location.href);
                const params = new URLSearchParams(url.search);
                params.set(`${this.id}-p`, i.toFixed(0));
                url.search = `?${params.toString()}`;
                link.href = url.toString();
                link.textContent = i.toFixed(0);
                item.appendChild(link);
            } else {
                const button = document.createElement('button');
                button.classList.add('btn-text');
                button.textContent = i.toFixed(0);
                button.addEventListener('click', this.setCurrentPage.bind(this, i));
                item.appendChild(button);
            }

            nodes.push(item);
        }

        if (this._pageCount != null && lastPage < this._pageCount) {
            const ellipsis = document.createElement('li');
            ellipsis.innerHTML = '&hellip;';
            nodes.push(ellipsis);
        }

        const next = document.createElement('li');
        if (links
            && (this._pageCount == null
                || this._currentPage < this._pageCount)) {
            const link = document.createElement('a');
            control = link;
            link.classList.add('btn', 'btn-icon');
            const url = new URL(location.href);
            const params = new URLSearchParams(url.search);
            params.set(`${this.id}-p`, (this._currentPage + 1).toFixed(0));
            url.search = `?${params.toString()}`;
            link.href = url.toString();
            next.appendChild(link);
        } else {
            const button = document.createElement('button');
            button.classList.add('btn-icon');
            button.disabled = this._pageCount != null
                && this._currentPage >= this._pageCount;
            control = button;
            if (this._pageCount == null
                || this._currentPage <= this._pageCount) {
                button.addEventListener('click', this.onNextPage.bind(this));
            }
            next.appendChild(button);
        }

        const nextIcon = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
        control.appendChild(nextIcon);
        nextIcon.outerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px"><path d="M0 0h24v24H0z" fill="none"/><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>`;

        nodes.push(next);

        const last = document.createElement('li');
        if (links
            && (this._pageCount == null
                || this._currentPage < this._pageCount)) {
            const link = document.createElement('a');
            control = link;
            link.classList.add('btn', 'btn-icon');
            const url = new URL(location.href);
            const params = new URLSearchParams(url.search);
            params.set(`${this.id}-p`, (this._currentPage + 1).toFixed(0));
            url.search = `?${params.toString()}`;
            link.href = url.toString();
            last.appendChild(link);
        } else {
            const button = document.createElement('button');
            button.classList.add('btn-icon');
            button.disabled = this._pageCount != null
                && this._currentPage >= this._pageCount;
            control = button;
            if (this._pageCount != null
                && this._currentPage < this._pageCount) {
                button.addEventListener('click', this.setCurrentPage.bind(this, this._pageCount));
            }
            last.appendChild(button);
        }

        const lastIcon = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
        control.appendChild(lastIcon);
        lastIcon.outerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px"><path d="M0 0h24v24H0z" fill="none"/><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>`;

        nodes.push(last);

        list.replaceChildren(...nodes);
    }

    private onNextPage(event: Event) {
        event.preventDefault();
        event.stopPropagation();

        if (this._pageCount != null) {
            this.setCurrentPage(Math.max(1, Math.min(this._pageCount, this._currentPage + 1)));
        } else {
            this.dispatchEvent(TavenemPaginationHtmlElement.newNextPageEvent());
        }
    }

    private setCurrentPage(value: number, event?: Event | null) {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }

        if (!Number.isFinite(value)
            || value < 1) {
            return;
        }

        if (this._pageCount != null) {
            value = Math.max(1, Math.min(value, this._pageCount));
        }

        this._currentPage = value;
        this._value = this._currentPage.toFixed(0);
        this._internals.setFormValue(this._value);

        this.addPageLinks();

        this.dispatchEvent(TavenemPaginationHtmlElement.newValueChangeEvent(this._value));
    }

    private setPageCount(value: number | null | undefined) {
        this._pageCount = value != null
            && Number.isFinite(value)
            && value > 0
            ? value
            : null;

        if (this._pageCount != null
            && this._currentPage > this._pageCount) {
            this.setCurrentPage(Math.max(1, this._pageCount));
        } else {
            this.addPageLinks();
        }
    }

    private setValue(value: string | null | undefined) {
        const v = parseInt(value || '');
        if (Number.isFinite(v) && v > 0) {
            this.setCurrentPage(v);
        }
    }
}