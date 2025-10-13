#!/usr/bin/env bash
set -euo pipefail

if [ -z "${DATABASE_URL:-}" ] && [ -z "${NETLIFY_DATABASE_URL:-}" ]; then
  echo "[verify-staging] DATABASE_URL not set; export staging DB URL before running" >&2
  exit 2
fi

echo "[verify-staging] Running prisma validate"
npx prisma validate

echo "[verify-staging] Checking migrate status"
npx prisma migrate status || {
  code=$?
  echo "[verify-staging] prisma migrate status returned ${code}" >&2
  exit ${code}
}

echo "[verify-staging] Generating Prisma client"
npx prisma generate

echo "[verify-staging] Running TypeScript verification checks"
pnpm -s tsx scripts/ci/verify-staging-db.ts

echo "[verify-staging] Done"
