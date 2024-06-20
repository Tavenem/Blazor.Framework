export const elementStyle = `
*, *::before, *::after {
    box-sizing: border-box;
}

* {
    font-family: var(--tavenem-font-family);
}

h1, h2, h3, h4, h5, h6,
.h1, .h2, .h3, .h4, .h5, .h6 {
    font-family: var(--tavenem-font-family-title);
}

pre, code, kbd, samp {
    --tavenem-mono: 1;
    font-family: var(--tavenem-font-family-monospace);
}

:host {
    --field-active-border-color: var(--tavenem-color-primary);
    --field-active-border-hover-color: var(--tavenem-color-primary-lighten);
    --field-active-label-color: var(--tavenem-color-primary);
    --field-border-color: var(--tavenem-color-border-input);
    --field-border-hover-color: var(--tavenem-color-action);
    --field-color: var(--tavenem-color-text);
    --field-label-color: var(--tavenem-color-text-secondary);
    border: 0;
    color: var(--tavenem-color-text);
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    margin: 0;
    margin-bottom: .5rem;
    margin-top: 1rem;
    max-width: 100%;
    padding: 0;
    position: relative;
    width: 100%;
}

:host > label {
    color: var(--field-label-color);
    display: block;
    font-size: .75rem;
    font-weight: var(--tavenem-font-weight);
    line-height: 1;
    padding: 0;
    pointer-events: auto;
    position: initial;
    transform: none;
    transition: color 200ms cubic-bezier(0.0, 0, 0.2, 1) 0ms;
    z-index: auto;
}

:host([required]) > label:after {
    color: var(--tavenem-color-error);
    content: " *";
}

:host(:focus-within:not([readonly], [disabled])) {
    --field-border-color: var(--field-active-border-color);
    --field-border-hover-color: var(--field-active-border-hover-color);
    --field-label-color: var(--field-active-label-color);
}

:host(.primary:not(:invalid:state(touched)),
    .secondary:not(:invalid:state(touched)),
    .tertiary:not(:invalid:state(touched)),
    .danger:not(:invalid:state(touched)),
    .dark:not(:invalid:state(touched)),
    .default:not(:invalid:state(touched)),
    .info:not(:invalid:state(touched)),
    .success:not(:invalid:state(touched)),
    .warning:not(:invalid:state(touched))) {
    --field-active-border-color: var(--tavenem-theme-color);
    --field-active-border-hover-color: var(--tavenem-theme-color-lighten);
    --field-active-label-color: var(--tavenem-theme-color);
}

:host(:invalid:state(touched)) {
    --field-active-border-color: var(--tavenem-color-error);
    --field-active-border-hover-color: var(--tavenem-color-error);
    --field-active-label-color: var(--tavenem-color-error);
    --field-border-color: var(--tavenem-color-error);
    --field-border-hover-color: var(--tavenem-color-error);
    --field-color: var(--tavenem-color-error);
    --field-label-color: var(--tavenem-color-error);
}

:host(.bg-alt,
    .primary.filled,
    .secondary.filled,
    .tertiary.filled,
    .danger.filled,
    .dark.filled,
    .default.filled,
    .info.filled,
    .success.filled,
    .warning.filled) {
    background-color: transparent !important;
}

hr {
    background-color: var(--tavenem-color-divider);
    border: 0;
    color: inherit;
    flex-shrink: 0;
    height: 1px;
    margin: 1rem 0;
    width: 100%;
}

.vr {
    align-self: stretch;
    background-color: var(--tavenem-color-divider);
    display: inline-block;
    min-height: 1rem;
    vertical-align: text-top;
    width: 1px;
}

svg {
    fill: currentColor;
    flex-shrink: 0;
    height: 1em;
    width: auto;
}

.field {
    --field-active-border-color: var(--tavenem-color-primary);
    --field-active-border-hover-color: var(--tavenem-color-primary-lighten);
    --field-active-label-color: var(--tavenem-color-primary);
    --field-border-color: var(--tavenem-color-border-input);
    --field-border-hover-color: var(--tavenem-color-action);
    --field-color: var(--tavenem-color-text);
    --field-label-color: var(--tavenem-color-text-secondary);
    border: 0;
    color: var(--tavenem-color-text);
    display: flex;
    flex-basis: auto;
    flex-direction: column;
    flex-shrink: 1;
    margin: 0;
    margin-bottom: 2px;
    margin-top: 3px;
    max-width: 100%;
    padding: 0;
    position: relative;
    vertical-align: top;

    > .input {
        padding-bottom: 3px;
        padding-top: 3px;

        &:before {
            border-color: var(--field-border-color);
            border-bottom-style: solid;
            border-bottom-width: 1px;
            bottom: 0;
            content: "\xa0";
            left: 0;
            right: 0;
            pointer-events: none;
            position: absolute;
            transition: border-bottom 0.2s, border-bottom-color 200ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, background-color 0.2s;
        }
    }

    &:not(.disabled, [disabled], .read-only, [readonly], [inert]) > .input:hover:before {
        border-bottom-color: var(--field-border-hover-color);
    }

    &:focus-within:not(.disabled, [disabled], .read-only, [readonly], [inert]) {
        --field-border-color: var(--field-active-border-color);
        --field-border-hover-color: var(--field-active-border-hover-color);
        --field-label-color: var(--field-active-label-color);
    }

    &.invalid {
        --field-active-border-color: var(--tavenem-color-error);
        --field-active-border-hover-color: var(--tavenem-color-error);
        --field-active-label-color: var(--tavenem-color-error);
        --field-border-color: var(--tavenem-color-error);
        --field-border-hover-color: var(--tavenem-color-error);
        --field-color: var(--tavenem-color-error);
        --field-label-color: var(--tavenem-color-error);
    }

    &.disabled,
    &[disabled],
    &.read-only,
    &[readonly],
    &[inert],
    [inert] & {
        --tavenem-field-input-opacity: 1;

        > .input {
            cursor: default;

            tf-icon, .svg-icon {
                pointer-events: none;
            }

            input {
                opacity: 1;
            }

            > .expand {
                cursor: default;
            }
        }
    }

    &:disabled,
    &.disabled,
    &[inert],
    [inert] & {
        --field-color: var(--tavenem-color-text-disabled);
        --field-label-color: var(--tavenem-color-text-disabled);

        > .input {
            color: var(--tavenem-color-text-disabled);

            tf-icon {
                color: var(--tavenem-color-text-disabled);
            }
        }
    }
}

.input {
    align-items: center;
    box-sizing: content-box;
    color: var(--field-color);
    column-gap: 8px;
    cursor: text;
    display: inline-flex;
    font-size: 1rem;
    font-weight: var(--tavenem-font-weight);
    line-height: 1.1875rem;
    min-height: 1.1875rem;
    padding-bottom: 7px;
    padding-top: 6px;
    position: relative;

    input {
        appearance: none;
        background: none;
        border: 0;
        box-shadow: none;
        box-sizing: content-box;
        color: currentColor;
        display: block;
        font: inherit;
        height: 1.1875rem;
        margin: 0;
        min-height: calc(1.25rem + 10px);
        min-width: 0;
        padding: 0;
        position: relative;
        width: 100%;
        -webkit-tap-highlight-color: transparent;

        &:focus {
            outline: 0;
        }

        &:invalid {
            box-shadow: none;
            color: var(--tavenem-color-error);
        }

        &:disabled {
            opacity: 1;
        }
    }

    > .expand {
        cursor: pointer;
        transition: .3s cubic-bezier(.25,.8,.5,1),visibility 0s;
    }
}

.input input::placeholder {
    color: currentColor;
    opacity: 0.42;
    transition: opacity 200ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
}

.tooltip {
    --tooltip-color: var(--tavenem-color-text);
    --tooltip-color-bg: var(--tavenem-color-bg-surface);
    align-items: center;
    background-color: var(--tooltip-color-bg);
    border-radius: var(--tavenem-border-radius);
    color: var(--tooltip-color);
    cursor: auto;
    font-size: .75rem;
    font-weight: var(--tavenem-font-weight-semibold);
    justify-content: center;
    line-height: 1.4rem;
    padding: .25rem .5rem;
    pointer-events: auto;
    text-align: center;
    text-transform: none;
    user-select: text;
    z-index: var(--tavenem-zindex-tooltip);
}

.btn {
    --button-default-active-shadow: 0px 5px 5px -3px rgba(0, 0, 0, 0.2), 0px 8px 10px 1px rgba(0, 0, 0, 0.14), 0px 3px 14px 2px rgba(0,0,0,.12);
    --button-default-bg: var(--tavenem-color-default);
    --button-default-color: var(--tavenem-color-default-text);
    --button-default-hover-bg: var(--tavenem-color-default-darken);
    --button-default-hover-shadow: 0px 2px 4px -1px rgba(0, 0, 0, 0.2), 0px 4px 5px 0px rgba(0, 0, 0, 0.14), 0px 1px 10px 0px rgba(0,0,0,.12);
    --button-default-padding-x: 16px;
    --button-default-padding-y: 6px;
    --button-default-shadow: 0px 3px 1px -2px rgba(0,0,0,0.2),0px 2px 2px 0px rgba(0,0,0,0.14),0px 1px 5px 0px rgba(0,0,0,0.12);
    --button-active-shadow: var(--button-inherited-active-shadow, var(--button-default-active-shadow));
    --button-bg: var(--button-inherited-bg, var(--button-default-bg));
    --button-border-color: var(--button-inherited-border-color, var(--tavenem-color-border));
    --button-border-style: var(--button-inherited-border-style, none);
    --button-color: var(--button-inherited-color, var(--button-default-color));
    --button-font-size: var(--button-inherited-font-size, var(--tavenem-font-size-button));
    --button-hover-bg: var(--button-inherited-hover-bg, var(--button-default-hover-bg));
    --button-hover-color: var(--button-inherited-hover-color, var(--tavenem-color-default-text));
    --button-hover-shadow: var(--button-inherited-hover-shadow, var(--button-default-hover-shadow));
    --button-padding-x: var(--button-inherited-padding-x, var(--button-default-padding-x));
    --button-padding-y: var(--button-inherited-padding-y, var(--button-default-padding-y));
    --button-shadow: var(--button-inherited-shadow, var(--button-default-shadow));
    align-items: center;
    background-color: var(--button-bg);
    border-color: var(--button-border-color);
    border-radius: var(--tavenem-border-radius);
    border-style: var(--button-border-style);
    border-width: 1px;
    box-shadow: var(--button-shadow);
    box-sizing: border-box;
    color: var(--button-color);
    cursor: pointer;
    display: inline-flex;
    flex: 0 0 auto;
    font-size: var(--button-font-size);
    font-weight: var(--tavenem-font-weight-semibold);
    gap: .25rem;
    justify-content: center;
    line-height: var(--tavenem-lineheight-button);
    margin: 0;
    min-width: 4rem;
    outline: 0;
    overflow: hidden;
    padding: var(--button-padding-y) var(--button-padding-x);
    position: relative;
    text-decoration: none;
    text-transform: var(--tavenem-texttransform-button);
    transition: background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,border 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
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
        transform: scale(10,10);
        transition: transform .3s,opacity 1s;
        width: 100%;
    }

    tf-popover {
        text-transform: initial;
    }

    > *:first-child {
        border-top-left-radius: inherit;
        border-bottom-left-radius: inherit;
    }

    > *:last-child {
        border-top-right-radius: inherit;
        border-bottom-right-radius: inherit;
    }

    > *:only-child {
        border-radius: inherit;
    }

    &:hover,
    &:focus-visible {
        background-color: var(--button-hover-bg);
        box-shadow: var(--button-hover-shadow);
        color: var(--button-hover-color);
    }

    &:active {
        box-shadow: var(--button-active-shadow);

        &:after {
            transform: scale(0,0);
            opacity: .1;
            transition: 0s;
        }
    }

    &.small {
        --button-font-size: calc(var(--tavenem-font-size-button) - 1px);
        --button-default-padding-x: 10px;
        --button-default-padding-y: 4px;
    }

    &.filled {
        --tavenem-theme-color-bg-alt: var(--tavenem-theme-color-darken);
        --button-bg: var(--tavenem-theme-color, var(--tavenem-color-default));
        --button-color: var(--tavenem-theme-color-text, var(--tavenem-color-default-text));
        background-color: var(--button-bg);
        color: var(--button-color);
    }

    &.outlined {
        --button-active-shadow: none;
        --button-bg: transparent;
        --button-border-style: solid;
        --button-color: var(--tavenem-color-action);
        --button-hover-bg: var(--tavenem-color-action-hover-bg);
        --button-hover-color: var(--tavenem-color-action);
        --button-hover-shadow: none;
        --button-shadow: none;
        border-color: var(--button-border-color);
        border-style: var(--button-border-style);
        padding: calc(var(--button-padding-y) - 1px) calc(var(--button-padding-x) - 1px);
    }

    &:disabled, &.disabled, &[inert], [inert] & {
        --button-active-shadow: none;
        --button-bg: var(--tavenem-color-action-disabled-bg);
        --button-color: var(--tavenem-color-text-disabled);
        --button-hover-shadow: none;
        --button-shadow: none;
        background-color: var(--tavenem-color-action-disabled-bg);
        border-color: var(--tavenem-color-action-disabled-bg);
        color: var(--tavenem-color-text-disabled);
        cursor: default;
        pointer-events: none;
    }
}
.btn::-moz-focus-inner {
    border-style: none;
}

.btn-text {
    --button-default-active-shadow: none;
    --button-default-bg: transparent;
    --button-default-color: inherit;
    --button-default-hover-bg: var(--tavenem-color-action-hover-bg);
    --button-default-hover-shadow: none;
    --button-default-shadow: none;
    --button-hover-color: var(--button-inherited-hover-color, inherit);
    min-width: 0;

    &.small {
        --button-font-size: calc(var(--tavenem-font-size-button) - 1px);
        --button-padding-x: 5px;
    }

    &:disabled, &.disabled, &[inert], [inert] & {
        --button-bg: transparent;
        background-color: transparent;
    }
}

.btn-icon {
    --button-default-active-shadow: none;
    --button-default-bg: transparent;
    --button-default-color: inherit;
    --button-default-hover-bg: var(--tavenem-color-action-hover-bg);
    --button-default-hover-shadow: none;
    --button-default-shadow: none;
    --button-font-size: var(--button-inherited-font-size-icon, 1.5rem);
    --button-hover-color: var(--button-inherited-hover-color, inherit);
    --button-padding-x: var(--button-inherited-padding-x-icon, var(--button-default-padding-y));
    --button-padding-y: var(--button-inherited-padding-y-icon, var(--button-default-padding-y));
    border-radius: 9999px;
    flex: 0 0 auto;
    line-height: 1;
    min-width: calc(var(--button-font-size) + (var(--button-padding-x) * 2));
    padding: var(--button-padding-y) var(--button-padding-x);
    text-align: center;

    &:after {
        transform: scale(7,7);
    }
    tf-icon {
        font-size: inherit;
    }
    .svg-icon {
        max-height: 1em;
    }

    &.small {
        --button-font-size: 1.25rem;
        --button-default-padding-y: 5px;
    }

    &.outlined {
        padding: calc(var(--button-padding-y) - 1px) calc(var(--button-padding-y) - 1px);
    }

    &:disabled, &.disabled, &[inert], [inert] & {
        --button-bg: transparent;
        background-color: transparent;
    }

    &.filled {
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
    --button-inherited-color: var(--tavenem-color-text);
    --button-inherited-font-size: calc(var(--tavenem-font-size-button) - 1px);
    --button-inherited-font-size-icon: 1.25rem;
    --button-inherited-hover-bg: var(--tavenem-color-action-hover-bg);
    --button-inherited-hover-color: var(--tavenem-color-action);
    --button-inherited-hover-shadow: none;
    --button-inherited-padding-x: 5px;
    --button-inherited-padding-y: 4px;
    --button-inherited-padding-y-icon: 5px;
    border-radius: var(--tavenem-border-radius);
    display: inline-flex;

    > .btn,
    > tf-dropdown > .btn {
        border-bottom-left-radius: inherit;
        border-top-left-radius: inherit;

        + .btn,
        + tf-dropdown > .btn {
            border-bottom-left-radius: 0;
            border-top-left-radius: 0;
            border-left-style: solid;
            margin-left: -1px;
        }
    }

    > .btn {
        &:not(:last-child) {
            border-bottom-right-radius: 0;
            border-top-right-radius: 0;
        }

        &:last-child {
            border-bottom-right-radius: inherit;
            border-top-right-radius: inherit;
        }
    }

    > tf-dropdown {
        border-bottom-left-radius: inherit;
        border-top-left-radius: inherit;

        &:not(:last-child) > .btn {
            border-bottom-right-radius: 0;
            border-top-right-radius: 0;
        }

        &:last-child {
            &, > .btn {
                border-bottom-right-radius: inherit;
                border-top-right-radius: inherit;
            }
        }
    }

    &.outlined {
        --button-inherited-border-style: solid;
        --button-inherited-padding-x: 4px;
        --button-inherited-padding-y: 3px;
        --button-inherited-padding-y-icon: 4px;
    }

    &.active {
        background-color: transparent;
        box-shadow: var(--tavenem-shadow-1);
        --button-inherited-active-shadow: var(--tavenem-shadow-2);
        --button-inherited-bg: var(--tavenem-color-default);
        --button-inherited-color: var(--tavenem-color-default-text);
        --button-inherited-font-size: calc(var(--tavenem-font-size-button) - 1px);
        --button-inherited-font-size-icon: 1.25rem;
        --button-inherited-hover-bg: var(--tavenem-color-default-darken);
        --button-inherited-hover-color: var(--tavenem-color-default-text);
        --button-inherited-hover-shadow: var(--tavenem-shadow-2);
        --button-inherited-padding-x: 10px;
        --button-inherited-padding-y: 4px;
        --button-inherited-padding-y-icon: 5px;

        &.outlined {
            box-shadow: none;
            --button-inherited-active-shadow: none;
            --button-inherited-bg: transparent;
            --button-inherited-border-style: solid;
            --button-inherited-color: var(--tavenem-color-text);
            --button-inherited-hover-bg: var(--tavenem-color-action-hover-bg);
            --button-inherited-hover-color: var(--tavenem-color-action);
            --button-inherited-hover-shadow: none;
            --button-inherited-padding-x: 9px;
            --button-inherited-padding-y: 3px;
            --button-inherited-padding-y-icon: 4px;
        }
    }
}

.mode-button.hidden {
    display: none;
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
        box-sizing: border-box;
        color: inherit;
        column-gap: .5em;
        display: flex;
        flex: 0 0 auto;
        flex-wrap: wrap;
        justify-content: flex-start;
        list-style: none;
        padding-inline-end: .25em;
        padding-inline-start: .25em;
        position: relative;
        text-align: start;
        text-decoration: none;
        transition: background-color 150ms cubic-bezier(.4,0,.2,1) 0ms;
        -webkit-tap-highlight-color: transparent;

        &:focus-visible, &:hover {
            background-color: transparent;
            color: inherit;
        }

        &[disabled] {
            color: var(--tavenem-color-action-disabled);
            cursor: default;
            pointer-events: none;
        }
    }

    > hr {
        background-color: var(--tavenem-color-divider);
        margin: 0;
        padding: 0;
        padding-bottom: 0;
        padding-inline-end: 0;
        padding-inline-start: 0;
        padding-right: 0;
        padding-top: 0;
    }

    > .active {
        background-color: var(--list-active-bg);
        border-inline-end: 1px solid var(--list-active-color);
        color: var(--list-active-color);
        padding-inline-end: calc(1em - 1px);
    }

    > *:not(hr) {
        border: 0;
        border-radius: 0;
        cursor: pointer;
        margin: 0;
        outline: 0;
        overflow: hidden;
        padding-bottom: .25em;
        padding-top: .25em;
        position: relative;
        transition: background-color 150ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
        user-select: none;
        vertical-align: middle;
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

    svg {
        font-size: 1.25em;
    }

    > tf-dropdown {
        margin-right: max(-24px, -.75em);
        padding-right: 0;

        > button {
            font-size: 1em;
            justify-content: space-between;
            padding: 0;
            text-transform: none;
            width: 100%;

            &:after {
                background-color: currentColor;
                background-image: none;
                content: '';
                height: 24px;
                mask: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M400-280v-400l200 200-200 200Z"/></svg>') no-repeat 50% 50%;
                mask-size: cover;
                opacity: inherit;
                position: relative;
                transform: none;
                width: 24px;
            }
        }
    }
}

.editor-toolbar {
    background-color: var(--tavenem-color-bg-surface);
    border-color: var(--field-border-color);
    border-style: solid;
    border-top-left-radius: var(--tavenem-border-radius);
    border-top-right-radius: var(--tavenem-border-radius);
    border-width: 1px;
    margin-top: .5rem;
    overflow: hidden;
    position: relative;

    > .editor-toolbar-show-all-btn {
        position: absolute;
        right: 1rem;
        top: .5rem;
    }

    > div:first-child {
        align-items: center;
        border-top-left-radius: var(--tavenem-border-radius);
        border-top-right-radius: var(--tavenem-border-radius);
        column-gap: .125rem;
        display: flex;
        flex-wrap: wrap;
        height: calc(2.25rem + 12px);
        padding: .5rem calc(2.75rem + 10px) .5rem 1rem;
        row-gap: .25rem;

        > .btn:not(:disabled),
        > .button-group,
        > .button-group-text {
            border: 1px solid transparent;
        }
    }

    &.editor-toolbar-extended > div:first-child {
        height: auto;
    }

    .btn svg.active {
        display: none;
    }

    .btn.active {
        svg.active {
            display: initial;
        }

        svg.inactive {
            display: none;
        }
    }

    .field {
        flex-grow: 0;

        > .input {
            margin-top: 0;
            padding-bottom: 5px;
        }
    }

    .select {
        margin-bottom: 0;
        margin-top: 0;

        tf-input {
            width: 8em;
        }
    }

    > tf-color-input {
        margin-bottom: 0;
        margin-top: 0;
    }
}

.rounded {
    border-radius: var(--tavenem-border-radius);

    *:first-child {
        border-top-left-radius: inherit;
        border-top-right-radius: inherit;
    }

    *:last-child {
        border-bottom-left-radius: inherit;
        border-bottom-right-radius: inherit;
    }
}

.editor {
    background-color: var(--tavenem-color-bg-input);
    border-bottom-width: 0;
    border-color: var(--field-border-color);
    border-left-width: 1px;
    border-right-width: 1px;
    border-style: solid;
    border-top-width: 0;
    color: var(--tavenem-color-text);
    display: flex;
    min-height: calc((1.4em * 2) + 8px);
    position: relative;
    transition: border-width,border-color 200ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;

    ul {
        list-style: disc;
    }

    ul ul {
        list-style: circle;
    }

    ul ul ul {
        list-style: square;
    }

    .cm-panel input[type=checkbox]:not(:checked):before {
        background-color: var(--tavenem-color-bg-input);
        content: "";
        height: calc(100% - 2px);
        left: 1px;
        position: absolute;
        top: 1px;
        width: calc(100% - 2px);
    }

    .ProseMirror {
        flex-grow: 1;
        line-height: 1.2;
        outline: none;
        padding: .25rem .5rem .25rem 1rem;
        position: relative;
        white-space: break-spaces;
        word-wrap: break-word;

        &.resize-cursor {
            cursor: col-resize;
        }

        .editor-placeholder {
            color: var(--tavenem-color-text-secondary);
            height: 0;
            pointer-events: none;
        }

        &:focus .editor-placeholder {
            display: none;
        }

        .task-list-item {
            align-items: baseline;
            display: flex;

            > input:first-child {
                flex: 0 0 auto;
                margin-right: .5rem;
            }

            > *:not(:first-child) {
                flex: 1 1 auto;
            }
        }

        .tableWrapper {
            margin: 1em 0;
            overflow-x: auto;

            table {
                overflow: hidden;
                table-layout: fixed;
            }

            table, th, td {
                border-style: solid;
                border-width: 1px;
                padding: 3px 5px;
            }

            th, td {
                min-height: 25px;
                min-width: 25px;
                position: relative;
                vertical-align: top;
            }

            th {
                font-weight: bolder;
            }
        }

        .column-resize-handle {
            background-color: #adf;
            bottom: 0;
            pointer-events: none;
            position: absolute;
            right: -2px;
            top: 0;
            width: 4px;
            z-index: 20;
        }

        .selectedCell:after {
            background: rgba(200, 200, 255, 0.4);
            bottom: 0;
            content: "";
            left: 0;
            right: 0;
            top: 0;
            pointer-events: none;
            position: absolute;
            z-index: 2;
        }

        .cm-editor[data-language]:after {
            background-color: rgba(0,128,255,.2);
            border-bottom-left-radius: var(--tavenem-border-radius);
            border-bottom-right-radius: var(--tavenem-border-radius);
            color: var(--tavenem-color-text);
            content: attr(data-language);
            font-size: .75em;
            line-height: 1;
            padding: 2px 4px;
            position: absolute;
            right: .5rem;
            top: 1px;
        }
    }
}
.ProseMirror::selection {
    background-color: var(--tavenem-color-bg);
}
.ProseMirror:focus-within::selection {
    background-color: var(--tavenem-color-bg-highlight-bright);
}
.ProseMirror[contenteditable="false"]::selection {
    background-color: var(--tavenem-color-bg-highlight-bright);
}

:host([height]),
:host([max-height]) {
    .ProseMirror {
        overflow: auto;
    }
}

:host([disabled]) .editor,
:host([readonly]) .editor,
:host(:not([wysiwyg])) .editor,
:host(:not([data-syntax="html"], [data-syntax="markdown"])) .editor {
    border-bottom-left-radius: var(--tavenem-border-radius);
    border-bottom-right-radius: var(--tavenem-border-radius);
    border-bottom-width: 1px;
}

:host([disabled]) .editor,
:host([readonly]) .editor {
    border-top-left-radius: var(--tavenem-border-radius);
    border-top-right-radius: var(--tavenem-border-radius);
    border-top-width: 1px;
}

:host(:not([readonly], [disabled])) .editor:hover {
    border-color: var(--field-border-hover-color);
}

.editor-statusbar {
    --tavenem-mono: 1;
    background-color: var(--tavenem-color-bg-surface);
    border-bottom-left-radius: var(--tavenem-border-radius);
    border-bottom-right-radius: var(--tavenem-border-radius);
    border-color: var(--field-border-color);
    border-style: solid;
    border-width: 1px;
    color: var(--tavenem-color-text-secondary);
    font-family: var(--tavenem-font-family-monospace);
    position: relative;
    padding: .25rem 1rem;
}

:host([disabled]),
:host([readonly]),
:host(:not([wysiwyg])),
:host(:not([data-syntax="html"], [data-syntax="markdown"])) {
    border-bottom-left-radius: var(--tavenem-border-radius);
    border-bottom-right-radius: var(--tavenem-border-radius);
}

:host([disabled]) .editor-statusbar,
:host([readonly]) .editor-statusbar,
:host(:not([wysiwyg])) .editor-statusbar,
:host(:not([data-syntax="html"], [data-syntax="markdown"])) .editor-statusbar {
    display: none;
}

.field-helpers {
    color: var(--field-label-color);
    display: contents;
    font-size: 0.75rem;
    font-weight: var(--tavenem-font-weight);
    line-height: 1.66;
    overflow: hidden;
    text-align: start;

    > * {
        margin-top: 3px;
        padding-left: 8px;
        padding-right: 8px;
    }
}

.validation-messages {
    display: none;
    list-style: none;
    margin-right: auto;
    margin-bottom: 0;
    margin-top: 0;
    padding-left: 0;
}

:host(:state(touched)) .validation-messages {
    display: initial;
}
`;