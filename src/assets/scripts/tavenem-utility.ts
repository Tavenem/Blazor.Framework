/// <reference types="./../node_modules/@types/blazor__javascript-interop" />

interface IFocusableElement extends HTMLElement {
    savedFocus?: IFocusableElement | undefined | null;
}

interface IBoundingClientRect extends DOMRect {
    scrollY: number;
    scrollX: number;
    windowHeight: number;
    windowWidth: number;
}

interface DotNetStreamReference {
    arrayBuffer(): Promise<ArrayBuffer>;
}

const eventListeners: Record<number, EventListener> = {};
const fonts = [
    'Arial',
    'Arial Black',
    'Comic Sans MS',
    'Courier New',
    'Georgia',
    'Impact',
    'Microsoft Sans Serif',
    'Tahoma',
    'Times New Roman',
    'Trebuchet MS',
    'Verdana',
];

let listenerId = 0;

export function addEventListener(
    element: Element,
    dotNetRef: DotNet.DotNetObject,
    event: string,
    callback: string,
    spec: Record<string, any>[],
    stopPropagation: boolean) {
    const listener = function (e: Event) {
        const args = Array.from(spec, x => serializeParameter(e, x));
        dotNetRef.invokeMethodAsync(callback, ...args);
        if (stopPropagation) {
            e.stopPropagation();
        }
    };
    element.addEventListener(event, listener);
    eventListeners[++listenerId] = listener;
    return listenerId;
}

export function changeCssClassName(element: Element, className: string) {
    if (element) {
        element.className = className;
    }
}

export function changeCssVariable(element: HTMLElement, name: string, newValue: string) {
    if (element) {
        element.style.setProperty(name, newValue);
    }
}

export async function downloadStream(fileName: string, fileType: string, streamReference: DotNetStreamReference) {
    const buffer = await streamReference.arrayBuffer();
    const file = new File([buffer], fileName, { type: fileType });
    const url = URL.createObjectURL(file);
    downloadUrl(fileName, url);
    URL.revokeObjectURL(url);
}

export function downloadUrl(fileName: string, url: string, open?: boolean) {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.target = "_blank";
    if (!open) {
        anchor.download = fileName ?? '';
    }
    anchor.click();
    anchor.remove();
}

export function elementHasFixedAncestors(element: Node | null) {
    for (; element && element instanceof Element; element = element.parentNode) {
        if (window.getComputedStyle(element).getPropertyValue("position") === "fixed") {
            return true;
        }
    }
    return false;
}

export function focusFirstElement(element: HTMLElement, skip = 0, min = 0) {
    if (element) {
        const tabbables = getTabbableElements(element);
        if (tabbables.length <= min) {
            element.focus();
        } else {
            const tabbable = tabbables[skip];
            if (tabbable instanceof HTMLElement) {
                tabbable.focus();
            }
        }
    }
}

export function focusLastElement(element: HTMLElement, skip = 0, min = 0) {
    if (element) {
        const tabbables = getTabbableElements(element);
        if (tabbables.length <= min) {
            element.focus();
        } else {
            const tabbable = tabbables[tabbables.length - skip - 1];
            if (tabbable instanceof HTMLElement) {
                tabbable.focus();
            }
        }
    }
}

export function getBoundingClientRect(element: HTMLElement) {
    if (!element) {
        return;
    }

    const rect: IBoundingClientRect = JSON.parse(JSON.stringify(element.getBoundingClientRect()));

    rect.scrollY = window.scrollY || document.documentElement.scrollTop;
    rect.scrollX = window.scrollX || document.documentElement.scrollLeft;

    rect.windowHeight = window.innerHeight;
    rect.windowWidth = window.innerWidth;
    return rect;
}

export function getClientRectFromFirstChild(element: HTMLElement) {
    if (!element) {
        return;
    }
    const child = element.children && element.children[0];
    if (!child || !(child instanceof HTMLElement)) {
        return;
    }
    return getBoundingClientRect(child);
}

