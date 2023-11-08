import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { terser } from '@wwa/rollup-plugin-terser';
import injectProcessEnv from 'rollup-plugin-inject-process-env';

let plugins = [
    json(),
    commonjs(),
    typescript(),
    injectProcessEnv({
        NODE_ENV: process.env.NODE_ENV,
    }),
    nodeResolve({
        mainFields: ['module', 'main'],
        extensions: ['.mjs', '.js', '.json', '.node', '.ts'],
        dedupe: [
            '@codemirror/language',
            '@codemirror/state',
            '@codemirror/view',
            '@lezer/common',
            '@lezer/lr',
        ],
        preferBuiltins: false,
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
    input: "./scripts/tavenem-contents.ts",
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
    input: "./scripts/tavenem-drawer.ts",
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
    input: "./scripts/tavenem-framework.ts",
    output: {
        format: 'es',
        sourcemap: true,
    },
    plugins: plugins,
}];