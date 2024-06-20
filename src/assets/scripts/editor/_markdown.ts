import MarkdownIt from 'markdown-it';
import Renderer from 'markdown-it/lib/renderer.mjs';
import StateBlock from 'markdown-it/lib/rules_block/state_block.mjs';
import StateInline, { Delimiter } from 'markdown-it/lib/rules_inline/state_inline.mjs';
import Token from 'markdown-it/lib/token.mjs';
import attributes from 'markdown-it-attrs';
import deflist_plugin from 'markdown-it-deflist';
import ins_plugin from 'markdown-it-ins';
import mark_plugin from 'markdown-it-mark';
import sub_plugin from 'markdown-it-sub';
import sup_plugin from 'markdown-it-sup';
import task_list_plugin from 'markdown-it-task-lists';
import { EditorSelection, EditorState, Transaction, StateCommand } from '@codemirror/state';
import { undo, redo } from '@codemirror/commands';
import {
    Schema,
    Node as ProsemirrorNode,
    Mark,
    MarkType,
    Fragment,
    NodeType
} from 'prosemirror-model';
import { renderer, schema } from './_schema';
import {
    CodeCommandSet,
    CommandType,
    htmlWrapCommand,
    ParamStateCommand,
    wrapCommand,
} from './_commands';

declare class TextNode extends ProsemirrorNode {
    /**
    This contains the node's text content.
    */
    readonly text: string;

    /**
    Get all text between positions `from` and `to`.
    */
    textBetween(from: number, to: number): string;

    /**
    Create a copy of this node, with the given set of marks instead
    of the node's own marks.
    */
    mark(marks: readonly Mark[]): TextNode;

    withText(text: string): TextNode;

    /**
    Create a copy of this node with only the content between the
    given positions. If `to` is not given, it defaults to the end of
    the node.
    */
    cut(from: number, to?: number): TextNode;
}

