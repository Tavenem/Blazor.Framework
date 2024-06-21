import { html_beautify } from "js-beautify";
import { Decoration, DecorationSet, EditorView } from "prosemirror-view";
import { keymap } from "prosemirror-keymap";
import { DOMParser as PMDOMParser, Node } from 'prosemirror-model';
import { Command, EditorState, Plugin, Selection, Transaction } from "prosemirror-state";
import { inputRules } from "prosemirror-inputrules";
import { buildInputRules, buildKeymap } from "prosemirror-example-setup";
import { baseKeymap, chainCommands, deleteSelection, joinBackward, selectNodeBackward } from "prosemirror-commands";
import { dropCursor } from "prosemirror-dropcursor";
import { gapCursor } from "prosemirror-gapcursor";
import { history } from "prosemirror-history";
import {
    insertMathCmd,
    makeBlockMathInputRule,
    makeInlineMathInputRule,
    mathBackspaceCmd,
    mathPlugin,
    mathSerializer,
    REGEX_BLOCK_MATH_DOLLARS,
    REGEX_INLINE_MATH_DOLLARS,
} from "@benrbray/prosemirror-math";
import { CodeBlockView } from "./_code-block-view";
import { CommandSet, CommandType, commonCommands, exitBlock, exitDiv } from "./_commands";
import { Editor, EditorInfo, EditorMode, EditorOptions, UpdateInfo } from "./_editor-info";
import { tavenemMarkdownParser, tavenemMarkdownSerializer } from "./_markdown";
import { renderer, schema } from "./_schema";
import {
    cellMinWidth,
    columnResizing,
    fixTables,
    goToNextCell,
    tableEditing,
    TableView,
} from "./_tables";
import { ToolbarControl } from "./_toolbar";
import {
    FormView,
    ForbiddenView,
    CheckboxView,
    DetailsView,
    DisabledInputView,
    HeadView,
    InputView,
    RadioView,
    ResetInputView,
    SelectView,
    TextAreaView,
} from "./_views";
import { EditorSyntax } from "./_syntax";

class MenuView {
    _commands: CommandSet;
    _editorView: EditorView;
    _update: (data: UpdateInfo) => void;

    constructor(
        commands: CommandSet,
        editorView: EditorView,
        update: (data: UpdateInfo) => void) {
        this._commands = commands;
        this._editorView = editorView;
        this._update = update;
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
        this._update(updateInfo);
    }

    private nodeName(node: Node) {
        let name = node.type.name.replace('_', ' ');
        if (node.type == this._editorView.state.schema.nodes.heading) {
            name += ' ' + node.attrs.level;
        }
        return name;
    }
}

const arrowHandlers = keymap({
    ArrowLeft: arrowHandler("left"),
    ArrowRight: arrowHandler("right"),
    ArrowUp: arrowHandler("up"),
    ArrowDown: arrowHandler("down"),
});

const detailsBackspaceCommand: Command = (state, dispatch) => {
    const { $from, $to } = state.selection;
    let details = $from.parent;
    let depth = $from.depth;
    let summary: Node | undefined;
    while (details
        && depth > 0
        && details.type.name !== "details") {
        if (details.type.name === "summary"
            || details.type.name === "summary_text") {
            summary = details;
        }
        details = $from.node(--depth);
    }
    if (!details) {
        return false;
    }

    // verify start and end of selection are within the same details
    let toDetails = $to.parent;
    depth = $to.depth;
    while (toDetails
        && depth > 0
        && toDetails.type.name !== "details") {
        toDetails = $to.node(--depth);
    }
    if (!toDetails || !details.eq(toDetails)) {
        return false;
    }

    // if details is empty, remove it
    if (isEmpty(details)) {
        if (dispatch) {
            dispatch(state.tr
                .deleteRange($from.start(depth), $from.end(depth))
                .scrollIntoView());
        }
        return true;
    }

    // if selection is within an empty summary, and the details is closed, open it
    if (dispatch
        && summary
        && summary.childCount === 0
        && (!summary.text || !summary.text.length)
        && !details.attrs.open) {
        dispatch(state.tr.setNodeMarkup(
            $from.start(depth) - 1,
            undefined,
            {
                ...details.attrs,
                open: true,
            }).scrollIntoView());
        return true;
    }

    return false;
};

interface WysiwygEditorInfo extends EditorInfo {
    commands: CommandSet;
    isMarkdown: boolean;
    view: EditorView;
}

export class TavenemWysiwygEditor implements Editor {
    private _editor?: WysiwygEditorInfo;

    get isWYSIWYG() { return true; }

