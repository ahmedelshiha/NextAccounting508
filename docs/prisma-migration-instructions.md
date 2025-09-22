Prisma Migration: Service.views + ServiceView (safe-run checklist)

Purpose
- This document provides safe, repeatable steps to apply the new Prisma migration that adds the `views` column to `services` and creates the `service_views` table for per-hit tracking.
- Follow these steps in order. Do NOT run on production without backups and a staging validation.

Prerequisites
- Access to the target Postgres database connection string (NETLIFY_DATABASE_URL or DATABASE_URL)
- Local environment with pnpm installed and node 18+
- Recommended: a staging database that mirrors production schema

Files added
- prisma/schema.prisma (already updated in repo)
- prisma/migrations/20250924_add_service_views/migration.sql (SQL migration file in repo)

Local (developer) workflow
1. Create local DB backup (if targeting a shared DB)
   - pg_dump -Fc "${DATABASE_URL}" -f backup-before-service-views.dump

2. Pull latest repo and install deps
   - git fetch && git checkout your-branch
   - pnpm install

3. Generate Prisma client (safe even without running migrations)
   - pnpm db:generate

4. Apply migration locally (dev flow)
   - npx prisma migrate dev --name add-service-views
   This will create a migration entry and apply it to your local database.

5. Run seed (if needed) and smoke tests
   - pnpm db:seed
   - pnpm test:thresholds

CI/Netlify (production/staging) deployment notes
- The repo's netlify.toml already runs a migration step when NETLIFY_DATABASE_URL is set and uses scripts/prisma-deploy-retry.sh to retry on advisory lock contention.
- For production deploys on Netlify:
  1. Ensure you have a DB backup (pg_dump or provider snapshot).
  2. Set NETLIFY_DATABASE_URL (or NETLIFY_DATABASE_URL_UNPOOLED) in Netlify Site settings (Environment).
  3. Deploy to a staging branch first and confirm migrations run successfully.
  4. Monitor the Netlify build logs for prisma migrate output and ensure no errors.

Apply migrations via CI (recommended for predictable execution)
- Use `npx prisma migrate deploy` in CI (the repository's scripts/prisma-deploy-retry.sh already wraps db:migrate with retries). Example:
  - In CI: pnpm db:generate && ./scripts/prisma-deploy-retry.sh

Rollback guidance (if migration causes issues)
- Best practice: restore DB from backup (pg_restore) rather than attempting complex down-migrations.
  1. Take immediate backup of the broken state:
     - pg_dump -Fc "${DATABASE_URL}" -f backup-after-failure.dump
  2. Restore from the pre-migration backup:
     - pg_restore --clean --no-acl --no-owner -d "${DATABASE_URL}" backup-before-service-views.dump
- If you must write a down migration SQL, draft SQL that drops `service_views` and drops column `views` from `services`. Test carefully on staging before running in production.

Verification checklist (post-migration)
- [ ] _prisma_migrations table contains a new entry for add-service-views
- [ ] `views` column exists and defaults to 0: SELECT count(*) FROM services WHERE views IS NULL;
- [ ] `service_views` table exists and accepts inserts
- [ ] Run smoke test: scripts/netlify-preview-smoke.js against deployed URL
- [ ] Verify analytics endpoint returns revenueTimeSeries & conversionsByService as expected

Notes & caveats
- The migration is additive (adds column and new table). It is designed to be backward-compatible with existing code.
- Ensure any read replicas or connection pooling settings are compatible with schema changes.

If you want, I can also generate a SQL down-migration file (DROP TABLE and ALTER TABLE DROP COLUMN) and a GitHub Actions job that runs `npx prisma migrate deploy` against a staging DB with NETLIFY_DATABASE_URL set. Which would you like next?
