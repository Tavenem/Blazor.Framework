import { documentPositionComparator, randomUUID } from '../../tavenem-utility'
import { TavenemDropdownHTMLElement, TavenemTooltipHTMLElement } from '../_popover';
import { TavenemInputHtmlElement } from '../_input';
import { TavenemColorInputHtmlElement } from '../color-input/_color-input';
import { TavenemEmojiHTMLElement } from '../_emoji';
import { Dialog, initialize as initializeDialog, showModal } from '../../tavenem-dialog';
import { TavenemCheckboxHtmlElement } from '../_checkbox';
import { TavenemInputFieldHtmlElement } from '../_input-field';
import { TavenemSelectInputHtmlElement } from '../_select';
import { CommandType } from './commands/_commands';
import { elementStyle } from './_element-style';
import { EditorSyntax, syntaxes, syntaxLabelMap, syntaxTextMap } from './_syntax';
import { toolbarButtonDefinitions, ToolbarControl, ToolbarControlDefinition, ToolbarControlStyle } from './_toolbar';
import { TavenemCodeEditor } from './_code-editor';
import { TavenemWysiwygEditor } from './_wysiwyg-editor';
import { Editor, EditorMode, EditorOptions, UpdateInfo } from './_editor-info';

const fonts = [
    'Arial',
    'Arial Black',
    'Comic Sans MS',
    'Courier New',
    'Georgia',
    'Impact',
    'Microsoft Sans Serif',
    'Tahoma',
    'Times New Roman',
    'Trebuchet MS',
    'Verdana',
];

export class TavenemEditorHtmlElement extends HTMLElement {
    static formAssociated = true;

    private _activeEditor?: Editor;
    private _audioDialog?: HTMLDialogElement;
    private _codeEditor = new TavenemCodeEditor();
    private _fontSizeDialog?: HTMLDialogElement;
    private _imageDialog?: HTMLDialogElement;
    private _initialValue: string | null | undefined;
    private _internals: ElementInternals;
    private _isWYSIWYG = false;
    private _lineHeightDialog?: HTMLDialogElement;
    private _linkDialog?: HTMLDialogElement;
    private _options?: EditorOptions;
    private _themeObserver: MutationObserver;
    private _toolbarButtons: ToolbarControl[] = [];
    private _value = '';
    private _videoDialog?: HTMLDialogElement;
    private _wysiwygEditor = new TavenemWysiwygEditor();

    static get observedAttributes() {
        return [
            'data-label',
            'data-syntax',
            'readonly',
            'required',
            'value',
            'wysiwyg',
        ];
    }

    private static newValueChangeEvent(value: string) {
        return new CustomEvent('valuechange', { bubbles: true, composed: true, detail: { value: value } });
    }

    private static newValueInputEvent(value: string) {
        return new CustomEvent('valueinput', { bubbles: true, composed: true, detail: { value: value } });
    }

    get form() { return this._internals.form; }

    get name() { return this.getAttribute('name'); }

    get required() { return this.hasAttribute('required'); }
    set required(value: boolean) {
        if (value) {
            this.setAttribute('required', '');
        } else {
            this.removeAttribute('required');
        }
    }

    get type() { return this.localName; }

    get validity() { return this._internals.validity; }
    get validationMessage() { return this._internals.validationMessage; }

    get value() { return this._value; }
    set value(v: string) { this.setValue(v); }

    get willValidate() { return this._internals.willValidate; }

    constructor() {
        super();

        this._internals = this.attachInternals();
        this._themeObserver = new MutationObserver(this.themeChange.bind(this));
    }

    connectedCallback() {
        const shadow = this.attachShadow({ mode: 'open', delegatesFocus: true });

        if (this.hasAttribute('max-height')) {
            this.style.maxHeight = this.getAttribute('max-height') || '';
        }

        const style = document.createElement('style');
        style.innerHTML = elementStyle;
        shadow.appendChild(style);

        const input = document.createElement('textarea');
        const inputId = randomUUID();
        input.id = inputId;
        input.disabled = this.hasAttribute('disabled');
        input.hidden = true;
        if (this.hasAttribute('name')) {
            input.name = this.getAttribute('name') || '';
            this._value = this.getAttribute('value') || '';
            this._initialValue = this._value;
        }
        input.required = this.hasAttribute('required');
        if (this.hasAttribute('value')) {
            input.value = this.getAttribute('value') || '';
        }
        shadow.appendChild(input);

        if ('label' in this.dataset
            && this.dataset.label
            && this.dataset.label.length) {
            const label = document.createElement('label');
            label.htmlFor = inputId;
            label.textContent = this.dataset.label;
            shadow.appendChild(label);
        }

        const toolbar = document.createElement('div');
        toolbar.classList.add('editor-toolbar');
        toolbar.role = 'menubar';
        shadow.appendChild(toolbar);

        const font = toolbarButtonDefinitions
            .find(x => x.tooltip === 'font');
        if (font && font.buttons && font.buttons.length <= 5) {
            for (const fontFamily of getFonts()) {
                font.buttons.push({
                    text: fontFamily,
                    type: CommandType.SetFontFamily,
                    params: [fontFamily],
                });
            }
        }

        const editor = document.createElement('div');
        editor.classList.add('editor');
        if (this.hasAttribute('height')) {
            editor.style.height = this.getAttribute('height') || '';
        }
        editor.spellcheck = this.spellcheck;
        editor.tabIndex = this.tabIndex;
        shadow.appendChild(editor);

        const statusBar = document.createElement('small');
        statusBar.classList.add('editor-statusbar');
        statusBar.innerHTML = '&nbsp;';
        shadow.appendChild(statusBar);

        const helpers = document.createElement('div');
        helpers.classList.add('field-helpers');
        shadow.appendChild(helpers);

        const validationList = document.createElement('ul');
        validationList.classList.add('validation-messages');
        helpers.appendChild(validationList);

        const helperSlot = document.createElement('slot');
        helperSlot.name = 'helpers';
        helpers.appendChild(helperSlot);

        const slot = document.createElement('slot');
        shadow.appendChild(slot);

        this.refreshState(toolbar);

        const syntaxAttribute = this.dataset.syntax;
        const syntax = syntaxAttribute && syntaxes.includes(syntaxAttribute as any)
            ? syntaxAttribute as EditorSyntax
            : 'none';
        this._isWYSIWYG = this.hasAttribute('wysiwyg');
        const isWysiwyg = this._isWYSIWYG
            && (syntax === 'handlebars' || syntax === 'html' || syntax === 'markdown');
        this._options = this.getOptions(isWysiwyg, syntax);
        if (isWysiwyg) {
            this._wysiwygEditor.initializeEditor(
                this,
                editor,
                this.onChange.bind(this),
                this.onInput.bind(this),
                this.update.bind(this),
                this._options);
            this._activeEditor = this._wysiwygEditor;
        } else {
            this._codeEditor.initializeEditor(
                this,
                editor,
                this.onChange.bind(this),
                this.onInput.bind(this),
                this.update.bind(this),
                this._options);
            this._activeEditor = this._codeEditor;
        }

        this.addEventListener('click', this.dismissTooltips.bind(this));

        this._themeObserver.observe(document.documentElement, { attributes: true });
    }

    disconnectedCallback() {
        for (const control of this._toolbarButtons) {
            control._element.removeEventListener('mousedown', this.preventDefault);
            control._element.removeEventListener('mouseup', this.onControlActivated.bind(this, control));
        }

        const root = this.shadowRoot;
        if (!root) {
            return;
        }

        const modeButton = root.querySelector('.mode-button');
        if (modeButton) {
            modeButton.removeEventListener('click', this.onModeSwitch.bind(this));
        }

        const showAll = root.querySelector('.editor-toolbar-show-all-btn');
        if (showAll) {
            showAll.removeEventListener('click', this.onShowAll.bind(this));
        }

        this.removeEventListener('click', this.dismissTooltips.bind(this));
    }

    attributeChangedCallback(name: string, oldValue: string | null | undefined, newValue: string | null | undefined) {
        if (newValue == oldValue) {
            return;
        }

        if (name === 'readonly') {
            const root = this.shadowRoot;
            if (!root) {
                return;
            }
            const input = root.querySelector('textarea');
            if (!input) {
                return;
            }
            const wasReadonly = input.readOnly;
            if (name === 'readonly') {
                input.readOnly = (newValue != null) || this.matches(':disabled');
            }
            if (input.readOnly != wasReadonly) {
                this.update({});
                this._wysiwygEditor.disable(input.readOnly);
                this._codeEditor.disable(input.readOnly);
            }
        } else if (name === 'required') {
            const root = this.shadowRoot;
            if (!root) {
                return;
            }
            const input = root.querySelector('textarea');
            if (input) {
                input.required = (newValue != null);
            }
            this.setValidity();
        } else if (name === 'value') {
            this.setValue(newValue);
        } else if (name === 'data-syntax') {
            if (newValue && syntaxes.includes(newValue as any)) {
                this.onSetSyntax(newValue as EditorSyntax);
            }
        } else if (name === 'wysiwyg') {
            this.onSetWysiwygMode(newValue != null);
        } else if (name === 'data-label') {
            const root = this.shadowRoot;
            if (!root) {
                return;
            }
            const label = root.querySelector('label');
            if (label) {
                if (newValue != null && newValue.length) {
                    label.textContent = newValue;
                } else {
                    label.remove();
                }
            } else if (newValue != null && newValue.length) {
                const input = root.querySelector('input');
                const toolbar = root.querySelector('.editor-toolbar');
                if (input && toolbar) {
                    const label = document.createElement('label');
                    label.htmlFor = input.id;
                    label.innerText = newValue;
                    root.insertBefore(label, toolbar);
                }
            }
        }
    }

