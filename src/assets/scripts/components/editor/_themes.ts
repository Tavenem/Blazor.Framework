import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { Extension } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { tags } from '@lezer/highlight';

export const codeEditorBaseTheme = EditorView.baseTheme({
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
export const codeEditorLightTheme = EditorView.theme({
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
export const codeEditorDarkTheme = EditorView.theme({
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
export const codeEditorDarkHighlightStyle = HighlightStyle.define([
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
export const codeEditorDarkExtension: Extension = [codeEditorDarkTheme, syntaxHighlighting(codeEditorDarkHighlightStyle)];