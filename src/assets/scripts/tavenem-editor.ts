import { html_beautify } from 'js-beautify';
import {
    EditorView,
    keymap,
    highlightSpecialChars,
    drawSelection,
    highlightActiveLine,
    dropCursor,
    rectangularSelection,
    crosshairCursor,
    lineNumbers,
    highlightActiveLineGutter,
    placeholder,
    Command,
    ViewUpdate,
} from '@codemirror/view';
import { Extension, EditorState, Compartment, TransactionSpec } from '@codemirror/state';
import {
    HighlightStyle,
    LanguageSupport,
    StreamLanguage,
    defaultHighlightStyle,
    syntaxHighlighting,
    indentOnInput,
    bracketMatching,
    foldGutter,
    foldKeymap,
    codeFolding,
} from '@codemirror/language';
import { defaultKeymap, history, historyKeymap, indentWithTab, redo as codeRedo, undo as codeUndo } from '@codemirror/commands';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { autocompletion, completionKeymap, closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { lintKeymap } from '@codemirror/lint';
import { tags } from '@lezer/highlight';
import { cpp } from '@codemirror/lang-cpp';
import { csharp, objectiveC } from '@codemirror/legacy-modes/mode/clike';
import { css } from '@codemirror/lang-css';
import { html } from '@codemirror/lang-html';
import { java } from '@codemirror/lang-java';
import { javascript } from '@codemirror/lang-javascript';
import { json } from '@codemirror/lang-json';
import { less, sCSS } from '@codemirror/legacy-modes/mode/css';
import { markdown } from '@codemirror/lang-markdown';
import { php } from '@codemirror/lang-php';
import { python } from '@codemirror/lang-python';
import { sql } from '@codemirror/lang-sql';
import { stex } from '@codemirror/legacy-modes/mode/stex';
import { typescript } from '@codemirror/legacy-modes/mode/javascript';

import {
    Command as PMCommand,
    EditorState as PMEditorState,
    Plugin,
    Selection,
    TextSelection,
    Transaction
} from 'prosemirror-state';
import { Decoration, DecorationSet, EditorView as PMEditorView } from 'prosemirror-view';
import {
    ContentMatch,
    DOMParser as PMDOMParser,
    DOMSerializer,
    Fragment,
    Node as ProsemirrorNode,
    Schema
} from 'prosemirror-model';
import {
    baseKeymap,
    chainCommands,
    deleteSelection,
    exitCode,
    joinBackward,
    selectNodeBackward
} from 'prosemirror-commands';
import { keymap as pmKeymap } from 'prosemirror-keymap';
import { inputRules } from 'prosemirror-inputrules';
import { history as pmHistory, undo, redo } from 'prosemirror-history';
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
    exitDiv
} from './_schemas';
import { htmlCommands } from './_html';
import { markdownCommands, tavenemMarkdownParser, tavenemMarkdownSerializer } from './_markdown';
import { cellMinWidth, columnResizing, fixTables, goToNextCell, tableEditing, TableView } from './_tables';

enum ThemePreference {
    Light = 1,
    Dark = 2,
}

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
    syntax: string;
    updateOnInput: boolean;
}

interface EditorInfo {
    debounce?: number;
    options: EditorOptions;
    ref: DotNet.DotNetObject;
}

interface CodeEditorInfo extends EditorInfo {
    view: EditorView;
    language: Compartment;
    readOnly: Compartment;
}

interface WysiwygEditorInfo extends EditorInfo {
    commands: CommandSet;
    isMarkdown: boolean;
    view: PMEditorView;
}

interface UpdateInfo {
    commands: {
        [type in CommandType]?: {
            active: boolean,
            enabled: boolean,
        }
    };
    currentNode: string | null;
}

const codeEditorLanguageMap: Record<string, LanguageSupport | StreamLanguage<unknown>> = {
    "cpp": cpp(),
    "css": css(),
    "html": html(),
    "java": java(),
    "javascript": javascript(),
    "json": json(),
    "markdown": markdown(),
    "php": php(),
    "python": python(),
    "sql": sql(),
    "csharp": StreamLanguage.define(csharp),
    "objectivec": StreamLanguage.define(objectiveC),
    "less": StreamLanguage.define(less),
    "sass": StreamLanguage.define(sCSS),
    "latex": StreamLanguage.define(stex),
    "typescript": StreamLanguage.define(typescript),
};
const codeEditorPlainText: Extension = [];

