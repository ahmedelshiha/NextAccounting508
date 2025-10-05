# Operations & Deployment Checklist

## Pre-Deployment
- Confirm target environment (Vercel, Netlify, self-hosted) and associated secrets.
- Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:integration`, and targeted suites (tenant, thresholds) as needed.
- Ensure Prisma schema changes migrated (`pnpm db:generate`, `pnpm db:migrate deploy` or `pnpm db:push`).
- Review CHANGELOG or release notes for dependencies and scripts.

## Environment Variables
- Validate with `pnpm check:env`.
- Confirm critical secrets: `DATABASE_URL`/`NETLIFY_DATABASE_URL`, `NEXTAUTH_SECRET`, `FROM_EMAIL`, `SENDGRID_API_KEY`, `STRIPE_*`, `CRON_SECRET`, `SENTRY_DSN`, `REDIS_URL` or Upstash tokens.
- For previews/E2E: `PREVIEW_URL`, `PREVIEW_SESSION_COOKIE`, `ADMIN_AUTH_TOKEN`, `E2E_BASE_URL`.

## Build Steps
- Execute `pnpm build` which triggers env validation, Prisma client generation, and Turbopack build.
- For Netlify, ensure `@netlify/plugin-nextjs` configured and `netlify.toml` aligns with build output.
- For Docker/ECS, rebuild image (see `DEPLOYMENT.md`) ensuring `npx prisma generate` executed during build stage.

## Database & Migrations
- Backup target database (Supabase/Neon snapshot).
- Apply migrations (`pnpm db:migrate deploy`) and seed data if necessary (`pnpm db:seed`).
- Run integrity scripts (`scripts/db-fix-*`, `scripts/report-tenant-null-counts.ts`) when schema changes affect production data.

## Post-Deployment Verification
- Hit key health endpoints: `/api/system/health`, `/api/admin/system/health`, `/status`.
- Run `pnpm monitoring:health` or `node scripts/health-check.js` against production.
- Validate admin and portal login flows; confirm tenant switcher and critical dashboards load without errors.
- Trigger sample cron via authorized POST to `/api/cron/reminders`.
- Confirm Stripe webhook events succeed (test mode replay if applicable).

## Rollback Plan
- Maintain previous deployment snapshot (Vercel/Netlify rollback buttons or Docker tag).
- Store DB migration rollback steps or reversible scripts.
- Document manual steps in incident response if automated rollback unavailable.

## Documentation & Communication
- Update `README.md` and `docs/PROJECT_SUMMARY.md` when features or infrastructure changes occur.
- Announce deployment status and known issues to stakeholders.
- Log deployment details (commit hash, timestamp, environment) in release notes or internal tracker.
