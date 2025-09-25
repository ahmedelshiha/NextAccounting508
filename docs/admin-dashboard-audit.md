# Admin Dashboard Audit

## Overview

The Admin Dashboard is the control center for managing clients, bookings, services, finances, team, and system settings. It integrates multiple modules into a unified UI, backed by Prisma + PostgreSQL, secured with NextAuth, and deployed via Netlify/Vercel.

## High-Level Features

- Client management (profiles, invitations, onboarding)
- Bookings & service requests
- Service catalog & availability
- Financials (invoices, payments, expenses)
- Task & reminder tracking
- Analytics & reports
- Team management (roles, permissions, audit logs)
- System settings, integrations, and uploads

## Generated file tree

Note: This tree is generated from the repository and shows main admin-related files and libs.

src/app/admin/
- layout.tsx
- page.tsx
- analytics/page.tsx
- audits/page.tsx
- availability/page.tsx
- bookings/page.tsx
- bookings/[id]/page.tsx
- bookings/new/page.tsx
- calendar/page.tsx
- chat/page.tsx
- cron-telemetry/page.tsx
- expenses/page.tsx
- integrations/page.tsx
- invoices/page.tsx
- newsletter/page.tsx
- notifications/page.tsx
- payments/page.tsx
- perf-metrics/page.tsx
- permissions/page.tsx
- posts/page.tsx
- reminders/page.tsx
- reports/page.tsx
- roles/page.tsx
- service-requests/page.tsx
- service-requests/ClientPage.tsx
- service-requests/[id]/page.tsx
- service-requests/[id]/edit/page.tsx
- service-requests/list/page.tsx
- service-requests/new/page.tsx
- services/page.tsx
- services/list/page.tsx
- settings/page.tsx
- settings/booking/page.tsx
- settings/currencies/page.tsx
- tasks/page.tsx
- tasks/list/page.tsx
- tasks/new/page.tsx
- tasks/providers/TaskProvider.tsx
- tasks/schemas/task.ts
- tasks/hooks/* (multiple hooks and tests)
- uploads/quarantine/page.tsx
- uploads/quarantine/QuarantineClient.tsx
- users/page.tsx
- users/list/page.tsx

src/app/api/admin/
- activity/route.ts
- analytics/route.ts
- availability-slots/route.ts
- booking-settings/** (business-hours, export, import, payment-methods, reset, steps, validate)
- bookings/route.ts
- bookings/[id]/migrate/route.ts
- chat/route.ts
- currencies/** (route.ts, [code]/route.ts, export, overrides, refresh)
- export/route.ts
- health-history/route.ts
- perf-metrics/route.ts
- permissions/** ([userId]/route.ts, roles/route.ts, route.ts)
- realtime/route.ts
- service-requests/** (route.ts, [id]/route.ts, analytics, availability, bulk, export, recurring/preview, [id]/assign/comments/confirm/reschedule/status/tasks)
- services/** (route.ts, [id]/route.ts, [id]/clone/settings/versions, bulk, export, stats, slug-check)
- stats/bookings, posts, users
- system/health/route.ts
- tasks/** (route.ts, [id]/route.ts, analytics, bulk, export, notifications, stream, templates)
- team-management/** (assignments, availability, skills, workload)
- team-members/[id]/route.ts
- uploads/quarantine/route.ts
- users/[id]/route.ts

src/components/admin/
- AvailabilitySlotsManager.tsx
- BookingSettingsPanel.tsx
- RunRemindersButton.tsx
- currency-manager.tsx
- team-management.tsx
- chat/AdminChatConsole.tsx
- permissions/RolePermissionsViewer.tsx
- permissions/UserPermissionsInspector.tsx
- posts/PostCard.tsx
- posts/PostStats.tsx
- posts/types.ts
- providers/AdminContext.tsx
- providers/AdminProviders.tsx
- service-requests/* (booking-type-distribution, bulk-actions, calendar-view, filters, overview, request-status-distribution, table, team-workload-chart)
- services/* (BulkActionsPanel, ConversionsTable, RevenueTimeSeriesChart, ServiceCard, ServiceForm, ServicesAnalytics, ServicesFilters, ServicesHeader)

src/lib/
- api.ts, api-response.ts, api-error.ts
- auth.ts
- audit.ts
- cache.service.ts
- chat.ts
- clamav.ts
- cron.ts
- csv-export.ts
- decimal-utils.ts
- dev-fallbacks.ts
- email.ts
- exchange.ts
- i18n.ts
- idempotency.ts
- logger.ts
- notification.service.ts
- observability*.ts
- offline-queue.ts
- permissions.ts
- prisma.ts
- rate-limit.ts
- rbac.ts
- realtime*.ts
- tenant.ts
- toast-api.ts
- uploads-provider.ts
- use-permissions.ts
- utils.ts
- validation.ts
- booking/* (availability, conflict-detection, pricing, recurring)
- payments/stripe.ts
- tasks/* (adapters, types, utils)

## Feature & Component Architecture

Mapped routes and responsibilities (examples):
- /admin → Overview/dashboard home
- /admin/analytics → Metrics and charts
- /admin/reports → Exports and reporting
- /admin/clients/* → Profiles, invitations, creation
- /admin/bookings → Calendar, booking management
- /admin/service-requests → Workflow-based requests
- /admin/services/* → Service catalog and availability
- /admin/invoices, /payments, /expenses → Finance
- /admin/tasks, /reminders → Productivity tools
- /admin/team, /roles, /permissions → Access control
- /admin/settings/* → System configuration
- /admin/integrations → External services (Sentry, Redis, Neon)
- /admin/uploads/quarantine → File management

Each UI component maps to hooks/context → API route → Prisma model.

## Data Flow Architecture

UI Components → Custom Hooks (state, SWR, context) → API Routes (/api/admin/...) → Prisma ORM → PostgreSQL

State management uses context providers (TaskProvider, BookingProvider). Validation leverages Zod schemas. Real-time updates use Redis/WebSockets.

## Custom Hooks (examples)

- useTasks: fetches tasks, optimistic updates, inputs: filters/page; outputs: tasks, meta, actions
- useBookings: manages booking list, single booking fetch, pagination, inputs: query params; outputs: bookings, total, mutate
- usePermissions: evaluates role-based access using src/lib/permissions

(Refer to src/app/admin/tasks/hooks/ and src/lib/ for implementation details.)

## API Architecture

- /api/admin/tasks → CRUD
- /api/admin/bookings → GET/POST/PATCH/DELETE (see bookings/route.ts)
- /api/admin/service-requests → Multi-step workflow
- /api/admin/invoices → Finance endpoints

Validation: Zod + Prisma types. Prefer consistent response shapes via src/lib/api-response.ts

## Integration Points & Environment Variables

Key env vars:
- DATABASE_URL / NETLIFY_DATABASE_URL (Prisma)
- NEXTAUTH_SECRET, NEXTAUTH_URL
- SENTRY_DSN
- UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN
- STRIPE keys (if payments enabled)

MCP integrations to consider: Neon, Netlify, Zapier, Figma, Supabase, Builder.io, Linear, Notion, Sentry, Context7, Semgrep, Prisma Postgres.
To connect MCPs open: [Open MCP popover](#open-mcp-popover)

## Security Audit

✅ Role-based access enforced in useTaskPermissions and src/lib/permissions.
⚠️ Verify every /api/admin/** route checks session.user.role (spot-check recommended).
⚠️ Ensure sensitive endpoints are not accessible from /api/portal/**.

## Performance Audit

⚠️ Review Prisma queries for N+1 issues on list endpoints (bookings, services, clients).
✅ Pagination implemented in clients/bookings APIs.
⚠️ For large exports use streaming or background jobs.
✅ Redis caching available (src/lib/cache/redis.ts) — ensure hooks use cache for hot endpoints.

## Testing Coverage

- Unit tests present for Tasks and Bookings (see tests under src/app/admin/tasks/tests/)
- Integration tests: missing for Finance flows (invoices/payments)
- E2E tests: recommended for booking → invoice → payment flow

## Data Consistency & Migration Readiness

- Prisma migrations present. Validate FK constraints between Client, Booking, Invoice.
- Seed strategy: clarify staging vs production seeds and secrets.

## Cleanup & Recommendations

- ⚠️ Placeholder components: review /admin/calendar and other TODOs.
- ⚠️ Duplicate or stub API routes: review service-requests duplicates.
- ✅ Consolidate shared libs under src/lib/ and centralize common types and utils.

## Output

This audit saved to: docs/admin-dashboard-audit.md


---
Generated on: (repository scan)
