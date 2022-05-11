import { EditorView, keymap, highlightSpecialChars, drawSelection, highlightActiveLine, dropCursor, rectangularSelection, crosshairCursor, lineNumbers, highlightActiveLineGutter, placeholder, } from '@codemirror/view';
import { EditorState, Compartment } from '@codemirror/state';
import { HighlightStyle, StreamLanguage, defaultHighlightStyle, syntaxHighlighting, indentOnInput, bracketMatching, foldGutter, foldKeymap, codeFolding, } from '@codemirror/language';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
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
import { EditorState as PMEditorState, Plugin } from 'prosemirror-state';
import { EditorView as PMEditorView } from 'prosemirror-view';
import { DOMParser, DOMSerializer } from 'prosemirror-model';
import { baseKeymap, deleteSelection } from 'prosemirror-commands';
import { keymap as pmKeymap } from 'prosemirror-keymap';
import { history as pmHistory } from 'prosemirror-history';
import { dropCursor as pmDropCursor } from 'prosemirror-dropcursor';
import { gapCursor } from 'prosemirror-gapcursor';
import { buildKeymap, buildInputRules } from 'prosemirror-example-setup';
import { columnResizing, fixTables, goToNextCell, tableEditing } from 'prosemirror-tables';
import { commonCommands, htmlCommands, htmlSchema, markdownCommands, markdownSchema, tavenemMarkdownParser, tavenemMarkdownSerializer } from './tavenem-schemas';
var ThemePreference;
(function (ThemePreference) {
    ThemePreference[ThemePreference["Auto"] = 0] = "Auto";
    ThemePreference[ThemePreference["Light"] = 1] = "Light";
    ThemePreference[ThemePreference["Dark"] = 2] = "Dark";
})(ThemePreference || (ThemePreference = {}));
var EditorMode;
(function (EditorMode) {
    EditorMode[EditorMode["None"] = 0] = "None";
    EditorMode[EditorMode["Text"] = 1] = "Text";
    EditorMode[EditorMode["WYSIWYG"] = 2] = "WYSIWYG";
})(EditorMode || (EditorMode = {}));
class TavenemCodeEditor {
    constructor() {
        this._editors = {};
        this._languageMap = {
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
        this._plainText = [];
        this._theme = new Compartment;
        this._themePreference = ThemePreference.Auto;
        this._baseTheme = EditorView.baseTheme({
            "&": {
                flexGrow: "1"
            },
            "&, .cm-scroller": {
                borderRadius: 'inherit'
            },
            "&.cm-editor.cm-focused": {
                outline: "none",
                "& .cm-selectionBackground": { backgroundColor: "var(--tavenem-color-bg-highlight)" },
            },
            "&.set-height .cm-scroller": {
                overflow: 'auto'
            },
            ".cm-content": {
                caretColor: "var(--tavenem-color-text)"
            },
            ".cm-cursor, .cm-dropCursor": { borderLeftColor: "var(--tavenem-color-text)" },
            ".cm-selectionBackground, .cm-content ::selection": { backgroundColor: "var(--tavenem-color-bg)" },
            ".cm-panels": { backgroundColor: "var(--tavenem-color-bg-surface)", color: "var(--tavenem-color-text)" },
            ".cm-panels.cm-panels-top": { borderBottom: "1px solid var(--field-border-color)" },
            ".cm-panels.cm-panels-bottom": { borderTop: "1px solid var(--field-border-color)" },
            ".cm-activeLine, .cm-activeLineGutter": { backgroundColor: "var(--tavenem-color-bg-alt)" },
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
        this._lightTheme = EditorView.theme({
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
        this._darkTheme = EditorView.theme({
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
        this._darkHighlightStyle = HighlightStyle.define([
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
        this._darkExtension = [this._darkTheme, syntaxHighlighting(this._darkHighlightStyle)];
    }
    dispose(elementId) {
        const editor = this._editors[elementId];
        if (editor) {
            editor.view.destroy();
        }
        delete this._editors[elementId];
    }
    initializeEditor(elementId, dotNetRef, options) {
        const element = document.getElementById(elementId);
        if (!(element instanceof HTMLDivElement)) {
            return;
        }
        const existing = this._editors[elementId];
        if (existing) {
            existing.view.destroy();
            delete this._editors[elementId];
        }
        const languageExtention = options.syntax
            ? this._languageMap[options.syntax.toLowerCase()] || this._plainText
            : this._plainText;
        const languageCompartment = new Compartment;
        const readOnlyCompartment = new Compartment;
        this._themePreference = options.theme;
        if (!this._themeExtension) {
            this._themeExtension = this._theme.of(options.theme == ThemePreference.Dark
                ? this._darkExtension
                : this._lightTheme);
        }
        const extensions = [
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
                ...lintKeymap
            ]),
            languageCompartment.of(languageExtention),
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
                if (!editor
                    || !editor.options.updateOnInput) {
                    return;
                }
                if (editor.debounce) {
                    clearTimeout(editor.debounce);
                }
                editor.debounce = setTimeout(tavenemCodeEditor.onInput.bind(tavenemCodeEditor, div.id), 500);
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
            this._baseTheme,
            this._themeExtension,
        ];
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
    }
    onInput(elementId) {
        const editor = this._editors[elementId];
        if (editor) {
            editor.ref.invokeMethodAsync("OnChangeInvoked", editor.view.state.doc.toString());
        }
    }
}
const tavenemCodeEditor = new TavenemCodeEditor();
class MenuView {
    constructor(dotNetRef, commands, editorView) {
        this._commands = [];
        this._commands = commands;
        this._editorView = editorView;
        this._ref = dotNetRef;
        this.update();
    }
    update() {
        this._commands.forEach(command => {
            if (command.isActive && command.markType) {
                command.active = command.isActive(this._editorView.state, command.markType);
            }
            command.enabled = command.command(this._editorView.state, undefined, this._editorView);
        });
        this._ref.invokeMethodAsync("UpdateCommands", { commands: this._commands });
    }
}
class TavenemWysiwygEditor {
    constructor() {
        this._editors = {};
    }
    dispose(elementId) {
        const editor = this._editors[elementId];
        if (editor) {
            editor.view.destroy();
        }
        delete this._editors[elementId];
    }
    getContent(editor) {
        let value;
        if (editor.state.schema == markdownSchema) {
            value = tavenemMarkdownSerializer.serialize(editor.state.doc);
        }
        else {
            const div = document.createElement('div');
            div.appendChild(DOMSerializer
                .fromSchema(editor.state.schema)
                .serializeFragment(editor.state.doc.content));
            value = div.innerHTML;
        }
        return value;
    }
    initializeEditor(elementId, dotNetRef, options) {
        const element = document.getElementById(elementId);
        if (!(element instanceof HTMLDivElement)) {
            return;
        }
        const existing = this._editors[elementId];
        if (existing) {
            existing.view.destroy();
            delete this._editors[elementId];
        }
        const editorSchema = options.syntax == 'markdown'
            ? markdownSchema
            : htmlSchema;
        let doc;
        if (options.syntax == 'markdown') {
            doc = tavenemMarkdownParser.parse(options.initialValue || '');
        }
        else {
            const div = document.createElement('div');
            if (options.initialValue) {
                div.innerHTML = options.initialValue;
            }
            doc = DOMParser
                .fromSchema(editorSchema)
                .parse(div);
        }
        const commands = [];
        for (const type in commonCommands(editorSchema)) {
            commands.push(commands[type]);
        }
        if (options.syntax == 'markdown') {
            for (const type in markdownCommands) {
                const command = markdownCommands[type];
                if (command) {
                    commands.push(command);
                }
            }
        }
        else {
            for (const type in htmlCommands) {
                const command = htmlCommands[type];
                if (command) {
                    commands.push(command);
                }
            }
        }
        const menu = new Plugin({
            view(editorView) {
                return new MenuView(dotNetRef, commands, editorView);
            }
        });
        ;
        let state = PMEditorState.create({
            doc,
            plugins: [
                buildInputRules(editorSchema),
                pmKeymap(buildKeymap(editorSchema)),
                pmKeymap(baseKeymap),
                pmDropCursor(),
                gapCursor(),
                pmHistory(),
                columnResizing({}),
                tableEditing(),
                pmKeymap({
                    "Tab": goToNextCell(1),
                    "Shift-Tab": goToNextCell(-1)
                })
            ]
        });
        const fixed = fixTables(state);
        if (fixed) {
            state = state.apply(fixed.setMeta("addToHistory", false));
        }
        const view = new PMEditorView(element, {
            state: state,
            plugins: [menu],
            dispatchTransaction(tr) {
                this.updateState(this.state.apply(tr));
                if (!tr.docChanged) {
                    return;
                }
                const div = this.dom.parentElement;
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
                editor.debounce = setTimeout(tavenemWysiwygEditor.onInput.bind(tavenemWysiwygEditor, div.id), 500);
            },
            handleDOMEvents: {
                'blur': function (view, e) {
                    const div = view.dom.parentElement;
                    if (!div) {
                        return true;
                    }
                    const editor = tavenemWysiwygEditor._editors[div.id];
                    if (!editor) {
                        return true;
                    }
                    editor.ref.invokeMethodAsync("OnChangeInvoked", tavenemWysiwygEditor.getContent(view));
                    return true;
                }
            }
        });
        this._editors[elementId] = {
            commands: commands,
            view,
            options,
            ref: dotNetRef,
        };
        if (options.readOnly) {
            this.setReadOnly(view, options.readOnly);
        }
    }
    setReadOnly(editor, value) {
        if (editor) {
            editor.setProps({ editable: () => !value });
        }
    }
    updateSelectedText(elementId, value) {
        const editor = this._editors[elementId];
        if (!editor) {
            return;
        }
        if (!value || !value.length) {
            deleteSelection(editor.view.state, editor.view.dispatch);
        }
        const node = editor.view.state.schema.text(value);
        editor.view.state.applyTransaction(editor.view.state.tr.replaceSelectionWith(node));
        editor.ref.invokeMethodAsync("OnChangeInvoked", this.getContent(editor.view));
    }
    onInput(elementId) {
        const editor = this._editors[elementId];
        if (editor) {
            editor.ref.invokeMethodAsync("OnChangeInvoked", this.getContent(editor.view));
        }
    }
}
const tavenemWysiwygEditor = new TavenemWysiwygEditor();
export function activateCommand(elementId, type) {
    const codeEditor = tavenemCodeEditor._editors[elementId];
    if (codeEditor) {
        return;
    }
    const wysiwygEditor = tavenemWysiwygEditor._editors[elementId];
    if (!wysiwygEditor) {
        return;
    }
    let command = wysiwygEditor.commands[type];
    if (command) {
        command.command(wysiwygEditor.view.state, wysiwygEditor.view.dispatch, wysiwygEditor.view);
        wysiwygEditor.view.focus();
    }
}
export function disposeEditor(elementId) {
    tavenemCodeEditor.dispose(elementId);
    tavenemWysiwygEditor.dispose(elementId);
}
export function focusEditor(elementId) {
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
export function getSelectedText(elementId) {
    const codeEditor = tavenemCodeEditor._editors[elementId];
    if (codeEditor) {
        return codeEditor.view.state.sliceDoc(codeEditor.view.state.selection.ranges.map(v => v.from).reduce((p, v) => (p < v ? p : v)), codeEditor.view.state.selection.ranges.map(v => v.to).reduce((p, v) => (p > v ? p : v)));
    }
    const wysiwygEditor = tavenemWysiwygEditor._editors[elementId];
    if (wysiwygEditor) {
        const { from, to } = wysiwygEditor.view.state.selection;
        return wysiwygEditor.view.state.doc.textBetween(from, to, " ");
    }
}
export function initializeEditor(elementId, dotNetRef, options) {
    if (options.mode == EditorMode.WYSIWYG
        && (options.syntax == 'HTML'
            || options.syntax == 'Markdown')) {
        tavenemWysiwygEditor.initializeEditor(elementId, dotNetRef, options);
    }
    else {
        tavenemCodeEditor.initializeEditor(elementId, dotNetRef, options);
    }
}
export function setCodeEditorTheme(value) {
    const effect = tavenemCodeEditor._theme.reconfigure(value == ThemePreference.Dark
        ? tavenemCodeEditor._darkExtension
        : tavenemCodeEditor._lightTheme);
    for (let elementId in tavenemCodeEditor._editors) {
        const editor = tavenemCodeEditor._editors[elementId];
        tavenemCodeEditor._themePreference = value;
        editor.view.dispatch({ effects: effect });
    }
}
export function setEditorMode(elementId, value) {
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
        options.initialValue = editor.view.state.doc.toString();
        options.mode = value;
        tavenemCodeEditor.dispose(elementId);
        tavenemWysiwygEditor.initializeEditor(elementId, editor.ref, options);
    }
    else {
        const existingEditor = tavenemCodeEditor._editors[elementId];
        if (existingEditor) {
            return;
        }
        const editor = tavenemWysiwygEditor._editors[elementId];
        if (!editor) {
            return;
        }
        const options = editor.options;
        options.initialValue = tavenemWysiwygEditor.getContent(editor.view);
        options.mode = value;
        options.theme = tavenemCodeEditor._themePreference;
        tavenemWysiwygEditor.dispose(elementId);
        tavenemCodeEditor.initializeEditor(elementId, editor.ref, options);
    }
}
export function setReadOnly(elementId, value) {
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
export async function setSyntax(elementId, value) {
    const codeEditor = tavenemCodeEditor._editors[elementId];
    if (codeEditor) {
        if (value == codeEditor.options.syntax) {
            return;
        }
        const spec = {
            effects: codeEditor.language.reconfigure(tavenemCodeEditor._languageMap[value.toLowerCase()]
                || tavenemCodeEditor._plainText),
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
                const node = DOMParser
                    .fromSchema(htmlSchema)
                    .parse(div);
                text = tavenemMarkdownSerializer.serialize(node);
            }
            else {
                const node = tavenemMarkdownParser.parse(codeEditor.view.state.doc.toString());
                div.appendChild(DOMSerializer
                    .fromSchema(htmlSchema)
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
    }
    else if (options.syntax == 'Markdown'
        && value == 'HTML') {
        div.appendChild(DOMSerializer
            .fromSchema(wysiwygEditor.view.state.schema)
            .serializeFragment(wysiwygEditor.view.state.doc.content));
        text = div.innerHTML;
    }
    else {
        text = tavenemWysiwygEditor.getContent(wysiwygEditor.view);
    }
    options.initialValue = text;
    options.syntax = value;
    tavenemWysiwygEditor.dispose(elementId);
    if (value == 'HTML'
        || value == 'Markdown') {
        tavenemWysiwygEditor.initializeEditor(elementId, ref, options);
    }
    else {
        options.mode = EditorMode.Text;
        options.theme = tavenemCodeEditor._themePreference;
        tavenemCodeEditor.initializeEditor(elementId, ref, options);
    }
}
export function setValue(elementId, value) {
    const codeEditor = tavenemCodeEditor._editors[elementId];
    if (codeEditor) {
        codeEditor.view.state.update({
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
        if (wysiwygEditor.view.state.schema == markdownSchema) {
            content = tavenemMarkdownParser.parse(value);
        }
        else {
            const div = document.createElement('div');
            div.innerHTML = value;
            content = DOMParser
                .fromSchema(wysiwygEditor.view.state.schema)
                .parse(div);
        }
        wysiwygEditor.view.updateState(wysiwygEditor.view.state.apply(wysiwygEditor.view.state.tr.replaceRangeWith(0, wysiwygEditor.view.state.doc.nodeSize, content)));
    }
    else {
        wysiwygEditor.view.updateState(wysiwygEditor.view.state.apply(wysiwygEditor.view.state.tr.delete(0, wysiwygEditor.view.state.doc.nodeSize)));
    }
}
export function updateWysiwygEditorSelectedText(elementId, value) {
    tavenemWysiwygEditor.updateSelectedText(elementId, value);
}
//# sourceMappingURL=tavenem-editor.js.map