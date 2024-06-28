import { documentPositionComparator } from "../tavenem-utility";

export class TavenemTabsHTMLElement extends HTMLElement {
    private _activating = false;
    private _mutationObserver: MutationObserver;

    static get observedAttributes() {
        return ['data-active-index'];
    }

    private static newDeleteEvent() {
        return new CustomEvent('delete', { bubbles: true, composed: true });
    }

    private static newValueChangeEvent(value: string) {
        return new CustomEvent('valuechange', { bubbles: true, composed: true, detail: { value: value } });
    }

    constructor() {
        super();

        this._mutationObserver = new MutationObserver(mutations => {
            for (const mutation of mutations) {
                if (mutation.type === 'childList'
                    && mutation.removedNodes.length) {
                    const activeTab = this.querySelector<TavenemTabHTMLElement>('tf-tab[id][tabindex="0"]:not([disabled])');
                    if (!activeTab) {
                        this.activate();
                    }
                }
            }
        });
    }

    connectedCallback() {
        const shadow = this.attachShadow({ mode: 'open', delegatesFocus: true });

        const slot = document.createElement('slot');
        shadow.appendChild(slot);

        const activePanel = this.querySelector<TavenemTabPanelHTMLElement>('tf-tab[id].active');
        if (activePanel && activePanel.id && activePanel.id.length) {
            this.activate(activePanel.id);
        } else {
            const panel = this.querySelector<TavenemTabPanelHTMLElement>('tf-tab[id]');
            this.activate(panel?.id);
        }

        this.addEventListener('keydown', this.onKeyDown.bind(this));

        this._mutationObserver.observe(this, { attributeFilter: ['class'] });
    }

    disconnectedCallback() {
        this.removeEventListener('keydown', this.onKeyDown.bind(this));
        this._mutationObserver.disconnect();
    }

    attributeChangedCallback(name: string, oldValue: string | null | undefined, newValue: string | null | undefined) {
        if (newValue == oldValue) {
            return;
        }
        if (name === 'data-active-index'
            && newValue
            && !this._activating) {
            const index = parseInt(newValue) || -1;
            if (index < 0) {
                return;
            }
            const allTabs = Array.from(this.querySelectorAll<TavenemTabHTMLElement>('tf-tab'))
                .sort(documentPositionComparator);
            const tab = allTabs.length > index
                ? allTabs[index]
                : null;
            if (tab?.id) {
                this.activate(tab.id);
            }
        }
    }

    activate(id?: string) {
        let activated = false;
        if (id && id.length) {
            const tab = this.querySelector<TavenemTabHTMLElement>(`#${id}`);
            const panel = this.querySelector<TavenemTabPanelHTMLElement>(`#panel-${id}`);
            if (tab
                && panel
                && !tab.hasAttribute('disabled')) {
                activated = true;

                tab.tabIndex = 0;
                tab.ariaSelected = 'true';
                tab.classList.add('active');

                panel.hidden = false;

                if ('url' in tab.dataset
                    && tab.dataset.url
                    && tab.dataset.url.length) {
                    let url: URL | null = null;
                    try {
                        url = new URL(tab.dataset.url);
                    } catch { }
                    if (!url) {
                        try {
                            url = new URL(tab.dataset.url, document.baseURI);
                        } catch { }
                    }
                    if (url && url.origin === window.location.origin) {
                        window.history.replaceState(null, '', tab.dataset.url);
                    }
                }
            };
        }
        this.querySelectorAll<HTMLElement>(activated
            ? `tf-tab:not(#${id})`
            : 'tf-tab')
            .forEach(x => {
                x.tabIndex = -1;
                x.ariaSelected = 'false';
                x.classList.remove('active');
            });
        this.querySelectorAll<HTMLElement>(activated
            ? `tf-tabpanel:not(#panel-${id})`
            : 'tf-tabpanel')
            .forEach(x => {
                x.hidden = true;
                x.classList.remove('active');
            });

        if (activated) {
            const allTabs = Array.from(this.querySelectorAll<Element>('tf-tab'))
                .sort(documentPositionComparator);
            const activatedIndex = allTabs.findIndex(x => x.id === id);
            if (activatedIndex >= 0) {
                const activatedIndexString = activatedIndex.toString();
                this._activating = true;
                this.dataset.activeIndex = activatedIndexString;
                this.dispatchEvent(TavenemTabsHTMLElement.newValueChangeEvent(activatedIndexString));
                this._activating = false;
            }
            return;
        }

        const tabs = Array.from(this.querySelectorAll<Element>('tf-tab[id]:not([disabled])'))
            .sort(documentPositionComparator);
        if (tabs.length === 0) {
            return;
        }
        this.activate(tabs[0].id);
    }

