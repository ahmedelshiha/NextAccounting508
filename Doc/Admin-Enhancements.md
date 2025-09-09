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

## File Changes (Key)
- New: `src/lib/rbac.ts`, `src/lib/audit.ts`, `src/lib/use-permissions.ts`
- New: `src/app/api/admin/users/route.ts`, `src/app/api/admin/users/[id]/route.ts`, `src/app/api/admin/analytics/route.ts`, `src/app/admin/audits/page.tsx`
- Updated: `src/app/admin/page.tsx`, `src/app/admin/users/page.tsx`, `src/app/api/admin/bookings/route.ts`

## Environment Variables
- `NETLIFY_DATABASE_URL`: Postgres connection (Neon recommended). Supports `neon://` and `postgresql://`.
- `NEXTAUTH_URL`, `NEXTAUTH_SECRET`: Required to remove NextAuth warnings and enable secure sessions.
- `SENDGRID_API_KEY`: Enables email service to leave mock mode.
- `CRON_SECRET`: Secures `/api/cron` access.

## Future Enhancements (Recommended)

### Security and Compliance
- Request validation (zod) added for user role updates and tasks APIs.
- Basic in-memory rate limiting added to role updates and tasks APIs. Origin checks TBD.
- Expand auditing to dedicated `AuditLog` model (actor, target, action, IP, UA, metadata). Add retention & export.
- Add 2FA for Admin accounts; optional SSO.

### Admin UI/UX
- Gate actions on all admin pages (Bookings/Posts/Services) per permission; disable buttons with tooltips when unauthorized.
- Add pagination, sort, and filters to Audits; CSV export.
- Replace `window.__adminAnalytics__` with component state/SWR for better hydration.
- Calendar view and staff assignment for bookings; drag-and-drop rescheduling.
- Bulk operations UI for Users (promote/demote), Posts (publish/unpublish), Services (activate/deactivate).

### Analytics & Insights
- Revenue and booking cohorts; customer LTV; funnel from lead to booking; post performance by tag/author.
- Caching (SWR) with background revalidation; add indexes/migrations for queries listed in schema.
- Optional chart library integration for richer visuals (keep bundle small).

### Admin Dashboard (Enhanced)
- Export actions (CSV/PDF) for analytics, users, bookings, services, and audits with server-side generation and client download UI.
- KPI cards backed by real data: monthly revenue, active clients, task completion rate, and system health sourced from stats endpoints and `/api/db-check`.
- Charts: combined revenue vs bookings (bar+line), client growth (bar), and service distribution (donut). Use a lightweight chart lib or dynamic imports to keep bundle small.
- Upcoming tasks widget: integrate with Linear (via MCP) or introduce a `Task` model (title, due date, priority, status, assignee).
- Performance tab: page load time, API response, uptime, and error rate with trend deltas; ingest from Lighthouse reports, Sentry metrics, and Netlify build data.
- System tab: DB/API/external API/security status plus quick actions (DB backup, test email, view logs, open config) gated by RBAC.
- Live updates via polling or Server-Sent Events; SWR cache with background revalidation and optimistic UI for quick actions.
- Full i18n and accessibility for all labels, tooltips, and badges; responsive layouts for mobile.

### Admin APIs to support dashboard
- `GET /api/admin/analytics/service-distribution?range=...` (percent by service).
- `GET /api/admin/activity?type=&limit=...` (recent activity from audits).
- `GET/POST /api/admin/tasks`, `PATCH /api/admin/tasks/[id]` (CRUD for upcoming tasks).
- `GET /api/admin/perf-metrics?range=...` (Lighthouse, Sentry aggregates).
- `GET /api/admin/system/health` (DB/API/external/security rollup).
- `GET /api/admin/export?entity=users|bookings|services|audits&format=csv|pdf` (server-side export).

### Operations & Observability
- Add Sentry for error monitoring (via MCP); performance tracing on critical endpoints.
- Background jobs for reminders and reports (cron) with idempotency tracking.
- Health dashboard card for last N errors and uptime metrics.

### Content & Internationalization
- Admin i18n strings; accessibility audit of all admin pages.
- SEO tools in Posts (slug validation, canonical URLs, meta preview).

### Data & Models
- Precompute `readTime`; add missing Prisma indexes (Booking: status/scheduledAt/createdAt; Post: published/publishedAt; User: role/createdAt).
- Service categories and price tiers; attach media uploads to Posts/Services.

## MCP Integrations (Optional)
- Neon: production Postgres. Connect via Builder MCP.
- Netlify: deploy and env management.
- Sentry: error monitoring.
- Builder CMS: editorial workflows for posts/services.
- Supabase: auth/DB alternative if preferred.

## Rollout Checklist
- Set env vars in the environment (dev and prod).
- Run `prisma generate` and apply migrations if schema changes are introduced.
- Verify RBAC by testing with CLIENT/STAFF/ADMIN accounts.
- Review audit log flow and retention.
- Validate analytics numbers against DB.
