## ✅ Completed
- [x] Verified superAdmin column and defaults present in remote DB.
  - **Why**: confirm rollout success and idempotent seed behavior
  - **Impact**: tenant-level overrides active; APIs can consult persisted settings
  - **Verification Output**:
    - Column exists count: 1
    - Sample row: { tenantId: "tenant_primary", superAdmin: { stepUpMfa: false, logAdminAccess: true } }
    - Rows missing defaults: 0
  - **Files**: scripts/admin-setup/verify-superadmin-column.ts
