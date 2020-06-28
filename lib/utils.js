"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processLintResults = exports.processInput = exports.processBooleanInput = exports.processArrayInput = void 0;
const tslib_1 = require("tslib");
const core = tslib_1.__importStar(require("@actions/core"));
const constants_1 = require("./constants");
exports.processArrayInput = (key, defaultValue) => {
    const result = core.getInput(key, {
        required: typeof defaultValue === 'undefined',
    });
    if (!result) {
        if (typeof defaultValue === 'undefined') {
            throw new Error(`No result for input '${key}' and no default value was provided`);
        }
        return defaultValue;
    }
    return result.split(',').map((e) => e.trim());
};
exports.processBooleanInput = (key, defaultValue) => {
    const result = core.getInput(key, {
        required: typeof defaultValue === 'undefined',
    });
    if (!result || (result !== 'true' && result !== 'false')) {
        if (typeof defaultValue === 'undefined') {
            throw new Error(`No result for input '${key}' and no default value was provided`);
        }
        return defaultValue;
    }
    return result === 'true';
};
exports.processInput = (key, defaultValue) => {
    const result = core.getInput(key, {
        required: typeof defaultValue === 'undefined',
    });
    if (!result) {
        if (typeof defaultValue === 'undefined') {
            throw new Error(`No result for input '${key}' and no default value was provided`);
        }
        return defaultValue;
    }
    return result;
};
function processLintResults(engine, report, state, data) {
    var _a, _b;
    const { results } = report;
    const annotations = [];
    state.errorCount += report.errorCount;
    state.warningCount += report.warningCount;
    state.fixableErrorCount += report.fixableErrorCount;
    state.fixableWarningCount += report.fixableWarningCount;
    for (const result of results) {
        const { filePath, messages } = result;
        core.debug(`----- Results for File: ${filePath} -----`);
        for (const lintMessage of messages) {
            const { line, severity, ruleId, message, messageId, nodeType, suggestions = [], } = lintMessage;
            core.debug(`Level ${severity} issue found on line ${line} [${ruleId}] | ${messageId} | ${nodeType} | ${message}`);
            // if ruleId is null, it's likely a parsing error, so let's skip it
            if (!ruleId) {
                // remove confusing warnings when skipping linting of files
                if (message.startsWith('File ignored')) {
                    state.warningCount -= 1;
                    state.ignoredCount += 1;
                    state.ignoredFiles.push(filePath);
                }
                continue;
            }
            const level = severity === 2 || data.reportWarningsAsErrors ? 'failure' : 'warning';
            if (!data.annotateWarnings && level !== 'failure') {
                continue;
            }
            const annotation = {
                path: filePath.replace(`${constants_1.GITHUB_WORKSPACE}/`, ''),
                start_line: line,
                end_line: line,
                annotation_level: level,
                title: ruleId,
                message: `${message}${suggestions && suggestions.length > 0
                    ? `

${suggestions
                        .map((suggestion) => `    * [SUGGESTION] ${suggestion.desc}`)
                        .join('\n')}
`
                    : ''}`,
            };
            const rule = state.rulesSummaries.get(ruleId);
            if (!rule) {
                const ruleDocs = (_b = (_a = engine.getRules().get(ruleId)) === null || _a === void 0 ? void 0 : _a.meta) === null || _b === void 0 ? void 0 : _b.docs;
                state.rulesSummaries.set(ruleId, {
                    ruleUrl: ruleDocs === null || ruleDocs === void 0 ? void 0 : ruleDocs.url,
                    ruleId,
                    message: (ruleDocs === null || ruleDocs === void 0 ? void 0 : ruleDocs.description) || '',
                    level: severity === 2 ? 'failure' : 'warning',
                    annotations: [annotation],
                });
            }
            else {
                rule.annotations.push(annotation);
            }
            annotations.push(annotation);
        }
    }
    return {
        annotations,
    };
}
exports.processLintResults = processLintResults;
