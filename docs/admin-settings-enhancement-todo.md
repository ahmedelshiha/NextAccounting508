# Admin Settings Enhancement — Implementation TODO

Source: docs/admin-settings-enhancement.md

Instructions
- Tasks are ordered by dependency: complete earlier tasks before later ones.
- Each task is specific, actionable, and measurable. Expand or split tasks further in follow-up issues if needed.

---

## Phase 0 — Preparation & Discovery

- [ ] 0.1 Read and verify docs/admin-settings-enhancement.md exists and is up-to-date. (Outcome: confirm scope & decisions)
- [ ] 0.2 Run a codebase search to list current settings-related files and routes (grep for "settings", "booking-settings", "SettingsNavigation"). (Outcome: a short file list saved to docs/admin-settings-discovery.md)
- [ ] 0.3 Create a branch/issue in your VCS for this work and document the main milestones. (Outcome: branch or ticket created; link added to the top of this TODO)
- [ ] 0.4 Confirm RBAC source of truth (src/lib/permissions.ts) and list missing permission keys for new settings pages. (Outcome: a permissions checklist)

---

## Phase 1 — Registry & Types (foundation)
Goal: Provide single source of truth for settings categories/tabs used by sidebar + pages.

- [x] 1.1 Create `src/lib/settings/types.ts` with SettingsCategory, SettingsTab, SettingsCategoryKey types. (Outcome: file created, exported types)

  ✅ What was completed:
  - Implemented `src/lib/settings/types.ts` exporting:
    - SettingsCategoryKey (union of allowed category keys)
    - SettingsTab interface (typed tab descriptor with optional get/put helpers)
    - SettingsCategory interface (category metadata)
    - Zod schema alias `ZodSchema<T>` for convenience
  
  ✅ Why it was done:
  - New implementation. A typed foundation is required so the registry, API bindings, and UI components share a single contract. This reduces runtime errors and improves DX when implementing category tabs.
  
  ✅ Next steps:
  - Populate the registry (task 1.2).

- [x] 1.2 Create `src/lib/settings/registry.ts` and populate it with the 12 categories and their base `route` and `icon` (use lucide icons). Do not populate tabs yet. (Outcome: registry exports SETTINGS_REGISTRY)

  ✅ What was completed:
  - Implemented `src/lib/settings/registry.ts` exporting `SETTINGS_REGISTRY` with the 12 categories: organization, serviceManagement, booking, clientManagement, taskWorkflow, teamManagement, financial, analyticsReporting, communication, securityCompliance, integrationHub, systemAdministration.
  - Each entry includes `key`, `label`, `route`, and a `icon` component reference from `lucide-react`.

  ✅ Why it was done:
  - New implementation. Central registry enables consistent rendering of settings in the AdminSidebar and SettingsShell and provides a single place to attach permission metadata and tabs later.

  ✅ Next steps:
  - Add unit tests for registry shape (task 1.3).
  - Refactor AdminSidebar/SettingsNavigation to consume this registry (Phase 2 tasks 2.1/2.2).

- [ ] 1.3 Add unit tests for the registry shape (tests/unit/settings.registry.test.ts) asserting each category has route and label. (Outcome: test file + passing test)

Dependencies: none (foundational)

---

## Phase 2 — Admin Sidebar & Navigation Integration
Goal: Replace hardcoded Settings links with registry-driven navigation and RBAC filtering.

- [ ] 2.1 Update `src/components/admin/settings/SettingsNavigation.tsx` to import `SETTINGS_REGISTRY` and render categories filtered by `hasPermission(session.role, permission)` where applicable. (Outcome: SettingsNavigation renders dynamic links)
- [ ] 2.2 Refactor `src/components/admin/layout/AdminSidebar.tsx` to render Settings section from the registry instead of hardcoded children. Keep existing styling and breakpoints. (Outcome: AdminSidebar uses registry)
- [ ] 2.3 Add localStorage persistence for expanded/collapsed state and a small unit test for the persistence helper (utils/localStorage.ts). (Outcome: sidebar preserves collapse across reloads)
- [ ] 2.4 Accessibility: ensure collapsed items include aria-label and tooltip; add keyboard arrow navigation (implement focus management hook `useRovingTabIndex`). (Outcome: keyboard navigation + a11y checks passing)

