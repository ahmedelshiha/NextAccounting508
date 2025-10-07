## 🚧 Super Admin Setup & Security Solution - Incremental Log

This file is the central state for all Super Admin setup and security work. Append-only style — new entries are added to the bottom.

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

- [x] Enhanced admin IP allowlist to support CIDR ranges and wildcard entries (*) via src/lib/security/ip-allowlist.ts and middleware integration.
  - **Why**: allow secure office network ranges and reduce maintenance overhead.
  - **Impact**: flexible, stricter IP enforcement for /admin and /api/admin without breaking existing exact-match configs.

- [x] Implemented IPv6 CIDR support and tests in src/lib/security/ip-allowlist.ts and tests/security/ip-allowlist.test.ts
  - **Why**: support mixed IPv4/IPv6 deployments
  - **Impact**: consistent allowlist behavior across IP families

- [x] Implemented step-up MFA for SUPER_ADMIN on sensitive endpoint(s) and integrated tenant override.
  - **Files**: src/lib/security/step-up.ts, src/app/api/admin/audit-logs/route.ts, src/app/api/admin/permissions/*, src/app/api/admin/security-settings/route.ts
  - **Why**: protects high-risk operations with fresh proof-of-presence
  - **Impact**: API returns 401 with `x-step-up-required` header and supports OTP via `x-mfa-otp` header

- [x] Added Super Admin Controls UI (tenant-level overrides) and integrated into Security Settings page
  - **Files**: src/components/admin/settings/SuperAdminSecurityModal.tsx, src/app/admin/settings/security/page.tsx
  - **Settings exposed**: twoFactor.requiredForAdmins (tenant override), superAdmin.stepUpMfa, network.enableIpRestrictions, network.ipAllowlist, network.ipBlocklist, superAdmin.logAdminAccess, dataProtection.auditLogRetentionDays

- [x] Added API route to expose client IP and allowlist match for operator UI
  - **File**: src/app/api/tools/client-ip/route.ts
  - **Why**: client-side helper needs authoritative client IP and matched rule

- [x] Added Admin IP helper UI component
  - **File**: src/components/admin/settings/AdminIpHelper.tsx
  - **Why**: show current client IP, family, allowlist match and matched rule in Admin UI

- [x] Added unit tests for step-up MFA and tenant override behavior
  - **Files**: tests/security/step-up.test.ts, tests/admin-stepup.route.test.ts, tests/admin-security-settings.stepup.test.ts, tests/security/step-up-tenant-override.test.ts

- [x] Updated ENV docs and runbook describing SUPERADMIN_STEPUP_MFA precedence and operational guidance
  - **Files**: docs/ENVIRONMENT_VARIABLES_REFERENCE.md, docs/runbooks/superadmin-stepup-runbook.md

## ✅ Completed (recent additions)
- [x] Emit `security.ratelimit.block` on newsletter subscribe 429 with minimal details (ip, key, route).
  - **Why**: consistent visibility for public-facing throttles
  - **Impact**: incident traceability without storing content/PII

- [x] Emit `security.ratelimit.block` on login throttles (per-IP and per-email) in authorize() flow.
  - **Why**: detect credential stuffing and abusive login attempts
  - **Impact**: improved SOC telemetry; no user enumeration in responses

## 🚧 In Progress
- [ ] Final sweep for any other 429 paths; document any intentional exclusions due to volume/noise.
