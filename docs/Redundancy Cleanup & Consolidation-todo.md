## ✅ Completed (append)
- [x] Standardized session retrieval in api-wrapper to use getSessionOrBypass from '@/lib/auth'
  - **Why**: unifies session logic so tests can mock a single module (`@/lib/auth`) instead of both `next-auth` and `next-auth/next`.
  - **Impact**: reduces mocking inconsistencies; simplifies tenant-context behavior during tests.

## 🔧 Next verification step
- Run a focused subset of tenant-related tests to validate behavior: tests/integration/tenant-mismatch.security.test.ts and related suites.
- If tests still fail due to missing mocks, update test helpers to mock '@/lib/auth' instead of 'next-auth'.

## 🚨 Failing Tests Inventory (discovered from recent runs)
The following test files produced failures during recent test runs. Each item below is tracked as a TODO with remediation details so we can triage and fix them one-by-one or in batches.

- [ ] tests/admin/layout/AdminSidebar.test.tsx
  - Description: UI/layout unit tests for AdminSidebar failing due to DOM/testing-library helpers and permission mocks.
  - Prerequisites: Ensure vitest DOM helpers and permission mocks (via vitest.setup.ts) are correctly configured.
  - Expected output: All AdminSidebar tests pass with correct ARIA roles, labels, and rendering.
  - Verification: Run `pnpm test -- tests/admin/layout/AdminSidebar.test.tsx` and ensure all tests pass.

- [ ] tests/admin/layout/AdminDashboardLayout.test.tsx
  - Description: Admin dashboard layout tests failing due to rendering issues and missing text assertions.
  - Prerequisites: Confirm global test setup includes necessary DOM polyfills and mocked modules.
  - Expected output: Layout renders skip link and debug info as expected.
  - Verification: Single-file run passes.

- [ ] tests/admin-services.route.test.ts
  - Description: API route tests for admin/services are returning 401 where 200/201 expected (authentication/authorization mismatch).
  - Prerequisites: Verify centralized auth mock (`@/lib/auth`) and API wrapper session flow.
  - Expected output: Routes authenticate as test-provided session and return expected 200/201 responses.
  - Verification: Re-run file-level tests after fixes.

- [ ] tests/e2e/admin-services.crud.smoke.test.ts
  - Description: End-to-end smoke failing with unexpected 403/201 statuses; may be caused by auth or permission drift.
  - Prerequisites: Stable API route behavior and role permissions; DB seeded test data.
  - Expected output: CRUD workflow completes with proper HTTP codes and audit logs.
  - Verification: e2e test passes.

- [ ] tests/booking-settings.service.test.ts
  - Description: Booking settings service unit tests failing complaining about missing tenantId and booking settings not found.
  - Prerequisites: Tenant context mocking and DB seed fixtures available to tests.
  - Expected output: Service creates defaults and updates settings correctly.
  - Verification: File-level tests pass.

- [ ] tests/booking-settings.api.test.ts
  - Description: API tests for booking-settings returning 500/400 where 200 expected.
  - Prerequisites: API-wrapper session handling and tenant utilities functioning under test mocks.
  - Expected output: Valid GET/PUT/EXPORT/IMPORT routes return 200 responses.
  - Verification: File-level tests pass.

- [ ] tests/integration/tenant-mismatch.security.test.ts
  - Description: Integration tests validating tenant cookie/signature handling and header forgery protections.
  - Prerequisites: tenantContext behavior (AsyncLocalStorage) and tenant cookie verification logic robust under tests.
  - Expected output: Routes return 403 on invalid tenant_sig and ignore forged x-tenant-id headers.
  - Verification: File-level tests pass.

- [ ] tests/integration/tenant-mismatch.portal.security.test.ts
  - Description: Similar portal-specific tenant mismatch tests failing due to tenant context/DB issues.
  - Prerequisites: dev-fallbacks seeded and tenant mocks present.
  - Expected output: Portal routes enforce tenant isolation.
  - Verification: File-level tests pass.

- [ ] tests/integration/prisma-tenant-guard.test.ts
  - Description: Prisma tenant guard tests failing (tenant injection/scoping mismatches)
  - Prerequisites: Prisma test DB configured and tenant middleware behavior consistent.
  - Expected output: Prisma guard throws or injects tenantId as expected in various scenarios.
  - Verification: Tests pass.

- [ ] tests/admin-communication-settings.api.test.ts
  - Description: Admin communication settings API tests failing with 500/401 due to session/permission mocks.
  - Prerequisites: Auth/permission mocks and API wrapper checks.
  - Expected output: GET denies unauthenticated; PUT enforces permissions properly.
  - Verification: File-level tests pass.

- [ ] tests/portal-bookings-cancel.test.ts
  - Description: Portal booking cancel flow failing (404 vs 200/403 expectations)
  - Prerequisites: Booking fixtures and tenant ownership logic in tests.
  - Expected output: Owner can cancel; non-owner forbidden.
  - Verification: File-level tests pass.

