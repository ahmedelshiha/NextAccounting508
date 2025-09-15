# Website Audit

## Overview
- Purpose: A full-stack accounting firm platform with marketing site, blog, bookings, client portal, and an admin console for content, users, services, currencies, and task management.
- Major modules/features:
  - Admin Dashboard (analytics, audits, exports, health, thresholds)
  - Task Management (board/list/calendar/table/gantt views, CRUD, assignments, notifications, SSE stream)
  - Authentication (NextAuth credentials + Prisma adapter)
  - Bookings (client-facing and admin scheduling, confirmations)
  - Content (blog posts, services, newsletter, contact)
  - Multi-currency (currencies, exchange rates, overrides)
  - Client Portal (bookings, settings)
- Structure:
  - Next.js App Router in src/app
  - API routes in src/app/api/* backed by Prisma/Neon
  - Shared libraries in src/lib/*
  - Reusable UI in src/components/ui/* and feature UIs under src/app/admin/tasks/components/*

## Complete Current Directory Structure
Below is a condensed tree for key areas. Files marked:
- ⚠️ duplicates/placeholders/unrelated
- ✅ reusable/shared

Root and config
- package.json
- next.config.js
- netlify.toml
- prisma.config.ts
- prisma/
  - schema.prisma
  - seed.ts
- public/
  - file.svg, globe.svg, next.svg, vercel.svg, window.svg
- scripts/ (utility scripts)
- tests/
- backup/ ⚠️ retired-admin-*.tsx
- docs/ (existing docs)
- Doc/ ⚠️ duplicate documentation folder (capital D)
- temp/ ⚠️ prototypes and notes (admin dashboard, tax-calendar, booking, settings)

src/
- app/
  - layout.tsx ✅
  - globals.css ✅
  - middleware.ts ✅
  - page.tsx (home) ��
  - about/, blog/, booking/, careers/, contact/, cookies/, faq/, privacy/, register/, services/, status/, terms/ (pages)
  - locales/ (ar.json, en.json, hi.json)
  - lib/ ⚠️ duplicates of src/lib (auth.ts, email.ts, i18n.ts, prisma.ts, utils.ts)
  - types/next-auth.d.ts
  - admin/
    - page.tsx
    - audits/page.tsx
    - bookings/page.tsx, bookings/[id]/page.tsx, bookings/new/page.tsx
    - clients/new/page.tsx
    - newsletter/page.tsx
    - posts/page.tsx
    - services/page.tsx
    - settings/page.tsx; settings/currencies/page.tsx
    - team/page.tsx
    - users/page.tsx
    - tasks/
      - page.tsx (feature entry) ✅
      - new/page.tsx ✅
      - TODO+log.md ⚠️
      - data/(notifications.json, templates.json)
      - hooks/(useTaskActions.ts, useTaskAnalytics.ts, useTaskBulkActions.ts, useTaskFilters.ts, useTaskPermissions.tsx)
      - providers/TaskProvider.tsx ✅
      - schemas/task.ts
      - styles/tasks/* (tokens.css, cards.css, board.css, calendar.css, animations.css)
      - components/
        - analytics/(TaskAnalytics.tsx, AdvancedAnalytics.tsx)
        - bulk/BulkActionsPanel.tsx
        - filters/TaskFiltersPanel.tsx
        - forms/TaskForm.tsx
        - layout/(TasksHeader.tsx, TasksStats.tsx, TasksToolbar.tsx)
        - modals/(TaskEditModal.tsx, TaskDeleteModal.tsx, TaskDetailsModal.tsx)
        - providers/(FilterProvider.tsx, ViewProvider.tsx, NotificationProvider.tsx) ✅
        - views/(TaskListView.tsx, TaskBoardView.tsx, TaskCalendarView.tsx, TaskTableView.tsx, TaskGanttView.tsx)
        - widgets/(TaskAssignee.tsx, TaskCategory.tsx, TaskDependencies.tsx, TaskDueDate.tsx,
          TaskMetrics.tsx, TaskPriority.tsx, TaskProgress.tsx, TaskReminders.tsx, TaskStatus.tsx, TaskTags.tsx, TaskWatchers.tsx)
        - cards/(TaskCard*.tsx, index.ts)
      - tests/*
  - api/
    - admin/* (see API Architecture)
    - auth/* (NextAuth, register)
    - bookings/*
    - contact/route.ts
    - cron/*
    - currencies/*
    - email/*
    - health/*, db-check/route.ts
    - neon/posts/*
    - newsletter/*
    - posts/*, services/*
    - users/*
- components/
  - providers/(client-layout.tsx ✅, error-boundary.tsx ✅, translation-provider.tsx ✅)
  - home/(hero-section.tsx, services-section.tsx, blog-section.tsx, testimonials-section.tsx)
  - ui/(alert-dialog.tsx, badge.tsx, button.tsx, card.tsx, dialog.tsx, dropdown-menu.tsx, footer.tsx,
    form.tsx, input.tsx, label.tsx, language-switcher.tsx, loading.tsx, navigation.tsx, newsletter-form.tsx,
    progress.tsx, select.tsx, sonner.tsx, table.tsx, tabs.tsx, textarea.tsx) ✅
  - admin/(currency-manager.tsx, team-management.tsx)
- lib/
  - prisma.ts ✅
  - auth.ts ✅
  - api.ts ✅
  - audit.ts, logger.ts, rbac.ts, rate-limit.ts, realtime.ts ✅
  - email.ts, exchange.ts, decimal-utils.ts, cron.ts, i18n.ts, utils.ts, validation.ts ✅
  - tasks/(adapters.ts, types.ts, utils.ts) ✅
- types/next-server.d.ts ✅

Notes
- ⚠️ src/app/lib/* duplicates src/lib/* — prefer a single source of truth (src/lib/*) and remove app-level duplicates.
- ⚠️ backup/ and temp/ contain retired or prototype code — exclude from builds; keep for reference or prune.
- ✅ components/ui and src/lib are shared and reusable.

## Component Architecture Details
- Layouts
  - src/app/layout.tsx: Root layout that wraps pages with ClientLayout.
  - components/providers/client-layout.tsx: Navigation, footer, Toaster, and global error/fetch guards.
- Pages (examples)
  - Marketing: src/app/(about|services|blog|contact|careers|privacy|terms)/page.tsx
  - Admin: src/app/admin/*/page.tsx
  - Portal: src/app/portal/*/page.tsx
- Task feature components
  - Providers: TaskProvider (state + CRUD), FilterProvider, ViewProvider, NotificationProvider.
  - Views: TaskListView, TaskBoardView, TaskCalendarView, TaskTableView, TaskGanttView.
  - Modals: TaskEditModal, TaskDeleteModal, TaskDetailsModal.
  - Widgets: TaskPriority, TaskStatus, TaskAssignee, etc.
  - Forms: TaskForm (react-hook-form + zod).
- Reusables
  - components/ui/*: Button, Card, Dialog, Dropdown, Form, Input, Select, Tabs, Table, Textarea, etc.
- Potentially unused/duplicates
  - backup/retired-*.tsx ⚠️
  - src/app/lib/* duplicates of src/lib/* ⚠️
  - temp/** prototypes ⚠️

## Data Flow Architecture
- UI -> Providers/Hooks -> API routes -> Prisma -> Neon (Postgres)
- State management
  - React Context providers: TaskContext (TaskProvider) for task list and CRUD.
  - Local component state for forms/modals; react-hook-form in TaskForm.
- Networking
  - apiFetch in src/lib/api.ts with retries, timeouts, and origin fallback.
  - Real-time: SSE via /api/admin/tasks/stream broadcasting task events (created/updated/deleted) through lib/realtime.ts.
- Cross-feature integrations
  - Tasks <-> Users: assigneeId references User.id.
  - Admin health/analytics use DB, email (SendGrid), and auth env checks.
  - Currencies/exchange integrate with Exchange API provider envs.

### Custom Hooks (selection)
- src/app/admin/tasks/hooks
  - useTaskActions(): create/update/delete/assign/status helpers calling task APIs.
  - useTaskBulkActions(): bulk API operations for tasks.
  - useTaskFilters(tasks, filters): returns filtered tasks via predicates.
  - useTaskAnalytics(): loads analytics from /api/admin/tasks/analytics.
  - useTaskPermissions(): checks session role for task permissions.
- Providers expose hooks
  - useTasks() from TaskProvider
  - useFilterContext(), useViewContext(), useNotification()
- Shared
  - src/lib/use-permissions.ts: role/permission hook (uses next-auth session).
  - components/ui/form.tsx: useFormField() field context helper.

## API Architecture
Key routes and methods (App Router). Payloads are TypeScript-like for clarity.

- Auth
  - /api/auth/[...nextauth] (NextAuth)
  - /api/auth/register: POST { email, password, name? }
- Users
  - /api/admin/users: GET -> { users: Array<{ id, name, email, role, createdAt, totalBookings }> }
  - /api/admin/users/[id]: GET, PATCH, DELETE (ID ops) [check file for exact fields]
  - /api/users/me: GET current user info
  - /api/users/check-email: GET ?email=...
- Team Members
  - /api/admin/team-members: GET -> { teamMembers: Array<{ id, userId?, name, email, role, ... }> }, POST create
  - /api/admin/team-members/[id]: GET, PATCH, DELETE
- Tasks
  - /api/admin/tasks
    - GET query: limit, offset, status[], priority[], assigneeId, q, dueFrom, dueTo, orderBy, order
    - POST body: { title: string; priority?: 'LOW'|'MEDIUM'|'HIGH'|'low'|'medium'|'high'|'critical'; status?: 'OPEN'|'IN_PROGRESS'|'DONE'|'pending'|'in_progress'|'completed'; dueAt?: string; assigneeId?: string|null }
  - /api/admin/tasks/[id]: GET, PATCH body subset of POST fields, DELETE
  - /api/admin/tasks/[id]/assign: POST { assigneeId: string|null }
  - /api/admin/tasks/[id]/status: PATCH { status: 'OPEN'|'IN_PROGRESS'|'DONE'|...'completed' }
  - /api/admin/tasks/stream: GET (SSE)
  - /api/admin/tasks/analytics, /export, /bulk, /notifications, /templates
- Bookings
  - /api/bookings: GET, POST
  - /api/bookings/[id]: GET, PATCH/DELETE
  - /api/bookings/[id]/confirm: POST confirm
  - /api/bookings/availability: GET slots
  - /api/admin/bookings: GET admin list
- Content
  - /api/posts, /api/posts/[slug]
  - /api/services, /api/services/[slug]
  - /api/newsletter, /api/newsletter/unsubscribe
  - /api/contact: POST { name, email, subject?, message }
- Currencies
  - /api/currencies, /api/currencies/convert
  - /api/admin/currencies, /[code], /export, /overrides, /refresh
- System/Health/Analytics
  - /api/admin/system/health: DB, email, auth checks
  - /api/admin/analytics, /api/admin/activity, /api/admin/thresholds, /api/admin/perf-metrics, /api/admin/export
- Misc
  - /api/db-check, /api/health/logs, /api/email/test, /api/cron/*, /api/neon/posts/*

UI connections
- TaskProvider/Task pages call /api/admin/tasks* routes via apiFetch.
- Admin Users/Team pages call /api/admin/users and /api/admin/team-members.
- Marketing pages and blog sections call /api/posts/services etc.

## Integration Points
- Environment variables seen in code
  - NETLIFY_DATABASE_URL (primary DB URL for Prisma)
  - DATABASE_URL (mapped to NETLIFY_DATABASE_URL in Netlify)
  - NEXTAUTH_URL, NEXTAUTH_SECRET (auth)
  - SENDGRID_API_KEY, FROM_EMAIL (email)
  - EXCHANGE_BASE_CURRENCY, EXCHANGE_API_PROVIDER, EXCHANGE_RATE_TTL_SECONDS (currencies)
  - CRON_SECRET (cron endpoints)
  - NEXT_PUBLIC_API_BASE (client fetch base), NEXT_PUBLIC_DEBUG_FETCH (debugging)
  - NODE_ENV
- Services/MCP/integrations
  - Prisma + Neon (Postgres via Netlify DB integration)
  - NextAuth (Credentials provider + Prisma adapter)
  - Netlify (build + Next.js runtime + Lighthouse plugin)
  - SendGrid (email)
  - SSE for realtime via EventSource
- Shared libraries
  - src/lib/prisma: lazy singleton with NETLIFY_DATABASE_URL mapping (neon:// -> postgresql://)
  - src/lib/auth: NextAuth options with DB/no-DB fallbacks
  - src/lib/api: fetch wrapper with retries, timeouts, origin fallback
  - src/lib/realtime: broadcast helper for SSE
  - src/lib/rbac: role->permissions

## Cleanup Notes (optional)
- Duplicates
  - ⚠️ src/app/lib/* duplicates src/lib/* — remove app-level copies, update imports to '@/lib/...'.
  - ⚠️ Doc/ and docs/ — consolidate into a single docs directory.
- Placeholders/retired
  - ⚠️ backup/retired-*.tsx files; mark clearly or delete.
  - ⚠️ temp/** contains prototype code and large docs; keep out of production build.
  - ⚠️ TODO+log.md files under tasks/ — convert to issues or formal docs.
- Consistency
  - Ensure all Task API routes use consistent field names: dueAt (DB) vs dueDate (UI) mapped at providers.
  - Validation: zod schemas exist for forms and routes; standardize across all API routes.
  - Error handling: consolidate error shapes { error, details? } for client consistency.
- Refactoring TODOs
  - Extract shared Task mapping utilities to src/lib/tasks/adapters.ts (partially present) and reuse in provider and routes.
  - Introduce a typed API client layer for all admin APIs to reduce ad-hoc fetch usage.
  - Consider feature-based directory co-location for non-task admin pages similar to tasks feature.
  - Add E2E tests (Playwright/Cypress) for critical flows: login, create/edit task, booking create/confirm.

---

Code examples

Task create (client -> API)
```ts
// Provider payload mapping
const payload = {
  title: input.title,
  priority: mapPriorityToDb(input.priority), // 'LOW'|'MEDIUM'|'HIGH'
  status: mapStatusToDb('pending'),          // 'OPEN'|'IN_PROGRESS'|'DONE'
  dueAt: input.dueDate,                      // ISO string
  assigneeId: input.assigneeId ?? null,
}
await apiFetch('/api/admin/tasks', { method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' } })
```

Task update (API route signature)
```ts
export async function PATCH(req: Request, { params: { id } }: { params: { id: string } }) {
  const body = await req.json()
  // accepts: { title?, priority?, status?, dueAt?, assigneeId? }
  const updated = await prisma.task.update({ where: { id }, data: updates })
  return NextResponse.json(updated)
}
```

Task Provider (simplified)
```ts
const TaskContext = createContext<TaskContextValue | undefined>(undefined)
export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([])
  const createTask = async (input: any) => { /* optimistic add -> POST -> reconcile */ }
  const updateTask = async (id: string, updates: any) => { /* optimistic update -> PATCH */ }
  return <TaskContext.Provider value={{ tasks, loading, error, refresh, createTask, updateTask, deleteTask }}>{children}</TaskContext.Provider>
}
```
