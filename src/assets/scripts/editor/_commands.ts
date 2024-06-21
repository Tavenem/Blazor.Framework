import {
    EditorSelection,
    EditorState as CodeEditorState,
    StateCommand,
    Transaction as CodeTransaction,
} from "@codemirror/state";
import {
    chainCommands,
    deleteSelection,
    lift,
    liftEmptyBlock,
    setBlockType,
    toggleMark,
    wrapIn,
} from "prosemirror-commands";
import { redo, undo } from "prosemirror-history";
import {
    Attrs,
    ContentMatch,
    Mark,
    MarkType,
    NodeType,
    Node as ProsemirrorNode,
    ResolvedPos,
    Schema} from "prosemirror-model";
import {
    Command,
    EditorState,
    NodeSelection,
    Selection,
    SelectionRange,
    TextSelection,
    Transaction,
} from "prosemirror-state";
import {
    CellSelection,
    addCaption,
    addColumnAfter,
    addColumnBefore,
    addRowAfter,
    addRowBefore,
    deleteColumn,
    deleteRow,
    deleteTable,
    mergeCells,
    setColumnAlign,
    setNodeAttrs,
    splitCell,
    toggleFullWidth,
    toggleHeaderColumn,
    toggleHeaderRow,
} from "./_tables";
import {
    findWrapping,
    RemoveMarkStep,
} from "prosemirror-transform";
import {
    CommandInfo,
    liftListItemTypes,
    sinkListItemTypes,
    wrapInPhrasingOrFlowList,
} from "./_list-commands";

export enum CommandType {
    None = 0,
    Undo = 1,
    Redo = 2,
    UpLevel = 3,
    DownLevel = 4,
    AlignLeft = 5,
    AlignCenter = 6,
    AlignRight = 7,
    SetFontFamily = 8,
    SetFontSize = 9,
    SetLineHeight = 10,
    ForegroundColor = 11,
    BackgroundColor = 12,
    PageBreak = 13,
    SetCodeSyntax = 14,
    Emoji = 15,
    InsertTable = 16,
    TableAddCaption = 17,
    TableInsertColumnBefore = 18,
    TableInsertColumnAfter = 19,
    TableDeleteColumn = 20,
    TableInsertRowBefore = 21,
    TableInsertRowAfter = 22,
    TableDeleteRow = 23,
    TableDelete = 24,
    TableMergeCells = 25,
    TableSplitCell = 26,
    TableToggleHeaderColumn = 27,
    TableToggleHeaderRow = 28,
    TableFullWidth = 29,
    Abbreviation = 30,
    Address = 31,
    Area = 32,
    Article = 33,
    Aside = 34,
    BlockQuote = 35,
    Bold = 36,
    Cite = 37,
    CodeBlock = 38,
    CodeInline = 39,
    Definition = 40,
    Deleted = 41,
    Details = 42,
    Emphasis = 43,
    FieldSet = 44,
    Figure = 45,
    FigureCaption = 46,
    Footer = 47,
    Header = 48,
    Heading = 49,
    HeadingGroup = 50,
    HorizontalRule = 51,
    InsertAudio = 52,
    InsertImage = 53,
    InsertLink = 54,
    InsertVideo = 55,
    Inserted = 56,
    Italic = 57,
    Keyboard = 58,
    ListBullet = 59,
    ListCheck = 60,
    ListNumber = 61,
    Marked = 62,
    Paragraph = 63,
    Quote = 64,
    Sample = 65,
    Section = 66,
    Small = 67,
    Strikethrough = 68,
    Strong = 69,
    Subscript = 70,
    Superscript = 71,
    Underline = 72,
    Variable = 73,
    WordBreak = 74,
}

export interface ParamStateCommand {
    (params?: any[]): StateCommand;
}

export type CodeCommandSet = { [type in CommandType]?: ParamStateCommand };

export type CommandSet = { [type in CommandType]?: CommandInfo };

