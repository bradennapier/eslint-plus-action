"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const routeMatcher_1 = require("./utils/SerializerOctokitPlugin/routeMatcher");
const SERIALIZED_ROUTES = [
    '/repos/:owner/:repo/check-runs',
    '/repos/:owner/:repo/check-runs/:check_run_id',
];
function run() {
    const match = routeMatcher_1.requestRouteMatcher(SERIALIZED_ROUTES);
    console.log(match);
    console.log(match.test('/repos/{owner}/{repo}/check-runs'));
}
run();
