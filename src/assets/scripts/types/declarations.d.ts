declare module 'markdown-it-attrs' {
    export default function attributes(md, options: { leftDelimiter?: string, rightDelimiter?: string, allowedAttributes?: string[] }): void;
}
declare module 'markdown-it-ins' {
    export default function ins_plugin(md): void;
}
declare module 'markdown-it-span' {
    export default function ins_plugin(md): void;
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

declare module 'prosemirror-example-setup' {
    import { Schema } from 'prosemirror-model';

    export function buildInputRules(schema: Schema): any;

    export function buildKeymap(schema: Schema): any;
}

declare module 'prosemirror-markdown' { }

declare module 'prosemirror-tables/dist' {
    export function setAttr(attrs: { [key: string]: any }, name: string, value: string): { [key: string]: any };
}
