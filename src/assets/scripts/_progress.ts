export class TavenemProgressCircleHTMLElement extends HTMLElement {
    private _circumference: number;

    static get observedAttributes() {
        return ['progress'];
    }

    constructor() {
        super();

        this._circumference = 0;
    }

    connectedCallback() {
        const stroke = this.dataset.stroke || '5';
        let strokeValue = stroke ? Number.parseFloat(stroke) : Number.NaN;
        if (!Number.isFinite(strokeValue)) {
            strokeValue = 3;
        }
        strokeValue = Math.max(1, Math.min(30, strokeValue));

        const progress = this.dataset.progress;
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
    
:host {
    --progress-color: var(--tavenem-color-action);
    align-items: center;
    display: inline-flex;
    height: 2.5rem;
    justify-content: center;
    position: relative;
    width: 2.5rem;
}

:host(.small) {
    height: 1.5rem;
    width: 1.5rem;
}

:host(.large) {
    height: 3.5rem;
    width: 3.5rem;
}

.progress-container {
    height: 100%;
    left: 0;
    position: absolute;
    top: 0;
    width: 100%;
}

.progress-container:not([data-indeterminate]) {
    transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
}

.progress-container[data-indeterminate] {
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

.progress-container:not([data-indeterminate]) svg:first-child circle {
    transform: rotate(-90deg);
    transition: stroke-dashoffset 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
}

.progress-container[data-indeterminate] svg:first-child circle {
    animation: tf-progress-dash 1.4s ease-in-out infinite;
    animation-delay: -${delay}s;
    stroke-dasharray: 80px, 200px;
    stroke-dashoffset: 0px;
}

:host(.primary),
:host(.secondary),
:host(.tertiary),
:host(.danger),
:host(.dark),
:host(.default),
:host(.info),
:host(.success),
:host(.warning) {
    --progress-color: var(--tavenem-theme-color);
}

::slotted(*) {
    z-index: 1;
}`;
        shadow.appendChild(style);

        const div = document.createElement('div');
        div.classList.add('progress-container');
        div.role = "progressbar";
        div.ariaValueMin = '0';
        div.ariaValueMax = '100';
        if (indeterminate) {
            div.dataset.indeterminate = '';
        } else {
            div.ariaValueNow = progressValue.toString();
        }
        div.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
    <circle cx="20"
            cy="20"
            r="${radius}"
            fill="none"
            stroke="var(--progress-color)"
            stroke-width="${stroke}"
            style="stroke-dasharray:${this._circumference} ${this._circumference};stroke-dashoffset:${this._circumference}" />
</svg>`;
        shadow.appendChild(div);

        const slot = document.createElement('slot');
        slot.name = "label";
        shadow.appendChild(slot);
    }

    attributeChangedCallback(name: string, oldValue: string | null | undefined, newValue: string | null | undefined) {
        if (newValue == oldValue) {
            return;
        }

        if (name === 'progress') {
            if (newValue) {
                this.setProgress(Number.parseFloat(newValue));
            } else {
                this.setIndeterminate(true);
            }
        }
    }

    private setIndeterminate(value: boolean) {
        if (!this.shadowRoot) {
            return;
        }
        const div = this.shadowRoot.querySelector('.progress-container');
        if (div) {
            if (value) {
                div.setAttribute('data-indeterminate', 'true');
                div.removeAttribute('aria-valuenow');
            } else {
                div.removeAttribute('data-indeterminate');
            }
        }
    }

    private setProgress(percent: number) {
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
    static get observedAttributes() {
        return ['progress'];
    }

    connectedCallback() {
        const progress = this.dataset.progress;
        let progressValue = progress ? Number.parseFloat(progress) : Number.NaN;
        if (!Number.isFinite(progressValue)) {
            progressValue = Number.NaN;
        }

        const indeterminate = !Number.isFinite(progressValue);
        progressValue = Math.max(0, Math.min(100, progressValue));

        const vertical = 'vertical' in this.dataset;

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

    :host {
        --progress-background-color: var(--tavenem-color-action-hover-bg);
        --progress-color: var(--tavenem-color-action);
        align-items: center;
        display: inline-flex;
        height: .5rem;
        justify-content: center;
        position: relative;
        width: 100%;
    }

    :host(.small):not([data-vertical]) {
        height: .25rem;
    }

    :host(.large):not([data-vertical]) {
        height: .75rem;
    }

    :host([data-vertical]) {
        height: 100%;
        width: .5rem;
    }

    :host([data-vertical].small) {
        width: .25rem;
    }

    :host([data-vertical].large) {
        width: .75rem;
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

    .progress-bar[data-indeterminate]:before {
        animation: tf-progress-indeterminate1 2.1s cubic-bezier(0.65, 0.815, 0.735, 0.395) infinite;
        animation-delay: -${delay}s;
    }

    .progress-bar:not([data-indeterminate]):before, .progress-bar:not([data-indeterminate]):after {
        width: calc(1% * var(--progress-percent));
    }

    .progress-bar[data-indeterminate]:after {
        animation: tf-progress-indeterminate2 2.1s cubic-bezier(0.165, 0.84, 0.44, 1) 1.15s infinite;
        animation-delay: -${delay}s;
        background-color: var(--progress-color);
    }

    .progress-bar:not([data-indeterminate]):after {
        animation: tf-progress-gradient 1s linear infinite;
        animation-delay: -${delay}s;
        background: linear-gradient(to left, #ffffff05, #00000050 50%, #ffffff05 100%) repeat;
        background-size: 50% 100%;
    }

    .progress-bar.vertical:before, .progress-bar.vertical:after {
        height: auto;
        width: 100%;
    }

    .progress-bar[data-indeterminate].vertical:before {
        animation: tf-progress-vertical-indeterminate1 2.1s cubic-bezier(0.65, 0.815, 0.735, 0.395) infinite;
        animation-delay: -${delay}s;
    }

    .progress-bar[data-indeterminate].vertical:after {
        animation: tf-progress-vertical-indeterminate2 2.1s cubic-bezier(0.165, 0.84, 0.44, 1) 1.15s infinite;
        animation-delay: -${delay}s;
    }

    .progress-bar:not([data-indeterminate]).vertical:before, .progress-bar:not([data-indeterminate]).vertical:after {
        height: 100%;
        transform: translateY(calc(1% * (100 - var(--progress-percent))));
    }

    .progress-bar:not([data-indeterminate]).vertical:after {
        animation: tf-progress-gradient-vertical 1s linear infinite;
        animation-delay: -${delay}s;
        background: linear-gradient(to top, #ffffff05, #00000050 50%, #ffffff05 100%) repeat;
        background-size: 100% 50%;
    }

    :host(.primary),
    :host(.secondary),
    :host(.tertiary),
    :host(.danger),
    :host(.dark),
    :host(.default),
    :host(.info),
    :host(.success),
    :host(.warning) {
        --progress-background-color: var(--tavenem-theme-color-hover);
        --progress-color: var(--tavenem-theme-color);
    }


    ::slotted(*) {
        z-index: 1;
    }
    `;
        shadow.appendChild(style);

        const div = document.createElement('div');
        div.classList.add('progress-bar');
        if (vertical) {
            div.classList.add('vertical');
        }
        div.role = "progressbar";
        div.ariaValueMin = '0';
        div.ariaValueMax = '100';
        if (indeterminate) {
            div.dataset.indeterminate = '';
        } else {
            div.ariaValueNow = progressValue.toString();
        }
        shadow.appendChild(div);

        const slot = document.createElement('slot');
        slot.name = "label";
        shadow.appendChild(slot);

        this.setProgress(progressValue);
    }

    attributeChangedCallback(name: string, oldValue: string | null | undefined, newValue: string | null | undefined) {
        if (newValue == oldValue) {
            return;
        }

        if (name === 'progress') {
            if (newValue) {
                this.setProgress(Number.parseFloat(newValue));
            } else {
                this.setIndeterminate(true);
            }
        }
    }

    private setIndeterminate(value: boolean) {
        if (!this.shadowRoot) {
            return;
        }

        const div = this.shadowRoot.querySelector('div');
        if (div) {
            if (value) {
                div.dataset.indeterminate = 'true';
                div.removeAttribute('aria-valuenow');
            } else {
                delete div.dataset.indeterminate;
            }
        }
    }

    private setProgress(percent: number) {
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