class ElementReference {
    constructor() {
        this.eventListeners = {};
        this.listenerId = 0;
    }
    addEventListener(element, dotNetRef, event, callback, spec, stopPropagation) {
        const listener = function (e) {
            const args = Array.from(spec, x => serializeParameter(e, x));
            dotNetRef.invokeMethodAsync(callback, ...args);
            if (stopPropagation) {
                e.stopPropagation();
            }
        };
        element.addEventListener(event, listener);
        this.eventListeners[++this.listenerId] = listener;
        return this.listenerId;
    }
    changeCssClassName(element, className) {
        if (element) {
            element.className = className;
        }
    }
    changeCssVariable(element, name, newValue) {
        if (element) {
            element.style.setProperty(name, newValue);
        }
    }
    focus(element) {
        if (element) {
            element.focus();
        }
    }
    focusFirst(element, skip = 0, min = 0) {
        if (element) {
            const tabbables = getTabbableElements(element);
            if (tabbables.length <= min) {
                element.focus();
            }
            else {
                const tabbable = tabbables[skip];
                if (tabbable instanceof HTMLElement) {
                    tabbable.focus();
                }
            }
        }
    }
    focusLast(element, skip = 0, min = 0) {
        if (element) {
            const tabbables = getTabbableElements(element);
            if (tabbables.length <= min) {
                element.focus();
            }
            else {
                const tabbable = tabbables[tabbables.length - skip - 1];
                if (tabbable instanceof HTMLElement) {
                    tabbable.focus();
                }
            }
        }
    }
    getBoundingClientRect(element) {
        if (!element) {
            return;
        }
        const rect = JSON.parse(JSON.stringify(element.getBoundingClientRect()));
        rect.scrollY = window.scrollY || document.documentElement.scrollTop;
        rect.scrollX = window.scrollX || document.documentElement.scrollLeft;
        rect.windowHeight = window.innerHeight;
        rect.windowWidth = window.innerWidth;
        return rect;
    }
    getClientRectFromFirstChild(element) {
        if (!element) {
            return;
        }
        const child = element.children && element.children[0];
        if (!child || !(child instanceof HTMLElement)) {
            return;
        }
        return this.getBoundingClientRect(child);
    }
    getClientRectFromParent(element) {
        if (!element) {
            return;
        }
        const parent = element.parentElement;
        if (!parent) {
            return;
        }
        return this.getBoundingClientRect(parent);
    }
    getTextContent(element) {
        if (!element) {
            return '';
        }
        return element.textContent;
    }
    hasFixedAncestors(element) {
        for (; element && element instanceof Element; element = element.parentNode) {
            if (window.getComputedStyle(element).getPropertyValue("position") === "fixed") {
                return true;
            }
        }
        return false;
    }
    removeEventListener(element, event, eventId) {
        if (!element) {
            return;
        }
        element.removeEventListener(event, this.eventListeners[eventId]);
        delete this.eventListeners[eventId];
    }
    removeEventListenerById(elementId, event, eventId) {
        const element = document.getElementById(elementId);
        if (element) {
            this.removeEventListener(element, event, eventId);
        }
    }
    restoreFocus(element) {
        if (element) {
            let previous = element.savedFocus;
            delete element.savedFocus;
            if (previous) {
                previous.focus();
            }
        }
    }
    saveFocus(element) {
        if (element && document.activeElement instanceof HTMLElement) {
            element.savedFocus = document.activeElement;
        }
    }
    select(element) {
        if (element) {
            element.select();
        }
    }
    selectRange(element, pos1, pos2) {
        if (element) {
            if (element.setSelectionRange) {
                element.setSelectionRange(pos1, pos2);
            }
            else if (element.selectionStart) {
                element.selectionStart = pos1;
                element.selectionEnd = pos2;
            }
            element.focus();
        }
    }
}
const elementReference = new ElementReference();
let notifyOutsideEventRef;
export function addEventListener(element, dotNetRef, event, callback, spec, stopPropagation) {
    return elementReference.addEventListener(element, dotNetRef, event, callback, spec, stopPropagation);
}
export function cancelOutsideEvent() {
    if (notifyOutsideEventRef) {
        window.removeEventListener('click', notifyOutsideEventRef);
        window.removeEventListener('contextmenu', notifyOutsideEventRef);
        notifyOutsideEventRef = null;
    }
}
export function changeCssClassName(element, className) {
    elementReference.changeCssClassName(element, className);
}
export function changeCssVariable(element, name, newValue) {
    elementReference.changeCssVariable(element, name, newValue);
}
export function focusFirstElement(element, skip = 0, min = 0) {
    elementReference.focusFirst(element, skip, min);
}
export function focusLastElement(element, skip = 0, min = 0) {
    elementReference.focusLast(element, skip, min);
}
export function getBoundingClientRect(element) {
    return elementReference.getBoundingClientRect(element);
}
export function getClientRectFromFirstChild(element) {
    return elementReference.getClientRectFromFirstChild(element);
}
export function getClientRectFromParent(element) {
    return elementReference.getClientRectFromParent(element);
}
export function getTextContent(element) {
    return elementReference.getTextContent(element);
}
export function elementHasFixedAncestors(element) {
    return elementReference.hasFixedAncestors(element);
}
export function notifyOutsideEvent(dotNetRef, elementId) {
    setTimeout(() => {
        if (notifyOutsideEventRef) {
            cancelOutsideEvent();
        }
        notifyOutsideEventRef = onNotifyOutsideEvent.bind(this, dotNetRef, elementId);
        window.addEventListener('click', notifyOutsideEventRef);
        window.addEventListener('contextmenu', notifyOutsideEventRef);
    }, 250);
}
export function open(url, target, features) {
    window.open(url, target, features);
}
export function registerComponents() {
    customElements.define('tf-icon', class extends HTMLElement {
    });
    customElements.define('tf-close', class extends HTMLElement {
        constructor() {
            super();
            this.attachShadow({ mode: 'open' })
                .textContent = "close";
        }
    });
    customElements.define('tf-progress-circle', class extends HTMLElement {
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
        attributeChangedCallback(name, oldValue, newValue) {
            if (name === 'progress') {
                if (newValue) {
                    this.setProgress(Number.parseFloat(newValue));
                }
                else {
                    this.setIndeterminate(true);
                }
            }
        }
        setIndeterminate(value) {
            const div = this._root.querySelector('.progress-container');
            if (div) {
                if (value) {
                    div.setAttribute('indeterminate', 'true');
                    div.removeAttribute('aria-valuenow');
                }
                else {
                    div.removeAttribute('indeterminate');
                }
            }
        }
        setProgress(percent) {
            if (!Number.isFinite(percent)) {
                this.setIndeterminate(true);
                return;
            }
            this.setIndeterminate(false);
            percent = Math.max(0, Math.min(100, percent));
            const offset = this._circumference - (percent / 100 * this._circumference);
            const value = offset.toFixed(2);
            const circle = this._root.querySelector('.progress-container svg:first-child circle');
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
        attributeChangedCallback(name, oldValue, newValue) {
            if (name === 'progress') {
                if (newValue) {
                    this.setProgress(Number.parseFloat(newValue));
                }
                else {
                    this.setIndeterminate(true);
                }
            }
        }
        setIndeterminate(value) {
            const div = this._root.querySelector('div');
            if (div) {
                if (value) {
                    div.setAttribute('indeterminate', 'true');
                    div.removeAttribute('aria-valuenow');
                }
                else {
                    div.removeAttribute('indeterminate');
                }
            }
        }
        setProgress(percent) {
            if (!Number.isFinite(percent)) {
                this.setIndeterminate(true);
                return;
            }
            this.setIndeterminate(false);
            percent = Math.max(0, Math.min(100, percent));
            percent = +percent.toFixed(0);
            const bar = this._root.querySelector('.progress-bar');
            if (bar) {
                bar.setAttribute('aria-valuenow', `${percent}`);
                bar.style.setProperty('--progress-percent', `${percent}`);
            }
        }
    });
}
export function removeEventListener(element, event, eventId) {
    elementReference.removeEventListener(element, event, eventId);
}
export function removeEventListenerById(elementId, event, eventId) {
    elementReference.removeEventListenerById(elementId, event, eventId);
}
export function restoreElementFocus(element) {
    elementReference.restoreFocus(element);
}
export function saveElementFocus(element) {
    elementReference.saveFocus(element);
}
export function select(element) {
    elementReference.select(element);
}
export function selectRange(element, pos1, pos2) {
    elementReference.selectRange(element, pos1, pos2);
}
export function shake(elementId) {
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
function getTabbableElements(element) {
    return element.querySelectorAll("a[href]:not([tabindex='-1'])," +
        "area[href]:not([tabindex='-1'])," +
        "button:not([disabled]):not([tabindex='-1'])," +
        "input:not([disabled]):not([tabindex='-1']):not([type='hidden'])," +
        "select:not([disabled]):not([tabindex='-1'])," +
        "textarea:not([disabled]):not([tabindex='-1'])," +
        "iframe:not([tabindex='-1'])," +
        "details:not([tabindex='-1'])," +
        "[tabindex]:not([tabindex='-1'])," +
        "[contentEditable=true]:not([tabindex='-1']");
}
function onNotifyOutsideEvent(dotNetRef, elementId, event) {
    const element = document.getElementById(elementId);
    if (element instanceof HTMLElement
        && event.target instanceof HTMLElement
        && !element.contains(event.target)) {
        dotNetRef.invokeMethodAsync("OutsideEventNotice");
        if (notifyOutsideEventRef) {
            window.removeEventListener('click', notifyOutsideEventRef);
            window.removeEventListener('contextmenu', notifyOutsideEventRef);
        }
    }
}
function serializeParameter(data, spec) {
    if (typeof data == "undefined" ||
        data === null) {
        return null;
    }
    if (typeof data === "number" ||
        typeof data === "string" ||
        typeof data == "boolean") {
        return data;
    }
    let res = (Array.isArray(data)) ? [] : {};
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
        }
        else {
            currentMemberSpec = "*";
        }
        if (typeof currentMember === 'object') {
            if (Array.isArray(currentMember) || currentMember.length) {
                res[i] = [];
                for (let j = 0; j < currentMember.length; j++) {
                    const arrayItem = currentMember[j];
                    if (typeof arrayItem === 'object') {
                        res[i].push(serializeParameter(arrayItem, currentMemberSpec));
                    }
                    else {
                        res[i].push(arrayItem);
                    }
                }
            }
            else {
                if (currentMember.length === 0) {
                    res[i] = [];
                }
                else {
                    res[i] = serializeParameter(currentMember, currentMemberSpec);
                }
            }
        }
        else {
            if (currentMember === Infinity) {
                currentMember = "Infinity";
            }
            if (currentMember !== null) {
                res[i] = currentMember;
            }
        }
    }
    return res;
}
//# sourceMappingURL=tavenem-utility.js.map