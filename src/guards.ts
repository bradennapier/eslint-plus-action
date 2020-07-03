import { Webhooks } from '@octokit/webhooks';
import type { context as Context } from '@actions/github';

export function isPullRequestPayload(
  payload: typeof Context['payload'],
): payload is Webhooks.WebhookPayloadPullRequest {
  if (payload.pull_request) {
    return true;
  }
  return false;
}

export function isIssueCommentPayload(
  payload: typeof Context['payload'],
): payload is Webhooks.WebhookPayloadIssueComment {
  if (payload.comment) {
    return true;
  }
  return false;
}
