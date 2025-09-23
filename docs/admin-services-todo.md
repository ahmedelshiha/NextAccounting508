Last updated: 2025-09-25

Overview
- Purpose: Reorganize Phase tasks into dependency-ordered, actionable items. Break large items into measurable steps and mark completed work.
- Status: Some Phase 1–3 items are implemented; remaining work broken into small tasks ready for execution.

Guidelines
- Each task is specific, measurable, and outcome-oriented.
- Tasks are ordered so prerequisites appear first.
- Completed tasks are checked [x].

PRIORITIZED WORK (critical path first)

1) Phase 1 — Foundation & Type Consistency (complete prerequisites)
- [x] 1.1.1 Remove duplicate Service types and unify imports to src/types/services.ts
- [x] 1.1.2 Run full typecheck and fix conflicts (pnpm run typecheck)
- [x] 1.2.1 Replace inline filters with components (ServicesFilters)
- [x] 1.2.2 Move analytics into ServicesAnalytics component and wire props
- [x] 1.3.1 Centralize schema validation in src/schemas/services.ts (zod)

2) Phase 2 — Data schema & service layer (must complete before API hardening)
- [x] 2.1.1 Add composite unique (tenantId, slug) to Service Prisma model and add serviceSettings Json?
- [x] 2.1.2 Add Service.status enum values (DRAFT, RETIRED) and migrate read paths to use status
- [x] 2.1.3 Wire migration-run logic in CI/Netlify (netlify.toml + scripts/prisma-deploy-retry.sh)
- [x] 2.2.1 Implement cloneService(name, fromId) with tenant-scoped slug dedup
- [x] 2.2.2 Implement bulkUpdateServiceSettings(updates) with shallow merge
- [x] 2.2.3 Strengthen cache invalidation patterns (service-*/services-list:*)
- [x] 2.3.1 Compute booking-driven analytics (monthlyBookings, revenueByService, popularServices)
- [x] 2.3.2 Add revenueTimeSeries (per-service monthly series for top services)
- [x] 2.3.3 Add conversionsByService (views→bookings) using service.views counter
- [x] 2.1.4 Add service.views counter and ServiceView model for per-hit tracking

3) Phase 3 — API Layer Hardening & Endpoints (after Phase 2)
- [x] 3.1.1 Create src/lib/api/error-responses.ts (ApiError, mappers for Prisma/Zod)
- [x] 3.1.2 Normalize error handling in admin service routes (/api/admin/services/*)
- [x] 3.2.1 Add POST /api/admin/services/[id]/clone (created)
- [x] 3.2.2 Add HEAD /api/admin/services (created)
- [x] 3.2.3 Add GET /api/admin/services/[id]/versions (stub) (created)
- [x] 3.2.4 Add PATCH /api/admin/services/[id]/settings (created)
- [x] 3.2.5 Add GET /api/admin/services/slug-check/[slug] (created)
- [x] 3.3.1 Extend bulk actions to include clone and settings-update with per-item results and rollback behavior

4) Phase 4 — Performance & Caching (post Phase 2/3)
- [x] 4.1.1 Add Redis client wrapper (create src/lib/cache/redis.ts)
- [x] 4.1.2 Implement Redis-backed CacheService and wire via DI in ServicesService
- [x] 4.1.3 Implement safe deletePattern (prefix matching, rate-limited)
- [x] 4.2.1 Implement ETag/Last-Modified heuristics for lists & single resources
- [x] 4.2.2 Add cache warming for hot paths (services list top queries)

5) Phase 5 — Integration & Events
- [x] 5.1.1 Create typed service events (src/lib/events/service-events.ts)
- [x] 5.1.2 Publish events on service create/update/delete and hook cache invalidation listeners
- [x] 5.2.1 Add ServiceLite DTO and expose to booking wizard

6) Phase 6 — Security & Rate Limiting (parallel)
- [x] 6.1.1 Add granular permissions: MANAGE_FEATURED, BULK_OPERATIONS, VIEW_ANALYTICS
- [x] 6.2.1 Tenant-scoped rate limiting for bulk operations (per-tenant keys)
- [x] 6.3.1 CSV export sanitization & throttling

7) Phase 7 — Tests & QA (start after Phase 2/3 complete)
- [x] 7.1.1 Unit tests for services.service.ts (clone, bulkUpdateServiceSettings, getServiceStats)
- [x] 7.2.1 Integration tests for all service API routes (including 409 slug conflicts)
- [x] 7.3.1 Component tests for ServiceForm, BulkActionsPanel, ServicesAnalytics

8) Phase 8 — Documentation & Monitoring (ongoing)
- [x] 8.1.1 Generate OpenAPI spec for admin service endpoints (src/openapi/admin-services.json, /api/openapi/admin-services)
- [x] 8.1.2 Document cache invalidation strategy and fallback behavior (docs/admin-services-cache-invalidation.md)
- [x] 8.2.1 Add Sentry integration and monitoring dashboards (Sentry SDK configured; captureException added in key routes; set SENTRY_DSN on Netlify; optional sourcemaps upload)

Actionable immediate next steps (top 5)
- [ ] Create Prisma migration files for Service.views and ServiceView model, commit migration (developer to run with DB creds)
- [x] Enhance Netlify build to run lint, typecheck, tests and build
- [x] Add Redis wrapper and plan migration from in-memory cache to Redis (design + implementation tasks)
- [x] Add unit tests for analytics math (getServiceStats) and bulk operations rollback logic
- [ ] Surface revenueTimeSeries & conversionsByService in admin UI (charts already wired — verify accessibility and responsiveness)

Notes about completed work
- ✅ What was completed: centralized types, schema updates, service layer improvements (clone, bulk settings), analytics (time-series + conversions), API error normalization, new admin endpoints, ServiceView model and UI charts.
- ✅ Why: to support tenant-scoped services, richer analytics, safer bulk ops, and consistent API error handling.
- ✅ Next steps: run DB migrations for ServiceView/Service.views, set SENTRY_DSN and (optional) Sentry auth for sourcemaps on Netlify, configure REDIS_URL for cross-instance cache, final UI accessibility pass.

Change log
- See docs/admin-services-log.md for detailed entries of changes and rationales.


Sentry Verification Hardening
- [x] Configure Sentry tunnel (/monitoring) in Next + SDK to bypass ad blockers and CORS
- [x] Add /api/sentry-check to verify DSN presence on server/client
- [ ] Ensure Sentry Allowed Domains include preview/prod hosts (*.projects.builder.codes, *.fly.dev, production host)
