module.exports = {
  plugins: [
    [
      '@semantic-release/commit-analyzer',
      {
        preset: 'conventionalcommits',
      },
    ],
    [
      '@semantic-release/release-notes-generator',
      {
        preset: 'conventionalcommits',
      },
    ],
    [
      '@google/semantic-release-replace-plugin',
      {
        replacements: [
          {
            files: ['README.md'],
            from: '@__VERSION__',
            // eslint-disable-next-line no-template-curly-in-string
            to: '@${nextRelease.gitTag}',

            countMatches: true,
          },
        ],
      },
    ],
    [
      // updates the package.json version without publishing to npm
      '@semantic-release/npm',
      {
        npmPublish: false,
      },
    ],
    [
      // commits the changed files to git
      '@semantic-release/git',
      {
        assets: ['package.json', 'README.md'],
      },
    ],
    // creates the github release
    '@semantic-release/github',
  ],
};
