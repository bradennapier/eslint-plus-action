"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Serializers = void 0;
const tslib_1 = require("tslib");
exports.Serializers = new Map([
    [
        '/repos/{owner}/{repo}/check-runs',
        function checkCreateSerializer(params) {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const result = {};
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
