import { isDeepStrictEqual } from 'util';

import day from 'dayjs';

import * as core from '@actions/core';
import { ESLint } from 'eslint';

import {
  ChecksAnnotations,
  ChecksUpdateParamsOutput,
  ActionData,
  Octokit,
  IssuePersistentState,
} from './types';

import {
  GITHUB_WORKSPACE,
  ARTIFACT_KEY_ISSUE_STATE,
  ARTIFACT_KEY_LINT_RESULTS,
} from './constants';
import { updateIssueState, updateWorkflowState } from './artifacts';

export const getWorkflowStateName = (data: ActionData): string =>
  `${ARTIFACT_KEY_ISSUE_STATE}-${data.name}`;

export const getIssueStateName = (data: ActionData): string =>
  `${ARTIFACT_KEY_ISSUE_STATE}-${data.name}-${data.issueNumber}`;

export const getIssueLintResultsName = (data: ActionData): string =>
  `${ARTIFACT_KEY_LINT_RESULTS}-${data.name}-${data.issueNumber}`;

function oneDayAgo() {
  return day().subtract(24, 'hour');
}

export function isSchedulerActive(data: ActionData): boolean {
  const active = data.persist.workflow.scheduler.lastRunAt
    ? day(data.persist.workflow.scheduler.lastRunAt).isAfter(oneDayAgo())
    : false;
  return active;
}

export const processArrayInput = <D>(
  key: string,
  defaultValue?: D,
): string[] | D => {
  const result = core.getInput(key, {
    required: typeof defaultValue === 'undefined',
  });
  if (!result) {
    if (typeof defaultValue === 'undefined') {
      throw new Error(
        `No result for input '${key}' and no default value was provided`,
      );
    }
    return defaultValue;
  }
  return result.split(',').map((e) => e.trim());
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resultIsInEnum<V>(result: any, values: V[]): result is V {
  return values.includes(result);
}

export const processEnumInput = <D, V>(
  key: string,
  values: V[],

  defaultValue?: D,
): V | D => {
  const result = core.getInput(key, {
    required: typeof defaultValue === 'undefined',
  });
  if (!result) {
    if (typeof defaultValue === 'undefined') {
      throw new Error(
        `No result for input '${key}' and no default value was provided`,
      );
    }
    return defaultValue;
  }
  if (!resultIsInEnum(result, values)) {
    throw new Error(
      `Input of "${result}" for property "${key}" must be one of: "${values.join(
        ', ',
      )}"`,
    );
  }
  return result;
};

export const processBooleanInput = <D>(
  key: string,
  defaultValue?: D,
): boolean | D => {
  const result = core.getInput(key, {
    required: typeof defaultValue === 'undefined',
  });
  if (!result || (result !== 'true' && result !== 'false')) {
    if (typeof defaultValue === 'undefined') {
      throw new Error(
        `No result for input '${key}' and no default value was provided`,
      );
    }
    return defaultValue;
  }
  return result === 'true';
};

export const processInput = <D>(key: string, defaultValue?: D): string | D => {
  const result = core.getInput(key, {
    required: typeof defaultValue === 'undefined',
  });
  if (!result) {
    if (typeof defaultValue === 'undefined') {
      throw new Error(
        `No result for input '${key}' and no default value was provided`,
      );
    }
    return defaultValue;
  }
  return result;
};

export function processLintResults(
  engine: ESLint,
  reports: ESLint.LintResult[],
  data: ActionData,
): {
  annotations: ChecksUpdateParamsOutput['annotations'];
} {
  const { state } = data;
  const annotations: ChecksAnnotations[] = [];

  for (const report of reports) {
    const { messages, filePath } = report;

    state.errorCount += report.errorCount;
    state.warningCount += report.warningCount;
    state.fixableErrorCount += report.fixableErrorCount;
    state.fixableWarningCount += report.fixableWarningCount;

    const adjustedFilepath = filePath.replace(`${GITHUB_WORKSPACE}/`, '');
    core.debug(`----- Results for File: ${adjustedFilepath} -----`);

    for (const lintMessage of messages) {
      const {
        line,
        severity,
        ruleId,
        message,
        messageId,
        nodeType,
        suggestions = [],
      } = lintMessage;

      core.debug(
        `Level ${severity} issue found on line ${line} [${ruleId}] | ${messageId} | ${nodeType} | ${message}`,
      );

      if (!ruleId) {
        // remove confusing warnings when skipping linting of files
        if (message.startsWith('File ignored')) {
          state.warningCount -= 1;
          state.ignoredCount += 1;
          state.ignoredFiles.push(adjustedFilepath);
        }
        continue;
      }

      const level =
        severity === 2 || data.reportWarningsAsErrors ? 'failure' : 'warning';

      if (!data.reportWarnings && level !== 'failure') {
        continue;
      }

      const annotation: ChecksAnnotations = {
        path: adjustedFilepath,
        start_line: line,
        end_line: line,
        annotation_level: level,
        title: ruleId,
        message: `${message}`,
        suggestions,
      };

      const rule = state.rulesSummaries.get(ruleId);
      if (!rule) {
        const ruleDocs = engine.getRulesMetaForResults(reports)[ruleId]?.docs;
        state.rulesSummaries.set(ruleId, {
          ruleUrl: ruleDocs?.url,
          ruleId,
          message: ruleDocs?.description || '',
          level,
          annotations: [annotation],
        });
      } else {
        rule.annotations.push(annotation);
      }

      console.warn('ESLint Annotation: ', annotation);

      annotations.push(annotation);
    }
  }

  state.annotationCount += annotations.length;

  return {
    annotations,
  };
}

export async function updateIssueStateIfNeeded(
  client: Octokit,
  prevState: IssuePersistentState,
  data: ActionData,
): Promise<void> {
  const promises: Array<Promise<unknown>> = [];
  const prevIssueState = {
    ...prevState,
    workflow: undefined,
  };
  const nextIssueState = {
    ...data.persist,
    workflow: undefined,
  };
  if (!isDeepStrictEqual(prevIssueState, nextIssueState)) {
    console.log('Issue State Updating');
    console.log(
      JSON.stringify(prevIssueState, null, 2),
      JSON.stringify(nextIssueState, null, 2),
    );
    // issue state updated
    promises.push(updateIssueState(client, data));
  }

  await Promise.all(promises);
}

export async function updateWorkflowStateIfNeeded(
  client: Octokit,
  prevState: IssuePersistentState,
  data: ActionData,
): Promise<void> {
  if (!isDeepStrictEqual(prevState.workflow, data.persist.workflow)) {
    console.log('Workflow State Updating');
    console.log(
      JSON.stringify(prevState.workflow, null, 2),
      JSON.stringify(data.persist.workflow, null, 2),
    );
    await updateWorkflowState(client, data, data.persist.workflow);
  }
}
