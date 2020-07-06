import { promises as file } from 'fs';
import fs from 'fs';
import got from 'got';

import { promisify } from 'util';
import stream from 'stream';

import * as artifact from '@actions/artifact';

import { ActionData, Octokit, GitHubArtifact } from './types';
import { REPO, OWNER, CACHE_KEY } from './constants';

const pipeline = promisify(stream.pipeline);

export async function saveArtifacts(
  data: ActionData,
  contents: string,
): Promise<void> {
  await file.mkdir('/action/.artifacts', { recursive: true });
  await file.writeFile(`/action/.artifacts/${data.runId}`, contents);
  const client = artifact.create();
  await client.uploadArtifact(
    String(data.runId),
    [`/action/.artifacts/${CACHE_KEY}-${data.issueNumber}-${data.runId}`],
    '/action/.artifacts/',
  );
}

export async function downloadAllArtifacts(client: Octokit): Promise<void> {
  await file.mkdir('/action/.artifacts', { recursive: true });

  const artifactClient = artifact.create();
  const results = await artifactClient.downloadAllArtifacts(
    '/action/.artifacts',
  );
  const artifacts = await client.actions.listArtifactsForRepo({
    owner: OWNER,
    repo: REPO,
  });
  console.log(
    'Artifact Download Results: ',
    results,
    JSON.stringify(artifacts || {}, null, 2),
  );
  const lastArtifact: GitHubArtifact = artifacts.data.artifacts[0];

  if (lastArtifact) {
    await downloadArtifact(client, lastArtifact);
  }
}

export async function downloadArtifact(
  client: Octokit,
  target: GitHubArtifact,
): Promise<void> {
  // const result = await client.actions.downloadArtifact({
  //   owner: OWNER,
  //   repo: REPO,
  //   artifact_id: artifactId,
  //   archive_format: 'zip',
  // });
  // console.log(result.headers?.location, result);

  // if (!result.headers.location) {
  //   throw new Error('No URL found for artifact');
  // }

  await pipeline(
    got.stream(target.archive_download_url),
    fs.createWriteStream(`/action/.artifacts/${target.name}.zip`),
  );

  console.log('File Downloaded');
}
