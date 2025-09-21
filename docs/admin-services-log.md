## [2025-09-21] Playwright preview login test added
What I implemented:
- Added Playwright E2E test (tests/e2e/preview-login.spec.ts) that attempts a headless UI login using PREVIEW_ADMIN_EMAIL/PREVIEW_ADMIN_PASSWORD or uses PREVIEW_SESSION_COOKIE fallback.
- Updated Netlify preview workflow to install Playwright and run the E2E test against the preview URL after the basic smoke checks.

Why:
- Validate that protected admin endpoints are reachable and authenticated in preview environments, reducing surprises when merging.

Next steps:
- Ensure repository secrets are set:
  - PREVIEW_ADMIN_EMAIL, PREVIEW_ADMIN_PASSWORD (or PREVIEW_SESSION_COOKIE)
  - NETLIFY_AUTH_TOKEN, NETLIFY_SITE_ID (already used by workflow)
- Monitor runs and adapt selectors/login flow if the preview login form uses a non-standard structure.


## [2025-09-21] CI and Netlify preview smoke workflows added
What I implemented:
- Added .github/workflows/ci.yml to run lint and typecheck; tests run only when DATABASE_URL secret is provided.
- Added .github/workflows/netlify-preview-smoke.yml and scripts/netlify-preview-smoke.js to poll Netlify for deploy previews and run GET / smoke tests.

Why:
- Establish quality gates and ensure preview deployments are healthy before merge.

Next steps:
- Add repository secrets: NETLIFY_AUTH_TOKEN, NETLIFY_SITE_ID (required for preview smoke); optionally DATABASE_URL to enable tests in CI.
- Run pnpm run lint and pnpm run typecheck locally and address any findings.
