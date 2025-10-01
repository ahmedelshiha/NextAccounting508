# Netlify Deployment Notes for Unified Admin Settings

This document describes production-ready deployment steps, Netlify best practices, and rollback instructions for the unified /admin/settings migration.

1) Build & CI
- Ensure `pnpm install` and `pnpm build` run during CI. Use `pnpm ci` on Netlify to respect lockfile.
- Add preflight checks to CI: `pnpm ci:preflight` (runs registry validator). Ensure this runs before `pnpm build`.
- Run tests: unit + integration + e2e where possible. Use Playwright in separate job.

2) Environment variables
- Required envs for admin features:
  - NEXT_PUBLIC_FEATURE_UNIFIED_SETTINGS=true (feature flag)
  - NEXTAUTH_URL, NEXTAUTH_SECRET
  - DATABASE_URL or NETLIFY_DATABASE_URL (required for persisting audit logs)
  - SENTRY_DSN (for error monitoring)
- Set these securely in Netlify UI (Site settings -> Build & deploy -> Environment).

3) Redirects & headers
- We use Next.js redirects in `next.config.mjs`. Netlify plugin `@netlify/plugin-nextjs` will transform these into Netlify redirects.
- Ensure `netlify.toml` includes any additional proxies or rewrite rules. Keep canonical redirects for `/admin/*` routes to `/admin/settings/*` as configured.
- CSP and security headers are set in `next.config.mjs` headers method; Netlify will respect via _headers file.
- A sample `netlify.toml` has been added to the repo to configure the Next plugin and environment contexts.

4) Feature flag & gradual rollout
- Use `NEXT_PUBLIC_FEATURE_UNIFIED_SETTINGS=false` in production initially to test. Flip to `true` for canary sub-site or internal staff.
- Monitor logs, Sentry errors, and traffic. Use Netlify deploy contexts (branch deploys) to preview.

5) DB migrations & audit logs
- No DB schema changes required for this migration. If enabling audit log persistence ensure `DATABASE_URL` points to production DB and Prisma migrations (if any) have been applied.
- The audit helper falls back to console logs if no DB connection is present.

6) Rollback plan
- To rollback quickly:
  - Flip `NEXT_PUBLIC_FEATURE_UNIFIED_SETTINGS` to false OR restore previous build that doesn't include redirects.
  - Re-enable legacy top-level routes by restoring previous `next.config.mjs` and redeploy.
  - Verify audit logs and user access.

7) Monitoring & observability
- Ensure Sentry is configured (SENTRY_DSN env) and `withSentryConfig` in next.config.mjs is active.
- Add telemetry events for page visits under `/admin/settings/*` and monitor usage post rollout.

8) Netlify-specific best practices
- Use branch deploys for staging and PR previews.
- Use environment-specific variables in Netlify contexts (production vs branch deploy).
- Use Netlify functions for lightweight serverless jobs if needed, but prefer Next.js API routes for in-app behavior.
- Use build hooks to trigger redeploys when registry changes.

9) Post-deploy checklist
- Smoke test key routes: /admin/settings, /admin/settings/booking, /admin/settings/users
- Verify redirects from legacy routes work.
- Run e2e smoke tests against the deployed preview.

---

If you want, I can:
- Add a Netlify deploy checklist to the repo (CI job snippets), or
- Create a sample `netlify.toml` snippet for redirects and headers.
