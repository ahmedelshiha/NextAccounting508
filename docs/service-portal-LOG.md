## 2025-09-21 — Legacy /api/bookings POST conflict passthrough & tests

Summary
- Mapped legacy /api/bookings POST payloads to the unified booking shape (isBooking, scheduledAt, duration, client details) so downstream conflict detection triggers.
- Added tests to ensure 409 with error.code=CONFLICT is surfaced for both admin and portal flows through the legacy endpoint.

Why
- Ensures backward-compatible clients using /api/bookings receive correct conflict semantics without migrating immediately.
- Aligns with deprecation plan while preserving correctness and observability.

Files Changed
- src/app/api/bookings/route.ts (mapping improvements: isBooking normalization, team member assignment for admin)
- tests/bookings.post-conflict-409.test.ts (new)

Next Steps
- Proceed with remaining P0 (schema deploy) and P1 route/unit tests for availability and reschedule conflict paths.
