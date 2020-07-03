import { OctokitPlugin, OctokitRequestOptions } from '../../types';

import { requestRouteMatcher } from './routeMatcher';
import { Serializers } from '../serialize';

export const SerializerOctokitPlugin: OctokitPlugin = (
  octokit: Parameters<OctokitPlugin>[0],
  clientOptions: Parameters<OctokitPlugin>[1],
) => {
  console.log('[SerializerOctokitPlugin] | Plugin Called: ', clientOptions);
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
      if (!match || match.test(requestOptions.url)) {
        console.log(
          '[SerializerOctokitPlugin] | Request | ',
          requestOptions,
          JSON.stringify(requestOptions, null, 2),
        );
        const serializer = Serializers.get(requestOptions.url);
        if (!serializer) {
          throw new Error(
            '[SerializerOctokitPlugin] | Attempted to serialize a path that is not handled',
          );
        }
        serializer(requestOptions);
        // temp actually make requests
      }
      return request(requestOptions);
    },
  );
};
