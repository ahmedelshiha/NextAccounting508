# Redundancy & Consolidation Report

Date: 2025-10-08
Repository: accounting-firm

## Executive Summary
This report catalogs duplicate, overlapping, or drift-prone code paths and configurations and documents recent remediations. It provides concrete consolidation recommendations, a phased implementation plan, and acceptance criteria to reduce maintenance burden and production risk.

Key actions:
- Consolidate duplicate API endpoints (auth register, dev-login, health checks, Sentry test routes, cron triggers).
- Unify duplicated components (SettingsNavigation) and eliminate accidental wrapper bypasses.
- Keep a single canonical session resolution in API wrappers; forbid implicit auth bypass in shared paths.
- Ensure Edge-runtime compatibility; remove Node-only imports from shared libs.
- Maintain a single, documented datasource env strategy (DATABASE_URL primary; NETLIFY_DATABASE_URL accepted via wrappers/validators).

---

## Findings Overview

| ID | Area | Files/Paths | Impact | Status | Recommendation |
|----|------|-------------|--------|--------|----------------|
| F1 | API: Auth Register (duplicate path) | `src/app/api/auth/register/route.ts`, `src/app/api/auth/register/register/route.ts` | High | Open | Keep single endpoint at `auth/register`; remove nested `register/register`. Add redirect if needed. |
| F2 | API: Dev Login (two entry points) | `src/app/api/dev-login/route.ts`, `src/app/api/_dev/login/route.ts` | High | Open | Keep one dev login entry point. Prefer `/_dev/login` gated by env/role; remove the other or alias explicitly. |
| F3 | Health Checks (divergent) | `src/app/api/security/health/route.ts`, `src/app/api/admin/system/health/route.ts`, `netlify/functions/health-monitor.ts` | High | Resolved | Shared health module implemented at `src/lib/health.ts`; callers refactored to reuse it. |
| F4 | SettingsNavigation component duplication | `src/components/admin/SettingsNavigation.tsx`, `src/components/admin/settings/SettingsNavigation.tsx` | High | Open | Consolidate to a single canonical component. Provide barrel re-export to preserve import paths during transition. |
| F5 | Cron entrypoint duplication | `netlify/functions/cron-reminders.ts` and `/api/cron/reminders/route.ts` (and similar cron routes) | Medium | In Progress | Keep shared job logic in `src/lib/cron/*` and call from both contexts to avoid drift. Verify all cron routes are refactored. |
| F6 | Sentry test endpoints (two) | `src/app/api/sentry-check/route.ts`, `src/app/api/sentry-example/route.ts` | Low | Open | Keep one canonical test path; deprecate the other with redirect. |
| F7 | RBAC scripts overlap | `scripts/check_admin_rbac.js`, `scripts/audit-admin-rbac.js` | Medium | Open | Combine or keep one entry with flags; document usage. |
| F8 | Edge runtime incompatibility (fixed) | `src/lib/default-tenant.ts` | Medium | Resolved | Replaced Node crypto usage with `safeRandomUUID` (Web Crypto first; no `require()`). |
| F9 | API wrapper implicit bypass (fixed) | `src/lib/api-wrapper.ts` | High | Resolved | Removed implicit preview bypass and extra fallback; use one session resolution path only. |
| F10 | Playwright config duplicate imports | `e2e/playwright.config.ts` | Low | N/A | Current file shows no duplicate imports; prior note removed. |
| F11 | Prisma datasource env coherence | `prisma/schema.prisma`, `scripts/check-required-envs.sh`, `src/lib/prisma.ts` | Low | Aligned | Schema uses `DATABASE_URL`; validator accepts `DATABASE_URL|NETLIFY_DATABASE_URL`; client wrapper supports both. Keep as-is with docs alignment. |

Notes:
- No duplicate `usePerformanceMonitoring.tsx` found. Prior mention was a false positive; removed from scope.

---

## Detailed Findings

### F1. Duplicate Auth Register Routes
- Paths:
  - `src/app/api/auth/register/route.ts`
  - `src/app/api/auth/register/register/route.ts`
- Risk: Confusing API surface; potential drift or conflicting behavior.
- Recommendation: Keep `auth/register`. Remove nested `register/register` or convert to redirect handler to preserve old clients.
- Steps:
  1) Remove nested file.
  2) If needed, implement redirect from `/api/auth/register/register` to `/api/auth/register`.
  3) Update tests and API docs.
- Acceptance: Single handler serves register; no 404s for legacy path if redirect is required.

### F2. Duplicate Dev Login Routes
- Paths:
  - `src/app/api/dev-login/route.ts`
  - `src/app/api/_dev/login/route.ts`
- Risk: Ambiguous environment gating; accidental exposure in non-dev.
- Recommendation: Keep only `/_dev/login` with strict gating (NODE_ENV + IP/secret). Remove the duplicate or alias internally.
- Steps: Remove duplicate, add runtime guard, document usage.
- Acceptance: Exactly one dev login route, gated and tested.

