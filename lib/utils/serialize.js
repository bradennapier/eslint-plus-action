"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Serializers = void 0;
const tslib_1 = require("tslib");
let CREATE_CHECK_ID = 0;
exports.Serializers = new Map([
    [
        '/repos/{owner}/{repo}/check-runs',
        function checkCreateSerializer(params) {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                CREATE_CHECK_ID += 1;
                const result = {
                    data: {
                        id: CREATE_CHECK_ID,
                    },
                };
                return result;
            });
        },
    ],
    [
        '/repos/{owner}/{repo}/check-runs/{check_run_id}',
        function checkUpdateSerializer(params) {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const result = {};
                return result;
            });
        },
    ],
]);
