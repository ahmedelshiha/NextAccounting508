# Developer Onboarding

Welcome! This guide helps you set up the project locally and understand core workflows.

## Prerequisites
- Node.js >= 18
- pnpm
- PostgreSQL (local or managed)

## Setup
1) Install dependencies
```bash
pnpm install
```
2) Configure environment
- Copy variables documented in `docs/ENVIRONMENT_VARIABLES_REFERENCE.md` into `.env.local`.
- Minimum: `DATABASE_URL` (or `NETLIFY_DATABASE_URL`), `FROM_EMAIL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`.

3) Database
```bash
pnpm db:generate
pnpm db:push
pnpm db:seed # optional
```

4) Run
```bash
pnpm dev
```

5) Tests
```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e # requires E2E_BASE_URL and auth setup
```

## Conventions
- Feature-based folders under `src/`.
- Validation via Zod schemas in `src/schemas`.
- API handlers under `src/app/api` (App Router).
- UI built with Tailwind CSS v4 and shadcn/ui patterns.

## Troubleshooting
- Use `pnpm check:env` to validate envs.
- Review `netlify.toml` and `vercel.json` for provider-specific behavior.
- Health endpoints: `/api/security/health` and `/api/admin/system/health`.

## Useful Docs
- README.md, docs/ARCHITECTURE.md, docs/TESTING_STRATEGY.md, docs/SECURITY_GUIDELINES.md, docs/redundancy-report.md.
