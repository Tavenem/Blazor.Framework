import { html_beautify } from 'js-beautify';
import { EditorView, placeholder } from '@codemirror/view';
import { Extension, EditorState, Compartment, TransactionSpec } from '@codemirror/state';
import { redo as codeRedo, undo as codeUndo } from '@codemirror/commands';

import {
    EditorState as PMEditorState,
    Plugin,
    Selection,
    Transaction
} from 'prosemirror-state';
import { Decoration, DecorationSet, EditorView as PMEditorView, NodeView } from 'prosemirror-view';
import { DOMParser as PMDOMParser, Node as ProsemirrorNode } from 'prosemirror-model';
import {
    baseKeymap,
    chainCommands,
    deleteSelection,
    joinBackward,
    selectNodeBackward,
} from 'prosemirror-commands';
import { keymap as pmKeymap } from 'prosemirror-keymap';
import { inputRules } from 'prosemirror-inputrules';
import { history as pmHistory } from 'prosemirror-history';
import { dropCursor as pmDropCursor } from 'prosemirror-dropcursor';
import { gapCursor } from 'prosemirror-gapcursor';
import { buildKeymap, buildInputRules } from 'prosemirror-example-setup';
import {
    makeBlockMathInputRule,
    makeInlineMathInputRule,
    REGEX_INLINE_MATH_DOLLARS,
    REGEX_BLOCK_MATH_DOLLARS,
    mathPlugin,
    mathBackspaceCmd,
    insertMathCmd,
    mathSerializer
} from "@benrbray/prosemirror-math";

import {
    CommandSet,
    CommandType,
    commonCommands,
    schema,
    ParamStateCommand,
    exitDiv,
    renderer,
} from './editor/_schemas';
import { elementStyle } from './editor/_element-style';
import { htmlCommands } from './editor/_html';
import { markdownCommands, tavenemMarkdownParser, tavenemMarkdownSerializer } from './editor/_markdown';
import { EditorSyntax, codeEditorLanguageMap, syntaxes, syntaxLabelMap, syntaxTextMap } from './editor/_syntax';
import { cellMinWidth, columnResizing, fixTables, goToNextCell, tableEditing, TableView } from './editor/_tables';
import {
    codeEditorDarkExtension,
    codeEditorLightTheme,
} from './editor/_themes';
import { toolbarButtonDefinitions, ToolbarControl, ToolbarControlDefinition, ToolbarControlStyle } from './editor/_toolbar';
import { randomUUID } from './tavenem-utility'
import { TavenemDropdownHTMLElement, TavenemTooltipHTMLElement } from './_popover';
import { TavenemInputHtmlElement } from './_input';
import { TavenemColorInputHtmlElement } from './_color-input';
import { TavenemEmojiHTMLElement } from './_emoji';
import { Dialog, initialize as initializeDialog } from './tavenem-dialog';
import { codeEditorPlainText, codeEditorThemeCompartment, defaultCodeExtensions } from './editor/_code-editing';
import { CodeBlockView } from './editor/_code-block-view';
import { ThemePreference, getPreferredTavenemColorScheme } from './_theme';
import { TavenemCheckboxHtmlElement } from './_checkbox';
import { TavenemInputFieldHtmlElement } from './_input-field';
import { TavenemSelectInputHtmlElement } from './_select';

enum EditorMode {
    None = 0,
    Text = 1,
    WYSIWYG = 2,
}

interface EditorOptions {
    autoFocus: boolean;
    initialValue?: string;
    mode: EditorMode;
    placeholder?: string;
    readOnly: boolean;
    syntax: EditorSyntax;
    updateOnInput: boolean;
}

interface EditorInfo {
    debounce?: number;
    options: EditorOptions;
    tavenemEditor: TavenemEditorHtmlElement;
}

interface CodeEditorInfo extends EditorInfo {
    view: EditorView;
    language: Compartment;
    readOnly: Compartment;
}

interface CommandInfo {
    active: boolean,
    enabled: boolean,
}

type CommandUpdateInfo = { [K in CommandType]?: CommandInfo }
interface UpdateInfo {
    commands?: CommandUpdateInfo;
    currentNode?: string | null;
}

class TavenemCodeEditor {
    _editor?: CodeEditorInfo;

    dispose() {
        if (this._editor) {
            this._editor.view.destroy();
        }
        delete this._editor;
    }

    initializeEditor(
        tavenemEditor: TavenemEditorHtmlElement,
        element: HTMLElement,
        options: EditorOptions) {
        if (this._editor) {
            this._editor.view.destroy();
            delete this._editor;
        }

        const languageExtension = options.syntax
            ? codeEditorLanguageMap[options.syntax] || codeEditorPlainText
            : codeEditorPlainText;
        const languageCompartment = new Compartment;

        const readOnlyCompartment = new Compartment;

        const themePreference = getPreferredTavenemColorScheme();

        const extensions: Extension[] = defaultCodeExtensions.concat([
            codeEditorThemeCompartment.of(themePreference == ThemePreference.Dark
                ? codeEditorDarkExtension
                : codeEditorLightTheme),
            languageCompartment.of(languageExtension),
            readOnlyCompartment.of(EditorState.readOnly.of(options.readOnly || false)),
            EditorView.updateListener.of(update => {
                if (!update.docChanged) {
                    return;
                }

                const tavenemEditorElement = update.view.dom.parentElement?.parentElement as TavenemEditorHtmlElement;
                if (!tavenemEditorElement?._tavenemCodeEditor?._editor) {
                    return;
                }

                if (tavenemEditorElement._tavenemCodeEditor._editor.debounce) {
                    clearTimeout(tavenemEditorElement._tavenemCodeEditor._editor.debounce);
                }

                tavenemEditorElement._tavenemCodeEditor._editor.debounce = setTimeout(
                    tavenemEditorElement._tavenemCodeEditor.onInput.bind(tavenemEditorElement._tavenemCodeEditor),
                    500);
            }),
            EditorView.domEventHandlers({
                'blur': function (_, view) {
                    const tavenemEditorElement = view.dom.parentElement?.parentElement as TavenemEditorHtmlElement;
                    if (!tavenemEditorElement?._tavenemCodeEditor?._editor) {
                        return;
                    }

                    tavenemEditorElement._tavenemCodeEditor._editor.tavenemEditor.onChange(view.state.doc.toString());
                }
            }),
        ]);
        if (options.placeholder
            && options.placeholder.length) {
            extensions.push(placeholder(options.placeholder));
        }

        const view = new EditorView({
            state: EditorState.create({
                doc: options.initialValue,
                extensions: extensions,
            }),
            parent: element,
            root: tavenemEditor.shadowRoot || undefined,
        });

        this._editor = {
            view,
            language: languageCompartment,
            options,
            readOnly: readOnlyCompartment,
            tavenemEditor,
        };

        this.onInput();

        if (options.autoFocus) {
            view.focus();
        }
    }

    updateSelectedText(value?: string | null) {
        if (!this._editor) {
            return;
        }

        if (!value || !value.length) {
            this._editor.view.dispatch(this._editor.view.state.replaceSelection(''));
        } else {
            this._editor.view.dispatch(this._editor.view.state.replaceSelection(value));
        }

        this._editor.tavenemEditor.onChange(this._editor.view.state.doc.toString());
    }

    private onInput() {
        if (!this._editor) {
            return;
        }
        const updateInfo: UpdateInfo = {
            commands: {},
            currentNode: null,
        };
        updateInfo.commands![CommandType.Undo] = {
            active: false,
            enabled: codeUndo({
                state: this._editor.view.state,
                dispatch: _ => {},
            }),
        };
        updateInfo.commands![CommandType.Redo] = {
            active: false,
            enabled: codeRedo({
                state: this._editor.view.state,
                dispatch: _ => { },
            }),
        };
        this._editor.tavenemEditor.update(updateInfo);

        if (this._editor.options.updateOnInput) {
            this._editor.tavenemEditor.onInput(this._editor.view.state.doc.toString());
        }
    }
}

class MenuView implements NodeView {
    _commands: CommandSet;
    _editorView: PMEditorView;
    _tavenemEditor: TavenemEditorHtmlElement;

    constructor(
        tavenemEditor: TavenemEditorHtmlElement,
        commands: CommandSet,
        editorView: PMEditorView) {
        this._commands = commands;
        this._editorView = editorView;
        this._tavenemEditor = tavenemEditor;
        this.update();
    }

    update() {
        const updateInfo: UpdateInfo = {
            commands: {},
            currentNode: null,
        };

        const head = this._editorView.state.selection.$head;
        const depth = head.sharedDepth(this._editorView.state.selection.anchor);
        if (depth == 0) {
            updateInfo.currentNode = 'document';
        } else {
            let path = '';
            for (let i = 1; i <= depth; i++) {
                if (path.length) {
                    path += ' > ';
                }
                path += this.nodeName(head.node(i));
            }
            if (path.length == 0) {
                path = this.nodeName(this._editorView.state.selection.$head.parent);
            }
            updateInfo.currentNode = path;
        }

        for (const type in this._commands) {
            const commandType = type as unknown as CommandType;
            const command = this._commands[commandType];
            if (command) {
                const update = {
                    active: false,
                    enabled: false,
                };
                if (command.isActive) {
                    update.active = command.isActive(this._editorView.state, command.markType);
                }
                update.enabled = command.isEnabled
                    ? command.isEnabled(this._editorView.state)
                    : command.command(this._editorView.state, undefined, this._editorView);
                updateInfo.commands![commandType] = update;
            }
        }
        this._tavenemEditor.update(updateInfo);
    }

