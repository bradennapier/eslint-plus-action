"use strict";
var _a;
var _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GITHUB_WORKSPACE = exports.IS_READ_ONLY = exports.ISSUE_NUMBER = exports.REPO = exports.OWNER = exports.BASE_FULL_NAME = exports.NAME = void 0;
const tslib_1 = require("tslib");
const github = tslib_1.__importStar(require("@actions/github"));
exports.NAME = 'Eslint Changed';
const C = {
    event: '',
};
({
    eventName: C.event,
    issue: ,
    payload: {
        pull_request: {
            base: {
                repo: { full_name:  },
            },
            head: {
                repo: { full_name: HEAD_FULL_NAME },
            },
        },
    },
} = github.context);
exports.BASE_FULL_NAME = (_b = github.context.payload.pull_request) === null || _b === void 0 ? void 0 : _b.additions;
_a = github.context.issue, exports.OWNER = _a.owner, exports.REPO = _a.repo, exports.ISSUE_NUMBER = _a.number;
exports.IS_READ_ONLY = exports.BASE_FULL_NAME !== HEAD_FULL_NAME;
exports.GITHUB_WORKSPACE = process.env.GITHUB_WORKSPACE;
