#!/bin/bash
set -e

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"

# Support both docker compose (v2 plugin) and docker-compose (v1 standalone)
if docker compose version &>/dev/null 2>&1; then
  DC="docker compose"
else
  DC="docker-compose"
fi

echo "==> Using: $DC"
echo "==> Pulling latest changes..."
git -C "$REPO_DIR" pull origin claude/llm-bedrock-features

echo "==> Building and restarting containers..."
$DC -f "$REPO_DIR/docker-compose.yml" build --no-cache
$DC -f "$REPO_DIR/docker-compose.yml" up -d

echo "==> Removing unused images..."
docker image prune -f

echo "==> Done. Services:"
$DC -f "$REPO_DIR/docker-compose.yml" ps
