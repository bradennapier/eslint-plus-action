// import { promisify } from 'util';
// import zlib from 'zlib';
// import fs, { promises as fsp } from 'fs';
import Zip from 'adm-zip';
import { Octokit } from '@octokit/rest';

// import { requestRouteMatcher } from './utils/SerializerOctokitPlugin/routeMatcher';
import { GitHubArtifact } from './types';

// const SERIALIZED_ROUTES = [
//   '/repos/:owner/:repo/check-runs',
//   '/repos/:owner/:repo/check-runs/:check_run_id',
// ];

const client = new Octokit({
  auth: process.env.GITHUB_AUTH,
});

/**
 * Converts an ArrayBuffer to a String.
 *
 * @param buffer - Buffer to convert.
 * @returns String.
 */
export default function arrayBufferToString(buffer: ArrayBuffer): string {
  return String.fromCharCode.apply(null, Array.from(new Uint8Array(buffer)));
}

/**
 * unzip for handling artifact downloadsm, expects the name of the file to get
 * from the zip archive
 */
// export const unzipEntry = (entryName: string, buf: Buffer): Promise<string> =>
//   new Promise((resolve) => {
//     const zip = new Zip(buf);
//     zip.readAsTextAsync(zip.getEntry(entryName), resolve);
//   });

// async function downloadArtifact(
//   client: Octokit,
//   target: GitHubArtifact,
// ): Promise<void> {
//   const downloadData = await client.actions.downloadArtifact({
//     owner: 'bradennapier',
//     repo: 'eslint-plus-action',
//     artifact_id: target.id,
//     archive_format: 'zip',
//   });

//   const data = JSON.parse(
//     await unzipEntry(target.name, Buffer.from(downloadData.data)),
//   );

//   return data;
// }

async function run() {
  // const { body } = await got(
  //   'https://api.github.com/repos/bradennapier/eslint-plus-action/actions/artifacts',
  // );
  // console.log(JSON.parse(body));
  const artifacts = await client.actions.listArtifactsForRepo({
    owner: 'bradennapier',
    repo: 'eslint-plus-action',
  });
  console.log(JSON.stringify(artifacts.data, null, 2));

  // await Promise.all(
  //   artifacts.data.artifacts.map((artifact) => {
  //     return client.actions.deleteArtifact({
  //       owner: 'bradennapier',
  //       repo: 'eslint-plus-action',
  //       artifact_id: artifact.id,
  //     });
  //   }),
  // );
  // const lastArtifact: GitHubArtifact = artifacts.data.artifacts[0];

  // console.log(await downloadArtifact(client, lastArtifact));
  // const data = ((await unzip(buf)) as any) as Buffer;
  // console.log(data.toString());
  // await fsp.writeFile('test2.zip', Buffer.from(downloadData.data));

  // await pipeline(
  //   got.stream(downloadData.url),
  //   fs.createWriteStream(`test.zip`),
  // );
}

run();
