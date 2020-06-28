"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const core = tslib_1.__importStar(require("@actions/core"));
const github = tslib_1.__importStar(require("@actions/github"));
const eslint_1 = require("./eslint");
const utils_1 = require("./utils");
function run() {
    var _a, _b, _c, _d;
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        try {
            const { context } = github;
            // console.log(context, process.env);
            // core.debug('👋 Hello! You are an amazing person! 🙌');
            const client = github.getOctokit(core.getInput('github-token', { required: true }));
            const data = {
                prID: (_a = github.context.payload.pull_request) === null || _a === void 0 ? void 0 : _a.number,
                sha: ((_b = context.payload.pull_request) === null || _b === void 0 ? void 0 : _b.head.sha) || context.sha,
                repoHtmlUrl: (_c = context.payload.repository) === null || _c === void 0 ? void 0 : _c.html_url,
                prHtmlUrl: (_d = context.payload.pull_request) === null || _d === void 0 ? void 0 : _d.html_url,
                includeGlob: utils_1.processArrayInput('includeGlob', []),
                ignoreGlob: utils_1.processArrayInput('ignoreGlob', []),
                annotateWarnings: utils_1.processBooleanInput('annotateWarnings', true),
                issueSummary: utils_1.processBooleanInput('issueSummary', true),
                issueSummaryType: utils_1.processEnumInput('issueSummaryType', ['full', 'compact'], 'compact'),
                reportWarningsAsErrors: utils_1.processBooleanInput('reportWarningsAsErrors', false),
                reportIgnoredFiles: utils_1.processBooleanInput('reportIgnoredFiles', false),
                reportSuggestions: utils_1.processBooleanInput('reportSuggestions', true),
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
            core.info(`Context:\n ${JSON.stringify(data, null, 2)}`);
            yield eslint_1.lintChangedFiles(client, data);
        }
        catch (err) {
            core.error(err);
            core.setFailed(err.message);
        }
    });
}
run();
exports.default = run;
