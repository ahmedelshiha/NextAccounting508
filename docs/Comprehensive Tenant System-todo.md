# Tenant System Audit TODO — Summary (consolidated)

## ✅ Completed
- [x] Context reload and alignment with existing audit and enhancement plan
  - **Why**: Ensure stateful continuity and avoid redundant analysis
  - **Impact**: Enables staged, low-risk execution aligned with prior findings

## ⚠️ Issues / Risks
- Several admin/portal APIs still lack withTenantContext; header spoofing risk where wrapper is absent
- Middleware missing structured logs for requestId, userId, tenantId on all requests

## 🚧 In Progress
- [ ] Middleware logging: add requestId, userId, tenantId logs and propagate x-request-id across the stack

## 🔧 Next Steps
- [ ] Tests: add 403 on tenant mismatch for a high-risk admin route
- [ ] Verify middleware matcher includes /api/:path* and excludes only static assets


