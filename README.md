# Accounting Firm Platform

A full-stack, multi-tenant Next.js platform tailored for accounting firms. It unifies client portals, administrative workflows, analytics, and automation across web, API, scheduled workers, and supporting services.

## Table of Contents
- [Overview](#overview)
- [Architecture Highlights](#architecture-highlights)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [Install Dependencies](#install-dependencies)
  - [Environment Configuration](#environment-configuration)
  - [Database Setup](#database-setup)
  - [Seed Data](#seed-data)
  - [Run the App](#run-the-app)
- [Available Scripts](#available-scripts)
- [Testing & Quality](#testing--quality)
- [Integrations & Services](#integrations--services)
- [Deployment](#deployment)
- [Monitoring & Operations](#monitoring--operations)
- [Additional Documentation](#additional-documentation)
- [Contributing](#contributing)
- [License](#license)

## Overview
- Admin workspace provides analytics, task management, service configuration, and compliance tooling.
- Client portal supports bookings, service requests, document uploads, and financial dashboards.
- API layer exposes server actions and REST endpoints for web, cron, and third-party integrations.

## Architecture Highlights
- **Next.js App Router (src/app)** for server components, routing, and API endpoints.
- **Modular feature folders** (`admin`, `portal`, `booking`, `services`, `tasks`, etc.) with colocated hooks, providers, and tests.
- **Netlify Functions** for scheduled jobs (cron reminders, telemetry, health monitoring) with shared scripts in `scripts/`.
- **ClamAV sidecar service** (`clamav-service/`) for antivirus scanning of uploaded documents.
- **Monitoring assets** in `monitoring/` and Sentry instrumentation for observability.
- **Extensive automation scripts** in `scripts/` covering migrations, RLS setup, backfills, and maintenance.

## Key Features
- Comprehensive admin dashboards with performance metrics, KPIs, and realtime panels.
- End-to-end booking management, including availability planning, reminders, invoicing, and analytics.
- Advanced task workspace featuring board, calendar, table, list, and Gantt views plus bulk operations.
- Multi-channel communications: chat console, notifications, newsletters, and automated email flows.
- Service request triage with workload, distribution charts, and SLA tracking.
- Client self-service portal for bookings, expenses, secure uploads, and live chat.
- Internationalization (English, Arabic RTL, Hindi) with extensible locale registry.
- Scheduled processes for reminders, telemetry, and data hygiene via cron routes and Netlify functions.

## Tech Stack
- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui, Radix UI, Framer Motion.
- **Backend:** Next.js API routes, Prisma ORM, PostgreSQL (Supabase or Neon compatible), NextAuth.js, Stripe SDK.
- **Tooling:** pnpm, ESLint 9, TypeScript 5, Vitest, Playwright, Prisma, Sentry, Redis (Upstash compatible).
- **Automation & Integrations:** SendGrid, Netlify scheduled functions, Cron endpoint runners, ClamAV service, Chart.js.

## Project Structure
```
accounting-firm/
├── src/
│   ├── app/                  # App Router routes and API endpoints
│   ├── components/           # Reusable UI, admin, portal, and feature widgets
│   ├── hooks/, stores/, lib/ # Shared logic, services, adapters, caching
│   ├── schemas/, services/   # Validation schemas and business services
│   └── utils/, contexts/     # Cross-cutting concerns and providers
├── prisma/                   # Prisma schema, migrations, seeds
├── netlify/functions/        # Scheduled Netlify function handlers
├── scripts/                  # Operational scripts (migrations, audits, maintenance)
├── monitoring/               # Performance dashboards and configuration
├── clamav-service/           # Python AV microservice for uploads scanning
├── docs/                     # Additional project documentation
└── tests/, e2e/              # Vitest unit/integration and Playwright suites
```

## Prerequisites
- Node.js 18 or newer.
- pnpm 10 (project uses the pnpm workspace lockfile and scripts).
- PostgreSQL 15+ (Supabase or Neon works out of the box).
- Optional: Redis or Upstash for realtime/pub-sub adapters.
- Optional: SendGrid, Stripe, Sentry, Netlify, and Slack credentials for extended features.

## Getting Started

### Install Dependencies
```bash
pnpm install
```

### Environment Configuration
Create a `.env.local` file (or configure environment variables through your platform). Minimum required variables align with `scripts/check-required-envs.sh`:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` or `NETLIFY_DATABASE_URL` | PostgreSQL connection string |
| `FROM_EMAIL` | Default outbound sender address |
| `NEXTAUTH_SECRET` | NextAuth signing secret |
| `NEXTAUTH_URL` | Base URL for generating callbacks |

Common optional variables:

| Variable | Purpose |
|----------|---------|
| `SENDGRID_API_KEY` | Production email delivery |
| `CRON_SECRET` | Auth token for cron endpoints and functions |
| `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` | Payment flows |
| `REDIS_URL` or `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` | Caching and realtime adapters |
| `UPLOADS_PROVIDER`, `NETLIFY_BLOBS_TOKEN` | File storage provider selection |
| `UPLOADS_AV_SCAN_URL` | External antivirus scan endpoint |
| `REALTIME_PG_URL`, `REALTIME_PG_CHANNEL`, `REALTIME_TRANSPORT` | Realtime event propagation |
| `MULTI_TENANCY_ENABLED` | Guard rails for tenant scoping |
| `SENTRY_DSN`, `SENTRY_TRACES_SAMPLE_RATE` | Error and performance telemetry |
| `NEXT_PUBLIC_DEBUG_FETCH`, `NEXT_PUBLIC_FETCH_TIMEOUT`, `NEXT_PUBLIC_API_BASE` | Client networking debug knobs |
| `PERF_BUDGET_LCP_MS`, `PERF_BUDGET_CLS` | Performance budget thresholds in tests |
| `PREVIEW_URL`, `PREVIEW_SESSION_COOKIE`, `PREVIEW_ADMIN_EMAIL`, `PREVIEW_ADMIN_PASSWORD` | Preview environment smoke testing |
| `E2E_BASE_URL`, `ADMIN_AUTH_TOKEN`, `E2E_SERVICE_ID` | Playwright end-to-end suite configuration |

Run the validator when variables change:
```bash
pnpm check:env
```

### Database Setup
```bash
pnpm db:generate
pnpm db:push
```

### Seed Data
```bash
pnpm db:seed
```

### Run the App
```bash
pnpm dev
```
Visit http://localhost:3000 to access the web application.

## Available Scripts
| Command | Description |
|---------|-------------|
| `pnpm dev` | Start the Next.js development server |
| `pnpm build` | Validate env vars, generate Prisma client, and build using Turbopack |
| `pnpm start` | Run the production server |
| `pnpm lint` | ESLint across the repo with autofix |
| `pnpm typecheck` | TypeScript project references build (`tsconfig.build.json`) |
| `pnpm test` | Run the Vitest suite |
| `pnpm test:integration` | Execute integration tests serially |
| `pnpm test:tenant`, `pnpm test:thresholds` | Specialized regression suites |
| `pnpm test:e2e` | Playwright end-to-end tests (requires env configuration) |
| `pnpm monitoring:setup`, `pnpm monitoring:health` | Production monitoring checks |
| `pnpm db:*` | Database utilities (generate, migrate deploy, seed, reset, studio) |

## Testing & Quality
- **Unit & Integration:** Vitest with mocks in `__mocks__/` and `tests/`.
- **End-to-End:** Playwright specs in `e2e/tests/`; configurable base URL and credentials.
- **Performance Budgets:** `tests/thresholds.test.ts` enforces LCP/CLS targets.
- **Accessibility & Layout:** Multiple admin layout tests ensure SSR safety and environment-specific behavior.
- **CI Recommendations:** Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and targeted suites before deploys.

## Integrations & Services
- **Authentication:** NextAuth.js with Prisma adapter and role-based access control.
- **Payments:** Stripe endpoints under `src/app/api/payments` and invoice helpers.
- **Email:** SendGrid via `@sendgrid/mail` with fallbacks when not configured.
- **Uploads:** Netlify Blobs provider support plus antivirus scanning pipeline.
- **Realtime:** Optional Redis/Upstash-backed adapters in `src/lib/realtime-enhanced.ts`.
- **Scheduling:** Netlify cron functions (`netlify/functions/cron-*`) and `/api/cron/*` routes.
- **Analytics & Monitoring:** Sentry configs (`sentry.*.config.ts`) and dashboards under `monitoring/`.

## Deployment
- **Vercel:** Default target. Build with `pnpm build`. Configure environment variables and run Prisma migrations post-deploy (`pnpm db:push`, `pnpm db:seed`).
- **Netlify:** Uses `@netlify/plugin-nextjs` and custom functions. Ensure `NETLIFY_DATABASE_URL` or `DATABASE_URL` is set and configure cron secrets.
- **Docker / ECS:** Reference `DEPLOYMENT.md` for multi-stage Dockerfile and Compose setup. Prisma generation runs during build stage.
- **Self-Hosted:** Provision Node.js 18+, PostgreSQL, and optional Redis/Sentry. Use `scripts/setup-rls.ts` and other scripts for database hardening.

## Monitoring & Operations
- **Sentry:** Client, server, and edge configs ready for DSN wiring.
- **Health Checks:** `netlify/functions/health-monitor.ts` and `scripts/monitoring` assets for uptime alerts (Slack/email).
- **Cron & Automation:** `scripts/production-monitoring.js`, `scripts/health-check.js`, and `/api/cron/*` endpoints cover reminders, telemetry, and cleanups.
- **Security:** Prisma guardrails, tenant-filter middleware, Stripe webhook validation, and antivirus scanning for uploads.

## Additional Documentation
- `PROJECT_SUMMARY.md` — migration roadmap and ownership notes.
- `docs/` — tenant system plans, enhancement guides, and operational playbooks.
- `ARCHIVE-*.md` — legacy references for decommissioned templates.
- `netlify/` — platform-specific configuration and custom plugins.

## Contributing
1. Create a feature branch from `main`.
2. Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and relevant integration/e2e suites.
3. Open a pull request with a summary of changes and testing notes.

## License
Licensed under the MIT License. See [LICENSE](LICENSE) for full terms.
