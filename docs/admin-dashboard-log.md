# Admin Dashboard – Work Log

## 2025-09-26 – Portal schemas, CSV streaming, tests, docs sync
- Exported portal Zod schemas/types (src/schemas/portal/service-requests.ts) for client consumption; aligned with server validators.
- Added CSV streaming helpers (src/lib/csv-export.ts) and introduced streaming mode to /api/portal/service-requests/export (enable with ?stream=1) to avoid UI stalls on large exports.
- Added unit tests for portal schemas and an integration test asserting SSE route returns text/event-stream.
- Synced docs/admin-dashboard-todo.md statuses for wiring, columns, batch actions, perf items, docs & handoff, tenant-guard tests, portal negative tests, validator tests, API schemas, and CSV streaming.
- Next: portal SSE test coverage for health log entry, offline chat enqueue/flush integration, a11y/i18n sweep in portal UI, CI run for full suite and Playwright E2E.
