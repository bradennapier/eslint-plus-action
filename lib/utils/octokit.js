"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOctokitClient = void 0;
const tslib_1 = require("tslib");
const core = tslib_1.__importStar(require("@actions/core"));
const utils_1 = require("@actions/github/lib/utils");
const plugin_throttling_1 = require("@octokit/plugin-throttling");
const SerializerOctokitPlugin_1 = require("./SerializerOctokitPlugin");
const constants_1 = require("../constants");
const Octokit = utils_1.GitHub.plugin(SerializerOctokitPlugin_1.SerializerOctokitPlugin, plugin_throttling_1.throttling);
const THROTTLE_OPTIONS = {
    onRateLimit: (retryAfter, options, client) => {
        var _a;
        client.log.warn(`[THROTTLER] | Request quota exhausted for request ${options.method} ${options.url}`);
        if (((_a = options.request) === null || _a === void 0 ? void 0 : _a.retryCount) < 1) {
            client.log.info(`[THROTTLER] | Retrying after ${retryAfter} seconds!`);
            return true;
        }
    },
    onAbuseLimit: (retryAfter, options, client) => {
        client.log.warn(`[THROTTLER] | Abuse detected for request ${options.method} ${options.url}`);
    },
};
function getOctokitClient(data) {
    return new Octokit(utils_1.getOctokitOptions(core.getInput('github-token', { required: true }), {
        throttle: THROTTLE_OPTIONS,
        serializer: {
            data,
            routes: constants_1.SERIALIZED_ROUTES,
        },
    }));
}
exports.getOctokitClient = getOctokitClient;