    formDisabledCallback(disabled: boolean) {
        const root = this.shadowRoot;
        if (!root) {
            return;
        }

        const input = root.querySelector('textarea');
        if (!input) {
            return;
        }
        const wasReadonly = input.readOnly;
        input.readOnly = disabled || this.hasAttribute('readonly');
        if (input.readOnly == wasReadonly) {
            return;
        }
        this.update({});
        this._wysiwygEditor.disable(disabled);
        this._codeEditor.disable(disabled);
    }

    formResetCallback() { this.reset(); }

    checkValidity() { return this._internals.checkValidity(); }

    dismissTooltips() {
        if (this.shadowRoot) {
            this.shadowRoot
                .querySelectorAll<TavenemTooltipHTMLElement>('tf-tooltip')
                .forEach(x => x.onAttentionOut());
        }
    }

    focusInnerEditor() {
        if (this._activeEditor) {
            this._activeEditor.focus();
        }
    }

    getSelectedText() {
        if (this._activeEditor) {
            return this._activeEditor.getSelectedText();
        }
    }

    onChange(value?: string | null) {
        this._internals.states.add('touched');
        this.assignValue(value);
        this.dispatchEvent(TavenemEditorHtmlElement.newValueChangeEvent(value || ''));
    }

    onInput(value?: string | null) {
        this._internals.states.add('touched');
        this.assignValue(value);
        this.dispatchEvent(TavenemEditorHtmlElement.newValueInputEvent(value || ''));
    }

    reportValidity() { return this._internals.reportValidity(); }

    reset() {
        this.setValue(this._initialValue);
        this._internals.states.delete('touched');
    }

    setValue(value?: string | null) {
        this.assignValue(value);

        if (this._activeEditor) {
            this._activeEditor.setValue(value);
        }

        this.dispatchEvent(TavenemEditorHtmlElement.newValueChangeEvent(this._value));
    }

    update(data: UpdateInfo) {
        const editorDisabled = this.hasAttribute('disabled')
            || this.hasAttribute('readonly');

        if (typeof data.currentStatus !== 'undefined') {
            const root = this.shadowRoot;
            if (root) {
                const status = root.querySelector('.editor-statusbar');
                if (status) {
                    status.innerHTML = data.currentStatus || '&nbsp;';
                }
            }
        }

        if (data.commands) {
            for (let t = 0; t <= 74; t++) {
                const type = t as CommandType;

                for (const toolbarButton of this
                    ._toolbarButtons
                    .filter(x => x._definition.type === type)) {
                    if (toolbarButton?._element) {
                        const commandInfo = data.commands[type];

                        toolbarButton._active = commandInfo?.active || false;
                        toolbarButton._disabled = !commandInfo?.enabled;
                    }
                }
            }
        }

        for (const toolbarButton of this._toolbarButtons) {
            if (toolbarButton._active) {
                toolbarButton._element.classList.add('active');
            } else {
                toolbarButton._element.classList.remove('active');
            }

            if (toolbarButton._definition.buttons) {
                const buttonsDisabled = this
                    ._toolbarButtons
                    .filter(x => x._parentElement?.contains(toolbarButton._element))
                    .every(x => x._disabled || x._definition.style === ToolbarControlStyle.Separator);
                const dropdown = toolbarButton._element instanceof TavenemDropdownHTMLElement
                    ? toolbarButton._element
                    : toolbarButton._element.querySelector<TavenemDropdownHTMLElement>('tf-dropdown');
                if (dropdown) {
                    if (buttonsDisabled) {
                        dropdown.setAttribute('disabled', '');
                    } else {
                        dropdown.removeAttribute('disabled');
                    }
                    const button = dropdown.querySelector<HTMLButtonElement>(':scope > button');
                    if (button) {
                        button.disabled = buttonsDisabled;
                    }
                }
            }

            const disabled = editorDisabled
                || toolbarButton._disabled;
            if (toolbarButton._element instanceof HTMLButtonElement) {
                toolbarButton._element.disabled = disabled;
            } else if (toolbarButton._element instanceof TavenemDropdownHTMLElement
                || toolbarButton._element instanceof TavenemColorInputHtmlElement
                || toolbarButton._element instanceof TavenemEmojiHTMLElement
                || toolbarButton._parentElement) {
                if (disabled) {
                    toolbarButton._element.setAttribute('disabled', '');
                } else {
                    toolbarButton._element.removeAttribute('disabled');
                }
            } else {
                const dropdownButton = toolbarButton._element.querySelector('button');
                if (dropdownButton) {
                    dropdownButton.disabled = disabled;
                }
            }
        }

        const root = this.shadowRoot;
        if (!root) {
            return;
        }

        const modeButton = root.querySelector('.mode-button');
        if (modeButton) {
            if (editorDisabled) {
                modeButton.setAttribute('disabled', '');
            } else {
                modeButton.removeAttribute('disabled');
            }
        }

        const syntaxSelect = root.querySelector('.syntax-select');
        if (syntaxSelect) {
            if (editorDisabled) {
                syntaxSelect.setAttribute('disabled', '');
            } else {
                syntaxSelect.removeAttribute('disabled');
            }
        }
    }

    updateSelectedText(value?: string | null) {
        if (this._activeEditor) {
            this._activeEditor.updateSelectedText(value);
        }
    }

    private assignValue(value?: string | null) {
        if (value == null) {
            if (this._value == null) {
                return;
            }
        } else if (this._value === value) {
            return;
        }

        this._value = value || '';

        if (this._value.length) {
            this._internals.setFormValue(this._value);
        } else {
            this._internals.setFormValue(null);
        }

        this.setValidity();

        const root = this.shadowRoot;
        if (root) {
            const input = root.querySelector('textarea');
            if (input) {
                input.value = value || '';
            }
        }
    }

    private getAudioDialog() {
        const content: Node[] = [];

        const urlInput = document.createElement('tf-input-field') as TavenemInputFieldHtmlElement;
        urlInput.classList.add('url-input');
        urlInput.dataset.label = 'URL';
        urlInput.setAttribute('name', 'url');
        urlInput.setAttribute('required', '');
        urlInput.setAttribute('type', 'text');
        content.push(urlInput);

        const controlsInput = document.createElement('tf-checkbox');
        controlsInput.classList.add('controls-input');
        controlsInput.setAttribute('name', 'controls');
        controlsInput.setAttribute('checked', '');
        controlsInput.dataset.label = 'Controls';
        content.push(controlsInput);

        const loopInput = document.createElement('tf-checkbox');
        loopInput.classList.add('loop-input');
        loopInput.setAttribute('name', 'loop');
        loopInput.setAttribute('checked', '');
        loopInput.dataset.label = 'Loop';
        content.push(loopInput);

        const callback = (value: unknown) => {
            if (value == null
                || typeof (value as any).url !== 'string'
                || !this._activeEditor) {
                return;
            }

            let src: string = (value as any).url;
            if (!src.startsWith('#')
                && !URL.canParse(src, document.baseURI)) {
                src = 'http://' + src;
                if (!URL.canParse(src, document.baseURI)) {
                    return;
                }
            }

            const controls = !!((value as any).controls);
            const loop = !!((value as any).loop);

            this._activeEditor.activateCommand(CommandType.InsertAudio, src, controls, loop);
        };

        return getDialog(
            'Audio',
            content,
            callback.bind(this),
            (form: HTMLFormElement) => {
                const urlInput = form.querySelector<TavenemInputHtmlElement>('.url-input');
                if (!urlInput) {
                    return;
                }
                const controlsInput = form.querySelector<TavenemCheckboxHtmlElement>('.controls-input');
                const loopInput = form.querySelector<TavenemCheckboxHtmlElement>('.loop-input');
                return {
                    url: urlInput.value,
                    controls: controlsInput?.checked === true,
                    loop: loopInput?.checked === true,
                };
            },
            (form: HTMLFormElement) => {
                const urlInput = form.querySelector<TavenemInputHtmlElement>('.url-input');
                if (!urlInput || !urlInput.value) {
                    return false;
                }

                const fieldHelpers = urlInput.querySelector('.field-helpers');
                if (urlInput.value.startsWith('#')) {
                    fieldHelpers?.replaceChildren();
                    return true;
                }

                if (URL.canParse(urlInput.value, document.baseURI)
                    || URL.canParse('http://' + urlInput.value, document.baseURI)) {
                    fieldHelpers?.replaceChildren();
                    return true;
                }

                if (fieldHelpers) {
                    const list = document.createElement('ul');
                    list.classList.add('mr-auto', 'mb-0', 'pl-0');

                    const listItem = document.createElement('li');
                    listItem.textContent = "Must be a valid URL";
                    list.appendChild(listItem);

                    fieldHelpers.replaceChildren(list);
                }

                return false;
            });
    }

