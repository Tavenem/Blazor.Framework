interface TavenemHeadingElement extends HTMLElement {
    headingLevel: number;
    headingTitle: string;
}

export class TavenemContentsHTMLElement extends HTMLElement {
    private _headings: Array<TavenemHeadingElement>;
    private _activeHeading: Element | undefined;
    private _mutationObserver: MutationObserver;

    constructor() {
        super();

        this._headings = [];

        this._mutationObserver = new MutationObserver(mutations => {
            let updated = false;
            for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                    for (const node of mutation.removedNodes) {
                        if ((node instanceof HTMLHeadingElement
                            || (node instanceof HTMLElement
                                && node.classList.contains('tav-heading')))
                            && !('hideFromContents' in node.dataset)
                            && node.closest('.editor') == null) {
                            const index = this._headings.indexOf(node as TavenemHeadingElement);
                            if (index >= 0) {
                                this._headings.splice(index, 1);
                                updated = true;
                            }
                        }
                    }
                    for (const node of mutation.addedNodes) {
                        if ((node instanceof HTMLHeadingElement
                            || (node instanceof HTMLElement
                                && node.classList.contains('tav-heading')))
                            && !('hideFromContents' in node.dataset)
                            && node.closest('.editor') == null) {
                            const index = this._headings.indexOf(node as TavenemHeadingElement);
                            if (index == -1) {
                                const heading = node as TavenemHeadingElement;
                                heading.headingLevel = Number.parseInt(heading.tagName.startsWith('H')
                                    ? heading.tagName.substring(1)
                                    : (heading.getAttribute('data-heading-level') || '0'));
                                heading.headingTitle = heading.getAttribute('data-heading-title')
                                    || heading.textContent
                                    || `Heading ${this._headings.length.toString()}`;
                                this._headings.push(heading);
                                updated = true;
                            }
                        }
                    }
                } else if (mutation.type === 'attributes') {
                    if ((mutation.target instanceof HTMLHeadingElement
                        || (mutation.target instanceof HTMLElement
                            && mutation.target.classList.contains('tav-heading')))
                        && mutation.target.closest('.editor') == null) {
                        const hidden = 'hideFromContents' in mutation.target.dataset;
                        const index = this._headings.indexOf(mutation.target as TavenemHeadingElement);
                        if (index >= 0) {
                            if (hidden) {
                                this._headings.splice(index, 1);
                            } else {
                                const heading = this._headings[index];
                                heading.headingLevel = Number.parseInt(heading.tagName.startsWith('H')
                                    ? heading.tagName.substring(1)
                                    : (heading.getAttribute('data-heading-level') || '0'));
                                heading.headingTitle = heading.getAttribute('data-heading-title')
                                    || heading.textContent
                                    || `Heading ${this._headings.length.toString()}`;
                            }
                            updated = true;
                        } else if (!hidden) {
                            const heading = mutation.target as TavenemHeadingElement;
                            heading.headingLevel = Number.parseInt(heading.tagName.startsWith('H')
                                ? heading.tagName.substring(1)
                                : (heading.getAttribute('data-heading-level') || '0'));
                            heading.headingTitle = heading.getAttribute('data-heading-title')
                                || heading.textContent
                                || `Heading ${this._headings.length.toString()}`;
                            this._headings.push(heading);
                            updated = true;
                        }
                    }
                }
            }
            if (updated) {
                this.refreshHeadings();
            }
        });
    }

    connectedCallback() {
        const shadow = this.attachShadow({ mode: 'open' });

        const style = document.createElement('style');
        style.innerHTML = `:host {
    display: flex;
    flex-direction: column;
    margin-top: 1rem;
    max-width:15em;
    padding-top: .25em;
}

@media print {
    :host {
        display: none;
    }
}

nav.contents-list {
    color: var(--tavenem-color-text-secondary);
    display: flex;
    flex-direction: column;
    list-style: none;
    overflow: auto;
    padding-bottom: .25em;
    padding-left: 1em;
    padding-right: 1em;
    padding-top: .25em;
    position: relative;
    scrollbar-gutter: stable;
    transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
}

:host(.empty) nav.contents-list {
    display: none;
}

nav.contents-list > * {
    align-items: center;
    background-color: transparent;
    box-sizing: border-box;
    color: inherit;
    column-gap: .5em;
    display: flex;
    flex: 0 0 auto;
    flex-wrap: wrap;
    justify-content: flex-start;
    list-style: none;
    padding-bottom: .25em;
    padding-top: .25em;
    position: relative;
    text-align: start;
    text-decoration: none;
    transition: background-color 150ms cubic-bezier(.4,0,.2,1) 0ms;
    -webkit-tap-highlight-color: transparent;
}

nav.contents-list > *:focus-visible,
nav.contents-list > *:hover {
    background-color: transparent;
    color: inherit;
}

nav.contents-list > a {
    border: 0;
    border-radius: 0;
    cursor: pointer;
    margin: 0;
    outline: 0;
    transition: background-color 150ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
    user-select: none;
    vertical-align: middle;
    -webkit-appearance: none;
    -webkit-tap-highlight-color: transparent;
}

nav.contents-list > a:hover,
nav.contents-list > a:focus {
    background-color: var(--tavenem-color-action);
}

nav.contents-list > a.active {
    background-color: var(--tavenem-color-primary-hover);
    border-inline-start: 1px solid var(--tavenem-color-primary);
    color: var(--tavenem-color-primary);
}

nav.contents-list > a.active:hover,
nav.contents-list > a.active:focus {
    background-color: var(--tavenem-color-primary-hover-bright);
}

slot .default-title {
    background-color: inherit;
    font-size: .875em;
    font-weight: var(--tavenem-font-weight-bold);
    position: sticky;
    top: 0;
    z-index: 1;
}

:host(.empty) slot .default-title {
    display: none;
}`;
        shadow.appendChild(style);

        const slot = document.createElement('slot');
        shadow.appendChild(slot);

        const defaultContent = document.createElement('span');
        defaultContent.classList.add('default-title');
        defaultContent.textContent = "Contents";
        slot.appendChild(defaultContent);

        const nav = document.createElement('nav');
        nav.classList.add('contents-list');
        shadow.appendChild(nav);

        this.getHeadings();

        this.refreshHeadings();

        this._mutationObserver.observe(
            this.parentNode || document,
            {
                attributeFilter: [
                    'data-heading-level',
                    'data-heading-title',
                    'data-hide-from-contents',
                ],
                childList: true,
                subtree: true
            });

        document.addEventListener('scroll', this.handleScrollSpy.bind(this), true);
        window.addEventListener('resize', this.handleScrollSpy.bind(this), true);
    }

    disconnectedCallback() {
        document.removeEventListener('scroll', this.handleScrollSpy.bind(this), true);
        window.removeEventListener('resize', this.handleScrollSpy.bind(this), true);
    }

    private static documentPositionComparator(a: Node, b: Node) {
        if (a === b) {
            return 0;
        }

        var position = a.compareDocumentPosition(b);

        if (position & Node.DOCUMENT_POSITION_FOLLOWING || position & Node.DOCUMENT_POSITION_CONTAINED_BY) {
            return -1;
        } else if (position & Node.DOCUMENT_POSITION_PRECEDING || position & Node.DOCUMENT_POSITION_CONTAINS) {
            return 1;
        } else {
            return 0;
        }
    }

    refreshStyle() {
        const root = this.shadowRoot;
        if (!root) {
            return;
        }
        const nav = root.querySelector('nav.contents-list');
        if (!nav) {
            return;
        }

        if (nav.childElementCount === 0) {
            this.classList.add('empty');
        }
    }

    private clearActive() {
        if (this._activeHeading) {
            this._activeHeading.classList.remove('active');
        }
        delete this._activeHeading;
    }

    private getHeadings() {
        const parent = this.parentNode || document;

        this._headings = Array
            .from(parent.querySelectorAll('h1,h2,h3,h4,h5,h6,.tav-heading'))
            .filter(x => x instanceof HTMLElement
                && !('hideFromContents' in x.dataset)
                && x.closest('.editor') == null)
            .map((v, i) => {
                const heading = v as TavenemHeadingElement;
                heading.headingLevel = Number.parseInt(v.tagName.startsWith('H')
                    ? v.tagName.substring(1)
                    : (v.getAttribute('data-heading-level') || '0'));
                heading.headingTitle = v.getAttribute('data-heading-title')
                    || v.textContent
                    || `Heading ${i.toString()}`;
                return heading;
            });
    }

    private handleScrollSpy() {
        if (this._headings.length === 0) {
            this.clearActive();
            return;
        }

        let lowest = Number.MAX_SAFE_INTEGER;
        let lowestAboveZero = Number.MAX_SAFE_INTEGER;
        let lowestElement: TavenemHeadingElement | undefined;
        let lowestElementAboveZero: TavenemHeadingElement | undefined;
        for (let i = 0; i < this._headings.length; i++) {
            const heading = this._headings[i];

            const rect = heading.getBoundingClientRect();

            if (rect.top < lowest) {
                lowest = rect.top;
                lowestElement = heading;
            }
            if (rect.top > 0
                && rect.top < lowestAboveZero) {
                lowestAboveZero = rect.top;
                lowestElementAboveZero = heading;
            }
        }

        const activeHeading = lowestElementAboveZero || lowestElement;
        if (!activeHeading) {
            this.clearActive();
            return;
        }

        if (activeHeading.getBoundingClientRect().top >= window.innerHeight * 0.8) {
            return;
        }

        if (activeHeading != this._activeHeading) {
            this.clearActive();
            this._activeHeading = activeHeading;
            activeHeading.classList.add('active');
        }
    }

    private refreshHeadings() {
        const root = this.shadowRoot;
        if (!root) {
            return;
        }
        const nav = root.querySelector('nav.contents-list');
        if (!nav) {
            return;
        }

        this._headings = this._headings.sort(TavenemContentsHTMLElement.documentPositionComparator);
        const children: Node[] = [];
        if (this._headings.length > 0) {
            const minHeadings = parseInt(this.dataset.minHeadings || '3');
            if (minHeadings > 0 && this._headings.length >= minHeadings) {
                const maxLevel = parseInt(this.dataset.maxLevel || '0');
                const maxLevelOffset = parseInt(this.dataset.maxLevelOffset || '2');

                const lowest = this
                    ._headings
                    .filter(v => v.headingLevel > 0)
                    .reduce((p, c) => (p && p.headingLevel < c.headingLevel) ? p : c);
                const lowestLevel = lowest
                    ? lowest.headingLevel
                    : 0;
                const highestLevel = lowestLevel === 0
                    ? 0
                    : this
                        ._headings
                        .reduce((p, c) => (p && p.headingLevel > c.headingLevel) ? p : c)
                        .headingLevel;
                for (const heading of this._headings) {
                    if (maxLevel > 0
                        && (heading.headingLevel == 0
                            || heading.headingLevel > maxLevel)) {
                        continue;
                    }

                    const offset = heading.headingLevel
                        ? heading.headingLevel - lowestLevel
                        : highestLevel + 1;

                    if (maxLevelOffset >= 0
                        && offset > maxLevelOffset) {
                        continue;
                    }

                    const link = document.createElement('a');

                    if (heading.id) {
                        link.href = `#${heading.id}`;
                    } else {
                        link.addEventListener('click', this.scrollToHeading.bind(this, heading));
                    }

                    if (lowestLevel > 0 && offset > 0) {
                        link.style.paddingInlineStart = `${offset * 0.5}rem`;
                    }

                    link.textContent = heading.headingTitle;

                    children.push(link);
                }
            }
        }
        nav.replaceChildren(...children);

        if (children.length === 0) {
            this.classList.add('empty');
        } else {
            this.classList.remove('empty');
        }
    }

    private scrollToHeading(heading: Element) {
        heading.scrollIntoView({
            behavior: "smooth",
            block: "start",
            inline: "nearest"
        });
        if (window.location.hash
            && window.location.hash.length) {
            history.replaceState(null, '', window.location.pathname);
        }
    }
}