Dependencies: Phase 1

---

## Phase 3 — Settings Shell UI & Reusable Controls
Goal: Provide the shell and form primitives to build all category pages consistently.

- [ ] 3.1 Create `src/components/admin/settings/SettingsShell.tsx` implementing a 1-column-nav / 4-column-content layout matching docs sample. (Outcome: shell component exported)
- [ ] 3.2 Create `src/components/admin/settings/FormField.tsx` with TextField, SelectField, Toggle, NumberInput components using existing design tokens and classes. Convert any inline styles to classes. (Outcome: reusable field components)
- [ ] 3.3 Create `src/components/admin/settings/Tabs.tsx` to render tabbed navigation inside the shell, supporting keyboard and aria roles. (Outcome: Tabs component ready)
- [ ] 3.4 Add client-side TypeScript types for settings payloads import/export in `src/types/settings.ts`. (Outcome: typed payloads)
- [ ] 3.5 Add storybook or static render test that mounts SettingsShell + Tabs and asserts tab switching works. (Outcome: test added)

Dependencies: Phase 1

---

## Phase 4 — Organization Settings (first category implementation)
Goal: Implement Organization Settings (General, Contact, Localization, Branding, Legal) end-to-end as a pattern to follow for other categories.

- [ ] 4.1 Add Zod schema `src/schemas/settings/organization.ts` with OrgGeneralSchema (name, tagline, description, industry) and the remaining tab schemas. (Outcome: zod schemas added)
- [ ] 4.2 Implement API routes: `src/app/api/admin/org-settings/route.ts` (GET, PUT). Use tenant scoping, `getServerSession`, `hasPermission`, Zod validation, and audit logging. (Outcome: route implemented + RBAC applied)
- [ ] 4.3 Create Prisma model or reuse an existing table (prisma/schema.prisma) to persist organization settings if not present. Add a migration if needed and document it. (Outcome: migration file or confirmation of existing model)
- [ ] 4.4 Implement UI tabs under `src/components/admin/settings/groups/Organization/GeneralTab.tsx`, ContactTab.tsx, LocalizationTab.tsx, BrandingTab.tsx, LegalTab.tsx using FormField primitives and SettingsShell. (Outcome: UI pages render data and save)
- [ ] 4.5 Add `src/app/admin/settings/company/page.tsx` that uses SettingsShell and dynamically loads the tabs with SSR-safe dynamic imports. (Outcome: page route exists)
- [ ] 4.6 Tests: API tests (vitest) for GET/PUT payloads + UI render test asserting save calls API and shows success toast. (Outcome: tests added)

Dependencies: Phases 1 & 3

---

## Phase 5 — Booking Settings (extend & enhance)
Goal: Extend existing BookingSettingsPanel with Automation, Integrations, Capacity, Forms; add validation, sub-endpoints, import UI, and warnings display.

- [ ] 5.1 Update `src/schemas/booking-settings.schemas.ts` to add BookingAutomationSchema, BookingIntegrationsSchema, BookingCapacitySchema, BookingFormsSchema. (Outcome: schemas added)
- [ ] 5.2 Add sub-endpoints: PUT `/api/admin/booking-settings/automation`, `/integrations`, `/capacity`, `/forms` following the existing booking routes pattern (tenant + RBAC + Zod). (Outcome: endpoints implemented)
- [ ] 5.3 Update `src/services/booking-settings.service.ts` to handle new sections in get/update/export/import/reset flows and update validateSettingsUpdate accordingly. Add caching invalidation for these sections. (Outcome: service updated)
- [ ] 5.4 Extend `src/components/admin/BookingSettingsPanel.tsx` tabs array to include the new tabs and implement UI components for each tab inside `src/components/admin/booking/*` from temp artifacts as a reference. (Outcome: UI shows new tabs with fields)
- [ ] 5.5 Implement Import modal in BookingSettingsPanel: file upload, preview sections, overwrite toggle, call POST `/api/admin/booking-settings/import`. (Outcome: admins can import bundles)
- [ ] 5.6 Surface warnings returned by PUT `/api/admin/booking-settings` inline as non-blocking alerts with the ability to expand details. (Outcome: warnings visible in UI)
- [ ] 5.7 Tests: add API tests for sub-endpoints, service validations for new schemas, and UI tests for the import flow. (Outcome: tests added)

