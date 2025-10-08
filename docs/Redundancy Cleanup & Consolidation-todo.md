## ✅ Actions taken
- [x] Removed static import of getSessionOrBypass from src/lib/api-wrapper.ts to avoid static resolution issues with test mocks. Now auth helpers are dynamically imported at runtime, making tests that vi.mock('@/lib/auth') or vi.mock('next-auth') work consistently.

## 🔧 Next verification
- Re-run tenant/context focused tests: tests/integration/tenant-mismatch.security.test.ts
- If additional failures due to mocks persist, adapt vitest.setup.ts to provide comprehensive default mocks.
