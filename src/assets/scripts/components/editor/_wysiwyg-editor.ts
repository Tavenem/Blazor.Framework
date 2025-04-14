import { html_beautify } from "js-beautify";
import { Decoration, DecorationSet, EditorView } from "prosemirror-view";
import { keymap } from "prosemirror-keymap";
import { DOMParser as PMDOMParser, Node, Fragment, Slice } from 'prosemirror-model';
import { EditorState, Plugin, Selection, TextSelection, Transaction } from "prosemirror-state";
import { InputRule, inputRules } from "prosemirror-inputrules";
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
    REGEX_INLINE_MATH_DOLLARS_ESCAPED,
} from "@benrbray/prosemirror-math";
import { CodeBlockView } from "./views/_code-block-view";
import {
    CommandSet,
    CommandType,
    commonCommands,
    detailsBackspaceCommand,
    exitBlock,
    exitDiv,
    handlebarsBackspaceCmd,
    phrasingWrapperBackspaceCommand,
} from "./commands/_commands";
import { Editor, EditorInfo, EditorOptions, UpdateInfo } from "./_editor-info";
import { tavenemMarkdownParser, tavenemMarkdownSerializer } from "./commands/_markdown";
import { renderer, schema } from "./schema/_schema";
import {
    cellMinWidth,
    columnResizing,
    fixTables,
    goToNextCell,
    tableEditing,
    TableView,
} from "./views/_tables";
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
} from "./views/_views";
import { EditorSyntax } from "./_syntax";
import { tavenemComponentPlugin } from "./views/_component-plugin";
import { preprocessHandlebars } from "./schema/_handlebars-preprocessor";

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
            currentStatus: null,
        };

        const head = this._editorView.state.selection.$head;
        const depth = head.sharedDepth(this._editorView.state.selection.anchor);
        if (depth == 0) {
            updateInfo.currentStatus = 'document';
        } else {
            let path = '';
            for (let i = 1; i <= depth; i++) {
                const node = head.node(i);
                if (node.type.name === 'phrasing_wrapper') {
                    continue;
                }
                if (path.length) {
                    path += ' > ';
                }
                path += this.nodeName(node);
            }
            if (path.length == 0) {
                path = this._editorView.state.selection.$head.parent.type.name === 'phrasing_wrapper'
                    ? 'document'
                    : this.nodeName(this._editorView.state.selection.$head.parent);
            }
            updateInfo.currentStatus = path;
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

const handlebarsInputRule = new InputRule(/(?<!\\){{(.+)(?<!\\)}}$/, (state, match, start, end) => {
    let $start = state.doc.resolve(start);
    let index = $start.index();
    let $end = state.doc.resolve(end);
    if (!$start.parent.canReplaceWith(index, $end.index(), schema.nodes.handlebars)) {
        return null;
    }
    return state.tr.replaceRangeWith(
        start, end,
        schema.nodes.handlebars.create(null, schema.text(match[1]))
    );
});

const handlebarsPlugin = inputRules({ rules: [handlebarsInputRule] });

const MARKER = '█';

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
            preserve_newlines: true,
            wrap_attributes: 'preserve',
            wrap_line_length: 0,
        });
    }

    getSelectedText() {
        if (this._editor) {
            const { from, to } = this._editor.view.state.selection;
            const rawTextPosition = this.projectToMarkdown(this._editor.view.state.doc, from, to);
            return {
                position: from,
                rawTextFrom: rawTextPosition.from,
                rawTextTo: rawTextPosition.to,
                text: this._editor.view.state.doc.textBetween(from, to, " "),
            };
        } else {
            return { position: -1, rawTextFrom: -1, rawTextTo: -1, text: null };
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
                .parse(options?.syntax === 'handlebars'
                    ? preprocessHandlebars(div)
                    : div);
        }

        const inlineMathInputRule = makeInlineMathInputRule(REGEX_INLINE_MATH_DOLLARS_ESCAPED, schema.nodes.math_inline);
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
            tavenemComponentPlugin,
            mathPlugin,
            tableEditing,
            arrowHandlers,
            inputRules({ rules: [inlineMathInputRule, blockMathInputRule] }),
            buildInputRules(schema),
            keymap({
                "Mod-Space": insertMathCmd(schema.nodes.math_inline),
                "Backspace": chainCommands(
                    phrasingWrapperBackspaceCommand,
                    detailsBackspaceCommand,
                    deleteSelection,
                    handlebarsBackspaceCmd,
                    mathBackspaceCmd,
                    joinBackward,
                    selectNodeBackward),
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
        if (options?.syntax === 'handlebars') {
            plugins.unshift(handlebarsPlugin);
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
                tfeditor: (node, view, getPos, _) => new ForbiddenView(node, view, getPos),
            },
            dispatchTransaction: this.onUpdate.bind(this),
            handleDOMEvents: { 'blur': this.onBlur.bind(this) },
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

        const oldSyntax = this._editor.options?.syntax;

        this._editor.isMarkdown = syntax === 'markdown';

        if (this._editor.options) {
            this._editor.options.syntax = syntax;
        }

        if (syntax === 'handlebars') {
            const plugins = Array.from(this._editor.view.state.plugins);
            plugins.unshift(handlebarsPlugin);
            this._editor.view.updateState(this._editor.view.state.reconfigure({ plugins }));
        } else if (oldSyntax === 'handlebars') {
            const plugins = Array.from(this._editor.view.state.plugins);
            const index = plugins.indexOf(handlebarsPlugin);
            if (index !== -1) {
                plugins.splice(index, 1);
            }
            this._editor.view.updateState(this._editor.view.state.reconfigure({ plugins }));
        }
    }

    setValue(value?: string | null) {
        if (!this._editor) {
            return;
        }
        if (value) {
            let content: Node;
            if (this._editor.isMarkdown) {
                content = tavenemMarkdownParser.parse(value);
            } else {
                const div = document.createElement('div');
                div.innerHTML = value;
                content = PMDOMParser
                    .fromSchema(this._editor.view.state.schema)
                    .parse(div);
            }
            const { $anchor, $head } = this._editor.view.state.selection;
            const tr = this._editor.view.state.tr;
            tr.replaceRangeWith(
                0,
                this._editor.view.state.doc.content.size,
                content);
            tr.setSelection(TextSelection.create(tr.doc, $anchor.pos, $head.pos));
            this._editor.view.updateState(
                this._editor.view.state.apply(tr));
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
            let content: Node;
            if (this._editor.isMarkdown) {
                content = tavenemMarkdownParser.parse(value);
            } else {
                const div = document.createElement('div');
                div.innerHTML = value;
                content = PMDOMParser
                    .fromSchema(this._editor.view.state.schema)
                    .parse(div);
            }
            const stack = [];
            while (content.childCount === 1
                && content.firstChild
                && !content.firstChild.isInline) {
                stack.push(content.firstChild);
                content = content.firstChild;
            }
            const $from = this._editor.view.state.selection.$from;
            const contentMatch = $from.parent.contentMatchAt($from.index());
            while (stack.length > 0 && !contentMatch.findWrapping(content.type)) {
                content = stack.pop()!;
            }
            let replacement: Node | readonly Node[] = content;
            if (content.type === $from.parent.type
                && content.childCount > 0) {
                const children: Node[] = [];
                for (let i = 0; i < content.childCount; i++) {
                    children.push(content.child(i));
                }
                replacement = children;
            }
            const newState = this._editor.view.state.apply(
                this._editor.view.state.tr.replaceWith(
                    this._editor.view.state.selection.from,
                    this._editor.view.state.selection.to,
                    replacement));
                //this._editor.view.state.tr.replaceSelectionWith(content));
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

    private projectToMarkdown(node: Node, from: number, to: number): { from: number, to: number } {
        const posFrom = node.resolve(from);// + 1); // prosemirror counts position from "1"
        const posTo = node.resolve(to);// + 1);

        const markerFrom = Fragment.from(schema.text(MARKER, posFrom.marks()));
        const markerTo = Fragment.from(schema.text(MARKER, posTo.marks()));

        let withMarkers: Node = node;
        if (node.canReplace(posFrom.index(), posFrom.index(), markerFrom, posFrom.pos, posFrom.pos)) {
            if (node.canReplace(posTo.index(), posTo.index(), markerTo, posTo.pos, posTo.pos)) {
                withMarkers = node
                    .replace(posTo.pos, posTo.pos, new Slice(markerTo, 0, 0));
            }
            withMarkers = withMarkers
                .replace(posFrom.pos, posFrom.pos, new Slice(markerFrom, 0, 0));
        }

        const markdown = tavenemMarkdownSerializer.serialize(withMarkers);
        const fromIndex = markdown.indexOf(MARKER);
        if (fromIndex < 0) {
            return { from: -1, to: -1 };
        };
        let toIndex = markdown.indexOf(MARKER, fromIndex + 1);
        if (toIndex < 0) {
            toIndex = fromIndex;
        } else {
            toIndex--;
        }
        return {
            from: fromIndex,
            to: toIndex,
        };
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