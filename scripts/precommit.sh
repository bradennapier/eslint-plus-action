#!/bin/bash

echo "Build Typescript Files For Commit"
yarn build



cp -f docs/README.template.md ./README.md
git add lib/**
git add README.md
