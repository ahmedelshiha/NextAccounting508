## ✅ Completed (append)
- [x] Began triage for tenant/context-related test failures
  - **What I ran**: focused test runs and logs after setting DATABASE_URL
  - **Key failing tests observed (representative):**
    - tests/integration/tenant-mismatch.security.test.ts (tenant cookie & header mismatch scenarios)
    - tests/integration/tenant-mismatch.portal.security.test.ts (portal tenant cookie validation)
    - tests/admin-services.route.test.ts (admin services APIs returning 500/403)
    - tests/booking-settings.service.test.ts & tests/booking-settings.api.test.ts (booking settings creation/scoping failures)
    - tests/integration/prisma-tenant-guard.test.ts (tenant scoping middleware failures)
  - **Immediate errors/log excerpts:**
    - Invalid tenant cookie signature { userId: 'test-user', tenantId: undefined }
    - Prisma query built with tenantId: "undefined" causing query errors
    - Mocking errors in tests: missing exports on mocked modules (e.g., PERMISSIONS on '@/lib/permissions', applyRateLimit on '@/lib/rate-limit')

## 🔍 Root cause analysis (preliminary)
- Inconsistent or missing tenantId in mocked sessions: some test mocks return session.user without tenantId which leads to tenantContext receiving undefined and downstream code building queries with tenantId="undefined".
- Tenant cookie verification previously passed String(user.tenantId) even when undefined; this resulted in invalid signatures and confusing logs. I added a defensive check to return 403 when tenant cookie exists but the session user lacks tenantId.
- Test-suite mocking inconsistencies: tests sometimes mock 'next-auth' but not 'next-auth/next' or vice versa. Code imports getServerSession from 'next-auth/next' in some places and from 'next-auth' in others — this can cause mocks to miss the intended target.
- Some tests rely on partial module mocks but the module mocks in test files do not provide all exports expected by consumers, leading to RENDER_ERRORs during test rendering.

## ✅ Changes applied during triage
- Added defensive tenant cookie validation in src/lib/api-wrapper.ts to deny when session lacks tenantId and tenant_sig cookie is present.
- Re-ran targeted tests; observed reduced but still numerous failures due to broader mocking and integration issues.

## 🔧 Recommended fixes / next actions (pick one to proceed)
1) Standardize session retrieval in api-wrapper: import and call getSessionOrBypass() from '@/lib/auth' (centralized) to reduce mocking inconsistency — then update tests/mocks accordingly.
2) Harden test mocks: update test helpers to consistently mock both 'next-auth' and 'next-auth/next' or prefer mocking '@/lib/auth' and getSessionOrBypass.
3) Triage and fix failing integration tests focused on tenant injection (prisma-tenant-guard): inspect tenant middleware/util functions (src/lib/tenant, tenant-utils) to ensure they handle missing tenantId gracefully and fail fast with clear errors.
4) Fix missing exports in some module mocks (tests that expect PERMISSIONS, applyRateLimit) — update tests to importActual or provide full mock exports.
5) Re-run failing tests one-by-one and fix regressions introduced during earlier refactors (hook consolidation etc.).

## 🔄 Next recommended immediate step (I can run now)
- Implement option (1): refactor src/lib/api-wrapper.ts to use getSessionOrBypass from '@/lib/auth' for session retrieval; run a focused subset of tenant-related tests again.

## ⚠️ Notes
- Running the full test-suite is time-consuming; I'll continue with focused failures first.
- The DATABASE_URL provided is in environment; ensure credential rotation after tests if it's a real secret.

Append-only log updated.
