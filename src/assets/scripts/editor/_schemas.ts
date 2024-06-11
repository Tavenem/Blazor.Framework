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
    DOMSerializer,
    Fragment,
} from 'prosemirror-model';
import { findWrapping, RemoveMarkStep } from 'prosemirror-transform';
import { chainCommands, deleteSelection, lift, liftEmptyBlock, setBlockType, toggleMark, wrapIn } from 'prosemirror-commands';
import { redo, undo } from 'prosemirror-history';
import { liftListItem, sinkListItem, wrapInList } from 'prosemirror-schema-list';

import {
    EditorSelection,
    EditorState as CodeEditorState,
    Transaction as CodeTransaction,
    StateCommand
} from '@codemirror/state';
import {
    addCaption,
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
    popover: { default: null },
    role: { default: null },
    style: { default: null },
    title: { default: null },
    translate: { default: null },
};
const formAttrs: { [name: string]: AttributeSpec } = {
    disabled: { default: null },
    form: { default: null },
    name: { default: null },
    type: { default: null },
    value: { default: null },
};
const getCommonAttrs = (
    node: Node | string,
    attrs?: { [key: string]: any },
    filterClass?: (x: string) => boolean) => {
    if (node instanceof Element) {
        attrs = attrs || {};

        for (const a of node.attributes) {
            if (filterClass && a.name === 'class') {
                const classes = a.value.split(" ");
                attrs[a.name] = classes.filter(x => filterClass(x)).join(" ");
            } else {
                attrs[a.name] = a.value;
            }
        }
    }
    return attrs as Attrs;
};
const nodeToDomWithCommonAttrs: (node: ProsemirrorNode, tag: string, extraClass?: string, children?: (DOMOutputSpec | 0)[]) => DOMOutputSpec = (node, tag, extraClass, children) => {
    const domAttrs: { [key: string]: any } = {};
    for (const a of Object.keys(node.attrs)) {
        if (!node.attrs[a]
            && (typeof node.attrs[a] !== 'number'
                || node.attrs[a] !== 0)) {
            continue;
        }
        domAttrs[a] = node.attrs[a];
    }
    if (extraClass) {
        domAttrs.class = domAttrs.class || "";
        if (domAttrs.class.length) {
            domAttrs.class += " ";
        }
        domAttrs.class += extraClass;
    }

    if (children) {
        return [tag, domAttrs, ...children];
    } else {
        return [tag, domAttrs, 0];
    }
};
const nodeToDomWithAttrs: (node: ProsemirrorNode, tag: string, attrs: { [key: string]: any }, extraClass?: string, children?: (DOMOutputSpec | 0)[]) => DOMOutputSpec = (node, tag, attrs, extraClass, children) => {
    const domAttrs: { [key: string]: any } = {};
    for (const a of Object.keys(attrs)) {
        if (!attrs[a]
            && (typeof attrs[a] !== 'number'
                || attrs[a] !== 0)) {
            continue;
        }
        domAttrs[a] = attrs[a];
    }
    for (const a of Object.keys(node.attrs)) {
        if (!node.attrs[a]
            && (typeof node.attrs[a] !== 'number'
                || node.attrs[a] !== 0)) {
            continue;
        }
        domAttrs[a] = node.attrs[a];
    }
    if (extraClass) {
        domAttrs.class = domAttrs.class || "";
        if (domAttrs.class.length) {
            domAttrs.class += " ";
        }
        domAttrs.class += extraClass;
    }

    if (children) {
        return [tag, domAttrs, ...children];
    } else {
        return [tag, domAttrs, 0];
    }
};
const contentlessToDomWithCommonAttrs: (node: ProsemirrorNode, tag: string) => DOMOutputSpec = (node, tag) => {
    const domAttrs: { [key: string]: any } = {};
    for (const a of Object.keys(node.attrs)) {
        if (!node.attrs[a]
            && (typeof node.attrs[a] !== 'number'
                || node.attrs[a] !== 0)) {
            continue;
        }
        domAttrs[a] = node.attrs[a];
    }
    return [tag, domAttrs];
};

const blocks: string[] = [
    'P',
    'BLOCKQUOTE',
    'HR',
    'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
    'PRE',
    'OL', 'UL', 'MENU', 'DL',
    'TABLE',
    'MATH-DISPLAY',
    'DIV',
    'ADDRESS',
    'ARTICLE',
    'ASIDE',
    'BASE',
    'BODY',
    'CAPTION',
    'DETAILS',
    'FIGURE',
    'FOOTER',
    'HEAD',
    'HEADER',
    'HGROUP',
    'HTML',
    'IFRAME',
    'LINK',
    'MAIN',
    'META',
    'NAV',
    'NOSCRIPT',
    'OBJECT',
    'SCRIPT',
    'SECTION',
    'STYLE',
    'SUMMARY',
    'TITLE',
];
const isBlock: (node: HTMLElement) => boolean = (node) => {
    if (node.children.length === 0) {
        return false;
    }
    for (const child of node.children) {
        if (blocks.includes(child.tagName)) {
            return true;
        }
    }
    return false;
};

