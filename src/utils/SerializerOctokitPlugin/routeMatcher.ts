/**
 * Generates a RegExp based on an array of routes
 * such as `['/repos/:owner/:repo/check-runs']` that will
 * match against a route with params such as `/repos/{owner}/{repo}/check-runs`
 * with or without the values includes for parameters.
 *
 * @example
 * ['/repos/:owner/:repo/check-runs', '/repos/:owner/:repo/check-runs/:check_run_id']
 * /^(?:(?:\/repos\/(?:.+?)\/(?:.+?)\/check-runs)|(?:\/repos\/(?:.+?)\/(?:.+?)\/check-runs\/(?:.+?)))[^/]*$/i
 */
export function requestRouteMatcher(paths: string[], flags = 'i'): RegExp {
  const regexes = paths.map(
    (path) => `(?:${path.replace(/(?<=\/)(:[^/]+)(?=\/|$)/g, '(?:.+?)')})`,
  );

  const regex = `^(?:${regexes.join('|')})[^/]*$`;

  return new RegExp(regex, flags);
}
