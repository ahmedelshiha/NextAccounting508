# Services & Service-Requests Settings - Implementation TODO

Progress log (most recent first)

### Completed: Service Requests notification templates (task 5.2)
- ✅ What was completed
  - Added notification templates UI to `src/components/admin/settings/ServicesSettingsModal.tsx` with editable templates for: request created, assigned, and status changed. Templates are editable via Textarea controls in the Service Requests tab.
  - Extended `src/schemas/settings/services.ts` and `src/services/services-settings.service.ts` to support persisting `notification.templates.serviceRequests` alongside existing settings. The settings API (POST /api/admin/settings/services) now accepts and persists the nested notification templates.
- ✅ Why it was done
  - Provide administrators the ability to customize notification content for Service Request lifecycle events and persist these templates for downstream notification senders.
- ✅ Next steps
  - Wire notification sender (notification service) to consume these templates when sending emails/SMS; add tests for template rendering and edge cases (missing variables).

### Completed: Categories & pricing rules UI and persistence (task 6.1)
- ✅ What was completed
  - Implemented categories (CRUD) and pricing rules (per-currency multiplier) UI inside `src/components/admin/settings/ServicesSettingsModal.tsx` under the Services tab.
  - Extended `src/schemas/settings/services.ts` to include `services.categories` and `services.pricingRules` and updated `src/services/services-settings.service.ts` to persist and return these values.
- ✅ Why it was done
  - Allow administrators to manage service categories and default pricing adjustments per currency directly from the Settings modal, persisted to the settings store for use by service creation and pricing engines.
- ✅ Next steps
  - Integrate pricing overrides into the pricing engine (`src/lib/booking/pricing.ts` or related) and add unit tests for pricing rule application.


### Completed: Enforced UI permissions for Services settings (task 7.2)
- ✅ What was completed
  - Added canViewServicesSettings/canEditServicesSettings to src/lib/use-permissions.ts and gated the Save button on /admin/settings/services by SERVICES_EDIT.
- ✅ Why it was done
  - Ensure the UI respects RBAC, preventing unauthorized edits while still allowing read access when permitted.
- ✅ Next steps
  - Use the flags in ServicesSettingsModal and Services list page to conditionally show the Settings action.

### Completed: Immediate cache update on save (task 8.1)
- ✅ What was completed
  - Verified servicesSettingsService.save updates the cache with merged settings and GET reads from cache; changes are reflected immediately (TTL 120s still applies for other readers).
- ✅ Why it was done
  - Meet acceptance that changes are visible immediately or within TTL without stale reads.
- ✅ Next steps
  - Consider emitting revalidation/invalidation events if ISR is introduced later.

### Completed: Unit tests for settings API in place (task 8.2)
- ✅ What was completed
  - Confirmed tests/admin-services-settings.route.test.ts and tests/admin-services-settings.permissions.test.ts cover GET/POST, defaults, persistence, validation, and RBAC.
- ✅ Why it was done
  - Ensure regression protection and correctness for the API contract.
- ✅ Next steps
  - Add edge-case tests (invalid enum values, missing body) if needed.

### Completed: Aligned auto-assign candidate email typing
- ✅ What was completed
  - Updated `CandidateWorkload` in `src/lib/service-requests/assignment.ts` to allow `email` values that may be `null`, matching Prisma team member records and resolving the build failure.
- ✅ Why it was done
  - The auto-assign flow selects active team members whose email can be missing; enforcing a strict string type caused TypeScript errors during builds.
- ✅ Next steps
  - Audit other team member consumers to ensure nullable email is handled gracefully (e.g., display fallbacks in notifications and UI badges).

### Completed: Marked services settings page as client component
- ✅ What was completed
  - Added the `'use client'` directive to `src/app/admin/settings/services/page.tsx` so its React state and effects execute without build-time errors.
- ✅ Why it was done
  - The page relied on `useState` and `useEffect`, causing Turbopack to fail because it was treated as a server component. Making it a client component restores the admin settings UI.
