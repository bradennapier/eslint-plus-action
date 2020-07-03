// import * as core from '@actions/core';
import { CLIEngine } from 'eslint';

import { getChangedFiles } from './fs';
import {
  Octokit,
  ActionData,
  LintState,
  OctokitCreateCommentResponse,
  OctokitDeleteCommentResponse,
} from './types';
import { createCheck } from './api';
import { processLintResults } from './utils';
import { NAME, OWNER, REPO } from './constants';
import {
  getLintSummary,
  getIgnoredFilesSummary,
  getAnnotationSuggestions,
  getResultMarkdownBody,
} from './utils/markdown';

// test eslint changed action from fork PR
const TEST = 2;

export async function lintChangedFiles(
  client: Octokit,
  data: ActionData,
): Promise<void> {
  const eslintConfig = {
    extensions: data.eslint.extensions,
    ignore: data.eslint.useEslintIgnore,
    useEslintrc: data.eslint.useEslintrc,
    rulePaths: data.eslint.rulePaths,
    errorOnUnmatchedPattern: data.eslint.errorOnUnmatchedPattern,
    fix: data.eslint.fix,
    configFile: data.eslint.configFile,
  };

  console.log('[ESLINT] Run With Configuration ', eslintConfig);

  const eslint = new CLIEngine(eslintConfig);

  const state: LintState = {
    lintCount: 0,
    errorCount: 0,
    warningCount: 0,
    fixableErrorCount: 0,
    fixableWarningCount: 0,
    ignoredCount: 0,
    ignoredFiles: [],
    summary: '',
    rulesSummaries: new Map(),
  };

  const updateCheck = await createCheck(client, data);

  for await (const changed of getChangedFiles(client, data)) {
    if (changed.length === 0) {
      break;
    }

    const results = await eslint.executeOnFiles(changed);

    const output = processLintResults(eslint, results, state, data);

    await updateCheck({
      status: 'in_progress',
      output: {
        title: NAME,
        summary: `${state.errorCount} error(s) found so far`,
        annotations:
          data.reportSuggestions && output.annotations
            ? output.annotations.map((annotation) => {
                return {
                  ...annotation,
                  message: `${annotation.message}\n\n${getAnnotationSuggestions(
                    annotation,
                  )}`,
                };
              })
            : output.annotations,
      },
    });
  }

  const checkResult = await updateCheck({
    conclusion: state.errorCount > 0 ? 'failure' : 'success',
    status: 'completed',
    completed_at: new Date().toISOString(),
    output: {
      title: 'Checks Complete',
      summary:
        getLintSummary(state) + getIgnoredFilesSummary(state, data, true),
    },
  });

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
        body: getResultMarkdownBody(checkResult, state, data),
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

  // TODO
  // await client.repos.createOrUpdateFileContents({
  //   owner: OWNER,
  //   repo: REPO,
  //   path: 'src/test.md',
  //   message: 'Commit Message',
  //   content: Buffer.from('Hello').toString('base64'),
  // });
}
