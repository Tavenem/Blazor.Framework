export class TavenemCloseButtonHtmlElement extends HTMLElement {
    connectedCallback() {
        const shadow = this.attachShadow({ mode: 'open' });

        const style = document.createElement('style');
        style.textContent = `:host {
    align-self: flex-start;
    border: 0;
    border-radius: 50%;
    box-sizing: content-box;
    color: var(--tavenem-color-text);
    cursor: pointer;
    display: inline-block;
    fill: currentColor;
    flex: 0 0 auto;
    height: 1.5rem;
    justify-self: end;
    margin-inline-start: auto;
    opacity: .5;
    order: 9999;
    overflow: hidden;
    padding: .25rem;
    position: relative;
    stroke: currentColor;
    stroke-width: 1px;
    transition: fill 200ms cubic-bezier(.4,0,.2,1) 0ms;
    user-select: none;
    width: 1.5rem;
}

:host(:hover) {
    opacity: .75;
}

:host(:focus) {
    box-shadow: 0 0 0 .25rem rgba(var(--tavenem-color-primary), .25);
    opacity: 1;
    outline: 0;
}

:host([disabled]),
:host(.disabled) {
    box-shadow: none;
    color: var(--tavenem-color-text-disabled);
    cursor: default;
    opacity: .25;
    pointer-events: none;
}

:host:after {
    background-image: radial-gradient(circle,#000 10%,transparent 10.01%);
    background-position: 50%;
    background-repeat: no-repeat;
    content: '';
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

:host(:active):after {
    transform: scale(0,0);
    opacity: .1;
    transition: 0s;
}`;
        shadow.appendChild(style);

        const icon = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
        icon.setAttributeNS(null, 'viewBox', '0 0 24 24');
        icon.setAttributeNS(null, 'height', '1rem');
        icon.setAttributeNS(null, 'width', '1rem');
        icon.innerHTML = '<path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>';
        shadow.appendChild(icon);

        if ('closeAuto' in this.dataset) {
            this.addEventListener('click', this.close.bind(this));
        }
    }

    disconnectedCallback() {
        this.removeEventListener('click', this.close.bind(this));
    }

    close() {
        const target = this.closest('[data-can-close]');
        if (target && target instanceof HTMLElement) {
            target.classList.add('auto-closed');
        }
    }
}