import { Rectangle } from "pixi.js";
import { randomUUID } from "../../tavenem-utility";
import { DrawingMode, ImageEditor } from "./_image-editor";

interface DotNetStreamReference {
    arrayBuffer(): Promise<ArrayBuffer>;
}

export class TavenemImageEditorHtmlElement extends HTMLElement {
    static _brushColorDefault = "#000000";
    static _brushColorDefaultAlt = "#000";
    static _brushSizeDefault = 12;

    private _brushColor = TavenemImageEditorHtmlElement._brushColorDefault;
    private _brushSize = TavenemImageEditorHtmlElement._brushSizeDefault;
    private _editor?: ImageEditor;
    private _textColor = TavenemImageEditorHtmlElement._brushColorDefault;

    static get observedAttributes() {
        return ['data-aspect-ratio', 'src'];
    }

    private static newCropEvent(value: Rectangle) {
        return new CustomEvent('crop', {
            bubbles: true,
            composed: true,
            detail: {
                x: value.x,
                y: value.y,
                width: value.width,
                height: value.height,
            }
        });
    }

    private static newStreamEvent(value: Blob | null) {
        return new CustomEvent('stream', { bubbles: true, composed: true, detail: { value: value } });
    }

    private static newToggleEvent(value: boolean | null) {
        return new CustomEvent('inputtoggle', { bubbles: true, composed: true, detail: { value: value } });
    }

