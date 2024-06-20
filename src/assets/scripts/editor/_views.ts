import { html_beautify } from 'js-beautify';
import { EditorView as PMEditorView, NodeView } from 'prosemirror-view';
import { Node as ProsemirrorNode } from 'prosemirror-model';
import { renderer } from './_schema';

export class HeadView implements NodeView {
    dom: Node;

    constructor(
        public node: ProsemirrorNode,
        public view: PMEditorView,
        public getPos: () => number | undefined) {
        this.dom = this.createContent(node);
    }

    stopEvent() { return true; }

    update(node: ProsemirrorNode) {
        if (node.type != this.node.type) {
            return false;
        }
        this.dom = this.createContent(node);
        return true;
    }

    private createContent(node: ProsemirrorNode) {
        const head = document.createElement('head');
        head.appendChild(renderer.serializeFragment(node.content));
        const value = html_beautify(head.innerHTML, {
            extra_liners: [],
            indent_size: 2,
            wrap_line_length: 0,
        });
        const dom = document.createElement('head');
        dom.appendChild(document.createComment(value));
        return dom;
    }
}

export class CheckboxView implements NodeView {
    dom: Node;

    constructor(
        public node: ProsemirrorNode,
        public view: PMEditorView,
        public getPos: () => number | undefined) {
        this.dom = this.createContent(node);
    }

    stopEvent() { return true; }

    update(node: ProsemirrorNode) {
        if (node.type !== this.node.type) {
            return false;
        }
        this.dom = this.createContent(node);
        return true;
    }

    destroy() {
        if (this.dom) {
            this.dom.removeEventListener('change', this.onChange.bind(this));
            this.dom.removeEventListener('input', this.onChange.bind(this));
        }
    }

    private createContent(node: ProsemirrorNode) {
        const element = document.createElement('input');
        for (const a of Object.keys(node.attrs)) {
            if (FormView.ForbiddenAttributes.includes(a)
                || (!node.attrs[a]
                    && (typeof node.attrs[a] !== 'number'
                        || node.attrs[a] !== 0))) {
                continue;
            }
            element.setAttribute(a, node.attrs[a]);
        }
        element.type = 'checkbox';
        if (element.hasAttribute('indeterminate')) {
            element.indeterminate = true;
        }
        element.addEventListener('change', this.onChange.bind(this));
        element.addEventListener('input', this.onChange.bind(this));
        return element;
    }

    private onChange(event: Event) {
        event.stopPropagation();

        if (!(this.dom instanceof HTMLInputElement)) {
            return;
        }
        if (this.dom.checked) {
            this.dom.setAttribute('checked', '');
        } else {
            this.dom.removeAttribute('checked');
        }
        const pos = this.getPos();
        if (pos != null) {
            this.view.dispatch(this.view.state.tr.setNodeMarkup(
                pos,
                undefined,
                {
                    ...this.node.attrs,
                    checked: this.dom.checked,
                }));
        }
    }
}

export class DetailsView implements NodeView {
    dom: HTMLDetailsElement;
    contentDOM: HTMLDetailsElement;

    constructor(
        public node: ProsemirrorNode,
        public view: PMEditorView,
        public getPos: () => number | undefined) {
        this.dom = this.contentDOM = document.createElement('details');
        if (node.attrs['open']) {
            this.dom.open = true;
        }

        this.dom.addEventListener('click', this.onClick.bind(this));
    }

    destroy() {
        this.dom.removeEventListener('click', this.onClick.bind(this));
    }

    update(node: ProsemirrorNode) {
        if (node.type.name === 'details') {
            this.dom.open = !!node.attrs.open;
            return true;
        }
        return false;
    }

    private onClick(event: MouseEvent) {
        if (event.button === 0
            && (event.target instanceof HTMLDetailsElement
                || (event.target instanceof HTMLElement
                    && event.target.closest('summary')))) {
            const pos = this.getPos();
            if (pos != null) {
                this.view.dispatch(this.view.state.tr.setNodeMarkup(
                    pos,
                    undefined,
                    {
                        ...this.node.attrs,
                        open: !this.node.attrs.open,
                    }));
            }
        }
    }
}

