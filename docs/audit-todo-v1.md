# Audit TODO v1 — Prelaunch Action Plan

This ordered, dependency-aware checklist breaks the prelaunch audit into specific, measurable, outcome-oriented tasks. Each top-level task is ordered by prerequisites and includes clearly defined subtasks and an "Update" block where progress should be recorded:
- ✅ What was completed
- ✅ Why it was done
- ✅ Next steps (if any)

Instructions: For each task, update the "Update" block with progress notes and tick subtasks as you complete them.

---

## 1) Build & CI: Fix lint/build errors and ensure CI passes (prerequisite for all other work)
- [ ] 1.1 Run local CI pipeline: pnpm db:generate && pnpm lint && pnpm build
- [ ] 1.2 Fix all ESLint errors; run eslint . --ext .js,.ts,.tsx and address each rule violation
  - [ ] Convert forbidden require() imports in server code to ES module imports where appropriate
  - [ ] For runtime-lazy requires intentionally used (e.g. lazy prisma client), add an eslint comment or rule override with justification and tests
- [ ] 1.3 Fix TypeScript type errors (pnpm typecheck) and ensure tsc --noEmit passes
- [ ] 1.4 Re-run CI in branch and confirm green build

Update:
- ✅ What was completed: Converted require('crypto') -> import { createHash } from 'crypto' in src/app/api/admin/bookings/route.ts and saved audit docs.
- ✅ Why it was done: ESLint no-require-imports rule caused Netlify build to fail; needed ES import to satisfy lint in build.
- ✅ Next steps: Run full lint to find other require() occurrences (e.g. src/lib/prisma.ts); decide per-file whether to convert to import or add documented exception.

---

## 2) Secrets & Production env (must be configured before full testing)
- [ ] 2.1 Inventory required env vars: NEXTAUTH_SECRET, NEXTAUTH_URL, DATABASE_URL or NETLIFY_DATABASE_URL, SENTRY_DSN, STRIPE keys, UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN, CRON_SECRET, FROM_EMAIL
- [ ] 2.2 Verify all required secrets are set in Netlify/Vercel and CI; fail build early if missing
- [ ] 2.3 Rotate any test keys that were reused in repo or staging
- [ ] 2.4 Add a script to validate presence of required env vars at build start (scripts/check-required-envs.sh)

Update:
- ✅ What was completed:
- ✅ Why it was done:
- ✅ Next steps:

---

## 3) RBAC & API Security (verify for every /api/admin/** route)
- [ ] 3.1 Add automated permission tests asserting that admin-only endpoints return 401/403 for non-admin roles (use vitest or integration tests)
- [ ] 3.2 Audit all api/admin routes; ensure getServerSession(authOptions) + hasPermission(session.user.role, PERMISSIONS.*) guard exists
- [ ] 3.3 Create a lint/test rule to flag routes missing permission checks (grep for getServerSession without follow-up permission check)
- [ ] 3.4 Harden critical endpoints (users, invoices, payments) to require TEAM_MANAGE or equivalent high privilege

Update:
- ✅ What was completed:
- ✅ Why it was done:
- ✅ Next steps:

---

## 4) Prisma migrations, DB backups & restore runbook (prereq for data integrity tests)
- [ ] 4.1 Confirm prisma/migrations are up-to-date and run pnpm db:generate locally
- [ ] 4.2 Run migrations in a staging environment; verify no destructive operations without backups
- [ ] 4.3 Implement automated daily backups for production DB (Neon or hosted Postgres); add retention policy
- [ ] 4.4 Create and document a DB restore runbook and perform a restore test to staging
- [ ] 4.5 Add migration rollback guidance in docs and test a rollback on a non-production clone

Update:
- ✅ What was completed:
- ✅ Why it was done:
- ✅ Next steps:

---

## 5) Database performance & schema improvements
- [ ] 5.1 Identify N+1 query hotspots by reviewing list endpoints (bookings, services, clients) and tests
- [ ] 5.2 Add necessary eager-loading (include/select) in Prisma queries to avoid N+1 on list pages
- [ ] 5.3 Add DB indexes for fields used in filters/sorts: scheduledAt, status, serviceId, clientEmail, createdAt
- [ ] 5.4 Run EXPLAIN ANALYZE on heavy queries and optimize based on results

Update:
- ✅ What was completed:
- ✅ Why it was done:
- ✅ Next steps:

---

## 6) Connection pooling & serverless DB considerations
- [ ] 6.1 Ensure Prisma client is reused in serverless environment (verify src/lib/prisma.ts behavior)
- [ ] 6.2 If using serverless Postgres (Neon), validate recommended patterns (single client, pool adapters) and document them
- [ ] 6.3 Add health check endpoint for DB connectivity

Update:
- ✅ What was completed:
- ✅ Why it was done:
- ✅ Next steps:

---

## 7) Caching strategy (Redis/Upstash) for expensive endpoints
- [ ] 7.1 Identify heavy read endpoints suitable for caching (bookings list, services list, analytics)
- [ ] 7.2 Implement caching layer using src/lib/cache/redis.ts or Upstash; define TTLs and cache keys
- [ ] 7.3 Implement cache invalidation on writes (create/update/delete) and audit correctness
- [ ] 7.4 Add metrics to measure cache hit ratio

Update:
- ✅ What was completed:
- ✅ Why it was done:
- ✅ Next steps:

---

