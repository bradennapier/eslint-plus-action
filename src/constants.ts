/* eslint-disable @typescript-eslint/no-namespace */
import * as github from '@actions/github';
import { isPullRequestPayload } from './guards';
import { IssuePersistentState, WorkflowPersistentState } from './types';

// eslint-disable-next-line @typescript-eslint/prefer-namespace-keyword
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      GITHUB_WORKSPACE: string;
    }
  }
}

const context = github.context;

export const DEFAULT_ISSUE_STATE: Omit<
  IssuePersistentState,
  'workflow'
> = Object.freeze({
  issue: Object.freeze({
    id: undefined,
    summaryId: undefined,
  }),
});

export const DEFAULT_WORKFLOW_STATE: WorkflowPersistentState = Object.freeze({
  id: undefined,
  path: undefined,
  userId: undefined,
  scheduler: Object.freeze({
    lastRunAt: undefined,
  }),
});

export const NAME = 'ESLint Results';

export const ARTIFACT_KEY = 'eslint-v8-cache-key';

export const ARTIFACT_KEY_LINT_RESULTS = `${ARTIFACT_KEY}-lint-results`;
export const ARTIFACT_KEY_ISSUE_STATE = `${ARTIFACT_KEY}-state`;

export const ARTIFACTS_BASE_DIR = '/action/.artifacts';

export const SERIALIZED_ROUTES = [
  '/repos/:owner/:repo/check-runs',
  '/repos/:owner/:repo/check-runs/:check_run_id',
  '/repos/:owner/:repo/issues/:issue_number/comments',
];

export const BASE_FULL_NAME = isPullRequestPayload(context.payload)
  ? context.payload.pull_request.base.repo.full_name
  : undefined;

export const HEAD_FULL_NAME = isPullRequestPayload(context.payload)
  ? context.payload.pull_request.head.repo.full_name
  : undefined;

export const { owner: OWNER, repo: REPO, number: ISSUE_NUMBER } =
  github.context.issue || github.context.repo;

/**
 * @see https://developer.github.com/v3/checks/runs/#output-object-1
 */
export const GITHUB_ANNOTATION_LIMIT = 50;

export const { GITHUB_WORKSPACE } = process.env;
