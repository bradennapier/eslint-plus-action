"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isIssueCommentPayload = exports.isPullRequestPayload = void 0;
function isPullRequestPayload(payload) {
    if (payload.pull_request) {
        return true;
    }
    return false;
}
exports.isPullRequestPayload = isPullRequestPayload;
function isIssueCommentPayload(payload) {
    if (payload.comment) {
        return true;
    }
    return false;
}
exports.isIssueCommentPayload = isIssueCommentPayload;
