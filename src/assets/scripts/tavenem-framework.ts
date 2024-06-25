import { TavenemAccordionHTMLElement } from './_accordion';
import { TavenemCheckboxHtmlElement } from './_checkbox';
import { TavenemContentsHTMLElement } from './_contents';
import {
    TavenemEmojiHTMLElement,
    TavenemEmojiPickerHTMLElement,
} from './_emoji';
import { TavenemHighlightHTMLElement } from './_highlight';
import {
    TavenemDropdownHTMLElement,
    TavenemPopoverHTMLElement,
    TavenemPopover,
    TavenemTooltipHTMLElement
} from './_popover';
import { TavenemInputHtmlElement } from './_input';
import { TavenemInputFieldHtmlElement } from './_input-field';
import { TavenemNumericInputHtmlElement } from './_numeric-input';
import { TavenemPickerHtmlElement } from './_picker';
import { TavenemSelectInputHtmlElement } from './_select';
import { TavenemColorInputHtmlElement } from './_color-input';
import { TavenemDateTimeInputHtmlElement } from './_datetime';
import { TavenemEditorHtmlElement } from './editor/_editor';
import {
    TavenemProgressCircleHTMLElement,
    TavenemProgressLinearHTMLElement
} from './_progress';
import { TavenemScrollTopHTMLElement } from './_scrolltop';
import { TavenemSliderHTMLElement } from './_slider';
import {
    TavenemTabHTMLElement,
    TavenemTabPanelHTMLElement,
    TavenemTabsHTMLElement,
} from './_tabs';
import {
    getNativePreferredColorScheme,
    getPreferredTavenemColorScheme,
    ThemePreference,
} from './_theme';

interface BlazorEvent extends Event { }

interface BlazorEventMap {
    'enhancedload': BlazorEvent;
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
                const theme = mutation.target.dataset.theme;
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

    export function initialize() {
        registerTavenemComponents();
        initializeTavenemColorScheme();
        TavenemPopover.initialize();
    }

    function initializeTavenemColorScheme() {
        setPreferredTavenemColorScheme();
        if (window.matchMedia) {
            const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
            colorSchemeQuery.addEventListener('change', setPreferredTavenemColorScheme);
        }
        Blazor.addEventListener('enhancedload', () => {
            if (!('theme' in document.documentElement.dataset)) {
                setPreferredTavenemColorScheme();
            }
        });
        themeObserver.observe(document.documentElement, { attributes: true });
    }

