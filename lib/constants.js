"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GITHUB_WORKSPACE = exports.GITHUB_ANNOTATION_LIMIT = exports.ISSUE_NUMBER = exports.REPO = exports.OWNER = exports.HEAD_FULL_NAME = exports.BASE_FULL_NAME = exports.SERIALIZED_ROUTES = exports.ARTIFACTS_BASE_DIR = exports.ARTIFACT_KEY_ISSUE_STATE = exports.ARTIFACT_KEY_LINT_RESULTS = exports.ARTIFACT_KEY = exports.NAME = exports.DEFAULT_WORKFLOW_STATE = exports.DEFAULT_ISSUE_STATE = void 0;
const tslib_1 = require("tslib");
const github = tslib_1.__importStar(require("@actions/github"));
const guards_1 = require("./guards");
const context = github.context;
exports.DEFAULT_ISSUE_STATE = Object.freeze({
    issue: Object.freeze({
        id: undefined,
        summaryId: undefined,
    }),
});
exports.DEFAULT_WORKFLOW_STATE = Object.freeze({
    id: undefined,
    path: undefined,
    userId: undefined,
    scheduler: Object.freeze({
        lastRunAt: undefined,
    }),
});
exports.NAME = 'ESLint Results';
exports.ARTIFACT_KEY = 'eslint-cache-key';
exports.ARTIFACT_KEY_LINT_RESULTS = `${exports.ARTIFACT_KEY}-lint-results`;
exports.ARTIFACT_KEY_ISSUE_STATE = `${exports.ARTIFACT_KEY}-state`;
exports.ARTIFACTS_BASE_DIR = '/action/.artifacts';
exports.SERIALIZED_ROUTES = [
    '/repos/:owner/:repo/check-runs',
    '/repos/:owner/:repo/check-runs/:check_run_id',
    '/repos/:owner/:repo/issues/:issue_number/comments',
];
exports.BASE_FULL_NAME = guards_1.isPullRequestPayload(context.payload)
    ? context.payload.pull_request.base.repo.full_name
    : undefined;
exports.HEAD_FULL_NAME = guards_1.isPullRequestPayload(context.payload)
    ? context.payload.pull_request.head.repo.full_name
    : undefined;
_a = github.context.issue || github.context.repo, exports.OWNER = _a.owner, exports.REPO = _a.repo, exports.ISSUE_NUMBER = _a.number;
exports.GITHUB_ANNOTATION_LIMIT = 50;
exports.GITHUB_WORKSPACE = process.env.GITHUB_WORKSPACE;
