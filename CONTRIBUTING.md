# Contributing Guidelines

Thank you for your interest in contributing! This project powers a multi-tenant accounting platform. Please follow the guidelines below to keep changes predictable and safe.

## Development Setup
- Node >= 18, pnpm installed
- Install deps: `pnpm install`
- Generate Prisma client: `pnpm db:generate`
- Start dev server: `pnpm dev`
- Run lints/tests before pushing: `pnpm lint && pnpm typecheck && pnpm test`

## Branching & PRs
- Create feature branches from `main`.
- Keep PRs focused and small; include tests and docs updates when relevant.
- Link issues in PR description (e.g., `Fixes #123`).
- Run: `pnpm lint`, `pnpm typecheck`, `pnpm test`, relevant integration/e2e when touching routing or flows.

## Code Style & Patterns
- Follow existing feature-based structure (`src/app`, `src/components`, `src/lib`, `src/services`, `src/schemas`).
- Prefer typed APIs and Zod validation for inputs/outputs.
- Keep UI consistent with existing components and styles; preserve CSS variables.
- Avoid duplications; reuse shared modules and add barrel exports when helpful.

## Commits
- Write clear, imperative messages (e.g., "feat(tasks): add bulk status update").
- Reference scope (area) when possible: `admin|portal|api|lib|tasks|bookings|settings|infra`.

## Tests
- Unit/integration: `pnpm test` (Vitest)
- E2E: `pnpm test:e2e` (Playwright)
- Keep tests deterministic; respect performance budgets and accessibility checks when present.

## Database & Migrations
- Update `prisma/schema.prisma` then `pnpm db:push` locally.
- Include migration notes in PR if changes impact production.
- Seed data should remain idempotent and safe to run.

## Security
- Never commit secrets. Use environment variables and platform secret managers.
- Report vulnerabilities via private channels described in `SECURITY.md`.

## Documentation
- Update `README.md` and `docs/*` when behavior or configuration changes.
- Keep changelog entries in `CHANGELOG.md` under Unreleased.

## Reviews
- Address feedback promptly; keep discussions professional and constructive.