export function getClientRectFromParent(element: HTMLElement) {
    if (!element) {
        return;
    }
    const parent = element.parentElement;
    if (!parent) {
        return;
    }
    return getBoundingClientRect(parent);
}

export function getFonts() {
    const validFonts: string[] = [];
    for (const font of fonts) {
        if (document.fonts.check('1em ' + font)) {
            validFonts.push(font);
        }
    }
    return validFonts;
}

export function getTextContent(element: HTMLElement) {
    if (!element) {
        return '';
    }
    return element.textContent;
}

export function open(url?: string, target?: string, features?: string) {
    window.open(url, target, features);
}

export async function openStream(fileName: string, fileType: string, streamReference: DotNetStreamReference, revoke: boolean) {
    const buffer = await streamReference.arrayBuffer();
    const file = new File([buffer], fileName, { type: fileType });
    const url = URL.createObjectURL(file);
    downloadUrl(fileName, url, true);
    if (revoke) {
        URL.revokeObjectURL(url);
        return '';
    } else {
        return url;
    }
}

export function registerComponents() {
    const icon = customElements.get('tf-icon');
    if (icon) {
        return;
    }

    customElements.define('tf-icon', class extends HTMLElement { });

    customElements.define('tf-close', class extends HTMLElement {
        constructor() {
            super();

            this.attachShadow({ mode: 'open' })
                .textContent = "close";
        }
    });

    customElements.define('tf-progress-circle', class extends HTMLElement {
        _circumference: number;
        _root: ShadowRoot;

        constructor() {
            super();

            const stroke = this.getAttribute('stroke') || '5';
            let strokeValue = stroke ? Number.parseFloat(stroke) : Number.NaN;
            if (!Number.isFinite(strokeValue)) {
                strokeValue = 3;
            }
            strokeValue = Math.max(1, Math.min(30, strokeValue));

            const progress = this.getAttribute('progress');
            let progressValue = progress ? Number.parseFloat(progress) : Number.NaN;
            if (!Number.isFinite(progressValue)) {
                progressValue = Number.NaN;
            }
            const indeterminate = !Number.isFinite(progressValue);
            progressValue = Math.max(0, Math.min(100, progressValue));

            const radius = +(20 - (strokeValue / 2)).toFixed(2);
            this._circumference = +(radius * 2 * Math.PI).toFixed(2);

            const delay = Math.random() * 1.4;

            this._root = this.attachShadow({ mode: 'open' });
            this._root.innerHTML = `<div class="progress-container"${indeterminate ? ' indeterminate' : ''}
     role="progressbar"
     aria-valuemin="0"
     aria-valuemax="100"
     ${indeterminate ? '' : 'aria-valuenow="' + progressValue + '"'}>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
        <circle cx="20"
                cy="20"
                r="${radius}"
                fill="none"
                stroke="var(--progress-color)"
                stroke-width="${stroke}"
                style="stroke-dasharray:${this._circumference} ${this._circumference};stroke-dashoffset:${this._circumference}" />
    </svg>
</div>
<slot name="label"></slot>

<style>
    @keyframes tf-progress-rotate {
        to {
            transform: rotate(360deg);
        }
    }

    @keyframes tf-progress-dash {
        0% {
            stroke-dasharray: 1px, 200px;
            stroke-dashoffset: 0px;
        }

        50% {
            stroke-dasharray: 100px, 200px;
            stroke-dashoffset: -15px;
        }

        100% {
            stroke-dasharray: 100px, 200px;
            stroke-dashoffset: -${this._circumference - 1}px;
        }
    }

    .progress-container {
        height: 100%;
        left: 0;
        position: absolute;
        top: 0;
        width: 100%;
    }

    .progress-container:not([indeterminate]) {
        transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
    }

    .progress-container[indeterminate] {
        animation: tf-progress-rotate 1.4s linear infinite;
        animation-delay: -${delay}s;
    }

    svg:first-child {
        height: 100%;
        left: 0;
        position: absolute;
        top: 0;
        width: 100%;
    }

    svg:first-child circle {
        transform-origin: 50% 50%;
    }

    .progress-container:not([indeterminate]) svg:first-child circle {
        transform: rotate(-90deg);
        transition: stroke-dashoffset 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
    }

    .progress-container[indeterminate] svg:first-child circle {
        animation: tf-progress-dash 1.4s ease-in-out infinite;
        animation-delay: -${delay}s;
        stroke-dasharray: 80px, 200px;
        stroke-dashoffset: 0px;
    }

    ::slotted(*) {
        z-index: 1;
    }
</style>`;
        }

        static get observedAttributes() {
            return ['progress'];
        }

        attributeChangedCallback(name: string, oldValue: string | null | undefined, newValue: string | null | undefined) {
            if (name === 'progress') {
                if (newValue) {
                    this.setProgress(Number.parseFloat(newValue));
                } else {
                    this.setIndeterminate(true);
                }
            }
        }

        setIndeterminate(value: boolean) {
            const div = this._root.querySelector('.progress-container');
            if (div) {
                if (value) {
                    div.setAttribute('indeterminate', 'true');
                    div.removeAttribute('aria-valuenow');
                } else {
                    div.removeAttribute('indeterminate');
                }
            }
        }

        setProgress(percent: number) {
            if (!Number.isFinite(percent)) {
                this.setIndeterminate(true);
                return;
            }
            this.setIndeterminate(false);

            percent = Math.max(0, Math.min(100, percent));

            const offset = this._circumference - (percent / 100 * this._circumference);
            const value = offset.toFixed(2);

            const circle = this._root.querySelector('.progress-container svg:first-child circle') as SVGCircleElement;
            if (circle) {
                circle.style.strokeDashoffset = value;
            }

            const div = this._root.querySelector('.progress-container');
            if (div) {
                div.setAttribute('aria-valuenow', value);
            }
        }
    });

    customElements.define('tf-progress-linear', class extends HTMLElement {
        _root: ShadowRoot;
        _vertical: boolean;

        constructor() {
            super();

            const progress = this.getAttribute('progress');
            let progressValue = progress ? Number.parseFloat(progress) : Number.NaN;
            if (!Number.isFinite(progressValue)) {
                progressValue = Number.NaN;
            }

            const indeterminate = !Number.isFinite(progressValue);
            progressValue = Math.max(0, Math.min(100, progressValue));

            const vertical = this.getAttribute('vertical');
            this._vertical = vertical != null && vertical !== "false";

            const delay = Math.random() * 2.1;

            this._root = this.attachShadow({ mode: 'open' });
            this._root.innerHTML = `<div class="progress-bar${this._vertical ? ' vertical' : ''}"${indeterminate ? ' indeterminate' : ''}
     role="progressbar"
     aria-valuemin="0"
     aria-valuemax="100"
     ${indeterminate ? '' : 'aria-valuenow="' + progressValue + '"'}>
</div>
<slot name="label"></slot>

<style>
    @keyframes tf-progress-indeterminate1 {
        0% {
            left: -35%;
            right: 100%;
        }

        60% {
            left: 100%;
            right: -90%;
        }

        100% {
            left: 100%;
            right: -90%;
        }
    }

    @keyframes tf-progress-indeterminate2 {
        0% {
            left: -200%;
            right: 100%;
        }

        60% {
            left: 107%;
            right: -8%;
        }

        100% {
            left: 107%;
            right: -8%;
        }
    }

    @keyframes tf-progress-vertical-indeterminate1 {
        0% {
            bottom: -35%;
            top: 100%;
        }

        60% {
            bottom: 100%;
            top: -90%;
        }

        100% {
            bottom: 100%;
            top: -90%;
        }
    }

    @keyframes tf-progress-vertical-indeterminate2 {
        0% {
            bottom: -200%;
            top: 100%;
        }

        60% {
            bottom: 107%;
            top: -8%;
        }

        100% {
            bottom: 107%;
            top: -8%;
        }
    }

    @keyframes tf-progress-gradient {
        0% {
            background-position: left bottom;
        }

        100% {
            background-position: right bottom;
        }
    }

    @keyframes tf-progress-gradient-vertical {
        0% {
            background-position: left bottom;
        }

        100% {
            background-position: left top;
        }
    }

    .progress-bar {
        background-color: var(--progress-background-color);
        height: 100%;
        left: 0;
        overflow: hidden;
        position: absolute;
        top: 0;
        width: 100%;
    }

    .progress-bar:before, .progress-bar:after {
        content: '';
        display: block;
        height: 100%;
        left: 0;
        position: absolute;
        top: 0;
        transition: transform 0.2s linear;
        transform-origin: left;
        width: auto;
    }

    .progress-bar:before {
        background-color: var(--progress-color);
    }

    .progress-bar[indeterminate]:before {
        animation: tf-progress-indeterminate1 2.1s cubic-bezier(0.65, 0.815, 0.735, 0.395) infinite;
        animation-delay: -${delay}s;
    }

    .progress-bar:not([indeterminate]):before, .progress-bar:not([indeterminate]):after {
        width: calc(1% * var(--progress-percent));
    }

    .progress-bar[indeterminate]:after {
        animation: tf-progress-indeterminate2 2.1s cubic-bezier(0.165, 0.84, 0.44, 1) 1.15s infinite;
        animation-delay: -${delay}s;
        background-color: var(--progress-color);
    }

    .progress-bar:not([indeterminate]):after {
        animation: tf-progress-gradient 1s linear infinite;
        animation-delay: -${delay}s;
        background: linear-gradient(to left, #ffffff05, #00000050 50%, #ffffff05 100%) repeat;
        background-size: 50% 100%;
    }

    .progress-bar.vertical:before, .progress-bar.vertical:after {
        height: auto;
        width: 100%;
    }

    .progress-bar[indeterminate].vertical:before {
        animation: tf-progress-vertical-indeterminate1 2.1s cubic-bezier(0.65, 0.815, 0.735, 0.395) infinite;
        animation-delay: -${delay}s;
    }

    .progress-bar[indeterminate].vertical:after {
        animation: tf-progress-vertical-indeterminate2 2.1s cubic-bezier(0.165, 0.84, 0.44, 1) 1.15s infinite;
        animation-delay: -${delay}s;
    }

    .progress-bar:not([indeterminate]).vertical:before, .progress-bar:not([indeterminate]).vertical:after {
        height: 100%;
        transform: translateY(calc(1% * (100 - var(--progress-percent))));
    }

    .progress-bar:not([indeterminate]).vertical:after {
        animation: tf-progress-gradient-vertical 1s linear infinite;
        animation-delay: -${delay}s;
        background: linear-gradient(to top, #ffffff05, #00000050 50%, #ffffff05 100%) repeat;
        background-size: 100% 50%;
    }

    ::slotted(*) {
        z-index: 1;
    }
</style>`;

            this.setProgress(progressValue);
        }

        static get observedAttributes() {
            return ['progress'];
        }

        attributeChangedCallback(name: string, oldValue: string | null | undefined, newValue: string | null | undefined) {
            if (name === 'progress') {
                if (newValue) {
                    this.setProgress(Number.parseFloat(newValue));
                } else {
                    this.setIndeterminate(true);
                }
            }
        }

        setIndeterminate(value: boolean) {
            const div = this._root.querySelector('div');
            if (div) {
                if (value) {
                    div.setAttribute('indeterminate', 'true');
                    div.removeAttribute('aria-valuenow');
                } else {
                    div.removeAttribute('indeterminate');
                }
            }
        }

        setProgress(percent: number) {
            if (!Number.isFinite(percent)) {
                this.setIndeterminate(true);
                return;
            }
            this.setIndeterminate(false);

            percent = Math.max(0, Math.min(100, percent));
            percent = +percent.toFixed(0);

            const bar = this._root.querySelector('.progress-bar') as HTMLDivElement;
            if (bar) {
                bar.setAttribute('aria-valuenow', `${percent}`);
                bar.style.setProperty('--progress-percent', `${percent}`);
            }
        }
    });
}