export function commonCommands(schema: Schema) {
    const commands: CommandSet = {};
    commands[CommandType.Undo] = { command: undo };
    commands[CommandType.Redo] = { command: redo };
    commands[CommandType.Heading] = {
        command(state, dispatch, _, params) {
            let level = 1;
            if (params && params.length) {
                const i = Number.parseInt(params[0]);
                if (i >= 1) {
                    level = i;
                }
            }
            return setBlockType(schema.nodes.heading, { level })(state, dispatch);
        }
    };
    commands[CommandType.Paragraph] = blockTypeMenuItem(schema.nodes.paragraph);
    commands[CommandType.Address] = wrapOrInsertPhrasingOrFlow(schema.nodes.address_text, schema.nodes.address);
    commands[CommandType.Article] = wrapOrInsertPhrasingOrFlow(schema.nodes.article_text, schema.nodes.article);
    commands[CommandType.Aside] = wrapOrInsertPhrasingOrFlow(schema.nodes.aside_text, schema.nodes.aside);
    commands[CommandType.BlockQuote] = wrapOrInsertPhrasingOrFlow(schema.nodes.blockquote_text, schema.nodes.blockquote);
    commands[CommandType.CodeBlock] = blockTypeMenuItem(schema.nodes.code_block);
    commands[CommandType.CodeInline] = markMenuItem(schema.marks.code);
    commands[CommandType.Strong] = markMenuItem(schema.marks.strong);
    commands[CommandType.Bold] = markMenuItem(schema.marks.bold);
    commands[CommandType.Cite] = markMenuItem(schema.marks.cite);
    commands[CommandType.Definition] = markMenuItem(schema.marks.dfn);
    commands[CommandType.Emphasis] = markMenuItem(schema.marks.em);
    commands[CommandType.FieldSet] = wrapOrInsert(schema.nodes.fieldset);
    commands[CommandType.Figure] = wrapOrInsert(schema.nodes.figure);
    commands[CommandType.FigureCaption] = wrapOrInsertInlinePhrasingOrFlow(schema.nodes.figcaption_text, schema.nodes.figcaption);
    commands[CommandType.Footer] = wrapOrInsertPhrasingOrFlow(schema.nodes.footer_text, schema.nodes.footer);
    commands[CommandType.Header] = wrapOrInsertPhrasingOrFlow(schema.nodes.header_text, schema.nodes.header);
    commands[CommandType.HeadingGroup] = wrapOrInsert(schema.nodes.hgroup);
    commands[CommandType.Italic] = markMenuItem(schema.marks.italic);
    commands[CommandType.Keyboard] = markMenuItem(schema.marks.kbd);
    commands[CommandType.Underline] = markMenuItem(schema.marks.underline);
    commands[CommandType.Deleted] = markMenuItem(schema.marks.del);
    commands[CommandType.Details] = wrapOrInsert(schema.nodes.details);
    commands[CommandType.Small] = markMenuItem(schema.marks.small);
    commands[CommandType.Strikethrough] = markMenuItem(schema.marks.strikethrough);
    commands[CommandType.Subscript] = markMenuItem(schema.marks.sub);
    commands[CommandType.Superscript] = markMenuItem(schema.marks.sup);
    commands[CommandType.Inserted] = markMenuItem(schema.marks.ins);
    commands[CommandType.Marked] = markMenuItem(schema.marks.mark);
    commands[CommandType.Quote] = markMenuItem(schema.marks.quote);
    commands[CommandType.Sample] = markMenuItem(schema.marks.samp);
    commands[CommandType.Section] = wrapOrInsertPhrasingOrFlow(schema.nodes.section_text, schema.nodes.section);
    commands[CommandType.Variable] = markMenuItem(schema.marks.variable);
    commands[CommandType.WordBreak] = {
        command(state, dispatch) {
            if (!canInsert(state, schema.nodes.wbr)) {
                return false;
            }
            if (dispatch) {
                dispatch(state.tr.replaceSelectionWith(schema.nodes.wbr.create()));
            }
            return true;
        }
    };
    commands[CommandType.ForegroundColor] = toggleInlineStyle('color');
    commands[CommandType.BackgroundColor] = toggleInlineStyle('background-color');
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
                    && state.selection.node.type.name == schema.nodes.image.name) {
                    attrs = { ...state.selection.node.attrs };
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
        isActive(state) {
            if (state.selection instanceof NodeSelection
                && state.selection.node) {
                return state.selection.node.hasMarkup(schema.nodes.image);
            }
            const { $from, to } = state.selection;
            return to <= $from.end()
                && $from.parent.hasMarkup(schema.nodes.image);
        },
    };
    commands[CommandType.InsertLink] = {
        command(state, dispatch, _, params) {
            const node = state.selection.$head.parent;
            if (node && node.type == schema.nodes.code_block) {
                return false;
            }

            const isActive = isMarkActive(state, schema.marks.anchor);
            if (isActive) {
                return toggleLink(schema.marks.anchor, state, dispatch);
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
                if (state.selection.empty) {
                    dispatch(state.tr.replaceSelectionWith(schema.text(attrs.title || attrs.href).mark([schema.marks.anchor.create(attrs)]), false));
                } else {
                    return toggleLink(schema.marks.anchor, state, dispatch, attrs);
                }
            }
            return true;
        },
        isActive(state, type) { return isMarkActive(state, type) },
        markType: schema.marks.anchor as MarkType
    };
    commands[CommandType.InsertAudio] = {
        command(state, dispatch, _, params) {
            if (!canInsert(state, schema.nodes.audio)) {
                return false;
            }
            if (dispatch) {
                if (!params || !params.length) {
                    return true;
                }
                let attrs: { [key: string]: any } | null = null;
                if (state.selection instanceof NodeSelection
                    && state.selection.node.type.name == schema.nodes.audio.name) {
                    attrs = { ...state.selection.node.attrs };
                }
                attrs = { ...attrs, ...params };
                attrs.src = params[0];
                if (params.length > 1) {
                    attrs.controls = params[1];
                }
                if (params.length > 2 && params[2]) {
                    attrs.loop = params[2];
                }
                dispatch(state.tr.replaceSelectionWith(schema.nodes.audio.createAndFill(attrs)!));
            }
            return true;
        },
        isActive(state) {
            if (state.selection instanceof NodeSelection
                && state.selection.node) {
                return state.selection.node.hasMarkup(schema.nodes.audio);
            }
            const { $from, to } = state.selection;
            return to <= $from.end()
                && $from.parent.hasMarkup(schema.nodes.audio);
        },
    };
    commands[CommandType.InsertVideo] = {
        command(state, dispatch, _, params) {
            if (!canInsert(state, schema.nodes.video)) {
                return false;
            }
            if (dispatch) {
                if (!params || !params.length) {
                    return true;
                }
                let attrs: { [key: string]: any } | null = null;
                if (state.selection instanceof NodeSelection
                    && state.selection.node.type.name == schema.nodes.video.name) {
                    attrs = { ...state.selection.node.attrs };
                }
                attrs = attrs || {};
                attrs.src = params[0];
                if (params.length > 1) {
                    attrs.controls = params[1];
                }
                if (params.length > 2 && params[2]) {
                    attrs.loop = params[2];
                }
                dispatch(state.tr.replaceSelectionWith(schema.nodes.video.createAndFill(attrs)!));
            }
            return true;
        },
        isActive(state) {
            if (state.selection instanceof NodeSelection
                && state.selection.node) {
                return state.selection.node.hasMarkup(schema.nodes.video);
            }
            const { $from, to } = state.selection;
            return to <= $from.end()
                && $from.parent.hasMarkup(schema.nodes.video);
        },
    };
    commands[CommandType.ListBullet] = wrapInPhrasingOrFlowList(schema.nodes.bullet_list, schema.nodes.list_item_text);
    commands[CommandType.ListNumber] = wrapInPhrasingOrFlowList(schema.nodes.ordered_list, schema.nodes.list_item_text);
    commands[CommandType.ListCheck] = wrapInPhrasingOrFlowList(schema.nodes.task_list, schema.nodes.task_list_item);
    commands[CommandType.UpLevel] = {
        command: chainCommands(
            liftListItemTypes([schema.nodes.task_list_item, schema.nodes.list_item_text, schema.nodes.list_item]),
            lift,
            liftEmptyBlock)
    };
    commands[CommandType.DownLevel] = {
        command: sinkListItemTypes([schema.nodes.task_list_item, schema.nodes.list_item_text, schema.nodes.list_item])
    };
    commands[CommandType.InsertTable] = {
        command(state, dispatch, _, params) {
            if (!canInsert(state, schema.nodes.table)
                || this.isActive!(state)) {
                return false;
            }
            const node = state.selection.$head.parent;
            if (node && node.type == schema.nodes.code_block) {
                return false;
            }
            if (dispatch) {
                let rows = Math.max(2, params && params.length ? params[0] : 2);
                let columns = Math.max(2, params && params.length > 1 ? params[1] : 2);

                const rowNodes: ProsemirrorNode[] = [];
                for (let i = 0; i < rows; i++) {
                    const cells: ProsemirrorNode[] = [];
                    for (let j = 0; j < columns; j++) {
                        cells.push(schema.nodes.table_cell_text.create());
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
                && $from.parent.hasMarkup(schema.nodes.table as NodeType);
        }
    };
    commands[CommandType.TableAddCaption] = { command: addCaption };
    commands[CommandType.TableInsertColumnBefore] = { command: addColumnBefore };
    commands[CommandType.TableInsertColumnAfter] = { command: addColumnAfter };
    commands[CommandType.TableDeleteColumn] = { command: deleteColumn };
    commands[CommandType.TableInsertRowBefore] = { command: addRowBefore };
    commands[CommandType.TableInsertRowAfter] = { command: addRowAfter };
    commands[CommandType.TableDeleteRow] = { command: deleteRow };
    commands[CommandType.TableDelete] = { command: deleteTable };
    commands[CommandType.TableMergeCells] = { command: mergeCells };
    commands[CommandType.TableSplitCell] = { command: splitCell };
    commands[CommandType.TableToggleHeaderColumn] = { command: toggleHeaderColumn };
    commands[CommandType.TableToggleHeaderRow] = { command: toggleHeaderRow };
    commands[CommandType.TableFullWidth] = {
        command: toggleFullWidth,
        isActive(state) {
            const style = 'width:100%';
            const { $from, to } = state.selection;
            if (to > $from.end()) {
                return false;
            }
            const depth = $from.sharedDepth(to);
            for (let i = depth; i >= 0; i--) {
                const node = $from.node(i);
                if (node
                    && node.type == state.schema.nodes.table) {
                    return !!node.attrs.style
                        && node.attrs.style.indexOf(style) != -1;
                }
            }
            return false;
        }
    };
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
            const node = state.selection.$head.parent;
            if (!node || node.type != schema.nodes.code_block) {
                return false;
            }
            if (dispatch) {
                const attrs = { ...node.attrs };
                if (!params
                    || !params.length
                    || !params[0]
                    || params[0] == "None") {
                    delete attrs.syntax;
                } else {
                    attrs.syntax = params[0];
                }
                const tr = state.tr;
                setNodeAttrs(tr, state.selection.head, state.selection.$head.depth, state.schema.nodes.code_block, attrs);
                dispatch(tr);
            }
            return true;
        }
    };
    commands[CommandType.SetFontFamily] = toggleInlineStyle('font-family');
    commands[CommandType.SetFontSize] = toggleInlineStyle('font-size');
    commands[CommandType.SetLineHeight] = toggleInlineStyle('line-height');
    commands[CommandType.AlignLeft] = alignMenuItem('left');
    commands[CommandType.AlignCenter] = alignMenuItem('center');
    commands[CommandType.AlignRight] = alignMenuItem('right');
    commands[CommandType.PageBreak] = {
        command(state, dispatch, _view, _params) {
            const styleAttr = 'break-after:';
            const style = 'break-after:page';

            if (dispatch) {
                const { from, $from, to } = state.selection;
                if (to > $from.end()) {
                    return wrapIn(state.schema.nodes.div, { style })(state, dispatch);
                }

                let parentDiv: ProsemirrorNode | undefined;
                const depth = $from.sharedDepth(to);
                let parentDepth = depth;
                for (let i = depth; i >= 0; i--) {
                    const node = $from.node(i);
                    if (node && node.type.name == state.schema.nodes.div.name) {
                        parentDiv = node;
                        parentDepth = i;
                        break;
                    }
                }
                if (!parentDiv) {
                    return wrapAndExitDiv(state.schema.nodes.div, { style })(state, dispatch);
                }
                const parentStyled = parentDiv.attrs.style
                    && parentDiv.attrs.style.indexOf(styleAttr) != -1;

                if (parentStyled) {
                    const tr = state.tr;
                    const attrs = { ...parentDiv.attrs };
                    attrs.style = ((attrs.style || '') as string)
                        .split(';')
                        .filter(x => !x.trimStart().startsWith(styleAttr))
                        .join(';') + style;
                    setNodeAttrs(tr, from, parentDepth, state.schema.nodes.div, attrs);
                    dispatch(tr.scrollIntoView());
                } else {
                    return wrapAndExitDiv(state.schema.nodes.div, { style })(state, dispatch);
                }
            }
            return true;
        },
        isActive(state) {
            const { $from, to } = state.selection;
            if (to > $from.end()) {
                return false;
            }
            const depth = $from.sharedDepth(to);
            for (let i = depth; i >= 0; i--) {
                const node = $from.node(i);
                if (node
                    && node.type.name == state.schema.nodes.div.name
                    && node.attrs.style
                    && node.attrs.style.indexOf('break-after:') != -1) {
                    return node.attrs.style.indexOf('break-after:page') != -1;
                }
            }
            return false;
        }
    };
    commands[CommandType.Emoji] = {
        command(state, dispatch, _, params) {
            if (!canInsert(state, schema.nodes.text)) {
                return false;
            }
            if (dispatch) {
                if (!params || !params.length || !params[0] || !params[0].length) {
                    deleteSelection(state, dispatch);
                } else {
                    dispatch(state.tr.replaceSelectionWith(schema.text(params[0]), false));
                }
            }
            return true;
        }
    };
    return commands;
}