    connectedCallback() {
        const shadow = this.attachShadow({ mode: 'open', delegatesFocus: true });

        const style = document.createElement('style');
        style.innerHTML = `
:host {
    display: flex;
    flex-direction: column;
    gap: .25rem;
    position: relative;
}

* {
    font-family: var(--tavenem-font-family);
}

svg {
    fill: currentColor;
    flex-shrink: 0;
    height: 1em;
    width: auto;
}

.overlay {
    align-items: center;
    animation: tf-fadein ease 0.15s;
    -webkit-animation: tf-fadein ease 0.15s;
    -moz-animation: tf-fadein ease 0.15s;
    -o-animation: tf-fadein ease 0.15s;
    -webkit-backdrop-filter: blur(3px);
    backdrop-filter: blur(3px);
    background-color: rgba(33, 33, 33, 0.5);
    border-style: none;
    border-radius: inherit;
    bottom: 0;
    display: none;
    height: 100%;
    left: 0;
    margin: 0;
    justify-content: center;
    overflow: hidden;
    padding: 1rem;
    position: absolute;
    right: 0;
    top: 0;
    transition: .3s cubic-bezier(.25,.8,.5,1),z-index 1ms;
    user-select: none;
    width: 100%;
    z-index: var(--tavenem-zindex-overlay);

    &:hover {
        cursor: default;
    }

    .show {
        display: flex;
    }

    @media print {
        display: none;
    }
}

.vr {
    align-self: stretch;
    background-color: var(--tavenem-color-divider);
    display: inline-block;
    min-height: 1rem;
    vertical-align: text-top;
    width: 1px;

    .dark {
        background-color: var(--tavenem-light-color-divider);
    }

    .light {
        background-color: var(--tavenem-dark-color-divider);
    }
}

button {
    align-items: center;
    background-color: transparent;
    border-color: var(--tavenem-color-border);
    border-radius: 9999px;
    border-style: none;
    box-sizing: border-box;
    color: inherit;
    cursor: pointer;
    display: inline-flex;
    flex: 0 0 auto;
    font-size: 1.5rem;
    font-weight: var(--tavenem-font-weight-semibold);
    gap: .25rem;
    justify-content: center;
    line-height: 1;
    margin: 0;
    min-width: calc(var(--tavenem-font-size-button) + 12px);
    outline: 0;
    overflow: hidden;
    padding: 6px;
    position: relative;
    text-align: center;
    text-decoration: none;
    text-transform: var(--tavenem-texttransform-button);
    transition: background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
    user-select: none;
    vertical-align: middle;
    -moz-appearance: none;
    -webkit-appearance: none;
    -webkit-tap-highlight-color: transparent;

    &:after {
        background-image: radial-gradient(circle,#000 10%,transparent 10.01%);
        background-position: 50%;
        background-repeat: no-repeat;
        content: "";
        display: block;
        height: 100%;
        left: 0;
        opacity: 0;
        pointer-events: none;
        position: absolute;
        top: 0;
        transform: scale(7,7);
        transition: transform .3s,opacity 1s;
        width: 100%;
    }

    &:focus:not(:focus-visible) {
        outline: 0;
    }

    &:hover,
    &:focus-visible {
        background-color: var(--tavenem-color-action-hover-bg);
    }

    &:active:after {
        transform: scale(0,0);
        opacity: .1;
        transition: 0s;
    }

    .active {
        --tavenem-theme-color-bg-alt: var(--tavenem-theme-color-darken);
        --button-active-shadow: 0px 5px 5px -3px rgba(0, 0, 0, 0.2), 0px 8px 10px 1px rgba(0, 0, 0, 0.14), 0px 3px 14px 2px rgba(0,0,0,.12);
        --button-bg: var(--tavenem-theme-color, var(--tavenem-color-default));
        --button-color: var(--tavenem-theme-color-text, var(--tavenem-color-default-text));
        --button-hover-bg: var(--tavenem-theme-color-darken, var(--tavenem-color-default-darken));
        --button-hover-color: var(--tavenem-theme-color-text, var(--tavenem-color-default-text));
        --button-hover-shadow: 0px 2px 4px -1px rgba(0, 0, 0, 0.2), 0px 4px 5px 0px rgba(0, 0, 0, 0.14), 0px 1px 10px 0px rgba(0,0,0,.12);
        --button-shadow: 0px 3px 1px -2px rgba(0,0,0,0.2),0px 2px 2px 0px rgba(0,0,0,0.14),0px 1px 5px 0px rgba(0,0,0,0.12);
        background-color: var(--button-bg);
        color: var(--button-color);

        &:disabled, &.disabled, &[inert], [inert] & {
            --button-bg: var(--tavenem-color-action-disabled-bg);
            background-color: var(--tavenem-color-action-disabled-bg);
        }
    }
}

.button-group {
    --button-inherited-active-shadow: none;
    --button-inherited-bg: transparent;
    --button-inherited-border-style: none;
    --button-inherited-color: var(--tavenem-color-text);
    --button-inherited-font-size: calc(var(--tavenem-font-size-button) - 1px);
    --button-inherited-font-size-icon: 1.25rem;
    --button-inherited-hover-bg: var(--tavenem-color-action-hover-bg);
    --button-inherited-hover-color: var(--tavenem-color-action);
    --button-inherited-hover-shadow: none;
    --button-inherited-padding-x: 5px;
    --button-inherited-padding-y: 4px;
    --button-inherited-padding-y-icon: 5px;
    --button-inherited-shadow: none;
    background-color: transparent;
    border-radius: var(--tavenem-border-radius);
    display: inline-flex;

    > button,
    > tf-dropdown > button {
        border-bottom-left-radius: inherit;
        border-top-left-radius: inherit;

        &:not(:last-child) {
            border-bottom-right-radius: 0;
            border-top-right-radius: 0;
        }

        &:last-child {
            border-bottom-right-radius: inherit;
            border-top-right-radius: inherit;
        }

        + button,
        + tf-dropdown > button {
            border-bottom-left-radius: 0;
            border-top-left-radius: 0;
            border-left-style: solid;
            margin-left: -1px;
        }
    }
}

.list {
    --list-active-bg: var(--tavenem-color-primary-hover);
    --list-active-color: var(--tavenem-color-primary);
    --list-active-hover-bg: var(--tavenem-color-primary-hover-bright);
    --list-color: var(--tavenem-theme-color-text, var(--tavenem-color-default-text));
    --list-hover-bg: var(--tavenem-color-primary-hover);
    --tavenem-theme-color-bg-alt: var(--tavenem-theme-color-darken);
    background-color: var(--tavenem-theme-color, var(--tavenem-color-default));
    color: var(--list-color);
    display: flex;
    flex-direction: column;
    list-style: none;
    margin: 0;
    overflow: auto;
    padding-bottom: .25em;
    padding-left: .75em;
    padding-right: .75em;
    padding-top: .25em;
    position: relative;
    scrollbar-gutter: stable;
    transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;

    > * {
        align-items: center;
        background-color: transparent;
        border: 0;
        border-radius: 0;
        box-sizing: border-box;
        color: inherit;
        column-gap: .5em;
        cursor: pointer;
        display: flex;
        flex: 0 0 auto;
        flex-wrap: wrap;
        justify-content: flex-start;
        list-style: none;
        margin: 0;
        outline: 0;
        overflow: hidden;
        padding-bottom: .25em;
        padding-inline-end: .25em;
        padding-inline-start: .25em;
        padding-top: .25em;
        position: relative;
        text-align: start;
        text-decoration: none;
        transition: background-color 150ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
        user-select: none;
        vertical-align: middle;
        -webkit-appearance: none;
        -webkit-tap-highlight-color: transparent;

        &:focus-visible, &:hover {
            background-color: transparent;
            color: inherit;
        }

        &:after {
            background-image: radial-gradient(circle,#000 10%,transparent 10.01%);
            background-position: 50%;
            background-repeat: no-repeat;
            content: "";
            display: block;
            height: 100%;
            left: 0;
            opacity: 0;
            pointer-events: none;
            position: absolute;
            top: 0;
            transform: scale(10,10);
            transition: transform .3s,opacity 1s;
            width: 100%;
        }

        &:active:after {
            transform: scale(0,0);
            opacity: .1;
            transition: 0s;
        }

        &.active {
            border-inline-end: 1px solid var(--list-active-color);
            padding-inline-end: calc(1em - 1px);
        }

        &:hover,
        &:focus:not(.active) {
            &:not(:disabled, .disabled) {
                background-color: var(--list-hover-bg);

                &.active {
                    background-color: var(--list-active-hover-bg);
                }
            }
        }
    }

    > .active {
        background-color: var(--list-active-bg);
        border-inline-end: 1px solid var(--list-active-color);
        color: var(--list-active-color);
        padding-inline-end: calc(1em - 1px);
    }

    svg {
        font-size: 1.25em;
    }

    .selected-icon {
        visibility: hidden;
    }

    .active > .selected-icon {
        visibility: visible;
    }
}

.image-edit-button {
    opacity: .5;
    position: absolute;
    right: .25rem;
    top: .25rem;
}

:host([data-hide-edit]) .image-edit-button,
.image-edit-button.editing,
:host(:not([data-edit-no-image])) .image-edit-button.no-image {
    display: none;
}

.image-editor-container {
    display: grid;
    place-items: center;
}

.image-editor-controls {
    display: none;
    flex-direction: column;
    flex-wrap: wrap;
    gap: .5rem;
}

.image-editor-controls.editing {
    display: flex;
}

.image-editor-toolbar {
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: .5rem;
    justify-content: space-between;
}

.cropping-tools {
    display: none;
}

.cropping .cropping-tools {
    display: flex;
}

.cropping > *:not(.cropping-tools) {
    display: none;
}

.format svg.active {
    display: none;
}

.format.active svg.active {
    display: initial;
}

.brush-size-container {
    align-items: center;
    display: inline-flex;
    gap: .5rem;
}

.drawing-tool {
    display: none;
}

.text-tool {
    display: none;
}

.erasing-tool {
    display: none;
}

[data-drawing-mode="1"] .drawing-tool {
    display: initial;
}

[data-erasing] .erasing-tool {
    display: initial;
}

[data-text-mode] .text-tool {
    display: initial;
}

[data-text-mode] :not(.text-tool) {
    display: none;
}

[data-erasing] .non-erasing-tool {
    display: none;
}

[data-drawing-mode="1"] :not(.drawing-tool) {
    display: none;
}
`;
        shadow.appendChild(style);

        const overlay = document.createElement('div');
        overlay.classList.add('overlay');
        shadow.appendChild(overlay);

        const progress = document.createElement('tf-progress-circle');
        overlay.appendChild(progress);

        const editButton = document.createElement('button');
        editButton.classList.add('image-edit-button');
        editButton.ariaLabel = 'edit';
        shadow.appendChild(editButton);
        editButton.addEventListener('click', this.startEdit.bind(this));

        const editButtonIcon = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
        editButton.appendChild(editButtonIcon);
        editButtonIcon.outerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M120-120v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm584-528 56-56-56-56-56 56 56 56Z"/></svg>`;

        const container = document.createElement('div');
        container.classList.add('image-editor-container');
        shadow.appendChild(container);

        const controls = document.createElement('div');
        controls.classList.add('image-editor-controls');
        shadow.appendChild(controls);

        const croppingTools = document.createElement('div');
        croppingTools.classList.add('image-editor-toolbar', 'cropping-tools');
        croppingTools.role = 'toolbar';
        croppingTools.ariaLabel = 'cropping toolbar';
        controls.appendChild(croppingTools);

        const cropButton = document.createElement('button');
        cropButton.classList.add('crop-button');
        cropButton.ariaLabel = 'crop';
        cropButton.role = 'menuitem';
        croppingTools.appendChild(cropButton);
        cropButton.addEventListener('click', this.startCrop.bind(this));

        const cropButtonIcon = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
        cropButton.appendChild(cropButtonIcon);
        cropButtonIcon.outerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M680-40v-160H280q-33 0-56.5-23.5T200-280v-400H40v-80h160v-160h80v640h640v80H760v160h-80Zm0-320v-320H360v-80h320q33 0 56.5 23.5T760-680v320h-80Z"/></svg>`;

        const cropTooltip = document.createElement('tf-tooltip');
        cropTooltip.textContent = 'crop';
        cropButton.appendChild(cropTooltip);

        const separator1 = document.createElement('div');
        separator1.classList.add('vr');
        separator1.role = 'separator';
        separator1.ariaOrientation = 'vertical';
        croppingTools.appendChild(separator1);

        const cancelCropButton = document.createElement('button');
        cropButton.classList.add('cancel-crop-button');
        cancelCropButton.ariaLabel = 'cancel crop';
        cancelCropButton.role = 'menuitem';
        croppingTools.appendChild(cancelCropButton);
        cancelCropButton.addEventListener('click', this.cancel.bind(this));

        const cancelCropButtonIcon = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
        cancelCropButton.appendChild(cancelCropButtonIcon);
        cancelCropButtonIcon.outerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="m336-280 144-144 144 144 56-56-144-144 144-144-56-56-144 144-144-144-56 56 144 144-144 144 56 56ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z"/></svg>`;

        const cancelCropTooltip = document.createElement('tf-tooltip');
        cancelCropTooltip.textContent = 'cancel crop';
        cancelCropButton.appendChild(cancelCropTooltip);

        if (!('hideAspectRatio' in this.dataset)) {
            const separator2 = document.createElement('div');
            separator2.classList.add('vr');
            separator2.role = 'separator';
            separator2.ariaOrientation = 'vertical';
            croppingTools.appendChild(separator2);

            const aspectRatioGroup = document.createElement('div');
            aspectRatioGroup.classList.add('button-group');
            aspectRatioGroup.role = 'group';
            aspectRatioGroup.ariaLabel = 'aspect ratio group';
            croppingTools.appendChild(aspectRatioGroup);

            const freeCropButton = document.createElement('button');
            freeCropButton.classList.add('aspect-ratio-button', 'free-crop-button', 'active');
            freeCropButton.ariaLabel = 'free crop';
            freeCropButton.role = 'menuitem';
            aspectRatioGroup.appendChild(freeCropButton);
            freeCropButton.addEventListener('click', this.setCropAspectRatio.bind(this, null));

            const freeCropButtonIcon = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
            freeCropButton.appendChild(freeCropButtonIcon);
            freeCropButtonIcon.outerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M200-120q-33 0-56.5-23.5T120-200v-160h80v160h160v80H200Zm400 0v-80h160v-160h80v160q0 33-23.5 56.5T760-120H600ZM120-600v-160q0-33 23.5-56.5T200-840h160v80H200v160h-80Zm640 0v-160H600v-80h160q33 0 56.5 23.5T840-760v160h-80Z"/></svg>`;

            const freeCropTooltip = document.createElement('tf-tooltip');
            freeCropTooltip.textContent = 'free crop';
            freeCropButton.appendChild(freeCropTooltip);

            const originalCropButton = document.createElement('button');
            originalCropButton.classList.add('aspect-ratio-button');
            originalCropButton.dataset.aspectRatio = '-1';
            originalCropButton.ariaLabel = 'original aspect ratio';
            originalCropButton.role = 'menuitem';
            aspectRatioGroup.appendChild(originalCropButton);
            originalCropButton.addEventListener('click', this.setCropAspectRatio.bind(this, -1));

            const originalCropButtonIcon = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
            originalCropButton.appendChild(originalCropButtonIcon);
            originalCropButtonIcon.outerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M560-280h200v-200h-80v120H560v80ZM200-480h80v-120h120v-80H200v200Zm-40 320q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Z"/></svg>`;

            const originalCropTooltip = document.createElement('tf-tooltip');
            originalCropTooltip.textContent = 'original aspect ratio';
            originalCropButton.appendChild(originalCropTooltip);

            const squareCropButton = document.createElement('button');
            squareCropButton.classList.add('aspect-ratio-button');
            squareCropButton.dataset.aspectRatio = '1';
            squareCropButton.ariaLabel = 'square';
            squareCropButton.role = 'menuitem';
            aspectRatioGroup.appendChild(squareCropButton);
            squareCropButton.addEventListener('click', this.setCropAspectRatio.bind(this, 1));

            const squareCropButtonIcon = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
            squareCropButton.appendChild(squareCropButtonIcon);
            squareCropButtonIcon.outerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Z"/></svg>`;

            const squareCropTooltip = document.createElement('tf-tooltip');
            squareCropTooltip.textContent = 'square';
            squareCropButton.appendChild(squareCropTooltip);

            const five4CropButton = document.createElement('button');
            five4CropButton.classList.add('aspect-ratio-button');
            five4CropButton.dataset.aspectRatio = '1.25';
            five4CropButton.ariaLabel = '5:4 aspect ratio';
            five4CropButton.role = 'menuitem';
            aspectRatioGroup.appendChild(five4CropButton);
            five4CropButton.addEventListener('click', this.setCropAspectRatio.bind(this, 1.25));

            const five4CropButtonIcon = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
            five4CropButton.appendChild(five4CropButtonIcon);
            five4CropButtonIcon.outerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M200-160q-33 0-56.5-23.5T120-240v-480q0-33 23.5-56.5T200-800h560q33 0 56.5 23.5T840-720v480q0 33-23.5 56.5T760-160H200Z"/></svg>`;

            const five4CropTooltip = document.createElement('tf-tooltip');
            five4CropTooltip.textContent = '5:4';
            five4CropButton.appendChild(five4CropTooltip);

            const four3CropButton = document.createElement('button');
            four3CropButton.classList.add('aspect-ratio-button');
            four3CropButton.dataset.aspectRatio = '1.333333';
            four3CropButton.ariaLabel = '4:3 aspect ratio';
            four3CropButton.role = 'menuitem';
            aspectRatioGroup.appendChild(four3CropButton);
            four3CropButton.addEventListener('click', this.setCropAspectRatio.bind(this, 4 / 3));

            const four3CropButtonIcon = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
            four3CropButton.appendChild(four3CropButtonIcon);
            four3CropButtonIcon.outerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Z"/></svg>`;

            const four3CropTooltip = document.createElement('tf-tooltip');
            four3CropTooltip.textContent = '4:3';
            four3CropButton.appendChild(four3CropTooltip);

            const three2CropButton = document.createElement('button');
            three2CropButton.classList.add('aspect-ratio-button');
            three2CropButton.dataset.aspectRatio = '1.5';
            three2CropButton.ariaLabel = '3:2 aspect ratio';
            three2CropButton.role = 'menuitem';
            aspectRatioGroup.appendChild(three2CropButton);
            three2CropButton.addEventListener('click', this.setCropAspectRatio.bind(this, 1.5));

            const three2CropButtonIcon = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
            three2CropButton.appendChild(three2CropButtonIcon);
            three2CropButtonIcon.outerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M200-240q-33 0-56.5-23.5T120-320v-320q0-33 23.5-56.5T200-720h560q33 0 56.5 23.5T840-640v320q0 33-23.5 56.5T760-240H200Z"/></svg>`;

            const three2CropTooltip = document.createElement('tf-tooltip');
            three2CropTooltip.textContent = '3:2';
            three2CropButton.appendChild(three2CropTooltip);

            const sixteen9CropButton = document.createElement('button');
            sixteen9CropButton.classList.add('aspect-ratio-button');
            sixteen9CropButton.dataset.aspectRatio = '1.777778';
            sixteen9CropButton.ariaLabel = '16:9 aspect ratio';
            sixteen9CropButton.role = 'menuitem';
            aspectRatioGroup.appendChild(sixteen9CropButton);
            sixteen9CropButton.addEventListener('click', this.setCropAspectRatio.bind(this, 16 / 9));

            const sixteen9CropButtonIcon = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
            sixteen9CropButton.appendChild(sixteen9CropButtonIcon);
            sixteen9CropButtonIcon.outerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M200-280q-33 0-56.5-23.5T120-360v-240q0-33 23.5-56.5T200-680h560q33 0 56.5 23.5T840-600v240q0 33-23.5 56.5T760-280H200Z"/></svg>`;

            const sixteen9CropTooltip = document.createElement('tf-tooltip');
            sixteen9CropTooltip.textContent = '16:9';
            sixteen9CropButton.appendChild(sixteen9CropTooltip);

            const seven5CropButton = document.createElement('button');
            seven5CropButton.classList.add('aspect-ratio-button');
            seven5CropButton.dataset.aspectRatio = '1.4';
            seven5CropButton.ariaLabel = '7:5 aspect ratio';
            seven5CropButton.role = 'menuitem';
            aspectRatioGroup.appendChild(seven5CropButton);
            seven5CropButton.addEventListener('click', this.setCropAspectRatio.bind(this, 1.4));

            const seven5CropButtonIcon = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
            seven5CropButton.appendChild(seven5CropButtonIcon);
            seven5CropButtonIcon.outerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M200-200q-33 0-56.5-23.5T120-280v-400q0-33 23.5-56.5T200-760h560q33 0 56.5 23.5T840-680v400q0 33-23.5 56.5T760-200H200Z"/></svg>`;

            const seven5CropTooltip = document.createElement('tf-tooltip');
            seven5CropTooltip.textContent = '7:5';
            seven5CropButton.appendChild(seven5CropTooltip);

            const three4CropButton = document.createElement('button');
            three4CropButton.classList.add('aspect-ratio-button');
            three4CropButton.dataset.aspectRatio = '0.75';
            three4CropButton.ariaLabel = '3:4 aspect ratio';
            three4CropButton.role = 'menuitem';
            aspectRatioGroup.appendChild(three4CropButton);
            three4CropButton.addEventListener('click', this.setCropAspectRatio.bind(this, 0.75));

            const three4CropButtonIcon = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
            three4CropButton.appendChild(three4CropButtonIcon);
            three4CropButtonIcon.outerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M720-80H240q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h480q33 0 56.5 23.5T800-800v640q0 33-23.5 56.5T720-80Z"/></svg>`;

            const three4CropTooltip = document.createElement('tf-tooltip');
            three4CropTooltip.textContent = '3:4';
            three4CropButton.appendChild(three4CropTooltip);
        }

