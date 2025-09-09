# Admin Enhancements Documentation

This document summarizes all admin-related enhancements implemented in this iteration and outlines recommended future improvements.

## Implemented Enhancements

### Security, RBAC, and Auditing
- Granular RBAC utilities
  - File: `src/lib/rbac.ts`
  - Permissions: `view_analytics`, `manage_users`, `manage_bookings`, `manage_posts`, `manage_services`, `manage_newsletter`.
  - Enforced in admin APIs (users, bookings).
- Audit logging
  - File: `src/lib/audit.ts` (persists to `HealthLog` table with service="AUDIT"; logs to console if DB is absent).
  - Integrated in:
    - Role changes: `src/app/api/admin/users/[id]/route.ts`
    - Bookings create/bulk update/delete: `src/app/api/admin/bookings/route.ts`
- Client-side permission gating
  - Hook: `src/lib/use-permissions.ts`
  - Gated UI:
    - Dashboard quick actions and Advanced Analytics card: `src/app/admin/page.tsx`
    - Role controls on Users page: `src/app/admin/users/page.tsx`

### Admin APIs
- Users
  - List users: `GET /api/admin/users` with DB-less fallback.
  - Update user role: `PATCH /api/admin/users/[id]` (Admin-only, RBAC-enforced).
- Advanced Analytics
  - `GET /api/admin/analytics?range=7d|14d|30d|90d|1y`: parameterized analytics. Returns daily bookings for range, revenue by service within range, average lead time within range, and top services in range.
- Tasks
  - `GET /api/admin/tasks` list, `POST /api/admin/tasks` create, `PATCH /api/admin/tasks/[id]` update (ADMIN/STAFF). DB-less fallbacks for GET.
- Exports
  - `GET /api/admin/export?entity=users|bookings|services|audits&format=csv` returns CSV with Content-Disposition for download.
- Stats (existing, now used by dashboard)
  - Bookings: `src/app/api/admin/stats/bookings/route.ts` (supports optional ?range=7d|30d|90d|1y)
  - Users: `src/app/api/admin/stats/users/route.ts` (supports optional ?range=7d|30d|90d|1y)
  - Posts: `src/app/api/admin/stats/posts/route.ts` (supports optional ?range=7d|30d|90d|1y)
- System health
  - DB check: `GET /api/db-check`
  - Health logs list/create: `GET/POST /api/health/logs`
- Activity
  - `GET /api/admin/activity?type=AUDIT&limit=20` lists recent audit events (RBAC).
- Performance
  - `GET /api/admin/perf-metrics` returns pageLoad, apiResponse, uptime, errorRate (safe defaults).
- System Health Rollup
  - `GET /api/admin/system/health` aggregates DB/email/auth/external API status with an overall summary.

### Admin UI
- Dashboard (`src/app/admin/page.tsx`)
  - Revenue uses real values from bookings stats.
  - Live DB health indicator via `/api/db-check`.
  - Trends (last 6 months): user registrations and posts published (bar mini-charts; no new deps).
  - Advanced Analytics section (guarded by permission) using `/api/admin/analytics`.
  - Unified time-range selector (7d, 14d, 30d, 90d, 1y) that drives analytics.
    - Recent Admin Activity feed (reads latest `AUDIT` logs via `/api/health/logs?service=AUDIT&limit=5`).
  - Quick Actions gated by permissions.
  - Upcoming Tasks card powered by `/api/admin/tasks` with loading skeletons and priority/status badges.
  - Header export shortcut for Users CSV via `/api/admin/export?entity=users&format=csv`.
  - Dashboard KPIs and charts can request range-aligned stats using new `?range` params on stats endpoints.
- Users (`src/app/admin/users/page.tsx`)
  - User list with role update select (RBAC-gated; uses new APIs).
  - Recent Admin Activity (reads latest `AUDIT` logs from `/api/health/logs`).
- Audits (`src/app/admin/audits/page.tsx`)
  - Searchable viewer for recent audit events with refresh.

### Notable Dev Notes
- DB-less safe fallbacks where possible (newsletter/services/users) to keep app functional without `NETLIFY_DATABASE_URL`.
- Prisma client safely disabled if DB URL not present (`src/lib/prisma.ts`).
- NextAuth warnings remain visible in dev logs until `NEXTAUTH_URL` and `NEXTAUTH_SECRET` are set.

## Build & Lint Fixes (Netlify)
- Fixed Next.js 15 route handler typing: dynamic API routes must use context: { params: Promise<...> } and await it. Updated `src/app/api/admin/users/[id]/route.ts` accordingly; other dynamic routes already followed this signature.
- Fixed NextAuth server handler import bug: added missing `import NextAuth from 'next-auth'` and removed duplicate import in `src/app/api/auth/[...nextauth]/route.ts` to resolve `[next-auth][error][CLIENT_FETCH_ERROR]` and TS2300 duplicate identifier errors.
- Resolved TypeScript/ESLint errors (no-explicit-any, unused vars) that caused Netlify build to fail.
  - Removed `any` from `/api/admin/export` CSV generation and price serialization.
  - Removed unused catch binding in `src/app/services/[slug]/page.tsx`.
