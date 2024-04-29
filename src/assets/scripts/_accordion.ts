export class TavenemAccordionHTMLElement extends HTMLElement {
    private _details: Array<HTMLDetailsElement>;
    private _mutationObserver: MutationObserver;

    constructor() {
        super();

        this._details = [];

        this._mutationObserver = new MutationObserver(mutations => {
            let updated = false;
            for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                    for (const node of mutation.removedNodes) {
                        if (!(node instanceof HTMLDetailsElement)) {
                            continue;
                        }
                        const index = this._details.indexOf(node);
                        if (index >= 0) {
                            node.removeEventListener('toggle', this.toggle.bind(this));
                            this._details.splice(index, 1);
                            updated = true;
                        }
                    }
                    for (const node of mutation.addedNodes) {
                        if (!(node instanceof HTMLElement)
                            || !node.classList.contains('collapse')) {
                            continue;
                        }
                        const details = Array.from(node.getElementsByTagName('details'))
                            .filter(y => y.parentNode === node);
                        if (!details || !details.length) {
                            continue;
                        }
                        const index = this._details.indexOf(details[0]);
                        if (index == -1) {
                            details[0].addEventListener('toggle', this.toggle.bind(this));
                            this._details.push(details[0]);
                            updated = true;
                        }
                    }
                }
            }
            if (updated) {
                this.refreshDetails();
            }
        });
    }

    connectedCallback() {
        const shadow = this.attachShadow({ mode: 'open' });

        const style = document.createElement('style');
        style.textContent = `:host {
    flex: 0 1 auto;
    border-radius: var(--tavenem-border-radius);
    box-shadow: var(--tavenem-shadow-1);
    max-width: 100%;
    position: relative;
    transition: .3s cubic-bezier(.25,.8,.5,1);
}

:host(.hidden) {
    flex: 0;
    opacity: 0;
    transform: scale(0) rotate(180deg);
    transition: all 0.5s;
    visibility: hidden;
}

:host(.flush) {
    border-radius: 0;
    box-shadow: none;
}

:host > .collapse {
    border-bottom: 1px solid var(--tavenem-color-border);
}

:host(.border-0) > .collapse {
    border-bottom: 0;
}

:host(.dense) > .collapse > details > summary,
:host(.dense) > .collapse > details > .body,
:host(.dense) > .collapse > .footer {
    padding: .25rem .75rem;
}

:host > * {
    border-radius: 0;
}

:host > *:first-child {
    border-top: none;
    border-top-left-radius: inherit;
    border-top-right-radius: inherit;
}

:host > *:last-child {
    border-bottom: none;
    border-bottom-left-radius: inherit;
    border-bottom-right-radius: inherit;
}

:host > *:only-child {
    border: none;
    border-top: none;
    border-radius: inherit;
}
`;
        shadow.appendChild(style);

        const slot = document.createElement('slot');
        shadow.appendChild(slot);

        if (!('onlyOne' in this.dataset)) {
            return;
        }

        this._details = Array
            .from(this.getElementsByClassName('collapse'))
            .map(x => {
                const details = Array.from(x.getElementsByTagName('details'))
                    .filter(y => y.parentNode === x);
                if (details && details.length) {
                    return details[0];
                }
            }).filter((x): x is HTMLDetailsElement => !!x);
        for (const details of this._details) {
            details.addEventListener('toggle', this.toggle.bind(this));
        }

        this.refreshDetails();

        this._mutationObserver.observe(this, { childList: true });
    }

    disconnectedCallback() {
        if (this._details
            && this._details.length) {
            for (const details of this._details) {
                details.removeEventListener('toggle', this.toggle.bind(this));
            }
        }
    }

    private refreshDetails() {
        if (!this._details
            || !this._details.length) {
            return;
        }
        let openDetails: HTMLDetailsElement | undefined;
        for (const details of this._details.reverse()) {
            if (openDetails == null) {
                if (details.open) {
                    openDetails = details;
                }
            } else if (details.open) {
                details.open = false;
            }
        }
    }

    private toggle(event: Event) {
        const element = event.target;
        if (!(element instanceof HTMLDetailsElement)
            || !element.open
            || !this._details
            || !this._details.length
            || !this._details.includes(element)) {
            return;
        }
        for (const details of this._details) {
            if (details !== element) {
                details.open = false;
            }
        }
    }
}