    activateCommand(type: CommandType, ...params: any[]) {
        if (!this._editor) {
            return;
        }
        const command = this._editor.commands[type];
        if (command) {
            command.command(
                this._editor.view.state,
                this._editor.view.dispatch,
                this._editor.view,
                params);
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
            this._editor.view.setProps({ editable: () => !value });
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

    getSelectedText() {
        if (this._editor) {
            const { from, to } = this._editor.view.state.selection;
            return this._editor.view.state.doc.textBetween(from, to, " ");
        }
    }

    initializeEditor(
        _root: Element,
        element: HTMLElement,
        onChange: (value?: string | null) => void,
        onInput: (value?: string | null) => void,
        update: (data: UpdateInfo) => void,
        options?: EditorOptions) {
        if (this._editor) {
            this._editor.view.destroy();
            delete this._editor;
        }

        const isMarkdown = options?.syntax === 'markdown';

        let doc: Node;
        if (isMarkdown) {
            doc = tavenemMarkdownParser.parse(options.initialValue || '');
        } else {
            const div = document.createElement('div');
            if (options?.initialValue) {
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
                return new MenuView(commands, editorView, update);
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
            tableEditing,
            arrowHandlers,
            inputRules({ rules: [inlineMathInputRule, blockMathInputRule] }),
            buildInputRules(schema),
            keymap({
                "Mod-Space": insertMathCmd(schema.nodes.math_inline),
                "Backspace": chainCommands(detailsBackspaceCommand, deleteSelection, mathBackspaceCmd, joinBackward, selectNodeBackward),
                "Tab": goToNextCell(1),
                "Shift-Tab": goToNextCell(-1),
                "Ctrl-Enter": exitDiv,
            }),
            keymap(buildKeymap(schema)),
            keymap(baseKeymap),
            keymap({
                "Enter": exitBlock, // last resort for cases when a new <p> or block split are both invalid, to exit the current block
            }),
            dropCursor(),
            gapCursor(),
            history(),
            columnResizing,
        ];
        if (options?.placeholder) {
            plugins.push(placeholder(options.placeholder));
        }

        let state = EditorState.create({ doc, plugins });
        const fixed = fixTables(state);
        if (fixed) {
            state = state.apply(fixed.setMeta("addToHistory", false));
        }

        const view = new EditorView(element, {
            state: state,
            plugins: menu ? [menu] : undefined,
            clipboardTextSerializer: slice => { return mathSerializer.serializeSlice(slice) },
            editable: () => !(options?.readOnly || false),
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
            dispatchTransaction: this.onUpdate.bind(this),
            handleDOMEvents: { 'blur': this.onBlur.bind(this) }
        });
        this._editor = {
            commands: commands,
            isMarkdown,
            view,
            onChange,
            onInput,
            options,
            update,
        };
    }

    setSyntax(syntax: EditorSyntax) {
        if (!this._editor) {
            return;
        }

        this._editor.isMarkdown = syntax === 'markdown';

        if (this._editor.options) {
            this._editor.options.syntax = syntax;
        }
    }

    setValue(value?: string | null) {
        if (!this._editor) {
            return;
        }
        if (value) {
            let content;
            if (this._editor.isMarkdown) {
                content = tavenemMarkdownParser.parse(value);
            } else {
                const div = document.createElement('div');
                div.innerHTML = value;
                content = PMDOMParser
                    .fromSchema(this._editor.view.state.schema)
                    .parse(div);
            }
            this._editor.view.updateState(
                this._editor.view.state.apply(
                    this._editor.view.state.tr.replaceRangeWith(
                        0,
                        this._editor.view.state.doc.content.size,
                        content)));
        } else {
            this._editor.view.updateState(
                this._editor.view.state.apply(
                    this._editor.view.state.tr.delete(
                        0,
                        this._editor.view.state.doc.content.size)));
        }
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

        this._editor.onChange(this.getContent());
    }

    private onBlur(_view: EditorView, _event: FocusEvent) {
        if (!this._editor) {
            return;
        }
        this._editor.onChange(this.getContent());
        return true;
    }

    private onInput() {
        if (this._editor) {
            this._editor.onInput(this.getContent());
        }
    }

    private onUpdate(tr: Transaction) {
        if (!this._editor) {
            return;
        }

        this._editor.view.updateState(this._editor.view.state.apply(tr));

        if (!tr.docChanged) {
            return;
        }

        if (!(this._editor.options?.updateOnInput || false)) {
            return;
        }

        if (this._editor.debounce) {
            clearTimeout(this._editor.debounce);
        }

        this._editor.debounce = setTimeout(this.onInput.bind(this), 500);
    }
}

function arrowHandler(dir: 'up' | 'down' | 'left' | 'right' | 'forward' | 'backward') {
    return (state: EditorState, dispatch?: (tr: Transaction) => void, view?: EditorView) => {
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

function isEmpty(node: Node) {
    if (node.text && node.text.length) {
        return false;
    }
    for (let i = 0; i < node.childCount; i++) {
        if (!isEmpty(node.child(i))) {
            return false;
        }
    }
    return true;
}