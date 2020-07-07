import { promises as file } from 'fs';
import * as artifact from '@actions/artifact';

import { ActionData, Octokit, GitHubArtifact } from './types';
import { REPO, OWNER, CACHE_KEY } from './constants';
import { unzipEntry } from './fs';

export async function saveArtifacts(
  data: ActionData,
  contents: string,
): Promise<void> {
  await file.mkdir('/action/.artifacts', { recursive: true });
  await file.writeFile(
    `/action/.artifacts/${CACHE_KEY}-${data.issueNumber}-${data.runId}`,
    contents,
  );
  const client = artifact.create();
  await client.uploadArtifact(
    `${CACHE_KEY}-${data.issueNumber}-${data.runId}`,
    [`/action/.artifacts/${CACHE_KEY}-${data.issueNumber}-${data.runId}`],
    '/action/.artifacts/',
  );
}

export async function downloadAllCachedArtifacts(
  client: Octokit,
): Promise<string[]> {
  const artifacts = await client.actions.listArtifactsForRepo({
    owner: OWNER,
    repo: REPO,
  });

  const filtered = artifacts.data.artifacts.filter((artifact) =>
    artifact.name.startsWith(CACHE_KEY),
  );

  return Promise.all(
    filtered.map((artifact) => downloadArtifact(client, artifact)),
  );
}

export async function downloadArtifact(
  client: Octokit,
  target: GitHubArtifact,
): Promise<string> {
  const downloadData = await client.actions.downloadArtifact({
    owner: OWNER,
    repo: REPO,
    artifact_id: target.id,
    archive_format: 'zip',
  });

  return unzipEntry(target.name, Buffer.from(downloadData.data));
}