const codeEditorBaseTheme = EditorView.baseTheme({
    "&": {
        flexGrow: "1",
        overflowX: "auto"
    },

    "&, .cm-scroller": {
        borderRadius: 'inherit'
    },

    "&.cm-editor.cm-focused": {
        outline: "none",

        "& .cm-selectionBackground": { backgroundColor: "var(--tavenem-color-bg-highlight-bright)" },
    },

    "&.set-height .cm-scroller": {
        overflow: 'auto'
    },

    ".cm-content": {
        caretColor: "var(--tavenem-color-text)"
    },

    ".cm-cursor, .cm-dropCursor": { borderLeftColor: "var(--tavenem-color-text)" },

    ".cm-selectionBackground, .cm-content ::selection": { backgroundColor: "var(--tavenem-color-bg-highlight-bright)" },

    ".cm-panels": { backgroundColor: "var(--tavenem-color-bg-surface)", color: "var(--tavenem-color-text)" },
    ".cm-panels.cm-panels-top": { borderBottom: "1px solid var(--field-border-color)" },
    ".cm-panels.cm-panels-bottom": { borderTop: "1px solid var(--field-border-color)" },

    ".cm-activeLine, .cm-activeLineGutter": { backgroundColor: "transparent" },

    ".cm-specialChar": {
        color: "var(--tavenem-color-danger)"
    },

    ".cm-gutters": {
        backgroundColor: "var(--tavenem-color-bg-input)",
        borderBottomLeftRadius: 'inherit',
        borderRight: "1px solid var(--tavenem-color-border-input)",
        borderTopLeftRadius: 'inherit',
        color: "var(--tavenem-color-text-secondary)"
    },

    ".cm-textfield": {
        backgroundColor: "var(--tavenem-color-bg-input)",
        borderColor: "var(--tavenem-color-border-input)"
    },

    ".cm-button": {
        backgroundImage: "linear-gradient(var(--tavenem-color-bg), var(--tavenem-color-bg-alt))",
        borderColor: "var(--tavenem-color-border-input)",
        borderRadius: "var(--tavenem-border-radius)",

        "&:active": {
            backgroundImage: "linear-gradient(var(--tavenem-color-bg-alt), var(--tavenem-dark-color-bg-highlight))"
        }
    },

    ".cm-panel input[type=checkbox]": {
        position: 'relative',
        verticalAlign: 'middle',

        "&:not(:checked):before": {
            backgroundColor: "var(--tavenem-color-bg-input)",
            content: "",
            height: "calc(100% - 2px)",
            left: "1px",
            position: 'absolute',
            top: "1px",
            width: "calc(100% - 2px)"
        }
    }
});
const codeEditorLightTheme = EditorView.theme({
    ".cm-foldPlaceholder": {
        backgroundColor: "var(--tavenem-color-bg-alt)",
        borderColor: "var(--tavenem-color-border-input)"
    },

    ".cm-tooltip": {
        webkitBackdropFilter: "blur(12px)",
        backdropFilter: "blur(12px)",
        backgroundColor: "var(--tavenem-color-bg-surface)",
        borderColor: "var(--tavenem-color-border-input)",
        borderRadius: "var(--tavenem-border-radius)",
        color: "var(--tavenem-color-text)"
    },
    ".cm-tooltip-autocomplete": {
        "& > ul > li[aria-selected]": {
            backgroundColor: "var(--tavenem-color-bg-highlight)",
            color: "var(--tavenem-color-text)",

            "&:first-child": {
                borderTopLeftRadius: "var(--tavenem-border-radius)",
                borderTopRightRadius: "var(--tavenem-border-radius)"
            }
        }
    },
});
const codeEditorDarkTheme = EditorView.theme({
    ".cm-foldPlaceholder": {
        backgroundColor: "var(--tavenem-color-bg-alt)",
        borderColor: "var(--tavenem-color-border-input)"
    },

    ".cm-tooltip": {
        webkitBackdropFilter: "blur(12px)",
        backdropFilter: "blur(12px)",
        backgroundColor: "var(--tavenem-color-bg-surface)",
        borderColor: "var(--tavenem-color-border-input)",
        borderRadius: "var(--tavenem-border-radius)",
        color: "var(--tavenem-color-text)"
    },
    ".cm-tooltip-autocomplete": {
        "& > ul > li[aria-selected]": {
            backgroundColor: "var(--tavenem-color-bg-highlight)",
            color: "var(--tavenem-color-text)",

            "&:first-child": {
                borderTopLeftRadius: "var(--tavenem-border-radius)",
                borderTopRightRadius: "var(--tavenem-border-radius)"
            }
        }
    },
}, { dark: true });
const codeEditorDarkHighlightStyle = HighlightStyle.define([
    {
        tag: tags.keyword,
        color: "#c678dd"
    },
    {
        tag: [tags.deleted, tags.character],
        color: "#e06c75"
    },
    {
        tag: [tags.definition(tags.name), tags.propertyName, tags.macroName],
        color: "#569cd6"
    },
    {
        tag: [tags.function(tags.variableName), tags.labelName],
        color: "#61afef"
    },
    {
        tag: [tags.color, tags.constant(tags.name), tags.standard(tags.name)],
        color: "#d19a66"
    },
    {
        tag: [tags.name, tags.separator],
        color: "#abb2bf"
    },
    {
        tag: [tags.typeName, tags.className, tags.number, tags.changed, tags.annotation, tags.modifier, tags.self, tags.namespace],
        color: "#e5c07b"
    },
    {
        tag: [tags.operator, tags.operatorKeyword, tags.url, tags.escape, tags.regexp, tags.link, tags.special(tags.string)],
        color: "#56b6c2"
    },
    {
        tag: [tags.meta, tags.comment],
        color: "#7d8799"
    },
    {
        tag: tags.strong,
        fontWeight: "bold"
    },
    {
        tag: tags.emphasis,
        fontStyle: "italic"
    },
    {
        tag: tags.strikethrough,
        textDecoration: "line-through"
    },
    {
        tag: tags.link,
        color: "#7d8799",
        textDecoration: "underline"
    },
    {
        tag: tags.heading,
        fontWeight: "bold",
        color: "#e06c75"
    },
    {
        tag: [tags.atom, tags.bool, tags.special(tags.variableName)],
        color: "#d19a66"
    },
    {
        tag: [tags.processingInstruction, tags.string, tags.inserted],
        color: "#98c379"
    },
    {
        tag: tags.invalid,
        color: "#ffffff"
    },
]);
const codeEditorDarkExtension: Extension = [codeEditorDarkTheme, syntaxHighlighting(codeEditorDarkHighlightStyle)];
const codeEditorThemeCompartment = new Compartment;

const defaultCodeExtensions: Extension[] = [
    lineNumbers(),
    highlightActiveLineGutter(),
    highlightSpecialChars(),
    history(),
    foldGutter(),
    codeFolding(),
    drawSelection(),
    dropCursor(),
    EditorState.allowMultipleSelections.of(true),
    indentOnInput(),
    syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
    bracketMatching(),
    closeBrackets(),
    autocompletion(),
    rectangularSelection(),
    crosshairCursor(),
    highlightActiveLine(),
    highlightSelectionMatches(),
    keymap.of([
        ...closeBracketsKeymap,
        ...defaultKeymap,
        ...searchKeymap,
        ...historyKeymap,
        ...foldKeymap,
        ...completionKeymap,
        ...lintKeymap,
        indentWithTab,
    ]),
    codeEditorBaseTheme,
];

const exitCodeUp: PMCommand = (state, dispatch) => {
    const { $head, $anchor } = state.selection;
    if (!$head.parent.type.spec.code
        || !$head.sameParent($anchor)) {
        return false;
    }
    const above = $head.node(-1), before = $head.index(-1), type = defaultBlockAt(above.contentMatchAt(before));
    if (!type || !above.canReplaceWith(before, before, type)) {
        return false;
    }
    if (dispatch) {
        const pos = $head.before(), tr = state.tr.replaceWith(pos, pos, type.createAndFill()!);
        tr.setSelection(Selection.near(tr.doc.resolve(pos), 1));
        dispatch(tr.scrollIntoView());
    }
    return true;
}

let codeEditorThemeExtension: Extension | undefined;
let themePreference = getPreferredColorScheme();

class TavenemCodeEditor {
    _editors: Record<string, CodeEditorInfo> = {};

    dispose(elementId: string) {
        const editor = this._editors[elementId];
        if (editor) {
            editor.view.destroy();
        }
        delete this._editors[elementId];
    }

