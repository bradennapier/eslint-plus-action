// import { promises as fs } from 'fs';

import * as core from '@actions/core';
import micromatch from 'micromatch';

import { fetchFilesBatchPR, fetchFilesBatchCommit } from './api';
import { Octokit, PrResponse, ActionData, ActionDataWithPR } from './types';

function isExpectedExtension(file: string, extensions: string[]) {
  return extensions.some((ext) => file.endsWith(ext));
}

export async function filterFiles(
  files: string[],
  data: ActionData,
): Promise<string[]> {
  // const result: string[] = [];
  const include: string[] =
    data.includeGlob.length > 0 ? micromatch(files, data.includeGlob) : files;
  const ignore: string[] =
    data.ignoreGlob.length > 0 ? micromatch(include, data.ignoreGlob) : [];
  return include.filter(
    (file) =>
      !ignore.includes(file) &&
      isExpectedExtension(file, data.eslint.extensions),
  );
  // await Promise.all(
  //   filtered.map((file) =>
  //     fs
  //       .stat(file)
  //       .then(() => {
  //         result.push(file);
  //       })
  //       .catch(() => {
  //         // do nothing
  //       }),
  //   ),
  // );

  // return result;
}

async function* getFilesFromPR(
  client: Octokit,
  data: Omit<ActionData, 'prID'> & { prID: number },
): AsyncGenerator<string[]> {
  let cursor: string | undefined = undefined;

  while (true) {
    try {
      const result: PrResponse = await fetchFilesBatchPR(
        client,
        data.prID,
        cursor,
      );

      if (!result || !result.files.length) {
        break;
      }

      const files = await filterFiles(result.files, data);

      yield files;

      if (!result.hasNextPage) break;

      cursor = result.endCursor;
    } catch (err) {
      core.error(err);
      throw err;
    }
  }
}

async function* getFilesFromCommit(
  client: Octokit,
  data: ActionData,
): AsyncGenerator<string[]> {
  try {
    const files = await fetchFilesBatchCommit(client, data);
    const filtered = await filterFiles(files, data);

    while (filtered.length > 0) {
      yield filtered.splice(0, 50);
    }
  } catch (err) {
    core.error(err);
    throw err;
  }
}

function hasPR(data: ActionData | ActionDataWithPR): data is ActionDataWithPR {
  if (data.prID) {
    return true;
  }
  return false;
}

export async function getChangedFiles(
  client: Octokit,
  data: ActionData,
): Promise<AsyncGenerator<string[]>> {
  if (hasPR(data)) {
    return getFilesFromPR(client, data);
  }
  return getFilesFromCommit(client, data);
}
