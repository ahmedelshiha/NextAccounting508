# Admin Dashboard Audit

## Overview

Purpose: Provide internal operations, content, scheduling, and configuration interfaces for admins and staff. It consolidates analytics, client management, bookings, services, tasks, uploads quarantine, permissions/roles, and settings.

Modules and primary roles:
- Analytics/Reports: Performance, usage stats, exports.
- Clients: Profiles, invitations, onboarding (new client flow).
- Bookings/Availability/Calendar: Scheduling, migration utilities, and slot management.
- Service Requests: Intake, workflows (assign, status, comments, tasks), analytics, exports.
- Services: CRUD, bulk ops, CSV export, featured management.
- Tasks: Full task workspace (board/list/table/gantt/calendar), comments, notifications, templates.
- Content: Posts management views (leveraging /api/posts).
- Finance: Invoices, Payments, Expenses (UI present; APIs primarily top-level payments Stripe endpoints).
- Team: Members, workload, skills, availability.
- Security: Permissions, Roles, Users.
- Settings: Booking settings (steps, business hours, payment methods), currencies (rates/overrides/export), integrations.
- Operations: Reminders run, Updates (SSE), Activity/Audit, Perf-metrics, Uploads quarantine.

Key dependencies observed (package.json and code references):
- Prisma ORM (@prisma/client, prisma) with Postgres (pg) and Neon-compatible usage (@netlify/neon); ioredis for caching; zod for validation
- Auth: next-auth with @next-auth/prisma-adapter
- Monitoring: @sentry/nextjs
- Payments: stripe
- Email: @sendgrid/mail
- Realtime/streams: Server-Sent Events (SSE) routes
- UI: Next.js App Router, React 19, SWR, Radix, Tailwind

## Complete Directory Structure

Tree of all files/folders under src/app/admin/

```
src/app/admin/
  layout.tsx
  page.tsx
  analytics/page.tsx
  audits/page.tsx
  availability/page.tsx
  bookings/page.tsx
  calendar/page.tsx
  chat/page.tsx
  cron-telemetry/page.tsx
  expenses/page.tsx
  integrations/page.tsx
  invoices/page.tsx
  newsletter/page.tsx
  notifications/page.tsx
  payments/page.tsx
  perf-metrics/page.tsx
  permissions/page.tsx
  posts/page.tsx
  reminders/page.tsx
  reports/page.tsx
  roles/page.tsx
  services/page.tsx
  settings/page.tsx
  tasks/page.tsx
  taxes/page.tsx
  team/page.tsx
  users/page.tsx
  bookings/
    [id]/page.tsx
    new/page.tsx
  clients/
    invitations/page.tsx
    new/page.tsx
    profiles/page.tsx
  previews/
    analytics/page.tsx
    list/page.tsx
    standard/page.tsx
  service-requests/
    ClientPage.tsx
    page.tsx
    [id]/page.tsx
    [id]/edit/page.tsx
    list/page.tsx
    new/page.tsx
  services/
    list/page.tsx
  settings/
    booking/page.tsx
    currencies/page.tsx
  uploads/
    quarantine/
      QuarantineClient.tsx
      page.tsx
  users/
    list/page.tsx
  tasks/
    TODO+log.md
    data/
      notifications.json
      templates.json
      comments/
        1.json
    hooks/
      useTaskActions.ts
      useTaskAnalytics.ts
      useTaskBulkActions.ts
      useTaskFilters.ts
      useTaskPermissions.tsx
    list/page.tsx
    new/
      TODO+log.md
      page.tsx
    providers/
      TaskProvider.tsx
    schemas/
      task.ts
    tests/
      GanttView.test.tsx
      TaskCard.test.tsx
      TaskForm.test.tsx
      TaskListView.test.tsx
      TaskUtils.test.ts
      TasksToolbar.test.tsx
      adapters.test.ts
      api.bulk.route.test.ts
      api.comments.route.test.ts
      api.export.route.test.ts
      api.notifications.route.test.ts
      api.tasks.route.test.ts
      api.templates.route.test.ts
      hooks.useTaskPermissions.test.tsx
      providers.TaskProvider.test.tsx
      test-setup.ts
    components/
      analytics/
        AdvancedAnalytics.tsx
        TaskAnalytics.tsx
      bulk/BulkActionsPanel.tsx
      cards/
        TaskCard.tsx
        TaskCardActions.tsx
        TaskCardContent.tsx
        TaskCardFooter.tsx
        TaskCardHeader.tsx
        TaskCardSkeleton.tsx
        index.ts
      comments/CommentsPanel.tsx
      export/ExportPanel.tsx
      filters/TaskFiltersPanel.tsx
      forms/TaskForm.tsx
      layout/
        TasksHeader.tsx
        TasksStats.tsx
        TasksToolbar.tsx
        index.ts
      modals/
        TaskDeleteModal.tsx
        TaskDetailsModal.tsx
        TaskEditModal.tsx
      providers/
        FilterProvider.tsx
        NotificationProvider.tsx
        ViewProvider.tsx
        index.ts
      views/
        TaskBoardView.tsx
        TaskCalendarView.tsx
        TaskGanttView.tsx
        TaskListView.tsx
        TaskTableView.tsx
        index.ts
      widgets/
        TaskAssignee.tsx
        TaskCategory.tsx
        TaskDependencies.tsx
        TaskDueDate.tsx
        TaskMetrics.tsx
        TaskPriority.tsx
        TaskProgress.tsx
        TaskReminders.tsx
        TaskStatus.tsx
        TaskTags.tsx
        TaskWatchers.tsx
        index.ts
```

