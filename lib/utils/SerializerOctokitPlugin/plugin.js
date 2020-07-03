"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SerializerOctokitPlugin = void 0;
const tslib_1 = require("tslib");
const constants_1 = require("./constants");
const routeMatcher_1 = require("./routeMatcher");
const match = routeMatcher_1.requestRouteMatcher(constants_1.SERIALIZED_ROUTES);
exports.SerializerOctokitPlugin = (octokit, clientOptions) => {
    console.log('[SERIALIZER] | Plugin Called: ', clientOptions);
    octokit.hook.wrap('request', (request, requestOptions) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        console.log('[SERIALIZER] | Request | ', requestOptions);
        if (match.test(requestOptions.url)) {
            console.log('SERIALIZE BYPASS! ', JSON.stringify(requestOptions, null, 2));
            return {};
        }
        return request(requestOptions);
    }));
};
