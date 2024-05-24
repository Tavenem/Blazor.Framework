import { Compartment, EditorState, Extension, TransactionSpec } from "@codemirror/state";
import { Command, EditorView, keymap } from "@codemirror/view";
import { setBlockType, exitCode, selectAll } from "prosemirror-commands";
import { undo, redo } from "prosemirror-history";
import { ContentMatch, Fragment, Node as ProsemirrorNode } from "prosemirror-model";
import { Command as PMCommand, Selection, TextSelection } from "prosemirror-state";
import { EditorView as PMEditorView } from "prosemirror-view";
import { EditorSyntax, codeEditorLanguageMap } from "./_syntax";
import { codeEditorDarkExtension, codeEditorLightTheme } from "./_themes";
import { codeEditorPlainText, codeEditorThemeCompartment, defaultCodeExtensions } from "./_code-editing";
import { ThemePreference, getPreferredTavenemColorScheme } from "../_theme";
import { selectNextOccurrence } from "@codemirror/search";

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

export class CodeBlockView {
    dom: Node;
    _cm: EditorView;
    _languageCompartment = new Compartment;
    _syntax: EditorSyntax | null;
    _updating = false;

    constructor(
        public node: ProsemirrorNode,
        public view: PMEditorView,
        public getPos: () => number | undefined) {
        const themePreference = getPreferredTavenemColorScheme();

        this._syntax = node.attrs.syntax;
        const languageExtension = this._syntax
            ? codeEditorLanguageMap[this._syntax] || codeEditorPlainText
            : codeEditorPlainText;

        const extensions: Extension[] = this.codeMirrorKeymap()
            .concat(defaultCodeExtensions)
            .concat([
                codeEditorThemeCompartment.of(themePreference == ThemePreference.Dark
                    ? codeEditorDarkExtension
                    : codeEditorLightTheme),
                this._languageCompartment.of(languageExtension),
                EditorView.domEventHandlers({
                    'blur': (_, view) => { setTimeout(() => view.dispatch({ selection: { anchor: 0 } }), 0); },
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
            root: view.dom.getRootNode() as ShadowRoot,
            dispatchTransactions: (trs) => {
                this._cm.update(trs);
                if (!this._updating) {
                    for (const tr of trs) {
                        const textUpdate = tr.state.toJSON().doc;
                        this.valueChanged(textUpdate);
                        this.forwardSelection();
                    }
                }
            }
        });
        this.dom = document.createElement('div');
        this.dom.appendChild(this._cm.dom);
    }

    backspaceHandler() {
        const { selection } = this._cm.state;
        if (selection.main.empty && selection.main.from === 0) {
            setBlockType(this.view.state.schema.nodes.paragraph)(
                this.view.state,
                this.view.dispatch);
            setTimeout(() => this.view.focus(), 20);
            return true;
        }
        return false;
    }

    codeMirrorKeymap(): Extension[] {
        return [keymap.of([
            { key: "Mod-d", run: selectNextOccurrence, preventDefault: true },
            { key: "ArrowLeft", run: this.maybeEscape("char", -1), preventDefault: true, },
            { key: "ArrowRight", run: this.maybeEscape("char", 1), preventDefault: true, },
            { key: "ArrowUp", run: this.maybeEscape("line", -1), preventDefault: true, },
            { key: "ArrowDown", run: this.maybeEscape("line", 1), preventDefault: true, },
            {
                key: "Mod-z",
                run: () => undo(this.view.state, this.view.dispatch),
                shift: () => redo(this.view.state, this.view.dispatch),
            },
            {
                key: "Mod-y",
                run: () => redo(this.view.state, this.view.dispatch),
            },
            { key: "Backspace", run: () => this.backspaceHandler() },
            {
                key: "Mod-Backspace",
                run: () => this.backspaceHandler(),
            },
            {
                key: "Mod-a",
                run: () => {
                    const result = selectAll(this.view.state, this.view.dispatch);
                    this.view.focus();
                    return result;
                },
            },
            {
                key: "Shift-Mod-Enter",
                run: () => {
                    if (exitCodeUp(this.view.state, this.view.dispatch)) {
                        this.view.focus();
                        return true;
                    }
                    return false;
                }
            },
            {
                key: "Mod-Enter",
                run: () => {
                    if (exitCode(this.view.state, this.view.dispatch)) {
                        this.view.focus();
                        return true;
                    }
                    return false;
                }
            },
            {
                key: "Enter",
                run: (cmView) => {
                    const sel = cmView.state.selection.main;
                    if (cmView.state.doc.line(cmView.state.doc.lines).text === ""
                        && sel.from === sel.to
                        && sel.from === cmView.state.doc.length) {
                        if (cmView.state.doc.lines === 1) { // when pressing Enter on a single blank line, convert to plain <p>
                            setBlockType(this.view.state.schema.nodes.paragraph)(
                                this.view.state,
                                this.view.dispatch);
                            setTimeout(() => this.view.focus(), 20);
                            return true;
                        } else {
                            cmView.dispatch({ // delete previous line break
                                changes: {
                                    from: sel.from - 1,
                                    to: sel.to,
                                    insert: '',
                                }
                            });
                            exitCode(this.view.state, this.view.dispatch);
                            this.view.focus();
                            return true;
                        }
                    }
                    return false;
                },
            },
        ])];
    }

    destroy() { this._cm.destroy() }

    forwardSelection() {
        if (!this._cm.hasFocus) {
            return;
        }
        const offset = (typeof this.getPos === 'function' ? this.getPos() || 0 : 0) + 1;
        const anchor = this._cm.state.selection.main.from + offset;
        const head = this._cm.state.selection.main.to + offset;
        const selection = TextSelection.create(this.view.state.doc, anchor, head);
        if (!selection.eq(this.view.state.selection)) {
            this.view.dispatch(this.view.state.tr.setSelection(selection));
        }
    }

    ignoreMutation() { return true; }

    maybeEscape(unit: 'char' | 'line', dir: -1 | 1): Command {
        return (target: EditorView) => {
            const sel = target.state.selection.main;
            const line = target.state.doc.lineAt(sel.from);
            const lastLine = target.state.doc.lines;
            if (sel.to !== sel.from
                || line.number !== (dir < 0 ? 1 : lastLine)
                || (unit === "char"
                    && sel.from !== (dir < 0 ? 0 : line.to))
                || typeof this.getPos !== 'function') {
                return false;
            }
            this.view.focus();
            const pos = this.getPos() || 0;
            const node = this.view.state.doc.nodeAt(pos);
            if (!node) {
                return false;
            }
            const targetPos = pos + (dir < 0 ? 0 : node.nodeSize);
            const selection = Selection.near(this.view.state.doc.resolve(targetPos), dir);
            this.view.dispatch(this.view.state.tr.setSelection(selection).scrollIntoView());
            this.view.focus();
            return true;
        };
    }

    selectNode() { this._cm.focus() }

    setSelection(anchor: number, head: number) {
        this._cm.focus();
        this.forwardSelection();
        this._updating = true;
        this._cm.dispatch({ selection: { anchor, head } });
        this._updating = false;
    }

    stopEvent() { return true; }

    update(node: ProsemirrorNode) {
        if (node.type.name !== this.node.type.name) {
            return false;
        }
        this.node = node;

        const spec: TransactionSpec = {};
        const change = this.computeChange(this._cm.state.doc.toString(), node.textContent);
        if (change) {
            spec.changes = {
                from: change.from,
                to: change.to,
                insert: change.text,
            };
            spec.selection = {
                anchor: change.from + change.text.length,
            };
        }

        const syntax = node.attrs.syntax as EditorSyntax | null;
        let newSyntax = false;
        if (syntax !== this._syntax) {
            newSyntax = true;
            this._syntax = syntax;
            const languageExtension = syntax
                ? codeEditorLanguageMap[syntax] || codeEditorPlainText
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

    valueChanged(textUpdate: string) {
        const change = this.computeChange(this.node.textContent, textUpdate);
        if (change && typeof this.getPos === 'function') {
            const start = (this.getPos() || 0) + 1;
            this.view.dispatch(this.view.state.tr.replaceWith(
                start + change.from,
                start + change.to,
                change.text
                    ? this.view.state.schema.text(change.text)
                    : Fragment.empty));
        }
    }

    private computeChange(oldVal: string, newVal: string) {
        if (oldVal === newVal) {
            return null;
        }
        let start = 0, oldEnd = oldVal.length, newEnd = newVal.length;
        while (start < oldEnd
            && oldVal.charCodeAt(start) === newVal.charCodeAt(start)) {
            ++start;
        }
        while (oldEnd > start
            && newEnd > start
            && oldVal.charCodeAt(oldEnd - 1) === newVal.charCodeAt(newEnd - 1)) {
            oldEnd--;
            newEnd--;
        }
        return {
            from: start,
            to: oldEnd,
            text: newVal.slice(start, newEnd),
        };
    }
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