    initializeEditor(
        elementId: string,
        dotNetRef: DotNet.DotNetObject,
        options: EditorOptions) {
        const element = document.getElementById(elementId);
        if (!(element instanceof HTMLDivElement)) {
            return;
        }

        const existing = this._editors[elementId];
        if (existing) {
            existing.view.destroy();
            delete this._editors[elementId];
        }

        const languageExtension = options.syntax
            ? codeEditorLanguageMap[options.syntax.toLowerCase()] || codeEditorPlainText
            : codeEditorPlainText;
        const languageCompartment = new Compartment;

        const readOnlyCompartment = new Compartment;

        themePreference = getPreferredColorScheme();
        if (!codeEditorThemeExtension) {
            codeEditorThemeExtension = codeEditorThemeCompartment.of(themePreference == ThemePreference.Dark
                ? codeEditorDarkExtension
                : codeEditorLightTheme);
        }

        const extensions: Extension[] = defaultCodeExtensions.concat([
            codeEditorThemeExtension,
            languageCompartment.of(languageExtension),
            readOnlyCompartment.of(EditorState.readOnly.of(options.readOnly || false)),
            EditorView.updateListener.of(update => {
                if (!update.docChanged) {
                    return;
                }

                const div = update.view.dom.parentElement;
                if (!div) {
                    return;
                }

                const editor = tavenemCodeEditor._editors[div.id];
                if (!editor) {
                    return;
                }

                if (editor.debounce) {
                    clearTimeout(editor.debounce);
                }

                editor.debounce = setTimeout(
                    tavenemCodeEditor.onInput.bind(tavenemCodeEditor, div.id),
                    500);
            }),
            EditorView.domEventHandlers({
                'blur': function (_, view) {
                    const div = view.dom.parentElement;
                    if (!div) {
                        return;
                    }

                    const editor = tavenemCodeEditor._editors[div.id];
                    if (!editor) {
                        return;
                    }

                    editor.ref.invokeMethodAsync("OnChangeInvoked", view.state.doc.toString());
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
        });

        this._editors[elementId] = {
            view,
            language: languageCompartment,
            options,
            readOnly: readOnlyCompartment,
            ref: dotNetRef,
        };

        if (options.autoFocus) {
            view.focus();
        }

        return this._editors[elementId];
    }

    updateSelectedText(elementId: string, value?: string) {
        const editor = this._editors[elementId];
        if (!editor) {
            return;
        }

        if (!value || !value.length) {
            editor.view.dispatch(editor.view.state.replaceSelection(''));
        } else {
            editor.view.dispatch(editor.view.state.replaceSelection(value));
        }

        editor.ref.invokeMethodAsync(
            "OnChangeInvoked",
            editor.view.state.doc.toString());
    }

    private onInput(elementId: string) {
        const editor = this._editors[elementId];
        if (editor) {
            const updateInfo: UpdateInfo = {
                commands: {},
                currentNode: null,
            };
            updateInfo.commands[CommandType.Undo] = {
                active: false,
                enabled: codeUndo({
                    state: editor.view.state,
                    dispatch: _ => {},
                }),
            };
            updateInfo.commands[CommandType.Redo] = {
                active: false,
                enabled: codeRedo({
                    state: editor.view.state,
                    dispatch: _ => { },
                }),
            };
            editor.ref.invokeMethodAsync("UpdateCommands", updateInfo);

            if (editor.options.updateOnInput) {
                editor.ref.invokeMethodAsync("OnChangeInvoked", editor.view.state.doc.toString());
            }
        }
    }
}
const tavenemCodeEditor = new TavenemCodeEditor();

class MenuView {
    _commands: CommandSet;
    _editorView: PMEditorView;
    _ref: DotNet.DotNetObject;

    constructor(
        dotNetRef: DotNet.DotNetObject,
        commands: CommandSet,
        editorView: PMEditorView) {
        this._commands = commands;
        this._editorView = editorView;
        this._ref = dotNetRef;
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
                updateInfo.commands[commandType] = update;
            }
        }
        this._ref.invokeMethodAsync("UpdateCommands", updateInfo);
    }

    private nodeName(node: ProsemirrorNode) {
        let name = node.type.name.replace('_', ' ');
        if (node.type == this._editorView.state.schema.nodes.heading) {
            name += ' ' + node.attrs.level;
        }
        return name;
    }
}

class CodeBlockView {
    dom: Node;
    _cm: EditorView;
    _languageCompartment = new Compartment;
    _syntax: string | null;
    _updating = false;

    constructor(
        public node: ProsemirrorNode,
        public view: PMEditorView,
        public getPos: () => number | undefined) {
        if (!codeEditorThemeExtension) {
            codeEditorThemeExtension = codeEditorThemeCompartment.of(themePreference == ThemePreference.Dark
                ? codeEditorDarkExtension
                : codeEditorLightTheme);
        }

        this._syntax = node.attrs.syntax;
        const languageExtension = this._syntax
            ? codeEditorLanguageMap[this._syntax.toLowerCase()] || codeEditorPlainText
            : codeEditorPlainText;

        const extensions: Extension[] = this.codeMirrorKeymap()
            .concat(defaultCodeExtensions)
            .concat([
                codeEditorThemeExtension,
                this._languageCompartment.of(languageExtension),
                EditorView.updateListener.of(update => this.listen.call(this, update)),
                EditorView.domEventHandlers({
                    'focus': (_, view) => this.forwardSelection(view)
                }),
                EditorView.editorAttributes.of(_ => {
                    if (this._syntax && this._syntax.length) {
                        const attrs: { [name: string]: string } = {};
                        attrs['data-language'] = this._syntax;
                        return attrs;
                    }
                    return null;
                }),
            ]);
        this._cm = new EditorView({
            state: EditorState.create({
                doc: this.node.textContent,
                extensions: extensions,
            }),
        });
        const div = document.createElement('div');
        div.appendChild(this._cm.dom);
        this.dom = div;
    }

    asProseMirrorSelection(view: EditorView, doc: ProsemirrorNode) {
        const offset = (this.getPos() || 0) + 1;
        const anchor = view.state.selection.main.anchor + offset;
        const head = view.state.selection.main.head + offset;
        return TextSelection.create(doc, anchor, head);
    }

    codeMirrorKeymap(): Extension[] {
        return [keymap.of([
            { key: "ArrowLeft", run: this.maybeEscape("char", -1), preventDefault: true, },
            { key: "ArrowRight", run: this.maybeEscape("char", 1), preventDefault: true, },
            { key: "ArrowUp", run: this.maybeEscape("line", -1), preventDefault: true, },
            { key: "ArrowDown", run: this.maybeEscape("line", 1), preventDefault: true, },
            {
                key: "Shift-Ctrl-Enter",
                run: () => {
                    if (exitCodeUp(this.view.state, this.view.dispatch)) {
                        this.view.focus();
                        return true;
                    }
                    return false;
                }
            },
            {
                key: "Ctrl-Enter",
                run: () => {
                    if (exitCode(this.view.state, this.view.dispatch)) {
                        this.view.focus();
                        return true;
                    }
                    return false;
                }
            },
            {
                key: "Mod-z",
                run: () => {
                    undo(this.view.state, this.view.dispatch);
                    return true;
                }
            },
            {
                key: "Mod-y",
                mac: "Mod-Shift-z",
                run: () => {
                    redo(this.view.state, this.view.dispatch);
                    return true;
                }
            },
        ])];
    }

