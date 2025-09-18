# Netlify Deployment & Environment Variables (Service Portal)

This document lists required environment variables, recommended Netlify build settings, and a deployment checklist to run Prisma generate/migrate/seed safely in CI. Follow these steps in staging before enabling production features (uploads, realtime durable transport, Sentry).

Important: Do NOT commit secrets. Set them in Netlify dashboard or via the Builder.io MCP "Open MCP popover".

---

## Required environment variables

- DATABASE_URL (or NETLIFY_DATABASE_URL)
  - Production DB connection (Neon/Postgres). Example: postgres://user:pass@host:5432/db
  - Used by Prisma (generate/migrate/seed) and runtime Prisma client.

- NETLIFY_DATABASE_URL
  - If present, many server routes use this to detect DB availability; ensure it matches DATABASE_URL.

- NETLIFY_BLOBS_TOKEN
  - Token for Netlify Blobs provider when UPLOADS_PROVIDER=netlify. Required to enable production uploads.

- UPLOADS_PROVIDER
  - Provider name; e.g. `netlify` or `supabase`.

- UPLOADS_AV_SCAN_URL (optional)
  - URL of antivirus webhook to scan uploaded files (POST callback). The uploads endpoint supports best-effort AV webhook.

- REALTIME_TRANSPORT
  - Set to `postgres` to enable durable Postgres LISTEN/NOTIFY transport across instances.

- REALTIME_PG_URL (optional)
  - If different from DATABASE_URL, provide the connection string for realtime adapter.

- REALTIME_PG_CHANNEL (optional)
  - Pub/Sub channel name (defaults to configured channel in code).

- NEXTAUTH_SECRET
  - Required by next-auth for session signing. Must be a long random value.

- NEXTAUTH_URL
  - Absolute URL of the app (used in emails and OAuth callbacks). Example: https://myapp.example.com

- SENTRY_DSN (optional)
  - When present, optional Sentry integration will capture errors/performance. Keep secret.

- NEXT_PUBLIC_APP_URL
  - Public URL used in email links (used as fallback when rendering email HTML). Usually same as NEXTAUTH_URL.

- NEXT_PUBLIC_FETCH_TIMEOUT (optional)
  - Browser fetch timeout in ms; default client-side is 45000.

---

## Netlify build settings (recommended)

In Netlify site settings (or netlify.toml):

- Build command (example):

  pnpm db:generate && pnpm db:migrate && pnpm db:seed && pnpm build

  - `db:generate` -> runs `prisma generate`
  - `db:migrate` -> applies migrations (use `prisma migrate deploy` in production)
  - `db:seed` -> seeds required roles, templates, and permissions
  - `build` -> Next.js production build

- Publish directory: `.next` (Next.js default)
- Node version: match engines.node in package.json (>=18)

Optional netlify.toml snippet:

[[plugins]]
  package = "@netlify/plugin-functions-core"

[build]
  command = "pnpm db:generate && pnpm db:migrate && pnpm db:seed && pnpm build"
  publish = ".next"

# If you prefer safety, run migrations in a separate CI step and omit from build
# e.g., run migrations once during release pipeline and keep Netlify build as `pnpm build`.

---

## Deployment checklist (preflight)