    private nodeName(node: ProsemirrorNode) {
        let name = node.type.name.replace('_', ' ');
        if (node.type == this._editorView.state.schema.nodes.heading) {
            name += ' ' + node.attrs.level;
        }
        return name;
    }
}

class HeadView implements NodeView {
    dom: Node;

    constructor(
        public node: ProsemirrorNode,
        public view: PMEditorView,
        public getPos: () => number | undefined) {
        this.dom = this.createContent(node);
    }

    stopEvent() { return true; }

    update(node: ProsemirrorNode) {
        if (node.type != this.node.type) {
            return false;
        }
        this.dom = this.createContent(node);
        return true;
    }

    private createContent(node: ProsemirrorNode) {
        const head = document.createElement('head');
        head.appendChild(renderer.serializeFragment(node.content));
        const value = html_beautify(head.innerHTML, {
            extra_liners: [],
            indent_size: 2,
            wrap_line_length: 0,
        });
        const dom = document.createElement('head');
        dom.appendChild(document.createComment(value));
        return dom;
    }
}

class CheckboxView implements NodeView {
    dom: Node;

    constructor(
        public node: ProsemirrorNode,
        public view: PMEditorView,
        public getPos: () => number | undefined) {
        this.dom = this.createContent(node);
    }

    stopEvent() { return true; }

    update(node: ProsemirrorNode) {
        if (node.type !== this.node.type) {
            return false;
        }
        this.dom = this.createContent(node);
        return true;
    }

    destroy() {
        if (this.dom) {
            this.dom.removeEventListener('change', this.onChange.bind(this));
            this.dom.removeEventListener('input', this.onChange.bind(this));
        }
    }

    private createContent(node: ProsemirrorNode) {
        const element = document.createElement('input');
        for (const a of Object.keys(node.attrs)) {
            if (FormView.ForbiddenAttributes.includes(a)
                || (!node.attrs[a]
                    && (typeof node.attrs[a] !== 'number'
                        || node.attrs[a] !== 0))) {
                continue;
            }
            element.setAttribute(a, node.attrs[a]);
        }
        element.type = 'checkbox';
        if (element.hasAttribute('indeterminate')) {
            element.indeterminate = true;
        }
        element.addEventListener('change', this.onChange.bind(this));
        element.addEventListener('input', this.onChange.bind(this));
        return element;
    }

    private onChange(event: Event) {
        event.stopPropagation();

        if (!(this.dom instanceof HTMLInputElement)) {
            return;
        }
        if (this.dom.checked) {
            this.dom.setAttribute('checked', '');
        } else {
            this.dom.removeAttribute('checked');
        }
    }
}

class DetailsView implements NodeView {
    dom: HTMLDetailsElement;
    contentDOM: HTMLDetailsElement;

    constructor(
        public node: ProsemirrorNode,
        public view: PMEditorView,
        public getPos: () => number | undefined) {
        this.dom = this.contentDOM = document.createElement('details');
        if (node.attrs['open']) {
            this.dom.open = true;
        }

        this.dom.addEventListener('click', this.onClick.bind(this));
    }

    destroy() {
        this.dom.removeEventListener('click', this.onClick.bind(this));
    }

    update(node: ProsemirrorNode) {
        return node.type.name === 'details';
    }

    private onClick(event: MouseEvent) {
        if (event.target instanceof HTMLDetailsElement
            || (event.target instanceof HTMLElement
                && event.target.closest('summary')) {
            this.view.dispatch(this.view.state.tr.setNodeMarkup(
                this.getPos(),
                undefined,
                {
                    ...this.node.attrs,
                    open: !this.node.attrs.open,
                }));
        }
    }
}

class DisabledInputView implements NodeView {
    dom: Node;

    constructor(
        public node: ProsemirrorNode,
        public view: PMEditorView,
        public getPos: () => number | undefined) {
        this.dom = this.createContent(node);
    }

    stopEvent() { return true; }

    update(node: ProsemirrorNode) {
        if (node.type !== this.node.type) {
            return false;
        }
        this.dom = this.createContent(node);
        return true;
    }

    private createContent(node: ProsemirrorNode) {
        const element = document.createElement('input');
        for (const a of Object.keys(node.attrs)) {
            if (FormView.ForbiddenAttributes.includes(a)
                || (!node.attrs[a]
                    && (typeof node.attrs[a] !== 'number'
                        || node.attrs[a] !== 0))) {
                continue;
            }
            element.setAttribute(a, node.attrs[a]);
        }
        element.setAttribute('disabled', '');
        return element;
    }
}

class ForbiddenView implements NodeView {
    dom: Node;

    constructor(
        public node: ProsemirrorNode,
        public view: PMEditorView,
        public getPos: () => number | undefined) {
        this.dom = this.createContent(node);
    }

    stopEvent() { return true; }

    update(node: ProsemirrorNode) {
        if (node.type !== this.node.type) {
            return false;
        }
        this.dom = this.createContent(node);
        return true;
    }

    private createContent(node: ProsemirrorNode) {
        const div = document.createElement('div');
        div.appendChild(renderer.serializeNode(node));
        const value = html_beautify(div.innerHTML, {
            extra_liners: [],
            indent_size: 2,
            wrap_line_length: 0,
        });
        const dom = document.createElement('div');
        dom.appendChild(document.createComment(value));
        return dom;
    }
}

class FormView implements NodeView {
    dom: Node;
    contentDom?: HTMLElement;

    static ForbiddenAttributes = [
        'action',
        'capture',
        'form',
        'formaction',
        'formenctype',
        'formmethod',
        'formnovalidate',
        'formtarget',
        'name',
        'popovertarget',
        'popovertargetaction',
        'required',
        'target',
    ];

    constructor(
        public node: ProsemirrorNode,
        public view: PMEditorView,
        public getPos: () => number | undefined) {
        this.dom = this.createContent(node);
        this.contentDom = this.dom instanceof HTMLElement ? this.dom : undefined;
    }

    stopEvent() { return true; }

    update(node: ProsemirrorNode) {
        if (node.type !== this.node.type) {
            return false;
        }
        this.dom = this.createContent(node);
        this.contentDom = this.dom instanceof HTMLElement ? this.dom : undefined;
        return true;
    }

    private createContent(node: ProsemirrorNode) {
        const element = node.type.spec.parseDOM && node.type.spec.parseDOM.length
            ? document.createElement(node.type.spec.parseDOM[0].tag)
            : document.createElement('div');
        for (const a of Object.keys(node.attrs)) {
            if (FormView.ForbiddenAttributes.includes(a)
                || (!node.attrs[a]
                && (typeof node.attrs[a] !== 'number'
                    || node.attrs[a] !== 0))) {
                continue;
            }
            element.setAttribute(a, node.attrs[a]);
        }
        element.setAttribute('disabled', '');
        return element;
    }
}

class InputView implements NodeView {
    dom: Node;

    constructor(
        public node: ProsemirrorNode,
        public view: PMEditorView,
        public getPos: () => number | undefined) {
        this.dom = this.createContent(node);
    }

    stopEvent() { return true; }

    update(node: ProsemirrorNode) {
        if (node.type !== this.node.type) {
            return false;
        }
        this.dom = this.createContent(node);
        return true;
    }

    destroy() {
        if (this.dom) {
            this.dom.removeEventListener('change', this.onChange.bind(this));
            this.dom.removeEventListener('input', this.onChange.bind(this));
        }
    }

    private createContent(node: ProsemirrorNode) {
        const element = document.createElement('input');
        for (const a of Object.keys(node.attrs)) {
            if (FormView.ForbiddenAttributes.includes(a)
                || (!node.attrs[a]
                    && (typeof node.attrs[a] !== 'number'
                        || node.attrs[a] !== 0))) {
                continue;
            }
            element.setAttribute(a, node.attrs[a]);
        }
        element.addEventListener('change', this.onChange.bind(this));
        element.addEventListener('input', this.onChange.bind(this));
        return element;
    }

    private onChange(event: Event) {
        event.stopPropagation();

        if (!(this.dom instanceof HTMLInputElement)
            || !(event.target instanceof HTMLInputElement)) {
            return;
        }
        this.dom.setAttribute('value', event.target.value);
    }
}

class RadioView implements NodeView {
    dom: Node;

    constructor(
        public node: ProsemirrorNode,
        public view: PMEditorView,
        public getPos: () => number | undefined) {
        this.dom = this.createContent(node);
    }

    stopEvent() { return true; }

    update(node: ProsemirrorNode) {
        if (node.type !== this.node.type) {
            return false;
        }
        this.dom = this.createContent(node);
        return true;
    }

