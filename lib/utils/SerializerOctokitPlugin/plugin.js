"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SerializerOctokitPlugin = void 0;
const tslib_1 = require("tslib");
const routeMatcher_1 = require("./routeMatcher");
const serialize_1 = require("./serialize");
const ARTIFACTS = new Set();
exports.SerializerOctokitPlugin = (octokit, clientOptions) => {
    console.log('[SerializerOctokitPlugin] | Plugin Called: ', clientOptions);
    const { data } = clientOptions.serializer;
    const match = clientOptions.serializer.routes
        ? routeMatcher_1.requestRouteMatcher(clientOptions.serializer.routes)
        : undefined;
    if (clientOptions.serializer.enabled !== false &&
        clientOptions.serializer.deserialize !== true) {
        const artifact = {
            data: clientOptions.serializer,
            requests: new Set(),
        };
        ARTIFACTS.add(artifact);
        octokit.hook.wrap('request', (request, requestOptions) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
            const isMatched = !match || match.test(requestOptions.url);
            console.log('[SerializerOctokitPlugin] | Request | ', JSON.stringify(Object.assign(Object.assign({}, requestOptions), { request: undefined, isMatched }), null, 2));
            if (isMatched) {
                const serializer = serialize_1.Serializers.get(requestOptions.url);
                if (!serializer) {
                    throw new Error('[SerializerOctokitPlugin] | Attempted to serialize a path that is not handled');
                }
                const serializeResult = yield serializer.serialize(data, requestOptions);
                console.log('Serialize Result: ', JSON.stringify(serializeResult, null, 2));
                artifact.requests.add([requestOptions.url, serializeResult]);
                return serializeResult.result;
            }
            return request(requestOptions);
        }));
    }
    return {
        getSerializedArtifacts() {
            return JSON.stringify([...ARTIFACTS].map((artifact) => JSON.stringify({
                data: artifact.data,
                requests: Array.from(artifact.requests),
            })));
        },
        deserializeArtifacts(artifacts) {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                for (const issueArtifactsString of artifacts) {
                    const issueArtifacts = JSON.parse(issueArtifactsString);
                    for (const artifact of issueArtifacts) {
                        const { data: { data }, requests, } = JSON.parse(artifact);
                        console.group(`Handling Issue ${data.issueNumber}`);
                        for (const [route, descriptor] of requests) {
                            console.log('[SerializerOctokitPlugin] | Deserializing A Route: ', route, descriptor);
                            const serializer = serialize_1.Serializers.get(route);
                            if (!serializer) {
                                throw new Error(`[SerializerOctokitPlugin] | Attempted to deserialize a path "${route}" which is not handled`);
                            }
                            yield serializer.deserialize(data, descriptor, octokit);
                            console.log('Success!');
                            console.groupEnd();
                        }
                    }
                }
            });
        },
    };
};
