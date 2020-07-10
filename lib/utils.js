"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePersistentStateIfNeeded = exports.processLintResults = exports.processInput = exports.processBooleanInput = exports.processEnumInput = exports.processArrayInput = exports.isSchedulerActive = exports.getIssueLintResultsName = exports.getIssueStateName = exports.getWorkflowStateName = void 0;
const tslib_1 = require("tslib");
const util_1 = require("util");
const dayjs_1 = tslib_1.__importDefault(require("dayjs"));
const core = tslib_1.__importStar(require("@actions/core"));
const constants_1 = require("./constants");
const artifacts_1 = require("./artifacts");
exports.getWorkflowStateName = (data) => `${constants_1.ARTIFACT_KEY_ISSUE_STATE}-${data.name}`;
exports.getIssueStateName = (data) => `${constants_1.ARTIFACT_KEY_ISSUE_STATE}-${data.name}-${data.issueNumber}`;
exports.getIssueLintResultsName = (data) => `${constants_1.ARTIFACT_KEY_LINT_RESULTS}-${data.name}-${data.issueNumber}`;
function oneDayAgo() {
    return dayjs_1.default().subtract(24, 'hour');
}
function isSchedulerActive(data) {
    const active = data.persist.workflow.scheduler.lastRunAt
        ? dayjs_1.default(data.persist.workflow.scheduler.lastRunAt).isAfter(oneDayAgo())
        : false;
    return active;
}
exports.isSchedulerActive = isSchedulerActive;
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
function resultIsInEnum(result, values) {
    return values.includes(result);
}
exports.processEnumInput = (key, values, defaultValue) => {
    const result = core.getInput(key, {
        required: typeof defaultValue === 'undefined',
    });
    if (!result) {
        if (typeof defaultValue === 'undefined') {
            throw new Error(`No result for input '${key}' and no default value was provided`);
        }
        return defaultValue;
    }
    if (!resultIsInEnum(result, values)) {
        throw new Error(`Input of "${result}" for property "${key}" must be one of: "${values.join(', ')}"`);
    }
    return result;
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
function processLintResults(engine, report, data) {
    var _a, _b;
    const { state } = data;
    const { results } = report;
    const annotations = [];
    state.errorCount += report.errorCount;
    state.warningCount += report.warningCount;
    state.fixableErrorCount += report.fixableErrorCount;
    state.fixableWarningCount += report.fixableWarningCount;
    for (const result of results) {
        const { messages } = result;
        const filePath = result.filePath.replace(`${constants_1.GITHUB_WORKSPACE}/`, '');
        core.debug(`----- Results for File: ${filePath} -----`);
        for (const lintMessage of messages) {
            const { line, severity, ruleId, message, messageId, nodeType, suggestions = [], } = lintMessage;
            core.debug(`Level ${severity} issue found on line ${line} [${ruleId}] | ${messageId} | ${nodeType} | ${message}`);
            if (!ruleId) {
                if (message.startsWith('File ignored')) {
                    state.warningCount -= 1;
                    state.ignoredCount += 1;
                    state.ignoredFiles.push(filePath);
                }
                continue;
            }
            const level = severity === 2 || data.reportWarningsAsErrors ? 'failure' : 'warning';
            if (!data.reportWarnings && level !== 'failure') {
                continue;
            }
            const annotation = {
                path: filePath,
                start_line: line,
                end_line: line,
                annotation_level: level,
                title: ruleId,
                message: `${message}`,
                suggestions,
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
    state.annotationCount += annotations.length;
    return {
        annotations,
    };
}
exports.processLintResults = processLintResults;
function updatePersistentStateIfNeeded(client, prevState, data) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const promises = [];
        if (!util_1.isDeepStrictEqual(Object.assign(Object.assign({}, prevState), { workflow: undefined }), Object.assign(Object.assign({}, data.persist), { workflow: undefined }))) {
            console.log('Issue State Updating');
            promises.push(artifacts_1.updateIssueState(client, data));
        }
        if (!util_1.isDeepStrictEqual(prevState.workflow, data.persist.workflow)) {
            console.log('Workflow State Updating');
            promises.push(artifacts_1.updateWorkflowState(client, data, data.persist.workflow));
        }
        yield Promise.all(promises);
    });
}
exports.updatePersistentStateIfNeeded = updatePersistentStateIfNeeded;
