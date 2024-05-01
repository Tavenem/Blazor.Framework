import { TavenemInputHtmlElement } from './_input'
import { TavenemPickerHtmlElement } from './_picker'

export class TavenemSelectInputHtmlElement extends TavenemPickerHtmlElement {
    static get observedAttributes() {
        return ['disabled', 'readonly', 'value'];
    }

    private static newSearchInputEvent(value: string) {
        return new CustomEvent('searchinput', { bubbles: true, composed: true, detail: { value: value } });
    }

    connectedCallback() {
        const shadow = this.attachShadow({ mode: 'open' });

        const style = document.createElement('style');
        style.textContent = `:host {
    position: relative;
}

slot {
    border-radius: inherit;
}
`;
        shadow.appendChild(style);

        const slot = document.createElement('slot');
        shadow.appendChild(slot);

        if (this.hasAttribute('value')) {
            const value = this.getAttribute('value');
            if (value && value.length) {
                this.onSetValue(value);
            }
        }

        this.addEventListener('focuslost', this.onPopoverFocusLost.bind(this));
        this.addEventListener('mousedown', this.onMouseDown.bind(this));
        this.addEventListener('mouseup', this.onMouseUp.bind(this));
        this.addEventListener('keyup', this.onKeyUp.bind(this));
        this.addEventListener('valueinput', this.onValueInput.bind(this));
        this.addEventListener('valuechange', this.onValueChange.bind(this));

        document.addEventListener('mousedown', this.onDocMouseDown.bind(this));
    }

    disconnectedCallback() {
        clearTimeout(this._hideTimer);
        this.removeEventListener('focuslost', this.onPopoverFocusLost.bind(this));
        this.removeEventListener('mousedown', this.onMouseDown.bind(this));
        this.removeEventListener('mouseup', this.onMouseUp.bind(this));
        this.removeEventListener('keyup', this.onKeyUp.bind(this));
        this.removeEventListener('valueinput', this.onValueInput.bind(this));
        this.removeEventListener('valuechange', this.onValueChange.bind(this));
        document.removeEventListener('mousedown', this.onDocMouseDown.bind(this));
    }

    attributeChangedCallback(name: string, oldValue: string | null | undefined, newValue: string | null | undefined) {
        if ((name === 'disabled'
            || name === 'readonly')
            && newValue) {
            this.setOpen(false);
        } else if (name === 'value'
            && newValue) {
            this.onSubmitValue(newValue);
        }
    }

    protected clear() {
        let input = this.querySelector('.picker-value');
        if (!input && this.shadowRoot) {
            input = this.shadowRoot.querySelector('.picker-value');
        }
        if (input instanceof HTMLInputElement
            || input instanceof TavenemInputHtmlElement) {
            input.value = '';
        }

        this.querySelectorAll('option, [data-close-picker-value], [data-picker-select-all]')
            .forEach(x => x.classList.remove('active'));
        if (this.shadowRoot) {
            this.shadowRoot.querySelectorAll('option, [data-close-picker-value], [data-picker-select-all]')
                .forEach(x => x.classList.remove('active'));
        }
    }

    protected onArrowDown(event: KeyboardEvent) {
        if (!event.target) {
            return;
        }
        if (event.target !== this) {
            let popover = this.querySelector('tf-popover.contained-popover');
            if (!popover && this.shadowRoot) {
                popover = this.shadowRoot.querySelector('tf-popover.contained-popover');
            }
            if (popover
                && event.target instanceof Node
                && popover.contains(event.target)) {
                if (!('popoverOpen' in this.dataset)) {
                    return;
                }
            }
        }

        const selectedIndices = this.getSelectedIndices();
        if (!selectedIndices.options
            || (selectedIndices.lastSelectedIndex != null
                && selectedIndices.lastSelectedIndex >= selectedIndices.options.length - 1)) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        let newOption = selectedIndices.options[(selectedIndices.lastSelectedIndex || -1) + 1];

        let input = this.querySelector('.picker-value');
        if (!input && this.shadowRoot) {
            input = this.shadowRoot.querySelector('.picker-value');
        }
        if (input instanceof HTMLInputElement
            || input instanceof TavenemInputHtmlElement) {
            const currentOption = selectedIndices.options[(selectedIndices.lastSelectedIndex || 0)];
            let currentOptionValue;
            if (!('pickerSelectAll' in currentOption.dataset)) {
                if ('closePickerValue' in currentOption.dataset) {
                    currentOptionValue = currentOption.dataset.closePickerValue;
                } else if (currentOption instanceof HTMLOptionElement) {
                    currentOptionValue = currentOption.value;
                    if ((!currentOptionValue || !currentOptionValue.length)
                        && currentOption.innerText
                        && currentOption.innerText.length) {
                        currentOptionValue = currentOption.innerText;
                    }
                }
            }
            if (input.value.toLowerCase() != (currentOptionValue || '').toLowerCase()) {
                newOption = currentOption;
            }
        }

        this.onSubmitOption(newOption);
    }

