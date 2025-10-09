# Redundancy Report

Date: 2025-10-09
Repository: accounting-firm

## Executive Summary
This report identifies duplicate or overlapping code paths, components, and scripts, with concrete consolidation recommendations and a phased plan to reduce maintenance overhead and risk.

---

## Findings Overview
| ID | Area | Files/Paths | Impact | Status | Recommendation |
|----|------|-------------|--------|--------|----------------|
| F1 | API: Dev Login duplicated | `src/app/api/dev-login/route.ts`, `src/app/api/_dev/login/route.ts` | High | Resolved | `/_dev/login` remains canonical with env/IP gating; `/api/dev-login` route removed and callers updated. |
| F2 | API: Health endpoints overlap (intended) | `src/app/api/security/health/route.ts`, `src/app/api/admin/system/health/route.ts` | Medium | Confirmed | Keep both, but ensure the public endpoint remains minimal and Node runtime is used to avoid Edge size limits. Document scopes. |
| F3 | Cron entrypoints duplicated (API vs Netlify) | `src/app/api/cron/*`, `netlify/functions/cron-*.ts` | Medium | Resolved | Centralized cron job logic in `src/lib/cron/*`; API and Netlify entrypoints now delegate to shared modules. |
| F4 | UI component duplication: Settings Navigation | `src/components/admin/SettingsNavigation.tsx`, `src/components/admin/settings/SettingsNavigation.tsx` | High | Resolved | Consolidated into canonical `src/components/admin/settings/SettingsNavigation.tsx`; top-level path now re-exports the canonical component. |
| F5 | UI component duplication: BulkActionsPanel (3x) | `src/components/admin/services/BulkActionsPanel.tsx`, `src/components/dashboard/tables/BulkActionsPanel.tsx`, `src/app/admin/tasks/components/bulk/BulkActionsPanel.tsx` | High | Resolved | Implemented shared `src/components/common/bulk/BulkActionsPanel.tsx` and replaced duplicates with thin wrappers that delegate to the shared component. |
| F6 | Sentry test endpoints (2x) | `src/app/api/sentry-check/route.ts`, `src/app/api/sentry-example/route.ts` | Low | Open | Keep only `sentry-check`; have `sentry-example` redirect (307) or remove it. Update the example page to use the canonical route. |
| F7 | Env/tooling references drift | `package.json` scripts, `docs/env-reference.md`, `doppler.yaml` | Medium | Partially Resolved | Doppler removed from scripts. Align docs to reflect current env strategy; consider removing `doppler.yaml` if no longer used. |

Notes:
- Prisma datasource strategy is consistent (DATABASE_URL canonical; NETLIFY_DATABASE_URL supported by scripts). Keep as-is.

---

## Detailed Findings
### F1. Duplicate Dev Login Routes
- Paths:
  - Canonical: `src/app/api/_dev/login/route.ts`
  - Removed: `src/app/api/dev-login/route.ts` (legacy redirect deleted)
- Risk: Ambiguous dev-only access and potential accidental exposure.
- Recommendation: Keep `/_dev/login` gated by environment and IP/secret; remove or 307-redirect `/api/dev-login`.
- Acceptance: Exactly one dev login route, enforced gating, tests updated.
- Status: Completed — `/api/dev-login` removed; all tests and docs now reference `/api/_dev/login`.

### F2. Health Endpoints
- Paths:
  - Public: `src/app/api/security/health/route.ts` (Node runtime)
  - Admin: `src/app/api/admin/system/health/route.ts`
- Intentional split: public minimal payload vs admin full payload. Ensure `collectSystemHealth()` and `toSecurityHealthPayload()` are the shared source of truth in `src/lib/health`.
- Acceptance: Public returns compact, non-sensitive JSON; admin returns detailed rollup; both reuse `lib/health`.

### F3. Cron Entry Points (API vs Netlify) — Resolved
- Paths: `src/app/api/cron/*` and `netlify/functions/cron-*.ts`
- Risk: Logic drift if jobs are implemented separately.
- Action taken: Implemented shared cron modules in `src/lib/cron/` (added `exchange.ts`, `rescan.ts`, `payments.ts`). Updated API routes such as `src/app/api/cron/refresh-exchange-rates/route.ts` and `src/app/api/cron/rescan-attachments/route.ts` to delegate to these modules and to use the shared `authorizeCron` helper. Updated Netlify functions (e.g., `netlify/functions/cron-payments-reconcile.ts`) to call shared jobs. Removed duplicated business logic from entrypoints.
- Acceptance: Shared modules own job code; entrypoints are thin wrappers only. F3 is marked resolved.

### F4. Duplicate Settings Navigation Components — Resolved
- Paths:
  - `src/components/admin/SettingsNavigation.tsx` (now a re-export)
  - `src/components/admin/settings/SettingsNavigation.tsx` (canonical implementation)
