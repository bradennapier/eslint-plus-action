import {
  OctokitCreateCheckResponse,
  OctokitRequestOptions,
  OctokitPlugin,
  Octokit,
  RequestDescriptor,
  ActionData,
} from '../../types';

// type Hook<O, R, E> = import('before-after-hook').HookSingular<O, R, E>;

let MAP_ID = 0;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SERIALIZER_MAP = new Map<any, any>();

type Serializer = {
  serialize: (
    data: ActionData,
    requestOptions: OctokitRequestOptions,
  ) => Promise<RequestDescriptor>;
  deserialize: (
    data: ActionData,
    descriptor: RequestDescriptor,
    octokit: Parameters<OctokitPlugin>[0],
  ) => ReturnType<Octokit['request']>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const Serializers = new Map<string, Serializer>([
  [
    '/repos/{owner}/{repo}/check-runs',
    {
      async serialize(
        data: ActionData,
        requestOptions: OctokitRequestOptions,
      ): Promise<RequestDescriptor> {
        MAP_ID += 1;
        const result = {
          data: {
            id: MAP_ID,
          },
        };

        SERIALIZER_MAP.set(result.data.id, result);

        return {
          request: {
            ...requestOptions,
            request: undefined,
          },
          result,
        };
      },
      async deserialize(
        data: ActionData,
        descriptor: RequestDescriptor,
        octokit: Parameters<OctokitPlugin>[0],
      ): Promise<OctokitCreateCheckResponse> {
        const result = await octokit.request(descriptor.request);
        data.state.checkId = result.data.id;
        // we need to map the id so future requests to updata can be modified
        SERIALIZER_MAP.set(descriptor.result.data.id, result);
        return result;
      },
    },
  ],
  [
    '/repos/{owner}/{repo}/check-runs/{check_run_id}',
    {
      async serialize(
        data: ActionData,
        requestOptions: OctokitRequestOptions,
      ): Promise<RequestDescriptor> {
        const createCheckResult = SERIALIZER_MAP.get(
          requestOptions.check_run_id,
        );

        if (!createCheckResult) {
          throw new Error(
            `[SerializerOctokitPlugin] | Failed to Serialize a check update request, no id "${requestOptions.check_run_id}" was found`,
          );
        }

        const result = {
          data: {
            id: requestOptions.check_run_id,
          },
        };

        return {
          request: {
            ...requestOptions,
            request: undefined,
          },
          result,
        };
      },
      async deserialize(
        data: ActionData,
        { request }: RequestDescriptor,
        octokit: Parameters<OctokitPlugin>[0],
      ): Promise<OctokitCreateCheckResponse> {
        const createCheckResult = SERIALIZER_MAP.get(request.check_run_id);

        if (!createCheckResult) {
          throw new Error(
            `[SerializerOctokitPlugin] | Failed to Deserialize a check update request, no id "${request.check_run_id}" was found`,
          );
        }

        request.check_run_id = createCheckResult.data.id;

        const result = await octokit.request(request);

        return result;
      },
    },
  ],
  [
    '/repos/{owner}/{repo}/issues/{issue_number}/comments',
    {
      async serialize(
        data: ActionData,
        requestOptions: OctokitRequestOptions,
      ): Promise<RequestDescriptor> {
        let result = {
          data: {},
        };
        switch (requestOptions.method) {
          case 'POST': {
            MAP_ID += 1;

            result = {
              data: {
                user: {
                  id: MAP_ID,
                },
              },
            };

            break;
          }
          case 'DELETE': {
            result = {
              data: {},
            };
            break;
          }
        }

        return {
          request: {
            ...requestOptions,
            request: undefined,
          },
          result,
        };
      },
      async deserialize(
        data: ActionData,
        descriptor: RequestDescriptor,
        octokit: Parameters<OctokitPlugin>[0],
      ): Promise<OctokitCreateCheckResponse> {
        const result = await octokit.request(descriptor.request);
        data.state.userId = result.data.user.id;
        // we need to map the id so future requests to updata can be modified
        SERIALIZER_MAP.set(descriptor.result.data.id, result);
        return result;
      },
    },
  ],
]);
