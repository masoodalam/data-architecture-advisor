#!/bin/bash
set -e

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "==> Pulling latest changes..."
git -C "$REPO_DIR" pull origin main

echo "==> Building and restarting containers..."
docker compose -f "$REPO_DIR/docker-compose.yml" build --no-cache
docker compose -f "$REPO_DIR/docker-compose.yml" up -d

echo "==> Removing unused images..."
docker image prune -f

echo "==> Done. Services:"
docker compose -f "$REPO_DIR/docker-compose.yml" ps
