"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateWorkflowState = exports.updateIssueState = exports.getWorkflowState = exports.getIssueState = exports.downloadArtifact = exports.deleteArtifactByName = exports.deleteArtifacts = exports.cleanupArtifactsForIssue = exports.downloadArtifacts = exports.saveArtifact = void 0;
const tslib_1 = require("tslib");
const fs_1 = require("fs");
const path_1 = tslib_1.__importDefault(require("path"));
const lodash_clonedeep_1 = tslib_1.__importDefault(require("lodash.clonedeep"));
const artifact = tslib_1.__importStar(require("@actions/artifact"));
const constants_1 = require("./constants");
const fs_2 = require("./fs");
const utils_1 = require("./utils");
const defaultArtifactFilter = (artifacts) => artifacts.filter((artifact) => artifact.name.startsWith(constants_1.ARTIFACT_KEY));
function getArtifactsForRepo(client) {
    return client.actions.listArtifactsForRepo({
        owner: constants_1.OWNER,
        repo: constants_1.REPO,
    });
}
function deleteArtifact(client, artifact) {
    return client.actions.deleteArtifact({
        owner: constants_1.OWNER,
        repo: constants_1.REPO,
        artifact_id: artifact.id,
    });
}
function saveArtifact(filename, contents) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const filePath = path_1.default.join(constants_1.ARTIFACTS_BASE_DIR, filename);
        yield fs_1.promises.mkdir(constants_1.ARTIFACTS_BASE_DIR, { recursive: true });
        yield fs_1.promises.writeFile(filePath, contents);
        const client = artifact.create();
        yield client.uploadArtifact(filename, [filePath], constants_1.ARTIFACTS_BASE_DIR);
    });
}
exports.saveArtifact = saveArtifact;
function downloadArtifacts(client, filter = defaultArtifactFilter, _artifacts) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const artifacts = _artifacts || (yield getArtifactsForRepo(client));
        const filtered = filter
            ? filter(artifacts.data.artifacts)
            : artifacts.data.artifacts;
        if (filtered.length === 0) {
            return [];
        }
        return Promise.all(filtered.map((artifact) => downloadArtifact(client, artifact)));
    });
}
exports.downloadArtifacts = downloadArtifacts;
function cleanupArtifactsForIssue(client, data, _artifacts) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield Promise.all([
            deleteArtifacts(client, (artifacts) => artifacts.filter((artifact) => [utils_1.getIssueStateName(data), utils_1.getIssueLintResultsName(data)].includes(artifact.name))),
            _artifacts,
        ]);
    });
}
exports.cleanupArtifactsForIssue = cleanupArtifactsForIssue;
function deleteArtifacts(client, filter = defaultArtifactFilter, _artifacts) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const artifacts = _artifacts || (yield getArtifactsForRepo(client));
        const filtered = filter
            ? filter(artifacts.data.artifacts)
            : artifacts.data.artifacts;
        if (filtered.length === 0) {
            return;
        }
        yield Promise.all(filtered.map((artifact) => deleteArtifact(client, artifact)));
    });
}
exports.deleteArtifacts = deleteArtifacts;
function deleteArtifactByName(client, name, _artifacts) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const artifacts = _artifacts || (yield getArtifactsForRepo(client));
        const names = Array.isArray(name) ? name : [name];
        const filtered = artifacts.data.artifacts.filter((artifact) => names.includes(artifact.name));
        if (filtered.length === 0) {
            return;
        }
        yield Promise.all(filtered.map((artifact) => deleteArtifact(client, artifact)));
    });
}
exports.deleteArtifactByName = deleteArtifactByName;
function downloadArtifact(client, target) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const downloadData = yield client.actions.downloadArtifact({
            owner: constants_1.OWNER,
            repo: constants_1.REPO,
            artifact_id: target.id,
            archive_format: 'zip',
        });
        return fs_2.unzipEntry(target.name, Buffer.from(downloadData.data));
    });
}
exports.downloadArtifact = downloadArtifact;
function getIssueState(client, data, _artifacts) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const artifacts = _artifacts || (yield getArtifactsForRepo(client));
        const [[artifact], workflowState] = yield Promise.all([
            downloadArtifacts(client, (artifactList) => artifactList.filter((a) => a.name === utils_1.getIssueStateName(data)), artifacts),
            getWorkflowState(client, data, artifacts),
        ]);
        if (!artifact) {
            const state = lodash_clonedeep_1.default(constants_1.DEFAULT_ISSUE_STATE);
            state.issue.id = data.issueNumber;
            state.workflow = Object.freeze(workflowState);
            return state;
        }
        return JSON.parse(artifact);
    });
}
exports.getIssueState = getIssueState;
function getWorkflowState(client, data, _artifacts) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const [artifact] = yield downloadArtifacts(client, (artifactList) => artifactList.filter((a) => a.name === utils_1.getWorkflowStateName(data)), _artifacts || (yield getArtifactsForRepo(client)));
        if (!artifact) {
            return lodash_clonedeep_1.default(constants_1.DEFAULT_WORKFLOW_STATE);
        }
        return JSON.parse(artifact);
    });
}
exports.getWorkflowState = getWorkflowState;
function updateIssueState(data) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield saveArtifact(utils_1.getIssueStateName(data), JSON.stringify(Object.assign(Object.assign({}, data.persist), { workflow: undefined })));
    });
}
exports.updateIssueState = updateIssueState;
function updateWorkflowState(client, data, workflowState) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const artifacts = yield getArtifactsForRepo(client);
        const name = utils_1.getWorkflowStateName(data);
        yield Promise.all([
            deleteArtifactByName(client, name, artifacts),
            saveArtifact(name, JSON.stringify(workflowState)),
        ]);
    });
}
exports.updateWorkflowState = updateWorkflowState;
