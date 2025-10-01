Title: Consolidate Admin "System" into Unified /admin/settings (SettingsShell, registry normalization, redirects, tests)

Summary
-------
This PR consolidates system-level admin pages into a unified Settings area under `/admin/settings` and adds supporting infra: a canonical SETTINGS_REGISTRY with grouping/order, SettingsShell layout, redirects for legacy routes, audit logging hooks, tests, and CI preflight checks.

Key changes
-----------
- Normalized registry: `src/lib/settings/registry.ts` (group/order, added users/uploads/cron entries)
- SettingsShell: `src/components/admin/settings/SettingsShell.tsx` and `src/app/admin/settings/layout.tsx`
- Pages migrated/wrapped under `/admin/settings`: booking, users (tabbed landing), security/audits wrapper, uploads/quarantine wrapper, cron wrapper, many existing settings pages already under `/admin/settings/*`
- Redirects: configured in `next.config.mjs` to map legacy admin routes to new canonical settings routes (permanent redirects)
- Audit: `src/lib/audit-settings.ts` added; used in booking, financial, and org settings handlers
- Tests: unit/component/RBAC tests added for Booking POC and Users landing; audit helper tests added
- CI: GitHub Actions workflow `.github/workflows/ci.yml` added; `scripts/check-settings-registry.js` validator included and run as `pnpm ci:preflight`
- Feature flag: `NEXT_PUBLIC_FEATURE_UNIFIED_SETTINGS` with helper `src/lib/featureFlags.ts` and UI banner in layout

Files of interest
-----------------
(See docs/admin-settings-release-notes.md for full list)

Testing instructions
--------------------
1. Run registry validator locally:
   pnpm install
   pnpm ci:preflight
2. Run tests:
   pnpm test
3. Manual smoke test in local dev:
   pnpm dev
   Visit these routes and verify UI and redirects:
   - /admin/settings -> settings landing
   - /admin/settings/booking -> Booking POC inside SettingsShell
   - /admin/settings/users -> Users landing with tabs (Users/Roles/Permissions)
   - Legacy routes (should redirect): /admin/users, /admin/audits, /admin/uploads/quarantine, /admin/cron-telemetry, /admin/integrations

Deployment notes
----------------
- See docs/deployment-vercel.md for Vercel-specific instructions.
- Ensure environment variables are set (NEXT_PUBLIC_FEATURE_UNIFIED_SETTINGS, NEXTAUTH_URL, NEXTAUTH_SECRET, DATABASE_URL, SENTRY_DSN)
- CI runs registry check and tests prior to build

Rollout plan
------------
1. Deploy to Preview with feature flag disabled (NEXT_PUBLIC_FEATURE_UNIFIED_SETTINGS=false)
2. Test flows, redirects, and audit events in Preview
3. Enable feature flag for internal staff (canary) on production
4. Monitor Sentry and telemetry; if stable, fully enable feature flag

Notes & Follow-ups
------------------
- Legacy page implementations are kept for now to avoid breaking internal imports and ensure a smooth migration. Plan a follow-up to remove legacy code after monitoring and telemetry confirm usage.
- Consider adding more audit hooks to settings endpoints (we added to booking, financial, and org settings; additional endpoints can be instrumented similarly).
- Confirm DB migrations if you plan to persist audit logs (the helper falls back to console logging when DB is not configured).

PR Checklist
------------
- [ ] All CI checks pass
- [ ] Code reviewed and approved
- [ ] Feature flag configured in production
- [ ] Post-deploy verification tested

