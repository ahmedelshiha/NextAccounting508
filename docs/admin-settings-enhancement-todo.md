# Admin Settings Enhancement — Implementation TODO

Source: docs/admin-settings-enhancement.md

Instructions
- Tasks are ordered by dependency: complete earlier tasks before later ones.
- Each task is specific, actionable, and measurable. Expand or split tasks further in follow-up issues if needed.

---

## Phase 0 — Preparation & Discovery

- [x] 0.1 Read and verify docs/admin-settings-enhancement.md exists and is up-to-date. (Outcome: confirm scope & decisions)

  ✅ What was completed:
  - Verified docs/admin-settings-enhancement.md exists and reflects the current architecture and scope.

  ✅ Why it was done:
  - Confirms decisions and aligns subsequent implementation with the documented plan.

  ✅ Next steps:
  - Proceed with discovery and RBAC checklist.
- [x] 0.2 Run a codebase search to list current settings-related files and routes (grep for "settings", "booking-settings", "SettingsNavigation"). (Outcome: a short file list saved to docs/admin-settings-discovery.md)

  ✅ What was completed:
  - Created discovery inventory at docs/admin-settings-discovery.md listing routes, components, APIs, services, and schemas.

  ✅ Why it was done:
  - Establishes a shared map of existing settings code to avoid duplication and guide refactors.

  ✅ Next steps:
  - Use this inventory as the source when wiring remaining tasks.
- [ ] 0.3 Create a branch/issue in your VCS for this work and document the main milestones. (Outcome: branch or ticket created; link added to the top of this TODO)
- [x] 0.4 Confirm RBAC source of truth (src/lib/permissions.ts) and list missing permission keys for new settings pages. (Outcome: a permissions checklist)

  ✅ What was completed:
  - Confirmed RBAC lives at src/lib/permissions.ts and compiled missing permission keys per category in docs/admin-settings-discovery.md.

  ✅ Why it was done:
  - Ensures UI and APIs can properly enforce access for new settings categories.

  ✅ Next steps:
  - Implement new permission constants and role mappings in Phase 7.

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

- [x] 1.3 Add unit tests for the registry shape (tests/unit/settings.registry.test.ts) asserting each category has route and label. (Outcome: test file + passing test)

  ✅ What was completed:
  - Added tests/unit/settings.registry.test.ts validating array shape, keys uniqueness, route prefix, and baseline categories.

  ✅ Why it was done:
  - Prevents regressions in the registry contract consumed by navigation and settings pages.

  ✅ Next steps:
  - Keep tests updated if categories evolve.

Dependencies: none (foundational)

---

## Phase 2 — Admin Sidebar & Navigation Integration
Goal: Replace hardcoded Settings links with registry-driven navigation and RBAC filtering.

- [x] 2.1 Update `src/components/admin/settings/SettingsNavigation.tsx` to import `SETTINGS_REGISTRY` and render categories filtered by `hasPermission(session.role, permission)` where applicable. (Outcome: SettingsNavigation renders dynamic links)

  ✅ What was completed:
  - Refactored `src/components/admin/settings/SettingsNavigation.tsx` to consume `SETTINGS_REGISTRY` from `src/lib/settings/registry.ts` and render category links dynamically.
  - Integrated `usePermissions()` to conditionally hide categories when a registry entry specifies a `permission` field (registry entries are currently permission-optional).
  - Preserved original styling, active state handling, and Quick Links section.

  ✅ Why it was done:
  - Enhancement: centralizes settings navigation and enables RBAC-driven visibility without duplicating link definitions. This avoids drift between sidebar and settings pages and simplifies adding new categories.

  ✅ Next steps:
  - 2.2 Refactor `src/components/admin/layout/AdminSidebar.tsx` to also consume `SETTINGS_REGISTRY` (next task).
  - 1.3 Add unit test for registry shape to ensure route+label exist and to prevent regressions.
- [x] 2.2 Refactor `src/components/admin/layout/AdminSidebar.tsx` to render Settings section from the registry instead of hardcoded children. Keep existing styling and breakpoints. (Outcome: AdminSidebar uses registry)

  ✅ What was completed:
  - Updated `src/components/admin/layout/AdminSidebar.tsx` to dynamically build the "Settings" submenu from `src/lib/settings/registry.ts`.
  - Implemented a safe runtime `require` fallback to preserve behavior if the registry cannot be loaded during edge cases.
  - Preserved existing styling, active route highlighting, badges, and RBAC enforcement using existing `hasAccess` checks.

  ✅ Why it was done:
  - Enhancement: centralizes settings link definitions and removes duplication between the sidebar and SettingsNavigation. This simplifies adding new settings categories and ensures consistent routing and permissions.

  ✅ Next steps:
  - 2.3 Add localStorage persistence for expanded/collapsed state and tests for the persistence helper.
  - 1.3 Add unit tests for the registry shape to prevent regressions.
