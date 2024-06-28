import { Attrs, DOMOutputSpec, Mark, MarkSpec } from "prosemirror-model";
import { commonAttrs, getCommonAttrs, plusCommonAttributes } from "./_node-types";

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
export const commonMarks: { [name in string]: MarkSpec } = {
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