# Migrations & Seeding — Guidelines

This project uses Prisma for schema migrations and a TypeScript seed script located at `prisma/seed.ts`.

Principles
- Migrations should be safe and idempotent (use IF NOT EXISTS / IF EXISTS where appropriate).
- Avoid destructive changes without a clear rollback plan.
- Seed should be idempotent (use upsert) and grouped into logical transactions to ensure consistency.

Workflow
1. Create migration: `pnpm db:generate` (regenerates client), then add SQL migration under `prisma/migrations/`.
2. Test migrations locally against a disposable Postgres instance (Docker or a CI job).
3. Run `pnpm db:migrate` to apply migrations.
4. Run `pnpm db:seed` to populate demo data. Seed is idempotent and safe to re-run.

CI
- We added a GitHub Actions workflow `.github/workflows/seed-ci.yml` that runs migrations and seed against a temporary Postgres service and performs a smoke test.

Troubleshooting
- If seed fails with missing columns, ensure recent migrations are applied (`pnpm db:migrate`).
- If you want to enforce failures for non-critical seed steps, set `SEED_FAIL_FAST=true`.
- Set seed passwords via environment variables (recommended):
  - SEED_ADMIN_PASSWORD
  - SEED_STAFF_PASSWORD
  - SEED_LEAD_PASSWORD
  - SEED_CLIENT_PASSWORD

Security
- Do not commit production credentials. Use environment variables in CI and on deploy targets (Netlify). See `netlify.toml` for build steps.
