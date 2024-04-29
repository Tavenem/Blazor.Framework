export class TavenemSliderHTMLElement extends HTMLElement {
    _max: number;
    _min: number;
    _value: number;

    static get observedAttributes() {
        return ['max', 'min', 'value'];
    }

    constructor() {
        super();

        this._max = 100;
        this._min = 0;
        this._value = 0;
    }

    connectedCallback() {
        this._max = Number.parseFloat(this.dataset.max || '100') || 100;
        this._min = Number.parseFloat(this.dataset.min || '0') || 0;

        const rawValue = this.dataset.value;
        this._value = rawValue ? Number.parseFloat(rawValue) : 0;
        if (Number.isNaN(this._value) || !Number.isFinite(this._value)) {
            this._value = 0;
        }

        this._value = Math.max(this._min, Math.min(this._max, this._value));

        const shadow = this.attachShadow({ mode: 'open' });

        const style = document.createElement('style');
        style.textContent = `
:host {
    align-items: center;
    display: flex;
}

.filler {
    background-color: var(--thumb-color);
    border-radius: 1px;
    display: var(--tavenem-slider-filler-display, none);
    height: 2px;
    position: absolute;
}

output {
    align-items: center;
    background-color: var(--thumb-label-color-bg);
    border-radius: 2px;
    color: var(--thumb-label-color);
    display: var(--output-display, none);
    font-size: .75rem;
    justify-content: center;
    line-height: normal;
    opacity: var(--output-opacity, 0);
    padding: 4px 8px;
    pointer-events: none;
    position: absolute;
    text-align: center;
    top: 0;
    transform: translate(-50%, -125%);
    transition: opacity .2s ease-in-out;
    user-select: none;
}
`;
        shadow.appendChild(style);

        const filler = document.createElement('div');
        filler.classList.add('filler');
        shadow.appendChild(filler);

        const slot = document.createElement('slot');
        shadow.appendChild(slot);

        const output = document.createElement('output');
        shadow.appendChild(output);

        this.setValue(this._value);

        this.addEventListener('input', this.onInput.bind(this));
    }

    disconnectedCallback() {
        this.removeEventListener('input', this.onInput.bind(this));
    }

    attributeChangedCallback(name: string, oldValue: string | null | undefined, newValue: string | null | undefined) {
        if (name === 'value') {
            this.setValue(newValue ? Number.parseFloat(newValue) : 0);
        } else if (name === 'max') {
            this._max = newValue ? Number.parseFloat(newValue) || this._max : this._max;
            if (this._value > this._max) {
                this.setValue(this._value);
            }
        } else if (name === 'min') {
            this._min = newValue ? Number.parseFloat(newValue) || this._min : this._min;
            if (this._value < this._min) {
                this.setValue(this._value);
            }
        }
    }

    private onInput(e: Event) {
        if (e.target instanceof HTMLInputElement
            && this.contains(e.target)) {
            this.setValue(parseFloat(e.target.value) || 0);
        }
    }

    private setValue(value: number) {
        if (!this.shadowRoot) {
            return;
        }

        if (Number.isNaN(value) || !Number.isFinite(value)) {
            value = 0;
        }

        value = Math.max(this._min, Math.min(this._max, value));
        this._value = value;

        const step = this.querySelector('input')?.step || 'any';
        const stepValue = parseFloat(step === 'any' ? '1' : step) || 1;

        const stepString = stepValue.toString();
        const decimalIndex = stepString.indexOf('.');
        let precision = 1;
        if (decimalIndex >= 0) {
            precision = (stepString.length - decimalIndex - 1) * 10;
        }

        const roundedValue = Math.round(value * precision) / precision;

        const barWidth = Math.max(0, Math.min(100, 100 * (value - this._min) / (this._max - this._min)));
        const barWidthStyle = `${trimChar(trimChar(barWidth.toFixed(2), '0'), '.')}%`;

        const filler = this.shadowRoot.querySelector('.filler') as HTMLDivElement;
        if (filler) {
            filler.style.width = barWidthStyle;
        }

        const output = this.shadowRoot.querySelector('output') as HTMLOutputElement;
        if (output) {
            output.style.left = barWidthStyle;
            output.innerText = roundedValue.toString();
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