1. Connect and verify DB (Neon/Postgres):
   - [Connect to Neon](#open-mcp-popover)
   - Ensure DATABASE_URL / NETLIFY_DATABASE_URL are set in Netlify env.
2. Review Prisma migrations in repo and confirm `pnpm db:migrate` will run non-destructively.
3. Set `NETLIFY_BLOBS_TOKEN` and `UPLOADS_PROVIDER=netlify` if using Netlify Blobs for attachments.
   - Alternatively, set Supabase credentials and `UPLOADS_PROVIDER=supabase`.
   - [Connect to Netlify](#open-mcp-popover) and [Connect to Supabase](#open-mcp-popover)
4. Set `REALTIME_TRANSPORT=postgres` and optional `REALTIME_PG_URL` if durable realtime is required.
5. Set `NEXTAUTH_SECRET` and `NEXTAUTH_URL`.
6. (Optional) Set `SENTRY_DSN` to enable error/perf monitoring.
7. Set `NEXT_PUBLIC_APP_URL` to your app URL.
8. Run a staging deploy and execute smoke tests:
   - Verify /api/db-check responds OK
   - Verify Prisma client is generated and migrations applied
   - Create a test service request via the portal and verify admin receives realtime events
   - Upload a sample attachment and verify AV webhook (if configured) and UI per-file errors
9. Verify CSV exports and large-export endpoints (audits/export)
10. After validation, promote to production and monitor Sentry / realtime metrics.

---

## Recommended MCP integrations

When working with this app, the following Builder.io MCP integrations are available and helpful. You can connect them via the MCP popover in the Builder UI:

- Neon — Postgres serverless DB (recommended). Use for DATABASE_URL/NETLIFY_DATABASE_URL. [Connect to Neon](#open-mcp-popover)
- Netlify — Host & deploy the app; set Netlify envs (NETLIFY_BLOBS_TOKEN, REALTIME_*), configure build commands, and manage functions. [Connect to Netlify](#open-mcp-popover)
- Zapier — Automation workflows (optional). [Connect to Zapier](#open-mcp-popover)
- Figma — Design-to-code plugin; use Builder's Figma plugin for UI imports. Get plugin at: https://www.figma.com/community/plugin/747985167520967365/builder-io-ai-powered-figma-to-code-react-vue-tailwind-more
- Supabase — Alternative uploads/storage and auth. [Connect to Supabase](#open-mcp-popover)
- Builder.io (CMS) — Content & model management for marketing pages. [Connect to Builder.io](#open-mcp-popover)
- Linear — Issue tracking; useful for creating tickets from the app. [Connect to Linear](#open-mcp-popover)
- Notion — Docs and runbooks sync. [Connect to Notion](#open-mcp-popover)
- Sentry — Error & performance monitoring. [Connect to Sentry](#open-mcp-popover)
- Context7 — Up-to-date docs for libraries/frameworks. [Connect to Context7](#open-mcp-popover)
- Semgrep — Security scanning SAST rules. [Connect to Semgrep](#open-mcp-popover)
- Prisma Postgres — Use the Prisma MCP/adapter for DB management. [Connect to Prisma Postgres](#open-mcp-popover)

Note: The list above includes all recommended MCP servers (Neon, Netlify, Zapier, Figma, Supabase, Builder CMS, Linear, Notion, Sentry, Context7, Semgrep, Prisma Postgres) so you can choose which to enable.

---

## Troubleshooting and runbook notes

- If migrations fail during Netlify build, inspect build logs immediately and revert by rolling back DB or deploying previous release.
- If uploads fail: ensure NETLIFY_BLOBS_TOKEN is valid and UPLOADS_PROVIDER is set. Check AV webhook logs (UPLOADS_AV_SCAN_URL) and quarantine storage.
- Realtime issues: check REALTIME_TRANSPORT and REALTIME_PG_URL; confirm LISTEN/NOTIFY across instances in staging.
- Secrets: do not commit. Use Netlify UI to set env vars or the MCP popover connection.

---

What I implemented for you in this repo:

- Added a GitHub Actions workflow: .github/workflows/ci.yml
  - Runs: pnpm install, pnpm db:generate, pnpm db:migrate, pnpm db:seed, typecheck, lint, unit tests, pnpm build
  - Requires GitHub Secrets: DATABASE_URL, NEXTAUTH_URL, NEXTAUTH_SECRET (and optional SENTRY_DSN, NETLIFY_BLOBS_TOKEN, REALTIME_PG_URL)

- Added a sample Netlify config: netlify.toml
  - Use this if you want Netlify to build the app. CI handles migrations in this repository; Netlify can keep build command as `pnpm build`.

Configuration steps (quick):
1. Add the following GitHub repository secrets: DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL, NETLIFY_BLOBS_TOKEN (if using Netlify Blobs), REALTIME_PG_URL (if different), SENTRY_DSN (optional).
2. Review .github/workflows/ci.yml and adjust branch names and secrets as needed.
3. In Netlify, set build command to `pnpm build` and publish directory `.next`, and add the same env vars in Netlify site settings for runtime.

If you'd like, I can now:
- Create a lightweight runbook for upload quarantine and AV webhook handling (recommended), or
- Add a GitHub Action step to deploy to Netlify using NETLIFY_AUTH_TOKEN and NETLIFY_SITE_ID (requires you to provide/connect).

Tell me which of these you'd like me to implement next.
