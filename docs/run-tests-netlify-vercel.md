# Running Vitest on Netlify and Vercel

This guide configures the project to run Vitest unit/integration tests as part of the Netlify and Vercel build process.

What I changed
- Added a `test` script: `pnpm test` runs `vitest --run` (package.json).
- Added a `prebuild` script so Vercel will run tests before the `build` script when `pnpm build` is executed.
- Updated `netlify.toml` to run `pnpm test` during the main build, deploy-preview, and branch-deploy contexts before lint & build.

Notes & prerequisites
- Running tests in CI requires environment variables and services: DATABASE_URL or NETLIFY_DATABASE_URL, NEXTAUTH_SECRET, etc. Some tests may require a running database and seeded data. If these are not available in Netlify build environment, tests may fail — prefer to run tests in a controlled CI runner with access to staging resources.
- Playwright E2E tests require extra dependencies and may not run in Netlify build environment without additional setup (browsers). The scaffolding is added under e2e/ but is not invoked by default in Netlify build.

How Netlify will run tests
- Netlify reads netlify.toml and will execute the configured `command`:
  - It now runs `pnpm db:generate` then PRISMA init/seed (if DB set), then `pnpm test`, then `pnpm lint`, then `pnpm build`.
- If tests fail, the build will stop; this prevents broken code from being deployed.

How Vercel will run tests
- Vercel runs `pnpm build` which triggers the `prebuild` script automatically (npm lifecycle). `prebuild` runs `pnpm test`.
- If tests fail, the build will fail and deployment is prevented.

Recommendations
- Prefer running tests in a dedicated CI (GitHub Actions) with controlled access to a test DB and secrets. Netlify/Vercel builds are best for final verification, but limited environments may cause flakiness.
- For E2E Playwright tests, run them in GitHub Actions or other CI that can install browsers and provide staging endpoints.

Commands for local verification
- Run tests locally: pnpm test
- Run integration tests: pnpm test:integration
- Run E2E (Playwright): pnpm test:e2e

If you want, I can:
- Add a GitHub Actions workflow that runs tests with a test DB and secrets (recommended).
- Configure Playwright browsers for CI if you want E2E tests to run in Netlify.
