import { autoJoin } from "prosemirror-commands";
import { Attrs, Fragment, MarkType, NodeRange, NodeType, Slice } from "prosemirror-model";
import { Command, EditorState, Transaction } from "prosemirror-state";
import {
    canJoin,
    canSplit,
    findWrapping,
    liftTarget,
    ReplaceAroundStep,
    ReplaceStep,
} from "prosemirror-transform";
import { EditorView } from "prosemirror-view";

interface ParamCommand {
    (state: EditorState, dispatch?: (tr: Transaction) => void, view?: EditorView, params?: any[]): boolean;
}

export interface CommandInfo {
    command: ParamCommand;
    isActive?: (state: EditorState, type?: MarkType) => boolean;
    isEnabled?: (state: EditorState) => boolean;
    markType?: MarkType;
}

export function liftListItemTypes(listItemTypes: NodeType[]): Command {
    return (state, dispatch) => {
        const { $from, $to } = state.selection;
        const range = $from.blockRange(
            $to,
            node => node.childCount > 0
                && listItemTypes.includes(node.firstChild!.type));
        if (!range) {
            return false;
        }
        if (!dispatch) {
            return true;
        }
        const node = $from.node(range.depth - 1);
        if (listItemTypes.includes(node.type)) { // Inside a parent list item
            return liftToOuterList(state, dispatch, node.type, range);
        } else { // Outer list item
            return liftOutOfList(state, dispatch, range);
        }
    };
}

export function sinkListItemTypes(listItemTypes: NodeType[]): Command {
    return (state, dispatch) => {
        const { $from, $to } = state.selection;
        const range = $from.blockRange(
            $to,
            node => node.childCount > 0
                && listItemTypes.includes(node.firstChild!.type));
        if (!range) {
            return false;
        }
        const startIndex = range.startIndex;
        if (startIndex == 0) {
            return false;
        }
        const parent = range.parent,
            nodeBefore = parent.child(startIndex - 1),
            nodeAfter = parent.maybeChild(range.endIndex);
        if (!listItemTypes.includes(nodeBefore.type)) {
            return false;
        }

        const nestedBefore = nodeBefore.lastChild
            && nodeBefore.lastChild.type == parent.type;
        const nestedAfter = nodeAfter
            && nodeAfter.lastChild
            && nodeAfter.lastChild.type == parent.type;
        const list = Fragment.from(parent.type.create());
        let itemType: NodeType | undefined;
        let useNestedAfter = !!nestedAfter;
        if (nestedBefore) {
            itemType = nodeBefore.type;
            useNestedAfter = useNestedAfter
                && !!nodeAfter
                && nodeAfter.type == itemType;
        } else {
            for (let i = 0; i < listItemTypes.length; i++) {
                if (listItemTypes[i].validContent(list)) {
                    itemType = listItemTypes[i];
                    break;
                }
            }
        }
        if (!itemType) {
            return false;
        }

        if (dispatch) {
            const slice = new Slice(
                Fragment.from(itemType.create(null, list)),
                nestedBefore ? 2 : 0,
                useNestedAfter ? 2 : 0);
            const before = range.start,
                after = range.end;
            dispatch(state.tr.step(new ReplaceAroundStep(
                before - (nestedBefore ? 2 : 0),
                after + (useNestedAfter ? 2 : 0),
                before,
                after,
                slice,
                nestedBefore ? 0 : 2,
                true)).scrollIntoView());
        }
        return true;
    };
}

