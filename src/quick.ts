import dedent from 'dedent';

function getSomething() {}

function run() {
  return dedent`
    start
    ${getSomething()}
    ${typeof getSomething === 'string' && 'test'}
    three
four

`;
}

console.log(run());