    private getAudioDialogResponse() {
        if (!this._audioDialog) {
            this._audioDialog = this.getAudioDialog();
        }

        showModal(this._audioDialog);
    }

    private getFontSizeDialog() {
        const content: Node[] = [];

        const sizeInput = document.createElement('tf-select');
        sizeInput.classList.add('size-input');
        sizeInput.dataset.disableAutosearch = '';
        sizeInput.dataset.inputReadonly = '';
        sizeInput.dataset.hasTextInput = '';
        sizeInput.dataset.hideExpand = '';
        sizeInput.dataset.popoverLimitHeight = '';
        sizeInput.setAttribute('name', 'size');
        sizeInput.setAttribute('placeholder', 'font size');
        sizeInput.setAttribute('required', '');
        sizeInput.setAttribute('type', 'text');
        content.push(sizeInput);

        const menu = document.createElement('menu');
        menu.classList.add('list', 'clickable', 'dense');
        menu.slot = 'popover';
        sizeInput.appendChild(menu);

        const s1 = document.createElement('li');
        s1.textContent = 'Reset';
        s1.dataset.closePicker = '';
        s1.dataset.closePickerValue = 'reset';
        s1.tabIndex = 0;
        menu.appendChild(s1);

        const s2 = document.createElement('li');
        s2.textContent = '.75em';
        s2.dataset.closePicker = '';
        s2.dataset.closePickerValue = '.75em';
        s2.tabIndex = 0;
        menu.appendChild(s2);

        const s3 = document.createElement('li');
        s3.textContent = '.875em';
        s3.dataset.closePicker = '';
        s3.dataset.closePickerValue = '875em';
        s3.tabIndex = 0;
        menu.appendChild(s3);

        const s4 = document.createElement('li');
        s4.textContent = '1em';
        s4.dataset.closePicker = '';
        s4.dataset.closePickerValue = '1em';
        s4.tabIndex = 0;
        menu.appendChild(s4);

        const s5 = document.createElement('li');
        s5.textContent = '1.25em';
        s5.dataset.closePicker = '';
        s5.dataset.closePickerValue = '1.25em';
        s5.tabIndex = 0;
        menu.appendChild(s5);

        const s6 = document.createElement('li');
        s6.textContent = '1.5em';
        s6.dataset.closePicker = '';
        s6.dataset.closePickerValue = '1.5em';
        s6.tabIndex = 0;
        menu.appendChild(s6);

        const s7 = document.createElement('li');
        s7.textContent = '1.75em';
        s7.dataset.closePicker = '';
        s7.dataset.closePickerValue = '1.75em';
        s7.tabIndex = 0;
        menu.appendChild(s7);

        const s8 = document.createElement('li');
        s8.textContent = '2em';
        s8.dataset.closePicker = '';
        s8.dataset.closePickerValue = '2em';
        s8.tabIndex = 0;
        menu.appendChild(s8);

        const s9 = document.createElement('li');
        s9.textContent = '2.5em';
        s9.dataset.closePicker = '';
        s9.dataset.closePickerValue = '2.5em';
        s9.tabIndex = 0;
        menu.appendChild(s9);

        const s10 = document.createElement('li');
        s10.textContent = '3em';
        s10.dataset.closePicker = '';
        s10.dataset.closePickerValue = '3em';
        s10.tabIndex = 0;
        menu.appendChild(s10);

        const callback = (value: unknown) => {
            if ((value != null
                && typeof value !== 'string')
                || !this._activeEditor) {
                return;
            }

            let size: string | null = value || null;
            if (size?.toLowerCase() === 'reset') {
                size = null;
            }

            this._activeEditor.activateCommand(CommandType.SetFontSize, size);
        };

        return getDialog(
            'Font Size',
            content,
            callback.bind(this),
            (form: HTMLFormElement) => {
                const sizeInput = form.querySelector<TavenemInputHtmlElement>('.size-input');
                if (!sizeInput) {
                    return;
                }
                return sizeInput.value;
            },
            (form: HTMLFormElement) => {
                const sizeInput = form.querySelector<TavenemInputHtmlElement>('.size-input');
                if (!sizeInput) {
                    return false;
                }

                const fieldHelpers = sizeInput.querySelector('.field-helpers');
                if (!sizeInput.value
                    || !sizeInput.value.length
                    || sizeInput.value.toLowerCase() === 'reset'
                    || !Number.isNaN(parseFloat(sizeInput.value))
                    || /^(0?\.?[\d]+(\.[\d]+)?(%|r?em|px|pt|ch|ex|vh|vw|vmin|vmax|cm|mm|in|pc|pt))|((x+-)?small|smaller|medium|(x+-)?large|larger|inherit|initial|revert|revert-layer|unset)$/.test(sizeInput.value)) {
                    fieldHelpers?.replaceChildren();
                    return true;
                }

                if (fieldHelpers) {
                    const list = document.createElement('ul');
                    list.classList.add('mr-auto', 'mb-0', 'pl-0');

                    const listItem = document.createElement('li');
                    listItem.textContent = "Invalid font size";
                    list.appendChild(listItem);

                    fieldHelpers.replaceChildren(list);
                }

                return false;
            });
    }

    private getFontSizeDialogResponse() {
        if (!this._fontSizeDialog) {
            this._fontSizeDialog = this.getFontSizeDialog();
        }

        showModal(this._fontSizeDialog);
    }

    private getImageDialog() {
        const content: Node[] = [];

        const urlInput = document.createElement('tf-input-field') as TavenemInputFieldHtmlElement;
        urlInput.classList.add('url-input');
        urlInput.dataset.label = 'URL';
        urlInput.setAttribute('name', 'url');
        urlInput.setAttribute('required', '');
        urlInput.setAttribute('type', 'text');
        content.push(urlInput);

        const titleInput = document.createElement('tf-input-field') as TavenemInputFieldHtmlElement;
        titleInput.classList.add('title-input');
        titleInput.dataset.label = 'Title (optional)';
        titleInput.setAttribute('name', 'title');
        titleInput.setAttribute('type', 'text');
        content.push(titleInput);

        const altInput = document.createElement('tf-input-field') as TavenemInputFieldHtmlElement;
        altInput.classList.add('alt-input');
        titleInput.dataset.label = 'Alt (optional)';
        altInput.setAttribute('name', 'alt');
        altInput.setAttribute('type', 'text');
        content.push(altInput);

        const callback = (value: unknown) => {
            if (value == null
                || typeof (value as any).url !== 'string'
                || !this._activeEditor) {
                return;
            }

            let src: string = (value as any).url;
            if (!src.startsWith('#')
                && !URL.canParse(src, document.baseURI)) {
                src = 'http://' + src;
                if (!URL.canParse(src, document.baseURI)) {
                    return;
                }
            }

            const title: string | null = typeof (value as any).title === 'string'
                ? new Option((value as any).title).innerHTML
                : null;

            const alt: string | null = typeof (value as any).alt === 'string'
                ? new Option((value as any).alt).innerHTML
                : null;

            this._activeEditor.activateCommand(CommandType.InsertImage, src, title, alt);
        };

        return getDialog(
            'Image',
            content,
            callback.bind(this),
            (form: HTMLFormElement) => {
                const urlInput = form.querySelector<TavenemInputHtmlElement>('.url-input');
                if (!urlInput) {
                    return;
                }
                const titleInput = form.querySelector<TavenemInputHtmlElement>('.title-input');
                const altInput = form.querySelector<TavenemInputHtmlElement>('.alt-input');
                return {
                    url: urlInput.value,
                    title: titleInput?.value,
                    alt: altInput?.value,
                };
            },
            (form: HTMLFormElement) => {
                const urlInput = form.querySelector<TavenemInputHtmlElement>('.url-input');
                if (!urlInput || !urlInput.value) {
                    return false;
                }

                const fieldHelpers = urlInput.querySelector('.field-helpers');
                if (urlInput.value.startsWith('#')) {
                    fieldHelpers?.replaceChildren();
                    return true;
                }

                if (URL.canParse(urlInput.value, document.baseURI)
                    || URL.canParse('http://' + urlInput.value, document.baseURI)) {
                    fieldHelpers?.replaceChildren();
                    return true;
                }

                if (fieldHelpers) {
                    const list = document.createElement('ul');
                    list.classList.add('mr-auto', 'mb-0', 'pl-0');

                    const listItem = document.createElement('li');
                    listItem.textContent = "Must be a valid URL";
                    list.appendChild(listItem);

                    fieldHelpers.replaceChildren(list);
                }

                return false;
            });
    }

