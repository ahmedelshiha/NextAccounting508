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

## 📋 Plan to remediate
- Prioritize tenant/context and auth-related failures first (they block many other tests):
  1. Stabilize auth mocks (centralize to `@/lib/auth` and update vitest.setup.ts); ensure getSessionOrBypass is exported and mockable.
  2. Verify tenant cookie and tenantContext behavior under test mocks.
  3. Re-run failing integration tests and fix API wrapper edge-cases.

- Parallelizable items (UI tests, specific service logic) can be batched and fixed concurrently after auth/tenant stabilization.

## 🔁 Next actions (pick one)
- [ ] I will create individual TODOs for each test file above with an owner/estimate and start triaging the highest priority ones (tenant/auth).
- [ ] Or I can begin implementing the top-priority fixes now (auth mock stabilization + tenant cookie handling). 


---
*This inventory was generated from recent test run logs. If you want me to run the full test suite again to capture any additional failures, say "run full tests" and I will attempt another run (may take several minutes)."