        const fileTools = document.createElement('div');
        fileTools.classList.add('image-editor-toolbar');
        fileTools.role = 'toolbar';
        fileTools.ariaLabel = 'file toolbar';
        controls.appendChild(fileTools);

        const historyGroup = document.createElement('div');
        historyGroup.classList.add('button-group');
        historyGroup.role = 'group';
        historyGroup.ariaLabel = 'history group';
        fileTools.appendChild(historyGroup);

        const undoButton = document.createElement('button');
        undoButton.classList.add('undo-button');
        undoButton.ariaLabel = 'undo';
        undoButton.disabled = true;
        undoButton.role = 'menuitem';
        historyGroup.appendChild(undoButton);
        undoButton.addEventListener('click', this.undo.bind(this));

        const undoButtonIcon = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
        undoButton.appendChild(undoButtonIcon);
        undoButtonIcon.outerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M280-200v-80h284q63 0 109.5-40T720-420q0-60-46.5-100T564-560H312l104 104-56 56-200-200 200-200 56 56-104 104h252q97 0 166.5 63T800-420q0 94-69.5 157T564-200H280Z"/></svg>`;

        const undoTooltip = document.createElement('tf-tooltip');
        undoTooltip.textContent = 'undo';
        undoButton.appendChild(undoTooltip);

        const redoButton = document.createElement('button');
        redoButton.classList.add('redo-button');
        redoButton.ariaLabel = 'redo';
        redoButton.disabled = true;
        redoButton.role = 'menuitem';
        historyGroup.appendChild(redoButton);
        redoButton.addEventListener('click', this.redo.bind(this));

        const redoButtonIcon = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
        redoButton.appendChild(redoButtonIcon);
        redoButtonIcon.outerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M396-200q-97 0-166.5-63T160-420q0-94 69.5-157T396-640h252L544-744l56-56 200 200-200 200-56-56 104-104H396q-63 0-109.5 40T240-420q0 60 46.5 100T396-280h284v80H396Z"/></svg>`;

        const redoTooltip = document.createElement('tf-tooltip');
        redoTooltip.textContent = 'redo';
        redoButton.appendChild(redoTooltip);

        const separator3 = document.createElement('div');
        separator3.classList.add('vr');
        separator3.role = 'separator';
        separator3.ariaOrientation = 'vertical';
        fileTools.appendChild(separator3);

        const saveGroup = document.createElement('div');
        const saveGroupId = randomUUID();
        saveGroup.id = saveGroupId;
        saveGroup.classList.add('button-group');
        saveGroup.role = 'group';
        saveGroup.ariaLabel = 'save group';
        fileTools.appendChild(saveGroup);

        if (!('no-save' in this.dataset)) {
            const saveButton = document.createElement('button');
            saveButton.classList.add('save-button');
            saveButton.ariaLabel = 'save';
            saveButton.disabled = true;
            saveGroup.appendChild(saveButton);
            saveButton.addEventListener('click', this.save.bind(this, null, null));

            const saveButtonIcon = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
            saveButton.appendChild(saveButtonIcon);
            saveButtonIcon.outerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M840-680v480q0 33-23.5 56.5T760-120H200q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h480l160 160ZM480-240q50 0 85-35t35-85q0-50-35-85t-85-35q-50 0-85 35t-35 85q0 50 35 85t85 35ZM240-560h360v-160H240v160Z"/></svg>`;

            const saveTooltip = document.createElement('tf-tooltip');
            saveTooltip.textContent = 'save';
            saveButton.appendChild(saveTooltip);
        }

        const downloadButton = document.createElement('button');
        downloadButton.classList.add('download-button');
        downloadButton.ariaLabel = 'download';
        downloadButton.disabled = true;
        downloadButton.role = 'menuitem';
        saveGroup.appendChild(downloadButton);
        downloadButton.addEventListener('click', this.exportImage.bind(this, null, null));

        const downloadButtonIcon = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
        downloadButton.appendChild(downloadButtonIcon);
        downloadButtonIcon.outerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M480-320 280-520l56-58 104 104v-326h80v326l104-104 56 58-200 200ZM240-160q-33 0-56.5-23.5T160-240v-120h80v120h480v-120h80v120q0 33-23.5 56.5T720-160H240Z"/></svg>`;

        const downloadTooltip = document.createElement('tf-tooltip');
        downloadTooltip.textContent = 'download';
        downloadButton.appendChild(downloadTooltip);