export const exitBlock: Command = (state, dispatch) => {
    const { $head, $anchor } = state.selection;
    if ($head.pos !== $anchor.pos
        || !$head.sameParent($anchor)) {
        return false;
    }

    // if at the beginning of the current node, see if a default block can be inserted before it
    if ($head.start() === $head.pos) {
        const above = $head.node($head.depth - 1),
            before = $head.index($head.depth - 1),
            type = defaultBlockAt(above.contentMatchAt(before));
        if (type && above.canReplaceWith(before, before, type)) {
            if (dispatch) {
                const pos = $head.before(),
                    tr = state.tr.replaceWith(
                        pos, pos,
                        type.isText
                            ? state.schema.nodes.hard_break.createAndFill()! // can't create an empty text node; instead add a break
                            : type.createAndFill()!);
                dispatch(tr
                    .setSelection(Selection.near(tr.doc.resolve(pos)))
                    .scrollIntoView());
            }
            return true;
        }
    }

    const nextPos = Selection.near(state.doc.resolve($head.after()));
    if (!nextPos.$head) {
        return false;
    }
    if (dispatch) {
        dispatch(state.tr.setSelection(nextPos).scrollIntoView());
    }
    return true;
}

export const exitDiv: Command = (state, dispatch) => {
    const { $head, $anchor } = state.selection;
    if (!$head.sameParent($anchor)) {
        return false;
    }
    let div: ProsemirrorNode | null = null;
    let depth = $head.depth;
    for (; depth >= 0; depth--) {
        const node = $head.node(depth);
        if (node.type.name == "div") {
            div = node;
            break;
        }
    }
    if (!div) {
        return false;
    }
    const above = $head.node(depth - 1),
        after = $head.indexAfter(depth - 1),
        type = defaultBlockAt(above.contentMatchAt(after));
    if (!type || !above.canReplaceWith(after, after, type)) {
        return false;
    }
    if (dispatch) {
        const pos = $head.after(depth),
            tr = state.tr.replaceWith(
                pos, pos,
                type.isText
                    ? state.schema.nodes.hard_break.createAndFill()! // can't create an empty text node; instead add a break
                    : type.createAndFill()!);
        tr.setSelection(Selection.near(tr.doc.resolve(pos), 1));
        dispatch(tr.scrollIntoView());
    }
    return true;
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
    const styleAttr = 'text-align:';
    const style = `text-align:${value}`;
    return {
        command(state, dispatch, view) {
            const handled = setColumnAlign(value)(state, dispatch, view);
            if (handled) {
                return true;
            }

            if (dispatch) {
                const { from, $from, to } = state.selection;
                if (to > $from.end()) {
                    return wrapIn(state.schema.nodes.div, { style })(state, dispatch);
                }

                let parentDiv: ProsemirrorNode | undefined;
                const depth = $from.sharedDepth(to);
                let parentDepth = depth;
                for (let i = depth; i >= 0; i--) {
                    const node = $from.node(i);
                    if (node && node.type.name == state.schema.nodes.div.name) {
                        parentDiv = node;
                        parentDepth = i;
                        break;
                    }
                }
                if (!parentDiv) {
                    return wrapIn(state.schema.nodes.div, { style })(state, dispatch);
                }
                const parentAligned = parentDiv.attrs.style
                    && parentDiv.attrs.style.indexOf(styleAttr) != -1;

                if (parentAligned) {
                    const tr = state.tr;
                    const attrs = { ...parentDiv.attrs };
                    if (!attrs.style || attrs.style.indexOf(style) == -1) {
                        attrs.style = ((attrs.style || '') as string)
                            .split(';')
                            .filter(x => !x.trimStart().startsWith(styleAttr))
                            .join(';') + style;
                    } else {
                        attrs.style = ((attrs.style || '') as string)
                            .split(';')
                            .filter(x => !x.trimStart().startsWith(styleAttr))
                            .join(';');
                        if (attrs.style.length == 0
                            && parentDepth == depth - 1) {
                            return chainCommands(lift, liftEmptyBlock)(state, dispatch, view);
                        }
                    }
                    setNodeAttrs(tr, from, parentDepth, state.schema.nodes.div, attrs);
                    dispatch(tr.scrollIntoView());
                } else {
                    return wrapIn(state.schema.nodes.div, { style })(state, dispatch);
                }
            }
            return true;
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
            const { $from, to } = state.selection;
            if (to > $from.end()) {
                return false;
            }
            const depth = $from.sharedDepth(to);
            for (let i = depth; i >= 0; i--) {
                const node = $from.node(i);
                if (node
                    && node.type.name == state.schema.nodes.div.name
                    && node.attrs.style
                    && node.attrs.style.indexOf(styleAttr) != -1) {
                    return node.attrs.style.indexOf(style) != -1;
                }
            }
            return false;
        }
    };
}

