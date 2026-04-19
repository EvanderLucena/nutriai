#!/bin/bash
# seed-db.sh — Seed the development database with test data
# Usage: ./scripts/seed-db.sh
# Requires: Docker Compose services running (postgres container)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$ROOT_DIR"

SEED_FILE="docker/seed-dev.sql"

if [ ! -f "$SEED_FILE" ]; then
  echo "Seed file not found: $SEED_FILE"
  exit 1
fi

echo "Seeding development database..."
docker compose -f docker/docker-compose.yml exec -T postgres psql -U "${POSTGRES_USER:-nutriai}" -d "${POSTGRES_DB:-nutriai}" < "$SEED_FILE"

echo "Database seeded successfully."