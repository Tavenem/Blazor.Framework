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

import { EditorState as PMEditorState } from 'prosemirror-state';
import { EditorView as PMEditorView } from 'prosemirror-view';
import { Schema, DOMParser, DOMSerializer, Node } from 'prosemirror-model';
import { keymap as pmKeymap } from 'prosemirror-keymap';
import { history as pmHistory } from 'prosemirror-history';
import { baseKeymap, deleteSelection } from 'prosemirror-commands';
import { dropCursor as pmDropCursor } from 'prosemirror-dropcursor';
import { gapCursor } from 'prosemirror-gapcursor';
import { schema } from 'prosemirror-schema-basic';
import { addListNodes } from 'prosemirror-schema-list';
import { tableNodes } from 'prosemirror-tables';
import {
    schema as markdownSchema,
    defaultMarkdownParser,
    defaultMarkdownSerializer
} from 'prosemirror-markdown';

import { buildKeymap, buildInputRules } from 'prosemirror-example-setup';

enum ThemePreference {
    Auto = 0,
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
    theme: ThemePreference;
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
    view: PMEditorView;
}

class TavenemCodeEditor {
    _editors: Record<string, CodeEditorInfo> = {};

    _languageMap: Record<string, LanguageSupport | StreamLanguage<unknown>> = {
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
    }
    _plainText: Extension = [];

    _theme = new Compartment;
    _themeExtension: Extension | undefined;
    _themePreference = ThemePreference.Auto;
    _baseTheme = EditorView.baseTheme({
        "&": {
            height: "100%"
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
    _lightTheme = EditorView.theme({
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
    _darkTheme = EditorView.theme({
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
    _darkHighlightStyle = HighlightStyle.define([
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
    _darkExtension: Extension = [this._darkTheme, syntaxHighlighting(this._darkHighlightStyle)];

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

        const extensions: Extension[] = [
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

    private onInput(elementId: string) {
        const editor = this._editors[elementId];
        if (editor) {
            editor.ref.invokeMethodAsync("OnChangeInvoked", editor.view.state.doc.toString());
        }
    }
}
const tavenemCodeEditor = new TavenemCodeEditor();

const htmlSchema = new Schema({
    nodes: addListNodes(schema.spec.nodes, "paragraph block*", "block"),
    marks: schema.spec.marks
})
class TavenemWysiwygEditor {
    _editors: Record<string, WysiwygEditorInfo> = {};

    dispose(elementId: string) {
        const editor = this._editors[elementId];
        if (editor) {
            editor.view.destroy();
        }
        delete this._editors[elementId];
    }

    getContent(editor: PMEditorView) {
        let value;
        if (editor.state.schema == markdownSchema) {
            value = defaultMarkdownSerializer.serialize(editor.state.doc);
        } else {
            const div = document.createElement('div');
            div.appendChild(DOMSerializer
                .fromSchema(editor.state.schema)
                .serializeFragment(editor.state.doc.content));
            value = div.innerHTML;
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

        const editorSchema = options.syntax == 'markdown'
            ? markdownSchema
            : htmlSchema;

        let doc: Node;
        if (options.syntax == 'markdown') {
            doc = defaultMarkdownParser.parse(options.initialValue || '');
        } else {
            const div = document.createElement('div');
            if (options.initialValue) {
                div.innerHTML = options.initialValue;
            }
            doc = DOMParser
                .fromSchema(editorSchema)
                .parse(div);
        }

        const view = new PMEditorView(element, {
            state: PMEditorState.create({
                doc,
                plugins: [
                    buildInputRules(editorSchema),
                    pmKeymap(buildKeymap(editorSchema)),
                    pmKeymap(baseKeymap),
                    pmDropCursor(),
                    gapCursor(),
                    pmHistory()
                ]
            }),
            plugins: [],
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

                editor.debounce = setTimeout(
                    tavenemWysiwygEditor.onInput.bind(tavenemWysiwygEditor, div.id),
                    500);
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
                    editor.ref.invokeMethodAsync(
                        "OnChangeInvoked",
                        tavenemWysiwygEditor.getContent(view));
                    return true;
            }
        }
        });
        this._editors[elementId] = {
            view,
            options,
            ref: dotNetRef,
        };
        if (options.readOnly) {
            this.setReadOnly(view, options.readOnly);
        }
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
        }

        const node = editor.view.state.schema.text(value);
        editor.view.state.applyTransaction(
            editor.view.state.tr.replaceSelectionWith(node));

        editor.ref.invokeMethodAsync(
            "OnChangeInvoked",
            this.getContent(editor.view));
    }

    private onInput(elementId: string) {
        const editor = this._editors[elementId];
        if (editor) {
            editor.ref.invokeMethodAsync(
                "OnChangeInvoked",
                this.getContent(editor.view));
        }
    }
}
const tavenemWysiwygEditor = new TavenemWysiwygEditor();

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

export function setCodeEditorTheme(value: ThemePreference) {
    const effect = tavenemCodeEditor._theme.reconfigure(value == ThemePreference.Dark
        ? tavenemCodeEditor._darkExtension
        : tavenemCodeEditor._lightTheme);
    for (let elementId in tavenemCodeEditor._editors) {
        const editor = tavenemCodeEditor._editors[elementId];
        tavenemCodeEditor._themePreference = value;
        editor.view.dispatch({ effects: effect });
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
        options.initialValue = tavenemWysiwygEditor.getContent(editor.view);
        options.mode = value;
        options.theme = tavenemCodeEditor._themePreference;

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
                tavenemCodeEditor._languageMap[value.toLowerCase()]
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
                text = defaultMarkdownSerializer.serialize(node);
            } else {
                const node = defaultMarkdownParser.parse(codeEditor.view.state.doc.toString());
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
        text = defaultMarkdownSerializer.serialize(wysiwygEditor.view.state.doc);
    } else if (options.syntax == 'Markdown'
        && value == 'HTML') {
        div.appendChild(DOMSerializer
            .fromSchema(wysiwygEditor.view.state.schema)
            .serializeFragment(wysiwygEditor.view.state.doc.content));
        text = div.innerHTML;
    } else {
        text = tavenemWysiwygEditor.getContent(wysiwygEditor.view);
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
        options.theme = tavenemCodeEditor._themePreference;

        tavenemCodeEditor.initializeEditor(
            elementId,
            ref,
            options);
    }
}

export function setValue(elementId: string, value?: string) {
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
            content = defaultMarkdownParser.parse(value);
        } else {
            const div = document.createElement('div');
            div.innerHTML = value;
            content = DOMParser
                .fromSchema(wysiwygEditor.view.state.schema)
                .parse(div);
        }
        wysiwygEditor.view.updateState(
            wysiwygEditor.view.state.apply(
                wysiwygEditor.view.state.tr.replaceRangeWith(
                    0,
                    wysiwygEditor.view.state.doc.nodeSize,
                    content)));
    } else {
        wysiwygEditor.view.updateState(
            wysiwygEditor.view.state.apply(
                wysiwygEditor.view.state.tr.delete(
                    0,
                    wysiwygEditor.view.state.doc.nodeSize)));
    }
}

export function updateWysiwygEditorSelectedText(elementId: string, value?: string) {
    tavenemWysiwygEditor.updateSelectedText(elementId, value);
}