import { keydownHandler } from "prosemirror-keymap";
import { NodeType } from "prosemirror-model";
import { Fragment, Node as ProsemirrorNode, ResolvedPos, Schema, Slice } from "prosemirror-model";
import {
    Command,
    EditorState,
    NodeSelection,
    Plugin,
    PluginKey,
    Selection,
    SelectionBookmark,
    TextSelection,
    Transaction,
} from "prosemirror-state";
import { Mappable, ReplaceAroundStep, Transform } from "prosemirror-transform";
import { Decoration, DecorationSet, EditorView, NodeView } from "prosemirror-view";

export const cellMinWidth = 25;

const cache = new WeakMap<ProsemirrorNode, TableMap>();
const columnResizingKey = new PluginKey("tableColumnResizing");
const fixTablesKey = new PluginKey("fix-tables");
const selectCellKey = new PluginKey("selectingCells");

export const columnResizing = new Plugin<ResizeState>({
    key: columnResizingKey,
    state: {
        init() { return new ResizeState(-1, null); },
        apply(tr, prev) {
            return prev.apply(tr);
        }
    },
    props: {
        attributes(state) {
            let pluginState = columnResizingKey.getState(state);
            const classes: { [name: string]: string } = {};
            if (pluginState.activeHandle > -1) {
                classes.class = "resize-cursor";
            }
            return classes;
        },

        handleDOMEvents: {
            mousemove(view, event) {
                handleColumnResizeMouseMove(view, event as MouseEvent);
                return false;
            },
            mouseleave(view) {
                handleColumnResizeMouseLeave(view);
                return false;
            },
            mousedown(view, event) {
                return handleColumnResizeMouseDown(view, event as MouseEvent, cellMinWidth);
            }
        },

        decorations(state) {
            let pluginState = columnResizingKey.getState(state);
            if (pluginState.activeHandle && pluginState.activeHandle > -1) {
                return handleColumnResizeDecorations(state, pluginState.activeHandle);
            }
            return null;
        },

        nodeViews: {}
    }
});

const handleKeyDown = keydownHandler({
    "ArrowLeft": arrow("horiz", -1),
    "ArrowRight": arrow("horiz", 1),
    "ArrowUp": arrow("vert", -1),
    "ArrowDown": arrow("vert", 1),

    "Shift-ArrowLeft": shiftArrow("horiz", -1),
    "Shift-ArrowRight": shiftArrow("horiz", 1),
    "Shift-ArrowUp": shiftArrow("vert", -1),
    "Shift-ArrowDown": shiftArrow("vert", 1),

    "Backspace": deleteCellSelection,
    "Mod-Backspace": deleteCellSelection,
    "Delete": deleteCellSelection,
    "Mod-Delete": deleteCellSelection,
});

export const tableEditing = new Plugin({
    key: selectCellKey,

    // This piece of state is used to remember when a mouse-drag
    // cell-selection is happening, so that it can continue even as
    // transactions (which might move its anchor cell) come in.
    state: {
        init() { return null },
        apply(tr, cur) {
            const set = tr.getMeta(selectCellKey);
            if (set != null) {
                return set == -1 ? null : set;
            }
            if (cur == null || !tr.docChanged) {
                return cur;
            }
            const { deleted, pos } = tr.mapping.mapResult(cur);
            return deleted ? null : pos;
        }
    },

    props: {
        decorations: drawCellSelection,

        handleDOMEvents: {
            mousedown: handleMouseDown
        },

        createSelectionBetween(view) {
            if (selectCellKey.getState(view.state) != null) {
                return view.state.selection;
            }
            return null;
        },

        handleTripleClick,

        handleKeyDown,

        handlePaste,
    },

    appendTransaction(_, oldState, state) {
        return normalizeSelection(state, fixTables(state, oldState));
    }
});

export const toggleHeaderColumn = toggleHeader("column");
export const toggleHeaderRow = toggleHeader("row");

/**
 * A [`Selection`](http://prosemirror.net/docs/ref/#state.Selection)
 * subclass that represents a cell selection spanning part of a table.
 * With the plugin enabled, these will be created when the user
 * selects across cells, and will be drawn by giving selected cells a
 * `selectedCell` CSS class.
 */
export class CellSelection extends Selection {
    /**
     * A table selection is identified by its anchor and head cells. The
     * positions given to this constructor should point _before_ two
     * cells in the same table. They may be the same, to select a single
     * cell.
     * @param $anchorCell A resolved positionpointing _in front of_ the anchor cell (the one
     * that doesn't move when extending the selection).
     * @param $headCellA resolved position pointing in front of the head cell (the one
     * that moves when extending the selection).
     */
    constructor(public $anchorCell: ResolvedPos, public $headCell: ResolvedPos = $anchorCell) {
        let d = $anchorCell.depth;
        for (; d > 0; d--) {
            if ($anchorCell.node(d).type.spec.tableRole == "table") {
                break;
            }
        }
        const table = $anchorCell.node(d), map = TableMap.get(table), start = $anchorCell.start(d) + 1;
        const rect = map.rectBetween($anchorCell.pos - start, $headCell.pos - start);
        const doc = $anchorCell.node(0);
        const cells = map.cellsInRect(rect).filter(p => p != $headCell.pos - start);
        // Make the head cell the first range, so that it counts as the
        // primary part of the selection
        cells.unshift($headCell.pos - start);
        const ranges = cells.map(pos => {
            const cell = table.nodeAt(pos)!, from = pos + start;
            return new TextSelection(doc.resolve(from), doc.resolve(from + cell.content.size)).ranges[0];
        })
        super(ranges[0].$from, ranges[0].$to, ranges);
    }

    map(doc: ProsemirrorNode, mapping: Mappable): Selection {
        const $anchorCell = doc.resolve(mapping.map(this.$anchorCell.pos));
        const $headCell = doc.resolve(mapping.map(this.$headCell.pos));
        if (pointsAtCell($anchorCell)
            && pointsAtCell($headCell)
            && inSameTable($anchorCell, $headCell)) {
            let d = $anchorCell.depth;
            for (; d > 0; d--) {
                if ($anchorCell.node(d).type.spec.tableRole == "table") {
                    break;
                }
            }
            const tableChanged = this.$anchorCell.node(d) != $anchorCell.node(d);
            if (tableChanged && this.isRowSelection()) {
                return CellSelection.rowSelection($anchorCell, $headCell);
            } else if (tableChanged && this.isColSelection()) {
                return CellSelection.colSelection($anchorCell, $headCell);
            } else {
                return new CellSelection($anchorCell, $headCell);
            }
        }
        return TextSelection.between($anchorCell, $headCell);
    }

    /**
     * Returns a rectangular slice of table rows containing the selected cells.
     */
    content() {
        let d = this.$anchorCell.depth;
        for (; d > 0; d--) {
            if (this.$anchorCell.node(d).type.spec.tableRole == "table") {
                break;
            }
        }
        const table = this.$anchorCell.node(d), map = TableMap.get(table), start = this.$anchorCell.start(d) + 1;
        const rect = map.rectBetween(this.$anchorCell.pos - start, this.$headCell.pos - start);
        const seen: { [index: number]: boolean } = {}, rows: ProsemirrorNode[] = [];
        for (let row = rect.top; row < rect.bottom; row++) {
            const rowContent: ProsemirrorNode[] = [];
            for (let index = row * map.width + rect.left, col = rect.left; col < rect.right; col++, index++) {
                const pos = map.map[index];
                if (!seen[pos]) {
                    seen[pos] = true;
                    const cellRect = map.findCell(pos);
                    let cell = table.nodeAt(pos)!;
                    const extraLeft = rect.left - cellRect.left, extraRight = cellRect.right - rect.right;
                    if (extraLeft > 0 || extraRight > 0) {
                        let attrs = cell.attrs;
                        if (extraLeft > 0) {
                            attrs = removeColSpan(attrs, 0, extraLeft);
                        }
                        if (extraRight > 0) {
                            attrs = removeColSpan(attrs, attrs.colspan - extraRight, extraRight);
                        }
                        if (cellRect.left < rect.left) {
                            cell = cell.type.createAndFill(attrs)!;
                        } else {
                            cell = cell.type.create(attrs, cell.content);
                        }
                    }
                    if (cellRect.top < rect.top || cellRect.bottom > rect.bottom) {
                        const attrs = setAttr(
                            cell.attrs,
                            "rowspan",
                            Math.min(cellRect.bottom, rect.bottom) - Math.max(cellRect.top, rect.top));
                        if (cellRect.top < rect.top) {
                            cell = cell.type.createAndFill(attrs)!;
                        } else {
                            cell = cell.type.create(attrs, cell.content);
                        }
                    }
                    rowContent.push(cell);
                }
            }
            rows.push(table.child(row).copy(Fragment.from(rowContent)));
        }

        const fragment = this.isColSelection() && this.isRowSelection() ? table : rows;
        return new Slice(Fragment.from(fragment), 1, 1);
    }

    replace(tr: Transaction, content: Slice = Slice.empty) {
        const mapFrom = tr.steps.length, ranges = this.ranges;
        for (let i = 0; i < ranges.length; i++) {
            const { $from, $to } = ranges[i], mapping = tr.mapping.slice(mapFrom);
            tr.replace(
                mapping.map($from.pos),
                mapping.map($to.pos),
                i ? Slice.empty : content);
        }
        const sel = Selection.findFrom(tr.doc.resolve(tr.mapping.slice(mapFrom).map(this.to)), -1);
        if (sel) {
            tr.setSelection(sel);
        }
    }

    replaceWith(tr: Transaction, node: ProsemirrorNode) {
        this.replace(tr, new Slice(Fragment.from(node), 0, 0));
    }

    forEachCell(f: (node: ProsemirrorNode, pos: number) => void) {
        let d = this.$anchorCell.depth;
        for (; d > 0; d--) {
            if (this.$anchorCell.node(d).type.spec.tableRole == "table") {
                break;
            }
        }
        const table = this.$anchorCell.node(d), map = TableMap.get(table), start = this.$anchorCell.start(d) + 1;
        const cells = map.cellsInRect(map.rectBetween(this.$anchorCell.pos - start, this.$headCell.pos - start));
        for (let i = 0; i < cells.length; i++) {
            f(table.nodeAt(cells[i])!, start + cells[i]);
        }
    }

    /**
     * True if this selection goes all the way from the top to the
     * bottom of the table body (or table, if there is no body).
     */
    isColSelection() {
        let d = this.$anchorCell.depth;
        for (; d > 0; d--) {
            if (this.$anchorCell.node(d).type.spec.tableRole == "table") {
                break;
            }
        }
        const anchorTop = this.$anchorCell.index(d), headTop = this.$headCell.index(d);
        if (Math.min(anchorTop, headTop) > 0) {
            return false;
        }
        const anchorBot = anchorTop + this.$anchorCell.node().attrs.rowspan,
            headBot = headTop + this.$headCell.node().attrs.rowspan;
        return Math.max(anchorBot, headBot) == this.$headCell.node(d).childCount;
    }

    /**
     * Returns the smallest column selection that covers the given anchor
     * and head cell.
     */
    static colSelection($anchorCell: ResolvedPos, $headCell: ResolvedPos = $anchorCell) {
        let d = $anchorCell.depth;
        for (; d > 0; d--) {
            if ($anchorCell.node(d).type.spec.tableRole == "table") {
                break;
            }
        }
        const map = TableMap.get($anchorCell.node(d)), start = $anchorCell.start(d) + 1;
        const anchorRect = map.findCell($anchorCell.pos - start), headRect = map.findCell($headCell.pos - start);
        const doc = $anchorCell.node(0);
        if (anchorRect.top <= headRect.top) {
            if (anchorRect.top > 0) {
                $anchorCell = doc.resolve(start + map.map[anchorRect.left]);
            }
            if (headRect.bottom < map.height) {
                $headCell = doc.resolve(start + map.map[map.width * (map.height - 1) + headRect.right - 1]);
            }
        } else {
            if (headRect.top > 0) {
                $headCell = doc.resolve(start + map.map[headRect.left]);
            }
            if (anchorRect.bottom < map.height) {
                $anchorCell = doc.resolve(start + map.map[map.width * (map.height - 1) + anchorRect.right - 1]);
            }
        }
        return new CellSelection($anchorCell, $headCell);
    }

