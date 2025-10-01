# PR: Unified Admin Settings Migration — Summary & Deployment Checklist

This PR consolidates system-level admin pages into a unified Settings area under `/admin/settings` and includes supporting infrastructure (registry, navigation, redirects, tests, audit logging, CI). Below is a concise summary for reviewers and release engineers.

## High level summary
- Canonical registry: `src/lib/settings/registry.ts` normalized with `group` and `order` metadata and explicit entries for Users, Uploads, and Cron.
- Settings layout: `src/components/admin/settings/SettingsShell.tsx` (shell) and `src/app/admin/settings/layout.tsx` (app-level container) implemented; unified left navigation via `src/components/admin/SettingsNavigation.tsx` (existing component updated to read registry groups).
- Page migration:
  - Booking settings moved to use SettingsShell: `src/app/admin/settings/booking/page.tsx`.
  - Users & Permissions consolidated under `src/app/admin/settings/users/page.tsx` (tabbed landing using existing admin pages).
  - Audit, Uploads Quarantine, Cron wrappers added under `src/app/admin/settings`.
- Redirects: Next.js redirects configured in `next.config.mjs` for legacy routes (e.g., `/admin/users` -> `/admin/settings/users`, `/admin/audits` -> `/admin/settings/security/audits`, etc.).
- Audit logging: `src/lib/audit-settings.ts` helper added and wired into booking and financial settings handlers (server-side API routes).
- Tests: unit tests added for registry and audit helper; component tests added for Booking POC and Settings Users; RBAC tests added for Users landing.
- CI: GitHub Actions CI workflow added (`.github/workflows/ci.yml`) to run registry preflight and tests. `pnpm ci:preflight` added to package.json.
- Feature flag: `NEXT_PUBLIC_FEATURE_UNIFIED_SETTINGS` gating implemented (`src/lib/featureFlags.ts`) and banner added to settings layout.
- Vercel deployment guide and Netlify notes included in `docs/`.

## Files changed (top-level)
- src/lib/settings/registry.ts (normalized)
- src/components/admin/settings/SettingsShell.tsx (created/used existing)
- src/app/admin/settings/layout.tsx (created/updated)
- src/app/admin/settings/booking/page.tsx (now uses SettingsShell)
- src/app/admin/settings/users/page.tsx (new landing page)
- src/app/admin/settings/security/audits/page.tsx
- src/app/admin/settings/uploads/quarantine/page.tsx
- src/app/admin/settings/cron/page.tsx
- src/lib/audit-settings.ts (new helper)
- src/app/api/admin/booking-settings/route.ts (uses audit helper)
- src/app/api/admin/financial-settings/route.ts (uses audit helper)
- scripts/check-settings-registry.js (new validator)
- package.json (ci:preflight + script additions)
- .github/workflows/ci.yml (CI)
- next.config.mjs (redirects + headers)
- netlify.toml (kept for reference)
- docs/deployment-vercel.md, docs/deployment-netlify.md
- docs/admin-settings-todo.md, docs/admin-settings-audit.md, docs/admin-settings-transformation-plan.md
- Tests: tests/components/booking-settings.page.test.tsx, tests/components/settings-users.page.test.tsx, tests/lib/audit-settings.test.tsx, tests/components/settings-users.rbac.test.tsx, etc.

## Deployment checklist (Vercel)
1. Ensure CI passes on the branch (GitHub Actions will run `pnpm ci:preflight` and `pnpm test`).
2. In Vercel Project settings, set these Environment Variables (Preview & Production as appropriate):
   - NEXT_PUBLIC_FEATURE_UNIFIED_SETTINGS (false for preview, true for production when ready)
   - NEXTAUTH_URL, NEXTAUTH_SECRET
   - DATABASE_URL (if audit logs persistence is required)
   - SENTRY_DSN
3. Deploy preview and manually smoke-test these routes:
   - /admin/settings
   - /admin/settings/booking
   - /admin/settings/users
   - Legacy redirects: /admin/users, /admin/audits, /admin/uploads/quarantine
4. If DB persistence is required for audit logs, run Prisma migrations and ensure Prisma client is generated before enabling feature flag.
5. Flip NEXT_PUBLIC_FEATURE_UNIFIED_SETTINGS to true on production after verification.

## Rollback plan
- Flip NEXT_PUBLIC_FEATURE_UNIFIED_SETTINGS to false (fast rollback) OR promote a previous Vercel deployment.

## Notes for reviewers
- Many top-level admin pages remain in the repo to avoid breaking imports; redirects ensure users hit canonical routes. We can remove legacy page implementations in a follow-up once telemetry confirms usage.
- Audit log helper defaults to console logging if DB not present; real persistence requires DATABASE_URL.

---

If you're satisfied, I can open a draft PR summary message ready for copy/paste into the PR description and create a branch diff. Do you want me to prepare the PR message now?
