# Testing Strategy

## Overview
- Comprehensive coverage across unit, integration, end-to-end, and performance budgets.
- Tooling: Vitest for unit/integration, Playwright for E2E, testing-library for component tests, and custom scripts for health/performance.

## Unit Tests
- Located in `tests/` with domain-specific folders (admin, portal, dashboard, utils, etc.).
- Use Vitest mocks (`__mocks__/prisma.ts`) to isolate Prisma interactions.
- Ensure new utilities/services include targeted unit tests verifying edge cases and error handling.

## Integration Tests
- Found under `tests/integration/`.
- Cover Prisma tenant guards, API routes (bookings, invoices, cron), and security scenarios.
- Require environment configuration: `DATABASE_URL` (or mock), `NETLIFY_DATABASE_URL`, `CRON_SECRET`, `MULTI_TENANCY_ENABLED`.
- Run with `pnpm test:integration` (serial execution to prevent DB conflicts).

## Specialized Suites
- `tests/tenant-filter.test.ts`, `tests/tenant-switch.route.test.ts`: enforce tenant isolation.
- `tests/thresholds.test.ts`: monitors LCP/CLS budgets using `PERF_BUDGET_*` env variables.
- `tests/team-management.routes.test.ts`, `tests/cron-reminders.route.test.ts`: validate admin API behavior under varied env setup.

## End-to-End Tests
- Playwright specs in `e2e/tests/` covering admin settings, services, booking flows, portal uploads, and preview authentication.
- Configured via `e2e/playwright.config.ts` with base URL from `E2E_BASE_URL`.
- Credentials provided by `ADMIN_AUTH_TOKEN` or `/api/dev-login` when permitted.
- Execute `pnpm test:e2e`; ensure environment replicates production as closely as possible.

## Mocking & Fixtures
- Prisma mock toggled by `process.env.PRISMA_MOCK` defaulting to `true` for tests.
- Mock data stored in `src/app/admin/tasks/data`, `tests/mocks`, and JSON fixtures for notifications/templates.
- Use `tests/test-mocks/` helpers for DOM rendering and data setup.

## CI Recommendations
- Pipeline order: `pnpm lint` → `pnpm typecheck` → `pnpm test` → `pnpm test:integration` → targeted suites → `pnpm test:e2e` (optional for PRs, required before release).
- Cache `.pnpm-store` and Prisma client output to accelerate builds.
- Fail builds on threshold regressions; adjust budgets only with performance lead approval.

## Coverage & Reporting
- Enable Vitest coverage with `pnpm test --coverage` when required.
- Track E2E flakiness metrics; quarantine unstable tests with clear references and fix owners.
- Document notable gaps and planned improvements in team retro notes.

## Maintenance
- Review and prune outdated tests when deprecating features.
- Keep mocks in sync with Prisma schema changes.
- Update Playwright flows when UI/UX changes are shipped; use data-test attributes where possible for selectors.