- Admin Dashboard (`src/app/admin/page.tsx`):
  - Removed window globals and any usage; added typed analytics state with interfaces `AnalyticsDailyPoint`, `AnalyticsRevenueByService`, `AdminAnalytics`.
  - Updated charts to use typed React state instead of `(window as any)`; removed all `any` in mapping logic.
- Admin Audits (`src/app/admin/audits/page.tsx`):
  - Strongly typed audit message parsing with `AuditMessage`; removed `any`.
- Admin Users (`src/app/admin/users/page.tsx`):
  - Strongly typed audit parsing with `AuditMessage`; removed `any`.
  - Removed unused `Button` import.

## Recent Hotfixes (TypeScript, ESLint & Client stability)
These changes were made after build failures on Netlify; they address TypeScript errors, ESLint rules, and runtime chunk-loading instability.

- Global chunk-load recovery (auto-reload):
  - File: `src/components/providers/client-layout.tsx`
  - Added a client-side handler for `error` and `unhandledrejection` events that detects chunk load / asset load failures and performs a controlled reload to recover from mismatched server HTML vs static chunks (prevents persistent ChunkLoadError for visitors).
  - Also removed all explicit `any` usage in the handler and used safe narrowing for error/rejection messages to satisfy ESLint rules.

- Health rollup typing fix:
  - File: `src/app/api/admin/system/health/route.ts`
  - Fixed summary computation to only compare for `'healthy'` states and removed invalid comparisons that caused TypeScript TS2367 errors.

- Rate-limit and IP extraction cleanup:
  - File: `src/lib/rate-limit.ts`
  - Removed an unused `@ts-expect-error` directive, replaced usages of `any` with `unknown`/narrowing, and made header checks more robust for proxy headers (x-forwarded-for, x-real-ip, cf-connecting-ip).

- ESLint unused/explicit-any fixes in API routes:
  - File: `src/app/api/admin/perf-metrics/route.ts`
    - Renamed unused `request` param to `_request` to satisfy the rule requiring unused args to start with `_`.
  - File: `src/app/api/admin/stats/bookings/route.ts`
    - Renamed `revenuePrevRange` to `_revenuePrevRange` to silence unused variable warnings.

- General TypeScript and lint grooming across the codebase to remove `any`/unused vars and satisfy the project's ESLint/TS configuration used by the Netlify build.

## File Changes (Key)
- New/updated files related to hotfixes:
  - Updated: `src/components/providers/client-layout.tsx` (chunk-load recovery + lint fixes)
  - Updated: `src/lib/rate-limit.ts` (removed @ts-expect-error, safer typing)
  - Updated: `src/app/api/admin/system/health/route.ts` (health summary typing fix)
  - Updated: `src/app/api/admin/perf-metrics/route.ts` (unused param rename)
  - Updated: `src/app/api/admin/stats/bookings/route.ts` (unused var rename)

- Other previously listed files remain changed from earlier admin work (RBAC, audit, APIs, dashboards).

## Environment Variables
- `NETLIFY_DATABASE_URL`: Postgres connection (Neon recommended). Supports `neon://` and `postgresql://`.
- `NEXTAUTH_URL`, `NEXTAUTH_SECRET`: Required to remove NextAuth warnings and enable secure sessions.
- `SENDGRID_API_KEY`: Enables email service to leave mock mode.
- `CRON_SECRET`: Secures `/api/cron` access.

## Redeploy Checklist (after these fixes)
1. Ensure environment variables (NETLIFY_DATABASE_URL, NEXTAUTH_URL, NEXTAUTH_SECRET) are set in Netlify.
2. Trigger a fresh deploy to ensure server HTML and static chunks match (invalidate CDN cache if possible).
3. If builds continue failing, run locally:
   - npm run db:push -- --accept-data-loss
   - npm run db:seed
   - npm run typecheck
   - npm run build
4. Inspect Netlify logs for specific TS/ESLint errors and add rule exceptions only when necessary.

## Recommended Next Steps
- Add Sentry (via MCP) to capture runtime errors and chunk load issues from end-users for easier diagnosis.
- Consider introducing a publish hook or cache-invalidation step in the deploy pipeline to avoid mismatched chunk versions when rolling out changes.
- Add E2E smoke tests that load key pages after deploy to detect chunk mismatches early.


---

If you want, I can open a PR with these changes (the branch already exists) or run a full local build/typecheck and share the output. Which would you like next?
