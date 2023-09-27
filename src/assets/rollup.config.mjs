import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { terser } from '@wwa/rollup-plugin-terser';

let plugins = [
    json(),
    commonjs(),
    typescript(),
    nodeResolve({
        mainFields: ['module', 'main'],
        extensions: ['.mjs', '.js', '.json', '.node', '.ts'],
        dedupe: [
            '@codemirror/language',
            '@codemirror/state',
            '@codemirror/view',
            '@lezer/common',
            '@lezer/lr',
        ]
    }),
];
if (process.env.build === 'Release') {
    plugins.push(terser());
}

export default [{
    input: "./scripts/tavenem-utility.ts",
    output: {
        format: 'es',
        sourcemap: true,
    },
    plugins: plugins,
}, {
    input: "./scripts/tavenem-dragdrop.ts",
    output: {
        format: 'es',
        sourcemap: true,
    },
    plugins: plugins,
}, {
    input: "./scripts/tavenem-editor.ts",
    output: {
        format: 'es',
        sourcemap: true,
    },
    plugins: plugins,
}, {
    input: "./scripts/tavenem-events.ts",
    output: {
        format: 'es',
        sourcemap: true,
    },
    plugins: plugins,
}, {
    input: "./scripts/tavenem-highlight.ts",
    output: {
        format: 'es',
        sourcemap: true,
    },
    plugins: plugins,
}, {
    input: "./scripts/tavenem-image-editor.ts",
    output: {
        format: 'es',
        sourcemap: true,
    },
    plugins: plugins,
}, {
    input: "./scripts/tavenem-keylistener.ts",
    output: {
        format: 'es',
        sourcemap: true,
    },
    plugins: plugins,
}, {
    input: "./scripts/tavenem-popover.ts",
    output: {
        format: 'es',
        sourcemap: true,
    },
    plugins: plugins,
}, {
    input: "./scripts/tavenem-resize.ts",
    output: {
        format: 'es',
        sourcemap: true,
    },
    plugins: plugins,
}, {
    input: "./scripts/tavenem-scroll.ts",
    output: {
        format: 'es',
        sourcemap: true,
    },
    plugins: plugins,
}, {
    input: "./scripts/tavenem-theme.ts",
    output: {
        format: 'es',
        sourcemap: true,
    },
    plugins: plugins,
}, {
    input: "./scripts/tavenem-initialize-framework.ts",
    output: {
        format: 'es',
        sourcemap: true,
    },
    plugins: plugins,
}];