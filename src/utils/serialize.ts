import {
  OctokitCreateChecksParams,
  OctokitCreateCheckResponse,
  OctokitUpdateChecksResponse,
  OctokitUpdateChecksParams,
} from '../types';

// type Hook<O, R, E> = import('before-after-hook').HookSingular<O, R, E>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const Serializers = new Map<string, (...args: any[]) => Promise<any>>([
  [
    '/repos/{owner}/{repo}/check-runs',
    async function checkCreateSerializer(
      params: OctokitCreateChecksParams,
    ): Promise<OctokitCreateCheckResponse> {
      const result = {} as OctokitCreateCheckResponse;
      return result;
    },
  ],
  [
    '/repos/{owner}/{repo}/check-runs/{check_run_id}',
    async function checkUpdateSerializer(
      params: OctokitUpdateChecksParams,
    ): Promise<OctokitUpdateChecksResponse> {
      const result = {} as OctokitUpdateChecksResponse;
      return result;
    },
  ],
]);
