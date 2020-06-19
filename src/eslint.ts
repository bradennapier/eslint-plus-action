// import * as core from '@actions/core';
import { CLIEngine } from 'eslint';
import { getChangedFiles } from './fs';
import { Octokit, ActionData, LintState } from './types';
import { createCheck } from './api';
import { processLintResults } from './utils';
import { NAME, OWNER, REPO } from './constants';
// import path from 'path';

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

  for await (const changed of await getChangedFiles(client, data)) {
    // console.log('[CHANGED BATCH] : Files : ', changed);

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
        annotations: output.annotations,
      },
    });
  }
  const summary = `
|     Type     |       Occurrences       |            Fixable           |
| ------------ | ----------------------- | ---------------------------- | 
| **Errors**   | ${state.errorCount}     | ${state.fixableErrorCount}   |
| **Warnings** | ${state.warningCount}   | ${state.fixableWarningCount} |
  `;
  const checkResult = await updateCheck({
    conclusion: state.errorCount > 0 ? 'failure' : 'success',
    status: 'completed',
    completed_at: new Date().toISOString(),
    output: {
      title: 'Checks Complete',
      summary,
    },
    actions:
      state.fixableErrorCount > 0 || state.fixableWarningCount > 0
        ? [
            {
              label: `Fix ${
                state.fixableErrorCount + state.fixableWarningCount
              } Issues (UNFINISHED)`,
              description: 'Run eslint --fix on the fixable errors & warnings?',
              identifier: 'fix',
            },
          ]
        : undefined,
  });
  if (data.prID && data.issueSummary) {
    // const annotations = await client.checks.listAnnotations({
    //   check_run_id: checkResult.data.id,
    //   owner: OWNER,
    //   repo: REPO,
    // });

    // console.log('Annotations: ', JSON.stringify(annotations.data, null, 2));

    const issues = await client.issues.listComments({
      issue_number: data.prID,
      owner: OWNER,
      repo: REPO,
    });

    // const actionIssues = issues.data.filter(issue => issue.user.id)
    // console.log('Issues: ', JSON.stringify(issues.data, null, 2));

    const checkUrl = data.prHtmlUrl
      ? `${data.prHtmlUrl}/checks?check_run_id=${checkResult.data.id}`
      : checkResult.data.html_url;

    const commentResult = await client.issues.createComment({
      owner: OWNER,
      repo: REPO,
      issue_number: data.prID,
      body: `
## [Eslint Summary](${checkUrl})

> Annotations are provided inline on the [Files Changed](${
        data.prHtmlUrl
      }/files) tab. You can also see all annotations that were generated on the [annotations page](${checkUrl}).

${summary}

- **Result:**      ${checkResult.data.conclusion}
- **Annotations:** [${
        checkResult.data.output.annotations_count
      } total](${checkUrl})

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
      `- [${annotation.path}](${data.repoHtmlUrl}/blob/${data.sha}/${annotation.path}#L${annotation.start_line}-L${annotation.end_line}) Line ${annotation.start_line} - ${annotation.message}`,
  )
  .join('\n')}`,
  )
  .join('\n\n---\n\n')}
      `,
    });

    const userId = commentResult.data.user.id;

    const userIssues = issues.data.filter((issue) => issue.user.id === userId);

    // console.log(userIssues);

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

  // await client.repos.createOrUpdateFileContents({
  //   owner: OWNER,
  //   repo: REPO,
  //   path: 'src/test.md',
  //   message: 'Commit Message',
  //   content: Buffer.from('Hello').toString('base64'),
  // });
}
