## 🚧 Super Admin Setup & Security Solution - Incremental Log

This file is the central state for all Super Admin setup and security work. Append-only style — new entries are added to the bottom.

## 🚧 In Progress (Prioritized)
- [ ] SUPER_ADMIN step-up coverage — final sweep across high‑risk admin endpoints and UI actions; centralize step-up checks while preserving per-route control; document behavior and precedence.
- [ ] CI hardening — add `scripts/check_admin_rbac.js` to CI; document in this log and `docs/ENVIRONMENT_VARIABLES_REFERENCE.md`; deprecate/wrap legacy `rateLimit()` to avoid regressions.
- [ ] Multi‑tenant schema alignment — plan and stage tenantId backfills with online backfill and constraints; re-run seeding for tasks once aligned.
- [ ] Build hygiene — monitor next CI/Vercel build; prune legacy direct PrismaClient instantiations after successful pass.
- [ ] SUPER_ADMIN role audit — verify remaining role checks grant full admin capabilities across hooks and UI guards.

Verified complete (moved to Completed):
- Remote DB migration/seed for `security_settings.superAdmin` (column present; defaults seeded; verified).
- Rate limiting rollout and 429 audit logging coverage (final sweep completed).

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

- [x] Fixed Vercel build error (TS2448) by declaring resolvedTenantId/resolvedTenantSlug/apiEntryLogged before first use in middleware.
  - **Files**: src/app/middleware.ts
  - **Why**: unblock `pnpm typecheck` during `pnpm vercel:build`
  - **Impact**: build passes typecheck stage; no functional behavior changed

- [x] Implemented tenant-aware step-up MFA enforcement for SUPER_ADMIN during credentials login.
  - **Files**: src/lib/auth.ts
  - **Why**: ensure SUPER_ADMIN logins require step-up MFA per tenant or environment toggle and accept OTP supplied via credentials or headers
  - **Impact**: SUPER_ADMIN login now enforces tenant/env step-up policy: if enabled, login requires a valid TOTP or backup code (from credentials.mfa or request headers). Invalid or missing OTPs produce audit events and block sign-in.

- [x] Integrated IP restriction middleware into Next.js routes (matcher: /admin, /portal, /api, /login, /register)
  - **Files**: src/app/middleware.ts, src/lib/security/ip-allowlist.ts
  - **Why**: enforce tenant-aware IP allowlist and block unauthorized network origins for admin and sensitive API routes
  - **Impact**: requests to admin and admin API routes are evaluated against tenant/network allowlists; denials emit `security.ip.block` audit events and return 403 (for API) or redirect to login.