function blockTypeMenuItem(
    nodeType: NodeType,
    attrs?: Attrs | null): CommandInfo {
    return {
        command: setBlockType(nodeType, attrs),
        isActive(state) {
            if (state.selection instanceof NodeSelection
                && state.selection.node) {
                return state.selection.node.type.name == nodeType.name;
            }
            const { $from, to } = state.selection;
            return to <= $from.end()
                && $from.parent.type.name == nodeType.name;
        }
    };
}

function canInsert(
    state: EditorState,
    nodeType: NodeType) {
    const $from = state.selection.$from;
    for (let d = $from.depth; d >= 0; d--) {
        const index = $from.index(d);
        if ($from.node(d).canReplaceWith(index, index, nodeType)) {
            return true;
        }
    }
    return false;
}

function defaultBlockAt(match: ContentMatch) {
    for (let i = 0; i < match.edgeCount; i++) {
        const { type } = match.edge(i);
        if ((type.isTextblock || type.isText) && !type.hasRequiredAttrs()) {
            return type;
        }
    }
    return null;
}

function isMarkActive(
    state: EditorState,
    type?: MarkType) {
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

function markApplies(
    doc: ProsemirrorNode,
    ranges: readonly SelectionRange[],
    type: MarkType) {
    for (let i = 0; i < ranges.length; i++) {
        const { $from, $to } = ranges[i];
        let can = $from.depth == 0
            ? doc.type.allowsMarkType(type)
            : false;
        doc.nodesBetween($from.pos, $to.pos, node => {
            if (can) {
                return false;
            }
            can = node.inlineContent
                && node.type.allowsMarkType(type);
        })
        if (can) {
            return true;
        }
    }
    return false;
}

function markAround($pos: ResolvedPos, type: MarkType) {
    const { parent, parentOffset } = $pos;
    const start = parent.childAfter(parentOffset);
    if (!start.node) {
        return null;
    }

    const mark = start.node.marks.find((mark) => mark.type === type);
    if (!mark) {
        return null;
    }

    let startIndex = $pos.index();
    let startPos = $pos.start() + start.offset;
    let endIndex = startIndex + 1;
    let endPos = startPos + start.node.nodeSize;
    while (startIndex > 0 && mark.isInSet(parent.child(startIndex - 1).marks)) {
        startIndex--;
        startPos -= parent.child(startIndex).nodeSize;
    }
    while (endIndex < parent.childCount && mark.isInSet(parent.child(endIndex).marks)) {
        endPos += parent.child(endIndex).nodeSize;
        endIndex++;
    }
    return { from: startPos, to: endPos };
}

function markMenuItem(type: MarkType): CommandInfo {
    return {
        command: toggleMark(type),
        isActive(state, type) { return isMarkActive(state, type) },
        markType: type,
    }
}

function removeMarkStyle(
    tr: Transaction,
    styleAttr: string,
    from: number,
    to: number) {
    const set = tr.storedMarks || tr.selection.$head.marks();
    const newSet: Mark[] = [];
    for (let i = 0; i < set.length; i++) {
        if (!set[i].attrs.style
            || set[i].attrs.style.indexOf(styleAttr) == -1) {
            newSet.push(set[i]);
        }
    }

    const matched: { style: Mark, from: number, to: number, step: number }[] = [];
    let step = 0;
    tr.doc.nodesBetween(from, to, (node, pos) => {
        if (!node.isInline) {
            return;
        }
        step++;
        const toRemove: Mark[] = [];
        const set = node.marks;
        for (let i = 0; i < set.length; i++) {
            if (set[i].attrs.style
                && set[i].attrs.style.indexOf(styleAttr) != -1) {
                toRemove.push(set[i]);
            }
        }
        if (toRemove.length) {
            const end = Math.min(pos + node.nodeSize, to);
            for (let i = 0; i < toRemove.length; i++) {
                const style = toRemove[i];
                let found;
                for (let j = 0; j < matched.length; j++) {
                    const m = matched[j];
                    if (m.step == step - 1
                        && style.eq(matched[j].style)) {
                        found = m;
                    }
                }
                if (found) {
                    found.to = end;
                    found.step = step;
                } else {
                    matched.push({ style, from: Math.max(pos, from), to: end, step });
                }
            }
        }
    })
    matched.forEach(m => tr.step(new RemoveMarkStep(m.from, m.to, m.style)));

    return tr.ensureMarks(newSet);
}

function toggleInlineStyle(style: string): CommandInfo {
    const styleAttr = style + ':';
    return {
        command(state, dispatch, _, params) {
            const { from, $from, to, $to } = state.selection;
            const marks = $from.marksAcross($to);

            if (!params || !params.length || !params[0]) {
                let anyStyleSet = false;

                if (marks && marks.length) {
                    marks.forEach(m => anyStyleSet = anyStyleSet
                        || (m.attrs.style
                            && m.attrs.style.indexOf(styleAttr) != -1));
                }

                if (!anyStyleSet) {
                    return false;
                }

                if (dispatch) {
                    const tr = state.tr;
                    removeMarkStyle(tr, styleAttr, from, to);
                    dispatch(tr.scrollIntoView());
                }
                return true;
            }

            const styleValue = `${style}:${params[0]}`;

            const attrs = { style: styleValue };
            const { empty, ranges } = state.selection;
            let $cursor: ResolvedPos | null | undefined;
            if (state.selection instanceof TextSelection) {
                $cursor = (state.selection as TextSelection).$cursor;
            }
            if (empty && !$cursor) {
                return false;
            }
            if (!markApplies(state.doc, ranges, state.schema.marks.span)) {
                return false;
            }
            if (dispatch) {
                const tr = state.tr;
                removeMarkStyle(tr, styleAttr, from, to);
                const mark = state.schema.marks.span.create(attrs);
                if (!empty) {
                    for (let i = 0; i < ranges.length; i++) {
                        const { $from, $to } = ranges[i];
                        let from = $from.pos,
                            to = $to.pos;
                        const start = $from.nodeAfter,
                            end = $to.nodeBefore;
                        const spaceStart = start && start.isText
                            ? (/^\s*/.exec(start.text!))![0].length
                            : 0;
                        const spaceEnd = end && end.isText
                            ? (/\s*$/.exec(end.text!))![0].length
                            : 0;
                        if (from + spaceStart < to) {
                            from += spaceStart;
                            to -= spaceEnd;
                        }
                        tr.addMark(from, to, mark);
                    }
                    dispatch(tr.scrollIntoView());
                } else {
                    dispatch(state.tr.addStoredMark(mark));
                }
            }
            return true;
        },
        isEnabled(state) {
            return toggleMark(state.schema.marks.span, { style: `${style}:placeholder` })(state);
        }
    };
}

function toggleLink(markType: MarkType, state: EditorState, dispatch?: (tr: Transaction) => void, attrs?: Attrs | null) {
    const { empty, ranges } = state.selection;
    if (empty && !markApplies(state.doc, ranges, markType)) {
        return false;
    }
    if (dispatch) {
        let has = false, tr = state.tr;
        for (let i = 0; !has && i < ranges.length; i++) {
            let { $from, $to } = ranges[i];
            has = $from.pos === $to.pos
                ? !!markType.isInSet($from.marks())
                : state.doc.rangeHasMark($from.pos, $to.pos, markType);
        }
        for (let i = 0; i < ranges.length; i++) {
            let { $from, $to } = ranges[i];
            let from = $from.pos, to = $to.pos;
            const around = markAround($from, markType);
            if (around) {
                ({ from, to } = around);
            }
            if (has) {
                tr.removeMark(from, to, markType);
            }
            else {
                let start = $from.nodeAfter, end = $to.nodeBefore;
                const spaceStart = start && start.isText ? /^\s*/.exec(start.text!)![0].length : 0;
                const spaceEnd = end && end.isText ? /\s*$/.exec(end.text!)![0].length : 0;
                if (from + spaceStart < to) {
                    from += spaceStart;
                    to -= spaceEnd;
                }
                tr.addMark(from, to, markType.create(attrs));
            }
        }
        dispatch(tr.scrollIntoView());
    }
    return true;
}

function wrapAndExitDiv(
    nodeType: NodeType,
    attrs?: Attrs | null): Command {
    return function (state, dispatch) {
        const { $from, $to } = state.selection;
        const range = $from.blockRange($to), wrapping = range && findWrapping(range, nodeType, attrs);
        if (!wrapping) {
            return false;
        }
        if (dispatch) {
            const tr = state.tr;
            tr.wrap(range!, wrapping);

            const { $head, $anchor } = tr.selection;
            if ($head.sameParent($anchor)) {
                let div: ProsemirrorNode | null = null;
                let depth = $head.depth;
                for (; depth >= 0; depth--) {
                    const node = $head.node(depth);
                    if (node.type.name == "div") {
                        div = node;
                        break;
                    }
                }
                if (div) {
                    const above = $head.node(depth - 1), after = $head.indexAfter(depth - 1), type = defaultBlockAt(above.contentMatchAt(after));
                    if (type && above.canReplaceWith(after, after, type)) {
                        const pos = $head.after(depth);
                        tr.replaceWith(pos, pos, type.createAndFill()!);
                        tr.setSelection(Selection.near(tr.doc.resolve(pos), 1));
                    }
                }
            }

            dispatch(tr.scrollIntoView());
        }

        return exitDiv(state, dispatch);
    }
}

function wrapOrInsert(
    nodeType: NodeType,
    attrs?: Attrs | null): CommandInfo {
    return {
        command: (state, dispatch) => {
            const { $from, $to } = state.selection;
            const range = $from.blockRange($to);
            if (!range) {
                return false;
            }

            if ($from.sameParent($to)) {
                if ($from.parent.type.name == nodeType.name) {
                    return true;
                }

                const fromIndex = $from.index(),
                    toIndex = $to.index();

                if ($from.parent.type.name == state.schema.nodes.paragraph.name) {
                    if (range.parent.type.name == nodeType.name) {
                        const content = nodeType.createAndFill(attrs, $from.parent.content, $from.parent.marks);
                        if (content) {
                            if (dispatch) {
                                const start = $from.start(range.depth - 1);
                                dispatch(state.tr.replaceWith(
                                    start,
                                    start + range.parent.nodeSize,
                                    content).scrollIntoView());
                            }
                            return true;
                        }
                    }

                    if (range.parent.canReplaceWith($from.index(), $to.index(), nodeType, $from.parent.marks)) {
                        const content = nodeType.createAndFill(attrs, $from.parent.content, $from.parent.marks);
                        if (content) {
                            if (dispatch) {
                                const start = $from.start(range.depth);
                                dispatch(state.tr.replaceWith(
                                    start,
                                    start + $from.parent.nodeSize,
                                    content).scrollIntoView());
                            }
                            return true;
                        }
                    }
                }

                if ($from.pos === $to.pos
                    && $from.parent.canReplaceWith(fromIndex, toIndex, nodeType)) {
                    if (dispatch) {
                        dispatch(state.tr.replaceWith(
                            $from.pos,
                            $to.pos,
                            nodeType.createAndFill(attrs)!).scrollIntoView());
                    }
                    return true;
                }
            }

            const wrapping = findWrapping(range, nodeType, attrs);
            if (!wrapping) {
                return false;
            }

            if (dispatch) {
                dispatch(state.tr.wrap(range!, wrapping).scrollIntoView());
            }

            return true;
        },
        isActive(state) {
            if (state.selection instanceof NodeSelection
                && state.selection.node) {
                return state.selection.node.type.name == nodeType.name;
            }
            const { $from, to } = state.selection;
            return to <= $from.end()
                && $from.parent.type.name == nodeType.name;
        }
    };
}

function wrapOrInsertInlinePhrasingOrFlow(
    phrasingNodeType: NodeType,
    flowNodeType: NodeType,
    attrs?: Attrs | null): CommandInfo {
    return {
        command: (state, dispatch) => {
            const { $from, $to } = state.selection;
            const range = $from.blockRange($to);
            if (!range) {
                return false;
            }

            if ($from.sameParent($to)) {
                if ($from.parent.type.name == phrasingNodeType.name
                    || $from.parent.type.name == flowNodeType.name) {
                    return true;
                }

                const fromIndex = $from.index(),
                    toIndex = $to.index();

                if ($from.parent.type.name == state.schema.nodes.paragraph.name) {
                    if (range.parent.type.name == flowNodeType.name) {
                        const content = phrasingNodeType.createAndFill(attrs, $from.parent.content, $from.parent.marks);
                        if (content) {
                            if (dispatch) {
                                const start = $from.start(range.depth - 1);
                                dispatch(state.tr.replaceWith(
                                    start,
                                    start + range.parent.nodeSize,
                                    content).scrollIntoView());
                            }
                            return true;
                        }
                    }

                    if (range.parent.canReplaceWith(fromIndex, toIndex, phrasingNodeType, $from.parent.marks)) {
                        const content = phrasingNodeType.createAndFill(attrs, $from.parent.content, $from.parent.marks);
                        if (content) {
                            if (dispatch) {
                                const start = $from.start(range.depth);
                                dispatch(state.tr.replaceWith(
                                    start,
                                    start + $from.parent.nodeSize,
                                    content).scrollIntoView());
                            }
                            return true;
                        }
                    }

                    if (range.parent.canReplaceWith(fromIndex, toIndex, flowNodeType, $from.parent.marks)) {
                        const content = flowNodeType.createAndFill(attrs, $from.parent.content, $from.parent.marks);
                        if (content) {
                            if (dispatch) {
                                const start = $from.start(range.depth);
                                dispatch(state.tr.replaceWith(
                                    start,
                                    start + $from.parent.nodeSize,
                                    content).scrollIntoView());
                            }
                            return true;
                        }
                    }
                }

                if ($from.pos === $to.pos) {
                    if ($from.parent.canReplaceWith(fromIndex, toIndex, phrasingNodeType)) {
                        const content = phrasingNodeType.createAndFill(attrs, state.schema.text(' '));
                        if (content) {
                            if (dispatch) {
                                const tr = state.tr.replaceWith(
                                    $from.pos,
                                    $to.pos,
                                    content);
                                dispatch(tr
                                    .setSelection(TextSelection.between(tr.doc.resolve($from.pos + 1), tr.doc.resolve($from.pos + 2)))
                                    .scrollIntoView());
                            }
                            return true;
                        }
                    }

                    if ($from.parent.canReplaceWith(fromIndex, toIndex, flowNodeType)) {
                        const content = flowNodeType.createAndFill(attrs);
                        if (content) {
                            if (dispatch) {
                                const tr = state.tr.replaceWith(
                                    $from.pos,
                                    $to.pos,
                                    content);
                                dispatch(tr
                                    .setSelection(Selection.near(tr.doc.resolve($from.pos + 1)))
                                    .scrollIntoView());
                            }
                            return true;
                        }
                    }

                    const alternate = $from.parent.type.spec.alternate
                        ? state.schema.nodes[$from.parent.type.spec.alternate]
                        : null;
                    if (alternate
                        && range.parent.canReplaceWith(fromIndex, toIndex, alternate, $from.parent.marks)) {
                        if ($from.parent.content.size === 0) {
                            if (alternate.contentMatch.matchType(phrasingNodeType)) {
                                const node = alternate.createAndFill(attrs, phrasingNodeType.createAndFill(attrs, state.schema.text(' ')), $from.parent.marks);
                                if (node) {
                                    if (dispatch) {
                                        const start = $from.start(range.depth);
                                        const tr = state.tr.replaceWith(start, start + $from.parent.nodeSize, node);
                                        dispatch(tr
                                            .setSelection(TextSelection.between(tr.doc.resolve(start + 2), tr.doc.resolve(start + 3)))
                                            .scrollIntoView());
                                    }
                                    return true;
                                }
                            } else if (alternate.contentMatch.matchType(flowNodeType)) {
                                const node = alternate.createAndFill(attrs, flowNodeType.createAndFill(attrs), $from.parent.marks);
                                if (node) {
                                    if (dispatch) {
                                        const start = $from.start(range.depth);
                                        const tr = state.tr.replaceWith(start, start + $from.parent.nodeSize, node);
                                        dispatch(tr
                                            .setSelection(Selection.near(tr.doc.resolve(start + 2)))
                                            .scrollIntoView());
                                    }
                                    return true;
                                }
                            }
                        } else {
                            const node = alternate.createAndFill(attrs, $from.parent.content, $from.parent.marks);
                            if (node) {
                                if (node.canReplaceWith(0, 0, phrasingNodeType)) {
                                    const content = phrasingNodeType.createAndFill(attrs, state.schema.text(' '));
                                    if (content) {
                                        if (dispatch) {
                                            const start = $from.start(range.depth);
                                            const tr = state.tr.replaceWith(start, start + $from.parent.nodeSize, node)
                                                .replaceWith($from.pos, $to.pos, content);
                                            dispatch(tr
                                                .setSelection(TextSelection.between(tr.doc.resolve($from.pos + 1), tr.doc.resolve($from.pos + 2)))
                                                .scrollIntoView());
                                        }
                                        return true;
                                    }
                                }

                                if (node.canReplaceWith(0, 0, flowNodeType)) {
                                    const content = flowNodeType.createAndFill(attrs);
                                    if (content) {
                                        if (dispatch) {
                                            const start = $from.start(range.depth);
                                            const tr = state.tr.replaceWith(start, start + $from.parent.nodeSize, node)
                                                .replaceWith($from.pos, $to.pos, content);
                                            dispatch(tr
                                                .setSelection(Selection.near(tr.doc.resolve($from.pos + 1)))
                                                .scrollIntoView());
                                        }
                                        return true;
                                    }
                                }
                            }
                        }
                    }
                }
            }

            const phrasingWrapping = findWrapping(range, phrasingNodeType, attrs);
            const flowWrapping = findWrapping(range, flowNodeType, attrs);
            if (!phrasingWrapping && !flowWrapping) {
                return false;
            }

            if (dispatch) {
                if (phrasingWrapping) {
                    dispatch(state.tr.wrap(range, phrasingWrapping).scrollIntoView());
                } else {
                    dispatch(state.tr.wrap(range, flowWrapping!).scrollIntoView());
                }
            }

            return true;
        },
        isActive(state) {
            if (state.selection instanceof NodeSelection
                && state.selection.node) {
                return state.selection.node.type.name == phrasingNodeType.name
                    || state.selection.node.type.name == flowNodeType.name;
            }
            const { $from, to } = state.selection;
            return to <= $from.end()
                && ($from.parent.type.name == phrasingNodeType.name
                    || $from.parent.type.name == flowNodeType.name);
        }
    };
}

function wrapOrInsertPhrasingOrFlow(
    phrasingNodeType: NodeType,
    flowNodeType: NodeType,
    attrs?: Attrs | null): CommandInfo {
    return {
        command: (state, dispatch) => {
            const { $from, $to } = state.selection;
            const range = $from.blockRange($to);
            if (!range) {
                return false;
            }

            if ($from.sameParent($to)) {
                if ($from.parent.type.name == phrasingNodeType.name
                    || $from.parent.type.name == flowNodeType.name) {
                    return true;
                }

                const fromIndex = $from.index(),
                    toIndex = $to.index();

                if ($from.parent.type.name == state.schema.nodes.paragraph.name) {
                    if (range.parent.type.name == flowNodeType.name) {
                        const content = phrasingNodeType.createAndFill(attrs, $from.parent.content, $from.parent.marks);
                        if (content) {
                            if (dispatch) {
                                const start = $from.start(range.depth - 1);
                                dispatch(state.tr.replaceWith(
                                    start,
                                    start + range.parent.nodeSize,
                                    content).scrollIntoView());
                            }
                            return true;
                        }
                    }

                    if (range.parent.canReplaceWith(fromIndex, toIndex, phrasingNodeType, $from.parent.marks)) {
                        const content = phrasingNodeType.createAndFill(attrs, $from.parent.content, $from.parent.marks);
                        if (content) {
                            if (dispatch) {
                                const start = $from.start(range.depth);
                                dispatch(state.tr.replaceWith(
                                    start,
                                    start + $from.parent.nodeSize,
                                    content).scrollIntoView());
                            }
                            return true;
                        }
                    }

                    if (range.parent.canReplaceWith(fromIndex, toIndex, flowNodeType, $from.parent.marks)) {
                        const content = flowNodeType.createAndFill(attrs, $from.parent.content, $from.parent.marks);
                        if (content) {
                            if (dispatch) {
                                const start = $from.start(range.depth);
                                dispatch(state.tr.replaceWith(
                                    start,
                                    start + $from.parent.nodeSize,
                                    content).scrollIntoView());
                            }
                            return true;
                        }
                    }
                }

                if ($from.pos === $to.pos) {
                    if ($from.parent.canReplaceWith(fromIndex, toIndex, phrasingNodeType)) {
                        const content = phrasingNodeType.createAndFill(attrs);
                        if (content) {
                            if (dispatch) {
                                const tr = state.tr.replaceWith(
                                    $from.pos,
                                    $to.pos,
                                    content);
                                dispatch(tr
                                    .setSelection(Selection.near(tr.doc.resolve($from.pos + 1)))
                                    .scrollIntoView());
                            }
                            return true;
                        }
                    }

                    if ($from.parent.canReplaceWith(fromIndex, toIndex, flowNodeType)) {
                        const content = flowNodeType.createAndFill(attrs);
                        if (content) {
                            if (dispatch) {
                                const tr = state.tr.replaceWith(
                                    $from.pos,
                                    $to.pos,
                                    content);
                                dispatch(tr
                                    .setSelection(Selection.near(tr.doc.resolve($from.pos + 1)))
                                    .scrollIntoView());
                            }
                            return true;
                        }
                    }

                    const alternate = $from.parent.type.spec.alternate
                        ? state.schema.nodes[$from.parent.type.spec.alternate]
                        : null;
                    if (alternate
                        && range.parent.canReplaceWith(fromIndex, toIndex, alternate, $from.parent.marks)) {
                        if ($from.parent.content.size === 0) {
                            if (alternate.contentMatch.matchType(phrasingNodeType)) {
                                const node = alternate.createAndFill(attrs, phrasingNodeType.createAndFill(attrs), $from.parent.marks);
                                if (node) {
                                    if (dispatch) {
                                        const start = $from.start(range.depth);
                                        const tr = state.tr.replaceWith(start, start + $from.parent.nodeSize, node);
                                        dispatch(tr
                                            .setSelection(Selection.near(tr.doc.resolve(start + 2)))
                                            .scrollIntoView());
                                    }
                                    return true;
                                }
                            } else if (alternate.contentMatch.matchType(flowNodeType)) {
                                const node = alternate.createAndFill(attrs, flowNodeType.createAndFill(attrs), $from.parent.marks);
                                if (node) {
                                    if (dispatch) {
                                        const start = $from.start(range.depth);
                                        const tr = state.tr.replaceWith(start, start + $from.parent.nodeSize, node);
                                        dispatch(tr
                                            .setSelection(Selection.near(tr.doc.resolve(start + 2)))
                                            .scrollIntoView());
                                    }
                                    return true;
                                }
                            }
                        } else {
                            const node = alternate.createAndFill(attrs, $from.parent.content, $from.parent.marks);
                            if (node) {
                                if (node.canReplaceWith(0, 0, phrasingNodeType)) {
                                    const content = phrasingNodeType.createAndFill(attrs);
                                    if (content) {
                                        if (dispatch) {
                                            const start = $from.start(range.depth);
                                            const tr = state.tr.replaceWith(start, start + $from.parent.nodeSize, node)
                                                .replaceWith($from.pos, $to.pos, content);
                                            dispatch(tr
                                                .setSelection(Selection.near(tr.doc.resolve($from.pos + 1)))
                                                .scrollIntoView());
                                        }
                                        return true;
                                    }
                                }

                                if (node.canReplaceWith(0, 0, flowNodeType)) {
                                    const content = flowNodeType.createAndFill(attrs);
                                    if (content) {
                                        if (dispatch) {
                                            const start = $from.start(range.depth);
                                            const tr = state.tr.replaceWith(start, start + $from.parent.nodeSize, node)
                                                .replaceWith($from.pos, $to.pos, content);
                                            dispatch(tr
                                                .setSelection(Selection.near(tr.doc.resolve($from.pos + 1)))
                                                .scrollIntoView());
                                        }
                                        return true;
                                    }
                                }
                            }
                        }
                    }
                }
            }

            const phrasingWrapping = findWrapping(range, phrasingNodeType, attrs);
            const flowWrapping = findWrapping(range, flowNodeType, attrs);
            if (!phrasingWrapping && !flowWrapping) {
                return false;
            }

            if (dispatch) {
                if (phrasingWrapping) {
                    dispatch(state.tr.wrap(range, phrasingWrapping).scrollIntoView());
                } else {
                    dispatch(state.tr.wrap(range, flowWrapping!).scrollIntoView());
                }
            }

            return true;
        },
        isActive(state) {
            if (state.selection instanceof NodeSelection
                && state.selection.node) {
                return state.selection.node.type.name == phrasingNodeType.name
                    || state.selection.node.type.name == flowNodeType.name;
            }
            const { $from, to } = state.selection;
            return to <= $from.end()
                && ($from.parent.type.name == phrasingNodeType.name
                    || $from.parent.type.name == flowNodeType.name);
        }
    };
}
