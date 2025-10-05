# Architecture Overview

## System Context
- **Web Application:** Next.js App Router project providing public marketing pages, client portal, and administrative consoles.
- **APIs & Services:** Server actions and REST endpoints under `src/app/api/*`, Netlify scheduled functions, and auxiliary Python antivirus microservice.
- **Data Stores:** PostgreSQL (Supabase/Neon compatible) via Prisma ORM, optional Redis/Upstash for realtime adapters, and Netlify Blobs for storage.
- **Third-Party Integrations:** Stripe for payments, SendGrid for email delivery, Sentry for telemetry, Slack/Email alerts, and cron orchestration via Netlify/Vercel.

## Logical Layers
| Layer | Responsibilities | Key Modules |
|-------|------------------|-------------|
| Presentation | React Server Components, layouts, and client components for admin, portal, marketing flows | `src/app`, `src/components`, `src/styles` |
| Domain Services | Business logic, adapters, formatting, pricing, analytics, task management, scheduling | `src/services`, `src/lib`, `src/utils`, `src/hooks` |
| Data Access | Prisma client factories, tenant guards, caching providers, external API clients | `src/lib/prisma.ts`, `src/lib/cache`, `src/lib/realtime-enhanced.ts`, `src/lib/api.ts` |
| Integration | API routes, Netlify functions, webhooks, cron orchestration, monitoring scripts | `src/app/api`, `netlify/functions`, `scripts/*.ts`, `monitoring/` |

## Deployment Topology
- **Primary Hosting:** Vercel or Netlify for the Next.js app; commands executed via pnpm with Turbopack builds.
- **Cron & Background Jobs:** Netlify scheduled functions (`cron-reminders`, `cron-payments-reconcile`, `health-monitor`) and `/api/cron/*` App Router endpoints gated by `CRON_SECRET`.
- **Security Services:** ClamAV container (`clamav-service/`) processes uploads asynchronously; Stripe and webhook routes validate signatures; tenant guards enforce row-level scoping.
- **Observability:** Sentry client/server/edge configs, monitoring dashboards in `monitoring/`, and scripts `monitoring/health-check.js`, `production-monitoring.js` for smoke tests.

## Request Flow Highlights
1. **Client Requests** enter Next.js edge/server runtime; middleware applies tenant and auth enforcement.
2. **Route Handlers** invoke domain services, Prisma queries, and external APIs through typed adapters.
3. **Responses** are streamed to React components or returned as JSON, with caching/pagination handled in domain utilities.
4. **Background Jobs** call cron endpoints or Netlify functions, which reuse shared services and emit notifications via email or chat.

## Data Model Considerations
- Prisma schema defines multi-tenant entities (bookings, services, tasks, posts) keyed by `tenantId` where applicable.
- `src/app/api/*` routes honor tenant filters through helper utilities to prevent cross-tenant leakage.
- Migrations are managed via `prisma/migrations` with scripts assisting in backfills, constraint fixes, and RLS enablement.

## Frontend Composition
- Shared components live under `src/components`, with domain-specific folders for admin analytics, task cards, booking widgets, and portal dashboards.
- UI primitives rely on shadcn/ui and Radix; styling mixes Tailwind utilities with component-scoped styles.
- State is managed through React hooks, context providers, and Zustand stores (`src/stores`).

## Scalability & Reliability Notes
- **Horizontal Scaling:** Stateless Next.js runtime; DB and Redis must scale externally.
- **Performance Budgets:** `tests/thresholds.test.ts` enforces LCP/CLS budgets; `PerfMetricsReporter` captures runtime metrics.
- **Caching Strategies:** API helper supports fetch keepalive, caching toggles, and optional Redis-backed realtime fanout.
- **Failure Handling:** Graceful fallbacks when env vars absent (e.g., email logging instead of SendGrid), guard rails around mock Prisma for tests.

## Future Enhancements (Tracking)
- Consolidate archive docs and legacy templates.
- Document data flow diagrams for tasks and booking lifecycles.
- Evaluate adoption of React Server Actions for high-volume admin workloads.
- Expand observability with structured logging and dashboard automation.
