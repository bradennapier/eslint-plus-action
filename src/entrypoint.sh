#!/bin/bash

# Removes confusing pushd / popd logging to output
pushd () {
    command pushd "$@" > /dev/null
}

popd () {
    command popd "$@" > /dev/null
}


set -e

cd "${2:-.}" || echo "source root not found"

[ -f yarn.lock ] && yarn install
[ -f package-lock.json ] && npm install

pushd /action
[ -f yarn.lock ] && yarn install && yarn build
[ -f package-lock.json ] && npm install && npm run build
popd

NODE_PATH=node_modules GITHUB_TOKEN="${GITHUB_TOKEN:-${1:-.}}" SOURCE_ROOT=${2:-.} node /action/lib/run.js

rm -rf node_modules # cleanup to prevent some weird permission errors later on 
