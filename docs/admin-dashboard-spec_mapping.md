Services Settings — Dashboard Spec Mapping

Purpose

This document maps the Admin Settings UI fields to backend schema keys, describes where each UI control is implemented, and lists API endpoints used by the UI.

Settings page(s)

- Modal UI: src/components/admin/settings/ServicesSettingsModal.tsx
  - Rendered from Services admin list page (src/app/admin/services/page.tsx)
  - Permission-gated via PERMISSIONS.SERVICES_VIEW (read) and SERVICES_EDIT (save)

- Dedicated settings page: src/app/admin/settings/services/page.tsx
  - Uses SettingsShell and the same form fields as the modal; wired to GET/POST /api/admin/settings/services

Field -> Schema mapping

Services tab
- Default Category
  - UI: TextField in ServicesSettingsModal (label "Default Category")
  - Schema: services.defaultCategory (src/schemas/settings/services.ts)

- Default Currency
  - UI: TextField (label "Default Currency")
  - Schema: services.defaultCurrency

- Allow cloning of services
  - UI: Toggle (label "Allow cloning of services")
  - Schema: services.allowCloning
  - Effect: clone endpoints check this setting and may return 403 when false

- Featured toggle on service card
  - UI: Toggle (label "Enable featured toggle on service card")
  - Schema: services.featuredToggleEnabled

- Price rounding (decimals)
  - UI: NumberField
  - Schema: services.priceRounding

- Categories (CRUD)
  - UI: Inline list with Add/Remove in Services tab
  - Schema: services.categories (array of strings)

- Pricing rules (per currency)
  - UI: List of {currency, multiplier} rows
  - Schema: services.pricingRules (array of {currency,multiplier})

- Currency overrides
  - UI: List of 3-letter currency codes
  - Schema: services.currencyOverrides (array of strings)

- Versioning controls
  - UI: Toggle "Enable versioning for services" and NumberField "Version retention"
  - Schema: services.versioningEnabled, services.versionRetention
  - Effect: versioningEnabled/versionRetention are read by future versioning subsystem; cloning behavior respects allowCloning and versioning settings

Service Requests tab
- Default Request Status
  - UI: SelectField
  - Schema: serviceRequests.defaultRequestStatus

- Auto-assign
  - UI: Toggle
  - Schema: serviceRequests.autoAssign

- Auto-assign strategy
  - UI: SelectField
  - Schema: serviceRequests.autoAssignStrategy

- Allow conversion to booking
  - UI: Toggle
  - Schema: serviceRequests.allowConvertToBooking
  - Effect: convert-to-booking route reads this flag to allow/deny conversions

- Default booking type
  - UI: SelectField
  - Schema: serviceRequests.defaultBookingType

Notification templates
- UI: Textareas in Service Requests tab
- Schema: notification.templates.serviceRequests (created/assigned/statusChanged)
- Effect: Notification sender should read these templates when preparing messages (not wired yet; TODO)

API endpoints used by UI

- GET /api/admin/settings/services
  - Returns flattened settings for immediate consumption by UI
  - Server: src/app/api/admin/settings/services/route.ts

- POST /api/admin/settings/services
  - Accepts nested or flat payload and persists via src/services/services-settings.service.ts

- Clone endpoints
  - POST /api/admin/services/:id/clone (src/app/api/admin/services/[id]/clone/route.ts) — guarded by settings.allowCloning
  - Bulk clone via src/services/services.service.ts -> performBulkAction('clone') respects settings

Tests & QA mapping

- Unit tests for settings API: tests/admin-services-settings.route.test.ts and tests/admin-services-settings.permissions.test.ts
- E2E test verifying UI -> API -> behavior: e2e/tests/admin-services-settings.spec.ts

Developer notes

- Schema lives in src/schemas/settings/services.ts — any field additions should update:
  - UI component (modal and page)
  - services-settings.service: coerce/flatten/expand helpers
  - API route validation
  - Tests (unit + e2e)

- Persistence currently file-based (data/admin-settings-services.json). When migrating to DB:
  - Replace writeFile/readFile with Prisma-backed persistence in src/services/services-settings.service.ts
  - Update tests to mock DB or use test DB fixture
  - Ensure cache invalidation and any revalidation hooks are in place

Change log

- v1: Initial settings modal + page + API + schema + service + tests (see docs/services-settings-todo.md for timeline)

Contact

For questions about wiring templates into the notification sender or migrating persistence to Prisma, ask the engineering team or request a migration plan from me.