        if (!('hide-formats' in this.dataset)) {
            const formatDropdown = document.createElement('tf-dropdown');
            formatDropdown.dataset.activation = '1'; // left-click
            formatDropdown.dataset.popoverContainer = '';
            saveGroup.appendChild(formatDropdown);

            const dropdownButton = document.createElement('button');
            dropdownButton.role = 'menuitem';
            dropdownButton.ariaHasPopup = 'menu';
            dropdownButton.tabIndex = -1;
            formatDropdown.appendChild(dropdownButton);

            const dropdownButtonIcon = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
            dropdownButton.appendChild(dropdownButtonIcon);
            dropdownButtonIcon.outerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M480-360 280-560h400L480-360Z"/></svg>`;

            const dropdownButtonTooltip = document.createElement('tf-tooltip');
            dropdownButtonTooltip.textContent = 'save format';
            dropdownButton.appendChild(dropdownButtonTooltip);

            const dropdownPopover = document.createElement('tf-popover');
            dropdownPopover.classList.add('top-left', 'flip-onopen', 'select-popover', 'filled', 'match-width');
            dropdownPopover.classList.add('anchor-bottom-left');
            dropdownPopover.dataset.anchorId = saveGroupId;
            dropdownPopover.style.maxHeight = 'min(300px,90vh)';
            dropdownPopover.style.overflowY = 'auto';
            dropdownPopover.tabIndex = 0;
            formatDropdown.appendChild(dropdownPopover);

            const list = document.createElement('div');
            list.classList.add('list');
            dropdownPopover.appendChild(list);

            const pngSpan = document.createElement('span');
            pngSpan.classList.add('format', 'active');
            pngSpan.dataset.format = 'image/png';
            pngSpan.tabIndex = -1;
            pngSpan.role = 'menuitem';
            pngSpan.ariaLabel = 'PNG';
            list.appendChild(pngSpan);
            pngSpan.addEventListener('mousedown', this.preventDefault);
            pngSpan.addEventListener('mouseup', this.setFormat.bind(this, "image/png"));

            const pngActiveIcon = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
            pngActiveIcon.classList.add('selected-icon');
            pngSpan.appendChild(pngActiveIcon);
            pngActiveIcon.outerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/></svg>`;

            const pngInnerSpan = document.createElement('span');
            pngInnerSpan.textContent = 'PNG';
            pngSpan.appendChild(pngInnerSpan);

            const jpegSpan = document.createElement('span');
            jpegSpan.classList.add('format');
            jpegSpan.dataset.format = 'image/jpeg';
            jpegSpan.tabIndex = -1;
            jpegSpan.role = 'menuitem';
            jpegSpan.ariaLabel = 'JPEG';
            list.appendChild(jpegSpan);
            jpegSpan.addEventListener('mousedown', this.preventDefault);
            jpegSpan.addEventListener('mouseup', this.setFormat.bind(this, "image/jpeg"));

            const jpegActiveIcon = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
            jpegActiveIcon.classList.add('selected-icon');
            jpegSpan.appendChild(jpegActiveIcon);
            jpegActiveIcon.outerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/></svg>`;

            const jpegInnerSpan = document.createElement('span');
            jpegInnerSpan.textContent = 'JPEG';
            jpegSpan.appendChild(jpegInnerSpan);

            const webpSpan = document.createElement('span');
            webpSpan.classList.add('format');
            webpSpan.dataset.format = 'image/webp';
            webpSpan.tabIndex = -1;
            webpSpan.role = 'menuitem';
            webpSpan.ariaLabel = 'WebP';
            list.appendChild(webpSpan);
            webpSpan.addEventListener('mousedown', this.preventDefault);
            webpSpan.addEventListener('mouseup', this.setFormat.bind(this, "image/webp"));

            const webpActiveIcon = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
            webpActiveIcon.classList.add('selected-icon');
            webpSpan.appendChild(webpActiveIcon);
            webpActiveIcon.outerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/></svg>`;

            const webpInnerSpan = document.createElement('span');
            webpInnerSpan.textContent = 'WebP';
            webpSpan.appendChild(webpInnerSpan);
        }

        const separator4 = document.createElement('div');
        separator4.classList.add('vr');
        separator4.role = 'separator';
        separator4.ariaOrientation = 'vertical';
        fileTools.appendChild(separator4);

        const cancelEditButton = document.createElement('button');
        cancelEditButton.classList.add('cancel-edit-button');
        cancelEditButton.ariaLabel = 'cancel edit';
        cancelEditButton.role = 'menuitem';
        fileTools.appendChild(cancelEditButton);
        cancelEditButton.addEventListener('click', this.destroy.bind(this, false));

        const cancelEditButtonIcon = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
        cancelEditButton.appendChild(cancelEditButtonIcon);
        cancelEditButtonIcon.outerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="m336-280 144-144 144 144 56-56-144-144 144-144-56-56-144 144-144-144-56 56 144 144-144 144 56 56ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z"/></svg>`;

        const cancelEditTooltip = document.createElement('tf-tooltip');
        cancelEditTooltip.textContent = 'cancel edit';
        cancelEditButton.appendChild(cancelEditTooltip);

        if (!('hide-crop' in this.dataset)
            || !('hide-flip' in this.dataset)
            || !('hide-rotate' in this.dataset)
            || !('hide-drawing' in this.dataset)) {
            const manipulationTools = document.createElement('div');
            manipulationTools.classList.add('image-editor-toolbar');
            manipulationTools.role = 'toolbar';
            manipulationTools.ariaLabel = 'image manipulation toolbar';
            controls.appendChild(manipulationTools);

            if (!('hide-rotate' in this.dataset)
                || !('hide-rotate' in this.dataset)) {
                const transformGroup = document.createElement('div');
                transformGroup.classList.add('button-group');
                transformGroup.role = 'group';
                transformGroup.ariaLabel = 'transform group';
                manipulationTools.appendChild(transformGroup);

                if (!('hide-rotate' in this.dataset)) {
                    const rotateLeftButton = document.createElement('button');
                    rotateLeftButton.classList.add('rotate-left-button');
                    rotateLeftButton.ariaLabel = 'rotate left';
                    transformGroup.appendChild(rotateLeftButton);
                    rotateLeftButton.addEventListener('click', this.rotateCounterClockwise.bind(this));

                    const rotateLeftButtonIcon = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
                    rotateLeftButton.appendChild(rotateLeftButtonIcon);
                    rotateLeftButtonIcon.outerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M440-80q-50-5-96-24.5T256-156l56-58q29 21 61.5 34t66.5 18v82Zm80 0v-82q104-15 172-93.5T760-438q0-117-81.5-198.5T480-718h-8l64 64-56 56-160-160 160-160 56 58-62 62h6q75 0 140.5 28.5t114 77q48.5 48.5 77 114T840-438q0 137-91 238.5T520-80ZM198-214q-32-42-51.5-88T122-398h82q5 34 18 66.5t34 61.5l-58 56Zm-76-264q6-51 25-98t51-86l58 56q-21 29-34 61.5T204-478h-82Z"/></svg>`;

                    const rotateLeftTooltip = document.createElement('tf-tooltip');
                    rotateLeftTooltip.textContent = 'rotate left';
                    rotateLeftButton.appendChild(rotateLeftTooltip);

                    const rotateRightButton = document.createElement('button');
                    rotateRightButton.classList.add('rotate-right-button');
                    rotateRightButton.ariaLabel = 'rotate right';
                    transformGroup.appendChild(rotateRightButton);
                    rotateRightButton.addEventListener('click', this.rotateClockwise.bind(this));

                    const rotateRightButtonIcon = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
                    rotateRightButton.appendChild(rotateRightButtonIcon);
                    rotateRightButtonIcon.outerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M522-80v-82q34-5 66.5-18t61.5-34l56 58q-42 32-88 51.5T522-80Zm-80 0Q304-98 213-199.5T122-438q0-75 28.5-140.5t77-114q48.5-48.5 114-77T482-798h6l-62-62 56-58 160 160-160 160-56-56 64-64h-8q-117 0-198.5 81.5T202-438q0 104 68 182.5T442-162v82Zm322-134-58-56q21-29 34-61.5t18-66.5h82q-5 50-24.5 96T764-214Zm76-264h-82q-5-34-18-66.5T706-606l58-56q32 39 51 86t25 98Z"/></svg>`;

                    const rotateRightTooltip = document.createElement('tf-tooltip');
                    rotateRightTooltip.textContent = 'rotate right';
                    rotateRightButton.appendChild(rotateRightTooltip);
                }

                if (!('hide-flip' in this.dataset)) {
                    const flipHorizontalButton = document.createElement('button');
                    flipHorizontalButton.classList.add('flip-horizontal-button');
                    flipHorizontalButton.ariaLabel = 'flip horizontally';
                    transformGroup.appendChild(flipHorizontalButton);
                    flipHorizontalButton.addEventListener('click', this.flipHorizontal.bind(this));

                    const flipHorizontalButtonIcon = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
                    flipHorizontalButton.appendChild(flipHorizontalButtonIcon);
                    flipHorizontalButtonIcon.outerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M280-160 80-360l200-200 56 57-103 103h287v80H233l103 103-56 57Zm400-240-56-57 103-103H440v-80h287L624-743l56-57 200 200-200 200Z"/></svg>`;

                    const flipHorizontalTooltip = document.createElement('tf-tooltip');
                    flipHorizontalTooltip.textContent = 'flip horizontally';
                    flipHorizontalButton.appendChild(flipHorizontalTooltip);

                    const flipVerticalButton = document.createElement('button');
                    flipVerticalButton.classList.add('flip-vertical-button');
                    flipVerticalButton.ariaLabel = 'flip vertically';
                    transformGroup.appendChild(flipVerticalButton);
                    flipVerticalButton.addEventListener('click', this.flipVertical.bind(this));

                    const flipVerticalButtonIcon = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
                    flipVerticalButton.appendChild(flipVerticalButtonIcon);
                    flipVerticalButtonIcon.outerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M320-440v-287L217-624l-57-56 200-200 200 200-57 56-103-103v287h-80ZM600-80 400-280l57-56 103 103v-287h80v287l103-103 57 56L600-80Z"/></svg>`;

                    const flipVerticalTooltip = document.createElement('tf-tooltip');
                    flipVerticalTooltip.textContent = 'flip vertically';
                    flipVerticalButton.appendChild(flipVerticalTooltip);
                }
            }

            if (!('hide-crop' in this.dataset)
                || !('hide-drawing' in this.dataset)) {
                if (!('hide-rotate' in this.dataset)
                    || !('hide-flip' in this.dataset)) {
                    const separator7 = document.createElement('div');
                    separator7.classList.add('vr');
                    separator7.role = 'separator';
                    separator7.ariaOrientation = 'vertical';
                    manipulationTools.appendChild(separator7);
                }

                if (!('hide-drawing' in this.dataset)) {
                    const drawingTools = document.createElement('div');
                    drawingTools.classList.add('image-editor-toolbar', 'drawing-toolbar');
                    drawingTools.role = 'toolbar';
                    drawingTools.ariaLabel = 'drawing toolbar';
                    manipulationTools.appendChild(drawingTools);

                    const cancelEraseButton = document.createElement('button');
                    cancelEraseButton.classList.add('cancel-erase-button', 'drawing-tool', 'erasing-tool');
                    cancelEraseButton.ariaLabel = 'draw';
                    cancelEraseButton.role = 'menuitem';
                    drawingTools.appendChild(cancelEraseButton);
                    cancelEraseButton.addEventListener('click', this.setIsErasing.bind(this, false));

                    const cancelEraseButtonIcon = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
                    cancelEraseButton.appendChild(cancelEraseButtonIcon);
                    cancelEraseButtonIcon.outerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M160-120v-170l527-526q12-12 27-18t30-6q16 0 30.5 6t25.5 18l56 56q12 11 18 25.5t6 30.5q0 15-6 30t-18 27L330-120H160Zm586-529 54-54-57-57-54 54 57 57ZM560-120q74 0 137-37t63-103q0-36-19-62t-51-45l-59 59q23 10 36 22t13 26q0 23-36.5 41.5T560-200q-17 0-28.5 11.5T520-160q0 17 11.5 28.5T560-120ZM183-426l60-60q-20-8-31.5-16.5T200-520q0-12 18-24t76-37q88-38 117-69t29-70q0-55-44-87.5T280-840q-45 0-80.5 16T145-785q-11 13-9 29t15 26q13 11 29 9t27-13q14-14 31-20t42-6q41 0 60.5 12t19.5 28q0 14-17.5 25.5T262-654q-80 35-111 63.5T120-520q0 32 17 54.5t46 39.5Z"/></svg>`;

                    const cancelEraseTooltip = document.createElement('tf-tooltip');
                    cancelEraseTooltip.textContent = 'draw';
                    cancelEraseButton.appendChild(cancelEraseTooltip);

                    const colorTools = document.createElement('div');
                    colorTools.classList.add('image-editor-toolbar', 'drawing-tool', 'non-erasing-tool');
                    colorTools.role = 'toolbar';
                    colorTools.ariaLabel = 'color toolbar';
                    drawingTools.appendChild(colorTools);

                    const colorInput = document.createElement('tf-color-input');
                    colorInput.classList.add('color-button', 'drawing-tool', 'non-erasing-tool');
                    colorInput.role = 'menuitem';
                    colorInput.dataset.inputClass = 'rounded small';
                    colorInput.dataset.popoverContainer = '';
                    colorInput.ariaLabel = 'color';
                    colorInput.setAttribute('button', '');
                    colorTools.appendChild(colorInput);
                    colorInput.addEventListener('valuechange', this.onSetBrushColor.bind(this));

                    const colorTooltip = document.createElement('tf-tooltip');
                    colorTooltip.textContent = 'color';
                    colorInput.appendChild(colorTooltip);

                    const separator8 = document.createElement('div');
                    separator8.classList.add('vr', 'drawing-tool', 'non-erasing-tool');
                    separator8.role = 'separator';
                    separator8.ariaOrientation = 'vertical';
                    drawingTools.appendChild(separator8);

                    const eraseButton = document.createElement('button');
                    eraseButton.classList.add('erase-button', 'drawing-tool', 'non-erasing-tool');
                    eraseButton.ariaLabel = 'erase';
                    eraseButton.role = 'menuitem';
                    colorTools.appendChild(eraseButton);
                    eraseButton.addEventListener('click', this.setIsErasing.bind(this, true));

                    const eraseButtonIcon = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
                    eraseButton.appendChild(eraseButtonIcon);
                    eraseButtonIcon.outerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M690-240h190v80H610l80-80Zm-500 80-85-85q-23-23-23.5-57t22.5-58l440-456q23-24 56.5-24t56.5 23l199 199q23 23 23 57t-23 57L520-160H190Z"/></svg>`;

                    const eraseTooltip = document.createElement('tf-tooltip');
                    eraseTooltip.textContent = 'erase';
                    eraseButton.appendChild(eraseTooltip);

                    const separator9 = document.createElement('div');
                    separator9.classList.add('vr', 'drawing-tool');
                    separator9.role = 'separator';
                    separator9.ariaOrientation = 'vertical';
                    drawingTools.appendChild(separator9);

                    const brushSizeContainer = document.createElement('div');
                    brushSizeContainer.classList.add('brush-size-container', 'drawing-tool');
                    drawingTools.appendChild(brushSizeContainer);

                    const brushSizeIcon = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
                    brushSizeContainer.appendChild(brushSizeIcon);
                    brushSizeIcon.outerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M120-160v-40h720v40H120Zm0-120v-80h720v80H120Zm0-160v-120h720v120H120Zm0-200v-160h720v160H120Z"/></svg>`;

                    const brushSizeSlider = document.createElement('tf-slider');
                    brushSizeSlider.dataset.value = TavenemImageEditorHtmlElement._brushSizeDefault.toString();
                    brushSizeContainer.appendChild(brushSizeSlider);

                    const brushSizeInput = document.createElement('input');
                    brushSizeInput.classList.add('brush-size-input');
                    brushSizeInput.type = 'range';
                    brushSizeInput.min = '1';
                    brushSizeInput.max = '100';
                    brushSizeInput.step = '0.1';
                    brushSizeInput.value = TavenemImageEditorHtmlElement._brushSizeDefault.toString();
                    brushSizeInput.ariaLabel = 'brush size';
                    brushSizeSlider.appendChild(brushSizeInput);
                    brushSizeInput.addEventListener('input', this.onSetBrushSize.bind(this));

                    const brushSizeTooltip = document.createElement('tf-tooltip');
                    brushSizeTooltip.textContent = 'brush size';
                    brushSizeContainer.appendChild(brushSizeTooltip);

                    const separator10 = document.createElement('div');
                    separator10.classList.add('vr', 'drawing-tool');
                    separator10.role = 'separator';
                    separator10.ariaOrientation = 'vertical';
                    drawingTools.appendChild(separator10);

                    const doneDrawingButton = document.createElement('button');
                    doneDrawingButton.classList.add('done-drawing-button', 'drawing-tool');
                    doneDrawingButton.ariaLabel = 'stop drawing';
                    doneDrawingButton.role = 'menuitem';
                    drawingTools.appendChild(doneDrawingButton);
                    doneDrawingButton.addEventListener('click', this.setDrawingMode.bind(this, DrawingMode.None));

                    const doneDrawingButtonIcon = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
                    doneDrawingButton.appendChild(doneDrawingButtonIcon);
                    doneDrawingButtonIcon.outerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/></svg>`;

                    const doneDrawingTooltip = document.createElement('tf-tooltip');
                    doneDrawingTooltip.textContent = 'stop drawing';
                    doneDrawingButton.appendChild(doneDrawingTooltip);

                    const textTools = document.createElement('div');
                    textTools.classList.add('image-editor-toolbar', 'text-tool');
                    textTools.role = 'toolbar';
                    textTools.ariaLabel = 'text toolbar';
                    drawingTools.appendChild(textTools);

                    const textColorInput = document.createElement('tf-color-input');
                    textColorInput.classList.add('text-color-button');
                    textColorInput.role = 'menuitem';
                    textColorInput.dataset.inputClass = 'rounded small';
                    textColorInput.dataset.popoverContainer = '';
                    textColorInput.ariaLabel = 'color';
                    textColorInput.setAttribute('button', '');
                    textTools.appendChild(textColorInput);
                    textColorInput.addEventListener('valuechange', this.onSetTextColor.bind(this));

                    const textColorTooltip = document.createElement('tf-tooltip');
                    textColorTooltip.textContent = 'color';
                    textColorInput.appendChild(textColorTooltip);

                    const separator11 = document.createElement('div');
                    separator11.classList.add('vr', 'text-tool');
                    separator11.role = 'separator';
                    separator11.ariaOrientation = 'vertical';
                    textTools.appendChild(separator11);

                    const textButton = document.createElement('button');
                    textButton.classList.add('text-button');
                    textButton.ariaLabel = 'add text';
                    textButton.role = 'menuitem';
                    textTools.appendChild(textButton);
                    textButton.addEventListener('click', this.startAddingText.bind(this));

                    const textButtonIcon = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
                    textButton.appendChild(textButtonIcon);
                    textButtonIcon.outerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M280-160v-520H80v-120h520v120H400v520H280Zm360 0v-320H520v-120h360v120H760v320H640Z"/></svg>`;

                    const textTooltip = document.createElement('tf-tooltip');
                    textTooltip.textContent = 'add text';
                    textButton.appendChild(textTooltip);

                    const separator12 = document.createElement('div');
                    separator12.classList.add('vr', 'text-tool');
                    separator12.role = 'separator';
                    separator12.ariaOrientation = 'vertical';
                    textTools.appendChild(separator12);

                    const doneTextButton = document.createElement('button');
                    doneTextButton.classList.add('done-text-button', 'text-tool');
                    doneTextButton.ariaLabel = 'stop adding text';
                    doneTextButton.role = 'menuitem';
                    textTools.appendChild(doneTextButton);
                    doneTextButton.addEventListener('click', this.setTextMode.bind(this, false));

                    const doneTextButtonIcon = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
                    doneTextButton.appendChild(doneTextButtonIcon);
                    doneTextButtonIcon.outerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/></svg>`;

                    const doneTextTooltip = document.createElement('tf-tooltip');
                    doneTextTooltip.textContent = 'stop adding text';
                    doneTextButton.appendChild(doneTextTooltip);
                }

                const modeGroup = document.createElement('div');
                modeGroup.classList.add('button-group');
                modeGroup.role = 'group';
                modeGroup.ariaLabel = 'mode group';
                manipulationTools.appendChild(modeGroup);

                if (!('hide-drawing' in this.dataset)) {
                    const drawButton = document.createElement('button');
                    drawButton.classList.add('draw-button');
                    drawButton.ariaLabel = 'draw';
                    drawButton.role = 'menuitem';
                    modeGroup.appendChild(drawButton);
                    drawButton.addEventListener('click', this.setDrawingMode.bind(this, DrawingMode.Brush));

                    const drawButtonIcon = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
                    drawButton.appendChild(drawButtonIcon);
                    drawButtonIcon.outerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M160-120v-170l527-526q12-12 27-18t30-6q16 0 30.5 6t25.5 18l56 56q12 11 18 25.5t6 30.5q0 15-6 30t-18 27L330-120H160Zm586-529 54-54-57-57-54 54 57 57ZM560-120q74 0 137-37t63-103q0-36-19-62t-51-45l-59 59q23 10 36 22t13 26q0 23-36.5 41.5T560-200q-17 0-28.5 11.5T520-160q0 17 11.5 28.5T560-120ZM183-426l60-60q-20-8-31.5-16.5T200-520q0-12 18-24t76-37q88-38 117-69t29-70q0-55-44-87.5T280-840q-45 0-80.5 16T145-785q-11 13-9 29t15 26q13 11 29 9t27-13q14-14 31-20t42-6q41 0 60.5 12t19.5 28q0 14-17.5 25.5T262-654q-80 35-111 63.5T120-520q0 32 17 54.5t46 39.5Z"/></svg>`;

                    const drawTooltip = document.createElement('tf-tooltip');
                    drawTooltip.textContent = 'draw';
                    drawButton.appendChild(drawTooltip);

                    const addTextButton = document.createElement('button');
                    addTextButton.classList.add('add-text-button');
                    addTextButton.ariaLabel = 'add text';
                    addTextButton.role = 'menuitem';
                    modeGroup.appendChild(addTextButton);
                    addTextButton.addEventListener('click', this.setTextMode.bind(this, true));

                    const addTextButtonIcon = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
                    addTextButton.appendChild(addTextButtonIcon);
                    addTextButtonIcon.outerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M280-160v-520H80v-120h520v120H400v520H280Zm360 0v-320H520v-120h360v120H760v320H640Z"/></svg>`;

                    const addTextTooltip = document.createElement('tf-tooltip');
                    addTextTooltip.textContent = 'add text';
                    addTextButton.appendChild(addTextTooltip);
                }

                if (!('hide-crop' in this.dataset)) {
                    const cropButton = document.createElement('button');
                    cropButton.classList.add('start-crop-button');
                    cropButton.ariaLabel = 'crop';
                    modeGroup.appendChild(cropButton);
                    cropButton.addEventListener('click', this.startCrop.bind(this));

                    const cropButtonIcon = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
                    cropButton.appendChild(cropButtonIcon);
                    cropButtonIcon.outerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M680-40v-160H280q-33 0-56.5-23.5T200-280v-400H40v-80h160v-160h80v640h640v80H760v160h-80Zm0-320v-320H360v-80h320q33 0 56.5 23.5T760-680v320h-80Z"/></svg>`;

                    const cropTooltip = document.createElement('tf-tooltip');
                    cropTooltip.textContent = 'crop';
                    cropButton.appendChild(cropTooltip);
                }
            }
        }

        const slot = document.createElement('slot');
        controls.appendChild(slot);

        if (this.hasAttribute('src')) {
            this.loadImage(this.getAttribute('src'));
        } else {
            editButton.classList.add('no-image');
        }

        this.addEventListener('dragover', this.onDragOver.bind(this));
        this.addEventListener('drop', this.onDrop.bind(this));

        window.addEventListener('keydown', this.onKeyDown.bind(this));
    }

