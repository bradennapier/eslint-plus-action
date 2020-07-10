"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const core = tslib_1.__importStar(require("@actions/core"));
const github_1 = require("@actions/github");
const eslint_1 = require("./eslint");
const utils_1 = require("./utils");
const constants_1 = require("./constants");
const octokit_1 = require("./utils/octokit");
const artifacts_1 = require("./artifacts");
const issues_1 = require("./issues");
const lodash_clonedeep_1 = tslib_1.__importDefault(require("lodash.clonedeep"));
function run() {
    var _a, _b, _c;
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        try {
            const isReadOnly = constants_1.BASE_FULL_NAME !== constants_1.HEAD_FULL_NAME;
            const data = {
                isReadOnly,
                sha: ((_a = github_1.context.payload.pull_request) === null || _a === void 0 ? void 0 : _a.head.sha) || github_1.context.sha,
                eventName: github_1.context.eventName,
                name: github_1.context.workflow,
                runId: github_1.context.runId,
                runNumber: github_1.context.runNumber,
                ref: github_1.context.ref,
                issueNumber: constants_1.ISSUE_NUMBER,
                issueSummary: utils_1.processBooleanInput('issueSummary', true),
                issueSummaryMethod: utils_1.processEnumInput('issueSummaryMethod', ['edit', 'refresh'], 'edit'),
                issueSummaryType: utils_1.processEnumInput('issueSummaryType', ['full', 'compact'], 'compact'),
                issueSummaryOnlyOnEvent: utils_1.processBooleanInput('issueSummaryOnlyOnEvent', false),
                repoHtmlUrl: (_b = github_1.context.payload.repository) === null || _b === void 0 ? void 0 : _b.html_url,
                prHtmlUrl: (_c = github_1.context.payload.pull_request) === null || _c === void 0 ? void 0 : _c.html_url,
                includeGlob: utils_1.processArrayInput('includeGlob', []),
                ignoreGlob: utils_1.processArrayInput('ignoreGlob', []),
                reportWarningsAsErrors: utils_1.processBooleanInput('reportWarningsAsErrors', false),
                reportIgnoredFiles: utils_1.processBooleanInput('reportIgnoredFiles', false),
                reportSuggestions: utils_1.processBooleanInput('reportSuggestions', true),
                reportWarnings: utils_1.processBooleanInput('reportWarnings', true),
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
                persist: {},
                eslint: {
                    errorOnUnmatchedPattern: utils_1.processBooleanInput('errorOnUnmatchedPattern', false),
                    extensions: utils_1.processArrayInput('extensions', [
                        '.js',
                        '.jsx',
                        '.ts',
                        '.tsx',
                    ]),
                    rulePaths: utils_1.processArrayInput('rulePaths', []),
                    followSymbolicLinks: utils_1.processBooleanInput('followSymbolicLinks', true),
                    useEslintIgnore: utils_1.processBooleanInput('useEslintIgnore', true),
                    ignorePath: utils_1.processInput('ignorePath', null) || undefined,
                    useEslintrc: utils_1.processBooleanInput('useEslintrc', true),
                    configFile: utils_1.processInput('configFile', null) || undefined,
                    fix: utils_1.processBooleanInput('useEslintrc', false),
                },
            };
            const client = octokit_1.getOctokitClient(data);
            switch (data.eventName) {
                case 'schedule': {
                    const workflowState = yield artifacts_1.getWorkflowState(client, data);
                    const artifacts = yield artifacts_1.downloadArtifacts(client, (artifacts) => artifacts.filter((artifact) => artifact.name.startsWith(constants_1.ARTIFACT_KEY_LINT_RESULTS)));
                    yield client.deserializeArtifacts(artifacts);
                    workflowState.scheduler.lastRunAt = new Date().toISOString();
                    yield artifacts_1.updateWorkflowState(client, data, workflowState);
                    break;
                }
                case 'closed': {
                    yield artifacts_1.cleanupArtifactsForIssue(client, data);
                    break;
                }
                case 'opened':
                case 'synchronize':
                default: {
                    data.persist = yield artifacts_1.getIssueState(client, data);
                    const startState = lodash_clonedeep_1.default(data.persist);
                    if (data.isReadOnly && !utils_1.isSchedulerActive(data)) {
                        console.warn(`[WARN] | Read Only & schedule not found, we will not run on this PR.`);
                        return;
                    }
                    yield eslint_1.lintChangedFiles(client, data);
                    if (data.isReadOnly) {
                        const artifacts = yield client.getSerializedArtifacts();
                        yield artifacts_1.saveArtifact(utils_1.getIssueLintResultsName(data), artifacts);
                    }
                    else {
                        yield issues_1.handleIssueComment(client, data);
                        yield utils_1.updateIssueStateIfNeeded(client, startState, data);
                    }
                    yield utils_1.updateWorkflowStateIfNeeded(client, startState, data);
                    break;
                }
            }
        }
        catch (err) {
            core.error(err);
            core.setFailed(err.message);
        }
    });
}
run();
exports.default = run;
