import { ESLint } from 'eslint';
import { getChangedFiles } from './fs';
import { Octokit, ActionData } from './types';
import { createCheck } from './api';
import { processLintResults } from './utils';
import { NAME } from './constants';

export async function lintChangedFiles(
  client: Octokit,
  data: ActionData,
): Promise<void> {
  const eslint = new ESLint({
    extensions: data.eslint.extensions,
    ignorePath: data.eslint.useEslintIgnore ? '.gitignore' : undefined,
    ignore: data.eslint.useEslintIgnore,
    useEslintrc: data.eslint.useEslintrc,
    rulePaths: data.eslint.rulePaths,
    errorOnUnmatchedPattern: data.eslint.errorOnUnmatchedPattern,
    fix: data.eslint.fix,
    fixTypes: data.eslint.fixTypes,
    overrideConfigFile: data.eslint.overrideConfigFile,
  });

  const updateCheck = await createCheck(client, data);

  let errorCount = 0;

  for await (const changed of await getChangedFiles(client, data)) {
    console.log('[CHANGED BATCH] : Files : ', changed);

    if (changed.length === 0) {
      break;
    }

    const results = await eslint.lintFiles(changed);

    console.log(results);

    const output = processLintResults(results);

    console.log(output);

    errorCount += output.errorCount;

    await updateCheck({
      status: 'in_progress',
      output: {
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
}
