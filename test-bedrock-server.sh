#!/bin/bash
set -e

REPO_DIR="/opt/advisor"
BRANCH="claude/llm-bedrock-features"

echo "==> Checking out branch: $BRANCH"
git -C "$REPO_DIR" fetch origin "$BRANCH"
git -C "$REPO_DIR" checkout "$BRANCH"
git -C "$REPO_DIR" pull origin "$BRANCH"

echo ""
echo "==> Running Bedrock smoke-test inside Docker (no native Node.js needed)..."
echo ""

docker run --rm \
  --network host \
  -w /app \
  -v "$REPO_DIR/backend":/app \
  node:20-alpine \
  sh -c "npm install --silent && node test-bedrock.js"
