interface ColorSelectionOptions {
    signal?: AbortSignal
}

interface ColorSelectionResult {
    sRGBHex: string
}

interface EyeDropper {
    open: (options?: ColorSelectionOptions) => Promise<ColorSelectionResult>
}

declare const EyeDropper: {
    prototype: EyeDropper;
    new(): EyeDropper;
}

interface Window {
    EyeDropper?: EyeDropper | undefined
}

declare module 'markdown-it-attrs' {
    export default function attributes(md, options: { leftDelimiter?: string, rightDelimiter?: string, allowedAttributes?: string[] }): void;
}
declare module 'markdown-it-deflist' {
    export default function deflist_plugin(md): void;
}
declare module 'markdown-it-ins' {
    export default function ins_plugin(md): void;
}
declare module 'markdown-it-mark' {
    export default function mark_plugin(md): void;
}
declare module 'markdown-it-sub' {
    export default function sub_plugin(md): void;
}
declare module 'markdown-it-sup' {
    export default function sup_plugin(md): void;
}
declare module 'markdown-it-task-lists' {
    export default function task_list_plugin(md): void;
}
