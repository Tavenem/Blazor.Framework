import {
    AttributeSpec,
    Attrs,
    DOMOutputSpec,
    NodeSpec,
    Node as ProsemirrorNode,
} from "prosemirror-model";
import { TavenemCheckboxHtmlElement } from '../../_checkbox';

export const commonAttrs: { [name: string]: AttributeSpec } = {
    id: { default: null },
    autofocus: { default: null },
    'class': { default: null },
    dir: { default: null },
    draggable: { default: null },
    hidden: { default: null },
    inert: { default: null },
    itemid: { default: null },
    itemprop: { default: null },
    itemref: { default: null },
    itemscope: { default: null },
    itemtype: { default: null },
    lang: { default: null },
    popover: { default: null },
    role: { default: null },
    slot: { default: null },
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
export const getCommonAttrs = (
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
const nodeToDomWithCommonAttrs: (
    node: ProsemirrorNode,
    tag: string,
    extraClass?: string,
    children?: (DOMOutputSpec | 0)[]) => DOMOutputSpec = (node, tag, extraClass, children) => {
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
const nodeToDomWithHeadingAttrs: (node: ProsemirrorNode, tag: string) => DOMOutputSpec = (node, tag) => {
    const domAttrs: { [key: string]: any } = {};
    for (const a of Object.keys(node.attrs)) {
        if (a === 'level'
            || (!node.attrs[a]
                && (typeof node.attrs[a] !== 'number'
                    || node.attrs[a] !== 0))) {
            continue;
        }
        domAttrs[a] = node.attrs[a];
    }

    return [tag, domAttrs, 0];
};
const nodeToDomWithAttrs: (
    node: ProsemirrorNode,
    tag: string,
    attrs: { [key: string]: any },
    extraClass?: string,
    children?: (DOMOutputSpec | 0)[]) => DOMOutputSpec = (node, tag, attrs, extraClass, children) => {
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

export const commonNodes: { [name in string]: NodeSpec } = {
    doc: { content: "(flow | form | address_content | headerfooter | heading_content | main_text | main | sectioning)+ | html", whitespace: "pre" },
    text: { group: "phrasing" },
    phrasing_wrapper: {
        content: "(text | phrasing | audio | button | input_content | video | progress | meter | output | label | image)*",
        group: "flow",
        toDOM() { return ['phrasing-wrapper', 0]; },
    },
    paragraph: {
        attrs: commonAttrs,
        content: "(phrasing | audio | button | input_content | video | progress | meter | output | label | image)*",
        group: "flow",
        //whitespace: "pre",
        parseDOM: [{ tag: "p", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "p"); }
    },
    blockquote_text: {
        alternate: 'blockquote',
        attrs: plusCommonAttributes({
            cite: { default: null }
        }),
        content: "(phrasing | audio | button | input_content | video | progress | meter | output | label | image)*",
        group: "flow",
        defining: true,
        //whitespace: "pre",
        parseDOM: [{
            tag: "blockquote",
            getAttrs(node) {
                if (isBlock(node)) {
                    return false;
                }
                return getCommonAttrs(node);
            }
        }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "blockquote"); },
    },
    blockquote: {
        alternate: 'blockquote_text',
        attrs: plusCommonAttributes({
            cite: { default: null }
        }),
        content: "(flow | form | address_content | headerfooter | heading_content | sectioning)+",
        group: "flow",
        defining: true,
        //whitespace: "pre",
        parseDOM: [{ tag: "blockquote", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "blockquote"); }
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
        toDOM(node) { return contentlessToDomWithCommonAttrs(node, "input"); }
    },
    horizontal_rule: {
        attrs: commonAttrs,
        group: "flow",
        parseDOM: [{ tag: "hr", getAttrs: getCommonAttrs }],
        toDOM(node) { return contentlessToDomWithCommonAttrs(node, "hr"); }
    },
    heading: {
        attrs: plusCommonAttributes({ level: { default: 1 } }),
        content: "(phrasing | audio | button | input_content | video | progress | meter | output | label | image)*",
        group: "heading_content",
        defining: true,
        //whitespace: "pre",
        parseDOM: [
            { tag: "h1", getAttrs(p) { return getCommonAttrs(p, { level: 1 }) } },
            { tag: "h2", getAttrs(p) { return getCommonAttrs(p, { level: 2 }) } },
            { tag: "h3", getAttrs(p) { return getCommonAttrs(p, { level: 3 }) } },
            { tag: "h4", getAttrs(p) { return getCommonAttrs(p, { level: 4 }) } },
            { tag: "h5", getAttrs(p) { return getCommonAttrs(p, { level: 5 }) } },
            { tag: "h6", getAttrs(p) { return getCommonAttrs(p, { level: 6 }) } }
        ],
        toDOM(node) { return nodeToDomWithHeadingAttrs(node, "h" + node.attrs.level) }
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
        group: "phrasing",
        inline: true,
        linebreakReplacement: true,
        selectable: false,
        parseDOM: [{ tag: "br", getAttrs: getCommonAttrs }],
        toDOM(node) { return contentlessToDomWithCommonAttrs(node, "br") }
    },
    ordered_list: {
        attrs: plusCommonAttributes({ start: { default: null } }),
        content: "(list_item_text | list_item)+",
        group: "flow",
        //whitespace: "pre",
        parseDOM: [{ tag: "ol", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "ol") }
    },
    task_list: {
        attrs: commonAttrs,
        content: "(task_list_item | list_item_text | list_item)+",
        group: "flow",
        //whitespace: "pre",
        parseDOM: [{ tag: "ul", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "ul") }
    },
    bullet_list: {
        attrs: commonAttrs,
        content: "(list_item_text | list_item)+",
        group: "flow",
        //whitespace: "pre",
        parseDOM: [{ tag: "ul", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "ul") }
    },
    menu: {
        attrs: commonAttrs,
        content: "list_item+",
        group: "flow",
        //whitespace: "pre",
        parseDOM: [{ tag: "menu", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "menu") }
    },
    definition_list: {
        attrs: commonAttrs,
        content: "((term_text | term) (definition_text | definition))+",
        group: "flow",
        //whitespace: "pre",
        parseDOM: [{ tag: "dl", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "dl") }
    },
    term_text: {
        alternate: 'term',
        attrs: commonAttrs,
        content: "(phrasing | audio | button | input_content | video | progress | meter | output | label | image)*",
        defining: true,
        //whitespace: "pre",
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
        alternate: 'term_text',
        attrs: commonAttrs,
        content: "(flow | form | address_content)+",
        defining: true,
        //whitespace: "pre",
        parseDOM: [{ tag: "dt", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "dt") }
    },
    definition_text: {
        alternate: 'definition',
        attrs: commonAttrs,
        content: "(phrasing | audio | button | input_content | video | progress | meter | output | label | image)*",
        defining: true,
        //whitespace: "pre",
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
        alternate: 'definition_text',
        attrs: commonAttrs,
        content: "(flow | form | address_content | headerfooter | heading_content | sectioning)+",
        defining: true,
        //whitespace: "pre",
        parseDOM: [{ tag: "dd", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "dd") }
    },
    task_list_item: {
        alternate: 'list_item',
        attrs: commonAttrs,
        content: "(checkbox | tfcheckbox) (phrasing | audio | button | input_content | video | progress | meter | output | label | image)*",
        defining: true,
        //whitespace: "pre",
        parseDOM: [{
            tag: "li",
            getAttrs: node => {
                if (isBlock(node)) {
                    return false;
                }
                if (!(node instanceof HTMLLIElement)
                    || ((!(node.firstChild instanceof HTMLInputElement)
                        || node.firstChild.type !== 'checkbox')
                        && !(node.firstChild instanceof TavenemCheckboxHtmlElement))) {
                    return false;
                }
                return getCommonAttrs(node);
            }
        }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "li", "task-list-item") }
    },
    list_item_text: {
        alternate: 'list_item',
        attrs: commonAttrs,
        content: "(phrasing | audio | button | input_content | video | progress | meter | output | label | image)*",
        defining: true,
        //whitespace: "pre",
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
        alternate: 'list_item_text',
        attrs: commonAttrs,
        content: "(flow | form | address_content | headerfooter | heading_content | sectioning)+",
        defining: true,
        //whitespace: "pre",
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
        alternate: 'table_cell',
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
        alternate: 'table_cell_text',
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
        alternate: 'table_header',
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
        alternate: 'table_header_text',
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
        group: "phrasing math",
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
        group: "flow math",
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
        alternate: 'div',
        attrs: commonAttrs,
        content: "(phrasing | audio | button | input_content | video | progress | meter | output | label | image)*",
        group: "flow",
        //whitespace: "pre",
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
        alternate: 'div_text',
        attrs: commonAttrs,
        content: "(flow | form | address_content | headerfooter | heading_content | main_text | main | sectioning)+",
        group: "flow",
        //whitespace: "pre",
        parseDOM: [{ tag: "div", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "div") }
    },
    address_text: {
        alternate: 'address',
        attrs: commonAttrs,
        content: "(phrasing | audio | button | input_content | video | progress | meter | output | label | image)*",
        defining: true,
        group: "address_content",
        //whitespace: "pre",
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
        alternate: 'address_text',
        attrs: commonAttrs,
        content: "flow+",
        defining: true,
        group: "address_content",
        //whitespace: "pre",
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
        alternate: 'article',
        attrs: commonAttrs,
        content: "(phrasing | audio | button | input_content | video | progress | meter | output | label | image)*",
        defining: true,
        group: "sectioning",
        //whitespace: "pre",
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
        alternate: 'article_text',
        attrs: commonAttrs,
        content: "(flow | form | address_content | headerfooter | heading_content | sectioning)+",
        defining: true,
        group: "sectioning",
        //whitespace: "pre",
        parseDOM: [{ tag: "article", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "article") }
    },
    aside_text: {
        alternate: 'aside',
        attrs: commonAttrs,
        content: "(phrasing | audio | button | input_content | video | progress | meter | output | label | image)*",
        defining: true,
        group: "sectioning",
        //whitespace: "pre",
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
        alternate: 'aside_text',
        attrs: commonAttrs,
        content: "(flow | form | address_content | headerfooter | heading_content | sectioning)+",
        defining: true,
        group: "sectioning",
        //whitespace: "pre",
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
        alternate: 'body',
        attrs: commonAttrs,
        content: "(phrasing | audio | button | input_content | video | progress | meter | output | label | image)*",
        defining: true,
        //whitespace: "pre",
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
        alternate: 'body_text',
        attrs: commonAttrs,
        content: "(flow | form | address_content | headerfooter | heading_content | main_text | main | sectioning)+",
        defining: true,
        //whitespace: "pre",
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
        alternate: 'canvas',
        attrs: plusCommonAttributes({
            height: { default: null },
            width: { default: null },
        }),
        content: "(phrasing | audio | video | progress | meter | output | image)*",
        group: "flow",
        //whitespace: "pre",
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
        alternate: 'canvas_text',
        attrs: plusCommonAttributes({
            height: { default: null },
            width: { default: null },
        }),
        content: "(flow | form | address_content | headerfooter | heading_content | sectioning)+",
        group: "flow",
        //whitespace: "pre",
        parseDOM: [{ tag: "canvas", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "canvas") }
    },
    caption_text: {
        alternate: 'caption',
        attrs: commonAttrs,
        content: "(phrasing | audio | button | input_content | video | progress | meter | output | label | image)*",
        defining: true,
        //whitespace: "pre",
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
        alternate: 'caption_text',
        attrs: commonAttrs,
        content: "(flow | form | address_content | headerfooter | heading_content | sectioning)+",
        defining: true,
        //whitespace: "pre",
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
        alternate: 'datalist',
        attrs: commonAttrs,
        content: "(phrasing | audio | button | input_content | video | progress | meter | output | label | image)*",
        group: "flow",
        //whitespace: "pre",
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
        alternate: 'datalist_text',
        attrs: commonAttrs,
        content: "option+",
        group: "flow",
        //whitespace: "pre",
        parseDOM: [{ tag: "datalist", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "datalist") }
    },
    details: {
        attrs: plusCommonAttributes({ open: { default: null } }),
        content: "(summary_text | summary) (div | flow | form | address_content | headerfooter | heading_content | sectioning)+",
        defining: true,
        group: "flow",
        //whitespace: "pre",
        parseDOM: [{ tag: "details", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "details") }
    },
    dialog: {
        attrs: plusCommonAttributes({ open: { default: null } }),
        content: "(flow | form | address_content | headerfooter | heading_content | sectioning)+",
        group: "flow",
        //whitespace: "pre",
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
        //whitespace: "pre",
        parseDOM: [{ tag: "fieldset", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "fieldset") }
    },
    figcaption_text: {
        alternate: 'figcaption',
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
        alternate: 'figcaption_text',
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
        //whitespace: "pre",
        parseDOM: [{ tag: "figure", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "figure") }
    },
    footer_text: {
        alternate: 'footer',
        attrs: commonAttrs,
        content: "(phrasing | audio | button | input_content | video | progress | meter | output | label | image)*",
        defining: true,
        group: "headerfooter",
        //whitespace: "pre",
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
        alternate: 'footer_text',
        attrs: commonAttrs,
        content: "(flow | form | address_content | heading_content | sectioning)+",
        defining: true,
        group: "headerfooter",
        //whitespace: "pre",
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
        //whitespace: "pre",
        parseDOM: [{ tag: "form", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "form") }
    },
    head: {
        attrs: commonAttrs,
        content: "(meta | link | style)* title (meta | link | style)*",
        defining: true,
        //whitespace: "pre",
        parseDOM: [{ tag: "head", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "head") }
    },
    header_text: {
        alternate: 'header',
        attrs: commonAttrs,
        content: "(phrasing | audio | button | input_content | video | progress | meter | output | label | image)*",
        defining: true,
        group: "headerfooter",
        //whitespace: "pre",
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
        alternate: 'header_text',
        attrs: commonAttrs,
        content: "(flow | form | address_content | heading_content | sectioning)+",
        defining: true,
        group: "headerfooter",
        //whitespace: "pre",
        parseDOM: [{ tag: "header", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "header") }
    },
    hgroup: {
        attrs: commonAttrs,
        content: "paragraph* heading paragraph*",
        group: "heading_content",
        //whitespace: "pre",
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
            enterkeyhint: { default: null },
            formaction: { default: null },
            formenctype: { default: null },
            formmethod: { default: null },
            formnovalidate: { default: null },
            formtarget: { default: null },
            height: { default: null },
            inputmode: { default: null },
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
            spellcheck: { default: null },
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
        alternate: 'legend',
        attrs: commonAttrs,
        content: "(phrasing | audio | button | input_content | video | progress | meter | output | label | image)*",
        //whitespace: "pre",
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
        alternate: 'legend_text',
        attrs: commonAttrs,
        content: "heading_content+",
        //whitespace: "pre",
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
        alternate: 'main',
        attrs: commonAttrs,
        content: "(phrasing | audio | button | input_content | video | progress | meter | output | label | image)*",
        defining: true,
        //whitespace: "pre",
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
        alternate: 'main_text',
        attrs: commonAttrs,
        content: "(flow | form | address_content | headerfooter | heading_content | sectioning)+",
        defining: true,
        //whitespace: "pre",
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
        toDOM(node) { return contentlessToDomWithCommonAttrs(node, "meta") }
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
        alternate: 'nav',
        attrs: commonAttrs,
        content: "(phrasing | audio | button | input_content | video | progress | meter | output | label | image)*",
        defining: true,
        group: "sectioning",
        //whitespace: "pre",
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
        alternate: 'nav_text',
        attrs: commonAttrs,
        content: "(flow | form | address_content | headerfooter | heading_content | sectioning)+",
        defining: true,
        group: "sectioning",
        //whitespace: "pre",
        parseDOM: [{ tag: "nav", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "nav") }
    },
    noscript_text: {
        alternate: 'noscript',
        attrs: commonAttrs,
        content: "(phrasing | audio | button | input_content | video | progress | meter | output | label | image)*",
        group: "flow",
        //whitespace: "pre",
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
        alternate: 'noscript_text',
        attrs: commonAttrs,
        content: "(flow | form | address_content | headerfooter | heading_content | sectioning | link | meta | style)+",
        group: "flow",
        //whitespace: "pre",
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
        //whitespace: "pre",
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
        content: "(phrasing | audio | button | input_content | video | progress | meter | output | label | image)*",
        defining: true,
        inline: true,
        parseDOM: [{ tag: "rt", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "rt") }
    },
    ruby: {
        attrs: commonAttrs,
        content: "(phrasing | audio | button | input_content | video | progress | meter | output | label | image | rp | rt)*",
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
        //whitespace: "pre",
        parseDOM: [{ tag: "search", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "search") }
    },
    section_text: {
        alternate: 'section',
        attrs: commonAttrs,
        content: "(phrasing | audio | button | input_content | video | progress | meter | output | label | image)*",
        defining: true,
        group: "sectioning",
        //whitespace: "pre",
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
        alternate: 'section_text',
        attrs: commonAttrs,
        content: "(flow | form | address_content | headerfooter | heading_content | sectioning)+",
        defining: true,
        group: "sectioning",
        //whitespace: "pre",
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
    slot_text: {
        alternate: 'slot',
        attrs: plusCommonAttributes({
            name: { default: null },
        }),
        content: "(phrasing | audio | button | input_content | video | progress | meter | output | label | image)*",
        group: "flow",
        //whitespace: "pre",
        parseDOM: [{
            tag: "slot",
            getAttrs(node) {
                if (isBlock(node)) {
                    return false;
                }
                return getCommonAttrs(node);
            }
        }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "slot") }
    },
    slot: {
        alternate: 'slot_text',
        attrs: plusCommonAttributes({
            name: { default: null },
        }),
        content: "(flow | form | address_content | headerfooter | heading_content | main_text | main | sectioning | tftab | tftabpanel)+",
        group: "flow",
        //whitespace: "pre",
        parseDOM: [{ tag: "slot", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "slot") }
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
        alternate: 'summary',
        attrs: commonAttrs,
        content: "(phrasing | audio | button | input_content | video | progress | meter | output | label | image)*",
        defining: true,
        //whitespace: "pre",
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
        alternate: 'summary_text',
        attrs: commonAttrs,
        content: "heading_content",
        defining: true,
        //whitespace: "pre",
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
            enterkeyhint: { default: null },
            inputmode: { default: null },
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
        //whitespace: "pre",
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
    handlebars: {
        content: "text*",
        group: "phrasing",
        inline: true,
        parseDOM: [{ tag: 'handlebars', getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, 'handlebars'); },
    },
    tfaccordion: {
        attrs: plusCommonAttributes({
            'data-only-one': { default: null },
        }),
        content: "(tfcontents | flow | form | address_content | headerfooter | heading_content | main_text | main | sectioning)+",
        group: "flow",
        //whitespace: "pre",
        parseDOM: [{ tag: "tf-accordion", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "tf-accordion"); },
    },
    tfcheckbox: {
        attrs: plusFormAttributes({
            accept: { default: null },
            autofocus: { default: null },
            checked: { default: null },
            'data-allow-null': { default: null },
            'data-checked-outlined': { default: null },
            'data-indeterminate-outlined': { default: null },
            'data-input-class': { default: null },
            'data-input-style': { default: null },
            'data-label': { default: null },
            'data-requires-true': { default: null },
            'data-unchecked-outlined': { default: null },
            formaction: { default: null },
            formenctype: { default: null },
            formmethod: { default: null },
            formnovalidate: { default: null },
            formtarget: { default: null },
            indeterminate: { default: null },
            radio: { default: null },
            readonly: { default: null },
            required: { default: null },
        }),
        defining: true,
        group: "input_content",
        inline: true,
        parseDOM: [{ tag: "tf-checkbox", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "tf-checkbox") }
    },
    tfclose: {
        attrs: commonAttrs,
        group: "phrasing",
        inline: true,
        parseDOM: [{ tag: "tf-close", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "tf-close") }
    },
    tfcolorinput: {
        attrs: plusFormAttributes({
            alpha: { default: null },
            autofocus: { default: null },
            button: { default: null },
            'data-icon': { default: null },
            'data-input-class': { default: null },
            'data-input-mode': { default: null },
            'data-input-style': { default: null },
            'data-label': { default: null },
            'data-show-swatch': { default: null },
            formaction: { default: null },
            formenctype: { default: null },
            formmethod: { default: null },
            formnovalidate: { default: null },
            formtarget: { default: null },
            inline: { default: null },
            placeholder: { default: null },
            readonly: { default: null },
            required: { default: null },
        }),
        content: "(flow | form | address_content | headerfooter | heading_content | main_text | main | sectioning)+",
        defining: true,
        group: "input_content",
        inline: true,
        parseDOM: [{ tag: "tf-color-input", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "tf-color-input") }
    },
    tfcontents: {
        attrs: commonAttrs,
        group: "flow",
        parseDOM: [{ tag: "tf-contents", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "tf-contents") }
    },
    tfdarkmodetoggle: {
        attrs: commonAttrs,
        content: "(phrasing | audio | button | input_content | video | progress | meter | output | label | image)*",
        group: "phrasing",
        inline: true,
        parseDOM: [{ tag: "tf-darkmode-toggle", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "tf-darkmode-toggle") }
    },
    tfdatetimeinput: {
        attrs: plusFormAttributes({
            autofocus: { default: null },
            button: { default: null },
            'data-am': { default: null },
            'data-calendar': { default: null },
            'data-hour12': { default: null },
            'data-input-class': { default: null },
            'data-input-mode': { default: null },
            'data-input-style': { default: null },
            'data-label': { default: null },
            'data-locale': { default: null },
            'data-pm': { default: null },
            'data-show-calendar': { default: null },
            'data-show-time-zone': { default: null },
            'data-time-separator': { default: null },
            'data-time-zone': { default: null },
            date: { default: null },
            formaction: { default: null },
            formenctype: { default: null },
            formmethod: { default: null },
            formnovalidate: { default: null },
            formtarget: { default: null },
            inline: { default: null },
            max: { default: null },
            min: { default: null },
            placeholder: { default: null },
            readonly: { default: null },
            required: { default: null },
            seconds: { default: null },
            size: { default: null },
            time: { default: null },
        }),
        content: "(flow | form | address_content | headerfooter | heading_content | main_text | main | sectioning)+",
        defining: true,
        group: "input_content",
        inline: true,
        parseDOM: [{ tag: "tf-datetime-input", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "tf-datetime-input") }
    },
    tfdrawerclose: {
        attrs: plusCommonAttributes({
            'data-side': { default: null },
        }),
        group: "phrasing",
        inline: true,
        parseDOM: [{ tag: "tf-drawer-close", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "tf-drawer-close") }
    },
    tfdraweroverlay: {
        attrs: plusCommonAttributes({
            'data-side': { default: null },
        }),
        group: "phrasing",
        inline: true,
        parseDOM: [{ tag: "tf-drawer-overlay", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "tf-drawer-overlay") }
    },
    tfdrawertoggle: {
        attrs: plusCommonAttributes({
            'data-side': { default: null },
        }),
        content: "(phrasing | audio | button | input_content | video | progress | meter | output | label | image)*",
        group: "phrasing",
        inline: true,
        parseDOM: [{ tag: "tf-drawer-toggle", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "tf-drawer-toggle") }
    },
    tfdropdown: {
        attrs: plusCommonAttributes({
            'data-activation': { default: null },
            'data-delay': { default: null },
            'data-open-at-pointer': { default: null },
            'disabled': { default: null },
        }),
        content: "(flow | form | address_content | headerfooter | heading_content | main_text | main | sectioning)+",
        defining: true,
        group: "flow",
        //whitespace: "pre",
        parseDOM: [{ tag: "tf-dropdown", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "tf-dropdown") }
    },
    tfeditor: {
        attrs: plusFormAttributes({
            autocomplete: { default: null },
            autocorrect: { default: null },
            autofocus: { default: null },
            'data-input-class': { default: null },
            'data-input-style': { default: null },
            'data-label': { default: null },
            'data-lock-mode': { default: null },
            'data-lock-syntax': { default: null },
            'data-syntax': { default: null },
            'data-update-on-input': { default: null },
            display: { default: null },
            formaction: { default: null },
            formenctype: { default: null },
            formmethod: { default: null },
            formnovalidate: { default: null },
            formtarget: { default: null },
            height: { default: null },
            inputmode: { default: null },
            'max-height': { default: null },
            placeholder: { default: null },
            readonly: { default: null },
            required: { default: null },
            spellcheck: { default: null },
            wysiwyg: { default: null },
        }),
        content: "(flow | form | address_content | headerfooter | heading_content | main_text | main | sectioning)+",
        defining: true,
        group: "input_content",
        inline: true,
        parseDOM: [{ tag: "tf-editor", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "tf-editor") }
    },
    tfemoji: {
        attrs: commonAttrs,
        content: "text*",
        defining: true,
        group: "phrasing",
        inline: true,
        parseDOM: [{ tag: "tf-emoji", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "tf-emoji") }
    },
    tfemojiinput: {
        attrs: plusFormAttributes({
            autofocus: { default: null },
            'data-input-class': { default: null },
            'data-input-style': { default: null },
            'data-show-emoji': { default: null },
            formaction: { default: null },
            formenctype: { default: null },
            formmethod: { default: null },
            formnovalidate: { default: null },
            formtarget: { default: null },
            readonly: { default: null },
            required: { default: null },
        }),
        content: "(flow | form | address_content | headerfooter | heading_content | main_text | main | sectioning)+",
        defining: true,
        group: "input_content",
        inline: true,
        parseDOM: [{ tag: "tf-emoji-input", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "tf-emoji-input") }
    },
    tficon: {
        attrs: commonAttrs,
        content: "text*",
        defining: true,
        group: "phrasing",
        inline: true,
        parseDOM: [{ tag: "tf-icon", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "tf-icon") }
    },
    tfinput: {
        attrs: plusFormAttributes({
            autocomplete: { default: null },
            autocorrect: { default: null },
            autofocus: { default: null },
            'data-input-class': { default: null },
            'data-input-debounce': { default: null },
            'data-input-style': { default: null },
            'data-show-emoji': { default: null },
            display: { default: null },
            formaction: { default: null },
            formenctype: { default: null },
            formmethod: { default: null },
            formnovalidate: { default: null },
            formtarget: { default: null },
            inputmode: { default: null },
            maxlength: { default: null },
            minlength: { default: null },
            pattern: { default: null },
            placeholder: { default: null },
            readonly: { default: null },
            required: { default: null },
            size: { default: null },
            spellcheck: { default: null },
        }),
        content: "(flow | form | address_content | headerfooter | heading_content | main_text | main | sectioning)+",
        defining: true,
        group: "input_content",
        inline: true,
        parseDOM: [{ tag: "tf-input", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "tf-input") }
    },
    tfinputfield: {
        attrs: plusFormAttributes({
            autocomplete: { default: null },
            autocorrect: { default: null },
            autofocus: { default: null },
            'data-input-class': { default: null },
            'data-input-debounce': { default: null },
            'data-input-style': { default: null },
            'data-label': { default: null },
            'data-show-emoji': { default: null },
            display: { default: null },
            formaction: { default: null },
            formenctype: { default: null },
            formmethod: { default: null },
            formnovalidate: { default: null },
            formtarget: { default: null },
            inputmode: { default: null },
            maxlength: { default: null },
            minlength: { default: null },
            pattern: { default: null },
            placeholder: { default: null },
            readonly: { default: null },
            required: { default: null },
            size: { default: null },
            spellcheck: { default: null },
        }),
        content: "(flow | form | address_content | headerfooter | heading_content | main_text | main | sectioning)+",
        defining: true,
        group: "input_content",
        inline: true,
        parseDOM: [{ tag: "tf-input-field", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "tf-input-field") }
    },
    tfnumericinput: {
        attrs: plusFormAttributes({
            autocomplete: { default: null },
            autofocus: { default: null },
            'data-hide-steppers': { default: null },
            'data-input-class': { default: null },
            'data-input-style': { default: null },
            'data-label': { default: null },
            display: { default: null },
            formaction: { default: null },
            formenctype: { default: null },
            formmethod: { default: null },
            formnovalidate: { default: null },
            formtarget: { default: null },
            inputmode: { default: null },
            max: { default: null },
            maxlength: { default: null },
            min: { default: null },
            minlength: { default: null },
            placeholder: { default: null },
            readonly: { default: null },
            required: { default: null },
            size: { default: null },
            step: { default: null },
        }),
        content: "(flow | form | address_content | headerfooter | heading_content | main_text | main | sectioning)+",
        defining: true,
        group: "input_content",
        inline: true,
        parseDOM: [{ tag: "tf-numeric-input", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "tf-numeric-input") }
    },
    tfpicker: {
        attrs: plusCommonAttributes({
            disabled: { default: null },
            readonly: { default: null },
        }),
        content: "(flow | form | address_content | headerfooter | heading_content | main_text | main | sectioning)+",
        defining: true,
        group: "flow",
        //whitespace: "pre",
        parseDOM: [{ tag: "tf-picker", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "tf-picker") }
    },
    tfpopover_text: {
        alternate: 'tfpopover',
        attrs: plusCommonAttributes({
            'data-anchor-id': { default: null },
            'data-focus-id': { default: null },
            'data-offset-x': { default: null },
            'data-offset-y': { default: null },
            'data-open': { default: null },
            'data-position-x': { default: null },
            'data-position-y': { default: null },
        }),
        content: "(phrasing | audio | button | input_content | video | progress | meter | output | label | image)*",
        defining: true,
        group: "flow",
        //whitespace: "pre",
        parseDOM: [{
            tag: "tf-popover",
            getAttrs(node) {
                if (isBlock(node)) {
                    return false;
                }
                return getCommonAttrs(node);
            }
        }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "tf-popover") }
    },
    tfpopover: {
        alternate: 'tfpopover_text',
        attrs: plusCommonAttributes({
            'data-anchor-id': { default: null },
            'data-focus-id': { default: null },
            'data-offset-x': { default: null },
            'data-offset-y': { default: null },
            'data-open': { default: null },
            'data-position-x': { default: null },
            'data-position-y': { default: null },
        }),
        content: "(flow | form | address_content | headerfooter | heading_content | main_text | main | sectioning)+",
        defining: true,
        group: "flow",
        //whitespace: "pre",
        parseDOM: [{ tag: "tf-popover", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "tf-popover") }
    },
    tfprogresscircle: {
        attrs: plusCommonAttributes({
            'data-progress': { default: null },
            'data-stroke': { default: null },
        }),
        content: "(phrasing | audio | button | input_content | video | progress | meter | output | label | image)*",
        group: "phrasing",
        inline: true,
        parseDOM: [{ tag: "tf-progress-circle", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "tf-progress-circle") }
    },
    tfprogresslinear: {
        attrs: plusCommonAttributes({
            'data-vertical': { default: null },
            'data-progress': { default: null },
            'data-stroke': { default: null },
        }),
        content: "(phrasing | audio | button | input_content | video | progress | meter | output | label | image)*",
        group: "phrasing",
        inline: true,
        parseDOM: [{ tag: "tf-progress-linear", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "tf-progress-linear") }
    },
    tfscrolltop: {
        attrs: commonAttrs,
        content: "(phrasing | audio | button | input_content | video | progress | meter | output | label | image)*",
        group: "phrasing",
        inline: true,
        parseDOM: [{ tag: "tf-scroll-top", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "tf-scroll-top") }
    },
    tfselect: {
        attrs: plusFormAttributes({
            autocomplete: { default: null },
            autocorrect: { default: null },
            autofocus: { default: null },
            'data-disable-autosearch': { default: null },
            'data-has-text-input': { default: null },
            'data-hide-expand': { default: null },
            'data-input-class': { default: null },
            'data-input-debounce': { default: null },
            'data-input-readonly': { default: null },
            'data-input-style': { default: null },
            'data-label': { default: null },
            'data-popover-limit-height': { default: null },
            'data-search-filter': { default: null },
            'data-show-emoji': { default: null },
            display: { default: null },
            formaction: { default: null },
            formenctype: { default: null },
            formmethod: { default: null },
            formnovalidate: { default: null },
            formtarget: { default: null },
            inputmode: { default: null },
            maxlength: { default: null },
            minlength: { default: null },
            pattern: { default: null },
            placeholder: { default: null },
            readonly: { default: null },
            required: { default: null },
            size: { default: null },
            spellcheck: { default: null },
        }),
        content: "(flow | form | address_content | headerfooter | heading_content | main_text | main | sectioning)+",
        defining: true,
        group: "input_content",
        inline: true,
        parseDOM: [{ tag: "tf-select", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "tf-select") }
    },
    tfslider: {
        attrs: plusCommonAttributes({
            'data-max': { default: null },
            'data-min': { default: null },
            'data-value': { default: null },
        }),
        content: "(flow | form | address_content | headerfooter | heading_content | main_text | main | sectioning)+",
        defining: true,
        group: "input_content",
        inline: true,
        parseDOM: [{ tag: "tf-slider", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "tf-slider") }
    },
    tfsyntaxhighlight: {
        attrs: commonAttrs,
        content: "(code_block | flow | form | address_content | headerfooter | heading_content | main_text | main | sectioning)+",
        defining: true,
        group: "flow",
        //whitespace: "pre",
        parseDOM: [{ tag: "tf-syntax-highlight", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "tf-syntax-highlight") }
    },
    tftab: {
        attrs: plusCommonAttributes({
            'data-can-close': { default: null },
            'data-url': { default: null },
        }),
        content: "(flow | form | address_content | headerfooter | heading_content | main_text | main | sectioning)+",
        defining: true,
        //whitespace: "pre",
        parseDOM: [{ tag: "tf-tab", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "tf-tab") }
    },
    tftabpanel: {
        attrs: plusCommonAttributes({
            'data-can-close': { default: null },
            disabled: { default: null },
        }),
        content: "(flow | form | address_content | headerfooter | heading_content | main_text | main | sectioning)+",
        defining: true,
        //whitespace: "pre",
        parseDOM: [{ tag: "tf-tabpanel", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "tf-tabpanel") }
    },
    tftabs: {
        attrs: plusCommonAttributes({
            'data-active-index': { default: null },
            disabled: { default: null },
        }),
        content: "(tftab | tftabpanel | flow | form | address_content | headerfooter | heading_content | main_text | main | sectioning)+",
        defining: true,
        //whitespace: "pre",
        parseDOM: [{ tag: "tf-tabs", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "tf-tabs") }
    },
    tftooltip_text: {
        alternate: 'tftooltip',
        attrs: plusCommonAttributes({
            'data-anchor-origin': { default: null },
            'data-arrow': { default: null },
            'data-container-no-trigger': { default: null },
            'data-delay': { default: null },
            'data-dismiss-on-tap': { default: null },
            'data-max-height': { default: null },
            'data-popover-class': { default: null },
            'data-origin': { default: null },
            'data-popover-style': { default: null },
            'data-tooltip-button': { default: null },
        }),
        content: "(phrasing | audio | button | input_content | video | progress | meter | output | label | image)*",
        defining: true,
        group: "phrasing",
        inline: true,
        parseDOM: [{
            tag: "tf-tooltip",
            getAttrs(node) {
                if (isBlock(node)) {
                    return false;
                }
                return getCommonAttrs(node);
            }
        }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "tf-tooltip") }
    },
    tftooltip: {
        alternate: 'tftooltip_text',
        attrs: plusCommonAttributes({
            'data-anchor-origin': { default: null },
            'data-arrow': { default: null },
            'data-container-no-trigger': { default: null },
            'data-delay': { default: null },
            'data-dismiss-on-tap': { default: null },
            'data-max-height': { default: null },
            'data-popover-class': { default: null },
            'data-origin': { default: null },
            'data-popover-style': { default: null },
            'data-tooltip-button': { default: null },
        }),
        content: "(flow | form | address_content | headerfooter | heading_content | main_text | main | sectioning)+",
        defining: true,
        group: "flow",
        //whitespace: "pre",
        parseDOM: [{ tag: "tf-tooltip", getAttrs: getCommonAttrs }],
        toDOM(node) { return nodeToDomWithCommonAttrs(node, "tf-tooltip") }
    },
    other: {
        atom: true,
        attrs: { content: { default: null } },
        code: true,
        content: "text*",
        group: "flow",
        whitespace: "pre",
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

export function plusCommonAttributes(attrs: { [key: string]: any }) {
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