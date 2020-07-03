import {
  OctokitCreateChecksParams,
  OctokitCreateCheckResponse,
  OctokitUpdateChecksResponse,
  OctokitUpdateChecksParams,
  OctokitRequestOptions,
  OctokitPlugin,
} from '../types';

// type Hook<O, R, E> = import('before-after-hook').HookSingular<O, R, E>;

export class ActionResultSerializer {
  results = [];

  checks = {
    async create(
      params: OctokitCreateChecksParams,
    ): Promise<OctokitCreateCheckResponse> {
      const result = {} as OctokitCreateCheckResponse;
      return result;
    },
    async update(
      params: OctokitUpdateChecksParams,
    ): Promise<OctokitUpdateChecksResponse> {
      const result = {} as OctokitUpdateChecksResponse;
      return result;
    },
  };
}
