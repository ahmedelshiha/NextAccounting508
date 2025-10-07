# Doppler Environment Reference

This document explains how the project uses Doppler to manage environment variables across local development, Netlify preview builds, and Vercel production deployments.

## Variable Groups

### Core App Config

| Key | Description | Notes |
| --- | --- | --- |
| `NEXTAUTH_SECRET` | Secret used by NextAuth.js to encrypt session data. | Generate a long, random value (≥32 chars). |
| `NEXTAUTH_URL` | Canonical URL for authentication callbacks. | Matches the active deployment domain. |
| `MULTI_TENANCY_ENABLED` | Enables tenant filtering logic throughout the app. | `true` by default. |
| `MULTI_TENANCY_STRICT` | Enforces strict tenant-scoped access checks. | Defaults to `false`; enable for production hardening. |
| `AUTH_DISABLED` | Bypasses authentication for preview/testing flows. | Leave empty except for controlled previews. |
| `PREVIEW_ADMIN_EMAIL` | Email used by preview auth bypass. | Pair with `PREVIEW_ADMIN_PASSWORD` when `AUTH_DISABLED` is set. |
| `PREVIEW_ADMIN_PASSWORD` | Password used by preview auth bypass. | Stored only in Doppler preview configs. |

### Database & Backend

| Key | Description | Notes |
| --- | --- | --- |
| `NETLIFY_DATABASE_URL` | Direct connection string for Netlify-hosted builds. | Overrides `DATABASE_URL` when present. |
| `NETLIFY_DATABASE_URL_UNPOOLED` | Unpooled variant for long running migrations. | Used by scripts that cannot leverage pooling. |
| `DATABASE_URL` | Primary PostgreSQL connection string. | Points to Neon cluster for Vercel/local usage. |
| `EXPORT_SCHEDULER_SECRET` | Shared secret for export scheduling jobs. | Required for scheduled exports. |
| `CRON_SECRET` | Authentication token for cron-triggered routes. | Used by Netlify cron functions. |
| `CRON_TARGET_URL` | Base URL targeted by cron tasks. | Usually matches deployment base URL. |

### Integrations

| Key | Description | Notes |
| --- | --- | --- |
| `SENTRY_DSN` | Server-side Sentry DSN. | Enables backend error monitoring. |
| `NEXT_PUBLIC_SENTRY_DSN` | Browser-exposed Sentry DSN. | Mirrors `SENTRY_DSN` when front-end tracing is enabled. |
| `SENTRY_ORG` | Sentry organization slug. | Required for CLI uploads. |
| `SENTRY_PROJECT` | Sentry project slug. | Powers release upload steps. |
| `SENTRY_AUTH_TOKEN` | Auth token for Sentry CLI operations. | Scope to release creation only. |
| `UPSTASH_REDIS_REST_URL` | Upstash REST endpoint used for caching. | Combine with `UPSTASH_REDIS_REST_TOKEN`. |
| `UPSTASH_REDIS_REST_TOKEN` | Token for authenticated Upstash REST access. | Rotate via Upstash dashboard. |
| `NETLIFY_SITE_ID` | Site ID used by Netlify deploy hooks. | Required for CLI deployments. |
| `NETLIFY_AUTH_TOKEN` | Personal access token for Netlify deploys. | Store only in the `netlify` config. |
| `NETLIFY_BLOBS_TOKEN` | Token for Netlify Blobs API interactions. | Needed by file upload utilities. |

## Doppler Configuration

Doppler project: **`next-accounting`**

| Environment | Doppler Config | Primary Usage |
| --- | --- | --- |
| `local` | `local` | Developer machines |
| `netlify` | `netlify` | Preview builds and scheduled functions |
| `vercel` | `vercel` | Production runtime |

The mapping above is also captured in the root `doppler.yaml` file for CLI tooling and CI workflows.

## Local Development

1. Install the Doppler CLI (one-time):
   ```bash
   npm install -g doppler
   ```
2. Authenticate and select the local config:
   ```bash
   doppler login
   doppler setup --project next-accounting --config local
   ```
3. Start the dev server with secrets injected:
   ```bash
   doppler run -- npm run dev
   ```

All `.env*` files remain ignored via `.gitignore`; rely solely on Doppler for secret management.

## CI/CD and Hosting

### Netlify
- Add a secret named `DOPPLER_TOKEN` to Netlify.
- Prepend the build command with:
  ```bash
  doppler setup --project next-accounting --config netlify --token=$DOPPLER_TOKEN
  ```
- Deploy via script:
  ```bash
  pnpm deploy:netlify
  ```

### Vercel
- Connect Doppler using:
  ```bash
  doppler vercel setup --project next-accounting --config vercel
  ```
- Production deploy:
  ```bash
  pnpm deploy:vercel
  ```

### GitHub Actions (optional)
Add a step before build jobs to load secrets:
```yaml
- name: Load Doppler Secrets
  run: doppler run -- pnpm run build
```

## Maintenance Practices

- Rotate Doppler service tokens every 90 days and update Netlify/Vercel integrations accordingly.
- Restrict production config access to the minimal set of maintainers.
- Document any new environment variables in this file and update Doppler configs to keep all environments synchronized.
