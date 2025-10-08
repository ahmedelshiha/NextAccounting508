## ✅ Completed (append)
- [x] Standardized session retrieval in api-wrapper to use getSessionOrBypass from '@/lib/auth'
  - **Why**: unifies session logic so tests can mock a single module (`@/lib/auth`) instead of both `next-auth` and `next-auth/next`.
  - **Impact**: reduces mocking inconsistencies; simplifies tenant-context behavior during tests.

## 🔧 Next verification step
- Run a focused subset of tenant-related tests to validate behavior: tests/integration/tenant-mismatch.security.test.ts and related suites.
- If tests still fail due to missing mocks, update test helpers to mock '@/lib/auth' instead of 'next-auth'.