    private onKeyDown(event: KeyboardEvent) {
        if ((event.target instanceof Element
            && event.target.closest('tf-tabpanel'))
            || (event.key !== 'ArrowLeft'
            && event.key !== 'ArrowRight'
            && event.key !== 'Delete')) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        if (event.key === 'Delete') {
            this.dispatchEvent(TavenemTabsHTMLElement.newDeleteEvent())
            return;
        }

        const allTabs = Array.from(this.querySelectorAll<TavenemTabHTMLElement>('tf-tab'))
            .sort(documentPositionComparator);
        const enabledTabs = allTabs.filter(x => !x.hasAttribute('disabled'));
        if (enabledTabs.length === 0) {
            return;
        } else if (enabledTabs.length === 1) {
            if (enabledTabs[0].tabIndex !== 0) {
                this.activate(enabledTabs[0].id);
            }
            return;
        }

        let index = allTabs.findIndex(x => x.tabIndex === 0);
        if (event.key === 'ArrowLeft') {
            do {
                if (index <= 0) {
                    index = allTabs.length - 1;
                } else {
                    index--;
                }
            } while (allTabs[index].hasAttribute('disabled'));
        } else {
            do {
                if (index < 0
                    || index >= allTabs.length - 1) {
                    index = 0;
                } else {
                    index++;
                }
            } while (allTabs[index].hasAttribute('disabled'));
        }

        this.activate(allTabs[index].id);
        allTabs[index].focus();
    }
}

export class TavenemTabHTMLElement extends HTMLElement {
    static get observedAttributes() {
        return ['disabled'];
    }

    private static newCloseEvent(value: string) {
        return new CustomEvent('delete', { bubbles: true, composed: true, detail: { value: value } });
    }

    connectedCallback() {
        const shadow = this.attachShadow({ mode: 'open', delegatesFocus: true });

        const slot = document.createElement('slot');
        shadow.appendChild(slot);

        if ('canClose' in this.dataset) {
            const closeButton = document.createElement('tf-close');
            shadow.appendChild(closeButton);
            closeButton.addEventListener('click', this.onClose.bind(this));
        }

        this.configureForPanel();
    }

    disconnectedCallback() {
        this.removeEventListener('click', this.onClick.bind(this));
        const root = this.shadowRoot;
        if (!root) {
            return;
        }
        const closeButton = root.querySelector('tf-close');
        if (closeButton) {
            closeButton.removeEventListener('click', this.onClose.bind(this));
        }
    }

    configureForPanel() {
        this.tabIndex = -1;

        if (!this.id || !this.id.length) {
            return;
        }

        const tabs = this.closest<TavenemTabsHTMLElement>('tf-tabs');
        if (!tabs) {
            return;
        }

        const panelId = `panel-${this.id}`;

        const panel = tabs.querySelector<TavenemTabPanelHTMLElement>(`#${panelId}`);
        if (!panel) {
            return;
        }

        this.role = 'tab';
        this.setAttribute('aria-controls', panelId);

        if (panel.hasAttribute('disabled')) {
            this.setAttribute('disabled', '');
        }

        if (panel.classList.contains('active')) {
            this.classList.add('active');
        }
        
        panel.role = 'tabpanel';
        panel.setAttribute('aria-labelledby', this.id);
        if (panel.tabIndex < 0) {
            panel.tabIndex = 0;
        }

        if (!this.hasAttribute('disabled')
            && (this.classList.contains('active')
            || !tabs.querySelector('tf-tab[tabindex="0"]'))) {
            tabs.activate(this.id);
        } else {
            this.classList.remove('active');
            panel.hidden = true;
        }

        this.addEventListener('click', this.onClick.bind(this));
    }

