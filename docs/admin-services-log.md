
## [2025-09-25] Phase 7 — Tests & QA
What I added:
- ETag/304 tests for admin services list and single routes (tests/admin-services.etag.test.ts).
- Featured permission enforcement tests (tests/admin-services.permissions.test.ts).
- ServicesService caching and events tests (tests/services.caching-events.test.ts).
- Component smoke tests for ServiceForm, BulkActionsPanel, ServicesAnalytics (tests/admin-services.components.test.ts).

Why:
- Validate caching headers, RBAC restrictions, cache-layer behavior, and basic component render coverage.

Next steps:
- Expand component tests for interactions and edge cases.
