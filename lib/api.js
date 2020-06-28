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
// export async function fetchFilesBatchPR(
//   client: Octokit,
//   prNumber: number,
//   page?: number,
//   owner: string = OWNER,
//   repo: string = REPO,
// ): Promise<PrResponse> {
//   const result = await client.pulls.listFiles({
//     owner,
//     repo,
//     pull_number: prNumber,
//     per_page: 50,
//     page: page || 1,
//   });
//   if (!result || !result.data) {
//     core.info(`No PR or PR files detected`);
//     return { files: [], data: [] };
//   }
//   console.log('Result: ', JSON.stringify(result, null, 2));
//   core.info(
//     `PR with files detected: ${result.data
//       .map((file) => file.filename)
//       .join(', ')}`,
//   );
//   return {
//     nextPage: (page || 1) + 1,
//     files: result.data.map((file) => file.filename),
//     data: result.data,
//   };
// }
/**
 * Gets a list of all the files modified in this commit
 *
 * @param client The Octokit instance
 * @param sha The SHA for the Commit
 * @param owner The Owner of the Repository
 * @param repo The Repository name (slug)
 *
 * @returns string[] An Array of the file paths modified in this commit, relative to the repository root
 */
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
        // console.log('Check Created: ', result);
        return (params) => updateCheck(client, result.data.id, owner, repo, params);
    });
}
exports.createCheck = createCheck;
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
function updateCheck(client, checkID, owner, repo, params) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const result = yield client.checks.update(Object.assign({ name: constants_1.NAME, check_run_id: checkID, status: 'in_progress', owner,
            repo }, params));
        // console.log('Check Updated: ', JSON.stringify(result, null, 2));
        return result;
    });
}
exports.updateCheck = updateCheck;
