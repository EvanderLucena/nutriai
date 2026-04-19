#!/bin/bash
# logs.sh — Follow container logs
# Usage: ./scripts/logs.sh [service]
#   service: frontend, backend, postgres (default: all)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$ROOT_DIR"

SERVICE="${1:-}"

if [ -n "$SERVICE" ]; then
  echo "Following logs for: $SERVICE"
  docker compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml logs -f "$SERVICE"
else
  echo "Following logs for all services"
  docker compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml logs -f
fi