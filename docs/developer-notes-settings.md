Developer Notes — Settings Overview

Quick pointers for contributors:

- Use SettingsShell and SettingsCard for consistent UI.
- Keep exports free of secrets. If new fields are added ensure they are safe to export.
- All new API routes are under /api/admin/settings and must validate session and staff role server-side (middleware enforces admin pages already).
- Tests: unit tests live in tests/admin/settings and services tests in tests/services.
- E2E tests use the dev-login helper in e2e tests to set session cookies; ensure dev-login remains available in dev/staging.

How to run locally:
- pnpm install
- pnpm db:generate
- pnpm dev
- Open http://localhost:3000/admin/settings (login via dev-login or seed an admin user)

Common troubleshooting
- If export returns 500, inspect server logs and ensure required envs are present.
- If Playwright fails in CI, set E2E_BASE_URL to the preview URL and use headless Chromium.