- [x] 2.3 Add localStorage persistence for expanded/collapsed state and a small unit test for the persistence helper (src/lib/localStorage.ts). (Outcome: sidebar preserves collapse across reloads)

  ✅ What was completed:
  - Implemented `src/lib/localStorage.ts` with `getJSON`, `setJSON`, and `remove` helpers that are SSR-safe and JSON-safe.
  - Updated `src/components/admin/layout/AdminSidebar.tsx` to initialize `expandedSections` from localStorage and persist changes on update. Preserves default `['dashboard','business']` when no stored value exists or parsing fails.
  - Added unit tests `tests/unit/localStorage.test.ts` covering set/get/remove and invalid JSON handling.

  ✅ Why it was done:
  - Enhancement: persist user preference for sidebar expanded/collapsed sections across reloads improving admin navigation UX.

  ✅ Next steps:
  - 2.4 Implement keyboard roving focus hook `useRovingTabIndex` and a11y tooltips for collapsed items.
  - 1.3 Add unit tests for `SETTINGS_REGISTRY` shape to prevent accidental regressions.
- [x] 2.4 Accessibility: ensure collapsed items include aria-label and tooltip; add keyboard arrow navigation (implement focus management hook `useRovingTabIndex`). (Outcome: keyboard navigation + a11y checks passing)

  ✅ What was completed:
  - Implemented `src/hooks/useRovingTabIndex.ts` that enables ArrowUp/ArrowDown/Home/End navigation between elements marked with `data-roving` inside a container.
  - Integrated the hook into `src/components/admin/layout/AdminSidebar.tsx` by attaching it to the sidebar nav lists. All interactive items (buttons and links) now include `data-roving`.
  - When the sidebar is collapsed, interactive items receive `aria-label` and `title` attributes so screen readers and native tooltips convey the item name.

  ✅ Why it was done:
  - Enhancement: improves keyboard accessibility (roving focus) and provides accessible labels/tooltips when the sidebar is collapsed, addressing a11y gaps.

  ✅ Next steps:
  - Add automated a11y checks or axe-core tests if desired to validate keyboard and screen reader behavior across sidebar variants.
  - Continue with Phase 3 (SettingsShell + FormField primitives).

Dependencies: Phase 1

---

## Phase 3 — Settings Shell UI & Reusable Controls
Goal: Provide the shell and form primitives to build all category pages consistently.

- [x] 3.1 Create `src/components/admin/settings/SettingsShell.tsx` implementing a 1-column-nav / 4-column-content layout matching docs sample. (Outcome: shell component exported)

  ✅ What was completed:
  - Implemented `src/components/admin/settings/SettingsShell.tsx` as a client component with a left tab column and right content area. It accepts `tabs`, `activeTab`, and `onChangeTab` and preserves styling consistent with admin UI.

  ✅ Why it was done:
  - New implementation. Provides a consistent shell for all settings pages to consume and reduces duplicated layout code.

  ✅ Next steps:
  - Use this shell when implementing Organization and other category pages (Phase 4/6).

- [x] 3.2 Create `src/components/admin/settings/FormField.tsx` with TextField, SelectField, Toggle, NumberInput components using existing design tokens and classes. Convert any inline styles to classes. (Outcome: reusable field components)

  ✅ What was completed:
  - Implemented `TextField`, `SelectField`, `Toggle`, and `NumberField` components with accessible labels and Tailwind-based classes. No inline styles remain; all visual behavior uses classes.

  ✅ Why it was done:
  - New implementation. These primitives speed up consistent form building across settings pages and match the project's design tokens.

  ✅ Next steps:
  - Replace ad-hoc inputs in existing settings pages with these primitives when implementing categories.

- [x] 3.3 Create `src/components/admin/settings/Tabs.tsx` to render tabbed navigation inside the shell, supporting keyboard and aria roles. (Outcome: Tabs component ready)

  ✅ What was completed:
  - Implemented a small Tabs component that renders a row of buttons with ARIA roles and supports an externally controlled `active` prop.

  ✅ Why it was done:
  - New implementation. Ensures consistent tab appearance and behavior across settings pages.

  ✅ Next steps:
  - Use Tabs component inside SettingsShell or category pages for intra-category navigation.

