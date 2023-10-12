export class TavenemProgressCircleHTMLElement extends HTMLElement {
    _circumference: number;

    static get observedAttributes() {
        return ['progress'];
    }

    constructor() {
        super();

        this._circumference = 0;
    }

    connectedCallback() {
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

        const shadow = this.attachShadow({ mode: 'open' });

        const style = document.createElement('style');
        style.textContent = `
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
    `;
        shadow.appendChild(style);

        const div = document.createElement('div');
        div.outerHTML = `<div class="progress-container"${indeterminate ? ' indeterminate' : ''}
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
</div>`;
        shadow.appendChild(div);

        const slot = document.createElement('slot');
        slot.outerHTML = '<slot name="label"></slot>';
        shadow.appendChild(slot);
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
        if (!this.shadowRoot) {
            return;
        }
        const div = this.shadowRoot.querySelector('.progress-container');
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
        if (!this.shadowRoot) {
            return;
        }

        if (!Number.isFinite(percent)) {
            this.setIndeterminate(true);
            return;
        }
        this.setIndeterminate(false);

        percent = Math.max(0, Math.min(100, percent));

        const offset = this._circumference - (percent / 100 * this._circumference);
        const value = offset.toFixed(2);

        const circle = this.shadowRoot.querySelector('.progress-container svg:first-child circle') as SVGCircleElement;
        if (circle) {
            circle.style.strokeDashoffset = value;
        }

        const div = this.shadowRoot.querySelector('.progress-container');
        if (div) {
            div.setAttribute('aria-valuenow', value);
        }
    }
}

export class TavenemProgressLinearHTMLElement extends HTMLElement {
    _vertical: boolean;

    static get observedAttributes() {
        return ['progress'];
    }

    constructor() {
        super();

        this._vertical = false;
    }

    connectedCallback() {
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

        const shadow = this.attachShadow({ mode: 'open' });

        const style = document.createElement('style');
        style.textContent = `
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
    `;
        shadow.appendChild(style);

        const div = document.createElement('div');
        div.outerHTML = `<div class="progress-bar${this._vertical ? ' vertical' : ''}"${indeterminate ? ' indeterminate' : ''}
     role="progressbar"
     aria-valuemin="0"
     aria-valuemax="100"
     ${indeterminate ? '' : 'aria-valuenow="' + progressValue + '"'}>
</div>`;
        shadow.appendChild(div);

        const slot = document.createElement('slot');
        slot.outerHTML = '<slot name="label"></slot>';
        shadow.appendChild(slot);

        this.setProgress(progressValue);
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
        if (!this.shadowRoot) {
            return;
        }

        const div = this.shadowRoot.querySelector('div');
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
        if (!this.shadowRoot) {
            return;
        }

        if (!Number.isFinite(percent)) {
            this.setIndeterminate(true);
            return;
        }
        this.setIndeterminate(false);

        percent = Math.max(0, Math.min(100, percent));
        percent = +percent.toFixed(0);

        const bar = this.shadowRoot.querySelector('.progress-bar') as HTMLDivElement;
        if (bar) {
            bar.setAttribute('aria-valuenow', `${percent}`);
            bar.style.setProperty('--progress-percent', `${percent}`);
        }
    }
}