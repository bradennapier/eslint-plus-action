#!/bin/bash

echo "Build Typescript Files For Commit"
yarn build

git add lib/**
cp -f docs/README.template.md ./README.md