export const markdownCommands: CodeCommandSet = {};
markdownCommands[CommandType.Undo] = _ => undo;
markdownCommands[CommandType.Redo] = _ => redo;
markdownCommands[CommandType.Heading] = params => {
    let level = 1;
    if (params && params.length) {
        const i = Number.parseInt(params[0]);
        if (i >= 1) {
            level = i;
        }
    }
    const tag = '\n' + '#'.repeat(level) + ' ';
    return (target: {
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
    }
};
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

        if (target.state.selection.ranges.some(x => !x.empty)) {
            target.dispatch(target.state.update(target.state.changeByRange(range => ({
                range: EditorSelection.range(range.from + 1, range.to + 1),
                changes: [
                    { from: range.from, insert: "[" },
                    { from: range.to, insert: text },
                ],
            }))));
        } else {
            target.dispatch(target.state.update(target.state.replaceSelection("[" + (title || href) + text)));
        }
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
markdownCommands[CommandType.Emoji] = params => (target: {
    state: EditorState;
    dispatch: (transaction: Transaction) => void;
}) => {
    target.dispatch(target.state.update(target.state.replaceSelection(params && params.length && params[0] && params[0].length ? params[0] : '')));
    return true;
};

const container_plugin = function (md: MarkdownIt) {
    const min_markers = 3,
          marker_char = 0x3A/* : */;

    function renderDefault(tokens: Token[], idx: number, options: MarkdownIt.Options, _env: any, self: Renderer) {
        // add a class to the opening tag
        if (tokens[idx].nesting === 1) {
            const className = tokens[idx].info.split(' ', 2)[0];
            if (className) {
                tokens[idx].attrJoin('class', className);
            }
        }

        return self.renderToken(tokens, idx, options);
    }

    function container(state: StateBlock, startLine: number, endLine: number, silent: boolean) {
        let start = state.bMarks[startLine] + state.tShift[startLine];

        if (marker_char !== state.src.charCodeAt(start)) {
            return false;
        }

        let pos, marker_count, max = state.eMarks[startLine];

        // Check out the rest of the marker string
        for (pos = start + 1; pos <= max; pos++) {
            if (marker_char !== state.src.charCodeAt(pos)) {
                break;
            }
        }

        marker_count = Math.floor(pos - start);
        if (marker_count < min_markers) {
            return false;
        }
        pos -= pos - start;

        let nextLine, markup, params, token,
            old_parent, old_line_max,
            auto_closed = false;

        markup = state.src.slice(start, pos);
        params = state.src.slice(pos, max);

        // Since start is found, we can report success here in validation mode
        if (silent) { return true; }

        // Search for the end of the block
        nextLine = startLine;

        for (;;) {
            nextLine++;
            if (nextLine >= endLine) {
                // unclosed block should be autoclosed by end of document.
                // also block seems to be autoclosed by end of parent
                break;
            }

            start = state.bMarks[nextLine] + state.tShift[nextLine];
            max = state.eMarks[nextLine];

            if (start < max && state.sCount[nextLine] < state.blkIndent) {
                // non-empty line with negative indent ends
                break;
            }

            if (marker_char !== state.src.charCodeAt(start)) {
                continue;
            }

            if (state.sCount[nextLine] - state.blkIndent >= 4) {
                // closing fence should be indented less than 4 spaces
                continue;
            }

            for (pos = start + 1; pos <= max; pos++) {
                if (marker_char !== state.src.charCodeAt(pos)) {
                    break;
                }
            }

            // closing code fence must be at least as long as the opening one
            if (Math.floor(pos - start) < marker_count) {
                continue;
            }

            // make sure tail has spaces only
            pos = state.skipSpaces(pos);

            if (pos < max) {
                continue;
            }

            pos -= pos - start;

            // found!
            auto_closed = true;
            break;
        }

        old_parent = state.parentType;
        old_line_max = state.lineMax;
        (state.parentType as string) = 'container';

        // this will prevent lazy continuations from ever going past our end marker
        state.lineMax = nextLine;

        token = state.push('container_open', 'div', 1);
        token.markup = markup;
        token.block = true;
        token.info = params;
        token.map = [startLine, nextLine];

        state.md.block.tokenize(state, startLine + 1, nextLine);

        token = state.push('container_close', 'div', -1);
        token.markup = state.src.slice(start, pos);
        token.block = true;

        state.parentType = old_parent;
        state.lineMax = old_line_max;
        state.line = nextLine + (auto_closed ? 1 : 0);

        return true;
    }

    md.block.ruler.before('fence', 'container', container, {
        alt: ['paragraph', 'reference', 'blockquote', 'list']
    });
    md.renderer.rules['container_open'] = renderDefault;
    md.renderer.rules['container_close'] = renderDefault;
};

const span_plugin = function (md: MarkdownIt) {
    // Insert each marker as a separate text token, and add it to delimiter list
    function tokenize(state: StateInline, silent: boolean) {
        if (silent) { return false; }

        let i, scanned, token, len, ch,
            start = state.pos,
            marker = state.src.charCodeAt(start);

        if (marker !== 0x3A/* : */) {
            return false;
        }

        scanned = state.scanDelims(state.pos, true);
        len = scanned.length;
        ch = String.fromCharCode(marker);

        if (len < 2) {
            return false;
        }

        if (len % 2) {
            token = state.push('text', '', 0);
            token.content = ch;
            len--;
        }

        for (i = 0; i < len; i += 2) {
            token = state.push('text', '', 0);
            token.content = ch + ch;

            if (!scanned.can_open && !scanned.can_close) {
                continue;
            }

            state.delimiters.push({
                marker: marker,
                length: 0,   // disable "rule of 3" length checks meant for emphasis
                jump: i / 2, // 1 delimiter = 2 characters
                token: state.tokens.length - 1,
                end: -1,
                open: scanned.can_open,
                close: scanned.can_close
            });
        }

        state.pos += scanned.length;

        return true;
    }

    // Walk through delimiter list and replace text tokens with tags
    function postProcess(state: StateInline, delimiters: Delimiter[]) {
        let i: number, j,
            startDelim,
            endDelim,
            token,
            loneMarkers = [],
            max = delimiters.length;

        let any = false;
        for (i = 0; i < max; i++) {
            startDelim = delimiters[i];

            if (startDelim.marker !== 0x3A/* : */) {
                continue;
            }

            if (startDelim.end === -1) {
                continue;
            }

            any = true;

            endDelim = delimiters[startDelim.end];

            token = state.tokens[startDelim.token];
            token.type = 'span_open';
            token.tag = 'span';
            token.nesting = 1;
            token.markup = '::';
            token.content = '';

            token = state.tokens[endDelim.token];
            token.type = 'span_close';
            token.tag = 'span';
            token.nesting = -1;
            token.markup = '::';
            token.content = '';

            if (state.tokens[endDelim.token - 1].type === 'text' &&
                state.tokens[endDelim.token - 1].content === ':') {

                loneMarkers.push(endDelim.token - 1);
            }
        }

        // If a marker sequence has an odd number of characters, it's splitted
        // like this: `~~~~~` -> `~` + `~~` + `~~`, leaving one marker at the
        // start of the sequence.
        //
        // So, we have to move all those markers after subsequent s_close tags.
        //
        while (loneMarkers.length) {
            i = loneMarkers.pop()!;
            j = i + 1;

            while (j < state.tokens.length && state.tokens[j].type === 'span_close') {
                j++;
            }

            j--;

            if (i !== j) {
                token = state.tokens[j];
                state.tokens[j] = state.tokens[i];
                state.tokens[i] = token;
            }
        }

        return any;
    }

    md.inline.ruler.before('emphasis', 'span', tokenize);
    md.inline.ruler2.before('emphasis', 'span', function (state) {
        var curr,
            tokens_meta = state.tokens_meta,
            max = (state.tokens_meta || []).length;

        let any = postProcess(state, state.delimiters);

        for (curr = 0; curr < max; curr++) {
            if (tokens_meta[curr] && tokens_meta[curr]!.delimiters) {
                any = any || postProcess(state, tokens_meta[curr]!.delimiters);
            }
        }

        return any;
    });
};

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
class MarkdownParseState {
    marks: readonly Mark[];
    stack: {
        type: NodeType,
        attrs?: { [key: string]: any },
        content: Array<ProsemirrorNode>,
    }[];

    constructor(
        public schema: Schema,
        public tokenHandlers: Record<string, (state: MarkdownParseState, token: Token, tokens: Token[], i: number) => void>) {
        this.stack = [{ type: schema.topNodeType, content: [] }];
        this.marks = Mark.none;
        this.tokenHandlers = tokenHandlers;
    }

    addNode(
        type: NodeType,
        attrs?: { [key: string]: any },
        content?: Fragment | ProsemirrorNode | Array<ProsemirrorNode>) {
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
        if (text.length) {
            for (let i = this.stack.length - 1; i >= 0; i--) {
                if (this.stack[i].type == this.schema.nodes.task_list_item) {
                    text = text.substring(1);
                    break;
                }
            }
        }
        const nodes = this.top().content;
        const last = nodes[nodes.length - 1];
        const node = this.schema.text(text, this.marks);
        let merged: TextNode | undefined;
        if (last && (merged = maybeMerge(last, node))) {
            nodes[nodes.length - 1] = merged;
        } else {
            nodes.push(node);
        }
    }

    closeMark(mark: MarkType) {
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

    openMark(mark: Mark) {
        this.marks = mark.addToSet(this.marks);
    }

    openNode(type: NodeType, attrs?: { [key: string]: any }) {
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

            const id = token.attrGet("id");
            const className = token.attrGet("class");
            const style = token.attrGet("style")?.replace('::', ":");
            let attrs: { [key: string]: any } | undefined;
            if (id || className || style) {
                attrs = { id, className, style };
            }

            const isOpen = token.type.endsWith("_open");
            const isClose = !isOpen && token.type.endsWith("_close");
            const type = isOpen
                ? token.type.substring(0, token.type.length - 5)
                : isClose
                    ? token.type.substring(0, token.type.length - 6)
                    : token.type;

            const nodeType = this.schema.nodes[type];
            if (nodeType) {
                if (attrs && nodeType.spec.attrs) {
                    for (const attr in attrs) {
                        if (!nodeType.spec.attrs.hasOwnProperty(attr)) {
                            delete attrs.attr;
                        }
                    }
                } else {
                    attrs = undefined;
                }
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
                continue;
            }

            const markType = this.schema.marks[type];
            if (markType) {
                if (attrs && markType.spec.attrs) {
                    for (const attr in attrs) {
                        if (!markType.spec.attrs.hasOwnProperty(attr)) {
                            delete attrs.attr;
                        }
                    }
                } else {
                    attrs = undefined;
                }
                if (isOpen) {
                    this.openMark(markType.create(attrs));
                } else if (isClose) {
                    this.closeMark(markType);
                } else {
                    this.openMark(markType.create(attrs));
                    this.addText(withoutTrailingNewline(token.content));
                    this.closeMark(markType);
                }
                continue;
            }

            if (type == "html_inline"
                || type == "html_block") {
                const isClose = token.content.startsWith('</');
                let tag: string;
                if (isClose) {
                    tag = token.content.substring(2, token.content.length - 1);
                } else {
                    const spaceIndex = token.content.indexOf(' ');
                    const closeIndex = token.content.indexOf('>');
                    const endIndex = spaceIndex == -1
                        ? closeIndex
                        : closeIndex == -1
                            ? spaceIndex
                            : Math.min(spaceIndex, closeIndex);
                    if (endIndex == -1) {
                        tag = token.content.substring(1, token.content.length - 1);
                    } else {
                        tag = token.content.substring(1, endIndex);
                    }
                }

                const div = document.createElement('div');
                div.innerHTML = token.content;
                if (div.firstElementChild) {
                    for (const attr of div.firstElementChild.attributes) {
                        if (attr.name == 'class') {
                            (attrs || (attrs = {})).className = attr.value;
                        } else if (attr.name == 'default') {
                            (attrs || (attrs = {})).isDefault = attr.value;
                        } else {
                            (attrs || (attrs = {}))[attr.name] = attr.value;
                        }
                    }
                }

                if (tag == 'input'
                    && attrs
                    && attrs.className == 'task-list-item-checkbox') {
                    let found = false;
                    for (let i = this.stack.length - 1; i >= 0; i--) {
                        if (this.stack[i].type == this.schema.nodes.list_item) {
                            this.stack[i].type = this.schema.nodes.task_list_item;
                            if (attrs.checked == 'checked') {
                                (this.stack[i].attrs
                                    || (this.stack[i].attrs = {})).complete = true;
                            }
                            found = true;
                        } else if (this.stack[i].type == this.schema.nodes.bullet_list
                            && found) {
                            this.stack[i].type = this.schema.nodes.task_list;
                            break;
                        }
                    }
                    if (found) {
                        continue;
                    }
                }

                if (tag == 'q') {
                    if (isClose) {
                        this.closeMark(this.schema.marks.quote);
                    } else if (isClose) {
                        this.openMark(this.schema.marks.quote.create(attrs));
                    }
                    continue;
                } else if (tag == 'var') {
                    if (isClose) {
                        this.closeMark(this.schema.marks.variable);
                    } else if (isClose) {
                        this.openMark(this.schema.marks.variable.create(attrs));
                    }
                    continue;
                }

                const nodeType = this.schema.nodes[tag];
                if (nodeType) {
                    if (nodeType.spec.attrs) {
                        for (const attr in attrs) {
                            if (!nodeType.spec.attrs.hasOwnProperty(attr)) {
                                delete attrs.attr;
                            }
                        }
                    } else {
                        attrs = undefined;
                    }
                    if (isClose) {
                        this.closeNode();
                    } else {
                        this.openNode(nodeType, attrs);
                    }
                    continue;
                }

                const markType = this.schema.marks[tag];
                if (markType) {
                    if (markType.spec.attrs) {
                        for (const attr in attrs) {
                            if (!markType.spec.attrs.hasOwnProperty(attr)) {
                                delete attrs.attr;
                            }
                        }
                    } else {
                        attrs = undefined;
                    }
                    if (isClose) {
                        this.closeMark(markType);
                    } else if (isClose) {
                        this.openMark(markType.create(attrs));
                    }
                    continue;
                }
            }

            console.info(`Token type "${token.type}" not supported by schema`);
        }
    }

    private push(elt: ProsemirrorNode) {
        if (this.stack.length) {
            this.top().content.push(elt);
        }
    }

    private top() { return this.stack[this.stack.length - 1] }
}

class MarkdownParser {
    tokenHandlers: Record<string, (state: MarkdownParseState, token: Token, tokens: Token[], i: number) => void>;

    constructor(
        public schema: Schema,
        public tokenizer: MarkdownIt,
        public tokens: { [key: string]: TokenConfig }) {
        this.tokenHandlers = tokenHandlers(schema, tokens);
    }

    parse(text: string) {
        const state = new MarkdownParseState(this.schema, this.tokenHandlers);
        state.parseTokens(this.tokenizer.parse(text, {}));

        if (text.endsWith("\n\n")) {
            state.addNode(this.schema.nodes.paragraph);
        }

        let doc: ProsemirrorNode | null | undefined;
        do {
            doc = state.closeNode();
        } while (state.stack.length);

        return doc || (this.schema.topNodeType.createAndFill() as ProsemirrorNode);
    }
}

type MarkSerializerSpec = {
    /**
     * The string that should appear before a piece of content marked
     * by this mark, either directly or as a function that returns an
     * appropriate string.
     */
    open: string | ((
        state: MarkdownSerializerState,
        mark: Mark,
        parent: ProsemirrorNode,
        index: number) => string),
    /**
     * The string that should appear after a piece of content marked by
     * this mark.
     */
    close: string | ((
        state: MarkdownSerializerState,
        mark: Mark,
        parent: ProsemirrorNode,
        index: number) => string),
    /**
     * When `true`, this indicates that the order in which the mark's
     * opening and closing syntax appears relative to other mixable
     * marks can be varied. (For example, you can say `**a *b***` and
     * `*a **b***`, but not `` `a *b*` ``.)
     */
    mixable?: boolean,
    /**
     * When enabled, causes the serializer to move enclosing whitespace
     * from inside the marks to outside the marks. This is necessary
     * for emphasis marks as CommonMark does not permit enclosing
     * whitespace inside emphasis marks, see: http:///spec.commonmark.org/0.26/#example-330
     */
    expelEnclosingWhitespace?: boolean,
    /**
     * Can be set to `false` to disable character escaping in a mark. A
     * non-escaping mark has to have the highest precedence (must
     * always be the innermost mark).
     */
    escape?: boolean
}

class MarkdownSerializerState {
    out: string = "";

    private delim: string = "";
    private closed: ProsemirrorNode | null = null;
    private inTightList: boolean = false;

    constructor(
        readonly nodes: {
            [node: string]: (
                state: MarkdownSerializerState,
                node: ProsemirrorNode,
                parent: ProsemirrorNode,
                index: number) => void
        },
        readonly marks: { [mark: string]: MarkSerializerSpec },
        readonly options: { tightLists?: boolean, escapeExtraCharacters?: RegExp }
    ) {
        if (typeof this.options.tightLists == "undefined") {
            this.options.tightLists = false;
        }
    }

    /**
     * Close the block for the given node.
     */
    closeBlock(node: ProsemirrorNode) {
        this.closed = node;
    }

    /**
     * Ensure the current content ends with a newline.
     */
    ensureNewLine() {
        if (!this.atBlank()) {
            this.out += "\n";
        }
    }

    /**
     * Escape the given string so that it can safely appear in Markdown
     * content.
     * @param startOfLine Default false. If true, also escape characters that
     * have special meaning only at the start of the line.
     */
    esc(str: string, startOfLine = false) {
        str = str.replace(
            /[`*\\~\[\]_]/g,
            (m, i) => m == "_"
                && i > 0
                && i + 1 < str.length
                && str[i - 1].match(/\w/)
                && str[i + 1].match(/\w/)
                ? m
                : "\\" + m
        );
        if (startOfLine) {
            str = str
                .replace(/^[:#\-*+>]/, "\\$&")
                .replace(/^(\s*\d+)\./, "$1\\.");
        }
        if (this.options.escapeExtraCharacters) {
            str = str.replace(this.options.escapeExtraCharacters, "\\$&");
        }
        return str;
    }

    /**
     * Get leading and trailing whitespace from a string. Values of
     * leading or trailing property of the return object will be undefined
     * if there is no match.
     */
    getEnclosingWhitespace(text: string): { leading?: string, trailing?: string } {
        return {
            leading: (text.match(/^(\s+)/) || [undefined])[0],
            trailing: (text.match(/(\s+)$/) || [undefined])[0]
        };
    }

    /**
     * Get the markdown string for a given opening or closing mark.
     */
    markString(mark: Mark, open: boolean, parent: ProsemirrorNode, index: number) {
        const info = this.marks[mark.type.name];
        const value = open
            ? info.open
            : info.close;
        return typeof value == "string"
            ? value
            : value(this, mark, parent, index);
    }

    /**
     * Render the given node as a block.
     */
    render(node: ProsemirrorNode, parent: ProsemirrorNode, index: number) {
        if (this.nodes[node.type.name]) {
            this.nodes[node.type.name](this, node, parent, index);
            return;
        }

        const dom = renderer.serializeNode(node);
        if (dom instanceof HTMLElement) {
            this.write(dom.outerHTML);
        } else if (dom.textContent) {
            this.write(dom.textContent);
        }
    }

    /**
     * Render the contents of `parent` as block nodes.
     */
    renderContent(parent: ProsemirrorNode) {
        parent.forEach((node, _, i) => this.render(node, parent, i));
    }

    /**
     * Render the contents of `parent` as inline content.
     */
    renderInline(parent: ProsemirrorNode) {
        const active: Mark[] = [];
        let trailing = "";
        const progress = (node: ProsemirrorNode | null, _offset: number, index: number) => {
            let marks = node ? node.marks : [];

            // Remove marks from `hard_break` that are the last node inside
            // that mark to prevent parser edge cases with new lines just
            // before closing marks.
            // (FIXME it'd be nice if we had a schema-agnostic way to
            // identify nodes that serialize as hard breaks)
            if (node && node.type.name === "hard_break") {
                marks = marks.filter(m => {
                    if (index + 1 == parent.childCount) {
                        return false;
                    }
                    const next = parent.child(index + 1);
                    return m.isInSet(next.marks)
                        && (!next.isText || /\S/.test(next.text!));
                });
            }

            let leading = trailing;
            trailing = "";
            // If whitespace has to be expelled from the node, adjust
            // leading and trailing accordingly.
            if (node && node.isText && marks.some(mark => {
                const info = this.marks[mark.type.name];
                return info && info.expelEnclosingWhitespace;
            })) {
                const [_, lead, inner, trail] = /^(\s*)(.*?)(\s*)$/m.exec(node.text!)!;
                leading += lead;
                trailing = trail;
                if (lead || trail) {
                    node = inner
                        ? (node as any).withText(inner)
                        : null;
                    if (!node) {
                        marks = active;
                    }
                }
            }

            const inner = marks.length
                ? marks[marks.length - 1]
                : null;
            const noEsc = inner
                && this.marks[inner.type.name].escape === false;
            const len = marks.length - (noEsc ? 1 : 0);

            // Try to reorder 'mixable' marks, such as em and strong, which
            // in Markdown may be opened and closed in different order, so
            // that order of the marks for the token matches the order in
            // active.
            outer: for (let i = 0; i < len; i++) {
                const mark = marks[i];
                if (!this.marks[mark.type.name].mixable) {
                    break;
                }
                for (let j = 0; j < active.length; j++) {
                    const other = active[j];
                    if (!this.marks[other.type.name].mixable) {
                        break;
                    }
                    if (mark.eq(other)) {
                        if (i > j) {
                            marks = marks
                                .slice(0, j)
                                .concat(mark)
                                .concat(marks.slice(j, i))
                                .concat(marks.slice(i + 1, len));
                        } else if (j > i) {
                            marks = marks
                                .slice(0, i)
                                .concat(marks.slice(i + 1, j))
                                .concat(mark)
                                .concat(marks.slice(j, len));
                        }
                        continue outer;
                    }
                }
            }

            // Find the prefix of the mark set that didn't change
            let keep = 0;
            while (keep < Math.min(active.length, len)
                && marks[keep].eq(active[keep])) {
                ++keep;
            }

            // Close the marks that need to be closed
            while (keep < active.length) {
                this.text(this.markString(active.pop()!, false, parent, index), false);
            }

            // Output any previously expelled trailing whitespace outside the marks
            if (leading) {
                this.text(leading);
            }

            // Open the marks that need to be opened
            if (node) {
                while (active.length < len) {
                    const add = marks[active.length];
                    active.push(add);
                    this.text(this.markString(add, true, parent, index), false);
                }

                // Render the node. Special case code marks, since their content
                // may not be escaped.
                if (noEsc && node.isText) {
                    this.text(this.markString(inner!, true, parent, index)
                        + node.text
                        + this.markString(inner!, false, parent, index + 1),
                        false);
                } else {
                    this.render(node, parent, index);
                }
            }
        }
        parent.forEach(progress);
        progress(null, 0, parent.childCount);
    }

    /**
     * Render a node's content as a list.
     * @param delim the extra indentation added to all lines except the first in an item
     * @param firstDelim a function going from an item index to a delimiter for the first line of the item
     */
    renderList(node: ProsemirrorNode, delim: string, firstDelim: (index: number) => string) {
        if (this.closed && this.closed.type == node.type) {
            this.flushClose(3);
        } else if (this.inTightList) {
            this.flushClose(1);
        }

        const isTight = typeof node.attrs.tight != "undefined"
            ? node.attrs.tight
            : this.options.tightLists;
        const prevTight = this.inTightList;
        this.inTightList = isTight;
        node.forEach((child, _, i) => {
            if (i && isTight) {
                this.flushClose(1);
            }
            this.wrapBlock(delim, firstDelim(i), node, () => this.render(child, node, i));
        })
        this.inTightList = prevTight;
    }

    /**
     * Repeat the given string `n` times.
     */
    repeat(str: string, n: number) {
        let out = "";
        for (let i = 0; i < n; i++) {
            out += str;
        }
        return out;
    }

    /**
     * Add the given text to the document.
     * @param escape Default true. When not `false`, the text will be escaped.
     */
    text(text: string, escape = true) {
        const lines = text.split("\n");
        for (let i = 0; i < lines.length; i++) {
            const startOfLine = this.atBlank() || this.closed;
            this.write();
            this.out += escape
                ? this.esc(lines[i], !!startOfLine)
                : lines[i];
            if (i != lines.length - 1) {
                this.ensureNewLine();
            }
        }
    }

    /**
     * Render a block, prefixing each line with `delim`, and the first
     * line in `firstDelim`.
     * @param node the node that is closed at the end of the block
     * @param f a function that renders the content of the block.
     */
    wrapBlock(delim: string, firstDelim: string | null, node: ProsemirrorNode, f: () => void) {
        const old = this.delim;
        this.write(firstDelim || delim);
        this.delim += delim;
        f();
        this.delim = old;
        this.closeBlock(node);
    }

    /**
     * Prepare the state for writing output (closing closed paragraphs,
     * adding delimiters, and so on).
     * @param content Optional. Added (unescaped) to the output.
     */
    write(content?: string, compact?: boolean) {
        this.flushClose(compact ? 1 : 2);
        if (this.delim && this.atBlank()) {
            this.out += this.delim;
        }
        if (content) {
            this.out += content;
        }
    }

    private atBlank() {
        return /(^|\n)$/.test(this.out);
    }

    private flushClose(size: number = 2) {
        if (this.closed) {
            if (!this.atBlank()) {
                this.out += "\n";
            }
            if (size > 1) {
                let delimMin = this.delim;
                const trim = /\s+$/.exec(delimMin);
                if (trim) {
                    delimMin = delimMin.slice(0, delimMin.length - trim[0].length);
                }
                for (let i = 1; i < size; i++) {
                    this.out += delimMin + "\n";
                }
            }
            this.closed = null;
        }
    }

    private quote(str: string) {
        const wrap = str.indexOf('"') == -1
            ? '""'
            : str.indexOf("'") == -1
                ? "''"
                : "()";
        return wrap[0] + str + wrap[1];
    }
}

class MarkdownSerializer {
    /**
     * @param nodes Should map node names in a given schema to function that
     * take a serializer state and such a node, and serialize the node.
     */
    constructor(
        readonly nodes: {
            [node: string]: (
                state: MarkdownSerializerState,
                node: ProsemirrorNode,
                parent: ProsemirrorNode,
                index: number) => void
        },
        readonly marks: { [mark: string]: MarkSerializerSpec },
        readonly options: {
            /**
             * Extra characters can be added for escaping. This is passed
             * directly to String.replace(), and the matching characters are
             * preceded by a backslash.
             */
            escapeExtraCharacters?: RegExp
        } = {}
    ) { }

    /**
     * Serialize the content of the given node to
     * [CommonMark](http://commonmark.org/).
     * @param content
     * @param options
     */
    serialize(content: ProsemirrorNode, options: {
        /**
         * Whether to render lists in a tight style. This can be overridden
         * on a node level by specifying a tight attribute on the node.
         * Defaults to false.
         */
        tightLists?: boolean
    } = {}) {
        options = Object.assign(this.options, options);
        const state = new MarkdownSerializerState(this.nodes, this.marks, options);
        state.renderContent(content);
        return state.out;
    }
}

export const tavenemMarkdownParser = new MarkdownParser(
    schema,
    MarkdownIt({
        html: true,
        breaks: true,
    }).use(ins_plugin)
        .use(mark_plugin)
        .use(sub_plugin)
        .use(sup_plugin)
        .use(task_list_plugin)
        .use(deflist_plugin)
        .use(container_plugin)
        .use(span_plugin)
        .use(attributes), {
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
        dl: { block: "definition_list" },
        dt: { block: "term" },
        dd: { block: "definition" },
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
        td: {
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
        th: {
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
        tr: { block: "table_row" },
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
        container: { block: "div" },

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
            mark: "anchor",
            getAttrs: token => ({
                href: token.attrGet("href"),
                title: token.attrGet("title") || null,
            })
        },
        code_inline: { mark: "code", noCloseToken: true },
});
export const tavenemMarkdownSerializer = new MarkdownSerializer({
    blockquote(state, node) {
        state.wrapBlock("> ", null, node, () => state.renderContent(node));
    },
    code_block(state, node) {
        state.write("```" + (node.attrs.syntax || ""));
        writeCommonAttributes(state, node, true);
        state.text(node.textContent, false);
        state.ensureNewLine();
        state.write("```", true);
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
    task_list(state, node) {
        state.renderList(node, "  ", () => (node.attrs.complete ? "* [x]" : "* [ ]") + " ");
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
    task_list_item(state, node) {
        state.renderContent(node);
        writeCommonAttributes(state, node);
    },
    list_item(state, node) {
        state.renderContent(node);
        writeCommonAttributes(state, node);
    },
    paragraph(state, node, parent, index) {
        state.renderInline(node);
        if (index == parent.childCount - 1
            && node.childCount == 0
            || (node.childCount == 1
                && !node.firstChild!.text)) {
            state.write();
        }
        writeCommonAttributes(state, node);
        state.closeBlock(node);
    },
    table(state, node) {
        const host = node.firstChild as ProsemirrorNode | null;
        if (!host) {
            return;
        }
        let autoHeader = false;
        if (host.type.name != "thead") {
            const cell = host.firstChild as ProsemirrorNode | null;
            autoHeader = !cell
                || cell.type.name != "table_header";
        }
        if (autoHeader) {
            let maxCells = 0;
            for (let i = 0; i < host.childCount; i++) {
                maxCells = Math.max(maxCells, host.child(i).childCount);
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
    thead(state, node) {
        state.renderContent(node);
    },
    tbody(state, node) {
        state.renderContent(node);
    },
    tfoot(state, node) {
        state.renderContent(node);
    },
    table_row(state, node) {
        state.write("|");
        state.renderInline(node);
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
        state.ensureNewLine();
    },
    table_cell(state, node) {
        state.write(" ");
        state.renderInline(node);
        state.write(" |");
    },
    table_header(state, node) {
        state.write(" ");
        state.renderInline(node);
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
        state.write("$$", true);
        writeCommonAttributes(state, node);
        state.closeBlock(node);
    },
    div(state, node) {
        state.write(":::");
        writeCommonAttributes(state, node, true);
        state.renderInline(node);
        state.ensureNewLine();
        state.write(":::", true);
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
    anchor: {
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
    attrs.style = token.attrGet("style")?.replace("::", ":") || null;

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

function isPlainURL(link: Mark, parent: ProsemirrorNode, index: number, side: number) {
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

function maybeMerge(a: ProsemirrorNode, b: ProsemirrorNode) {
    if (a.isText && b.isText && Mark.sameSet(a.marks, b.marks)) {
        return (a as TextNode).withText(a.text! + b.text);
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

function tokenHandlers(
    schema: Schema,
    tokenConfigs: { [key: string]: TokenConfig }) {
    const handlers: Record<string, (state: MarkdownParseState, token: Token, tokens: Token[], i: number) => void> = Object.create(null);
    for (const type in tokenConfigs) {
        const config = tokenConfigs[type];
        if (config.block) {
            const nodeType = schema.nodes[config.block];
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
            const nodeType = schema.nodes[config.node];
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

function writeCommonAttributes(
    state: MarkdownSerializerState,
    node: ProsemirrorNode,
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
