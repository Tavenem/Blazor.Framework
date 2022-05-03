import { basicSetup } from '@codemirror/basic-setup';
import { LanguageSupport } from '@codemirror/language';
import { EditorState, Compartment, Extension } from '@codemirror/state';
import { EditorView, placeholder } from '@codemirror/view';
import { StreamLanguage } from '@codemirror/stream-parser';
import { oneDark } from '@codemirror/theme-one-dark';
import Editor, { EditorOptions } from '@toast-ui/editor';
import { Base } from '@toast-ui/editor/types/editor';
import Prism from 'prismjs';
import codeSyntaxHighlight from '@toast-ui/editor-plugin-code-syntax-highlight';
import colorSyntax from '@toast-ui/editor-plugin-color-syntax';

import { cpp } from "@codemirror/lang-cpp";
import { csharp, objectiveC } from "@codemirror/legacy-modes/mode/clike";
import { css } from "@codemirror/lang-css";
import { html } from "@codemirror/lang-html";
import { java } from "@codemirror/lang-java";
import { javascript } from "@codemirror/lang-javascript"
import { json } from "@codemirror/lang-json";
import { less, sCSS } from "@codemirror/legacy-modes/mode/css";
import { php } from "@codemirror/lang-php";
import { python } from "@codemirror/lang-python";
import { sql } from "@codemirror/lang-sql";
import { stex } from "@codemirror/legacy-modes/mode/stex";
import { typescript } from "@codemirror/legacy-modes/mode/javascript";

import 'prismjs/components/prism-cpp.min.js';
import 'prismjs/components/prism-csharp.min.js';
import 'prismjs/components/prism-css.min.js';
import 'prismjs/components/prism-java.min.js';
import 'prismjs/components/prism-javascript.min.js';
import 'prismjs/components/prism-json.min.js';
import 'prismjs/components/prism-latex.min.js';
import 'prismjs/components/prism-less.min.js';
import 'prismjs/components/prism-markup.min.js';
import 'prismjs/components/prism-objectivec.min.js';
import 'prismjs/components/prism-php.min.js';
import 'prismjs/components/prism-python.min.js';
import 'prismjs/components/prism-scss.min.js';
import 'prismjs/components/prism-sql.min.js';
import 'prismjs/components/prism-typescript.min.js';

interface CodeEditorOptions {
    autoFocus?: boolean;
    placeholder?: string;
    readOnly?: boolean;
    updateOnInput?: boolean;
}

enum EditorMode {
    None = 0,
    Text = 1,
    WYSIWYG = 2,
}

enum PreviewStyle {
    None = 0,
    Split = 1,
    Tabs = 2,
}

interface MarkdownEditorOptions {
    autoFocus?: boolean;
    editMode?: EditorMode;
    lockEditMode?: boolean;
    placeholder?: string;
    previewStyle?: PreviewStyle;
    readOnly?: boolean;
    updateOnInput?: boolean;
}

interface CustomButton {
    id: string;
    name: string;
    tooltip?: string;
}

interface CustomEditorButtonHTMLElement extends HTMLButtonElement {
    editorId?: string;
}

class TavenemCodeEditor {
    _defaultTheme = EditorView.theme({
        "&": { height: "40rem" },
        ".cm-scroller": { overflow: 'auto' },
    });
    _editorInstances: Record<string, EditorView> = {};
    _editorReferences: Record<string, DotNet.DotNetObject> = {};
    _inputDebounce: Record<string, number> = {};
    _language = new Compartment;
    _languageMap: Record<string, LanguageSupport | StreamLanguage<unknown>> = {
        "cpp": cpp(),
        "css": css(),
        "html": html(),
        "java": java(),
        "javascript": javascript(),
        "json": json(),
        "php": php(),
        "python": python(),
        "sql": sql(),
        "csharp": StreamLanguage.define(csharp as any),
        "objectiveC": StreamLanguage.define(objectiveC as any),
        "less": StreamLanguage.define(less as any),
        "sCSS": StreamLanguage.define(sCSS as any),
        "stex": StreamLanguage.define(stex as any),
        "typescript": StreamLanguage.define(typescript as any),
    }
    _readOnly = new Compartment;
    _theme = new Compartment;

    dispose(elementId: string) {
        const editor = this._editorInstances[elementId];
        if (editor) {
            editor.destroy();
        }
        delete this._editorInstances[elementId];
        delete this._editorReferences[elementId];
    }

