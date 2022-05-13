import OrderedMap from 'orderedmap';

import { EditorState, NodeSelection, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { Schema, ProsemirrorNode, MarkType, MarkSpec, NodeSpec, Mark, NodeType, AttributeSpec, DOMOutputSpec } from 'prosemirror-model';
import { chainCommands, Command, lift, liftEmptyBlock, setBlockType, toggleMark, wrapIn } from 'prosemirror-commands';
import { redo, undo } from 'prosemirror-history';
import { liftListItem, sinkListItem, wrapInList } from 'prosemirror-schema-list';
import {
    addColumnAfter,
    addColumnBefore,
    addRowAfter,
    addRowBefore,
    CellSelection,
    deleteColumn,
    deleteRow,
    deleteTable,
    isInTable,
    mergeCells,
    selectionCell,
    splitCell,
    tableNodes,
    toggleHeaderRow
} from 'prosemirror-tables';
import { setAttr } from 'prosemirror-tables/dist';

import {
    EditorSelection,
    EditorState as CodeEditorState,
    Transaction as CodeTransaction,
    StateCommand
} from '@codemirror/state';

export enum CommandType {
    None = 0,
    Undo = 1,
    Redo = 2,
    Heading1 = 3,
    Heading2 = 4,
    Heading3 = 5,
    Heading4 = 6,
    Heading5 = 7,
    Heading6 = 8,
    Paragraph = 9,
    BlockQuote = 10,
    CodeBlock = 11,
    Strong = 12,
    Bold = 13,
    Emphasis = 14,
    Italic = 15,
    Underline = 16,
    Strikethrough = 17,
    Small = 18,
    Subscript = 19,
    Superscript = 20,
    Inserted = 21,
    Marked = 22,
    CodeInline = 23,
    ForegroundColor = 24,
    BackgroundColor = 25,
    InsertLink = 26,
    InsertImage = 27,
    ListBullet = 28,
    ListNumber = 29,
    ListCheck = 30,
    UpLevel = 31,
    DownLevel = 32,
    InsertTable = 33,
    TableInsertColumnBefore = 34,
    TableInsertColumnAfter = 35,
    TableDeleteColumn = 36,
    TableInsertRowBefore = 37,
    TableInsertRowAfter = 38,
    TableDeleteRow = 39,
    TableDelete = 40,
    TableMergeCells = 41,
    TableSplitCell = 42,
    TableToggleHeaderRow = 43,
    HorizontalRule = 44,
    SetCodeSyntax = 45,
    SetFontFamily = 46,
    SetFontSize = 47,
    SetLineHeight = 48,
    AlignLeft = 49,
    AlignCenter = 50,
    AlignRight = 51,
    PageBreak = 52,
}

interface ParamCommand<S extends Schema = any> {
    (state: EditorState<S>, dispatch?: (tr: Transaction<S>) => void, view?: EditorView<S>, params?: any[]): boolean;
}

export interface ParamStateCommand {
    (params?: any[]): StateCommand;
}

export interface CommandInfo {
    command: ParamCommand;
    isActive?: (state: EditorState, type?: MarkType) => boolean;
    isEnabled?: (state: EditorState) => boolean;
    markType?: MarkType;
}

export type CodeCommandSet = { [type in CommandType]?: ParamStateCommand };

export type CommandSet = { [type in CommandType]?: CommandInfo };

const commonAttrs: { [name: string]: AttributeSpec } = {
    id: { default: null },
    className: { default: null },
    style: { default: null },
};
const getCommonAttrs = (node: Node | string, attrs?: { [key: string]: any }) => {
    attrs = attrs || {};
    if (node instanceof HTMLElement) {
        attrs.id = node.id;
        attrs.className = node.className;
        attrs.style = node.style.cssText;
    }
    return attrs;
};
const nodeToDomWithCommonAttrs: (node: ProsemirrorNode, tag: string) => DOMOutputSpec = (node: ProsemirrorNode, tag: string) => {
    const { id, className, style } = node.attrs;
    return [tag, { id, class: className, style }, 0];
};
const commonNodes: { [name in string]: NodeSpec } = {
    doc: { content: "block+" },
    paragraph: {
        attrs: commonAttrs,
        content: "inline*",
        group: "block",
        parseDOM: [{ tag: "p", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "p") }
    },
    blockquote: {
        content: "block+",
        group: "block",
        defining: true,
        parseDOM: [{ tag: "blockquote" }],
        toDOM() { return ["blockquote", 0] }
    },
    horizontal_rule: {
        attrs: commonAttrs,
        group: "block",
        parseDOM: [{ tag: "hr", getAttrs: getCommonAttrs }],
        toDOM(node) {
            const { id, className, style } = node.attrs;
            return ["hr", { id, class: className, style }];
        }
    },
    heading: {
        attrs: {
            level: { default: 1 },
            id: { default: null },
            className: { default: null },
            style: { default: null },
        },
        content: "inline*",
        group: "block",
        defining: true,
        parseDOM: [
            { tag: "h1", getAttrs(p) { return getCommonAttrs(p, { level: 1 }) } },
            { tag: "h2", getAttrs(p) { return getCommonAttrs(p, { level: 2 }) } },
            { tag: "h3", getAttrs(p) { return getCommonAttrs(p, { level: 3 }) } },
            { tag: "h4", getAttrs(p) { return getCommonAttrs(p, { level: 4 }) } },
            { tag: "h5", getAttrs(p) { return getCommonAttrs(p, { level: 5 }) } },
            { tag: "h6", getAttrs(p) { return getCommonAttrs(p, { level: 6 }) } }
        ],
        toDOM(node) {
            const { id, className, style } = node.attrs;
            return ["h" + node.attrs.level, { id, class: className, style }, 0];
        }
    },
    code_block: {
        attrs: {
            syntax: { default: null },
            id: { default: null },
            className: { default: null },
            style: { default: null },
        },
        content: "text*",
        marks: "",
        group: "block",
        code: true,
        defining: true,
        parseDOM: [{
            tag: "pre",
            preserveWhitespace: "full",
            getAttrs(node) {
                if (node instanceof HTMLElement) {
                    let syntax: string | null = null;
                    const classes = node.className.split(" ");
                    if (classes && classes.length) {
                        syntax = classes.find(x => x.startsWith("language-")) || null;
                    }
                    return {
                        syntax,
                        id: node.id,
                        className: classes.filter(x => !x.startsWith("language-")).join(" "),
                        style: node.style.cssText,
                    }
                }
                return null;
            }
        }],
        toDOM(node) {
            let { syntax, id, className, style } = node.attrs;
            if (syntax) {
                className = className || "";
                if (className.length) {
                    className += " ";
                }
                className += `language-${syntax}`;
            }
            return ["pre", { id, class: className, style }, ["code", 0]];
        }
    },
    text: { group: "inline" },
    image: {
        inline: true,
        attrs: {
            src: {},
            alt: { default: null },
            title: { default: null },
            id: { default: null },
            className: { default: null },
            style: { default: null },
        },
        group: "inline",
        draggable: true,
        parseDOM: [{
            tag: "img[src]",
            getAttrs(node) {
                if (node instanceof HTMLElement) {
                    return {
                        src: node.getAttribute("src"),
                        title: node.getAttribute("title"),
                        alt: node.getAttribute("alt"),
                        id: node.id,
                        className: node.className,
                        style: node.style.cssText,
                    };
                } else {
                    return null;
                }
            }
        }],
        toDOM(node) {
            const { src, alt, title, id, className, style } = node.attrs;
            return ["img", { src, alt, title, id, class: className, style }];
        }
    },
    hard_break: {
        inline: true,
        group: "inline",
        selectable: false,
        parseDOM: [{ tag: "br" }],
        toDOM() { return ["br"] }
    },
    orderedList: {
        attrs: {
            order: { default: 1 },
            id: { default: null },
            className: { default: null },
            style: { default: null },
        },
        content: "list_item+",
        group: "block",
        parseDOM: [{
            tag: "ol",
            getAttrs(node) {
                if (node instanceof HTMLElement) {
                    return {
                        order: node.hasAttribute("start") ? +(node.getAttribute("start") || 1) : 1,
                        id: node.id,
                        className: node.className,
                        style: node.style.cssText,
                    };
                } else {
                    return { order: 1 };
                }
            }
        }],
        toDOM(node) {
            const { order, id, className, style } = node.attrs;
            return order == 1
                ? ["ol", { id, className, style }, 0]
                : ["ol", { start: order, id, class: className, style }, 0];
        }
    },
    task_list: {
        attrs: commonAttrs,
        content: "(task_list_item | list_item)+",
        group: "block",
        parseDOM: [{ tag: "ul", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "ul") }
    },
    bulletList: {
        attrs: commonAttrs,
        content: "list_item+",
        group: "block",
        parseDOM: [{ tag: "ul", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "ul") }
    },
    task_list_item: {
        attrs: {
            complete: { default: false },
            id: { default: null },
            className: { default: null },
            style: { default: null },
        },
        content: "paragraph block*",
        parseDOM: [{
            tag: "li",
            getAttrs: node => {
                if (!(node instanceof HTMLLIElement)) {
                    return false;
                }
                const child = node.firstChild;
                if (!(child instanceof HTMLInputElement)
                    || child.type != 'checkbox') {
                    return false;
                }
                return {
                    complete: child.checked,
                    id: node.id,
                    className: node.className,
                    style: node.style.cssText,
                };
            }
        }],
        toDOM(node) {
            const { complete, id, className, style } = node.attrs;
            return ["li", { id, class: className, style }, ["input", { type: "checkbox", checked: complete }], 0];
        }
    },
    listItem: {
        attrs: commonAttrs,
        content: "paragraph block*",
        defining: true,
        parseDOM: [{ tag: "li", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "li") }
    },
    math_inline: {
        attrs: commonAttrs,
        group: "inline math",
        content: "text*",
        inline: true,
        atom: true,
        parseDOM: [{
            tag: "math-inline",
            getAttrs(node) {
                if (!(node instanceof HTMLDivElement)) {
                    return false;
                }
                return {
                    id: node.id,
                    className: node.className.split(" ").filter(x => x != "math-node").join(" "),
                    style: node.style.cssText,
                };
            }
        }],
        toDOM(node) {
            const { id, className, style } = node.attrs;
            return [
                "math-inline",
                {
                    id,
                    class: className + (className && className.length ? " math-node" : "math-node"),
                    style
                },
                0
            ];
        }
    },
    math_display: {
        attrs: commonAttrs,
        group: "block math",
        content: "text*",
        atom: true,
        code: true,
        parseDOM: [{
            tag: "math-display",
            getAttrs(node) {
                if (!(node instanceof HTMLDivElement)) {
                    return false;
                }
                return {
                    id: node.id,
                    className: node.className.split(" ").filter(x => x != "math-node").join(" "),
                    style: node.style.cssText,
                };
            }
        }],
        toDOM(node) {
            const { id, className, style } = node.attrs;
            return [
                "math-display",
                {
                    id,
                    class: className + (className && className.length ? " math-node" : "math-node"),
                    style
                },
                0
            ];
        }
    },
    container: {
        attrs: commonAttrs,
        content: "block+",
        group: "block",
        parseDOM: [{ tag: "div", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "div") }
    },
};

const tableSchemaNodes = tableNodes({
    tableGroup: "block",
    cellContent: "block+",
    cellAttributes: {
        align: {
            default: null,
            getFromDOM(dom) { return dom instanceof HTMLElement ? dom.style.textAlign : null },
            setDOMAttr(value, attrs) {
                if (value) {
                    attrs.style = (attrs.style || "") + `text-align: ${value};`;
                }
            }
        }
    }
}) as unknown as Record<string, NodeSpec>;

const markToDomWithCommonAttrs: (mark: Mark, tag: string) => DOMOutputSpec = (mark: Mark, tag: string) => {
    const { id, className, style } = mark.attrs;
    return [tag, { id, class: className, style }, 0];
};
const commonMarks: { [name in string]: MarkSpec } = {
    link: {
        attrs: {
            href: {},
            title: { default: null },
            id: { default: null },
            className: { default: null },
            style: { default: null },
        },
        inclusive: false,
        parseDOM: [{
            tag: "a[href]",
            getAttrs(node) {
                if (node instanceof HTMLElement) {
                    return {
                        href: node.getAttribute("href"),
                        title: node.getAttribute("title"),
                        id: node.id,
                        className: node.className,
                        style: node.style.cssText,
                    }
                }
                return null;
            }
        }],
        toDOM(node) {
            const { href, title, id, className, style } = node.attrs;
            return ["a", { href, title, id, class: className, style }, 0];
        }
    },
    em: {
        attrs: commonAttrs,
        parseDOM: [{ tag: "em", getAttrs: getCommonAttrs }],
        toDOM(mark) { return markToDomWithCommonAttrs(mark, "em") }
    },
    italic: {
        attrs: commonAttrs,
        parseDOM: [
            { tag: "i", getAttrs: getCommonAttrs },
            { style: "font-style=italic" }
        ],
        toDOM(mark) { return markToDomWithCommonAttrs(mark, "i") }
    },
    strong: {
        parseDOM: [{ tag: "strong", getAttrs: getCommonAttrs }],
        toDOM(mark) { return markToDomWithCommonAttrs(mark, "strong") }
    },
    bold: {
        parseDOM: [
            {
                tag: "b",
                getAttrs: node => {
                    if (node instanceof HTMLElement) {
                        // This works around a Google Docs misbehavior where
                        // pasted content will be inexplicably wrapped in `<b>`
                        // tags with a font-weight normal.
                        if (node.style.fontWeight == "normal") {
                            return false;
                        } else {
                            return {
                                id: node.id,
                                className: node.className,
                                style: node.style.cssText,
                            }
                        }
                    } else {
                        return null;
                    }
                }
            },
            { style: "font-weight", getAttrs: value => /^(bold(er)?|[5-9]\d{2,})$/.test(value as string) && null }
        ],
        toDOM(mark) { return markToDomWithCommonAttrs(mark, "b") }
    },
    underline: {
        parseDOM: [
            { tag: "u" },
            { style: "text-decoration-line=underline" },
        ],
        toDOM(mark) { return markToDomWithCommonAttrs(mark, "u") }
    },
    code: {
        attrs: commonAttrs,
        parseDOM: [{ tag: "code", getAttrs: getCommonAttrs }],
        toDOM(mark) { return markToDomWithCommonAttrs(mark, "code") }
    },
    ins: {
        attrs: commonAttrs,
        parseDOM: [{ tag: "ins", getAttrs: getCommonAttrs }],
        toDOM(mark) { return markToDomWithCommonAttrs(mark, "ins") }
    },
    mark: {
        attrs: commonAttrs,
        parseDOM: [{ tag: "mark", getAttrs: getCommonAttrs }],
        toDOM(mark) { return markToDomWithCommonAttrs(mark, "mark") }
    },
    strikethrough: {
        attrs: commonAttrs,
        parseDOM: [
            { tag: "del", getAttrs: getCommonAttrs },
            { tag: "s", getAttrs: getCommonAttrs },
            { tag: "strike", getAttrs: getCommonAttrs },
            { style: "text-decoration-line=line-through" },
        ],
        toDOM(mark) { return markToDomWithCommonAttrs(mark, "del") }
    },
    small: {
        attrs: commonAttrs,
        parseDOM: [
            { tag: "small", getAttrs: getCommonAttrs },
            { style: "font-size=smaller" },
        ],
        toDOM(mark) { return markToDomWithCommonAttrs(mark, "small") }
    },
    sub: {
        attrs: commonAttrs,
        parseDOM: [{ tag: "sub", getAttrs: getCommonAttrs }, { style: "vertical-align=sub" }],
        toDOM(mark) { return markToDomWithCommonAttrs(mark, "sub") }
    },
    sup: {
        attrs: commonAttrs,
        parseDOM: [{ tag: "sup", getAttrs: getCommonAttrs }, { style: "vertical-align=super" }],
        toDOM(mark) { return markToDomWithCommonAttrs(mark, "sup") }
    },
    span: {
        attrs: commonAttrs,
        excludes: '',
        parseDOM: [{ tag: "span", getAttrs: getCommonAttrs }],
        toDOM(mark) { return markToDomWithCommonAttrs(mark, "span") }
    },
};

export const htmlSchema = new Schema({
    nodes: OrderedMap.from(commonNodes)
        .append(tableSchemaNodes),
    marks: commonMarks
});

export const markdownSchema = new Schema({
    nodes: OrderedMap.from(commonNodes)
        .append(tableSchemaNodes),
    marks: commonMarks
});

export function commonCommands(schema: Schema) {
    const commands: CommandSet = {};
    commands[CommandType.Undo] = { command: undo };
    commands[CommandType.Redo] = { command: redo };
    for (let i = 0; i < 6; i++) {
        commands[(CommandType.Heading1 - i) as CommandType] = blockTypeMenuItem(schema.nodes.heading, { level: i });
    }
    commands[CommandType.Paragraph] = blockTypeMenuItem(schema.nodes.paragraph);
    commands[CommandType.BlockQuote] = blockTypeMenuItem(schema.nodes.blockquote);
    commands[CommandType.CodeBlock] = blockTypeMenuItem(schema.nodes.code_block);
    commands[CommandType.Strong] = markMenuItem(schema.marks.strong);
    commands[CommandType.Bold] = markMenuItem(schema.marks.bold);
    commands[CommandType.Emphasis] = markMenuItem(schema.marks.em);
    commands[CommandType.Italic] = markMenuItem(schema.marks.italic);
    commands[CommandType.Underline] = markMenuItem(schema.marks.underline);
    commands[CommandType.Strikethrough] = markMenuItem(schema.marks.strikethrough);
    commands[CommandType.Small] = markMenuItem(schema.marks.small);
    commands[CommandType.Subscript] = markMenuItem(schema.marks.sub);
    commands[CommandType.Superscript] = markMenuItem(schema.marks.sup);
    commands[CommandType.Inserted] = markMenuItem(schema.marks.ins);
    commands[CommandType.Marked] = markMenuItem(schema.marks.mark);
    commands[CommandType.CodeInline] = markMenuItem(schema.marks.code);
    commands[CommandType.ForegroundColor] = {
        command(state, dispatch, _, params) {
            const { from, $from, to, $to } = state.selection;
            const marks = $from.marksAcross($to);

            if (!params || !params.length) {
                const parentColor = to <= $from.end()
                    && $from.parent.attrs.style
                    && $from.parent.attrs.style.contains('color:');
                let anyColor = parentColor;

                if (marks && marks.length) {
                    marks.forEach(m => anyColor = anyColor || m.attrs.style?.contains('color:'));
                }

                if (!anyColor) {
                    return false;
                }

                if (dispatch) {
                    if (parentColor) {
                        const attrs = $from.parent.attrs;
                        attrs.style = ((attrs.style || '') as string)
                            .split(';')
                            .filter(x => !x.trimStart().startsWith('color:'))
                            .join(';');
                            
                        dispatch(state.tr.setNodeMarkup(from, undefined, attrs));
                    }
                    if (marks && marks.length) {
                        marks.forEach(m => {
                            if (m.attrs.style?.contains('color:')) {
                                dispatch(state.tr.removeMark(from, to, m));
                            }
                        });
                    }
                }
                return true;
            }

            const styleValue = `$color:${params[0]}`;

            if (state.selection instanceof NodeSelection
                && state.selection.node
                && state.selection.node.attrs.style?.contains(styleValue)) {
                return false;
            }
            if (to <= $from.end()
                && $from.parent.attrs.style?.contains(styleValue)) {
                return false;
            }
            if (marks && marks.length) {
                let allMarks = true;
                marks.forEach(m => allMarks = allMarks && m.attrs.style?.contains(styleValue));
                if (allMarks) {
                    return false;
                }
            }

            return toggleMark(state.schema.marks.span, { style: styleValue })(state, dispatch);
        },
        isEnabled(state) {
            return toggleMark(state.schema.marks.span, { style: 'color:placeholder' })(state);
        }
    };
    commands[CommandType.BackgroundColor] = {
        command(state, dispatch, _, params) {
            const { from, $from, to, $to } = state.selection;
            const marks = $from.marksAcross($to);

            if (!params || !params.length) {
                const parentColor = to <= $from.end()
                    && $from.parent.attrs.style
                    && $from.parent.attrs.style.contains('background-color:');
                let anyColor = parentColor;

                if (marks && marks.length) {
                    marks.forEach(m => anyColor = anyColor || m.attrs.style?.contains('background-color:'));
                }

                if (!anyColor) {
                    return false;
                }

                if (dispatch) {
                    if (parentColor) {
                        const attrs = $from.parent.attrs;
                        attrs.style = ((attrs.style || '') as string)
                            .split(';')
                            .filter(x => !x.trimStart().startsWith('background-color:'))
                            .join(';');

                        dispatch(state.tr.setNodeMarkup(from, undefined, attrs));
                    }
                    if (marks && marks.length) {
                        marks.forEach(m => {
                            if (m.attrs.style?.contains('background-color:')) {
                                dispatch(state.tr.removeMark(from, to, m));
                            }
                        });
                    }
                }
                return true;
            }

            const styleValue = `background-color:${params[0]}`;

            if (state.selection instanceof NodeSelection
                && state.selection.node
                && state.selection.node.attrs.style?.contains(styleValue)) {
                return false;
            }
            if (to <= $from.end()
                && $from.parent.attrs.style?.contains(styleValue)) {
                return false;
            }
            if (marks && marks.length) {
                let allMarks = true;
                marks.forEach(m => allMarks = allMarks && m.attrs.style?.contains(styleValue));
                if (allMarks) {
                    return false;
                }
            }

            return toggleMark(state.schema.marks.span, { style: styleValue })(state, dispatch);
        },
        isEnabled(state) {
            return toggleMark(state.schema.marks.span, { style: 'background-color:placeholder' })(state);
        }
    };
    commands[CommandType.InsertImage] = {
        command(state, dispatch, _, params) {
            if (!canInsert(state, schema.nodes.image)) {
                return false;
            }
            if (dispatch) {
                if (!params || !params.length) {
                    return true;
                }
                let attrs: { [key: string]: any } | null = null;
                if (state.selection instanceof NodeSelection
                    && state.selection.node.type == schema.nodes.image) {
                    attrs = state.selection.node.attrs;
                }
                attrs = attrs || {};
                attrs.src = params[0];
                if (params.length > 1) {
                    attrs.title = params[1];
                }
                if (params.length > 2 && params[2]) {
                    attrs.alt = params[2];
                }
                dispatch(state.tr.replaceSelectionWith(schema.nodes.image.createAndFill(attrs)!));
            }
            return true;
        },
        isActive(state, type) { return isMarkActive(state, type) },
        markType: schema.marks.image
    };
    commands[CommandType.InsertLink] = {
        command(state, dispatch, _, params) {
            const isActive = isMarkActive(state, schema.marks.link);
            if (isActive) {
                return toggleMark(schema.marks.link)(state, dispatch);
            }
            if (dispatch) {
                if (!params || !params.length) {
                    return true;
                }
                const attrs: { [key: string]: any } = {};
                attrs.href = params[0];
                if (params.length > 1) {
                    attrs.title = params[1];
                }
                return toggleMark(schema.marks.link, attrs)(state, dispatch);
            }
            return true;
        },
        isActive(state, type) { return isMarkActive(state, type) },
        markType: schema.marks.link
    };
    commands[CommandType.ListBullet] = { command: wrapInList(schema.nodes.bullet_list) };
    commands[CommandType.ListNumber] = { command: wrapInList(schema.nodes.ordered_list) };
    commands[CommandType.ListCheck] = { command: wrapInList(schema.nodes.task_list) };
    commands[CommandType.UpLevel] = {
        command: chainCommands(
            liftListItem(schema.nodes.task_list_item),
            liftListItem(schema.nodes.list_item),
            lift,
            liftEmptyBlock)
    };
    commands[CommandType.DownLevel] = {
        command: chainCommands(
            sinkListItem(schema.nodes.task_list_item),
            sinkListItem(schema.nodes.list_item))
    };
    commands[CommandType.InsertTable] = {
        command(state, dispatch, _, params) {
            if (!canInsert(state, schema.nodes.table)
                || this.isActive!(state)) {
                return false;
            }
            if (dispatch) {
                const rows = params && params.length ? params[0] : 2;
                const columns = params && params.length > 1 ? params[1] : 2;

                const rowNodes: ProsemirrorNode[] = [];
                for (let i = 0; i < rows; i++) {
                    const cells: ProsemirrorNode[] = [];
                    for (let j = 0; j < columns; j++) {
                        if (i == 0) {
                            cells.push(schema.nodes.table_header.create());
                        } else {
                            cells.push(schema.nodes.table_cell.create());
                        }
                    }
                    rowNodes.push(schema.nodes.table_row.create(null, cells));
                }
                dispatch(state.tr.replaceSelectionWith(schema.nodes.table.create(null, rowNodes)!));
            }
            return true;
        },
        isActive(state) {
            if (state.selection instanceof NodeSelection
                && state.selection.node) {
                return state.selection.node.hasMarkup(schema.nodes.table);
            }
            const { $from, to } = state.selection;
            return to <= $from.end()
                && $from.parent.hasMarkup(schema.nodes.table);
        }
    };
    commands[CommandType.TableInsertColumnBefore] = { command: addColumnBefore };
    commands[CommandType.TableInsertColumnAfter] = { command: addColumnAfter };
    commands[CommandType.TableDeleteColumn] = { command: deleteColumn };
    commands[CommandType.TableInsertRowBefore] = { command: addRowBefore };
    commands[CommandType.TableInsertRowAfter] = { command: addRowAfter };
    commands[CommandType.TableDeleteRow] = { command: deleteRow };
    commands[CommandType.TableDelete] = { command: deleteTable };
    commands[CommandType.TableMergeCells] = { command: mergeCells };
    commands[CommandType.TableSplitCell] = { command: splitCell };
    commands[CommandType.TableToggleHeaderRow] = { command: toggleHeaderRow };
    commands[CommandType.HorizontalRule] = {
        command(state, dispatch) {
            if (!canInsert(state, schema.nodes.horizontal_rule)) {
                return false;
            }
            if (dispatch) {
                dispatch(state.tr.replaceSelectionWith(schema.nodes.horizontal_rule.create()));
            }
            return true;
        }
    };
    commands[CommandType.SetCodeSyntax] = {
        command(state, dispatch, _, params) {
            const node = state.selection.$head.nodeAfter;
            if (!node || node.type != schema.nodes.code_block) {
                return false;
            }
            if (dispatch) {
                if (!params || !params.length) {
                    return true;
                }
                const attrs = node.attrs;
                attrs.syntax = params[0] as string | null;
                dispatch(state.tr.setNodeMarkup(
                    state.selection.head,
                    undefined,
                    attrs));
            }
            return true;
        }
    };
    commands[CommandType.SetFontFamily] = setInlineStyleMenuItem('font-family');
    commands[CommandType.SetFontSize] = setInlineStyleMenuItem('font-size');
    commands[CommandType.SetLineHeight] = setInlineStyleMenuItem('line-height');
    commands[CommandType.AlignLeft] = alignMenuItem('left');
    commands[CommandType.AlignCenter] = alignMenuItem('center');
    commands[CommandType.AlignRight] = alignMenuItem('right');
    commands[CommandType.PageBreak] = setStyleMenuItem('page-break-after', 'always');
    return commands;
}

export function htmlWrapCommand(tag: string) {
    return wrapCommand(`<${tag}>`, `</${tag}>`);
}

export function wrapCommand(tag: string, closeTag: string) {
    return (_params?: any[]) => (target: {
        state: CodeEditorState;
        dispatch: (transaction: CodeTransaction) => void;
    }) => {
        target.dispatch(target.state.update(target.state.changeByRange(range => ({
            range: EditorSelection.range(range.from + tag.length, range.to + tag.length),
            changes: [
                { from: range.from, insert: tag },
                { from: range.to, insert: closeTag },
            ],
        }))));
        return true;
    };
}

function alignMenuItem(value: string): CommandInfo {
    const style = `text-align:${value}`;
    return {
        command(state, dispatch, view) {
            if (this.isActive!(state)) {
                return true;
            }
            const handled = setColumnAlign(value)(state, dispatch, view);
            if (handled) {
                return true;
            }
            return setBlockType(state.schema.nodes.container, { style })(state, dispatch);
        },
        isActive(state) {
            if (state.selection instanceof CellSelection) {
                let colSelection;
                if (state.selection.isColSelection()) {
                    colSelection = state.selection;
                } else {
                    colSelection = CellSelection.colSelection(state.selection.$anchorCell, state.selection.$headCell);
                }
                let allCells = true;
                colSelection.forEachCell(x => allCells = allCells && ((x.attrs?.align == value) || false));
                return allCells;
            }
            if (state.selection instanceof NodeSelection
                && state.selection.node) {
                return state.selection.node.attrs?.style?.contains(style) || false;
            }
            const { $from, to } = state.selection;
            return to <= $from.end()
                && $from.parent.attrs?.style?.contains(style) || false;
        }
    };
}

function blockTypeMenuItem(nodeType: NodeType, attrs?: { [key: string]: any }): CommandInfo {
    return {
        command: setBlockType(nodeType),
        isActive(state) {
            if (state.selection instanceof NodeSelection
                && state.selection.node) {
                return state.selection.node.hasMarkup(nodeType, attrs);
            }
            const { $from, to } = state.selection;
            return to <= $from.end()
                && $from.parent.hasMarkup(nodeType, attrs);
        }
    };
}

function canInsert(state: EditorState, nodeType: NodeType) {
    const $from = state.selection.$from;
    for (let d = $from.depth; d >= 0; d--) {
        const index = $from.index(d);
        if ($from.node(d).canReplaceWith(index, index, nodeType)) {
            return true;
        }
    }
    return false;
}

function isMarkActive(state: EditorState, type?: MarkType) {
    if (!type) {
        return false;
    }
    const { from, $from, to, empty } = state.selection;
    if (empty) {
        return !!type.isInSet(state.storedMarks || $from.marks());
    } else {
        return state.doc.rangeHasMark(from, to, type);
    }
}

function markMenuItem(type: MarkType): CommandInfo {
    return {
        command: toggleMark(type),
        isActive(state, type) { return isMarkActive(state, type) },
        markType: type,
    }
}

function setInlineStyleMenuItem(style: string): CommandInfo {
    return {
        command(state, dispatch, _, params) {
            if (!params || !params.length) {
                return false;
            }

            const styleValue = `${style}:${params[0]}`;

            if (state.selection instanceof NodeSelection
                && state.selection.node
                && state.selection.node.attrs.style?.contains(styleValue)) {
                return false;
            }
            const { $from, to, $to } = state.selection;
            if (to <= $from.end()
                && $from.parent.attrs.style?.contains(styleValue)) {
                return false;
            }
            const marks = $from.marksAcross($to);
            if (marks && marks.length) {
                let allMarks = true;
                marks.forEach(m => allMarks = allMarks && m.attrs.style?.contains(styleValue));
                if (allMarks) {
                    return false;
                }
            }

            return toggleMark(state.schema.marks.span, { style: styleValue })(state, dispatch);
        }
    };
}

function setStyleMenuItem(style: string, value?: string): CommandInfo {
    return {
        command(state, dispatch, _, params) {
            if (!value && (!params || !params.length)) {
                return false;
            }

            value = value || params![0];

            const styleValue = `${style}:${value}`;

            if (state.selection instanceof NodeSelection
                && state.selection.node
                && state.selection.node.attrs.style?.contains(styleValue)) {
                return false;
            }
            const { $from, to, $to } = state.selection;
            if (to <= $from.end()
                && $from.parent.attrs.style?.contains(styleValue)) {
                return false;
            }
            const marks = $from.marksAcross($to);
            if (marks && marks.length) {
                let allMarks = true;
                marks.forEach(m => allMarks = allMarks && m.attrs.style?.contains(styleValue));
                if (allMarks) {
                    return false;
                }
            }

            return wrapIn(state.schema.nodes.container, { style: styleValue })(state, dispatch);
        }
    };
}

function setColumnAlign<S extends Schema = any>(value: string): Command<S> {
    return function (state: EditorState<S>, dispatch?: (tr: Transaction<S>) => void) {
        if (!isInTable(state)) {
            return false;
        }
        const $cell = selectionCell(state);
        if (!$cell || !$cell.nodeAfter) {
            return false;
        }
        if ($cell.nodeAfter.attrs.align === value) {
            return false;
        }
        if (dispatch) {
            const tr = state.tr;
            if (state.selection instanceof CellSelection) {
                let colSelection;
                if (state.selection.isColSelection()) {
                    colSelection = state.selection;
                } else {
                    colSelection = CellSelection.colSelection(state.selection.$anchorCell, state.selection.$headCell);
                }
                colSelection.forEachCell((node, pos) => {
                    if (node.attrs.align !== value) {
                        tr.setNodeMarkup(pos, undefined, setAttr(node.attrs, 'align', value));
                    }
                });
            } else {
                tr.setNodeMarkup($cell.pos, undefined, setAttr($cell.nodeAfter.attrs, 'align', value));
            }
            dispatch(tr);
        }
        return true;
    };
}
