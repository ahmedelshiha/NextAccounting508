# Admin Services – TODO (updated)

Last updated: 2025-09-21

Status summary
- Completed: core UI components, admin APIs, utilities, initial analytics UI, accessible modal + focus trap, unit tests scaffold, component tests, integration tests, Netlify preview smoke workflow, CI workflow scaffold
- In progress: CI configuration and quality gates
- Pending: —

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
  - Implemented .github/workflows/ci.yml with pnpm caching; tests run only when DATABASE_URL secret is provided

7) Deployability (completed)
- [x] Netlify preview deploy and smoke tests
  - Implemented .github/workflows/netlify-preview-smoke.yml and scripts/netlify-preview-smoke.js that poll Netlify API for deploy-preview and run GET / smoke test
- [x] Document required environment variables and build settings in docs (DATABASE_URL, NEXTAUTH_URL, STRIPE keys if used)

Notes and blockers
- Typecheck and test runs could not be executed in this environment due to execution policy/ACL. Run locally and paste errors if you want me to fix them.

Recent fixes
- Fixed /admin/services UI to consume API object shape ({ services, total, ...}) so real DB data renders instead of empty state.

Immediate next actions you can run locally
- pnpm run lint
- pnpm run typecheck

Environment & build settings
- Required repository secrets (GitHub):
  - NETLIFY_AUTH_TOKEN: Netlify Personal Access Token with read access to sites and deploys (used by preview smoke workflow)
  - NETLIFY_SITE_ID: Netlify site ID for this project (used by preview smoke workflow)
  - Optional: DATABASE_URL (Postgres connection string) — when provided, CI will run vitest against a real DB
- Application environment variables (configure in Netlify and local .env):
  - DATABASE_URL: Postgres connection string used by Prisma
  - NEXTAUTH_URL: Public URL of the app for NextAuth callbacks (Netlify production URL in prod; preview URL not required at build)
  - NEXTAUTH_SECRET: Secret used by NextAuth (generate once and keep secret)
  - Optional payment/email integrations if enabled:
    - STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
    - SENDGRID_API_KEY
- Netlify build settings:
  - Node.js: 18+
  - Package manager: pnpm (auto-detected); install command: pnpm install --frozen-lockfile
  - Build command: next build (already configured via netlify.toml)
  - Functions: netlify/functions/* (already present)
