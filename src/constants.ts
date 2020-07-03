/* eslint-disable @typescript-eslint/no-namespace */
import * as github from '@actions/github';

// eslint-disable-next-line @typescript-eslint/prefer-namespace-keyword
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      GITHUB_WORKSPACE: string;
    }
  }
}

export const NAME = 'Eslint Changed';

export const {
  eventName: EVENT,
  issue: { owner: OWNER, repo: REPO, number: ISSUE_NUMBER },
  payload: {
    base: {
      repo: { full_name: BASE_FULL_NAME },
    },
    head: {
      repo: { full_name: HEAD_FULL_NAME },
    },
  },
} = github.context;

export const IS_READ_ONLY = BASE_FULL_NAME !== HEAD_FULL_NAME;

export const { GITHUB_WORKSPACE } = process.env;
