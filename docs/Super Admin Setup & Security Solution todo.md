
## ✅ Completed (NEW)
- [x] Added tenant-level superAdmin settings and Super Admin Controls modal
  - **Why**: Provide tenant-scoped overrides for step-up MFA, admin access logging, and explicit IP restriction toggle
  - **Files**: src/schemas/settings/security-compliance.ts, src/lib/security/step-up.ts, src/components/admin/settings/SuperAdminSecurityModal.tsx, src/app/admin/settings/security/page.tsx
  - **Impact**: Operators can now manage super admin behavior from the UI (tenant-level). Step-up behavior consults tenant settings before falling back to SUPERADMIN_STEPUP_MFA env.

## 🔧 Next Steps
- [ ] Update documentation: docs/ENVIRONMENT_VARIABLES_REFERENCE.md to explain precedence between tenant override (security settings.superAdmin.stepUpMfa) and SUPERADMIN_STEPUP_MFA env
- [ ] Add UI help text and runbook explaining how env-level flags are ops-only and tenant overrides are recommended for safer rollouts
- [ ] Add unit tests for step-up behavior when tenant-level setting is present (mock service.get)
