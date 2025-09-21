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
