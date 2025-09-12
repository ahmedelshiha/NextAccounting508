# Task Management — Enhancements & Status

This document summarizes the Task Management work, files changed/added, implemented enhancements, and remaining work with recommended next steps.

## Overview
The admin task management UI (`src/app/admin/tasks/page.tsx`) was enhanced to match the project README and add production-ready features:
- Debounced server-side search
- Virtualized list rendering for large result sets
- Real-time task updates via Server-Sent Events (SSE)
- Bulk selection and batch operations (status updates, delete, CSV export)
- Board (kanban) style view with drag/drop move support
- Task edit/delete dialog (full edit flow wired to API)
- API search support (`q` query), DELETE endpoint, and SSE updates endpoint
- Observability & security: Sentry integration and Semgrep SAST
- Test coverage: API tests for tasks endpoints and a TagFilter component test

All new UI pieces were added as separate, small components under `src/app/admin/tasks/`.

---

## Files added
- `src/app/admin/tasks/virtualized-task-list.tsx` — simple virtualized grid list component
- `src/app/admin/tasks/board-view.tsx` — lightweight board (kanban) view with drag/drop
- `src/app/admin/tasks/task-edit-dialog.tsx` — edit dialog for task details, save & delete
- `src/app/admin/tasks/assignee-selector.tsx` — assignee selector (fetches team members)
- `src/app/admin/tasks/export-button.tsx` — client export trigger (downloads CSV)
- `src/app/admin/tasks/pagination-controls.tsx` — simple load-more control
- `src/app/admin/tasks/dependency-manager.tsx` — dependency management UI used in the edit dialog
- `src/app/api/admin/tasks/updates/route.ts` — SSE endpoint for real-time snapshots
- `src/app/api/admin/tasks/export/route.ts` — server export endpoint (CSV/JSON)
- `src/app/api/admin/tasks/reorder/route.ts` — endpoint to persist kanban reorder (boardStatus + position)
- `sentry.client.config.ts` — Sentry Next.js client initialization
- `sentry.server.config.ts` — Sentry Next.js server initialization
- `sentry.edge.config.ts` — Sentry Next.js edge runtime initialization
- `.semgrep.yml` — Semgrep rules for local scanning
- `tests/api.tasks.get.test.ts` — API tests for `GET /api/admin/tasks`
- `tests/api.tasks.export.test.ts` — API tests for `GET /api/admin/tasks/export`
- `tests/tag-filter.test.tsx` — component test for `TagFilter`

## Files modified (key)
- `src/app/admin/tasks/page.tsx` — main UI wired to the new components and APIs
- `src/app/api/admin/tasks/route.ts` — added `q` parameter server-side search and pagination
- `src/app/api/admin/tasks/[id]/route.ts` — added DELETE handler
- `src/app/api/admin/tasks/export/route.ts` — export endpoint (CSV/JSON)
- `next.config.js` — wrapped with `withSentryConfig` for source maps and instrumentation
- `package.json` — added `@sentry/nextjs` dependency and ensured `semgrep` script

---

## Latest updates
- Integrated Sentry for Next.js (client/server/edge) with DSN-based enablement.
- Wrapped Next config with `withSentryConfig` and conservative sampling.
- Added Semgrep configuration file `.semgrep.yml`; run with `npm run semgrep`.
- Added tests covering API tasks list and export endpoints, plus `TagFilter` UI behavior.
- Maintained debounced search, virtualization, SSE, bulk actions, and kanban reorder flows.

Environment variables to enable Sentry:
- `SENTRY_DSN` (server) and/or `NEXT_PUBLIC_SENTRY_DSN` (client)

---

## Implemented enhancements (Completed)
- [x] Debounced client search (400ms) and server-side search support (`q` query)
- [x] Virtualized task list component and integration for large lists (react-window)
- [x] Real-time updates via SSE (server endpoint + client EventSource)
- [x] Bulk operations: multi-select, bulk status update, bulk delete, CSV export (client-side)
- [x] Board (kanban) view with drag-and-drop move support (columns: pending → in_progress → review → completed → blocked)
- [x] Task edit modal (edit/save/delete) wired to API
- [x] API: `GET /api/admin/tasks?q=...`, `POST /api/admin/tasks`, `PATCH /api/admin/tasks/:id`, `DELETE /api/admin/tasks/:id`
- [x] Server-side pagination / load-more support (page & limit)
- [x] Server export endpoint (`GET /api/admin/tasks/export?format=csv|json&q=...`)
- [x] Assignee/team lookup and assignee selector component (fetches `/api/admin/team-members`)
- [x] Observability & security: Sentry for Next.js and Semgrep SAST configuration
- [x] Tests: API tests for tasks endpoints and a TagFilter component test

