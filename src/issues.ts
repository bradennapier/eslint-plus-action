import {
  OctokitCreateCommentResponse,
  OctokitDeleteCommentResponse,
  Octokit,
  ActionData,
} from './types';
import { OWNER, REPO } from './constants';
import { getResultMarkdownBody } from './utils/markdown';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export async function handleIssueComment(client: Octokit, data: ActionData) {
  const { state } = data;

  let commentResult: OctokitCreateCommentResponse | undefined;

  if (data.issueNumber && data.issueSummary) {
    const issues = await client.issues.listComments({
      issue_number: data.issueNumber,
      owner: OWNER,
      repo: REPO,
    });

    if (
      !data.issueSummaryOnlyOnEvent ||
      state.errorCount > 0 ||
      state.warningCount > 0 ||
      state.fixableErrorCount > 0 ||
      state.fixableWarningCount > 0
    ) {
      commentResult = await client.issues.createComment({
        owner: OWNER,
        repo: REPO,
        issue_number: data.issueNumber,
        body: getResultMarkdownBody(data),
      });
    } else if (data.issueSummaryOnlyOnEvent) {
      // super hacky until find a way to figure out the bots user id in some other way
      commentResult = await client.issues.createComment({
        owner: OWNER,
        repo: REPO,
        issue_number: data.issueNumber,
        body: '-- Message Removed, Refresh to Update --',
      });
      await client.issues.deleteComment({
        owner: OWNER,
        repo: REPO,
        comment_id: commentResult.data.id,
      });
    }

    if (commentResult) {
      const userId = commentResult.data.user.id;

      await Promise.all(
        issues.data.reduce((arr, issue) => {
          if (issue.user.id === userId) {
            arr.push(
              client.issues.deleteComment({
                owner: OWNER,
                repo: REPO,
                comment_id: issue.id,
              }),
            );
          }
          return arr;
        }, [] as Promise<OctokitDeleteCommentResponse>[]),
      );
    }
  }
}
