module.exports = {
  plugins: [
    '@semantic-release/changelog',
    '@semantic-release/release-notes-generator',
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
<<<<<<< HEAD
    [
      '@semantic-release/git',
      { assets: ['package.json', 'CHANGELOG.md', 'README.md'] },
    ],
=======
    ['@semantic-release/git', { assets: ['README.md'] }],
>>>>>>> master
  ],
};