    initializeEditor(
        elementId: string,
        dotNetRef: DotNet.DotNetObject,
        language: string,
        options?: CodeEditorOptions) {
        const element = document.getElementById(elementId);
        if (!(element instanceof HTMLDivElement)) {
            return;
        }

        const existing = this._editorInstances[elementId];
        if (existing) {
            existing.destroy();
            delete this._editorInstances[elementId];
            delete this._editorReferences[elementId];
        }

        options = options || {};

        const extensions: Extension[] = [
            basicSetup,
            this._language.of(this._languageMap[language] || javascript),
            this._theme.of(this._defaultTheme),
            this._readOnly.of(EditorState.readOnly.of(options.readOnly || false)),
            EditorView.updateListener.of(update => {
                if (!(options?.updateOnInput) || !update.docChanged) {
                    return;
                }

                const debounce = tavenemCodeEditor._inputDebounce[elementId];
                if (debounce) {
                    clearTimeout(debounce);
                }

                tavenemCodeEditor._inputDebounce[elementId] = setTimeout(
                    tavenemCodeEditor.onInput.bind(tavenemMarkdownEditor, elementId),
                    200);
            }),
            EditorView.domEventHandlers({
                'blur': function (e, view) {
                    dotNetRef.invokeMethodAsync("OnChangeInvoked", view.state.doc.toString());
                }
            }),
        ];
        if (options.placeholder
            && options.placeholder.length) {
            extensions.push(placeholder(options.placeholder));
        }

        const editor = new EditorView({
            state: EditorState.create({
                extensions: extensions,
            }),
            parent: element,
        });
        this._editorInstances[elementId] = editor;
        this._editorReferences[elementId] = dotNetRef;

        if (options.autoFocus) {
            editor.focus();
        }
    }

    private onInput(elementId: string) {
        const editor = this._editorInstances[elementId];
        const ref = this._editorReferences[elementId];
        if (editor && ref) {
            ref.invokeMethodAsync("OnChangeInvoked", editor.state.doc.toString());
        }
    }
}
const tavenemCodeEditor = new TavenemCodeEditor();

class TavenemMarkdownEditor {
    _editorInstances: Record<string, Editor> = {};
    _editorReferences: Record<string, DotNet.DotNetObject> = {};
    _inputDebounce: Record<string, number> = {};

    dispose(elementId: string) {
        const editor = this._editorInstances[elementId];
        if (editor) {
            editor.destroy();
        }
        delete this._editorInstances[elementId];
        delete this._editorReferences[elementId];
    }

    initializeEditor(
        elementId: string,
        dotNetRef: DotNet.DotNetObject,
        options?: MarkdownEditorOptions,
        customButtons?: CustomButton[]) {
        const element = document.getElementById(elementId);
        if (!(element instanceof HTMLDivElement)) {
            return;
        }

        const existing = this._editorInstances[elementId];
        if (existing) {
            existing.destroy();
            delete this._editorInstances[elementId];
            delete this._editorReferences[elementId];
        }

        options = options || {};

        const editorOptions: EditorOptions = {
            el: element,
            autofocus: options.autoFocus || false,
            extendedAutolinks: true,
            height: '100%',
            hideModeSwitch: options.lockEditMode || false,
            initialEditType: options.editMode == EditorMode.WYSIWYG ? 'wysiwyg' : 'markdown',
            placeholder: options.placeholder || '',
            previewStyle: options.previewStyle == PreviewStyle.Tabs ? 'tab' : 'vertical',
            usageStatistics: false,
            plugins: [
                [codeSyntaxHighlight, { highlighter: Prism }],
                [colorSyntax, null]
            ],
            events: {
                blur: function () {
                    const editor = tavenemMarkdownEditor._editorInstances[elementId];
                    const ref = tavenemMarkdownEditor._editorReferences[elementId];
                    if (editor && ref) {
                        const markdown = editor.getMarkdown();
                        ref.invokeMethodAsync("OnChangeInvoked", markdown);
                    }
                },
                change: function () {
                    if (!(options?.updateOnInput)) {
                        return;
                    }

                    const debounce = tavenemMarkdownEditor._inputDebounce[elementId];
                    if (debounce) {
                        clearTimeout(debounce);
                    }

                    tavenemMarkdownEditor._inputDebounce[elementId] = setTimeout(
                        tavenemMarkdownEditor.onInput.bind(tavenemMarkdownEditor, elementId),
                        200);
                }
            },
        }

        if (customButtons && customButtons.length) {
            let buttons = [];
            for (let i = 0; i < customButtons.length; i++) {
                const el = document.createElement('button') as CustomEditorButtonHTMLElement;
                el.id = customButtons[i].id;
                el.editorId = elementId;
                el.className = 'toastui-editor-toolbar-icons';
                el.type = 'button';
                el.style.backgroundImage = 'none';
                el.style.color = 'inherit';
                el.style.margin = '0';
                el.style.paddingLeft = '.5rem';
                el.style.paddingRight = '.5rem';
                el.style.width = 'auto';
                el.textContent = customButtons[i].name;
                el.addEventListener('click', function (e) {
                    const btn = e.target as CustomEditorButtonHTMLElement;
                    if (!btn
                        || !btn.editorId
                        || !tavenemMarkdownEditor._editorInstances
                        || !tavenemMarkdownEditor._editorReferences) {
                        return;
                    }
                    const editor = tavenemMarkdownEditor._editorInstances[btn.editorId];
                    const ref = tavenemMarkdownEditor._editorReferences[btn.editorId];
                    if (editor && ref) {
                        const text = editor.getSelectedText();
                        ref.invokeMethodAsync("InvokeCustomButton", btn.id, text);
                    }
                });
                buttons.push({
                    name: customButtons[i].name,
                    tooltip: customButtons[i].tooltip,
                    el: el,
                });
            }
            editorOptions.toolbarItems = [
                ['heading', 'bold', 'italic', 'strike'],
                ['hr', 'quote'],
                ['ul', 'ol', 'task', 'indent', 'outdent'],
                ['table', 'image', 'link'],
                ['code', 'codeblock'],
                buttons,
                ['scrollSync'],
            ];
        }

        const editor = new Editor(editorOptions);
        this._editorInstances[elementId] = editor;
        this._editorReferences[elementId] = dotNetRef;
        if (options.readOnly) {
            this.setReadOnly(editor, options.readOnly);
        }
    }

