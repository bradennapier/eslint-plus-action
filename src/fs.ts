// import { promises as fs } from 'fs';

import * as core from '@actions/core';
import micromatch from 'micromatch';

import { fetchFilesBatchPR, fetchFilesBatchCommit } from './api';
import { Octokit, PrResponse, ActionData, ActionDataWithPR } from './types';

export async function filterFiles(
  files: string[],
  data: ActionData,
): Promise<string[]> {
  const { extensions } = data.eslint;

  const matches = micromatch(files, [`**{${extensions.join(',')}}`]);

  const include: string[] =
    data.includeGlob.length > 0
      ? micromatch(matches, data.includeGlob)
      : matches;

  const ignore: string[] =
    data.ignoreGlob.length > 0 ? micromatch(include, data.ignoreGlob) : [];

  if (ignore.length === 0) {
    return include;
  }
  return include.filter((file) => !ignore.includes(file));
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

export function getChangedFiles(
  client: Octokit,
  data: ActionData,
): AsyncGenerator<string[]> {
  if (hasPR(data)) {
    return getFilesFromPR(client, data);
  }
  return getFilesFromCommit(client, data);
}
