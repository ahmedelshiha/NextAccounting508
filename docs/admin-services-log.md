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

## [2025-09-21] Fix: /admin/services fetched zero items
What I changed:
- Updated src/app/admin/services/page.tsx to handle API response shape { services, total, ... } in addition to plain arrays.
- Now maps json.services (or json.items) to Service list to display real DB data.

Why:
- API returns a paginated object; the client previously assumed an array and thus rendered none.

Verification:
- Load /admin/services after login; services list populates from DB; filters and pagination work.

## [2025-09-21] Audit: services module consistency fixes
Changes:
- Fixed client query params to use featured/status enums (not boolean) and added limit=100 to align with API schema.
- Switched all single-item mutations to PATCH /api/admin/services/{id} and DELETE by id.
- Normalized list response handling for both array and { services, total } shapes.

Impact:
- Prevents 500 errors from invalid query values, ensures updates/deletes succeed, and displays complete data set.