- ✅ Next steps
  - Confirm no other settings pages use client hooks without the directive; consider extracting shared client logic into reusable hooks for consistency.

### Completed: Fixed TS build errors in services settings service
- ✅ What was completed
  - Corrected types in `src/services/services-settings.service.ts` to allow nested partial updates via `ServicesSettingsUpdates` and adjusted merge logic; resolved TS2322 on `defaultCategory`/`defaultRequestStatus`.
- ✅ Why it was done
  - To restore build, ensure safe schema-validated merges, and support legacy normalization without requiring all fields.
- ✅ Next steps
  - Run tests (`pnpm test`), verify admin settings GET/POST still pass; consider DB-backed persistence and add tests for partial updates.

### Completed: Designed Services settings schema (task 3.1)
- ✅ What was completed
  - Added `src/schemas/settings/services.ts` defining `ServicesSettingsSchema`, enumerations sourced from Prisma, and defaults for both services and service request workflows.
- ✅ Why it was done
  - New implementation establishing a single source of truth for settings validation across API and UI layers, ensuring parity with persisted enums and defaults before backend wiring.
- ✅ Next steps
  - Update the services settings API to consume this schema for GET/POST validation (tasks 3.2 & 3.3).
  - Wire service request assignment logic to honor schema-backed settings values (task 3.4).

### Completed: Add registry entries (services, service-requests, currencies, contact, timezone)
- ✅ What was completed
  - Added explicit entries to `src/lib/settings/registry.ts` for: Services (/admin/settings/services), Service Requests (/admin/settings/service-requests), Currency Management (/admin/settings/currencies), Contact (/admin/settings/contact), and Timezone & Localization (/admin/settings/timezone).
- ✅ Why it was done
  - Enhancement of existing settings registry so pages appear in main Settings navigation and Quick Links. This was an enhancement (existing registry extended), not a refactor.
- ✅ Next steps
  - Ensure permissions for these entries are correct for target roles (see task 7.1).
  - If desired, remove any duplicate registry keys or consolidate naming (e.g., `serviceManagement` vs `services`).

---

### Completed: Created Services Settings modal component
- ✅ What was completed
  - Implemented `src/components/admin/settings/ServicesSettingsModal.tsx` (client-side modal) with tabs for Services and Service Requests and all primary controls (defaultCategory, defaultCurrency, allowCloning, featuredToggleEnabled, priceRounding, defaultRequestStatus, autoAssign, autoAssignStrategy, allowConvertToBooking, defaultBookingType).
- ✅ Why it was done
  - New implementation to provide a fast, permission-gated UI for editing services-related settings without immediate backend persistence. Enables product validation and iteration before adding server persistence.
- ✅ Next steps
  - Implement persistent GET/POST API endpoints (tasks 3.2 and 3.3) and wire the modal Save button to POST (task 4.2).
  - Add inline validation and UX microcopy per task 4.4/5.1.

---

### Completed: Wired Settings CTA into Services admin page
- ✅ What was completed
  - Added a "Settings" secondary action to `src/app/admin/services/page.tsx` which opens the Services Settings modal. Added import and modal rendering logic; preserved permission gating for Services view.
- ✅ Why it was done
  - Enhancement to provide discoverable access to the settings directly from the Services admin page (improves admin workflow and discoverability). This changed existing page but re-used components (enhancement).
- ✅ Next steps
  - Ensure the Settings button is visible only to authorized roles (verify permission flag and UI conditionals, task 7.2).
  - Add a settings page alternative for full-page editing (task 4.3).

---

### Completed: Service Settings API endpoints (GET + POST)
- ✅ What was completed
  - Added server routes at `src/app/api/admin/settings/services/route.ts` implementing:
    - GET /api/admin/settings/services — returns persisted services settings or sensible defaults
    - POST /api/admin/settings/services — validates payload and persists settings to `data/admin-settings-services.json`
  - Validation uses zod schema; RBAC enforced via `getServerSession(authOptions)` and `hasPermission(role, PERMISSIONS.SERVICES_VIEW)`.
