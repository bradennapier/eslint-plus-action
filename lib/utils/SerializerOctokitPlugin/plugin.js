"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SerializerOctokitPlugin = void 0;
const tslib_1 = require("tslib");
const routeMatcher_1 = require("./routeMatcher");
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
            console.log('SERIALIZE BYPASS! ', JSON.stringify(requestOptions, null, 2));
            return {};
        }
        return request(requestOptions);
    }));
};
