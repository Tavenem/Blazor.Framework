import MarkdownIt from 'markdown-it';
import Token from 'markdown-it/lib/token';
import attributes from 'markdown-it-attrs';
import container_plugin from 'markdown-it-container';
import ins_plugin from 'markdown-it-ins';
import span_plugin from 'markdown-it-span';
import sub_plugin from 'markdown-it-sub';
import sup_plugin from 'markdown-it-sup';
import task_list_plugin from 'markdown-it-task-lists';
import { EditorSelection, EditorState, Transaction, StateCommand } from '@codemirror/state';
import { undo, redo } from '@codemirror/commands';
import { Schema, ProsemirrorNode, Mark, MarkType, Fragment, TextNode, NodeType } from 'prosemirror-model';
import { MarkdownSerializer, MarkdownSerializerState } from 'prosemirror-markdown';
import {
    CodeCommandSet,
    CommandType,
    htmlWrapCommand,
    markdownSchema,
    ParamStateCommand,
    wrapCommand
} from './_schemas';

export const markdownCommands: CodeCommandSet = {};
markdownCommands[CommandType.Undo] = _ => undo;
markdownCommands[CommandType.Redo] = _ => redo;
for (let i = 0; i < 6; i++) {
    const tag = '\n' + '#'.repeat(i) + ' ';
    markdownCommands[(CommandType.Heading1 - i) as CommandType] = _ => (target: {
        state: EditorState;
        dispatch: (transaction: Transaction) => void;
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
markdownCommands[CommandType.Paragraph] = wrapCommand("\n", "\n");
markdownCommands[CommandType.BlockQuote] = prefixCommand("\n> ");
markdownCommands[CommandType.CodeBlock] = standardWrapMarkdownBlockCommand("```");
markdownCommands[CommandType.Strong] = standardWrapMarkdownCommand("**");
markdownCommands[CommandType.Bold] = standardWrapMarkdownCommand("__");
markdownCommands[CommandType.Emphasis] = standardWrapMarkdownCommand("*");
markdownCommands[CommandType.Italic] = standardWrapMarkdownCommand("_");
markdownCommands[CommandType.Underline] = htmlWrapCommand("u");
markdownCommands[CommandType.Strikethrough] = standardWrapMarkdownCommand("~~");
markdownCommands[CommandType.Small] = htmlWrapCommand("small");
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
        state: EditorState;
        dispatch: (transaction: Transaction) => void;
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
        state: EditorState;
        dispatch: (transaction: Transaction) => void;
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
        state: EditorState;
        dispatch: (transaction: Transaction) => void;
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
        state: EditorState;
        dispatch: (transaction: Transaction) => void;
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
markdownCommands[CommandType.InsertTable] = _ => (target: {
    state: EditorState;
    dispatch: (transaction: Transaction) => void;
}) => {
    target.dispatch(target.state.update(target.state.replaceSelection("\n|     |     |\n| --- | --- |\n|     |     |\n")));
    return true;
};
markdownCommands[CommandType.HorizontalRule] = _ => (target: {
    state: EditorState;
    dispatch: (transaction: Transaction) => void;
}) => {
    target.dispatch(target.state.update(target.state.replaceSelection("\n---\n")));
    return true;
};
markdownCommands[CommandType.SetFontFamily] = setInlineStyleCommand('font-family');
markdownCommands[CommandType.SetFontSize] = setInlineStyleCommand('font-size');
markdownCommands[CommandType.SetLineHeight] = setInlineStyleCommand('line-height');
markdownCommands[CommandType.AlignLeft] = setStyleCommand('text-align', 'left');
markdownCommands[CommandType.AlignCenter] = setStyleCommand('text-align', 'center');
markdownCommands[CommandType.AlignRight] = setStyleCommand('text-align', 'right');
markdownCommands[CommandType.PageBreak] = setStyleCommand('page-break-after', 'always');

interface TokenConfig {
    /**
     * This token maps to a single node, whose type can be looked up in the schema under the given
     * name. Exactly one of `node`, `block`, `mark`, or `getMark` must be set.
     */
    node?: string | undefined;

    /**
     * This token comes in `_open` and `_close` variants (which are appended to the base token name
     * provides a the object property), and wraps a block of content. The block should be wrapped in
     * a node of the type named to by the property's value. Exactly one of `node`, `block`, `mark`,
     * or `getMark` must be set.
     */
    block?: string | undefined;

    /**
     * This token also comes in `_open` and `_close` variants, but should add a mark (named by the
     * value) to its content, rather than wrapping it in a node. Exactly one of `node`, `block`,
     * `mark`, or `getMark` must be set.
     */
    mark?: string | undefined;

    /**
     * This token also comes in `_open` and `_close` variants, but should add a mark (determined by
     * the function) to its content, rather than wrapping it in a node. Exactly one of `node`,
     * `block`, `mark`, or `getMark` must be set.
     */
    getMark?(token: Token): string;

    /**
     * A function used to compute the attributes for the node or mark that takes a [markdown-it
     * token](https://markdown-it.github.io/markdown-it/#Token) and returns an attribute object.
     */
    getAttrs?(token: Token, tokens: Token[], i: number): Record<string, any>;

    /**
     * When true, ignore content for the matched token.
     */
    ignore?: boolean | undefined;

    /**
     * Indicates that the [markdown-it token](https://markdown-it.github.io/markdown-it/#Token) has
     * no `_open` or `_close` for the nodes. This defaults to true for `code_inline`, `code_block`
     * and `fence`.
     */
    noCloseToken?: boolean | undefined;

    /**
     * CSS class to leave out of attrs.
     */
    ignoreClass?: string | undefined;

    /**
     * CSS class prefix to leave out of attrs.
     */
    ignoreClassStartsWith?: string | undefined;
}
class MarkdownParseState<N extends string = any, M extends string = any> {
    marks: Mark<Schema<N, M>>[];
    schema: Schema<N, M>;
    stack: {
        type: NodeType<Schema<N, M>>,
        attrs?: { [key: string]: any },
        content: Array<ProsemirrorNode<Schema<N, M>>>,
    }[];
    tokenHandlers: Record<string, (state: MarkdownParseState<N, M>, token: Token, tokens: Token[], i: number) => void>;

    constructor(
        schema: Schema,
        tokenHandlers: Record<string, (state: MarkdownParseState<N, M>, token: Token, tokens: Token[], i: number) => void>) {
        this.schema = schema;
        this.stack = [{ type: schema.topNodeType, content: [] }];
        this.marks = Mark.none;
        this.tokenHandlers = tokenHandlers;
    }

    addNode(
        type: NodeType<Schema<N, M>>,
        attrs?: { [key: string]: any },
        content?: Fragment<Schema<N, M>> | ProsemirrorNode<Schema<N, M>> | Array<ProsemirrorNode<Schema<N, M>>>) {
        const node = type.createAndFill(attrs, content, this.marks);
        if (!node) {
            return null;
        }
        this.push(node);
        return node;
    }

    addText(text: string) {
        if (!text) {
            return;
        }
        const nodes = this.top().content;
        const last = nodes[nodes.length - 1];
        const node = this.schema.text(text, this.marks);
        let merged: TextNode<Schema<N, M>> | undefined;
        if (last && (merged = maybeMerge(last, node))) {
            nodes[nodes.length - 1] = merged;
        } else {
            nodes.push(node);
        }
    }

    closeMark(mark: MarkType<Schema<N, M>>) {
        this.marks = mark.removeFromSet(this.marks);
    }

    closeNode() {
        if (this.marks.length) {
            this.marks = Mark.none;
        }
        const info = this.stack.pop();
        if (!info) {
            return null;
        }
        return this.addNode(info.type, info.attrs, info.content);
    }

    openMark(mark: Mark<Schema<N, M>>) {
        this.marks = mark.addToSet(this.marks);
    }

    openNode(type: NodeType<Schema<N, M>>, attrs?: { [key: string]: any }) {
        this.stack.push({ type: type, attrs: attrs, content: [] });
    }

    parseTokens(tokens: Token[] | null) {
        if (!tokens) {
            return;
        }
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];

            const handler = this.tokenHandlers[token.type];
            if (handler) {
                handler(this, token, tokens, i);
                continue;
            }

            const attrs = {
                id: token.attrGet("id") || null,
                className: token.attrGet("class") || null,
                style: token.attrGet("style") || null,
            };

            const isOpen = token.type.endsWith("_open");
            const isClose = !isOpen && token.type.endsWith("_close");
            const type = isOpen
                ? token.type.substring(0, token.type.length - 5)
                : isClose
                    ? token.type.substring(0, token.type.length - 6)
                    : token.type;

            const nodeType = this.schema.nodeType(type);
            if (nodeType) {
                if (isOpen) {
                    this.openNode(nodeType, attrs);
                } else if (isClose) {
                    this.closeNode();
                } else {
                    if (token.content && token.content.length) {
                        this.openNode(nodeType, attrs);
                        this.addText(withoutTrailingNewline(token.content));
                        this.closeNode();
                    } else {
                        this.addNode(nodeType, attrs);
                    }
                }
            } else {
                const markType = this.schema.marks[type];
                if (markType) {
                    if (isOpen) {
                        this.openMark(markType.create(attrs));
                    } else if (isClose) {
                        this.closeMark(markType);
                    } else {
                        this.openMark(markType.create(attrs));
                        this.addText(withoutTrailingNewline(token.content));
                        this.closeMark(markType);
                    }
                } else {
                    throw new Error(`Token type "${token.type}" not supported by schema`);
                }
            }
        }
    }

    private push(elt: ProsemirrorNode<Schema<N, M>>) {
        if (this.stack.length) {
            this.top().content.push(elt);
        }
    }

    private top() { return this.stack[this.stack.length - 1] }
}

class MarkdownParser<N extends string = any, M extends string = any> {
    tokens: { [key: string]: TokenConfig };
    schema: Schema<N, M>;
    tokenizer: MarkdownIt;
    tokenHandlers: Record<string, (state: MarkdownParseState<N, M>, token: Token, tokens: Token[], i: number) => void>;

    constructor(schema: Schema<N, M>, tokenizer: MarkdownIt, tokens: { [key: string]: TokenConfig }) {
        this.tokens = tokens
        this.schema = schema
        this.tokenizer = tokenizer
        this.tokenHandlers = tokenHandlers(schema, tokens)
    }

    parse(text: string) {
        const state = new MarkdownParseState(this.schema, this.tokenHandlers);
        let doc: ProsemirrorNode<Schema<N, M>> | null | undefined;
        state.parseTokens(this.tokenizer.parse(text, {}));
        do {
            doc = state.closeNode();
        } while (state.stack.length);
        return doc || (this.schema.topNodeType.createAndFill() as ProsemirrorNode<Schema<N, M>>);
    }
}

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
        task_list_item: {
            block: "task_list_item",
                getAttrs: token => ({
                    complete: token.children
                        && token.children[0]
                        && token.children[0].attrGet("checked") == "checked"
                })
        },
        ordered_list: {
            block: "ordered_list",
            getAttrs: token => ({ order: +(token.attrGet("start") || 1) || 1 })
        },
        heading: {
            block: "heading",
            getAttrs: token => ({ level: +token.tag.slice(1) })
        },
        code_block: { block: "code_block", noCloseToken: true },
        fence: {
            block: "code_block",
            getAttrs: token => {
                let syntax: string | null = token.info;
                if (!syntax || !syntax.length) {
                    const classes = (token.attrGet("class") || "").split(" ");
                    if (classes && classes.length) {
                        syntax = classes.find(x => x.startsWith("language-")) || null;
                    }
                }
                return { syntax };
            },
            noCloseToken: true,
            ignoreClassStartsWith: "language-"
        },
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
            ignoreClass: "math-node"
        },
        math_block: {
            block: "math_display",
            noCloseToken: true,
            ignoreClass: "math-node"
        },

        hr: { node: "horizontal_rule" },
        image: {
            node: "image",
            getAttrs: token => ({
                src: token.attrGet("src"),
                title: token.attrGet("title") || null,
                alt: token.children && token.children[0] && token.children[0].content || null
            })
        },
        hardbreak: { node: "hard_break" },

        em: {
            getMark(token) {
                if (token.markup === '_') {
                    return "italic";
                } else {
                    return "em";
                }
            },
        },
        strong: {
            getMark(token) {
                if (token.markup === '__') {
                    return "bold";
                } else {
                    return "strong";
                }
            },
        },
        link: {
            mark: "link",
            getAttrs: token => ({
                href: token.attrGet("href"),
                title: token.attrGet("title") || null,
            })
        },
        code_inline: { mark: "code", noCloseToken: true },
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
    italic: {
        open: "_",
        close(_state, mark) { return closeWithCommonAttributes(mark, "_") },
        mixable: true,
        expelEnclosingWhitespace: true
    },
    strong: {
        open: "**",
        close(_state, mark) { return closeWithCommonAttributes(mark, "**") },
        mixable: true,
        expelEnclosingWhitespace: true
    },
    bold: {
        open: "__",
        close(_state, mark) { return closeWithCommonAttributes(mark, "__") },
        mixable: true,
        expelEnclosingWhitespace: true
    },
    underline: {
        open: "<u>",
        close(_state, mark) { return closeWithCommonAttributes(mark, "</u>") },
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

function attrs(config: TokenConfig, token: Token, tokens: Token[], i: number) {
    let attrs: Record<string, any>;
    if (config.getAttrs) {
        attrs = config.getAttrs(token, tokens, i);
    } else {
        attrs = {};
    }

    attrs.id = token.attrGet("id") || null;
    attrs.className = (config.ignoreClass
        ? (token.attrGet("class") || null)?.split(" ").filter(x => x != config.ignoreClass).join(" ")
        : token.attrGet("class")) || null;
    if (config.ignoreClassStartsWith) {
        attrs.className = (attrs.className as string | null)?.split(" ").filter(x => !x.startsWith(config.ignoreClassStartsWith!)).join(" ") || null;
    }
    attrs.style = token.attrGet("style") || null;

    return attrs;
}

function backticksFor(node: ProsemirrorNode, side: number) {
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

function maybeMerge<S extends Schema = any>(a: ProsemirrorNode<S>, b: ProsemirrorNode<S>) {
    if (a.isText && b.isText && Mark.sameSet(a.marks, b.marks)) {
        return (a as TextNode<S>).withText(a.text! + b.text);
    }
}

function noCloseToken(config: TokenConfig, type: string) {
    return config.noCloseToken || type == "code_inline" || type == "code_block" || type == "fence";
}

function noOp() { }

function prefixCommand(text: string) {
    return (_params?: any[]) => (target: {
        state: EditorState;
        dispatch: (transaction: Transaction) => void;
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

function setInlineStyleCommand(style: string, value?: string): ParamStateCommand {
    return (params: any[] | undefined): StateCommand => {
        if (!value && (!params || !params.length)) {
            return _ => false;
        }
        return (target: {
            state: EditorState;
            dispatch: (transaction: Transaction) => void;
        }) => {
            target.dispatch(target.state.update(target.state.changeByRange(range => ({
                range: EditorSelection.range(range.from + 3, range.to + 3),
                changes: [
                    { from: range.from, insert: ' ::' },
                    { from: range.to, insert: `::{${style}=${value || params![0]}} ` },
                ],
            }))));
            return true;
        };
    }
}

function setStyleCommand(style: string, value?: string): ParamStateCommand {
    return (params: any[] | undefined): StateCommand => {
        if (!value && (!params || !params.length)) {
            return _ => false;
        }
        const tag = `\n::: {${style}=${value || params![0]}}\n`;
        return (target: {
            state: EditorState;
            dispatch: (transaction: Transaction) => void;
        }) => {
            target.dispatch(target.state.update(target.state.changeByRange(range => ({
                range: EditorSelection.range(range.from + tag.length, range.to + tag.length),
                changes: [
                    { from: range.from, insert: tag },
                    { from: range.to, insert: "\n:::\n" },
                ],
            }))));
            return true;
        };
    }
}

function standardWrapMarkdownBlockCommand(tag: string, info?: string) {
    return wrapCommand(`\n${tag}${(info ? ` ${info}` : '')}\n`, `\n${tag}\n`);
}

function standardWrapMarkdownCommand(tag: string) {
    return wrapCommand(" " + tag, tag + " ");
}

function tokenHandlers<N extends string = any, M extends string = any>(
    schema: Schema<N, M>,
    tokenConfigs: { [key: string]: TokenConfig }) {
    const handlers: Record<string, (state: MarkdownParseState<N, M>, token: Token, tokens: Token[], i: number) => void> = Object.create(null);
    for (const type in tokenConfigs) {
        const config = tokenConfigs[type];
        if (config.block) {
            const nodeType = schema.nodeType(config.block);
            if (noCloseToken(config, type)) {
                handlers[type] = (state, token, tokens, i) => {
                    state.openNode(nodeType, attrs(config, token, tokens, i));
                    state.addText(withoutTrailingNewline(token.content));
                    state.closeNode();
                }
            } else {
                handlers[type + "_open"] = (state, token, tokens, i) => state.openNode(nodeType, attrs(config, token, tokens, i));
                handlers[type + "_close"] = state => state.closeNode();
            }
        } else if (config.node) {
            const nodeType = schema.nodeType(config.node);
            handlers[type] = (state, token, tokens, i) => state.addNode(nodeType, attrs(config, token, tokens, i));
        } else if (config.mark) {
            const markType = schema.marks[config.mark];
            if (noCloseToken(config, type)) {
                handlers[type] = (state, token, tokens, i) => {
                    state.openMark(markType.create(attrs(config, token, tokens, i)));
                    state.addText(withoutTrailingNewline(token.content));
                    state.closeMark(markType);
                }
            } else {
                handlers[type + "_open"] = (state, token, tokens, i) => state.openMark(markType.create(attrs(config, token, tokens, i)));
                handlers[type + "_close"] = state => state.closeMark(markType);
            }
        } else if (config.getMark) {
            if (noCloseToken(config, type)) {
                handlers[type] = (state, token, tokens, i) => {
                    const mark = config.getMark!(token);
                    const markType = schema.marks[mark];
                    state.openMark(markType.create(attrs(config, token, tokens, i)));
                    state.addText(withoutTrailingNewline(token.content));
                    state.closeMark(markType);
                }
            } else {
                handlers[type + "_open"] = (state, token, tokens, i) => {
                    const mark = config.getMark!(token);
                    const markType = schema.marks[mark];
                    state.openMark(markType.create(attrs(config, token, tokens, i)));
                }
                handlers[type + "_close"] = (state, token) => {
                    const mark = config.getMark!(token);
                    const markType = schema.marks[mark];
                    state.closeMark(markType);
                }
            }
        } else if (config.ignore) {
            if (noCloseToken(config, type)) {
                handlers[type] = noOp;
            } else {
                handlers[type + "_open"] = noOp;
                handlers[type + "_close"] = noOp;
            }
        } else {
            throw new RangeError("Unrecognized parsing config " + JSON.stringify(config));
        }
    }

    handlers.text = (state, tok) => state.addText(tok.content);
    handlers.inline = (state, tok) => state.parseTokens(tok.children);
    handlers.softbreak = handlers.softbreak || (state => state.addText("\n"));

    return handlers;
}

function withoutTrailingNewline(str: string) {
    return str[str.length - 1] == "\n"
        ? str.slice(0, str.length - 1)
        : str;
}

function writeCommonAttributes<S extends Schema = any>(
    state: MarkdownSerializerState<S>,
    node: ProsemirrorNode<S>,
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
