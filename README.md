# Accounting Firm Platform

A full-stack, multi-tenant Next.js platform tailored for accounting firms. It unifies client portals, administrative workflows, analytics, and automation across web, API, scheduled workers, and supporting services.

## Table of Contents
- [Overview](#overview)
- [Architecture Highlights](#architecture-highlights)
- [Key Features](#key-features)
- [Feature Modules & Domains](#feature-modules--domains)
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
- [API Overview](#api-overview)
- [Deployment](#deployment)
- [Monitoring & Operations](#monitoring--operations)
- [Security & Compliance](#security--compliance)
- [Audit Summary](#audit-summary)
- [Recommended Improvements](#recommended-improvements)
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

## Feature Modules & Domains
- **Admin Operations:** `src/app/admin` offers analytics, reports, bookings, services, service-request dashboards, invoicing, payments, expenses, posts, newsletter, permissions, roles, integrations, cron telemetry, and performance metrics.
- **Task Workspace:** Boards, calendars, tables, list, and Gantt views powered by providers, filters, analytics, and extensive components in `src/app/admin/tasks`.
- **Booking Lifecycle:** Public booking wizard, admin availability management, automation rules, exports, and reminders across `src/app/booking`, `src/app/admin/booking*`, and API routes.
- **Client Portal:** Bookings, service requests, expenses scanning, secure uploads, realtime chat, and settings within `src/app/portal` plus supporting components.
- **Communications & Notifications:** Admin chat console, message center, newsletters, reminders, and notification providers located in `src/components/communication`, `src/app/admin/chat`, and cron endpoints.
- **Financial & Analytics Tools:** Revenue time series, ROI/tax calculators, reports, invoices, payments, expenses ingestion, and dashboards under `src/components/admin`, `src/app/admin/reports`, `src/app/api/payments`, and `src/app/api/invoices`.
- **Content & Marketing:** Blog, posts, landing variants, SEO schema, and localization resources through `src/app/blog`, `src/components/home`, and `src/locales`.

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

Note: Prisma `datasource db` uses `NETLIFY_DATABASE_URL` by default. On non-Netlify environments, set `DATABASE_URL` and map it to `NETLIFY_DATABASE_URL` in your process manager or provide `NETLIFY_DATABASE_URL` directly.

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
| `pnpm build:skip-env` | Skip strict env validation during build |
| `pnpm start` | Run the production server |
| `pnpm lint` | ESLint across the repo with autofix |
| `pnpm typecheck` | TypeScript project references build (`tsconfig.build.json`) |
| `pnpm test` | Run the Vitest suite |
| `pnpm test:integration` | Execute integration tests serially |
| `pnpm test:integration:serial` | Same as above (alias) |
| `pnpm test:e2e` | Playwright end-to-end tests |
| `pnpm e2e:ci` | CI-friendly E2E runner via Netlify plugin |
| `pnpm test:tenant` | Tenant filter regression suite |
| `pnpm test:thresholds` | Performance thresholds (LCP/CLS) |
| `pnpm db:generate` | Generate Prisma client |
| `pnpm db:push` | Push Prisma schema to DB |
| `pnpm db:migrate` | Deploy migrations |
| `pnpm db:seed` | Seed database |
| `pnpm db:studio` | Open Prisma Studio |
| `pnpm db:reset` | Reset database with migrations |
| `pnpm db:rls:enable` | Enable Row-Level Security helpers |
| `pnpm check:env` | Validate required env vars |
| `pnpm check:rbac` / `pnpm audit:rbac` | RBAC verifiers/auditors |
| `pnpm vercel:build` | Vercel build pipeline wrapper |
| `pnpm monitoring:setup` | Prepare prod monitoring artifacts |
| `pnpm monitoring:health` | Run health checks |
| `pnpm production:deploy` | Setup monitoring then run vercel build |
| `pnpm validate:stateful-docs` | Verify stateful docs consistency |

## Testing & Quality
- **Unit & Integration:** Vitest with mocks in `__mocks__/` and `tests/`.
- **End-to-End:** Playwright specs in `e2e/tests/`; configurable base URL and credentials (Chromium-only on Netlify via plugin).
- **Performance Budgets:** `tests/thresholds.test.ts` enforces LCP/CLS targets.
- **Accessibility & Layout:** Admin layout tests ensure SSR safety and environment-specific behavior.
- **CI Recommendations:** Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and targeted suites before deploys.

## Integrations & Services
- **Authentication:** NextAuth.js (`src/app/api/auth/[...nextauth]/route.ts`) with Prisma adapter and role-based access control.
- **Payments:** Stripe endpoints under `src/app/api/payments` and invoice helpers.
- **Email:** SendGrid via `@sendgrid/mail` with fallbacks when not configured.
- **Uploads:** Netlify Blobs provider support plus antivirus scanning pipeline.
- **Realtime:** Optional Redis/Upstash-backed adapters in `src/lib/realtime-enhanced.ts`.
- **Scheduling:** Netlify cron functions (`netlify/functions/cron-*`) and `/api/cron/*` routes.
- **Analytics & Monitoring:** Sentry configs (`sentry.*.config.ts`) and dashboards under `monitoring/`.

## API Overview
Key groups (see `src/app/api` for handlers):
- Public content and utilities: `/api/posts`, `/api/pricing`, `/api/currencies`, `/api/tools/*`.
- Auth & user: `/api/auth/[...nextauth]`, `/api/users/*`, `/api/dev-login`, `/api/_dev/login`.
- Bookings: `/api/bookings/*`, `/api/bookings/[id]/*`, `/api/ws/bookings`.
- Admin: `/api/admin/*` including analytics, bookings, services, tasks, stats, settings, permissions, team, uploads quarantine.
- Portal: `/api/portal/*` for client-facing bookings and service requests.
- Payments & invoices: `/api/payments/*`, `/api/admin/invoices/*`.
- Cron & monitoring: `/api/cron/*`, `/api/monitoring`, `/api/security/*`, `/api/admin/system/health`.
- OpenAPI: `/api/openapi/admin-services` exposes admin-services schema.

## Deployment
- **Vercel:** Default target. Use `pnpm vercel:build`. Configure environment variables and run Prisma migrations post-deploy (`pnpm db:push`, `pnpm db:seed`).
- **Netlify:** `netlify.toml` sets build and enables `@netlify/plugin-nextjs` and a custom E2E plugin. Set `NETLIFY_DATABASE_URL` (or alias from `DATABASE_URL`), optional `RUN_DB_MIGRATIONS=true` to auto-migrate/seed.
- **Docker / ECS:** See `DEPLOYMENT.md`. Ensure Prisma client generation occurs in build stage and that migrations run with sufficient advisory lock timeouts.
- **Self-Hosted:** Provision Node.js 18+, PostgreSQL, and optional Redis/Sentry. Use `scripts/setup-rls.ts` and other scripts for database hardening.

## Monitoring & Operations
- **Sentry:** Client, server, and edge configs ready for DSN wiring.
- **Health Checks:** `netlify/functions/health-monitor.ts` and `scripts/monitoring` assets for uptime alerts (Slack/email).
- **Cron & Automation:** `scripts/production-monitoring.js`, `scripts/health-check.js`, and `/api/cron/*` endpoints cover reminders, telemetry, and cleanups.

## Security & Compliance
- **Access Control:** Role-based guard rails, tenant scoping, and admin layout stores ensure principle-of-least-privilege across app and API layers.
- **Data Protection:** Prisma tenant filter utilities, Zod validation, and multi-tenancy flags protect database reads/writes.
- **Uploads Safety:** ClamAV microservice, quarantine management UI, and provider abstraction for blob storage.
- **Secrets & Transport:** Cron secrets, Stripe webhook validation, Sentry DSN configuration, and optional Redis/Upstash tokens are all environment driven.

## Audit Summary
- Codebase is modular and follows feature-based boundaries; APIs are comprehensive and colocated under `src/app/api`.
- Env validation is robust (`scripts/check-required-envs.sh`), with Netlify-aware defaults and CI branches.
- Testing stack covers unit/integration and E2E; performance thresholds are enforced.
- Deployment targets (Vercel/Netlify) are configured with sensible defaults and optional E2E in production context.

## Recommended Improvements
- Adopt a single source of truth for DB URL (introduce `DATABASE_URL` in Prisma `datasource` with conditional mapping in runtime config) to reduce confusion outside Netlify.
- Add a LICENSE file or clarify licensing policy referenced in this README.
- Expand OpenAPI coverage (beyond admin-services) and publish schema artifacts for client SDK generation.
- Introduce a security scan step (Semgrep or similar) in CI and document remediation workflow in `docs/`.
- Add a developer "quickstart" seed that provisions a demo tenant, services, and sample data for faster onboarding.

## Additional Documentation
- `PROJECT_SUMMARY.md` — platform audit and ownership notes.
- `docs/` — tenant system plans, enhancement guides, and operational playbooks.
- `ARCHIVE-*.md` — legacy references for decommissioned templates.
- `netlify/` — platform-specific configuration and custom plugins.

## Contributing
1. Create a feature branch from `main`.
2. Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and relevant integration/e2e suites.
3. Open a pull request with a summary of changes and testing notes.

## License
MIT