    destroy() { this._cm.destroy() }

    forwardSelection(view: EditorView) {
        if (!view.hasFocus) {
            return;
        }
        const selection = this.asProseMirrorSelection(view, this.view.state.doc);
        if (!selection.eq(this.view.state.selection)) {
            this.view.dispatch(this.view.state.tr.setSelection(selection));
        }
    }

    listen(update: ViewUpdate) {
        if (update.docChanged && !this._updating) {
            this.valueChanged(update.view);
            this.forwardSelection(update.view);
            return;
        }

        if (update.selectionSet && !this._updating) {
            this.forwardSelection(update.view);
        }
    }

    maybeEscape(unit: string, dir: number): Command {
        return (target: EditorView) => {
            const pos = target.state.selection.main;
            if (!target.state.selection.main.empty) {
                return false;
            }
            const line = target.state.doc.lineAt(pos.head);
            if (line.number != (dir < 0 ? 1 : target.state.doc.lines)
                || (unit == "char"
                    && pos.head != (dir < 0 ? line.from : line.to))) {
                return false;
            }
            this.view.focus();
            const targetPos = (this.getPos() || 0) + (dir < 0 ? 0 : this.node.nodeSize);
            const selection = Selection.near(this.view.state.doc.resolve(targetPos), dir);
            this.view.dispatch(this.view.state.tr.setSelection(selection).scrollIntoView());
            this.view.focus();
            return true;
        };
    }

    selectNode() { this._cm.focus() }

    setSelection(anchor: number, head: number) {
        this._cm.focus();
        this._updating = true;
        this._cm.dispatch({ selection: { anchor, head, } });
        this._updating = false;
    }

    stopEvent() { return true }

    update(node: ProsemirrorNode) {
        if (node.type != this.node.type) {
            return false;
        }
        this.node = node;

        const spec: TransactionSpec = {};
        const change = computeChange(this._cm.state.doc.toString(), node.textContent);
        if (change) {
            spec.changes = {
                from: change.from,
                to: change.to,
                insert: change.text,
            };
        }

        const syntax = node.attrs.syntax as string | null;
        let newSyntax = false;
        if (syntax != this._syntax) {
            newSyntax = true;
            this._syntax = syntax;
            const languageExtension = syntax
                ? codeEditorLanguageMap[syntax.toLowerCase()] || codeEditorPlainText
                : codeEditorPlainText;
            spec.effects = this._languageCompartment.reconfigure(languageExtension);
        }

        if (change || newSyntax) {
            this._updating = true;
            this._cm.dispatch(spec);
            this._updating = false;
        }
        return true;
    }

    valueChanged(view: EditorView) {
        const change = computeChange(this.node.textContent, view.state.doc.toString());
        if (change) {
            const start = (this.getPos() || 0) + 1;
            this.view.dispatch(this.view.state.tr.replaceWith(
                start + change.from,
                start + change.to,
                change.text
                    ? this.view.state.schema.text(change.text)
                    : Fragment.empty));
        }
    }
}

class HeadView {
    dom: Node;

    constructor(
        public node: ProsemirrorNode,
        public view: PMEditorView,
        public getPos: () => number | undefined) {
        this.dom = this.createContent(node);
    }

    stopEvent() { return true }

    update(node: ProsemirrorNode) {
        if (node.type != this.node.type) {
            return false;
        }
        this.dom = this.createContent(node);
        return true;
    }

