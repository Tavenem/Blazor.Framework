import { DOMParser as PMDOMParser } from 'prosemirror-model';
import { EditorView, ViewUpdate, placeholder } from "@codemirror/view";
import { Compartment, EditorState, Extension, TransactionSpec } from "@codemirror/state";
import { redo, undo } from "@codemirror/commands";
import { ThemePreference, getPreferredTavenemColorScheme } from "../../_theme";
import { codeEditorPlainText, codeEditorThemeCompartment, defaultCodeExtensions } from "./_code-editing";
import { Editor, EditorInfo, EditorMode, EditorOptions, UpdateInfo } from "./_editor-info";
import { codeEditorDarkExtension, codeEditorLightTheme } from "./_themes";
import { CommandType, ParamStateCommand } from "./commands/_commands";
import { htmlCommands } from "./commands/_html";
import { markdownCommands, tavenemMarkdownParser, tavenemMarkdownSerializer } from "./commands/_markdown";
import { EditorSyntax, codeEditorLanguageMap } from "./_syntax";
import { ToolbarControl } from "./_toolbar";
import { renderer, schema } from "./schema/_schema";

interface CodeEditorInfo extends EditorInfo {
    view: EditorView;
    language: Compartment;
    readOnly: Compartment;
}

export class TavenemCodeEditor implements Editor {
    private _editor?: CodeEditorInfo;
    private _syntax?: EditorSyntax;

    get isWYSIWYG() { return false; }

    activateCommand(type: CommandType, ...params: any[]) {
        if (!this._editor) {
            return;
        }
        let command: ParamStateCommand | undefined;
        if (this._syntax === 'html') {
            command = htmlCommands[type];
        } else if (this._syntax === 'markdown') {
            command = markdownCommands[type];
        } else if (type === CommandType.Undo) {
            command = _ => undo;
        } else if (type === CommandType.Redo) {
            command = _ => redo;
        }
        if (command) {
            command(params)({
                state: this._editor.view.state,
                dispatch: this._editor.view.dispatch
            });
            this._editor.view.focus();
        }
    }

    activateToolbarCommand(control: ToolbarControl) {
        if (control._definition.type) {
            this.activateCommand(control._definition.type, control._definition.params);
        }
    }

    disable(value: boolean) {
        if (this._editor) {
            this._editor.view.dispatch({
                effects: this._editor.readOnly.reconfigure(EditorState.readOnly.of(value)),
            });
        }
    }

    dispose() {
        if (this._editor) {
            this._editor.view.destroy();
        }
        delete this._editor;
    }

    focus() {
        if (this._editor) {
            this._editor.view.focus();
        }
    }

    getContent() {
        if (this._editor) {
            return this._editor.view.state.doc.toString();
        }
    }

    getSelectedText() {
        if (this._editor) {
            const position = this._editor.view.state.selection.main.from;
            return {
                position,
                rawTextFrom: position,
                rawTextTo: this._editor.view.state.selection.main.to,
                text: this._editor.view.state.sliceDoc(
                    this._editor.view.state.selection.ranges.map(v => v.from).reduce((p, v) => (p < v ? p : v)),
                    this._editor.view.state.selection.ranges.map(v => v.to).reduce((p, v) => (p > v ? p : v))),
            };
        } else {
            return { position: -1, rawTextFrom: -1, rawTextTo: -1, text: null };
        }
    }

    initializeEditor(
        root: Element,
        element: HTMLElement,
        onChange: (value?: string | null) => void,
        onInput: (value?: string | null) => void,
        update: (data: UpdateInfo) => void,
        options?: EditorOptions) {
        if (this._editor) {
            this._editor.view.destroy();
            delete this._editor;
        }

        this._syntax = options?.syntax || 'none';
        const languageExtension = this._syntax
            ? codeEditorLanguageMap[this._syntax] || codeEditorPlainText
            : codeEditorPlainText;
        const languageCompartment = new Compartment;

        const readOnlyCompartment = new Compartment;

        const themePreference = getPreferredTavenemColorScheme();

        const extensions: Extension[] = defaultCodeExtensions.concat([
            codeEditorThemeCompartment.of(themePreference == ThemePreference.Dark
                ? codeEditorDarkExtension
                : codeEditorLightTheme),
            languageCompartment.of(languageExtension),
            readOnlyCompartment.of(EditorState.readOnly.of(options?.readOnly || false)),
            EditorView.updateListener.of(this.onUpdate.bind(this)),
            EditorView.domEventHandlers({ 'blur': this.onBlur.bind(this) }),
            EditorView.lineWrapping,
        ]);
        if (options?.placeholder
            && options.placeholder.length) {
            extensions.push(placeholder(options.placeholder));
        }

        const view = new EditorView({
            state: EditorState.create({
                doc: options?.initialValue,
                extensions: extensions,
            }),
            parent: element,
            root: root.shadowRoot || undefined,
        });

        this._editor = {
            view,
            language: languageCompartment,
            onChange,
            onInput,
            options,
            readOnly: readOnlyCompartment,
            update,
        };

        this.onInput();

        if (options?.autoFocus) {
            view.focus();
        }
    }

