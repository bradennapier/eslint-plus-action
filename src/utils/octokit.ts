import * as core from '@actions/core';
import { GitHub, getOctokitOptions } from '@actions/github/lib/utils';
import { throttling } from '@octokit/plugin-throttling';

import { ActionData, Octokit, OctokitOptions } from '../types';
import { SerializerOctokitPlugin } from './SerializerOctokitPlugin';

const Octokit = GitHub.plugin(SerializerOctokitPlugin, throttling);

const THROTTLE_OPTIONS = {
  onRateLimit: (
    retryAfter: number,
    options: OctokitOptions,
    client: Octokit,
  ) => {
    client.log.warn(
      `[THROTTLER] | Request quota exhausted for request ${options.method} ${options.url}`,
    );

    if (options.request?.retryCount < 1) {
      // only retries twice
      client.log.info(`[THROTTLER] | Retrying after ${retryAfter} seconds!`);
      return true;
    }
  },
  onAbuseLimit: (
    retryAfter: number,
    options: OctokitOptions,
    client: Octokit,
  ) => {
    // does not retry, only logs a warning
    client.log.warn(
      `[THROTTLER] | Abuse detected for request ${options.method} ${options.url}`,
    );
  },
};

export function getOctokitClient(data: ActionData): Octokit {
  return new Octokit(
    getOctokitOptions(core.getInput('github-token', { required: true }), {
      throttle: THROTTLE_OPTIONS,
      serializer: data,
    }),
  );
}