export function wrapInPhrasingOrFlowList(
    listType: NodeType,
    phrasingItemType: NodeType,
    attrs?: Attrs | null): CommandInfo {
    return {
        command: autoJoin((state, dispatch) => {
            const { $from, $to } = state.selection;
            let range = $from.blockRange($to), doJoin = false, outerRange = range;
            if (!range) {
                return false;
            }
            // This is an existing list of the same type
            if (range.depth >= 1
                && $from.node(range.depth).type.name === listType.name) {
                if (dispatch) {
                    return liftOutOfList(state, dispatch, range);
                } else {
                    return true;
                }
            }
            // This is at the top of an existing list item
            if (range.depth >= 2
                && $from.node(range.depth - 1).type.compatibleContent(listType)
                && range.startIndex == 0) {
                // Don't do anything if this is the top of the list
                if ($from.index(range.depth - 1) == 0) {
                    return false;
                }
                const $insert = state.doc.resolve(range.start - 2);
                outerRange = new NodeRange($insert, $insert, range.depth);
                if (range.endIndex < range.parent.childCount) {
                    range = new NodeRange($from, state.doc.resolve($to.end(range.depth)), range.depth);
                }
                doJoin = true;
            }
            if (range.$from.parent.type.name === state.schema.nodes.paragraph.name
                && range.$from.sameParent(range.$to)
                && (range.$from.parent.childCount === 0
                    || (range.$from.parent.childCount === 1
                        && range.$from.parent.firstChild!.isText))) {
                const content = listType.createAndFill(attrs, phrasingItemType.createAndFill(null, range.$from.parent.content, range.$from.parent.marks));
                if (content) {
                    if (dispatch) {
                        const start = range.$from.start() - 1;
                        dispatch(state.tr.replaceWith(
                            start,
                            start + range.$from.parent.nodeSize,
                            content).scrollIntoView());
                    }
                    return true;
                }
            }
            const wrap = findWrapping(outerRange!, listType, attrs, range);
            if (!wrap) {
                return false;
            }
            if (dispatch) {
                dispatch(doWrapInList(state, state.tr, range, wrap, doJoin, listType, phrasingItemType).scrollIntoView());
            }
            return true;
        }, ['ordered_list', 'task_list', 'bullet_list'])
    };
}

function doWrapInList(
    state: EditorState,
    tr: Transaction,
    range: NodeRange,
    wrappers: { type: NodeType, attrs?: Attrs | null }[],
    joinBefore: boolean,
    listType: NodeType,
    phrasingItemType: NodeType) {
    let content = Fragment.empty;
    for (let i = wrappers.length - 1; i >= 0; i--) {
        content = Fragment.from(wrappers[i].type.create(wrappers[i].attrs, content));
    }

    tr.step(new ReplaceAroundStep(
        range.start - (joinBefore ? 2 : 0),
        range.end,
        range.start,
        range.end,
        new Slice(content, 0, 0),
        wrappers.length,
        true));

    let found = 0;
    for (let i = 0; i < wrappers.length; i++) {
        if (wrappers[i].type == listType) {
            found = i + 1;
        }
    }
    let splitDepth = wrappers.length - found;

    let splitPos = range.start + wrappers.length - (joinBefore ? 2 : 0),
        parent = range.parent;
    for (let i = range.startIndex,
        e = range.endIndex,
        first = true;
        i < e;
        i++,
        first = false) {
        if (!first && canSplit(tr.doc, splitPos, splitDepth)) {
            tr.split(splitPos, splitDepth);

            let start = splitPos + splitDepth;
            splitPos += (2 * splitDepth) + parent.child(i).nodeSize;

            const $start = tr.doc.resolve(start);
            const nodeBefore = $start.nodeBefore;
            const nodeAfter = $start.nodeAfter;
            let replaced = false;
            if (nodeBefore
                && nodeBefore.firstChild
                && nodeBefore.firstChild.type.name === state.schema.nodes.paragraph.name
                && (nodeBefore.firstChild.childCount === 0
                    || (nodeBefore.firstChild.childCount === 1
                        && nodeBefore.firstChild.firstChild!.isText))) {
                tr.step(new ReplaceAroundStep(
                    start - nodeBefore.nodeSize,
                    start,
                    start - nodeBefore.nodeSize + 2,
                    start - 2,
                    new Slice(Fragment.from(phrasingItemType.create()), 0, 0),
                    1));
                replaced = true;
                start -= 2;
            }

            if (nodeAfter
                && nodeAfter.firstChild
                && nodeAfter.firstChild.type.name === state.schema.nodes.paragraph.name
                && (nodeAfter.firstChild.childCount === 0
                    || (nodeAfter.firstChild.childCount === 1
                        && nodeAfter.firstChild.firstChild!.isText))) {
                tr.step(new ReplaceAroundStep(
                    start,
                    start + nodeAfter.nodeSize,
                    start + 2,
                    start + nodeAfter.nodeSize - 2,
                    new Slice(Fragment.from(phrasingItemType.create()), 0, 0),
                    1));
                replaced = true;
            }

            if (replaced) {
                splitPos = tr.mapping.map(splitPos);
            }
        } else {
            splitPos += parent.child(i).nodeSize;
        }
    }
    return tr;
}

