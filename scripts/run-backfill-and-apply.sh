#!/usr/bin/env bash
set -euo pipefail

# Safe orchestrator to backfill tenantId values then apply per-file SQL migrations.
# Usage:
#   export DATABASE_URL='postgresql://...'
#   export FORCE_APPLY=1   # required to actually run (safety)
#   bash scripts/run-backfill-and-apply.sh

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL not set. Export your database URL and re-run."
  exit 1
fi

if [ "${FORCE_APPLY:-}" != "1" ]; then
  cat <<EOF
Safety: This script performs destructive DB migrations.
To run: set DATABASE_URL and FORCE_APPLY=1
Example:
  export DATABASE_URL='postgresql://...'
  export FORCE_APPLY=1
  bash scripts/run-backfill-and-apply.sh
EOF
  exit 0
fi

# optional: create a dump if pg_dump is available
BACKUP_FILE="backup_$(date +%Y%m%d-%H%M%S).dump"
if command -v pg_dump >/dev/null 2>&1; then
  echo "Creating DB backup to ./${BACKUP_FILE} (pg_dump -Fc)..."
  pg_dump --format=custom "$DATABASE_URL" -f "$BACKUP_FILE" || {
    echo "pg_dump failed; aborting."; exit 1;
  }
  echo "Backup created: $BACKUP_FILE"
else
  echo "pg_dump not available; skipping DB dump. Ensure you have a backup before continuing."
fi

# Helper to run psql queries for verification (if psql exists)
_psql_exec() {
  if command -v psql >/dev/null 2>&1; then
    PSQL="psql $DATABASE_URL -v ON_ERROR_STOP=1 -q -t -c"
    "$PSQL" "$1"
  else
    echo "psql not available; skipping verification: $1"
  fi
}

# 1) Run consolidated backfill script(s)
if [ -f "scripts/backfill-tenant-scoped-tables.ts" ]; then
  echo "Running consolidated backfill script: scripts/backfill-tenant-scoped-tables.ts"
  pnpm --silent tsx scripts/backfill-tenant-scoped-tables.ts || { echo "Backfill script failed"; exit 1; }
else
  echo "Notice: scripts/backfill-tenant-scoped-tables.ts not found. Running individual backfill helpers if present."
  # Fallbacks (best-effort) - run any known backfill helpers if they exist
  for s in scripts/backfill-booking-tenantId.ts scripts/backfill-booking-tenant-raw.ts scripts/backfill-tenant-columns.ts; do
    if [ -f "$s" ]; then
      echo "Running $s"
      pnpm --silent tsx "$s" || { echo "Backfill $s failed"; exit 1; }
    fi
  done
fi

# 2) Ordered list of migration files to apply (one-by-one)
MIGRATIONS=(
  "prisma/migrations/20251004_add_booking_tenantid_not_null/migration.sql"
  "prisma/migrations/20251004_add_servicerequest_tenantid_not_null/migration.sql"
  "prisma/migrations/20251004_add_service_tenantid_not_null/migration.sql"
  "prisma/migrations/20251004_add_workorder_tenantid_not_null/migration.sql"
  "prisma/migrations/20251004_add_invoice_tenantid_not_null/migration.sql"
  "prisma/migrations/20251004_add_expense_tenantid_not_null/migration.sql"
  "prisma/migrations/20251004_add_attachment_tenantid_not_null/migration.sql"
  "prisma/migrations/20251004_add_scheduledreminder_tenantid_not_null/migration.sql"
  "prisma/migrations/20251004_add_bookingsettings_tenantid_not_null/migration.sql"
  "prisma/migrations/20251004_add_idempotencykey_tenantid_not_null/migration.sql"
)

# Verification map: migration -> table to verify (counts tenantId IS NULL)
declare -A VERIFY_TABLE
VERIFY_TABLE["prisma/migrations/20251004_add_booking_tenantid_not_null/migration.sql"]="\"Booking\""
VERIFY_TABLE["prisma/migrations/20251004_add_servicerequest_tenantid_not_null/migration.sql"]="\"ServiceRequest\""
VERIFY_TABLE["prisma/migrations/20251004_add_service_tenantid_not_null/migration.sql"]="\"Service\""
VERIFY_TABLE["prisma/migrations/20251004_add_workorder_tenantid_not_null/migration.sql"]="\"WorkOrder\""
VERIFY_TABLE["prisma/migrations/20251004_add_invoice_tenantid_not_null/migration.sql"]="\"Invoice\""
VERIFY_TABLE["prisma/migrations/20251004_add_expense_tenantid_not_null/migration.sql"]="\"Expense\""
VERIFY_TABLE["prisma/migrations/20251004_add_attachment_tenantid_not_null/migration.sql"]="\"Attachment\""
VERIFY_TABLE["prisma/migrations/20251004_add_scheduledreminder_tenantid_not_null/migration.sql"]="\"ScheduledReminder\""
VERIFY_TABLE["prisma/migrations/20251004_add_bookingsettings_tenantid_not_null/migration.sql"]="\"BookingSettings\""
VERIFY_TABLE["prisma/migrations/20251004_add_idempotencykey_tenantid_not_null/migration.sql"]="\"IdempotencyKey\""

# Apply each migration safely using the helper script
for M in "${MIGRATIONS[@]}"; do
  if [ ! -f "$M" ]; then
    echo "SKIP: Migration file not found: $M"
    continue
  fi
  echo
  echo "=============================="
  echo "Applying migration: $M"
  echo "=============================="

  pnpm --silent tsx scripts/apply-migration-file.ts "$M" || { echo "Migration failed: $M"; exit 1; }
  echo "Applied: $M"

  # Run verification for tenantId NULLs if possible
  TBL=${VERIFY_TABLE[$M]:-}
  if [ -n "$TBL" ]; then
    echo "Verifying no NULL tenantId rows exist in table $TBL"
    SQL="SELECT COUNT(*) FROM $TBL WHERE \"tenantId\" IS NULL;"
    _psql_exec "$SQL" || echo "Verification query failed or psql not available. Please run: $SQL"
  fi

done

# 3) Re-generate Prisma client and run quick checks
if command -v pnpm >/dev/null 2>&1; then
  echo "Regenerating Prisma client and running typecheck..."
  pnpm --silent db:generate || echo "Warning: pnpm db:generate failed. Run locally: pnpm db:generate"
  echo "Tip: run pnpm typecheck locally or in CI to ensure build succeeds."
else
  echo "pnpm not found in PATH; please run 'pnpm db:generate' and 'pnpm typecheck' locally or in CI."
fi

echo "All done. If any verification query reported non-zero counts, inspect the rows and fix before making tenantId NOT NULL permanent."
