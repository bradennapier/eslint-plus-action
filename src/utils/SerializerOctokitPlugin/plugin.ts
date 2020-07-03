import { OctokitPlugin, OctokitRequestOptions } from '../../types';

import { requestRouteMatcher } from './routeMatcher';

export const SerializerOctokitPlugin: OctokitPlugin = (
  octokit: Parameters<OctokitPlugin>[0],
  clientOptions: Parameters<OctokitPlugin>[1],
) => {
  console.log('[SERIALIZER] | Plugin Called: ', clientOptions);
  if (clientOptions.serializer.enabled === false) {
    return;
  }

  const match = clientOptions.serializer.routes
    ? requestRouteMatcher(clientOptions.serializer.routes)
    : undefined;

  octokit.hook.wrap(
    'request',
    async (
      request,
      requestOptions: OctokitRequestOptions,
    ): Promise<unknown> => {
      console.log('[SERIALIZER] | Request | ', requestOptions);
      if (!match || match.test(requestOptions.url)) {
        console.log(
          'SERIALIZE BYPASS! ',
          JSON.stringify(requestOptions, null, 2),
        );
        return {};
      }
      return request(requestOptions);
    },
  );
};
