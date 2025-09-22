Overview

This file summarizes recent code changes made by the AI assistant, highlights risk areas, and lists precise, actionable follow-ups to finish Phase 2 and harden the code for production deployments.

Summary of changes (files created/modified)
- New: src/lib/api/error-responses.ts — ApiError class and mappers for Prisma/Zod errors.
- Modified: src/app/api/admin/services/route.ts, src/app/api/admin/services/[id]/route.ts, src/app/api/admin/services/bulk/route.ts, src/app/api/admin/services/export/route.ts, src/app/api/admin/services/stats/route.ts — normalized error handling; 409 mapping for slug conflicts.
- New endpoints: src/app/api/admin/services/[id]/clone/route.ts, src/app/api/admin/services/[id]/versions/route.ts, src/app/api/admin/services/[id]/settings/route.ts, src/app/api/admin/services/slug-check/[slug]/route.ts
- Modified/Extended: src/services/services.service.ts — cloneService, bulkUpdateServiceSettings, analytics (monthlyBookings, revenueByService, popularServices, revenueTimeSeries, conversionsByService), performBulkAction extended for clone and settings-update, cache invalidation improvements.
- Modified: src/lib/services/utils.ts — validateSlugUniqueness and sanitizers retained.
- Modified: src/app/api/services/[slug]/route.ts — uses status='ACTIVE', increments service.views, best-effort ServiceView creation added in later steps.
- Schema changes: prisma/schema.prisma — added `views Int @default(0)`, and new model `ServiceView` for per-hit tracking.
- Types/schemas: src/types/services.ts updated (views, revenueTimeSeries, conversionsByService). src/schemas/services.ts updated (BulkActionSchema to include clone/settings-update).
- UI components: src/components/admin/services/RevenueTimeSeriesChart.tsx, ConversionsTable.tsx added and wired into ServicesAnalytics.tsx.
- Docs updated: docs/admin-services-todo.md, docs/admin-services-log.md, DEPLOYMENT.md updated with Netlify guidance.

Risk & rollback considerations
- Prisma schema changes require a migration. Rolling back migrations is DB-specific and may need manual rollback; do not run migrations on production without backups.
- The ServiceView model and service.views additions change DB shape; ensure backups and run migrations on staging first.
- Clone bulk action creates draft services; best-effort rollback implemented, but may fail partially — client must inspect result.errors.

Immediate follow-up tasks (actionable)
1) Create and commit Prisma migration files for Service.views and ServiceView model. (Owner: dev)
   - Steps: run `pnpm db:generate` -> `npx prisma migrate dev --name add-service-views` locally with DATABASE_URL; verify generated SQL in prisma/migrations; test on local DB; push migration.
   - Acceptance: migrations present, prisma generate succeeds, seed works.

2) Add GitHub Actions CI workflow to run typecheck, lint, unit tests, and build on PRs. (Owner: dev)
   - Steps: create .github/workflows/ci.yml, run on pull_request, include pnpm install, pnpm run typecheck, pnpm run lint, pnpm test:thresholds; optional build for main branch.
   - Acceptance: CI job passes on PRs.

3) Add unit tests for getServiceStats and performBulkAction (clone rollback). (Owner: dev)
   - Steps: create tests using Vitest mocking prisma; assert revenueTimeSeries and conversionsByService outputs for sample bookings/serviceViews; assert bulk clone returns createdIds and errors shape; test rollback path.
   - Acceptance: tests added and passing in CI.

4) Add Redis cache wrapper and integration plan (design + implementation). (Owner: dev)
   - Steps: add src/lib/cache/redis.ts, create feature-flagged CacheService swap, integration tests.
   - Acceptance: Redis-backed cache available, fallback to in-memory when unconfigured.

5) Admin UI verification and accessibility (Owner: UX dev)
   - Steps: confirm charts render correctly, add aria labels, ensure responsive behavior, keyboard focus, color contrast.
   - Acceptance: Manual signoff or component tests confirming accessibility rules.

6) Netlify staging verification (manual) (Owner: dev/ops)
   - Steps: set NETLIFY_DATABASE_URL staging, deploy, verify migrations run, run scripts/netlify-preview-smoke.js, check health endpoint.
   - Acceptance: migrations applied, smoke tests pass.

Notes for running migrations safely
- Always backup production DB (pg_dump) before applying migration.
- Prefer to run migrations on CI with a controlled DB user that has limited permissions and with advisory lock timeout set.

If you want, I can create the CI workflow and an initial migration folder template next. Which follow-up should I implement first?
