import { OctokitPlugin, OctokitRequestOptions } from '../../types';

import { requestRouteMatcher } from './routeMatcher';
import { Serializers } from './serialize';

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
        console.log('[SerializerOctokitPlugin] | Request | ', requestOptions);
        const serializer = Serializers.get(requestOptions.url);
        if (!serializer) {
          throw new Error(
            '[SerializerOctokitPlugin] | Attempted to serialize a path that is not handled',
          );
        }
        const serialized = JSON.stringify({
          ...requestOptions,
          request: undefined,
        });
        console.log('Getting Result');
        const result = await octokit.request(JSON.parse(serialized));
        console.log('RESULT: ', result);
        return result;
        // temp actually make requests
      }
      return request(requestOptions);
    },
  );
};