Dependencies: Phases 1, 3, existing booking settings code

---

## Phase 6 — Core Category Implementations (repeatable pattern)
Goal: Implement remaining categories following the same pattern (schema → service → API → UI → tests). Create one PR per category or small logical groups.

For each category below implement the sub-steps: A) add Zod schemas, B) implement service layer (get/update, cache), C) implement API routes (GET/PUT), D) implement UI tabs/pages using SettingsShell, E) add tests.

Categories to implement (suggested order for dependencies):

- Financial (invoicing, payments, taxes, currencies, reconciliation)
  - [ ] 6.F.1 Add schemas: financial.ts
  - [ ] 6.F.2 Implement service: src/services/financial-settings.service.ts
  - [ ] 6.F.3 Implement API: src/app/api/admin/financial-settings/route.ts
  - [ ] 6.F.4 Implement UI: src/app/admin/settings/financial/page.tsx + tabs
  - [ ] 6.F.5 Tests

- Integrations (payments, calendars, comms, analytics, storage)
  - [ ] 6.I.1 Add schemas: integration-hub.ts
  - [ ] 6.I.2 Implement service & secrets storage guidance (do NOT store raw secrets in repo) — support read/masked write flows + audit
  - [ ] 6.I.3 Implement API and test endpoints for connection tests (e.g., test Stripe keys) and webhook signature validation
  - [ ] 6.I.4 Implement UI: connection pages + test buttons
  - [ ] 6.I.5 Tests

- Client Management
  - [ ] 6.CM.1 schemas + service + API + UI + tests

- Team Management
  - [ ] 6.TM.1 schemas + service + API + UI + tests

- Task & Workflow
  - [ ] 6.TW.1 schemas + service + API + UI + tests

- Analytics & Reporting
  - [ ] 6.AR.1 schemas + service + API + UI + tests

- Communication
  - [ ] 6.COM.1 schemas + service + API + UI + tests

- Security & Compliance
  - [ ] 6.SEC.1 schemas + service + API + UI + tests

- System Administration
  - [ ] 6.SYS.1 schemas + service + API + UI + tests

Notes: split each category into 2–4 PRs if large. Always include RBAC checks and audit logging.

Dependencies: Phase 3 (UI) and Phase 1 (registry)

---

## Phase 7 — RBAC, Permissions & UI Hiding
Goal: Ensure all new routes/pages enforce permissions and UI hides unavailable actions.

- [ ] 7.1 Add new PERMISSIONS keys for each category/tab in `src/lib/permissions.ts` with mapping to roles in ROLE_PERMISSIONS. (Outcome: permission keys added)
- [ ] 7.2 Update middleware `src/app/middleware.ts` to include route prefixes for new admin settings endpoints where required. (Outcome: middleware mapping updated)
- [ ] 7.3 Update UI components (SettingsShell, BookingSettingsPanel) to hide Import/Reset/Test actions when the user lacks the related permission. (Outcome: UI respects permissions)
- [ ] 7.4 Add unit tests asserting unauthorized responses (401/403) for protected API routes. (Outcome: tests cover permission enforcement)

Dependencies: Phases 4–6

---

## Phase 8 — Caching, Audit & Observability
Goal: Ensure settings reads are cached, writes invalidate cache, and all critical actions are logged.

- [ ] 8.1 Implement caching strategy in each service (e.g., in-memory/SWR + Redis optional) following booking settings pattern. Document TTLs. (Outcome: caching implemented)
- [ ] 8.2 Ensure every write (PUT/POST/RESET/IMPORT) logs an audit event via `logAudit`. (Outcome: audit events present)
- [ ] 8.3 Add monitoring events for errors and warnings from validation; send to Sentry (if configured). (Outcome: monitoring hooks added)
- [ ] 8.4 Implement rate limits for heavy endpoints (import/export) using existing `src/lib/rate-limit.ts`. (Outcome: rate limiting applied)

Dependencies: Phase 5 & Phase 6

---

## Phase 9 — Import/Export, Backup & Reset Flows
Goal: Provide reliable export/import reset flows across settings and ensure idempotency.