    destroy() {
        if (this.dom) {
            this.dom.removeEventListener('change', this.onChange.bind(this));
            this.dom.removeEventListener('input', this.onChange.bind(this));
        }
    }

    private createContent(node: ProsemirrorNode) {
        const element = document.createElement('input');
        for (const a of Object.keys(node.attrs)) {
            if (FormView.ForbiddenAttributes.includes(a)
                || (!node.attrs[a]
                    && (typeof node.attrs[a] !== 'number'
                        || node.attrs[a] !== 0))) {
                continue;
            }
            element.setAttribute(a, node.attrs[a]);
        }
        element.type = 'radio';
        element.addEventListener('change', this.onChange.bind(this));
        element.addEventListener('input', this.onChange.bind(this));
        return element;
    }

    private onChange(event: Event) {
        event.stopPropagation();

        if (!(this.dom instanceof HTMLInputElement)) {
            return;
        }
        if (this.dom.checked) {
            this.dom.setAttribute('checked', '');
        } else {
            this.dom.removeAttribute('checked');
        }
    }
}

class ResetInputView implements NodeView {
    dom: Node;

    constructor(
        public node: ProsemirrorNode,
        public view: PMEditorView,
        public getPos: () => number | undefined) {
        this.dom = this.createContent(node);
    }

    stopEvent() { return true; }

    update(node: ProsemirrorNode) {
        if (node.type !== this.node.type) {
            return false;
        }
        this.dom = this.createContent(node);
        return true;
    }

    destroy() {
        if (this.dom) {
            this.dom.removeEventListener('click', this.onClick.bind(this));
        }
    }

    private createContent(node: ProsemirrorNode) {
        const element = document.createElement('input');
        for (const a of Object.keys(node.attrs)) {
            if (FormView.ForbiddenAttributes.includes(a)
                || (!node.attrs[a]
                    && (typeof node.attrs[a] !== 'number'
                        || node.attrs[a] !== 0))) {
                continue;
            }
            element.setAttribute(a, node.attrs[a]);
        }
        // replace with normal button to prevent the automatic reset behavior from affecting any containing form
        element.type = 'button';
        if (!element.value.length) {
            element.value = 'Reset';
        }
        element.addEventListener('click', this.onClick.bind(this));
        return element;
    }

    private onClick(event: Event) {
        event.preventDefault();
        event.stopPropagation();
    }
}

class SelectView implements NodeView {
    dom: Node;

    static ForbiddenAttributes = [
        'form',
        'name',
        'required',
    ];

    constructor(
        public node: ProsemirrorNode,
        public view: PMEditorView,
        public getPos: () => number | undefined) {
        this.dom = this.createContent(node);
    }

    stopEvent() { return true; }

    update(node: ProsemirrorNode) {
        if (node.type !== this.node.type) {
            return false;
        }
        this.dom = this.createContent(node);
        return true;
    }

    destroy() {
        if (this.dom) {
            this.dom.removeEventListener('change', this.onChange.bind(this));
            this.dom.removeEventListener('input', this.onChange.bind(this));
        }
    }

    private addChildren(node: ProsemirrorNode, element: HTMLElement) {
        node.forEach(child => {
            const childElement = child.type.name === 'horizontal_rule'
                ? document.createElement('hr')
                : document.createElement(child.type.name);
            for (const a of Object.keys(child.attrs)) {
                if (!node.attrs[a]
                    && (typeof node.attrs[a] !== 'number'
                        || node.attrs[a] !== 0)) {
                    continue;
                }
                childElement.setAttribute(a, node.attrs[a]);
            }
            element.appendChild(childElement);

            this.addChildren(child, childElement);
        });
    }

    private createContent(node: ProsemirrorNode) {
        const element = document.createElement('select');
        for (const a of Object.keys(node.attrs)) {
            if (SelectView.ForbiddenAttributes.includes(a)
                || (!node.attrs[a]
                    && (typeof node.attrs[a] !== 'number'
                        || node.attrs[a] !== 0))) {
                continue;
            }
            element.setAttribute(a, node.attrs[a]);
        }

        this.addChildren(node, element);

        element.addEventListener('change', this.onChange.bind(this));
        element.addEventListener('input', this.onChange.bind(this));

        return element;
    }

    private onChange(event: Event) {
        event.stopPropagation();

        if (!(this.dom instanceof HTMLSelectElement)
            || !(event.target instanceof HTMLSelectElement)) {
            return;
        }
        this.dom
            .querySelectorAll('[selected]')
            .forEach(x => {
                x.removeAttribute('selected');
            });
        if (event.target.value) {
            for (const option of this.dom.querySelectorAll('option')) {
                if (option.value == event.target.value) {
                    option.setAttribute('selected', '');
                    break;
                }
            }
        }
    }
}

class TextAreaView implements NodeView {
    dom: Node;
    contentDom?: HTMLElement;

    static ForbiddenAttributes = [
        'form',
        'name',
        'required',
    ];

    constructor(
        public node: ProsemirrorNode,
        public view: PMEditorView,
        public getPos: () => number | undefined) {
        this.dom = this.createContent(node);
        this.contentDom = this.dom instanceof HTMLElement ? this.dom : undefined;
    }

    stopEvent() { return true; }

    update(node: ProsemirrorNode) {
        if (node.type !== this.node.type) {
            return false;
        }
        this.dom = this.createContent(node);
        this.contentDom = this.dom instanceof HTMLElement ? this.dom : undefined;
        return true;
    }

    private createContent(node: ProsemirrorNode) {
        const element = node.type.spec.parseDOM && node.type.spec.parseDOM.length
            ? document.createElement(node.type.spec.parseDOM[0].tag)
            : document.createElement('div');
        for (const a of Object.keys(node.attrs)) {
            if (TextAreaView.ForbiddenAttributes.includes(a)
                || (!node.attrs[a]
                && (typeof node.attrs[a] !== 'number'
                    || node.attrs[a] !== 0))) {
                continue;
            }
            element.setAttribute(a, node.attrs[a]);
        }
        return element;
    }
}

const arrowHandlers = pmKeymap({
    ArrowLeft: arrowHandler("left"),
    ArrowRight: arrowHandler("right"),
    ArrowUp: arrowHandler("up"),
    ArrowDown: arrowHandler("down"),
});

interface WysiwygEditorInfo extends EditorInfo {
    commands: CommandSet;
    isMarkdown: boolean;
    view: PMEditorView;
}

class TavenemWysiwygEditor {
    _editor?: WysiwygEditorInfo;

    dispose() {
        if (this._editor) {
            this._editor.view.destroy();
        }
        delete this._editor;
    }

    getContent() {
        if (!this._editor) {
            return;
        }
        if (this._editor.isMarkdown) {
            return tavenemMarkdownSerializer.serialize(this._editor.view.state.doc);
        }
        const div = document.createElement('div');
        div.appendChild(renderer.serializeFragment(this._editor.view.state.doc.content));
        return html_beautify(div.innerHTML, {
            extra_liners: [],
            indent_size: 2,
            wrap_line_length: 0,
        });
    }

