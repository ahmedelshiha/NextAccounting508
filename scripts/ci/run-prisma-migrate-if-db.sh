#!/usr/bin/env bash
set -euo pipefail

# Run prisma migrate deploy in CI only when DATABASE_URL is provided.
# This avoids failing builds on preview environments without DB while enabling migrations in staging/prod.
if [ -n "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL present, running prisma migrate deploy"
  # Retry to mitigate transient advisory lock timeouts (P1002)
  # Configure retries via MIGRATE_RETRIES and MIGRATE_SLEEP (seconds)
  RETRIES=${MIGRATE_RETRIES:-3}
  SLEEP=${MIGRATE_SLEEP:-5}
  ATTEMPT=1
  while true; do
    if npx prisma migrate deploy; then
      echo "prisma migrate deploy succeeded on attempt ${ATTEMPT}"
      break
    else
      code=$?
      if [ ${ATTEMPT} -ge ${RETRIES} ]; then
        echo "prisma migrate deploy failed after ${ATTEMPT} attempts (exit ${code})"
        exit ${code}
      fi
      echo "prisma migrate deploy failed (exit ${code}), retrying in ${SLEEP}s... [attempt ${ATTEMPT}/${RETRIES}]"
      sleep ${SLEEP}
      ATTEMPT=$((ATTEMPT+1))
    fi
  done
else
  echo "DATABASE_URL not set, skipping prisma migrate deploy"
fi
