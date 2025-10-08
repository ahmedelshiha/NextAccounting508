# Codebase Redundancy & Consolidation Report

Date: 2025-10-05
Repository: accounting-firm

## Executive Summary
This report catalogs duplicate, overlapping, or drift-prone code paths and configurations. It provides concrete consolidation recommendations, an implementation plan, and acceptance criteria to reduce maintenance burden and production risk.

Key actions:
- Remove duplicate API routes and consolidate paths.
- Unify duplicated components and hooks to a single canonical implementation.
- Extract shared logic for health checks and cron jobs into reusable modules.
- Align Prisma datasource environment variable usage with documented env validation.
- Fix minor config redundancies and enforce CI checks to prevent recurrence.

---

## Findings Overview

| ID | Area | Files/Paths | Impact | Recommendation |
|----|------|-------------|--------|----------------|
| F1 | API: Auth Register | `src/app/api/auth/register/route.ts`, `src/app/api/auth/register/register/route.ts` | High | Keep single endpoint at `auth/register`; remove nested `register/register`. Add redirect if needed. |
| F2 | API: Dev Login | `src/app/api/dev-login/route.ts`, `src/app/api/_dev/login/route.ts` | High | Keep one dev login entry point. Prefer `/_dev/login` gated by env/role; remove the other or alias explicitly. |
| F3 | Health Checks | `src/app/api/security/health/route.ts`, `src/app/api/admin/system/health/route.ts`, `netlify/functions/health-monitor.ts` | High | Extract shared health module (e.g., `src/lib/health.ts`) and call from all entry points. |
| F4 | Hook Duplication | `src/hooks/admin/usePerformanceMonitoring.ts`, `src/hooks/admin/usePerformanceMonitoring.tsx` | High | Merge into one file (no JSX ⇒ `.ts`). Update imports repo-wide. |
| F5 | Component Duplication | `src/components/admin/SettingsNavigation.tsx`, `src/components/admin/settings/SettingsNavigation.tsx` | High | Consolidate to a single canonical component. Provide barrel re-export to preserve import paths during transition. |
| F6 | Playwright Config | `e2e/playwright.config.ts` | Medium | Duplicate import line detected. Remove redundancy. |
| F7 | RBAC Scripts | `scripts/check_admin_rbac.js`, `scripts/audit-admin-rbac.js` | Medium | Combine or keep one entry with flags; document usage. |
| F8 | Prisma Env Var Drift | `prisma/schema.prisma` (uses `NETLIFY_DATABASE_URL`) vs `scripts/check-required-envs.sh` (accepts `DATABASE_URL|NETLIFY_DATABASE_URL`) | Medium | Standardize on one var (recommend `DATABASE_URL`). Map alternatives in env or wrapper. Update docs. |
| F9 | Admin Layout Variants | `src/app/admin/layout-nuclear.tsx`, `src/app/admin/page-nuclear.tsx`, `src/app/admin/page-simple.tsx` | Low | If experimental, gate behind flag or move to `archive/`. Keep only the active variant in default flow. |
| F10 | Sentry Test Endpoints | `src/app/api/sentry-check/route.ts`, `src/app/api/sentry-example/route.ts` | Low | Keep one canonical test path; deprecate the other with clear docs. |
| F11 | Cron Job Duplication | `netlify/functions/cron-reminders.ts` vs `/api/cron/reminders/route.ts` (and similar) | Medium | Extract shared cron job functions to `src/lib/cron/*` and call from both contexts. |

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
- Recommendation: Keep only `/_dev/login` with strict gating (NODE_ENV check + admin IP or secret). Remove the duplicate or alias internally.
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

### F4. Duplicate Hook Files (same name)
- Paths:
  - `src/hooks/admin/usePerformanceMonitoring.ts`
  - `src/hooks/admin/usePerformanceMonitoring.tsx`
- Risk: Import ambiguity; unexpected behavior if imports resolve inconsistently.
- Recommendation: Merge into `.ts` if no JSX; remove the other; run repo-wide import fix.
- Acceptance: Only one file exists; all imports compile.

### F5. Duplicate SettingsNavigation Components
- Paths:
  - `src/components/admin/SettingsNavigation.tsx`
  - `src/components/admin/settings/SettingsNavigation.tsx`
- Risk: UI drift; inconsistent nav between admin screens.
- Recommendation: Unify logic in one component. Provide `src/components/admin/settings/index.ts` to re-export for both import styles temporarily.
- Acceptance: Single source; snapshot tests stable.

### F6. Playwright Config Redundancy
- Path: `e2e/playwright.config.ts`
- Issue: Duplicate `import { defineConfig, devices } from '@playwright/test'` line.
- Action: Remove redundant import.
- Acceptance: Tests run identically; no duplicate declaration warnings.

### F7. RBAC Scripts Overlap
- Paths: `scripts/check_admin_rbac.js`, `scripts/audit-admin-rbac.js`
- Issue: Overlapping intent (verify vs audit).
- Recommendation: Unify as `scripts/rbac.js` with flags (`--audit`, `--check`), or keep one entry and alias the other.
- Acceptance: Single documented entry point.

### F8. Prisma Datasource Env Mismatch
- Paths:
  - `prisma/schema.prisma` → `datasource db { url = env("NETLIFY_DATABASE_URL") }`
  - `scripts/check-required-envs.sh` → accepts `DATABASE_URL|NETLIFY_DATABASE_URL`
