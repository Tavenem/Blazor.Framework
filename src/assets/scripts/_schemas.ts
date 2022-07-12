import { Command, EditorState, NodeSelection, Selection, SelectionRange, TextSelection, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import {
    AttributeSpec,
    Attrs,
    ContentMatch,
    DOMOutputSpec,
    Mark,
    MarkSpec,
    MarkType,
    Node as ProsemirrorNode,
    NodeSpec,
    NodeType,
    ResolvedPos,
    Schema,
} from 'prosemirror-model';
import { findWrapping, RemoveMarkStep } from 'prosemirror-transform';
import { chainCommands, lift, liftEmptyBlock, setBlockType, toggleMark, wrapIn } from 'prosemirror-commands';
import { redo, undo } from 'prosemirror-history';
import { liftListItem, sinkListItem, wrapInList } from 'prosemirror-schema-list';

import {
    EditorSelection,
    EditorState as CodeEditorState,
    Transaction as CodeTransaction,
    StateCommand
} from '@codemirror/state';
import {
    addColumnAfter,
    addColumnBefore,
    addRowAfter,
    addRowBefore,
    CellSelection,
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
} from './_tables';

export enum CommandType {
    None = 0,
    Undo = 1,
    Redo = 2,
    Heading = 3,
    Paragraph = 4,
    BlockQuote = 5,
    CodeBlock = 6,
    Strong = 7,
    Bold = 8,
    Emphasis = 9,
    Italic = 10,
    Underline = 11,
    Strikethrough = 12,
    Small = 13,
    Subscript = 14,
    Superscript = 15,
    Inserted = 16,
    Marked = 17,
    CodeInline = 18,
    ForegroundColor = 19,
    BackgroundColor = 20,
    InsertLink = 21,
    InsertImage = 22,
    ListBullet = 23,
    ListNumber = 24,
    ListCheck = 25,
    UpLevel = 26,
    DownLevel = 27,
    InsertTable = 28,
    TableInsertColumnBefore = 29,
    TableInsertColumnAfter = 30,
    TableDeleteColumn = 31,
    TableInsertRowBefore = 32,
    TableInsertRowAfter = 33,
    TableDeleteRow = 34,
    TableDelete = 35,
    TableMergeCells = 36,
    TableSplitCell = 37,
    TableToggleHeaderColumn = 38,
    TableToggleHeaderRow = 39,
    TableFullWidth = 40,
    HorizontalRule = 41,
    SetCodeSyntax = 42,
    SetFontFamily = 43,
    SetFontSize = 44,
    SetLineHeight = 45,
    AlignLeft = 46,
    AlignCenter = 47,
    AlignRight = 48,
    PageBreak = 49,
}

interface ParamCommand {
    (state: EditorState, dispatch?: (tr: Transaction) => void, view?: EditorView, params?: any[]): boolean;
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
    dir: { default: null },
    itemid: { default: null },
    itemprop: { default: null },
    itemref: { default: null },
    itemscope: { default: null },
    itemtype: { default: null },
    lang: { default: null },
    role: { default: null },
    style: { default: null },
    title: { default: null },
};
const getCommonAttrs = (
    node: Node | string,
    attrs?: { [key: string]: any },
    filterClass?: (x: string) => boolean) => {
    if (node instanceof HTMLElement) {
        attrs = attrs || {};
        attrs.id = node.id;

        if (filterClass) {
            const classes = node.className.split(" ");
            attrs.className = classes.filter(x => filterClass(x)).join(" ");
        } else {
            attrs.className = node.className; 
        }

        attrs.dir = node.dir;
        attrs.itemid = node.getAttribute('itemid');
        attrs.itemprop = node.getAttribute('itemprop');
        attrs.itemref = node.getAttribute('itemref');
        attrs.itemscope = node.getAttribute('itemscope');
        attrs.itemtype = node.getAttribute('itemtype');
        attrs.lang = node.lang;
        attrs.role = node.getAttribute('role');
        attrs.style = node.style.cssText;
        attrs.title = node.title;
    }
    return attrs as Attrs;
};
const nodeToDomWithCommonAttrs: (node: ProsemirrorNode, tag: string, extraClass?: string, children?: (DOMOutputSpec | 0)[]) => DOMOutputSpec = (node, tag, extraClass, children) => {
    const {
        id,
        className,
        dir,
        itemid,
        itemprop,
        itemref,
        itemscope,
        itemtype,
        lang,
        role,
        style,
        title
    } = node.attrs;
    const attrs: { [key: string]: any } = {};
    if (id && id.length) {
        attrs.id = id;
    }

    if (className && className.length) {
        attrs.class = className;
    }
    if (extraClass) {
        attrs.class = attrs.class || "";
        if (attrs.class.length) {
            attrs.class += " ";
        }
        attrs.class += extraClass;
    }

    if (dir && dir.length) {
        attrs.dir = dir;
    }
    if (itemid && itemid.length) {
        attrs.itemid = itemid;
    }
    if (itemprop && itemprop.length) {
        attrs.itemprop = itemprop;
    }
    if (itemref && itemref.length) {
        attrs.itemref = itemref;
    }
    if (itemscope && itemscope.length) {
        attrs.itemscope = itemscope;
    }
    if (itemtype && itemtype.length) {
        attrs.itemtype = itemtype;
    }
    if (lang && lang.length) {
        attrs.lang = lang;
    }
    if (role && role.length) {
        attrs.role = role;
    }
    if (style && style.length) {
        attrs.style = style;
    }
    if (title && title.length) {
        attrs.title = title;
    }

    if (children) {
        return [tag, attrs, ...children];
    } else {
        return [tag, attrs, 0];
    }
};
const nodeToDomWithAttrs: (node: ProsemirrorNode, tag: string, attrs: { [key: string]: any }, extraClass?: string, children?: (DOMOutputSpec | 0)[]) => DOMOutputSpec = (node, tag, attrs, extraClass, children) => {
    const {
        id,
        className,
        dir,
        itemid,
        itemprop,
        itemref,
        itemscope,
        itemtype,
        lang,
        role,
        style,
        title
    } = node.attrs;

    const domAttrs: { [key: string]: any } = {};
    for (const attr in attrs) {
        if (attrs[attr]) {
            domAttrs[attr] = attrs[attr];
        }
    }

    if (id && id.length) {
        domAttrs.id = id;
    }

    if (className && className.length) {
        if (domAttrs.class) {
            domAttrs.class += ' ' + className;
        } else {
            domAttrs.class = className;
        }
    }
    if (extraClass) {
        domAttrs.class = domAttrs.class || "";
        if (domAttrs.class.length) {
            domAttrs.class += " ";
        }
        domAttrs.class += extraClass;
    }


    if (dir && dir.length) {
        domAttrs.dir = dir;
    }
    if (itemid && itemid.length) {
        domAttrs.itemid = itemid;
    }
    if (itemprop && itemprop.length) {
        domAttrs.itemprop = itemprop;
    }
    if (itemref && itemref.length) {
        domAttrs.itemref = itemref;
    }
    if (itemscope && itemscope.length) {
        domAttrs.itemscope = itemscope;
    }
    if (itemtype && itemtype.length) {
        domAttrs.itemtype = itemtype;
    }
    if (lang && lang.length) {
        domAttrs.lang = lang;
    }
    if (role && role.length) {
        domAttrs.role = role;
    }
    if (style && style.length) {
        domAttrs.style = style;
    }
    if (title && title.length) {
        domAttrs.title = title;
    }

    if (children) {
        return [tag, domAttrs, ...children];
    } else {
        return [tag, domAttrs, 0];
    }
};
const contentlessToDomWithCommonAttrs: (node: ProsemirrorNode, tag: string, attrs?: { [key: string]: any }) => DOMOutputSpec = (node, tag, attrs) => {
    const {
        id,
        className,
        dir,
        itemid,
        itemprop,
        itemref,
        itemscope,
        itemtype,
        lang,
        role,
        style,
        title
    } = node.attrs;

    const domAttrs: { [key: string]: any } = {};
    if (attrs) {
        for (const attr in attrs) {
            if (attrs[attr]) {
                domAttrs[attr] = attrs[attr];
            }
        }
    }

    if (id && id.length) {
        domAttrs.id = id;
    }
    if (className && className.length) {
        domAttrs.class = className;
    }
    if (dir && dir.length) {
        domAttrs.dir = dir;
    }
    if (itemid && itemid.length) {
        domAttrs.itemid = itemid;
    }
    if (itemprop && itemprop.length) {
        domAttrs.itemprop = itemprop;
    }
    if (itemref && itemref.length) {
        domAttrs.itemref = itemref;
    }
    if (itemscope && itemscope.length) {
        domAttrs.itemscope = itemscope;
    }
    if (itemtype && itemtype.length) {
        domAttrs.itemtype = itemtype;
    }
    if (lang && lang.length) {
        domAttrs.lang = lang;
    }
    if (role && role.length) {
        domAttrs.role = role;
    }
    if (style && style.length) {
        domAttrs.style = style;
    }
    if (title && title.length) {
        domAttrs.title = title;
    }
    return [tag, domAttrs];
};
const commonNodes: { [name in string]: NodeSpec } = {
    doc: { content: "(flow | address | headerfooter | heading | main | sectioning)+ | html" },
    paragraph: {
        attrs: commonAttrs,
        content: "(phrasing | image)*",
        group: "flow",
        parseDOM: [{ tag: "p", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "p") }
    },
    blockquote: {
        attrs: plusCommonAttributes({
            cite: { default: null }
        }),
        content: "(flow | address | headerfooter | heading | sectioning)+",
        group: "flow",
        defining: true,
        parseDOM: [{
            tag: "blockquote",
            getAttrs(node) {
                let attrs: { [key: string]: any } | undefined;
                if (node instanceof HTMLQuoteElement) {
                    attrs = { cite: node.cite };
                }
                return getCommonAttrs(node, attrs);
            }
        }],
        toDOM(node) {
            const { cite } = node.attrs;
            return nodeToDomWithAttrs(node, "blockquote", { cite });
        }
    },
    horizontal_rule: {
        attrs: commonAttrs,
        group: "flow",
        parseDOM: [{ tag: "hr", getAttrs: getCommonAttrs }],
        toDOM(node) { return contentlessToDomWithCommonAttrs(node, "hr") }
    },
    heading: {
        attrs: plusCommonAttributes({ level: { default: 1 } }),
        content: "(phrasing | image)*",
        group: "heading",
        defining: true,
        parseDOM: [
            { tag: "h1", getAttrs(p) { return getCommonAttrs(p, { level: 1 }) } },
            { tag: "h2", getAttrs(p) { return getCommonAttrs(p, { level: 2 }) } },
            { tag: "h3", getAttrs(p) { return getCommonAttrs(p, { level: 3 }) } },
            { tag: "h4", getAttrs(p) { return getCommonAttrs(p, { level: 4 }) } },
            { tag: "h5", getAttrs(p) { return getCommonAttrs(p, { level: 5 }) } },
            { tag: "h6", getAttrs(p) { return getCommonAttrs(p, { level: 6 }) } }
        ],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "h" + node.attrs.level) }
    },
    code_block: {
        attrs: plusCommonAttributes({ syntax: { default: null } }),
        content: "text*",
        marks: "",
        group: "flow",
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
                        if (syntax) {
                            syntax = syntax.substring(9);
                        }
                    }
                    return getCommonAttrs(node, { syntax }, x => !x.startsWith("language-"));
                }
                return null;
            }
        }],
        toDOM(node) {
            const { syntax } = node.attrs;
            return nodeToDomWithCommonAttrs(node, "pre", syntax ? `language-${syntax}` : undefined, [["code", 0]]);
        }
    },
    text: { group: "phrasing" },
    image: {
        attrs: plusCommonAttributes({
            src: {},
            srcset: { default: null },
            alt: { default: null },
            height: { default: null },
            sizes: { default: null },
            width: { default: null },
        }),
        draggable: true,
        inline: true,
        parseDOM: [{
            tag: "img[src]",
            getAttrs(node) {
                let attrs: { [key: string]: any } | undefined;
                if (node instanceof HTMLImageElement) {
                    attrs = {
                        src: node.src,
                        srcset: node.srcset,
                        alt: node.alt,
                        height: node.getAttribute('height'),
                        sizes: node.sizes,
                        width: node.getAttribute('width'),
                    };
                }
                return getCommonAttrs(node, attrs);
            }
        }],
        toDOM(node) {
            const { src, srcset, alt, height, sizes, width } = node.attrs;
            return contentlessToDomWithCommonAttrs(node, "img", { src, srcset, alt, height, sizes, width });
        }
    },
    hard_break: {
        attrs: commonAttrs,
        inline: true,
        group: "phrasing",
        selectable: false,
        parseDOM: [{ tag: "br", getAttrs: getCommonAttrs }],
        toDOM(node) { return contentlessToDomWithCommonAttrs(node, "br") }
    },
    ordered_list: {
        attrs: plusCommonAttributes({ order: { default: 1 } }),
        content: "list_item+",
        group: "flow",
        parseDOM: [{
            tag: "ol",
            getAttrs(node) {
                let attrs: { [key: string]: any };
                if (node instanceof HTMLElement) {
                    attrs = { order: node.hasAttribute("start") ? +(node.getAttribute("start") || 1) : 1 };
                } else {
                    attrs = { order: 1 };
                }
                return getCommonAttrs(node, attrs);
            }
        }],
        toDOM(node) {
            const { order } = node.attrs;
            return order == 1
                ? nodeToDomWithCommonAttrs(node, "ol")
                : nodeToDomWithAttrs(node, "ol", { start: order });
        }
    },
    task_list: {
        attrs: commonAttrs,
        content: "(task_list_item | list_item)+",
        group: "flow",
        parseDOM: [{ tag: "ul", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "ul") }
    },
    bullet_list: {
        attrs: commonAttrs,
        content: "list_item+",
        group: "flow",
        parseDOM: [{ tag: "ul", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "ul") }
    },
    menu: {
        attrs: commonAttrs,
        content: "list_item+",
        group: "flow",
        parseDOM: [{ tag: "menu", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "menu") }
    },
    definition_list: {
        attrs: commonAttrs,
        content: "(term | definition)+",
        group: "flow",
        parseDOM: [{ tag: "dl", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "dl") }
    },
    task_list_item: {
        attrs: plusCommonAttributes({ complete: { default: false } }),
        content: "paragraph (flow | address | headerfooter | heading | sectioning)*",
        defining: true,
        parseDOM: [{
            tag: "li",
            getAttrs: node => {
                let attrs: { [key: string]: any } | undefined;
                if (node instanceof HTMLLIElement) {
                    const child = node.firstChild;
                    if (child instanceof HTMLInputElement
                        && child.type == 'checkbox') {
                        attrs = { complete: child.checked };
                    }
                }
                return getCommonAttrs(node, attrs);
            }
        }],
        toDOM(node) {
            const { complete } = node.attrs;
            return nodeToDomWithAttrs(node, "li", { class: "task-list-item" }, undefined, [["input", { type: 'checkbox', checked: complete }], ["div", 0]]);
        }
    },
    term: {
        attrs: commonAttrs,
        content: "paragraph (flow | address | headerfooter | heading | sectioning)*",
        defining: true,
        parseDOM: [{ tag: "dt", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "dt") }
    },
    definition: {
        attrs: commonAttrs,
        content: "paragraph (flow | address | headerfooter | heading | sectioning)*",
        defining: true,
        parseDOM: [{ tag: "dd", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "dd") }
    },
    list_item: {
        attrs: commonAttrs,
        content: "paragraph (flow | address | headerfooter | heading | sectioning)*",
        defining: true,
        parseDOM: [{ tag: "li", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "li") }
    },
    table: {
        content: "caption? colgroup* thead? tbody tfoot?",
        attrs: commonAttrs,
        group: "flow",
        tableRole: "table",
        isolating: true,
        parseDOM: [{ tag: "table", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "table", undefined) }
    },
    table_row: {
        content: "(table_cell | table_header)*",
        attrs: commonAttrs,
        tableRole: "row",
        parseDOM: [{ tag: "tr", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "tr") }
    },
    table_cell: {
        content: "(phrasing | image)*",
        attrs: plusCommonAttributes({
            align: { default: null },
            colspan: { default: 1 },
            colwidth: { default: null },
            rowspan: { default: 1 }
        }),
        tableRole: "cell",
        isolating: true,
        parseDOM: [{
            tag: "td",
            getAttrs(node) {
                let attrs: { [key: string]: any } | undefined;
                if (node instanceof HTMLTableCellElement) {
                    attrs = {
                        align: node.style.textAlign,
                        colspan: node.colSpan || 1,
                        rowspan: node.rowSpan || 1
                    };

                    const widthAttr = node.getAttribute("data-colwidth");
                    const widths = widthAttr
                        && /^\d+(,\d+)*$/.test(widthAttr)
                        ? widthAttr.split(",").map(s => Number(s))
                        : null;
                    attrs.colwidth = widths && widths.length == attrs.colspan
                        ? widths
                        : null;
                }
                return getCommonAttrs(node, attrs);
            }
        }],
        toDOM(node) {
            const { align, colspan, colwidth, rowspan } = node.attrs;
            const attrs: { [key: string]: any } = {};
            if (colspan != 1) {
                attrs.colspan = colspan;
            }
            if (rowspan != 1) {
                attrs.rowspan = rowspan;
            }
            if (colwidth) {
                attrs["data-colwidth"] = colwidth;
            }
            if (align) {
                attrs.style = `text-align: ${align};`;
            }
            return nodeToDomWithAttrs(node, "td", attrs);
        }
    },
    table_header: {
        content: "(phrasing | image)*",
        attrs: plusCommonAttributes({
            abbr: { default: null },
            align: { default: null },
            colspan: { default: 1 },
            colwidth: { default: null },
            rowspan: { default: 1 },
            scope: { default: null }
        }),
        tableRole: "header_cell",
        isolating: true,
        parseDOM: [{
            tag: "th",
            getAttrs(node) {
                let attrs: { [key: string]: any } | undefined;
                if (node instanceof HTMLTableCellElement) {
                    attrs = {
                        abbr: node.abbr,
                        align: node.style.textAlign,
                        colspan: node.colSpan || 1,
                        rowspan: node.rowSpan || 1,
                        scope: node.scope,
                    };

                    const widthAttr = node.getAttribute("data-colwidth");
                    const widths = widthAttr
                        && /^\d+(,\d+)*$/.test(widthAttr)
                        ? widthAttr.split(",").map(s => Number(s))
                        : null;
                    attrs.colwidth = widths && widths.length == attrs.colspan
                        ? widths
                        : null;
                }
                return getCommonAttrs(node, attrs);
            }
        }],
        toDOM(node) {
            const { align, colspan, colwidth, rowspan } = node.attrs;
            const attrs: { [key: string]: any } = {};
            if (colspan != 1) {
                attrs.colspan = colspan;
            }
            if (rowspan != 1) {
                attrs.rowspan = rowspan;
            }
            if (colwidth) {
                attrs["data-colwidth"] = colwidth;
            }
            if (align) {
                attrs.style = `text-align: ${align};`;
            }
            return nodeToDomWithAttrs(node, "th", attrs);
        }
    },
    math_inline: {
        attrs: commonAttrs,
        group: "inline math",
        content: "text*",
        inline: true,
        atom: true,
        parseDOM: [{
            tag: "math-inline",
            getAttrs(node) { return getCommonAttrs(node, undefined, x => x != "math-node") }
        }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "math-inline", "math-node") }
    },
    math_display: {
        attrs: commonAttrs,
        group: "block math",
        content: "text*",
        atom: true,
        code: true,
        parseDOM: [{
            tag: "math-display",
            getAttrs(node) { return getCommonAttrs(node, undefined, x => x != "math-node") }
        }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "math-display", "math-node") }
    },
    div: {
        attrs: commonAttrs,
        content: "(flow | address | headerfooter | heading | main | sectioning)+",
        group: "flow",
        parseDOM: [{ tag: "div", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "div") }
    },
    address: {
        attrs: commonAttrs,
        content: "(phrasing | image)*",
        defining: true,
        group: "flow",
        parseDOM: [{ tag: "address", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "address") }
    },
    area: {
        attrs: plusCommonAttributes({
            href: {},
            shape: {},
            alt: { default: null },
            coords: { default: null },
            download: { default: null },
            rel: { default: null },
            target: { default: null },
        }),
        defining: true,
        inline: true,
        selectable: false,
        parseDOM: [{
            tag: "area[href][shape]",
            getAttrs(node) {
                let attrs: { [key: string]: any } | undefined;
                if (node instanceof HTMLAreaElement) {
                    attrs = {
                        href: node.href,
                        shape: node.shape,
                        alt: node.alt,
                        coords: node.coords,
                        download: node.download,
                        rel: node.rel,
                        target: node.target,
                    };
                }
                return getCommonAttrs(node, attrs);
            }
        }],
        toDOM(node) {
            const { href, shape, alt, coords, download, rel, target } = node.attrs;
            return nodeToDomWithAttrs(node, "area", { href, shape, alt, coords, download, rel, target });
        }
    },
    article: {
        attrs: commonAttrs,
        content: "(flow | address | headerfooter | heading | sectioning)+",
        defining: true,
        group: "sectioning",
        parseDOM: [{ tag: "article", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "article") }
    },
    aside: {
        attrs: commonAttrs,
        content: "(flow | address | headerfooter | heading | sectioning)+",
        defining: true,
        group: "sectioning",
        parseDOM: [{ tag: "aside", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "aside") }
    },
    audio: {
        attrs: plusCommonAttributes({
            controls: { default: null },
            loop: { default: null },
            muted: { default: null },
            preload: { default: null },
            src: { default: null },
        }),
        content: "(image | phrasing)*",
        defining: true,
        draggable: true,
        inline: true,
        group: "phrasing",
        parseDOM: [{
            tag: "audio",
            getAttrs(node) {
                let attrs: { [key: string]: any } | undefined;
                if (node instanceof HTMLAudioElement) {
                    attrs = {
                        controls: node.controls,
                        loop: node.loop,
                        muted: node.muted,
                        preload: node.preload,
                        src: node.src,
                    };
                }
                return getCommonAttrs(node, attrs);
            }
        }],
        toDOM(node) {
            const { controls, loop, muted, preload, src } = node.attrs;
            return nodeToDomWithAttrs(node, "audio", { controls, loop, muted, preload, src });
        }
    },
    base: {
        attrs: plusCommonAttributes({
            href: {},
            target: { default: null },
        }),
        parseDOM: [{
            tag: "base",
            getAttrs(node) {
                let attrs: { [key: string]: any } | undefined;
                if (node instanceof HTMLBaseElement) {
                    attrs = {
                        href: node.href,
                        target: node.target,
                    };
                }
                return getCommonAttrs(node, attrs);
            }
        }],
        toDOM(node) {
            const { href, target } = node.attrs;
            return contentlessToDomWithCommonAttrs(node, "base", { href, target });
        }
    },
    body: {
        attrs: commonAttrs,
        content: "(flow | address | headerfooter | heading | main | sectioning)+",
        defining: true,
        parseDOM: [{ tag: "body", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "body") }
    },
    caption: {
        attrs: commonAttrs,
        content: "(flow | address | headerfooter | heading | sectioning)+",
        defining: true,
        parseDOM: [{ tag: "caption", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "caption") }
    },
    col: {
        attrs: plusCommonAttributes({ span: { default: null } }),
        defining: true,
        parseDOM: [{
            tag: "col",
            getAttrs(node) {
                let attrs: { [key: string]: any } | undefined;
                if (node instanceof HTMLTableColElement) {
                    attrs = { span: node.span };
                }
                return getCommonAttrs(node, attrs);
            }
        }],
        toDOM(node) {
            const { span } = node.attrs;
            return contentlessToDomWithCommonAttrs(node, "col", { span });
        }
    },
    colgroup: {
        attrs: plusCommonAttributes({ span: { default: null } }),
        content: "col*",
        defining: true,
        parseDOM: [{
            tag: "colgroup",
            getAttrs(node) {
                let attrs: { [key: string]: any } | undefined;
                if (node instanceof HTMLTableColElement) {
                    attrs = { span: node.span };
                }
                return getCommonAttrs(node, attrs);
            }
        }],
        toDOM(node) {
            const { span } = node.attrs;
            return contentlessToDomWithCommonAttrs(node, "colgroup", { span });
        }
    },
    details: {
        attrs: plusCommonAttributes({ open: { default: null } }),
        content: "summary? (phrasing | image)+",
        defining: true,
        inline: true,
        group: "phrasing",
        parseDOM: [{
            tag: "progress",
            getAttrs(node) {
                let attrs: { [key: string]: any } | undefined;
                if (node instanceof HTMLDetailsElement) {
                    attrs = { open: node.open };
                }
                return getCommonAttrs(node, attrs);
            }
        }],
        toDOM(node) {
            const { open } = node.attrs;
            return contentlessToDomWithCommonAttrs(node, "progress", { open });
        }
    },
    figcaption: {
        attrs: commonAttrs,
        content: "(flow | address | headerfooter | heading | sectioning)+",
        defining: true,
        parseDOM: [{ tag: "figcaption", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "figcaption") }
    },
    figure: {
        attrs: commonAttrs,
        content: "(flow | address | figcaption | headerfooter | heading | sectioning)+",
        defining: true,
        group: "flow",
        parseDOM: [{ tag: "figure", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "figure") }
    },
    footer: {
        attrs: commonAttrs,
        content: "(flow | address | heading | sectioning)+",
        defining: true,
        group: "headerfooter",
        parseDOM: [{ tag: "footer", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "footer") }
    },
    head: {
        attrs: commonAttrs,
        content: "(meta | link | style)* title (meta | link | style)*",
        defining: true,
        parseDOM: [{ tag: "head", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "head") }
    },
    header: {
        attrs: commonAttrs,
        content: "(flow | address | heading | sectioning)+",
        defining: true,
        group: "headerfooter",
        parseDOM: [{ tag: "header", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "header") }
    },
    html: {
        attrs: plusCommonAttributes({ xmlns: { default: null } }),
        content: "head body",
        defining: true,
        parseDOM: [{
            tag: "html",
            getAttrs(node) {
                let attrs: { [key: string]: any } | undefined;
                if (node instanceof HTMLHtmlElement) {
                    attrs = { xmlns: node.getAttribute('xmlns') };
                }
                return getCommonAttrs(node, attrs);
            }
        }],
        toDOM(node) {
            const { xmlns } = node.attrs;
            return nodeToDomWithAttrs(node, "html", { xmlns });
        }
    },
    iframe: {
        attrs: plusCommonAttributes({
            allow: { default: null },
            allowfullscreen: { default: null },
            allowpaymentrequest: { default: null },
            csp: { default: null },
            fetchpriority: { default: null },
            height: { default: null },
            loading: { default: null },
            name: { default: null },
            referrerpolicy: { default: null },
            sandbox: { default: null },
            src: { default: null },
            srcdoc: { default: null },
            width: { default: null },
        }),
        group: "flow",
        parseDOM: [{
            tag: "iframe",
            getAttrs(node) {
                let attrs: { [key: string]: any } | undefined;
                if (node instanceof HTMLIFrameElement) {
                    attrs = {
                        content: node.outerHTML,
                        allow: node.allow,
                        allowfullscreen: node.allowFullscreen,
                        allowpaymentrequest: node.getAttribute('allowpaymentrequest'),
                        csp: node.getAttribute('csp'),
                        fetchpriority: node.getAttribute('fetchpriority'),
                        height: node.height,
                        loading: node.getAttribute('loading'),
                        name: node.name,
                        referrerpolicy: node.referrerPolicy,
                        sandbox: node.sandbox,
                        src: node.src,
                        srcdoc: node.srcdoc,
                        width: node.width,
                    };
                }
                return getCommonAttrs(node, attrs);
            }
        }],
        toDOM(node) {
            const {
                allow,
                allowfullscreen,
                allowpaymentrequest,
                csp,
                fetchpriority,
                height,
                loading,
                name,
                referrerpolicy,
                sandbox,
                src,
                srcdoc,
                width,
            } = node.attrs;
            return contentlessToDomWithCommonAttrs(node, "iframe", {
                allow,
                allowfullscreen,
                allowpaymentrequest,
                csp,
                fetchpriority,
                height,
                loading,
                name,
                referrerpolicy,
                sandbox,
                src,
                srcdoc,
                width,
            });
        }
    },
    label: {
        attrs: plusCommonAttributes({ for: { default: null } }),
        content: "(phrasing | image)*",
        defining: true,
        inline: true,
        group: "phrasing",
        parseDOM: [{
            tag: "label",
            getAttrs(node) {
                let attrs: { [key: string]: any } | undefined;
                if (node instanceof HTMLLabelElement) {
                    attrs = { htmlFor: node.htmlFor };
                }
                return getCommonAttrs(node, attrs);
            }
        }],
        toDOM(node) {
            const { htmlFor } = node.attrs;
            return contentlessToDomWithCommonAttrs(node, "label", { for: htmlFor });
        }
    },
    link: {
        attrs: plusCommonAttributes({
            as: { default: null },
            crossorigin: { default: null },
            disabled: { default: null },
            fetchpriority: { default: null },
            href: { default: null },
            hreflang: { default: null },
            imagesizes: { default: null },
            imagesrcset: { default: null },
            media: { default: null },
            prefetch: { default: null },
            referrerpolicy: { default: null },
            rel: { default: null },
            sizes: { default: null },
            type: { default: null },
        }),
        parseDOM: [{
            tag: "link",
            getAttrs(node) {
                let attrs: { [key: string]: any } | undefined;
                if (node instanceof HTMLLinkElement) {
                    attrs = {
                        as: node.as,
                        crossorigin: node.getAttribute('crossorigin'),
                        disabled: node.disabled,
                        fetchpriority: node.getAttribute('fetchpriority'),
                        href: node.href,
                        hreflang: node.hreflang,
                        imagesizes: node.getAttribute('imagesizes'),
                        imagesrcset: node.getAttribute('imagesrcset'),
                        media: node.media,
                        prefetch: node.getAttribute('prefetch'),
                        referrerpolicy: node.getAttribute('referrerpolicy'),
                        rel: node.rel,
                        sizes: node.sizes,
                        type: node.type,
                    };
                }
                return getCommonAttrs(node, attrs);
            }
        }],
        toDOM(node) {
            const {
                as,
                crossorigin,
                disabled,
                fetchpriority,
                href,
                hreflang,
                imagesizes,
                imagesrcset,
                media,
                prefetch,
                referrerpolicy,
                rel,
                sizes,
                type,
            } = node.attrs;
            return contentlessToDomWithCommonAttrs(node, "link", {
                as,
                crossorigin,
                disabled,
                fetchpriority,
                href,
                hreflang,
                imagesizes,
                imagesrcset,
                media,
                prefetch,
                referrerpolicy,
                rel,
                sizes,
                type,
            });
        }
    },
    main: {
        attrs: commonAttrs,
        content: "(flow | address | headerfooter | heading | sectioning)+",
        defining: true,
        parseDOM: [{ tag: "main", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "main") }
    },
    map: {
        attrs: plusCommonAttributes({ name: {} }),
        content: "area*",
        defining: true,
        inline: true,
        group: "phrasing",
        parseDOM: [{
            tag: "map[name]",
            getAttrs(node) {
                let attrs: { [key: string]: any } | undefined;
                if (node instanceof HTMLMapElement) {
                    attrs = { name: node.name };
                }
                return getCommonAttrs(node, attrs);
            }
        }],
        toDOM(node) {
            const { name } = node.attrs;
            return nodeToDomWithAttrs(node, "map", { name });
        }
    },
    meta: {
        attrs: plusCommonAttributes({
            charset: { default: null },
            content: { default: null },
            httpEquiv: { default: null },
            name: { default: null },
        }),
        parseDOM: [{
            tag: "meta",
            getAttrs(node) {
                let attrs: { [key: string]: any } | undefined;
                if (node instanceof HTMLMetaElement) {
                    attrs = {
                        charset: node.getAttribute('charset'),
                        content: node.content,
                        httpEquiv: node.httpEquiv,
                        name: node.name,
                    };
                }
                return getCommonAttrs(node, attrs);
            }
        }],
        toDOM(node) {
            const {
                charset,
                content,
                httpEquiv,
                name,
            } = node.attrs;
            return contentlessToDomWithCommonAttrs(node, "meta", {
                charset,
                content,
                'http-equiv': httpEquiv,
                name,
            });
        }
    },
    meter: {
        attrs: plusCommonAttributes({
            high: { default: null },
            low: { default: null },
            min: { default: null },
            max: { default: null },
            optimum: { default: null },
            value: { default: null },
        }),
        content: "(phrasing | image)*",
        defining: true,
        inline: true,
        group: "phrasing",
        parseDOM: [{
            tag: "meter",
            getAttrs(node) {
                let attrs: { [key: string]: any } | undefined;
                if (node instanceof HTMLMeterElement) {
                    attrs = {
                        high: node.high,
                        low: node.low,
                        min: node.min,
                        max: node.max,
                        optimum: node.optimum,
                        value: node.value,
                    };
                }
                return getCommonAttrs(node, attrs);
            }
        }],
        toDOM(node) {
            const { high, low, min, max, optimum, value } = node.attrs;
            return contentlessToDomWithCommonAttrs(node, "meter", { high, low, min, max, optimum, value });
        }
    },
    nav: {
        attrs: commonAttrs,
        content: "(flow | address | headerfooter | heading | sectioning)+",
        defining: true,
        group: "sectioning",
        parseDOM: [{ tag: "nav", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "nav") }
    },
    noscript: {
        attrs: commonAttrs,
        content: "(flow | address | headerfooter | heading | main | sectioning | link | meta | style)+",
        group: "flow",
        parseDOM: [{ tag: "noscript", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "noscript") }
    },
    object: {
        attrs: plusCommonAttributes({
            data: { default: null },
            form: { default: null },
            height: { default: null },
            name: { default: null },
            type: { default: null },
            usemap: { default: null },
            width: { default: null },
        }),
        group: "flow",
        parseDOM: [{
            tag: "object",
            getAttrs(node) {
                let attrs: { [key: string]: any } | undefined;
                if (node instanceof HTMLObjectElement) {
                    attrs = {
                        data: node.data,
                        form: node.form,
                        height: node.height,
                        name: node.name,
                        type: node.type,
                        usemap: node.useMap,
                        width: node.width,
                    };
                }
                return getCommonAttrs(node, attrs);
            }
        }],
        toDOM(node) {
            const {
                data,
                form,
                height,
                name,
                type,
                usemap,
                width,
            } = node.attrs;
            return contentlessToDomWithCommonAttrs(node, "object", {
                data,
                form,
                height,
                name,
                type,
                usemap,
                width,
            });
        }
    },
    output: {
        attrs: plusCommonAttributes({ for: { default: null } }),
        content: "(phrasing | image)*",
        defining: true,
        inline: true,
        group: "phrasing",
        parseDOM: [{
            tag: "output",
            getAttrs(node) {
                let attrs: { [key: string]: any } | undefined;
                if (node instanceof HTMLLabelElement) {
                    attrs = { htmlFor: node.htmlFor };
                }
                return getCommonAttrs(node, attrs);
            }
        }],
        toDOM(node) {
            const { htmlFor } = node.attrs;
            return contentlessToDomWithCommonAttrs(node, "output", { for: htmlFor });
        }
    },
    picture: {
        attrs: commonAttrs,
        content: "(source)* image?",
        draggable: true,
        defining: true,
        inline: true,
        group: "phrasing",
        parseDOM: [{ tag: "picture", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "picture") }
    },
    progress: {
        attrs: plusCommonAttributes({
            max: { default: null },
            value: { default: null },
        }),
        content: "(phrasing | image)*",
        defining: true,
        draggable: true,
        inline: true,
        group: "phrasing",
        parseDOM: [{
            tag: "progress",
            getAttrs(node) {
                let attrs: { [key: string]: any } | undefined;
                if (node instanceof HTMLProgressElement) {
                    attrs = {
                        max: node.max,
                        value: node.value,
                    };
                }
                return getCommonAttrs(node, attrs);
            }
        }],
        toDOM(node) {
            const { max, value } = node.attrs;
            return contentlessToDomWithCommonAttrs(node, "progress", { max, value });
        }
    },
    rp: {
        attrs: commonAttrs,
        content: "text*",
        defining: true,
        inline: true,
        parseDOM: [{ tag: "rp", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "rp") }
    },
    rt: {
        attrs: commonAttrs,
        content: "(phrasing | image)+",
        defining: true,
        inline: true,
        parseDOM: [{ tag: "rt", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "rt") }
    },
    ruby: {
        attrs: commonAttrs,
        content: "(phrasing | image | rp | rt)+",
        defining: true,
        inline: true,
        group: "phrasing",
        parseDOM: [{ tag: "ruby", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "ruby") }
    },
    script: {
        attrs: plusCommonAttributes({
            async: { default: null },
            crossorigin: { default: null },
            defer: { default: null },
            fetchpriority: { default: null },
            integrity: { default: null },
            nomodule: { default: null },
            nonce: { default: null },
            referrerpolicy: { default: null },
            src: { default: null },
            type: { default: null },
        }),
        content: "text*",
        marks: "",
        group: "flow",
        code: true,
        defining: true,
        parseDOM: [{
            tag: "script",
            preserveWhitespace: "full",
            getAttrs(node) {
                let attrs: { [key: string]: any } | undefined;
                if (node instanceof HTMLScriptElement) {
                    attrs = {
                        async: node.async,
                        crossorigin: node.crossOrigin,
                        defer: node.defer,
                        fetchpriority: node.getAttribute('fetchpriority'),
                        integrity: node.integrity,
                        nomodule: node.noModule,
                        nonce: node.nonce,
                        referrerpolicy: node.referrerPolicy,
                        src: node.src,
                        type: node.type,
                    };
                }
                return getCommonAttrs(node, attrs);
            }
        }],
        toDOM(node) {
            const {
                async,
                crossorigin,
                defer,
                fetchpriority,
                integrity,
                nomodule,
                nonce,
                referrerpolicy,
                src,
                type,
            } = node.attrs;
            return nodeToDomWithAttrs(node, "script", {
                async,
                crossorigin,
                defer,
                fetchpriority,
                integrity,
                nomodule,
                nonce,
                referrerpolicy,
                src,
                type,
            });
        }
    },
    section: {
        attrs: commonAttrs,
        content: "(flow | address | headerfooter | heading | sectioning)+",
        defining: true,
        group: "sectioning",
        parseDOM: [{ tag: "section", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "section") }
    },
    source: {
        attrs: plusCommonAttributes({
            src: {},
            srcset: { default: null },
            height: { default: null },
            media: { default: null },
            sizes: { default: null },
            type: { default: null },
            width: { default: null },
        }),
        inline: true,
        parseDOM: [{
            tag: "source[src]",
            getAttrs(node) {
                let attrs: { [key: string]: any } | undefined;
                if (node instanceof HTMLSourceElement) {
                    attrs = {
                        src: node.src,
                        srcset: node.srcset,
                        height: node.height,
                        media: node.media,
                        sizes: node.sizes,
                        type: node.type,
                        width: node.width,
                    };
                }
                return getCommonAttrs(node, attrs);
            }
        }],
        toDOM(node) {
            const { src, srcset, height, media, sizes, type, width } = node.attrs;
            return contentlessToDomWithCommonAttrs(node, "source", { src, srcset, height, media, sizes, type, width });
        }
    },
    style: {
        attrs: plusCommonAttributes({
            media: { default: null },
            nonce: { default: null },
        }),
        content: "text*",
        marks: "",
        code: true,
        defining: true,
        parseDOM: [{
            tag: "style",
            preserveWhitespace: "full",
            getAttrs(node) {
                let attrs: { [key: string]: any } | undefined;
                if (node instanceof HTMLStyleElement) {
                    attrs = {
                        media: node.media,
                        nonce: node.nonce,
                    };
                }
                return getCommonAttrs(node, attrs);
            }
        }],
        toDOM(node) {
            const { media, nonce } = node.attrs;
            return nodeToDomWithAttrs(node, "style", { media, nonce });
        }
    },
    summary: {
        attrs: commonAttrs,
        content: "(phrasing | image)+",
        defining: true,
        inline: true,
        parseDOM: [{ tag: "summary", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "summary") }
    },
    svg: {
        attrs: plusCommonAttributes({
            height: { default: null },
            preserveAspectRatio: { default: null },
            viewBox: { default: null },
            width: { default: null },
        }),
        draggable: true,
        inline: true,
        parseDOM: [{
            tag: "svg",
            getAttrs(node) {
                let attrs: { [key: string]: any } | undefined;
                if (node instanceof HTMLElement) {
                    attrs = {
                        height: node.getAttribute("height"),
                        preserveAspectRatio: node.getAttribute("preserveAspectRatio"),
                        viewBox: node.getAttribute("viewBox"),
                        width: node.getAttribute("width"),
                    };
                }
                return getCommonAttrs(node, attrs);
            }
        }],
        toDOM(node) {
            const { height, preserveAspectRatio, viewBox, width } = node.attrs;
            return nodeToDomWithAttrs(node, "svg", { height, preserveAspectRatio, viewBox, width });
        }
    },
    tbody: {
        content: "table_row+",
        attrs: commonAttrs,
        isolating: true,
        parseDOM: [{ tag: "tbody", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "tbody") }
    },
    tfoot: {
        content: "table_row*",
        attrs: commonAttrs,
        isolating: true,
        parseDOM: [{ tag: "tfoot", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "tfoot") }
    },
    thead: {
        content: "table_row*",
        attrs: commonAttrs,
        isolating: true,
        parseDOM: [{ tag: "thead", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "thead") }
    },
    title: {
        attrs: commonAttrs,
        content: "text*",
        defining: true,
        marks: "",
        parseDOM: [{ tag: "title", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "title") }
    },
    track: {
        attrs: plusCommonAttributes({
            src: {},
            isDefault: { default: null },
            kind: { default: null },
            label: { default: null },
            srclang: { default: null },
        }),
        inline: true,
        selectable: false,
        parseDOM: [{
            tag: "track[src]",
            getAttrs(node) {
                let attrs: { [key: string]: any } | undefined;
                if (node instanceof HTMLTrackElement) {
                    attrs = {
                        src: node.src,
                        isDefault: node.default,
                        kind: node.kind,
                        label: node.label,
                        srclang: node.srclang,
                    };
                }
                return getCommonAttrs(node, attrs);
            }
        }],
        toDOM(node) {
            const { src, isDefault, kind, label, srclang } = node.attrs;
            return nodeToDomWithAttrs(node, "track", { src, isDefault, kind, label, srclang });
        }
    },
    video: {
        attrs: plusCommonAttributes({
            controls: { default: null },
            height: { default: null },
            loop: { default: null },
            muted: { default: null },
            poster: { default: null },
            preload: { default: null },
            src: { default: null },
            width: { default: null },
        }),
        content: "(image | phrasing)*",
        defining: true,
        draggable: true,
        inline: true,
        group: "phrasing",
        parseDOM: [{
            tag: "video",
            getAttrs(node) {
                let attrs: { [key: string]: any } | undefined;
                if (node instanceof HTMLVideoElement) {
                    attrs = {
                        controls: node.controls,
                        height: node.height,
                        loop: node.loop,
                        muted: node.muted,
                        poster: node.poster,
                        preload: node.preload,
                        src: node.src,
                        width: node.width,
                    };
                }
                return getCommonAttrs(node, attrs);
            }
        }],
        toDOM(node) {
            const { controls, height, loop, muted, poster, preload, src, width } = node.attrs;
            return nodeToDomWithAttrs(node, "video", { controls, height, loop, muted, poster, preload, src, width });
        }
    },
    wbr: {
        attrs: commonAttrs,
        defining: true,
        inline: true,
        group: "phrasing",
        selectable: false,
        parseDOM: [{ tag: "wbr", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "wbr") }
    },
    other: {
        atom: true,
        attrs: { content: { default: null } },
        code: true,
        content: "text*",
        group: "flow",
        parseDOM: [{
            tag: "*",
            getAttrs(node) {
                let attrs: Attrs | null = null;
                if (node instanceof Element) {
                    attrs = { content: node.outerHTML };
                }
                return attrs;
            }
        }],
        toDOM(node) {
            const { content } = node.attrs;
            if (content) {
                const div = document.createElement('div');
                div.innerHTML = content;
                const element = div.firstChild;
                if (element instanceof Element) {
                    const tag = element.tagName.toLowerCase();
                    const attrs: { [key: string]: any } = {};
                    const attrNames = element.getAttributeNames();
                    for (let i = 0; i < attrNames.length; i++) {
                        attrs[attrNames[i]] = element.getAttribute(attrNames[i]);
                    }
                    return [tag, attrs, 0];
                }
            }
            return ["PARSE_ERROR", 0];
        }
    }
};

