"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleIssueComment = void 0;
const tslib_1 = require("tslib");
const constants_1 = require("./constants");
const markdown_1 = require("./utils/markdown");
function removeIssueSummary(client, data) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (data.persist.issue.summaryId) {
            yield client.issues.deleteComment({
                owner: constants_1.OWNER,
                repo: constants_1.REPO,
                comment_id: data.persist.issue.summaryId,
            });
            data.persist.issue.summaryId = undefined;
        }
    });
}
function handleIssueComment(client, data) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const { state } = data;
        if (data.issueNumber && data.issueSummary) {
            if (!data.issueSummaryOnlyOnEvent ||
                state.errorCount > 0 ||
                state.warningCount > 0 ||
                state.fixableErrorCount > 0 ||
                state.fixableWarningCount > 0) {
                if (data.persist.issue.summaryId && data.issueSummaryMethod === 'edit') {
                    yield client.issues.updateComment({
                        owner: constants_1.OWNER,
                        repo: constants_1.REPO,
                        comment_id: data.persist.issue.summaryId,
                        body: markdown_1.getResultMarkdownBody(data),
                    });
                }
                else if (data.persist.issue.summaryId &&
                    data.issueSummaryMethod === 'refresh') {
                    yield removeIssueSummary(client, data);
                }
                if (!data.persist.issue.summaryId) {
                    const commentResult = yield client.issues.createComment({
                        owner: constants_1.OWNER,
                        repo: constants_1.REPO,
                        issue_number: data.issueNumber,
                        body: markdown_1.getResultMarkdownBody(data),
                    });
                    data.persist.issue.summaryId = commentResult.data.id;
                    data.persist.action.userId = commentResult.data.user.id;
                }
            }
            else if (data.issueSummaryOnlyOnEvent && data.persist.issue.summaryId) {
                yield removeIssueSummary(client, data);
            }
        }
    });
}
exports.handleIssueComment = handleIssueComment;
