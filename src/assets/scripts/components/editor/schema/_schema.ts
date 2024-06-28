import {
    DOMSerializer,
    Fragment,
    Node as ProsemirrorNode,
    Schema,
} from 'prosemirror-model';
import { commonNodes } from './_node-types';
import { commonMarks } from './_mark-types';

export const schema = new Schema({
    nodes: commonNodes,
    marks: commonMarks,
});

interface ExtendedDOMSerializer extends DOMSerializer {
    baseSerializeNodeInner?(node: ProsemirrorNode, options: { document?: Document }): globalThis.Node;
    serializeNodeInner?(node: ProsemirrorNode, options: { document?: Document }): globalThis.Node;
}

class Renderer {
    private _serializer: ExtendedDOMSerializer;

    constructor() {
        this._serializer = DOMSerializer.fromSchema(schema);
        this._serializer.baseSerializeNodeInner = this._serializer.serializeNodeInner;
        this._serializer.serializeNodeInner = function (node: ProsemirrorNode, options: { document?: Document }) {
            const doc = (options.document || window.document);
            if (node.type.name === 'phrasing_wrapper') {
                if (node.firstChild
                    && node.firstChild.type.name === 'handlebars'
                    && node.firstChild.attrs && node.firstChild.attrs['data-postfix-br'] != null) {
                    return this.serializeFragment(node.content, options);
                } else {
                    const fragment = new DocumentFragment();
                    fragment.appendChild(doc.createTextNode('\n'));
                    fragment.appendChild(this.serializeFragment(node.content, options));
                    return fragment;
                }
            }
            if (node.type.name === 'handlebars') {
                const fragment = new DocumentFragment();
                if (node.attrs
                    && node.attrs['data-prefix-br'] != null) {
                    fragment.appendChild(doc.createTextNode('\n'));
                }
                fragment.appendChild(doc.createTextNode(`{{${node.textContent}}}`));
                if (node.attrs
                    && node.attrs['data-postfix-br'] != null) {
                    fragment.appendChild(doc.createTextNode('\n'));
                }
                return fragment;
            }
            if (typeof this.baseSerializeNodeInner === 'function') {
                return this.baseSerializeNodeInner(node, options);
            }
            throw new Error("Error: failed to call baseSerializeNodeInner");
        }
    }

    serializeFragment(fragment: Fragment, options?: { document?: Document }, target?: HTMLElement | DocumentFragment) {
        return this._serializer.serializeFragment(fragment, options, target);
    }

    serializeNode(node: ProsemirrorNode, options?: { document?: Document }) {
        return this._serializer.serializeNode(node, options);
    }
}
export const renderer = new Renderer();
