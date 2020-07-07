"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadArtifact = exports.downloadAllCachedArtifacts = exports.saveArtifact = void 0;
const tslib_1 = require("tslib");
const fs_1 = require("fs");
const path_1 = tslib_1.__importDefault(require("path"));
const artifact = tslib_1.__importStar(require("@actions/artifact"));
const constants_1 = require("./constants");
const fs_2 = require("./fs");
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