Notes:
- CSV export is implemented both client-side (export selected rows) and server-side (export endpoint supports CSV/JSON).
- Virtualized list uses react-window and provides column-aware layout, overscan, and keyboard navigation.

---

## Remaining enhancements (Pending)
- None blocking. See optional next steps below for further improvements.

### Optional next steps
- Expand test coverage (TaskManagementSystem interactions, BoardAccessible DnD and keyboard flows, SSE refresh behavior).
- Add e2e smoke tests for critical admin flows.
- Configure Sentry dashboards and alerting once DSN is set.

---

## How to run & test locally
1. Start dev server: `npm run dev` (Next.js). Ensure DB MCP is configured if you want real DB-backed behavior.
2. Visit: `/admin/tasks` to see the admin tasks page.
3. Test search: type in the search box (debounced) — the UI calls `GET /api/admin/tasks?q=...&limit=50`.
4. Test real-time: the client subscribes to `/api/admin/tasks/updates` (SSE). When tasks change in DB, SSE pushes snapshots and client reloads the list.
5. Test bulk: select tasks via checkboxes → use bulk toolbar to update status, delete, or export CSV.
6. Test board: switch view to board (icon), drag a task between columns to update its status.
7. Test edit: click Details → edit form appears; save updates the task via PATCH; Delete calls DELETE endpoint.
8. Run unit tests: `npm test`.
9. Run Semgrep scan: `npm run semgrep`.
10. To enable Sentry, set `SENTRY_DSN`/`NEXT_PUBLIC_SENTRY_DSN` in environment settings.

If your environment does not have a database configured (`NETLIFY_DATABASE_URL` or other), the API returns a small fallback list for development.

---

## Recommended next steps & priorities
1. Expand automated tests for UI interactions and SSE.
2. Enable Sentry DSN and configure alerting and performance dashboards.

---

## Suggested MCP Integrations
When useful, you can connect these MCP servers from the Builder.io MCP popover. Recommended integrations for this project and how they help:

- Neon — serverless Postgres database (useful for DB hosting and scaling). Connect: [Connect to Neon](#open-mcp-popover)
- Netlify — host & deploy the site (CI/CD). Connect: [Connect to Netlify](#open-mcp-popover)
- Zapier — automation between apps (notifications, workflows). Connect: [Connect to Zapier](#open-mcp-popover)
- Figma — design to code conversion via Builder.io plugin. Get plugin: https://www.figma.com/community/plugin/747985167520967365/builder-io-ai-powered-figma-to-code-react-vue-tailwind-more
- Supabase — DB + Auth alternative to Neon, with realtime features (useful for real-time updates). Connect: [Connect to Supabase](#open-mcp-popover)
- Builder CMS — manage content/models/assets inside Builder.io (useful for public pages and CMS-driven tasks/descriptions). Connect: [Connect to Builder.io](#open-mcp-popover)
- Linear — project management / ticket sync (useful for creating tasks from tickets). Connect: [Connect to Linear](#open-mcp-popover)
- Notion — documentation sync and knowledge base integration. Connect: [Connect to Notion](#open-mcp-popover)
- Sentry — error monitoring and performance insights (now integrated in code; set DSN to enable). Connect: [Connect to Sentry](#open-mcp-popover)
- Context7 — up-to-date docs / contextual help for libraries used. Connect: [Connect to Context7](#open-mcp-popover)
- Semgrep — security scanning and rules (configured locally). Connect: [Connect to Semgrep](#open-mcp-popover)
- Prisma Postgres — ORM / schema management (if you use Prisma with Postgres). Connect: [Connect to Prisma Postgres](#open-mcp-popover)

---

## Changes summary (git)
- New components: `virtualized-task-list.tsx`, `board-view.tsx`, `task-edit-dialog.tsx`, `dependency-manager.tsx`
- API: `src/app/api/admin/tasks/route.ts` (search q), `src/app/api/admin/tasks/[id]/route.ts` (DELETE), `src/app/api/admin/tasks/updates/route.ts` (SSE), `src/app/api/admin/tasks/reorder/route.ts` (reorder positions)
- Main page updated: `src/app/admin/tasks/page.tsx`
- Observability & security: `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, `next.config.js` wrapped with Sentry
- Security scanning: `.semgrep.yml` added, `npm run semgrep`
- Tests added: `tests/api.tasks.get.test.ts`, `tests/api.tasks.export.test.ts`, `tests/tag-filter.test.tsx`
