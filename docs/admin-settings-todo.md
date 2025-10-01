# Unified Admin Settings — Implementation TODO

This checklist orders tasks by dependencies. Complete parent tasks before dependent ones. Each entry is specific, actionable, and measurable. Mark [x] when done.

## 0. Pre-req: repo & env
- [ ] Verify local dev server builds and tests pass: `pnpm test` and `pnpm dev` (or `pnpm vercel:build` in CI)
- [ ] Ensure branch `ai_main_490cdcad1769` is active for changes and create a draft PR when ready

---
## 1. Registry & audit (foundation)
1.1 Normalize SETTINGS_REGISTRY
- [ ] Open src/lib/settings/registry.ts and ensure every entry has: `key` (unique), `label`, `route` (starts with `/admin/settings`), `icon`, `permission` (or null), `group`, `order`.
- [ ] Add missing system items with proposed canonical routes:
  - Users & Permissions -> /admin/settings/users
  - Uploads -> /admin/settings/uploads
  - Cron Telemetry -> /admin/settings/cron
- [ ] Run local unit test that imports registry to ensure it is valid: `pnpm test tests/unit/settings.registry.test.ts`

1.2 Duplicate-route and key check
- [ ] Add a small script (scripts/check-settings-registry.ts) that validates registry keys are unique and no two registry routes collide with existing top-level admin routes.
- [ ] Add a CI step to run this script before merge (update package.json test: pre-commit or CI config)