export class DisabledInputView implements NodeView {
    dom: Node;

    constructor(
        public node: ProsemirrorNode,
        public view: PMEditorView,
        public getPos: () => number | undefined) {
        this.dom = this.createContent(node);
    }

    stopEvent() { return true; }

    update(node: ProsemirrorNode) {
        if (node.type !== this.node.type) {
            return false;
        }
        this.dom = this.createContent(node);
        return true;
    }

    private createContent(node: ProsemirrorNode) {
        const element = document.createElement('input');
        for (const a of Object.keys(node.attrs)) {
            if (FormView.ForbiddenAttributes.includes(a)
                || (!node.attrs[a]
                    && (typeof node.attrs[a] !== 'number'
                        || node.attrs[a] !== 0))) {
                continue;
            }
            element.setAttribute(a, node.attrs[a]);
        }
        element.setAttribute('disabled', '');
        return element;
    }
}

export class ForbiddenView implements NodeView {
    dom: Node;

    constructor(
        public node: ProsemirrorNode,
        public view: PMEditorView,
        public getPos: () => number | undefined) {
        this.dom = this.createContent(node);
    }

    stopEvent() { return true; }

    update(node: ProsemirrorNode) {
        if (node.type !== this.node.type) {
            return false;
        }
        this.dom = this.createContent(node);
        return true;
    }

    private createContent(node: ProsemirrorNode) {
        const div = document.createElement('div');
        div.appendChild(renderer.serializeNode(node));
        const value = html_beautify(div.innerHTML, {
            extra_liners: [],
            indent_size: 2,
            wrap_line_length: 0,
        });
        const dom = document.createElement('div');
        dom.appendChild(document.createComment(value));
        return dom;
    }
}

export class FormView implements NodeView {
    dom: Node;
    contentDom?: HTMLElement;

    static ForbiddenAttributes = [
        'action',
        'capture',
        'form',
        'formaction',
        'formenctype',
        'formmethod',
        'formnovalidate',
        'formtarget',
        'name',
        'popovertarget',
        'popovertargetaction',
        'required',
        'target',
    ];

    constructor(
        public node: ProsemirrorNode,
        public view: PMEditorView,
        public getPos: () => number | undefined) {
        this.dom = this.createContent(node);
        this.contentDom = this.dom instanceof HTMLElement ? this.dom : undefined;
    }

    stopEvent() { return true; }

    update(node: ProsemirrorNode) {
        if (node.type !== this.node.type) {
            return false;
        }
        this.dom = this.createContent(node);
        this.contentDom = this.dom instanceof HTMLElement ? this.dom : undefined;
        return true;
    }

    private createContent(node: ProsemirrorNode) {
        const element = node.type.spec.parseDOM && node.type.spec.parseDOM.length
            ? document.createElement(node.type.spec.parseDOM[0].tag)
            : document.createElement('div');
        for (const a of Object.keys(node.attrs)) {
            if (FormView.ForbiddenAttributes.includes(a)
                || (!node.attrs[a]
                    && (typeof node.attrs[a] !== 'number'
                        || node.attrs[a] !== 0))) {
                continue;
            }
            element.setAttribute(a, node.attrs[a]);
        }
        element.setAttribute('disabled', '');
        return element;
    }
}

export class InputView implements NodeView {
    dom: Node;

    constructor(
        public node: ProsemirrorNode,
        public view: PMEditorView,
        public getPos: () => number | undefined) {
        this.dom = this.createContent(node);
    }

    stopEvent() { return true; }

    update(node: ProsemirrorNode) {
        if (node.type !== this.node.type) {
            return false;
        }
        this.dom = this.createContent(node);
        return true;
    }

    destroy() {
        if (this.dom) {
            this.dom.removeEventListener('change', this.onChange.bind(this));
            this.dom.removeEventListener('input', this.onChange.bind(this));
        }
    }

    private createContent(node: ProsemirrorNode) {
        const element = document.createElement('input');
        for (const a of Object.keys(node.attrs)) {
            if (FormView.ForbiddenAttributes.includes(a)
                || (!node.attrs[a]
                    && (typeof node.attrs[a] !== 'number'
                        || node.attrs[a] !== 0))) {
                continue;
            }
            element.setAttribute(a, node.attrs[a]);
        }
        element.addEventListener('change', this.onChange.bind(this));
        element.addEventListener('input', this.onChange.bind(this));
        return element;
    }

