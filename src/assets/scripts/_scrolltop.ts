export class TavenemScrollTopHTMLElement extends HTMLElement {
    private _throttleScrollHandlerId: number;

    constructor() {
        super();

        this._throttleScrollHandlerId = -1;
    }

    connectedCallback() {
        const shadow = this.attachShadow({ mode: 'open' });

        this.classList.add('hidden');

        const local = 'local' in this.dataset;

        const style = document.createElement('style');
        style.textContent = `:host {
    bottom: 1rem;
    cursor: pointer;
    display: inline-flex;
    flex: 0 0 auto;
    position: ${local ? 'absolute' : 'fixed'};
    right: 1rem;
    z-index: var(--tavenem-zindex-scroll-to-top);
}

@media print {
    :host {
        display: none;
    }
}

:host(:not(.hidden)) {
    transition: transform 0.5s;
}

:host(.hidden) {
    flex: 0;
    opacity: 0;
    transform: scale(0) rotate(180deg);
    transition: all 0.5s;
    visibility: hidden;
}

:host:after {
    background: transparent;
    bottom: 0;
    content: '';
    left: 0;
    position: absolute;
    right: 0;
    top: 0;
    z-index: var(--tavenem-zindex-tooltip);
}

slot button.default-scroll-top-button {
    background-color: var(--tavenem-color-primary);
    border-color: var(--tavenem-color-primary-text);
    border-radius: 9999px;
    border-style: none;
    border-width: 1px;
    box-shadow: none;
    box-sizing: border-box;
    color: var(--tavenem-color-primary-text);
    cursor: pointer;
    display: inline-flex;
    fill: currentColor;
    flex: 0 0 auto;
    height: calc(1.5rem + 12px);
    margin: 0;
    outline: 0;
    overflow: hidden;
    padding: 6px;
    position: relative;
    stroke: currentColor;
    stroke-width: 1px;
    transition: background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,border 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,fill 200ms cubic-bezier(.4,0,.2,1) 0ms;
    user-select: none;
    width: calc(1.5rem + 12px);
    -moz-appearance: none;
    -webkit-appearance: none;
    -webkit-tap-highlight-color: transparent;
}

    slot button.default-scroll-top-button:after {
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

    slot button.default-scroll-top-button:active:after {
        transform: scale(0,0);
        opacity: .1;
        transition: 0s;
    }

    slot button.default-scroll-top-button::-moz-focus-inner {
        border-style: none;
    }

    slot button.default-scroll-top-button:hover,
    slot button.default-scroll-top-button:focus-visible {
        background-color: var(--tavenem-color-primary-darken);
        color: var(--tavenem-color-primary-text);
    }`;
        shadow.appendChild(style);

        const slot = document.createElement('slot');
        shadow.appendChild(slot);

        const button = document.createElement('button');
        button.classList.add('default-scroll-top-button');
        slot.appendChild(button);

        const icon = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
        icon.setAttributeNS(null, 'viewBox', '0 0 24 24');
        icon.setAttributeNS(null, 'height', '1.5rem');
        icon.setAttributeNS(null, 'width', '1.5rem');
        icon.setAttributeNS(null, 'fill', 'currentColor');
        icon.innerHTML = '<path d="M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14z"/>';
        button.appendChild(icon);

        this.addEventListener('click', this.scrollToTop.bind(this));

        if (this.parentElement) {
            this.parentElement.addEventListener(
                'scroll',
                this.throttleScrollHandler.bind(this));
        }
    }

    disconnectedCallback() {
        this.removeEventListener('click', this.scrollToTop.bind(this));

        if (this.parentElement) {
            this.parentElement.removeEventListener(
                'scroll',
                this.throttleScrollHandler.bind(this));
        }
    }

    private handleScroll(event: Event) {
        const element = event.target;
        if (!element) {
            return;
        }

        let topOffset = 0;
        if (element instanceof Document) {
            const firstChild = element.firstElementChild;
            if (firstChild) {
                topOffset = firstChild.getBoundingClientRect().top * -1;
            }
        } else if (element instanceof HTMLElement) {
            topOffset = element.scrollTop;
        }

        const hidden = this.classList.contains('hidden');

        if (topOffset >= 300 && hidden) {
            this.classList.remove('hidden');
        } else if (topOffset < 300 && !hidden) {
            this.classList.add('hidden');
        }
    }

    private scrollToTop() {
        const container = this.parentElement || document;
        if (container instanceof Document) {
            window.scroll({
                top: 0,
                left: 0,
                behavior: "smooth",
            });
        } else {
            container.scroll({
                top: 0,
                left: 0,
                behavior: "smooth",
            });
        }
    }

    private throttleScrollHandler(event: Event) {
        clearTimeout(this._throttleScrollHandlerId);

        this._throttleScrollHandlerId = window.setTimeout(
            this.handleScroll.bind(this, event),
            100);
    }
}