Tree of all files/folders under src/app/api/admin/

```
src/app/api/admin/
  activity/route.ts
  analytics/route.ts
  availability-slots/route.ts
  booking-settings/
    route.ts
    business-hours/route.ts
    export/route.ts
    import/route.ts
    payment-methods/route.ts
    reset/route.ts
    steps/route.ts
    validate/route.ts
  bookings/
    route.ts
    [id]/migrate/route.ts
  chat/route.ts
  currencies/
    route.ts
    [code]/route.ts
    export/route.ts
    overrides/route.ts
    refresh/route.ts
  export/route.ts
  health-history/route.ts
  perf-metrics/route.ts
  permissions/
    route.ts
    [userId]/route.ts
    roles/route.ts
  realtime/route.ts
  reminders/run/route.ts
  service-requests/
    route.ts
    analytics/route.ts
    availability/route.ts
    bulk/route.ts
    export/route.ts
    recurring/preview/route.ts
    [id]/route.ts
    [id]/assign/route.ts
    [id]/comments/route.ts
    [id]/confirm/route.ts
    [id]/reschedule/route.ts
    [id]/status/route.ts
    [id]/tasks/route.ts
  services/
    route.ts
    [id]/route.ts
    [id]/clone/route.ts
    [id]/settings/route.ts
    [id]/versions/route.ts
    bulk/route.ts
    export/route.ts
    slug-check/[slug]/route.ts
    stats/route.ts
  stats/
    bookings/route.ts
    posts/route.ts
    users/route.ts
  system/health/route.ts
  tasks/
    route.ts
    [id]/route.ts
    [id]/assign/route.ts
    [id]/comments/route.ts
    [id]/status/route.ts
    analytics/route.ts
    bulk/route.ts
    export/route.ts
    notifications/route.ts
    stream/route.ts
    templates/
      route.ts
      categories/route.ts
  team-management/
    assignments/route.ts
    availability/route.ts
    skills/route.ts
    workload/route.ts
  team-members/
    route.ts
    [id]/route.ts
  thresholds/route.ts
  updates/route.ts
  users/
    route.ts
    [id]/route.ts
  uploads/quarantine/route.ts
  auth/logout/route.ts
```

Flags
- ⚠️ Placeholders/demos: `src/app/admin/previews/*`.
- ⚠️ Temporary logs/docs: `src/app/admin/tasks/TODO+log.md`, `src/app/admin/tasks/new/TODO+log.md`.
- ✅ Reusable/shared: `src/components/dashboard/templates/*`, `src/lib/api.ts`, `src/lib/permissions`, `src/services/services.service.ts`, task components under `src/app/admin/tasks/components/*`.