### F3. Divergent Health Implementations
- Paths:
  - `src/app/api/security/health/route.ts`
  - `src/app/api/admin/system/health/route.ts`
  - `netlify/functions/health-monitor.ts`
- Risk: Logic drift across endpoints/function.
- Recommendation: Create `src/lib/health.ts` exposing `collectHealth()` and reuse.
- Steps: Extract shared checks (db, redis, external APIs), refactor callers.
- Acceptance: All endpoints/functions call the same library and return consistent shape.

### F4. Duplicate SettingsNavigation Components
- Paths:
  - `src/components/admin/SettingsNavigation.tsx`
  - `src/components/admin/settings/SettingsNavigation.tsx`
- Risk: UI drift; inconsistent nav between admin screens.
- Recommendation: Unify logic in one component. Provide `src/components/admin/settings/index.ts` to re-export for both import styles temporarily.
- Acceptance: Single source; snapshot tests stable.

### F5. Duplicated Cron Entry Points
- Paths: `netlify/functions/cron-reminders.ts`, `/api/cron/reminders/route.ts`, plus other cron routes under `src/app/api/cron/*`
- Status: Shared job logic already lives in `src/lib/cron/*` (e.g., `src/lib/cron/reminders.ts`, `src/lib/cron.ts`).
- Recommendation: Ensure all cron routes/functions call into these libs; remove any logic duplication.
- Acceptance: All cron entrypoints defer to shared modules; unit tests cover the shared functions.

### F6. Sentry Test Endpoints
- Paths: `src/app/api/sentry-check/route.ts`, `src/app/api/sentry-example/route.ts`; page: `src/app/sentry-example-page/page.tsx`
- Recommendation: Keep one canonical Sentry test endpoint (`sentry-check`). Remove or redirect the other; keep example page if needed, pointed at the canonical route.

### F7. RBAC Scripts Overlap
- Paths: `scripts/check_admin_rbac.js`, `scripts/audit-admin-rbac.js`
- Issue: Overlapping intent (verify vs audit).
- Recommendation: Unify as `scripts/rbac.js` with flags (`--audit`, `--check`), or keep one entry and alias the other.
- Acceptance: Single documented entry point.

### F8. Edge Runtime Incompatibility (Resolved)
- Path: `src/lib/default-tenant.ts`
- Issue: Prior Node `crypto` usage caused Edge runtime warning.
- Remediation: Implemented `safeRandomUUID` using Web Crypto first and a non-Node fallback; removed `require()` to satisfy ESLint and Edge.

### F9. API Wrapper Implicit Bypass (Resolved)
- Path: `src/lib/api-wrapper.ts`
- Issue: Wrapper could implicitly bypass auth during tests/preview, causing non-determinism.
- Remediation: Removed implicit bypass and extra `next-auth` fallback; wrapper now uses a single `next-auth/next` session resolution path. Preview bypass (if any) must be explicitly chosen by the route and is disabled during tests.
- Impact: Deterministic 401 for unauthenticated routes (e.g., `/api/admin/thresholds`); test suite passes.

### F10. Playwright Config Duplicate Imports (N/A)
- Path: `e2e/playwright.config.ts`
- Finding: No duplicate imports observed; prior note removed.

### F11. Prisma Datasource Env Coherence (Aligned)
- Paths:
  - `prisma/schema.prisma` → `datasource db { provider = "postgresql"; url = env("DATABASE_URL") }`
  - `scripts/check-required-envs.sh` → accepts `DATABASE_URL|NETLIFY_DATABASE_URL`
  - `src/lib/prisma.ts` → prefers `NETLIFY_DATABASE_URL` fallback to `DATABASE_URL`
- Recommendation: Keep current flexible approach; document `DATABASE_URL` as canonical, with `NETLIFY_DATABASE_URL` supported for Netlify.

---

## Recent Remediations (2025-10-08)

- R1 (Resolved): Duplicate import in cron module
  - File: `src/lib/cron.ts`
  - Change: Removed duplicate `import prisma` and unused `date-fns` imports to fix TS2300 duplicate identifier errors during typecheck/build.

- R2 (Resolved): Redundant auth session resolution and implicit bypass
  - File: `src/lib/api-wrapper.ts`
  - Change: Removed fallback to `next-auth` and the implicit preview auth bypass from the wrapper. Wrapper now resolves session via `next-auth/next` only; any preview bypass must be explicitly invoked by routes and is disabled during tests.

- R3 (Resolved): Edge-incompatible Node crypto import
  - File: `src/lib/default-tenant.ts`
  - Change: Replaced Node `crypto.randomUUID` with `safeRandomUUID` (Web Crypto first; no `require()`), eliminating Edge warnings and ESLint errors.