- [ ] 9.1 Standardize export format across categories and create `src/lib/settings/export.ts` helper. (Outcome: consistent export format)
- [ ] 9.2 Complete Booking import UI and apply same pattern to Organization & Financial imports. (Outcome: import UI per category)
- [ ] 9.3 Add server-side import validation that accepts `sections` selection and `overwriteExisting` boolean. (Outcome: safe import endpoint)
- [ ] 9.4 Add restore/backup tests: export → db snapshot apply import → verify settings. (Outcome: integration test)
- [ ] 9.5 Add admin-only cron or manual job to snapshot settings daily to object storage (S3/Netlify blobs). (Outcome: scheduled snapshot configured)

Dependencies: Phase 6 & Phase 8

---

## Phase 10 — MCP Integrations & Secrets Guidance
Goal: Prepare for connecting external services and instruct admins on secure onboarding.

- [ ] 10.1 Add developer docs section `docs/mcps.md` describing how to connect MCP servers via the Builder UI. Include step-by-step for Neon, Netlify, Zapier, Figma, Supabase, Builder CMS, Linear, Notion, Sentry, Context7, Semgrep, Prisma Postgres. (Outcome: docs page added)
- [ ] 10.2 Add UI affordance to `Integration Hub` UI to store masked API keys and test connections; write guidance to not commit secrets. (Outcome: Integration UI with masked inputs)
- [ ] 10.3 For payments: add test buttons and webhook verification helpers for Stripe/PayPal. (Outcome: connection tests pass)
- [ ] 10.4 Ask admin: Which MCPs should be connected now? If Neon or Supabase required to persist settings in production, request that the user connect them via [Open MCP popover](#open-mcp-popover). (Outcome: decision recorded)

MCP servers available & recommended (include all): Neon, Netlify, Zapier, Figma (plugin), Supabase, Builder CMS, Linear, Notion, Sentry, Context7, Semgrep, Prisma Postgres.

---

## Phase 11 — Tests, QA, and Documentation
Goal: Ship with high test coverage and clear admin docs.

- [ ] 11.1 Add unit tests for all service validation logic (vitest). Coverage target: 80%+ for new modules. (Outcome: tests committed)
- [ ] 11.2 Add API integration tests for GET/PUT/IMPORT/EXPORT/RESET flows (tests/integration/settings.*.test.ts). (Outcome: integration tests added)
- [ ] 11.3 Add UI tests for main pages (rendering, save flow, import, warnings) using vitest or playwright as chosen by repository. (Outcome: e2e UI tests)
- [ ] 11.4 Update docs: add page `docs/admin-settings-usage.md` for administrators explaining where to find each setting, required permissions, and how to test connections. (Outcome: admin docs)
- [ ] 11.5 Run full test suite and fix any regressions. (Outcome: all tests pass locally/CI)

Dependencies: Phases 4–10

---

## Phase 12 — Rollout & Post-Deploy Tasks
Goal: Deploy safely and monitor behavior in production.

- [ ] 12.1 Create a release PR that documents the migration plan and required environment variables. (Outcome: PR with release notes)
- [ ] 12.2 Deploy to staging; run feature QA checklist (permission checks, import/export, booking flows). (Outcome: QA checklist signed-off)
- [ ] 12.3 Monitor errors & usage for 72 hours; rollback if critical errors detected. (Outcome: monitoring plan executed)
- [ ] 12.4 Gather feedback from admin users and open follow-up issues for improvements. (Outcome: feedback captured)

---

## Minimum Viable Deliverable (MVD) for first release
Complete the following to ship a usable settings hub:

- [ ] Registry + AdminSidebar integration (Phase 1 & 2)
- [ ] SettingsShell + FormField primitives (Phase 3)
- [ ] Organization Settings end-to-end (Phase 4)
- [ ] Booking Settings extended with at least Automation and Integrations tabs, import UI, and server endpoints (subset of Phase 5)
- [ ] RBAC mapping for new pages (Phase 7)
- [ ] Basic tests and documentation for the above

---

If anything is unclear or you want me to start implementing tasks, tell me which task (by number) to begin with and whether MCP connections (e.g., Neon) should be made now. If you want, I can start by creating the registry and updating AdminSidebar (Tasks 1.1, 1.2, 2.1, 2.2).