function liftOutOfList(
    state: EditorState,
    dispatch: (tr: Transaction) => void,
    range: NodeRange) {
    const tr = state.tr,
        list = range.parent,
        $start = tr.doc.resolve(range.start),
        start = $start.pos,
        $end = tr.doc.resolve(range.end),
        end = $end.pos,
        atStart = range.startIndex == 0,
        atEnd = range.endIndex == list.childCount,
        parent = $start.node(-1);

    // Flatten the list items
    let content = Fragment.empty;
    for (let i = range.startIndex,
        e = range.endIndex;
        i < e;
        i++) {
        const child = list.child(i);

        // Convert text list items to paragraphs
        if (child.type.spec.alternate == 'list_item') {
            content = content.append(Fragment.from(state.schema.nodes.paragraph.create(null, child.content)));
        } else if (!parent.type.validContent(child.content)) {
            // wrap invalid content in a div (which should always fit where the list would fit)
            content = content.append(Fragment.from(state.schema.nodes.div.create(null, child.content)));
        } else {
            content = content.append(Fragment.from(child.content));
        }
    }

    // Strip off the surrounding list. At the sides where we're not at
    // the end of the list, the existing list is closed. At sides where
    // this is the end, it is overwritten to its end.
    tr.step(new ReplaceStep(
        start - (atStart ? 1 : 0),
        end + (atEnd ? 1 : 0),
        new Slice((atStart ? Fragment.empty : Fragment.from(list.copy(Fragment.empty)))
            .append(content)
            .append(atEnd ? Fragment.empty : Fragment.from(list.copy(Fragment.empty))),
            atStart ? 0 : 1,
            atEnd ? 0 : 1)));
    dispatch(tr.scrollIntoView());
    return true;
}

function liftToOuterList(
    state: EditorState,
    dispatch: (tr: Transaction) => void,
    itemType: NodeType,
    range: NodeRange) {
    const tr = state.tr;
    let end = range.end,
        endOfList = range.$to.end(range.depth);
    // There are siblings after the lifted items, which must become
    // children of the last item
    if (end < endOfList) {
        const lastItem = range.parent.child(range.endIndex - 1);
        // If the last item does not permit a nested list, it must be replaced
        if (!lastItem.type.validContent(Fragment.from(range.parent))) {
            if (!lastItem.type.spec.alternate) {
                return false;
            }
            const lastItemStart = range.$from.posAtIndex(range.endIndex - 1) - 1,
                lastItemEnd = lastItemStart + lastItem.nodeSize;
            if (lastItem.childCount > 0) {
                tr.step(new ReplaceAroundStep(
                    lastItemStart,
                    lastItemEnd,
                    lastItemStart + 1,
                    lastItemEnd - 1,
                    new Slice(Fragment.from(state.schema.nodes[lastItem.type.spec.alternate].create(null, state.schema.nodes.paragraph.create())), 0, 0),
                    2));
            } else {
                tr.step(new ReplaceAroundStep(
                    lastItemStart,
                    lastItemEnd,
                    lastItemStart + 1,
                    lastItemEnd - 1,
                    new Slice(Fragment.from(state.schema.nodes[lastItem.type.spec.alternate].create()), 0, 0),
                    1));
            }
            end = tr.mapping.map(end),
                endOfList = tr.mapping.map(endOfList);
        }

        tr.step(new ReplaceAroundStep(
            end - 1,
            endOfList,
            end,
            endOfList,
            new Slice(Fragment.from(itemType.create(null, range.parent.copy())), 1, 0),
            1,
            true));
        range = new NodeRange(
            tr.doc.resolve(tr.mapping.map(range.$from.pos)),
            tr.doc.resolve(endOfList),
            range.depth);
    }
    const target = liftTarget(range);
    if (target == null) {
        return false;
    }
    tr.lift(range, target);
    const after = tr.mapping.map(end, -1) - 1;
    if (canJoin(tr.doc, after)) {
        tr.join(after);
    }
    dispatch(tr.scrollIntoView());
    return true;
}