    /**
     * True if this selection goes all the way from the left to the
     * right of the table.
     */
    isRowSelection() {
        let d = this.$anchorCell.depth;
        for (; d > 0; d--) {
            if (this.$anchorCell.node(d).type.spec.tableRole == "table") {
                break;
            }
        }
        const map = TableMap.get(this.$anchorCell.node(d)), start = this.$anchorCell.start(d) + 1;
        const anchorLeft = map.colCount(this.$anchorCell.pos - start),
            headLeft = map.colCount(this.$headCell.pos - start);
        if (Math.min(anchorLeft, headLeft) > 0) {
            return false;
        }
        const anchorRight = anchorLeft + this.$anchorCell.node().attrs.colspan,
            headRight = headLeft + this.$headCell.node().attrs.colspan;
        return Math.max(anchorRight, headRight) == map.width;
    }

    eq(other: Selection): boolean {
        return other instanceof CellSelection
            && other.$anchorCell.pos == this.$anchorCell.pos
            && other.$headCell.pos == this.$headCell.pos;
    }

    /**
     * Returns the smallest row selection that covers the given anchor
     * and head cell.
     */
    static rowSelection($anchorCell: ResolvedPos, $headCell: ResolvedPos = $anchorCell) {
        let d = $anchorCell.depth;
        for (; d > 0; d--) {
            if ($anchorCell.node(d).type.spec.tableRole == "table") {
                break;
            }
        }
        const map = TableMap.get($anchorCell.node(d)), start = $anchorCell.start(d) + 1;
        const anchorRect = map.findCell($anchorCell.pos - start), headRect = map.findCell($headCell.pos - start);
        const doc = $anchorCell.node(0);
        if (anchorRect.left <= headRect.left) {
            if (anchorRect.left > 0) {
                $anchorCell = doc.resolve(start + map.map[anchorRect.top * map.width]);
            }
            if (headRect.right < map.width) {
                $headCell = doc.resolve(start + map.map[map.width * (headRect.top + 1) - 1]);
            }
        } else {
            if (headRect.left > 0) {
                $headCell = doc.resolve(start + map.map[headRect.top * map.width]);
            }
            if (anchorRect.right < map.width) {
                $anchorCell = doc.resolve(start + map.map[map.width * (anchorRect.top + 1) - 1]);
            }
        }
        return new CellSelection($anchorCell, $headCell);
    }

    toJSON(): { [key: string]: any } {
        return { type: "cell", anchor: this.$anchorCell.pos, head: this.$headCell.pos };
    }

    static fromJSON(doc: ProsemirrorNode, json: { [key: string]: any }) {
        return new CellSelection(doc.resolve(json.anchor), doc.resolve(json.head));
    }

    static create(doc: ProsemirrorNode, anchorCell: number, headCell: number = anchorCell) {
        return new CellSelection(doc.resolve(anchorCell), doc.resolve(headCell));
    }

    getBookmark() { return new CellBookmark(this.$anchorCell.pos, this.$headCell.pos) }
}
CellSelection.prototype.visible = false;
Selection.jsonID("cell", CellSelection);

export class TableView implements NodeView {
    dom: HTMLDivElement;
    table: HTMLTableElement;
    contentDOM: HTMLTableElement;

    constructor(public node: ProsemirrorNode, public cellMinWidth: number) {
        this.dom = document.createElement("div");
        this.dom.className = "tableWrapper";
        this.table = this.dom.appendChild(document.createElement("table"));
        this.contentDOM = this.table;
    }

    update(node: ProsemirrorNode) {
        if (node.type != this.node.type) {
            return false;
        }
        this.node = node;
        let colgroup = this.dom.querySelector('colgroup');
        if (!colgroup) {
            colgroup = document.createElement("colgroup");
            this.table.prepend(colgroup);
        }
        updateColumns(node, colgroup, this.table, this.cellMinWidth);
        return true;
    }

    ignoreMutation(record: MutationRecord | {
        type: 'selection';
        target: Element;
    }) {
        if (record.type != "attributes") {
            return false;
        }
        if (record.target == this.table) {
            return true;
        }
        const colgroup = this.dom.querySelector('colgroup');
        return !!colgroup && colgroup.contains(record.target);
    }
}

class CellBookmark implements SelectionBookmark {
    constructor(public anchor: number, public head: number) { }

    map(mapping: Mappable) {
        return new CellBookmark(mapping.map(this.anchor), mapping.map(this.head));
    }

    resolve(doc: ProsemirrorNode): Selection {
        const $anchorCell = doc.resolve(this.anchor), $headCell = doc.resolve(this.head);
        if ($anchorCell.parent.type.spec.tableRole == "row"
            && $headCell.parent.type.spec.tableRole == "row"
            && $anchorCell.index() < $anchorCell.parent.childCount
            && $headCell.index() < $headCell.parent.childCount
            && inSameTable($anchorCell, $headCell)) {
            return new CellSelection($anchorCell, $headCell);
        } else {
            return Selection.near($headCell, 1);
        }
    }
}

class Rect {
    constructor(public left: number, public top: number, public right: number, public bottom: number) { }
}

interface SelectedRect extends Rect {
    map: TableMap;
    table: ProsemirrorNode;
    tableDepth: number;
    tableStart: number;
}

class ResizeState {
    constructor(public activeHandle: number | null, public dragging: { startX: number, startWidth: number } | null) { }

    apply(tr: Transaction) {
        let state: ResizeState = this, action = tr.getMeta(columnResizingKey);
        if (action && action.setHandle != null) {
            return new ResizeState(action.setHandle, null);
        }
        if (action && action.setDragging !== undefined) {
            return new ResizeState(state.activeHandle, action.setDragging);
        }
        if (state.activeHandle && state.activeHandle > -1 && tr.docChanged) {
            let handle: number | null = tr.mapping.map(state.activeHandle, -1);
            if (!pointsAtCell(tr.doc.resolve(handle))) {
                handle = null;
            }
            state = new ResizeState(handle, state.dragging);
        }
        return state;
    }
}

class TableMap {
    constructor(
        public width: number,
        public height: number,
        public map: number[],
        public problems: { type: string, row?: number, pos?: number, n?: number, colwidth?: any }[] | null) { }

    /**
     * Find the dimensions of the cell at the given position.
     */
    findCell(pos: number) {
        for (let i = 0; i < this.map.length; i++) {
            const curPos = this.map[i];
            if (curPos != pos) {
                continue;
            }
            const left = i % this.width, top = (i / this.width) | 0;
            let right = left + 1, bottom = top + 1;
            for (let j = 1; right < this.width && this.map[i + j] == curPos; j++) {
                right++;
            }
            for (let j = 1; bottom < this.height && this.map[i + (this.width * j)] == curPos; j++) {
                bottom++;
            }
            return new Rect(left, top, right, bottom);
        }
        throw new RangeError(`No cell with offset ${pos} found`);
    }

    /**
     * Find the left side of the cell at the given position.
     */
    colCount(pos: number) {
        for (let i = 0; i < this.map.length; i++) {
            if (this.map[i] == pos) {
                return i % this.width;
            }
        }
        throw new RangeError(`No cell with offset ${pos} found`);
    }

    /**
     * Return the index of the cell position at the given row and column, or -1 if no cell starts at
     * the given coordinates.
     */
    indexOf(row: number, col: number, table: ProsemirrorNode) {
        const head = getTableHead(table);
        let i = 0, rowStart = 0;
        if (head) {
            rowStart++;
            for (; i < head.childCount; i++) {
                const rowEnd = rowStart + head.child(i).nodeSize;
                if (i == row) {
                    let index = col + row * this.width;
                    const rowEndIndex = (row + 1) * this.width;
                    // Skip past cells from previous rows (via rowspan)
                    while (index < rowEndIndex && this.map[index] < rowStart) {
                        index++;
                    }
                    return index == rowEndIndex
                        ? -1
                        : this.map[index];
                }
                rowStart = rowEnd;
            }
        }
        const body = getTableBody(table);
        if (body.type.spec.tableType != 'table') {
            rowStart++;
        }
        for (let j = 0; ; j++) {
            const rowEnd = rowStart + body.child(j).nodeSize;
            if (j + i == row) {
                let index = col + row * this.width;
                const rowEndIndex = (row + 1) * this.width;
                // Skip past cells from previous rows (via rowspan)
                while (index < rowEndIndex && this.map[index] < rowStart) {
                    index++;
                }
                return index == rowEndIndex
                    ? -1
                    : this.map[index];
            }
            rowStart = rowEnd;
        }
    }

    /**
     * Find the next cell in the given direction, starting from the cell at `pos`, if any.
     */
    nextCell(pos: number, axis: string, dir: number) {
        const { left, right, top, bottom } = this.findCell(pos);
        if (axis == "horiz") {
            if (dir < 0 ? left == 0 : right == this.width) {
                return null;
            }
            return this.map[top * this.width + (dir < 0 ? left - 1 : right)];
        } else {
            if (dir < 0 ? top == 0 : bottom == this.height) {
                return null;
            }
            return this.map[left + this.width * (dir < 0 ? top - 1 : bottom)];
        }
    }

    /**
     * Get the rectangle spanning the two given cells.
     */
    rectBetween(a: number, b: number) {
        const { left: leftA, right: rightA, top: topA, bottom: bottomA } = this.findCell(a);
        const { left: leftB, right: rightB, top: topB, bottom: bottomB } = this.findCell(b);
        return new Rect(
            Math.min(leftA, leftB),
            Math.min(topA, topB),
            Math.max(rightA, rightB),
            Math.max(bottomA, bottomB));
    }

    /**
     * Return the position of all cells that have the top left corner in the given rectangle.
     */
    cellsInRect(rect: Rect) {
        const result: number[] = [], seen: { [index: number]: boolean } = {};
        for (let row = rect.top; row < rect.bottom; row++) {
            for (let col = rect.left; col < rect.right; col++) {
                const index = row * this.width + col, pos = this.map[index];
                if (seen[pos]) {
                    continue;
                }
                seen[pos] = true;
                if ((col != rect.left
                    || !col
                    || this.map[index - 1] != pos)
                    && (row != rect.top
                        || !row
                        || this.map[index - this.width] != pos)) {
                    result.push(pos);
                }
            }
        }
        return result;
    }

    /**
     * Return the position at which the cell at the given row and column
     * starts, or would start, if a cell started there.
     */
    positionAt(row: number, col: number, table: ProsemirrorNode) {
        const head = getTableHead(table);
        let i = 0, rowStart = 0;
        if (head) {
            rowStart++;
            for (; i < head.childCount; i++) {
                const rowEnd = rowStart + head.child(i).nodeSize;
                if (i == row) {
                    let index = col + row * this.width;
                    const rowEndIndex = (row + 1) * this.width;
                    // Skip past cells from previous rows (via rowspan)
                    while (index < rowEndIndex && this.map[index] < rowStart) {
                        index++;
                    }
                    return index == rowEndIndex
                        ? rowEnd - 1
                        : this.map[index];
                }
                rowStart = rowEnd;
            }
        }
        const body = getTableBody(table);
        if (body.type.spec.tableType != 'table') {
            rowStart++;
        }
        for (let j = 0; ; j++) {
            const rowEnd = rowStart + body.child(j).nodeSize;
            if (j + i == row) {
                let index = col + row * this.width;
                const rowEndIndex = (row + 1) * this.width;
                // Skip past cells from previous rows (via rowspan)
                while (index < rowEndIndex && this.map[index] < rowStart) {
                    index++;
                }
                return index == rowEndIndex
                    ? rowEnd - 1
                    : this.map[index];
            }
            rowStart = rowEnd;
        }
    }

    /**
     * Find the table map for the given table node.
     */
    static get(table: ProsemirrorNode) {
        return readFromCache(table) as TableMap || addToCache(table, computeMap(table)) as TableMap;
    }
}

