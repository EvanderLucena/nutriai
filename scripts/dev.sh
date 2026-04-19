#!/bin/bash
# dev.sh — Start all services (primary development command)
# Usage: ./scripts/dev.sh [--build]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$ROOT_DIR"

if [ ! -f .env ]; then
  echo "No .env file found. Run ./scripts/setup.sh first."
  exit 1
fi

set -a; source .env; set +a

BUILD_FLAG=""
if [ "${1:-}" = "--build" ]; then
  BUILD_FLAG="--build"
fi

echo "Starting NutriAI development environment..."
docker compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml up $BUILD_FLAG