    private createContent(node: ProsemirrorNode) {
        const head = document.createElement('head');
        head.appendChild(DOMSerializer
            .fromSchema(node.type.schema)
            .serializeFragment(node.content));
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

class ForbiddenView {
    dom: Node;

    constructor(
        public node: ProsemirrorNode,
        public view: PMEditorView,
        public getPos: () => number | undefined) {
        this.dom = this.createContent(node);
    }

    stopEvent() { return true }

    update(node: ProsemirrorNode) {
        if (node.type != this.node.type) {
            return false;
        }
        this.dom = this.createContent(node);
        return true;
    }

    private createContent(node: ProsemirrorNode) {
        const div = document.createElement('div');
        div.appendChild(DOMSerializer
            .fromSchema(node.type.schema)
            .serializeNode(node));
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

const arrowHandlers = pmKeymap({
    ArrowLeft: arrowHandler("left"),
    ArrowRight: arrowHandler("right"),
    ArrowUp: arrowHandler("up"),
    ArrowDown: arrowHandler("down"),
});

class TavenemWysiwygEditor {
    _editors: Record<string, WysiwygEditorInfo> = {};

    dispose(elementId: string) {
        const editor = this._editors[elementId];
        if (editor) {
            editor.view.destroy();
        }
        delete this._editors[elementId];
    }

    getContent(editor: WysiwygEditorInfo) {
        let value;
        if (editor.isMarkdown) {
            value = tavenemMarkdownSerializer.serialize(editor.view.state.doc);
        } else {
            const div = document.createElement('div');
            div.appendChild(DOMSerializer
                .fromSchema(editor.view.state.schema)
                .serializeFragment(editor.view.state.doc.content));
            value = div.innerHTML;
            value = html_beautify(value, {
                extra_liners: [],
                indent_size: 2,
                wrap_line_length: 0,
            });
        }
        return value;
    }

    initializeEditor(
        elementId: string,
        dotNetRef: DotNet.DotNetObject,
        options: EditorOptions) {
        const element = document.getElementById(elementId);
        if (!(element instanceof HTMLDivElement)) {
            return;
        }

        const existing = this._editors[elementId];
        if (existing) {
            existing.view.destroy();
            delete this._editors[elementId];
        }

        themePreference = getPreferredColorScheme();
        if (!codeEditorThemeExtension) {
            codeEditorThemeExtension = codeEditorThemeCompartment.of(themePreference == ThemePreference.Dark
                ? codeEditorDarkExtension
                : codeEditorLightTheme);
        }

        const isMarkdown = options.syntax == 'Markdown';

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
        const menu = new Plugin({
            view(editorView) {
                return new MenuView(dotNetRef, commands, editorView);
            }
        });

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
            tableEditing,
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
            plugins: [menu],
            clipboardTextSerializer: slice => { return mathSerializer.serializeSlice(slice) },
            nodeViews: {
                code_block: (node, view, getPos, _) => new CodeBlockView(node, view, getPos),
                table: (node, view, getPos, _) => new TableView(node, cellMinWidth),
                head: (node, view, getPos, _) => new HeadView(node, view, getPos),
                iframe: (node, view, getPos, _) => new ForbiddenView(node, view, getPos),
                noscript: (node, view, getPos, _) => new ForbiddenView(node, view, getPos),
                object: (node, view, getPos, _) => new ForbiddenView(node, view, getPos),
                script: (node, view, getPos, _) => new ForbiddenView(node, view, getPos),
            },
            dispatchTransaction(tr) {
                (this as unknown as PMEditorView).updateState(this.state.apply(tr));

                if (!tr.docChanged) {
                    return;
                }

                const div = (this as unknown as PMEditorView).dom.parentElement;
                if (!div) {
                    return;
                }
                const editor = tavenemWysiwygEditor._editors[div.id];
                if (!editor
                    || !editor.options.updateOnInput) {
                    return;
                }

                if (editor.debounce) {
                    clearTimeout(editor.debounce);
                }

                editor.debounce = setTimeout(
                    tavenemWysiwygEditor.onInput.bind(tavenemWysiwygEditor, div.id),
                    500);
            },
            handleDOMEvents: {
                'blur': function (view, _) {
                    const div = view.dom.parentElement;
                    if (!div) {
                        return true;
                    }
                    const editor = tavenemWysiwygEditor._editors[div.id];
                    if (!editor) {
                        return true;
                    }
                    editor.ref.invokeMethodAsync(
                        "OnChangeInvoked",
                        tavenemWysiwygEditor.getContent(editor));
                    return true;
                }
            }
        });
        this._editors[elementId] = {
            commands: commands,
            isMarkdown,
            view,
            options,
            ref: dotNetRef,
        };
        if (options.readOnly) {
            this.setReadOnly(view, options.readOnly);
        }

        return this._editors[elementId];
    }

    setReadOnly(editor: PMEditorView | undefined, value: boolean) {
        if (editor) {
            editor.setProps({ editable: () => !value });
        }
    }

    updateSelectedText(elementId: string, value?: string) {
        const editor = this._editors[elementId];
        if (!editor) {
            return;
        }

        if (!value || !value.length) {
            deleteSelection(editor.view.state, editor.view.dispatch);
        } else {
            const node = editor.view.state.schema.text(value);
            const newState = editor.view.state.apply(
                editor.view.state.tr.replaceSelectionWith(node));
            editor.view.updateState(newState);
        }

        editor.ref.invokeMethodAsync(
            "OnChangeInvoked",
            this.getContent(editor));
    }

    private onInput(elementId: string) {
        const editor = this._editors[elementId];
        if (editor) {
            editor.ref.invokeMethodAsync(
                "OnChangeInvoked",
                this.getContent(editor));
        }
    }
}
const tavenemWysiwygEditor = new TavenemWysiwygEditor();

const themeObserver = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
        if (mutation.type === 'attributes'
            && mutation.target instanceof HTMLElement) {
            const theme = mutation.target.dataset.theme;
            if (theme) {
                const effect = codeEditorThemeCompartment.reconfigure(theme === 'dark'
                    ? codeEditorDarkExtension
                    : codeEditorLightTheme);
                for (const elementId in tavenemCodeEditor._editors) {
                    const editor = tavenemCodeEditor._editors[elementId];
                    editor.view.dispatch({ effects: effect });
                }
            }
        }
    });
});
themeObserver.observe(document.documentElement, { attributes: true });

interface ToolbarSeparator {
    isStyle?: boolean;
    isWysiwyg?: boolean;
}

interface ToolbarButtonDefinition extends ToolbarSeparator {
    buttons?: ToolbarButtonDefinition[];
    class?: string;
    icon?: string;
    inactiveIcon?: string;
    parentClass?: string;
    text?: string;
    tooltip?: string;
    type: CommandType;
    params?: any[];
}

class ToolbarButton {
    _element: HTMLButtonElement;
    _type: CommandType;

    constructor(button: HTMLButtonElement, type: CommandType) {
        this._element = button;
        this._type = type;
    }
}

