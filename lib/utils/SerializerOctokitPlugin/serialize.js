"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Serializers = void 0;
const tslib_1 = require("tslib");
let CREATE_CHECK_ID = 0;
const DESERIALIZED_MAP = new Map();
exports.Serializers = new Map([
    [
        '/repos/{owner}/{repo}/check-runs',
        {
            serialize(requestOptions) {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    CREATE_CHECK_ID += 1;
                    const result = {
                        data: {
                            id: CREATE_CHECK_ID,
                        },
                    };
                    return {
                        request: Object.assign(Object.assign({}, requestOptions), { request: undefined }),
                        result,
                    };
                });
            },
            deserialize(descriptor, octokit) {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const result = yield octokit.request(descriptor.request);
                    DESERIALIZED_MAP.set(descriptor.result.data.id, result);
                    return result;
                });
            },
        },
    ],
    [
        '/repos/{owner}/{repo}/check-runs/{check_run_id}',
        {
            serialize(requestOptions) {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const result = {
                        data: {
                            id: CREATE_CHECK_ID,
                        },
                    };
                    return {
                        request: Object.assign(Object.assign({}, requestOptions), { request: undefined }),
                        result,
                    };
                });
            },
            deserialize({ request }, octokit) {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const createCheckResult = DESERIALIZED_MAP.get(request.check_run_id);
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
]);
