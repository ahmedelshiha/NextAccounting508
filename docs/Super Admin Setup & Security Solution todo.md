## ✅ Completed
- [x] Created SUPER_ADMIN user and ensured credentials; handled enum drift and schema gaps safely.
  - **Why**: enable platform-level super admin operations immediately
  - **Impact**: SUPER_ADMIN user present; membership sync skipped if table absent; no downtime
  - **Ops Output**:
    - Enum UserRole updated to include SUPER_ADMIN (idempotent)
    - User email: superadmin@accountingfirm.com
    - Password: set via SEED_SUPERADMIN_PASSWORD or generated and displayed during run
  - **Files**: scripts/admin-setup/ensure-enums.ts, scripts/admin-setup/create-superadmin-user.ts
