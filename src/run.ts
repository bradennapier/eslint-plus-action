import * as core from '@actions/core';
import * as github from '@actions/github';

import { lintChangedFiles } from './eslint';
import {
  processArrayInput,
  processBooleanInput,
  processInput,
  processEnumInput,
} from './utils';
import { ActionData } from './types';

async function run(): Promise<void> {
  try {
    const { context } = github;

    const client = github.getOctokit(
      core.getInput('github-token', { required: true }),
    );

    console.log(JSON.stringify(context, null, 2));

    const data: ActionData = {
      prID: github.context.payload.pull_request?.number,
      sha: context.payload.pull_request?.head.sha || context.sha,
      repoHtmlUrl: context.payload.repository?.html_url,
      prHtmlUrl: context.payload.pull_request?.html_url,
      includeGlob: processArrayInput('includeGlob', []),
      ignoreGlob: processArrayInput('ignoreGlob', []),
      annotateWarnings: processBooleanInput('annotateWarnings', true),
      issueSummary: processBooleanInput('issueSummary', true),
      issueSummaryType: processEnumInput(
        'issueSummaryType',
        ['full', 'compact'],
        'compact',
      ),
      issueSummaryOnlyOnEvent: processBooleanInput(
        'issueSummaryOnlyOnEvent',
        false,
      ),
      reportWarningsAsErrors: processBooleanInput(
        'reportWarningsAsErrors',
        false,
      ),
      reportIgnoredFiles: processBooleanInput('reportIgnoredFiles', false),
      reportSuggestions: processBooleanInput('reportSuggestions', true),
      eslint: {
        errorOnUnmatchedPattern: processBooleanInput(
          'errorOnUnmatchedPattern',
          false,
        ),
        extensions: processArrayInput('extensions', [
          '.js',
          '.jsx',
          '.ts',
          '.tsx',
        ]),
        rulePaths: processArrayInput('rulePaths', []),
        followSymbolicLinks: processBooleanInput('followSymbolicLinks', true),
        useEslintIgnore: processBooleanInput('useEslintIgnore', true),
        ignorePath: processInput('ignorePath', null) || undefined,
        useEslintrc: processBooleanInput('useEslintrc', true),
        configFile: processInput('configFile', null) || undefined,
        fix: processBooleanInput('useEslintrc', false),
      },
    };

    core.info(`Context:\n ${JSON.stringify(data, null, 2)}`);

    await lintChangedFiles(client, data);
  } catch (err) {
    core.error(err);
    core.setFailed(err.message);
  }
}

run();

export default run;