- ✅ Why it was done
  - New implementation to provide immediate, secure server-side persistence for Services & Service-Requests settings used by the admin modal. Implemented as a minimal-backed solution (file-based) to avoid DB migrations while delivering functionality quickly.
- ✅ Next steps
  - Replace file-based persistence with the proper settings service (`src/services/...-settings.service.ts`) and persist to the database (Prisma) or centralized settings store.
  - Add unit tests for the new route (tests for GET/POST, validation, RBAC).

### Completed: Dedicated Services Settings page
- ✅ What was completed
  - Implemented `/admin/settings/services/page.tsx` using `SettingsShell` with tabs for Services and Service Requests, reusing existing form fields, wired to GET/POST API with toasts.
- ✅ Why it was done
  - Provides a full-page management experience in addition to the modal, aligning with Settings navigation and enabling future expansion (Workflows/Notifications).
- ✅ Next steps
  - Add client-side validation messages for each field; consider export/import actions once endpoints exist.

### Completed: Tests for RBAC and validation; flat file persistence
- ✅ What was completed
  - Persisted settings in flat JSON shape for legacy compatibility and existing tests; added tests for POST RBAC (403 without SERVICES_EDIT) and invalid payload (400).
- ✅ Why it was done
  - Aligns with current test expectations and ensures RBAC/validation behavior is verified.
- ✅ Next steps
  - Migrate persistence to DB later; when switching to nested persistence, update tests accordingly.

---

### Completed: Unit tests for Service Settings API
- ✅ What was completed
  - Added tests at `tests/admin-services-settings.route.test.ts` that:
    - Verify GET returns defaults when no persisted file exists.
    - Verify POST persists settings (file) and GET returns persisted values.
  - Tests clean up the file before each run to keep environment deterministic.
- ✅ Why it was done
  - New tests (enhancement) to ensure GET/POST behave correctly and to provide regression protection while the persistence approach is later migrated to a database-backed service.
- ✅ Next steps
  - Add RBAC/validation error tests (e.g., invalid payload -> 400, unauthorized -> 401) and include tests for edge cases.
  - Migrate persistence to `src/services/*` and update tests to mock DB instead of file system.

---

### Completed: Redirect for Service Requests settings route
- ✅ What was completed
  - Created `src/app/admin/settings/service-requests/page.tsx` which redirects to `/admin/service-requests` to avoid 404 and keep navigation stable while a full settings page is implemented.
- ✅ Why it was done
  - Small new implementation to maintain link integrity while development of a dedicated settings page is pending. Prevents dead links from the Settings navigation.
- ✅ Next steps
  - Replace redirect with a real settings page when implementing task 4.3.

---

This file below retains the full, ordered TODO list for remaining work (unchanged except for the progress entries above).

---

## 1. Discovery & Audit (prerequisite)
- [x] 1.1 Audit existing services UI and APIs: review `src/components/admin/services/*` and `src/app/api/admin/services/*` — confirm current endpoints, payload shapes, and permissions. (Acceptance: documented list of endpoints, request/response JSON shapes, and location of UI components.)
- [x] 1.2 Audit existing service-requests UI and APIs: review `src/components/admin/service-requests/*` and `src/app/api/admin/service-requests/*`. (Acceptance: documented list of SR endpoints and behaviors: assign, status changes, convert-to-booking.)

## 2. Registry & Navigation (low-risk, small)
- [x] 2.1 Ensure settings registry includes Services and Service Requests entries (`src/lib/settings/registry.ts`). (Acceptance: both entries present and appear in Settings nav for roles with required permissions.)

## 3. Backend: Settings storage & API (must be done before UI saves)
- [x] 3.1 Design settings schema for Services & Service-Requests (db or settings service). Define keys, types and defaults:
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

- [x] 3.2 Implement GET /api/admin/settings/services
  - Create route: `src/app/api/admin/settings/services/route.ts` (or reuse `settings.service` patterns).
  - Return current settings JSON or sensible defaults.
  (Acceptance: GET returns 200 + JSON with keys above.)

