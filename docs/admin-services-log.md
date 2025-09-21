## [2025-09-21] Netlify preview smoke test workflow added
What I implemented:
- Added GitHub Actions workflow (.github/workflows/netlify-preview-smoke.yml) that polls the Netlify API for a preview deploy URL for the PR branch and runs a basic smoke test (GET /).
- Reused existing netlify.toml preview configuration; workflow expects NETLIFY_AUTH_TOKEN and NETLIFY_SITE_ID GitHub secrets to be set.

Why:
- Provide automated verification that Netlify preview deploys are reachable and the site responds as expected before merging.

Next steps:
- Add NETLIFY_AUTH_TOKEN and NETLIFY_SITE_ID as repository secrets.
- If desired, extend smoke tests to validate API health endpoints and page content using Playwright.
