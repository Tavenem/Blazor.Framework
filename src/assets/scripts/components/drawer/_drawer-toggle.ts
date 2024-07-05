export class TavenemDrawerToggleHtmlElement extends HTMLElement {
    _open: boolean = false;

    connectedCallback() {
        const shadow = this.attachShadow({ mode: 'open' });

        const style = document.createElement('style');
        style.textContent = `:host {
    cursor: pointer;
}

@media print {
    :host {
        display: none;
    }
}

button {
    background-color: transparent;
    border-color: var(--tavenem-color-border);
    border-radius: 9999px;
    border-style: none;
    border-width: 1px;
    box-shadow: none;
    box-sizing: border-box;
    color: inherit;
    cursor: pointer;
    display: inline-flex;
    fill: currentColor;
    flex: 0 0 auto;
    height: 1.5rem;
    margin: 0;
    outline: 0;
    overflow: hidden;
    padding: .25rem;
    position: relative;
    stroke: currentColor;
    stroke-width: 1px;
    transition: background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,border 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,fill 200ms cubic-bezier(.4,0,.2,1) 0ms;
    user-select: none;
    width: 1.5rem;
    -moz-appearance: none;
    -webkit-appearance: none;
    -webkit-tap-highlight-color: transparent;
}

    button:after {
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

    button:active:after {
        transform: scale(0,0);
        opacity: .1;
        transition: 0s;
    }

    button::-moz-focus-inner {
        border-style: none;
    }

    button:hover,
    button:focus-visible {
        background-color: var(--tavenem-color-action-hover-bg);
    }`;
        shadow.appendChild(style);

        const slot = document.createElement('slot');
        shadow.appendChild(slot);

        const button = document.createElement('button');
        slot.appendChild(button);

        const icon = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
        icon.setAttributeNS(null, 'viewBox', '0 0 24 24');
        icon.setAttributeNS(null, 'height', '1rem');
        icon.setAttributeNS(null, 'width', '1rem');
        icon.setAttributeNS(null, 'fill', 'currentColor');
        icon.innerHTML = '<path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>';
        button.appendChild(icon);

        this.addEventListener('click', this.change.bind(this));
    }

    disconnectedCallback() {
        this.removeEventListener('click', this.change.bind(this));
    }

    private change() {
        const side = this.getAttribute('data-side');
        if (!side) {
            return;
        }

        this._open = !this._open;

        document.documentElement.setAttribute(`data-drawer-${side}`, this._open.toString());
    }
}