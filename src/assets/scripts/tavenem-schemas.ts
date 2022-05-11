import OrderedMap from 'orderedmap';
import Token from 'markdown-it/lib/token';
import attributes from 'markdown-it-attrs';
import container_plugin from 'markdown-it-container';
import ins_plugin from 'markdown-it-ins';
import span_plugin from 'markdown-it-span';
import sub_plugin from 'markdown-it-sub';
import sup_plugin from 'markdown-it-sup';
import task_list_plugin from 'markdown-it-task-lists';

import { EditorState, NodeSelection, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { Schema, PMNode as PMNode, MarkType, MarkSpec, NodeSpec, Mark, Fragment, NodeType, AttributeSpec, DOMOutputSpec } from 'prosemirror-model';
import { chainCommands, Command, lift, liftEmptyBlock, setBlockType, toggleMark, wrapIn } from 'prosemirror-commands';
import { redo, undo } from 'prosemirror-history';
import { liftListItem, sinkListItem, wrapInList } from 'prosemirror-schema-list';
import { addColumnAfter, addColumnBefore, addRowAfter, addRowBefore, CellSelection, deleteColumn, deleteRow, deleteTable, isInTable, mergeCells, selectionCell, splitCell, tableNodes, toggleHeaderRow } from 'prosemirror-tables';
import { setAttr } from 'prosemirror-tables/dist';
import {
    MarkdownParser,
    MarkdownSerializer,
    MarkdownSerializerState
} from 'prosemirror-markdown';

import {
    EditorSelection,
    EditorState as CodeEditorState,
    Transaction as CodeTransaction,
    StateCommand
} from '@codemirror/state';
import { undo as codeUndo, redo as codeRedo } from '@codemirror/commands';

export enum CommandType {
    None,
    Undo,
    Redo,
    Heading1,
    Heading2,
    Heading3,
    Heading4,
    Heading5,
    Heading6,
    Paragraph,
    BlockQuote,
    CodeBlock,
    Bold,
    Italic,
    Strikethrough,
    Subscript,
    Superscript,
    Inserted,
    Marked,
    CodeInline,
    ForegroundColor,
    BackgroundColor,
    InsertLink,
    InsertImage,
    ListBullet,
    ListNumber,
    ListCheck,
    UpLevel,
    DownLevel,
    TableInsertColumnBefore,
    TableInsertColumnAfter,
    TableDeleteColumn,
    TableInsertRowBefore,
    TableInsertRowAfter,
    TableDeleteRow,
    TableDelete,
    TableMergeCells,
    TableSplitCell,
    TableToggleHeaderRow,
    TableColumnAlignLeft,
    TableColumnAlignCenter,
    TableColumnAlignRight,
    HorizontalRule,
    SetCodeSyntax,
}

interface ParamCommand<S extends Schema = any> {
    (state: EditorState<S>, dispatch?: (tr: Transaction<S>) => void, view?: EditorView<S>, params?: any[]): boolean;
}

interface ParamStateCommand {
    (params?: any[]): StateCommand;
}

export interface CommandInfo {
    active?: boolean;
    enabled?: boolean;
    command: ParamCommand;
    isActive?: (state: EditorState, type: MarkType) => boolean;
    markType?: MarkType;
}

type CodeCommandSet = { [type in CommandType]?: ParamStateCommand };

type CommandSet = { [type in CommandType]?: CommandInfo };

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
const nodeToDomWithCommonAttrs: (node: PMNode, tag: string) => DOMOutputSpec = (node: PMNode, tag: string) => {
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
        parseDOM: [
            { tag: "i", getAttrs: getCommonAttrs },
            { tag: "em", getAttrs: getCommonAttrs },
            { style: "font-style=italic" }],
        toDOM(mark) { return markToDomWithCommonAttrs(mark, "em") }
    },
    strong: {
        parseDOM: [
            { tag: "strong", getAttrs: getCommonAttrs },
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
            { style: "font-weight", getAttrs: value => /^(bold(er)?|[5-9]\d{2,})$/.test(value as string) && null }],
        toDOM(mark) { return markToDomWithCommonAttrs(mark, "strong") }
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
            { style: "text-decoration-line=line-through" }],
        toDOM(mark) { return markToDomWithCommonAttrs(mark, "del") }
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

const getCommonTokenAttributes = (token: Token) => ({
    id: token.attrGet("id") || null,
    className: token.attrGet("class") || null,
    style: token.attrGet("style") || null,
});
export const tavenemMarkdownParser = new MarkdownParser(
    markdownSchema,
    markdownit("commonmark", {
        html: true,
        breaks: true,
        linkify: true,
    }).use(ins_plugin)
        .use(sub_plugin)
        .use(sup_plugin)
        .use(task_list_plugin)
        .use(container_plugin)
        .use(span_plugin)
        .use(attributes, { allowedAttributes: ['id', 'class', 'style'] }), {
        blockquote: { block: "blockquote" },
        paragraph: { block: "paragraph", getAttrs: getCommonTokenAttributes },
        task_list_item: {
            block: "task_list_item",
            getAttrs: token => ({
                complete: token.children && token.children[0] && token.children[0].attrGet("checked") == "checked",
                id: token.attrGet("id") || null,
                className: token.attrGet("class") || null,
                style: token.attrGet("style") || null,
            })
        },
        list_item: { block: "list_item", getAttrs: getCommonTokenAttributes },
        bullet_list: { block: "bullet_list" },
        ordered_list: {
            block: "ordered_list",
            getAttrs: token => ({ order: +(token.attrGet("start") || 1) || 1 })
        },
        task_list: { block: "task_list" },
        heading: {
            block: "heading",
            getAttrs: token => ({
                level: +token.tag.slice(1),
                id: token.attrGet("id") || null,
                className: token.attrGet("class") || null,
                style: token.attrGet("style") || null,
            })
        },
        code_block: { block: "code_block", noCloseToken: true, getAttrs: getCommonTokenAttributes },
        fence: {
            block: "code_block",
            getAttrs: token => {
                let syntax: string | null = token.info;
                const classes = (token.attrGet("class") || "").split(" ");
                if (!syntax || !syntax.length) {
                    if (classes && classes.length) {
                        syntax = classes.find(x => x.startsWith("language-")) || null;
                    }
                }
                return {
                    syntax,
                    id: token.attrGet("id") || null,
                    className: classes.filter(x => !x.startsWith("language-")).join(" "),
                    style: token.attrGet("style") || null,
                };
            },
            noCloseToken: true
        },
        table: { block: "table" },
        table_row: { block: "table_row" },
        table_cell: {
            block: "table_cell", getAttrs: tok => {
                const style = tok.attrGet("style");
                let align;
                if (style) {
                    const styles = style.split(';');
                    const textAlign = styles.find(x => x.trim().toLowerCase().startsWith("text-align"));
                    if (textAlign) {
                        const separatorIndex = textAlign.indexOf(':');
                        if (separatorIndex >= 0) {
                            align = textAlign.substring(separatorIndex + 1).trim();
                        }
                    }
                }
                return {
                    align,
                    colspan: +(tok.attrGet("colspan") || 1) || 1,
                    rowspan: +(tok.attrGet("rowspan") || 1) || 1
                }
            }
        },
        table_header: {
            block: "table_header", getAttrs: tok => {
                const style = tok.attrGet("style");
                let align;
                if (style) {
                    const styles = style.split(';');
                    const textAlign = styles.find(x => x.trim().toLowerCase().startsWith("text-align"));
                    if (textAlign) {
                        const separatorIndex = textAlign.indexOf(':');
                        if (separatorIndex >= 0) {
                            align = textAlign.substring(separatorIndex + 1).trim();
                        }
                    }
                }
                return {
                    align,
                    colspan: +(tok.attrGet("colspan") || 1) || 1,
                    rowspan: +(tok.attrGet("rowspan") || 1) || 1
                }
            }
        },
        math_inline: {
            block: "math_inline",
            noCloseToken: true,
            getAttrs: token => ({
                id: token.attrGet("id") || null,
                className: (token.attrGet("class") || null)?.split(" ").filter(x => x != "math-node").join(" ") || null,
                style: token.attrGet("style") || null,
            })
        },
        math_block: {
            block: "math_display",
            noCloseToken: true,
            getAttrs: token => ({
                id: token.attrGet("id") || null,
                className: (token.attrGet("class") || null)?.split(" ").filter(x => x != "math-node").join(" ") || null,
                style: token.attrGet("style") || null,
            })
        },
        container: { block: "container", getAttrs: getCommonTokenAttributes },

        hr: { node: "horizontal_rule", getAttrs: getCommonTokenAttributes },
        image: {
            node: "image",
            getAttrs: token => ({
                src: token.attrGet("src"),
                title: token.attrGet("title") || null,
                alt: token.children && token.children[0] && token.children[0].content || null
            })
        },
        hardbreak: { node: "hard_break" },

        em: { mark: "em", getAttrs: getCommonTokenAttributes },
        strong: { mark: "strong", getAttrs: getCommonTokenAttributes },
        link: {
            mark: "link",
            getAttrs: token => ({
                href: token.attrGet("href"),
                title: token.attrGet("title") || null,
                id: token.attrGet("id") || null,
                className: token.attrGet("class") || null,
                style: token.attrGet("style") || null,
            })
        },
        code_inline: { mark: "code", noCloseToken: true, getAttrs: getCommonTokenAttributes },
        ins: { mark: "ins", getAttrs: getCommonTokenAttributes },
        mark: { mark: "mark", getAttrs: getCommonTokenAttributes },
        strikethrough: { mark: "strikethrough", getAttrs: getCommonTokenAttributes },
        sub: { mark: "sub", getAttrs: getCommonTokenAttributes },
        sup: { mark: "sup", getAttrs: getCommonTokenAttributes },
        span: { mark: "span", getAttrs: getCommonTokenAttributes },
    });
export const tavenemMarkdownSerializer = new MarkdownSerializer({
    blockquote(state, node) {
        state.wrapBlock("> ", undefined, node, () => state.renderContent(node));
    },
    code_block(state, node) {
        state.write("```" + (node.attrs.syntax || ""));
        writeCommonAttributes(state, node, true);
        state.text(node.textContent, false);
        state.ensureNewLine();
        state.write("```");
        state.closeBlock(node);
    },
    heading(state, node) {
        state.write(state.repeat("#", node.attrs.level) + " ");
        state.renderInline(node);
        writeCommonAttributes(state, node);
        state.closeBlock(node);
    },
    horizontal_rule(state, node) {
        state.write("---");
        writeCommonAttributes(state, node);
        state.closeBlock(node);
    },
    bullet_list(state, node) {
        state.renderList(node, "  ", () => (node.attrs.bullet || "*") + " ");
    },
    ordered_list(state, node) {
        const start = node.attrs.order || 1;
        const maxW = String(start + node.childCount - 1).length;
        const space = state.repeat(" ", maxW + 2);
        state.renderList(node, space, i => {
            const nStr = String(start + i);
            return state.repeat(" ", maxW - nStr.length) + nStr + ". ";
        })
    },
    task_list(state, node) {
        state.renderList(node, "  ", () => (node.attrs.complete ? "[x]" : "[ ]") + " ");
    },
    task_list_item(state, node) {
        state.renderContent(node);
        writeCommonAttributes(state, node);
    },
    list_item(state, node) {
        state.renderContent(node);
        writeCommonAttributes(state, node);
    },
    paragraph(state, node) {
        state.renderInline(node);
        writeCommonAttributes(state, node);
        state.closeBlock(node);
    },
    table(state, node) {
        const row = node.firstChild;
        if (!row || row.type.name != "table_row") {
            return;
        }
        const cell = row.firstChild;
        const autoHeader = !cell
            || cell.type.name != "table_header";
        if (autoHeader) {
            let maxCells = 0;
            for (let i = 0; i < node.childCount; i++) {
                maxCells = Math.max(maxCells, node.child(i).childCount);
            }
            for (let i = 0; i < maxCells; i++) {
                if (i > 0) {
                    state.write(" | ");
                }
                state.write(" ");
            }
        }
        state.renderContent(node);
    },
    table_row(state, node) {
        state.write("|");
        state.renderContent(node);
        const cell = node.firstChild;
        if (cell && cell.type.name == "table_header") {
            state.ensureNewLine();
            for (let i = 0; i < node.childCount; i++) {
                if (i == 0) {
                    state.write("|");
                }
                const cell = node.child(i);
                if (cell.attrs.align == "left"
                    || cell.attrs.align == "center") {
                    state.write(":");
                } else {
                    state.write(" ");
                }
                state.write("--");
                if (cell.attrs.align == "right"
                    || cell.attrs.align == "center") {
                    state.write(":");
                } else {
                    state.write(" ");
                }
                state.write("|");
            }
        }
    },
    table_cell(state, node) {
        state.write(" ");
        state.renderContent(node);
        state.write(" |");
    },
    table_header(state, node) {
        state.write(" ");
        state.renderContent(node);
        state.write(" |");
    },
    math_inline(state, node) {
        state.write("$");
        state.text(node.textContent, false);
        state.write("$");
        writeCommonAttributes(state, node);
        state.closeBlock(node);
    },
    math_block(state, node) {
        state.write("$$");
        state.text(node.textContent, false);
        state.ensureNewLine();
        state.write("$$");
        writeCommonAttributes(state, node);
        state.closeBlock(node);
    },
    container(state, node) {
        state.write(":::");
        let classes: string[] = [];
        if (node.attrs.className) {
            classes = (node.attrs.className as string).split(' ');
            state.write(classes[0]);
        }
        if (node.attrs.id
            || classes.length > 1
            || node.attrs.style) {
            state.write("{");
            if (node.attrs.id) {
                state.write("#");
                state.write(node.attrs.id);
            }
            for (let i = 1; i < classes.length; i++) {
                state.write(" ." + classes[i]);
            }
            if (node.attrs.style) {
                state.write(' style="' + node.attrs.style + '"');
            }
            state.write("}\n");
        }
        state.renderContent(node);
        state.ensureNewLine();
        state.write(":::");
        state.closeBlock(node);
    },

    image(state, node) {
        state.write("!["
            + state.esc(node.attrs.alt || "")
            + "]("
            + node.attrs.src
            + (node.attrs.title
                ? ' "' + node.attrs.title.replace(/"/g, '\\"') + '"'
                : "")
            + ")");
        writeCommonAttributes(state, node);
    },
    hard_break(state, node, parent, index) {
        for (let i = index + 1; i < parent.childCount; i++)
            if (parent.child(i).type != node.type) {
                state.write("\\\n");
                return;
            }
    },
    text(state, node) {
        if (node.text) {
            state.text(node.text);
        }
    }
}, {
    em: {
        open: "*",
        close(_state, mark) { return closeWithCommonAttributes(mark, "*") },
        mixable: true,
        expelEnclosingWhitespace: true
    },
    strong: {
        open: "**",
        close(_state, mark) { return closeWithCommonAttributes(mark, "**") },
        mixable: true,
        expelEnclosingWhitespace: true
    },
    link: {
        open(_state, mark, parent, index) { return isPlainURL(mark, parent, index, 1) ? "<" : "[" },
        close(_state, mark, parent, index) {
            return closeWithCommonAttributes(mark, isPlainURL(mark, parent, index, -1)
                ? ">"
                : "]("
                + mark.attrs.href
                + (mark.attrs.title
                    ? ' "' + mark.attrs.title.replace(/"/g, '\\"') + '"'
                    : "") + ")");
        }
    },
    code: {
        open(_state, _mark, parent, index) { return backticksFor(parent.child(index), -1) },
        close(_state, mark, parent, index) { return closeWithCommonAttributes(mark, backticksFor(parent.child(index - 1), 1)) },
        escape: false
    },
    ins: {
        open: "++",
        close(_state, mark) { return closeWithCommonAttributes(mark, "++") },
        mixable: true,
        expelEnclosingWhitespace: true
    },
    mark: {
        open: "==",
        close(_state, mark) { return closeWithCommonAttributes(mark, "==") },
        mixable: true,
        expelEnclosingWhitespace: true
    },
    strikethrough: {
        open: "~~",
        close(_state, mark) { return closeWithCommonAttributes(mark, "~~") },
        mixable: true,
        expelEnclosingWhitespace: true
    },
    sub: {
        open: "~",
        close(_state, mark) { return closeWithCommonAttributes(mark, "~") },
        mixable: true,
        expelEnclosingWhitespace: true
    },
    sup: {
        open: "^",
        close(_state, mark) { return closeWithCommonAttributes(mark, "^") },
        mixable: true,
        expelEnclosingWhitespace: true
    },
    span: {
        open: "::",
        close(_state, mark) { return closeWithCommonAttributes(mark, "::") },
        mixable: true,
        expelEnclosingWhitespace: true
    },
});

export const htmlCommands: CodeCommandSet = {};
htmlCommands[CommandType.Undo] = _ => codeUndo;
htmlCommands[CommandType.Redo] = _ => codeRedo;
for (let i = 0; i < 6; i++) {
    htmlCommands[(CommandType.Heading1 - i) as CommandType] = wrapCommand(`<h${i}>`, `</h${i}>`);
}
htmlCommands[CommandType.Paragraph] = standardWrapCommand("p");
htmlCommands[CommandType.BlockQuote] = standardWrapCommand("blockquote");
htmlCommands[CommandType.CodeBlock] = wrapCommand("<pre>\n<code>", "</code>\n</pre>");
htmlCommands[CommandType.Bold] = standardWrapCommand("strong");
htmlCommands[CommandType.Italic] = standardWrapCommand("em");
htmlCommands[CommandType.Strikethrough] = standardWrapCommand("del");
htmlCommands[CommandType.Subscript] = standardWrapCommand("sub");
htmlCommands[CommandType.Superscript] = standardWrapCommand("sup");
htmlCommands[CommandType.Inserted] = standardWrapCommand("ins");
htmlCommands[CommandType.Marked] = standardWrapCommand("mark");
htmlCommands[CommandType.CodeInline] = standardWrapCommand("code");
htmlCommands[CommandType.ForegroundColor] = params => {
    if (!params || !params.length) {
        return _ => false;
    }
    const color = params[0] as string | null;
    if (!color) {
        return _ => false;
    }
    return (target: {
        state: CodeEditorState;
        dispatch: (transaction: CodeTransaction) => void;
    }) => {
        const tag = `<span style="color:${color}">`;
        target.dispatch(target.state.update(target.state.changeByRange(range => ({
            range: EditorSelection.range(range.from + tag.length, range.to + tag.length),
            changes: [
                { from: range.from, insert: tag },
                { from: range.to, insert: "</span>" },
            ],
        }))));
        return true;
    }
};
htmlCommands[CommandType.BackgroundColor] = params => {
    if (!params || !params.length) {
        return _ => false;
    }
    const color = params[0] as string | null;
    if (!color) {
        return _ => false;
    }
    return (target: {
        state: CodeEditorState;
        dispatch: (transaction: CodeTransaction) => void;
    }) => {
        const tag = `<div style="background-color:${color}">\n`;
        target.dispatch(target.state.update(target.state.changeByRange(range => ({
            range: EditorSelection.range(range.from + tag.length, range.to + tag.length),
            changes: [
                { from: range.from, insert: tag },
                { from: range.to, insert: "\n</div>" },
            ],
        }))));
        return true;
    }
};
htmlCommands[CommandType.InsertImage] = params => {
    if (!params || !params.length) {
        return _ => false;
    }
    const src = params[0] as string | null;
    if (!src) {
        return _ => false;
    }
    let title: string | null = null;
    if (params.length > 1) {
        title = params[1];
    }
    let alt: string | null = null;
    if (params.length > 2 && params[2]) {
        alt = params[2];
    }
    return (target: {
        state: CodeEditorState;
        dispatch: (transaction: CodeTransaction) => void;
    }) => {
        let text = `<img src="${src}"`;
        if (title) {
            text += ` title=${title}`;
        }
        if (alt) {
            text += ` alt=${alt}`;
        }
        text += ">";
        target.dispatch(target.state.update(target.state.replaceSelection(text)));
        return true;
    }
};
htmlCommands[CommandType.InsertLink] = params => {
    if (!params || !params.length) {
        return _ => false;
    }
    const href = params[0] as string | null;
    if (!href) {
        return _ => false;
    }
    let title: string | null = null;
    if (params.length > 1) {
        title = params[1];
    }
    return (target: {
        state: CodeEditorState;
        dispatch: (transaction: CodeTransaction) => void;
    }) => {
        let tag = `<a href="${href}"`;
        if (title) {
            tag += ` title=${title}`;
        }
        tag += ">";
        target.dispatch(target.state.update(target.state.changeByRange(range => ({
            range: EditorSelection.range(range.from + tag.length, range.to + tag.length),
            changes: [
                { from: range.from, insert: tag },
                { from: range.to, insert: "</a>" },
            ],
        }))));
        return true;
    }
};
htmlCommands[CommandType.ListBullet] = wrapCommand("<ul>\n<li>", "</li>\n</ul>");
htmlCommands[CommandType.ListNumber] = wrapCommand("<ol>\n<li>", "</li>\n</ol>");
htmlCommands[CommandType.ListCheck] = wrapCommand('<ul>\n<li><input type="checkbox">', "</li>\n</ul>");
htmlCommands[CommandType.HorizontalRule] = _ => (target: {
    state: CodeEditorState;
    dispatch: (transaction: CodeTransaction) => void;
}) => {
    target.dispatch(target.state.update(target.state.replaceSelection("<hr>")));
    return true;
};

export const markdownCommands: CodeCommandSet = {};
markdownCommands[CommandType.Undo] = _ => codeUndo;
markdownCommands[CommandType.Redo] = _ => codeRedo;
for (let i = 0; i < 6; i++) {
    const tag = '\n' + '#'.repeat(i) + ' ';
    markdownCommands[(CommandType.Heading1 - i) as CommandType] = _ => (target: {
        state: CodeEditorState;
        dispatch: (transaction: CodeTransaction) => void;
    }) => {
        target.dispatch(target.state.update(target.state.changeByRange(range => ({
            range: EditorSelection.range(range.from + tag.length, range.to + tag.length),
            changes: [
                { from: range.from, insert: tag },
            ],
        }))));
        return true;
    };
}
markdownCommands[CommandType.Paragraph] = standardWrapMarkdownBlockCommand(":::");
markdownCommands[CommandType.BlockQuote] = prefixCommand("\n> ");
markdownCommands[CommandType.CodeBlock] = standardWrapMarkdownBlockCommand("```");
markdownCommands[CommandType.Bold] = standardWrapMarkdownCommand("**");
markdownCommands[CommandType.Italic] = standardWrapMarkdownCommand("*");
markdownCommands[CommandType.Strikethrough] = standardWrapMarkdownCommand("~~");
markdownCommands[CommandType.Subscript] = standardWrapMarkdownCommand("~");
markdownCommands[CommandType.Superscript] = standardWrapMarkdownCommand("^");
markdownCommands[CommandType.Inserted] = standardWrapMarkdownCommand("++");
markdownCommands[CommandType.Marked] = standardWrapMarkdownCommand("==");
markdownCommands[CommandType.CodeInline] = standardWrapMarkdownCommand("`");
markdownCommands[CommandType.ForegroundColor] = params => {
    if (!params || !params.length) {
        return _ => false;
    }
    const color = params[0] as string | null;
    if (!color) {
        return _ => false;
    }
    return (target: {
        state: CodeEditorState;
        dispatch: (transaction: CodeTransaction) => void;
    }) => {
        const tag = `<span style="color:${color}">`;
        target.dispatch(target.state.update(target.state.changeByRange(range => ({
            range: EditorSelection.range(range.from + tag.length, range.to + tag.length),
            changes: [
                { from: range.from, insert: tag },
                { from: range.to, insert: "</span>" },
            ],
        }))));
        return true;
    }
};
markdownCommands[CommandType.BackgroundColor] = params => {
    if (!params || !params.length) {
        return _ => false;
    }
    const color = params[0] as string | null;
    if (!color) {
        return _ => false;
    }
    return (target: {
        state: CodeEditorState;
        dispatch: (transaction: CodeTransaction) => void;
    }) => {
        const tag = `<div style="background-color:${color}">\n`;
        target.dispatch(target.state.update(target.state.changeByRange(range => ({
            range: EditorSelection.range(range.from + tag.length, range.to + tag.length),
            changes: [
                { from: range.from, insert: tag },
                { from: range.to, insert: "\n</div>" },
            ],
        }))));
        return true;
    }
};
markdownCommands[CommandType.InsertImage] = params => {
    if (!params || !params.length) {
        return _ => false;
    }
    const src = params[0] as string | null;
    if (!src) {
        return _ => false;
    }
    let title: string | null = null;
    if (params.length > 1) {
        title = params[1];
    }
    let alt: string | null = null;
    if (params.length > 2 && params[2]) {
        alt = params[2];
    }
    return (target: {
        state: CodeEditorState;
        dispatch: (transaction: CodeTransaction) => void;
    }) => {
        let text = "![";
        if (alt) {
            text += alt;
        }
        text += `](${src}`;
        if (title) {
            text += ` "${title.replace(/"/g, '\\"')}"`;
        }
        text += ")";
        target.dispatch(target.state.update(target.state.replaceSelection(text)));
        return true;
    }
};
markdownCommands[CommandType.InsertLink] = params => {
    if (!params || !params.length) {
        return _ => false;
    }
    const href = params[0] as string | null;
    if (!href) {
        return _ => false;
    }
    let title: string | null = null;
    if (params.length > 1) {
        title = params[1];
    }
    return (target: {
        state: CodeEditorState;
        dispatch: (transaction: CodeTransaction) => void;
    }) => {
        let text = `](${href}`;
        if (title) {
            text += ` "${title.replace(/"/g, '\\"')}"`;
        }
        text += ")";
        target.dispatch(target.state.update(target.state.changeByRange(range => ({
            range: EditorSelection.range(range.from + 1, range.to + 1),
            changes: [
                { from: range.from, insert: "[" },
                { from: range.to, insert: "</a>" },
            ],
        }))));
        return true;
    }
};
markdownCommands[CommandType.ListBullet] = prefixCommand("\n* ");
markdownCommands[CommandType.ListNumber] = prefixCommand("\n1. ");
markdownCommands[CommandType.ListCheck] = prefixCommand("\n* [ ] ");
markdownCommands[CommandType.HorizontalRule] = _ => (target: {
    state: CodeEditorState;
    dispatch: (transaction: CodeTransaction) => void;
}) => {
    target.dispatch(target.state.update(target.state.replaceSelection("\n---\n")));
    return true;
};

export const htmlPMCommands: CommandSet = {};

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
    commands[CommandType.Bold] = markMenuItem(schema.marks.strong);
    commands[CommandType.Italic] = markMenuItem(schema.marks.em);
    commands[CommandType.Strikethrough] = markMenuItem(schema.marks.strikethrough);
    commands[CommandType.Subscript] = markMenuItem(schema.marks.sub);
    commands[CommandType.Superscript] = markMenuItem(schema.marks.sup);
    commands[CommandType.Inserted] = markMenuItem(schema.marks.ins);
    commands[CommandType.Marked] = markMenuItem(schema.marks.mark);
    commands[CommandType.CodeInline] = markMenuItem(schema.marks.code);
    commands[CommandType.ForegroundColor] = {
        command(state, dispatch, _, params) {
            if (!toggleMark(schema.marks.span, { style: "color:placeholder" })(state, undefined)) {
                return false;
            }

            if (dispatch) {
                if (!params || !params.length) {
                    return true;
                }
                const color = params[0] as string | null;
                if (color) {
                    toggleMark(schema.marks.span, { style: `color:${color}` })(state, dispatch);
                }
            }
            return true;
        }
    };
    commands[CommandType.BackgroundColor] = {
        command(state, dispatch, _, params) {
            if (!wrapIn(schema.nodes.container, { style: "background-color:placeholder" })(state, undefined)) {
                return false;
            }

            if (dispatch) {
                if (!params || !params.length) {
                    return true;
                }
                const color = params[0] as string | null;
                if (color) {
                    wrapIn(schema.nodes.container, { style: `background-color:${color}` })(state, dispatch);
                }
            }
            return true;
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
        }
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
    commands[CommandType.TableColumnAlignLeft] = { command: setColumnAlign('left') }
    commands[CommandType.TableColumnAlignCenter] = { command: setColumnAlign('center') }
    commands[CommandType.TableColumnAlignRight] = { command: setColumnAlign('right') }
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
    }
    return commands;
}

function backticksFor(node: PMNode, side: number) {
    const ticks = /`+/g;
    let m: RegExpExecArray | null;
    let len = 0;
    if (node.isText && node.text) {
        while (m = ticks.exec(node.text)) {
            len = Math.max(len, m[0].length);
        }
    }
    let result = len > 0 && side > 0
        ? " `"
        : "`";
    for (let i = 0; i < len; i++) {
        result += "`";
    }
    if (len > 0 && side < 0) {
        result += " ";
    }
    return result;
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

function closeWithCommonAttributes(mark: Mark, close: string) {
    let value = close;
    let classes: string[] = [];
    if (mark.attrs.className) {
        classes = (mark.attrs.className as string).split(' ');
    }
    if (mark.attrs.id
        || classes.length
        || mark.attrs.style) {
        value += "{";
        if (mark.attrs.id) {
            value += "#" + mark.attrs.id;
        }
        if (classes.length) {
            for (let i = 0; i < classes.length; i++) {
                value += " ." + classes[i];
            }
        }
        if (mark.attrs.style) {
            value += ' style="' + mark.attrs.style + '"';
        }
        value += "}";
    }
    return value;
}

function isMarkActive(state: EditorState, type: MarkType) {
    const { from, $from, to, empty } = state.selection;
    if (empty) {
        return !!type.isInSet(state.storedMarks || $from.marks());
    } else {
        return state.doc.rangeHasMark(from, to, type);
    }
}

function isPlainURL(link: Mark, parent: Fragment, index: number, side: number) {
    if (link.attrs.title || !/^\w+:/.test(link.attrs.href)) {
        return false;
    }
    const content = parent.child(index + (side < 0 ? -1 : 0));
    if (!content.isText || content.text != link.attrs.href || content.marks[content.marks.length - 1] != link) {
        return false;
    }
    if (index == (side < 0 ? 1 : parent.childCount - 1)) {
        return true;
    }
    const next = parent.child(index + (side < 0 ? -2 : 1));
    return !link.isInSet(next.marks);
}

function markMenuItem(type: MarkType): CommandInfo {
    return {
        command: toggleMark(type),
        isActive(state, type) { return isMarkActive(state, type) },
        markType: type,
    }
}

function prefixCommand(text: string) {
    return (_params?: any[]) => (target: {
        state: CodeEditorState;
        dispatch: (transaction: CodeTransaction) => void;
    }) => {
        target.dispatch(target.state.update(target.state.changeByRange(range => ({
            range: EditorSelection.range(range.from + text.length, range.to + text.length),
            changes: [
                { from: range.from, insert: text },
            ],
        }))));
        return true;
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

function standardWrapCommand(tag: string) {
    return wrapCommand(`<${tag}>`, `</${tag}>`);
}

function standardWrapMarkdownBlockCommand(tag: string, info?: string) {
    return wrapCommand(`\n ${tag}` + (info ? ` ${info}` : ''), "\n" + tag);
}

function standardWrapMarkdownCommand(tag: string) {
    return wrapCommand(tag, tag);
}

function wrapCommand(tag: string, closeTag: string) {
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

function writeCommonAttributes<S extends Schema = any>(
    state: MarkdownSerializerState<S>,
    node: PMNode<S>,
    newline: boolean = false) {
    let classes: string[] = [];
    if (node.attrs.className) {
        classes = (node.attrs.className as string).split(' ');
    }
    if (node.attrs.id
        || classes.length > 1
        || node.attrs.style) {
        state.write("{");
        if (node.attrs.id) {
            state.write("#");
            state.write(node.attrs.id);
        }
        for (let i = 0; i < classes.length; i++) {
            state.write(" ." + classes[i]);
        }
        if (node.attrs.style) {
            state.write(' style="' + node.attrs.style + '"');
        }
        if (newline) {
            state.write("}\n");
        } else {
            state.write("}");
        }
    }
}