    function registerTavenemComponents() {
        const icon = customElements.get('tf-icon');
        if (icon) {
            return;
        }

        customElements.define('tf-icon', class extends HTMLElement { });

        customElements.define('tf-progress-circle', TavenemProgressCircleHTMLElement);

        customElements.define('tf-progress-linear', TavenemProgressLinearHTMLElement);

        customElements.define('tf-close', class extends HTMLElement {
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
        });

        customElements.define('tf-accordion', TavenemAccordionHTMLElement);

        customElements.define('tf-checkbox', TavenemCheckboxHtmlElement);

        customElements.define('tf-contents', TavenemContentsHTMLElement);

        customElements.define('tf-drawer-toggle', class extends HTMLElement {
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
        });

        customElements.define('tf-darkmode-toggle', class extends HTMLElement {
            private _mutationObserver: MutationObserver;

            constructor() {
                super();

                this._mutationObserver = new MutationObserver(mutations => {
                    for (const mutation of mutations) {
                        if (mutation.type === 'attributes'
                            && mutation.target instanceof HTMLElement) {
                            setDarkmodeToggles(mutation.target.dataset.theme);
                        }
                    }
                });
            }

            connectedCallback() {
                const shadow = this.attachShadow({ mode: 'open' });

                const mode = document.documentElement.dataset.theme;
                if (mode) {
                    this.dataset.theme = mode;
                }

                const style = document.createElement('style');
                style.textContent = `:host {
    cursor: pointer;
}

@media print {
    :host {
        display: none;
    }
}

slot[name=dark] {
    display: none;
}

:host([data-theme="dark"]) slot[name=dark] {
    display: initial;
}

:host([data-theme="dark"]) slot[name=light] {
    display: none;
}

slot button {
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

    slot button:after {
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

    slot button:active:after {
        transform: scale(0,0);
        opacity: .1;
        transition: 0s;
    }

    slot button::-moz-focus-inner {
        border-style: none;
    }

    slot button:hover,
    slot button:focus-visible {
        background-color: var(--tavenem-color-action-hover-bg);
    }`;
                shadow.appendChild(style);

                const lightSlot = document.createElement('slot');
                lightSlot.name = "light";
                shadow.appendChild(lightSlot);

                const lightButton = document.createElement('button');
                lightSlot.appendChild(lightButton);

                const lightIcon = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
                lightIcon.setAttributeNS(null, 'viewBox', '0 0 24 24');
                lightIcon.setAttributeNS(null, 'height', '1.5rem');
                lightIcon.setAttributeNS(null, 'width', '1.5rem');
                lightIcon.setAttributeNS(null, 'fill', 'currentColor');
                lightIcon.innerHTML = '<path d="M12,7c-2.76,0-5,2.24-5,5s2.24,5,5,5s5-2.24,5-5S14.76,7,12,7L12,7z M2,13l2,0c0.55,0,1-0.45,1-1s-0.45-1-1-1l-2,0 c-0.55,0-1,0.45-1,1S1.45,13,2,13z M20,13l2,0c0.55,0,1-0.45,1-1s-0.45-1-1-1l-2,0c-0.55,0-1,0.45-1,1S19.45,13,20,13z M11,2v2 c0,0.55,0.45,1,1,1s1-0.45,1-1V2c0-0.55-0.45-1-1-1S11,1.45,11,2z M11,20v2c0,0.55,0.45,1,1,1s1-0.45,1-1v-2c0-0.55-0.45-1-1-1 C11.45,19,11,19.45,11,20z M5.99,4.58c-0.39-0.39-1.03-0.39-1.41,0c-0.39,0.39-0.39,1.03,0,1.41l1.06,1.06 c0.39,0.39,1.03,0.39,1.41,0s0.39-1.03,0-1.41L5.99,4.58z M18.36,16.95c-0.39-0.39-1.03-0.39-1.41,0c-0.39,0.39-0.39,1.03,0,1.41 l1.06,1.06c0.39,0.39,1.03,0.39,1.41,0c0.39-0.39,0.39-1.03,0-1.41L18.36,16.95z M19.42,5.99c0.39-0.39,0.39-1.03,0-1.41 c-0.39-0.39-1.03-0.39-1.41,0l-1.06,1.06c-0.39,0.39-0.39,1.03,0,1.41s1.03,0.39,1.41,0L19.42,5.99z M7.05,18.36 c0.39-0.39,0.39-1.03,0-1.41c-0.39-0.39-1.03-0.39-1.41,0l-1.06,1.06c-0.39,0.39-0.39,1.03,0,1.41s1.03,0.39,1.41,0L7.05,18.36z"/>';
                lightButton.appendChild(lightIcon);

                const darkSlot = document.createElement('slot');
                darkSlot.name = "dark";
                shadow.appendChild(darkSlot);

                const darkButton = document.createElement('button');
                darkSlot.appendChild(darkButton);

                const darkIcon = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
                darkIcon.setAttributeNS(null, 'viewBox', '0 0 24 24');
                darkIcon.setAttributeNS(null, 'height', '1.5rem');
                darkIcon.setAttributeNS(null, 'width', '1.5rem');
                darkIcon.setAttributeNS(null, 'fill', 'currentColor');
                darkIcon.innerHTML = '<path d="M12,3c-4.97,0-9,4.03-9,9s4.03,9,9,9s9-4.03,9-9c0-0.46-0.04-0.92-0.1-1.36c-0.98,1.37-2.58,2.26-4.4,2.26 c-2.98,0-5.4-2.42-5.4-5.4c0-1.81,0.89-3.42,2.26-4.4C12.92,3.04,12.46,3,12,3L12,3z"/>';
                darkButton.appendChild(darkIcon);

                this.addEventListener('click', this.change.bind(this));
                this._mutationObserver.observe(document.documentElement, { attributes: true });
            }

            disconnectedCallback() {
                this.removeEventListener('click', this.change.bind(this));
            }

            private change() {
                const preferred = getNativePreferredColorScheme();

                let newTheme: ThemePreference;
                const local = localStorage.getItem('tavenem-theme');
                if (local) {
                    const theme = parseInt(local);
                    if (theme == ThemePreference.Light) {
                        newTheme = ThemePreference.Dark;
                        if (newTheme != preferred) {
                            localStorage.setItem('tavenem-theme', newTheme.toString());
                        }
                    } else if (theme == ThemePreference.Dark) {
                        newTheme = ThemePreference.Light;
                        if (newTheme != preferred) {
                            localStorage.setItem('tavenem-theme', newTheme.toString());
                        }
                    } else {
                        newTheme = preferred;
                    }
                } else if (preferred == ThemePreference.Dark) {
                    newTheme = ThemePreference.Light;
                } else {
                    newTheme = ThemePreference.Dark;
                }

                setTavenemColorScheme(newTheme);
            }
        });

        customElements.define('tf-drawer-close', class extends HTMLElement {
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
                icon.setAttributeNS(null, 'viewBox', "0 0 24 24");
                icon.setAttributeNS(null, 'height', "1rem");
                icon.setAttributeNS(null, 'width', "1rem");
                icon.innerHTML = '<path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>';
                shadow.appendChild(icon);

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
        });

        customElements.define('tf-drawer-overlay', class extends HTMLElement {
            connectedCallback() {
                const shadow = this.attachShadow({ mode: 'open' });

                const style = document.createElement('style');
                style.textContent = `:host {
    display: none;
}`;
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
        });

        customElements.define('tf-scroll-top', TavenemScrollTopHTMLElement);

        customElements.define('tf-input', TavenemInputHtmlElement);

        customElements.define('tf-input-field', TavenemInputFieldHtmlElement);

        customElements.define('tf-numeric-input', TavenemNumericInputHtmlElement);

        customElements.define('tf-popover', TavenemPopoverHTMLElement);

        customElements.define('tf-tooltip', TavenemTooltipHTMLElement);

        customElements.define('tf-dropdown', TavenemDropdownHTMLElement);

        customElements.define('tf-picker', TavenemPickerHtmlElement);

        customElements.define('tf-select', TavenemSelectInputHtmlElement);

        customElements.define('tf-color-input', TavenemColorInputHtmlElement);

        customElements.define('tf-datetime-input', TavenemDateTimeInputHtmlElement);

        customElements.define('tf-emoji', TavenemEmojiHTMLElement);

        customElements.define('tf-emoji-input', TavenemEmojiPickerHTMLElement);

        customElements.define('tf-editor', TavenemEditorHtmlElement);

        customElements.define('tf-slider', TavenemSliderHTMLElement);

        customElements.define('tf-syntax-highlight', TavenemHighlightHTMLElement);

        customElements.define('tf-tab', TavenemTabHTMLElement);

        customElements.define('tf-tabpanel', TavenemTabPanelHTMLElement);

        customElements.define('tf-tabs', TavenemTabsHTMLElement);
    }

    function setDarkmodeToggles(mode: string | null | undefined) {
        if (!mode) {
            return;
        }

        document.querySelectorAll('tf-darkmode-toggle').forEach(toggle => {
            toggle.setAttribute('data-theme', mode);
        });
    }

    function setPreferredTavenemColorScheme() {
        setTavenemColorScheme(getPreferredTavenemColorScheme());
    }

    function setTavenemColorScheme(theme: ThemePreference) {
        if (theme == ThemePreference.Dark) {
            document.documentElement.dataset.theme = 'dark';
        } else {
            document.documentElement.dataset.theme = 'light';
        }

        if (theme == getNativePreferredColorScheme()) {
            localStorage.removeItem('tavenem-theme');
        } else {
            localStorage.setItem('tavenem-theme', theme.toString());
        }

        return;
    }
}

Tavenem.initialize();