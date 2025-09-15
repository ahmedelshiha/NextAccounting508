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
