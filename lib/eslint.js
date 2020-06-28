"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lintChangedFiles = void 0;
const tslib_1 = require("tslib");
// import * as core from '@actions/core';
const eslint_1 = require("eslint");
const fs_1 = require("./fs");
const api_1 = require("./api");
const utils_1 = require("./utils");
const constants_1 = require("./constants");
function lintChangedFiles(client, data) {
    var e_1, _a;
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        console.log('dirs: ', __dirname, process.cwd());
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
        const eslint = new eslint_1.CLIEngine(eslintConfig);
        const updateCheck = yield api_1.createCheck(client, data);
        const state = {
            errorCount: 0,
            warningCount: 0,
            fixableErrorCount: 0,
            fixableWarningCount: 0,
            ignoredCount: 0,
            ignoredFiles: [],
            summary: '',
            rulesSummaries: new Map(),
        };
        try {
            for (var _b = tslib_1.__asyncValues(yield fs_1.getChangedFiles(client, data)), _c; _c = yield _b.next(), !_c.done;) {
                const changed = _c.value;
                // console.log('[CHANGED BATCH] : Files : ', changed);
                if (changed.length === 0) {
                    break;
                }
                const results = yield eslint.executeOnFiles(changed);
                const output = utils_1.processLintResults(eslint, results, state, data);
                yield updateCheck({
                    status: 'in_progress',
                    output: {
                        title: constants_1.NAME,
                        summary: `${state.errorCount} error(s) found so far`,
                        annotations: output.annotations,
                    },
                });
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) yield _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
        let summary = `
|     Type     |       Occurrences       |            Fixable           |
| ------------ | ----------------------- | ---------------------------- | 
| **Errors**   | ${state.errorCount}     | ${state.fixableErrorCount}   |
| **Warnings** | ${state.warningCount}   | ${state.fixableWarningCount} |
| **Ignored**  | ${state.ignoredCount}   | N/A                          |
  `;
        if (data.reportIgnoredFiles) {
            summary += `
## Ignored Files:
${state.ignoredFiles.map((filePath) => `- ${filePath}`).join('\n')}
    `;
        }
        const checkResult = yield updateCheck({
            conclusion: state.errorCount > 0 ? 'failure' : 'success',
            status: 'completed',
            completed_at: new Date().toISOString(),
            output: {
                title: 'Checks Complete',
                summary,
            },
        });
        if (data.prID && data.issueSummary) {
            // const annotations = await client.checks.listAnnotations({
            //   check_run_id: checkResult.data.id,
            //   owner: OWNER,
            //   repo: REPO,
            // });
            // console.log('Annotations: ', JSON.stringify(annotations.data, null, 2));
            const issues = yield client.issues.listComments({
                issue_number: data.prID,
                owner: constants_1.OWNER,
                repo: constants_1.REPO,
            });
            // const actionIssues = issues.data.filter(issue => issue.user.id)
            // console.log('Issues: ', JSON.stringify(issues.data, null, 2));
            const checkUrl = data.prHtmlUrl
                ? `${data.prHtmlUrl}/checks?check_run_id=${checkResult.data.id}`
                : checkResult.data.html_url;
            const commentResult = yield client.issues.createComment({
                owner: constants_1.OWNER,
                repo: constants_1.REPO,
                issue_number: data.prID,
                body: `
## [Eslint Summary](${checkUrl})

> Annotations are provided inline on the [Files Changed](${data.prHtmlUrl}/files) tab. You can also see all annotations that were generated on the [annotations page](${checkUrl}).

${summary}

- **Result:**      ${checkResult.data.conclusion}
- **Annotations:** [${checkResult.data.output.annotations_count} total](${checkUrl})

---

${[...state.rulesSummaries]
                    .sort(([, a], [, b]) => a.level.localeCompare(b.level))
                    .map(([, summary]) => `## [${summary.level}] ${summary.ruleUrl
                    ? `[${summary.ruleId}](${summary.ruleUrl})`
                    : summary.ruleId} 

> ${summary.message}

${summary.annotations
                    .map((annotation) => `- [${annotation.path}](${data.repoHtmlUrl}/blob/${data.sha}/${annotation.path}#L${annotation.start_line}-L${annotation.end_line}) Line ${annotation.start_line} - ${annotation.message}`)
                    .join('\n')}`)
                    .join('\n\n---\n\n')}
      `,
            });
            const userId = commentResult.data.user.id;
            const userIssues = issues.data.filter((issue) => issue.user.id === userId);
            // console.log(userIssues);
            if (userIssues.length > 0) {
                yield Promise.all(userIssues.map((issue) => client.issues.deleteComment({
                    owner: constants_1.OWNER,
                    repo: constants_1.REPO,
                    comment_id: issue.id,
                })));
            }
        }
    });
}
exports.lintChangedFiles = lintChangedFiles;
