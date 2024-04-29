interface TavenemHeadingElement extends HTMLElement {
    headingLevel: number;
    headingTitle: string;
}

interface TavenemContentsLinkElement extends HTMLAnchorElement {
    heading: TavenemHeadingElement;
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
                    if (mutation.removedNodes.length) {
                        updated = true;
                        break;
                    }
                    for (const node of mutation.addedNodes) {
                        if ((node instanceof HTMLHeadingElement
                            || (node instanceof HTMLElement
                                && node.classList.contains('tav-heading')))
                            && !('hideFromContents' in node.dataset)
                            && node.closest('tf-popover, .dialog-container, .editor') == null) {
                            updated = true;
                            break;
                        }
                    }
                    if (updated) {
                        break;
                    }
                } else if (mutation.type === 'attributes'
                    && (mutation.target instanceof HTMLHeadingElement
                        || (mutation.target instanceof HTMLElement
                            && mutation.target.classList.contains('tav-heading')))
                    && mutation.target.closest('tf-popover, .dialog-container, .editor') == null) {
                    updated = true;
                    break;
                }
            }
            if (updated) {
                this.refresh();
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
    overflow: auto;
    padding-left: .75em;
    padding-right: .75em;
    padding-top: .25em;
    scrollbar-color: var(--tavenem-color-scrollbar) transparent;
    scrollbar-width: thin;
}

@media print {
    :host {
        display: none;
    }
}

::-webkit-scrollbar {
    height: .5rem;
    width: .5rem;
    z-index: 1;
}

::-webkit-scrollbar-track {
    background: transparent;
}

::-webkit-scrollbar-thumb {
    background: var(--tavenem-color-scrollbar);
    border-radius: 1px;
}

::-webkit-scrollbar-thumb:hover {
    background: var(--tavenem-color-scrollbar-hover);
}

nav.contents-list {
    color: var(--tavenem-color-text-secondary);
    display: flex;
    flex-direction: column;
    list-style: none;
    overflow: auto;
    padding-bottom: .25em;
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
    padding-inline-end: .25em;
    padding-inline-start: .25em;
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
    background-color: var(--tavenem-color-primary-hover);
}

nav.contents-list > a.active {
    background-color: var(--tavenem-color-primary-hover);
    border-inline-start: 1px solid var(--tavenem-color-primary);
    color: var(--tavenem-color-primary);
    padding-inline-start: calc(.25em - 1px);
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

        this.refresh();

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

    refresh() {
        const root = this.shadowRoot;
        if (!root) {
            return;
        }
        const nav = root.querySelector('nav.contents-list');
        if (!nav) {
            return;
        }

        const parent = this.parentNode || document;

        this._headings = Array
            .from(parent.querySelectorAll('h1,h2,h3,h4,h5,h6,.tav-heading'))
            .filter(x => x instanceof HTMLElement
                && !('hideFromContents' in x.dataset)
                && x.closest('tf-popover, .dialog-container, .editor') == null)
            .map((v, i) => {
                const heading = v as TavenemHeadingElement;
                heading.headingLevel = Number.parseInt(v.tagName.startsWith('H')
                    ? v.tagName.substring(1)
                    : (v.getAttribute('data-heading-level') || '0'));
                heading.headingTitle = v.getAttribute('data-heading-title')
                    || v.textContent
                    || `Heading ${i.toString()}`;
                return heading;
            }).sort(TavenemContentsHTMLElement.documentPositionComparator);

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

                    const link = document.createElement('a') as TavenemContentsLinkElement;
                    link.heading = heading;

                    if (heading.id) {
                        link.href = window.location.origin + window.location.pathname + `#${heading.id}`;
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

    private handleScrollSpy() {
        const root = this.shadowRoot;
        if (!root) {
            return;
        }
        const nav = root.querySelector('nav.contents-list');
        if (!nav) {
            return;
        }

        if (this._headings.length === 0) {
            for (const link of nav.children) {
                link.classList.remove('active');
            }
            delete this._activeHeading;
            return;
        }

        let highestBelowZero = Number.MIN_SAFE_INTEGER;
        let lowestAboveZero = Number.MAX_SAFE_INTEGER;
        let highestElementBelowZero: TavenemHeadingElement | undefined;
        let lowestElementAboveZero: TavenemHeadingElement | undefined;
        const minTop = window.innerHeight * 0.8;
        for (let i = 0; i < this._headings.length; i++) {
            const heading = this._headings[i];

            const rect = heading.getBoundingClientRect();

            if (rect.top < 0) {
                if (rect.top > highestBelowZero) {
                    highestBelowZero = rect.top;
                    highestElementBelowZero = heading;
                }
            } else if (rect.top < minTop
                && rect.top < lowestAboveZero) {
                lowestAboveZero = rect.top;
                lowestElementAboveZero = heading;
            }
        }

        const activeHeading = lowestElementAboveZero || highestElementBelowZero;
        if (!activeHeading) {
            for (const link of nav.children) {
                link.classList.remove('active');
            }
            delete this._activeHeading;
            return;
        }

        if (activeHeading != this._activeHeading) {
            this._activeHeading = activeHeading;
            for (const link of nav.children) {
                if ((link as TavenemContentsLinkElement).heading === activeHeading) {
                    link.classList.add('active');
                } else {
                    link.classList.remove('active');
                }
            }
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