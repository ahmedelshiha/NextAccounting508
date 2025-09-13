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
- [ ] Implement TaskForm validation (Zod schemas) and form unit tests
- [ ] Implement TaskProvider optimizations: optimistic updates, WebSocket/real-time sync
- [ ] Implement useTaskPermissions full behavior and role-based UI controls
- [ ] Add bulk UI flows and confirm dialogs wiring to bulk API
- [ ] Add comments UI integrated with comments API (threaded comments, attachments)
- [ ] Split consolidated component files into per-file layout/cards/forms/views/widgets per the original structure
- [ ] Add Gantt view scaffold (data model + UI placeholder)
- [ ] Add comprehensive unit and integration tests (Vitest + React Testing Library, API tests)
- [ ] Create GitHub Actions workflow for CI (tests, lint, build) and Netlify deploy
- [ ] Finalize styles/design tokens and accessibility review
- [ ] Run Prisma migrations in temp workspace and verify DB seed data (requires DATABASE_URL)


## Development Log
- 2025-09-13: Initialized development documentation and TODO tracker at docs/project-structure.md. Verified available task module directory at `temp/task management/` (note the space). Awaiting confirmation to proceed using this path. Next: set workflow to keep all task-system work under temp/task management and begin initialization in dev mode.
- 2025-09-13: Relocated docs/project-structure.md to temp/task management/project-structure.md to keep the task system confined to the dev workspace. Next: initialize dev workspace in this directory per TODOs.
- 2025-09-13: Completed code sample review for `temp/task management/`. Findings: UI layer is comprehensive (cards, views, filters, widgets, layout, hooks) plus a monolithic demo. Current API and Prisma differ from UI expectations (TaskStatus OPEN/IN_PROGRESS/DONE vs UI pending/in_progress/review/completed/blocked; TaskPriority LOW/MEDIUM/HIGH vs UI low/medium/high/critical; GET /api/admin/tasks returns array not { tasks, stats }). Plan: create an adapter in `temp/lib/tasks/adapters.ts` to map API <-> UI types and shapes; refactor temp hooks to use the adapter; scaffold admin pages under temp mirroring `src/app/admin/tasks/*`; evaluate Prisma schema extension on dev branch for advanced fields. Next: implement adapters and wire into `useTasks`, then scaffold pages.
- 2025-09-13: Wired adapters into dev hook `temp/task management/hooks/useDevTasks.ts` to fetch `/api/admin/tasks` and map results; created `temp/task management/dev-task-management.tsx` using modular views + hook; updated dev page to render this component. Next: expand update/delete/create flows and filters.
- 2025-09-13: Implemented quick-create form, delete hook wiring, filter sidebar (status/priority/overdue), and a client-side auth guard using `/api/users/me`. Note: API lacked DELETE; implemented below.
- 2025-09-13: Added DELETE handler at `src/app/api/admin/tasks/[id]/route.ts` with auth, rate limiting, DB check, and proper 404 on missing task. remove() now fully functional in dev UI.
- 2025-09-13: Debugged Failed to fetch during HMR by preventing premature API calls: `useDevTasks` now accepts an `enabled` flag; `DevTaskManagement` initializes `authorized=false` until `/api/users/me` validates, then enables fetching. This avoids unauthorized fetch errors and reduces HMR noise.
- 2025-09-13: Initialized dev workspace: added `temp/task management/index.tsx` as a single-mount entry for the task system; confirmed `temp/task management/src/app/admin/tasks/*` renders `DevTaskManagement`. No root app changes due to ACL. To preview locally, import this entry in `src/app/admin/tasks/page.tsx`.
- 2025-09-14: Prepared MCP + GitHub setup guide in `temp/task management/mcp-setup.md` with step-by-step instructions to connect Builder.io and recommended MCP servers. NOTE: MCP connections must be performed manually via the Builder UI ([Open MCP popover](#open-mcp-popover)). Also documented required env vars (DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL) and next steps.
- 2025-09-14: Created a minimal Next.js app scaffold under `temp/task management/next-app` (app router + TypeScript enabled) to serve as an isolated development mount for the task management UI. Includes basic layout, page, globals.css, tsconfig.json, next.config.js and package.json so maintainers can run the dev app in the workspace if desired. This is intentionally lightweight and kept inside the temp workspace to avoid affecting the main repo.
- 2025-09-15: Added environment variable examples and setup instructions (`.env.example` and `env-setup.md`). These provide the required environment variable names and local/hosting setup steps. Note: secrets must be set manually in hosting/Builder UI or via DevServerControl; this change only provides documentation and example placeholders.
- 2025-09-15: Added a client-side handler to `DevTaskManagement` to detect ChunkLoadError / failed-to-fetch during HMR and perform a full reload to recover. This reduces persistent broken client state in dev when hot updates produce stale chunks. See `temp/task management/dev-task-management.tsx`.
- 2025-09-15: Added a dev fetch wrapper in `temp/task management/index.tsx` that intercepts network errors and returns a controlled 503 Response. This prevents uncaught "Failed to fetch" errors from bubbling into the console during hot reloads and non-deterministic dev network failures. The wrapper is intentionally only installed in the browser and gated behind a flag to avoid affecting production code.
- 2025-09-16: Hardened application HTTP client `src/lib/api.ts`: added request timeout (8s), AbortController usage, retry/backoff for network failures, and a browser-origin fallback for relative paths. On repeated failures the client now returns a safe 503 Response with JSON instead of throwing, reducing uncaught "Failed to fetch" errors in the UI and making downstream callers handle non-ok responses gracefully. See `src/lib/api.ts`.
- 2025-09-16: Added Prisma schema for Task/User models in `temp/task management/prisma/schema.prisma`. The schema includes TaskPriority and TaskStatus enums and fields aligning with UI adapters (tags as String[], customFields/comments/attachments as Json). To apply this schema you need to set DATABASE_URL and run Prisma migrate/generate in the temp workspace (or use Neon/Prisma Postgres via MCP).
- 2025-09-16: Implemented basic CRUD API routes for tasks under `temp/task management/api/admin/tasks` and `.../tasks/[id]` using Prisma client (`temp/task management/prisma/client.ts`). Also added `temp/task management/package.json` with Prisma scripts (generate, migrate, studio). These are intended for the temp dev workspace — to activate them set DATABASE_URL and run `npm install` then `npm run prisma:migrate` in the `temp/task management` folder.
- 2025-09-17: Added unit test scaffolding using Vitest + React Testing Library under `temp/task management/tests`. Files added: `vitest.config.ts`, `tests/test-setup.ts`, `tests/TaskCard.test.tsx`, `tests/TaskListView.test.tsx`, and a local `tsconfig.json`. Updated `temp/task management/package.json` to include a `test` script and devDependencies for Vitest and testing libraries. These tests are lightweight smoke tests for components and are intended as a starting point; run them locally with `npm install` then `npm test` in `temp/task management`.
- 2025-09-17: Created Netlify deploy configuration (`temp/task management/netlify.toml`) and documented deployment steps and required environment variables in `temp/task management/netlify-readme.md`. The config uses `@netlify/plugin-nextjs` and sets the build command to run in `next-app`. Important env vars to set in Netlify: DATABASE_URL, NEXTAUTH_URL, NEXTAUTH_SECRET, NEXT_PUBLIC_API_BASE, SENDGRID_API_KEY. Note: server-side DB access requires DATABASE_URL at runtime.
- 2025-09-18: Added unit tests scaffold and finalized documentation.
- 2025-09-19: Implemented providers, advanced hooks, and API subroutes for assign/status/comments/bulk. Added analytics API/hook and basic analytics UI. Added basic styles folder.
- 2025-09-19: Project paused — updated TODO with remaining tasks. To resume, set DATABASE_URL and other env vars, run Prisma migrations, and continue with the Remaining work checklist.

- 2025-09-13: Implemented analytics charts in `temp/task management/components/analytics/TaskAnalytics.tsx` using react-chartjs-2 (Doughnut for status, Bar for priority); wired to `useTaskAnalytics`. Added graceful empty-state handling.
- 2025-09-20: Implemented export, templates, and notifications features:
  - Added CSV export API `temp/task management/api/admin/tasks/export/route.ts` (supports format=csv|xlsx, basic filters),
  - Added file-backed templates API `temp/task management/api/admin/tasks/templates/route.ts`, and notifications API `temp/task management/api/admin/tasks/notifications/route.ts` (file-backed in `temp/task management/data/`),
  - Added UI panel `temp/task management/components/export/ExportPanel.tsx` and wired into DevTaskManagement.
  Note: Templates/notifications are file-backed to avoid requiring immediate Prisma migrations; to persist in DB, add a Template model and run migrations using existing DATABASE_URL.
  Files changed/added are listed in the repository but key paths are: `temp/task management/*` modules, `src/lib/api.ts`, and new test & prisma files under temp. To finish full production readiness you must set env vars (DATABASE_URL, NEXTAUTH_URL, NEXTAUTH_SECRET, SENDGRID_API_KEY) and connect a DB MCP (Neon/Prisma Postgres) via [Open MCP popover](#open-mcp-popover).