    attributeChangedCallback(name: string, oldValue: string | null | undefined, newValue: string | null | undefined) {
        if (newValue == oldValue) {
            return;
        }
        if (name === 'disabled') {
            const tabIdMatch = TavenemTabPanelHTMLElement.TabIdRE.exec(this.id);
            const tabId = tabIdMatch
                && tabIdMatch.length > 1
                && tabIdMatch[1]
                ? tabIdMatch[1]
                : null;

            if (tabId && tabId.length) {
                const tab = this.querySelector(`#${tabId}`);
                if (tab instanceof HTMLElement) {
                    if (newValue) {
                        tab.setAttribute('disabled', '');
                        if (tab.tabIndex === 0) {
                            const tabs = this.closest('tf-tabs');
                            if (tabs && typeof (tabs as TavenemTabsHTMLElement).activate === 'function') {
                                (tabs as TavenemTabsHTMLElement).activate();
                            }
                        }
                    } else {
                        tab.removeAttribute('disabled');
                    }
                }
            }
        }
    }

    private onClick(event: Event) {
        event.preventDefault();
        event.stopPropagation();

        if (!this.id
            || !this.id.length
            || this.hasAttribute('disabled')) {
            return;
        }

        const tabs = this.closest('tf-tabs');
        if (tabs && typeof (tabs as TavenemTabsHTMLElement).activate === 'function') {
            (tabs as TavenemTabsHTMLElement).activate(this.id);
        }
    }

    private onClose(event: Event) {
        event.preventDefault();
        event.stopPropagation();

        if (!this.id || !this.id.length) {
            return;
        }

        this.dispatchEvent(TavenemTabHTMLElement.newCloseEvent(this.id));

        const tabs = this.closest<TavenemTabsHTMLElement>('tf-tabs');
        if (!tabs) {
            return;
        }

        const panelId = `panel-${this.id}`;

        const panel = tabs.querySelector<TavenemTabPanelHTMLElement>(`#${panelId}`);
        if (!panel) {
            return;
        }

        panel.remove();
        this.remove();
        tabs.activate();
    }
}

export class TavenemTabPanelHTMLElement extends HTMLElement {
    static TabIdRE = /panel-(.+)/;

    static get observedAttributes() {
        return ['disabled'];
    }

    connectedCallback() {
        const shadow = this.attachShadow({ mode: 'open', delegatesFocus: true });

        const slot = document.createElement('slot');
        shadow.appendChild(slot);

        this.configureForTab();
    }

    attributeChangedCallback(name: string, oldValue: string | null | undefined, newValue: string | null | undefined) {
        if (newValue == oldValue) {
            return;
        }
        if (name === 'disabled') {
            const tabIdMatch = TavenemTabPanelHTMLElement.TabIdRE.exec(this.id);
            const tabId = tabIdMatch
                && tabIdMatch.length > 1
                && tabIdMatch[1]
                ? tabIdMatch[1]
                : null;

            if (tabId && tabId.length) {
                const tab = this.querySelector(`#${tabId}`);
                if (tab instanceof Element) {
                    if (newValue) {
                        tab.setAttribute('disabled', '');
                    } else {
                        tab.removeAttribute('disabled');
                    }
                }
            }
        }
    }

    private configureForTab() {
        const tabIdMatch = TavenemTabPanelHTMLElement.TabIdRE.exec(this.id);
        const tabId = tabIdMatch
            && tabIdMatch.length > 1
            && tabIdMatch[1]
            ? tabIdMatch[1]
            : null;

        if (!tabId || !tabId.length) {
            return;
        }

        const tabs = this.closest('tf-tabs');
        if (!tabs) {
            return;
        }

        const tab = tabs.querySelector<TavenemTabHTMLElement>(`#${tabId}`);
        if (tab) {
            tab.configureForPanel();
        } else  {
            this.hidden = true;
            return;
        }
    }
}