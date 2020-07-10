"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const rest_1 = require("@octokit/rest");
const client = new rest_1.Octokit({
    auth: process.env.GITHUB_AUTH,
});
function arrayBufferToString(buffer) {
    return String.fromCharCode.apply(null, Array.from(new Uint8Array(buffer)));
}
exports.default = arrayBufferToString;
function run() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const artifacts = yield client.actions.listWorkflowRuns({
            owner: 'bradennapier',
            repo: 'eslint-plus-action',
            workflow_id: 160264279,
            per_page: 100,
        });
        console.log(JSON.stringify(artifacts.data), null, 2);
    });
}
run();