    async disconnectedCallback() {
        window.removeEventListener('keydown', this.onKeyDown.bind(this));

        this.removeEventListener('dragover', this.onDragOver.bind(this));
        this.removeEventListener('drop', this.onDrop.bind(this));

        this.destroy();

        const root = this.shadowRoot;
        if (!root) {
            return;
        }

        const editButton = root.querySelector('.image-edit-button');
        if (editButton) {
            editButton.removeEventListener('click', this.startEdit.bind(this));
        }

        const cropButton = root.querySelector('.crop-button');
        if (cropButton) {
            cropButton.removeEventListener('click', this.startCrop.bind(this));
        }

        const cancelCropButton = root.querySelector('.cancel-crop-button');
        if (cancelCropButton) {
            cancelCropButton.removeEventListener('click', this.cancel.bind(this));
        }

        const freeCropButton = root.querySelector('.free-crop-button');
        if (freeCropButton) {
            freeCropButton.removeEventListener('click', this.setCropAspectRatio.bind(this, null));
        }

        const originalCropButton = root.querySelector('.aspect-ratio-button[data-aspect-ratio="-1"]');
        if (originalCropButton) {
            originalCropButton.removeEventListener('click', this.setCropAspectRatio.bind(this, -1));
        }

        const squareCropButton = root.querySelector('.aspect-ratio-button[data-aspect-ratio="1"]');
        if (squareCropButton) {
            squareCropButton.removeEventListener('click', this.setCropAspectRatio.bind(this, 1));
        }

        const five4CropButton = root.querySelector('.aspect-ratio-button[data-aspect-ratio="1.25"]');
        if (five4CropButton) {
            five4CropButton.removeEventListener('click', this.setCropAspectRatio.bind(this, 1.25));
        }

        const four3CropButton = root.querySelector('.aspect-ratio-button[data-aspect-ratio="1.333333"]');
        if (four3CropButton) {
            four3CropButton.removeEventListener('click', this.setCropAspectRatio.bind(this, 4 / 3));
        }

        const three2CropButton = root.querySelector('.aspect-ratio-button[data-aspect-ratio="1.5"]');
        if (three2CropButton) {
            three2CropButton.removeEventListener('click', this.setCropAspectRatio.bind(this, 1.5));
        }

        const sixteen9CropButton = root.querySelector('.aspect-ratio-button[data-aspect-ratio="1.777778"]');
        if (sixteen9CropButton) {
            sixteen9CropButton.removeEventListener('click', this.setCropAspectRatio.bind(this, 16 / 9));
        }

        const seven5CropButton = root.querySelector('.aspect-ratio-button[data-aspect-ratio="1.4"]');
        if (seven5CropButton) {
            seven5CropButton.removeEventListener('click', this.setCropAspectRatio.bind(this, 1.4));
        }

        const three4CropButton = root.querySelector('.aspect-ratio-button[data-aspect-ratio="0.75"]');
        if (three4CropButton) {
            three4CropButton.removeEventListener('click', this.setCropAspectRatio.bind(this, 0.75));
        }

        const undoButton = root.querySelector('.undo-button');
        if (undoButton) {
            undoButton.removeEventListener('click', this.undo.bind(this));
        }

        const redoButton = root.querySelector('.redo-button');
        if (redoButton) {
            redoButton.removeEventListener('click', this.redo.bind(this));
        }

        const saveButton = root.querySelector('.save-button');
        if (saveButton) {
            saveButton.removeEventListener('click', this.save.bind(this, null, null));
        }

        const downloadButton = root.querySelector('.download-button');
        if (downloadButton) {
            downloadButton.removeEventListener('click', this.exportImage.bind(this, null, null));
        }

        const pngSpan = root.querySelector('.format[data-format="image/png"]');
        if (pngSpan) {
            pngSpan.removeEventListener('mousedown', this.preventDefault);
            pngSpan.removeEventListener('mouseup', this.setFormat.bind(this, "image/png"));
        }

        const jpegSpan = root.querySelector('.format[data-format="image/jpeg"]');
        if (jpegSpan) {
            jpegSpan.removeEventListener('mousedown', this.preventDefault);
            jpegSpan.removeEventListener('mouseup', this.setFormat.bind(this, "image/jpeg"));
        }

        const webpSpan = root.querySelector('.format[data-format="image/webp"]');
        if (webpSpan) {
            webpSpan.removeEventListener('mousedown', this.preventDefault);
            webpSpan.removeEventListener('mouseup', this.setFormat.bind(this, "image/webp"));
        }

        const cancelEditButton = root.querySelector('.cancel-edit-button');
        if (cancelEditButton) {
            cancelEditButton.removeEventListener('click', this.destroy.bind(this, false));
        }

        const rotateLeftButton = root.querySelector('.rotate-left-button');
        if (rotateLeftButton) {
            rotateLeftButton.removeEventListener('click', this.rotateCounterClockwise.bind(this));
        }

        const rotateRightButton = root.querySelector('.rotate-right-button');
        if (rotateRightButton) {
            rotateRightButton.removeEventListener('click', this.rotateClockwise.bind(this));
        }

        const startCropButton = root.querySelector('.start-crop-button');
        if (startCropButton) {
            startCropButton.removeEventListener('click', this.rotateClockwise.bind(this));
        }

        const flipHorizontalButton = root.querySelector('.flip-horizontal-button');
        if (flipHorizontalButton) {
            flipHorizontalButton.removeEventListener('click', this.flipHorizontal.bind(this));
        }

        const flipVerticalButton = root.querySelector('.flip-vertical-button');
        if (flipVerticalButton) {
            flipVerticalButton.removeEventListener('click', this.flipVertical.bind(this));
        }

        const cancelEraseButton = root.querySelector('.cancel-erase-button');
        if (cancelEraseButton) {
            cancelEraseButton.removeEventListener('click', this.setIsErasing.bind(this, false));
        }

        const colorInput = root.querySelector('.color-button');
        if (colorInput) {
            colorInput.removeEventListener('valuechange', this.onSetBrushColor.bind(this));
        }

        const eraseButton = root.querySelector('.erase-button');
        if (eraseButton) {
            eraseButton.removeEventListener('click', this.setIsErasing.bind(this, true));
        }

        const brushSizeInput = root.querySelector('.brush-size-input');
        if (brushSizeInput) {
            brushSizeInput.removeEventListener('input', this.onSetBrushSize.bind(this));
        }

        const doneDrawingButton = root.querySelector('.done-drawing-button');
        if (doneDrawingButton) {
            doneDrawingButton.removeEventListener('click', this.setDrawingMode.bind(this, DrawingMode.None));
        }

        const textColorInput = root.querySelector('.text-color-button');
        if (textColorInput) {
            textColorInput.removeEventListener('valuechange', this.onSetTextColor.bind(this));
        }

        const textButton = root.querySelector('.text-button');
        if (textButton) {
            textButton.removeEventListener('click', this.startAddingText.bind(this));
        }

        const doneTextButton = root.querySelector('.done-text-button');
        if (doneTextButton) {
            doneTextButton.removeEventListener('click', this.setTextMode.bind(this, false));
        }

        const drawButton = root.querySelector('.draw-button');
        if (drawButton) {
            drawButton.removeEventListener('click', this.setDrawingMode.bind(this, DrawingMode.Brush));
        }

        const addTextButton = root.querySelector('.add-text-button');
        if (addTextButton) {
            addTextButton.removeEventListener('click', this.setTextMode.bind(this, true));
        }
    }

