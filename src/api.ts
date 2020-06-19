import * as core from '@actions/core';

import { PrResponse, Octokit, ActionData } from './types';
import { NAME, OWNER, REPO } from './constants';

export async function fetchFilesBatchPR(
  client: Octokit,
  prNumber: number,
  startCursor?: string,
  owner: string = OWNER,
  repo: string = REPO,
): Promise<PrResponse> {
  const { repository } = await client.graphql(
    `
      query ChangedFilesBatch(
        $owner: String!
        $repo: String!
        $prNumber: Int!
        $startCursor: String
      ) {
        repository(owner: $owner, name: $repo) {
          pullRequest(number: $prNumber) {
            files(first: 100, after: $startCursor) {
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
    `,
    { owner, repo, prNumber, startCursor },
  );

  const pr = repository.pullRequest;

  if (!pr || !pr.files) {
    core.info(`No PR or PR files detected`);
    return { files: [] };
  }

  core.info(
    `PR with files detected: ${pr.files.edges.map((e: any) => e.node.path)}`,
  );

  return {
    ...pr.files.pageInfo,
    files: pr.files.edges.map((e: any) => e.node.path),
  };
}

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
export async function fetchFilesBatchCommit(
  client: Octokit,
  data: ActionData,
  owner: string = OWNER,
  repo: string = REPO,
): Promise<string[]> {
  try {
    const resp = await client.repos.getCommit({
      owner,
      repo,
      ref: data.sha,
    });

    const filesChanged = resp.data.files.map((f) => f.filename);

    core.info(`Files changed: ${filesChanged}`);

    return filesChanged;
  } catch (err) {
    core.error(err);
    return [];
  }
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export async function createCheck(
  client: Octokit,
  data: ActionData,
  owner: string = OWNER,
  repo: string = REPO,
) {
  const result = await client.checks.create({
    name: NAME,
    head_sha: data.sha,
    status: 'in_progress',
    started_at: new Date().toISOString(),
    owner,
    repo,
  });
  return result;
}