    private onChange(event: Event) {
        event.stopPropagation();

        if (!(this.dom instanceof HTMLInputElement)
            || !(event.target instanceof HTMLInputElement)) {
            return;
        }
        this.dom.setAttribute('value', event.target.value);
        const pos = this.getPos();
        if (pos != null) {
            this.view.dispatch(this.view.state.tr.setNodeMarkup(
                pos,
                undefined,
                {
                    ...this.node.attrs,
                    value: event.target.value,
                }));
        }
    }
}

export class RadioView implements NodeView {
    dom: Node;

    constructor(
        public node: ProsemirrorNode,
        public view: PMEditorView,
        public getPos: () => number | undefined) {
        this.dom = this.createContent(node);
    }

    stopEvent() { return true; }

    update(node: ProsemirrorNode) {
        if (node.type !== this.node.type) {
            return false;
        }
        this.dom = this.createContent(node);
        return true;
    }

    destroy() {
        if (this.dom) {
            this.dom.removeEventListener('change', this.onChange.bind(this));
            this.dom.removeEventListener('input', this.onChange.bind(this));
        }
    }

    private createContent(node: ProsemirrorNode) {
        const element = document.createElement('input');
        for (const a of Object.keys(node.attrs)) {
            if (FormView.ForbiddenAttributes.includes(a)
                || (!node.attrs[a]
                    && (typeof node.attrs[a] !== 'number'
                        || node.attrs[a] !== 0))) {
                continue;
            }
            element.setAttribute(a, node.attrs[a]);
        }
        element.type = 'radio';
        element.addEventListener('change', this.onChange.bind(this));
        element.addEventListener('input', this.onChange.bind(this));
        return element;
    }

    private onChange(event: Event) {
        event.stopPropagation();

        if (!(this.dom instanceof HTMLInputElement)) {
            return;
        }
        if (this.dom.checked) {
            this.dom.setAttribute('checked', '');
        } else {
            this.dom.removeAttribute('checked');
        }
        const pos = this.getPos();
        if (pos != null) {
            this.view.dispatch(this.view.state.tr.setNodeMarkup(
                pos,
                undefined,
                {
                    ...this.node.attrs,
                    checked: this.dom.checked,
                }));
        }
    }
}

export class ResetInputView implements NodeView {
    dom: Node;

    constructor(
        public node: ProsemirrorNode,
        public view: PMEditorView,
        public getPos: () => number | undefined) {
        this.dom = this.createContent(node);
    }

    stopEvent() { return true; }

    update(node: ProsemirrorNode) {
        if (node.type !== this.node.type) {
            return false;
        }
        this.dom = this.createContent(node);
        return true;
    }

    destroy() {
        if (this.dom) {
            this.dom.removeEventListener('click', this.onClick.bind(this));
        }
    }

    private createContent(node: ProsemirrorNode) {
        const element = document.createElement('input');
        for (const a of Object.keys(node.attrs)) {
            if (FormView.ForbiddenAttributes.includes(a)
                || (!node.attrs[a]
                    && (typeof node.attrs[a] !== 'number'
                        || node.attrs[a] !== 0))) {
                continue;
            }
            element.setAttribute(a, node.attrs[a]);
        }
        // replace with normal button to prevent the automatic reset behavior from affecting any containing form
        element.type = 'button';
        if (!element.value.length) {
            element.value = 'Reset';
        }
        element.addEventListener('click', this.onClick.bind(this));
        return element;
    }

    private onClick(event: Event) {
        event.preventDefault();
        event.stopPropagation();
    }
}

export class SelectView implements NodeView {
    dom: Node;

    static ForbiddenAttributes = [
        'form',
        'name',
        'required',
    ];

    constructor(
        public node: ProsemirrorNode,
        public view: PMEditorView,
        public getPos: () => number | undefined) {
        this.dom = this.createContent(node);
    }

    stopEvent() { return true; }

