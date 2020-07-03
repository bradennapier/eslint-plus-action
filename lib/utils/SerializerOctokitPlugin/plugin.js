"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SerializerOctokitPlugin = void 0;
const tslib_1 = require("tslib");
const routeMatcher_1 = require("./routeMatcher");
const serialize_1 = require("./serialize");
const TempCache = new Set();
exports.SerializerOctokitPlugin = (octokit, clientOptions) => {
    console.log('[SerializerOctokitPlugin] | Plugin Called: ', clientOptions);
    if (clientOptions.serializer.enabled === false) {
        return;
    }
    const match = clientOptions.serializer.routes
        ? routeMatcher_1.requestRouteMatcher(clientOptions.serializer.routes)
        : undefined;
    octokit.hook.wrap('request', (request, requestOptions) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        if (!match || match.test(requestOptions.url)) {
            const serialized = JSON.stringify(Object.assign(Object.assign({}, requestOptions), { request: undefined }));
            const deserialized = JSON.parse(serialized);
            if (TempCache.has(deserialized)) {
                return request(requestOptions);
            }
            TempCache.add(deserialized);
            console.log('[SerializerOctokitPlugin] | Request | ', requestOptions);
            const serializer = serialize_1.Serializers.get(requestOptions.url);
            if (!serializer) {
                throw new Error('[SerializerOctokitPlugin] | Attempted to serialize a path that is not handled');
            }
            console.log('Getting Result: ', deserialized);
            const result = yield octokit.request(JSON.parse(serialized));
            console.log('RESULT: ', result);
            return result;
        }
        return request(requestOptions);
    }));
};