1.3 Inventory verification
- [ ] Produce a mapping file `docs/admin-settings-inventory.json` listing: registry entries, actual page files (e.g., src/app/admin/settings/*) and top-level pages that should be redirected (e.g., src/app/admin/users/page.tsx)

---
## 2. Settings layout & components
2.1 Create SettingsShell (layout wrapper)
- [ ] Create file: src/components/admin/settings/SettingsShell.tsx
  - [ ] Responsibilities: render left nav (SettingsNavigation), header area (title, breadcrumbs), main content container with consistent padding, and footer area for save/reset actions.
  - [ ] Accept props: title?: string, subtitle?: string, actions?: ReactNode
  - [ ] Use existing UI primitives (Card, Button) and preserve Tailwind styles/variables.
- [ ] Add unit tests for SettingsShell rendering and accessibility

2.2 App-level settings layout
- [ ] Create file: src/app/admin/settings/layout.tsx
  - [ ] Wrap children with SettingsShell; ensure `use client` only in client components and server-safe rendering for data fetching.
  - [ ] Ensure nested pages under /admin/settings automatically inherit the shell.

2.3 SettingsNavigation enhancements
- [ ] Update src/components/admin/SettingsNavigation.tsx to read `group` and `order` from registry and render grouped sections with headings.
- [ ] Add keyboard navigation (roving focus) and aria-current attributes.
- [ ] Add unit tests verifying permission filtering: supply mock session role and verify visible links.

---
## 3. Routing & redirects (non-breaking migration)
3.1 Redirect wrappers (non-destructive)
- [ ] Create thin redirect pages that route legacy top-level pages to canonical settings routes:
  - src/app/admin/users/page.tsx -> redirect to `/admin/settings/users`
  - src/app/admin/roles/page.tsx -> redirect to `/admin/settings/users/roles`
  - src/app/admin/permissions/page.tsx -> redirect to `/admin/settings/users/permissions`
  - src/app/admin/integrations/page.tsx -> redirect to `/admin/settings/integrations` if canonical
  - src/app/admin/security/page.tsx -> redirect to `/admin/settings/security`
  - src/app/admin/audits/page.tsx -> redirect to `/admin/settings/security/audits`
  - src/app/admin/uploads/quarantine/page.tsx -> redirect to `/admin/settings/uploads/quarantine`
  - src/app/admin/cron-telemetry/page.tsx -> redirect to `/admin/settings/cron`
- [ ] Each redirect file should use Next's `redirect()` server helper to return a 307 server-side redirect where feasible.

3.2 Verify no duplicate pages
- [ ] Run a route scan to ensure every canonical `/admin/settings/*` route maps to a single page file and registry entry.

---
## 4. Migration of pages (per-page checklist)
Note: Begin with Booking settings as a POC, then follow identical steps for each item.

4.1 POC: Booking settings
- [ ] Ensure POC source exists: src/app/admin/settings/booking/page.tsx
- [ ] Wrap booking page with SettingsShell if not already (move header into shell)
- [ ] Verify PermissionGate used and PERMISSIONS.BOOKING_SETTINGS_VIEW remains enforced
- [ ] Add unit/integration test: navigate to /admin/settings/booking and assert content and nav highlight
- [ ] Close POC and gather any needed style or layout fixes

4.2 Repeatable migration steps (for each item: financial, communication, analytics, integrations, uploads, cron, users & permissions, security)
For each page:
- [ ] Confirm existing implementation file path (top-level or settings folder)
- [ ] If implementation lives at top-level, create a thin wrapper under `/admin/settings/<key>/page.tsx` that imports and renders the existing component.
- [ ] Update registry entry to point to canonical `/admin/settings/<key>` route
- [ ] Ensure PermissionGate wraps page with correct permission constant
- [ ] Add automated tests (unit + integration) verifying access & save behavior
- [ ] Create redirect from legacy route (if top-level existed)

4.3 Users & Permissions specific (detailed)
- [ ] Add registry entry: `users` with route `/admin/settings/users` and permission PERMISSIONS.USERS_VIEW
- [ ] Create landing page src/app/admin/settings/users/page.tsx that contains three tabs: Users, Roles, Permissions
- [ ] Each tab should load existing components via thin wrappers that call current implementations at src/app/admin/users/page.tsx, src/app/admin/roles/page.tsx, src/app/admin/permissions/page.tsx or their subcomponents
- [ ] Add RBAC tests: ensure PERMISSIONS.USERS_MANAGE gates role/permission mutation actions

---
## 5. Permissions, audit logging & safety
5.1 Permission gating
- [ ] Add a helper HOC `withSettingsPermission` in src/lib/settings/permissions.ts that wraps pages and asserts permission; use PermissionGate internally.
- [ ] Replace ad-hoc permission checks in migrated settings pages to use the new helper.

5.2 Audit logging on save
- [ ] Add audit helper wrapper: src/lib/audit-settings.ts with function `auditSettingsChange(userId, key, before, after)` which calls existing audit infrastructure (src/lib/audit.ts) or POSTs to `/api/admin/activity`.
- [ ] Update each settings `PUT`/`PATCH` handler to call audit helper on success.
- [ ] Add unit tests verifying audit hook called when settings change.

5.3 Feature flag & safety
- [ ] Add feature flag `FEATURE_UNIFIED_SETTINGS` env var guard to toggle the unified nav (default: true)
- [ ] If flag false, show legacy navigation and routes unchanged

---
## 6. Tests, CI & QA
6.1 Unit tests
- [ ] Add tests for: registry validity, SettingsNavigation permission filtering, SettingsShell accessibility
- [ ] Add tests for duplicate-route scanner

6.2 Integration tests
- [ ] Integration test: visit `/admin/settings` and click each visible item; verify content loads and route updates.
- [ ] Integration test: Booking save flow — open, change one field, save, assert API call and audit event.

6.3 E2E tests (Playwright)
- [ ] E2E: critical path — login as admin -> open /admin/settings -> open Users tab -> create user -> assert created -> delete user
- [ ] E2E: ensure redirects from legacy routes work

6.4 CI configuration
- [ ] Add pre-merge checks: run unit tests, run duplicate-route scanner, run integration smoke tests

---
## 7. Documentation & developer onboarding
7.1 Docs for registry and how to add a new settings page
- [ ] Create `docs/adding-settings-page.md` with step-by-step: add registry entry, add page under `/admin/settings/<key>`, add permission constant, add tests and update redirects if needed

7.2 Runbook for rollback
- [ ] Add `docs/settings-rollout-runbook.md` describing how to disable feature flag and restore legacy routes, and how to verify audit logs

---
## 8. Rollout & monitoring
8.1 Gradual rollout
- [ ] Release behind `FEATURE_UNIFIED_SETTINGS` feature flag and enable for internal staff first
- [ ] Monitor logs for 7 days; keep redirects live for 30+ days

8.2 Monitoring
- [ ] Add Sentry scope to settings endpoints to capture errors (ensure DSN configured)
- [ ] Add telemetry events for each migrated page visit (count page loads under `/admin/settings/*`)

---
## 9. Acceptance criteria (must be satisfied before marking done)
- [ ] All `system` items are reachable under `/admin/settings/*` and functional
- [ ] Legacy top-level routes redirect to canonical `/admin/settings/*` routes
- [ ] Permission enforcement unchanged or improved, unit-tested and integration-tested
- [ ] Audit events recorded for any settings change
- [ ] Automated duplicate-route check added to CI
- [ ] Documentation updated and runbook published

---
## Suggested immediate next actions (pick one)
- [ ] I will update src/lib/settings/registry.ts to add `users`, `uploads`, `cron` entries and normalize fields (fast) — I will open a draft PR.
- [ ] I will implement SettingsShell and src/app/admin/settings/layout.tsx and migrate Booking settings as a POC (recommended next step).


*Generated by AI assistant for the repository. Mark tasks complete above as you progress.*
