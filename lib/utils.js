"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateWorkflowStateIfNeeded = exports.updateIssueStateIfNeeded = exports.processLintResults = exports.processInput = exports.processBooleanInput = exports.processEnumInput = exports.processArrayInput = exports.isSchedulerActive = exports.getIssueLintResultsName = exports.getIssueStateName = exports.getWorkflowStateName = void 0;
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
function processLintResults(engine, reports, data) {
    var _a;
    const { state } = data;
    const annotations = [];
    for (const report of reports) {
        const { messages, filePath } = report;
        state.errorCount += report.errorCount;
        state.warningCount += report.warningCount;
        state.fixableErrorCount += report.fixableErrorCount;
        state.fixableWarningCount += report.fixableWarningCount;
        const adjustedFilepath = filePath.replace(`${constants_1.GITHUB_WORKSPACE}/`, '');
        core.debug(`----- Results for File: ${adjustedFilepath} -----`);
        for (const lintMessage of messages) {
            const { line, severity, ruleId, message, messageId, nodeType, suggestions = [], } = lintMessage;
            core.debug(`Level ${severity} issue found on line ${line} [${ruleId}] | ${messageId} | ${nodeType} | ${message}`);
            if (!ruleId) {
                if (message.startsWith('File ignored')) {
                    state.warningCount -= 1;
                    state.ignoredCount += 1;
                    state.ignoredFiles.push(adjustedFilepath);
                }
                continue;
            }
            const level = severity === 2 || data.reportWarningsAsErrors ? 'failure' : 'warning';
            if (!data.reportWarnings && level !== 'failure') {
                continue;
            }
            const annotation = {
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
                const ruleDocs = (_a = engine.getRulesMetaForResults(reports)[ruleId]) === null || _a === void 0 ? void 0 : _a.docs;
                state.rulesSummaries.set(ruleId, {
                    ruleUrl: ruleDocs === null || ruleDocs === void 0 ? void 0 : ruleDocs.url,
                    ruleId,
                    message: (ruleDocs === null || ruleDocs === void 0 ? void 0 : ruleDocs.description) || '',
                    level,
                    annotations: [annotation],
                });
            }
            else {
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
exports.processLintResults = processLintResults;
function updateIssueStateIfNeeded(client, prevState, data) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const promises = [];
        const prevIssueState = Object.assign(Object.assign({}, prevState), { workflow: undefined });
        const nextIssueState = Object.assign(Object.assign({}, data.persist), { workflow: undefined });
        if (!util_1.isDeepStrictEqual(prevIssueState, nextIssueState)) {
            console.log('Issue State Updating');
            console.log(JSON.stringify(prevIssueState, null, 2), JSON.stringify(nextIssueState, null, 2));
            promises.push(artifacts_1.updateIssueState(client, data));
        }
        yield Promise.all(promises);
    });
}
exports.updateIssueStateIfNeeded = updateIssueStateIfNeeded;
function updateWorkflowStateIfNeeded(client, prevState, data) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (!util_1.isDeepStrictEqual(prevState.workflow, data.persist.workflow)) {
            console.log('Workflow State Updating');
            console.log(JSON.stringify(prevState.workflow, null, 2), JSON.stringify(data.persist.workflow, null, 2));
            yield artifacts_1.updateWorkflowState(client, data, data.persist.workflow);
        }
    });
}
exports.updateWorkflowStateIfNeeded = updateWorkflowStateIfNeeded;
