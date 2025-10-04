# Tenant System Audit TODO

## ✅ Completed
- [x] Context reload and alignment with existing audit and enhancement plan
  - **Why**: Ensure stateful continuity and avoid redundant analysis
  - **Impact**: Enables staged, low-risk execution aligned with prior findings

## ⚠️ Issues / Risks
- Several admin/portal APIs still lack withTenantContext; header spoofing risk where wrapper is absent
- Middleware missing structured logs for requestId, userId, tenantId on all requests

## 🚧 In Progress
- [ ] Staged refactor: apply withTenantContext to prioritized admin endpoints (integration-hub/test, realtime, system/health, uploads/quarantine, service-requests group)
- [ ] Middleware logging: add requestId, userId, tenantId logs and propagate x-request-id across the stack

## 🔧 Next Steps
- [x] Refactor: src/app/api/admin/integration-hub/test/route.ts to withTenantContext
- [x] Refactor: src/app/api/admin/realtime/route.ts to withTenantContext
- [x] Refactor: src/app/api/admin/system/health/route.ts to withTenantContext
- [x] Refactor: src/app/api/admin/uploads/quarantine/route.ts to withTenantContext
- [ ] Refactor: src/app/api/admin/service-requests/** to withTenantContext (including subroutes)
- [ ] Tests: add 403 on tenant mismatch for a high-risk admin route
- [ ] Verify middleware matcher includes /api/:path* and excludes only static assets