const markToDomWithCommonAttrs: (mark: Mark, tag: string) => DOMOutputSpec = (mark: Mark, tag: string) => {
    const {
        id,
        className,
        dir,
        itemid,
        itemprop,
        itemref,
        itemscope,
        itemtype,
        lang,
        role,
        style,
        title
    } = mark.attrs;
    const attrs: { [key: string]: any } = {};
    if (id && id.length) {
        attrs.id = id;
    }
    if (className && className.length) {
        attrs.class = className;
    }
    if (dir && dir.length) {
        attrs.dir = dir;
    }
    if (itemid && itemid.length) {
        attrs.itemid = itemid;
    }
    if (itemprop && itemprop.length) {
        attrs.itemprop = itemprop;
    }
    if (itemref && itemref.length) {
        attrs.itemref = itemref;
    }
    if (itemscope && itemscope.length) {
        attrs.itemscope = itemscope;
    }
    if (itemtype && itemtype.length) {
        attrs.itemtype = itemtype;
    }
    if (lang && lang.length) {
        attrs.lang = lang;
    }
    if (role && role.length) {
        attrs.role = role;
    }
    if (style && style.length) {
        attrs.style = style;
    }
    if (title && title.length) {
        attrs.title = title;
    }

    return [tag, attrs, 0];
};
const markToDomWithAttrs: (mark: Mark, tag: string, attrs: { [key: string]: any }) => DOMOutputSpec = (mark, tag, attrs) => {
    const {
        id,
        className,
        dir,
        itemid,
        itemprop,
        itemref,
        itemscope,
        itemtype,
        lang,
        role,
        style,
        title
    } = mark.attrs;

    const domAttrs: { [key: string]: any } = {};
    for (const attr in attrs) {
        if (attrs[attr]) {
            domAttrs[attr] = attrs[attr];
        }
    }

    if (id && id.length) {
        domAttrs.id = id;
    }
    if (className && className.length) {
        if (domAttrs.class) {
            domAttrs.class += ' ' + className;
        } else {
            domAttrs.class = className;
        }
    }
    if (dir && dir.length) {
        domAttrs.dir = dir;
    }
    if (itemid && itemid.length) {
        domAttrs.itemid = itemid;
    }
    if (itemprop && itemprop.length) {
        domAttrs.itemprop = itemprop;
    }
    if (itemref && itemref.length) {
        domAttrs.itemref = itemref;
    }
    if (itemscope && itemscope.length) {
        domAttrs.itemscope = itemscope;
    }
    if (itemtype && itemtype.length) {
        domAttrs.itemtype = itemtype;
    }
    if (lang && lang.length) {
        domAttrs.lang = lang;
    }
    if (role && role.length) {
        domAttrs.role = role;
    }
    if (style && style.length) {
        domAttrs.style = style;
    }
    if (title && title.length) {
        domAttrs.title = title;
    }

    return [tag, domAttrs, 0];
};
const commonMarks: { [name in string]: MarkSpec } = {
    anchor: {
        attrs: plusCommonAttributes({
            href: {},
            download: { default: null },
            rel: { default: null },
            target: { default: null },
        }),
        inclusive: false,
        parseDOM: [{
            tag: "a[href]",
            getAttrs(node) {
                if (node instanceof HTMLAnchorElement) {
                    return {
                        href: node.href,
                        download: node.download,
                        rel: node.rel,
                        target: node.target,
                        title: node.title,
                        id: node.id,
                        className: node.className,
                        style: node.style.cssText,
                    }
                }
                return null;
            }
        }],
        toDOM(mark) {
            const { href, download, rel, target } = mark.attrs;
            return markToDomWithAttrs(mark, "a", { href, download, rel, target });
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
        attrs: commonAttrs,
        parseDOM: [{ tag: "strong", getAttrs: getCommonAttrs }],
        toDOM(mark) { return markToDomWithCommonAttrs(mark, "strong") }
    },
    bold: {
        attrs: commonAttrs,
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
        attrs: commonAttrs,
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
    abbr: {
        attrs: {
            title: {},
            id: { default: null },
            className: { default: null },
            style: { default: null },
        },
        parseDOM: [{
            tag: "abbr[title]",
            getAttrs(node) {
                if (node instanceof HTMLElement) {
                    return {
                        title: node.title,
                        id: node.id,
                        className: node.className,
                        style: node.style.cssText,
                    }
                }
                return null;
            }
        }],
        toDOM(mark) { return markToDomWithCommonAttrs(mark, "abbr") }
    },
    bdi: {
        attrs: commonAttrs,
        parseDOM: [{ tag: "bdi", getAttrs: getCommonAttrs }],
        toDOM(mark) { return markToDomWithCommonAttrs(mark, "bdi") }
    },
    bdo: {
        attrs: {
            dir: {},
            id: { default: null },
            className: { default: null },
            style: { default: null },
        },
        parseDOM: [{
            tag: "bdo",
            getAttrs(node) {
                if (node instanceof HTMLElement) {
                    return {
                        dir: node.dir,
                        id: node.id,
                        className: node.className,
                        style: node.style.cssText,
                    }
                }
                return null;
            }
        }],
        toDOM(mark) {
            const { dir } = mark.attrs;
            return markToDomWithAttrs(mark, "bdo", { dir });
        }
    },
    cite: {
        attrs: commonAttrs,
        parseDOM: [{ tag: "cite", getAttrs: getCommonAttrs }],
        toDOM(mark) { return markToDomWithCommonAttrs(mark, "cite") }
    },
    data: {
        attrs: plusCommonAttributes({ value: {} }),
        parseDOM: [{
            tag: "data[value]",
            getAttrs(node) {
                if (node instanceof HTMLDataElement) {
                    return {
                        value: node.value,
                        id: node.id,
                        className: node.className,
                        style: node.style.cssText,
                    }
                }
                return null;
            }
        }],
        toDOM(mark) {
            const { value } = mark.attrs;
            return markToDomWithAttrs(mark, "data", { value });
        }
    },
    dfn: {
        attrs: commonAttrs,
        parseDOM: [{ tag: "dfn", getAttrs: getCommonAttrs }],
        toDOM(mark) { return markToDomWithCommonAttrs(mark, "dfn") }
    },
    kbd: {
        attrs: commonAttrs,
        parseDOM: [{ tag: "kbd", getAttrs: getCommonAttrs }],
        toDOM(mark) { return markToDomWithCommonAttrs(mark, "kbd") }
    },
    quote: {
        attrs: plusCommonAttributes({ cite: { default: null } }),
        parseDOM: [{
            tag: "q",
            getAttrs(node) {
                if (node instanceof HTMLQuoteElement) {
                    return {
                        cite: node.cite,
                        id: node.id,
                        className: node.className,
                        style: node.style.cssText,
                    }
                }
                return null;
            }
        }],
        toDOM(mark) {
            const { cite } = mark.attrs;
            return markToDomWithAttrs(mark, "q", { cite });
        }
    },
    samp: {
        attrs: commonAttrs,
        parseDOM: [{ tag: "samp", getAttrs: getCommonAttrs }],
        toDOM(mark) { return markToDomWithCommonAttrs(mark, "samp") }
    },
    time: {
        attrs: plusCommonAttributes({ datetime: {} }),
        parseDOM: [{
            tag: "time[datetime]",
            getAttrs(node) {
                if (node instanceof HTMLTimeElement) {
                    return {
                        datetime: node.dateTime,
                        id: node.id,
                        className: node.className,
                        style: node.style.cssText,
                    }
                }
                return null;
            }
        }],
        toDOM(mark) {
            const { datetime } = mark.attrs;
            return markToDomWithAttrs(mark, "time", { datetime });
        }
    },
    variable: {
        attrs: commonAttrs,
        parseDOM: [{ tag: "var", getAttrs: getCommonAttrs }],
        toDOM(mark) { return markToDomWithCommonAttrs(mark, "var") }
    },
    span: {
        attrs: commonAttrs,
        excludes: '',
        parseDOM: [{ tag: "span", getAttrs: getCommonAttrs }],
        toDOM(mark) { return markToDomWithCommonAttrs(mark, "span") }
    },
};

export const schema = new Schema({
    nodes: commonNodes,
    marks: commonMarks
});

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
    commands[CommandType.BlockQuote] = {
        command: wrapIn(schema.nodes.blockquote),
        isActive(state) {
            if (state.selection instanceof NodeSelection
                && state.selection.node) {
                return state.selection.node.type.name == schema.nodes.blockquote.name;
            }
            const { $from, to } = state.selection;
            return to <= $from.end()
                && $from.parent.type.name == schema.nodes.blockquote.name;
        }
    };
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
    commands[CommandType.ForegroundColor] = toggleInlineStyleMenuItem('color');
    commands[CommandType.BackgroundColor] = toggleInlineStyleMenuItem('background-color');
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
        isActive(state, type) { return isMarkActive(state, type) },
        markType: schema.marks.image as MarkType
    };
    commands[CommandType.InsertLink] = {
        command(state, dispatch, _, params) {
            const node = state.selection.$head.parent;
            if (node && node.type == schema.nodes.code_block) {
                return false;
            }

            const isActive = isMarkActive(state, schema.marks.anchor);
            if (isActive) {
                return toggleMark(schema.marks.anchor)(state, dispatch);
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
                return toggleMark(schema.marks.anchor, attrs)(state, dispatch);
            }
            return true;
        },
        isActive(state, type) { return isMarkActive(state, type) },
        markType: schema.marks.anchor as MarkType
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
            const node = state.selection.$head.parent;
            if (node && node.type == schema.nodes.code_block) {
                return false;
            }
            if (dispatch) {
                let rows = Math.max(2, params && params.length ? params[0] : 2);
                let columns = Math.max(1, params && params.length > 1 ? params[1] : 2);

                const headerRowNodes: ProsemirrorNode[] = [];
                const cells: ProsemirrorNode[] = [];
                for (let j = 0; j < columns; j++) {
                    cells.push(schema.nodes.table_header.create());
                }
                headerRowNodes.push(schema.nodes.table_row.create(null, cells));
                const head = schema.nodes.thead.create(null, headerRowNodes);

                const rowNodes: ProsemirrorNode[] = [];
                for (let i = 1; i < rows; i++) {
                    const cells: ProsemirrorNode[] = [];
                    for (let j = 0; j < columns; j++) {
                        cells.push(schema.nodes.table_cell.create());
                    }
                    rowNodes.push(schema.nodes.table_row.create(null, cells));
                }
                const body = schema.nodes.tbody.create(null, rowNodes);
                dispatch(state.tr.replaceSelectionWith(schema.nodes.table.create(null, [head, body])!));
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
    commands[CommandType.SetFontFamily] = toggleInlineStyleMenuItem('font-family');
    commands[CommandType.SetFontSize] = toggleInlineStyleMenuItem('font-size');
    commands[CommandType.SetLineHeight] = toggleInlineStyleMenuItem('line-height');
    commands[CommandType.AlignLeft] = alignMenuItem('left');
    commands[CommandType.AlignCenter] = alignMenuItem('center');
    commands[CommandType.AlignRight] = alignMenuItem('right');
    commands[CommandType.PageBreak] = {
        command(state, dispatch, view, params) {
            const styleAttr = 'page-break-after:';
            const style = 'page-break-after:always';

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
                    && node.attrs.style.indexOf('page-break-after:') != -1) {
                    return node.attrs.style.indexOf('page-break-after:always') != -1;
                }
            }
            return false;
        }
    };
    return commands;
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
    const above = $head.node(depth - 1), after = $head.indexAfter(depth - 1), type = defaultBlockAt(above.contentMatchAt(after));
    if (!type || !above.canReplaceWith(after, after, type)) {
        return false;
    }
    if (dispatch) {
        const pos = $head.after(depth), tr = state.tr.replaceWith(pos, pos, type.createAndFill()!);
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
    attrs?: { [key: string]: any }): CommandInfo {
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
        if (type.isTextblock && !type.hasRequiredAttrs()) {
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

function markMenuItem(type: MarkType): CommandInfo {
    return {
        command: toggleMark(type),
        isActive(state, type) { return isMarkActive(state, type) },
        markType: type,
    }
}

function plusCommonAttributes(attrs: { [key: string]: any }) {
    for (const prop in commonAttrs) {
        attrs[prop] = { default: commonAttrs[prop].default };
    }
    return attrs;
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

function toggleInlineStyleMenuItem(style: string): CommandInfo {
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
                if ($cursor) {
                    dispatch(state.tr.addStoredMark(mark));
                } else {
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
                }
            }
            return true;
        },
        isEnabled(state) {
            return toggleMark(state.schema.marks.span, { style: `${style}:placeholder` })(state);
        }
    };
}

function wrapAndExitDiv(
    nodeType: NodeType,
    attrs?: Attrs): Command {
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
        return true;

        return exitDiv(state, dispatch);
    }
}