    update(node: ProsemirrorNode) {
        if (node.type !== this.node.type) {
            return false;
        }
        this.dom = this.createContent(node);
        return true;
    }

    destroy() {
        if (this.dom) {
            this.dom.removeEventListener('change', this.onChange.bind(this));
            this.dom.removeEventListener('input', this.onChange.bind(this));
        }
    }

    private addChildren(node: ProsemirrorNode, element: HTMLElement) {
        node.forEach(child => {
            const childElement = child.type.name === 'horizontal_rule'
                ? document.createElement('hr')
                : document.createElement(child.type.name);
            for (const a of Object.keys(child.attrs)) {
                if (!node.attrs[a]
                    && (typeof node.attrs[a] !== 'number'
                        || node.attrs[a] !== 0)) {
                    continue;
                }
                childElement.setAttribute(a, node.attrs[a]);
            }
            element.appendChild(childElement);

            this.addChildren(child, childElement);
        });
    }

    private createContent(node: ProsemirrorNode) {
        const element = document.createElement('select');
        for (const a of Object.keys(node.attrs)) {
            if (SelectView.ForbiddenAttributes.includes(a)
                || (!node.attrs[a]
                    && (typeof node.attrs[a] !== 'number'
                        || node.attrs[a] !== 0))) {
                continue;
            }
            element.setAttribute(a, node.attrs[a]);
        }

        this.addChildren(node, element);

        element.addEventListener('change', this.onChange.bind(this));
        element.addEventListener('input', this.onChange.bind(this));

        return element;
    }

    private onChange(event: Event) {
        event.stopPropagation();

        if (!(this.dom instanceof HTMLSelectElement)
            || !(event.target instanceof HTMLSelectElement)) {
            return;
        }
        this.dom
            .querySelectorAll('[selected]')
            .forEach(x => {
                x.removeAttribute('selected');
            });
        if (event.target.value) {
            for (const option of this.dom.querySelectorAll('option')) {
                if (option.value == event.target.value) {
                    option.setAttribute('selected', '');
                    break;
                }
            }
        }
        const pos = this.getPos();
        if (pos) {
            this.setSelected(this.node, pos, event.target.value);
        }
    }

    private setSelected(node: ProsemirrorNode, pos: number, value: string) {
        node.forEach((child, offset) => {
            if (child.type.name === 'option') {
                if (value && child.attrs.value === value) {
                    this.view.dispatch(this.view.state.tr.setNodeMarkup(
                        pos + offset,
                        undefined,
                        {
                            ...child.attrs,
                            selected: true,
                        }));
                    return true;
                } else if (child.attrs.selected) {
                    this.view.dispatch(this.view.state.tr.setNodeMarkup(
                        pos + offset,
                        undefined,
                        {
                            ...child.attrs,
                            selected: false,
                        }));
                }
                return false;
            }
            if (this.setSelected(child, pos + offset, value)) {
                return true;
            }
        });
        return false;
    }
}

export class TextAreaView implements NodeView {
    dom: Node;
    contentDom?: HTMLElement;

    static ForbiddenAttributes = [
        'form',
        'name',
        'required',
    ];

    constructor(
        public node: ProsemirrorNode,
        public view: PMEditorView,
        public getPos: () => number | undefined) {
        this.dom = this.createContent(node);
        this.contentDom = this.dom instanceof HTMLElement ? this.dom : undefined;
    }

    stopEvent() { return true; }

    update(node: ProsemirrorNode) {
        if (node.type !== this.node.type) {
            return false;
        }
        this.dom = this.createContent(node);
        this.contentDom = this.dom instanceof HTMLElement ? this.dom : undefined;
        return true;
    }

    private createContent(node: ProsemirrorNode) {
        const element = node.type.spec.parseDOM && node.type.spec.parseDOM.length
            ? document.createElement(node.type.spec.parseDOM[0].tag)
            : document.createElement('div');
        for (const a of Object.keys(node.attrs)) {
            if (TextAreaView.ForbiddenAttributes.includes(a)
                || (!node.attrs[a]
                    && (typeof node.attrs[a] !== 'number'
                        || node.attrs[a] !== 0))) {
                continue;
            }
            element.setAttribute(a, node.attrs[a]);
        }
        return element;
    }
}