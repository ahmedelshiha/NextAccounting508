

## AI Agent Update (2025-10-07)

## ✅ Completed
- [x] Prepared runbook script to execute backfill and migrations locally
  - File: scripts/run-tenant-migrations.sh
  - Why: Consolidates steps into a single idempotent script for operator use
  - How to run: NETLIFY_DATABASE_URL="<conn>" ./scripts/run-tenant-migrations.sh

## ⚠️ Notes
- This script performs DDL/DML; ensure DB snapshot is taken before running and run in a maintenance window.
- The script is best-run from a CI or operator shell with pnpm and tsx available.
