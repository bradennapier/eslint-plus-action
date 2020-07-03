/* eslint-disable @typescript-eslint/no-namespace */
import * as github from '@actions/github';
import { isPullRequestPayload } from './guards';

// eslint-disable-next-line @typescript-eslint/prefer-namespace-keyword
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      GITHUB_WORKSPACE: string;
    }
  }
}

const context = github.context;

export const NAME = 'ESLint Results';

export const BASE_FULL_NAME = isPullRequestPayload(context.payload)
  ? context.payload.pull_request.base.repo.full_name
  : undefined;

export const HEAD_FULL_NAME = isPullRequestPayload(context.payload)
  ? context.payload.pull_request.head.repo.full_name
  : undefined;

export const {
  owner: OWNER,
  repo: REPO,
  number: ISSUE_NUMBER,
} = github.context.issue;

export const { GITHUB_WORKSPACE } = process.env;
