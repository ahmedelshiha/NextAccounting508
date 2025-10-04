

## ✅ Completed
- [x] Refactored users/me API to use withTenantContext and tenantContext
  - **Why**: Remove direct getServerSession usage, enforce tenant-scoped access, and standardize auth handling.
  - **Impact**: Consistent tenant enforcement for profile operations; preserves session invalidation via sessionVersion; safer email uniqueness checks within tenant.
- [x] Added structured request logging (requestId, userId, tenantId) in middleware for API requests
  - **Why**: Improve observability and traceability across tenants.
  - **Impact**: Each API request now emits consistent entry/exit logs with IDs and durations.

## ⚠️ Issues / Risks
- Portal/public routes still require full audit and wrapper adoption; ensure no direct header-based tenant resolution lingers.

## 🚧 In Progress
- [ ] Refactor remaining portal/public routes to withTenantContext per checklist.

## 🔧 Next Steps
- [ ] Migrate remaining server routes (payments/checkout, auth/register/register, email/test, bookings/**) to withTenantContext.
- [ ] Add integration tests asserting 403 on tenant mismatch for users/me and portal endpoints.
- [ ] Tag Sentry logs with tenant identifiers to aid incident triage.