    attributeChangedCallback(name: string, oldValue: string | null | undefined, newValue: string | null | undefined) {
        if (newValue == oldValue) {
            return;
        }

        if (name === 'data-aspect-ratio') {
            const value = parseFloat(newValue || '');
            if (Number.isFinite(value) && value > 0) {
                this.setCropAspectRatio(value);
            } else {
                this.setCropAspectRatio();
            }
        } else if (name === 'src') {
            if (this._editor) {
                this.setBackgroundImage(newValue);
            } else {
                this.loadImage(newValue);
            }
        }
    }

    addText(text: string) {
        if (this._editor) {
            this._editor.addText(text);
        }
    }

    cancel() {
        if (this._editor) {
            this._editor.cancelOngoingOperations();
        }
    }

    clear() {
        if (this._editor) {
            this._editor.clear();
        }
        const root = this.shadowRoot;
        if (!root) {
            return;
        }
        const button = root.querySelector<HTMLButtonElement>('.image-edit-button');
        if (button) {
            button.classList.add('no-image');
        }
    }

    crop() {
        const bounds = this._editor
            ? this._editor.crop()
            : new Rectangle(0, 0, 0, 0);
        this.dispatchEvent(TavenemImageEditorHtmlElement.newCropEvent(bounds));
    }

    async destroy(withRevoke: boolean = true) {
        if (this._editor) {
            await this._editor.destroy();
            delete this._editor;
            this.dispatchEvent(TavenemImageEditorHtmlElement.newToggleEvent(false));
        }

        const root = this.shadowRoot;
        if (!root) {
            return;
        }

        const controls = root.querySelector<HTMLDivElement>('.image-editor-controls');
        if (controls) {
            controls.classList.remove('editing');
        }

        const button = root.querySelector<HTMLButtonElement>('.image-edit-button');
        if (button) {
            button.classList.remove('editing');
        }

        if (withRevoke) {
            const imageElement = root.querySelector('img');
            if (imageElement
                && imageElement.src
                && imageElement.src.startsWith("blob")) {
                URL.revokeObjectURL(imageElement.src);
            }
        }
    }