- Risk: UI drift and inconsistent navigation state.
- Action taken: Chosen canonical implementation at `src/components/admin/settings/SettingsNavigation.tsx`. Created a thin re-export at `src/components/admin/SettingsNavigation.tsx` (`export { default } from './settings/SettingsNavigation'`) to preserve import paths. Verified usage within settings shell and overview components use the canonical API. No duplicate implementation remains.
- Acceptance: Single implementation file; entry-point re-export preserves backwards compatibility; plan to remove the re-export after a deprecation period and update any remaining imports.

### F5. BulkActionsPanel Duplicated (3 implementations) — Resolved
- Paths:
  - `src/components/admin/services/BulkActionsPanel.tsx` (now a thin wrapper)
  - `src/components/dashboard/tables/BulkActionsPanel.tsx` (now a thin wrapper)
  - `src/app/admin/tasks/components/bulk/BulkActionsPanel.tsx` (now a thin wrapper)
- Risk: Features drift, inconsistent UX, duplicate bug fixes.
- Action taken: Implemented `src/components/common/bulk/BulkActionsPanel.tsx` as a configurable shared component supporting three modes: `service` (complex form-based bulk actions), `actions` (list of action buttons), and `tasks` (task-specific quick actions). Replaced the three original implementations with wrappers delegating to the shared component. Preserved original behavior and styles for each context.
- Acceptance: One shared component in use; wrappers preserve existing APIs; consider removing wrappers and updating imports to the shared path in a future cleanup.

### F6. Sentry Test Endpoints
- Paths: `src/app/api/sentry-check/route.ts`, `src/app/api/sentry-example/route.ts`
- Recommendation: Keep `sentry-check` as canonical; redirect or remove `sentry-example`. Update `src/app/sentry-example-page/page.tsx` to call the canonical endpoint.
- Acceptance: Single canonical test endpoint in production.

### F7. Environment & Tooling Alignment
- Current: Doppler removed from `package.json` scripts; dev uses `pnpm run next-dev`.
- Recommendation: Update `docs/env-reference.md` to reflect current approach. Remove `doppler.yaml` if Doppler is no longer part of the workflow, or clearly scope it to local-only.
- Acceptance: Scripts/docs consistent; CI passes env checks via `scripts/check-required-envs.sh`.

---

## Phased Implementation Plan
1) Day 0–1 (High Impact)
- F1: Remove one dev login route; enforce gating; update tests/docs.
- F4/F5: Draft shared components; add re-exports; migrate imports in high-traffic areas.

2) Day 1–2 (Stability)
- F3: Verify all cron entrypoints call shared modules; remove duplicated logic.
- F6: Canonicalize Sentry test route and update example page.

3) Day 2–3 (Tooling/Docs)
- F7: Align environment docs; decide fate of `doppler.yaml`. Ensure CI runs `scripts/ci/check-duplicate-api-routes.js` and `check-critical-duplicates.js`.

---

## Acceptance Criteria
- Single dev login route, strictly gated.
- Health endpoints reuse `lib/health` with minimal public payload.
- BulkActionsPanel has a single shared implementation; no duplicate files remain.
- Only one SettingsNavigation implementation; imports unified.
- Cron logic centralized in `src/lib/cron/*` with thin wrappers.
- Env/docs aligned; CI duplicate checks enabled.

---

## Appendix: Discovery Artifacts
- Duplicate components:
  - `**/SettingsNavigation.tsx` → 1 canonical implementation + 1 re-export (re-export points to canonical)
  - `**/BulkActionsPanel.tsx` → 1 shared implementation + 3 thin wrappers (duplicates replaced)
- Duplicate routes:
  - Dev login → 2 matches
  - Sentry test → 2 matches
  - Health → 2 endpoints (intentional split)
- Cron duplication (resolved):
  - API routes under `src/app/api/cron/*` (now delegate to `src/lib/cron/*`)
  - Netlify functions under `netlify/functions/cron-*.ts` (now delegate to `src/lib/cron/*`)

---

## Task Tracker (auto-generated from Findings)
- [x] F1: Deduplicate dev login endpoints — keep /api/_dev/login (strict gating), remove or 307-redirect /api/dev-login; update tests & docs
- [x] F2: Health endpoints alignment — both reuse lib/health; public route uses Node runtime; document scopes
- [x] F3: Centralize cron job logic — shared modules added; API and Netlify entrypoints delegate to `src/lib/cron/*`; consider adding integration tests for cron entrypoints.
- [x] F4: Consolidate SettingsNavigation — canonical created under admin/settings; top-level re-export added; consider removing re-export after consumers updated.
- [x] F5: Unify BulkActionsPanel — shared component implemented; wrappers added; callers delegate to shared component.
- [ ] F6: Canonicalize Sentry test — keep /api/sentry-check; ensure /api/sentry-example redirects; update example page to call canonical; remove duplicate
- [ ] F7: Env/tooling alignment — update docs/env-reference.md; decide fate of doppler.yaml; ensure package scripts match current approach
