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

const C = {
  event: '',
};

({
  eventName: C.event,
  issue: ,
  payload: {
    pull_request: {
      base: {
        repo: { full_name:  },
      },
      head: {
        repo: { full_name: HEAD_FULL_NAME },
      },
    },
  },
} = github.context);

export const BASE_FULL_NAME = github.context.payload.pull_request?.additions

export const { owner: OWNER, repo: REPO, number: ISSUE_NUMBER } = github.context.issue

export const IS_READ_ONLY = BASE_FULL_NAME !== HEAD_FULL_NAME;

export const { GITHUB_WORKSPACE } = process.env;
