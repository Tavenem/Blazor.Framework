export class TavenemDrawerOverlayHtmlElement extends HTMLElement {
    connectedCallback() {
        const shadow = this.attachShadow({ mode: 'open' });

        const style = document.createElement('style');
        style.textContent = ':host { display: none; }';
        shadow.appendChild(style);

        this.addEventListener('click', this.closeDrawer.bind(this));
    }

    disconnectedCallback() {
        this.removeEventListener('click', this.closeDrawer.bind(this));
    }

    private closeDrawer(event: Event) {
        event.stopPropagation();

        const side = this.getAttribute('data-side');
        if (!side) {
            return;
        }

        document.documentElement.setAttribute(`data-drawer-${side}`, 'false');
    }
}