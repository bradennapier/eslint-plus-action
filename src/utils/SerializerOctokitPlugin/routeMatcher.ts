/**
 * Generates a RegExp based on an array of routes
 * such as `['/repos/:owner/:repo/check-runs']`
 */
export function requestRouteMatcher(paths: string[], flags = 'i'): RegExp {
  /* [
      "/orgs/:org/invitations",
      "/repos/:owner/:repo/collaborators/:username"
  ] */

  const regexes = paths.map((path) =>
    path
      .split('/')
      .map((c) => (c.startsWith(':') ? '(?:[^/]+?)' : c))
      .join('/'),
  );

  const regex = `^(?:${regexes.map((r) => `(?:${r})`).join('|')})[^/]*$`;

  return new RegExp(regex, flags);
}