export function removeEventListener(element: Element, event: string, eventId: number) {
    if (!element) {
        return;
    }
    element.removeEventListener(event, eventListeners[eventId]);
    delete eventListeners[eventId];
}

export function removeEventListenerById(elementId: string, event: string, eventId: number) {
    const element = document.getElementById(elementId);
    if (element) {
        removeEventListener(element, event, eventId);
    }
}

export function restoreElementFocus(element: IFocusableElement) {
    if (element) {
        const previous = element.savedFocus;
        delete element.savedFocus;
        if (previous) {
            previous.focus();
        }
    }
}

export function revokeURL(url: string) {
    URL.revokeObjectURL(url);
}

export function saveElementFocus(element: IFocusableElement) {
    if (element && document.activeElement instanceof HTMLElement) {
        element.savedFocus = document.activeElement;
    }
}

export function select(element: HTMLInputElement) {
    if (element) {
        element.select();
    }
}

export function selectRange(element: HTMLInputElement, start: number, end: number | null) {
    if (element) {
        if (element.setSelectionRange) {
            element.setSelectionRange(start, end);
        } else if (element.selectionStart) {
            element.selectionStart = start;
            element.selectionEnd = end;
        }
        element.focus();
    }
}

export function shake(elementId: string | null) {
    if (!elementId) {
        return;
    }
    const element = document.getElementById(elementId);
    if (!element || element.classList.contains('shake')) {
        return;
    }

    element.classList.add('shake');
    setTimeout(() => element.classList.remove('shake'), 1000);
}