## Feature-by-Feature Audit

For each route: purpose, UI, APIs, data source, hooks/state, integrations, status.

### /admin (overview)
- Purpose: Overview dashboard with key KPIs and lists.
- UI: src/app/admin/page.tsx; dashboard components under src/components/dashboard/*.
- APIs: /api/admin/stats/*, /api/admin/activity, /api/admin/updates (SSE).
- Data Source: Prisma-backed via stats services.
- State/Hooks: SWR/apiFetch; local state.
- Integrations: Sentry, auth, optional Redis cache.
- Status: ✅

### /admin/analytics
- UI: src/app/admin/analytics/page.tsx.
- APIs: /api/admin/analytics, /api/admin/stats/*.
- Data: Prisma.
- Hooks: SWR/apiFetch.
- Status: ✅

### /admin/reports
- UI: src/app/admin/reports/page.tsx.
- APIs: /api/admin/export, feature exports per domain.
- Data: Prisma; CSV generation endpoints.
- Status: ✅

### /admin/clients/profiles
- UI: src/app/admin/clients/profiles/page.tsx.
- APIs: /api/admin/users, /api/admin/users/[id].
- Data: Prisma User.
- Status: ✅

### /admin/clients/invitations
- UI: src/app/admin/clients/invitations/page.tsx.
- APIs: uses auth/register flow and email verification endpoints.
- Data: Prisma User.
- Status: ✅

### /admin/clients/new
- UI: src/app/admin/clients/new/page.tsx.
- APIs: /api/auth/register, /api/users/check-email, services fetch.
- Data: Prisma (User, Service).
- Hooks: validation, debounced email checks.
- Status: ✅

### /admin/bookings
- UI: src/app/admin/bookings/page.tsx, new/[id] pages.
- APIs: /api/admin/bookings, /api/admin/bookings/[id]/migrate.
- Data: Prisma Booking; recurring logic in lib.
- Status: ✅

### /admin/calendar (redirect)
- UI: src/app/admin/calendar/page.tsx redirects to /admin.
- APIs: —
- Status: ✅

### /admin/service-requests, /admin/service-requests/list, /admin/service-requests/[id]
- UI: pages under src/app/admin/service-requests/*; ClientPage.tsx.
- APIs: /api/admin/service-requests/* (list, analytics, availability, bulk, export, recurring/preview, id subroutes: assign, status, comments, tasks, confirm, reschedule, delete).
- Data: Prisma ServiceRequest models.
- Hooks: SWR/apiFetch streams; SSE where applicable.
- Status: ✅

### /admin/services, /admin/services/list
- UI: src/app/admin/services/page.tsx, list/page.tsx (uses SWR to /api/admin/services, export, bulk).
- APIs: /api/admin/services/*; service layer with validation, ETag, rate-limits, audit logs.
- Data: Prisma Service, tenant-scoped.
- Status: ✅

### /admin/availability
- UI: src/app/admin/availability/page.tsx; AvailabilitySlotsManager.
- APIs: /api/admin/availability-slots (GET/POST/PUT/DELETE).
- Data: Prisma AvailabilitySlot.
- Status: ✅

### /admin/invoices
- UI: src/app/admin/invoices/page.tsx.
- APIs: invoice endpoints not under admin; finance domain WIP via Stripe/webhooks.
- Data: Stripe + DB planned.
- Status: ⚠️

### /admin/payments
- UI: src/app/admin/payments/page.tsx.
- APIs: top-level /api/payments/* (checkout, webhook, COD); no admin-specific routes.
- Data: Stripe.
- Status: ⚠️

### /admin/expenses
- UI: src/app/admin/expenses/page.tsx.
- APIs: none explicit in admin; domain likely WIP.
- Data: Planned Prisma model.
- Status: ⚠️

### /admin/tasks
- UI: workspace at src/app/admin/tasks/page.tsx (+ list/new subroutes); rich components under tasks/components/*.
- APIs: /api/admin/tasks/* (list, CRUD, comments, assign, status, bulk, export, analytics, notifications, templates, stream SSE).
- Data: Prisma Task.
- Hooks: useTaskActions, useTaskBulkActions, useTaskFilters, useTaskPermissions, useTaskAnalytics; SWR/apiFetch.
- Status: ✅

### /admin/reminders
- UI: src/app/admin/reminders/page.tsx.
- APIs: /api/admin/reminders/run (trigger); cron routes exist at /api/cron/reminders.
- Data: Prisma + scheduler.
- Status: ✅

### /admin/audits
- UI: src/app/admin/audits/page.tsx.
- APIs: /api/admin/activity (GET with filters).
- Data: Prisma Audit/Activity entries.
- Status: ✅

### /admin/posts
- UI: src/app/admin/posts/page.tsx.
- APIs: /api/posts (GET/POST) with auth gating for admin/staff.
- Data: Prisma Post + author relation.
- Status: ✅

### /admin/newsletter
- UI: src/app/admin/newsletter/page.tsx.
- APIs: /api/newsletter (top-level) for campaign management.
- Data: Prisma + email provider.
- Status: ✅

### /admin/team
- UI: src/app/admin/team/page.tsx.
- APIs: /api/admin/team-members (GET/POST/PUT/DELETE), team-management/* (skills, availability, workload, assignments).
- Data: Prisma TeamMember + workload.
- Status: ✅

### /admin/permissions, /admin/roles
- UI: src/app/admin/permissions/page.tsx, roles/page.tsx; components in components/admin/permissions/*.
- APIs: /api/admin/permissions, /api/admin/permissions/roles, /api/admin/permissions/[userId].
- Data: Prisma or policy store; checks via lib/permissions.
- Status: ✅

### /admin/settings, /admin/settings/booking, /admin/settings/currencies
- UI: pages in src/app/admin/settings/*.
- APIs: /api/admin/booking-settings/* (GET/PUT/validate/export/import/reset/steps/business-hours/payment-methods); /api/admin/currencies/* (list/PATCH/export/refresh/overrides).
- Data: Prisma + external exchange service.
- Status: ✅

### /admin/integrations
- UI: src/app/admin/integrations/page.tsx.
- APIs: configuration via env and provider SDKs.
- Status: ⚠️ (UI only; depends on connected providers)

### /admin/uploads/quarantine
- UI: src/app/admin/uploads/quarantine/page.tsx + QuarantineClient.tsx.
- APIs: /api/admin/uploads/quarantine (GET/POST).
- Data: Prisma/File store + ClamAV microservice integration.
- Status: ✅

## Component & Data Flow Architecture
- Data flows: DB (Prisma/Postgres) ↔ API routes (App Router handlers) ↔ UI pages/components via apiFetch/SWR. Tenant scoping through lib/tenant; permissions via lib/permissions and NextAuth session.
- SSE used for live updates (tasks stream, updates).
- Import layering: features use service layer objects (e.g., ServicesService), zod schemas, and audit logging (logAudit). No circular imports observed in sampled modules.
- Temporary stubs: previews pages and finance domain UIs pending deeper APIs.

## Custom Hooks
- src/app/admin/tasks/hooks/*
  - useTaskActions: mutations for CRUD/assign/status.
  - useTaskAnalytics: aggregates and charts.
  - useTaskBulkActions: bulk selection and ops.
  - useTaskFilters: filter state and predicates.
  - useTaskPermissions: role/permission checks and UI guards.
- Additional app-wide hooks: SWR usage, local page states, debounced inputs (useDebounce in src/hooks/useDebounce.ts).

## API Architecture (admin)
- Common patterns: NextResponse with JSON; method handlers per file; Zod validation for inputs; NextAuth session + role/permission gates; audit logging; rate limiting and ETag where relevant; Sentry capture on errors.
- Selected endpoints and methods:
  - /api/admin/activity: GET
  - /api/admin/analytics: GET
  - /api/admin/availability-slots: GET, POST, PUT, DELETE
  - /api/admin/booking-settings: GET, PUT (+ business-hours PUT, steps PUT, payment-methods PUT, reset POST, validate POST, export GET, import POST)
  - /api/admin/bookings: GET, POST, PATCH, DELETE; /api/admin/bookings/[id]/migrate: POST
  - /api/admin/chat: GET, POST
  - /api/admin/currencies: GET, POST (+ [code] PATCH, export GET, overrides GET/POST, refresh POST)
  - /api/admin/perf-metrics: GET, POST
  - /api/admin/permissions: GET (+ [userId] route PATCH, roles route GET)
  - /api/admin/realtime: GET (SSE)
  - /api/admin/reminders/run: POST
  - /api/admin/service-requests: GET, POST (+ analytics GET, availability GET, bulk POST, export GET, recurring/preview POST, [id] GET/PATCH/DELETE, assign POST, status PATCH, tasks GET/POST, comments GET/POST, confirm POST, reschedule POST)
  - /api/admin/services: GET, HEAD, POST (+ [id] GET/PATCH/DELETE, clone POST, settings PATCH, versions GET, bulk POST, export GET, stats GET, slug-check/[slug] GET)
  - /api/admin/stats/*: GET
  - /api/admin/system/health: GET
  - /api/admin/tasks: GET, POST (+ [id] GET/PATCH/DELETE, assign POST, status PATCH, comments GET/POST, bulk POST, export GET, analytics GET, notifications GET/PATCH, stream GET, templates GET/POST/PATCH, templates/categories GET)
  - /api/admin/team-members: GET, POST (+ [id] GET/PUT/DELETE)
  - /api/admin/team-management/*: GET (+ skills PATCH)
  - /api/admin/thresholds: GET, POST
  - /api/admin/updates: GET (SSE)
  - /api/admin/users: GET (+ [id] PATCH)
  - /api/admin/uploads/quarantine: GET, POST
  - /api/admin/auth/logout: POST

## Database Integration
- Prisma models confirmed: User, Post, Service, Booking, Currency, Task (and others in schema). Migrations present (prisma/migrations/20250920_phase1_booking_fields/).
- Admin features generally use Prisma via service layer (e.g., ServicesService) and tenant-aware filters (lib/tenant). Posts admin UI uses /api/posts which is Prisma-backed.
- Mock/sample data: public /api/services (non-admin) provides fallback when NETLIFY_DATABASE_URL is absent; admin services use /api/admin/services and are DB-backed. Previews under admin use demo data in UI.
- Ensure `prisma generate` and migrations are applied in deployed environments.

## Integration Points
- AuthZ: NextAuth sessions, role/permission checks via lib/permissions; route-level guards across admin APIs.
- Payments: Stripe (checkout, webhook) at top-level APIs; admin UIs pending deeper finance APIs.
- File uploads & AV: uploads/quarantine admin routes, ClamAV microservice (clamav-service) integration.
- Notifications: email via SendGrid (package present), in-app via tasks/notifications; SSE streams.
- Monitoring: @sentry/nextjs initialized; perf metrics client reports to /api/admin/perf-metrics.

## Cleanup & Recommendations
- Remove or gate preview/demo routes under `src/app/admin/previews/*` in production. ⚠️
- Convert temporary docs `TODO+log.md` to issues or remove from build artifacts. ⚠️
- Finance domain (invoices/payments/expenses) lacks dedicated admin APIs; add admin-scoped endpoints and connect UI. ⚠️
- Ensure all admin pages use admin-scoped APIs (avoid public fallbacks) for consistency.
- Add global error boundary in admin layout and Sentry React error handler (Sentry warns about missing global-error page).
- Standardize ETag and rate-limit usage across list endpoints for performance.
- Add end-to-end tests covering CRUD for services, tasks, and service-requests; extend existing vitest to e2e where feasible.
- Document tenant scoping behavior per feature and enforce in queries for safety.

## Status Snapshot Summary
- ✅ Fully connected: analytics, reports, clients, bookings, availability, service-requests, services, tasks, reminders, audits, posts, team, permissions/roles, settings, uploads/quarantine.
- ⚠️ Partially connected/WIP: integrations (provider config), invoices, payments, expenses, previews.
- ❌ None detected.