export function addCaption(
    state: EditorState,
    dispatch?: (tr: Transaction) => void) {
    if (!isInTable(state)) {
        return false;
    }
    const { tableStart, table } = selectedRect(state);
    if (!table.firstChild
        || table.firstChild.type.name === table.type.schema.nodes.caption.name
        || table.firstChild.type.name === table.type.schema.nodes.caption_text.name) {
        return false;
    }
    if (dispatch) {
        dispatch(state.tr.insert(state.tr.mapping.map(tableStart + 1), table.type.schema.nodes.caption_text.createAndFill()!));
    }
    return true;
}

export function addColumnAfter(
    state: EditorState,
    dispatch?: (tr: Transaction) => void) {
    if (!isInTable(state)) {
        return false;
    }
    if (dispatch) {
        const rect = selectedRect(state);
        dispatch(addColumn(state.tr, rect, rect.right));
    }
    return true;
}

export function addColumnBefore(
    state: EditorState,
    dispatch?: (tr: Transaction) => void) {
    if (!isInTable(state)) {
        return false;
    }
    if (dispatch) {
        const rect = selectedRect(state);
        dispatch(addColumn(state.tr, rect, rect.left));
    }
    return true;
}

export function addRowAfter(
    state: EditorState,
    dispatch?: (tr: Transaction) => void) {
    if (!isInTable(state)) {
        return false;
    }
    if (dispatch) {
        const rect = selectedRect(state);
        dispatch(addRow(state.tr, rect, rect.bottom));
    }
    return true;
}

export function addRowBefore(
    state: EditorState,
    dispatch?: (tr: Transaction) => void) {
    if (!isInTable(state)) {
        return false;
    }
    if (dispatch) {
        const rect = selectedRect(state);
        dispatch(addRow(state.tr, rect, rect.top));
    }
    return true;
}

export function deleteColumn(
    state: EditorState,
    dispatch?: (tr: Transaction) => void) {
    if (!isInTable(state)) {
        return false;
    }
    if (dispatch) {
        const rect = selectedRect(state), tr = state.tr;
        if (rect.left == 0 && rect.right == rect.map.width) {
            return false;
        }
        for (let i = rect.right - 1; ; i--) {
            removeColumn(tr, rect, i);
            if (i == rect.left) {
                break;
            }
            rect.table = rect.tableStart
                ? tr.doc.nodeAt(rect.tableStart - 1)!
                : tr.doc;
            rect.map = TableMap.get(rect.table);
        }
        dispatch(tr);
    }
    return true;
}

export function deleteRow(
    state: EditorState,
    dispatch?: (tr: Transaction) => void) {
    if (!isInTable(state)) {
        return false;
    }
    if (dispatch) {
        const rect = selectedRect(state), tr = state.tr;
        if (rect.top == 0 && rect.bottom == rect.map.height) {
            const $pos = state.selection.$anchor;
            for (let d = $pos.depth; d > 0; d--) {
                if ($pos.node(d).type.spec.tableRole == "table") {
                    dispatch(state.tr.delete($pos.before(d), $pos.after(d)).scrollIntoView());
                    return true;
                }
            }
        }
        for (let i = rect.bottom - 1; ; i--) {
            removeRow(tr, rect, i);
            if (i == rect.top) {
                break;
            }
            rect.table = rect.tableStart
                ? tr.doc.nodeAt(rect.tableStart - 1)!
                : tr.doc;
            rect.map = TableMap.get(rect.table);
        }
        dispatch(tr);
    }
    return true;
}

export function deleteTable(
    state: EditorState,
    dispatch?: (tr: Transaction) => void) {
    const $pos = state.selection.$anchor;
    for (let d = $pos.depth; d > 0; d--) {
        if ($pos.node(d).type.spec.tableRole == "table") {
            if (dispatch) {
                dispatch(state.tr.delete($pos.before(d), $pos.after(d)).scrollIntoView());
            }
            return true;
        }
    }
    return false;
}

export function fixTables(
    state: EditorState,
    oldState?: EditorState) {
    let tr: Transaction | undefined;
    const check = (node: ProsemirrorNode, pos: number) => {
        if (node.type.spec.tableRole == "table") {
            tr = fixTable(state, node, pos, tr || state.tr);
        }
    }
    if (!oldState) {
        state.doc.descendants(check);
    } else if (oldState.doc != state.doc) {
        changedDescendants(oldState.doc, state.doc, 0, check);
    }
    return tr || state.tr;
}

export function goToNextCell(direction: number): Command {
    return function (state, dispatch) {
        if (!isInTable(state)) {
            return false;
        }
        const cell = findNextCell(selectionCell(state)!, direction);
        if (cell == null) {
            return false;
        }
        if (dispatch) {
            const $cell = state.doc.resolve(cell);
            dispatch(state.tr.setSelection(TextSelection.between($cell, moveCellForward($cell))).scrollIntoView());
        }
        return true;
    }
}

export function mergeCells(
    state: EditorState,
    dispatch?: (tr: Transaction) => void) {
    const sel = state.selection;
    if (!(sel instanceof CellSelection)
        || sel.$anchorCell.pos == sel.$headCell.pos) {
        return false;
    }
    const rect = selectedRect(state), { map } = rect;
    if (cellsOverlapRectangle(map, rect)) {
        return false;
    }
    if (dispatch) {
        const tr = state.tr, seen: { [index: number]: boolean } = {};
        let content = Fragment.empty, mergedPos: number | null = null, mergedCell: ProsemirrorNode;
        for (let row = rect.top; row < rect.bottom; row++) {
            for (let col = rect.left; col < rect.right; col++) {
                const cellPos = map.map[row * map.width + col], cell = rect.table.nodeAt(cellPos)!;
                if (seen[cellPos]) {
                    continue;
                }
                seen[cellPos] = true;
                if (mergedPos == null) {
                    mergedPos = cellPos;
                    mergedCell = cell;
                } else {
                    if (!isEmpty(cell)) {
                        content = content.append(cell.content);
                    }
                    const mapped = tr.mapping.map(cellPos + rect.tableStart);
                    tr.delete(mapped, mapped + cell.nodeSize - 1);
                }
            }
        }
        if (content.size) {
            tr.replaceWith(mergedPos! + rect.tableStart + 1, mergedPos! + rect.tableStart + mergedCell!.nodeSize, content);
        }
        tr.setNodeMarkup(
            mergedPos! + rect.tableStart,
            undefined,
            setAttr(addColSpan(
                mergedCell!.attrs,
                mergedCell!.attrs.colspan,
                (rect.right - rect.left) - mergedCell!.attrs.colspan),
                "rowspan", rect.bottom - rect.top));
        tr.setSelection(new CellSelection(tr.doc.resolve(mergedPos! + rect.tableStart + 1)));
        dispatch(tr);
    }
    return true;
}

export function setAttr(attrs: { [key: string]: any }, name: string, value: any) {
    const result: { [key: string]: any } = {};
    for (const prop in attrs) {
        result[prop] = attrs[prop];
    }
    result[name] = value;
    return result;
}

export function setColumnAlign(value: string): Command {
    return function (state: EditorState, dispatch?: (tr: Transaction) => void) {
        if (!isInTable(state)) {
            return false;
        }
        const $cell = selectionCell(state);
        const cellNode = $cell?.node();
        if (!$cell || !cellNode) {
            return false;
        }
        if (cellNode.attrs.align === value) {
            return false;
        }
        if (dispatch) {
            const tr = state.tr;
            if (state.selection instanceof CellSelection) {
                let colSelection: CellSelection;
                if (state.selection.isColSelection()) {
                    colSelection = state.selection;
                } else {
                    colSelection = CellSelection.colSelection(state.selection.$anchorCell, state.selection.$headCell);
                }
                colSelection.forEachCell((node: ProsemirrorNode, pos: number) => {
                    if (node.attrs.align !== value) {
                        tr.setNodeMarkup(pos, undefined, setAttr(node.attrs, 'align', value));
                    }
                });
            } else {
                tr.setNodeMarkup($cell.pos, undefined, setAttr(cellNode.attrs, 'align', value));
            }
            dispatch(tr);
        }
        return true;
    };
}

export function setNodeAttrs(
    tr: Transform,
    pos: number,
    depth: number,
    type: NodeType,
    attrs: { [key: string]: any }) {
    const $pos = tr.doc.resolve(pos);
    const start = $pos.start(depth) - 1;
    const node = $pos.node(depth);
    const end = start + node.nodeSize;

    let newType = type;
    if (node && !node.isText) {
        newType = node.type;
    }

    const newNode = newType.create(attrs);
    if (node && (node.isLeaf || !type.validContent(node.content))) {
        return tr.replaceWith(start, end, newNode);
    }

    return tr.step(new ReplaceAroundStep(
        start,
        end,
        start + 1,
        end - 1,
        new Slice(Fragment.from(newNode), 0, 0),
        1,
        false));
}

export function splitCell(
    state: EditorState,
    dispatch?: (tr: Transaction) => void) {
    const sel = state.selection;
    let cellNode, cellPos;
    if (!(sel instanceof CellSelection)) {
        cellNode = cellWrapping(sel.$from);
        if (!cellNode) {
            return false;
        }
        cellPos = cellAround(sel.$from)!.pos;
    } else {
        if (sel.$anchorCell.pos != sel.$headCell.pos) {
            return false;
        }
        cellNode = sel.$anchorCell.node();
        cellPos = sel.$anchorCell.pos;
    }
    if (cellNode.attrs.colspan == 1
        && cellNode.attrs.rowspan == 1) {
        return false;
    }
    if (dispatch) {
        let baseAttrs = cellNode.attrs;
        const attrs: { [key: string]: any } = [], colwidth = baseAttrs.colwidth;
        if (baseAttrs.rowspan > 1) {
            baseAttrs = setAttr(baseAttrs, "rowspan", 1);
        }
        if (baseAttrs.colspan > 1) {
            baseAttrs = setAttr(baseAttrs, "colspan", 1);
        }
        const rect = selectedRect(state), tr = state.tr;
        for (let i = 0; i < rect.right - rect.left; i++) {
            attrs.push(colwidth
                ? setAttr(baseAttrs, "colwidth", colwidth && colwidth[i] ? [colwidth[i]] : null)
                : baseAttrs);
        }
        let lastCell;
        for (let row = rect.top; row < rect.bottom; row++) {
            let pos = rect.map.positionAt(row, rect.left, rect.table) + rect.tableStart;
            if (row == rect.top) {
                pos += cellNode.nodeSize;
            }
            for (let col = rect.left, i = 0; col < rect.right; col++, i++) {
                if (col == rect.left && row == rect.top) {
                    continue;
                }
                tr.insert(
                    lastCell = tr.mapping.map(pos, 1),
                    cellNode.type.createAndFill(attrs[i])!);
            }
        }
        tr.setNodeMarkup(cellPos - 1, null, attrs[0]);
        if (sel instanceof CellSelection) {
            tr.setSelection(new CellSelection(
                tr.doc.resolve(sel.$anchorCell.pos),
                lastCell ? tr.doc.resolve(lastCell - 1) : undefined));
        }
        dispatch(tr);
    }
    return true;
}

export function toggleFullWidth(
    state: EditorState,
    dispatch?: (tr: Transaction) => void) {
    if (!isInTable(state)) {
        return false;
    }

    const { $from, to } = state.selection;
    if (to > $from.end()) {
        return false;
    }

    const styleAttr = 'width:';
    let style = 'width:100%';

    if (dispatch) {
        const rect = selectedRect(state);
        const table = rect.table;

        const tr = state.tr;
        const attrs = { ...table.attrs };
        if (attrs.style && attrs.style.indexOf(style) != -1) {
            attrs.style = ((attrs.style || '') as string)
                .split(';')
                .filter(x => !x.trimStart().startsWith(styleAttr))
                .join(';');
        } else {
            attrs.style = ((attrs.style || '') as string)
                .split(';')
                .filter(x => !x.trimStart().startsWith(styleAttr))
                .join(';') + style;
        }
        setNodeAttrs(tr, rect.tableStart, rect.tableDepth, state.schema.nodes.table, attrs);
        dispatch(tr.scrollIntoView());
    }
    return true;
}

