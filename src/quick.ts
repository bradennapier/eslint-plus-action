import { CLIEngine } from 'eslint';

async function run() {
  const eslintConfig = {
    extensions: ['.js', 'jsx', '.ts', '.tsx'],
    ignorePath: '.gitignore',
    ignore: true,
    useEslintrc: true,
    debug: true
  };

  console.log('[ESLINT] Run With Configuration: ', eslintConfig);

  const eslint = new CLIEngine(eslintConfig);

  const results = await eslint.executeOnFiles(['./src/eslint.ts']);
  console.log(results);
}

run();
