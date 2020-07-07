import {
  OctokitPlugin,
  OctokitRequestOptions,
  RequestDescriptor,
  ActionData,
  Octokit,
} from '../../types';

import { requestRouteMatcher } from './routeMatcher';
import { Serializers } from './serialize';
import { handleIssueComment } from '../../issues';
import { updateIssueState, deleteArtifactByName } from '../../artifacts';
import { getIssueLintResultsName } from '../../utils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RunArtifact = { data: any; requests: Set<[string, RequestDescriptor]> };

const ARTIFACTS = new Set<RunArtifact>();

export const SerializerOctokitPlugin = (
  octokit: Octokit,
  clientOptions: Parameters<OctokitPlugin>[1],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): { [key: string]: (...args: any[]) => any } => {
  console.log('[SerializerOctokitPlugin] | Plugin Called: ', clientOptions);

  const { data }: { data: ActionData } = clientOptions.serializer;

  const match = clientOptions.serializer.routes
    ? requestRouteMatcher(clientOptions.serializer.routes)
    : undefined;

  if (
    clientOptions.serializer.enabled !== false &&
    clientOptions.serializer.deserialize !== true
  ) {
    const artifact: RunArtifact = {
      data: clientOptions.serializer,
      requests: new Set(),
    };

    ARTIFACTS.add(artifact);

    octokit.hook.wrap(
      'request',
      async (
        request,
        requestOptions: OctokitRequestOptions,
      ): Promise<unknown> => {
        const isMatched = !match || match.test(requestOptions.url);
        // console.log(
        //   '[SerializerOctokitPlugin] | Request | ',
        //   JSON.stringify(
        //     {
        //       ...requestOptions,
        //       request: undefined,
        //       isMatched,
        //     },
        //     null,
        //     2,
        //   ),
        // );
        if (isMatched) {
          const serializer = Serializers.get(requestOptions.url);

          if (!serializer) {
            throw new Error(
              '[SerializerOctokitPlugin] | Attempted to serialize a path that is not handled',
            );
          }

          // TODO - should probably serialize a small amount of data and recapture
          // TODO - this data when needed on scheduler.
          // we need to convert these for them to be usable
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (data.state as any).rulesSummaries = [...data.state.rulesSummaries];

          const serializeResult = await serializer.serialize(
            data,
            requestOptions,
          );

          console.log(
            'Serialize Result: ',
            JSON.stringify(serializeResult, null, 2),
          );

          artifact.requests.add([requestOptions.url, serializeResult]);

          return serializeResult.result;
          // temp actually make requests
        }
        return request(requestOptions);
      },
    );
  }

  return {
    /**
     * Returns the serialized artifacts that can be uploaded to github artifacts
     */
    getSerializedArtifacts(): string {
      return JSON.stringify(
        [...ARTIFACTS].map((artifact) =>
          JSON.stringify({
            data: artifact.data,
            requests: Array.from(artifact.requests),
          }),
        ),
      );
    },
    async deserializeArtifacts(artifacts: string[]) {
      // each file we receive will be included so each iteration here will be
      // a separate PR's serialized artifacts
      for (const issueArtifactsString of artifacts) {
        const issueArtifacts = JSON.parse(issueArtifactsString);
        for (const artifact of issueArtifacts) {
          const {
            data: { data },
            requests,
          }: Omit<RunArtifact, 'data'> & {
            data: { data: ActionData };
          } = JSON.parse(artifact);
          try {
            console.group(`Handling Issue ${data.issueNumber}`);

            for (const [route, descriptor] of requests) {
              console.log(
                '[SerializerOctokitPlugin] | Deserializing A Route: ',
                route,
                descriptor,
              );

              const serializer = Serializers.get(route);

              if (!serializer) {
                throw new Error(
                  `[SerializerOctokitPlugin] | Attempted to deserialize a path "${route}" which is not handled`,
                );
              }

              await serializer.deserialize(data, descriptor, octokit);
              await handleIssueComment(octokit, data);
              await updateIssueState(octokit, data);

              console.log('Success!');

              // the result artifact can now be removed
              await deleteArtifactByName(
                octokit,
                getIssueLintResultsName(data),
              );
            }
          } catch (err) {
            console.error(
              '[ERROR] | Failed to Run on Artifact: ',
              data.issueNumber,
              err,
            );
          } finally {
            console.groupEnd();
          }
        }
      }
    },
  };
};