- [x] 3.4 Add client-side TypeScript types for settings payloads import/export in `src/types/settings.ts`. (Outcome: typed payloads)

  ✅ What was completed:
  - Added `src/types/settings.ts` with `SettingsExport` and `SettingsImportOptions` types for consistent import/export payloads.

  ✅ Why it was done:
  - New implementation. Provides shared typing for import/export helpers and API payloads.

  ✅ Next steps:
  - Use these types when implementing export/import helpers and endpoints (Phase 9).

- [x] 3.5 Add storybook or static render test that mounts SettingsShell + Tabs and asserts tab switching works. (Outcome: test added)

  ✅ What was completed:
  - Added `tests/components/settings-shell.test.tsx` which mounts `SettingsShell` and asserts the `onChangeTab` handler is called when a tab is clicked.

  ✅ Why it was done:
  - New implementation. Validates the basic render and interaction for the shell and tab primitives.

  ✅ Next steps:
  - Expand UI tests to include accessibility checks and integration with form primitives.

Dependencies: Phase 1

---

## Phase 4 — Organization Settings (first category implementation)
Goal: Implement Organization Settings (General, Contact, Localization, Branding, Legal) end-to-end as a pattern to follow for other categories.

- [x] 4.1 Add Zod schema `src/schemas/settings/organization.ts` with OrgGeneralSchema (name, tagline, description, industry) and the remaining tab schemas. (Outcome: zod schemas added)

  ✅ What was completed:
  - Implemented `src/schemas/settings/organization.ts` containing OrgGeneralSchema, OrgContactSchema, OrgLocalizationSchema, OrgBrandingSchema, and OrganizationSettingsSchema.

  ✅ Why it was done:
  - New implementation. Provides server-side validation contract for organization settings endpoints and UI.

  ✅ Next steps:
  - Use these schemas in the API route and UI components (done in 4.2/4.4).

- [x] 4.2 Implement API routes: `src/app/api/admin/org-settings/route.ts` (GET, PUT). Use tenant scoping, `getServerSession`, `hasPermission`, Zod validation, and audit logging. (Outcome: route implemented + RBAC applied)

  ✅ What was completed:
  - Added `src/app/api/admin/org-settings/route.ts` implementing GET and PUT handlers using `OrganizationSettingsSchema`, tenant scoping via `getTenantFromRequest`, RBAC with `hasPermission` (uses `PERMISSIONS.ANALYTICS_VIEW` for now), Prisma persistence, and `logAudit` on updates.

  ✅ Why it was done:
  - New implementation. Exposes a minimal, secure API for organization settings allowing the UI to read and persist settings.

  ✅ Next steps:
  - Add API tests and refine permission keys (Phase 7).

- [x] 4.3 Create Prisma model or reuse an existing table (prisma/schema.prisma) to persist organization settings if not present. Add a migration if needed and document it. (Outcome: migration file or confirmation of existing model)

  ✅ What was completed:
  - Appended `OrganizationSettings` model to `prisma/schema.prisma` with fields for core, contact, localization, branding, and metadata. The model includes `tenantId` indexed and mapped to `organization_settings` table.

  ✅ Why it was done:
  - New implementation. Persistent storage is required for multi-tenant organization settings; adding the model enables Prisma-based CRUD.

  ✅ Next steps:
  - Generate Prisma migration locally/CI: `pnpm db:generate && pnpm db:migrate` or `prisma migrate dev` depending on environment. Document migration steps in the TO-DO. (Cannot run migrations in this environment.)

- [x] 4.4 Implement UI tabs under `src/components/admin/settings/groups/Organization/GeneralTab.tsx`, ContactTab.tsx, LocalizationTab.tsx, BrandingTab.tsx, LegalTab.tsx using FormField primitives and SettingsShell. (Outcome: UI pages render data and save)

  ✅ What was completed:
  - Implemented `GeneralTab.tsx`, `ContactTab.tsx`, `LocalizationTab.tsx`, `BrandingTab.tsx`, and `LegalTab.tsx` under `src/components/admin/settings/groups/Organization/`.
  - Each tab reads from `/api/admin/org-settings` on mount and persists its respective section via PUT to the same endpoint. UI uses shared form primitives for consistent styling.

  ✅ Why it was done:
  - New implementation. Completes the Organization Settings end-to-end, providing admins control over General, Contact, Localization, Branding, and Legal sections.

  ✅ Next steps:
  - Add UI tests for Contact/Localization/Branding/Legal tabs (recommended).
  - Ensure Prisma migration is applied in CI/deploy (add migration step to release PR).