- [ ] tests/bookings.post-conflict-409.test.ts
  - Description: Conflict handling tests returning 500 instead of 409 — likely error mapping changed.
  - Prerequisites: Ensure conflict detection path returns well-formed responses.
  - Expected output: API surfaces 409 on conflict.
  - Verification: File-level tests pass.

- [ ] tests/admin-service-requests.filters.test.ts
  - Description: Filter tests failing due to schema validation or query parsing changes.
  - Prerequisites: list-query schema and parser behavior stable in test env.
  - Expected output: Filtered results match expected ordering and payloads.
  - Verification: File-level tests pass.

- [ ] tests/components/analytics-settings.export-import.ui.test.tsx
  - Description: UI test failing with `render is not a function` — testing-library/react setup or import mismatch.
  - Prerequisites: Ensure test env has proper DOM render helpers and React global exposure.
  - Expected output: Component renders and posts import successfully.
  - Verification: Test passes locally.

- [ ] tests/components/communication-settings.export-import.ui.test.tsx
  - Description: Similar UI export/import render failure.
  - Prerequisites: Testing-library setup and file input polyfill.
  - Expected output: UI interaction flow works.
  - Verification: File-level tests pass.

- [ ] tests/status-transitions.test.ts
  - Description: Service request status transition tests returning 401 vs expected 400/200 — indicates auth/permission mismatch.
  - Prerequisites: Proper RBAC mocks and API-wrapper auth behavior.
  - Expected output: Status transitions enforce validation and RBAC correctly.
  - Verification: File-level tests pass.

- [ ] tests/auto-assignment.test.ts
  - Description: Auto-assignment logic unit tests failing to pick correct team members.
  - Prerequisites: Test fixtures for team members/skills and workload.
  - Expected output: Assignment chooses expected team member ids.
  - Verification: File-level tests pass.

- [ ] tests/admin-integration-hub.api.test.ts
  - Description: Integration hub API tests failing with 401 vs expected 200 — likely permission/session mocks.
  - Prerequisites: Mocked auth and masked secrets logic.
  - Expected output: ADMIN calls accepted and secrets masked on response.
  - Verification: File-level tests pass.

- [ ] tests/admin-service-requests.export.test.ts
  - Description: Admin export tests failing (401 vs 200) — permission issues.
  - Prerequisites: Ensure admin session and permission checks are satisfied in tests.
  - Expected output: Export returns CSV and proper order/headers.
  - Verification: File-level tests pass.

- [ ] tests/auth.session-callback.test.ts
  - Description: Auth session callback tests failing (undefined exports) due to changed auth module surface.
  - Prerequisites: verify auth module exports (getSessionOrBypass/getServerSession/authOptions) are present for tests.
  - Expected output: Callbacks populate session and invalidate tokens appropriately.
  - Verification: File-level tests pass.

- [ ] tests/portal-comments.route.test.ts
  - Description: Portal comments route tests returning 401 where 201/400 expected; auth fallbacks not applied.
  - Prerequisites: Ensure header/session mocks and withTenantContext behavior covers portal routes.
  - Expected output: POST creates comments and accepts attachments metadata.
  - Verification: File-level tests pass.

- [ ] tests/components/communication-settings.export-import.ui.test.tsx
  - Description: UI export/import render failure (render is not a function).
  - Prerequisites: Confirm testing-library/react and render export presence.
  - Expected output: UI renders and handles import/export flows.
  - Verification: File-level tests pass.

- [ ] tests/status-transitions.test.ts
  - (Already listed above) Ensure RBAC and validation behavior restored.

- [ ] tests/auto-assignment.test.ts
  - (Already listed above)

- [ ] tests/admin-integration-hub.api.test.ts
  - (Already listed above)

- [ ] tests/admin-service-requests.export.test.ts
  - (Already listed above)

- [ ] tests/auth.session-callback.test.ts
  - (Already listed above)

- [ ] tests/components/communication-settings.export-import.ui.test.tsx
  - (Already listed above)

## 📋 Full Test Run Notes
- The full test run was attempted; it produced dozens of failing tests across auth/session mocks, tenant context, and UI render helpers. The failures cluster around:
  - Auth/session mocking surface mismatches (getSessionOrBypass vs next-auth mocks)
  - Tenant context propagation (AsyncLocalStorage) and tenant cookie validation
  - Permission checks and RBAC expectations in API routes
  - Testing-library DOM helpers not present or mocked incorrectly in vitest.setup

## 🔁 Next actions (I will perform these if you confirm)
- [ ] Create granular TODOs for each failing test file with owner and estimated effort (I can create these here).
- [ ] Start triage on highest-priority failures (auth/session mocks, tenant-context) and apply fixes incrementally.
- [ ] Stabilize test environment (ensure vitest.setup.ts provides consistent mocks for auth, permissions, testing-library)
- [ ] Re-run full test suite after fixes and iterate until green.

---
*I attempted to run the full suite; the run produced extensive failure output which has been summarized above and appended to this todo file. If you want me to start fixing items, confirm which priority you prefer (auth/tenant first is recommended)."