    protected onArrowUp(event: KeyboardEvent) {
        if (!event.target) {
            return;
        }
        if (event.target !== this) {
            let popover = this.querySelector('tf-popover.contained-popover');
            if (!popover && this.shadowRoot) {
                popover = this.shadowRoot.querySelector('tf-popover.contained-popover');
            }
            if (popover
                && event.target instanceof Node
                && popover.contains(event.target)) {
                if (!('popoverOpen' in this.dataset)) {
                    return;
                }
            }
        }

        const selectedIndices = this.getSelectedIndices();
        if (!selectedIndices.options
            || (selectedIndices.firstSelectedIndex != null
                && selectedIndices.firstSelectedIndex <= 0)) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        let newOption = selectedIndices.options[(selectedIndices.lastSelectedIndex || -1) - 1];

        let input = this.querySelector('.picker-value');
        if (!input && this.shadowRoot) {
            input = this.shadowRoot.querySelector('.picker-value');
        }
        if (input instanceof HTMLInputElement
            || input instanceof TavenemInputHtmlElement) {
            const currentOption = selectedIndices.options[(selectedIndices.lastSelectedIndex || 0)];
            let currentOptionValue;
            if (!('pickerSelectAll' in currentOption.dataset)) {
                if ('closePickerValue' in currentOption.dataset) {
                    currentOptionValue = currentOption.dataset.closePickerValue;
                } else if (currentOption instanceof HTMLOptionElement) {
                    currentOptionValue = currentOption.value;
                    if ((!currentOptionValue || !currentOptionValue.length)
                        && currentOption.innerText
                        && currentOption.innerText.length) {
                        currentOptionValue = currentOption.innerText;
                    }
                }
            }
            if (input.value.toLowerCase() != (currentOptionValue || '').toLowerCase()) {
                newOption = currentOption;
            }
        }

        this.onSubmitOption(newOption);
    }

    protected onOpening() {
        if ('searchFilter' in this.dataset) {
            this.clearSearchFilter();
        }
    }

    protected onSearchInput(event: KeyboardEvent) {
        if (!event.target) {
            return;
        }

        let input = this.querySelector('.picker-value');
        if (!input && this.shadowRoot) {
            input = this.shadowRoot.querySelector('.picker-value');
        }
        if (event.target === input
            && (input instanceof HTMLInputElement
                || input instanceof TavenemInputHtmlElement)) {
            return;
        }

        if (event.target !== this) {
            let popover = this.querySelector('tf-popover.contained-popover');
            if (!popover && this.shadowRoot) {
                popover = this.shadowRoot.querySelector('tf-popover.contained-popover');
            }
            if (popover
                && event.target instanceof Node
                && popover.contains(event.target)
                && !('popoverOpen' in this.dataset)) {
                return;
            }
        }

        clearTimeout(this._searchTimer);

        if (this._searchText) {
            if (event.key === "Delete" || event.key === "Clear") {
                this._searchText = null;
            } else if (event.key === "Backspace") {
                if (this._searchText.length > 1) {
                    this._searchText = this._searchText.substring(0, this._searchText.length - 1);
                } else {
                    this._searchText = null;
                }
            } else {
                this._searchText += event.key.toLowerCase();
            }
        } else if (event.key !== "Delete"
            && event.key !== "Backspace"
            && event.key !== "Clear") {
            this._searchText = event.key.toLowerCase();
        }

        if (!this._searchText || !this._searchText.length) {
            return;
        }

        this.onValueInput(event);

        this._searchTimer = setTimeout(() => this._searchText = null, 2000);
    }

