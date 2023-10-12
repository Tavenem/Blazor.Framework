import { TavenemHTMLPopoverElement, TavenemPopover } from './tavenem-popover';
import { TavenemProgressCircleHTMLElement, TavenemProgressLinearHTMLElement } from './tavenem-progress';
import { TavenemScrollTopHTMLElement } from './tavenem-scrolltop';

enum ThemePreference {
    Light = 1,
    Dark = 2,
}

interface BlazorEvent extends Event { }

interface BlazorEventMap {
    'enhancedload': BlazorEvent;
}

interface BlazorCustomEventOptions {
    createEventArgs: (event: Event) => any;
}

interface BlazorInstance {
    registerCustomEventType: (name: string, options?: BlazorCustomEventOptions) => void;
}

declare namespace Blazor {
    function addEventListener<K extends keyof BlazorEventMap>(
        type: K,
        listener: (this: MediaQueryList, ev: BlazorEventMap[K]) => any,
        options?: boolean | AddEventListenerOptions): void;
}

namespace Tavenem {
    const themeObserver = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            if (mutation.type === 'attributes'
                && mutation.target instanceof HTMLElement) {
                const theme = mutation.target.getAttribute('data-theme');
                if (theme) {
                    for (const element of document.querySelectorAll('tf-darkmode-toggle')) {
                        if (element instanceof HTMLInputElement) {
                            element.checked = theme === 'dark';
                        }
                    }
                }
            }
        });
    });

    export function initializeTavenemColorScheme() {
        setPreferredTavenemColorScheme();
        if (window.matchMedia) {
            const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
            colorSchemeQuery.addEventListener('change', setPreferredTavenemColorScheme);
        }
        Blazor.addEventListener('enhancedload', () => {
            if (!document.documentElement.getAttribute('data-theme')) {
                setPreferredTavenemColorScheme();
            }
        });
        themeObserver.observe(document.documentElement, { attributes: true });
        //window.addEventListener('load', () => {
        //    const body = document.querySelector("body");
        //    if (body) {
        //        const observer = new MutationObserver(() => {
        //            if (!document.documentElement.getAttribute('data-theme')) {
        //                setPreferredColorScheme();
        //            }
        //        });
        //        observer.observe(body, { childList: true, subtree: true });
        //    }
        //});
        //window.addEventListener('popstate', () => {
        //    setTimeout(() => {
        //        if (!document.documentElement.getAttribute('data-theme')) {
        //            setPreferredColorScheme();
        //        }
        //    }, 40);
        //});
    }

    export function registerTavenemComponents() {
        const icon = customElements.get('tf-icon');
        if (icon) {
            return;
        }

        customElements.define('tf-icon', class extends HTMLElement { });

        customElements.define('tf-close', class extends HTMLElement {
            constructor() { super(); }

            connectedCallback() {
                const shadow = this.attachShadow({ mode: 'open' });

                const icon = document.createElement('svg');
                icon.outerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="1rem" viewBox="0 0 24 24" width="1rem"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';
                shadow.appendChild(icon);

                const auto = this.getAttribute('auto');
                if (auto) {
                    this.addEventListener('click', this.close.bind(this));
                }
            }

            disconnectedCallback() {
                this.removeEventListener('click', this.close.bind(this));
            }

            close() {
                const target = this.closest('[data-can-close]');
                if (target && target instanceof HTMLElement) {
                    target.style.display = 'none';
                }
            }
        });

        customElements.define('tf-drawer-toggle', class extends HTMLInputElement {
            constructor() {
                super();

                this.type = 'checkbox';
            }

            connectedCallback() {
                const shadow = this.attachShadow({ mode: 'open' });

                const slot = document.createElement('slot');
                slot.outerHTML = '<slot name="content"></slot>';
                shadow.appendChild(slot);

                const span = document.createElement('span');
                span.outerHTML = '<span class="btn btn-icon"></span>';
                slot.appendChild(span);

                const icon = document.createElement('tf-icon');
                icon.textContent = 'menu';
                span.appendChild(icon);

                this.addEventListener('change', this.change.bind(this));
            }

            disconnectedCallback() {
                this.removeEventListener('change', this.change.bind(this));
            }

            change() {
                const side = this.getAttribute('data-side');
                if (!side) {
                    return;
                }

                document.documentElement.setAttribute(`data-drawer-${side}`, this.checked.toString());
            }
        });

        customElements.define('tf-darkmode-toggle', class extends HTMLInputElement {
            constructor() {
                super();

                this.type = 'checkbox';
            }

            connectedCallback() {
                this.checked = getPreferredTavenemColorScheme() === ThemePreference.Dark;

                const shadow = this.attachShadow({ mode: 'open' });

                const lightSlot = document.createElement('slot');
                lightSlot.outerHTML = '<slot name="light"></slot>';
                shadow.appendChild(lightSlot);

                const lightSpan = document.createElement('span');
                lightSpan.outerHTML = '<span class="btn btn-icon"></span>';
                lightSlot.appendChild(lightSpan);

                const lightIcon = document.createElement('tf-icon');
                lightIcon.textContent = 'light_mode';
                lightSpan.appendChild(lightIcon);

                const darkSlot = document.createElement('slot');
                darkSlot.outerHTML = '<slot name="dark"></slot>';
                shadow.appendChild(darkSlot);

                const darkSpan = document.createElement('span');
                darkSpan.outerHTML = '<span class="btn btn-icon"></span>';
                darkSlot.appendChild(darkSpan);

                const darkIcon = document.createElement('tf-icon');
                darkIcon.textContent = 'dark_mode';
                darkSpan.appendChild(darkIcon);

                this.addEventListener('change', this.change.bind(this));
            }

            disconnectedCallback() {
                this.removeEventListener('change', this.change.bind(this));
            }

            change() {
                const preferred = getNativeTavenemPreferredColorScheme();

                let newTheme: ThemePreference;
                const local = localStorage.getItem('tavenem-theme');
                if (local) {
                    const theme = parseInt(local);
                    if (theme == ThemePreference.Light
                        || theme == ThemePreference.Dark) {
                        newTheme = theme;
                        if (newTheme != preferred) {
                            localStorage.setItem('tavenem-theme', newTheme.toString());
                        }
                    } else {
                        newTheme = preferred;
                    }
                } else {
                    newTheme = preferred;
                }

                setTavenemColorScheme(newTheme);
            }
        });

        customElements.define('tf-progress-circle', TavenemProgressCircleHTMLElement);

        customElements.define('tf-progress-linear', TavenemProgressLinearHTMLElement);

        customElements.define('tf-scroll-top', TavenemScrollTopHTMLElement);

        customElements.define('tf-drawer-close', class extends HTMLElement {
            constructor() { super(); }

            connectedCallback() {
                const shadow = this.attachShadow({ mode: 'open' });

                const icon = document.createElement('svg');
                icon.outerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="1rem" viewBox="0 0 24 24" width="1rem"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';
                shadow.appendChild(icon);

                this.addEventListener('click', this.closeDrawer.bind(this));
            }

            disconnectedCallback() {
                this.removeEventListener('click', this.closeDrawer.bind(this));
            }

            closeDrawer(event: Event) {
                event.stopPropagation();

                const side = this.getAttribute('data-side');
                if (!side) {
                    return;
                }

                document.documentElement.setAttribute(`data-drawer-${side}`, 'false');
            }
        });

        customElements.define('tf-drawer-overlay', class extends HTMLElement {
            constructor() { super(); }

            connectedCallback() {
                this.addEventListener('click', this.closeDrawer.bind(this));
            }

            disconnectedCallback() {
                this.removeEventListener('click', this.closeDrawer.bind(this));
            }

            closeDrawer(event: Event) {
                event.stopPropagation();

                const side = this.getAttribute('data-side');
                if (!side) {
                    return;
                }

                document.documentElement.setAttribute(`data-drawer-${side}`, 'false');
            }
        });

        customElements.define('tf-popover', TavenemHTMLPopoverElement);
    }

    function getNativeTavenemPreferredColorScheme(): ThemePreference {
        if (window.matchMedia) {
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                return ThemePreference.Dark;
            } else {
                return ThemePreference.Light;
            }
        }

        return ThemePreference.Light;
    }

    function getPreferredTavenemColorScheme(): ThemePreference {
        const local = localStorage.getItem('tavenem-theme');
        if (local) {
            const theme = parseInt(local);
            if (theme == ThemePreference.Light
                || theme == ThemePreference.Dark) {
                return theme;
            }
        }

        return getNativeTavenemPreferredColorScheme();
    }

    function setPreferredTavenemColorScheme() {
        setTavenemColorScheme(getPreferredTavenemColorScheme());
    }

    function setTavenemColorScheme(theme: ThemePreference) {
        if (theme == ThemePreference.Dark) {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
        }

        if (theme == getNativeTavenemPreferredColorScheme()) {
            localStorage.removeItem('tavenem-theme');
        }

        return;
    }
}

export function beforeStart() {
    Tavenem.registerTavenemComponents();
    Tavenem.initializeTavenemColorScheme();
    TavenemPopover.initialize();
}

export function afterStarted(blazor: BlazorInstance) {
    blazor.registerCustomEventType('focuslost');
}