#!/bin/bash

echo "ENTRY"

# Removes confusing pushd / popd logging to output
pushd () {
    local CPWD;
    CPWD="$(pwd)"
    command pushd "$@" > /dev/null
    echo "[pushd] [${CPWD}] -> [$(pwd)]"
}

popd () {
    local CPWD
    CPWD="$(pwd)"
    command popd "$@" > /dev/null
    echo "[popd] [${CPWD}] -> [$(pwd)]"
}


set -e

{(
    [ -f yarn.lock ] && yarn install
    [ -f package-lock.json ] && npm install
)} &

{(
    pushd /action
    [ -f yarn.lock ] && yarn install && yarn build
    [ -f package-lock.json ] && npm install && npm run build
    popd
)} &

wait

NODE_PATH=node_modules GITHUB_TOKEN="${GITHUB_TOKEN:-${1:-.}}" SOURCE_ROOT=${2:-.} node /action/lib/run.js

rm -rf node_modules # cleanup to prevent some weird permission errors later on 