    protected onSelectAll(event: Event) {
        if (!event.target) {
            return;
        }
        if (event.target !== this) {
            let popover = this.querySelector('tf-popover.contained-popover');
            if (!popover && this.shadowRoot) {
                popover = this.shadowRoot.querySelector('tf-popover.contained-popover');
            }
            if (popover
                && event.target instanceof Node
                && popover.contains(event.target)) {
                if (!('popoverOpen' in this.dataset)) {
                    return;
                }
            }
        }

        event.preventDefault();
        event.stopPropagation();

        this.selectAll(false);
    }

    protected onSubmitOption(element: HTMLElement | SVGElement) {
        if ('pickerSelectAll' in element.dataset) {
            this.selectAll(true);
            return;
        }

        if ('closePickerValue' in element.dataset) {
            if (!element.hasAttribute('disabled')) {
                this.onSubmitValue(
                    element.dataset.closePickerValue || '',
                    element.dataset.closePickerDisplay);
                return;
            }
        }

        if (element instanceof HTMLOptionElement
            && !element.disabled) {
            let value = element.value;
            if ((!value || !value.length)
                && element.innerText
                && element.innerText.length) {
                value = element.innerText;
            }

            let display: string | null = element.label;
            if (!display || !display.length) {
                display = element.value;
            }
            if (!display || !display.length) {
                display = element.innerText;
            }
            if (display && !display.length) {
                display = null;
            }
            this.onSubmitValue(value, display);
        }
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

    private clearSearchFilter() {
        let options = Array
            .from(this.querySelectorAll('option, [data-close-picker-value]'))
            .sort(TavenemSelectInputHtmlElement.documentPositionComparator);
        if (!options.length && this.shadowRoot) {
            options = Array
                .from(this.shadowRoot.querySelectorAll('option, [data-close-picker-value]'))
                .sort(TavenemSelectInputHtmlElement.documentPositionComparator);
            if (!options.length) {
                return;
            }
        }
        for (var option of options) {
            if (!(option instanceof HTMLElement)) {
                continue;
            }
            option.classList.remove('search-nonmatch');
        }
    }

    private getSelectedIndices(): {
        options?: HTMLElement[],
        firstSelectedIndex?: number,
        lastSelectedIndex?: number
    } {
        let value: string | undefined;
        let input = this.querySelector('.picker-value');
        if (!input && this.shadowRoot) {
            input = this.shadowRoot.querySelector('.picker-value');
        }
        if (input
            && (input instanceof HTMLInputElement
                || input instanceof TavenemInputHtmlElement)) {
            value = input.value;
        }
        if (!value) {
            return {};
        }

        let options = Array
            .from(this.querySelectorAll('option, [data-close-picker-value]'))
            .filter<HTMLElement>((x): x is HTMLElement => x instanceof HTMLElement)
            .sort(TavenemSelectInputHtmlElement.documentPositionComparator);
        if (!options.length && this.shadowRoot) {
            options = Array
                .from(this.shadowRoot.querySelectorAll('option, [data-close-picker-value]'))
                .filter<HTMLElement>((x): x is HTMLElement => x instanceof HTMLElement)
                .sort(TavenemSelectInputHtmlElement.documentPositionComparator);
        }
        if (!options.length) {
            return {};
        }
        let firstSelectedIndex: number | undefined;
        let lastSelectedIndex: number | undefined;
        for (var i = 0; i < options.length; i++) {
            const option = options[i];
            if ('pickerSelectAll' in option.dataset) {
                continue;
            }
            if ('closePickerValue' in option.dataset) {
                if (option.dataset.closePickerValue === value) {
                    if (firstSelectedIndex == null) {
                        firstSelectedIndex = i;
                    }
                    lastSelectedIndex = i;
                }
            } else if (option instanceof HTMLOptionElement
                && option.value === value) {
                if (firstSelectedIndex == null) {
                    firstSelectedIndex = i;
                }
                lastSelectedIndex = i;
            }
        }

        if (firstSelectedIndex == null) {
            for (var i = 0; i < options.length; i++) {
                const option = options[i];
                if (option instanceof HTMLElement
                    && option.classList.contains('active')) {
                    if (firstSelectedIndex == null) {
                        firstSelectedIndex = i;
                    }
                    lastSelectedIndex = i;
                }
            }
        }

        return {
            options,
            firstSelectedIndex,
            lastSelectedIndex
        };
    }

    protected onValueInput(event: Event) {
        if (!event.target
            || !(event instanceof CustomEvent)
            || !event.detail) {
            return;
        }

        let searchText = this._searchText;
        let input = this.querySelector('.picker-value');
        if (!input && this.shadowRoot) {
            input = this.shadowRoot.querySelector('.picker-value');
        }
        if (event.target !== input) {
            return;
        }

        searchText = event.detail.value.toLowerCase();

        if (input instanceof TavenemInputHtmlElement) {
            input.suggestion = null;
        }

        let options = Array
            .from(this.querySelectorAll('option, [data-close-picker-value]'))
            .filter<HTMLElement>((x): x is HTMLElement => x instanceof HTMLElement)
            .sort(TavenemSelectInputHtmlElement.documentPositionComparator);
        if (!options.length && this.shadowRoot) {
            options = Array
                .from(this.shadowRoot.querySelectorAll('option, [data-close-picker-value]'))
                .filter<HTMLElement>((x): x is HTMLElement => x instanceof HTMLElement)
                .sort(TavenemSelectInputHtmlElement.documentPositionComparator);
            if (!options.length) {
                return;
            }
        }

        if (!searchText || !searchText.length) {
            for (var option of options) {
                if (option instanceof HTMLElement) {
                    option.classList.remove('search-nonmatch');
                }
            }
            return;
        }

        let match;
        if (searchText.length === 1) {
            for (var option of options) {
                if ('pickerSelectAll' in option.dataset) {
                    continue;
                }

                if ('closePickerValue' in option.dataset) {
                    if (!option.hasAttribute('disabled')
                        && (('closePickerDisplay' in option.dataset
                            && option.dataset.closePickerDisplay
                            && option.dataset.closePickerDisplay.toLowerCase().startsWith(searchText))
                            || (!('closePickerDisplay' in option.dataset)
                                && option.dataset.closePickerValue
                                && option.dataset.closePickerValue.toLowerCase().startsWith(searchText)))) {
                        if (!match) {
                            match = option;
                        }
                    }
                } else if (option instanceof HTMLOptionElement
                    && !option.disabled
                    && (option.label.startsWith(searchText)
                        || (!option.label
                            && option.textContent
                            && option.textContent.toLowerCase().startsWith(searchText))
                        || (!option.label
                            && !option.textContent
                            && option.value.toLowerCase().startsWith(searchText)))) {
                    if (!match) {
                        match = option;
                    }
                }
            }
        }

        for (var option of options) {
            if ('pickerSelectAll' in option.dataset) {
                continue;
            }

            if ('closePickerValue' in option.dataset) {
                if (!option.hasAttribute('disabled')
                    && (('closePickerDisplay' in option.dataset
                        && option.dataset.closePickerDisplay
                        && option.dataset.closePickerDisplay.toLowerCase().includes(searchText))
                        || (!('closePickerDisplay' in option.dataset)
                            && option.dataset.closePickerValue
                            && option.dataset.closePickerValue.toLowerCase().includes(searchText)))) {
                    if (!match) {
                        match = option;
                    }
                    option.classList.remove('search-nonmatch');
                } else if ('searchFilter' in this.dataset) {
                    option.classList.remove('active');
                    option.classList.add('search-nonmatch');
                }
            } else if (option instanceof HTMLOptionElement
                && !option.disabled
                && (option.label.includes(searchText)
                    || (!option.label
                        && option.textContent
                        && option.textContent.toLowerCase().includes(searchText))
                    || (!option.label
                        && !option.textContent
                        && option.value.toLowerCase().includes(searchText)))) {
                if (!match) {
                    match = option;
                }
                option.classList.remove('search-nonmatch');
            } else if ('searchFilter' in this.dataset) {
                option.classList.remove('active');
                option.classList.add('search-nonmatch');
            }
        }

        if (!match) {
            this.dispatchEvent(TavenemSelectInputHtmlElement.newSearchInputEvent(searchText));
            return;
        }

        if (!('popoverOpen' in this.dataset)) {
            if (!this.hasAttribute('disabled')
                && !this.hasAttribute('readonly')) {
                this.open();
            }

            if ('disableAutosearch' in this.dataset) {
                return;
            }
        }

        let value: string;
        let display: string | null | undefined;
        if ('closePickerValue' in match.dataset) {
            value = match.dataset.closePickerValue || '';
            display = match.dataset.closePickerDisplay;
        } else if (match instanceof HTMLOptionElement) {
            value = match.value;
            display = match.label || match.textContent;
        } else {
            return;
        }

        if (input instanceof TavenemInputHtmlElement) {
            const current: string = input.display || event.detail.value;
            const suggestionDisplay = display || value;
            if (suggestionDisplay.toLowerCase().startsWith(current.toLowerCase())
                && suggestionDisplay.length > current.length) {
                input.suggestion = current + suggestionDisplay.substring(current.length);
                if (!suggestionDisplay.startsWith(current)) {
                    input.suggestionDisplay = suggestionDisplay;
                }
                if (display && display.length) {
                    input.suggestionValue = value;
                }
            }
        }

        if ('disableAutosearch' in this.dataset) {
            for (var i = 0; i < options.length; i++) {
                const option = options[i];
                if ('pickerSelectAll' in option.dataset) {
                    continue;
                }
                if ('closePickerValue' in option.dataset) {
                    if (option.dataset.closePickerValue === value) {
                        option.classList.add('active');
                    } else {
                        option.classList.remove('active');
                    }
                } else if (option instanceof HTMLOptionElement) {
                    if (option.value === value) {
                        option.classList.add('active');
                    } else {
                        option.classList.remove('active');
                    }
                }
            }
        } else {
            event.preventDefault();
            event.stopPropagation();

            if ('popoverOpen' in this.dataset) {
                match.focus();
                match.scrollIntoView({ behavior: 'smooth' });
            }

            this.onSubmitValue(value, display);
        }
    }

    private onSetValue(value?: string, display?: string | null) {
        if (!value) {
            return;
        }

        if (this.hasAttribute('multiple')) {
            this.onSetValueForMultiple(value);
            return;
        }

        let input = this.querySelector('.picker-value');
        if (!input && this.shadowRoot) {
            input = this.shadowRoot.querySelector('.picker-value');
        }

        if (input instanceof HTMLInputElement
            || input instanceof TavenemInputHtmlElement) {
            input.value = value;
        }

        if (display && input instanceof TavenemInputHtmlElement) {
            input.display = display;
        }

        let useShadowOptions = false;
        let options = Array
            .from(this.querySelectorAll('option, [data-close-picker-value]'))
            .filter<HTMLElement>((x): x is HTMLElement => x instanceof HTMLElement);
        if (!options.length && this.shadowRoot) {
            useShadowOptions = true;
            options = Array
                .from(this.shadowRoot.querySelectorAll('option, [data-close-picker-value]'))
                .filter<HTMLElement>((x): x is HTMLElement => x instanceof HTMLElement);
        }
        let anyNotSelected = false;
        for (var i = 0; i < options.length; i++) {
            const option = options[i];
            if ('pickerSelectAll' in option.dataset) {
                continue;
            }
            if ('closePickerValue' in option.dataset) {
                if (option.dataset.closePickerValue === value) {
                    option.classList.add('active');
                    if (!display
                        && 'closePickerDisplay' in option.dataset
                        && option.dataset.closePickerDisplay
                        && option.dataset.closePickerDisplay.length
                        && input instanceof TavenemInputHtmlElement) {
                        input.display = option.dataset.closePickerDisplay;
                    }
                } else {
                    anyNotSelected = true;
                    option.classList.remove('active');
                }
            } else if (option instanceof HTMLOptionElement) {
                if (option.value === value) {
                    option.classList.add('active');
                    if (!display
                        && 'closePickerDisplay' in option.dataset
                        && option.dataset.closePickerDisplay
                        && option.dataset.closePickerDisplay.length
                        && input instanceof TavenemInputHtmlElement) {
                        input.display = option.dataset.closePickerDisplay;
                    }
                } else {
                    anyNotSelected = true;
                    option.classList.remove('active');
                }
            }
        }

        const selectAllOptions = Array
            .from((useShadowOptions ? this.shadowRoot! : this).querySelectorAll('[data-picker-select-all]'))
            .filter<HTMLElement>((x): x is HTMLElement => x instanceof HTMLElement);
        for (var i = 0; i < selectAllOptions.length; i++) {
            if (anyNotSelected) {
                selectAllOptions[i].classList.remove('active');
            } else {
                selectAllOptions[i].classList.add('active');
            }
        }
    }

    private onSetValueForMultiple(value: string, display?: string | null) {
        let currentValue: string | string[] | undefined;
        let useShadow = false;
        let input = this.querySelector('.picker-value');
        if (!input && this.shadowRoot) {
            useShadow = true;
            input = this.shadowRoot.querySelector('.picker-value');
        }

        if (input instanceof HTMLInputElement
            || input instanceof TavenemInputHtmlElement) {
            currentValue = input.value;
            if (currentValue.startsWith('[')
                && currentValue.endsWith(']')) {
                var a = JSON.parse(currentValue);
                if (a instanceof Array) {
                    currentValue = a;
                }
            }
        }

        if (currentValue instanceof Array) {
            const index = currentValue.indexOf(value);
            if (index >= 0) {
                currentValue.splice(index, 1);
            } else {
                currentValue.push(value);
            }

            if (currentValue.length) {
                value = JSON.stringify(currentValue);
            } else {
                currentValue = '';
                value = '';
                display = null;
            }
        } else if (currentValue === value) {
            currentValue = '';
            value = '';
            display = null;
        } else if (currentValue && currentValue.length) {
            currentValue = [currentValue, value];
            value = JSON.stringify(currentValue);
        } else {
            currentValue = value;
        }

        if (input instanceof HTMLInputElement
            || input instanceof TavenemInputHtmlElement) {
            input.value = value;
        }

        let options = Array
            .from((useShadow ? this.shadowRoot! : this).querySelectorAll('option, [data-close-picker-value]'))
            .filter<HTMLElement>((x): x is HTMLElement => x instanceof HTMLElement)
            .filter(x => {
                if ('pickerSelectAll' in x.dataset) {
                    return false;
                }

                if ('closePickerValue' in x.dataset) {
                    return x.dataset.closePickerValue
                        && x.dataset.closePickerValue.length;
                }

                if (x instanceof HTMLOptionElement) {
                    return x.value && x.value.length;
                }

                return false;
            })
            .sort(TavenemSelectInputHtmlElement.documentPositionComparator);

        let firstSelected: HTMLElement | undefined;
        let anyUnselected = false;
        let selectedCount = 0;
        for (var i = 0; i < options.length; i++) {
            const option = options[i];
            if ('closePickerValue' in option.dataset) {
                if (currentValue instanceof Array) {
                    if (option.dataset.closePickerValue
                        && currentValue.includes(option.dataset.closePickerValue)) {
                        option.classList.add('active');
                        selectedCount++;
                        if (!firstSelected) {
                            firstSelected = option;
                        }
                    } else {
                        anyUnselected = true;
                        option.classList.remove('active');
                    }
                } else if (option.dataset.closePickerValue == currentValue) {
                    option.classList.add('active');
                    selectedCount++;
                    if (!firstSelected) {
                        firstSelected = option;
                    }
                } else {
                    anyUnselected = true;
                    option.classList.remove('active');
                }
            } else if (option instanceof HTMLOptionElement) {
                if (currentValue instanceof Array) {
                    if (currentValue.includes(option.value)) {
                        option.classList.add('active');
                        selectedCount++;
                        if (!firstSelected) {
                            firstSelected = option;
                        }
                    } else {
                        anyUnselected = true;
                        option.classList.remove('active');
                    }
                } else if (option.value == currentValue) {
                    option.classList.add('active');
                    selectedCount++;
                    if (!firstSelected) {
                        firstSelected = option;
                    }
                } else {
                    anyUnselected = true;
                    option.classList.remove('active');
                }
            }
        }

        if (firstSelected) {
            if ('closePickerValue' in firstSelected.dataset) {
                display = firstSelected.dataset.closePickerDisplay
                    || firstSelected.dataset.closePickerValue
                    || '';
            } else if (firstSelected instanceof HTMLOptionElement) {
                display = firstSelected.label;
                if (!display || !display.length) {
                    display = firstSelected.value;
                }
                if (!display || !display.length) {
                    display = firstSelected.innerText;
                }
            }
        }

        if (selectedCount > 1) {
            if (display && display.length) {
                display += " +" + (selectedCount - 1).toFixed(0);
            } else {
                display = selectedCount.toFixed(0);
            }
        } else if (selectedCount === 1
            && (!display || !display.length)) {
            display = "1";
        }

        if (display && input instanceof TavenemInputHtmlElement) {
            input.display = display;
        }

        (useShadow ? this.shadowRoot! : this).querySelectorAll('[data-picker-select-all]')
            .forEach(x => {
                if (anyUnselected) {
                    x.classList.remove('active');
                } else {
                    x.classList.add('active');
                }
            });
    }

    private onSubmitValue(value?: string, display?: string | null) {
        if (!value) {
            return;
        }

        if (this.hasAttribute('multiple')) {
            this.onSetValueForMultiple(value, display);
            return;
        }

        this.onSetValue(value, display);
    }

    private onValueChange(event: Event) {
        if (!event.target
            || !(event instanceof CustomEvent)
            || !event.detail) {
            return;
        }
        let input = this.querySelector('.picker-value');
        if (!input && this.shadowRoot) {
            input = this.shadowRoot.querySelector('.picker-value');
        }
        if (event.target !== input) {
            return;
        }
        if (!event.detail.value) {
            this.clear();
        } else {
            this.onSubmitValue(event.detail.value);
        }
    }

    private selectAll(toggle: boolean) {
        let options = Array
            .from(this.querySelectorAll('option, [data-close-picker-value]'))
            .filter<HTMLElement>((x): x is HTMLElement => x instanceof HTMLElement)
            .filter(x => {
                if ('pickerSelectAll' in x.dataset) {
                    return false;
                }

                if ('closePickerValue' in x.dataset) {
                    return x.dataset.closePickerValue
                        && x.dataset.closePickerValue.length;
                }

                if (x instanceof HTMLOptionElement) {
                    return x.value && x.value.length;
                }

                return false;
            });
        let useShadowOptions = false;
        if (options.length === 0) {
            if (this.shadowRoot) {
                useShadowOptions = true;
                options = Array
                    .from(this.shadowRoot.querySelectorAll('option, [data-close-picker-value]'))
                    .filter<HTMLElement>((x): x is HTMLElement => x instanceof HTMLElement)
                    .filter(x => {
                        if ('pickerSelectAll' in x.dataset) {
                            return false;
                        }

                        if ('closePickerValue' in x.dataset) {
                            return x.dataset.closePickerValue
                                && x.dataset.closePickerValue.length;
                        }

                        if (x instanceof HTMLOptionElement) {
                            return x.value && x.value.length;
                        }

                        return false;
                    });
            }
            if (options.length === 0) {
                return;
            }
        }

        if (toggle) {
            const allSelected = options.every(x => x.hasAttribute('disabled')
                || x.classList.contains('active'));
            if (allSelected) {
                this.clear();
                return;
            }
        }

        const enabledOptions = options
            .filter(x => !x.hasAttribute('disabled'));
        if (enabledOptions.length === 0) {
            return;
        }

        const values = enabledOptions.map<string>(x => {
            if ('closePickerValue' in x.dataset
                && x.dataset.closePickerValue
                && x.dataset.closePickerValue.length) {
                return x.dataset.closePickerValue;
            }

            if (x instanceof HTMLOptionElement) {
                return x.value;
            }

            return '';
        });

        const value = JSON.stringify(values);

        let input = this.querySelector('.picker-value');
        if (!input && this.shadowRoot) {
            input = this.shadowRoot.querySelector('.picker-value');
        }
        if (input instanceof HTMLInputElement
            || input instanceof TavenemInputHtmlElement) {
            input.value = value;
        }

        const displayOption = enabledOptions[0];
        let display = '';
        if ('closePickerValue' in displayOption.dataset) {
            display = displayOption.dataset.closePickerDisplay
                || displayOption.dataset.closePickerValue
                || '';
        } else if (displayOption instanceof HTMLOptionElement) {
            display = displayOption.label;
            if (!display || !display.length) {
                display = displayOption.value;
            }
            if (!display || !display.length) {
                display = displayOption.innerText;
            }
        }

        if (options.length > 1) {
            if (display.length) {
                display += " +" + (options.length - 1).toFixed(0);
            } else {
                display = options.length.toFixed(0);
            }
        } else if (options.length === 1
            && (!display || !display.length)) {
            display = "1";
        }

        if (display && input instanceof TavenemInputHtmlElement) {
            input.display = display;
        }

        for (var i = 0; i < enabledOptions.length; i++) {
            enabledOptions[i].classList.add('active');
        }

        if (enabledOptions.length === options.length) {
            (useShadowOptions ? this.shadowRoot! : this).querySelectorAll('[data-picker-select-all]')
                .forEach(x => {
                    x.classList.add('active');
                });
        }
    }
}