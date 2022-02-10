// import * as core from '@actions/core';
import { CLIEngine } from 'eslint';

import { getChangedFiles } from './fs';
import { Octokit, ActionData } from './types';
import { createCheck } from './api';
import { processLintResults } from './utils';
import { NAME, GITHUB_ANNOTATION_LIMIT } from './constants';
import {
  getLintSummary,
  getIgnoredFilesSummary,
  getAnnotationSuggestions,
} from './utils/markdown';

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

  const updateCheck = await createCheck(client, data);

  for await (const changed of getChangedFiles(client, data)) {
    if (changed.length === 0) {
      break;
    }

    const results = await eslint.executeOnFiles(changed);

    const output = processLintResults(eslint, results, data);

    if (output.annotations && output.annotations.length > 0) {
      const annotations = [...(output.annotations || [])];
      const batches: Array<typeof annotations> = [];
      while (annotations.length > 0) {
        batches.push(annotations.splice(0, GITHUB_ANNOTATION_LIMIT));
      }
      await Promise.all(
        batches.map((batch) =>
          updateCheck({
            status: 'in_progress',
            output: {
              title: NAME,
              summary: `${data.state.errorCount} error(s) found so far`,
              annotations: data.reportSuggestions
                ? batch.map((annotation) => {
                    return {
                      ...annotation,
                      message: `${
                        annotation.message
                      }\n\n${getAnnotationSuggestions(annotation)}`,
                    };
                  })
                : batch,
            },
          }),
        ),
      );
    }
  }

  data.state.conclusion =
    data.state.errorCount > 0 ||
    !data.reportWarningsAsErrors ||
    data.state.warningCount > 0
      ? 'failure'
      : 'success';

  await updateCheck({
    conclusion: data.state.conclusion,
    status: 'completed',
    completed_at: new Date().toISOString(),
    output: {
      title: 'Checks Complete',
      summary: getLintSummary(data) + getIgnoredFilesSummary(data, true),
    },
  });

  // TODO
  // await client.repos.createOrUpdateFileContents({
  //   owner: OWNER,
  //   repo: REPO,
  //   path: 'src/test.md',
  //   message: 'Commit Message',
  //   content: Buffer.from('Hello').toString('base64'),
  // });
}
