import { Command, EditorState, Plugin, PluginKey, PluginSpec, TextSelection, Transaction } from 'prosemirror-state';
import { StepMap } from 'prosemirror-transform';
import { keymap } from 'prosemirror-keymap';
import { chainCommands, deleteSelection, newlineInCode } from 'prosemirror-commands';
import { Node as ProsemirrorNode } from 'prosemirror-model';
import { EditorView, NodeView, NodeViewConstructor } from 'prosemirror-view';
import { TavenemCheckboxHtmlElement } from '../../_checkbox';
import { TavenemInputHtmlElement } from '../../_input';

interface ITavenemPluginState {
    prevCursorPos: number;
    selectionDirection: number;
}

const TAVENEM_PLUGIN_KEY = new PluginKey<ITavenemPluginState>("tavenem");

class TavenemCheckboxView implements NodeView {
    dom: TavenemCheckboxHtmlElement;

    static ForbiddenAttributes = [
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
    ];

    constructor(
        public node: ProsemirrorNode,
        public view: EditorView,
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
            this.dom.removeEventListener('inputtoggle', this.onChange.bind(this));
        }
    }

    private createContent(node: ProsemirrorNode) {
        const element = document.createElement('tf-checkbox') as TavenemCheckboxHtmlElement;
        for (const a of Object.keys(node.attrs)) {
            if (TavenemCheckboxView.ForbiddenAttributes.includes(a)
                || (!node.attrs[a]
                    && (typeof node.attrs[a] !== 'number'
                        || node.attrs[a] !== 0))) {
                continue;
            }
            element.setAttribute(a, node.attrs[a]);
        }
        element.addEventListener('inputtoggle', this.onChange.bind(this));
        return element;
    }

    private onChange(event: Event) {
        event.stopPropagation();

        if (!(this.dom instanceof TavenemCheckboxHtmlElement)) {
            return;
        }
        if (this.dom.checked) {
            this.dom.setAttribute('checked', '');
            this.dom.removeAttribute('indeterminate');
        } else if (this.dom.checked == null) {
            this.dom.setAttribute('indeterminate', '');
            this.dom.removeAttribute('checked');
        } else {
            this.dom.removeAttribute('checked');
            this.dom.removeAttribute('indeterminate');
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

function createCheckboxView(): NodeViewConstructor {
    return (node: ProsemirrorNode, view: EditorView, getPos: () => number | undefined) => {
        let pluginState = TAVENEM_PLUGIN_KEY.getState(view.state);
        if (!pluginState) {
            throw new Error("no plugin");
        }
        return new TavenemCheckboxView(node, view, getPos);
    };
}

class IconView implements NodeView {
    dom: HTMLElement;
    private _innerView: EditorView | undefined;
    private _isEditing = false;
    private _renderElement: HTMLElement | undefined;
    private _srcElement: HTMLElement | undefined;

    constructor(
        public node: ProsemirrorNode,
        public view: EditorView,
        public getPos: () => number | undefined,
        private pluginKey: PluginKey<ITavenemPluginState>,
        private tag: string) {
        this.dom = document.createElement(`${tag}-view`);
        this.dom.classList.add('nested-editor-view');

        this._renderElement = document.createElement('span');
        this._renderElement.classList.add('render');
        this.dom.appendChild(this._renderElement);

        this._srcElement = document.createElement('span');
        this._srcElement.spellcheck = false;
        this.dom.appendChild(this._srcElement);

        this.dom.addEventListener('click', () => this.ensureFocus());

        this.render();
    }

    deselectNode() {
        this.dom.classList.remove("ProseMirror-selectednode");
        if (this._isEditing) {
            this.closeEditor();
        }
    }

    destroy() {
        this.closeEditor(false);

        if (this._renderElement) {
            this._renderElement.remove();
            delete this._renderElement;
        }
        if (this._srcElement) {
            this._srcElement.remove();
            delete this._srcElement;
        }

        this.dom.remove();
    }

    ignoreMutation() { return true; }

    render() {
        if (!this._renderElement) {
            return;
        }

        const iconString = this.node.content.firstChild
            ? this.node.content.firstChild.textContent.trim()
            : "";

        if (iconString.length < 1) {
            this._renderElement.replaceChildren();
            return;
        }

        if (this._renderElement.childElementCount > 0) {
            const icon = this._renderElement.firstElementChild!;
            icon.textContent = iconString;
        } else {
            const icon = document.createElement(this.tag);
            icon.textContent = iconString;
            this._renderElement.appendChild(icon);
        }
    }

    selectNode() {
        if (!this.view.editable) {
            return;
        }
        this.dom.classList.add("ProseMirror-selectednode");
        if (!this._isEditing) {
            this.openEditor();
        }
    }

    stopEvent(event: Event): boolean {
        return (this._innerView !== undefined)
            && (event.target !== undefined)
            && this._innerView.dom.contains(event.target as Node);
    }

    update(node: ProsemirrorNode) {
        if (!node.sameMarkup(this.node)) {
            return false;
        }
        this.node = node;

        if (this._innerView) {
            const state = this._innerView.state;

            const start = node.content.findDiffStart(state.doc.content);
            if (start != null) {
                const diff = node.content.findDiffEnd(state.doc.content as any);
                if (diff) {
                    let { a: endA, b: endB } = diff;
                    const overlap = start - Math.min(endA, endB);
                    if (overlap > 0) {
                        endA += overlap;
                        endB += overlap;
                    }
                    this._innerView.dispatch(state.tr
                        .replace(start, endB, node.slice(start, endA))
                        .setMeta("fromOutside", true));
                }
            }
        }

        if (!this._isEditing) {
            this.render();
        }

        return true;
    }

    private closeEditor(render: boolean = true) {
        if (this._innerView) {
            this._innerView.destroy();
            this._innerView = undefined;
        }

        if (render) {
            this.render();
        }
        this._isEditing = false;
    }

    private dispatchInner(tr: Transaction) {
        if (!this._innerView) {
            return;
        }
        const { state, transactions } = this._innerView.state.applyTransaction(tr);
        this._innerView.updateState(state);

        if (!tr.getMeta("fromOutside")) {
            const outerTr = this.view.state.tr,
                offsetMap = StepMap.offset(this.getPos()! + 1);
            for (let i = 0; i < transactions.length; i++) {
                const steps = transactions[i].steps;
                for (let j = 0; j < steps.length; j++) {
                    const mapped = steps[j].map(offsetMap);
                    if (!mapped) {
                        throw Error("step discarded!");
                    }
                    outerTr.step(mapped);
                }
            }
            if (outerTr.docChanged) {
                this.view.dispatch(outerTr);
            }
        }
    }

    private ensureFocus() {
        if (this._innerView && this.view.hasFocus()) {
            this._innerView.focus();
        }
    }

    private openEditor() {
        if (this._innerView) {
            console.warn("IconView editor already open when openEditor was called");
            return;
        }

        this._innerView = new EditorView(this._srcElement!, {
            state: EditorState.create({
                doc: this.node,
                plugins: [keymap({
                    "Backspace": chainCommands(deleteSelection, (state) => {
                        // default backspace behavior for non-empty selections
                        if (!state.selection.empty) {
                            return false;
                        }
                        // default backspace behavior when node is non-empty
                        if (this.node.textContent.length > 0) {
                            return false;
                        }
                        // delete the empty node and focus the outer view
                        this.view.dispatch(this.view.state.tr.insertText(""));
                        this.view.focus();
                        return true;
                    }),
                    "Ctrl-Backspace": () => {
                        // delete node and focus the outer view
                        this.view.dispatch(this.view.state.tr.insertText(""));
                        this.view.focus();
                        return true;
                    },
                    "Enter": chainCommands(newlineInCode, collapseCmd(this.view, +1, false)),
                    "Ctrl-Enter": collapseCmd(this.view, +1, false),
                    "ArrowLeft": collapseCmd(this.view, -1, true),
                    "ArrowRight": collapseCmd(this.view, +1, true),
                    "ArrowUp": collapseCmd(this.view, -1, true),
                    "ArrowDown": collapseCmd(this.view, +1, true),
                })]
            }),
            dispatchTransaction: this.dispatchInner.bind(this)
        })

        // focus element
        let innerState = this._innerView.state;
        this._innerView.focus();

        // request outer cursor position before node was selected
        let maybePos = this.pluginKey.getState(this.view.state)?.prevCursorPos;
        if (maybePos === null || maybePos === undefined) {
            console.error("Error:  Unable to fetch Tavenem plugin state from key.");
        }
        let prevCursorPos: number = maybePos ?? 0;

        // compute position that cursor should appear within the expanded node
        let innerPos = (prevCursorPos <= this.getPos()!) ? 0 : this.node.nodeSize - 2;
        this._innerView.dispatch(
            innerState.tr.setSelection(
                TextSelection.create(innerState.doc, innerPos)
            )
        );

        this._isEditing = true;
    }
}

function createIconView(tag: string): NodeViewConstructor {
    return (node: ProsemirrorNode, view: EditorView, getPos: () => number | undefined) => {
        let pluginState = TAVENEM_PLUGIN_KEY.getState(view.state);
        if (!pluginState) {
            throw new Error("no plugin");
        }
        return new IconView(node, view, getPos, TAVENEM_PLUGIN_KEY, tag);
    };
}

class TavenemInputView implements NodeView {
    dom: TavenemInputHtmlElement;

    static ForbiddenAttributes = [
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
    ];

    constructor(
        public node: ProsemirrorNode,
        public view: EditorView,
        public getPos: () => number | undefined,
        private tag: string) {
        this.dom = this.createContent(node, tag);
    }

    stopEvent() { return true; }

    update(node: ProsemirrorNode) {
        if (node.type !== this.node.type) {
            return false;
        }
        this.dom = this.createContent(node, this.tag);
        return true;
    }

    destroy() {
        if (this.dom) {
            this.dom.removeEventListener('valuechange', this.onStopEvent.bind(this));
            this.dom.removeEventListener('valueinput', this.onChange.bind(this));
        }
    }

    private createContent(node: ProsemirrorNode, tag: string) {
        const element = document.createElement(tag) as TavenemInputHtmlElement;
        for (const a of Object.keys(node.attrs)) {
            if (TavenemInputView.ForbiddenAttributes.includes(a)
                || (!node.attrs[a]
                    && (typeof node.attrs[a] !== 'number'
                        || node.attrs[a] !== 0))) {
                continue;
            }
            element.setAttribute(a, node.attrs[a]);
        }
        element.addEventListener('valuechange', this.onStopEvent.bind(this));
        element.addEventListener('valueinput', this.onChange.bind(this));
        return element;
    }

    private onChange(event: Event) {
        event.stopPropagation();

        if (!(this.dom instanceof TavenemInputHtmlElement)
            || !(event.target instanceof TavenemInputHtmlElement)) {
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

    private onStopEvent(event: Event) {
        event.preventDefault();
        event.preventDefault();
    }
}

function createInputView(tag: string): NodeViewConstructor {
    return (node: ProsemirrorNode, view: EditorView, getPos: () => number | undefined) => {
        let pluginState = TAVENEM_PLUGIN_KEY.getState(view.state);
        if (!pluginState) {
            throw new Error("no plugin");
        }
        return new TavenemInputView(node, view, getPos, tag);
    };
}

class HandlebarsView implements NodeView {
    dom: HTMLElement;
    private _innerView: EditorView | undefined;
    private _isEditing = false;
    private _renderElement: HTMLElement | undefined;
    private _srcElement: HTMLElement | undefined;

    constructor(
        public node: ProsemirrorNode,
        public view: EditorView,
        public getPos: () => number | undefined,
        private pluginKey: PluginKey<ITavenemPluginState>) {
        this.dom = document.createElement('handlebars-view');
        this.dom.classList.add('nested-editor-view');

        const openingBrackets = document.createElement('span');
        openingBrackets.classList.add('handlebars-bracket');
        openingBrackets.textContent = '{{';
        this.dom.appendChild(openingBrackets);

        this._renderElement = document.createElement('span');
        this._renderElement.classList.add('render');
        this.dom.appendChild(this._renderElement);

        this._srcElement = document.createElement('span');
        this._srcElement.spellcheck = false;
        this.dom.appendChild(this._srcElement);

        const closingBrackets = document.createElement('span');
        closingBrackets.classList.add('handlebars-bracket');
        closingBrackets.textContent = '}}';
        this.dom.appendChild(closingBrackets);

        this.dom.addEventListener('click', () => this.ensureFocus());

        this.render();
    }

    deselectNode() {
        this.dom.classList.remove("ProseMirror-selectednode");
        if (this._isEditing) {
            this.closeEditor();
        }
    }

    destroy() {
        this.closeEditor(false);

        if (this._renderElement) {
            this._renderElement.remove();
            delete this._renderElement;
        }
        if (this._srcElement) {
            this._srcElement.remove();
            delete this._srcElement;
        }

        this.dom.remove();
    }

    ignoreMutation() { return true; }

    render() {
        if (!this._renderElement) {
            return;
        }

        const contentString = this.node.content.firstChild
            ? this.node.content.firstChild.textContent
            : "";
        this._renderElement.textContent = contentString;
    }

    selectNode() {
        if (!this.view.editable) {
            return;
        }
        this.dom.classList.add("ProseMirror-selectednode");
        if (!this._isEditing) {
            this.openEditor();
        }
    }

    stopEvent(event: Event): boolean {
        return (this._innerView !== undefined)
            && (event.target !== undefined)
            && this._innerView.dom.contains(event.target as Node);
    }

    update(node: ProsemirrorNode) {
        if (!node.sameMarkup(this.node)) {
            return false;
        }
        this.node = node;

        if (this._innerView) {
            const state = this._innerView.state;

            const start = node.content.findDiffStart(state.doc.content);
            if (start != null) {
                const diff = node.content.findDiffEnd(state.doc.content as any);
                if (diff) {
                    let { a: endA, b: endB } = diff;
                    const overlap = start - Math.min(endA, endB);
                    if (overlap > 0) {
                        endA += overlap;
                        endB += overlap;
                    }
                    this._innerView.dispatch(state.tr
                        .replace(start, endB, node.slice(start, endA))
                        .setMeta("fromOutside", true));
                }
            }
        }

        if (!this._isEditing) {
            this.render();
        }

        return true;
    }

    private closeEditor(render: boolean = true) {
        if (this._innerView) {
            this._innerView.destroy();
            this._innerView = undefined;
        }

        if (render) {
            this.render();
        }
        this._isEditing = false;
    }

    private dispatchInner(tr: Transaction) {
        if (!this._innerView) {
            return;
        }
        const { state, transactions } = this._innerView.state.applyTransaction(tr);
        this._innerView.updateState(state);

        if (!tr.getMeta("fromOutside")) {
            const outerTr = this.view.state.tr,
                offsetMap = StepMap.offset(this.getPos()! + 1);
            for (let i = 0; i < transactions.length; i++) {
                const steps = transactions[i].steps;
                for (let j = 0; j < steps.length; j++) {
                    const mapped = steps[j].map(offsetMap);
                    if (!mapped) {
                        throw Error("step discarded!");
                    }
                    outerTr.step(mapped);
                }
            }
            if (outerTr.docChanged) {
                this.view.dispatch(outerTr);
            }
        }
    }

    private ensureFocus() {
        if (this._innerView && this.view.hasFocus()) {
            this._innerView.focus();
        }
    }

    private openEditor() {
        if (this._innerView) {
            console.warn("HandlebarsView editor already open when openEditor was called");
            return;
        }

        this._innerView = new EditorView(this._srcElement!, {
            state: EditorState.create({
                doc: this.node,
                plugins: [keymap({
                    "Backspace": chainCommands(deleteSelection, (state) => {
                        // default backspace behavior for non-empty selections
                        if (!state.selection.empty) {
                            return false;
                        }
                        // default backspace behavior when node is non-empty
                        if (this.node.textContent.length > 0) {
                            return false;
                        }
                        // delete the empty node and focus the outer view
                        this.view.dispatch(this.view.state.tr.insertText(""));
                        this.view.focus();
                        return true;
                    }),
                    "Ctrl-Backspace": () => {
                        // delete node and focus the outer view
                        this.view.dispatch(this.view.state.tr.insertText(""));
                        this.view.focus();
                        return true;
                    },
                    "Enter": chainCommands(newlineInCode, collapseCmd(this.view, +1, false)),
                    "Ctrl-Enter": collapseCmd(this.view, +1, false),
                    "ArrowLeft": collapseCmd(this.view, -1, true),
                    "ArrowRight": collapseCmd(this.view, +1, true),
                    "ArrowUp": collapseCmd(this.view, -1, true),
                    "ArrowDown": collapseCmd(this.view, +1, true),
                })]
            }),
            dispatchTransaction: this.dispatchInner.bind(this)
        })

        // focus element
        const innerState = this._innerView.state;
        this._innerView.focus();

        // request outer cursor position before node was selected
        const state = this.pluginKey.getState(this.view.state);
        const prevCursorPos = state?.prevCursorPos ?? 0;
        const selectionDirection = state?.selectionDirection ?? 0;

        // compute position that cursor should appear within the expanded node
        let innerPos = 0;
        const pos = this.getPos();
        if (pos != null
            && (prevCursorPos > pos
                || (prevCursorPos === pos
                    && selectionDirection < 0))) {
            innerPos = this.node.nodeSize - 2;
        }
        this._innerView.dispatch(
            innerState.tr.setSelection(
                TextSelection.create(innerState.doc, innerPos)
            )
        );

        this._isEditing = true;
    }
}

function createHandlebarsView(): NodeViewConstructor {
    return (node: ProsemirrorNode, view: EditorView, getPos: () => number | undefined) => {
        let pluginState = TAVENEM_PLUGIN_KEY.getState(view.state);
        if (!pluginState) {
            throw new Error("no plugin");
        }
        return new HandlebarsView(node, view, getPos, TAVENEM_PLUGIN_KEY);
    };
}

const tavenemPluginSpec: PluginSpec<ITavenemPluginState> = {
    key: TAVENEM_PLUGIN_KEY,
    state: {
        init(_config, _instance) {
            return {
                prevCursorPos: 0,
                selectionDirection: 0,
            };
        },
        apply(_tr, value, oldState, newState) {
            return {
                prevCursorPos: oldState.selection.from,
                selectionDirection: newState.selection.from !== oldState.selection.from
                    ? newState.selection.from - oldState.selection.from
                    : newState.selection.to === oldState.selection.to
                        ? value.selectionDirection
                        : newState.selection.to - oldState.selection.to,
            };
        },
        toJSON(value) {
            return JSON.stringify(value);
        },
        fromJSON(_config, value, _state) {
            const parsed = JSON.parse(value);
            return {
                prevCursorPos: typeof parsed.prevCursorPos === 'number'
                    ? parsed.prevCursorPos
                    : 0,
                selectionDirection: typeof parsed.selectionDirection === 'number'
                    ? parsed.selectionDirection
                    : 0,
            };
        },
    },
    props: {
        nodeViews: {
            'tfcheckbox': createCheckboxView(),
            'tfcolorinput': createInputView('tf-color-input'),
            'tfdatetimeinput': createInputView('tf-datetime-input'),
            'tfemoji': createIconView('tf-emoji'),
            'tfemojiinput': createInputView('tf-emoji-input'),
            'tficon': createIconView('tf-icon'),
            'tfinput': createInputView('tf-input'),
            'tfinputfield': createInputView('tf-input-field'),
            'tfnumericinput': createInputView('tf-numeric-input'),
            'tfselect': createInputView('tf-select'),
            'handlebars': createHandlebarsView(),
        }
    }
};
export const tavenemComponentPlugin = new Plugin(tavenemPluginSpec);

function collapseCmd(
    outerView: EditorView,
    dir: (1 | -1),
    requireOnBorder: boolean,
    requireEmptySelection: boolean = true,
): Command {
    // create a new ProseMirror command based on the input conditions
    return (innerState: EditorState, dispatch: ((tr: Transaction) => void) | undefined) => {
        // get selection info
        const outerState: EditorState = outerView.state;
        const { to: outerTo, from: outerFrom } = outerState.selection;
        const { to: innerTo, from: innerFrom } = innerState.selection;

        // only exit node when selection is empty
        if (requireEmptySelection && innerTo !== innerFrom) {
            return false;
        }
        const currentPos: number = (dir > 0) ? innerTo : innerFrom;

        // when requireOnBorder is TRUE, collapse only when cursor
        // is about to leave the bounds of the node
        if (requireOnBorder) {
            // (subtract two from nodeSize to account for start and end tokens)
            const nodeSize = innerState.doc.nodeSize - 2;

            // early return if exit conditions not met
            if (dir > 0 && currentPos < nodeSize) {
                return false;
            }
            if (dir < 0 && currentPos > 0) {
                return false;
            }
        }

        // all exit conditions met, so close the node by moving the cursor outside
        if (dispatch) {
            // set outer selection to be outside of the nodeview
            const targetPos: number = (dir > 0) ? outerTo : outerFrom;

            outerView.dispatch(
                outerState.tr.setSelection(
                    TextSelection.create(outerState.doc, targetPos)
                )
            );

            // must return focus to the outer view, otherwise no cursor will appear
            outerView.focus();
        }

        return true;
    }
}