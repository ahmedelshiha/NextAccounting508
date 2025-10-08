## ✅ Actions taken
- [x] Removed static import of getSessionOrBypass from src/lib/api-wrapper.ts to avoid static resolution issues with test mocks. Now auth helpers are dynamically imported at runtime, making tests that vi.mock('@/lib/auth') or vi.mock('next-auth') work consistently.

## 🔧 Next verification
- Re-run tenant/context focused tests: tests/integration/tenant-mismatch.security.test.ts
- If additional failures due to mocks persist, adapt vitest.setup.ts to provide comprehensive default mocks.

## ✅ Completed
- [x] Fix thresholds unauthenticated path returning 200 instead of 401
  - Why: test/build failure; withTenantContext preferred next-auth root mock over next-auth/next, so tests couldn't force unauth
  - Impact: Builds unblock; route auth now respects per-test overrides, ensuring correct 401 behavior when unauthenticated

## 🚧 In Progress
- [ ] Unify redundant routes and preview-login logic

## 🔧 Next Steps
- [ ] Consolidate duplicate hooks (usePerformanceMonitoring) and SettingsNavigation into shared modules
- [ ] Extract shared health/cron libs and update routes/functions to consume them
- [ ] Standardize Prisma env to DATABASE_URL across deploy targets
- [ ] Add CI guardrails for duplicate routes/components
