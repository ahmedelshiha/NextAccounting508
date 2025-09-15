# Task Management Module Audit

## Overview
- Purpose: Internal Admin Dashboard module for creating, tracking, and managing operational tasks across bookings, clients, finance, and compliance.
- High‑level features: CRUD, bulk actions, status updates, assignments, comments, notifications, analytics, multiple views (list/board/calendar/table/gantt), export (CSV), templates, SSE updates, filtering/sorting.

## Complete Current Directory Structure

### src/app/admin/tasks
```
src/app/admin/tasks/
├─ TODO+log.md ⚠️ (dev notes)
├─ page.tsx ✅ (main Tasks page; composes providers, views, modals, analytics)
├─ data/
│  ├─ notifications.json ⚠️ (file-based settings storage)
│  └─ templates.json ⚠️ (file-based templates storage)
├─ hooks/
│  ├─ useTaskActions.ts ⚠️ (unused utility wrapper; overlaps with TaskProvider methods)
│  ├─ useTaskAnalytics.ts ✅ (fetches analytics)
│  ├─ useTaskBulkActions.ts ⚠️ (unused; BulkActionsPanel calls API directly)
│  ├─ useTaskFilters.ts ⚠️ (unused; FilterProvider handles filtering)
│  └─ useTaskPermissions.tsx ✅ (role-based permissions via NextAuth)
├─ new/
│  ├─ TODO+log.md ⚠️ (dev notes)
│  └─ page.tsx ✅ (new task flow)
├─ providers/
│  └─ TaskProvider.tsx ✅ (core data provider, SSE, optimistic updates)
├─ schemas/
│  └─ task.ts ✅ (zod form schema for TaskForm)
├─ tests/ ✅ (unit tests for components/APIs/providers)
│  ├─ *.test.tsx
│  ├─ *.test.ts
│  └─ test-setup.ts
├─ components/
│  ├─ analytics/
│  │  ├─ AdvancedAnalytics.tsx ✅
│  │  └─ TaskAnalytics.tsx ✅
│  ├─ bulk/
│  │  └─ BulkActionsPanel.tsx ✅
│  ├─ cards/
│  │  ├─ TaskCard.tsx ✅
│  │  ├─ TaskCardActions.tsx ✅
│  │  ├─ TaskCardContent.tsx ✅
│  │  ├─ TaskCardFooter.tsx ✅
│  │  ├─ TaskCardHeader.tsx ✅
│  │  ├─ TaskCardSkeleton.tsx ✅
│  │  └─ index.ts ✅
│  ├─ comments/
│  │  └─ CommentsPanel.tsx ✅
│  ├─ export/
│  │  └─ ExportPanel.tsx ✅
│  ├─ filters/
│  │  └─ TaskFiltersPanel.tsx ✅
���  ├─ forms/
│  │  └─ TaskForm.tsx ✅
│  ├─ layout/
│  │  ├─ TasksHeader.tsx ✅
│  │  ├─ TasksStats.tsx ✅
│  │  ├─ TasksToolbar.tsx ✅
│  │  └─ index.ts ✅
│  ├─ modals/
│  │  ├─ TaskDeleteModal.tsx ✅
│  │  ├─ TaskDetailsModal.tsx ✅
│  │  └─ TaskEditModal.tsx ✅
│  ├─ providers/
│  │  ├─ FilterProvider.tsx ✅
│  │  ├─ NotificationProvider.tsx ✅
│  │  ├─ ViewProvider.tsx ✅
│  │  └─ index.ts ✅
│  ├─ views/
│  │  ├─ TaskBoardView.tsx ✅
│  │  ├─ TaskCalendarView.tsx ✅
│  │  ├─ TaskGanttView.tsx ✅
│  │  ├─ TaskListView.tsx ✅
│  │  ├─ TaskTableView.tsx ✅
│  │  └─ index.ts ✅
│  └─ widgets/
│     ├─ TaskAssignee.tsx ✅
│     ├─ TaskCategory.tsx ✅
│     ├─ TaskDependencies.tsx ✅
│     ├─ TaskDueDate.tsx ✅
│     ├─ TaskMetrics.tsx ✅
│     ├─ TaskPriority.tsx ✅
│     ├─ TaskProgress.tsx ✅
│     ├─ TaskReminders.tsx ✅
│     ├─ TaskStatus.tsx ✅
│     ├─ TaskTags.tsx ✅
│     ├─ TaskWatchers.tsx ✅
│     └─ index.ts ✅
├─ styles/tasks/
│  ├─ task-animations.css ✅
│  ├─ task-board.css ✅
│  ├─ task-calendar.css ✅
│  ├─ task-cards.css ✅
│  └─ tokens.css ✅
```

Note: src/styles/tasks not present. Styles live at src/app/admin/tasks/styles/tasks.