    private getImageDialogResponse() {
        if (!this._imageDialog) {
            this._imageDialog = this.getImageDialog();
        }

        showModal(this._imageDialog);
    }

    private getLineHeightDialog() {
        const content: Node[] = [];

        const sizeInput = document.createElement('tf-select');
        sizeInput.classList.add('size-input');
        sizeInput.dataset.disableAutosearch = '';
        sizeInput.dataset.inputReadonly = '';
        sizeInput.dataset.hasTextInput = '';
        sizeInput.dataset.hideExpand = '';
        sizeInput.dataset.popoverLimitHeight = '';
        sizeInput.setAttribute('name', 'size');
        sizeInput.setAttribute('placeholder', 'line height');
        sizeInput.setAttribute('required', '');
        sizeInput.setAttribute('type', 'text');
        content.push(sizeInput);

        const menu = document.createElement('menu');
        menu.classList.add('list', 'clickable', 'dense');
        menu.slot = 'popover';
        sizeInput.appendChild(menu);

        const s1 = document.createElement('li');
        s1.textContent = 'Reset';
        s1.dataset.closePicker = '';
        s1.dataset.closePickerValue = 'reset';
        s1.tabIndex = 0;
        menu.appendChild(s1);

        const s2 = document.createElement('li');
        s2.textContent = 'normal';
        s2.dataset.closePicker = '';
        s2.dataset.closePickerValue = 'normal';
        s2.tabIndex = 0;
        menu.appendChild(s2);

        const s3 = document.createElement('li');
        s3.textContent = '1';
        s3.dataset.closePicker = '';
        s3.dataset.closePickerValue = '1';
        s3.tabIndex = 0;
        menu.appendChild(s3);

        const s4 = document.createElement('li');
        s4.textContent = '1.2';
        s4.dataset.closePicker = '';
        s4.dataset.closePickerValue = '1.2';
        s4.tabIndex = 0;
        menu.appendChild(s4);

        const s5 = document.createElement('li');
        s5.textContent = '1.5';
        s5.dataset.closePicker = '';
        s5.dataset.closePickerValue = '1.5';
        s5.tabIndex = 0;
        menu.appendChild(s5);

        const s6 = document.createElement('li');
        s6.textContent = '2';
        s6.dataset.closePicker = '';
        s6.dataset.closePickerValue = '2';
        s6.tabIndex = 0;
        menu.appendChild(s6);

        const callback = (value: unknown) => {
            if ((value != null
                && typeof value !== 'string')
                || !this._activeEditor) {
                return;
            }

            let size: string | null = value || null;
            if (size?.toLowerCase() === 'reset') {
                size = null;
            }

            this._activeEditor.activateCommand(CommandType.SetLineHeight, size);
        };

        return getDialog(
            'Line Height',
            content,
            callback.bind(this),
            (form: HTMLFormElement) => {
                const sizeInput = form.querySelector<TavenemInputHtmlElement>('.size-input');
                if (!sizeInput) {
                    return;
                }
                return sizeInput.value;
            },
            (form: HTMLFormElement) => {
                const sizeInput = form.querySelector<TavenemInputHtmlElement>('.size-input');
                if (!sizeInput) {
                    return false;
                }

                const fieldHelpers = sizeInput.querySelector('.field-helpers');
                if (!sizeInput.value
                    || !sizeInput.value.length
                    || sizeInput.value.toLowerCase() === 'reset'
                    || !Number.isNaN(parseFloat(sizeInput.value))
                    || /^(0?\.?[\d]+(\.[\d]+)?(%|r?em|px|pt|ch|ex|vh|vw|vmin|vmax|cm|mm|in|pc|pt)?)|(normal|inherit|initial|revert|revert-layer|unset)$/.test(sizeInput.value)) {
                    fieldHelpers?.replaceChildren();
                    return true;
                }

                if (fieldHelpers) {
                    const list = document.createElement('ul');
                    list.classList.add('mr-auto', 'mb-0', 'pl-0');

                    const listItem = document.createElement('li');
                    listItem.textContent = "Invalid line height";
                    list.appendChild(listItem);

                    fieldHelpers.replaceChildren(list);
                }

                return false;
            });
    }

    private getLineHeightDialogResponse() {
        if (!this._lineHeightDialog) {
            this._lineHeightDialog = this.getLineHeightDialog();
        }

        showModal(this._lineHeightDialog);
    }

    private getLinkDialog() {
        const content: Node[] = [];

        const urlInput = document.createElement('tf-input-field') as TavenemInputFieldHtmlElement;
        urlInput.classList.add('url-input');
        urlInput.dataset.label = 'URL';
        urlInput.setAttribute('name', 'url');
        urlInput.setAttribute('required', '');
        urlInput.setAttribute('type', 'text');
        content.push(urlInput);

        const titleInput = document.createElement('tf-input-field') as TavenemInputFieldHtmlElement;
        titleInput.classList.add('title-input');
        titleInput.dataset.label = 'Title (optional)';
        titleInput.setAttribute('name', 'title');
        titleInput.setAttribute('type', 'text');
        content.push(titleInput);

        const callback = (value: unknown) => {
            if (value == null
                || typeof (value as any).url !== 'string'
                || !this._activeEditor) {
                return;
            }

            let href: string = (value as any).url;
            if (!href.startsWith('#')
                && !URL.canParse(href, document.baseURI)) {
                href = 'http://' + href;
                if (!URL.canParse(href, document.baseURI)) {
                    return;
                }
            }

            const title: string | null = typeof (value as any).title === 'string'
                ? new Option((value as any).title).innerHTML
                : null;

            this._activeEditor.activateCommand(CommandType.InsertLink, href, title);
        };

        return getDialog(
            'Link',
            content,
            callback.bind(this),
            (form: HTMLFormElement) => {
                const urlInput = form.querySelector<TavenemInputHtmlElement>('.url-input');
                if (!urlInput) {
                    return;
                }
                const titleInput = form.querySelector<TavenemInputHtmlElement>('.title-input');
                return {
                    url: urlInput.value,
                    title: titleInput?.value,
                };
            },
            (form: HTMLFormElement) => {
                const urlInput = form.querySelector<TavenemInputHtmlElement>('.url-input');
                if (!urlInput || !urlInput.value) {
                    return false;
                }

                const fieldHelpers = urlInput.querySelector('.field-helpers');
                if (urlInput.value.startsWith('#')) {
                    fieldHelpers?.replaceChildren();
                    return true;
                }

                if (URL.canParse(urlInput.value, document.baseURI)
                    || URL.canParse('http://' + urlInput.value, document.baseURI)) {
                    fieldHelpers?.replaceChildren();
                    return true;
                }

                if (fieldHelpers) {
                    const list = document.createElement('ul');
                    list.classList.add('mr-auto', 'mb-0', 'pl-0');

                    const listItem = document.createElement('li');
                    listItem.textContent = "Must be a valid URL";
                    list.appendChild(listItem);

                    fieldHelpers.replaceChildren(list);
                }

                return false;
            });
    }

    private getLinkDialogResponse() {
        if (!this._linkDialog) {
            this._linkDialog = this.getLinkDialog();
        }

        showModal(this._linkDialog);
    }

    private getOptions(isWysiwyg?: boolean, syntax?: EditorSyntax): EditorOptions {
        if (syntax == null) {
            const syntaxAttribute = this.dataset.syntax;
            syntax = syntaxAttribute && syntaxes.includes(syntaxAttribute as any)
                ? syntaxAttribute as EditorSyntax
                : 'none';
        }
        if (isWysiwyg == null) {
            isWysiwyg = this._isWYSIWYG
                && (syntax === 'handlebars' || syntax === 'html' || syntax === 'markdown');
        }
        return {
            autoFocus: this.hasAttribute('autofocus'),
            mode: isWysiwyg ? EditorMode.WYSIWYG : EditorMode.Text,
            readOnly: this.hasAttribute('readonly'),
            syntax,
            updateOnInput: 'updateOnInput' in this.dataset,
            initialValue: this._value.length ? this._value : undefined,
            placeholder: this.getAttribute('placeholder') || undefined,
        };
    }