function addColSpan(attrs: { [key: string]: any }, pos: number, n = 1) {
    const result = setAttr(attrs, "colspan", attrs.colspan + n);
    if (result.colwidth) {
        result.colwidth = result.colwidth.slice();
        for (let i = 0; i < n; i++) {
            result.colwidth.splice(pos, 0, 0);
        }
    }
    return result;
}

function addColumn(
    tr: Transaction,
    { map, tableStart, table }: { map: TableMap, tableStart: number, table: ProsemirrorNode },
    col: number) {
    let refColumn: number | null = col > 0 ? -1 : 0;
    if (columnIsHeader(map, table, col + refColumn)) {
        refColumn = col == 0 || col == map.width ? null : 0;
    }

    for (let row = 0; row < map.height; row++) {
        const index = row * map.width + col;
        // If this position falls inside a col-spanning cell
        if (col > 0 && col < map.width && map.map[index - 1] == map.map[index]) {
            const pos = map.map[index], cell = table.nodeAt(pos)!;
            tr.setNodeMarkup(
                tr.mapping.map(tableStart + pos),
                undefined,
                addColSpan(cell.attrs, col - map.colCount(pos)));
            // Skip ahead if rowspan > 1
            row += cell.attrs.rowspan - 1;
        } else {
            const type = refColumn == null
                ? table.type.schema.nodes.table_cell_text
                : table.nodeAt(map.map[index + refColumn])!.type;
            const pos = map.positionAt(row, col, table);
            tr.insert(tr.mapping.map(tableStart + pos), type.createAndFill()!);
        }
    }
    return tr;
}

function addRow(
    tr: Transaction,
    { map, tableStart, table }: { map: TableMap, tableStart: number, table: ProsemirrorNode },
    row: number) {
    let rowPos = tableStart;
    const head = getTableHead(table);
    let h = 0;
    if (head) {
        rowPos++;
        for (; h < row && h < head.childCount; h++) {
            rowPos += head.child(h).nodeSize;
        }
    }
    if (h < row) {
        const body = getTableBody(table);
        if (body.type != table.type.schema.nodes.table) {
            rowPos++;
        }
        for (let i = 0; i + h < row && i < body.childCount; i++) {
            rowPos += body.child(i).nodeSize;
        }
    }
    const cells: ProsemirrorNode[] = [];
    let refRow: number | null = row > 0 ? -1 : 0;
    if (rowIsHeader(map, table, row + refRow)) {
        refRow = row == 0 || row == map.height ? null : 0;
    }
    for (let col = 0, index = map.width * row; col < map.width; col++, index++) {
        // Covered by a rowspan cell
        if (row > 0 && row < map.height && map.map[index] == map.map[index - map.width]) {
            const pos = map.map[index], attrs = table.nodeAt(pos)!.attrs;
            tr.setNodeMarkup(tableStart + pos, undefined, setAttr(attrs, "rowspan", attrs.rowspan + 1));
            col += attrs.colspan - 1;
        } else {
            const type = refRow == null
                ? table.type.schema.nodes.table_cell_text
                : table.nodeAt(map.map[index + refRow * map.width])!.type;
            cells.push(type.createAndFill()!);
        }
    }
    tr.insert(rowPos, table.type.schema.nodes.table_row.create(null, cells));
    return tr;
}

function addToCache(key: ProsemirrorNode, value: TableMap) {
    cache.set(key, value);
    return value;
}

function arrow(axis: string, dir: number): Command {
    return (state, dispatch, view) => {
        const sel = state.selection;
        if (sel instanceof CellSelection) {
            return maybeSetSelection(state, dispatch, Selection.near(sel.$headCell, dir));
        }
        if (axis != "horiz" && !sel.empty) {
            return false;
        }
        const $cell = atEndOfCell(view!, axis, dir);
        if ($cell == null) {
            return false;
        }
        let newSel: Selection;
        const $next = nextCell($cell, axis, dir);
        if ($next) {
            newSel = Selection.near($next, 1);
        } else {
            let d = $cell.depth;
            for (; d > 0; d--) {
                if ($cell.node(d).type.spec.tableRole == "table") {
                    break;
                }
            }
            if (dir < 0) {
                newSel = Selection.near(state.doc.resolve($cell.before(d)), dir);
            } else {
                newSel = Selection.near(state.doc.resolve($cell.after(d)), dir);
            }
        }
        return maybeSetSelection(state, dispatch, newSel);
    }
}

function atEndOfCell(view: EditorView, axis: string, dir: number) {
    if (!(view.state.selection instanceof TextSelection)) {
        return null;
    }
    const { $head } = view.state.selection;
    for (let d = $head.depth; d >= 0; d--) {
        const parent = $head.node(d);
        const i = dir < 0 ? $head.index(d) : $head.indexAfter(d);
        if (i !== (dir < 0 ? 0 : parent.childCount)) {
            return null;
        }

        if (parent.type.spec.tableRole === "cell"
            || parent.type.spec.tableRole === "header_cell") {
            const dirStr = axis == "vert"
                ? (dir > 0 ? "down" : "up")
                : (dir > 0 ? "right" : "left");
            return view.endOfTextblock(dirStr)
                ? $head
                : null;
        }
    }
    return null;
}

function cellAround($pos: ResolvedPos) {
    for (let d = $pos.depth; d > 0; d--) {
        const role = $pos.node(d).type.spec.tableRole;
        if (role === "cell" || role === "header_cell") {
            return $pos.node(0).resolve($pos.before(d) + 1);
        }
    }
    return null;
}

function cellNear($pos: ResolvedPos) {
    for (let after: ProsemirrorNode | null = $pos.node(), pos = $pos.pos; after; after = after.firstChild, pos++) {
        const role = after.type.spec.tableRole;
        if (role == "cell" || role == "header_cell") {
            return $pos.doc.resolve(pos);
        }
    }
    for (let before = $pos.nodeBefore, pos = $pos.pos; before; before = before.lastChild, pos--) {
        const role = before.type.spec.tableRole;
        if (role == "cell" || role == "header_cell") {
            return $pos.doc.resolve(pos - before.nodeSize);
        }
    }
}

function cellsOverlapRectangle(
    { width, height, map }: { width: number, height: number, map: number[] },
    rect: Rect) {
    let indexTop = rect.top * width + rect.left, indexLeft = indexTop;
    let indexBottom = (rect.bottom - 1) * width + rect.left, indexRight = indexTop + (rect.right - rect.left - 1);
    for (let i = rect.top; i < rect.bottom; i++) {
        if (rect.left > 0
            && map[indexLeft] == map[indexLeft - 1]
            || rect.right < width
            && map[indexRight] == map[indexRight + 1]) {
            return true;
        }
        indexLeft += width;
        indexRight += width;
    }
    for (let i = rect.left; i < rect.right; i++) {
        if (rect.top > 0
            && map[indexTop] == map[indexTop - width]
            || rect.bottom < height
            && map[indexBottom] == map[indexBottom + width]) {
            return true;
        }
        indexTop++;
        indexBottom++;
    }
    return false;
}

function cellUnderMouse(view: EditorView, event: Event) {
    if (!(event instanceof MouseEvent)) {
        return null;
    }
    const mousePos = view.posAtCoords({ left: event.clientX, top: event.clientY });
    if (!mousePos) {
        return null;
    }
    return mousePos
        ? cellAround(view.state.doc.resolve(mousePos.pos))
        : null;
}

function cellWrapping($pos: ResolvedPos) {
    for (let d = $pos.depth; d > 0; d--) {
        const role = $pos.node(d).type.spec.tableRole;
        if (role === "cell" || role === 'header_cell') {
            return $pos.node(d);
        }
    }
    return null;
}

function changedDescendants(
    old: ProsemirrorNode,
    cur: ProsemirrorNode,
    offset: number,
    f: (
        node: ProsemirrorNode,
        pos: number,
        parent: ProsemirrorNode | null,
        index?: number,
    ) => boolean | void) {
    const oldSize = old.childCount, curSize = cur.childCount;
    outer: for (let i = 0, j = 0; i < curSize; i++) {
        const child = cur.child(i);
        for (let scan = j, e = Math.min(oldSize, i + 3); scan < e; scan++) {
            if (old.child(scan) == child) {
                j = scan + 1;
                offset += child.nodeSize;
                continue outer;
            }
        }
        f(child, offset, null);
        if (j < oldSize && old.child(j).sameMarkup(child)) {
            changedDescendants(old.child(j), child, offset + 1, f);
        }
        else {
            child.nodesBetween(0, child.content.size, f, offset + 1);
        }
        offset += child.nodeSize;
    }
}

function clipCells(
    { width, height, rows }: { width: number, height: number, rows: Fragment[] },
    newWidth: number,
    newHeight: number) {
    if (width != newWidth) {
        const added: number[] = [], newRows: Fragment[] = [];
        for (let row = 0; row < rows.length; row++) {
            const frag = rows[row], cells: ProsemirrorNode[] = [];
            for (let col = added[row] || 0, i = 0; col < newWidth; i++) {
                let cell = frag.child(i % frag.childCount);
                if (col + cell.attrs.colspan > newWidth) {
                    cell = cell.type.create(
                        removeColSpan(cell.attrs, cell.attrs.colspan, col + cell.attrs.colspan - newWidth),
                        cell.content);
                }
                cells.push(cell);;
                col += cell.attrs.colspan;
                for (let j = 1; j < cell.attrs.rowspan; j++) {
                    added[row + j] = (added[row + j] || 0) + cell.attrs.colspan;
                }
            }
            newRows.push(Fragment.from(cells));
        }
        rows = newRows;
        width = newWidth;
    }

    if (height != newHeight) {
        const newRows: Fragment[] = [];
        for (let row = 0, i = 0; row < newHeight; row++, i++) {
            const cells: ProsemirrorNode[] = [], source = rows[i % height];
            for (let j = 0; j < source.childCount; j++) {
                let cell = source.child(j);
                if (row + cell.attrs.rowspan > newHeight) {
                    cell = cell.type.create(
                        setAttr(cell.attrs, "rowspan", Math.max(1, newHeight - cell.attrs.rowspan)),
                        cell.content);
                }
                cells.push(cell);
            }
            newRows.push(Fragment.from(cells));
        }
        rows = newRows;
        height = newHeight;
    }

    return { width, height, rows };
}

function columnIsHeader(map: TableMap, table: ProsemirrorNode, col: number) {
    const headerCell = table.type.schema.nodes.table_header;
    for (let row = 0; row < map.height; row++) {
        if (table.nodeAt(map.map[col + row * map.width])!.type != headerCell) {
            return false;
        }
    }
    return true;
}

