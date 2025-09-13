# Task Management System — Development Workspace

## TODO
- [x] Review code samples in temp/task management to assess scope and gaps
- [x] Define API/DB ↔ UI adapter mapping (Prisma enums/status/priority vs UI types)
- [x] Implement temp/lib/tasks/adapters.ts
- [x] Scaffold admin pages under temp (mirror target): temp/task management/src/app/admin/tasks/{page.tsx,[id]/page.tsx,loading.tsx}
- [x] Wire adapters into hooks to consume /api/admin/tasks (useDevTasks)
- [x] Expand dev flows: implement create/delete and filter sidebar; connect auth guards for admin routes
- [ ] Initialize project in development mode
- [ ] Setup GitHub repo + connect Builder.io
- [ ] Create base Next.js project (app router, TypeScript enabled)
- [ ] Configure environment variables (DB, auth, API keys)
- [ ] Implement database schema for tasks (Prisma/Postgres) — dev branch extension for advanced fields
- [ ] Create API routes for task CRUD operations (align with adapters and pagination)
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
- 2025-09-13: Implemented quick-create form, delete hook wiring, filter sidebar (status/priority/overdue), and a client-side auth guard using `/api/users/me`. Note: API lacks DELETE route for `/api/admin/tasks/[id]`; delete will surface error until backend endpoint is added on the dev branch. Next: add backend DELETE route and full CRUD alignment.
