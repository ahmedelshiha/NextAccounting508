#!/usr/bin/env bash
set -euo pipefail

# Retry prisma migrate deploy with exponential backoff to handle advisory lock contention
# Usage: ./scripts/prisma-deploy-retry.sh

# Fast-fail if no DB URL is present (defensive)
if [ -z "${NETLIFY_DATABASE_URL:-}" ] && [ -z "${DATABASE_URL:-}" ]; then
  echo "[prisma-deploy-retry] No database URL provided. Skipping migrations."
  exit 0
fi

# If there are no migration.sql files committed, fall back to a non-destructive prisma db push
if [ ! -d prisma/migrations ] || ! find prisma/migrations -maxdepth 2 -name 'migration.sql' -type f -print -quit | grep -q .; then
  echo "[prisma-deploy-retry] No migration.sql files found in prisma/migrations. Running prisma db push as a one-time fallback."
  pnpm db:push
  echo "[prisma-deploy-retry] prisma db push completed."
  exit 0
fi

MAX_ATTEMPTS=${MAX_ATTEMPTS:-5}
SLEEP_BASE=${SLEEP_BASE:-2}

attempt=1
until [ $attempt -gt "$MAX_ATTEMPTS" ]; do
  echo "[prisma-deploy-retry] Attempt #$attempt of $MAX_ATTEMPTS"
  # Ensure the advisory timeout env var is present for the subprocess
  export PRISMA_MIGRATION_ENGINE_ADVISORY_LOCK_TIMEOUT=${PRISMA_MIGRATION_ENGINE_ADVISORY_LOCK_TIMEOUT:-300000}
  if pnpm db:migrate; then
    echo "[prisma-deploy-retry] Migration succeeded"
    exit 0
  else
    echo "[prisma-deploy-retry] Migration attempt #$attempt failed"
    # If last attempt, break and return failure
    if [ "$attempt" -ge "$MAX_ATTEMPTS" ]; then
      echo "[prisma-deploy-retry] Reached max attempts ($MAX_ATTEMPTS). Exiting with error."
      exit 1
    fi
    # Exponential backoff with jitter
    sleep_seconds=$(( SLEEP_BASE ** attempt ))
    jitter=$(( RANDOM % SLEEP_BASE ))
    total_sleep=$(( sleep_seconds + jitter ))
    echo "[prisma-deploy-retry] Sleeping for ${total_sleep}s before retrying..."
    sleep ${total_sleep}
    attempt=$(( attempt + 1 ))
  fi
done

exit 1
