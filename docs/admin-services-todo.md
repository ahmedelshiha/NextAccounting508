# Admin Services – TODO (updated)

Last updated: 2025-09-21

Status summary
- Completed: core UI components, admin APIs, utilities, initial analytics UI, accessible modal + focus trap, unit tests scaffold, component tests, integration tests
- In progress: CI configuration and quality gates
- Pending: Netlify preview deploy, environment variables documentation

Actionable checklist (ordered, with acceptance criteria)

1) Page wiring (completed)
- [x] Render ServicesHeader, ServicesFilters, ServiceCard grid in src/app/admin/services/page.tsx
  - Acceptance: page shows header, filters, paginated card grid; search and filters apply client-side

2) CRUD flows & modals (in progress/completed)
- [x] Add Create/Edit modals using ServiceForm (accessibility: focus trap, keyboard, aria)
  - Acceptance: Create and Edit open in modal, focus is trapped, Escape and outside-click close modal, form submits call API and revalidates list

3) Bulk actions & selection (completed)
- [x] Selection across page and BulkActionsPanel integration (activate/deactivate/feature/unfeature/category/price/delete)
  - Acceptance: Selecting items and applying actions updates services and clears selection

4) Analytics (completed)
- [x] Wire ServicesAnalytics to admin stats endpoint with skeleton and error states
  - Acceptance: Analytics card shows when endpoint returns data; loading skeleton otherwise

5) Testing (completed)
- [x] Unit tests scaffold for utils and schemas (tests/services/*)
- [x] Component tests: services page interactions (filters, modal open/close, focus-trap, create/edit flow)
- [x] Integration tests: admin services APIs (list/create/update/delete/bulk/export)

6) Quality gates & CI (in progress)
- [ ] Run full typecheck and ESLint locally; fix any issues
- [x] Add CI workflow to run lint, typecheck, and vitest (GitHub Actions)

7) Deployability (pending)
- [ ] Netlify preview deploy and smoke tests
- [ ] Document required environment variables and build settings in docs (DATABASE_URL, NEXTAUTH_URL, STRIPE keys if used)

Notes and blockers
- I added focus-trap-react to package.json; you must run pnpm install locally before running the app or tests.
- Typecheck and test runs could not be executed in this environment due to execution policy/ACL. Run locally and paste errors if you want me to fix them.

Immediate next actions you can run locally
- pnpm install
- pnpm run lint
- pnpm exec vitest run
- pnpm run typecheck

Netlify preview smoke test setup
- This repo contains netlify.toml configured for deploy previews and a GitHub Actions workflow (.github/workflows/netlify-preview-smoke.yml) that:
  - Polls the Netlify API for a preview deploy for the PR branch
  - Waits for the deploy to reach ready state and extracts the preview URL
  - Runs a simple smoke test (GET /) against the preview and fails on non-200 status

Required GitHub secrets (please add these in your repository settings -> Secrets):
- NETLIFY_AUTH_TOKEN: a Netlify Personal Access Token with read access to sites and deploys
- NETLIFY_SITE_ID: the Netlify site ID for this project

Notes:
- The workflow will fail early if those secrets are not provided. Add them and re-open the PR to trigger the smoke test.
- If you prefer GitHub Actions to deploy to Netlify directly (rather than relying on Netlify preview), I can add a deploy step but it requires write-scoped NETLIFY_AUTH_TOKEN.

If you want I can:
- Add more robust smoke checks (API health endpoints, specific page content checks)
- Use Playwright for browser-based checks (will increase runtime)
- Configure Netlify to run the netlify/functions/health-monitor on a schedule for production monitoring
