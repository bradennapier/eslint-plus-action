import * as core from '@actions/core';
import { context } from '@actions/github';

import { lintChangedFiles } from './eslint';
import {
  processArrayInput,
  processBooleanInput,
  processInput,
  processEnumInput,
} from './utils';
import { ActionData } from './types';
import { BASE_FULL_NAME, HEAD_FULL_NAME, ISSUE_NUMBER } from './constants';
import { getOctokitClient } from './utils/octokit';

async function run(): Promise<void> {
  try {
    console.log(JSON.stringify(context, null, 2));
    console.log(context.issue);
    console.log(context.repo);

    const isReadOnly = BASE_FULL_NAME !== HEAD_FULL_NAME;

    const data: ActionData = {
      isReadOnly,
      handleForks: true,
      serializer: undefined,
      sha: context.payload.pull_request?.head.sha || context.sha,

      issueNumber: ISSUE_NUMBER,
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

      repoHtmlUrl: context.payload.repository?.html_url,
      prHtmlUrl: context.payload.pull_request?.html_url,
      includeGlob: processArrayInput('includeGlob', []),
      ignoreGlob: processArrayInput('ignoreGlob', []),

      reportWarningsAsErrors: processBooleanInput(
        'reportWarningsAsErrors',
        false,
      ),
      reportIgnoredFiles: processBooleanInput('reportIgnoredFiles', false),
      reportSuggestions: processBooleanInput('reportSuggestions', true),
      reportWarnings: processBooleanInput('reportWarnings', true),

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

    if (data.isReadOnly && data.handleForks !== true) {
      /*
        When an action is triggered by a pull request from a forked repo we will only have
        read permissions available to us.  Our solution to this is to run this action on a schedule
        which will check for artifacts, assuming it is running properly.

        This process will only start running once it sees an artifact is available from the scheduling 
        context.
      */
      return;
    }

    await lintChangedFiles(getOctokitClient(data), data);
  } catch (err) {
    core.error(err);
    core.setFailed(err.message);
  }
}

run();

export default run;