function computeMap(table: ProsemirrorNode) {
    if (table.type.spec.tableRole != "table") {
        throw new RangeError("Not a table node: " + table.type.name);
    }
    const body = getTableBody(table);
    const head = getTableHead(table);
    const height = body.childCount + (head ? head.childCount : 0);
    let width = findWidth(body);
    if (head) {
        width = Math.max(width, findWidth(head));
    }
    const map: number[] = [];
    let mapPos = 0, problems: { type: string, row?: number, pos?: number, n?: number, colwidth?: any }[] | null = null;
    const colWidths = [];
    for (let i = 0, e = width * height; i < e; i++) {
        map[i] = 0;
    }

    let pos = -1;
    if (head) {
        pos++;
        for (let row = 0; row < head.childCount; row++) {
            const rowNode = head.child(row);
            pos++;
            for (let i = 0; ; i++) {
                while (mapPos < map.length && map[mapPos] != 0) {
                    mapPos++
                }
                if (i == rowNode.childCount) {
                    break;
                }
                pos++;
                const cellNode = rowNode.child(i), { colspan, rowspan, colwidth } = cellNode.attrs;
                for (let h = 0; h < rowspan; h++) {
                    if (h + row >= height) {
                        (problems || (problems = [])).push({ type: "overlong_rowspan", pos, n: rowspan - h });
                        break;
                    }
                    const start = mapPos + (h * width);
                    for (let w = 0; w < colspan; w++) {
                        if (map[start + w] == 0) {
                            map[start + w] = pos;
                        } else {
                            (problems || (problems = [])).push({ type: "collision", row, pos, n: colspan - w });
                        }
                        const colW = colwidth && colwidth[w];
                        if (colW) {
                            const widthIndex = ((start + w) % width) * 2, prev = colWidths[widthIndex];
                            if (prev == null || (prev != colW && colWidths[widthIndex + 1] == 1)) {
                                colWidths[widthIndex] = colW;
                                colWidths[widthIndex + 1] = 1;
                            } else if (prev == colW) {
                                colWidths[widthIndex + 1]++;
                            }
                        }
                    }
                }
                mapPos += colspan;
                pos += cellNode.nodeSize - 1;
            }
            const expectedPos = (row + 1) * width;
            let missing = 0;
            while (mapPos < expectedPos) {
                if (map[mapPos++] == 0) {
                    missing++;
                }
            }
            if (missing) {
                (problems || (problems = [])).push({ type: "missing", row, n: missing });
            }
            pos++;
        }
        pos++;
    }
    if (body.type.spec.tableRole != "table") {
        pos++;
    }
    for (let row = 0; row < body.childCount; row++) {
        const rowNode = body.child(row);
        pos++;
        for (let i = 0; ; i++) {
            while (mapPos < map.length && map[mapPos] != 0) {
                mapPos++
            }
            if (i == rowNode.childCount) {
                break;
            }
            pos++;
            const cellNode = rowNode.child(i), { colspan, rowspan, colwidth } = cellNode.attrs;
            for (let h = 0; h < rowspan; h++) {
                if (h + row >= height) {
                    (problems || (problems = [])).push({ type: "overlong_rowspan", pos, n: rowspan - h });
                    break;
                }
                const start = mapPos + (h * width);
                for (let w = 0; w < colspan; w++) {
                    if (map[start + w] == 0) {
                        map[start + w] = pos;
                    } else {
                        (problems || (problems = [])).push({ type: "collision", row, pos, n: colspan - w });
                    }
                    const colW = colwidth && colwidth[w];
                    if (colW) {
                        const widthIndex = ((start + w) % width) * 2, prev = colWidths[widthIndex];
                        if (prev == null || (prev != colW && colWidths[widthIndex + 1] == 1)) {
                            colWidths[widthIndex] = colW;
                            colWidths[widthIndex + 1] = 1;
                        } else if (prev == colW) {
                            colWidths[widthIndex + 1]++;
                        }
                    }
                }
            }
            mapPos += colspan;
            pos += cellNode.nodeSize - 1;
        }
        const expectedPos = (row + 1) * width;
        let missing = 0;
        while (mapPos < expectedPos) {
            if (map[mapPos++] == 0) {
                missing++;
            }
        }
        if (missing) {
            (problems || (problems = [])).push({ type: "missing", row, n: missing });
        }
        pos++;
    }

    const tableMap = new TableMap(width, height, map, problems);
    let badWidths = false;

    // For columns that have defined widths, but whose widths disagree
    // between rows, fix up the cells whose width doesn't match the
    // computed one.
    for (let i = 0; !badWidths && i < colWidths.length; i += 2) {
        if (colWidths[i] != null && colWidths[i + 1] < height) {
            badWidths = true;
        }
    }
    if (badWidths) {
        findBadColWidths(tableMap, colWidths, table);
    }

    return tableMap;
}

function currentColWidth(
    view: EditorView,
    cellPos: number,
    { colspan, colwidth }: { [key: string]: any }) {
    const width = colwidth && colwidth[colwidth.length - 1];
    if (width) {
        return width as number;
    }
    const dom = view.domAtPos(cellPos);
    const node = dom.node.childNodes[dom.offset] as HTMLElement;
    let domWidth = node.offsetWidth, parts = colspan as number;
    if (colwidth) {
        for (let i = 0; i < colspan; i++) {
            if (colwidth[i]) {
                domWidth -= colwidth[i];
                parts--;
            }
        }
    }
    return domWidth / parts;
}

function deleteCellSelection(
    state: EditorState, dispatch?: (tr: Transaction) => void) {
    const sel = state.selection;
    if (!(sel instanceof CellSelection)) {
        return false;
    }
    if (dispatch) {
        const tr = state.tr, baseContent = state.schema.nodes.table_cell_text.createAndFill()!.content;
        sel.forEachCell((cell: ProsemirrorNode, pos: number) => {
            if (!cell.content.eq(baseContent)) {
                tr.replace(
                    tr.mapping.map(pos + 1),
                    tr.mapping.map(pos + cell.nodeSize - 1),
                    new Slice(baseContent, 0, 0));
            }
        });
        if (tr.docChanged) {
            dispatch(tr);
        }
    }
    return true;
}

function displayColumnWidth(view: EditorView, cell: number, width: number, cellMinWidth: number) {
    const $cell = view.state.doc.resolve(cell);
    let depth = $cell.depth - 1;
    let table = $cell.node(depth);
    while (depth > 0 && table.type.name != view.state.schema.nodes.table.name) {
        depth--;
        table = $cell.node(depth);
    }
    const start = $cell.start(depth);
    const col = TableMap.get(table).colCount($cell.pos - start - 1) + $cell.node().attrs.colspan - 1;
    let dom = view.domAtPos(start).node;
    while (dom.nodeName != "TABLE") {
        dom = dom.parentNode as Node;
    }
    updateColumns(table, dom.firstChild as Element, dom as HTMLTableElement, cellMinWidth, col, width);
}

function domCellAround(target: EventTarget | null) {
    let element = target instanceof Element ? target : null;
    if (element) {
        while (element && element.nodeName != "TD" && element.nodeName != "TH") {
            element = element.classList.contains("ProseMirror")
                ? null
                : element.parentNode instanceof Element
                    ? element.parentNode
                    : null;
        }
        return element;
    }
    return null;
}

function domInCell(view: EditorView, dom: Node) {
    for (; dom && dom != view.dom; dom = dom.parentNode!) {
        if (dom.nodeName == "TD" || dom.nodeName == "TH") {
            return dom;
        }
    }
}

function draggedWidth(dragging: { startX: number, startWidth: number }, event: MouseEvent, cellMinWidth: number) {
    const offset = event.clientX - dragging.startX;
    return Math.max(cellMinWidth, dragging.startWidth + offset);
}

function drawCellSelection(state: EditorState) {
    if (!(state.selection instanceof CellSelection)) {
        return null;
    }
    const cells: Decoration[] = [];
    state.selection.forEachCell((node, pos) => {
        cells.push(Decoration.node(pos - 1, pos + node.nodeSize - 1, { class: "selectedCell" }));
    });
    return DecorationSet.create(state.doc, cells);
}

function edgeCell(view: EditorView, event: MouseEvent, side: 'left' | 'right') {
    const found = view.posAtCoords({ left: event.clientX, top: event.clientY });
    if (!found) {
        return -1;
    }
    const { pos } = found;
    const $cell = cellAround(view.state.doc.resolve(pos));
    if (!$cell) {
        return -1;
    }
    if (side == 'right') {
        return $cell.pos;
    }
    let depth = $cell.depth - 1;
    let table = $cell.node(depth);
    while (depth > 0 && table.type.name != view.state.schema.nodes.table.name) {
        depth--;
        table = $cell.node(depth);
    }
    const map = TableMap.get(table), start = $cell.start(depth) + 1;
    const index = map.map.indexOf($cell.pos - start);
    return index % map.width == 0
        ? -1
        : start + map.map[index - 1];
}

function ensureRectangular(
    schema: Schema,
    rows: Fragment[]) {
    const widths: number[] = [];
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        for (let j = row.childCount - 1; j >= 0; j--) {
            const { rowspan, colspan } = row.child(j).attrs;
            for (let r = i; r < i + rowspan; r++) {
                widths[r] = (widths[r] || 0) + colspan;
            }
        }
    }
    let width = 0;
    for (let r = 0; r < widths.length; r++) {
        width = Math.max(width, widths[r]);
    }
    for (let r = 0; r < widths.length; r++) {
        if (r >= rows.length) {
            rows.push(Fragment.empty);
        }
        if (widths[r] < width) {
            const empty = schema.nodes.table_cell_text.createAndFill()!, cells: ProsemirrorNode[] = [];
            for (let i = widths[r]; i < width; i++) {
                cells.push(empty);
            }
            rows[r] = rows[r].append(Fragment.from(cells));
        }
    }
    return { height: rows.length, width, rows };
}

function findBadColWidths(map: TableMap, colWidths: any[], table: ProsemirrorNode) {
    if (!map.problems) {
        map.problems = [];
    }
    for (let i = 0, seen: { [index: number]: boolean } = {}; i < map.map.length; i++) {
        const pos = map.map[i];
        if (seen[pos]) {
            continue;
        }
        seen[pos] = true;
        const node = table.nodeAt(pos)!;
        let updated = null;
        for (let j = 0; j < node.attrs.colspan; j++) {
            const col = (i + j) % map.width, colWidth = colWidths[col * 2];
            if (colWidth != null && (!node.attrs.colwidth || node.attrs.colwidth[j] != colWidth)) {
                (updated || (updated = freshColWidth(node.attrs)))[j] = colWidth;
            }
        }
        if (updated) {
            map.problems.unshift({ type: "colwidth mismatch", pos, colwidth: updated });
        }
    }
}

function findNextCell($cell: ResolvedPos, dir: number) {
    let d = $cell.depth;
    for (; d > 0; d--) {
        if ($cell.node(d).type.spec.tableRole == "table") {
            break;
        }
    }
    if (dir < 0) {
        const before = $cell.nodeBefore;
        if (before) {
            return $cell.pos - before.nodeSize;
        }
        let rowEnd = $cell.before();
        for (let row = $cell.index(-1) - 1; row >= 0; row--) {
            const rowNode = $cell.node(-1).child(row);
            if (rowNode.childCount) {
                return rowEnd - 1 - rowNode.lastChild!.nodeSize;
            }
            rowEnd -= rowNode.nodeSize;
        }
        const head = $cell.node(d).firstChild;
        if (head && head != $cell.node(-1)) {
            const rowNode = head.lastChild;
            if (rowNode && rowNode.childCount) {
                return rowEnd - 2 - rowNode.lastChild!.nodeSize;
            }
        }
    } else {
        if ($cell.index() < $cell.parent.childCount - 1) {
            return $cell.pos + $cell.node().nodeSize;
        }
        const host = $cell.node(-1);
        let rowStart = $cell.after();
        for (let row = $cell.indexAfter(-1); row < host.childCount; row++) {
            const rowNode = host.child(row);
            if (rowNode.childCount) {
                return rowStart + 1;
            }
            rowStart += rowNode.nodeSize;
        }
        const body = $cell.node(d).lastChild;
        if (body && body != $cell.node(-1)) {
            const rowNode = body.firstChild;
            if (rowNode && rowNode.childCount) {
                return rowStart + 2;
            }
        }
    }
}

function findWidth(host: ProsemirrorNode) {
    let width = -1, hasRowSpan = false;
    for (let row = 0; row < host.childCount; row++) {
        const rowNode = host.child(row);
        let rowWidth = 0;
        if (hasRowSpan) {
            for (let j = 0; j < row; j++) {
                const prevRow = host.child(j);
                for (let i = 0; i < prevRow.childCount; i++) {
                    const cell = prevRow.child(i);
                    if (j + cell.attrs.rowspan > row) {
                        rowWidth += cell.attrs.colspan;
                    }
                }
            }
        }
        for (let i = 0; i < rowNode.childCount; i++) {
            const cell = rowNode.child(i);
            rowWidth += cell.attrs.colspan;
            if (cell.attrs.rowspan > 1) {
                hasRowSpan = true;
            }
        }
        if (width == -1) {
            width = rowWidth;
        } else if (width != rowWidth) {
            width = Math.max(width, rowWidth);
        }
    }
    return width;
}