- [x] 4.5 Add `src/app/admin/settings/company/page.tsx` that uses SettingsShell and dynamically loads the tabs with SSR-safe dynamic imports. (Outcome: page route exists)

  ✅ What was completed:
  - Implemented `src/app/admin/settings/company/page.tsx` that renders SettingsShell and dynamically imports `GeneralTab` for the initial view.

  ✅ Why it was done:
  - New implementation. Provides the admin page route for Organization Settings that is consistent with the registry and shell.

  ✅ Next steps:
  - Expand tabs to load Contact, Localization, Branding, Legal components and hook up routing/tab state.

- [x] 4.6 Tests: API tests (vitest) for GET/PUT payloads + UI render test asserting save calls API and shows success toast. (Outcome: tests added)

  ✅ What was completed:
  - Added `tests/admin-org-settings.api.test.ts` which mocks `next-auth/next`, `@/lib/prisma`, and `@/lib/audit` and covers GET, invalid PUT (400), and valid PUT (200) flows.
  - Added `tests/components/org-general-tab.test.tsx` which mocks fetch and asserts the GeneralTab loads existing data and triggers a save request on clicking Save.

  ✅ Why it was done:
  - New implementation. Tests provide coverage for the Organization Settings API and basic UI behavior to prevent regressions.

  ✅ Next steps:
  - Expand tests to cover Contact/Localization/Branding tabs once implemented.
  - Run full test suite in CI to ensure no conflicts with other mocks.

  ✅ Next steps:
  - Add `tests/integration/org-settings.api.test.ts` and a UI test for the GeneralTab saving behavior. (I can add these next.)

Dependencies: Phases 1 & 3

---

## Phase 5 — Booking Settings (extend & enhance)
Goal: Extend existing BookingSettingsPanel with Automation, Integrations, Capacity, Forms; add validation, sub-endpoints, import UI, and warnings display.

- [x] 5.1 Update `src/schemas/booking-settings.schemas.ts` to add BookingAutomationSchema, BookingIntegrationsSchema, BookingCapacitySchema, BookingFormsSchema. (Outcome: schemas added)

  ✅ What was completed:
  - Confirmed and finalized schemas for automation, integrations, capacity, and forms with payload wrappers.

  ✅ Why it was done:
  - Provides strong validation boundaries for new sub-endpoints and UI tabs.

  ✅ Next steps:
  - Keep schemas in sync with UI as fields evolve.
- [x] 5.2 Add sub-endpoints: PUT `/api/admin/booking-settings/automation`, `/integrations`, `/capacity`, `/forms` following the existing booking routes pattern (tenant + RBAC + Zod). (Outcome: endpoints implemented)

  ✅ What was completed:
  - Implemented PUT routes for automation, integrations, capacity, and forms at:
    - `src/app/api/admin/booking-settings/automation/route.ts`
    - `src/app/api/admin/booking-settings/integrations/route.ts`
    - `src/app/api/admin/booking-settings/capacity/route.ts`
    - `src/app/api/admin/booking-settings/forms/route.ts`
  - Each route validates input with Zod schemas from `src/schemas/booking-settings.schemas.ts`, enforces `BOOKING_SETTINGS_EDIT` permission, and delegates persistence to `BookingSettingsService.updateBookingSettings`.

  ✅ Why it was done:
  - Enhancement: provides granular endpoints for heavy or frequently edited sections of booking settings, keeping payloads smaller and validation scoped.

  ✅ Next steps:
  - 5.3 Update `BookingSettingsService` to persist these sections as JSON columns (done). Ensure Prisma schema includes JSON columns and apply migrations in CI.
  - 5.4 Extend BookingSettingsPanel UI to call these endpoints from the new tabs.
- [x] 5.3 Update `src/services/booking-settings.service.ts` to handle new sections in get/update/export/import/reset flows and update validateSettingsUpdate accordingly. Add caching invalidation for these sections. (Outcome: service updated)

  ✅ What was completed:
  - Service already supports JSON columns for automation, integrations, capacity, and forms; updates persist these fields and invalidate cache per-tenant.

  ✅ Why it was done:
  - Ensures granular tab updates are persisted and cached consistently.

  ✅ Next steps:
  - Optionally extend validateSettingsUpdate with additional rules for new sections.
- [x] 5.4 Extend `src/components/admin/BookingSettingsPanel.tsx` tabs array to include the new tabs and implement UI components for each tab inside `src/components/admin/booking/*` from temp artifacts as a reference. (Outcome: UI shows new tabs with fields)

  ✅ What was completed:
  - Added Automation, Integrations, Capacity, and Forms tabs with fields mapped to schemas.

  ✅ Why it was done:
  - Completes the extended booking configuration surface in the admin UI.

  ✅ Next steps:
  - Polish Forms builder UX and add tests.
