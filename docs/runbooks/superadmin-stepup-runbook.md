# Runbook: SUPERADMIN Step-up MFA (tenant override)

Purpose
- Document operational steps to enable/disable step-up MFA for SUPER_ADMIN operations and the relationship between tenant-level settings and environment-level flags.

Scope
- Applies to platform operators and SREs managing environment variables and tenant security settings.

Key concepts
- SUPERADMIN_STEPUP_MFA: environment-level boolean. When `true`, certain admin routes will require step-up MFA for SUPER_ADMIN users by default.
- Tenant-level override (recommended): stored in tenant security settings under `securitySettings.superAdmin.stepUpMfa` (boolean). If present, this tenant value takes precedence and allows per-tenant staging/gradual rollout.

Safety checklist before enabling globally
- Ensure MFA enrollment is available and tested for SUPER_ADMIN users.
- Verify recovery procedures (backup codes, disable-mfa emergency script: `scripts/admin-setup/disable-mfa.ts`).
- Confirm that upstream proxies correctly forward client IP headers (for IP-binding features) and do not inadvertently strip or rewrite headers used by auth flows.
- Review audit logs and configure retention appropriately to capture step-up rejections.

Operational steps
1. To perform a tenant-scoped rollout (recommended):
   - In the Admin UI: Admin > Settings > Security & Compliance > Super Admin Controls → set "Super Admin Step-up MFA" ON for the tenant and Save.
   - Alternatively, update the tenant record via the database or API using the security-settings service: set `superAdmin.stepUpMfa = true` for the tenant.
2. To enable globally (ops-level):
   - Set `SUPERADMIN_STEPUP_MFA=true` in environment secrets (Vercel/Netlify/CI). Prefer platform secrets management.
   - Redeploy if your platform requires env reloads.
3. To roll back:
   - Prefer disabling at tenant-level first. If global env was used, set `SUPERADMIN_STEPUP_MFA=false`.
   - Use emergency script `scripts/admin-setup/disable-mfa.ts <email> <tenantId>` only when necessary to recover locked accounts.

Verification
- Perform a login as a SUPER_ADMIN and exercise a gated endpoint (e.g., Admin > Audit Logs). Expect 401 with `x-step-up-required` header when step-up is enforced.
- Verify that providing the OTP in the UI or via header `x-mfa-otp` returns 200 and logs `auth.mfa.stepup.success` in audit logs.

Troubleshooting
- If step-up challenge never accepts valid codes: verify server time skew, TOTP secret storage (verification tokens), and that `getUserMfaSecret` returns expected value.
- If many unexpected challenges occur: check tenant-level settings vs env-level flag precedence and client IP binding which may force re-authentication.

Security notes
- OTPs and backup codes must never be logged. Mask or redact in logs if accidentally captured.
- Prefer tenant overrides for staged rollouts to limit blast radius.

Contact
- Ops/Platform on-call
- Security/Engineering lead
