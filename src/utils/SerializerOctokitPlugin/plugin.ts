import { OctokitPlugin, OctokitRequestOptions } from '../../types';

import { requestRouteMatcher } from './routeMatcher';
import { Serializers } from './serialize';

const TempCache = new Set();

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
        const serialized = JSON.stringify({
          ...requestOptions,
          request: undefined,
        });

        const deserialized = JSON.parse(serialized);
        if (TempCache.has(deserialized)) {
          return request(requestOptions);
        }

        TempCache.add(deserialized);

        console.log('[SerializerOctokitPlugin] | Request | ', requestOptions);

        const serializer = Serializers.get(requestOptions.url);
        if (!serializer) {
          throw new Error(
            '[SerializerOctokitPlugin] | Attempted to serialize a path that is not handled',
          );
        }

        console.log('Getting Result: ', deserialized);
        const result = await octokit.request(JSON.parse(serialized));
        console.log('RESULT: ', result);
        return result;
        // temp actually make requests
      }
      return request(requestOptions);
    },
  );
};