    initializeEditor(
        tavenemEditor: TavenemEditorHtmlElement,
        element: HTMLElement,
        options: EditorOptions) {
        if (this._editor) {
            this._editor.view.destroy();
            delete this._editor;
        }

        const isMarkdown = options.syntax === 'markdown';

        let doc: ProsemirrorNode;
        if (isMarkdown) {
            doc = tavenemMarkdownParser.parse(options.initialValue || '');
        } else {
            const div = document.createElement('div');
            if (options.initialValue) {
                if (options.initialValue.trimStart().startsWith('<html')) {
                    div.appendChild(new DOMParser()
                        .parseFromString(options.initialValue, 'text/html')
                        .documentElement);
                } else {
                    div.innerHTML = options.initialValue;
                }
            }
            doc = PMDOMParser
                .fromSchema(schema)
                .parse(div);
        }

        const inlineMathInputRule = makeInlineMathInputRule(REGEX_INLINE_MATH_DOLLARS, schema.nodes.math_inline);
        const blockMathInputRule = makeBlockMathInputRule(REGEX_BLOCK_MATH_DOLLARS, schema.nodes.math_display);

        const commands = commonCommands(schema);
        const menu = tavenemEditor ? new Plugin({
            view(editorView) {
                return new MenuView(tavenemEditor, commands, editorView);
            }
        }) : null;

        const placeholder = (text: string) => new Plugin({
            props: {
                decorations(state) {
                    const doc = state.doc;
                    if (doc.childCount > 1
                        || (doc.firstChild
                            && (!doc.firstChild.isTextblock
                                || doc.firstChild.content.size > 0))) {
                        return null;
                    }
                    const div = document.createElement('div');
                    div.classList.add('editor-placeholder');
                    div.textContent = text;
                    return DecorationSet.create(doc, [Decoration.widget(1, div)]);
                }
            }
        });

        const plugins = [
            mathPlugin,
            tableEditing,
            arrowHandlers,
            inputRules({ rules: [inlineMathInputRule, blockMathInputRule] }),
            buildInputRules(schema),
            pmKeymap({
                "Mod-Space": insertMathCmd(schema.nodes.math_inline),
                "Backspace": chainCommands(deleteSelection, mathBackspaceCmd, joinBackward, selectNodeBackward),
                "Tab": goToNextCell(1),
                "Shift-Tab": goToNextCell(-1),
                "Ctrl-Enter": exitDiv,
            }),
            pmKeymap(buildKeymap(schema)),
            pmKeymap(baseKeymap),
            pmDropCursor(),
            gapCursor(),
            pmHistory(),
            columnResizing,
        ];
        if (options.placeholder) {
            plugins.push(placeholder(options.placeholder));
        }

        let state = PMEditorState.create({ doc, plugins });
        const fixed = fixTables(state);
        if (fixed) {
            state = state.apply(fixed.setMeta("addToHistory", false));
        }

        const view = new PMEditorView(element, {
            state: state,
            plugins: menu ? [menu] : undefined,
            clipboardTextSerializer: slice => { return mathSerializer.serializeSlice(slice) },
            editable: () => !options.readOnly,
            nodeViews: {
                button: (node, view, getPos, _) => new FormView(node, view, getPos),
                canvas: (node, view, getPos, _) => new ForbiddenView(node, view, getPos),
                checkbox: (node, view, getPos, _) => new CheckboxView(node, view, getPos),
                code_block: (node, view, getPos, _) => new CodeBlockView(node, view, getPos),
                details: (node, view, getPos, _) => new DetailsView(node, view, getPos),
                dialog: (node, view, getPos, _) => new ForbiddenView(node, view, getPos),
                fieldset: (node, view, getPos, _) => new FormView(node, view, getPos),
                file_input: (node, view, getPos, _) => new DisabledInputView(node, view, getPos),
                form: (node, view, getPos, _) => new FormView(node, view, getPos),
                head: (node, view, getPos, _) => new HeadView(node, view, getPos),
                iframe: (node, view, getPos, _) => new ForbiddenView(node, view, getPos),
                image_input: (node, view, getPos, _) => new DisabledInputView(node, view, getPos),
                input: (node, view, getPos, _) => new InputView(node, view, getPos),
                noscript: (node, view, getPos, _) => new ForbiddenView(node, view, getPos),
                object: (node, view, getPos, _) => new ForbiddenView(node, view, getPos),
                option: (node, view, getPos, _) => new FormView(node, view, getPos),
                radio: (node, view, getPos, _) => new RadioView(node, view, getPos),
                reset_input: (node, view, getPos, _) => new ResetInputView(node, view, getPos),
                script: (node, view, getPos, _) => new ForbiddenView(node, view, getPos),
                select: (node, view, getPos, _) => new SelectView(node, view, getPos),
                submit_input: (node, view, getPos, _) => new DisabledInputView(node, view, getPos),
                table: (node, _view, _getPos, _) => new TableView(node, cellMinWidth),
                textarea: (node, view, getPos, _) => new TextAreaView(node, view, getPos),
            },
            dispatchTransaction(tr) {
                (this as unknown as PMEditorView).updateState(this.state.apply(tr));

                if (!tr.docChanged) {
                    return;
                }

                const tavenemEditorElement = (this as unknown as PMEditorView).dom.parentElement?.parentElement as TavenemEditorHtmlElement;
                if (!tavenemEditorElement?._tavenemWysiwygEditor?._editor
                    || !tavenemEditorElement._tavenemWysiwygEditor._editor.options.updateOnInput) {
                    return;
                }

                if (tavenemEditorElement._tavenemWysiwygEditor._editor.debounce) {
                    clearTimeout(tavenemEditorElement._tavenemWysiwygEditor._editor.debounce);
                }

                tavenemEditorElement._tavenemWysiwygEditor._editor.debounce = setTimeout(
                    tavenemEditorElement._tavenemWysiwygEditor.onInput.bind(tavenemEditorElement._tavenemWysiwygEditor),
                    500);
            },
            handleDOMEvents: {
                'blur': function (view, _) {
                    if (!view.dom.parentElement?.parentElement) {
                        return true;
                    }

                    const tavenemEditorElement = view.dom.parentElement.parentElement as TavenemEditorHtmlElement;
                    if (!tavenemEditorElement?._tavenemWysiwygEditor?._editor) {
                        return true;
                    }

                    tavenemEditorElement._tavenemWysiwygEditor._editor.tavenemEditor.onChange(tavenemEditorElement._tavenemWysiwygEditor.getContent());
                    return true;
                }
            }
        });
        this._editor = {
            commands: commands,
            isMarkdown,
            view,
            options,
            tavenemEditor,
        };
    }

    updateSelectedText(value?: string | null) {
        if (!this._editor) {
            return;
        }

        if (!value || !value.length) {
            deleteSelection(this._editor.view.state, this._editor.view.dispatch);
        } else {
            const node = this._editor.view.state.schema.text(value);
            const newState = this._editor.view.state.apply(
                this._editor.view.state.tr.replaceSelectionWith(node));
            this._editor.view.updateState(newState);
        }

        this._editor.tavenemEditor.onChange(this.getContent());
    }

    private onInput() {
        if (this._editor) {
            this._editor.tavenemEditor.onInput(this.getContent());
        }
    }
}

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
    _tavenemCodeEditor: TavenemCodeEditor = new TavenemCodeEditor();
    _tavenemWysiwygEditor: TavenemWysiwygEditor = new TavenemWysiwygEditor();

    private _audioDialog?: HTMLDialogElement;
    private _fontSizeDialog?: HTMLDialogElement;
    private _imageDialog?: HTMLDialogElement;
    private _lineHeightDialog?: HTMLDialogElement;
    private _linkDialog?: HTMLDialogElement;
    private _settingMode = false;
    private _toolbarButtons: ToolbarControl[] = [];
    private _videoDialog?: HTMLDialogElement;

