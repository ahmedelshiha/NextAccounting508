## 🚧 Tasks
- [ ] Capture current admin and super admin roster, exporting contact info for owners and staff (Prerequisite: confirm latest production database snapshot is complete).
- [ ] Verify `prisma/schema.prisma` defines the `SUPER_ADMIN` role and required audit log models, adding a migration if any fields are missing (Depends on: roster capture).
- [ ] Regenerate Prisma client and adjust TypeScript role typings so `SUPER_ADMIN` is recognized across services and NextAuth session payloads (Depends on: schema validation).
- [ ] Implement `scripts/admin-setup/create-super-admin.ts` to provision the new super admin with a random strong password and enforced MFA enrollment (Depends on: Prisma client regeneration).
- [ ] Retire the legacy admin account by deactivating login access while preserving ownership references and audit history (Depends on: super admin provisioning).
- [ ] Add enforced MFA flow for super admin accounts, covering secret generation, QR delivery, verification, and backup code issuance (Depends on: super admin provisioning).
- [ ] Extend login throttling and account lockout controls to respect MFA state and communicate lock reasons in the admin UI (Depends on: MFA enforcement).
- [ ] Implement centralized audit logging service that records admin authentication, role changes, MFA events, and sensitive actions to Prisma (Depends on: schema validation).
- [ ] Wire existing admin mutations and NextAuth callbacks to emit structured audit log entries with metadata (Depends on: audit logging service).
- [ ] Create `src/app/api/admin/audit-logs/route.ts` endpoint with date/action filters restricted to `SUPER_ADMIN` sessions (Depends on: audit logging service).
- [ ] Build the `AuditLogViewer` client component inside the admin area with filtering, empty states, and loading states (Depends on: audit logs endpoint).
- [ ] Harden `src/middleware.ts` with IP whitelist enforcement, rate limiting, and admin access logging toggled by env flags (Depends on: environment variable plan).
- [ ] Implement Upstash-backed rate limiter in `src/lib/rate-limiter.ts` and fall back to in-memory for local development (Depends on: middleware hardening).
- [ ] Define and document new environment variables (`ENABLE_IP_RESTRICTIONS`, `ADMIN_IP_WHITELIST`, `LOG_ADMIN_ACCESS`, Upstash credentials, `CRON_SECRET`) in env reference files (Depends on: middleware hardening).
- [ ] Ship operational scripts for emergency password reset, MFA disable, and database integrity verification under `scripts/admin-setup/` (Depends on: Prisma client regeneration).
- [ ] Update admin documentation/runbooks with daily and weekly security checklists referencing audit logs and monitoring scripts (Depends on: AuditLogViewer availability).
- [ ] Configure alerts or dashboards that surface repeated IP blocks, rate limit hits, and failed MFA attempts via existing monitoring tools (Depends on: middleware hardening and audit logging).
- [ ] Execute an end-to-end validation plan covering super admin creation, MFA enrollment, legacy admin retirement, restricted IP access, and audit log visibility (Depends on: all implementation tasks).

## ✅ Completed
- [x] Context review and synchronization with existing super admin security roadmap
  - **Why**: planning alignment
  - **Impact**: ensures subsequent tasks reference up-to-date objectives

## ⚠️ Issues / Risks
- None logged; awaiting implementation kickoff to surface blockers.

## 🚧 In Progress
- [ ] Planning workstream pending — roster capture task queued once production snapshot confirmation is available.

## 🔧 Next Steps
- [ ] Capture current admin and super admin roster, exporting contact info for owners and staff (Prerequisite: confirm latest production database snapshot is complete).
