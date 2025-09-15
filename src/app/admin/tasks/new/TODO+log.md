# TODO+log — Admin New Task Page

- [x] Replace page with CreateTaskPage UI skeleton and wrapper
- [x] Wire real API data loaders for assignees, clients, bookings, dependencies
- [x] Implement save flow to POST /api/admin/tasks (map priority, dueAt, assigneeId)
- [x] Add graceful fallbacks for API errors (no crash, empty lists)
- [ ] Validate and polish interactions (final QA pass)

## Change Log
- Replaced src/app/admin/tasks/new/page.tsx with client-side CreateTaskPage using Tailwind classes consistent with existing styles.
- Implemented data hooks calling:
  - GET /api/admin/team-members → assignees list
  - GET /api/admin/users → filtered CLIENT users, derived tier from totalBookings
  - GET /api/admin/bookings?limit=50 → mapped to BookingItem
  - GET /api/admin/tasks?limit=200 → dependencies source
- Save now POSTs to /api/admin/tasks with mapped fields. Critical/High both map to HIGH to match DB enums.
- Added defensive parsing and AbortController to avoid fetch crashes in embeds/proxy.
