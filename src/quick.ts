import { Octokit } from '@octokit/rest';

// const SERIALIZED_ROUTES = [
//   '/repos/:owner/:repo/check-runs',
//   '/repos/:owner/:repo/check-runs/:check_run_id',
// ];

const client = new Octokit({
  auth: process.env.GITHUB_AUTH,
});

/**
 * Converts an ArrayBuffer to a String.
 *
 * @param buffer - Buffer to convert.
 * @returns String.
 */
export default function arrayBufferToString(buffer: ArrayBuffer): string {
  return String.fromCharCode.apply(null, Array.from(new Uint8Array(buffer)));
}

async function run() {
  // const { body } = await got(
  //   'https://api.github.com/repos/bradennapier/eslint-plus-action/actions/artifacts',
  // );
  // console.log(JSON.parse(body));
  const workflows = await client.actions.listRepoWorkflows({
    owner: 'bradennapier',
    repo: 'eslint-plus-action',
  });
  console.log(workflows);
}

run();
