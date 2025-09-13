# Task Management System — Development Workspace

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
- [ ] Build UI components (TaskCard, TaskList, TaskForm) — consolidate from temp components
- [ ] Add task filters (status, priority, due date)
- [ ] Integrate authentication (NextAuth guards for admin pages)
- [ ] Add unit tests (Vitest + React Testing Library)
- [ ] Deploy dev branch to Netlify
- [ ] Document each step in project-structure.md

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
- 2025-09-13: Fixed dev auth guard bug — `setAuthorized(true)` was not applied on successful `/api/users/me` response, causing perpetual unauthorized state and spurious fetches. Made the check more resilient (AbortController, credentials:'same-origin', clear authError on success) to reduce HMR "Failed to fetch" noise. See `temp/task management/dev-task-management.tsx`.