function fitSlice(nodeType: NodeType, slice: Slice) {
    const node = nodeType.createAndFill()!;
    const tr = new Transform(node).replace(0, node.content.size, slice);
    return tr.doc;
}

function fixTable(
    state: EditorState,
    table: ProsemirrorNode,
    tablePos: number,
    tr: Transaction) {
    const map = TableMap.get(table);
    if (!map.problems) {
        return tr;
    }
    if (!tr) {
        tr = state.tr;
    }

    // Track which rows we must add cells to, so that we can adjust that
    // when fixing collisions.
    const mustAdd: number[] = [];
    for (let i = 0; i < map.height; i++) {
        mustAdd.push(0);
    }

    for (let i = 0; i < map.problems.length; i++) {
        const prob = map.problems[i];
        if (prob.type == "collision") {
            const cell = table.nodeAt(prob.pos!)!;
            for (let j = 0; j < cell.attrs.rowspan; j++) {
                mustAdd[prob.row! + j] += prob.n!;
            }
            tr.setNodeMarkup(
                tr.mapping.map(tablePos + 2 + prob.pos!),
                undefined,
                removeColSpan(cell.attrs, cell.attrs.colspan - prob.n!, prob.n));
        } else if (prob.type == "missing") {
            mustAdd[prob.row!] += prob.n!;
        } else if (prob.type == "overlong_rowspan") {
            const cell = table.nodeAt(prob.pos!)!;
            tr.setNodeMarkup(
                tr.mapping.map(tablePos + 2 + prob.pos!),
                undefined,
                setAttr(cell.attrs, "rowspan", cell.attrs.rowspan - prob.n!));
        } else if (prob.type == "colwidth mismatch") {
            const cell = table.nodeAt(prob.pos!)!;
            tr.setNodeMarkup(
                tr.mapping.map(tablePos + 2 + prob.pos!),
                undefined,
                setAttr(cell.attrs, "colwidth", prob.colwidth));
        }
    }
    let first: number | null = null, last: number | null = null;
    for (let i = 0; i < mustAdd.length; i++) {
        if (mustAdd[i]) {
            if (first == null) {
                first = i;
            }
        }
        last = i;
    }
    // Add the necessary cells, using a heuristic for whether to add the
    // cells at the start or end of the rows (if it looks like a 'bite'
    // was taken out of the table, add cells at the start of the row
    // after the bite. Otherwise add them at the end).
    const head = getTableHead(table);
    let h = 0;
    if (head) {
        for (let pos = tablePos + 2; h < head.childCount; h++) {
            const row = head.child(h);
            const end = pos + row.nodeSize;
            const add = mustAdd[h];
            if (add > 0) {
                const tableNodeType = row.firstChild
                    ? row.firstChild.type
                    : tableNodeTypes(state.schema)['cell'].find(x => x.name.endsWith('_text')) || tableNodeTypes(state.schema)['cell'][0];
                const nodes: ProsemirrorNode[] = [];
                for (let j = 0; j < add; j++) {
                    nodes.push(tableNodeType.createAndFill()!);
                }
                const side = (h == 0 || first == h - 1)
                    && last == h
                    ? pos + 1
                    : end - 1;
                tr.insert(tr.mapping.map(side), nodes);
            }
            pos = end;
        }
    }
    const body = getTableBody(table);
    for (let i = 0, pos = tablePos + (head ? head.nodeSize : 0) + 2; i < body.childCount; i++) {
        const row = body.child(i);
        const end = pos + row.nodeSize;
        const add = mustAdd[i + h];
        if (add > 0) {
            const tableNodeType = row.firstChild
                ? row.firstChild.type
                : tableNodeTypes(state.schema)['cell'].find(x => x.name.endsWith('_text')) || tableNodeTypes(state.schema)['cell'][0];
            const nodes: ProsemirrorNode[] = [];
            for (let j = 0; j < add; j++) {
                nodes.push(tableNodeType.createAndFill()!);
            }
            const side = (i + h == 0 || first == i + h - 1)
                && last == i + h
                ? pos + 1
                : end - 1;
            tr.insert(tr.mapping.map(side), nodes);
        }
        pos = end;
    }
    return tr.setMeta(fixTablesKey, { fixTables: true }) as Transaction;
}

function freshColWidth(attrs: { [key: string]: any }) {
    if (attrs.colwidth) {
        return attrs.colwidth.slice();
    }
    let result: number[] = [];
    for (let i = 0; i < attrs.colspan; i++) {
        result.push(0);
    }
    return result;
}

function getTableHead(table: ProsemirrorNode) {
    let head: ProsemirrorNode | null | undefined;
    for (var i = 0; i < table.childCount; i++) {
        const child = table.child(i);
        if (child.type == child.type.schema.nodes.thead) {
            head = child;
        }
    }
    return head;
}

function getTableBody(table: ProsemirrorNode) {
    let body = table;
    for (var i = 0; i < table.childCount; i++) {
        const child = table.child(i);
        if (child.type == child.type.schema.nodes.tbody) {
            body = child;
        }
    }
    return body;
}

function growTable(
    tr: Transaction,
    map: TableMap,
    table: ProsemirrorNode,
    start: number,
    width: number,
    height: number,
    mapFrom: number) {
    const schema = tr.doc.type.schema, types = tableNodeTypes(schema);
    let empty: ProsemirrorNode | null | undefined, emptyHead: ProsemirrorNode | null | undefined;
    const head = getTableHead(table);
    const body = getTableBody(table);
    const cell = types.cell.find(x => x.name.endsWith('_text')) || types.cell[0];
    if (width > map.width) {
        let hRow = 0;
        if (head) {
            const headerCell = types.header_cell.find(x => x.name.endsWith('_text')) || types.header_cell[0];
            for (let rowEnd = 0; hRow < head.childCount; hRow++) {
                const rowNode = head.child(hRow);
                rowEnd += rowNode.nodeSize;
                const cells: ProsemirrorNode[] = [];
                const add = emptyHead || (emptyHead = headerCell.createAndFill()!);
                for (let i = map.width; i < width; i++) {
                    cells.push(add);
                }
                tr.insert(tr.mapping.slice(mapFrom).map(rowEnd - 1 + start), cells);
            }
        }
        for (let row = 0, rowEnd = 0; row < map.height; row++) {
            const rowNode = body.child(row);
            rowEnd += rowNode.nodeSize;
            const cells: ProsemirrorNode[] = [];
            const add = empty || (empty = cell.createAndFill()!);
            for (let i = map.width; i < width; i++) {
                cells.push(add);
            }
            tr.insert(tr.mapping.slice(mapFrom).map(rowEnd - 1 + start), cells);
        }
    }
    if (height > map.height) {
        const cells: ProsemirrorNode[] = [];
        for (let i = 0; i < Math.max(map.width, width); i++) {
            cells.push(empty || (empty = cell.createAndFill()!));
        }

        const row = types.row.find(x => x.name.endsWith('_text')) || types.row[0];
        const emptyRow = row.create(null, Fragment.from(cells)), rows: ProsemirrorNode[] = [];
        for (let i = map.height; i < height; i++) {
            rows.push(emptyRow);
        }
        tr.insert(tr.mapping.slice(mapFrom).map(start + table.nodeSize - 3), rows);
    }
    return !!(empty || emptyHead);
}

function handleColumnResizeDecorations(state: EditorState, cell: number) {
    const decorations: Decoration[] = [];
    const $cell = state.doc.resolve(cell);
    let depth = $cell.depth - 1;
    let table = $cell.node(depth);
    while (depth > 0 && table.type != state.schema.nodes.table) {
        depth--;
        table = $cell.node(depth);
    }
    const map = TableMap.get(table), start = $cell.start(depth);
    const col = map.colCount($cell.pos - start - 1) + $cell.node().attrs.colspan;
    for (let row = 0; row < map.height; row++) {
        const index = col + row * map.width - 1;
        if ((col == map.width
            || map.map[index] != map.map[index + 1])
            && (row == 0
                || map.map[index - 1] != map.map[index - 1 - map.width])) {
            const cellPos = map.map[index];
            const pos = start + cellPos + table.nodeAt(cellPos)!.nodeSize - 1;
            const dom = document.createElement("div");
            dom.className = "column-resize-handle";
            decorations.push(Decoration.widget(pos, dom));
        }
    }
    return DecorationSet.create(state.doc, decorations);
}

function handleColumnResizeMouseDown(
    view: EditorView,
    event: MouseEvent,
    cellMinWidth: number) {
    const pluginState = columnResizingKey.getState(view.state) as ResizeState;
    if (!pluginState.activeHandle || pluginState.activeHandle == -1 || pluginState.dragging) {
        return false;
    }

    const cell = view.state.doc.nodeAt(pluginState.activeHandle)!;
    const width = currentColWidth(view, pluginState.activeHandle, cell.attrs)
    view.dispatch(view.state.tr.setMeta(columnResizingKey, { setDragging: { startX: event.clientX, startWidth: width } }));

    function finish(event: MouseEvent) {
        window.removeEventListener("mouseup", finish);
        window.removeEventListener("mousemove", move);
        const pluginState = columnResizingKey.getState(view.state) as ResizeState;
        if (pluginState.dragging) {
            updateColumnWidth(view, pluginState.activeHandle!, draggedWidth(pluginState.dragging, event, cellMinWidth));
            view.dispatch(view.state.tr.setMeta(columnResizingKey, { setDragging: null }));
        }
    }
    function move(event: MouseEvent) {
        if (!event.button) {
            return finish(event);
        }
        const pluginState = columnResizingKey.getState(view.state) as ResizeState;
        const dragged = draggedWidth(pluginState.dragging!, event, cellMinWidth);
        displayColumnWidth(view, pluginState.activeHandle!, dragged, cellMinWidth);
    }

    window.addEventListener("mouseup", finish);
    window.addEventListener("mousemove", move);
    event.preventDefault();
    return true;
}

function handleColumnResizeMouseLeave(view: EditorView) {
    const pluginState = columnResizingKey.getState(view.state) as ResizeState;
    if (pluginState.activeHandle && pluginState.activeHandle > -1 && !pluginState.dragging) {
        updateHandle(view, -1);
    }
}

function handleColumnResizeMouseMove(view: EditorView, event: MouseEvent) {
    const pluginState = columnResizingKey.getState(view.state) as ResizeState;

    if (pluginState.dragging) {
        return;
    }

    const target = domCellAround(event.target);
    let cell = -1;
    if (target) {
        const { left, right } = target.getBoundingClientRect();
        if (event.clientX - left <= 5) {
            cell = edgeCell(view, event, "left");
        } else if (right - event.clientX <= 5) {
            cell = edgeCell(view, event, "right");
        }
    }

    if (cell != pluginState.activeHandle) {
        updateHandle(view, cell);
    }
    return;
}

