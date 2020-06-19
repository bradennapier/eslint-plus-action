import * as core from '@actions/core';
import { CLIEngine } from 'eslint';
import { getChangedFiles } from './fs';
import { Octokit, ActionData, LintState } from './types';
import { createCheck } from './api';
import { processLintResults } from './utils';
import { NAME, OWNER, REPO } from './constants';
import path from 'path';

export async function lintChangedFiles(
  client: Octokit,
  data: ActionData,
): Promise<void> {
  const eslint = new CLIEngine({
    extensions: data.eslint.extensions,
    ignorePath: data.eslint.useEslintIgnore ? '.gitignore' : undefined,
    ignore: data.eslint.useEslintIgnore,
    useEslintrc: data.eslint.useEslintrc,
    rulePaths: data.eslint.rulePaths,
    errorOnUnmatchedPattern: data.eslint.errorOnUnmatchedPattern,
    fix: data.eslint.fix,
    configFile: data.eslint.configFile,
  });

  const updateCheck = await createCheck(client, data);

  const state: LintState = {
    errorCount: 0,
    warningCount: 0,
    fixableErrorCount: 0,
    fixableWarningCount: 0,
    summary: '',
    rulesSummaries: new Map(),
  };
  let errorCount = 0;

  for await (const changed of await getChangedFiles(client, data)) {
    console.log('[CHANGED BATCH] : Files : ', changed);

    if (changed.length === 0) {
      break;
    }

    const results = await eslint.executeOnFiles(changed);

    console.log(results);

    const output = processLintResults(eslint, results, state);

    console.log(output);

    errorCount += output.errorCount;

    await updateCheck({
      status: 'in_progress',
      output: {
        title: NAME,
        summary: `${errorCount} error(s) found so far`,
        annotations: output.annotations,
      },
    });
  }

  await updateCheck({
    conclusion: errorCount > 0 ? 'failure' : 'success',
    status: 'completed',
    completed_at: new Date().toISOString(),
    output: {
      title: NAME,
      summary: `Checks Complete: ${errorCount} error(s) found`,
    },
  });
  // client.repos.getContent({

  // })
  await client.repos.createOrUpdateFileContents({
    owner: OWNER,
    repo: REPO,
    path: path.join(process.cwd(), 'src/test.md'),
    message: 'Commit Message',
    content: 'Hello',
  });
}
