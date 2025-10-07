## 🚧 Tasks
- [x] Verify `prisma/schema.prisma` defines the `SUPER_ADMIN` role and required audit log models, adding a migration if any fields are missing. (Completed via schema update and migration notes in `prisma/migrations/20250214_super_admin_audit_logs/`.)
- [ ] Capture current admin and super admin roster, exporting contact info for owners and staff (Depends on: schema verification and confirmation of latest production database snapshot).
- [ ] Regenerate Prisma client and adjust TypeScript role typings so `SUPER_ADMIN` is recognized across services and NextAuth session payloads (Depends on: schema validation).
- [ ] Implement `scripts/admin-setup/create-super-admin.ts` to provision the new super admin with a random strong password and enforced MFA enrollment (Depends on: Prisma client regeneration).
- [ ] Retire the legacy admin account by deactivating login access while preserving ownership references and audit history (Depends on: super admin provisioning).
- [ ] Add enforced MFA flow for super admin accounts, covering secret generation, QR delivery, verification, and backup code issuance (Depends on: super admin provisioning).
- [ ] Extend login throttling and account lockout controls to respect MFA state and communicate lock reasons in the admin UI (Depends on: MFA enforcement).
- [ ] Implement centralized audit logging service that records admin authentication, role changes, MFA events, and sensitive actions to Prisma (Depends on: schema validation).
- [ ] Wire existing admin mutations and NextAuth callbacks to emit structured audit log entries with metadata (Depends on: audit logging service).
- [ ] Create `src/app/api/admin/audit-logs/route.ts` endpoint with date/action filters restricted to `SUPER_ADMIN` sessions (Depends on: audit logging service).
- [ ] Build the `AuditLogViewer` client component inside the admin area with filtering, empty states, and loading states (Depends on: audit logs endpoint).
- [x] Harden `src/middleware.ts` with IP whitelist enforcement, rate limiting, and admin access logging toggled by env flags (Depends on: environment variable plan).
- [ ] Implement Upstash-backed rate limiter in `src/lib/rate-limit.ts` and fall back to in-memory for local development (Depends on: middleware hardening).
- [x] Define and document new environment variables (`ENABLE_IP_RESTRICTIONS`, `ADMIN_IP_WHITELIST`, `LOG_ADMIN_ACCESS`, Upstash credentials, `CRON_SECRET`) in env reference files (Depends on: middleware hardening).
- [ ] Ship operational scripts for emergency password reset, MFA disable, and database integrity verification under `scripts/admin-setup/` (Depends on: Prisma client regeneration).
- [ ] Update admin documentation/runbooks with daily and weekly security checklists referencing audit logs and monitoring scripts (Depends on: AuditLogViewer availability).
- [ ] Configure alerts or dashboards that surface repeated IP blocks, rate limit hits, and failed MFA attempts via existing monitoring tools (Depends on: middleware hardening and audit logging).
- [ ] Execute an end-to-end validation plan covering super admin creation, MFA enrollment, legacy admin retirement, restricted IP access, and audit log visibility (Depends on: all implementation tasks).

## ✅ Completed
- [x] Context review and synchronization with existing super admin security roadmap
  - **Why**: planning alignment
  - **Impact**: ensures subsequent tasks reference up-to-date objectives
- [x] Prisma schema updated with `SUPER_ADMIN` role support and foundational `AuditLog` model
  - **Why**: security foundation
  - **Impact**: enables type-safe super admin flows and audit persistence across services
- [x] Added `scripts/admin-setup/export-admin-roster.ts` for automated admin roster exports
  - **Why**: operational readiness
  - **Impact**: produces JSON/CSV inventories of admin contacts for compliance reviews
- [x] Enforced admin IP allowlist in middleware for /admin pages and /api/admin endpoints
  - **Why**: security hardening
  - **Impact**: blocks untrusted networks from sensitive surfaces; optional access logs via env flag
- [x] Documented admin IP policy variables and Redis/Upstash usage in env references
  - **Why**: operability
  - **Impact**: clear rollout and configuration guidance across environments

## ⚠️ Issues / Risks
- Edge runtime constraints discourage Prisma usage in middleware; audit events for IP blocks are logged via logger for now.
- Redis-based rate limiter uses best-effort atomicity; Upstash REST lacks INCR in our wrapper; using JSON with TTL. Acceptable for basic abuse prevention.

## 🚧 In Progress
- [ ] Wire routes that can await to use `rateLimitAsync` when Redis is configured for stronger cross-instance enforcement.

## 🔧 Next Steps
- [ ] Implement MFA enrollment/verification endpoints and enforce MFA in NextAuth callbacks for super admins.
- [ ] Add admin audit endpoint and UI for viewing access-denied events.
- [ ] Provide emergency scripts for MFA disable and password reset under scripts/admin-setup/.
