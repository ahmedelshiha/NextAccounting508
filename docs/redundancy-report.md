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
| F4 | UI component duplication: Settings Navigation | `src/components/admin/SettingsNavigation.tsx`, `src/components/admin/settings/SettingsNavigation.tsx` | High | Open | Consolidate into a single canonical component (recommend the nested `admin/settings` path). Provide a temporary re-export and then remove the duplicate. |
| F5 | UI component duplication: BulkActionsPanel (3x) | `src/components/admin/services/BulkActionsPanel.tsx`, `src/components/dashboard/tables/BulkActionsPanel.tsx`, `src/app/admin/tasks/components/bulk/BulkActionsPanel.tsx` | High | Open | Create a shared `src/components/common/bulk/BulkActionsPanel.tsx` with props for context-specific behavior; update imports; delete duplicates. |
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

### F4. Duplicate Settings Navigation Components
- Paths:
  - `src/components/admin/SettingsNavigation.tsx`
  - `src/components/admin/settings/SettingsNavigation.tsx`
- Risk: UI drift and inconsistent navigation state.
- Recommendation: Choose a canonical file (recommend `src/components/admin/settings/SettingsNavigation.tsx`). Create a barrel re-export at the other path temporarily; migrate imports; delete the duplicate after one release.
- Acceptance: Single implementation file; imports unified; snapshots pass.

### F5. BulkActionsPanel Duplicated (3 implementations)
- Paths:
  - `src/components/admin/services/BulkActionsPanel.tsx`
  - `src/components/dashboard/tables/BulkActionsPanel.tsx`
  - `src/app/admin/tasks/components/bulk/BulkActionsPanel.tsx`
- Risk: Features drift, inconsistent UX, duplicate bug fixes.
- Recommendation: Implement `src/components/common/bulk/BulkActionsPanel.tsx` with configurable props and context hooks. Update all callers. Remove duplicate files.
- Acceptance: One shared component; no regressions in tasks/services/tables flows.

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
  - `**/SettingsNavigation.tsx` → 2 matches
  - `**/BulkActionsPanel.tsx` → 3 matches
- Duplicate routes:
  - Dev login �� 2 matches
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
- [ ] F4: Consolidate SettingsNavigation — choose canonical under admin/settings, add temporary re-export, migrate imports, delete duplicate
- [ ] F5: Unify BulkActionsPanel — create shared component under components/common/bulk with contextual props; migrate callers; delete duplicates
- [ ] F6: Canonicalize Sentry test — keep /api/sentry-check; ensure /api/sentry-example redirects; update example page to call canonical; remove duplicate
- [ ] F7: Env/tooling alignment — update docs/env-reference.md; decide fate of doppler.yaml; ensure package scripts match current approach
