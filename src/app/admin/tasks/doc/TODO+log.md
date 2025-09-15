# TODO+log — Task Management System Audit

Owner: admin
Scope: End-to-end task system (API, UI, dashboard integration)

## TODO
- [x] Implement /api/admin/tasks/statistics for dashboard KPIs (recent, urgent, performance)
- [x] Extend GET /api/admin/tasks with basic filtering (status, priority, assignee) and pagination metadata
- [ ] Align dashboard widgets to consume statistics endpoint (hook or adapter)
- [ ] Add lightweight auth/ACL checks to tasks APIs (admin/staff only) respecting existing auth middleware
- [ ] Add error boundaries around task pages/widgets
- [ ] Add minimal unit tests for new statistics endpoint
- [ ] Document API contracts for tasks (list, create, bulk, statistics)

## Change Log
- 2025-09-15: Added GET /api/admin/tasks/statistics (src/app/api/admin/tasks/statistics/route.ts)
  - Returns totals, overdue/dueToday/dueSoon, byPriority, byAssignee
  - Includes recentTasks and urgentTasks arrays for dashboard feeds
  - Adds performance block with onTimeCompletion and averageTaskAge
- 2025-09-15: Enhanced GET /api/admin/tasks (src/app/api/admin/tasks/route.ts)
  - Added filters: status, priority, assigneeId, search
  - Added pagination via page+limit (response remains array for backward compatibility)
- 2025-09-15: Added dashboard integration hook (src/app/admin/tasks/hooks/useDashboardTasks.ts)
  - Consumes /api/admin/tasks/statistics
  - Provides quick task creation and status updates
- 2025-09-15: Hardened POST /api/admin/tasks validation/coercion
  - Whitelist and map priority/status values
  - Safe date parsing for dueAt
- 2025-09-15: apiFetch fallback returns valid JSON body to avoid JSON.parse errors on network failures
