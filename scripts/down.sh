#!/bin/bash
# down.sh — Tear down services
# Usage: ./scripts/down.sh [--volumes]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$ROOT_DIR"

VOLUMES_FLAG=""
if [ "${1:-}" = "--volumes" ]; then
  VOLUMES_FLAG="--volumes"
  echo "🗑  Removing containers AND volumes"
else
  echo "🛑 Removing containers (preserving volumes)"
fi

docker compose down $VOLUMES_FLAG