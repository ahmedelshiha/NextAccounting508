#!/usr/bin/env bash
set -euo pipefail

# Retry prisma migrate deploy with exponential backoff to handle advisory lock contention
# Usage: ./scripts/prisma-deploy-retry.sh

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
