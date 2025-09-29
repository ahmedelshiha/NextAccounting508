# Admin Dashboard Implementation Plan — Dependency-Ordered TODO

Scope: Implement the QuickBooks-inspired professional admin dashboard defined in docs/admin_dashboard_spec.md, aligning with existing code under src/app/admin/** and components/**. Each task is specific, measurable, and outcome-oriented, with verification steps.

## Reorganized, Dependency-Ordered Execution Plan

1) Platform Foundations
- [x] Finalize RBAC permission matrix and enforce on all admin pages
- [x] Implement tenant switcher and verify tenant-scoped data on key routes
- [x] Unify list/table contracts with AdvancedDataTable across modules
- [x] Define realtime event contracts (event names, payloads) and document

2) Data Models & APIs
- [x] Design and migrate Work Orders data model in Prisma; generate CRUD APIs under /api/admin/work-orders
- [x] Standardize pagination/filter/query params across admin APIs; add schema validation
  - Introduced shared parser src/schemas/list-query.ts (zod validation, page/limit/offset, sortBy/sortOrder, q)
  - Refactored /api/admin/work-orders, /api/admin/service-requests, /api/admin/bookings to use shared parser (bookings response shape preserved)

3) Dashboard Overview (depends on 2)
- [x] Implement KPI row (bookings, service-requests, revenue, utilization) using existing endpoints
- [x] Add charts row (Work Order Trends line, Revenue by Service donut); server-fetch + client hydrate
- [x] Add activity row (ActivityFeed, UpcomingTasks, RecentBookings) with SSE refresh
  - Implemented in components/admin/dashboard/AdminOverview.tsx with AnalyticsPage template and realtime refresh via useUnifiedData

4) Financial Module (depends on 2)
- [x] Invoices: data model and admin APIs
  - [x] Prisma: add InvoiceStatus enum; add Invoice and InvoiceItem models
  - [x] API: implement /api/admin/invoices {GET, POST, DELETE} with RBAC (TEAM_VIEW/TEAM_MANAGE)
  - [x] API: implement POST /api/admin/invoices/[id]/pay to mark invoice PAID and set paidAt
  - [x] UI: wire Admin Invoices ListPage to API; render status/amount; add filters (status, date range)
  - [x] Export: add CSV export for invoices at /api/admin/export?entity=invoices
- [x] Link invoice row actions to Payments view with preserved filters (status, range)
- [x] Payments: status/method/date filters with URL sync and CSV export
- [ ] Expenses: ListPage with category/status filters, attachment preview with AV badge, and CSV export

5) Team Management & Permissions (depends on 1)
- [ ] Team page using TeamManagement component; wire workload/skills/availability APIs
- [ ] Roles/Permissions: persist edits and reflect changes without reload; verify hasPermission changes live

6) Settings Hub (depends on 1)
- [ ] Admin Settings shell with sidebar nav (general/company/contact/timezone)
- [ ] Forms use zod; optimistic saves with rollback on error; acceptance: 0 console errors
- [ ] Booking Settings: wire steps, business-hours, payment-methods CRUD endpoints with audit logging

7) Content & Communications (independent)
- [x] Posts: RBAC enforced; page marked 'use client'
- [ ] Posts: adopt ListPage UX and hook into /api/admin/stats/posts for KPIs
- [ ] Integrations: status cards; health badges reflecting /api/admin/system/health; links to docs

8) Analytics & Reports (depends on 2)
- [ ] Adopt AnalyticsPage on relevant routes; unify export flows to /api/admin/export with filter propagation
- [ ] Report scheduling stubs and progress toasts

9) Observability & Security (continuous)
- [ ] Update monitoring/performance-baseline.json; LCP <=2.5s desktop, TTI <=3.5s admin pages
- [ ] Expand audit trail coverage; Sentry error sampling verified in prod

10) Testing & Rollout
- [ ] Unit tests for schemas, permissions, and utilities (vitest)
- [x] Integration tests for key API routes (no threads)
- [ ] E2E happy paths for admin flows (Playwright)
- [ ] Feature-flag rollout plan documented in this file

---

## Priority Backlog (Pending Tasks Ordered)

P0 – Critical
- [ ] Ensure typecheck and prod build green (pnpm typecheck, pnpm vercel:build)
- [x] Finalize RBAC permission matrix and enforce on all admin pages
- [x] Unify list/table contracts with AdvancedDataTable across modules
- [x] Define realtime event contracts (event names, payloads) and document

P1 – High
- [x] Standardize pagination/filter/query params across admin APIs; add schema validation
- [x] Dashboard Overview: implement KPI row, charts row, and activity row with SSE refresh

P2 – Medium
- [x] Invoices: Prisma model, endpoints, UI wiring completed; CSV export added
- [ ] Link invoice row actions to payments view with preserved filters
- [ ] Expenses: ListPage, category filters, attachment preview; AV status badge; CSV export
- [ ] Team: TeamManagement with workload/skills/availability APIs; role edits reflect without reload
- [ ] Posts: adopt ListPage and hook into /api/admin/stats/posts for KPIs
- [ ] Integrations: status cards; health badges reflecting /api/admin/system/health; links to docs
- [ ] Observability: update monitoring/performance-baseline.json to targets; expand audit trail; verify Sentry sampling
- [ ] Testing & Rollout: unit, integration, E2E; feature-flag rollout plan

---

## ✅ Phase 2 Progress — 2025-10-01
- Completed: Financial Module — Invoice models and admin APIs
  - Why: New implementation to unblock end-to-end invoicing and satisfy dependency (2) Data Models & APIs; enables test flows to create/pay/delete invoices
  - What: Added Prisma models (Invoice, InvoiceItem, InvoiceStatus); created /api/admin/invoices (GET/POST/DELETE) and /api/admin/invoices/[id]/pay with audit logging and RBAC
- Completed: Invoices UI, exports, and linking
  - Why: Provide end-to-end admin workflows for billing and reports
  - What: Wired Admin Invoices page to API with status/date filters and server pagination; added CSV export at /api/admin/export?entity=invoices; linked row actions to Payments with preserved filters; added integration tests for invoices API and export
  - Next: Monitor usage; extend invoice analytics if needed
- Completed: Work Orders data model and CRUD APIs
  - Why: New module required by spec to manage operational work execution separate from tasks/bookings
  - What: Added WorkOrder model and WorkOrderStatus enum to Prisma; implemented /api/admin/work-orders (list/create) and /api/admin/work-orders/[id] (get/update/delete)
  - Details:
    - Multi-tenant: tenantId support and forwarding via middleware + tenantFilter
    - RBAC: GET requires TASKS_READ_ALL or TASKS_READ_ASSIGNED; POST requires TASKS_CREATE; PUT requires TASKS_UPDATE; DELETE requires TASKS_DELETE
    - Validation: zod schemas for query params and payloads; pagination (page/limit), sorting (createdAt/updatedAt/dueAt/priority/status), search (q), filters (status, priority, assigneeId, clientId, serviceId), date ranges (createdFrom/To, dueFrom/To)
    - Responses: Consistent { data, pagination } for list; { workOrder } for create/read/update; { success } for delete
  - Next: Wire admin UI list using ListPage and adopt standardized filters; add analytics endpoint for trends

- In Progress: Standardize pagination/filter/query params across admin APIs
  - Why: Ensure consistent UX and API contracts across modules
  - Plan: Gradually adopt ListQuerySchema pattern (page, limit, sortBy, sortOrder, q, status/priority, date ranges) and zod validation across existing admin APIs

---

### Completed: Prisma schema fixes for WorkOrder relations and Invoice back-relations
- Why: Resolve Prisma P1012 errors (ambiguous relations and missing opposite fields) blocking build
- What: Named WorkOrder->User relations (client: "WorkOrderClient", assignee: "WorkOrderAssignee"); added back-relations on User, Service, ServiceRequest, and Booking (workOrders/workOrdersAsClient/assignedWorkOrders); added missing inverse relations for Invoice on User (invoices) and Booking (invoices) to resolve Prisma P1012
- Status: Ready for prisma generate and deployment

## Next Steps
- [ ] Run prisma generate and database migration; deploy to preview environment
- [ ] Build Work Orders list UI using components/dashboard/templates/ListPage
- [ ] Add /api/admin/work-orders/analytics for trends and KPIs
- [ ] Extend audit logging for create/update/delete actions
- [ ] Expenses: implement ListPage with filters, AV badge preview, CSV export
