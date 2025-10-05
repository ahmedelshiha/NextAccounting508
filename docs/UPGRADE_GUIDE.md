# Upgrade Guide

This guide covers safe upgrades of dependencies, Next.js/React, Prisma, and infrastructure.

## General Process
1) Read release notes for major deps (Next.js, React, Prisma, NextAuth, Stripe).
2) Create a branch and enable CI (lint, typecheck, unit/integration/e2e).
3) Increment versions conservatively and run `pnpm typecheck` and tests.
4) Verify dev server and pages. Smoke test critical flows (auth, bookings, payments).
5) Update docs and CHANGELOG.md.

## Next.js / React
- Check breaking changes for App Router and React Server Components.
- Validate `next.config.mjs` options; remove deprecated flags.
- Verify Route Handlers and middleware behavior.

## Prisma & Database
- After dependency updates, run:
```bash
pnpm db:generate
pnpm db:push # for dev
```
- In production, use migrations: `pnpm db:migrate` (see MIGRATION_GUIDE.md).

## Auth & Cookies
- Confirm NextAuth adapter compatibility (Prisma) and session options.
- Revalidate environment variables (`pnpm check:env`).

## Monitoring & Cron
- Sentry SDK changes may affect configs (`sentry.*.config.ts`).
- Validate netlify functions and `/api/cron/*` endpoints after upgrades.

## Rollback
- Keep original lockfile/versions in branch history.
- Use feature flags to dark launch where possible.
