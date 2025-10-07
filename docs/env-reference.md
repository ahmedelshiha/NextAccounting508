# Doppler Environment Reference

## Overview
Doppler centralizes environment variables for this Next.js + Prisma project, replacing manual configuration across local workstations, Netlify preview builds, and Vercel production deploys. Each environment loads the same encrypted secrets from the `next-accounting` Doppler project, ensuring consistent behavior while eliminating drift between hosting platforms.

## Variable Groups

### Core App Config

| Key | Description | Notes |
| --- | --- | --- |
| `NEXTAUTH_SECRET` | Secret used by NextAuth.js to encrypt session data. | Generate a long, random value (≥32 chars). |
| `NEXTAUTH_URL` | Canonical URL for authentication callbacks. | Matches the active deployment domain. |
| `MULTI_TENANCY_ENABLED` | Enables tenant filtering logic. | `true` by default. |
| `MULTI_TENANCY_STRICT` | Enforces strict tenant-scoped access checks. | Defaults to `false`; enable for production hardening. |
| `AUTH_DISABLED` | Bypasses authentication for preview/testing flows. | Leave empty except during controlled previews. |
| `PREVIEW_ADMIN_EMAIL` | Email used by preview auth bypass. | Pair with `PREVIEW_ADMIN_PASSWORD` when `AUTH_DISABLED` is set. |
| `PREVIEW_ADMIN_PASSWORD` | Password used by preview auth bypass. | Store only in Doppler preview configs. |

### Database & Backend

| Key | Description | Notes |
| --- | --- | --- |
| `NETLIFY_DATABASE_URL` | Direct connection string for Netlify-hosted builds. | Overrides `DATABASE_URL` when present. |
| `NETLIFY_DATABASE_URL_UNPOOLED` | Unpooled variant for long running migrations. | Used by scripts that cannot leverage pooling. |
| `DATABASE_URL` | Primary PostgreSQL connection string. | Points to the Neon cluster for Vercel/local usage. |
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

## Environment Profiles

Before running any profile, install and authenticate the Doppler CLI:

```bash
npm install -g doppler
doppler login
```

### Local Development

```bash
doppler setup --project next-accounting --config local
doppler run --config local -- pnpm run dev
```

### Netlify (Preview/Testing)

```bash
doppler setup --project next-accounting --config netlify --token=$DOPPLER_TOKEN
doppler run --config netlify -- pnpm run build
```

### Vercel (Production)

```bash
doppler vercel setup --project next-accounting --config vercel
doppler run --config vercel -- pnpm run build
```

## Validation

```bash
doppler secrets
doppler run -- printenv | grep NEXTAUTH_URL
```
Verify that required keys and values appear and match the expected deployment context.

## Security Notes

- Never commit `.env*` files; rely exclusively on Doppler-managed secrets.
- Rotate Doppler service tokens every 90 days and update Netlify/Vercel integrations after rotation.
- Restrict access to production configs via Doppler roles and audit permissions quarterly.

## Reference Example

```diff
chore(env): integrate Doppler for unified environment management

- Added Doppler CLI as dev dependency.
- Wrapped scripts in doppler-run commands.
- Added doppler.yaml and env-reference.md.
```

## Additional Reference

Doppler project: **`next-accounting`**

| Environment | Doppler Config | Primary Usage |
| --- | --- | --- |
| `local` | `local` | Developer machines |
| `netlify` | `netlify` | Preview builds and scheduled functions |
| `vercel` | `vercel` | Production runtime |

The mapping above is mirrored in the root `doppler.yaml` file for CLI tooling and CI workflows.
