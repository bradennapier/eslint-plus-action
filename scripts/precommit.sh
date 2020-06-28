#!/bin/bash

echo "Build Typescript Files For Commit"
yarn build

git add lib/**