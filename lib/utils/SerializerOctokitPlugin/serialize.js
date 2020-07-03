"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Serializers = void 0;
const tslib_1 = require("tslib");
let MAP_ID = 0;
const SERIALIZER_MAP = new Map();
exports.Serializers = new Map([
    [
        '/repos/{owner}/{repo}/check-runs',
        {
            serialize(data, requestOptions) {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    MAP_ID += 1;
                    const result = {
                        data: {
                            id: MAP_ID,
                        },
                    };
                    SERIALIZER_MAP.set(result.data.id, result);
                    return {
                        request: Object.assign(Object.assign({}, requestOptions), { request: undefined }),
                        result,
                    };
                });
            },
            deserialize(data, descriptor, octokit) {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const result = yield octokit.request(descriptor.request);
                    data.state.checkId = result.data.id;
                    SERIALIZER_MAP.set(descriptor.result.data.id, result);
                    return result;
                });
            },
        },
    ],
    [
        '/repos/{owner}/{repo}/check-runs/{check_run_id}',
        {
            serialize(data, requestOptions) {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const createCheckResult = SERIALIZER_MAP.get(requestOptions.check_run_id);
                    if (!createCheckResult) {
                        throw new Error(`[SerializerOctokitPlugin] | Failed to Serialize a check update request, no id "${requestOptions.check_run_id}" was found`);
                    }
                    const result = {
                        data: {
                            id: requestOptions.check_run_id,
                        },
                    };
                    return {
                        request: Object.assign(Object.assign({}, requestOptions), { request: undefined }),
                        result,
                    };
                });
            },
            deserialize(data, { request }, octokit) {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const createCheckResult = SERIALIZER_MAP.get(request.check_run_id);
                    if (!createCheckResult) {
                        throw new Error(`[SerializerOctokitPlugin] | Failed to Deserialize a check update request, no id "${request.check_run_id}" was found`);
                    }
                    request.check_run_id = createCheckResult.data.id;
                    const result = yield octokit.request(request);
                    return result;
                });
            },
        },
    ],
    [
        '/repos/{owner}/{repo}/issues/{issue_number}/comments',
        {
            serialize(data, requestOptions) {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
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
                        request: Object.assign(Object.assign({}, requestOptions), { request: undefined }),
                        result,
                    };
                });
            },
            deserialize(data, descriptor, octokit) {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const result = yield octokit.request(descriptor.request);
                    data.state.userId = result.data.user.id;
                    SERIALIZER_MAP.set(descriptor.result.data.id, result);
                    return result;
                });
            },
        },
    ],
]);
