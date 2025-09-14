## TODO
- [x] Review code samples in temp/task management to assess scope and gaps
- [x] Define API/DB ↔ UI adapter mapping (Prisma enums/status/priority vs UI types)
- [x] Implement temp/lib/tasks/adapters.ts
- [x] Scaffold admin pages under temp (mirror target): temp/task management/src/app/admin/tasks/{page.tsx,[id]/page.tsx,loading.tsx}
- [x] Wire adapters into hooks to consume /api/admin/tasks (useDevTasks)
- [x] Expand dev flows: implement create/delete and filter sidebar; connect auth guards for admin routes
- [x] Add DELETE /api/admin/tasks/[id] endpoint on dev branch and wire remove() fully
- [x] Guard client fetches behind auth to prevent unauthorized fetch/HMR churn
- [x] Initialize project in development mode
- [x] Setup GitHub repo + connect Builder.io
- [x] Create base Next.js project (app router, TypeScript enabled)
- [x] Configure environment variables (DB, auth, API keys)
- [x] Implement database schema for tasks (Prisma/Postgres) — dev branch extension for advanced fields
- [x] Create API routes for task CRUD operations (align with adapters and pagination)
- [x] Build UI components (TaskCard, TaskList, TaskForm) — consolidate from temp components
- [x] Add task filters (status, priority, due date)
- [x] Integrate authentication (NextAuth guards for admin pages)
- [x] Add unit tests (Vitest + React Testing Library)
- [x] Deploy dev branch to Netlify
- [x] Document each step in project-structure.md
- [x] Implement advanced UI forms and modals (forms/, modals/)
- [x] Implement providers (TaskProvider, FilterProvider, ViewProvider, NotificationProvider)
- [x] Implement advanced hooks (useTaskFilters, useTaskActions, useTaskBulkActions, useTaskPermissions)
- [x] Add API subroutes: assign, status, comments, bulk (analytics/export/templates/notifications deferred)
- [x] Add analytics components and charts (basic API + hook implemented; charts deferred)
- [x] Add analytics UI component (TaskAnalytics) and wire into dev UI
- [x] Add styles/tasks/*.css to match design system (basic CSS added; refine with design tokens later)

## Remaining work (paused)
These items are intentionally left for future work. The project is paused — resume from the checklist below when ready.

- [x] Implement analytics charts and visualizations (Chart.js or Recharts integration)
- [x] Complete export/templates/notifications API routes and UI (CSV/Excel export, task templates, notification settings)
- [x] Implement TaskForm validation (Zod schemas) and form unit tests)
- [x] Implement TaskProvider optimizations: optimistic updates, WebSocket/real-time sync
- [x] Implement useTaskPermissions full behavior and role-based UI controls
- [x] Add bulk UI flows and confirm dialogs wiring to bulk API
- [x] Add comments UI integrated with comments API (threaded comments, attachments)
- [x] Split consolidated component files into per-file layout/cards/forms/views/widgets per the original structure
- [x] Add Gantt view scaffold (data model + UI placeholder)
- [x] Add comprehensive unit and integration tests (Vitest + React Testing Library, API tests)
- [x] Create GitHub Actions workflow for CI (tests, lint, build) and Netlify deploy
- [x] Finalize styles/design tokens and accessibility review
- [ ] Verify Prisma schema compatibility against existing production DB (using NETLIFY_DATABASE_URL). Migrations managed externally/CI. Seed data assumed present.
- [x] Enable CI-run for Prisma migrations (GitHub Actions)


## Development Log
- 2025-09-14: Audited src/app/admin/tasks and src/app/api/admin/tasks; fixed missing NextResponse import in stream route.
- 2025-09-14: Configured NETLIFY_DATABASE_URL to existing Neon database (no secret committed). Will verify schema via /api/db-check and task routes.
- 2025-09-14: Cleanup and consolidation completed. Removed dev/temp workspace and duplicates: deleted src/app/admin/tasks/next-app/, src/app/admin/tasks/api/, src/app/admin/tasks/prisma/, src/app/admin/tasks/src/, src/app/admin/tasks/lib/realtime.ts, src/app/admin/tasks/lib/tasks/adapters.ts, src/app/admin/tasks/components/providers/TaskProvider.tsx, src/app/admin/tasks/hooks/useDevTasks.ts, src/app/admin/tasks/hooks/useTaskPermissions.ts (TS duplicate), netlify.toml, netlify-readme.md, env-setup.md, package.json, tsconfig.json, vitest.config.ts, complete-task-management-system.tsx and its copy, and index.tsx. Updated imports to use project aliases and fixed task-utils to import from './task-types'. Updated tests to reference components paths and '@/lib/tasks/adapters'. All UI now consumes API under src/app/api/admin/tasks and realtime via '@/lib/realtime'.

TODO: Verify any external dashboards or CI that referenced the dev workspace; if so, update/remove. Confirm tests run under root Vitest config. If any missing usage of adapters is needed in UI, wire '@/lib/tasks/adapters' where necessary.
- 2025-09-24: DATABASE_URL configured via environment for temp workspace (Neon). Running prisma generate/migrate is blocked by ACL for shell commands; awaiting approval to run via CI or MCP, or user-triggered migration.
- 2025-09-24: Implemented CI-run for Prisma migrations. Moved workflow to `.github/workflows/ci.yml`. It installs dependencies, runs `npx prisma generate`, executes `npx prisma migrate deploy` using `DATABASE_URL: ${{ secrets.DATABASE_URL }}`, then builds and runs tests. Node modules caching enabled via `actions/setup-node` (npm). Configure the `DATABASE_URL` GitHub secret to activate migrations.
- 2025-09-24: Finalized styles and a11y: added CSS design tokens at `styles/tasks/tokens.css`, refactored task styles to use tokens, added prefers-reduced-motion safeguards, and improved accessibility in TaskCard (roles, aria-labelledby, keyboard interaction, descriptive aria-labels). Preserved original look and class names.
- 2025-09-24: Added GitHub Actions CI workflow template at `temp/task management/.github/workflows/ci.yml` to run Vitest tests in the temp workspace, conditionally build the dev Next app, and optionally deploy to Netlify when NETLIFY_AUTH_TOKEN and NETLIFY_SITE_ID secrets are set. This file lives under the temp workspace due to ACL; move to repo root `.github/workflows/` when ready to enable CI.
- 2025-09-13: Added comprehensive unit and integration tests across API routes (export/templates/notifications/comments/bulk), adapters, permissions hook, and TaskProvider optimistic flows. Updated vitest setup to mock NextResponse constructor and UI stubs. Marked TODO complete.
- 2025-09-24: Added Gantt view scaffold under `components/views/TaskGanttView.tsx` with monthly timeline, task bars, and legend. Updated toolbar to include Gantt and wired view switching in `dev-task-management.tsx`. This is a UI placeholder using createdAt/dueDate heuristics; no DB changes required.
- 2025-09-13: Split consolidated components into per-file layout/cards/views/widgets under `temp/task management/components/`. Updated `dev-task-management.tsx` imports, removed duplicate viewTask state, and added missing ExportPanel import. Preserved original styles and class names.
- 2025-09-13: Initialized development documentation and TODO tracker at docs/project-structure.md. Verified available task module directory at `temp/task management/` (note the space). Awaiting confirmation to proceed using this path. Next: set workflow to keep all task-system work under temp/task management and begin initialization in dev mode.
- 2025-09-13: Relocated docs/project-structure.md to temp/task management/project-structure.md to keep the task system confined to the dev workspace. Next: initialize dev workspace in this directory per TODOs.
- 2025-09-13: Completed code sample review for `temp/task management/`. Findings: UI layer is comprehensive (cards, views, filters, widgets, layout, hooks) plus a monolithic demo. Current API and Prisma differ from UI expectations (TaskStatus OPEN/IN_PROGRESS/DONE vs UI pending/in_progress/review/completed/blocked; TaskPriority LOW/MEDIUM/HIGH vs UI low/medium/high/critical; GET /api/admin/tasks returns array not { tasks, stats }). Plan: create an adapter in `temp/lib/tasks/adapters.ts` to map API <-> UI types and shapes; refactor temp hooks to use the adapter; scaffold admin pages under temp mirroring `src/app/admin/tasks/*`; evaluate Prisma schema extension on dev branch for advanced fields.
- 2025-09-25: Moved Task Management module into src/app/admin/tasks and API subroutes into src/app/api/admin/tasks. Updated imports to use '@/lib/prisma' and '@/lib/realtime'. Copied adapters to src/lib/tasks/adapters.ts and realtime to src/lib/realtime.ts.

---
### 2025-09-14 — Admin Tasks cleanup audit
- Updated all task API routes to import Prisma via `@/lib/prisma` (default export) instead of broken `../../../prisma/client` paths.
- Standardized realtime imports to `@/lib/realtime` in tasks routes (root, [id], comments, stream) and dynamic imports.
- Pointed templates/notifications APIs to project data at `src/app/admin/tasks/data/*.json` (removed dependency on `temp/task management`).
- Removed unused placeholder: `src/app/admin/tasks/components/modals/other-modals.tsx`.
- Removed `src/app/admin/tasks/dev-task-management.tsx` and refactored `page.tsx` to render a minimal Tasks UI using `TaskProvider`, `TasksToolbar`, and `TaskListView` directly.

Open TODOs
- Consider migrating templates/notifications storage from JSON files to DB tables via Prisma.
- Confirm Prisma enum values align with UI types; adjust adapters or schema if needed.
- If realtime needs to scale beyond in-process SSE, evaluate WebSocket/SSE broker.