function handleMouseDown(view: EditorView, startEvent: Event) {
    if (!(startEvent instanceof MouseEvent)
        || startEvent.ctrlKey
        || startEvent.metaKey) {
        return false;
    }

    const startDOMCell = domInCell(view, startEvent.target as Node);
    let $anchor;
    if (startEvent.shiftKey && (view.state.selection instanceof CellSelection)) {
        // Adding to an existing cell selection
        setCellSelection(view.state.selection.$anchorCell, startEvent);
        startEvent.preventDefault();
    } else if (startEvent.shiftKey
        && startDOMCell
        && ($anchor = cellAround(view.state.selection.$anchor)) != null
        && cellUnderMouse(view, startEvent)!.pos != $anchor.pos) {
        // Adding to a selection that starts in another cell (causing a
        // cell selection to be created).
        setCellSelection($anchor, startEvent);
        startEvent.preventDefault();
    } else if (!startDOMCell) {
        // Not in a cell, let the default behavior happen.
        return false;
    }

    // Create and dispatch a cell selection between the given anchor and
    // the position under the mouse.
    function setCellSelection($anchor: ResolvedPos, event: MouseEvent) {
        let $head = cellUnderMouse(view, event);
        const starting = selectCellKey.getState(view.state) == null;
        if (!$head || !inSameTable($anchor, $head)) {
            if (starting) {
                $head = $anchor;
            } else {
                return;
            }
        }
        const selection = new CellSelection($anchor, $head);
        if (starting || !view.state.selection.eq(selection)) {
            const tr = view.state.tr.setSelection(selection);
            if (starting) {
                tr.setMeta(selectCellKey, $anchor.pos);
            }
            view.dispatch(tr);
        }
    }

    function stop() {
        view.root.removeEventListener("mouseup", stop);
        view.root.removeEventListener("dragstart", stop);
        view.root.removeEventListener("mousemove", move);
        if (selectCellKey.getState(view.state) != null) {
            view.dispatch(view.state.tr.setMeta(selectCellKey, -1));
        }
    }

    function move(event: Event) {
        const anchor = selectCellKey.getState(view.state);
        let $anchor: ResolvedPos | null = null;
        if (anchor != null) {
            // Continuing an existing cross-cell selection
            $anchor = view.state.doc.resolve(anchor);
        } else if (domInCell(view, event.target as Node) != startDOMCell) {
            // Moving out of the initial cell -- start a new cell selection
            $anchor = cellUnderMouse(view, startEvent);
            if (!$anchor) {
                return stop();
            }
        }
        if ($anchor) {
            setCellSelection($anchor, event as MouseEvent);
        }
    }

    view.root.addEventListener("mouseup", stop);
    view.root.addEventListener("dragstart", stop);
    view.root.addEventListener("mousemove", move);
    return true;
}

function handlePaste(
    view: EditorView,
    _: any,
    slice: Slice) {
    if (!isInTable(view.state)) {
        return false;
    }
    let cells = pastedCells(slice);
    const sel = view.state.selection;
    if (sel instanceof CellSelection) {
        if (!cells) {
            cells = {
                width: 1,
                height: 1,
                rows: [Fragment.from(fitSlice(view.state.schema.nodes.table_cell_text, slice))]
            };
        }
        let d = sel.$anchorCell.depth;
        for (; d > 0; d--) {
            if (sel.$anchorCell.node(d).type.spec.tableRole == "table") {
                break;
            }
        }
        const table = sel.$anchorCell.node(d), start = sel.$anchorCell.start(d);
        const rect = TableMap.get(table).rectBetween(sel.$anchorCell.pos - start - 1, sel.$headCell.pos - start - 1);
        cells = clipCells(cells, rect.right - rect.left, rect.bottom - rect.top);
        insertCells(view.state, view.dispatch, start, rect, cells);
        return true;
    } else if (cells) {
        const $cell = selectionCell(view.state)!;
        let d = $cell.depth;
        for (; d > 0; d--) {
            if ($cell.node(d).type.spec.tableRole == "table") {
                break;
            }
        }
        const start = $cell.start(d);
        insertCells(view.state, view.dispatch, start, TableMap.get($cell.node(d)).findCell($cell.pos - start - 1), cells);
        return true;
    } else {
        return false;
    }
}

function handleTripleClick(view: EditorView, pos: number) {
    const doc = view.state.doc, $cell = cellAround(doc.resolve(pos));
    if (!$cell) {
        return false;
    }
    view.dispatch(view.state.tr.setSelection(new CellSelection($cell)));
    return true;
}

function inSameTable($a: ResolvedPos, $b: ResolvedPos) {
    let d = $b.depth;
    for (; d > 0; d--) {
        if ($b.node(d).type.spec.tableRole == "table") {
            break;
        }
    }
    return $a.depth == $b.depth && $a.pos >= $b.start(d) && $a.pos <= $b.end(d);
}

function insertCells(
    state: EditorState,
    dispatch: (tr: Transaction) => void,
    tableStart: number,
    rect: Rect,
    cells: { width: number, height: number, rows: Fragment[] }) {
    let table = tableStart
        ? state.doc.nodeAt(tableStart - 1)!
        : state.doc;
    let map = TableMap.get(table);
    const { top, left } = rect;
    const right = left + cells.width, bottom = top + cells.height;
    const tr = state.tr;
    let mapFrom = 0;
    function recomp() {
        table = tableStart
            ? tr.doc.nodeAt(tableStart - 1)!
            : tr.doc;
        map = TableMap.get(table)
        mapFrom = tr.mapping.maps.length
    }
    // Prepare the table to be large enough and not have any cells
    // crossing the boundaries of the rectangle that we want to
    // insert into. If anything about it changes, recompute the table
    // map so that subsequent operations can see the current shape.
    if (growTable(tr, map, table, tableStart, right, bottom, mapFrom)) {
        recomp();
    }
    if (isolateHorizontal(tr, map, table, tableStart, left, right, top, mapFrom)) {
        recomp();
    }
    if (isolateHorizontal(tr, map, table, tableStart, left, right, bottom, mapFrom)) {
        recomp();
    }
    if (isolateVertical(tr, map, table, tableStart, top, bottom, left, mapFrom)) {
        recomp();
    }
    if (isolateVertical(tr, map, table, tableStart, top, bottom, right, mapFrom)) {
        recomp();
    }

    for (let row = top; row < bottom; row++) {
        const from = map.positionAt(row, left, table), to = map.positionAt(row, right, table);
        tr.replace(
            tr.mapping.slice(mapFrom).map(from + tableStart),
            tr.mapping.slice(mapFrom).map(to + tableStart),
            new Slice(cells.rows[row - top], 0, 0));
    }
    recomp();
    tr.setSelection(
        new CellSelection(tr.doc.resolve(tableStart + map.positionAt(top, left, table)),
            tr.doc.resolve(tableStart + map.positionAt(bottom - 1, right - 1, table))));
    dispatch(tr);
}

function isCellBoundarySelection({ $from, $to }: { $from: ResolvedPos, $to: ResolvedPos }) {
    if ($from.pos == $to.pos || $from.pos < $from.pos - 6) {
        return false;
    }
    let afterFrom = $from.pos, beforeTo = $to.pos, depth = $from.depth;
    for (; depth >= 0; depth--, afterFrom++) {
        if ($from.after(depth + 1) < $from.end(depth)) {
            break;
        }
    }
    for (let d = $to.depth; d >= 0; d--, beforeTo--) {
        if ($to.before(d + 1) > $to.start(d)) {
            break;
        }
    }
    return afterFrom == beforeTo
        && /row|table/.test($from.node(depth).type.spec.tableRole);
}

function isEmpty(cell: ProsemirrorNode) {
    const c = cell.content;
    return c.childCount == 1
        && c.firstChild!.isTextblock
        && c.firstChild!.childCount == 0;
}

function isHeaderEnabledByType(
    type: string,
    rect: SelectedRect,
    types: { [key: string]: [NodeType] }) {
    // Get cell positions for first row or first column
    const cellPositions = rect.map.cellsInRect({
        left: 0,
        top: 0,
        right: type == "row" ? rect.map.width : 1,
        bottom: type == "column" ? rect.map.height : 1,
    });

    for (let i = 0; i < cellPositions.length; i++) {
        const cell = rect.table.nodeAt(cellPositions[i]);
        if (cell && !types.header_cell.includes(cell.type)) {
            return false;
        }
    }

    return true;
}

function isInTable(state: EditorState) {
    const $head = state.selection.$head;
    for (let d = $head.depth; d > 0; d--) {
        if ($head.node(d).type.spec.tableRole == "row") {
            return true;
        }
    }
    return false;
}

function isolateHorizontal(
    tr: Transaction,
    map: TableMap,
    table: ProsemirrorNode,
    start: number,
    left: number,
    right: number,
    top: number,
    mapFrom: number) {
    if (top == 0 || top == map.height) {
        return false;
    }
    let found = false;
    for (let col = left; col < right; col++) {
        const index = top * map.width + col, pos = map.map[index];
        if (map.map[index - map.width] == pos) {
            found = true;
            const cell = table.nodeAt(pos)!;
            const { top: cellTop, left: cellLeft } = map.findCell(pos);
            tr.setNodeMarkup(
                tr.mapping.slice(mapFrom).map(pos + start),
                undefined,
                setAttr(cell.attrs, "rowspan", top - cellTop));
            tr.insert(
                tr.mapping.slice(mapFrom).map(map.positionAt(top, cellLeft, table)),
                cell.type.createAndFill(setAttr(cell.attrs, "rowspan", (cellTop + cell.attrs.rowspan) - top))!);
            col += cell.attrs.colspan - 1;
        }
    }
    return found;
}

function isolateVertical(
    tr: Transaction,
    map: TableMap,
    table: ProsemirrorNode,
    start: number,
    top: number,
    bottom: number,
    left: number,
    mapFrom: number) {
    if (left == 0 || left == map.width) {
        return false;
    }
    let found = false;
    for (let row = top; row < bottom; row++) {
        const index = row * map.width + left, pos = map.map[index];
        if (map.map[index - 1] == pos) {
            found = true;
            const cell = table.nodeAt(pos)!, cellLeft = map.colCount(pos);
            const updatePos = tr.mapping.slice(mapFrom).map(pos + start);
            tr.setNodeMarkup(
                updatePos,
                undefined,
                removeColSpan(cell.attrs, left - cellLeft, cell.attrs.colspan - (left - cellLeft)));
            tr.insert(
                updatePos + cell.nodeSize,
                cell.type.createAndFill(removeColSpan(cell.attrs, 0, left - cellLeft))!);
            row += cell.attrs.rowspan - 1;
        }
    }
    return found;
}

function isTextSelectionAcrossCells({ $from, $to }: { $from: ResolvedPos, $to: ResolvedPos }) {
    let fromCellBoundaryNode;
    let toCellBoundaryNode;

    for (let i = $from.depth; i > 0; i--) {
        const node = $from.node(i);
        if (node.type.spec.tableRole === 'cell'
            || node.type.spec.tableRole === 'header_cell') {
            fromCellBoundaryNode = node;
            break;
        }
    }

    for (let i = $to.depth; i > 0; i--) {
        const node = $to.node(i);
        if (node.type.spec.tableRole === 'cell'
            || node.type.spec.tableRole === 'header_cell') {
            toCellBoundaryNode = node;
            break;
        }
    }

    return fromCellBoundaryNode !== toCellBoundaryNode
        && $to.parentOffset === 0;
}

function maybeSetSelection(
    state: EditorState,
    dispatch: ((tr: Transaction) => void) | undefined,
    selection: Selection) {
    if (selection.eq(state.selection)) {
        return false;
    }
    if (dispatch) {
        dispatch(state.tr.setSelection(selection).scrollIntoView());
    }
    return true;
}

function moveCellForward($pos: ResolvedPos) {
    return $pos.node(0).resolve($pos.pos + $pos.node().nodeSize);
}

function nextCell($pos: ResolvedPos, axis: string, dir: number) {
    let d = $pos.depth;
    for (; d > 0; d--) {
        if ($pos.node(d).type.spec.tableRole == "table") {
            break;
        }
    }
    if ($pos.node(d).type.spec.tableRole !== "table") {
        return null;
    }
    const start = $pos.start(d) + 1;
    const cell = $pos.start() - start, map = TableMap.get($pos.node(d));
    const moved = map.nextCell(cell, axis, dir);
    return moved == null
        ? null
        : $pos.node(0).resolve(start + moved);
}

function normalizeSelection(state: EditorState, tr: Transaction) {
    const sel = (tr || state).selection, doc = (tr || state).doc;
    let normalize: Selection | undefined, role: string;
    if (sel instanceof NodeSelection && (role = sel.node.type.spec.tableRole)) {
        if (role === "cell" || role === "header_cell") {
            normalize = CellSelection.create(doc, sel.$from.start());
        } else if (role === "row") {
            const $cell = doc.resolve(sel.from + 1);
            normalize = CellSelection.rowSelection($cell, $cell);
        }
    } else if (sel instanceof TextSelection
        && isCellBoundarySelection(sel)) {
        normalize = TextSelection.create(doc, sel.from);
    } else if (sel instanceof TextSelection
        && isTextSelectionAcrossCells(sel)) {
        normalize = TextSelection.create(doc, sel.$from.start(), sel.$from.end());
    }
    if (normalize) {
        (tr || (tr = state.tr)).setSelection(normalize);
    }
    return tr;
}