    editText(text?: string) {
        if (this._editor) {
            this._editor.editText(text);
        }
    }

    exportImage(type?: string | null, quality?: number | null) {
        type = type || this.dataset.format || "image/png";

        if (!quality) {
            const q = parseFloat(this.dataset.quality || '');
            if (Number.isFinite(q)) {
                quality = q;
            }
        }
        quality = quality || 0.92;

        if (this._editor) {
            const link = document.createElement('a');
            const filename = type.replace('/', '.');
            link.download = filename;
            link.href = this._editor.exportImage(type, quality);
            link.click();
            return;
        }

        const root = this.shadowRoot;
        if (!root) {
            return;
        }

        const img = root.querySelector('img');
        if (img && img.src) {
            const link = document.createElement('a');
            const filename = type.replace('/', '.');
            link.download = filename;
            link.href = img.src;
            link.click();
        }
    }

    flipHorizontal() {
        if (this._editor) {
            this._editor.flip();
        }
    }

    flipVertical() {
        if (this._editor) {
            this._editor.flip(true);
        }
    }

    async loadEditor(
        imageUrl?: string | null,
        cropAspectRatio?: number | null) {
        const root = this.shadowRoot;
        if (!root) {
            return;
        }

        const overlay = root.querySelector('.overlay');
        if (overlay) {
            overlay.classList.add('show');
        }

        const imageElement = root.querySelector('img');
        if (imageElement && !imageUrl) {
            imageUrl = imageElement.src;
        }
        if (!imageUrl && this.hasAttribute('src')) {
            const src = this.getAttribute('src');
            if (src && src.length) {
                imageUrl = src;
            }
        }
        const button = root.querySelector<HTMLButtonElement>('.image-edit-button');
        if (this._editor) {
            if (!imageUrl) {
                this._editor.resetContainer();
            }
        } else {
            const editorContainer = root.querySelector('.image-editor-container');
            if (!editorContainer) {
                return;
            }
            const widthLimit = root.host.clientWidth;
            const heightLimit = root.host.clientHeight;
            const width = imageElement
                ? imageElement.naturalWidth
                : widthLimit;
            const height = imageElement
                ? imageElement.naturalHeight
                : heightLimit;
            this._editor = new ImageEditor(
                width <= 0 ? 100 : width,
                height <= 0 ? 100 : height,
                widthLimit,
                heightLimit,
                this.setCropping.bind(this),
                this.updateRedo.bind(this),
                this.updateUndo.bind(this));
            if (!(this._editor.editor.view instanceof HTMLCanvasElement)) {
                return;
            }
            editorContainer.appendChild(this._editor.editor.view);

            if (imageElement) {
                imageElement.remove();
            }

            if (button) {
                button.classList.add('editing');
            }

            const controls = root.querySelector<HTMLDivElement>('.image-editor-controls');
            if (controls) {
                controls.classList.add('editing');
            }
            this.dispatchEvent(TavenemImageEditorHtmlElement.newToggleEvent(true));
        }
        if (imageUrl) {
            await this._editor.setBackgroundImage(imageUrl);

            if (button) {
                button.classList.remove('no-image');
            }
        } else if (button) {
            button.classList.add('no-image');
        }
        if (!cropAspectRatio && this.dataset.aspectRatio) {
            const aspectRatio = parseFloat(this.dataset.aspectRatio || '');
            if (Number.isFinite(aspectRatio) && aspectRatio > 0) {
                cropAspectRatio = aspectRatio;
            }
        }
        if (cropAspectRatio) {
            this._editor.setCropAspectRatio(cropAspectRatio);
        }

        if (overlay) {
            overlay.classList.remove('show');
        }
    }

    loadImage(imageUrl?: string | null) {
        if (this._editor) {
            this.destroy();
        }
        const root = this.shadowRoot;
        if (!root) {
            return;
        }

        const overlay = root.querySelector('.overlay');
        if (overlay) {
            overlay.classList.add('show');
        }

        let imageElement = root.querySelector('img');
        if (imageElement
            && imageElement.src
            && imageElement.src.startsWith("blob")) {
            URL.revokeObjectURL(imageElement.src);
        }

        if (!imageElement) {
            const editorContainer = root.querySelector('.image-editor-container');
            if (!editorContainer) {
                return;
            }
            imageElement = document.createElement('img');
            imageElement.style.width = '100%';
            imageElement.style.height = '100%';
            imageElement.style.objectFit = 'scale-down';
            editorContainer.appendChild(imageElement);
        }

        const button = root.querySelector<HTMLButtonElement>('.image-edit-button');
        if (imageUrl) {
            imageElement.src = imageUrl;

            if (button) {
                button.classList.remove('no-image');
            }
        } else if (button) {
            button.classList.add('no-image');
        }

        if (overlay) {
            overlay.classList.remove('show');
        }
    }

    async loadImageFromBlob(blob?: Blob | null) {
        if (!blob) {
            this.loadImage();
            return;
        }

        if (this._editor) {
            this.destroy();
        }
        const root = this.shadowRoot;
        if (!root) {
            return;
        }

        const overlay = root.querySelector('.overlay');
        if (overlay) {
            overlay.classList.add('show');
        }

        let imageElement = root.querySelector('img');
        if (imageElement
            && imageElement.src
            && imageElement.src.startsWith("blob")) {
            URL.revokeObjectURL(imageElement.src);
        }

        const imageUrl = URL.createObjectURL(blob);

        if (!imageElement) {
            const editorContainer = root.querySelector('.image-editor-container');
            if (!editorContainer) {
                return;
            }
            imageElement = document.createElement('img');
            imageElement.style.width = '100%';
            imageElement.style.height = '100%';
            imageElement.style.objectFit = 'scale-down';
            editorContainer.appendChild(imageElement);
        }

        const button = root.querySelector<HTMLButtonElement>('.image-edit-button');
        if (imageUrl) {
            imageElement.src = imageUrl;

            if (button) {
                button.classList.remove('no-image');
            }
        } else if (button) {
            button.classList.add('no-image');
        }

        if (overlay) {
            overlay.classList.remove('show');
        }
    }

    async loadImageFromStream(imageStream?: DotNetStreamReference) {
        if (!imageStream) {
            this.loadImage();
            return;
        }

        const buffer: ArrayBuffer = await imageStream.arrayBuffer();
        const blob = new Blob([buffer]);
        await this.loadImageFromBlob(blob);
    }

    redo() {
        if (this._editor) {
            this._editor.redo();
        }
    }

    rotateClockwise() {
        if (this._editor) {
            this._editor.rotate(90);
        }
    }

    rotateCounterClockwise() {
        if (this._editor) {
            this._editor.rotate(-90);
        }
    }

    async save(type?: string | null, quality?: number | null) {
        if (!this._editor) {
            return null;
        }
        if (!type) {
            type = this.dataset.format;
        }
        if (!quality) {
            const q = parseFloat(this.dataset.quality || '');
            if (Number.isFinite(q)) {
                quality = q;
            }
        }
        const stream = await this._editor.save(type, quality);
        this._editor.destroy();
        delete this._editor;
        this.dispatchEvent(TavenemImageEditorHtmlElement.newStreamEvent(stream));
        this.dispatchEvent(TavenemImageEditorHtmlElement.newToggleEvent(false));
        return stream;
    }

    async setBackgroundImage(imageUrl?: string | null) {
        const root = this.shadowRoot;
        const overlay = root && root.querySelector('.overlay');
        if (overlay) {
            overlay.classList.add('show');
        }
        if (this._editor) {
            await this._editor.setBackgroundImage(imageUrl);
        }

        if (overlay) {
            overlay.classList.remove('show');
        }
    }

    async setBackgroundImageFromBlob(blob?: Blob | null) {
        if (!blob) {
            this.setBackgroundImage();
            return;
        }
        if (this._editor) {
            const imageUrl = URL.createObjectURL(blob);

            await this._editor.setBackgroundImage(imageUrl);

            URL.revokeObjectURL(imageUrl);
        }
    }