- R4 (Resolved): Extracted shared health module and refactored callers
  - File: `src/lib/health.ts` and callers: `src/app/api/security/health/route.ts`, `src/app/api/admin/system/health/route.ts`, `netlify/functions/health-monitor.ts`
  - Change: Implemented `collectSystemHealth()` and `toSecurityHealthPayload()`; refactored endpoints and Netlify function to call the shared module for consistent health rollups.

---

## Implementation Plan (Phased)

1) High-Impact Cleanup (Day 0–1)
- Remove `auth/register/register` route; add redirect if needed (F1).
- Choose one dev login path; enforce gating (F2).
- Consolidate `SettingsNavigation` to one source; add temporary re-export (F4).

2) Shared Logic Extraction (Day 1–2)
- Create `src/lib/health.ts`; refactor health endpoints and Netlify function (F3).
- Verify all cron entrypoints call `src/lib/cron/*` and remove duplicated logic (F5).

3) Config and Tooling (Day 2)
- Unify RBAC scripts or document single entry (F7).
- Confirm datasource env docs emphasize `DATABASE_URL` with `NETLIFY_DATABASE_URL` supported by wrappers (F11).

4) Guardrails (Day 2–3)
- ESLint/CI: forbid `require()` in TS, detect duplicate component basenames in critical paths (e.g., `SettingsNavigation.tsx`).
- Semgrep rules: flag new duplicate routes (e.g., `/api/**/register` twice) and dev-only endpoints exposure.
- Unit tests for extracted `health` and one cron job.

---

## Acceptance Criteria
- No duplicate routes for register/dev-login; legacy paths handled by redirect if required (F1, F2).
- Health endpoints and Netlify function share a single implementation (F3).
- Only one `SettingsNavigation` source exists; imports remain stable (F4).
- Cron entrypoints defer to shared modules (F5).
- Sentry test routes reduced to a single canonical endpoint (F6).
- RBAC scripts consolidated or clearly documented (F7).
- Edge runtime compatibility preserved in shared libs; lint passes (F8).
- API wrapper maintains a single session resolution path; tests enforce unauthenticated 401s (F9).
- Datasource env strategy is consistent and documented (F11).

---

## Risk & Rollback Considerations
- API deprecations should include redirects and release notes.
- Keep short-lived re-exports for components to avoid breaking imports; remove after one release cycle.
- Validate cron and health behaviors in staging before production cutover.

---

## Appendix: Discovery Methods
- File scans: enumerated `src/app/api/**/route.ts` to list endpoints.
- Targeted checks for duplicates: register/dev-login, health, cron, Sentry test routes, `SettingsNavigation`.
- Config review: `e2e/playwright.config.ts`, `prisma/schema.prisma`, `netlify/functions/*`, `scripts/check-required-envs.sh`.

---

## Task Tracker

- [x] [F1] Consolidate auth register routes — remove src/app/api/auth/register/register/route.ts; add redirect to /api/auth/register if needed; update tests and API docs.
- [x] [F2] Unify dev login endpoint — keep /api/_dev/login with strict gating (env + IP/secret); remove or redirect /api/dev-login; update docs.
- [x] [F3] Extract shared health module — create src/lib/health.ts (collectHealth); refactor /api/security/health, /api/admin/system/health, and netlify/functions/health-monitor.ts to reuse.
- [ ] [F4] Consolidate SettingsNavigation — pick canonical component; add barrel re-export if needed; update imports repo-wide; ensure snapshots pass.
- [ ] [F5] Deduplicate cron entrypoints — ensure all cron API routes and Netlify cron functions call src/lib/cron/* (reminders, refresh-exchange-rates, rescan-attachments, telemetry); add unit tests for shared jobs.
- [ ] [F6] Canonicalize Sentry test endpoint — keep /api/sentry-check; redirect /api/sentry-example to canonical; update sentry-example-page to call canonical; update docs.
- [ ] [F7] Unify RBAC scripts — merge scripts/check_admin_rbac.js and scripts/audit-admin-rbac.js into scripts/rbac.js with flags (--check/--audit); update npm scripts and docs.
- [ ] [F8] Edge runtime guardrails — add CI rule to block Node-only imports in Edge routes and shared libs; add lint/semgrep checks.
- [ ] [F9] Auth wrapper guardrails — add unit tests ensuring unauthenticated admin routes return 401; add semgrep rule to forbid implicit auth bypass patterns in wrappers.
- [ ] [F11] Datasource env coherence — document DATABASE_URL as canonical; confirm prisma.ts continues to accept NETLIFY_DATABASE_URL fallback; update docs/env-reference and scripts/check-required-envs.sh notes.
- [ ] Repo hygiene — add CI job to detect duplicate route paths and duplicate component basenames in critical areas (e.g., SettingsNavigation).
- [ ] Docs — update docs/redundancy-report.md and related docs after each fix; include redirects and deprecation notes.