    private getVideoDialog() {
        const content: Node[] = [];

        const urlInput = document.createElement('tf-input-field') as TavenemInputFieldHtmlElement;
        urlInput.classList.add('url-input');
        urlInput.dataset.label = 'URL';
        urlInput.setAttribute('name', 'url');
        urlInput.setAttribute('required', '');
        urlInput.setAttribute('type', 'text');
        content.push(urlInput);

        const controlsInput = document.createElement('tf-checkbox');
        controlsInput.classList.add('controls-input');
        controlsInput.setAttribute('name', 'controls');
        controlsInput.setAttribute('checked', '');
        controlsInput.dataset.label = 'Controls';
        content.push(controlsInput);

        const loopInput = document.createElement('tf-checkbox');
        loopInput.classList.add('loop-input');
        loopInput.setAttribute('name', 'loop');
        loopInput.setAttribute('checked', '');
        loopInput.dataset.label = 'Loop';
        content.push(loopInput);

        const callback = (value: unknown) => {
            if (value == null
                || typeof (value as any).url !== 'string'
                || !this._activeEditor) {
                return;
            }

            let src: string = (value as any).url;
            if (!src.startsWith('#')
                && !URL.canParse(src, document.baseURI)) {
                src = 'http://' + src;
                if (!URL.canParse(src, document.baseURI)) {
                    return;
                }
            }

            const controls = !!((value as any).controls);
            const loop = !!((value as any).loop);

            this._activeEditor.activateCommand(CommandType.InsertVideo, src, controls, loop);
        };

        return getDialog(
            'Video',
            content,
            callback.bind(this),
            (form: HTMLFormElement) => {
                const urlInput = form.querySelector<TavenemInputHtmlElement>('.url-input');
                if (!urlInput) {
                    return;
                }
                const controlsInput = form.querySelector<TavenemCheckboxHtmlElement>('.controls-input');
                const loopInput = form.querySelector<TavenemCheckboxHtmlElement>('.loop-input');
                return {
                    url: urlInput.value,
                    controls: controlsInput?.checked === true,
                    loop: loopInput?.checked === true,
                };
            },
            (form: HTMLFormElement) => {
                const urlInput = form.querySelector<TavenemInputHtmlElement>('.url-input');
                if (!urlInput || !urlInput.value) {
                    return false;
                }

                const fieldHelpers = urlInput.querySelector('.field-helpers');
                if (urlInput.value.startsWith('#')) {
                    fieldHelpers?.replaceChildren();
                    return true;
                }

                if (URL.canParse(urlInput.value, document.baseURI)
                    || URL.canParse('http://' + urlInput.value, document.baseURI)) {
                    fieldHelpers?.replaceChildren();
                    return true;
                }

                if (fieldHelpers) {
                    const list = document.createElement('ul');
                    list.classList.add('mr-auto', 'mb-0', 'pl-0');

                    const listItem = document.createElement('li');
                    listItem.textContent = "Must be a valid URL";
                    list.appendChild(listItem);

                    fieldHelpers.replaceChildren(list);
                }

                return false;
            });
    }

    private getVideoDialogResponse() {
        if (!this._videoDialog) {
            this._videoDialog = this.getVideoDialog();
        }

        showModal(this._videoDialog);
    }

    private onColorSelected(control: ToolbarControl, event: Event) {
        event.preventDefault();
        event.stopPropagation();

        if (!control._disabled
            && control._definition.type
            && event instanceof CustomEvent
            && typeof event.detail.value === 'string'
            && event.detail.value.length
            && this._activeEditor) {
            this._activeEditor.activateCommand(control._definition.type, event.detail.value);
        }
    }

    private onControlActivated(control: ToolbarControl, event: Event) {
        if (event instanceof MouseEvent
            && event.button !== 0) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        if (control._disabled
            || !control._definition.type) {
            return;
        }

        if (control._definition.type === CommandType.InsertImage) {
            this.getImageDialogResponse();
            return;
        }

        if (control._definition.type === CommandType.InsertAudio) {
            this.getAudioDialogResponse();
            return;
        }

        if (control._definition.type === CommandType.InsertVideo) {
            this.getVideoDialogResponse();
            return;
        }

        if (control._definition.type === CommandType.SetFontSize) {
            this.getFontSizeDialogResponse();
            return;
        }

        if (control._definition.type === CommandType.SetLineHeight) {
            this.getLineHeightDialogResponse();
            return;
        }

        if (control._definition.type === CommandType.InsertLink) {
            if (!control._active) {
                this.getLinkDialogResponse();
                return;
            }
        }

        if (this._activeEditor) {
            this._activeEditor.activateToolbarCommand(control);
        }
    }

    private onEmojiSelected(control: ToolbarControl, event: Event) {
        event.preventDefault();
        event.stopPropagation();

        if (!control._disabled
            && control._definition.type
            && event instanceof CustomEvent
            && typeof event.detail.value === 'string'
            && event.detail.value.length
            && this._activeEditor) {
            this._activeEditor.activateCommand(CommandType.Emoji, event.detail.value);
        }
    }

    private onModeSwitch(event: Event) {
        event.preventDefault();
        event.stopPropagation();

        this.onSetWysiwygMode(!this._isWYSIWYG);
    }

    private preventDefault(event: Event) { event.preventDefault(); }

    private onSetWysiwygMode(value: boolean) {
        if (this._isWYSIWYG === value) {
            return;
        }

        this._isWYSIWYG = value;

        if (!this._activeEditor
            || this._activeEditor.isWYSIWYG === value) {
            return;
        }

        this.setActiveEditor(value);
    }

    private onSetSyntax(value: EditorSyntax) {
        const root = this.shadowRoot;
        if (!root) {
            return;
        }

        const syntaxValue = this._options?.syntax || this.dataset.syntax;
        let syntax = syntaxValue && syntaxes.includes(syntaxValue as any)
            ? syntaxValue as EditorSyntax
            : 'none';
        if (value === syntax) {
            return;
        }

        const editorElement = root.querySelector('.editor');
        if (!(editorElement instanceof HTMLElement)) {
            return;
        }

        const isWysiwygSyntax = value === 'handlebars' || value === 'html' || value === 'markdown';
        this._options = this._options || this.getOptions(this._isWYSIWYG && isWysiwygSyntax, value);
        this._options.autoFocus = true;
        this._options.initialValue = this._activeEditor?.getContent();
        this._options.mode = this._isWYSIWYG && isWysiwygSyntax
            ? EditorMode.WYSIWYG
            : EditorMode.Text;
        this._options.syntax = value;

        if (!this.setActiveEditor(this._isWYSIWYG)
            && this._activeEditor) {
            this._activeEditor.setSyntax(value);
            this.refreshState();
        }
    }

    private onShowAll(event: Event) {
        event.preventDefault();
        event.stopPropagation();

        const root = this.shadowRoot;
        if (!root) {
            return;
        }

        const toolbar = root.querySelector('.editor-toolbar');
        if (!toolbar) {
            return;
        }

        const showAll = toolbar.classList.contains('editor-toolbar-extended');

        if (showAll) {
            toolbar.classList.remove('editor-toolbar-extended');
        } else {
            toolbar.classList.add('editor-toolbar-extended');
        }

        const showAllButton = root.querySelector('.editor-toolbar-show-all-btn');
        if (!showAllButton) {
            return;
        }

        if (showAll) {
            showAllButton.classList.remove('filled');
        } else {
            showAllButton.classList.add('filled');
        }

        const showAllTooltip = showAllButton.querySelector('.tooltip');
        if (showAllTooltip) {
            showAllTooltip.textContent = showAll
                ? 'show all controls'
                : 'hide extra controls';
        }
    }

    private onSyntaxSelect(event: Event) {
        event.preventDefault();
        event.stopPropagation();

        if (!(event instanceof CustomEvent)
            || typeof event.detail.value !== 'string'
            || !syntaxes.includes(event.detail.value)) {
            return;
        }

        this.onSetSyntax(event.detail.value);
    }

    private applyToolbarButtonDefinition(
        button: HTMLButtonElement,
        definition: ToolbarControlDefinition,
        disabledOrReadonly: boolean,
        toolbarButton: ToolbarControl) {
        if (definition.icon) {
            const buttonIcon = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
            button.appendChild(buttonIcon);
            buttonIcon.outerHTML = definition.icon;

            if (definition.text) {
                button.appendChild(document.createTextNode(definition.text));
            }
        } else if (definition.text) {
            button.textContent = definition.text;
        }
        if (definition.inactiveIcon) {
            const buttonIcon = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
            button.appendChild(buttonIcon);
            buttonIcon.outerHTML = definition.inactiveIcon;
        }
        if (definition.tooltip) {
            const buttonTooltip = document.createElement('tf-tooltip');
            buttonTooltip.textContent = definition.tooltip;
            button.appendChild(buttonTooltip);

            if (!definition.text) {
                button.ariaLabel = definition.tooltip;
            }
        }

        button.disabled = disabledOrReadonly;

        if (definition.type) {
            button.addEventListener('mousedown', this.preventDefault);
            button.addEventListener('mouseup', this.onControlActivated.bind(this, toolbarButton));
        }
    }

