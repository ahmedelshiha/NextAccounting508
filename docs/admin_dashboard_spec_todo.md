

## 2025-10-04 Booking Settings Update
- Completed: Added zod schemas and request validation to booking settings endpoints (steps, business-hours, payment-methods).
  - Why: Ensure consistent, structured validation at the API boundary to provide clear 400 responses and avoid runtime errors during import/create operations.
  - What: Added src/schemas/booking-settings.schemas.ts and updated the following routes to validate payloads and return structured error details on failure:
    - src/app/api/admin/booking-settings/steps/route.ts
    - src/app/api/admin/booking-settings/business-hours/route.ts
    - src/app/api/admin/booking-settings/payment-methods/route.ts
  - Notes: All update routes already included audit logging (logAudit). Validation is non-breaking for existing valid payloads. Unit/integration tests cover the main flows; consider adding negative tests for malformed payloads in CI.
  - Next steps:
    - Add unit tests that assert 400 responses for malformed payloads (optional, low effort).
    - Run pnpm test and pnpm typecheck in CI to verify no type regressions.
