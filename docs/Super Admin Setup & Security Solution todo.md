## ✅ Completed
- [x] Added TOTP-based MFA utilities using VerificationToken storage; endpoints for enroll and verify at /api/auth/mfa/{enroll,verify}; enforced MFA for ADMIN/SUPER_ADMIN during login when enrolled; upgraded auth login to use Redis/Upstash-backed rateLimitAsync.
  - **Why**: security hardening
  - **Impact**: cross-instance rate limiting for login; MFA enrollment and enforcement without new schema migration

## 🚧 In Progress
- [ ] Rollout plan: enhance admin UI to surface MFA enrollment and backup code download; add admin-only page for MFA management.

## 🔧 Next Steps
- [ ] Extend route-level guards to check ENFORCE_ORG_2FA and session flags where applicable.
- [ ] Add audit log viewer and admin audit endpoint.
