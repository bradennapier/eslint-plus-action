"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleIssueComment = void 0;
const tslib_1 = require("tslib");
const constants_1 = require("./constants");
const markdown_1 = require("./utils/markdown");
function handleIssueComment(client, data) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const { state } = data;
        let commentResult;
        if (data.issueNumber && data.issueSummary) {
            const issues = yield client.issues.listComments({
                issue_number: data.issueNumber,
                owner: constants_1.OWNER,
                repo: constants_1.REPO,
            });
            if (!data.issueSummaryOnlyOnEvent ||
                state.errorCount > 0 ||
                state.warningCount > 0 ||
                state.fixableErrorCount > 0 ||
                state.fixableWarningCount > 0) {
                commentResult = yield client.issues.createComment({
                    owner: constants_1.OWNER,
                    repo: constants_1.REPO,
                    issue_number: data.issueNumber,
                    body: markdown_1.getResultMarkdownBody(data),
                });
            }
            else if (data.issueSummaryOnlyOnEvent) {
                commentResult = yield client.issues.createComment({
                    owner: constants_1.OWNER,
                    repo: constants_1.REPO,
                    issue_number: data.issueNumber,
                    body: '-- Message Removed, Refresh to Update --',
                });
                yield client.issues.deleteComment({
                    owner: constants_1.OWNER,
                    repo: constants_1.REPO,
                    comment_id: commentResult.data.id,
                });
            }
            if (commentResult) {
                const userId = commentResult.data.user.id;
                yield Promise.all(issues.data.reduce((arr, issue) => {
                    if (issue.user.id === userId) {
                        arr.push(client.issues.deleteComment({
                            owner: constants_1.OWNER,
                            repo: constants_1.REPO,
                            comment_id: issue.id,
                        }));
                    }
                    return arr;
                }, []));
            }
        }
    });
}
exports.handleIssueComment = handleIssueComment;
