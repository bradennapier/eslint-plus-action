module.exports = {
  plugins: [
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
            results: [
              {
                file: 'README.md',
                hasChanged: true,
                // numMatches: 1,
                // numReplacements: 1,
              },
            ],
            countMatches: true,
          },
        ],
      },
    ],
    ['@semantic-release/git', { assets: ['README.md'] }],
  ],
};
