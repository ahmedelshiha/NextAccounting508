# Security Guidelines

## Authentication & Authorization
- Use NextAuth.js with Prisma adapter; secrets stored in `NEXTAUTH_SECRET` and `NEXTAUTH_URL`.
- Roles: ADMIN, STAFF, CLIENT. UI components leverage `PermissionGate` and layout stores to enforce least privilege.
- Admin routes require middleware checks; ensure tenant guard utilities are invoked for all Prisma queries.

## Data Protection
- Multi-tenancy enforced through `tenantFilter` helpers and Prisma middleware (`tests/tenant-filter.test.ts` coverage).
- All schemas validated via Zod before persistence (`src/schemas/**`).
- Sensitive fields (passwords) use bcrypt hashing (`bcryptjs`) and should never log raw values.

## Secrets Management
- Required variables validated by `scripts/check-required-envs.sh`. Do not commit `.env.local`.
- Rotate secrets for Stripe (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`), SendGrid, Redis, and Sentry regularly.
- Use platform secret stores (Vercel/Netlify) instead of plaintext files.

## Network & Transport
- All external callbacks (Stripe, cron) require token authentication (`CRON_SECRET`, signatures).
- Enforce HTTPS for production deployments; configure proxies (Nginx) to pass correct headers when self-hosting.

## Upload Security
- Antivirus scanning via `clamav-service/`; quarantine routes handle review/release operations.
- Ensure `UPLOADS_PROVIDER` tokens (Netlify Blobs) are scoped and rotated.
- Reject files when scanning fails rather than auto-approving.

## Dependency Hygiene
- Audit dependencies with `pnpm audit`; avoid wildcard versions (currently `import-in-the-middle`, `require-in-the-middle`).
- Keep Prisma, Next.js, React, Tailwind, and Radix updated; review release notes for security advisories.

## Logging & Monitoring
- Sentry captures exceptions client/server/edge (`sentry.*.config.ts`). Ensure PII stripping before logging.
- `monitoring/health-check.js` and `production-monitoring.js` provide runtime verification.
- Configure alerts for auth failures, cron anomalies, and upload errors.

## Testing & Compliance
- Maintain regression suites for tenant access tests (`tests/integration/tenant-*`).
- Run `pnpm lint`, `pnpm typecheck`, and `pnpm test` before releases to prevent insecure code paths.
- Document and review security-related scripts in `scripts/apply-fix-security-columns.ts`, `scripts/check_admin_rbac.js`.

## Incident Response
- Follow `docs/RUNBOOK_ONCALL.md` for escalation.
- Record postmortems and update guidelines after security incidents.