    setSyntax(syntax: EditorSyntax) {
        if (!this._editor) {
            return;
        }

        const spec: TransactionSpec = {
            effects: this._editor.language.reconfigure(
                codeEditorLanguageMap[syntax]
                || codeEditorPlainText),
        };

        if (this._editor.options) {
            if (this._editor.options.syntax !== syntax) {
                if ((this._editor.options.syntax === 'html'
                    && syntax === 'markdown')
                    || (this._editor.options.syntax === 'markdown'
                        && syntax === 'html')) {
                    let text;
                    const div = document.createElement('div');
                    if (this._editor.options.syntax === 'html'
                        && syntax === 'markdown') {
                        div.innerHTML = this._editor.view.state.doc.toString();
                        const node = PMDOMParser
                            .fromSchema(schema)
                            .parse(div);
                        text = tavenemMarkdownSerializer.serialize(node);
                    } else {
                        const node = tavenemMarkdownParser.parse(this._editor.view.state.doc.toString());
                        div.appendChild(renderer.serializeFragment(node.content));
                        text = div.innerHTML;
                    }

                    spec.changes = {
                        from: 0,
                        to: this._editor.view.state.doc.length,
                        insert: text,
                    };
                }

                this._editor.options.syntax = syntax;
            }
        } else {
            this._editor.options = {
                autoFocus: false,
                mode: EditorMode.Text,
                readOnly: false,
                syntax: syntax,
                updateOnInput: false,
            };
        }

        this._editor.view.dispatch(spec);
    }

    setTheme(theme: string) {
        const effect = codeEditorThemeCompartment.reconfigure(theme === 'dark'
            ? codeEditorDarkExtension
            : codeEditorLightTheme);
        if (this._editor) {
            this._editor.view.dispatch({ effects: effect });
        }
    }

    setValue(value?: string | null) {
        if (this._editor) {
            this._editor.view.dispatch({
                changes: {
                    from: 0,
                    to: this._editor.view.state.doc.length,
                    insert: value || '',
                }
            });
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

        this._editor.onChange(this._editor.view.state.doc.toString());
    }

    private onBlur(_event: FocusEvent, _view: EditorView) {
        if (this._editor) {
            this._editor.onChange(this._editor.view.state.doc.toString());
        }
    }

    private onInput() {
        if (!this._editor) {
            return;
        }
        const line = this._editor.view.state.doc.lineAt(this._editor.view.state.selection.main.head);
        const updateInfo: UpdateInfo = {
            commands: {},
            currentStatus: `line ${line.number} column ${this._editor.view.state.selection.main.head - line.from}`,
        };
        updateInfo.commands![CommandType.Undo] = {
            active: false,
            enabled: undo({
                state: this._editor.view.state,
                dispatch: _ => { },
            }),
        };
        updateInfo.commands![CommandType.Redo] = {
            active: false,
            enabled: redo({
                state: this._editor.view.state,
                dispatch: _ => { },
            }),
        };
        this._editor.update(updateInfo);

        if (this._editor.options?.updateOnInput) {
            this._editor.onInput(this._editor.view.state.doc.toString());
        }
    }

    private onUpdate(update: ViewUpdate) {
        if (!update.docChanged
            || !this._editor) {
            return
        }

        if (this._editor.debounce) {
            clearTimeout(this._editor.debounce);
        }

        this._editor.debounce = setTimeout(this.onInput.bind(this), 500);
    }
}