function pastedCells(slice: Slice) {
    if (!slice.size) {
        return null;
    }
    let { content, openStart, openEnd } = slice;
    while (content.childCount == 1
        && (openStart > 0
            && openEnd > 0
            || content.firstChild!.type.spec.tableRole == "table")) {
        openStart--;
        openEnd--;
        content = content.firstChild!.content;
    }
    const first = content.firstChild!, role = first.type.spec.tableRole;
    const schema = first.type.schema, rows: Fragment[] = [];
    if (role == "row") {
        for (let i = 0; i < content.childCount; i++) {
            let cells = content.child(i).content;
            const left = i ? 0 : Math.max(0, openStart - 1);
            const right = i < content.childCount - 1
                ? 0
                : Math.max(0, openEnd - 1);
            if (left || right) {
                cells = fitSlice(schema.nodes.table_row, new Slice(cells, left, right)).content;
            }
            rows.push(cells);
        }
    } else if (role == "cell" || role == "header_cell") {
        rows.push(openStart || openEnd
            ? fitSlice(schema.nodes.table_row, new Slice(content, openStart, openEnd)).content
            : content);
    } else {
        return null;
    }
    return ensureRectangular(schema, rows);
}

function pointsAtCell($pos: ResolvedPos) {
    return $pos.parent.type.spec.tableRole == "row" && $pos.node();
}

function readFromCache(key: ProsemirrorNode) {
    return cache.get(key);
}

function removeColSpan(attrs: { [key: string]: any }, pos: number, n = 1) {
    const result = setAttr(attrs, "colspan", attrs.colspan - n);
    if (result.colwidth) {
        result.colwidth = result.colwidth.slice();
        result.colwidth.splice(pos, n);
        if (!result.colwidth.some((w: number) => w > 0)) {
            result.colwidth = null;
        }
    }
    return result;
}

function removeColumn(
    tr: Transaction,
    { map, table, tableStart }: { map: TableMap, table: ProsemirrorNode, tableStart: number },
    col: number) {
    const mapStart = tr.mapping.maps.length;
    for (let row = 0; row < map.height;) {
        const index = row * map.width + col, pos = map.map[index], cell = table.nodeAt(pos)!;
        // If this is part of a col-spanning cell
        if ((col > 0 && map.map[index - 1] == pos) || (col < map.width - 1 && map.map[index + 1] == pos)) {
            tr.setNodeMarkup(
                tr.mapping.slice(mapStart).map(tableStart + pos),
                undefined,
                removeColSpan(cell.attrs, col - map.colCount(pos)));
        } else {
            const start = tr.mapping.slice(mapStart).map(tableStart + pos);
            tr.delete(start, start + cell.nodeSize);
        }
        row += cell.attrs.rowspan;
    }
}

function removeRow(
    tr: Transaction,
    { map, table, tableStart }: { map: TableMap, table: ProsemirrorNode, tableStart: number },
    row: number) {
    let rowPos = 0;
    let nextRow: number;
    const head = getTableHead(table);
    let h = 0;
    if (head) {
        rowPos++;
        for (; h < row && h < head.childCount; h++) {
            rowPos += head.child(h).nodeSize;
        }
        if (h == row && h < head.childCount) {
            nextRow = rowPos + head.child(row).nodeSize;
        }
    }
    const body = getTableBody(table);
    if (h < row) {
        if (body.type.spec.tableRole != "table") {
            rowPos++;
        }
        for (let i = 0; i + h < row && i < body.childCount; i++) {
            rowPos += body.child(i).nodeSize;
        }
    }
    nextRow = rowPos + body.child(row).nodeSize;

    const mapFrom = tr.mapping.maps.length;
    tr.delete(rowPos + tableStart, nextRow! + tableStart);

    for (let col = 0, index = row * map.width; col < map.width; col++, index++) {
        const pos = map.map[index];
        if (row > 0 && pos == map.map[index - map.width]) {
            // If this cell starts in the row above, simply reduce its rowspan
            const attrs = table.nodeAt(pos)!.attrs;
            tr.setNodeMarkup(
                tr.mapping.slice(mapFrom).map(pos + tableStart),
                undefined,
                setAttr(attrs, "rowspan", attrs.rowspan - 1));
            col += attrs.colspan - 1;
        } else if (row < map.width && pos == map.map[index + map.width]) {
            // Else, if it continues in the row below, it has to be moved down
            const cell = table.nodeAt(pos)!;
            const copy = cell.type.create(setAttr(cell.attrs, "rowspan", cell.attrs.rowspan - 1), cell.content);
            const newPos = map.positionAt(row + 1, col, table);
            tr.insert(tr.mapping.slice(mapFrom).map(tableStart + newPos), copy);
            col += cell.attrs.colspan - 1;
        }
    }
}

function rowIsHeader(map: TableMap, table: ProsemirrorNode, row: number) {
    const headerCell = table.type.schema.nodes.table_header;
    for (let col = 0; col < map.width; col++) {
        if (table.nodeAt(map.map[col + row * map.width])!.type != headerCell) {
            return false;
        }
    }
    return true;
}

function selectedRect(state: EditorState) {
    const sel = state.selection, $pos = selectionCell(state)!;
    let d = $pos.depth;
    for (; d > 0; d--) {
        if ($pos.node(d).type.spec.tableRole == "table") {
            break;
        }
    }
    const table = $pos.node(d), tableStart = $pos.start(d), map = TableMap.get(table);
    let rect: SelectedRect;
    if (sel instanceof CellSelection) {
        rect = map.rectBetween(sel.$anchorCell.pos - tableStart - 1, sel.$headCell.pos - tableStart - 1) as SelectedRect;
    } else {
        rect = map.findCell($pos.pos - tableStart - 1) as SelectedRect;
    }
    rect.map = map;
    rect.table = table;
    rect.tableDepth = d;
    rect.tableStart = tableStart;
    return rect;
}

function selectionCell(state: EditorState) {
    const sel = state.selection;
    if (sel instanceof CellSelection
        && sel.$anchorCell) {
        return sel.$anchorCell.pos > sel.$headCell.pos
            ? sel.$anchorCell
            : sel.$headCell;
    } else if (sel instanceof NodeSelection
        && sel.node
        && sel.node.type.spec.tableRole == "cell") {
        return sel.$anchor;
    }
    return cellAround(sel.$head) || cellNear(sel.$head);
}

function shiftArrow(axis: string, dir: number): Command {
    return (state, dispatch, view) => {
        let sel = state.selection;
        if (!(sel instanceof CellSelection)) {
            const $end = atEndOfCell(view!, axis, dir);
            if ($end == null) {
                return false;
            }
            sel = new CellSelection($end);
        }
        const $head = nextCell((sel as CellSelection).$headCell, axis, dir);
        if (!$head) {
            return false;
        }
        return maybeSetSelection(state, dispatch, new CellSelection((sel as CellSelection).$anchorCell, $head));
    }
}

function tableNodeTypes(schema: Schema) {
    let result: { [key: string]: [NodeType] } = schema.cached.tableNodeTypes;
    if (!result) {
        result = schema.cached.tableNodeTypes = {};
        for (const name in schema.nodes) {
            const type = schema.nodes[name], role: string | undefined = type.spec.tableRole;
            if (role) {
                result[role] = result[role] || []
                result[role].push(type);
            }
        }
    }
    return result;
}

function toggleHeader(type: string): Command {
    return function (state, dispatch) {
        if (!isInTable(state)) {
            return false;
        }
        if (dispatch) {
            const types = tableNodeTypes(state.schema);
            const rect = selectedRect(state), tr = state.tr;

            const isHeaderEnabled = type === "column"
                ? isHeaderEnabledByType("column", rect, types)
                : type === "row"
                    ? isHeaderEnabledByType("row", rect, types)
                    : false;

            const selectionStartsAt = isHeaderEnabled ? 1 : 0;

            const cellsRect = type == "column"
                ? new Rect(0, selectionStartsAt, 1, rect.map.height)
                : type == "row"
                    ? new Rect(selectionStartsAt, 0, rect.map.width, 1)
                    : rect;

            const newTypes = isHeaderEnabled
                ? types.cell
                : types.header_cell;
            const newType = newTypes.find(x => x.name.endsWith('_text')) || newTypes[0];

            rect.map.cellsInRect(cellsRect).forEach(relativeCellPos => {
                const cellPos = relativeCellPos + rect.tableStart;
                const cell = tr.doc.nodeAt(cellPos);

                if (cell) {
                    tr.setNodeMarkup(cellPos, newType, cell.attrs);
                }
            })

            dispatch(tr);
        }
        return true;
    }
}

function updateColumns(
    node: ProsemirrorNode,
    colgroup: Node,
    table: HTMLTableElement,
    cellMinWidth: number,
    overrideCol?: number,
    overrideValue?: number) {
    const tableHasStyle = node.attrs.style;
    let totalWidth = 0, fixedWidth = true;
    let body = getTableBody(node);
    let nextDOM = colgroup.firstChild as HTMLTableColElement, row = body.firstChild!;
    for (let i = 0, col = 0; i < row.childCount; i++) {
        const { colspan, colwidth } = row.child(i).attrs;
        for (let j = 0; j < colspan; j++, col++) {
            const hasWidth: number = overrideCol == col
                ? overrideValue
                : colwidth && colwidth[j];
            const cssWidth = hasWidth ? hasWidth + "px" : "";
            totalWidth += hasWidth || cellMinWidth;
            if (!hasWidth) {
                fixedWidth = false;
            }
            if (!nextDOM) {
                colgroup.appendChild(document.createElement("col")).style.width = cssWidth;
            } else {
                if (nextDOM.style.width != cssWidth) {
                    nextDOM.style.width = cssWidth;
                }
                nextDOM = nextDOM.nextSibling as HTMLTableColElement;
            }
        }
    }

    while (nextDOM) {
        const after = nextDOM.nextSibling as HTMLTableColElement;
        nextDOM.parentNode!.removeChild(nextDOM);
        nextDOM = after;
    }

    if (tableHasStyle) {
        table.setAttribute('style', node.attrs.style);
    }
    if (!tableHasStyle || node.attrs.style.indexOf('width:') == -1) {
        if (fixedWidth) {
            table.style.width = totalWidth + "px";
            table.style.minWidth = "";
        } else {
            table.style.width = "";
            table.style.minWidth = totalWidth + "px";
        }
    }
}

function updateColumnWidth(view: EditorView, cell: number, width: number) {
    const $cell = view.state.doc.resolve(cell);
    let depth = $cell.depth - 1;
    let table = $cell.node(depth);
    while (depth > 0 && table.type.name != view.state.schema.nodes.table.name) {
        depth--;
        table = $cell.node(depth);
    }
    const map = TableMap.get(table), start = $cell.start(depth) + 1;
    const col = map.colCount($cell.pos - start) + $cell.node().attrs.colspan - 1;
    const tr = view.state.tr;
    for (let row = 0; row < map.height; row++) {
        const mapIndex = row * map.width + col;
        if (row && map.map[mapIndex] == map.map[mapIndex - map.width]) {
            continue;
        }
        const pos = map.map[mapIndex];
        const node = table.nodeAt(pos)!;
        const { attrs } = node;
        const index = attrs.colspan == 1
            ? 0
            : col - map.colCount(pos);
        if (attrs.colwidth && attrs.colwidth[index] == width) {
            continue;
        }
        const colwidth = attrs.colwidth
            ? attrs.colwidth.slice()
            : zeroes(attrs.colspan);
        colwidth[index] = width;
        tr.setNodeMarkup(start + pos, undefined, setAttr(attrs, "colwidth", colwidth));
    }
    if (tr.docChanged) {
        view.dispatch(tr);
    }
}

function updateHandle(view: EditorView, value: number) {
    view.dispatch(view.state.tr.setMeta(columnResizingKey, { setHandle: value }));
}

function zeroes(n: number) {
    const result: number[] = [];
    for (let i = 0; i < n; i++) {
        result.push(0);
    }
    return result;
}
