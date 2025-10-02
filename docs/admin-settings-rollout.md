# Settings Overview — Rollout & Developer Notes

Purpose
- Provide a concise developer-facing rollout checklist and deployment guidance for the new Settings Overview feature.

Scope
- Files added/modified:
  - src/components/admin/settings/SettingsOverview.tsx (UI)
  - src/components/admin/settings/RecentChanges.tsx (lazy component)
  - src/services/settings.service.ts (client helper)
  - src/app/api/admin/settings/diagnostics/route.ts
  - src/app/api/admin/settings/export/route.ts
  - src/app/api/admin/settings/import/route.ts
  - Modified: src/components/admin/layout/AdminSidebar.tsx (Settings always expanded)
  - Tests: tests/admin/settings/SettingsOverview.test.tsx, tests/services/settings.service.test.ts
  - E2E: e2e/tests/admin-settings-overview.spec.ts

Pre-deploy checklist (local / CI)
1. Run typecheck and tests
   - pnpm db:generate && pnpm typecheck
   - pnpm test (unit + integration)
   - pnpm e2e (Playwright) against local/staging baseURL
2. Lint
   - pnpm lint
3. Build
   - pnpm build (use build:skip-env if required for CI) or set required envs
4. Verify environment variables
   - NEXTAUTH_URL, NEXTAUTH_SECRET
   - NETLIFY_DATABASE_URL or DATABASE_URL
   - STRIPE_SECRET (if integrations used)
   - SENTRY_DSN (for monitoring)
5. Secrets
   - Use CI secret store / Netlify environment settings — do NOT commit secrets to repo.

Staging deploy steps (Netlify/Vercel/Fly)
- Netlify:
  1. Push branch to remote and open deploy preview.
  2. Set the environment variables in Netlify site settings.
  3. Confirm build command: pnpm vercel:build or use pnpm build and set required envs.
  4. Enable Netlify plugin for Next.js if available.
- Vercel/Fly:
  1. Push branch and review preview URL.
  2. Set env variables in project settings.

Smoke tests (post-deploy)
- Access /admin/settings as an admin user.
- Run: Run Diagnostics (POST /api/admin/settings/diagnostics) and confirm 200 and toast.
- Export: click Export and verify a settings.json download (Content-Disposition present).
- Import: use Import flow to POST to /api/admin/settings/import and confirm success.
- Permissions: verify non-admin is redirected away from /admin/settings.

Monitoring & Rollback
- Monitor Sentry and server logs for errors from settings import/export or diagnostics.
- If issues are detected, revert the PR and redeploy previous working commit.

Developer notes & implementation choices
- Export route returns minimal settings JSON only (no secrets). In production, limit exported fields and obfuscate or exclude secrets.
- Import route uses zod to validate payload. Persisting to DB is intentionally left out until storage/consensus is decided.
- Diagnostics route is intentionally lightweight — extend to run actual connectivity checks (DB ping, S3, stripe key verification) in a secure context.
- Sidebar change: Settings now always expanded. This was implemented to surface system-level links; ensure this UX is acceptable for all admin roles.

Observability & Telemetry
- Track user actions: settings_export, settings_import, diagnostics_run. Add user id and org id (tenant) as properties.
- Integrate with Sentry (server + client) to capture thrown exceptions in import/export flows.

Follow-ups
- Add server-side persistence for imported settings after design approval.
- Add audit log entries when settings change (who, when, what).
- Expand diagnostics to include real connectivity checks and optional scheduled health checks.

Contact
- For any questions about this rollout, tag @engineering and @product in the PR description and add a short summary of changes and required env variables.
