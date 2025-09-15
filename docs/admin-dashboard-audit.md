# Admin Dashboard Module Audit

## Overview
- Purpose: Centralized back-office for administrators and staff to manage operations: bookings, clients/users, services, tasks, analytics, health, and settings.
- High‑level features: Dashboard KPIs and charts, Task Management (CRUD, bulk, analytics, export, SSE), Bookings management (filters, bulk ops, CSV export), Users management (roles, status, profiles), Services, Posts, Newsletter, Currencies, Team Members, System health/metrics, Activity/Audit logs, Settings overview.
- App fit: Implemented as Next.js App Router pages under `src/app/admin/*` with colocated API routes under `src/app/api/admin/*`. Uses shared libs in `src/lib/*` (auth, prisma, realtime, api fetch) and UI components under `src/components/ui/*`.

## Complete Current Directory Structure

### src/app/admin
```
src/app/admin/
├─ page.tsx ✅ (Admin dashboard overview with KPIs, actions, BI sections) ⚠️ contains mockDashboardData demo values
├─ audits/
│  └─ page.tsx ✅ (Audit Logs UI, fetches /api/health/logs)
├─ bookings/
│  ├─ [id]/page.tsx ✅ (Booking details, can create a Task via /api/admin/tasks)
│  ├─ new/page.tsx ✅ (New booking form/flow)
│  └─ page.tsx ✅ (Enhanced booking management: filters, table/cards, bulk ops)
├─ clients/
│  └─ new/page.tsx ✅ (Create new client)
├─ newsletter/
│  └─ page.tsx ✅ (Newsletter admin)
├─ posts/
│  └─ page.tsx ✅ (Posts admin)
├─ services/
│  └─ page.tsx ✅ (Services admin)
├─ settings/
│  ├─ currencies/page.tsx ✅ (Currency settings)
│  └─ page.tsx ✅ (Settings overview, env checks)
├─ tasks/
│  ├─ TODO+log.md ⚠️ (dev notes)
│  ├─ page.tsx ✅ (Main Tasks page, composes providers, views, analytics, modals)
│  ├─ new/
│  │  ├─ TODO+log.md ⚠️ (dev notes)
│  │  └─ page.tsx ✅ (New task flow)
│  ├─ data/
│  │  ├─ notifications.json ⚠️ (file-based settings)
│  │  └─ templates.json ⚠️ (file-based templates)
│  ├─ hooks/ (task‑scoped hooks)
│  │  ├─ useTaskActions.ts ⚠️ (unused; overlaps TaskProvider)
│  │  ├─ useTaskAnalytics.ts ✅
│  │  ├─ useTaskBulkActions.ts ⚠️ (unused)
│  │  ├─ useTaskFilters.ts ⚠️ (unused)
│  │  └─ useTaskPermissions.tsx ✅
│  ├─ providers/
│  │  └─ TaskProvider.tsx ✅ (core data layer, SSE, optimistic updates)
│  ├─ schemas/task.ts ✅ (zod form schema)
│  ├─ components/ (analytics, bulk, cards, comments, export, filters, forms, layout, modals, providers, views, widgets) ✅
│  ├─ styles/tasks/ (css for boards/calendar/cards/tokens) ✅
│  └─ tests/ ✅ (components, providers, api routes)
├─ team/
│  └─ page.tsx ✅ (Team members admin)
└─ users/
   └─ page.tsx ✅ (User management: roles, status, directory, profile dialog)
```

Legend: ⚠️ duplicate/placeholder/suspicious; ✅ reusable/shared.

### src/app/api/admin
```
src/app/api/admin/
├─ activity/route.ts ✅ (GET activity/audit)
├─ analytics/route.ts ✅ (GET dashboard analytics)
├─ bookings/route.ts ✅ (GET list, POST create, PATCH bulk update, DELETE bulk delete)
├─ currencies/
│  ├─ [code]/route.ts ✅ (PATCH one currency)
│  ├─ export/route.ts ✅ (GET export)
│  ├─ overrides/route.ts ✅ (GET/POST overrides)
│  └─ refresh/route.ts ✅ (POST refresh rates)
├─ export/route.ts ✅ (GET CSV export by entity)
├─ health-history/route.ts ✅ (GET historical health metrics)
├─ perf-metrics/route.ts ✅ (GET performance metrics)
├─ services/route.ts ✅ (GET services)
├─ stats/
│  ├─ bookings/route.ts ✅ (GET booking stats)
│  ├─ posts/route.ts ✅ (GET post stats)
│  └─ users/route.ts ✅ (GET user stats)
├─ system/health/route.ts ✅ (GET system health)
├─ tasks/
│  ├─ [id]/route.ts ✅ (GET one, PATCH update, DELETE)
│  ├─ [id]/assign/route.ts ✅ (POST assign)
│  ├─ [id]/comments/route.ts ⚠️ (GET/POST — file-based JSON)
│  ├─ [id]/status/route.ts ✅ (PATCH status)
│  ├─ analytics/route.ts ✅ (GET aggregated analytics)
│  ├─ bulk/route.ts ✅ (POST bulk action)
│  ├─ export/route.ts ✅ (GET CSV)
│  ├─ notifications/route.ts ⚠️ (GET/PATCH — file-based JSON)
│  ├─ stream/route.ts ⚠️ (GET SSE — in-process only)
│  └─ templates/route.ts ⚠️ (CRUD — file-based JSON)
├─ team-members/
│  ├─ [id]/route.ts ✅ (GET, PUT, DELETE)
│  └─ route.ts ✅ (GET list, POST create)
└─ users/
   ├─ [id]/route.ts ✅ (PATCH user updates — role/status/profile)
   └─ route.ts ✅ (GET users)
```

