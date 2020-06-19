// import * as core from '@actions/core';
// import { ESLint } from 'eslint';
import { getChangedFiles } from './fs';
import { Octokit, ActionData } from './types';

export async function lintChangedFiles(
  client: Octokit,
  data: ActionData,
): Promise<void> {
  // const eslint = new ESLint({
  //   extensions: data.eslint.extensions,
  //   ignorePath: data.eslint.useEslintIgnore ? '.gitignore' : undefined,
  //   ignore: data.eslint.useEslintIgnore,
  //   useEslintrc: data.eslint.useEslintrc,
  //   rulePaths: data.eslint.rulePaths,
  //   errorOnUnmatchedPattern: data.eslint.errorOnUnmatchedPattern,
  //   fix: data.eslint.fix,
  //   fixTypes: data.eslint.fixTypes,
  //   overrideConfigFile: data.eslint.overrideConfigFile,
  // });

  for await (const changed of await getChangedFiles(client, data)) {
    console.log('Changed: ', changed);
    // const results = await eslint.lintFiles(changed);
  }
}
