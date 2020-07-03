"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Serializers = void 0;
const tslib_1 = require("tslib");
let CREATE_CHECK_ID = 0;
const SERIALIZER_MAP = new Map();
exports.Serializers = new Map([
    [
        '/repos/{owner}/{repo}/check-runs',
        {
            serialize(requestOptions) {
                var _a, _b;
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    CREATE_CHECK_ID += 1;
                    const result = {
                        data: {
                            id: CREATE_CHECK_ID,
                            output: {
                                annotations_count: ((_b = (_a = requestOptions.output) === null || _a === void 0 ? void 0 : _a.annotations) === null || _b === void 0 ? void 0 : _b.length) || 0,
                            },
                        },
                    };
                    SERIALIZER_MAP.set(CREATE_CHECK_ID, result);
                    return {
                        request: Object.assign(Object.assign({}, requestOptions), { request: undefined }),
                        result,
                    };
                });
            },
            deserialize(descriptor, octokit) {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const result = yield octokit.request(descriptor.request);
                    SERIALIZER_MAP.set(descriptor.result.data.id, result);
                    return result;
                });
            },
        },
    ],
    [
        '/repos/{owner}/{repo}/check-runs/{check_run_id}',
        {
            serialize(requestOptions) {
                var _a, _b;
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const createCheckResult = SERIALIZER_MAP.get(requestOptions.check_run_id);
                    if (!createCheckResult) {
                        throw new Error(`[SerializerOctokitPlugin] | Failed to Serialize a check update request, no id "${requestOptions.check_run_id}" was found`);
                    }
                    createCheckResult.data.output.annotation_count +=
                        ((_b = (_a = requestOptions.output) === null || _a === void 0 ? void 0 : _a.annotations) === null || _b === void 0 ? void 0 : _b.length) || 0;
                    const result = Object.assign(Object.assign({}, createCheckResult), { data: Object.assign(Object.assign({}, createCheckResult.data), { id: requestOptions.check_run_id }) });
                    return {
                        request: Object.assign(Object.assign({}, requestOptions), { request: undefined }),
                        result,
                    };
                });
            },
            deserialize({ request }, octokit) {
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
]);
