#!/bin/bash
# setup.sh — First-time project setup
# Usage: ./scripts/setup.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$ROOT_DIR"

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example"
else
  echo ".env already exists — skipping"
fi

echo "Building Docker images..."
docker compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml build

echo ""
echo "Setup complete! Next steps:"
echo "   1. Review and adjust .env if needed"
echo "   2. Run ./scripts/dev.sh to start the development environment"
echo "   3. Backend API will be available at http://localhost:8080"
echo "   4. Frontend will be available at http://localhost:5173"