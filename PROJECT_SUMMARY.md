

## Admin Migration Inventory — 2025-09-24

Priorities reflect dependency order and traffic; owners indicate primary responsibility by discipline.

- P0 (completed)
  - /admin (overview) — Owner: Frontend
  - /admin/analytics — Owner: Frontend
  - /admin/reports — Owner: Frontend
- P1 (completed)
  - /admin/bookings — Owner: Frontend
  - /admin/service-requests — Owner: Frontend
  - /admin/services — Owner: Frontend
  - /admin/services/list — Owner: Frontend
- P2 (in progress/planned)
  - /admin/tasks — Owner: Frontend
  - /admin/clients/profiles — Owner: Frontend
  - /admin/clients/invitations — Owner: Frontend
  - /admin/clients/new — Owner: Frontend
- P3 (planned)
  - /admin/settings — Owner: Frontend
  - /admin/settings/booking — Owner: Frontend
  - /admin/settings/currencies — Owner: Frontend
  - /admin/team — Owner: Frontend
  - /admin/permissions — Owner: Frontend
  - /admin/roles — Owner: Frontend
  - /admin/availability — Owner: Frontend
  - /admin/calendar — Owner: Frontend
  - /admin/invoices — Owner: Frontend
  - /admin/payments — Owner: Frontend
  - /admin/expenses — Owner: Frontend
  - /admin/posts — Owner: Frontend
  - /admin/newsletter — Owner: Frontend
  - /admin/integrations — Owner: Frontend
  - /admin/uploads/quarantine — Owner: Frontend

Acceptance criteria (applies per route upon migration):
- Uses StandardPage, ListPage, or AnalyticsPage templates; explicit imports; no inline/lazy hacks
- Preserves existing styling tokens and visuals; accessible (landmarks, aria-current, keyboard-only)
- Supports sorting, filtering, pagination, export where applicable; unified parameter conventions
- Zero console errors; SSR-safe; tests and smoke paths green
- Observability: errors captured in Sentry; relevant metrics available in /admin/perf-metrics
