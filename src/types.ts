import * as github from '@actions/github';

export type PrResponse = {
  endCursor?: string;
  hasNextPage?: boolean;
  files: string[];
};

export type Octokit = ReturnType<typeof github['getOctokit']>;
export type GithubContext = typeof github['context'];

export type ActionData = {
  sha: string;
  prID: number | undefined;

  includeGlob: string[];
  ignoreGlob: string[];

  eslint: {
    rulePaths: string[];
    extensions: string[];
    overrideConfigFile: string | undefined;
    followSymbolicLinks: boolean;
    errorOnUnmatchedPattern: boolean;
    useEslintIgnore: boolean;
    ignorePath: string | undefined;
    useEslintrc: boolean;
    fix: boolean;
    fixTypes: undefined | ('problem' | 'suggestion' | 'layout' | undefined)[];
  };
};

export type ActionDataWithPR = Omit<ActionData, 'prID'> & { prID: number };
