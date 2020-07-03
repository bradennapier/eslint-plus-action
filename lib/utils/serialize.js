"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionResultSerializer = void 0;
const tslib_1 = require("tslib");
class ActionResultSerializer {
    constructor() {
        this.results = [];
        this.checks = {
            create(params) {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const result = {};
                    return result;
                });
            },
            update(params) {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const result = {};
                    return result;
                });
            },
        };
    }
}
exports.ActionResultSerializer = ActionResultSerializer;