    private getToolbarEmojiControl(
        definition: ToolbarControlDefinition,
        disabledOrReadonly: boolean,
        controls: HTMLElement[]) {
        const emojiInput = document.createElement('tf-emoji-input');
        emojiInput.role = 'menuitem';
        emojiInput.classList.add('field', 'small');
        emojiInput.tabIndex = -1;
        if (disabledOrReadonly) {
            emojiInput.setAttribute('disabled', '');
        }

        const toolbarButton = new ToolbarControl(emojiInput, definition);

        emojiInput.addEventListener('valuechange', this.onEmojiSelected.bind(this, toolbarButton));

        if (definition.tooltip) {
            const buttonTooltip = document.createElement('tf-tooltip');
            buttonTooltip.textContent = definition.tooltip;
            emojiInput.appendChild(buttonTooltip);
            emojiInput.ariaLabel = definition.tooltip;
        }

        controls.push(emojiInput);
        return {
            controls,
            toolbarButton,
        };
    }

    private getToolbarColorControl(
        definition: ToolbarControlDefinition,
        disabledOrReadonly: boolean,
        controls: HTMLElement[]): { controls?: HTMLElement[], toolbarButton?: ToolbarControl } {
        const colorInput = document.createElement('tf-color-input');
        colorInput.classList.add('field', 'clearable', 'small');
        colorInput.role = 'menuitem';
        colorInput.tabIndex = -1;
        if (definition.icon) {
            colorInput.dataset.icon = new Option(definition.icon).innerHTML;
        }
        colorInput.setAttribute('alpha', '');
        colorInput.setAttribute('button', '');
        if (disabledOrReadonly) {
            colorInput.setAttribute('disabled', '');
        }

        const toolbarButton = new ToolbarControl(colorInput, definition);

        colorInput.addEventListener('valuechange', this.onColorSelected.bind(this, toolbarButton));

        if (definition.tooltip) {
            const buttonTooltip = document.createElement('tf-tooltip');
            buttonTooltip.textContent = definition.tooltip;
            colorInput.appendChild(buttonTooltip);
            colorInput.ariaLabel = definition.tooltip;
        }

        controls.push(colorInput);
        return {
            controls,
            toolbarButton,
        };
    }

    private getToolbarControl(
        definition: ToolbarControlDefinition,
        isWysiwygAvailable: boolean,
        isWysiwyg: boolean,
        disabled: boolean,
        disabledOrReadonly: boolean): { controls?: HTMLElement[], toolbarButtons?: ToolbarControl[] } {
        if ((definition.isStyle
            && !isWysiwygAvailable)
            || (definition.isWysiwyg
                && !isWysiwyg)
            || (definition.isWysiwyg === false
                && isWysiwyg)) {
            return {};
        }

        if (definition.style === ToolbarControlStyle.Separator) {
            const separator = document.createElement('div');
            separator.classList.add('vr');
            separator.role = 'separator';
            separator.ariaOrientation = 'vertical';
            return {
                controls: [separator],
            };
        }

        const controls: HTMLElement[] = [];
        const toolbarButtons: ToolbarControl[] = [];

        if (definition.separatorBefore) {
            const separator = document.createElement('div');
            separator.classList.add('vr');
            separator.role = 'separator';
            separator.ariaOrientation = 'vertical';
            controls.push(separator);
        }

        if (definition.type === CommandType.ForegroundColor
            || definition.type === CommandType.BackgroundColor) {
            return this.getToolbarColorControl(definition, disabledOrReadonly, controls);
        }
        if (definition.type === CommandType.Emoji) {
            return this.getToolbarEmojiControl(definition, disabledOrReadonly, controls);
        }

        if (definition.style === ToolbarControlStyle.Button) {
            let button = document.createElement('button');
            button.classList.add('btn', 'btn-icon', 'rounded', 'small');
            button.role = 'menuitem';
            button.tabIndex = -1;

            const toolbarButton = new ToolbarControl(button, definition);
            this.applyToolbarButtonDefinition(button, definition, disabledOrReadonly, toolbarButton);

            controls.push(button);
            toolbarButtons.push(toolbarButton);
        } else {
            const dropdown = this.getToolbarDropdownControl(
                definition,
                disabled,
                disabledOrReadonly,
                controls,
                false);
            if (dropdown.toolbarButtons) {
                toolbarButtons.push(...dropdown.toolbarButtons);
            }
        }

        return {
            controls,
            toolbarButtons,
        };
    }

    private getToolbarDropdownControl(
        definition: ToolbarControlDefinition,
        disabled: boolean,
        disabledOrReadonly: boolean,
        controls: HTMLElement[],
        child: boolean): { controls?: HTMLElement[], toolbarButtons?: ToolbarControl[] } {
        let button = document.createElement('button');
        button.classList.add('btn', 'btn-icon', 'rounded', 'small');
        button.role = 'menuitem';
        button.ariaHasPopup = 'menu';
        button.tabIndex = -1;

        let control: HTMLElement;

        const toolbarButtons: ToolbarControl[] = [];
        let toolbarButton: ToolbarControl;

        const dropdown = document.createElement('tf-dropdown');
        if (child) {
            dropdown.dataset.activation = '5'; // left-click or hover
        } else {
            dropdown.dataset.activation = '1'; // left-click
        }
        if (disabled) {
            dropdown.setAttribute('disabled', '');
        }

        dropdown.appendChild(button);

        const dropdownPopover = document.createElement('tf-popover');
        dropdownPopover.classList.add('flip-onopen', 'select-popover', 'filled', 'match-width');
        dropdownPopover.dataset.origin = 'top-left';
        if (child) {
            dropdownPopover.dataset.anchorOrigin = 'top-right';
        } else {
            dropdownPopover.dataset.anchorOrigin = 'bottom-left';
        }
        dropdownPopover.style.maxHeight = 'min(300px,90vh)';
        dropdownPopover.style.overflowY = 'auto';
        dropdownPopover.tabIndex = 0;
        dropdown.appendChild(dropdownPopover);

        const list = document.createElement('div');
        list.classList.add('list');
        list.addEventListener('keydown', this.onToolbarKeyDown.bind(this, list, true));
        dropdownPopover.appendChild(list);

        if (definition.style === ToolbarControlStyle.ButtonGroup) {
            if (disabled) {
                button.disabled = true;
            }

            const buttonIcon = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
            button.appendChild(buttonIcon);
            buttonIcon.outerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M480-360 280-560h400L480-360Z"/></svg>`;

            if (definition.dropdownTooltip || definition.tooltip) {
                const dropdownButtonTooltip = document.createElement('tf-tooltip');
                dropdownButtonTooltip.textContent = (definition.dropdownTooltip || definition.tooltip)!;
                button.appendChild(dropdownButtonTooltip);

                if (!definition.text) {
                    button.ariaLabel = (definition.dropdownTooltip || definition.tooltip)!;
                }
            }

            control = document.createElement('div');
            toolbarButton = new ToolbarControl(control, definition);
            toolbarButtons.push(toolbarButton);
            control.classList.add('button-group');

            button = document.createElement('button');
            button.classList.add('btn', 'btn-icon', 'rounded', 'small');
            button.role = 'menuitem';
            button.tabIndex = -1;
            control.appendChild(button);

            dropdown.style.minWidth = '0';
            control.appendChild(dropdown);
        } else {
            dropdown.dataset.delay = '1000';

            control = dropdown;
            toolbarButton = new ToolbarControl(control, definition);
            toolbarButtons.push(toolbarButton);
        }

        for (const childDefinition of definition.buttons!) {
            const childControls: HTMLElement[] = [];

            if (childDefinition.separatorBefore) {
                const separator = document.createElement('hr');
                childControls.push(separator);
            }

            if (childDefinition.buttons) {
                const childControl = this.getToolbarDropdownControl(
                    childDefinition,
                    disabled,
                    disabledOrReadonly,
                    childControls,
                    true);
                if (childControl.toolbarButtons) {
                    toolbarButtons.push(...childControl.toolbarButtons);
                }
            } else {
                const span = document.createElement('span');
                span.tabIndex = -1;
                span.role = 'menuitem';
                if (childDefinition.icon) {
                    const childIcon = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
                    span.appendChild(childIcon);
                    childIcon.outerHTML = childDefinition.icon;

                    if (childDefinition.label) {
                        span.ariaLabel = childDefinition.label;
                    }
                } else if (childDefinition.text) {
                    span.innerHTML = childDefinition.text;
                }
                childControls.push(span);

                const childToolbarButton = new ToolbarControl(span, childDefinition, control);
                span.addEventListener('mousedown', this.preventDefault);
                span.addEventListener('mouseup', this.onControlActivated.bind(this, childToolbarButton));
                toolbarButtons.push(childToolbarButton);
            }

            for (const childControl of childControls) {
                list.appendChild(childControl);
            }
        }

        control.id = randomUUID();
        dropdownPopover.dataset.anchorId = control.id;

        this.applyToolbarButtonDefinition(button, definition, disabledOrReadonly, toolbarButton);

        controls.push(control);

        return {
            controls,
            toolbarButtons,
        };
    }