function getTabbableElements(element: HTMLElement) {
    return element.querySelectorAll(
        "a[href]:not([tabindex='-1'])," +
        "area[href]:not([tabindex='-1'])," +
        "button:not([disabled]):not([tabindex='-1'])," +
        "input:not([disabled]):not([tabindex='-1']):not([type='hidden'])," +
        "select:not([disabled]):not([tabindex='-1'])," +
        "textarea:not([disabled]):not([tabindex='-1'])," +
        "iframe:not([tabindex='-1'])," +
        "details:not([tabindex='-1'])," +
        "[tabindex]:not([tabindex='-1'])," +
        "[contentEditable=true]:not([tabindex='-1']"
    );
}

function serializeParameter(data: any, spec: any) {
    if (typeof data == "undefined" ||
        data === null) {
        return null;
    }
    if (typeof data === "number" ||
        typeof data === "string" ||
        typeof data == "boolean") {
        return data;
    }

    let res: any = (Array.isArray(data)) ? [] : {};
    if (!spec) {
        spec = "*";
    }

    for (let i in data) {
        let currentMember = data[i];

        if (typeof currentMember === 'function' || currentMember === null) {
            continue;
        }

        let currentMemberSpec;
        if (spec != "*") {
            currentMemberSpec = Array.isArray(data) ? spec : spec[i];
            if (!currentMemberSpec) {
                continue;
            }
        } else {
            currentMemberSpec = "*"
        }

        if (typeof currentMember === 'object') {
            if (Array.isArray(currentMember) || currentMember.length) {
                res[i] = [];
                for (let j = 0; j < currentMember.length; j++) {
                    const arrayItem = currentMember[j];
                    if (typeof arrayItem === 'object') {
                        res[i].push(serializeParameter(arrayItem, currentMemberSpec));
                    } else {
                        res[i].push(arrayItem);
                    }
                }
            } else {
                //the browser provides some member (like plugins) as hash with index as key, if length == 0 we shall not convert it
                if (currentMember.length === 0) {
                    res[i] = [];
                } else {
                    res[i] = serializeParameter(currentMember, currentMemberSpec);
                }
            }


        } else {
            // string, number or boolean
            if (currentMember === Infinity) { //inifity is not serialized by JSON.stringify
                currentMember = "Infinity";
            }
            if (currentMember !== null) { //needed because the default json serializer in jsinterop serialize null values
                res[i] = currentMember;
            }
        }
    }

    return res;
}
