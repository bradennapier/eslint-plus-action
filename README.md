<div align="center">
  <h1>
    <br/>
    <br/>
    <p align="center">
      <img src="docs/img/annotation.png" width="100%" title="eslint-plus-action">
    </p>
    <br />
    eslint-plus-action
    <br />
    <br />
    <br />
    <br />
  </h1>
  <sup>
    <br />
    <br />
    <br />
    A Github Action which runs ESLint against the changed files in a PR with customizable options and rich summaries.  ESLint issues are annotated inline on your PR diff.
  </sup>
  <br />
  <br />
  <br />
  <br />
  <br />
  <br />
  <br />
  <br />
</div>

## Features

- [Inline Annotations of ESLint Warnings & Errors](https://github.com/bradennapier/eslint-plus-action/pull/3/files)
- Customizable ESLint options
- [Optional summary comments on each push to the PR](https://github.com/bradennapier/eslint-plus-action/pull/3)
- [Links to the rule documentation when available](https://github.com/bradennapier/eslint-plus-action/pull/3#issuecomment-646635983)
- [Annotation Summary Page](https://github.com/bradennapier/eslint-plus-action/pull/3/checks?check_run_id=788235048)
- Suggestions are printed (not yet provided as change suggestions)
- Button to run ESLint Fix [COMING SOON]
- More...

> This is fairly new some setup is coming but it should be straight forward by viewing the `action.yml`

> The summary comments have some redundancy when there are suggestions available.  This will be improved.

> The `fix` property is not yet setup but will come shortly. If fixes are available, it will render an action button to run the fix as well.

## Simple Workflow Example

Below is a basic example which should get you going.  You can view the action.yml to see what other properties are available for customization.

```yml
name: "my-workflow"
on: [pull_request]

jobs:
  test: # make sure the action works on a clean machine without building
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - uses: bradennapier/eslint-plus-action@v1
      with: 
        github-token: ${{secrets.GITHUB_TOKEN}}
```

> At this time it will build your code with the `yarn` or `npm` script `build`.

```
yarn && yarn build
# or if you use npm it will run
npm install && npm run build
```

## More Previews

<p align="center">
  <img src="docs/img/prcomment.png" width="100%" title="eslint-plus-action-pr-comment">
</p>