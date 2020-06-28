// import * as core from '@actions/core';
import { CLIEngine } from 'eslint';
import { getChangedFiles } from './fs';
import { Octokit, ActionData, LintState } from './types';
import { createCheck } from './api';
import { processLintResults } from './utils';
import { NAME, OWNER, REPO } from './constants';

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

  const state: LintState = {
    errorCount: 0,
    warningCount: 0,
    fixableErrorCount: 0,
    fixableWarningCount: 0,
    ignoredCount: 0,
    ignoredFiles: [],
    summary: '',
    rulesSummaries: new Map(),
  };

  for await (const changed of await getChangedFiles(client, data)) {
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
                  message: annotation.message + annotation.suggestions,
                };
              })
            : output.annotations,
      },
    });
  }
  const summary = `
|     Type     |       Occurrences       |            Fixable           |
| ------------ | ----------------------- | ---------------------------- | 
| **Errors**   | ${state.errorCount}     | ${state.fixableErrorCount}   |
| **Warnings** | ${state.warningCount}   | ${state.fixableWarningCount} |
| **Ignored**  | ${state.ignoredCount}   | N/A                          |
  `;
  const ignoredFilesMarkdown = data.reportIgnoredFiles
    ? `
## Ignored Files:
${state.ignoredFiles.map((filePath) => `- ${filePath}`).join('\n')}
    `
    : '';

  const checkResult = await updateCheck({
    conclusion: state.errorCount > 0 ? 'failure' : 'success',
    status: 'completed',
    completed_at: new Date().toISOString(),
    output: {
      title: 'Checks Complete',
      summary: summary + ignoredFilesMarkdown,
    },
    // TODO
    // actions:
    //   state.fixableErrorCount > 0 || state.fixableWarningCount > 0
    //     ? [
    //         {
    //           label: `Fix ${
    //             state.fixableErrorCount + state.fixableWarningCount
    //           } Issues`,
    //           description:
    //             '[UNFINISHED] Run eslint --fix',
    //           identifier: 'fix',
    //         },
    //       ]
    //     : undefined,
  });

  let commentResult;

  if (data.prID && data.issueSummary) {
    const { issueSummaryType } = data;

    const issues = await client.issues.listComments({
      issue_number: data.prID,
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
      const checkUrl = data.prHtmlUrl
        ? `${data.prHtmlUrl}/checks?check_run_id=${checkResult.data.id}`
        : checkResult.data.html_url;

      commentResult = await client.issues.createComment({
        owner: OWNER,
        repo: REPO,
        issue_number: data.prID,
        body: `
  ## ESLint Summary [View Full Report](${checkUrl})
  
  > Annotations are provided inline on the [Files Changed](${
    data.prHtmlUrl
  }/files) tab. You can also see all annotations that were generated on the [annotations page](${checkUrl}).
  
  ${summary}
  
  - **Result:**      ${checkResult.data.conclusion}
  - **Annotations:** [${
    checkResult.data.output.annotations_count
  } total](${checkUrl})
  
  ${
    issueSummaryType === 'full'
      ? `
  ---
  
  ${ignoredFilesMarkdown}
  `
      : ''
  }
  ---
  
  ${[...state.rulesSummaries]
    .sort(([, a], [, b]) => a.level.localeCompare(b.level))
    .map(
      ([, summary]) =>
        `## [${summary.level}] ${
          summary.ruleUrl
            ? `[${summary.ruleId}](${summary.ruleUrl})`
            : summary.ruleId
        } 
  
  > ${summary.message}
  
  ${summary.annotations
    .map(
      (annotation) =>
        `- [${annotation.path}](${data.repoHtmlUrl}/blob/${data.sha}/${
          annotation.path
        }#L${annotation.start_line}-L${annotation.end_line}) Line ${
          annotation.start_line
        } - ${annotation.message}${
          issueSummaryType === 'full' ? annotation.suggestions : ''
        }`,
    )
    .join('\n')}`,
    )
    .join('\n\n---\n\n')}
    
---

<sup>
Report generated by <b><a href="https://github.com/bradennapier/eslint-plus-action">eslint-plus-action</a></b>
</sup>`,
      });
    } else if (data.issueSummaryOnlyOnEvent) {
      // super hacky until find a way to figure out the bots user id in some other way
      commentResult = await client.issues.createComment({
        owner: OWNER,
        repo: REPO,
        issue_number: data.prID,
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

      const userIssues = issues.data.filter(
        (issue) => issue.user.id === userId,
      );

      if (userIssues.length > 0) {
        await Promise.all(
          userIssues.map((issue) =>
            client.issues.deleteComment({
              owner: OWNER,
              repo: REPO,
              comment_id: issue.id,
            }),
          ),
        );
      }
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
