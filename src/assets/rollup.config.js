import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';

let plugins = [
    typescript(),
    nodeResolve({
        mainFields: ['module', 'main'],
        extensions: '.ts'
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
}];