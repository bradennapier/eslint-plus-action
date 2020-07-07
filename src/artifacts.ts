import { promises as file } from 'fs';
import path from 'path';
import * as artifact from '@actions/artifact';

import { Octokit, GitHubArtifact } from './types';
import { REPO, OWNER, CACHE_KEY, ARTIFACTS_BASE_DIR } from './constants';
import { unzipEntry } from './fs';

export async function saveArtifact(
  filename: string,
  contents: string,
): Promise<void> {
  const filePath = path.join(ARTIFACTS_BASE_DIR, filename);

  await file.mkdir(ARTIFACTS_BASE_DIR, { recursive: true });
  await file.writeFile(filePath, contents);

  const client = artifact.create();
  await client.uploadArtifact(filename, [filePath], ARTIFACTS_BASE_DIR);
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