const commonNodes: { [name in string]: NodeSpec } = {
    doc: { content: "(flow | form | address_content | headerfooter | heading_content | main_text | main | sectioning)+ | html" },
    text: { group: "phrasing" },
    paragraph: {
        attrs: commonAttrs,
        content: "(phrasing | audio | button | input_content | video | progress | meter | output | label | image)*",
        group: "flow",
        parseDOM: [{ tag: "p", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "p") }
    },
    blockquote_text: {
        attrs: plusCommonAttributes({
            cite: { default: null }
        }),
        content: "(phrasing | audio | button | input_content | video | progress | meter | output | label | image)+",
        group: "flow",
        defining: true,
        parseDOM: [{
            tag: "blockquote",
            getAttrs(node) {
                if (isBlock(node)) {
                    return false;
                }
                return getCommonAttrs(node);
            }
        }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "blockquote") }
    },
    blockquote: {
        attrs: plusCommonAttributes({
            cite: { default: null }
        }),
        content: "(flow | form | address_content | headerfooter | heading_content | sectioning)+",
        group: "flow",
        defining: true,
        parseDOM: [{ tag: "blockquote", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "blockquote") }
    },
    checkbox: {
        attrs: plusCommonAttributes({
            accept: { default: null },
            alt: { default: null },
            autocapitalize: { default: null },
            autocomplete: { default: null },
            capture: { default: null },
            checked: { default: null },
            dirname: { default: null },
            disabled: { default: null },
            form: { default: null },
            formaction: { default: null },
            formenctype: { default: null },
            formmethod: { default: null },
            formnovalidate: { default: null },
            formtarget: { default: null },
            height: { default: null },
            list: { default: null },
            max: { default: null },
            maxlength: { default: null },
            min: { default: null },
            minlength: { default: null },
            multiple: { default: null },
            name: { default: null },
            pattern: { default: null },
            placeholder: { default: null },
            popovertarget: { default: null },
            popovertargetaction: { default: null },
            readonly: { default: null },
            required: { default: null },
            size: { default: null },
            src: { default: null },
            step: { default: null },
            type: { default: 'checkbox' },
            value: { default: null },
            width: { default: null },
        }),
        defining: true,
        group: "input_content",
        inline: true,
        parseDOM: [{ tag: 'input[type="checkbox"]', getAttrs: getCommonAttrs }],
        toDOM(node) { return contentlessToDomWithCommonAttrs(node, "input") }
    },
    horizontal_rule: {
        attrs: commonAttrs,
        group: "flow",
        parseDOM: [{ tag: "hr", getAttrs: getCommonAttrs }],
        toDOM(node) { return contentlessToDomWithCommonAttrs(node, "hr") }
    },
    heading: {
        attrs: plusCommonAttributes({ level: { default: 1 } }),
        content: "(phrasing | audio | button | input_content | video | progress | meter | output | label | image)*",
        group: "heading_content",
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
    file_input: {
        attrs: plusCommonAttributes({
            accept: { default: null },
            alt: { default: null },
            autocapitalize: { default: null },
            autocomplete: { default: null },
            capture: { default: null },
            checked: { default: null },
            dirname: { default: null },
            disabled: { default: null },
            form: { default: null },
            formaction: { default: null },
            formenctype: { default: null },
            formmethod: { default: null },
            formnovalidate: { default: null },
            formtarget: { default: null },
            height: { default: null },
            list: { default: null },
            max: { default: null },
            maxlength: { default: null },
            min: { default: null },
            minlength: { default: null },
            multiple: { default: null },
            name: { default: null },
            pattern: { default: null },
            placeholder: { default: null },
            popovertarget: { default: null },
            popovertargetaction: { default: null },
            readonly: { default: null },
            required: { default: null },
            size: { default: null },
            src: { default: null },
            step: { default: null },
            type: { default: 'file' },
            value: { default: null },
            width: { default: null },
        }),
        defining: true,
        group: "input_content",
        inline: true,
        parseDOM: [{ tag: 'input[type="file"]', getAttrs: getCommonAttrs }],
        toDOM(node) { return contentlessToDomWithCommonAttrs(node, "input") }
    },
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
        parseDOM: [{ tag: "img[src]", getAttrs: getCommonAttrs }],
        toDOM(node) { return contentlessToDomWithCommonAttrs(node, "img") }
    },
    image_input: {
        attrs: plusCommonAttributes({
            accept: { default: null },
            alt: { default: null },
            autocapitalize: { default: null },
            autocomplete: { default: null },
            capture: { default: null },
            checked: { default: null },
            dirname: { default: null },
            disabled: { default: null },
            form: { default: null },
            formaction: { default: null },
            formenctype: { default: null },
            formmethod: { default: null },
            formnovalidate: { default: null },
            formtarget: { default: null },
            height: { default: null },
            list: { default: null },
            max: { default: null },
            maxlength: { default: null },
            min: { default: null },
            minlength: { default: null },
            multiple: { default: null },
            name: { default: null },
            pattern: { default: null },
            placeholder: { default: null },
            popovertarget: { default: null },
            popovertargetaction: { default: null },
            readonly: { default: null },
            required: { default: null },
            size: { default: null },
            src: { default: null },
            step: { default: null },
            type: { default: 'image' },
            value: { default: null },
            width: { default: null },
        }),
        defining: true,
        group: "input_content",
        inline: true,
        parseDOM: [{ tag: 'input[type="image"]', getAttrs: getCommonAttrs }],
        toDOM(node) { return contentlessToDomWithCommonAttrs(node, "input") }
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
        attrs: plusCommonAttributes({ start: { default: null } }),
        content: "(list_item_text | list_item)+",
        group: "flow",
        parseDOM: [{ tag: "ol", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "ol") }
    },
    task_list: {
        attrs: commonAttrs,
        content: "(task_list_item_text | task_list_item | list_item_text | list_item)+",
        group: "flow",
        parseDOM: [{ tag: "ul", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "ul") }
    },
    bullet_list: {
        attrs: commonAttrs,
        content: "(list_item_text | list_item)+",
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
        content: "((term_text | term) (definition_text | definition))+",
        group: "flow",
        parseDOM: [{ tag: "dl", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "dl") }
    },
    term_text: {
        attrs: commonAttrs,
        content: "(phrasing | audio | button | input_content | video | progress | meter | output | label | image)+",
        defining: true,
        parseDOM: [{
            tag: "dt",
            getAttrs(node) {
                if (isBlock(node)) {
                    return false;
                }
                return getCommonAttrs(node);
            }
        }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "dt") }
    },
    term: {
        attrs: commonAttrs,
        content: "(flow | form | address_content)+",
        defining: true,
        parseDOM: [{ tag: "dt", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "dt") }
    },
    definition_text: {
        attrs: commonAttrs,
        content: "(phrasing | audio | button | input_content | video | progress | meter | output | label | image)+",
        defining: true,
        parseDOM: [{
            tag: "dd",
            getAttrs(node) {
                if (isBlock(node)) {
                    return false;
                }
                return getCommonAttrs(node);
            }
        }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "dd") }
    },
    definition: {
        attrs: commonAttrs,
        content: "(phrasing | audio | button | input_content | video | progress | meter | output | label | image)+",
        defining: true,
        parseDOM: [{ tag: "dd", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "dd") }
    },
    task_list_item_text: {
        attrs: commonAttrs,
        content: "checkbox (phrasing | audio | button | input_content | video | progress | meter | output | label | image)*",
        defining: true,
        parseDOM: [{
            tag: "li",
            getAttrs: node => {
                if (isBlock(node)) {
                    return false;
                }
                if (!(node instanceof HTMLLIElement)
                    || !(node.firstChild instanceof HTMLInputElement)
                    || node.firstChild.type !== 'checkbox') {
                    return false;
                }
                return getCommonAttrs(node);
            }
        }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "li", "task-list-item") }
    },
    task_list_item: {
        attrs: plusCommonAttributes({ complete: { default: false } }),
        content: "(flow | form | address_content | headerfooter | heading_content | sectioning)+",
        defining: true,
        parseDOM: [{
            tag: "li",
            getAttrs: node => {
                if (!(node instanceof HTMLLIElement)
                    || !node.firstChild) {
                    return false;
                }
                let child: ChildNode | null = node.firstChild;
                if (child && !(node.firstChild instanceof HTMLInputElement)) {
                    child = node.firstChild.firstChild;
                }
                if (!(child instanceof HTMLInputElement)
                    || child.type !== 'checkbox') {
                    return false;
                }
                return getCommonAttrs(node);
            }
        }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "li", "task-list-item", [["div", ["checkbox"]], ["div", 0]]) }
    },
    list_item_text: {
        attrs: commonAttrs,
        content: "(phrasing | audio | button | input_content | video | progress | meter | output | label | image)+",
        defining: true,
        parseDOM: [{
            tag: "li",
            getAttrs(node) {
                if (isBlock(node)) {
                    return false;
                }
                return getCommonAttrs(node);
            }
        }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "li") }
    },
    list_item: {
        attrs: commonAttrs,
        content: "(flow | form | address_content | headerfooter | heading_content | sectioning)+",
        defining: true,
        parseDOM: [{ tag: "li", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "li") }
    },
    radio: {
        attrs: plusCommonAttributes({
            accept: { default: null },
            alt: { default: null },
            autocapitalize: { default: null },
            autocomplete: { default: null },
            capture: { default: null },
            checked: { default: null },
            dirname: { default: null },
            disabled: { default: null },
            form: { default: null },
            formaction: { default: null },
            formenctype: { default: null },
            formmethod: { default: null },
            formnovalidate: { default: null },
            formtarget: { default: null },
            height: { default: null },
            list: { default: null },
            max: { default: null },
            maxlength: { default: null },
            min: { default: null },
            minlength: { default: null },
            multiple: { default: null },
            name: { default: null },
            pattern: { default: null },
            placeholder: { default: null },
            popovertarget: { default: null },
            popovertargetaction: { default: null },
            readonly: { default: null },
            required: { default: null },
            size: { default: null },
            src: { default: null },
            step: { default: null },
            type: { default: 'radio' },
            value: { default: null },
            width: { default: null },
        }),
        defining: true,
        group: "input_content",
        inline: true,
        parseDOM: [{ tag: 'input[type="radio"]', getAttrs: getCommonAttrs }],
        toDOM(node) { return contentlessToDomWithCommonAttrs(node, "input") }
    },
    reset_input: {
        attrs: plusCommonAttributes({
            accept: { default: null },
            alt: { default: null },
            autocapitalize: { default: null },
            autocomplete: { default: null },
            capture: { default: null },
            checked: { default: null },
            dirname: { default: null },
            disabled: { default: null },
            form: { default: null },
            formaction: { default: null },
            formenctype: { default: null },
            formmethod: { default: null },
            formnovalidate: { default: null },
            formtarget: { default: null },
            height: { default: null },
            list: { default: null },
            max: { default: null },
            maxlength: { default: null },
            min: { default: null },
            minlength: { default: null },
            multiple: { default: null },
            name: { default: null },
            pattern: { default: null },
            placeholder: { default: null },
            popovertarget: { default: null },
            popovertargetaction: { default: null },
            readonly: { default: null },
            required: { default: null },
            size: { default: null },
            src: { default: null },
            step: { default: null },
            type: { default: 'reset' },
            value: { default: null },
            width: { default: null },
        }),
        defining: true,
        group: "input_content",
        inline: true,
        parseDOM: [{ tag: 'input[type="reset"]', getAttrs: getCommonAttrs }],
        toDOM(node) { return contentlessToDomWithCommonAttrs(node, "input") }
    },
    submit_input: {
        attrs: plusCommonAttributes({
            accept: { default: null },
            alt: { default: null },
            autocapitalize: { default: null },
            autocomplete: { default: null },
            capture: { default: null },
            checked: { default: null },
            dirname: { default: null },
            disabled: { default: null },
            form: { default: null },
            formaction: { default: null },
            formenctype: { default: null },
            formmethod: { default: null },
            formnovalidate: { default: null },
            formtarget: { default: null },
            height: { default: null },
            list: { default: null },
            max: { default: null },
            maxlength: { default: null },
            min: { default: null },
            minlength: { default: null },
            multiple: { default: null },
            name: { default: null },
            pattern: { default: null },
            placeholder: { default: null },
            popovertarget: { default: null },
            popovertargetaction: { default: null },
            readonly: { default: null },
            required: { default: null },
            size: { default: null },
            src: { default: null },
            step: { default: null },
            type: { default: 'submit' },
            value: { default: null },
            width: { default: null },
        }),
        defining: true,
        group: "input_content",
        inline: true,
        parseDOM: [{ tag: 'input[type="submit"]', getAttrs: getCommonAttrs }],
        toDOM(node) { return contentlessToDomWithCommonAttrs(node, "input") }
    },
    table: {
        content: "(caption_text | caption)? colgroup* thead? tbody? table_row* tfoot?",
        attrs: commonAttrs,
        group: "flow",
        tableRole: "table",
        isolating: true,
        parseDOM: [{ tag: "table", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "table", undefined) }
    },
    table_row: {
        content: "(table_cell_text | table_cell | table_header_text | table_header)*",
        attrs: commonAttrs,
        tableRole: "row",
        parseDOM: [{ tag: "tr", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "tr") }
    },
    table_cell_text: {
        content: "(phrasing | audio | button | input_content | video | progress | meter | output | label | image)*",
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
                if (isBlock(node)) {
                    return false;
                }
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
    table_cell: {
        content: "(flow | form | address_content | headerfooter | heading_content | sectioning)*",
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
    table_header_text: {
        content: "(phrasing | audio | button | input_content | video | progress | meter | output | label | image)*",
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
                if (isBlock(node)) {
                    return false;
                }
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
    table_header: {
        content: "(flow | form | address_content)*",
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
    div_text: {
        attrs: commonAttrs,
        content: "(phrasing | audio | button | input_content | video | progress | meter | output | label | image)*",
        group: "flow",
        parseDOM: [{
            tag: "div",
            getAttrs(node) {
                if (isBlock(node)) {
                    return false;
                }
                return getCommonAttrs(node);
            }
        }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "div") }
    },
    div: {
        attrs: commonAttrs,
        content: "(flow | form | address_content | headerfooter | heading_content | main_text | main | sectioning)+",
        group: "flow",
        parseDOM: [{ tag: "div", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "div") }
    },
    address_text: {
        attrs: commonAttrs,
        content: "(phrasing | audio | button | input_content | video | progress | meter | output | label | image)*",
        defining: true,
        group: "address_content",
        parseDOM: [{
            tag: "address",
            getAttrs(node) {
                if (isBlock(node)) {
                    return false;
                }
                return getCommonAttrs(node);
            }
        }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "address") }
    },
    address: {
        attrs: commonAttrs,
        content: "flow+",
        defining: true,
        group: "address_content",
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
        parseDOM: [{ tag: "area[href][shape]", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "area") }
    },
    article_text: {
        attrs: commonAttrs,
        content: "(phrasing | audio | button | input_content | video | progress | meter | output | label | image)*",
        defining: true,
        group: "sectioning",
        parseDOM: [{
            tag: "article",
            getAttrs(node) {
                if (isBlock(node)) {
                    return false;
                }
                return getCommonAttrs(node);
            }
        }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "article") }
    },
    article: {
        attrs: commonAttrs,
        content: "(flow | form | address_content | headerfooter | heading_content | sectioning)+",
        defining: true,
        group: "sectioning",
        parseDOM: [{ tag: "article", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "article") }
    },
    aside_text: {
        attrs: commonAttrs,
        content: "(phrasing | audio | button | input_content | video | progress | meter | output | label | image)*",
        defining: true,
        group: "sectioning",
        parseDOM: [{
            tag: "aside",
            getAttrs(node) {
                if (isBlock(node)) {
                    return false;
                }
                return getCommonAttrs(node);
            }
        }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "aside") }
    },
    aside: {
        attrs: commonAttrs,
        content: "(flow | form | address_content | headerfooter | heading_content | sectioning)+",
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
        content: "source* track* (image | phrasing)*",
        defining: true,
        draggable: true,
        inline: true,
        parseDOM: [{ tag: "audio", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "audio") }
    },
    base: {
        attrs: plusCommonAttributes({
            href: {},
            target: { default: null },
        }),
        parseDOM: [{ tag: "base", getAttrs: getCommonAttrs }],
        toDOM(node) { return contentlessToDomWithCommonAttrs(node, "base") }
    },
    body_text: {
        attrs: commonAttrs,
        content: "(phrasing | audio | button | input_content | video | progress | meter | output | label | image)*",
        defining: true,
        parseDOM: [{
            tag: "body",
            getAttrs(node) {
                if (isBlock(node)) {
                    return false;
                }
                return getCommonAttrs(node);
            }
        }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "body") }
    },
    body: {
        attrs: commonAttrs,
        content: "(flow | form | address_content | headerfooter | heading_content | main_text | main | sectioning)+",
        defining: true,
        parseDOM: [{ tag: "body", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "body") }
    },
    button: {
        attrs: plusFormAttributes({
            autofocus: { default: null },
            formaction: { default: null },
            formenctype: { default: null },
            formmethod: { default: null },
            formnovalidate: { default: null },
            formtarget: { default: null },
            popovertarget: { default: null },
            popovertargetaction: { default: null },
        }),
        content: "(phrasing | audio | video | progress | meter | output | image)*",
        defining: true,
        inline: true,
        parseDOM: [{ tag: "button", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "button") }
    },
    canvas_text: {
        attrs: plusCommonAttributes({
            height: { default: null },
            width: { default: null },
        }),
        content: "(phrasing | audio | video | progress | meter | output | image)*",
        group: "flow",
        parseDOM: [{
            tag: "canvas",
            getAttrs(node) {
                if (isBlock(node)) {
                    return false;
                }
                return getCommonAttrs(node);
            }
        }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "canvas") }
    },
    canvas: {
        attrs: plusCommonAttributes({
            height: { default: null },
            width: { default: null },
        }),
        content: "(flow | form | address_content | headerfooter | heading_content | sectioning)+",
        group: "flow",
        parseDOM: [{ tag: "canvas", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "canvas") }
    },
    caption_text: {
        attrs: commonAttrs,
        content: "(phrasing | audio | button | input_content | video | progress | meter | output | label | image)*",
        defining: true,
        parseDOM: [{
            tag: "caption",
            getAttrs(node) {
                if (isBlock(node)) {
                    return false;
                }
                return getCommonAttrs(node);
            }
        }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "caption") }
    },
    caption: {
        attrs: commonAttrs,
        content: "(flow | form | address_content | headerfooter | heading_content | sectioning)+",
        defining: true,
        parseDOM: [{ tag: "caption", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "caption") }
    },
    col: {
        attrs: plusCommonAttributes({ span: { default: null } }),
        defining: true,
        parseDOM: [{ tag: "col", getAttrs: getCommonAttrs }],
        toDOM(node) { return contentlessToDomWithCommonAttrs(node, "col") }
    },
    colgroup: {
        attrs: plusCommonAttributes({ span: { default: null } }),
        content: "col+",
        defining: true,
        parseDOM: [{ tag: "colgroup", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "colgroup") }
    },
    datalist_text: {
        attrs: commonAttrs,
        content: "(phrasing | audio | button | input_content | video | progress | meter | output | label | image)*",
        group: "flow",
        parseDOM: [{
            tag: "datalist",
            getAttrs(node) {
                if (isBlock(node)) {
                    return false;
                }
                return getCommonAttrs(node);
            }
        }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "datalist") }
    },
    datalist: {
        attrs: commonAttrs,
        content: "option+",
        group: "flow",
        parseDOM: [{ tag: "datalist", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "datalist") }
    },
    details: {
        attrs: plusCommonAttributes({ open: { default: null } }),
        content: "summary (div | flow | form | address_content | headerfooter | heading_content | sectioning)+",
        defining: true,
        group: "flow",
        parseDOM: [{ tag: "details", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "details") }
    },
    dialog: {
        attrs: plusCommonAttributes({ open: { default: null } }),
        content: "(flow | form | address_content | headerfooter | heading_content | sectioning)+",
        group: "flow",
        parseDOM: [{ tag: "dialog", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "dialog") }
    },
    fieldset: {
        attrs: plusCommonAttributes({
            disabled: { default: null },
            form: { default: null },
            name: { default: null },
        }),
        content: "legend? (flow | form | address_content | headerfooter | heading_content | sectioning)+",
        group: "flow",
        parseDOM: [{ tag: "fieldset", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "fieldset") }
    },
    figcaption_text: {
        attrs: commonAttrs,
        content: "(phrasing | audio | button | input_content | video | progress | meter | output | label | image)*",
        defining: true,
        inline: true,
        parseDOM: [{
            tag: "figcaption",
            getAttrs(node) {
                if (isBlock(node)) {
                    return false;
                }
                return getCommonAttrs(node);
            }
        }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "figcaption") }
    },
    figcaption: {
        attrs: commonAttrs,
        content: "(flow | form | address_content | headerfooter | heading_content | sectioning)+",
        defining: true,
        inline: true,
        parseDOM: [{ tag: "figcaption", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "figcaption") }
    },
    figure: {
        attrs: commonAttrs,
        content: "(phrasing | audio | button | input_content | video | progress | meter | output | label | image)* (figcaption_text | figcaption)? (phrasing | audio | button | input_content | video | progress | meter | output | label | image)*",
        defining: true,
        group: "flow",
        parseDOM: [{ tag: "figure", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "figure") }
    },
    footer_text: {
        attrs: commonAttrs,
        content: "(phrasing | audio | button | input_content | video | progress | meter | output | label | image)*",
        defining: true,
        group: "headerfooter",
        parseDOM: [{
            tag: "footer",
            getAttrs(node) {
                if (isBlock(node)) {
                    return false;
                }
                return getCommonAttrs(node);
            }
        }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "footer") }
    },
    footer: {
        attrs: commonAttrs,
        content: "(flow | form | address_content | heading_content | sectioning)+",
        defining: true,
        group: "headerfooter",
        parseDOM: [{ tag: "footer", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "footer") }
    },
    form: {
        attrs: plusCommonAttributes({
            'accept-charset': { default: null },
            autocapitalize: { default: null },
            autocomplete: { default: null },
            name: { default: null },
            rel: { default: null },
            action: { default: null },
            enctype: { default: null },
            method: { default: null },
            novalidate: { default: null },
            target: { default: null },
        }),
        content: "(flow | address_content | headerfooter | heading_content | sectioning)+",
        parseDOM: [{ tag: "form", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "form") }
    },
    head: {
        attrs: commonAttrs,
        content: "(meta | link | style)* title (meta | link | style)*",
        defining: true,
        parseDOM: [{ tag: "head", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "head") }
    },
    header_text: {
        attrs: commonAttrs,
        content: "(phrasing | audio | button | input_content | video | progress | meter | output | label | image)*",
        defining: true,
        group: "headerfooter",
        parseDOM: [{
            tag: "header",
            getAttrs(node) {
                if (isBlock(node)) {
                    return false;
                }
                return getCommonAttrs(node);
            }
        }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "header") }
    },
    header: {
        attrs: commonAttrs,
        content: "(flow | form | address_content | heading_content | sectioning)+",
        defining: true,
        group: "headerfooter",
        parseDOM: [{ tag: "header", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "header") }
    },
    hgroup: {
        attrs: commonAttrs,
        content: "paragraph* heading paragraph*",
        group: "heading_content",
        parseDOM: [{ tag: "hgroup", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "hgroup") }
    },
    html: {
        attrs: plusCommonAttributes({ xmlns: { default: null } }),
        content: "head (body_text | body)",
        defining: true,
        parseDOM: [{ tag: "html", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "html") }
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
        parseDOM: [{ tag: "iframe", getAttrs: getCommonAttrs }],
        toDOM(node) { return contentlessToDomWithCommonAttrs(node, "iframe") }
    },
    input: {
        attrs: plusFormAttributes({
            accept: { default: null },
            alt: { default: null },
            autocapitalize: { default: null },
            autocomplete: { default: null },
            capture: { default: null },
            checked: { default: null },
            dirname: { default: null },
            formaction: { default: null },
            formenctype: { default: null },
            formmethod: { default: null },
            formnovalidate: { default: null },
            formtarget: { default: null },
            height: { default: null },
            list: { default: null },
            max: { default: null },
            maxlength: { default: null },
            min: { default: null },
            minlength: { default: null },
            multiple: { default: null },
            pattern: { default: null },
            placeholder: { default: null },
            popovertarget: { default: null },
            popovertargetaction: { default: null },
            readonly: { default: null },
            required: { default: null },
            size: { default: null },
            src: { default: null },
            step: { default: null },
            width: { default: null },
        }),
        defining: true,
        group: "input_content",
        inline: true,
        parseDOM: [{ tag: "input", getAttrs: getCommonAttrs }],
        toDOM(node) { return contentlessToDomWithCommonAttrs(node, "input") }
    },
    label: {
        attrs: plusCommonAttributes({ for: { default: null } }),
        content: "(phrasing | audio | video | image)* (button | input_content | meter | output | progress)? (phrasing | audio | video | image)*",
        defining: true,
        inline: true,
        parseDOM: [{ tag: "label", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "label") }
    },
    legend_text: {
        attrs: commonAttrs,
        content: "(phrasing | audio | button | input_content | video | progress | meter | output | label | image)*",
        parseDOM: [{
            tag: "legend",
            getAttrs(node) {
                if (isBlock(node)) {
                    return false;
                }
                return getCommonAttrs(node);
            }
        }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "legend") }
    },
    legend: {
        attrs: commonAttrs,
        content: "heading_content+",
        parseDOM: [{ tag: "legend", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "legend") }
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
        parseDOM: [{ tag: "link", getAttrs: getCommonAttrs }],
        toDOM(node) { return contentlessToDomWithCommonAttrs(node, "link") }
    },
    main_text: {
        attrs: commonAttrs,
        content: "(phrasing | audio | button | input_content | video | progress | meter | output | label | image)*",
        defining: true,
        parseDOM: [{
            tag: "main",
            getAttrs(node) {
                if (isBlock(node)) {
                    return false;
                }
                return getCommonAttrs(node);
            }
        }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "main") }
    },
    main: {
        attrs: commonAttrs,
        content: "(flow | form | address_content | headerfooter | heading_content | sectioning)+",
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
        parseDOM: [{ tag: "map[name]", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "map") }
    },
    meta: {
        attrs: plusCommonAttributes({
            charset: { default: null },
            content: { default: null },
            httpEquiv: { default: null },
            name: { default: null },
        }),
        parseDOM: [{ tag: "meta", getAttrs: getCommonAttrs }],
        toDOM(node) {  return contentlessToDomWithCommonAttrs(node, "meta") }
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
        content: "(phrasing | audio | button | input_content | video | progress | label | image)*",
        defining: true,
        inline: true,
        parseDOM: [{ tag: "meter", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "meter") }
    },
    nav_text: {
        attrs: commonAttrs,
        content: "(phrasing | audio | button | input_content | video | progress | meter | output | label | image)*",
        defining: true,
        group: "sectioning",
        parseDOM: [{
            tag: "nav",
            getAttrs(node) {
                if (isBlock(node)) {
                    return false;
                }
                return getCommonAttrs(node);
            }
        }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "nav") }
    },
    nav: {
        attrs: commonAttrs,
        content: "(flow | form | address_content | headerfooter | heading_content | sectioning)+",
        defining: true,
        group: "sectioning",
        parseDOM: [{ tag: "nav", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "nav") }
    },
    noscript_text: {
        attrs: commonAttrs,
        content: "(phrasing | audio | button | input_content | video | progress | meter | output | label | image)*",
        group: "flow",
        parseDOM: [{
            tag: "noscript",
            getAttrs(node) {
                if (isBlock(node)) {
                    return false;
                }
                return getCommonAttrs(node);
            }
        }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "noscript") }
    },
    noscript: {
        attrs: commonAttrs,
        content: "(flow | form | address_content | headerfooter | heading_content | sectioning | link | meta | style)+",
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
        parseDOM: [{ tag: "object", getAttrs: getCommonAttrs }],
        toDOM(node) { return contentlessToDomWithCommonAttrs(node, "object") }
    },
    optgroup: {
        attrs: plusCommonAttributes({
            disabled: { default: null },
            label: { default: null },
        }),
        content: "option+",
        parseDOM: [{ tag: "optgroup", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "optgroup") }
    },
    option: {
        attrs: plusCommonAttributes({
            disabled: { default: null },
            label: { default: null },
            selected: { default: null },
            value: { default: null },
        }),
        content: "text*",
        defining: true,
        marks: "",
        parseDOM: [{ tag: "option", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "option") }
    },
    output: {
        attrs: plusCommonAttributes({ for: { default: null } }),
        content: "(phrasing | audio | button | input_content | video | progress | meter | output | label | image)*",
        defining: true,
        inline: true,
        parseDOM: [{ tag: "output", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "output") }
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
        content: "(phrasing | audio | button | input_content | video | meter | label | image)*",
        defining: true,
        draggable: true,
        inline: true,
        parseDOM: [{ tag: "progress", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "progress") }
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
        content: "(phrasing | audio | button | input_content | video | progress | meter | output | label | image)+",
        defining: true,
        inline: true,
        parseDOM: [{ tag: "rt", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "rt") }
    },
    ruby: {
        attrs: commonAttrs,
        content: "(phrasing | audio | button | input_content | video | progress | meter | output | label | image | rp | rt)+",
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
            getAttrs: getCommonAttrs
        }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "script") }
    },
    search: {
        attrs: commonAttrs,
        content: "(flow | form | address_content | headerfooter | heading_content | sectioning)+",
        group: "flow",
        parseDOM: [{ tag: "search", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "search") }
    },
    section_text: {
        attrs: commonAttrs,
        content: "(phrasing | audio | button | input_content | video | progress | meter | output | label | image)*",
        defining: true,
        group: "sectioning",
        parseDOM: [{
            tag: "section",
            getAttrs(node) {
                if (isBlock(node)) {
                    return false;
                }
                return getCommonAttrs(node);
            }
        }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "section") }
    },
    section: {
        attrs: commonAttrs,
        content: "(flow | form | address_content | headerfooter | heading_content | sectioning)+",
        defining: true,
        group: "sectioning",
        parseDOM: [{ tag: "section", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "section") }
    },
    select: {
        attrs: plusFormAttributes({
            autocomplete: { default: null },
            autofocus: { default: null },
            multiple: { default: null },
            required: { default: null },
            size: { default: null },
        }),
        content: "(option | optgroup | horizontal_rule)+",
        defining: true,
        group: "input_content",
        inline: true,
        parseDOM: [{ tag: "select", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "select") }
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
        parseDOM: [{ tag: "source[src]", getAttrs: getCommonAttrs }],
        toDOM(node) { return contentlessToDomWithCommonAttrs(node, "source") }
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
            getAttrs: getCommonAttrs
        }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "style") }
    },
    summary_text: {
        attrs: commonAttrs,
        content: "(phrasing | audio | button | input_content | video | progress | meter | output | label | image)*",
        defining: true,
        parseDOM: [{
            tag: "summary",
            getAttrs(node) {
                if (isBlock(node)) {
                    return false;
                }
                return getCommonAttrs(node);
            }
        }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "summary") }
    },
    summary: {
        attrs: commonAttrs,
        content: "heading_content",
        defining: true,
        parseDOM: [{ tag: "summary", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "summary") }
    },
    svg: {
        attrs: plusCommonAttributes({
            height: { default: null },
            markup: { default: null },
            preserveAspectRatio: { default: null },
            preserveSpace: { default: null },
            viewBox: { default: null },
            width: { default: null },
        }),
        draggable: true,
        inline: true,
        parseDOM: [{
            tag: "svg",
            getAttrs(node) {
                let attrs: { [key: string]: any } | undefined;
                if (node instanceof SVGElement) {
                    attrs = {
                        height: node.getAttribute("height"),
                        markup: node.innerHTML,
                        preserveAspectRatio: node.getAttribute("preserveAspectRatio"),
                        preserveSpace: node.getAttributeNS('http://www.w3.org/XML/1998/namespace', 'xml:space'),
                        viewBox: node.getAttribute("viewBox"),
                        width: node.getAttribute("width"),
                    };
                }
                return getCommonAttrs(node, attrs);
            }
        }],
        toDOM(node) {
            const svg = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
            for (const a of Object.keys(node.attrs)) {
                if (!node.attrs[a].length) {
                    continue;
                }
                if (a === 'className') {
                    svg.classList.add(node.attrs[a]);
                } else if (a === 'preserveSpace') {
                    svg.setAttributeNS("http://www.w3.org/XML/1998/namespace", 'xml:space', node.attrs[a]);
                } else {
                    svg.setAttribute(a, node.attrs[a]);
                }
            }
            return svg;
        }
    },
    tbody: {
        content: "table_row+",
        attrs: commonAttrs,
        isolating: true,
        parseDOM: [{ tag: "tbody", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "tbody") }
    },
    textarea: {
        attrs: plusFormAttributes({
            autocapitalize: { default: null },
            autocomplete: { default: null },
            autocorrect: { default: null },
            autofocus: { default: null },
            cols: { default: null },
            dirname: { default: null },
            maxlength: { default: null },
            minlength: { default: null },
            placeholder: { default: null },
            readonly: { default: null },
            required: { default: null },
            rows: { default: null },
            spellcheck: { default: null },
            wrap: { default: null },
        }),
        content: "text*",
        defining: true,
        group: "input_content",
        inline: true,
        marks: "",
        parseDOM: [{ tag: "textarea", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "textarea") }
    },
    tfoot: {
        content: "table_row+",
        attrs: commonAttrs,
        isolating: true,
        parseDOM: [{ tag: "tfoot", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "tfoot") }
    },
    thead: {
        content: "table_row+",
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
            default: { default: null },
            kind: { default: null },
            label: { default: null },
            srclang: { default: null },
        }),
        inline: true,
        selectable: false,
        parseDOM: [{ tag: "track[src]", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "track") }
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
        content: "source* track* (image | phrasing)*",
        defining: true,
        draggable: true,
        inline: true,
        parseDOM: [{ tag: "video", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "video") }
    },
    wbr: {
        attrs: commonAttrs,
        defining: true,
        inline: true,
        group: "phrasing",
        selectable: false,
        parseDOM: [{ tag: "wbr", getAttrs: getCommonAttrs }],
        toDOM(node) { return contentlessToDomWithCommonAttrs(node, "wbr") }
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
    const domAttrs: { [key: string]: any } = {};
    for (const a of Object.keys(mark.attrs)) {
        if (!mark.attrs[a] || !mark.attrs[a].length) {
            continue;
        }
        domAttrs[a] = mark.attrs[a];
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
        parseDOM: [{ tag: "a[href]", getAttrs: getCommonAttrs }],
        toDOM(mark) { return markToDomWithCommonAttrs(mark, "a"); }
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
                            const attrs: { [key: string]: any } = {};

                            for (const a of node.attributes) {
                                attrs[a.name] = a.value;
                            }
                            return attrs as Attrs;
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
            { tag: "u", getAttrs: getCommonAttrs },
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
    del: {
        attrs: commonAttrs,
        parseDOM: [{ tag: "del", getAttrs: getCommonAttrs }],
        toDOM(mark) { return markToDomWithCommonAttrs(mark, "del") }
    },
    strikethrough: {
        attrs: commonAttrs,
        parseDOM: [
            { tag: "s", getAttrs: getCommonAttrs },
            { tag: "strike", getAttrs: getCommonAttrs },
            { style: "text-decoration-line=line-through" },
        ],
        toDOM(mark) { return markToDomWithCommonAttrs(mark, "s") }
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
        parseDOM: [{ tag: "abbr[title]", getAttrs: getCommonAttrs }],
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
        parseDOM: [{ tag: "bdo", getAttrs: getCommonAttrs }],
        toDOM(mark) { return markToDomWithCommonAttrs(mark, "bdo"); }
    },
    cite: {
        attrs: commonAttrs,
        parseDOM: [{ tag: "cite", getAttrs: getCommonAttrs }],
        toDOM(mark) { return markToDomWithCommonAttrs(mark, "cite") }
    },
    data: {
        attrs: plusCommonAttributes({ value: {} }),
        parseDOM: [{ tag: "data[value]", getAttrs: getCommonAttrs }],
        toDOM(mark) { return markToDomWithCommonAttrs(mark, "data"); }
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
        parseDOM: [{ tag: "q", getAttrs: getCommonAttrs }],
        toDOM(mark) { return markToDomWithCommonAttrs(mark, "q"); }
    },
    samp: {
        attrs: commonAttrs,
        parseDOM: [{ tag: "samp", getAttrs: getCommonAttrs }],
        toDOM(mark) { return markToDomWithCommonAttrs(mark, "samp") }
    },
    time: {
        attrs: plusCommonAttributes({ datetime: {} }),
        parseDOM: [{ tag: "time[datetime]", getAttrs: getCommonAttrs }],
        toDOM(mark) { return markToDomWithCommonAttrs(mark, "time"); }
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

class Renderer {
    private _serializer: DOMSerializer;

    constructor() {
        const baseSerializer = DOMSerializer.fromSchema(schema);
        const nodes = { ...baseSerializer.nodes };
        for (const name of Object.keys(schema.nodes)) {
            if (schema.nodes[name].isTextblock) {
                const original = nodes[name];
                nodes[name] = (node) => {
                    const dom = original(node);
                    if (node.content.size === 0 && Array.isArray(dom)) {
                        const holeIndex = dom.findIndex(x => x === 0);
                        if (holeIndex !== -1) {
                            dom[holeIndex] = ['br', {}];
                        }
                    }
                    return dom;
                }
            }
        }
        this._serializer = new DOMSerializer({ ...nodes }, baseSerializer.marks);
    }

    serializeFragment(fragment: Fragment) {
        return this._serializer.serializeFragment(fragment);
    }

    serializeNode(node: ProsemirrorNode) {
        return this._serializer.serializeNode(node);
    }
}
export const renderer = new Renderer();

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
    commands[CommandType.Address] = wrapInMenuItem(schema.nodes.address);
    commands[CommandType.Article] = wrapInMenuItem(schema.nodes.article);
    commands[CommandType.Aside] = wrapInMenuItem(schema.nodes.aside);
    commands[CommandType.BlockQuote] = wrapInMenuItem(schema.nodes.blockquote);
    commands[CommandType.CodeBlock] = blockTypeMenuItem(schema.nodes.code_block);
    commands[CommandType.CodeInline] = markMenuItem(schema.marks.code);
    commands[CommandType.Strong] = markMenuItem(schema.marks.strong);
    commands[CommandType.Bold] = markMenuItem(schema.marks.bold);
    commands[CommandType.Cite] = markMenuItem(schema.marks.cite);
    commands[CommandType.Definition] = markMenuItem(schema.marks.dfn);
    commands[CommandType.Emphasis] = markMenuItem(schema.marks.em);
    commands[CommandType.FieldSet] = wrapInMenuItem(schema.nodes.fieldset);
    commands[CommandType.Figure] = wrapInMenuItem(schema.nodes.figure);
    commands[CommandType.FigureCaption] = blockTypeMenuItem(schema.nodes.figure_caption);
    commands[CommandType.Footer] = wrapInMenuItem(schema.nodes.footer);
    commands[CommandType.Header] = wrapInMenuItem(schema.nodes.header);
    commands[CommandType.HeadingGroup] = wrapInMenuItem(schema.nodes.hgroup);
    commands[CommandType.Italic] = markMenuItem(schema.marks.italic);
    commands[CommandType.Keyboard] = markMenuItem(schema.marks.kbd);
    commands[CommandType.Underline] = markMenuItem(schema.marks.underline);
    commands[CommandType.Deleted] = markMenuItem(schema.marks.del);
    commands[CommandType.Details] = wrapInMenuItem(schema.nodes.details);
    commands[CommandType.Strikethrough] = markMenuItem(schema.marks.strikethrough);
    commands[CommandType.Small] = markMenuItem(schema.marks.small);
    commands[CommandType.Subscript] = markMenuItem(schema.marks.sub);
    commands[CommandType.Superscript] = markMenuItem(schema.marks.sup);
    commands[CommandType.Inserted] = markMenuItem(schema.marks.ins);
    commands[CommandType.Marked] = markMenuItem(schema.marks.mark);
    commands[CommandType.Quote] = markMenuItem(schema.marks.quote);
    commands[CommandType.Sample] = markMenuItem(schema.marks.samp);
    commands[CommandType.Section] = wrapInMenuItem(schema.nodes.section);
    commands[CommandType.Variable] = markMenuItem(schema.marks.variable);
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
                    attrs.title = params[1];
                }
                if (params.length > 2 && params[2]) {
                    attrs.alt = params[2];
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
    commands[CommandType.SetFontFamily] = toggleInlineStyleMenuItem('font-family');
    commands[CommandType.SetFontSize] = toggleInlineStyleMenuItem('font-size');
    commands[CommandType.SetLineHeight] = toggleInlineStyleMenuItem('line-height');
    commands[CommandType.AlignLeft] = alignMenuItem('left');
    commands[CommandType.AlignCenter] = alignMenuItem('center');
    commands[CommandType.AlignRight] = alignMenuItem('right');
    commands[CommandType.PageBreak] = {
        command(state, dispatch, _view, _params) {
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

function plusCommonAttributes(attrs: { [key: string]: any }) {
    for (const prop in commonAttrs) {
        attrs[prop] = { default: commonAttrs[prop].default };
    }
    return attrs;
}

function plusFormAttributes(attrs: { [key: string]: any }) {
    for (const prop in commonAttrs) {
        attrs[prop] = { default: commonAttrs[prop].default };
    }
    for (const prop in formAttrs) {
        attrs[prop] = { default: formAttrs[prop].default };
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

        return exitDiv(state, dispatch);
    }
}

function wrapInMenuItem(
    nodeType: NodeType,
    attrs?: { [key: string]: any }): CommandInfo {
    return {
        command: wrapIn(nodeType),
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