### src/app/api/admin/tasks
```
src/app/api/admin/tasks/
├─ route.ts ✅ (GET list, POST create)
├─ [id]/
│  └─ route.ts ✅ (GET one, PATCH update, DELETE)
├─ [id]/assign/route.ts ✅ (POST assign assigneeId)
├─ [id]/comments/route.ts ⚠️ (GET/POST comments; file-based JSON store)
├─ [id]/status/route.ts ✅ (PATCH status)
├─ analytics/route.ts ✅ (GET aggregated analytics)
├─ bulk/route.ts ✅ (POST bulk delete/update/assign)
├─ export/route.ts ✅ (GET CSV export)
├─ notifications/route.ts ⚠️ (GET/PATCH notifications settings; file-based JSON)
├─ stream/route.ts ⚠️ (GET Server-Sent Events; in-process only)
└─ templates/route.ts ⚠️ (GET/POST/PATCH/DELETE; file-based JSON)
```

### src/lib/tasks (shared)
```
src/lib/tasks/
├─ adapters.ts ✅ (UI⇄API mapping helpers)
├─ types.ts ✅ (shared types/constants)
└─ utils.ts ✅ (filter/sort/statistics helpers)
```

## Component Architecture Details
- page.tsx: Orchestrates providers (TaskProvider, FilterProvider, ViewProvider, NotificationProvider), renders views, analytics, modals, export panel, bulk actions.
- Forms
  - TaskForm: zod-resolved form; used by TaskEditModal and new/page.tsx.
- Cards
  - TaskCard(+Header/Content/Footer/Actions/Skeleton): Presentational, used by list/board/table views.
- Views
  - TaskListView, TaskBoardView, TaskCalendarView, TaskTableView, TaskGanttView: Alternate task presentations; imported in page.tsx.
- Modals
  - TaskEditModal, TaskDetailsModal (embeds CommentsPanel, TaskWatchers, TaskReminders), TaskDeleteModal.
- Analytics
  - TaskAnalytics, AdvancedAnalytics: Consume useTaskAnalytics.
- Filters/Toolbar/Layout
  - TasksHeader, TasksToolbar, TasksStats; TaskFiltersPanel toggled from toolbar.
- Widgets
  - Assignee, Category, Dependencies, DueDate, Metrics, Priority, Progress, Reminders, Status, Tags, Watchers.
- Providers
  - TaskProvider: Core data layer; wraps children; exposes tasks, create/update/delete, refresh; manages SSE.
  - FilterProvider: Holds TaskFilters and filteredTasks; used by page.
  - ViewProvider: Current view mode state.
  - NotificationProvider: Simple toast-like messages.

Unused/duplicate notes
- useTaskActions.ts ⚠️ and useTaskBulkActions.ts ⚠️ are not referenced by page or components; functionality overlaps with TaskProvider and BulkActionsPanel.
- useTaskFilters.ts ⚠️ unused (FilterProvider supplies equivalent behavior).

## Data Flow Architecture
- UI layer
  - page.tsx uses TaskProvider -> exposes tasks and mutation methods; FilterProvider computes filteredTasks; ViewProvider selects view; components render tasks and trigger actions.
- Network/state
  - Initial fetch: GET /api/admin/tasks?limit=200 in TaskProvider.
  - Live updates: EventSource('/api/admin/tasks/stream') subscribes to in-process broadcaster; TaskProvider applies task.created/updated/deleted events.
  - Mutations: TaskProvider methods call API (POST/PATCH/DELETE) with optimistic updates and enum mapping.
- API layer
  - Validates with zod, authorizes via getServerSession(authOptions) requiring role ADMIN or STAFF.
  - Persists via Prisma client (src/app/lib/prisma.ts) to tasks table; comments/templates/notifications use fs JSON files ⚠️.
- Database
  - Prisma models: task with enums {priority: LOW|MEDIUM|HIGH, status: OPEN|IN_PROGRESS|DONE}, relations to User (assignee). Analytics also references complianceRecord.
- Libraries
  - Prisma: DB ORM used in all DB-backed routes.
  - Zod: request validation (create/update/bulk) and TaskForm client schema.
  - NextAuth: getServerSession(authOptions) to gate all admin task routes.
- State management
  - React Context providers (TaskProvider, FilterProvider, ViewProvider); optimistic updates in TaskProvider; SSE for pseudo-realtime.

### Custom Hooks
- useTaskPermissions
  - Input: none; depends on next-auth useSession; Output: { canCreate, canEdit, canDelete, canBulk, canAssign, canComment, hasPermission, role }.
- useTaskAnalytics
  - Input: none; GET /api/admin/tasks/analytics; Output: { loading, error, stats, refresh }.
- useTaskActions ⚠️ (unused)
  - Methods: create(input), update(id, updates), remove(id), assign(id, assigneeId), setStatus(id, status).
- useTaskBulkActions ⚠️ (unused)
  - Method: bulk(action, taskIds, updates?) -> POST /api/admin/tasks/bulk.
- useTaskFilters ⚠️ (unused)
  - Input: tasks, filters; Output: { filteredTasks }.

Example usage
```ts
// Update a task status from UI (TaskProvider mapping UI→DB enums)
const { updateTask } = useTasks()
await updateTask(task.id, { status: 'in_progress' })
```