    async setBackgroundImageFromStream(imageStream?: DotNetStreamReference) {
        if (!imageStream) {
            this.setBackgroundImage();
            return;
        }
        if (this._editor) {
            const buffer: ArrayBuffer = await imageStream.arrayBuffer();
            const blob = new Blob([buffer]);
            await this.setBackgroundImageFromBlob(blob);
        }
    }

    setBrushColor(color?: string) {
        if (color == null
            || !color.length) {
            color = TavenemImageEditorHtmlElement._brushColorDefault;
        } else if (!/^#(?:[\da-f]{3}){1,2}$/i.test(color)) {
            return;
        }
        this._brushColor = color;
        if (this._editor) {
            this._editor.setBrushColor(color);
        }
    }

    setBrushSize(size?: number) {
        this._brushSize = size == null
            || !Number.isFinite(size)
            || size < 1
            ? TavenemImageEditorHtmlElement._brushSizeDefault
            : size;
        if (this._editor) {
            this._editor.setBrushSize(size);
        }
    }

    setCropAspectRatio(ratio?: number | null) {
        if (!this._editor) {
            return;
        }

        this._editor.setCropAspectRatio(ratio);

        const root = this.shadowRoot;
        if (!root) {
            return;
        }

        const ratioButtons = root.querySelectorAll<HTMLButtonElement>('.aspect-ratio-button');
        ratioButtons.forEach(x => x.classList.remove('active'));

        let activeRatioButtons: Element[] = [];
        ratioButtons.forEach(x => {
            if (ratio == null) {
                if (!('aspectRatio' in x.dataset)) {
                    activeRatioButtons.push(x);
                }
            } else {
                const buttonRatio = parseFloat(x.dataset.aspectRatio || '');
                if (Number.isFinite(buttonRatio) && Math.abs(ratio - buttonRatio) < 0.00001) {
                    activeRatioButtons.push(x);
                }
            }
        });

        activeRatioButtons.forEach(x => x.classList.add('active'));
    }

    setCropping(value: boolean = false) {
        const root = this.shadowRoot;
        if (!root) {
            return;
        }
        const controls = root.querySelector<HTMLDivElement>('.image-editor-controls');
        if (!controls) {
            return;
        }
        if (value) {
            controls.classList.add('cropping');
        } else {
            controls.classList.remove('cropping');
        }
    }

    setDrawingMode(mode?: DrawingMode) {
        mode = mode || DrawingMode.None;
        if (this._editor) {
            this._editor.setDrawingMode(mode);
        }
        const root = this.shadowRoot;
        if (!root) {
            return;
        }
        const drawingTools = root.querySelector<HTMLDivElement>('.drawing-toolbar');
        if (!drawingTools) {
            return;
        }
        if (mode == DrawingMode.None) {
            delete drawingTools.dataset.drawingMode;
        } else {
            drawingTools.dataset.drawingMode = mode.toString();
        }
    }

    setFormat(value?: string | null) {
        if (value == null || !value.length) {
            delete this.dataset.format;
            value = "image/png";
        } else {
            this.dataset.format = value;
        }

        const root = this.shadowRoot;
        if (!root) {
            return;
        }

        const formatSpans = root.querySelectorAll<HTMLSpanElement>('.format');
        formatSpans.forEach(x => x.classList.remove('active'));

        let activeSpan: Element | undefined;
        formatSpans.forEach(x => {
            if (x.dataset.format === value) {
                activeSpan = x;
            }
        });

        if (activeSpan) {
            activeSpan.classList.add('active');
        }
    }

    async setImage(imageUrl?: string | null) {
        if (this._editor) {
            await this.setBackgroundImage(imageUrl);
        } else {
            this.loadImage(imageUrl);
        }
    }

    async setImageFromBlob(blob?: Blob | null) {
        if (this._editor) {
            await this.setBackgroundImageFromBlob(blob);
        } else {
            await this.loadImageFromBlob(blob);
        }
    }

    async setImageFromStream(imageStream?: DotNetStreamReference) {
        if (this._editor) {
            await this.setBackgroundImageFromStream(imageStream);
        } else {
            await this.loadImageFromStream(imageStream);
        }
    }

    setIsErasing(value: boolean) {
        if (this._editor) {
            this._editor.setIsErasing(value);
        }
        const root = this.shadowRoot;
        if (!root) {
            return;
        }
        const drawingTools = root.querySelector<HTMLDivElement>('.drawing-toolbar');
        if (!drawingTools) {
            return;
        }
        if (value) {
            drawingTools.dataset.erasing = '';
        } else {
            delete drawingTools.dataset.erasing;
        }
    }

    setTextColor(color?: string) {
        if (color == null
            || !color.length) {
            color = TavenemImageEditorHtmlElement._brushColorDefault;
        } else if (!/^#(?:[\da-f]{3}){1,2}$/i.test(color)) {
            return;
        }
        this._textColor = color;
        if (this._editor) {
            this._editor.setTextColor(color);
        }
    }

    setTextMode(value: boolean = true) {
        const root = this.shadowRoot;
        if (!root) {
            return;
        }
        const drawingTools = root.querySelector<HTMLDivElement>('.drawing-toolbar');
        if (!drawingTools) {
            return;
        }
        if (value) {
            drawingTools.dataset.textMode = '';
        } else {
            delete drawingTools.dataset.textMode;
        }
    }

    startAddingText() {
        if (this._editor) {
            this._editor.getTextDialogResponse();
        }
    }

    async startCrop() {
        if (!this._editor) {
            await this.loadEditor();
        }
        if (this._editor) {
            this._editor.startCrop();
        }
    }

    async startEdit() {
        const aspectRatio = parseFloat(this.dataset.aspectRatio || '');
        await this.loadEditor(null, Number.isFinite(aspectRatio) ? aspectRatio : null);

        if (Math.abs(this._brushSize - TavenemImageEditorHtmlElement._brushSizeDefault) > 0.00001) {
            this.setBrushSize(this._brushSize);
        }

        if (this._brushColor !== TavenemImageEditorHtmlElement._brushColorDefaultAlt
            && !this._brushColor.startsWith(TavenemImageEditorHtmlElement._brushColorDefault)) {
            this.setBrushColor(this._brushColor);
        }

        if (this._textColor !== TavenemImageEditorHtmlElement._brushColorDefaultAlt
            && !this._textColor.startsWith(TavenemImageEditorHtmlElement._brushColorDefault)) {
            this.setTextColor(this._textColor);
        }
    }

    undo() {
        if (this._editor) {
            this._editor.undo();
        }
    }

    updateRedo(enabled: boolean) {
        const root = this.shadowRoot;
        if (!root) {
            return;
        }
        const redo = root.querySelector<HTMLButtonElement>('.redo-button');
        if (redo) {
            redo.disabled = !enabled;
        }
    }

    updateUndo(enabled: boolean) {
        const root = this.shadowRoot;
        if (!root) {
            return;
        }
        const redo = root.querySelector<HTMLButtonElement>('.undo-button');
        if (redo) {
            redo.disabled = !enabled;
        }
    }

    private onDragOver(event: DragEvent) {
        event.preventDefault();
        if (!event.dataTransfer) {
            return;
        }

        if (event.dataTransfer.items.length > 0) {
            [...event.dataTransfer.items].forEach((item, i) => {
                if (item.kind === "file") {
                    const file = item.getAsFile();
                    if (file && file.type.startsWith('image/')) {
                        event.dataTransfer!.dropEffect = 'copy';
                        return;
                    }
                } else {
                    const url = event.dataTransfer!.getData('URL');
                    if (url && url.length) {
                        event.dataTransfer!.dropEffect = 'copy';
                        return;
                    }

                    const uris = event.dataTransfer!.getData('text/uri-list');
                    if (uris && uris.length) {
                        const split = uris.split(/[\r\n]+/).filter(x => !x.startsWith('#'));
                        if (split.length > 0) {
                            event.dataTransfer!.dropEffect = 'copy';
                            return;
                        }
                    }

                    const text = event.dataTransfer!.getData('text/plain');
                    if (text && text.length) {
                        event.dataTransfer!.dropEffect = 'copy';
                    }
                }
            });
        }
    }

    private onDrop(event: DragEvent) {
        event.preventDefault();
        if (!event.dataTransfer) {
            return;
        }

        if (event.dataTransfer.items.length > 0) {
            [...event.dataTransfer.items].forEach(async (item, i) => {
                if (item.kind === "file") {
                    const file = item.getAsFile();
                    if (file && file.type.startsWith('image/')) {
                        await this.setImageFromBlob(file);
                        return;
                    }
                } else {
                    const url = event.dataTransfer.getData('URL');
                    if (url && url.length) {
                        this.setImage(url);
                        return;
                    }

                    const uris = event.dataTransfer.getData('text/uri-list');
                    if (uris && uris.length) {
                        const split = uris.split(/[\r\n]+/).filter(x => !x.startsWith('#'));
                        if (split.length > 0) {
                            this.setImage(split[0]);
                            return;
                        }
                    }

                    const text = event.dataTransfer.getData('text/plain');
                    if (text && text.length) {
                        this.setImage(text);
                    }
                }
            });
        }
    }

    private onKeyDown(event: KeyboardEvent) {
        if (this._editor
            && (event.key === 'Delete'
                || event.key === 'Backspace')) {
            this._editor.delete();
        }
    }

    private onSetBrushColor(event: Event) {
        event.stopPropagation();
        if (event instanceof CustomEvent
            && event.detail
            && typeof event.detail.value === 'string') {
            this.setBrushColor(event.detail.value);
        }
    }

    private onSetBrushSize(event: Event) {
        event.stopPropagation();
        if (event.target instanceof HTMLInputElement) {
            this.setBrushSize(parseFloat(event.target.value) || 0);
        }
    }

    private onSetTextColor(event: Event) {
        event.stopPropagation();
        if (event instanceof CustomEvent
            && event.detail
            && typeof event.detail.value === 'string') {
            this.setTextColor(event.detail.value);
        }
    }

    private preventDefault(event: Event) { event.preventDefault(); }
}