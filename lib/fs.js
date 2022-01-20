"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unzipEntry = exports.getChangedFiles = exports.filterFiles = void 0;
const tslib_1 = require("tslib");
const core = tslib_1.__importStar(require("@actions/core"));
const adm_zip_1 = tslib_1.__importDefault(require("adm-zip"));
const micromatch_1 = tslib_1.__importDefault(require("micromatch"));
const api_1 = require("./api");
function filterFiles(files, data) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const { extensions } = data.eslint;
        const matches = micromatch_1.default(files, [`**{${extensions.join(',')}}`]);
        const include = data.includeGlob.length > 0
            ? micromatch_1.default(matches, data.includeGlob)
            : matches;
        const ignore = data.ignoreGlob.length > 0 ? micromatch_1.default(include, data.ignoreGlob) : [];
        if (ignore.length === 0) {
            return include;
        }
        return include.filter((file) => !ignore.includes(file));
    });
}
exports.filterFiles = filterFiles;
function getFilesFromPR(client, data) {
    return tslib_1.__asyncGenerator(this, arguments, function* getFilesFromPR_1() {
        let cursor = undefined;
        while (true) {
            try {
                const result = yield tslib_1.__await(api_1.fetchFilesBatchPR(client, data.issueNumber, cursor));
                if (!result || !result.files.length) {
                    break;
                }
                const files = yield tslib_1.__await(filterFiles(result.files, data));
                yield yield tslib_1.__await(files);
                if (!result.hasNextPage)
                    break;
                cursor = result.endCursor;
            }
            catch (err) {
                core.error(err);
                throw err;
            }
        }
    });
}
function getFilesFromCommit(client, data) {
    return tslib_1.__asyncGenerator(this, arguments, function* getFilesFromCommit_1() {
        try {
            const files = yield tslib_1.__await(api_1.fetchFilesBatchCommit(client, data));
            const filtered = yield tslib_1.__await(filterFiles(files, data));
            while (filtered.length > 0) {
                yield yield tslib_1.__await(filtered.splice(0, 50));
            }
        }
        catch (err) {
            core.error(err);
            throw err;
        }
    });
}
function hasPR(data) {
    if (data.issueNumber) {
        return true;
    }
    return false;
}
function getChangedFiles(client, data) {
    if (hasPR(data)) {
        return getFilesFromPR(client, data);
    }
    return getFilesFromCommit(client, data);
}
exports.getChangedFiles = getChangedFiles;
exports.unzipEntry = (entryName, buf) => new Promise((resolve) => {
    const zip = new adm_zip_1.default(buf);
    zip.readAsTextAsync(zip.getEntry(entryName), resolve);
});
