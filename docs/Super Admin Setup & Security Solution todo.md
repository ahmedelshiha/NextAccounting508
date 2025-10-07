## ✅ Completed
- [x] Implemented step-up MFA for SUPER_ADMIN on sensitive endpoint /api/admin/audit-logs (env: SUPERADMIN_STEPUP_MFA=true).
  - Files: src/lib/security/step-up.ts, src/app/api/admin/audit-logs/route.ts
  - **Why**: protects high-risk operations with fresh proof-of-presence
  - **Impact**: API returns 401 with x-step-up-required: mfa unless valid TOTP or backup code is sent via headers (x-mfa-otp/x-mfa-code/x-step-up-otp)

## ⚠️ Issues / Risks
- Only enforced on audit-logs for now; extend to other critical endpoints (permissions, security settings) in phases to avoid regressions.
- Header-based OTP transport must be sent over HTTPS only (assumed), ensure no logging of header contents at edge/proxy.

## 🚧 In Progress
- [ ] None

## 🔧 Next Steps
- [ ] Gate /api/admin/permissions and /api/admin/settings/security with step-up MFA when SUPERADMIN_STEPUP_MFA=true.
- [ ] Add UI affordance in Admin Audits page to enter OTP when challenged (handles 401 with x-step-up-required header).
- [ ] Add unit tests for verifySuperAdminStepUp and route challenge behavior.
