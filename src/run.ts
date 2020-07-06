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
import { saveArtifacts, downloadAllArtifacts } from './artifacts';

async function run(): Promise<void> {
  try {
    // console.log(JSON.stringify(context, null, 2));
    console.log(context.issue);
    console.log(context.repo);

    const isReadOnly = BASE_FULL_NAME !== HEAD_FULL_NAME;

    const data: ActionData = {
      isReadOnly,
      handleForks: true,
      sha: context.payload.pull_request?.head.sha || context.sha,
      eventName: context.eventName,

      runId: context.runId,
      runNumber: context.runNumber,
      ref: context.ref,

      issueNumber: ISSUE_NUMBER,
      issueSummary: processBooleanInput('issueSummary', true),
      issueSummaryMethod: processEnumInput(
        'issueSummaryMethod',
        ['edit', 'refresh'],
        'edit',
      ),
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

      state: {
        userId: 0,
        lintCount: 0,
        errorCount: 0,
        warningCount: 0,
        fixableErrorCount: 0,
        fixableWarningCount: 0,
        ignoredCount: 0,
        ignoredFiles: [],
        summary: '',
        rulesSummaries: new Map(),
        annotationCount: 0,
        conclusion: 'pending',
        checkId: 0,
      },

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

    const client = getOctokitClient(data);

    const currentUser = await client.users.getAuthenticated().catch((err) => {
      console.error('Error Current User: ', err);
      return null;
    });
    const currentApp = await client.apps.getAuthenticated().catch((err) => {
      console.error('Error Current App: ', err);
      return null;
    });

    console.log({ currentApp, currentUser });

    // 156673153
    if (data.eventName === 'schedule') {
      console.log('Download All Artifacts');
      await downloadAllArtifacts(client);
      // await client.deserializeArtifacts();
    } else {
      await lintChangedFiles(client, data);

      if (data.isReadOnly && data.handleForks === true) {
        const artifacts: string = await client.getSerializedArtifacts();
        // save artifacts by the sha so that
        await saveArtifacts(data, artifacts);
      }
    }
  } catch (err) {
    core.error(err);
    core.setFailed(err.message);
  }
}

run();

export default run;
