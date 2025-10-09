# Doppler Environment Reference

## Overview
This document describes the environment variable strategy used by the project and provides platform-agnostic guidance for local development, CI, and production. The preferred approach is to configure environment variables directly in the target platform (Vercel, Netlify) or use the local `.env.local` for development together with the project's validation script. Doppler may be used optionally as a secrets manager, but it is not required by the build scripts in the repository.

## Variable Groups

### Core App Config

| Key | Description | Notes |
| --- | --- | --- |
| `NEXTAUTH_SECRET` | Secret used by NextAuth.js to encrypt session data. | Generate a long, random value (≥32 chars). |
| `NEXTAUTH_URL` | Canonical URL for authentication callbacks. | Matches the active deployment domain. |
| `MULTI_TENANCY_ENABLED` | Enables tenant filtering logic. | `true` by default. |
| `MULTI_TENANCY_STRICT` | Enforces strict tenant-scoped access checks. | Defaults to `false`; enable for production hardening. |
| `ENABLE_IP_RESTRICTIONS` | Enforces IP allowlist for all admin surfaces when `true`. | Pair with `ADMIN_IP_WHITELIST`. |
| `ADMIN_IP_WHITELIST` | Comma-separated list of admin-allowed IPs. | Exact matches; CIDR not yet supported. |
| `LOG_ADMIN_ACCESS` | Logs allow/deny decisions for admin access. | Useful during rollout and auditing. |
| `AUTH_DISABLED` | Bypasses authentication for preview/testing flows. | Leave empty except during controlled previews. |
| `PREVIEW_ADMIN_EMAIL` | Email used by preview auth bypass. | Pair with `PREVIEW_ADMIN_PASSWORD` when `AUTH_DISABLED` is set. |
| `PREVIEW_ADMIN_PASSWORD` | Password used by preview auth bypass. | Store securely in your chosen secrets manager or platform environment configuration. |

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
| `UPSTASH_REDIS_REST_URL` | Upstash REST endpoint used for caching and rate limiting. | Combine with `UPSTASH_REDIS_REST_TOKEN`. |
| `UPSTASH_REDIS_REST_TOKEN` | Token for authenticated Upstash REST access. | Rotate via Upstash dashboard. |
| `NETLIFY_SITE_ID` | Site ID used by Netlify deploy hooks. | Required for CLI deployments. |
| `NETLIFY_AUTH_TOKEN` | Personal access token for Netlify deploys. | Store only in the `netlify` config. |
| `NETLIFY_BLOBS_TOKEN` | Token for Netlify Blobs API interactions. | Needed by file upload utilities. |

## Environment Profiles

Local development and CI workflows

- Preferred local development: run the Next.js dev server directly and use `.env.local` for convenience (do not commit `.env.local`):

```bash
# start dev server
pnpm run dev
```

- The repository contains a validation script that CI and local tooling can run to ensure required variables are present. Use:

```bash
# validate environment prior to build
pnpm run check:env
```

- Platform deployments (Netlify, Vercel): configure environment variables through the platform's dashboard or provider APIs. This is the recommended production approach.

Secrets manager (optional)

If you use a secrets manager (Doppler, Vault, AWS Secrets Manager, etc.), document the team's preferred tool and access process in your internal runbook. CI should be configured to provide secrets via platform environment variables or CI secret storage. Do not assume any particular manager is present in CI builds.

## Validation

- Use the repository validation script to check required environment variables before building or running tests:

```bash
pnpm run check:env
```

- For ad-hoc verification, print the environment locally (do not commit) and confirm required keys are present.

## Security Notes

- Never commit `.env*` files or files containing secrets to the repository.
- Prefer managing production secrets via the hosting platform's environment variable configuration (Vercel/Netlify), or a dedicated secrets manager with audited access controls.
- If using Doppler, rotate service tokens regularly and restrict access to production configs via roles and audits.

## Reference Example

```diff
chore(env): document environment management and platform configuration

- Documented platform-centric workflows and local `.env.local` usage.
- Added env-reference.md and validation script guidance.
```

## Additional Reference

Preferred mapping of environments to deployment contexts:

| Environment | Primary Usage |
| --- | --- |
| `local` | Developer machines |
| `netlify` | Preview builds and scheduled functions |
| `vercel` | Production runtime |

Any previous doppler.yaml helper has been removed from the repository; prefer platform-specific environment configuration and the repository validation script.
