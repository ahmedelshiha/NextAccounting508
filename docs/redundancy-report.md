# Redundancy Report

Date: 2025-10-09
Repository: accounting-firm

## Executive Summary
This report identifies duplicate or overlapping code paths, components, and scripts, with concrete consolidation recommendations and a phased plan to reduce maintenance overhead and risk.

---

## Findings Overview
| ID | Area | Files/Paths | Impact | Status | Recommendation |
|----|------|-------------|--------|--------|----------------|
| F1 | API: Dev Login duplicated | `src/app/api/dev-login/route.ts`, `src/app/api/_dev/login/route.ts` | High | Open | Keep a single dev login endpoint (prefer `/_dev/login`) behind strict env/IP gating; remove or redirect the other. |
| F2 | API: Health endpoints overlap (intended) | `src/app/api/security/health/route.ts`, `src/app/api/admin/system/health/route.ts` | Medium | Confirmed | Keep both, but ensure the public endpoint remains minimal and Node runtime is used to avoid Edge size limits. Document scopes. |
| F3 | Cron entrypoints duplicated (API vs Netlify) | `src/app/api/cron/*`, `netlify/functions/cron-*.ts` | Medium | Open | Ensure all cron entrypoints delegate to shared job logic in `src/lib/cron/*`; remove any duplicated logic. |
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
  - `src/app/api/dev-login/route.ts`
  - `src/app/api/_dev/login/route.ts`
- Risk: Ambiguous dev-only access and potential accidental exposure.
- Recommendation: Keep `/_dev/login` gated by environment and IP/secret; remove or 307-redirect `/api/dev-login`.
- Acceptance: Exactly one dev login route, enforced gating, tests updated.

### F2. Health Endpoints
- Paths:
  - Public: `src/app/api/security/health/route.ts` (Node runtime)
  - Admin: `src/app/api/admin/system/health/route.ts`
- Intentional split: public minimal payload vs admin full payload. Ensure `collectSystemHealth()` and `toSecurityHealthPayload()` are the shared source of truth in `src/lib/health`.
- Acceptance: Public returns compact, non-sensitive JSON; admin returns detailed rollup; both reuse `lib/health`.

### F3. Cron Entry Points (API vs Netlify)
- Paths: `src/app/api/cron/*` and `netlify/functions/cron-*.ts`
- Risk: Logic drift if jobs are implemented separately.
- Recommendation: Keep job logic in `src/lib/cron/*` (e.g., `reminders.ts`, `scheduler.ts`) and have all entrypoints call into these. Remove any duplicated logic blocks.
- Acceptance: Shared modules own job code; entrypoints are thin wrappers only.

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
  - Dev login → 2 matches
  - Sentry test → 2 matches
  - Health → 2 endpoints (intentional split)
- Cron duplication:
  - API routes under `src/app/api/cron/*`
  - Netlify functions under `netlify/functions/cron-*.ts`