    static get observedAttributes() {
        return [
            'data-syntax',
            'disabled',
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

    get value() {
        return this.getAttribute('value') || '';
    }

    set value(value: string) {
        const root = this.shadowRoot;
        if (!root) {
            return;
        }
        const input = root.querySelector('textarea');
        if (!value || !value.length) {
            this.removeAttribute('value');
            if (input
                && input instanceof HTMLTextAreaElement) {
                input.value = '';
                this.dispatchEvent(TavenemEditorHtmlElement.newValueChangeEvent(input.value));
            }
        } else {
            this.setAttribute('value', value);
            if (input
                && input instanceof HTMLTextAreaElement) {
                input.value = value;
                this.dispatchEvent(TavenemEditorHtmlElement.newValueChangeEvent(input.value));
            }
        }
    }

    connectedCallback() {
        const shadow = this.attachShadow({ mode: 'open', delegatesFocus: true });

        const style = document.createElement('style');
        style.innerHTML = elementStyle;
        shadow.appendChild(style);

        const input = document.createElement('textarea');
        if ('inputId' in this.dataset && this.dataset.inputId) {
            input.id = this.dataset.inputId;
        }
        input.disabled = this.hasAttribute('disabled');
        input.hidden = true;
        if (this.hasAttribute('name')) {
            input.name = this.getAttribute('name') || '';
        }
        input.required = this.hasAttribute('required');
        if (this.hasAttribute('value')) {
            input.value = this.getAttribute('value') || '';
        }
        shadow.appendChild(input);

        const toolbar = document.createElement('div');
        toolbar.classList.add('editor-toolbar');
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
        if (this.hasAttribute('max-height')) {
            editor.style.maxHeight = this.getAttribute('max-height') || '';
        }
        editor.spellcheck = this.spellcheck;
        editor.tabIndex = this.tabIndex;
        if ('editorId' in this.dataset && this.dataset.editorId) {
            editor.id = this.dataset.editorId;
        }
        shadow.appendChild(editor);

        const statusBar = document.createElement('small');
        statusBar.classList.add('editor-statusbar');
        statusBar.innerHTML = '&nbsp;';
        shadow.appendChild(statusBar);

        this.refreshState(toolbar);

        const syntaxAttribute = this.dataset.syntax;
        const syntax = syntaxAttribute && syntaxes.includes(syntaxAttribute as any)
            ? syntaxAttribute as EditorSyntax
            : 'none';
        const isWysiwyg = this.hasAttribute('wysiwyg')
            && (syntax === 'html' || syntax === 'markdown');
        const options: EditorOptions = {
            autoFocus: this.hasAttribute('autofocus'),
            mode: isWysiwyg ? EditorMode.WYSIWYG : EditorMode.Text,
            readOnly: this.hasAttribute('readonly'),
            syntax,
            updateOnInput: 'updateOnInput' in this.dataset,
            initialValue: this.getAttribute('value') || undefined,
            placeholder: this.getAttribute('placeholder') || undefined,
        };
        if (isWysiwyg) {
            this._tavenemWysiwygEditor.initializeEditor(this, editor, options);
        } else {
            this._tavenemCodeEditor.initializeEditor(this, editor, options);
        }

        this.addEventListener('click', this.dismissTooltips.bind(this));
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

        if (name === 'disabled'
            || name === 'readonly') {
            const root = this.shadowRoot;
            if (!root) {
                return;
            }
            const input = root.querySelector('textarea');
            if (!input) {
                return;
            }
            if (name === 'disabled') {
                input.disabled = !!newValue;
            } else if (name === 'readonly') {
                input.readOnly = !!newValue;
            }
            this.update({});
            if (this._tavenemWysiwygEditor._editor) {
                this._tavenemWysiwygEditor._editor.view.setProps({ editable: () => !input.readOnly });
            } else if (this._tavenemCodeEditor._editor) {
                this._tavenemCodeEditor._editor.view.dispatch({
                    effects: this._tavenemCodeEditor._editor.readOnly.reconfigure(EditorState.readOnly.of(input.readOnly)),
                });
            }
        } else if (name === 'required') {
            const root = this.shadowRoot;
            if (!root) {
                return;
            }
            const input = root.querySelector('textarea');
            if (input) {
                input.required = !!newValue;
            }
        } else if (name === 'value') {
            this.setValue(newValue);
        } else if (name === 'data-syntax') {
            if (newValue && syntaxes.includes(newValue as any)) {
                this.onSetSyntax(newValue as EditorSyntax);
            }
        } else if (name === 'wysiwyg') {
            if (!this._settingMode) {
                this.onSetWysiwygMode(newValue != null);
            }
        }
    }

    dismissTooltips() {
        if (this.shadowRoot) {
            this.shadowRoot
                .querySelectorAll<TavenemTooltipHTMLElement>('tf-tooltip')
                .forEach(x => x.onAttentionOut());
        }
    }

    focusInnerEditor() {
        if (this._tavenemWysiwygEditor._editor) {
            this._tavenemWysiwygEditor._editor.view.focus();
        }

        if (this._tavenemCodeEditor._editor) {
            this._tavenemCodeEditor._editor.view.focus();
        }
    }

    getSelectedText() {
        if (this._tavenemWysiwygEditor._editor) {
            const { from, to } = this._tavenemWysiwygEditor._editor.view.state.selection;
            return this._tavenemWysiwygEditor._editor.view.state.doc.textBetween(from, to, " ");
        }

        if (this._tavenemCodeEditor._editor) {
            return this._tavenemCodeEditor._editor.view.state.sliceDoc(
                this._tavenemCodeEditor._editor.view.state.selection.ranges.map(v => v.from).reduce((p, v) => (p < v ? p : v)),
                this._tavenemCodeEditor._editor.view.state.selection.ranges.map(v => v.to).reduce((p, v) => (p > v ? p : v)));
        }
    }

    onChange(value?: string | null) {
        this.assignValue(value);
        this.dispatchEvent(TavenemEditorHtmlElement.newValueChangeEvent(value || ''));
    }

    onInput(value?: string | null) {
        this.assignValue(value);
        this.dispatchEvent(TavenemEditorHtmlElement.newValueInputEvent(value || ''));
    }

    setValue(value?: string | null) {
        this.assignValue(value);

        if (this._tavenemWysiwygEditor._editor) {
            if (value) {
                let content;
                if (this._tavenemWysiwygEditor._editor.isMarkdown) {
                    content = tavenemMarkdownParser.parse(value);
                } else {
                    const div = document.createElement('div');
                    div.innerHTML = value;
                    content = PMDOMParser
                        .fromSchema(this._tavenemWysiwygEditor._editor.view.state.schema)
                        .parse(div);
                }
                this._tavenemWysiwygEditor._editor.view.updateState(
                    this._tavenemWysiwygEditor._editor.view.state.apply(
                        this._tavenemWysiwygEditor._editor.view.state.tr.replaceRangeWith(
                            0,
                            this._tavenemWysiwygEditor._editor.view.state.doc.content.size,
                            content)));
            } else {
                this._tavenemWysiwygEditor._editor.view.updateState(
                    this._tavenemWysiwygEditor._editor.view.state.apply(
                        this._tavenemWysiwygEditor._editor.view.state.tr.delete(
                            0,
                            this._tavenemWysiwygEditor._editor.view.state.doc.content.size)));
            }
        } else if (this._tavenemCodeEditor._editor) {
            this._tavenemCodeEditor._editor.view.dispatch({
                changes: {
                    from: 0,
                    to: this._tavenemCodeEditor._editor.view.state.doc.length,
                    insert: value || '',
                }
            });
        }
    }

    update(data: UpdateInfo) {
        const editorDisabled = this.hasAttribute('disabled')
            || this.hasAttribute('readonly');

        if (typeof data.currentNode !== 'undefined') {
            const root = this.shadowRoot;
            if (root) {
                const status = root.querySelector('.editor-statusbar');
                if (status) {
                    status.innerHTML = data.currentNode || '&nbsp;';
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
        if (this._tavenemWysiwygEditor._editor) {
            this._tavenemWysiwygEditor.updateSelectedText(value);
        } else if (this._tavenemCodeEditor._editor) {
            this._tavenemCodeEditor.updateSelectedText(value);
        }
    }

    private assignValue(value?: string | null) {
        if (!value || !value.length) {
            this.removeAttribute('value');
        } else {
            this.setAttribute('value', value);
        }

        const root = this.shadowRoot;
        if (!root) {
            return;
        }

        const input = root.querySelector('textarea');
        if (!input) {
            return;
        }
        input.value = value || '';
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
                || !this._tavenemWysiwygEditor._editor) {
                return;
            }

            let url: string = (value as any).url;
            if (!url.startsWith('#')
                && !URL.canParse(url, document.baseURI)) {
                url = 'http://' + url;
                if (!URL.canParse(url, document.baseURI)) {
                    return;
                }
            }

            const controls = !!((value as any).controls);
            const loop = !!((value as any).loop);

            const command = this._tavenemWysiwygEditor._editor.commands[CommandType.InsertAudio];
            if (command) {
                command.command(
                    this._tavenemWysiwygEditor._editor.view.state,
                    this._tavenemWysiwygEditor._editor.view.dispatch,
                    this._tavenemWysiwygEditor._editor.view,
                    [url, controls, loop]);
                this._tavenemWysiwygEditor._editor.view.focus();
            }
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
        } else {
            const container = this._audioDialog.closest<HTMLElement>('.dialog-container');
            if (container) {
                container.style.display = 'initial';
            }
        }

        this._audioDialog.showModal();
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
                || !this._tavenemWysiwygEditor._editor) {
                return;
            }

            let size: string | null = value || null;
            if (size?.toLowerCase() === 'reset') {
                size = null;
            }

            const command = this._tavenemWysiwygEditor._editor.commands[CommandType.SetFontSize];
            if (command) {
                command.command(
                    this._tavenemWysiwygEditor._editor.view.state,
                    this._tavenemWysiwygEditor._editor.view.dispatch,
                    this._tavenemWysiwygEditor._editor.view,
                    [size]);
                this._tavenemWysiwygEditor._editor.view.focus();
            }
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
        } else {
            const container = this._fontSizeDialog.closest<HTMLElement>('.dialog-container');
            if (container) {
                container.style.display = 'initial';
            }
        }

        this._fontSizeDialog.showModal();
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
                || !this._tavenemWysiwygEditor._editor) {
                return;
            }

            let url: string = (value as any).url;
            if (!url.startsWith('#')
                && !URL.canParse(url, document.baseURI)) {
                url = 'http://' + url;
                if (!URL.canParse(url, document.baseURI)) {
                    return;
                }
            }

            const title: string | null = typeof (value as any).title === 'string'
                ? new Option((value as any).title).innerHTML
                : null;

            const alt: string | null = typeof (value as any).alt === 'string'
                ? new Option((value as any).alt).innerHTML
                : null;

            const command = this._tavenemWysiwygEditor._editor.commands[CommandType.InsertImage];
            if (command) {
                command.command(
                    this._tavenemWysiwygEditor._editor.view.state,
                    this._tavenemWysiwygEditor._editor.view.dispatch,
                    this._tavenemWysiwygEditor._editor.view,
                    [url, title, alt]);
                this._tavenemWysiwygEditor._editor.view.focus();
            }
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
        } else {
            const container = this._imageDialog.closest<HTMLElement>('.dialog-container');
            if (container) {
                container.style.display = 'initial';
            }
        }

