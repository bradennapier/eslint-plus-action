"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GITHUB_WORKSPACE = exports.REPO = exports.OWNER = exports.NAME = void 0;
const tslib_1 = require("tslib");
const github = tslib_1.__importStar(require("@actions/github"));
exports.NAME = 'Eslint Changed';
_a = github.context.repo, exports.OWNER = _a.owner, exports.REPO = _a.repo;
exports.GITHUB_WORKSPACE = process.env.GITHUB_WORKSPACE;
