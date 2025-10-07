# Environment Variables Reference

## Core Application
| Variable | Description | Required | Notes |
|----------|-------------|---------|-------|
| `DATABASE_URL` | Primary PostgreSQL connection string | Yes | Local/production database; may be replaced by `NETLIFY_DATABASE_URL` on Netlify |
| `NETLIFY_DATABASE_URL` | Netlify-provisioned database URL | Conditional | Overrides `DATABASE_URL` when present in Netlify environment |
| `NEXTAUTH_URL` | Site URL used by NextAuth.js | Yes (non-Netlify) | Should match deployment domain |
| `NEXTAUTH_SECRET` | Secret for NextAuth.js sessions | Yes | Generate secure 32+ char value |
| `FROM_EMAIL` | Default sender email address | Yes | Used for transactional emails |
| `NODE_ENV` | Runtime mode | Yes | `development`, `production`, or `test` |

## Authentication & Authorization
| Variable | Description |
|----------|-------------|
| `MULTI_TENANCY_ENABLED` | Toggles tenant filtering logic |
| `PREVIEW_SESSION_COOKIE`, `PREVIEW_ADMIN_EMAIL`, `PREVIEW_ADMIN_PASSWORD` | Preview login automation |

## Email & Notifications
| Variable | Description |
|----------|-------------|
| `SENDGRID_API_KEY` | SendGrid API key for outbound email |
| `ALERT_EMAIL` | Fallback alert recipient for health monitor |
| `SLACK_WEBHOOK_URL` | Slack webhook for health and monitoring alerts |

## Payments & Finance
| Variable | Description |
|----------|-------------|
| `STRIPE_SECRET_KEY` | Secret API key for Stripe |
| `STRIPE_PUBLISHABLE_KEY` | Publishable key for frontend flows |
| `STRIPE_WEBHOOK_SECRET` | Signing secret for webhook verification |
| `ADMIN_AUTH_TOKEN` | Token used by test suites for authenticated admin actions |
| `E2E_SERVICE_ID` | Default service ID used in E2E booking tests |

## Scheduling & Automation
| Variable | Description |
|----------|-------------|
| `CRON_SECRET` | Bearer token for cron endpoints |
| `NEXT_CRON_SECRET` | Alternate cron secret for Netlify |
| `PERF_BUDGET_LCP_MS`, `PERF_BUDGET_CLS` | Performance budgets enforced in tests |

## Realtime & Cache
| Variable | Description |
|----------|-------------|
| `REDIS_URL` | Redis connection string for realtime/cache and rate limiting |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Upstash REST credentials (used by Redis-backed cache and rate limiting) |
| `REALTIME_TRANSPORT` | Transport type (`memory`, `redis`, `postgres`) |
| `REALTIME_PG_URL`, `REALTIME_PG_CHANNEL` | Postgres logical decoding configuration |

## Uploads & Storage
| Variable | Description |
|----------|-------------|
| `UPLOADS_PROVIDER` | Active file storage provider (`netlify`, etc.) |
| `NETLIFY_BLOBS_TOKEN` | Token for Netlify blobs API |
| `UPLOADS_AV_SCAN_URL` | Antivirus scanning endpoint |

## Observability & Monitoring
| Variable | Description |
|----------|-------------|
| `SENTRY_DSN` | Sentry project DSN |
| `SENTRY_TRACES_SAMPLE_RATE` | Trace sampling rate |
| `VERCEL_ENV` | Vercel environment indicator |

## Admin Surface Security
| Variable | Description |
|----------|-------------|
| `ENABLE_IP_RESTRICTIONS` | When `true`, middleware enforces IP allowlist for `/admin` and `/api/admin` |
| `ADMIN_IP_WHITELIST` | Comma-separated list of allowed admin IPs (exact match) |
| `LOG_ADMIN_ACCESS` | When `true`, logs allow/deny events for admin access attempts |
| `ENFORCE_ORG_2FA` | When `true`, route helpers can enforce two-factor for admin roles |

## Testing & Tooling
| Variable | Description |
|----------|-------------|
| `E2E_BASE_URL` | Base URL for Playwright tests |
| `TEST_BASE_URL` | Base URL for integration tests |
| `PRISMA_MOCK` | Enables Prisma mock mode during tests (defaults to `true`) |
| `SEED_FAIL_FAST` | Control behavior of seeding script in tests |

## Usage Notes
- Run `pnpm check:env` to validate required variables before builds.
- Prefer platform secret managers (Vercel/Netlify/CI vaults) instead of `.env` commits.
- Document any new variable additions in this file and update `scripts/check-required-envs.sh` accordingly.
