#!/bin/bash
set -e

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
NETWORK="advisor-net"
BACKEND_IMAGE="advisor-backend"
FRONTEND_IMAGE="advisor-frontend"
BACKEND_CONTAINER="backend"      # must match nginx proxy_pass hostname
FRONTEND_CONTAINER="advisor-frontend"

echo "==> Pulling latest changes..."
git -C "$REPO_DIR" pull origin claude/llm-bedrock-features

echo "==> Creating Docker network (if missing)..."
docker network create "$NETWORK" 2>/dev/null || true

echo "==> Building images..."
docker build -t "$BACKEND_IMAGE"  "$REPO_DIR/backend"
docker build -t "$FRONTEND_IMAGE" "$REPO_DIR"

echo "==> Stopping old containers..."
docker stop  "$BACKEND_CONTAINER"  "$FRONTEND_CONTAINER" 2>/dev/null || true
docker rm    "$BACKEND_CONTAINER"  "$FRONTEND_CONTAINER" 2>/dev/null || true

echo "==> Ensuring data directory exists..."
mkdir -p /opt/advisor-data/uploads

echo "==> Starting backend..."
docker run -d \
  --name "$BACKEND_CONTAINER" \
  --network "$NETWORK" \
  -e AWS_REGION=eu-west-2 \
  -e BEDROCK_MODEL_ID=anthropic.claude-opus-4-6-v1 \
  -e PORT=3001 \
  -v /opt/advisor-data:/data \
  --restart unless-stopped \
  "$BACKEND_IMAGE"

echo "==> Starting frontend..."
docker run -d \
  --name "$FRONTEND_CONTAINER" \
  --network "$NETWORK" \
  -p 80:80 \
  --restart unless-stopped \
  "$FRONTEND_IMAGE"

echo "==> Removing unused images..."
docker image prune -f

echo ""
echo "==> Running containers:"
docker ps --filter "network=$NETWORK" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "==> Health check:"
sleep 3
curl -sf http://localhost/api/health && echo "" || echo "WARNING: health check failed — check logs with: docker logs $BACKEND_CONTAINER"
