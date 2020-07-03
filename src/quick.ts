import { requestRouteMatcher } from './utils/SerializerOctokitPlugin/routeMatcher';

const SERIALIZED_ROUTES = [
  '/repos/:owner/:repo/check-runs',
  '/repos/:owner/:repo/check-runs/:check_run_id',
];

function run() {
  const match = requestRouteMatcher(SERIALIZED_ROUTES);
  console.log(match);
  console.log(match.test('/repos/{owner}/{repo}/check-runs'));
}

run();
