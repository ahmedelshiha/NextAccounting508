# Admin Dashboard Pre-Launch Audit

This comprehensive pre-launch audit lists the checks, mitigations, and recommended actions to perform before going live with the Admin Dashboard. Use it as a checklist and working document.

---

## Executive summary

Purpose: Ensure the Admin Dashboard is secure, stable, performant, observable, and compliant for production use. This audit covers security, infra, app correctness, performance, monitoring, testing, backups, and deployment readiness.

Audience: Engineering, DevOps, Security, Product Owner.

Risk profile: Medium — handles PII (user emails, client details), payments, and administrative access. Priority: lock down auth/permissions, production secrets, backups, and observability.

---

## 1) Critical blockers (must before go-live)

- Fix all build/lint errors and ensure pnpm build completes successfully in CI (Netlify/Vercel).
- Ensure all /api/admin/** routes validate session and role-based access via src/lib/permissions (spot-check every route).
- Validate database migrations apply cleanly and automated migration steps are in CI; ensure a tested rollback path.
- Confirm secrets and environment variables exist in production (NEXTAUTH_SECRET, DATABASE_URL/NETLIFY_DATABASE_URL, SENTRY_DSN, STRIPE keys, UPSTASH_REDIS_REST_URL, etc.).
- Configure Sentry and test error capture from server and client.

---

## 2) Security & Access Control

Checklist:
- Authentication: NextAuth configured with secure cookies, correct NEXTAUTH_URL, NEXTAUTH_SECRET. Sessions stored securely.
- Authorization: All admin APIs must check session.user.role and permission gates. Use unit tests to assert role restrictions for key endpoints (bookings, invoices, users).
- Input validation: Use Zod schemas for API inputs, and sanitize any HTML or attachments.
- Rate limiting: Protect public or semi-public endpoints with rate-limits (src/lib/rate-limit.ts).
- Dependency scan: Run Snyk/Dependabot and Semgrep for SAST; fix critical/high findings.
- Secrets: Do NOT store secrets in repo; ensure CI environment variables are configured. Rotate keys if needed.
- File uploads: Ensure ClamAV scanning (src/lib/clamav.ts) and quarantining for suspicious uploads. Quarantined files must be inaccessible publicly.
- CSP & security headers: Ensure Next.js responses include CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy. Verify headers in middleware.
- Session fixation & CSRF: Ensure appropriate measures (NextAuth handles most, verify forms & stateful endpoints). For API routes use secure tokens.

Action items:
- Run Semgrep and address findings.
- Run a penetration test for admin flows (login, role escalation).

---

## 3) Data & Database

Checklist:
- Migrations: All Prisma migrations present and tested on staging. Use "pnpm db:generate" and "pnpm db:migrate" in CI with a dry-run for prod.
- Backup & Restore: Ensure scheduled backups of the Postgres DB (Neon or managed Postgres). Document restore steps and test a restore to staging.
- Referential integrity: Verify foreign keys for Bookings → Clients → Invoices; run integrity checks.
- Seed & demo data: Provide sanitized seeds for staging; do not use real customer data in staging.
- Indexes: Verify indexes on high-cardinality/filtered columns used in lists (scheduledAt, status, serviceId, clientEmail).
- Query performance: Inspect slow queries with EXPLAIN; avoid N+1 by eager-loading relations in list endpoints where needed.

Action items:
- Add DB restore runbook in docs/ with steps and contacts.
- Run migration in a staging environment; verify app behavior.

---

## 4) Observability & Monitoring

Checklist:
- Error reporting: Sentry integrated (server & client) and release tracking configured. Verify events appear for test errors.
- Metrics: Add key metrics to monitor (request latency, error rates, queue sizes, background job failures, payment failures). Use Prometheus/Grafana or hosted provider.
- Logging: Structured logs (src/lib/logger.ts), include correlation IDs and user IDs for admin actions. Ensure logs are not leaking secrets.
- Tracing: Optional — instrument critical flows (booking creation, payment flow) for latency breakdown.
- Alerts: Configure alerts for high error rate, increased latencies, DB replication lag, failed backups.

Action items:
- Configure Sentry alerts and test them.
- Add synthetic monitors for critical endpoints (admin login, create booking, invoice pay).

---

## 5) Performance & Scalability

Checklist:
- Load testing: Simulate expected concurrent admin users and hotspot flows (bookings list, exports). Identify bottlenecks.
- Caching: Use Redis/Upstash for caching heavy endpoints; validate cache invalidation for changes.
- Pagination & streaming: Ensure large responses (exports) use pagination or streaming to avoid OOM.
- Static assets & CDN: Verify assets are served via CDN (Netlify/Vercel) and cache headers are configured.
- DB connection pooling: For serverless environments, use connection pooling (Neon serverless compatibility or pg-bouncer). Avoid opening new Prisma clients per request.

Action items:
- Run a stress test for booking list queries and exports.
- Verify Redis TTLs and eviction strategy for caching.

---

## 6) Testing

Checklist:
- Unit tests: All critical modules covered (auth, bookings, invoices, permissions). Run vitest in CI.
- Integration tests: Test DB-backed flows (booking → invoice → payment) against a test database.
- E2E tests: Recommended with Playwright or Cypress for critical user journeys (admin login, bookings management, exports, payments).
- Smoke tests: Small suite that runs after deploy to validate core flows.

Action items:
- Add/integrate E2E tests for booking → invoice → payment before go-live.
- Ensure CI runs tests and fails build on regressions.

---

## 7) Payments & Financials

Checklist:
- Stripe keys: Use separate keys for staging and production. Ensure webhook signing secret is set in env and validated.
- Webhooks: Ensure idempotency and signature verification for payment webhooks (src/lib/payments/stripe.ts).
- Audit logging: All payment-related admin actions must be audited (src/lib/audit.ts).
- Reconciliation: Verify scheduled jobs for reconciling payments and invoices.

Action items:
- Test Stripe flows end-to-end in a sandbox account.
- Review webhook handler robustness and retries.

---

## 8) Backups, DR & Rollbacks

Checklist:
- Backups: Daily automated DB backups and periodic full exports. Verify backup retention policy.
- Restore tests: Periodically test restore to staging and run smoke tests.
- Rollback: Ensure you can rollback to previous deployment and have migration rollback plan when db schema changes.

Action items:
- Create runbook for incidents with command sequences and contacts.

---

## 9) Third-party Integrations & MCPs

Recommended MCPs and how they help:
- Neon: Managed Postgres — use for production DB; connect via [Open MCP popover](#open-mcp-popover) to configure. Helps with serverless Postgres and easy scaling.
- Netlify: Deploy and host the app; configure environment variables and functions. Connect via [Open MCP popover](#open-mcp-popover).
- Zapier: Automation and webhooks for external workflows (notifications, CRM integrations). Connect via [Open MCP popover](#open-mcp-popover).
- Figma: Use Builder.io Figma plugin for design handoff and component generation. Get plugin via the MCP UI or the provided plugin link.
- Supabase: Alternative DB/auth backend or for realtime features; connect via [Open MCP popover](#open-mcp-popover).
- Builder.io: CMS for marketing pages and content blocks; connect via [Open MCP popover](#open-mcp-popover).
- Linear: Project management integration for syncing issues and tickets; connect via [Open MCP popover](#open-mcp-popover).
- Notion: Documentation & runbooks; connect via [Open MCP popover](#open-mcp-popover).
- Sentry: Error monitoring & release tracking; connect via [Open MCP popover](#open-mcp-popover).
- Context7: Up-to-date docs for any library/framework used; helpful for developer onboarding.
- Semgrep: Static analysis and security scanning — run in CI to catch issues early.
- Prisma Postgres: Recommended if using Prisma-specific DB tools/hosting.

Action items:
- Connect Sentry and Neon via MCP, test integrations.
- Add Semgrep in CI and address findings.

---

## 10) Ops & CI/CD

Checklist:
- CI: Ensure build, lint, tests, and db generate run in CI. Fail fast on lint or type errors.
- Secrets: Store secrets in Netlify/Vercel/CI secret manager; do not commit .env files.
- Deploy hooks: Add post-deploy smoke tests and health checks.
- DB migrations: Run migrations in a controlled manner (CI or release job). Prefer migrate deploy for safe migrations.
- Canary / feature flags: Use feature flags for large changes; limit exposure.

Action items:
- Add post-deploy smoke test job in CI.
- Add canary release steps and runbooks.

---

## 11) Compliance & Privacy

Checklist:
- PII handling: Ensure user emails and client data are stored and processed per privacy policy; provide deletion flow.
- Data retention: Policies for logs, backups, and user data.
- GDPR/Local laws: If operating in EU, ensure data subject access & deletion processes.
- PCI: If storing payment data or doing heavy payment processing, confirm PCI scope is managed by Stripe; do not store card data.

Action items:
- Document data retention policy and deletion processes.

---

## 12) Final go-live checklist (pre-deploy)

- [ ] All lint and build errors fixed; CI green.
- [ ] Unit, integration, and E2E tests passing.
- [ ] Sentry, monitoring, and alerts configured and tested.
- [ ] DB backups configured and tested restore path.
- [ ] Environment variables set in production.
- [ ] Rate limiting and DDOS protections in place.
- [ ] Secrets reviewed and rotated if necessary.
- [ ] Payment provider keys configured and webhooks validated.
- [ ] Feature flags set for staged rollout (if needed).
- [ ] Rollback & incident response runbook published.
- [ ] Stakeholders notified of release window and support contacts.

---

## 13) Post-launch runbook (first 72 hours)

- Monitor error rate and latency dashboards every 15 minutes for the first 6 hours.
- Watch payment reconciliation and failed jobs.
- Keep an on-call rotation and Slack/SMS alerts for high-severity events.
- Schedule a 24-48 hour post-mortem meeting to collect feedback.

---

## 14) References & useful commands

- Local dev: pnpm dev / npm run dev
- Build: pnpm build (checks: pnpm db:generate, pnpm lint, pnpm typecheck)
- Tests: pnpm test or vitest run
- Prisma: pnpm db:migrate, pnpm db:generate, pnpm db:studio

---

## 15) Where to start (recommended order)

1. Fix any build/lint/test failures (CI must be green).
2. Confirm environment variables and secrets in production.
3. Connect Sentry and Neon; configure backups & health checks.
4. Run security scans (Semgrep) and fix critical issues.
5. Run integration & E2E tests (booking → invoice → payment).
6. Configure monitoring, alerts, and run a smoke test.
7. Schedule the release window and perform go-live.

---

Generated for: Admin Dashboard — pre-launch readiness
Saved: docs/admin-dashboard-prelaunch-audit.md

