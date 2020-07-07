"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadArtifact = exports.downloadAllCachedArtifacts = exports.saveArtifacts = void 0;
const tslib_1 = require("tslib");
const fs_1 = require("fs");
const artifact = tslib_1.__importStar(require("@actions/artifact"));
const constants_1 = require("./constants");
const fs_2 = require("./fs");
function saveArtifacts(data, contents) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield fs_1.promises.mkdir('/action/.artifacts', { recursive: true });
        yield fs_1.promises.writeFile(`/action/.artifacts/${constants_1.CACHE_KEY}-${data.issueNumber}-${data.runId}`, contents);
        const client = artifact.create();
        yield client.uploadArtifact(`${constants_1.CACHE_KEY}-${data.issueNumber}-${data.runId}`, [`/action/.artifacts/${constants_1.CACHE_KEY}-${data.issueNumber}-${data.runId}`], '/action/.artifacts/');
    });
}
exports.saveArtifacts = saveArtifacts;
function downloadAllCachedArtifacts(client) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const artifacts = yield client.actions.listArtifactsForRepo({
            owner: constants_1.OWNER,
            repo: constants_1.REPO,
        });
        const filtered = artifacts.data.artifacts.filter((artifact) => artifact.name.startsWith(constants_1.CACHE_KEY));
        return Promise.all(filtered.map((artifact) => downloadArtifact(client, artifact)));
    });
}
exports.downloadAllCachedArtifacts = downloadAllCachedArtifacts;
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