- Recommendation: Standardize on `DATABASE_URL` in schema; during Netlify deploy set `DATABASE_URL=$NETLIFY_DATABASE_URL` in env, or change env validator to enforce one canonical var.
- Acceptance: One canonical var documented and used by Prisma; builds and local dev align with docs.

### F9. Admin Layout Variants
- Paths: `src/app/admin/layout-nuclear.tsx`, `src/app/admin/page-nuclear.tsx`, `src/app/admin/page-simple.tsx`
- Recommendation: Mark experimental layouts behind a feature flag or move to `archive/`. Keep only the active layout in default routing.

### F10. Sentry Test Endpoints
- Paths: `src/app/api/sentry-check/route.ts`, `src/app/api/sentry-example/route.ts`
- Recommendation: Keep one canonical Sentry test endpoint (`sentry-check`). Remove or redirect the other.

### F11. Duplicated Cron Entry Points
- Paths: `netlify/functions/cron-reminders.ts` and `/api/cron/reminders/route.ts` (and similar cron routes)
- Recommendation: Extract job functions to `src/lib/cron/*.ts` and call from both entry points to avoid logic drift.

---

## Implementation Plan (Phased)

1) High-Impact Cleanup (Day 0–1)
- Remove `auth/register/register` route; add redirect if needed.
- Choose one dev login path; enforce gating.
- Merge `usePerformanceMonitoring` into a single file.
- Consolidate `SettingsNavigation` to one source; add temporary re-export.

2) Shared Logic Extraction (Day 1–2)
- Create `src/lib/health.ts`; refactor health endpoints and Netlify function.
- Create `src/lib/cron/` module; refactor cron routes and Netlify cron functions.

3) Config and Tooling (Day 2)
- Fix Playwright duplicate import.
- Align Prisma datasource env var; update `docs/ENVIRONMENT_VARIABLES_REFERENCE.md` and `scripts/check-required-envs.sh` if needed.
- Unify RBAC scripts or document single entry.

4) Guardrails (Day 2–3)
- Add CI checks: ESLint rule for duplicate imports, custom script to detect duplicate file basenames in same folder, Semgrep rules for dev-only routes exposure.
- Add unit tests for health module and one cron job.

---

## Acceptance Criteria
- No duplicate routes for register/dev-login; legacy paths handled by redirect if required.
- Health endpoints and Netlify function share a single implementation.
- Only one `usePerformanceMonitoring` and `SettingsNavigation` source exists.
- Playwright config import unique; tests pass.
- Prisma datasource env var consistent with docs and validator.
- CI guardrails in place to prevent regressions.

---

## Risk & Rollback Considerations
- API deprecations should include redirects and release notes.
- Keep short-lived re-exports for components to avoid breaking imports; remove after one release cycle.
- Validate cron and health behaviors in staging before production cutover.

---

## Update Log (2025-10-08)

- R1 (Resolved): Duplicate import in cron module
  - File: `src/lib/cron.ts`
  - Change: Removed duplicate `import prisma` and unused `date-fns` imports to fix TS2300 Duplicate identifier errors during typecheck/build.
  - Impact: Build stability restored; eliminates redundant imports.

- R2 (Resolved): Redundant auth session resolution and implicit bypass
  - File: `src/lib/api-wrapper.ts`
  - Change: Removed fallback to `next-auth` and the implicit preview auth bypass from the wrapper. Wrapper now resolves session via `next-auth/next` only; any preview bypass must be explicitly invoked by routes and is disabled during tests.
  - Impact: Deterministic 401 for unauthenticated access (e.g., `/api/admin/thresholds`), test suite passes; reduces drift between environments.

- R3 (Resolved): Edge-incompatible Node crypto import
  - File: `src/lib/default-tenant.ts`
  - Change: Replaced `crypto.randomUUID` (Node import) with `safeRandomUUID` that prefers Web Crypto (`globalThis.crypto.randomUUID` / `getRandomValues`) and falls back to a deterministic UUID-like string without `require()`.
  - Impact: Removes Edge-runtime warning and ESLint `@typescript-eslint/no-require-imports` violation; unified runtime-safe implementation.

- F11 (In Progress): Cron entrypoint consolidation
  - Status: Shared job logic exists under `src/lib/cron/*`. Netlify cron and API cron routes should continue to call shared modules to avoid drift. Further audit recommended to ensure all cron routes reference shared library.

- Open Findings: F1, F2, F5, F6, F7, F8, F9, F10 remain per prior plan; prioritize F1/F2/F8 next.

Guardrails added/affirmed:
- Enforce no `require()` in TS via ESLint; prefer Web Crypto or conditional dynamic imports only where allowed.
- Avoid multiple auth session resolution paths in shared wrappers; keep a single canonical flow.

---

## Appendix: Discovery Methods
- File scans: globbed `src/app/api/**/route.ts` to enumerate endpoints.
- Targeted checks for duplicates: `SettingsNavigation`, `usePerformanceMonitoring`, dev-login, register routes, health/cron.
- Config review: `e2e/playwright.config.ts`, `prisma/schema.prisma`, `netlify.toml`, `scripts/check-required-envs.sh`.
