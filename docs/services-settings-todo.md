# Services & Service-Requests Settings - Implementation TODO

This file lists all remaining work required to deliver a comprehensive, professional Services and Service-Requests settings experience. Tasks are ordered by logical dependencies so prerequisites appear first. Each task is specific, actionable, and has acceptance criteria.

---

## 1. Discovery & Audit (prerequisite)
- [x] 1.1 Audit existing services UI and APIs: review `src/components/admin/services/*` and `src/app/api/admin/services/*` — confirm current endpoints, payload shapes, and permissions. (Acceptance: documented list of endpoints, request/response JSON shapes, and location of UI components.)
- [x] 1.2 Audit existing service-requests UI and APIs: review `src/components/admin/service-requests/*` and `src/app/api/admin/service-requests/*`. (Acceptance: documented list of SR endpoints and behaviors: assign, status changes, convert-to-booking.)

## 2. Registry & Navigation (low-risk, small)
- [x] 2.1 Ensure settings registry includes Services and Service Requests entries (`src/lib/settings/registry.ts`). (Acceptance: both entries present and appear in Settings nav for roles with required permissions.)

## 3. Backend: Settings storage & API (must be done before UI saves)
- [ ] 3.1 Design settings schema for Services & Service-Requests (db or settings service). Define keys, types and defaults:
    - services.defaultCategory: string
    - services.defaultCurrency: string
    - services.allowCloning: boolean
    - services.featuredToggleEnabled: boolean
    - services.priceRounding: integer
    - serviceRequests.defaultRequestStatus: enum
    - serviceRequests.autoAssign: boolean
    - serviceRequests.autoAssignStrategy: string
    - serviceRequests.allowConvertToBooking: boolean
    - serviceRequests.defaultBookingType: enum
  (Acceptance: JSON schema file added to `src/schemas` or documented in `docs/`.)

- [ ] 3.2 Implement GET /api/admin/settings/services
  - Create route: `src/app/api/admin/settings/services/route.ts` (or reuse `settings.service` patterns).
  - Return current settings JSON or sensible defaults.
  (Acceptance: GET returns 200 + JSON with keys above.)

- [ ] 3.3 Implement POST /api/admin/settings/services
  - Persist settings in existing settings store/service (e.g., `src/services/settings.service.ts`) following RBAC checks.
  - Validate payload against schema and return 200 on success.
  (Acceptance: POST persists settings and GET reflects updates.)

- [ ] 3.4 Add server-side integration points
  - Wire settings into auto-assign logic (`src/lib/service-requests/assignment.ts`) so autoAssign and strategy are read from settings at runtime.
  - Read allowConvertToBooking flag in `convert-to-booking` handler to allow/deny conversion.
  (Acceptance: behavior changes based on stored settings; unit tests to verify.)

## 4. Frontend: Admin settings UI & modal/page
- [x] 4.1 Create Services Settings modal component (client) at `src/components/admin/settings/ServicesSettingsModal.tsx`. (Done)

- [ ] 4.2 Persist modal to call API endpoints
  - Wire modal Save button to POST `/api/admin/settings/services` and show toast. (Acceptance: Changes persist and success message shown.)

- [ ] 4.3 Create dedicated settings page (optional but recommended)
  - Implement `/admin/settings/services/page.tsx` that uses `SettingsShell` and the Services settings panels (split into tabs: Services / Service Requests / Workflows / Notifications).
  - Provide link from SettingsNavigation (registry already includes route so nav shows page). (Acceptance: navigating to route loads SettingsShell and panels.)

- [ ] 4.4 Improve Services admin page integration
  - Add a Settings button (done) that opens modal/page; ensure permissions gate uses `PERMISSIONS.SERVICES_VIEW`.
  - Add helpful tooltips and explanation text in modal. (Acceptance: Settings button opens modal and user can save.)

## 5. Service Requests settings UI (detailed)
- [ ] 5.1 Implement Service Requests tab in settings modal/page
  - Controls required: defaultRequestStatus (select), autoAssign (toggle), autoAssignStrategy (select), allowConvertToBooking (toggle), defaultBookingType (select)
  - Validate input client-side, show inline errors. (Acceptance: inputs validate and POST succeeds.)

- [ ] 5.2 Notifications templates management (separate subtask)
  - Add ability to edit notification templates and toggles for SR lifecycle events (created, assigned, status changed). Save under `notification.templates.serviceRequests.*` settings keys. (Acceptance: saved templates returned by GET and used by notification sender.)

## 6. Services settings UI (detailed)
- [ ] 6.1 Categories & pricing rules
  - Implement UI to add/edit/remove service categories and default pricing rules (overrides per currency). Persist under `services.categories` and `services.pricingRules` keys. (Acceptance: CRUD UI + persisted state.)

- [ ] 6.2 Currency overrides integration
  - Integrate existing currency manager: allow per-service or per-category currency override settings (UI + persistence). (Acceptance: overrides appear in service editor and are used by pricing engine.)

- [ ] 6.3 Cloning and versioning controls
  - Add toggles controlling cloning behavior and version retention policy. (Acceptance: toggles affect Clone API behavior and are enforceable.)

## 7. Permissions & RBAC
- [ ] 7.1 Verify permissions for new API routes (settings read/write) using `src/lib/permissions.ts` constants. Add new permission keys if needed (e.g., `SERVICES_SETTINGS_EDIT`) and include in ROLE_PERMISSIONS for ADMIN/TEAM_LEAD where appropriate.
  (Acceptance: only users with correct permissions can POST settings.)

- [ ] 7.2 Update `use-permissions` helper flags where helpful (`canManageCurrencies`, `canManageCurrencies` style). (Acceptance: UI conditionally shows settings only to authorized roles.)

## 8. Server-side integration & QA
- [ ] 8.1 Ensure settings are cached safely and invalidated when updated (use revalidation events or short TTL).
  (Acceptance: changes are reflected to users within accepted TTL or immediately after update.)

- [ ] 8.2 Add unit tests for settings API (GET/POST validation, RBAC) under `tests/`.
  (Acceptance: tests pass locally: `pnpm test`.)

- [ ] 8.3 Add integration tests for settings affecting auto-assign and convert-to-booking behaviors.
  (Acceptance: CI tests validate behavioral change under different settings.)

- [ ] 8.4 Add e2e tests (Playwright) that exercise saving settings from the UI and verify downstream changes (e.g., convert-to-booking disabled prevents conversion). (Acceptance: e2e tests added and pass in CI.)

## 9. Documentation & Handoff
- [ ] 9.1 Update docs: `docs/admin-services-audit.md` and `docs/admin-dashboard-spec_mapping.md` to reference new settings pages and API endpoints. (Acceptance: docs updated with route and schema examples.)

- [ ] 9.2 Provide short developer guide describing where settings are stored, how to extend key names, and how to integrate new behavior (auto-assign extension). Add to `Doc/` or `docs/`. (Acceptance: doc added and accepted by engineering reviewer.)

## 10. Final polish & deployment
- [ ] 10.1 UI/UX review: fix spacing, label clarity, keyboard accessibility and ARIA attributes in the settings modal and pages. (Acceptance: passes basic accessibility checks.)
- [ ] 10.2 Release PR: create a clear PR with migration notes, environment variables, and testing notes. (Acceptance: PR opened and reviewed.)

---

If you want I will start with the highest-priority backend task: implement GET/POST `/api/admin/settings/services` and wire persistence. Which task should I pick first?
