import { TavenemAccordionHTMLElement } from './components/_accordion';
import { TavenemCheckboxHtmlElement } from './components/_checkbox';
import { TavenemContentsHTMLElement } from './components/_contents';
import {
    TavenemEmojiHTMLElement,
    TavenemEmojiPickerHTMLElement,
} from './components/_emoji';
import { TavenemHighlightHTMLElement } from './components/_highlight';
import {
    TavenemDropdownHTMLElement,
    TavenemPopoverHTMLElement,
    TavenemPopover,
    TavenemTooltipHTMLElement
} from './components/_popover';
import { TavenemInputHtmlElement } from './components/_input';
import { TavenemInputFieldHtmlElement } from './components/_input-field';
import { TavenemNumericInputHtmlElement } from './components/_numeric-input';
import { TavenemPickerHtmlElement } from './components/_picker';
import { TavenemSelectInputHtmlElement } from './components/_select';
import { TavenemColorInputHtmlElement } from './components/color-input/_color-input';
import { TavenemDateTimeInputHtmlElement } from './components/datetime/_datetime';
import { TavenemEditorHtmlElement } from './components/editor/_editor';
import {
    TavenemProgressCircleHTMLElement,
    TavenemProgressLinearHTMLElement
} from './components/_progress';
import { TavenemScrollTopHTMLElement } from './components/_scrolltop';
import { TavenemSliderHTMLElement } from './components/_slider';
import {
    TavenemTabHTMLElement,
    TavenemTabPanelHTMLElement,
    TavenemTabsHTMLElement,
} from './components/_tabs';
import { setPreferredTavenemColorScheme } from './_theme';
import { TavenemImageEditorHtmlElement } from './components/image-editor/_image-editor-element';
import { TavenemCloseButtonHtmlElement } from './components/_close-button';
import { TavenemDrawerToggleHtmlElement } from './components/drawer/_drawer-toggle';
import { TavenemDarkModeToggleHtmlElement } from './components/_darkmode-toggle';
import { TavenemDrawerCloseButtonHtmlElement } from './components/drawer/_drawer-close-button';
import { TavenemDrawerOverlayHtmlElement } from './components/drawer/_drawer-overlay';
import { TavenemPaginationHtmlElement } from './components/_pagination';
import { TavenemSwitchHtmlElement } from './components/_switch';

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
        initializeTavenemColorScheme();
        registerTavenemComponents();
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

        customElements.define('tf-close', TavenemCloseButtonHtmlElement);

        customElements.define('tf-accordion', TavenemAccordionHTMLElement);

        customElements.define('tf-checkbox', TavenemCheckboxHtmlElement);

        customElements.define('tf-contents', TavenemContentsHTMLElement);

        customElements.define('tf-drawer-toggle', TavenemDrawerToggleHtmlElement);

        customElements.define('tf-darkmode-toggle', TavenemDarkModeToggleHtmlElement);

        customElements.define('tf-drawer-close', TavenemDrawerCloseButtonHtmlElement);

        customElements.define('tf-drawer-overlay', TavenemDrawerOverlayHtmlElement);

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

        customElements.define('tf-image-editor', TavenemImageEditorHtmlElement);

        customElements.define('tf-pagination', TavenemPaginationHtmlElement);

        customElements.define('tf-slider', TavenemSliderHTMLElement);

        customElements.define('tf-switch', TavenemSwitchHtmlElement);

        customElements.define('tf-syntax-highlight', TavenemHighlightHTMLElement);

        customElements.define('tf-tab', TavenemTabHTMLElement);

        customElements.define('tf-tabpanel', TavenemTabPanelHTMLElement);

        customElements.define('tf-tabs', TavenemTabsHTMLElement);
    }
}

Tavenem.initialize();