#!/bin/bash
set -Eeuo pipefail

cd "${COZE_WORKSPACE_PATH}"

echo "Installing dependencies..."
yarn install

echo "Building the project..."
yarn run build

echo "Build completed successfully!"
