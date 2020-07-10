import { Octokit, ActionData } from './types';
import { OWNER, REPO } from './constants';
import { getResultMarkdownBody } from './utils/markdown';

async function removeIssueSummary(client: Octokit, data: ActionData) {
  if (data.persist.issue.summaryId) {
    // delete previous and add new
    await client.issues.deleteComment({
      owner: OWNER,
      repo: REPO,
      comment_id: data.persist.issue.summaryId,
    });
    data.persist.issue.summaryId = undefined;
  }
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export async function handleIssueComment(client: Octokit, data: ActionData) {
  const { state } = data;
  if (data.issueNumber && data.issueSummary) {
    if (
      !data.issueSummaryOnlyOnEvent ||
      state.errorCount > 0 ||
      state.warningCount > 0 ||
      state.fixableErrorCount > 0 ||
      state.fixableWarningCount > 0
    ) {
      if (data.persist.issue.summaryId && data.issueSummaryMethod === 'edit') {
        // delete previous and add new
        await client.issues.updateComment({
          owner: OWNER,
          repo: REPO,
          comment_id: data.persist.issue.summaryId,
          body: getResultMarkdownBody(data),
        });
      } else if (
        data.persist.issue.summaryId &&
        data.issueSummaryMethod === 'refresh'
      ) {
        await removeIssueSummary(client, data);
      }
      if (!data.persist.issue.summaryId) {
        const commentResult = await client.issues.createComment({
          owner: OWNER,
          repo: REPO,
          issue_number: data.issueNumber,
          body: getResultMarkdownBody(data),
        });
        // persist the comments id so we can edit or remove it in future
        data.persist.issue.summaryId = commentResult.data.id;
        data.persist.action.userId = commentResult.data.user.id;
      }
    } else if (data.issueSummaryOnlyOnEvent && data.persist.issue.summaryId) {
      await removeIssueSummary(client, data);
    }
  }
}
