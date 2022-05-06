declare module 'prosemirror-example-setup' {
    import { Schema } from 'prosemirror-model';

    export function buildInputRules(schema: Schema): any;

    export function buildKeymap(schema: Schema): any;
}