import { OctokitPlugin, OctokitRequestOptions } from '../../types';
import { SERIALIZED_ROUTES } from './constants';
import { requestRouteMatcher } from './routeMatcher';

const match = requestRouteMatcher(SERIALIZED_ROUTES);

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
      if (match.test(requestOptions.url)) {
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
