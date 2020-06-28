"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const eslint_1 = require("eslint");
function run() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const eslintConfig = {
            extensions: ['.js', 'jsx', '.ts', '.tsx'],
            ignorePath: '.gitignore',
            ignore: true,
            useEslintrc: true,
            debug: true,
        };
        console.log('[ESLINT] Run With Configuration: ', eslintConfig);
        const eslint = new eslint_1.CLIEngine(eslintConfig);
        const results = yield eslint.executeOnFiles(['./dist/eslint-all.js']);
        console.log(results);
    });
}
run();
