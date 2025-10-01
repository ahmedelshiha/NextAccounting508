# Vercel Deployment Guide — Unified Admin Settings

This project targets Next.js and is deployed on Vercel. The notes below focus on production-ready deployment steps, Vercel best practices, and rollback instructions for the unified /admin/settings migration.

1) Build & CI
- Ensure CI runs unit and integration tests before merging. We added a GitHub Action `CI` that runs tests and preflight checks (`pnpm ci:preflight`). Keep this in your repo even if Vercel will perform builds — CI catches issues early.
- Vercel will run `pnpm vercel:build` by default when connected to GitHub. That script already runs `pnpm db:generate && pnpm lint && pnpm typecheck && pnpm build`.

2) Environment variables
- Configure the following in the Vercel dashboard (Project Settings → Environment Variables):
  - NEXT_PUBLIC_FEATURE_UNIFIED_SETTINGS (true/false)
  - NEXTAUTH_URL
  - NEXTAUTH_SECRET
  - DATABASE_URL or NETLIFY_DATABASE_URL (if using Netlify DB env naming)
  - SENTRY_DSN
- Use Preview and Production scopes appropriately: set sensitive keys only in Production; use staging values for Preview.

3) Redirects & headers
- Redirects are defined in `next.config.mjs` via the `redirects()` export; Vercel supports Next's redirects out-of-the-box. No separate `vercel.json` is required unless you need custom rewrites outside Next.
- Security headers are defined in `next.config.mjs` (`headers()`); Vercel will apply those headers for Next routes.

4) Feature flag & rollout
- Use `NEXT_PUBLIC_FEATURE_UNIFIED_SETTINGS` to gate the unified settings UI. Default to `false` on Preview deployments; flip to `true` for production or incremental rollout.
- Use GitHub branch previews on Vercel for internal testing. The preview URL will show changes for the branch and allow testing redirects and pages.

5) Database migrations & audit logs
- If you persist audit logs, ensure `DATABASE_URL` points to your production DB and migrations are applied before switching the feature flag on.
- Vercel does not run DB migrations automatically — run them from CI or a release job (e.g., `pnpm db:migrate` executed after the build succeeds but before enabling the feature flag).

6) Observability
- Ensure `SENTRY_DSN` is set in Vercel and Sentry is configured in `next.config.mjs` (we already use `withSentryConfig`).
- Add telemetry for `/admin/settings/*` page loads (server or client instrumentation) and monitor via Sentry/analytics.

7) Deployment checklist (pre-release)
- [ ] All unit + integration tests pass in CI
- [ ] `pnpm ci:preflight` (registry checker) passes
- [ ] Environment variables configured on Vercel Preview and Production
- [ ] Sentry DSN set in Vercel and performance monitoring enabled
- [ ] Migrations applied (if enabling DB persistence)
- [ ] Feature flag `NEXT_PUBLIC_FEATURE_UNIFIED_SETTINGS` set to `false` for Preview and tested; set to `true` for production rollout when ready

8) Rollback plan
- Flip `NEXT_PUBLIC_FEATURE_UNIFIED_SETTINGS` to `false` in Vercel Production (fast rollback without redeploy)
- If needed, rollback to a previous deployment in Vercel (Dashboard → Deployments → Promote previous deployment)

9) Vercel best practices & tips
- Prefer Next.js redirects in `next.config.mjs` rather than platform-specific redirect files.
- Use branch deployments for QA; protect main branch and require PR reviews before merging.
- Use Environment Variables per scope (Preview / Production).
- Avoid storing secrets in code — use Vercel project env variables.

10) Post-deploy verification
- Smoke test: visit `/admin/settings`, `/admin/settings/booking`, `/admin/settings/users` on the production domain.
- Verify redirects: `/admin/users`, `/admin/audits`, `/admin/uploads/quarantine` route to new canonical locations.
- Confirm audit logs are being recorded (if DB enabled) or see console fallback logs when no DB is configured.

---

If you'd like, I can:
- Add a `vercel.json` sample (not required) for extra rewrites/headers, or
- Add a GitHub Action job that runs migrations in a controlled release step before flipping the feature flag.
