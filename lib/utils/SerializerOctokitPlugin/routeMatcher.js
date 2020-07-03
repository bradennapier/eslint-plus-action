"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestRouteMatcher = void 0;
function requestRouteMatcher(paths, flags = 'i') {
    const regexes = paths.map((path) => `(?:${path.replace(/(?<=\/)(:[^/]+)(?=\/|$)/g, '(?:.+?)')})`);
    const regex = `^(?:${regexes.join('|')})[^/]*$`;
    return new RegExp(regex, flags);
}
exports.requestRouteMatcher = requestRouteMatcher;
