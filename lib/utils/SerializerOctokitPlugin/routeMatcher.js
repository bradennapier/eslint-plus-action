"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestRouteMatcher = void 0;
function requestRouteMatcher(paths, flags = 'i') {
    const regexes = paths.map((path) => path
        .split('/')
        .map((c) => (c.startsWith(':') ? '(?:[^/]+?)' : c))
        .join('/'));
    const regex = `^(?:${regexes.map((r) => `(?:${r})`).join('|')})[^/]*$`;
    return new RegExp(regex, flags);
}
exports.requestRouteMatcher = requestRouteMatcher;
