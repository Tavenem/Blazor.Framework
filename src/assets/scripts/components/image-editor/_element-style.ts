export const elementStyle = `
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
    border-width: 1px;
    box-sizing: border-box;
    color: inherit;
    cursor: pointer;
    display: inline-flex;
    flex: 0 0 auto;
    font-size: 1.25rem;
    font-weight: var(--tavenem-font-weight-semibold);
    gap: .25rem;
    justify-content: center;
    line-height: 1;
    margin: 0;
    min-width: calc(var(--tavenem-font-size-button) + 12px);
    outline: 0;
    overflow: hidden;
    padding: 5px;
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

    &:disabled, &[inert], [inert] & {
        --button-active-shadow: none;
        --button-bg: transparent;
        --button-color: var(--tavenem-color-text-disabled);
        --button-hover-shadow: none;
        --button-shadow: none;
        background-color: transparent;
        border-color: var(--tavenem-color-action-disabled-bg);
        color: var(--tavenem-color-text-disabled);
        cursor: default;
        pointer-events: none;
    }

    &.active {
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

        &:disabled, &[inert], [inert] & {
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
    > tf-dropdown > button,
    > tf-color-input {
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
        + tf-dropdown > button,
        + tf-color-input {
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
    position: relative;
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

tf-color-input {
    border-radius: var(--tavenem-border-radius);
}

.drawing-toolbar:not([data-drawing-mode="1"]) .tool.drawing-tool {
    display: none;
}

.drawing-toolbar:not([data-text-mode]) .tool.text-tool {
    display: none;
}

.drawing-toolbar:not([data-erasing]) .tool.erasing-tool {
    display: none;
}

[data-text-mode] .tool:not(.text-tool),
[data-text-mode] + .mode-group {
    display: none;
}

[data-erasing] .tool.non-erasing-tool {
    display: none;
}

[data-drawing-mode="1"] .tool:not(.drawing-tool),
[data-drawing-mode="1"] + .mode-group {
    display: none;
}
`;