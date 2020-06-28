"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCheck = exports.createCheck = exports.fetchFilesBatchCommit = exports.fetchFilesBatchPR = void 0;
const tslib_1 = require("tslib");
const core = tslib_1.__importStar(require("@actions/core"));
const constants_1 = require("./constants");
function fetchFilesBatchPR(client, prNumber, startCursor, owner = constants_1.OWNER, repo = constants_1.REPO) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const { repository } = yield client.graphql(`
      query ChangedFilesBatch(
        $owner: String!
        $repo: String!
        $prNumber: Int!
        $startCursor: String
      ) {
        repository(owner: $owner, name: $repo) {
          pullRequest(number: $prNumber) {
            files(first: 50, after: $startCursor) {
              pageInfo {
                hasNextPage
                endCursor
              }
              totalCount
              edges {
                cursor
                node {
                  path
                }
              }
            }
          }
        }
      }
    `, { owner, repo, prNumber, startCursor });
        const pr = repository.pullRequest;
        if (!pr || !pr.files) {
            core.info(`No PR or PR files detected`);
            return { files: [] };
        }
        core.info(`PR with files detected: ${pr.files.edges.map((e) => e.node.path)}`);
        return Object.assign(Object.assign({}, pr.files.pageInfo), { files: pr.files.edges.map((e) => e.node.path) });
    });
}
exports.fetchFilesBatchPR = fetchFilesBatchPR;
function fetchFilesBatchCommit(client, data, owner = constants_1.OWNER, repo = constants_1.REPO) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        try {
            const resp = yield client.repos.getCommit({
                owner,
                repo,
                ref: data.sha,
            });
            const filesChanged = resp.data.files.map((f) => f.filename);
            core.info(`Files changed: ${filesChanged}`);
            return filesChanged;
        }
        catch (err) {
            core.error(err);
            return [];
        }
    });
}
exports.fetchFilesBatchCommit = fetchFilesBatchCommit;
function createCheck(client, data, owner = constants_1.OWNER, repo = constants_1.REPO) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const result = yield client.checks.create({
            name: constants_1.NAME,
            head_sha: data.sha,
            status: 'in_progress',
            started_at: new Date().toISOString(),
            owner,
            repo,
        });
        return (params) => updateCheck(client, result.data.id, owner, repo, params);
    });
}
exports.createCheck = createCheck;
function updateCheck(client, checkID, owner, repo, params) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const result = yield client.checks.update(Object.assign({ name: constants_1.NAME, check_run_id: checkID, status: 'in_progress', owner,
            repo }, params));
        return result;
    });
}
exports.updateCheck = updateCheck;
