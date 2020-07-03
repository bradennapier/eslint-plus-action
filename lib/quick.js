"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const dedent_1 = tslib_1.__importDefault(require("dedent"));
function getSomething() { }
function run() {
    return dedent_1.default `
    start
    ${getSomething()}
    ${typeof getSomething === 'string' && 'test'}
    three
four

`;
}
console.log(run());
