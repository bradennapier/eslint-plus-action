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

export const OWNER = github.context.repo.owner;

export const REPO = github.context.repo.repo;
export const { GITHUB_WORKSPACE } = process.env;
