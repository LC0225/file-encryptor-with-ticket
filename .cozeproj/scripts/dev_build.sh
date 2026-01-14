#!/bin/bash
set -Eeuo pipefail

cd "${COZE_WORKSPACE_PATH}"

echo "Installing dependencies..."
yarn install

echo "Build completed successfully!"