const toolbarButtonDefinitions: (ToolbarButtonDefinition | ToolbarSeparator)[] = [
    {
        icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M280-200v-80h284q63 0 109.5-40T720-420q0-60-46.5-100T564-560H312l104 104-56 56-200-200 200-200 56 56-104 104h252q97 0 166.5 63T800-420q0 94-69.5 157T564-200H280Z"/></svg>',
        tooltip: 'undo',
        type: CommandType.Undo,
    }, {
        icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M396-200q-97 0-166.5-63T160-420q0-94 69.5-157T396-640h252L544-744l56-56 200 200-200 200-56-56 104-104H396q-63 0-109.5 40T240-420q0 60 46.5 100T396-280h284v80H396Z"/></svg>',
        tooltip: 'redo',
        type: CommandType.Redo,
    }, {
        isStyle: true,
    }, {
        icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M272-200v-560h221q65 0 120 40t55 111q0 51-23 78.5T602-491q25 11 55.5 41t30.5 90q0 89-65 124.5T501-200H272Zm121-112h104q48 0 58.5-24.5T566-372q0-11-10.5-35.5T494-432H393v120Zm0-228h93q33 0 48-17t15-38q0-24-17-39t-44-15h-95v109Z"/></svg>',
        isStyle: true,
        type: CommandType.Strong,
        buttons: [
            {
                parentClass: 'filled',
                text: 'Strong',
                type: CommandType.Strong,
            },
            {
                parentClass: 'outlined',
                text: 'Bold',
                type: CommandType.Bold,
            },
        ],
    }, {
        icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M200-200v-100h160l120-360H320v-100h400v100H580L460-300h140v100H200Z"/></svg>',
        isStyle: true,
        type: CommandType.Emphasis,
        buttons: [
            {
                parentClass: 'filled',
                text: 'Emphasis',
                type: CommandType.Emphasis,
            },
            {
                parentClass: 'outlined',
                text: 'Italic',
                type: CommandType.Italic,
            },
        ],
    }, {
        icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M200-120v-80h560v80H200Zm280-160q-101 0-157-63t-56-167v-330h103v336q0 56 28 91t82 35q54 0 82-35t28-91v-336h103v330q0 104-56 167t-157 63Z"/></svg>',
        isStyle: true,
        tooltip: 'underline',
        type: CommandType.Underline,
        buttons: [
            {
                icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M486-160q-76 0-135-45t-85-123l88-38q14 48 48.5 79t85.5 31q42 0 76-20t34-64q0-18-7-33t-19-27h112q5 14 7.5 28.5T694-340q0 86-61.5 133T486-160ZM80-480v-80h800v80H80Zm402-326q66 0 115.5 32.5T674-674l-88 39q-9-29-33.5-52T484-710q-41 0-68 18.5T386-640h-96q2-69 54.5-117.5T482-806Z"/></svg>',
                type: CommandType.Strikethrough,
            },
            {
                icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M760-160v-80q0-17 11.5-28.5T800-280h80v-40H760v-40h120q17 0 28.5 11.5T920-320v40q0 17-11.5 28.5T880-240h-80v40h120v40H760Zm-525-80 185-291-172-269h106l124 200h4l123-200h107L539-531l186 291H618L482-457h-4L342-240H235Z"/></svg>',
                type: CommandType.Subscript,
            },
            {
                icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M760-600v-80q0-17 11.5-28.5T800-720h80v-40H760v-40h120q17 0 28.5 11.5T920-760v40q0 17-11.5 28.5T880-680h-80v40h120v40H760ZM235-160l185-291-172-269h106l124 200h4l123-200h107L539-451l186 291H618L482-377h-4L342-160H235Z"/></svg>',
                type: CommandType.Superscript,
            },
            {
                icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M320-240 80-480l240-240 57 57-184 184 183 183-56 56Zm320 0-57-57 184-184-183-183 56-56 240 240-240 240Z"/></svg>',
                type: CommandType.CodeInline,
            },
            {
                icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M560-160v-520H360v-120h520v120H680v520H560Zm-360 0v-320H80v-120h360v120H320v320H200Z"/></svg>',
                type: CommandType.Small,
            },
            {
                icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z"/></svg>',
                type: CommandType.Inserted,
            },
        ],
    }, {
        isStyle: true,
    }, {
        icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M420-160v-520H200v-120h560v120H540v520H420Z"/></svg>',
        isStyle: true,
        tooltip: 'block type',
        buttons: [
            {
                text: 'Heading 1',
                type: CommandType.Heading,
                params: [1],
            },
            {
                text: 'Heading 2',
                type: CommandType.Heading,
                params: [2],
            },
            {
                text: 'Heading 3',
                type: CommandType.Heading,
                params: [3],
            },
            {
                text: 'Heading 4',
                type: CommandType.Heading,
                params: [4],
            },
            {
                text: 'Heading 5',
                type: CommandType.Heading,
                params: [5],
            },
            {
                text: 'Heading 6',
                type: CommandType.Heading,
                params: [6],
            },
            {
                text: 'Paragraph',
                type: CommandType.Paragraph,
            },
            {
                text: 'Block quote',
                type: CommandType.BlockQuote,
            },
            {
                text: 'Code block',
                type: CommandType.CodeBlock,
            },
        ],
    }, {
        isStyle: true,
    }, {
        class: 'link-button',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M440-280H280q-83 0-141.5-58.5T80-480q0-83 58.5-141.5T280-680h160v80H280q-50 0-85 35t-35 85q0 50 35 85t85 35h160v80ZM320-440v-80h320v80H320Zm200 160v-80h160q50 0 85-35t35-85q0-50-35-85t-85-35H520v-80h160q83 0 141.5 58.5T880-480q0 83-58.5 141.5T680-280H520Z"/></svg>',
        inactiveIcon: '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="m770-302-60-62q40-11 65-42.5t25-73.5q0-50-35-85t-85-35H520v-80h160q83 0 141.5 58.5T880-480q0 57-29.5 105T770-302ZM634-440l-80-80h86v80h-6ZM792-56 56-792l56-56 736 736-56 56ZM440-280H280q-83 0-141.5-58.5T80-480q0-69 42-123t108-71l74 74h-24q-50 0-85 35t-35 85q0 50 35 85t85 35h160v80ZM320-440v-80h65l79 80H320Z"/></svg>',
        isStyle: true,
        tooltip: 'link',
    }, {
        class: 'image-button',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Zm40-80h480L570-480 450-320l-90-120-120 160Zm-40 80v-560 560Z"/></svg>',
        isStyle: true,
        tooltip: 'image',
    }, {
        isStyle: true,
    }, {
        icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M360-200v-80h480v80H360Zm0-240v-80h480v80H360Zm0-240v-80h480v80H360ZM200-160q-33 0-56.5-23.5T120-240q0-33 23.5-56.5T200-320q33 0 56.5 23.5T280-240q0 33-23.5 56.5T200-160Zm0-240q-33 0-56.5-23.5T120-480q0-33 23.5-56.5T200-560q33 0 56.5 23.5T280-480q0 33-23.5 56.5T200-400Zm0-240q-33 0-56.5-23.5T120-720q0-33 23.5-56.5T200-800q33 0 56.5 23.5T280-720q0 33-23.5 56.5T200-640Z"/></svg>',
        isStyle: true,
        tooltip: 'list',
        type: CommandType.ListBullet,
        buttons: [
            {
                icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M120-80v-60h100v-30h-60v-60h60v-30H120v-60h120q17 0 28.5 11.5T280-280v40q0 17-11.5 28.5T240-200q17 0 28.5 11.5T280-160v40q0 17-11.5 28.5T240-80H120Zm0-280v-110q0-17 11.5-28.5T160-510h60v-30H120v-60h120q17 0 28.5 11.5T280-560v70q0 17-11.5 28.5T240-450h-60v30h100v60H120Zm60-280v-180h-60v-60h120v240h-60Zm180 440v-80h480v80H360Zm0-240v-80h480v80H360Zm0-240v-80h480v80H360Z"/></svg>',
                type: CommandType.ListNumber,
            },
            {
                icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M222-200 80-342l56-56 85 85 170-170 56 57-225 226Zm0-320L80-662l56-56 85 85 170-170 56 57-225 226Zm298 240v-80h360v80H520Zm0-320v-80h360v80H520Z"/></svg>',
                type: CommandType.ListCheck,
            },
        ],
    }, {
        icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M120-120v-80h720v80H120Zm320-160v-80h400v80H440Zm0-160v-80h400v80H440Zm0-160v-80h400v80H440ZM120-760v-80h720v80H120Zm160 440L120-480l160-160v320Z"/></svg>',
        isStyle: true,
        isWysiwyg: true,
        tooltip: 'lift out',
        type: CommandType.UpLevel,
    }, {
        icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M120-120v-80h720v80H120Zm320-160v-80h400v80H440Zm0-160v-80h400v80H440Zm0-160v-80h400v80H440ZM120-760v-80h720v80H120Zm0 440v-320l160 160-160 160Z"/></svg>',
        isStyle: true,
        isWysiwyg: true,
        tooltip: 'indent',
        type: CommandType.DownLevel,
    }, {
        isStyle: true,
    }, {
        icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M80 0v-160h800V0H80Zm504-480L480-584 320-424l103 104 161-160Zm-47-160 103 103 160-159-104-104-159 160Zm-84-29 216 216-189 190q-24 24-56.5 24T367-263l-27 23H140l126-125q-24-24-25-57.5t23-57.5l189-189Zm0 0 187-187q24-24 56.5-24t56.5 24l104 103q24 24 24 56.5T857-640L669-453 453-669Z"/></svg>',
        isStyle: true,
        tooltip: 'highlight',
        type: CommandType.Marked,
    }];