    private onToolbarKeyDown(toolbar: HTMLDivElement, dropdown: boolean, event: KeyboardEvent) {
        if (dropdown) {
            if (!["ArrowDown", "ArrowUp"].includes(event.key)) {
                return;
            }
        } else if (!["ArrowLeft", "ArrowRight"].includes(event.key)) {
            return;
        }
        const dir = (dropdown && event.key === "ArrowDown")
            || (!dropdown && event.key === "ArrowRight") ? 1 : -1;
        const items = Array.from(toolbar.querySelectorAll(':scope > [tabindex]'))
            .sort(documentPositionComparator);
        if (items.length === 0) {
            return;
        }

        for (let i = dir > 0 ? 0 : items.length,
            found = false;
            (dir > 0 && i < items.length)
            || (dir < 0 && i >= 0);
            i += dir) {
            const item = items[i];
            if (!(item instanceof HTMLElement)
                || !item.hasAttribute('tabindex')) {
                continue;
            }
            if (found) {
                event.preventDefault();
                event.stopPropagation();
                item.tabIndex = 0;
                item.focus();
                return;
            } else if (item.tabIndex < 0) {
                continue;
            } else {
                item.tabIndex = -1;
                found = true;
            }
        }

        const wrap = dir > 0
            ? items.find<HTMLElement>((x): x is HTMLElement => x instanceof HTMLElement)
            : items.findLast<HTMLElement>((x): x is HTMLElement => x instanceof HTMLElement);
        if (wrap) {
            event.preventDefault();
            event.stopPropagation();
            wrap.tabIndex = 0;
            wrap.focus();
        }
    }

    private refreshState(toolbar?: Element | null) {
        const root = this.shadowRoot;
        if (!root) {
            return;
        }

        const syntaxAttribute = this._options?.syntax || this.dataset.syntax;
        const syntax = syntaxAttribute && syntaxes.includes(syntaxAttribute as any)
            ? syntaxAttribute as EditorSyntax
            : 'none';

        if (!toolbar) {
            toolbar = root.querySelector('.editor-toolbar');
            if (!toolbar) {
                return;
            }
        }

        const isWysiwygAvailable = syntax === 'handlebars' || syntax === 'html' || syntax === 'markdown';
        const isWysiwyg = this._isWYSIWYG
            && isWysiwygAvailable;
        const mode: EditorMode = isWysiwyg
            ? EditorMode.WYSIWYG
            : EditorMode.Text;

        const disabled = this.hasAttribute('disabled');
        const disabledOrReadonly = disabled
            || this.hasAttribute('readonly');

        const nodes: Node[] = [];

        const innerToolbar = document.createElement('div');
        innerToolbar.addEventListener('keydown', this.onToolbarKeyDown.bind(this, innerToolbar, false));
        nodes.push(innerToolbar);

        this._toolbarButtons = [];
        for (const definition of toolbarButtonDefinitions) {
            const { controls, toolbarButtons } = this.getToolbarControl(
                definition,
                isWysiwygAvailable,
                isWysiwyg,
                disabled,
                disabledOrReadonly);
            if (controls) {
                for (const control of controls) {
                    innerToolbar.appendChild(control);
                }
            }
            if (toolbarButtons) {
                this._toolbarButtons.push(...toolbarButtons);
            }
        }

        if (!('lockMode' in this.dataset)) {
            if (isWysiwygAvailable) {
                const separator = document.createElement('div');
                separator.classList.add('vr');
                innerToolbar.appendChild(separator);
            }

            const modeButton = document.createElement('button');
            modeButton.classList.add('btn', 'btn-icon', 'rounded', 'small', 'mode-button');
            if (!isWysiwygAvailable) {
                modeButton.classList.add('hidden');
            }
            modeButton.disabled = disabledOrReadonly;
            modeButton.addEventListener('click', this.onModeSwitch.bind(this));
            innerToolbar.appendChild(modeButton);

            const modeButtonIcon = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
            modeButton.appendChild(modeButtonIcon);
            modeButtonIcon.outerHTML = isWysiwyg
                ? `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M344-336 200-480l144-144 56 57-87 87 87 87-56 57Zm272 0-56-57 87-87-87-87 56-57 144 144-144 144ZM200-120q-33 0-56.5-23.5T120-200v-160h80v160h160v80H200Zm400 0v-80h160v-160h80v160q0 33-23.5 56.5T760-120H600ZM120-600v-160q0-33 23.5-56.5T200-840h160v80H200v160h-80Zm640 0v-160H600v-80h160q33 0 56.5 23.5T840-760v160h-80Z"/></svg>`
                : `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-480H200v480Zm280-80q-82 0-146.5-44.5T240-440q29-71 93.5-115.5T480-600q82 0 146.5 44.5T720-440q-29 71-93.5 115.5T480-280Zm0-100q-25 0-42.5-17.5T420-440q0-25 17.5-42.5T480-500q25 0 42.5 17.5T540-440q0 25-17.5 42.5T480-380Zm0 40q42 0 71-29t29-71q0-42-29-71t-71-29q-42 0-71 29t-29 71q0 42 29 71t71 29Z"/></svg>`;

            const modeButtonTooltip = document.createElement('tf-tooltip');
            modeButtonTooltip.textContent = isWysiwyg
                ? 'Edit source code'
                : 'Edit in rich text mode';
            modeButton.appendChild(modeButtonTooltip);
        }

        if (!('lockSyntax' in this.dataset)) {
            if (isWysiwygAvailable && 'lockMode' in this.dataset) {
                const separator = document.createElement('div');
                separator.classList.add('vr');
                innerToolbar.appendChild(separator);
            }

            const syntaxInput = document.createElement('tf-select');
            syntaxInput.classList.add('syntax-select', 'compact');
            syntaxInput.dataset.inputReadonly = '';
            syntaxInput.dataset.popoverLimitHeight = '';
            if (disabledOrReadonly) {
                syntaxInput.setAttribute('disabled', '');
            }
            syntaxInput.setAttribute('size', '10');
            syntaxInput.setAttribute('value', syntax);
            syntaxInput.setAttribute('display', syntaxTextMap[syntax]);
            syntaxInput.addEventListener('valueinput', this.stopEvent.bind(this));
            syntaxInput.addEventListener('valuechange', this.onSyntaxSelect.bind(this));
            innerToolbar.appendChild(syntaxInput);

            const list = document.createElement('div');
            list.classList.add('list');
            list.slot = 'popover';
            syntaxInput.appendChild(list);

            for (const syntax of syntaxes) {
                const option = document.createElement('div');
                option.dataset.closePicker = '';
                option.dataset.closePickerValue = syntax;
                option.dataset.closePickerDisplay = syntaxTextMap[syntax];
                list.appendChild(option);

                const selectedIcon = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
                option.appendChild(selectedIcon);
                selectedIcon.outerHTML = `<svg class="selected-icon" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px"><path d="M0 0h24v24H0z" fill="none"/><path d="M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.11 0 2-.9 2-2V5c0-1.1-.89-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>`;

                const label = document.createElement('span');
                label.innerHTML = syntaxLabelMap[syntax];
                option.appendChild(label);
            }
        }

        const slot = document.createElement('slot');
        slot.name = 'buttons';
        innerToolbar.appendChild(slot);

        if (isWysiwygAvailable
            || !('lockMode' in this.dataset)
            || !('lockSyntax' in this.dataset)) {
            const showAll = document.createElement('button');
            showAll.classList.add('btn', 'btn-icon', 'rounded', 'small', 'editor-toolbar-show-all-btn');
            showAll.tabIndex = -1;
            showAll.addEventListener('click', this.onShowAll.bind(this));
            nodes.push(showAll);

            const showAllIcon = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
            showAll.appendChild(showAllIcon);
            showAllIcon.outerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M240-400q-33 0-56.5-23.5T160-480q0-33 23.5-56.5T240-560q33 0 56.5 23.5T320-480q0 33-23.5 56.5T240-400Zm240 0q-33 0-56.5-23.5T400-480q0-33 23.5-56.5T480-560q33 0 56.5 23.5T560-480q0 33-23.5 56.5T480-400Zm240 0q-33 0-56.5-23.5T640-480q0-33 23.5-56.5T720-560q33 0 56.5 23.5T800-480q0 33-23.5 56.5T720-400Z"/></svg>`;

            const showAllTooltip = document.createElement('tf-tooltip');
            showAllTooltip.textContent = 'show all controls';
            showAll.appendChild(showAllTooltip);
        }

        const firstElement = innerToolbar.querySelector<HTMLElement>('[tabindex]');
        if (firstElement) {
            firstElement.tabIndex = 0;
        }

        toolbar.replaceChildren(...nodes);

        const buttons = Array.from(this.querySelectorAll<HTMLButtonElement>('.custom-editor-button'));
        for (const button of buttons) {
            if ('mode' in button.dataset
                && button.dataset.mode
                && button.dataset.mode !== '0') {
                if (parseInt(button.dataset.mode || '') == mode) {
                    button.classList.remove('hidden');
                } else {
                    button.classList.add('hidden');
                }
            }
        }
    }

