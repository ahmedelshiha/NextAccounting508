

## AI Agent Update (2025-10-07)

### Deployment automation
- Added GitHub Actions workflow .github/workflows/tenant-migrations.yml to run the tenant migration runbook.
  - Triggers: manual (workflow_dispatch) or push to ai_main_df9a6d8380eb when secret AUTO_RUN_MIGRATIONS is set to '1'.
  - Requires repo secret: NETLIFY_DATABASE_URL (do NOT store credentials in code). Optionally set AUTO_RUN_MIGRATIONS='1' to allow push-triggered runs.
  - The job runs in the 'production' environment so you can enable required reviewers/approvals in GitHub to gate execution.
  - Recommended: keep AUTO_RUN_MIGRATIONS unset (or '0') and use manual dispatch for safety during rollout.


## ✅ Completed
- [x] Prepared runbook script to execute backfill and migrations locally
  - File: scripts/run-tenant-migrations.sh
  - Why: Consolidates steps into a single idempotent script for operator use
  - How to run: NETLIFY_DATABASE_URL="<conn>" ./scripts/run-tenant-migrations.sh

## ⚠️ Notes
- This script performs DDL/DML; ensure DB snapshot is taken before running and run in a maintenance window.
- The script is best-run from a CI or operator shell with pnpm and tsx available.