## Component Architecture Details
- Dashboard (src/app/admin/page.tsx) ✅
  - Role: Home of Admin; KPIs, Smart actions, Activity feed, System Health, BI. Uses mockDashboardData ⚠️ as fallback visuals.
  - Imports charts, shadcn UI; fetches `/api/admin/analytics` via SWR for live data.
- Bookings
  - page.tsx: end‑to‑end management (filters, views, bulk actions, export); fetches `/api/admin/bookings`; assigns via `/api/bookings/:id` and team via `/api/admin/team-members`.
  - [id]/page.tsx: detail with actions; can create Tasks via POST `/api/admin/tasks`.
  - new/page.tsx: creation flow.
- Users
  - page.tsx: loads `/api/admin/stats/users` and `/api/admin/users`; PATCH `/api/admin/users/:id` to update role/status/profile; uses `usePermissions` (from `src/lib/use-permissions.ts`).
- Settings
  - page.tsx: displays env flags (NETLIFY_DATABASE_URL, NEXTAUTH_URL, NEXTAUTH_SECRET).
  - currencies/page.tsx: currency admin (paired with API under admin/currencies/*).
- Tasks (see separate audit) ✅
  - page.tsx orchestrates: TaskProvider + FilterProvider + ViewProvider + NotificationProvider + views + analytics + modals.
  - Components: TaskCard, TaskList/Board/Calendar/Table/Gantt, TaskForm, Filters/Toolbar/Header/Stats, Modals, Widgets.
- Newsletter, Posts, Services, Team: standard admin pages joining their APIs.

Unused/duplicate/placeholder notes
- `tasks/hooks/useTaskActions.ts`, `useTaskBulkActions.ts`, `useTaskFilters.ts` are not referenced by main page/components (Functionality exists in TaskProvider/BulkActionsPanel). ⚠️
- `tasks/data/*.json` and comments/templates/notifications APIs use filesystem storage. ⚠️ Consider DB/CMS migration.
- Dashboard uses large mock fallback data. ⚠️ Replace with real API or guard by environment.

## Data Flow Architecture
- UI → Hooks/Providers → API Routes → Database
  - Shared fetch util: `src/lib/api.ts::apiFetch` with retries and timeout.
  - Auth: `src/lib/auth.ts` NextAuth; session gating via `getServerSession(authOptions)` across admin APIs.
  - DB: `src/lib/prisma.ts` lazy client using `NETLIFY_DATABASE_URL` (supports neon:// → postgresql://). Prisma used in admin tasks, analytics, users, bookings, currencies, etc.
  - Realtime: Tasks use SSE via `src/app/api/admin/tasks/stream` + `src/lib/realtime.ts` (in‑memory) ⚠️ single‑process only.
- Cross‑module
  - Bookings → Tasks: booking detail can create a Task assigned to related user.
  - Users ↔ Bookings/Tasks: assignee relations use User IDs; team members feed assignee selectors.

### Custom Hooks
- Task module hooks (scoped)
  - `useTasks()` (TaskProvider) → { tasks, loading, error, refresh, createTask, updateTask, deleteTask } — uses SSE and optimistic updates.
  - `useTaskPermissions()` → role-based { canCreate, canEdit, canDelete, canBulk, canAssign, canComment } via NextAuth.
  - `useTaskAnalytics()` → GET `/api/admin/tasks/analytics` with { loading, error, stats, refresh }.
  - `useTaskBulkActions()` ⚠️ thin wrapper over `/api/admin/tasks/bulk` (currently unused where panel calls API directly).
  - `useTaskFilters()` ⚠️ filteredTasks from utils (unused with FilterProvider).
- Global admin
  - `usePermissions()` (src/lib/use-permissions.ts) → role-based booleans backed by `src/lib/rbac.ts`.

Example
```ts
// Use admin user controls
const perms = usePermissions()
if (perms.canManageUsers) await apiFetch(`/api/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify({ role: 'STAFF' }) })
```

## API Architecture
Representative endpoints and payloads:
- Users
  - GET `/api/admin/users` → { users: UserItem[] }
  - PATCH `/api/admin/users/:id` → body supports fields like { role?: 'ADMIN'|'STAFF'|'CLIENT', status?: 'ACTIVE'|'INACTIVE'|'SUSPENDED', ...profile }
  - GET `/api/admin/stats/users` → aggregate counts and topUsers
- Bookings
  - GET `/api/admin/bookings` → { bookings: [...] }
  - POST `/api/admin/bookings` → create booking
  - PATCH `/api/admin/bookings` → { action: 'confirm'|'cancel'|'complete', bookingIds: string[] }
  - DELETE `/api/admin/bookings` → bulk delete
- Tasks (full details in task audit)
  - List/Create: GET/POST `/api/admin/tasks`
  - Read/Update/Delete: GET/PATCH/DELETE `/api/admin/tasks/:id`
  - Status: PATCH `/api/admin/tasks/:id/status` { status }
  - Assign: POST `/api/admin/tasks/:id/assign` { assigneeId }
  - Bulk: POST `/api/admin/tasks/bulk` { action, taskIds, updates? }
  - Analytics, Export, Templates, Notifications, Comments, Stream
- Currencies
  - GET `/api/admin/currencies`, POST create, PATCH `/[code]` update, POST `/overrides`, POST `/refresh`, GET `/export`
- Team Members
  - GET/POST `/api/admin/team-members`, GET/PUT/DELETE `/api/admin/team-members/:id`
- Analytics/System/Activity
  - GET `/api/admin/analytics`, `/system/health`, `/perf-metrics`, `/health-history`, `/activity`

All admin routes typically authorize via `getServerSession(authOptions)` and often rely on Prisma. Zod validation is used in task routes and some others for payload safety.

```ts
// Example: Tasks create (excerpt)
export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !['ADMIN','STAFF'].includes(session.user.role as string)) return NextResponse.json({ error:'Unauthorized' }, { status: 401 })
  const parsed = CreateSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error:'Invalid payload' }, { status: 400 })
  const created = await prisma.task.create({ data: {/*...*/}, include: { assignee: { select: { id:true, name:true, email:true } } } })
  return NextResponse.json(created, { status: 201 })
}
```

## Integration Points
- Environment variables
  - NETLIFY_DATABASE_URL (primary DB URL used by Prisma) — neon:// scheme auto‑translated.
  - NEXTAUTH_URL, NEXTAUTH_SECRET (auth). Others like NEXT_PUBLIC_API_BASE used by apiFetch when present.
- External services / MCP
  - Prisma ORM with Neon Postgres (recommended). Connect via MCP: Open MCP popover → Connect to Neon.
  - NextAuth for authentication; PrismaAdapter enabled when DB present.
  - Netlify for hosting/CI (repo contains netlify config). Open MCP popover → Connect to Netlify.
  - Optional: Sentry for error monitoring; Builder CMS for content/templates; Zapier for admin automations; Notion/Linear for docs/PM.
- Shared libraries
  - `src/lib/prisma.ts` (lazy Prisma), `src/lib/auth.ts` (NextAuth config), `src/lib/realtime.ts` (in‑memory pub/sub), `src/lib/api.ts` (fetch with retries), `src/lib/rbac.ts` + `src/lib/use-permissions.ts` (permissions model).

## Cleanup Notes (optional)
- Replace file‑based storage ⚠️
  - Tasks: comments/templates/notifications → migrate to DB (Prisma models) or Builder CMS; remove JSON files in `src/app/admin/tasks/data`.
- Realtime ⚠️
  - Tasks SSE uses in‑memory broadcaster; not multi‑instance safe. Move to durable transport (Postgres LISTEN/NOTIFY, Redis, Pusher, Ably) or polling.
- Hooks consolidation ⚠️
  - Remove/merge unused `useTaskActions`, `useTaskBulkActions`, `useTaskFilters`.
- Standardize validation
  - Adopt Zod on all write routes (users/bookings/services) to match tasks module; align enum naming (UI vs DB).
- Env naming
  - Project uses `NETLIFY_DATABASE_URL` (not `DATABASE_URL`). Ensure infra docs and Prisma config align across environments.
- Dashboard data
  - Minimize mock data; fetch from `/api/admin/analytics` and guard UI on missing data.

```ts
// Example: role/permission check pattern
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
const session = await getServerSession(authOptions)
if (!session?.user || !['ADMIN','STAFF'].includes(session.user.role as string)) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```