## API Architecture
- /api/admin/tasks
  - GET: List tasks with query params: limit, offset, status[], priority[], assigneeId, q, dueFrom, dueTo, orderBy(createdAt|updatedAt|dueAt), order(asc|desc)
  - POST: Create
    - Request: { title: string; priority?: 'LOW'|'MEDIUM'|'HIGH'|'low'|'medium'|'high'|'critical'; status?: 'OPEN'|'IN_PROGRESS'|'DONE'|'pending'|'in_progress'|'completed'; dueAt?: ISO|null; assigneeId?: string|null }
    - Response: Task row including assignee {id,name,email}
- /api/admin/tasks/[id]
  - GET: Fetch one
  - PATCH: Update
    - Request: { title?, priority?, status?, dueAt?: ISO|null, assigneeId?: string|null }
  - DELETE: Remove
- /api/admin/tasks/[id]/assign
  - POST: { assigneeId: string|null } → returns updated task
- /api/admin/tasks/[id]/status
  - PATCH: { status: 'OPEN'|'IN_PROGRESS'|'DONE'|'pending'|'in_progress'|'completed' }
- /api/admin/tasks/bulk
  - POST: { action: 'delete'|'update'|'assign', taskIds: string[], updates?: { status?: string, assigneeId?: string|null } }
- /api/admin/tasks/analytics
  - GET: { total, completed, byStatus, byPriority, avgAgeDays, compliance: {...} }
- /api/admin/tasks/export
  - GET: CSV stream; filters: status[], priority[]; headers: id,title,priority,status,assignee,dueAt,createdAt,updatedAt
- /api/admin/tasks/templates ⚠️ file-based
  - GET: list; POST: create { name, content }; PATCH: update; DELETE: ?id=tmpl_id
- /api/admin/tasks/notifications ⚠️ file-based
  - GET/PATCH: notification settings
- /api/admin/tasks/[id]/comments ⚠️ file-based
  - GET: list; POST: create { content, authorId?, authorName?, attachments?, parentId? }
- /api/admin/tasks/stream ⚠️ SSE
  - GET: text/event-stream; events: task.created|task.updated|task.deleted|ping

Type hints
```ts
// UI⇄API mapping (src/lib/tasks/adapters.ts)
export type ApiTaskPriority = 'LOW'|'MEDIUM'|'HIGH'
export type ApiTaskStatus = 'OPEN'|'IN_PROGRESS'|'DONE'
export interface ApiTask { id: string; title: string; dueAt: string|null; priority: ApiTaskPriority; status: ApiTaskStatus; assigneeId: string|null; createdAt: string; updatedAt: string }
```

## Integration Points
- Environment variables
  - NETLIFY_DATABASE_URL (used by Prisma client in src/app/lib/prisma.ts). If starts with neon:// it is translated to postgresql://.
  - Typical NextAuth vars supported by Next.js but not required in code here: NEXTAUTH_SECRET, NEXTAUTH_URL.
- Services/MCP
  - Prisma + Neon/Postgres for DB. NextAuth for auth with PrismaAdapter when DB present. SSE uses in-process broadcaster (src/lib/realtime.ts) only.
  - For production hardening, consider:
    - Neon for Postgres hosting. You can connect it via MCP: Open MCP popover → Connect to Neon.
    - Netlify for hosting/CI. Open MCP popover → Connect to Netlify.
    - Sentry for error monitoring of API routes/components. Open MCP popover → Connect to Sentry.
    - Builder CMS for content/templates if moving templates off filesystem. Open MCP popover → Connect to Builder.io.

- Cross‑module connections
  - Bookings detail can create a task via POST /api/admin/tasks (see AdminBookingDetailPage).
  - Users/team modules supply assignees via User relation (assigneeId).

## Cleanup Notes (optional)
- Replace file-based storage ⚠️
  - Comments: src/app/api/admin/tasks/[id]/comments → move to DB table (taskComment) with Prisma.
  - Notifications/templates: move to DB or CMS; remove JSON files in src/app/admin/tasks/data.
- Realtime ⚠️
  - src/lib/realtime.ts and stream route use in-memory subscribers; not reliable across server instances. Replace with durable pub/sub (e.g., Postgres LISTEN/NOTIFY, Pusher, Ably, or Redis) or skip SSE and poll.
- Hooks consolidation ⚠️
  - Remove or integrate unused hooks: useTaskActions.ts, useTaskBulkActions.ts, useTaskFilters.ts.
- Enum alignment
  - UI statuses include 'review'|'blocked' but API/DB only support OPEN|IN_PROGRESS|DONE. Ensure mapping or extend DB enums.
- Env consistency
  - Project uses NETLIFY_DATABASE_URL, not DATABASE_URL. Document this and update infra accordingly.

```ts
// Example: TaskProvider method signatures
interface TaskContextValue {
  tasks: Task[]
  loading: boolean
  error: string | null
  refresh(): Promise<void>
  createTask(input: any): Promise<Task | null>
  updateTask(id: string, updates: any): Promise<Task | null>
  deleteTask(id: string): Promise<boolean>
}
```
