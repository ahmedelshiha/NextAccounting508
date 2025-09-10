# Admin User Management Page

Location: src/app/admin/users/page.tsx

## Overview
A professional, role-aware admin interface to manage users, surface KPIs, and review recent audit activity. It replaces the prior implementation and is optimized for clarity, performance, and reliability.

## Key Features
- KPI cards: total users, clients, staff, admins, new this month (with growth if available).
- Top Clients list: shows most active clients by bookings/bookingsCount.
- User Directory: search (name/email), filter by role, view details dialog, change role with optimistic updates and rollback on failure.
- Recent Admin Activity: audit events list from the AUDIT channel.
- Refresh and CSV export (users) actions.

## Permissions & Security
- Uses usePermissions() (src/lib/use-permissions.ts) which delegates to hasPermission in the RBAC layer.
- UI for role changes is shown only when perms.canManageUsers is true.
- All API routes require authenticated session and role checks on the server.

## Data Flow
State:
- stats: UserStats | null
- users: UserItem[]
- activity: HealthLog[]
- UI: loading flags, refreshing/exporting, search, roleFilter, selected user, dialog visibility, error message.

Loading:
- On mount, loads stats, users, and activity in parallel.
- Manual refresh re-runs all loaders concurrently.

Optimistic Role Updates:
1) Update UI immediately.
2) PATCH server. On error, rollback to original and surface error.
3) On success, refresh activity to capture audit.

## API Contracts
- GET /api/admin/stats/users
  - Response fields used: total, clients, staff, admins, newThisMonth, growth, topUsers[] where topUsers items may contain bookings or bookingsCount.
- GET /api/admin/users
  - Response: { users: Array<{ id, name, email, role, createdAt }> }
- PATCH /api/admin/users/{id}
  - Body: { role: 'ADMIN' | 'STAFF' | 'CLIENT' }
  - Response: { user: { id, name, email, role, createdAt } }
- GET /api/admin/activity?type=AUDIT&limit=20
  - Response: Array<{ id, checkedAt, message }>
  - message is parsed as JSON when possible to extract action and targetId.
- GET /api/admin/export?entity=users&format=csv
  - Downloads CSV containing user fields.

Fallbacks & Env
- When NETLIFY_DATABASE_URL is not configured, the /api/admin/users and /api/admin/activity endpoints provide mock data; stats endpoint requires DB and returns computed metrics when available.

## UX Details
- Search: matches name or email (case-insensitive).
- Role filter: ALL | ADMIN | STAFF | CLIENT.
- User details dialog: name, email, role, joined date.
- Skeletons for stats, users, and activity.
- Subtle errors shown as a red banner; UI remains usable with partial data.

## Performance
- useMemo for filtered/sorted users.
- useCallback for loaders and mutators.
- Lightweight list rendering with simple cards.

## Extensibility
- Add status filters or pagination by extending filteredUsers computation and backend queries.
- Add bulk actions by tracking selected IDs and invoking a batch endpoint.
- Add more analytics cards by reading expanded stats fields (e.g., retention, avg session duration) without breaking existing UI.

## Testing Checklist
- AuthZ: Non-admins cannot see role change control; server rejects unauthorized calls.
- Loading: Skeletons appear then resolve correctly.
- Search/Filter: Correct subset rendered; empty state is clear.
- Role Update: Optimistic change; rollback on server error; activity shows audit event after success.
- Export: CSV downloaded with correct filename and content type.
- Activity: Gracefully handles non-JSON message values.

## Release Notes
- New page implemented in src/app/admin/users/page.tsx.
- Old page archived at backup/retired-admin-users-page.tsx.
- Endpoints normalized to match existing server routes and export API conventions.
