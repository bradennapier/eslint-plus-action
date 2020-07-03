"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SerializerOctokitPlugin = void 0;
const tslib_1 = require("tslib");
const routeMatcher_1 = require("./routeMatcher");
const serialize_1 = require("../serialize");
exports.SerializerOctokitPlugin = (octokit, clientOptions) => {
    console.log('[SERIALIZER] | Plugin Called: ', clientOptions);
    if (clientOptions.serializer.enabled === false) {
        return;
    }
    const match = clientOptions.serializer.routes
        ? routeMatcher_1.requestRouteMatcher(clientOptions.serializer.routes)
        : undefined;
    octokit.hook.wrap('request', (request, requestOptions) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        console.log('[SERIALIZER] | Request | ', requestOptions);
        if (!match || match.test(requestOptions.url)) {
            const serializer = serialize_1.Serializers.get(requestOptions.url);
            console.log('SERIALIZE BYPASS! ', serializer, JSON.stringify(requestOptions, null, 2));
            return {};
        }
        return request(requestOptions);
    }));
};
