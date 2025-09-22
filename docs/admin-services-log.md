

## [2025-09-23] Phase 3.3 – Enhanced Bulk Operations
What I changed:
- Extended bulk actions to support `clone` and `settings-update`.
- `clone`: clones each selected service as a DRAFT, returns createdIds and per-item errors; attempts best-effort rollback (deletes created clones) if any clone operations fail.
- `settings-update`: accepts a settings object and shallow-merges it into each target service's `serviceSettings` via `bulkUpdateServiceSettings`, returns per-item errors if any.
- Bulk API returns 207 Multi-Status when some items fail, and includes detailed per-item errors for client handling.

Why:
- Allow admins to perform operational changes at scale (clone demos, apply settings changes) with clear visibility into successes and failures and safer cleanup when partial failures occur.

Next steps:
- Add client-side support in BulkActionsPanel to show per-item progress, retry failed items, and surface 207 responses.
- Add tests for bulk clone rollback behavior and settings-update merge semantics.
