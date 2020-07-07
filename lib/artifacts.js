"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadArtifact = exports.downloadAllArtifacts = exports.saveArtifacts = void 0;
const tslib_1 = require("tslib");
const fs_1 = require("fs");
const util_1 = require("util");
const stream_1 = tslib_1.__importDefault(require("stream"));
const artifact = tslib_1.__importStar(require("@actions/artifact"));
const constants_1 = require("./constants");
const pipeline = util_1.promisify(stream_1.default.pipeline);
function saveArtifacts(data, contents) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield fs_1.promises.mkdir('/action/.artifacts', { recursive: true });
        yield fs_1.promises.writeFile(`/action/.artifacts/${data.runId}`, contents);
        const client = artifact.create();
        yield client.uploadArtifact(String(data.runId), [`/action/.artifacts/${constants_1.CACHE_KEY}-${data.issueNumber}-${data.runId}`], '/action/.artifacts/');
    });
}
exports.saveArtifacts = saveArtifacts;
function downloadAllArtifacts(client) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield fs_1.promises.mkdir('/action/.artifacts', { recursive: true });
        const artifactClient = artifact.create();
        const results = yield artifactClient.downloadAllArtifacts('/action/.artifacts');
        const artifacts = yield client.actions.listArtifactsForRepo({
            owner: constants_1.OWNER,
            repo: constants_1.REPO,
        });
        console.log('Artifact Download Results: ', results, JSON.stringify(artifacts || {}, null, 2));
        const lastArtifact = artifacts.data.artifacts[0];
        if (lastArtifact) {
            yield downloadArtifact(client, lastArtifact);
        }
    });
}
exports.downloadAllArtifacts = downloadAllArtifacts;
function downloadArtifact(client, target) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const downloadData = yield client.actions.downloadArtifact({
            owner: constants_1.OWNER,
            repo: constants_1.REPO,
            artifact_id: target.id,
            archive_format: 'zip',
        });
        console.log('Download Data: ', downloadData, downloadData.data.toString());
        console.log('File Downloaded');
    });
}
exports.downloadArtifact = downloadArtifact;
