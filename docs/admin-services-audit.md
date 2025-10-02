Admin Services Settings — Audit & Implementation Notes

Purpose

This document documents the Services & Service-Requests settings implementation, server APIs, persistence, integration points, and operational notes for maintainers and reviewers.

Files of interest

- Settings schema: src/schemas/settings/services.ts
- Settings service (persistence + normalization + cache): src/services/services-settings.service.ts
- API route (GET + POST): src/app/api/admin/settings/services/route.ts
- Modal UI: src/components/admin/settings/ServicesSettingsModal.tsx
- Dedicated settings page: src/app/admin/settings/services/page.tsx
- Flat persistence file (file-backed fallback): data/admin-settings-services.json
- Services business logic (clone enforcement, bulk clone): src/services/services.service.ts
- Clone route (single-service clone): src/app/api/admin/services/[id]/clone/route.ts
- Service-requests integration (auto-assign & convert-to-booking): src/lib/service-requests/assignment.ts and src/app/api/admin/service-requests/[id]/convert-to-booking/route.ts

API: contract and examples

GET /api/admin/settings/services
- Permissions: requires authenticated user and hasPermission(role, PERMISSIONS.SERVICES_VIEW)
- Behavior: Returns a flattened legacy-compatible JSON object (for UI compatibility) with keys such as defaultCategory/defaultCurrency/allowCloning/priceRounding and serviceRequests.* flags. Also returns notification templates and newly added fields like categories/pricingRules/currencyOverrides/versioningEnabled/versionRetention.
- Example response (200):

  {
    "ok": true,
    "data": {
      "defaultCategory": "General",
      "defaultCurrency": "USD",
      "allowCloning": true,
      "featuredToggleEnabled": true,
      "priceRounding": 2,
      "categories": ["Tax","Accounting"],
      "pricingRules": [{ "currency": "AUD", "multiplier": 1.3 }],
      "currencyOverrides": ["AUD","EUR"],
      "versioningEnabled": true,
      "versionRetention": 5,
      "defaultRequestStatus": "SUBMITTED",
      "autoAssign": true,
      "autoAssignStrategy": "round_robin",
      "allowConvertToBooking": true,
      "defaultBookingType": "STANDARD",
      "notification": { "templates": { "serviceRequests": { "created": "...", "assigned": "..." } } }
    }
  }

POST /api/admin/settings/services
- Permissions: requires authenticated user and hasPermission(role, PERMISSIONS.SERVICES_EDIT)
- Accepts either a legacy flat shape or a nested shape. The UI posts the nested shape under `services` / `serviceRequests` / `notification` groups. Zod validation is applied via src/schemas/settings/services.ts.
- Example nested payload (preferred):

  {
    "services": {
      "defaultCategory": "General",
      "defaultCurrency": "USD",
      "allowCloning": false,
      "categories": ["Tax","Advisory"],
      "pricingRules": [{ "currency": "EUR", "multiplier": 0.9 }],
      "currencyOverrides": ["EUR"],
      "versioningEnabled": true,
      "versionRetention": 3
    },
    "serviceRequests": {
      "defaultRequestStatus": "SUBMITTED",
      "autoAssign": true,
      "autoAssignStrategy": "round_robin",
      "allowConvertToBooking": false,
      "defaultBookingType": "STANDARD"
    },
    "notification": {
      "templates": {
        "serviceRequests": { "created": "{{name}} created", "assigned": "Assigned to {{assignee}}" }
      }
    }
  }

- On success the API persists the settings (file-backed in data/admin-settings-services.json) and returns the flattened shape via the same GET-compatible keys.

Persistence & normalization

- Implementation currently persists a nested JSON file at data/admin-settings-services.json for quick delivery and test stability. The services-settings.service handles normalization for legacy flat shapes and typed parsing using Zod.
- Cache: in-memory CacheService is used with TTL (120s). The service writes update and refreshes cache immediately on save.

Integration points

- Clone enforcement: clone endpoints check servicesSettingsService.get(tenantId) and respect services.allowCloning; cloning is blocked (HTTP 403) when disabled. Implemented in:
  - src/app/api/admin/services/[id]/clone/route.ts
  - src/services/services.service.ts (bulk clone checks)

- Auto-assign & conversion: service-requests assignment logic and convert-to-booking route read settings (serviceRequests.autoAssign, autoAssignStrategy, allowConvertToBooking) to alter behavior at runtime.

- Pricing & currency rules: pricingRules and currencyOverrides are available to be used by pricing engine / service creation flows (TODO: wire into src/lib/booking/pricing.ts and service editor forms).

Testing & QA

- Unit tests: tests/admin-services-settings.route.test.ts and tests/admin-services-settings.permissions.test.ts cover GET/POST and RBAC.
- E2E: new Playwright test added: e2e/tests/admin-services-settings.spec.ts — verifies toggling allowCloning via UI blocks/unblocks clone endpoints.

Operational notes

- When migrating to DB-backed settings, update servicesSettingsService to persist via Prisma and adjust tests to mock DB where necessary.
- Consider emitting a revalidation event or using Next.js revalidation on save if these settings affect statically rendered pages.
- Ensure proper RBAC mapping in ROLE_PERMISSIONS to avoid accidental exposure of edit controls.

Contact

If you need schema evolution guidance or a migration plan from file to DB-backed settings, I can draft migration steps and tests.
