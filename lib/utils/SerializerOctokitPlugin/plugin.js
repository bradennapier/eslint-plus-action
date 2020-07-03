"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SerializerOctokitPlugin = void 0;
const tslib_1 = require("tslib");
const routeMatcher_1 = require("./routeMatcher");
const serialize_1 = require("../serialize");
exports.SerializerOctokitPlugin = (octokit, clientOptions) => {
    console.log('[SerializerOctokitPlugin] | Plugin Called: ', clientOptions);
    if (clientOptions.serializer.enabled === false) {
        return;
    }
    const match = clientOptions.serializer.routes
        ? routeMatcher_1.requestRouteMatcher(clientOptions.serializer.routes)
        : undefined;
    octokit.hook.wrap('request', (request, requestOptions) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        console.log('[SerializerOctokitPlugin] | Request | ', requestOptions);
        if (!match || match.test(requestOptions.url)) {
            const serializer = serialize_1.Serializers.get(requestOptions.url);
            if (!serializer) {
                throw new Error('[SerializerOctokitPlugin] | Attempted to serialize a path that is not handled');
            }
            serializer(requestOptions);
        }
        return request(requestOptions);
    }));
};
