import * as core from '@actions/core';
import { CLIEngine } from 'eslint';
import {
  ChecksUpdateParamsOutputAnnotations,
  ChecksUpdateParamsOutput,
  LintState,
  ActionData,
} from './types';
import { GITHUB_WORKSPACE } from './constants';

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
  engine: CLIEngine,
  report: CLIEngine.LintReport,
  state: LintState,
  data: ActionData,
): {
  annotations: ChecksUpdateParamsOutput['annotations'];
} {
  const { results } = report;
  const annotations: ChecksUpdateParamsOutputAnnotations[] = [];

  state.errorCount += report.errorCount;
  state.warningCount += report.warningCount;
  state.fixableErrorCount += report.fixableErrorCount;
  state.fixableWarningCount += report.fixableWarningCount;

  for (const result of results) {
    const { filePath, messages } = result;

    for (const lintMessage of messages) {
      const { line, severity, ruleId, message, suggestions = [] } = lintMessage;

      core.debug(
        `Level ${severity} issue found on line ${line} [${ruleId}] ${message}`,
      );

      // if ruleId is null, it's likely a parsing error, so let's skip it
      if (!ruleId) {
        continue;
      }

      const level = severity === 2 ? 'failure' : 'warning';

      if (!data.annotateWarnings && level !== 'failure') {
        continue;
      }

      // console.log(ruleId, result, lintMessage);
      // if (suggestions) {
      //   console.log(JSON.stringify(suggestions, null, 2));
      // }
      const annotation: ChecksUpdateParamsOutputAnnotations = {
        path: filePath.replace(`${GITHUB_WORKSPACE}/`, ''),
        start_line: line,
        end_line: line,
        annotation_level: level,
        title: ruleId,
        message: `${message}${
          suggestions && suggestions.length > 0
            ? `

${suggestions
  .map((suggestion) => `    * [SUGGESTION] ${suggestion.desc}`)
  .join('\n')}
`
            : ''
        }`,
      };

      const rule = state.rulesSummaries.get(ruleId);
      if (!rule) {
        const ruleDocs = engine.getRules().get(ruleId)?.meta?.docs;
        state.rulesSummaries.set(ruleId, {
          ruleUrl: ruleDocs?.url,
          ruleId,
          message: ruleDocs?.description || '',
          level: severity === 2 ? 'failure' : 'warning',
          annotations: [annotation],
        });
      } else {
        rule.annotations.push(annotation);
      }

      annotations.push(annotation);
    }
  }

  return {
    annotations,
  };
}
