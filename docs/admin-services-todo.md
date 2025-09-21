# Admin Services – TODO (updated)

Last updated: 2025-09-21

Status summary
- Completed: core UI components, admin APIs, utilities, initial analytics UI, accessible modal + focus trap, unit tests scaffold
- In progress: typecheck & ESLint (blocked to run in this environment)
- Pending: component tests, integration tests, Netlify preview deploy

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

5) Testing (pending/in progress)
- [x] Unit tests scaffold for utils and schemas (tests/services/*)
- [ ] Component tests: services page interactions (filters, modal open/close, focus-trap, create/edit flow)
- [ ] Integration tests: admin services APIs (list/create/update/delete/bulk/export)

6) Quality gates & CI (pending)
- [ ] Run full typecheck and ESLint locally; fix any issues
- [ ] Add CI steps to run lint, typecheck, vitest, and a preview build

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

If you want I can:
- Add component tests for modal behavior and admin interactions
- Add integration tests for the admin APIs
- Prepare a draft PR with these changes