## 8) File uploads scanning & quarantine workflow
- [ ] 8.1 Verify ClamAV integration (src/lib/clamav.ts) is wired to the upload pipeline
- [ ] 8.2 Ensure quarantined files are stored in a private bucket and inaccessible by public URLs
- [ ] 8.3 Add automated tests to simulate infected file upload and quarantine path
- [ ] 8.4 Add notification/alert for quarantined files and manual review workflow

Update:
- ✅ What was completed:
- ✅ Why it was done:
- ✅ Next steps:

---

## 9) Payments & webhooks (Stripe)
- [ ] 9.1 Use separate Stripe accounts for staging and production; verify keys are in env
- [ ] 9.2 Validate webhook signature verification and implement idempotency for webhook handler (src/lib/payments/stripe.ts)
- [ ] 9.3 Add automated integration tests for payment success, failure, and webhook retries
- [ ] 9.4 Add audit log entries for payment state changes

Update:
- ✅ What was completed:
- ✅ Why it was done:
- ✅ Next steps:

---

## 10) Error monitoring, logging & Sentry setup
- [ ] 10.1 Configure Sentry DSN in production and connect both server and client SDKs (sentry.server.config.ts, sentry.client.config.ts)
- [ ] 10.2 Create Sentry release tagging in CI and verify source maps upload
- [ ] 10.3 Add structured logging with correlation IDs (src/lib/logger.ts) and ensure no secrets are logged
- [ ] 10.4 Configure alerts for error rate spikes and set escalation policy

Update:
- ✅ What was completed:
- ✅ Why it was done:
- ✅ Next steps:

---

## 11) Observability: metrics, tracing, synthetic checks
- [ ] 11.1 Pick metrics provider or cloud defaults (Netlify/Vercel + Datadog/Grafana) and instrument key metrics: request latency, error rate, DB latency, background job failures
- [ ] 11.2 Implement synthetic health checks for critical flows (admin login, create booking, invoice creation) and run them post-deploy
- [ ] 11.3 Optionally add tracing for booking and payment flows

Update:
- ✅ What was completed:
- ✅ Why it was done:
- ✅ Next steps:

---

## 12) Security scanning & dependency management
- [ ] 12.1 Run Semgrep rules and fix findings; add Semgrep CI job
- [ ] 12.2 Run dependency vulnerability scan (Snyk/Dependabot) and remediate critical or high issues
- [ ] 12.3 Add automated dependency updates or weekly review process

Update:
- ✅ What was completed:
- ✅ Why it was done:
- ✅ Next steps:

---

## 13) Performance testing & scaling
- [ ] 13.1 Run load tests targeting admin flows (concurrent users for bookings list and exports). Capture CPU, memory, DB metrics
- [ ] 13.2 Optimize slow endpoints and tune DB indexes/queries
- [ ] 13.3 Validate CDN/cache behavior for static assets and set cache-control headers

Update:
- ✅ What was completed:
- ✅ Why it was done:
- ✅ Next steps:

---

## 14) CI/CD: smoke tests, canary, and post-deploy checks
- [ ] 14.1 Add post-deploy smoke tests to CI that run against the deployed preview (admin login, booking create)
- [ ] 14.2 Implement canary deployment flagging and feature flags for risky changes
- [ ] 14.3 Add auto rollback triggers on smoke test failures

Update:
- ✅ What was completed:
- ✅ Why it was done:
- ✅ Next steps:

---

## 15) Compliance & privacy
- [ ] 15.1 Document PII data flows and storage locations; add DSAR & deletion endpoints/process
- [ ] 15.2 Publish data retention policy and log retention durations
- [ ] 15.3 Confirm PCI scope is limited and card data is never stored; rely on Stripe

Update:
- ✅ What was completed:
- ✅ Why it was done:
- ✅ Next steps:

---

## 16) Incident response, runbooks & on-call
- [ ] 16.1 Create incident response runbook with contacts, rollback steps, and severity levels
- [ ] 16.2 Schedule on-call rotation and configure alerting channels (PagerDuty/Slack/SMS)
- [ ] 16.3 Run a DR drill: simulate restore from backup and verify app functionality

Update:
- ✅ What was completed:
- ✅ Why it was done:
- ✅ Next steps:

---

## 17) Code cleanup & UX polish (non-blocking but required before launch)
- [ ] 17.1 Replace placeholder components in /admin/calendar and other TODOs with final UI elements (define acceptance criteria)
- [ ] 17.2 Refactor duplicate API stubs under /api/admin/service-requests into a single canonical implementation
- [ ] 17.3 Convert inline styles into classes and maintain original style variables; rename classes to semantic names (follow repo style rules)
- [ ] 17.4 Ensure media queries from original code are preserved

Update:
- ✅ What was completed:
- ✅ Why it was done:
- ✅ Next steps:

---

## 18) Final go-live checklist (execute once previous items completed)
- [ ] 18.1 CI green and all tests passing (unit, integration, E2E)
- [ ] 18.2 Production env vars set and verified
- [ ] 18.3 Backups configured and restore verified
- [ ] 18.4 Sentry and alerting active and tested
- [ ] 18.5 Payment provider keys configured and webhook signing validated
- [ ] 18.6 Stakeholders notified and support on-call assigned
- [ ] 18.7 Post-deploy smoke tests enabled

Update:
- ✅ What was completed:
- ✅ Why it was done:
- ✅ Next steps:

---

## Appendix: How to update this file
- Edit the Update: block under each task with the three items. Replace the placeholder lines with short bullets or sentences.
- Use the checkboxes to track progress. Keep entries concise and time-stamped if useful.

Saved: docs/audit-todo-v1.md