    setReadOnly(editor: Editor | undefined, value: boolean) {
        if (editor) {
            const core: Base = (editor as any).getCurrentModeEditor();
            core.view.setProps({ editable: () => !value });
        }
    }

    updateSelectedText(elementId: string, value?: string) {
        const editor = this._editorInstances[elementId];
        if (!editor) {
            return;
        }
        editor.replaceSelection(value || '');

        const ref = this._editorReferences[elementId];
        if (ref) {
            const markdown = editor.getMarkdown();
            ref.invokeMethodAsync("OnChangeInvoked", markdown);
        }
    }

    private onInput(elementId: string) {
        const editor = this._editorInstances[elementId];
        const ref = this._editorReferences[elementId];
        if (editor && ref) {
            ref.invokeMethodAsync("OnChangeInvoked", editor.getMarkdown());
        }
    }
}
const tavenemMarkdownEditor = new TavenemMarkdownEditor();

export function disposeCodeEditor(elementId: string) {
    tavenemCodeEditor.dispose(elementId);
}

export function disposeMarkdownEditor(elementId: string) {
    tavenemMarkdownEditor.dispose(elementId);
}

export function focusCodeEditor(elementId: string) {
    const editor = tavenemCodeEditor._editorInstances[elementId];
    if (editor) {
        editor.focus();
    }
}

export function focusMarkdownEditor(elementId: string) {
    const editor = tavenemMarkdownEditor._editorInstances[elementId];
    if (editor) {
        editor.focus();
    }
}

export function initializeCodeEditor(
    elementId: string,
    dotNetRef: DotNet.DotNetObject,
    language: string,
    options?: CodeEditorOptions) {
    tavenemCodeEditor.initializeEditor(
        elementId,
        dotNetRef,
        language,
        options);
}

export function initializeMarkdownEditor(
    elementId: string,
    dotNetRef: DotNet.DotNetObject,
    options?: MarkdownEditorOptions,
    customButtons?: CustomButton[]) {
    tavenemMarkdownEditor.initializeEditor(
        elementId,
        dotNetRef,
        options,
        customButtons);
}

export function setCodeEditorLanguage(elementId: string, value: string) {
    const editor = tavenemCodeEditor._editorInstances[elementId];
    if (!editor) {
        return;
    }

    const language = tavenemCodeEditor._languageMap[value];
    if (!language) {
        return;
    }

    editor.dispatch({
        effects: tavenemCodeEditor._language.reconfigure(language),
    });
}

export function setCodeEditorReadOnly(elementId: string, value: boolean) {
    const editor = tavenemCodeEditor._editorInstances[elementId];
    if (editor) {
        editor.dispatch({
            effects: tavenemCodeEditor._readOnly.reconfigure(EditorState.readOnly.of(value)),
        });
    }
}

export function setCodeEditorTheme(elementId: string, value: number) {
    const editor = tavenemCodeEditor._editorInstances[elementId];
    if (editor) {
        editor.dispatch({
            effects: tavenemCodeEditor._theme.reconfigure(value == 2
                ? oneDark
                : tavenemCodeEditor._defaultTheme),
        });
    }
}

export function setCodeEditorValue(elementId: string, value?: string) {
    const editor = tavenemCodeEditor._editorInstances[elementId];
    if (editor) {
        editor.state.update({
            changes: {
                from: 0,
                to: editor.state.doc.length,
                insert: value || '',
            }
        });
    }
}

export function setMarkdownEditorMode(elementId: string, value: EditorMode) {
    const editor = tavenemMarkdownEditor._editorInstances[elementId];
    if (editor) {
        editor.changeMode(value == EditorMode.WYSIWYG ? 'wysiwyg' : 'markdown');
    }
}

export function setMarkdownPreviewStyle(elementId: string, value: PreviewStyle) {
    const editor = tavenemMarkdownEditor._editorInstances[elementId];
    if (editor) {
        editor.changePreviewStyle(value == PreviewStyle.Tabs ? 'tab' : 'vertical');
    }
}

export function setMarkdownReadOnly(elementId: string, value: boolean) {
    const editor = tavenemMarkdownEditor._editorInstances[elementId];
    tavenemMarkdownEditor.setReadOnly(editor, value);
}

export function setMarkdownValue(elementId: string, value?: string) {
    const editor = tavenemMarkdownEditor._editorInstances[elementId];
    if (editor) {
        editor.setMarkdown(value || '');
    }
}

export function updateMarkdownEditorSelectedText(elementId: string, value?: string) {
    tavenemMarkdownEditor.updateSelectedText(elementId, value);
}