export class TavenemEditorHtmlElement extends HTMLElement {
    _inputDebounce: number = -1;
    _tavenemCodeEditor: TavenemCodeEditor | undefined;
    _tavenemWysiwygEditor: TavenemWysiwygEditor | undefined;
    _toolbarButtons: ToolbarButton[] = [];

    static get observedAttributes() {
        return [
            'disabled',
            'readonly',
            'required',
            'value'
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
        const shadow = this.attachShadow({ mode: 'open' });

        const slot = document.createElement('slot');
        shadow.appendChild(slot);

        const input = document.createElement('textarea');
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

        const undoButton = document.createElement('button');
        undoButton.classList.add('toolbar-button');
        toolbar.appendChild(undoButton);
    }

    attributeChangedCallback(name: string, oldValue: string | null | undefined, newValue: string | null | undefined) {
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
        } else if (name === 'required') {
            input.required = !!newValue;
        } else if (name === 'value') {
            input.value = newValue || '';
        }
    }

    private onChange() {
        const root = this.shadowRoot;
        if (!root) {
            return;
        }
        this.onInput();
        const input = root.querySelector('textarea');
        if (input) {
            this.dispatchEvent(TavenemEditorHtmlElement.newValueChangeEvent(input.value));
        }
    }

    private onInput() {
        const root = this.shadowRoot;
        if (!root) {
            return;
        }
        const input = root.querySelector('textarea');
        if (!input) {
            return;
        }

        if (!input.value || !input.value.length) {
            this.removeAttribute('value');
        } else {
            this.setAttribute('value', input.value);
        }

        if ('inputDebounce' in this.dataset) {
            const debounce = parseInt(this.dataset.inputDebounce || '');
            if (Number.isFinite(debounce)
                && debounce > 0) {
                clearTimeout(this._inputDebounce);
                this._inputDebounce = setTimeout(this.updateInputDebounced.bind(this), debounce);
                return;
            }
        }

        this.dispatchEvent(TavenemEditorHtmlElement.newValueInputEvent(input.value));
    }

    private updateInputDebounced() {
        const root = this.shadowRoot;
        if (!root) {
            return;
        }
        const input = root.querySelector('textarea');
        if (input) {
            input.dispatchEvent(TavenemEditorHtmlElement.newValueInputEvent(input.value));
        }
    }
}

export function activateCommand(elementId: string, type: CommandType, params?: any[]) {
    const codeEditor = tavenemCodeEditor._editors[elementId];
    if (codeEditor) {
        let command: ParamStateCommand | undefined;
        if (codeEditor.options.syntax == 'HTML') {
            command = htmlCommands[type];
        } else if (codeEditor.options.syntax == 'Markdown') {
            command = markdownCommands[type];
        } else if (type == CommandType.Undo) {
            command = _ => codeUndo;
        } else if (type == CommandType.Redo) {
            command = _ => codeRedo;
        }
        if (command) {
            command(params)({
                state: codeEditor.view.state,
                dispatch: codeEditor.view.dispatch
            });
            codeEditor.view.focus();
        }
        return;
    }

    const wysiwygEditor = tavenemWysiwygEditor._editors[elementId];
    if (!wysiwygEditor) {
        return;
    }

    const command = wysiwygEditor.commands[type];
    if (command) {
        command.command(wysiwygEditor.view.state, wysiwygEditor.view.dispatch, wysiwygEditor.view, params);
        wysiwygEditor.view.focus();
    }
}

export function disposeEditor(elementId: string) {
    tavenemCodeEditor.dispose(elementId);
    tavenemWysiwygEditor.dispose(elementId);
}

export function focusEditor(elementId: string) {
    const codeEditor = tavenemCodeEditor._editors[elementId];
    if (codeEditor) {
        codeEditor.view.focus();
        return;
    }

    const wysiwygEditor = tavenemWysiwygEditor._editors[elementId];
    if (wysiwygEditor) {
        wysiwygEditor.view.focus();
    }
}

export function getSelectedText(elementId: string) {
    const codeEditor = tavenemCodeEditor._editors[elementId];
    if (codeEditor) {
        return codeEditor.view.state.sliceDoc(
            codeEditor.view.state.selection.ranges.map(v => v.from).reduce((p, v) => (p < v ? p : v)),
            codeEditor.view.state.selection.ranges.map(v => v.to).reduce((p, v) => (p > v ? p : v)));
    }

    const wysiwygEditor = tavenemWysiwygEditor._editors[elementId];
    if (wysiwygEditor) {
        const { from, to } = wysiwygEditor.view.state.selection;
        return wysiwygEditor.view.state.doc.textBetween(from, to, " ");
    }
}

export function initializeEditor(
    elementId: string,
    dotNetRef: DotNet.DotNetObject,
    options: EditorOptions) {
    if (options.mode == EditorMode.WYSIWYG
        && (options.syntax == 'HTML'
            || options.syntax == 'Markdown')) {
        tavenemWysiwygEditor.initializeEditor(
            elementId,
            dotNetRef,
            options);
    } else {
        tavenemCodeEditor.initializeEditor(
            elementId,
            dotNetRef,
            options);
    }
}

export function setEditorMode(elementId: string, value: EditorMode) {
    if (value == EditorMode.WYSIWYG) {
        const existingEditor = tavenemWysiwygEditor._editors[elementId];
        if (existingEditor) {
            return;
        }

        const editor = tavenemCodeEditor._editors[elementId];
        if (!editor) {
            return;
        }

        const options = editor.options;
        options.autoFocus = true;
        options.initialValue = editor.view.state.doc.toString();
        options.mode = value;

        tavenemCodeEditor.dispose(elementId);

        tavenemWysiwygEditor.initializeEditor(
            elementId,
            editor.ref,
            options);

    } else {
        const existingEditor = tavenemCodeEditor._editors[elementId];
        if (existingEditor) {
            return;
        }

        const editor = tavenemWysiwygEditor._editors[elementId];
        if (!editor) {
            return;
        }

        const options = editor.options;
        options.autoFocus = true;
        options.initialValue = tavenemWysiwygEditor.getContent(editor);
        options.mode = value;

        tavenemWysiwygEditor.dispose(elementId);

        tavenemCodeEditor.initializeEditor(
            elementId,
            editor.ref,
            options);
    }
}