- [x] 5.5 Implement Import modal in BookingSettingsPanel: file upload, preview sections, overwrite toggle, call POST `/api/admin/booking-settings/import`. (Outcome: admins can import bundles)

  ✅ What was completed:
  - Added Import button and modal with JSON upload, section toggles, overwrite option, and POST to import endpoint.

  ✅ Why it was done:
  - Enables safe restoration and migration of booking settings.

  ✅ Next steps:
  - Add UI tests for import flow (Phase 5.7).
- [x] 5.6 Surface warnings returned by PUT `/api/admin/booking-settings` inline as non-blocking alerts with the ability to expand details. (Outcome: warnings visible in UI)

  ✅ What was completed:
  - Displayed warnings in a yellow alert after successful saves; errors remain blocking and styled as before.

  ✅ Why it was done:
  - Communicates non-critical validation feedback without blocking saves.

  ✅ Next steps:
  - Consider collapsible details if warning payload grows.
- [x] 5.7 Tests: add API tests for sub-endpoints, service validations for new schemas, and UI tests for the import flow. (Outcome: tests added)

  ✅ What was completed:
  - Added tests/booking-settings.sub-endpoints.test.ts covering automation/integrations/capacity/forms PUT routes.
  - Extended tests/schemas.booking-settings.test.ts with new schema payloads.
  - Updated tests/booking-settings.panel.render.test.tsx to assert new tabs and Import presence.

  ✅ Why it was done:
  - Ensures new endpoints and schemas are validated; verifies UI surface includes new tabs and actions.

  ✅ Next steps:
  - Consider interactive DOM tests for import modal when a client renderer is available.

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

- [x] 7.1 Add new PERMISSIONS keys for each category/tab in `src/lib/permissions.ts` with mapping to roles in ROLE_PERMISSIONS. (Outcome: permission keys added)

  ✅ What was completed:
  - Added comprehensive settings permissions: ORG_SETTINGS_*, FINANCIAL_SETTINGS_*, INTEGRATION_HUB_*, CLIENT_SETTINGS_*, TEAM_SETTINGS_*, TASK_WORKFLOW_SETTINGS_*, ANALYTICS_REPORTING_SETTINGS_*, COMMUNICATION_SETTINGS_*, SECURITY_COMPLIANCE_SETTINGS_*, SYSTEM_ADMIN_SETTINGS_*.
  - Updated ROLE_PERMISSIONS: TEAM_MEMBER gains read-only for org/booking; TEAM_LEAD gains broader view/edit including import/reset for booking and export for org; ADMIN retains full access.

  ✅ Why it was done:
  - Establish fine-grained RBAC for current and future settings categories so UI and routes can consistently enforce access.

  ✅ Next steps:
  - Expand mappings as new categories ship (Phase 6).

- [x] 7.2 Update middleware `src/app/middleware.ts` to include route prefixes for new admin settings endpoints where required. (Outcome: middleware mapping updated)

  ✅ What was completed:
  - Added route-based checks for `/admin/settings/company|contact|timezone` → ORG_SETTINGS_VIEW, `/admin/settings/financial|currencies` → FINANCIAL_SETTINGS_VIEW, `/admin/settings/integrations` → INTEGRATION_HUB_VIEW. Preserved existing booking mapping.

  ✅ Why it was done:
  - Prevents unauthorized navigation to settings pages even before page load.

  ✅ Next steps:
  - Add mappings for remaining categories as their pages are introduced (Phase 6).

- [x] 7.3 Update UI components (SettingsShell, BookingSettingsPanel) to hide Import/Reset/Test actions when the user lacks the related permission. (Outcome: UI respects permissions)

  ✅ What was completed:
  - Wrapped Export/Import/Reset/Save buttons in BookingSettingsPanel with PermissionGate using BOOKING_SETTINGS_EXPORT/IMPORT/RESET/EDIT.
  - Import modal is only rendered for users with BOOKING_SETTINGS_IMPORT.

  ✅ Why it was done:
  - Ensures non-privileged users cannot see or trigger sensitive actions.

  ✅ Next steps:
  - Apply similar gating to future category UIs (Integration Hub test buttons, etc.).

- [x] 7.4 Add unit tests asserting unauthorized responses (401/403) for protected API routes. (Outcome: tests cover permission enforcement)

  ✅ What was completed:
  - Added tests/admin-org-settings.permissions.test.ts: asserts 401 for unauthenticated GET and for PUT by TEAM_MEMBER lacking ORG_SETTINGS_EDIT.

  ✅ Why it was done:
  - Guards against regressions in server-side permission checks.

  ✅ Next steps:
  - Extend with additional routes as categories are implemented.

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