        this._imageDialog.showModal();
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
                || !this._tavenemWysiwygEditor._editor) {
                return;
            }

            let size: string | null = value || null;
            if (size?.toLowerCase() === 'reset') {
                size = null;
            }

            const command = this._tavenemWysiwygEditor._editor.commands[CommandType.SetLineHeight];
            if (command) {
                command.command(
                    this._tavenemWysiwygEditor._editor.view.state,
                    this._tavenemWysiwygEditor._editor.view.dispatch,
                    this._tavenemWysiwygEditor._editor.view,
                    [size]);
                this._tavenemWysiwygEditor._editor.view.focus();
            }
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
        } else {
            const container = this._lineHeightDialog.closest<HTMLElement>('.dialog-container');
            if (container) {
                container.style.display = 'initial';
            }
        }

        this._lineHeightDialog.showModal();
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
                || !this._tavenemWysiwygEditor._editor) {
                return;
            }

            let url: string = (value as any).url;
            if (!url.startsWith('#')
                && !URL.canParse(url, document.baseURI)) {
                url = 'http://' + url;
                if (!URL.canParse(url, document.baseURI)) {
                    return;
                }
            }

            const title: string | null = typeof (value as any).title === 'string'
                ? new Option((value as any).title).innerHTML
                : null;

            const command = this._tavenemWysiwygEditor._editor.commands[CommandType.InsertLink];
            if (command) {
                command.command(
                    this._tavenemWysiwygEditor._editor.view.state,
                    this._tavenemWysiwygEditor._editor.view.dispatch,
                    this._tavenemWysiwygEditor._editor.view,
                    [url, title]);
                this._tavenemWysiwygEditor._editor.view.focus();
            }
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
        } else {
            const container = this._linkDialog.closest<HTMLElement>('.dialog-container');
            if (container) {
                container.style.display = 'initial';
            }
        }

        this._linkDialog.showModal();
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
                || !this._tavenemWysiwygEditor._editor) {
                return;
            }

            let url: string = (value as any).url;
            if (!url.startsWith('#')
                && !URL.canParse(url, document.baseURI)) {
                url = 'http://' + url;
                if (!URL.canParse(url, document.baseURI)) {
                    return;
                }
            }

            const controls = !!((value as any).controls);
            const loop = !!((value as any).loop);

            const command = this._tavenemWysiwygEditor._editor.commands[CommandType.InsertAudio];
            if (command) {
                command.command(
                    this._tavenemWysiwygEditor._editor.view.state,
                    this._tavenemWysiwygEditor._editor.view.dispatch,
                    this._tavenemWysiwygEditor._editor.view,
                    [url, controls, loop]);
                this._tavenemWysiwygEditor._editor.view.focus();
            }
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
        } else {
            const container = this._videoDialog.closest<HTMLElement>('.dialog-container');
            if (container) {
                container.style.display = 'initial';
            }
        }

        this._videoDialog.showModal();
    }

    private onColorSelected(control: ToolbarControl, event: Event) {
        if (control._disabled
            || !control._definition.type
            || !(event instanceof CustomEvent)
            || typeof event.detail.value !== 'string'
            || !event.detail.value.length) {
            return;
        }

        const syntaxAttribute = this.dataset.syntax;
        const syntax = syntaxAttribute && syntaxes.includes(syntaxAttribute as any)
            ? syntaxAttribute as EditorSyntax
            : 'none';
        const isWysiwyg = this.hasAttribute('wysiwyg')
            && (syntax === 'html' || syntax === 'markdown');
        if (!isWysiwyg
            || !this._tavenemWysiwygEditor._editor) {
            return;
        }

        const command = this._tavenemWysiwygEditor._editor.commands[control._definition.type];
        if (!command) {
            return;
        }

        command.command(
            this._tavenemWysiwygEditor._editor.view.state,
            this._tavenemWysiwygEditor._editor.view.dispatch,
            this._tavenemWysiwygEditor._editor.view,
            [event.detail.value]);
        this._tavenemWysiwygEditor._editor.view.focus();
    }

    private onControlActivated(control: ToolbarControl, event: Event) {
        if (event instanceof MouseEvent
            && event.button !== 0) {
            return;
        }

        if (control._disabled
            || !control._definition.type) {
            return;
        }

        if (control._definition.type === CommandType.InsertLink) {
            if (!control._active) {
                this.getLinkDialogResponse();
                return;
            }
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

        if (this._tavenemWysiwygEditor._editor) {
            const command = this._tavenemWysiwygEditor._editor.commands[control._definition.type];
            if (command) {
                command.command(
                    this._tavenemWysiwygEditor._editor.view.state,
                    this._tavenemWysiwygEditor._editor.view.dispatch,
                    this._tavenemWysiwygEditor._editor.view,
                    control._definition.params);
                this._tavenemWysiwygEditor._editor.view.focus();
            }
        } else if (this._tavenemCodeEditor._editor) {
            const syntaxAttribute = this.dataset.syntax;
            const syntax = syntaxAttribute && syntaxes.includes(syntaxAttribute as any)
                ? syntaxAttribute as EditorSyntax
                : 'none';

            let command: ParamStateCommand | undefined;
            if (syntax === 'html') {
                command = htmlCommands[control._definition.type];
            } else if (syntax === 'markdown') {
                command = markdownCommands[control._definition.type];
            } else if (control._definition.type === CommandType.Undo) {
                command = _ => codeUndo;
            } else if (control._definition.type === CommandType.Redo) {
                command = _ => codeRedo;
            }
            if (command) {
                command(control._definition.params)({
                    state: this._tavenemCodeEditor._editor.view.state,
                    dispatch: this._tavenemCodeEditor._editor.view.dispatch
                });
                this._tavenemCodeEditor._editor.view.focus();
            }
        }
    }

    private onEmojiSelected(control: ToolbarControl, event: Event) {
        if (control._disabled
            || !control._definition.type
            || !(event instanceof CustomEvent)
            || typeof event.detail.value !== 'string'
            || !event.detail.value.length) {
            return;
        }

        if (this._tavenemWysiwygEditor._editor) {
            const command = this._tavenemWysiwygEditor._editor.commands[control._definition.type];
            if (command) {
                command.command(
                    this._tavenemWysiwygEditor._editor.view.state,
                    this._tavenemWysiwygEditor._editor.view.dispatch,
                    this._tavenemWysiwygEditor._editor.view,
                    [event.detail.value]);
                this._tavenemWysiwygEditor._editor.view.focus();
            }
        } else if (this._tavenemCodeEditor._editor) {
            const syntaxAttribute = this.dataset.syntax;
            const syntax = syntaxAttribute && syntaxes.includes(syntaxAttribute as any)
                ? syntaxAttribute as EditorSyntax
                : 'none';

            let command: ParamStateCommand | undefined;
            if (syntax === 'html') {
                command = htmlCommands[control._definition.type];
            } else if (syntax === 'markdown') {
                command = markdownCommands[control._definition.type];
            }
            if (command) {
                command([event.detail.value])({
                    state: this._tavenemCodeEditor._editor.view.state,
                    dispatch: this._tavenemCodeEditor._editor.view.dispatch
                });
                this._tavenemCodeEditor._editor.view.focus();
            }
        }
    }

    private onModeSwitch(event: Event) {
        event.preventDefault();
        event.stopPropagation();

        this.onSetWysiwygMode(!this.hasAttribute('wysiwyg'));
    }

    private preventDefault(event: Event) {
        event.preventDefault();
    }

    private onSetWysiwygMode(value: boolean) {
        const root = this.shadowRoot;
        if (!root) {
            return;
        }

        const syntaxAttribute = this.dataset.syntax;
        const syntax = syntaxAttribute && syntaxes.includes(syntaxAttribute as any)
            ? syntaxAttribute as EditorSyntax
            : 'none';

        const editorElement = root.querySelector('.editor');
        if (!(editorElement instanceof HTMLElement)) {
            return;
        }

        const modeButton = root.querySelector('.mode-button');
        const modeButtonIcon = modeButton?.querySelector('svg');
        const modeButtonTooltipPopover = modeButton?.querySelector('.tooltip');

        if (value) {
            if (syntax !== 'html'
                && syntax !== 'markdown') {
                return;
            }
            const currentEditor = this._tavenemCodeEditor._editor;
            if (!currentEditor) {
                return;
            }

            const options = currentEditor.options;
            options.autoFocus = true;
            options.initialValue = currentEditor.view.state.doc.toString();
            options.mode = EditorMode.WYSIWYG;

            this._tavenemCodeEditor.dispose();

            this._tavenemWysiwygEditor.initializeEditor(
                this,
                editorElement,
                options);

            this._settingMode = true;
            this.setAttribute('wysiwyg', '');
            this._settingMode = false;

            if (modeButtonIcon) {
                modeButtonIcon.innerHTML = `<path d="M344-336 200-480l144-144 56 57-87 87 87 87-56 57Zm272 0-56-57 87-87-87-87 56-57 144 144-144 144ZM200-120q-33 0-56.5-23.5T120-200v-160h80v160h160v80H200Zm400 0v-80h160v-160h80v160q0 33-23.5 56.5T760-120H600ZM120-600v-160q0-33 23.5-56.5T200-840h160v80H200v160h-80Zm640 0v-160H600v-80h160q33 0 56.5 23.5T840-760v160h-80Z"/>`;
            }

            if (modeButtonTooltipPopover) {
                modeButtonTooltipPopover.textContent = 'Edit source code';
            }

            this.refreshState();
        } else {
            const currentEditor = this._tavenemWysiwygEditor._editor;
            if (!currentEditor) {
                return;
            }

            const options = currentEditor.options;
            options.autoFocus = true;
            options.initialValue = this._tavenemWysiwygEditor.getContent();
            options.mode = EditorMode.Text;

            this._tavenemWysiwygEditor.dispose();

            this._tavenemCodeEditor.initializeEditor(
                this,
                editorElement,
                options);

            this._settingMode = true;
            this.removeAttribute('wysiwyg');
            this._settingMode = false;

            if (modeButtonIcon) {
                modeButtonIcon.innerHTML = `<path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-480H200v480Zm280-80q-82 0-146.5-44.5T240-440q29-71 93.5-115.5T480-600q82 0 146.5 44.5T720-440q-29 71-93.5 115.5T480-280Zm0-100q-25 0-42.5-17.5T420-440q0-25 17.5-42.5T480-500q25 0 42.5 17.5T540-440q0 25-17.5 42.5T480-380Zm0 40q42 0 71-29t29-71q0-42-29-71t-71-29q-42 0-71 29t-29 71q0 42 29 71t71 29Z"/>`;
            }

            if (modeButtonTooltipPopover) {
                modeButtonTooltipPopover.textContent = 'Edit in rich text mode';
            }

            this.refreshState();
        }
    }

    private onSetSyntax(value: EditorSyntax) {
        const root = this.shadowRoot;
        if (!root) {
            return;
        }

        const syntaxAttribute = this.dataset.syntax;
        let syntax = syntaxAttribute && syntaxes.includes(syntaxAttribute as any)
            ? syntaxAttribute as EditorSyntax
            : 'none';
        if (value === syntax) {
            return;
        }

        const editorElement = root.querySelector('.editor');
        if (!(editorElement instanceof HTMLElement)) {
            return;
        }

        syntax = value;
        this.dataset.syntax = value;

        let mode: EditorMode = this.hasAttribute('wysiwyg')
            ? EditorMode.WYSIWYG
            : EditorMode.Text;

        const modeButton = root.querySelector('.mode-button');
        const modeButtonIcon = modeButton?.querySelector('svg');
        const modeButtonTooltipPopover = modeButton?.querySelector('.tooltip');

        const isWysiwygAvailable = syntax === 'html'
            || syntax === 'markdown';

        if (mode === EditorMode.WYSIWYG) {
            if (isWysiwygAvailable
                && this._tavenemCodeEditor._editor) {
                const options = this._tavenemCodeEditor._editor.options;
                options.autoFocus = true;
                options.initialValue = this._tavenemCodeEditor._editor.view.state.doc.toString();
                options.mode = EditorMode.WYSIWYG;

                this._tavenemCodeEditor.dispose();

                this._tavenemWysiwygEditor.initializeEditor(
                    this,
                    editorElement,
                    options);

                if (modeButtonIcon) {
                    modeButtonIcon.innerHTML = `<path d="M344-336 200-480l144-144 56 57-87 87 87 87-56 57Zm272 0-56-57 87-87-87-87 56-57 144 144-144 144ZM200-120q-33 0-56.5-23.5T120-200v-160h80v160h160v80H200Zm400 0v-80h160v-160h80v160q0 33-23.5 56.5T760-120H600ZM120-600v-160q0-33 23.5-56.5T200-840h160v80H200v160h-80Zm640 0v-160H600v-80h160q33 0 56.5 23.5T840-760v160h-80Z"/>`;
                }

                if (modeButtonTooltipPopover) {
                    modeButtonTooltipPopover.textContent = 'Edit source code';
                }
            } else if (!isWysiwygAvailable
                && this._tavenemWysiwygEditor._editor) {
                const options = this._tavenemWysiwygEditor._editor.options;
                options.autoFocus = true;
                options.initialValue = this._tavenemWysiwygEditor.getContent();
                options.mode = EditorMode.Text;

                this._tavenemWysiwygEditor.dispose();

                this._tavenemCodeEditor.initializeEditor(
                    this,
                    editorElement,
                    options);

                if (modeButtonIcon) {
                    modeButtonIcon.innerHTML = `<path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-480H200v480Zm280-80q-82 0-146.5-44.5T240-440q29-71 93.5-115.5T480-600q82 0 146.5 44.5T720-440q-29 71-93.5 115.5T480-280Zm0-100q-25 0-42.5-17.5T420-440q0-25 17.5-42.5T480-500q25 0 42.5 17.5T540-440q0 25-17.5 42.5T480-380Zm0 40q42 0 71-29t29-71q0-42-29-71t-71-29q-42 0-71 29t-29 71q0 42 29 71t71 29Z"/>`;
                }

                if (modeButtonTooltipPopover) {
                    modeButtonTooltipPopover.textContent = 'Edit in rich text mode';
                }

                mode = EditorMode.Text;
            }
        }

        if (this._tavenemWysiwygEditor._editor) {
            const editorElement = root.querySelector('.editor');
            if (!(editorElement instanceof HTMLElement)) {
                return;
            }

            const options = this._tavenemWysiwygEditor._editor.options;

            let text;
            const div = document.createElement('div');
            if (options.syntax === 'html'
                && syntax === 'markdown') {
                text = tavenemMarkdownSerializer.serialize(this._tavenemWysiwygEditor._editor.view.state.doc);
            } else if (options.syntax === 'markdown'
                && syntax === 'html') {
                div.appendChild(renderer.serializeFragment(this._tavenemWysiwygEditor._editor.view.state.doc.content));
                text = div.innerHTML;
            } else {
                text = this._tavenemWysiwygEditor.getContent();
            }

            options.initialValue = text;
            options.syntax = syntax;

            this._tavenemWysiwygEditor.initializeEditor(
                this,
                editorElement,
                options);
        } else if (this._tavenemCodeEditor._editor) {
            const spec: TransactionSpec = {
                effects: this._tavenemCodeEditor._editor.language.reconfigure(
                    codeEditorLanguageMap[syntax]
                    || codeEditorPlainText),
            };

            if ((this._tavenemCodeEditor._editor.options.syntax === 'html'
                && syntax === 'markdown')
                || (this._tavenemCodeEditor._editor.options.syntax === 'markdown'
                    && syntax === 'html')) {
                let text;
                const div = document.createElement('div');
                if (this._tavenemCodeEditor._editor.options.syntax === 'html'
                    && syntax === 'markdown') {
                    div.innerHTML = this._tavenemCodeEditor._editor.view.state.doc.toString();
                    const node = PMDOMParser
                        .fromSchema(schema)
                        .parse(div);
                    text = tavenemMarkdownSerializer.serialize(node);
                } else {
                    const node = tavenemMarkdownParser.parse(this._tavenemCodeEditor._editor.view.state.doc.toString());
                    div.appendChild(renderer.serializeFragment(node.content));
                    text = div.innerHTML;
                }

                spec.changes = {
                    from: 0,
                    to: this._tavenemCodeEditor._editor.view.state.doc.length,
                    insert: text,
                };
            }

            this._tavenemCodeEditor._editor.options.syntax = syntax;

            this._tavenemCodeEditor._editor.view.dispatch(spec);
        }

        this.refreshState();
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
        tooltipControl: HTMLElement,
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
        emojiInput.classList.add('field', 'no-label');
        emojiInput.dataset.inputClass = 'rounded small';
        emojiInput.dataset.popoverContainer = '';
        if (disabledOrReadonly) {
            emojiInput.setAttribute('disabled', '');
        }

        const toolbarButton = new ToolbarControl(emojiInput, definition);

        emojiInput.addEventListener('valuechange', this.onEmojiSelected.bind(this, toolbarButton));

        if (definition.tooltip) {
            const buttonTooltip = document.createElement('tf-tooltip');
            buttonTooltip.textContent = definition.tooltip;
            emojiInput.appendChild(buttonTooltip);
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
        colorInput.classList.add('field', 'no-label', 'clearable');
        if (definition.icon) {
            colorInput.dataset.icon = new Option(definition.icon).innerHTML;
        }
        colorInput.dataset.inputClass = 'rounded small';
        colorInput.dataset.popoverContainer = '';
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
            return {
                controls: [separator],
            };
        }

        const controls: HTMLElement[] = [];
        const toolbarButtons: ToolbarControl[] = [];

        if (definition.separatorBefore) {
            const separator = document.createElement('div');
            separator.classList.add('vr');
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

            const toolbarButton = new ToolbarControl(button, definition);
            this.applyToolbarButtonDefinition(button, button, definition, disabledOrReadonly, toolbarButton);

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

        let control: HTMLElement;

        const toolbarButtons: ToolbarControl[] = [];
        let toolbarButton: ToolbarControl;

        const dropdown = document.createElement('tf-dropdown');
        if (child) {
            dropdown.dataset.activation = '5'; // left-click or hover
        } else {
            dropdown.dataset.activation = '1'; // left-click
        }
        dropdown.dataset.popoverContainer = '';
        if (disabled) {
            dropdown.setAttribute('disabled', '');
        }

        dropdown.appendChild(button);

        const dropdownPopover = document.createElement('tf-popover');
        dropdownPopover.classList.add('top-left', 'flip-onopen', 'select-popover', 'filled', 'match-width');
        if (child) {
            dropdownPopover.classList.add('anchor-top-right');
        } else {
            dropdownPopover.classList.add('anchor-bottom-left');
        }
        dropdownPopover.style.maxHeight = 'min(300px,90vh)';
        dropdownPopover.style.overflowY = 'auto';
        dropdownPopover.tabIndex = 0;
        dropdown.appendChild(dropdownPopover);

        const list = document.createElement('div');
        list.classList.add('list');
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
            }

            control = document.createElement('div');
            toolbarButton = new ToolbarControl(control, definition);
            control.classList.add('button-group');

            button = document.createElement('button');
            button.classList.add('btn', 'btn-icon', 'rounded', 'small');
            control.appendChild(button);

            dropdown.style.minWidth = '0';
            control.appendChild(dropdown);
        } else {
            dropdown.dataset.delay = '1000';

            control = dropdown;
            toolbarButton = new ToolbarControl(control, definition);
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
                if (childDefinition.icon) {
                    const childIcon = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
                    span.appendChild(childIcon);
                    childIcon.outerHTML = childDefinition.icon;
                } else if (childDefinition.text) {
                    span.innerHTML = childDefinition.text;
                }
                childControls.push(span);

                const toolbarButton = new ToolbarControl(span, childDefinition, control);
                span.addEventListener('mousedown', this.preventDefault);
                span.addEventListener('mouseup', this.onControlActivated.bind(this, toolbarButton));
                toolbarButtons.push(toolbarButton);
            }

            for (const childControl of childControls) {
                list.appendChild(childControl);
            }
        }

        control.id = randomUUID();
        dropdownPopover.dataset.anchorId = control.id;

        this.applyToolbarButtonDefinition(button, control, definition, disabledOrReadonly, toolbarButton);

        controls.push(control);

        return {
            controls,
            toolbarButtons,
        };
    }

    private refreshState(toolbar?: Element | null) {
        const root = this.shadowRoot;
        if (!root) {
            return;
        }

        const syntaxAttribute = this.dataset.syntax;
        const syntax = syntaxAttribute && syntaxes.includes(syntaxAttribute as any)
            ? syntaxAttribute as EditorSyntax
            : 'none';

        if (!toolbar) {
            toolbar = root.querySelector('.editor-toolbar');
            if (!toolbar) {
                return;
            }
        }

        const isWysiwygAvailable = syntax === 'html' || syntax === 'markdown';
        const isWysiwyg = this.hasAttribute('wysiwyg')
            && isWysiwygAvailable;
        const mode: EditorMode = isWysiwyg
            ? EditorMode.WYSIWYG
            : EditorMode.Text;

        const disabled = this.hasAttribute('disabled')
            || this.hasAttribute('readonly');
        const disabledOrReadonly = disabled
            || this.hasAttribute('readonly');

        const nodes: Node[] = [];

        const innerToolbar = document.createElement('div');
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
            syntaxInput.classList.add('syntax-select');
            syntaxInput.dataset.inputReadonly = '';
            syntaxInput.dataset.popoverLimitHeight = '';
            if (disabledOrReadonly) {
                syntaxInput.setAttribute('disabled', '');
            }
            syntaxInput.setAttribute('placeholder', 'font size');
            syntaxInput.setAttribute('required', '');
            syntaxInput.setAttribute('size', '10');
            syntaxInput.setAttribute('type', 'text');
            innerToolbar.appendChild(syntaxInput);
            syntaxInput.addEventListener('valuechange', this.onSyntaxSelect.bind(this));
            
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
                selectedIcon.outerHTML = `<svg class="svg-icon selected-icon" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px"><path d="M0 0h24v24H0z" fill="none"/><path d="M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.11 0 2-.9 2-2V5c0-1.1-.89-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>`;

                const unselectedIcon = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
                option.appendChild(unselectedIcon);
                unselectedIcon.outerHTML = `<svg class="svg-icon unselected-icon" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px"><path d="M0 0h24v24H0z" fill="none"/><path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/></svg>`;

                const label = document.createElement('span');
                label.innerHTML = syntaxLabelMap[syntax];
                option.appendChild(label);
            }

            syntaxInput.setAttribute('value', syntax);
        }

        const slot = document.createElement('slot');
        innerToolbar.appendChild(slot);

        if (isWysiwygAvailable
            || !('lockMode' in this.dataset)
            || !('lockSyntax' in this.dataset)) {
            const showAll = document.createElement('button');
            showAll.classList.add('btn', 'btn-icon', 'rounded', 'small', 'editor-toolbar-show-all-btn');
            toolbar.appendChild(showAll);
            showAll.addEventListener('click', this.onShowAll.bind(this));

            const showAllIcon = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
            showAll.appendChild(showAllIcon);
            showAllIcon.outerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M240-400q-33 0-56.5-23.5T160-480q0-33 23.5-56.5T240-560q33 0 56.5 23.5T320-480q0 33-23.5 56.5T240-400Zm240 0q-33 0-56.5-23.5T400-480q0-33 23.5-56.5T480-560q33 0 56.5 23.5T560-480q0 33-23.5 56.5T480-400Zm240 0q-33 0-56.5-23.5T640-480q0-33 23.5-56.5T720-560q33 0 56.5 23.5T800-480q0 33-23.5 56.5T720-400Z"/></svg>`;

            const showAllTooltip = document.createElement('tf-tooltip');
            showAllTooltip.textContent = 'show all controls';
            showAll.appendChild(showAllTooltip);
        }

        toolbar.replaceChildren(...nodes);

        const buttons = root.querySelectorAll<HTMLButtonElement>('.custom-editor-button');
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
}

