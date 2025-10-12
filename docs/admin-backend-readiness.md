# Backend Readiness – Admin Dashboard

Assessed endpoints (grep of src/app/api/**/route.ts) indicate coverage for required aggregates and health checks.

## Aggregates & Stats
- Counts: /api/admin/stats/counts
- Bookings: /api/admin/bookings, /api/admin/bookings/stats, /api/admin/bookings/pending-count
- Clients: /api/admin/stats/clients
- Services: /api/admin/services, /api/admin/services/stats
- Invoices: /api/admin/invoices, /api/admin/invoices/[id]/pay
- Tasks: /api/admin/tasks, /api/admin/tasks/analytics, /api/admin/tasks/templates

## Settings Import/Export
- /api/admin/settings/export, /api/admin/settings/import, plus group-specific export/import endpoints.

## Health & Monitoring
- /api/admin/system/health, /api/security/health, /api/admin/perf-metrics, /api/admin/health-history

## Menu customization (future)
- Registry-driven UI already supports permission gating and badges; DB-backed menu customization not required for MVP. If needed, create a table for per-tenant nav overrides; API scaffold can live under /api/admin/settings/services.

Conclusion: Backend is READY for the planned UI modernization. No blocking gaps identified.
