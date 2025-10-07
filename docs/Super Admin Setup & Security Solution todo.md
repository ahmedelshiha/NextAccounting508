## ✅ Completed
- [x] Wired AdminAuditsPage to use /api/admin/audit-logs for SUPER_ADMIN; legacy activity endpoint remains for others.
  - **Why**: correct data source based on privileges
  - **Impact**: SUPER_ADMINs see full audit logs; others see activity view
- [x] Added IP policy block audit in middleware (action: security.ip.block) with graceful edge fallback.
  - **Why**: traceability of access denials
  - **Impact**: improved incident visibility
- [x] Shipped emergency scripts: scripts/admin-setup/reset-password.ts and scripts/admin-setup/disable-mfa.ts
  - **Why**: recovery procedures
  - **Impact**: rapid response for lockouts and MFA issues
- [x] Enforced super admin session IP binding with configurable toggle (SUPERADMIN_STRICT_IP_ENFORCEMENT).
  - **Why**: protects privileged sessions from network hijacking or replay
  - **Impact**: super admin sessions require consistent network origin before accessing admin surfaces
- [x] Added audit telemetry and logging for super admin IP mismatch enforcement.
  - **Why**: ensures forced reauthentication events are discoverable
  - **Impact**: incident responders can rapidly trace unauthorized network shifts

## ⚠️ Issues / Risks
- Enabling SUPERADMIN_STRICT_IP_ENFORCEMENT immediately invalidates existing super admin sessions; coordinate rollout windows to avoid disruption.
- IP binding depends on accurate upstream client IP headers; verify proxy configuration before enabling in production environments.

## 🚧 In Progress
- [ ] None – ready for next super admin security hardening task

## 🔧 Next Steps
- [ ] Plan staged rollout for SUPERADMIN_STRICT_IP_ENFORCEMENT (staging → production) and monitor audit noise.
- [ ] Evaluate introducing step-up MFA prompts for super admin critical workflows post-IP validation.

## ✅ Completed
- [x] Enhanced admin IP allowlist to support CIDR ranges and wildcard entries (*) via src/lib/security/ip-allowlist.ts and middleware integration.
  - **Why**: allow secure office network ranges and reduce maintenance overhead.
  - **Impact**: flexible, stricter IP enforcement for /admin and /api/admin without breaking existing exact-match configs.

## ⚠️ Issues / Risks
- IPv6 CIDR is not yet supported; IPv6 is matched by exact address only. Plan follow-up with safe parser and tests.

## 🚧 In Progress
- [ ] None

## 🔧 Next Steps
- [ ] Add IPv6 CIDR support and comprehensive unit tests for ip-allowlist matcher (IPv4/IPv6, edge cases, ::ffff: mappings).
- [ ] Add an Admin Security UI helper to display current client IP and whether it matches the allowlist, for safer rollouts.

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

## ✅ Completed
- [x] Gated /api/admin/permissions (index, roles, [userId]) and /api/admin/security-settings (GET, PUT) with step-up MFA for SUPER_ADMIN when SUPERADMIN_STEPUP_MFA=true.
  - **Why**: extend proof-of-presence to role/permission and security configuration surfaces
  - **Impact**: superfine-grained protection without affecting non-super admins
- [x] Added OTP prompt UI to Admin Audits page to handle step-up challenge and retry with headers.
  - **Why**: unblock SUPER_ADMIN UX when challenged
  - **Impact**: seamless verification flow using x-mfa-otp header

## 🚧 In Progress
- [ ] None

## 🔧 Next Steps
- [ ] Add unit tests for verifySuperAdminStepUp and updated routes.
- [ ] Consider adding the same OTP UI helper to Security Settings page and Permissions viewers for consistency.

## ✅ Completed
- [x] Added unit tests for CIDR IP allowlist, step-up verification helper, and route enforcement (audit-logs, permissions roles).
  - Files: tests/security/ip-allowlist.test.ts, tests/security/step-up.test.ts, tests/admin-stepup.route.test.ts
  - **Impact**: guards now covered by automated tests; prevents regressions.
- [x] Added step-up prompts to Security Settings page and Permissions viewers for SUPER_ADMIN challenges.
  - Files: src/app/admin/settings/security/page.tsx, src/components/admin/permissions/RolePermissionsViewer.tsx, src/components/admin/permissions/UserPermissionsInspector.tsx
  - **Impact**: consistent UX to satisfy step-up without breaking flows.

## 🚧 In Progress
- [ ] None

## 🔧 Next Steps
- [ ] Extend route tests to cover /api/admin/security-settings PUT with step-up and negative flows.
- [ ] Document SUPERADMIN_STEPUP_MFA behavior in docs/ENVIRONMENT_VARIABLES_REFERENCE.md and ops runbook.