export function focusEditor(elementId: string) {
    const editor = document.getElementById(elementId);
    if (editor instanceof TavenemEditorHtmlElement) {
        editor.focusInnerEditor();
    }
}

export function getSelectedText(elementId: string) {
    const editor = document.getElementById(elementId);
    if (editor instanceof TavenemEditorHtmlElement) {
        return editor.getSelectedText();
    }
}

export function updateSelectedText(elementId: string, value?: string | null) {
    const editor = document.getElementById(elementId);
    if (editor instanceof TavenemEditorHtmlElement) {
        return editor.updateSelectedText(value);
    }
}

function arrowHandler(dir: 'up' | 'down' | 'left' | 'right' | 'forward' | 'backward') {
    return (state: PMEditorState, dispatch?: (tr: Transaction) => void, view?: PMEditorView) => {
        if (!view) {
            return false;
        }
        if (state.selection.empty && view.endOfTextblock(dir)) {
            const side = dir === 'left' || dir === 'up' ? -1 : 1;
            const { $head } = state.selection;
            const nextPos = Selection.near(state.doc.resolve(side > 0 ? $head.after() : $head.before()), side);
            if (nextPos.$head
                && nextPos.$head.parent.type.name === "code_block") {
                if (dispatch) {
                    dispatch(state.tr.setSelection(nextPos));
                }
                return true;
            }
        }
        return false;
    };
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
    container.appendChild(overlay);
    overlay.addEventListener('click', close);

    const dialog = document.createElement('dialog') as Dialog;
    dialog.id = randomUUID();
    dialog.classList.add('resizable');
    dialog.style.minWidth = 'fit-content';
    dialog.style.width = '50vw';
    container.appendChild(dialog);
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

        const container = ev.target.closest<HTMLElement>('.dialog-container');
        if (container) {
            container.style.display = 'none';
        }
    });

    const dialogInner = document.createElement('div');
    dialog.appendChild(dialogInner);

    const header = document.createElement('div');
    header.classList.add('header', 'draggable');
    dialogInner.appendChild(header);

    const heading = document.createElement('h6');
    heading.textContent = title;
    header.appendChild(heading);

    const closeButton = document.createElement('tf-close');
    header.appendChild(closeButton);
    closeButton.addEventListener('click', close);

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

    form.append(...content);
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

    const footer = document.createElement('div');
    footer.classList.add('footer');
    dialogInner.appendChild(footer);

    const buttons = document.createElement('div');
    buttons.classList.add('message-box-buttons');
    footer.appendChild(buttons);

    const cancelButton = document.createElement('button');
    cancelButton.classList.add('btn', 'btn-text');
    cancelButton.textContent = 'Cancel';
    buttons.appendChild(cancelButton);
    cancelButton.addEventListener('click', close);

    const okButton = document.createElement('button');
    okButton.classList.add('btn', 'btn-text', 'primary', 'ok-button');
    okButton.disabled = true;
    okButton.value = 'ok';
    okButton.formMethod = 'dialog';
    okButton.textContent = 'OK';
    okButton.setAttribute('form', form.id);
    buttons.appendChild(okButton);

    initializeDialog(dialog.id);
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

const themeObserver = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
        if (mutation.type === 'attributes'
            && mutation.target instanceof HTMLElement) {
            const theme = mutation.target.dataset.theme;
            if (theme) {
                const effect = codeEditorThemeCompartment.reconfigure(theme === 'dark'
                    ? codeEditorDarkExtension
                    : codeEditorLightTheme);
                for (const editor of document.querySelectorAll<TavenemEditorHtmlElement>('tf-editor')) {
                    if (editor._tavenemCodeEditor._editor) {
                        editor._tavenemCodeEditor._editor.view.dispatch({ effects: effect });
                    }
                }
            }
        }
    });
});
themeObserver.observe(document.documentElement, { attributes: true });