    private setActiveEditor(wysiwyg: boolean) {
        const root = this.shadowRoot;
        if (!root) {
            return false;
        }

        const editorElement = root.querySelector('.editor');
        if (!(editorElement instanceof HTMLElement)) {
            return false;
        }

        this._options = this._options || this.getOptions();

        const isWysiwygSyntax = this._options.syntax === 'handlebars'
            || this._options.syntax === 'html'
            || this._options.syntax === 'markdown';

        if (this._activeEditor
            && this._activeEditor.isWYSIWYG === (wysiwyg && isWysiwygSyntax)) {
            return false;
        }

        this._options.autoFocus = true;
        this._options.initialValue = this._activeEditor?.getContent();
        this._options.mode = EditorMode.WYSIWYG;

        this._activeEditor?.dispose();

        const modeButton = root.querySelector('.mode-button');
        const modeButtonIcon = modeButton?.querySelector('svg');
        const modeButtonTooltipPopover = modeButton?.querySelector('.tooltip');

        if (wysiwyg && isWysiwygSyntax) {
            this._wysiwygEditor.initializeEditor(
                this,
                editorElement,
                this.onChange.bind(this),
                this.onInput.bind(this),
                this.update.bind(this),
                this._options);
            this._activeEditor = this._wysiwygEditor;

            if (modeButtonIcon) {
                modeButtonIcon.innerHTML = `<path d="M344-336 200-480l144-144 56 57-87 87 87 87-56 57Zm272 0-56-57 87-87-87-87 56-57 144 144-144 144ZM200-120q-33 0-56.5-23.5T120-200v-160h80v160h160v80H200Zm400 0v-80h160v-160h80v160q0 33-23.5 56.5T760-120H600ZM120-600v-160q0-33 23.5-56.5T200-840h160v80H200v160h-80Zm640 0v-160H600v-80h160q33 0 56.5 23.5T840-760v160h-80Z"/>`;
            }

            if (modeButtonTooltipPopover) {
                modeButtonTooltipPopover.textContent = 'Edit source code';
            }
        } else {
            this._codeEditor.initializeEditor(
                this,
                editorElement,
                this.onChange.bind(this),
                this.onInput.bind(this),
                this.update.bind(this),
                this._options);
            this._activeEditor = this._codeEditor;

            if (modeButtonIcon) {
                modeButtonIcon.innerHTML = `<path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-480H200v480Zm280-80q-82 0-146.5-44.5T240-440q29-71 93.5-115.5T480-600q82 0 146.5 44.5T720-440q-29 71-93.5 115.5T480-280Zm0-100q-25 0-42.5-17.5T420-440q0-25 17.5-42.5T480-500q25 0 42.5 17.5T540-440q0 25-17.5 42.5T480-380Zm0 40q42 0 71-29t29-71q0-42-29-71t-71-29q-42 0-71 29t-29 71q0 42 29 71t71 29Z"/>`;
            }

            if (modeButtonTooltipPopover) {
                modeButtonTooltipPopover.textContent = 'Edit in rich text mode';
            }
        }

        this.refreshState();
        return true;
    }

    private setValidity() {
        const flags: ValidityStateFlags = {};
        const messages: string[] = [];

        if (!this._value || !this._value.length) {
            if (this.hasAttribute('required')) {
                flags.valueMissing = true;
                messages.push('value required');
            }
        }

        const root = this.shadowRoot;
        if (Object.keys(flags).length > 0) {
            this._internals.setValidity(
                flags,
                messages.join('; '),
                root?.querySelector('.editor') || undefined);
        } else {
            this._internals.setValidity({});
        }

        if (!root) {
            return;
        }
        const validationList = root.querySelector('.validation-messages');
        if (validationList) {
            validationList.replaceChildren(...messages.map(m => {
                const li = document.createElement('li');
                li.textContent = m;
                return li;
            }));
        }
    }

    private stopEvent(event: Event) {
        event.preventDefault();
        event.preventDefault();
    }

    private themeChange(mutations: MutationRecord[]) {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes'
                && mutation.target instanceof HTMLElement) {
                const theme = mutation.target.dataset.theme;
                if (theme) {
                    this._codeEditor.setTheme(theme);
                }
            }
        }, this);
    }
}

function getDialog(
    title: string,
    content: Node[],
    callback: (value: unknown) => void,
    value?: (form: HTMLFormElement) => unknown,
    validity?: (form: HTMLFormElement) => boolean) {
    const close = (ev: Event) => {
        ev.preventDefault();
        ev.stopPropagation();

        if (!(ev.target instanceof HTMLElement)) {
            return;
        }

        const dialog = ev.target.closest('dialog');
        if (dialog) {
            dialog.close();
        }
    };

    const container = document.createElement('div');
    container.classList.add('dialog-container');
    document.body.appendChild(container);

    const overlay = document.createElement('div');
    overlay.classList.add('overlay');
    overlay.addEventListener('click', close);
    container.appendChild(overlay);

    const dialog = document.createElement('dialog') as Dialog;
    dialog.id = randomUUID();
    dialog.classList.add('resizable');
    dialog.style.minWidth = 'fit-content';
    dialog.style.width = '50vw';
    dialog.addEventListener('close', ev => {
        if (!(ev.target instanceof HTMLDialogElement)) {
            return;
        }

        const form = ev.target.querySelector('form');
        if (ev.target.returnValue === 'ok') {
            if (form && !form.checkValidity()) {
                return;
            }

            const returnValue = form && typeof value === 'function'
                ? value(form)
                : undefined;

            callback(returnValue);
        }
        if (form) {
            form.reset();
        }
    });
    container.appendChild(dialog);

    const dialogInner = document.createElement('div');
    dialog.appendChild(dialogInner);

    const header = document.createElement('div');
    header.classList.add('header', 'draggable');
    dialogInner.appendChild(header);

    const heading = document.createElement('h6');
    heading.textContent = title;
    header.appendChild(heading);

    const closeButton = document.createElement('tf-close');
    closeButton.addEventListener('click', close);
    header.appendChild(closeButton);

    const body = document.createElement('div');
    body.classList.add('body');
    dialogInner.appendChild(body);

    const form = document.createElement('form');
    form.id = randomUUID();
    body.appendChild(form);

    const validate = (ev: Event) => {
        if (!(ev.target instanceof HTMLElement)) {
            return;
        }

        const form = ev.target.closest('form');
        if (!form) {
            return;
        }

        const okButton = ev.target.closest('dialog')?.querySelector<HTMLButtonElement>('.ok-button');
        if (okButton) {
            okButton.disabled = !form.checkValidity()
                || (typeof validity === 'function' && !validity(form));
        }
    };

    for (const node of content) {
        if ((node instanceof TavenemInputHtmlElement
            || node instanceof TavenemInputFieldHtmlElement
            || node instanceof TavenemSelectInputHtmlElement)
            && node.required) {
            node.addEventListener('valueinput', validate);
            node.addEventListener('valuechange', validate);
        } else if (node instanceof Element) {
            const tfInput = node.querySelector<TavenemInputHtmlElement | TavenemInputFieldHtmlElement | TavenemSelectInputHtmlElement>('tf-input, tf-input-field, tf-select');
            if (tfInput) {
                if (tfInput.required) {
                    tfInput.addEventListener('valueinput', validate);
                    tfInput.addEventListener('valuechange', validate);
                }
            } else {
                const input = node.querySelector('input');
                if (input && input.required) {
                    input.addEventListener('input', validate);
                    input.addEventListener('change', validate);
                }
            }
        }
    }
    form.append(...content);

    const footer = document.createElement('div');
    footer.classList.add('footer');
    dialogInner.appendChild(footer);

    const buttons = document.createElement('div');
    buttons.classList.add('message-box-buttons');
    footer.appendChild(buttons);

    const cancelButton = document.createElement('button');
    cancelButton.classList.add('btn', 'btn-text');
    cancelButton.textContent = 'Cancel';
    cancelButton.addEventListener('click', close);
    buttons.appendChild(cancelButton);

    const okButton = document.createElement('button');
    okButton.classList.add('btn', 'btn-text', 'primary', 'ok-button');
    okButton.disabled = true;
    okButton.value = 'ok';
    okButton.formMethod = 'dialog';
    okButton.textContent = 'OK';
    okButton.setAttribute('form', form.id);
    buttons.appendChild(okButton);

    initializeDialog(dialog);
    return dialog;
}

function getFonts() {
    const validFonts: string[] = [];
    for (const font of fonts) {
        if (document.fonts.check('1em ' + font)) {
            validFonts.push(font);
        }
    }
    return validFonts;
}