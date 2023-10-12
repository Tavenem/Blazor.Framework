export class TavenemScrollTopHTMLElement extends HTMLElement {
    _throttleScrollHandlerId: number;

    constructor() {
        super();

        this._throttleScrollHandlerId = -1;
    }

    connectedCallback() {
        const shadow = this.attachShadow({ mode: 'open' });

        const slot = document.createElement('slot');
        slot.outerHTML = '<slot name="content"></slot>';
        shadow.appendChild(slot);

        const span = document.createElement('span');
        span.outerHTML = '<span class="btn btn-icon primary filled"></span>';
        slot.appendChild(span);

        const icon = document.createElement('tf-icon');
        icon.textContent = 'expand_less';
        span.appendChild(icon);

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

    handleScroll(event: Event) {
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

    scrollToTop() {
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

    throttleScrollHandler(event: Event) {
        clearTimeout(this._throttleScrollHandlerId);

        this._throttleScrollHandlerId = window.setTimeout(
            this.handleScroll.bind(this, event),
            100);
    }
}