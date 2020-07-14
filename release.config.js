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
    '@semantic-release/changelog',
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
      '@semantic-release/git',
      {
        assets: ['package.json', 'CHANGELOG.md', 'README.md'],
      },
    ],
    '@semantic-release/github',
  ],
};