export function setReadOnly(elementId: string, value: boolean) {
    const codeEditor = tavenemCodeEditor._editors[elementId];
    if (codeEditor) {
        codeEditor.view.dispatch({
            effects: codeEditor.readOnly.reconfigure(EditorState.readOnly.of(value)),
        });
        return;
    }

    const wysiwygEditor = tavenemWysiwygEditor._editors[elementId];
    if (!wysiwygEditor) {
        return;
    }
    tavenemWysiwygEditor.setReadOnly(wysiwygEditor.view, value);
}

export async function setSyntax(elementId: string, value: string) {
    const codeEditor = tavenemCodeEditor._editors[elementId];
    if (codeEditor) {
        if (value == codeEditor.options.syntax) {
            return;
        }

        const spec: TransactionSpec = {
            effects: codeEditor.language.reconfigure(
                codeEditorLanguageMap[value.toLowerCase()]
                || codeEditorPlainText),
        };

        if ((codeEditor.options.syntax == 'HTML'
            && value == 'Markdown')
            || (codeEditor.options.syntax == 'Markdown'
                && value == 'HTML')) {
            let text;
            const div = document.createElement('div');
            if (codeEditor.options.syntax == 'HTML'
                && value == 'Markdown') {
                div.innerHTML = codeEditor.view.state.doc.toString();
                const node = PMDOMParser
                    .fromSchema(schema)
                    .parse(div);
                text = tavenemMarkdownSerializer.serialize(node);
            } else {
                const node = tavenemMarkdownParser.parse(codeEditor.view.state.doc.toString());
                div.appendChild(DOMSerializer
                    .fromSchema(schema)
                    .serializeFragment(node.content));
                text = div.innerHTML;
            }

            spec.changes = {
                from: 0,
                to: codeEditor.view.state.doc.length,
                insert: text,
            };
        }

        codeEditor.options.syntax = value;

        codeEditor.view.dispatch(spec);
        return;
    }

    const wysiwygEditor = tavenemWysiwygEditor._editors[elementId];
    if (!wysiwygEditor) {
        return;
    }

    if (value == wysiwygEditor.options.syntax) {
        return;
    }

    const ref = wysiwygEditor.ref;

    const options = wysiwygEditor.options;

    let text;
    const div = document.createElement('div');
    if (options.syntax == 'HTML'
        && value == 'Markdown') {
        text = tavenemMarkdownSerializer.serialize(wysiwygEditor.view.state.doc);
    } else if (options.syntax == 'Markdown'
        && value == 'HTML') {
        div.appendChild(DOMSerializer
            .fromSchema(wysiwygEditor.view.state.schema)
            .serializeFragment(wysiwygEditor.view.state.doc.content));
        text = div.innerHTML;
    } else {
        text = tavenemWysiwygEditor.getContent(wysiwygEditor);
    }

    options.initialValue = text;
    options.syntax = value;

    tavenemWysiwygEditor.dispose(elementId);

    if (value == 'HTML'
        || value == 'Markdown') {
        tavenemWysiwygEditor.initializeEditor(
            elementId,
            ref,
            options);
    } else {
        options.mode = EditorMode.Text;

        tavenemCodeEditor.initializeEditor(
            elementId,
            ref,
            options);
    }
}

export function setValue(elementId: string, value?: string) {
    const codeEditor = tavenemCodeEditor._editors[elementId];
    if (codeEditor) {
        codeEditor.view.dispatch({
            changes: {
                from: 0,
                to: codeEditor.view.state.doc.length,
                insert: value || '',
            }
        });
        return;
    }

    const wysiwygEditor = tavenemWysiwygEditor._editors[elementId];
    if (!wysiwygEditor) {
        return;
    }
    if (value) {
        let content;
        if (wysiwygEditor.isMarkdown) {
            content = tavenemMarkdownParser.parse(value);
        } else {
            const div = document.createElement('div');
            div.innerHTML = value;
            content = PMDOMParser
                .fromSchema(wysiwygEditor.view.state.schema)
                .parse(div);
        }
        wysiwygEditor.view.updateState(
            wysiwygEditor.view.state.apply(
                wysiwygEditor.view.state.tr.replaceRangeWith(
                    0,
                    wysiwygEditor.view.state.doc.content.size,
                    content)));
    } else {
        wysiwygEditor.view.updateState(
            wysiwygEditor.view.state.apply(
                wysiwygEditor.view.state.tr.delete(
                    0,
                    wysiwygEditor.view.state.doc.content.size)));
    }
}

export function updateSelectedText(elementId: string, value?: string) {
    const codeEditor = tavenemCodeEditor._editors[elementId];
    if (codeEditor) {
        tavenemCodeEditor.updateSelectedText(elementId, value);
    }

    tavenemWysiwygEditor.updateSelectedText(elementId, value);
}

function arrowHandler(dir: 'up' | 'down' | 'left' | 'right' | 'forward' | 'backward') {
    return (state: PMEditorState, dispatch?: (tr: Transaction) => void, view?: PMEditorView) => {
        if (!view) {
            return false;
        }
        if (state.selection.empty && view.endOfTextblock(dir)) {
            const side = dir == 'left' || dir == 'up' ? -1 : 1,
                $head = state.selection.$head;
            const nextPos = Selection.near(state.doc.resolve(side > 0 ? $head.after() : $head.before()), side);
            if (nextPos.$head
                && nextPos.$head.parent.type.name == "code_block") {
                if (dispatch) {
                    dispatch(state.tr.setSelection(nextPos));
                }
                return true;
            }
        }
        return false;
    };
}

function computeChange(oldVal: string, newVal: string) {
    if (oldVal == newVal) {
        return null;
    }
    let start = 0, oldEnd = oldVal.length, newEnd = newVal.length;
    while (start < oldEnd
        && oldVal.charCodeAt(start) == newVal.charCodeAt(start)) {
        ++start;
    }
    while (oldEnd > start
        && newEnd > start
        && oldVal.charCodeAt(oldEnd - 1) == newVal.charCodeAt(newEnd - 1)) {
        oldEnd--;
        newEnd--;
    }
    return {
        from: start,
        to: oldEnd,
        text: newVal.slice(start, newEnd),
    };
}

function defaultBlockAt(match: ContentMatch) {
    for (let i = 0; i < match.edgeCount; i++) {
        const { type } = match.edge(i);
        if (type.isTextblock && !type.hasRequiredAttrs()) {
            return type;
        }
    }
    return null;
}

function getPreferredColorScheme(): ThemePreference {
    const local = localStorage.getItem('tavenem-theme');
    if (local) {
        const theme = parseInt(local);
        if (theme == ThemePreference.Light
            || theme == ThemePreference.Dark) {
            return theme;
        }
    }

    if (window.matchMedia) {
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return ThemePreference.Dark;
        } else {
            return ThemePreference.Light;
        }
    }

    return ThemePreference.Light;
}