- [x] 3.3 Implement POST /api/admin/settings/services
  - Persist settings in existing settings store/service (e.g., `src/services/settings.service.ts`) following RBAC checks.
  - Validate payload against schema and return 200 on success.
  (Acceptance: POST persists settings and GET reflects updates.)

- [x] 3.4 Add server-side integration points
  - Wire settings into auto-assign logic (`src/lib/service-requests/assignment.ts`) so autoAssign and strategy are read from settings at runtime.
  - Read allowConvertToBooking flag in `convert-to-booking` handler to allow/deny conversion.
  (Acceptance: behavior changes based on stored settings; unit tests to verify.)

## 4. Frontend: Admin settings UI & modal/page
- [x] 4.1 Create Services Settings modal component (client) at `src/components/admin/settings/ServicesSettingsModal.tsx`. (Done)

- [x] 4.2 Persist modal to call API endpoints
  - Wire modal Save button to POST `/api/admin/settings/services` and show toast. (Acceptance: Changes persist and success message shown.)

- [x] 4.3 Create dedicated settings page (optional but recommended)
  - Implement `/admin/settings/services/page.tsx` that uses `SettingsShell` and the Services settings panels (split into tabs: Services / Service Requests / Workflows / Notifications).
  - Provide link from SettingsNavigation (registry already includes route so nav shows page). (Acceptance: navigating to route loads SettingsShell and panels.)

- [x] 4.4 Improve Services admin page integration
  - Add a Settings button (done) that opens modal/page; ensure permissions gate uses `PERMISSIONS.SERVICES_VIEW`.
  - Add helpful tooltips and explanation text in modal. (Acceptance: Settings button opens modal and user can save.)

## 5. Service Requests settings UI (detailed)
- [x] 5.1 Implement Service Requests tab in settings modal/page
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
- [x] 7.1 Verify permissions for new API routes (settings read/write) using `src/lib/permissions.ts` constants. Add new permission keys if needed (e.g., `SERVICES_SETTINGS_EDIT`) and include in ROLE_PERMISSIONS for ADMIN/TEAM_LEAD where appropriate.
  (Acceptance: only users with correct permissions can POST settings.)

- [x] 7.2 Update `use-permissions` helper flags where helpful (`canManageCurrencies`, `canManageCurrencies` style). (Acceptance: UI conditionally shows settings only to authorized roles.)

## 8. Server-side integration & QA
- [x] 8.1 Ensure settings are cached safely and invalidated when updated (use revalidation events or short TTL).
  (Acceptance: changes are reflected to users within accepted TTL or immediately after update.)

- [x] 8.2 Add unit tests for settings API (GET/POST validation, RBAC) under `tests/`.
  (Acceptance: tests pass locally: `pnpm test`.)

- [x] 8.3 Add integration tests for settings affecting auto-assign and convert-to-booking behaviors.
  (Acceptance: CI tests validate behavioral change under different settings.)

- [ ] 8.4 Add e2e tests (Playwright) that exercise saving settings from the UI and verify downstream changes (e.g., convert-to-booking disabled prevents conversion). (Acceptance: e2e tests added and pass in CI.)

## 9. Documentation & Handoff
- [ ] 9.1 Update docs: `docs/admin-services-audit.md` and `docs/admin-dashboard-spec_mapping.md` to reference new settings pages and API endpoints. (Acceptance: docs updated with route and schema examples.)

- [ ] 9.2 Provide short developer guide describing where settings are stored, how to extend key names, and how to integrate new behavior (auto-assign extension). Add to `Doc/` or `docs/`. (Acceptance: doc added and accepted by engineering reviewer.)

## 10. Final polish & deployment
- [ ] 10.1 UI/UX review: fix spacing, label clarity, keyboard accessibility and ARIA attributes in the settings modal and pages. (Acceptance: passes basic accessibility checks.)
- [ ] 10.2 Release PR: create a clear PR with migration notes, environment variables, and testing notes. (Acceptance: PR opened and reviewed.)

---

If you want I will start implementing the backend GET/POST `/api/admin/settings/services` endpoint and persist settings. Which task should I pick first?
