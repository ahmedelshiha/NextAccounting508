#!/usr/bin/env bash
set -euo pipefail

# Runbook: tenant migration & backfill helper
# Usage: NETLIFY_DATABASE_URL=... ./scripts/run-tenant-migrations.sh

DB=${NETLIFY_DATABASE_URL:-${DATABASE_URL:-}}
if [ -z "$DB" ]; then
  echo "Set NETLIFY_DATABASE_URL or DATABASE_URL to your connection string and re-run. Aborting." >&2
  exit 1
fi
export DATABASE_URL="$DB"

echo "Using DATABASE_URL=${DATABASE_URL}"

echo "\n== 1) Current NULL tenantId counts (pre)"
pnpm tsx scripts/report-tenant-null-counts.ts || true

# 2) Ensure booking tenant column exists (best-effort)
if [ -f scripts/add-booking-tenant-column.ts ]; then
  echo "\n== 2) Ensuring Booking.tenantId column exists"
  pnpm tsx scripts/add-booking-tenant-column.ts
else
  echo "\n== 2) scripts/add-booking-tenant-column.ts not present; skipping."
fi

# 3) Apply attachment migration we prepared
MIGRATIONS=(
  "prisma/migrations/20251004_add_attachment_tenantid/migration.sql"
  "prisma/migrations/20251004_add_service_tenantid_not_null/migration.sql"
  "prisma/migrations/20251004_add_servicerequest_tenantid_not_null/migration.sql"
  "prisma/migrations/20251004_add_booking_tenantid_not_null/migration.sql"
  "prisma/migrations/20251004_add_workorder_tenantid_not_null/migration.sql"
  "prisma/migrations/20251004_add_invoice_tenantid_not_null/migration.sql"
  "prisma/migrations/20251004_add_expense_tenantid_not_null/migration.sql"
  "prisma/migrations/20251004_add_scheduledreminder_tenantid_not_null/migration.sql"
  "prisma/migrations/20251004_add_bookingsettings_tenantid_not_null/migration.sql"
  "prisma/migrations/20251004_add_idempotencykey_tenantid_not_null/migration.sql"
)

for m in "${MIGRATIONS[@]}"; do
  if [ -f "$m" ]; then
    echo "\n== Applying migration: $m"
    pnpm tsx scripts/apply-migration-file.ts "$m"
  else
    echo "\n== Migration not found, skipping: $m"
  fi
done

# 4) Run backfill (idempotent)
echo "\n== 4) Running backfill script"
pnpm tsx scripts/backfill-tenant-scoped-tables.ts

# 5) Re-run report
echo "\n== 5) NULL tenantId counts (post backfill)"
pnpm tsx scripts/report-tenant-null-counts.ts || true

# 6) Finalize: regenerate client, typecheck, run integration tests
echo "\n== 6) Regenerate Prisma client and run checks"
pnpm db:generate || true
pnpm typecheck || true

echo "\n== Run complete. Inspect output and run pnpm test:integration if desired."
