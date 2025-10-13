#!/usr/bin/env bash
set -euo pipefail

# Run prisma migrate deploy in CI only when DATABASE_URL is provided.
# This avoids failing builds on preview environments without DB while enabling migrations in staging/prod.
if [ -n "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL present, running prisma migrate deploy"
  npx prisma migrate deploy
else
  echo "DATABASE_URL not set, skipping prisma migrate deploy"
fi
