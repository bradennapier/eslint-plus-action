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

export const SerializerOctokitPlugin: OctokitPlugin = (
  octokit: Parameters<OctokitPlugin>[0],
  clientOptions: Parameters<OctokitPlugin>[1],
) => {
  console.log('[SERIALIZER] | Plugin Called: ', clientOptions);
  octokit.hook.wrap(
    'request',
    async (
      request,
      requestOptions: OctokitRequestOptions,
    ): Promise<unknown> => {
      console.log('[SERIALIZER] | Request | ', requestOptions);
      return {};
    },
  );
};
