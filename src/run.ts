import * as core from '@actions/core';
import * as github from '@actions/github';

async function run(): Promise<any> {
  core.debug('👋 Hello! You are an amazing person! 🙌');

  const octokit = github.getOctokit(core.getInput('github-token'));
  const context = github.context;
  console.log(context);
}

run();

export default run;
