## ✅ Completed
- [x] Remote DB: ensured security_settings.superAdmin column and seeded defaults via surgical SQL scripts (no destructive drift push).
  - **Why**: prisma db push detected non-trivial drift (required tenantId on existing tables) and would require data-destructive reset; we applied a safe, targeted change instead to unblock SUPER_ADMIN overrides.
  - **Impact**: superAdmin JSON column exists; defaults ensured for existing rows; no data loss and no unrelated schema changes.
  - **Files**: scripts/admin-setup/add-superadmin-column.ts, scripts/admin-setup/seed-superadmin-defaults.ts

## ⚠️ Issues / Risks
- Prisma db push surfaced drift on ComplianceRecord, HealthLog, and Task tenantId requirements; avoid force-reset in shared environments. Coordinate a dedicated migration plan for multi-tenant columns.

## 🚧 In Progress
- [ ] Plan and stage proper migrations for tenantId backfills on affected tables (with online backfill and defaults), then finalize constraints.

## 🔧 Next Steps
- [ ] Add CI job to run scripts/check_admin_rbac.js and fail builds on missing guards.
- [ ] Create migration plan for tenantId backfill: additive nullable columns, background backfill, then set NOT NULL with FK; avoid downtime.
- [ ] Verify via SQL:
  - SELECT column_name FROM information_schema.columns WHERE table_name='security_settings' AND column_name='superadmin';
  - SELECT superAdmin FROM public.security_settings LIMIT 5;
