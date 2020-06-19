import * as github from '@actions/github';

export const NAME = 'Eslint Changed';

export const OWNER = github.context.repo.owner;

export const REPO = github.context.repo.repo;