- [x] Added Redis-backed distributed rate limiter and wired admin APIs to use applyRateLimit (Upstash or ioredis supported)
  - **Files**: src/lib/rate-limit.ts, src/lib/cache/redis.ts, various admin API routes using applyRateLimit
  - **Why**: provide cross-instance rate limiting for admin and public endpoints to prevent abuse and credential stuffing across horizontally scaled deployments
  - **Impact**: rate limits now operate across instances when REDIS_URL or UPSTASH_REDIS_REST_URL/TOKEN are configured. Fallback to in-process memory buckets when Redis is unavailable.
  - **Enablement**: To enable distributed mode, set either REDIS_URL (redis:// or rediss://) or UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN. Restart/redeploy the app to pick up environment changes.

## ⚠️ Issues / Risks

- Tenant-level step-up override currently resolves via security-settings.service.get(null) when called from generic helpers. This is deliberate to reduce coupling in the step-up helper; in future we may want to pass tenantId into helper functions to consult the exact tenant settings.
- Enabling strict IP enforcement or global step-up across tenants can cause lockouts; coordinate staged rollouts and communicate to SUPER_ADMIN users.
- OTP transport via headers must only be used over HTTPS and never logged.

## 🚧 In Progress / Recent Actions

- [x] Implement Admin IP helper UI and backend route (completed)
- [x] Add unit test for tenant-level step-up override (completed)
- [x] Add Redis-backed distributed rate limiter and wired admin APIs to use applyRateLimit

## 🔧 Next Steps (recommended and actionable)

- [ ] Add audit event when `superAdmin.logAdminAccess` is toggled (more granular than current security-settings:update event). This produces a clear audit entry indicating who changed logging policy and previous/new value.
  - Owner: Security Engineer
  - Verification: new entry in audit logs with action `security.superadmin.logAdminAccess.toggled`
  - Files changed: src/services/security-settings.service.ts
  - Note: Service now emits `security.superadmin.logAdminAccess.toggled` with details { tenantId, previous, current } when toggled.

- [ ] Make Super Admin Controls modal visibility explicit to SUPER_ADMIN users only (UI guard). Currently PermissionGate controls access to the Security Settings page; added an extra client-side guard so only SUPER_ADMINs can open the modal and superAdmin.* toggles are hidden for others.
  - Owner: Frontend
  - Verification: non-super admins cannot open the modal nor read tenant-level superAdmin fields
  - Files changed: src/app/admin/settings/security/page.tsx, src/components/admin/settings/SuperAdminSecurityModal.tsx

- [ ] Add IPv6-focused unit tests for ip-allowlist edge cases (zone identifiers, compression, ::ffff: mapped addresses) and add tests for matched rule resolution.
  - Owner: Test maintainer
  - Verification: tests in tests/security/ip-allowlist.test.ts
  - Files changed: tests/security/ip-allowlist.test.ts

- [ ] Add CI job to run scripts/check_admin_rbac.js and fail builds on missing guards.

---

## ✅ Completed (most recent)
- [x] Admin IP helper UI + API
- [x] Unit test for tenant-level step-up override
- [x] Implemented tenant-aware step-up MFA enforcement for SUPER_ADMIN during credentials login.
- [x] Integrated IP restriction middleware into Next.js routes (matcher: /admin, /portal, /api, /login, /register)
- [x] Added Redis-backed distributed rate limiter and wired admin APIs to use applyRateLimit

- [x] Fixed dev server crash by updating dev command to `pnpm run next-dev` and restarting the dev server.
  - **Why**: original `npm run dev` invoked Doppler in dev script which failed in this environment; switching to `pnpm run next-dev` bypasses Doppler and starts Next.js directly.
  - **Impact**: Dev server is running (Next.js ready). To persist this change in developer workflows, consider updating the dev command in package.json or the project run configuration.

---

## 🚧 In Progress

- [ ] Paused: Remote DB connection and migration application — waiting for ops approval/credentials.
  - **Why**: CI environment blocked external DB access from automation; local/ops run required to apply DB migration that adds `superAdmin` JSON column to `security_settings` and seed defaults.
  - **Impact**: Tenant-level superAdmin overrides cannot be persisted until migration/seed complete. Some API behaviors (tenant-level step-up MFA) will fall back to environment flag.

## 🔜 Next Task (owner: Ops/Backend)

- [ ] Apply schema migration and seed to add `superAdmin` to `security_settings`
  - **Steps**:
    1. Ensure DATABASE_URL points to target Neon DB (ops):
       export DATABASE_URL="postgresql://..."
    2. Run migrations in the deployment environment or locally with access:
       - pnpm db:migrate  # (or: npx prisma migrate deploy)
    3. Regenerate Prisma client:
       - pnpm db:generate
    4. Run seed script to ensure defaults:
       - pnpm db:seed
    5. Verify column and values:
       - SELECT column_name FROM information_schema.columns WHERE table_name='security_settings';
       - SELECT superAdmin FROM public.security_settings LIMIT 5;
  - **Verification**: security_settings contains `superAdmin` JSON with keys `stepUpMfa` and `logAdminAccess`; tests for tenant override pass locally/CI.
  - **Risks/Notes**: Running migrations in production must be coordinated; backups recommended. If you want, I can prepare a PR with the migration and seed changes (already added) and instructions for ops to run.

---

## ✅ Completed
- [x] Remote DB: ensured security_settings.superAdmin column and seeded defaults via surgical SQL scripts (no destructive drift push).
  - **Why**: prisma db push detected non-trivial drift (required tenantId on existing tables) and would require data-destructive reset; we applied a safe, targeted change instead to unblock SUPER_ADMIN overrides.
  - **Impact**: superAdmin JSON column exists; defaults ensured for existing rows; no data loss and no unrelated schema changes.
  - **Files**: scripts/admin-setup/add-superadmin-column.ts, scripts/admin-setup/seed-superadmin-defaults.ts

## ⚠️ Issues / Risks
- Prisma db push surfaced drift on ComplianceRecord, HealthLog, and Task tenantId requirements; avoid force-reset in shared environments. Coordinate a dedicated migration plan for multi-tenant columns.

