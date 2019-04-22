// import resolve from 'rollup-plugin-node-resolve';
// import commonjs from 'rollup-plugin-commonjs';
import pkg from './package.json';
import {terser} from 'rollup-plugin-terser';
import buble from 'rollup-plugin-buble';

export default [
    {
        input: 'src/validation/simple/index.js',
        output: [
            {file: pkg.main, format: 'cjs'},
            {file: pkg.module, format: 'es'},
            {name: 'avv', file: pkg.browser, moduleName: 'avv', format: 'iife'},
            {name: 'avv', file: pkg.avvDocsEs, format: 'es'},
            {name: 'avv', file: pkg.avvDocsIife, format: 'iife'}
        ]
    },

    {
        input: 'src/validation/simple/index.js',
        output: [
            {name: 'avv', file: pkg.main.replace(/\.js$/, '.min.js'), format: 'cjs'},
            {name: 'avv', file: pkg.module.replace(/\.js$/, '.min.js'), format: 'es'},
            {name: 'avv', file: pkg.browser.replace(/\.js$/, '.min.js'), format: 'iife'}
        ],

        plugins: [
            terser(),
            buble({
                exclude: ['node_modules/**']
            })
        ]
    }
]
;
