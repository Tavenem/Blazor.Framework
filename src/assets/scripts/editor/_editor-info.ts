import { CommandType } from "./_commands";
import { EditorSyntax } from "./_syntax";
import { ToolbarControl } from "./_toolbar";

export enum EditorMode {
    None = 0,
    Text = 1,
    WYSIWYG = 2,
}

export interface EditorOptions {
    autoFocus: boolean;
    initialValue?: string;
    mode: EditorMode;
    placeholder?: string;
    readOnly: boolean;
    syntax: EditorSyntax;
    updateOnInput: boolean;
}

interface CommandInfo {
    active: boolean,
    enabled: boolean,
}

type CommandUpdateInfo = { [K in CommandType]?: CommandInfo }
export interface UpdateInfo {
    commands?: CommandUpdateInfo;
    currentNode?: string | null;
}

export interface EditorInfo {
    debounce?: number;
    onChange: (value?: string | null) => void;
    onInput: (value?: string | null) => void;
    options?: EditorOptions;
    update: (data: UpdateInfo) => void;
}

export interface Editor {
    get isWYSIWYG(): boolean;

    activateCommand(type: CommandType, ...params: any[]): void;
    activateToolbarCommand(control: ToolbarControl): void;
    disable(value: boolean): void;
    dispose(): void;
    focus(): void;
    getContent(): string | undefined;
    getSelectedText(): string | undefined;
    initializeEditor(
        root: Element,
        element: HTMLElement,
        onChange: (value?: string | null) => void,
        onInput: (value?: string | null) => void,
        update: (data: UpdateInfo) => void,
        options?: EditorOptions): void;
    setSyntax(syntax: EditorSyntax): void;
    setValue(value?: string | null): void;
    updateSelectedText(value?: string | null): void;
}