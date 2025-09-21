# Admin → Services Module Audit

Updated: 2025-09-21

## Overview
- Purpose: Provide an administrative interface to list, create, update, soft-delete, feature, and bulk manage service offerings.
- Placement: Admin UI at `/admin/services` (Next.js App Router page component) backed by API routes. Exposed public endpoints for consumer/portal use.
- Workflows today:
  - List/filter/search services (active/inactive/featured/category) with lightweight analytics visualizations.
  - Create a new service; edit fields (name, descriptions, price, duration, category, featured, active); soft-delete (active=false).
  - Bulk actions: activate/deactivate, feature/unfeature, delete.
  - Currency “mass convert” helper (preview via currencies API, apply via multiple PUTs).

## Complete Current Directory Structure

- src/app/admin/services/
  - page.tsx — Admin page component (list, analytics, CRUD UI, bulk ops, currency converter). Role: page (UI controller, view, and interaction logic).
- src/app/api/admin/services/
  - route.ts — Admin-only listing endpoint (GET). Role: API (list for admin grid, supports filters/search/tenant scoping).
- src/components/admin/services/ — Not Found
- src/lib/services/ — Not Found

Related (used by the module and part of the data plane)
- src/app/api/services/route.ts — Public services collection API (GET list with fallbacks; POST create). Role: API.
- src/app/api/services/[slug]/route.ts — Public service item API (GET by slug; PUT update; DELETE soft delete). Role: API.
- Shared UI used by the page (not services-specific):
  - @/components/ui/{card, button, input, textarea, badge}
  - lucide-react icons, sonner toast
- Shared libs:
  - @/lib/api (apiFetch helper)
  - @/lib/tenant (tenantFilter, getTenantFromRequest)
  - @/lib/auth, @/lib/permissions (admin API usage)
  - @/lib/prisma (DB access)

## Component Architecture Details

Admin Page: src/app/admin/services/page.tsx
- State:
  - services: Service[]; loading flags; analytics state (range, data, loading)
  - View state: viewMode, showInactive, filters (search, featured, category)
  - Selection: selectedIds (Set), bulkAction
  - Create/Edit forms: inputs for all service fields; selected Service for edit
  - Currency converter UI state: fromCurrency, toCurrency, conversionRate, previewCount, dialog toggle
- Effects:
  - Initial load() of admin services list `/api/admin/services`
  - Initial loadAnalytics() `/api/admin/analytics?range=...`
  - Auto-generate slug from name
- Actions (internal functions):
  - load, loadAnalytics: fetch, normalize response, set state
  - createService: POST to `/api/services`
  - selectService: populate edit form from selected record
  - saveEdits: PUT `/api/services/[slug]`
  - deleteService: DELETE `/api/services/[slug]` (soft delete via active=false)
  - toggleActive: PUT `/api/services/[slug]` with active toggle
  - duplicateService: POST `/api/services` with copied fields and new slug
  - applyBulk: executes delete/feature/activate operations via multiple calls
  - previewConversion: calls `/api/currencies/convert` to compute rate and preview count
  - applyConversion: PUT `/api/services/[slug]` for each priced service
- Dependencies:
  - apiFetch (@/lib/api) with built-in retry/timeout behavior
  - Analytics uses `/api/admin/analytics` response fields (dailyBookings, revenueByService, topServices, avgLeadTimeDays)
- Reusability: This page is admin-specific; chart helpers (LineAreaChart, HBarChart, PieDonutChart) are inline and not exported; could be refactored into reusable components.

## Data Flow Architecture
- UI → API:
  - Listing: GET `/api/admin/services` (admin-only; supports search/featured/active and tenant filter)
  - Create/Update/Delete: calls public endpoints `/api/services` and `/api/services/[slug]`
  - Analytics: GET `/api/admin/analytics` (shared analytics API)
  - Currency: GET `/api/currencies/convert` preview
- API → DB:
  - Admin listing: @/app/api/admin/services/route.ts uses @/lib/prisma.service.findMany
  - Public services collection/item: @/app/api/services/* uses @/lib/prisma (findMany, create, update)
- Validation & error handling:
  - UI: basic field checks; uses toast to display errors; no schema validation on client
  - API (public collection): minimal validation for required fields on POST; no zod; returns 400/500
  - API (public [slug]): parses payload and conditionally sets fields; no auth/permission guard
  - Admin list API: permission check via @/lib/permissions.hasPermission(..., PERMISSIONS.TEAM_VIEW)
- Caching:
  - Public GET by slug adds cache-control header; others are dynamic

### Custom Hooks
- None dedicated to Services. Admin page uses inline effects and functions.
- Shared helper: @/lib/api(apiFetch) centralizes retries, timeouts, and relative vs absolute base URL.

## API Architecture
- @/app/api/admin/services/route.ts
  - GET /api/admin/services
    - Auth: requires session user with PERMISSIONS.TEAM_VIEW (surprising choice; see issues)
    - Query params: search, featured, active; multi-tenancy via @/lib/tenant
    - Response: Service[]; in no-DB mode returns fallback list (active, featured annotated)
    - Errors: 401 Unauthorized; 500 on failure
  - Missing: POST/PUT/DELETE endpoints under /api/admin/services for explicit admin CRUD

- @/app/api/services/route.ts (public)
  - GET /api/services
    - No auth; returns active services only; in no-DB mode returns a fallback list
    - If DB query returns zero, returns the same fallback list
  - POST /api/services
    - No auth guard; creates a service; basic required fields check (name, slug, description)
    - No zod schema; minimal parsing of numeric fields

- @/app/api/services/[slug]/route.ts (public)
  - GET /api/services/[slug]
    - No auth; returns active service by slug; 404/500 on not found/failure; cache-control header added
  - PUT /api/services/[slug]
    - No auth guard (comment says admin only); updates fields; soft conversion of numeric fields
  - DELETE /api/services/[slug]
    - No auth guard; soft delete via active=false

## Integration Points
- Bookings/Portal
  - Admin bulk price conversion and status toggles affect portal availability and pricing indirectly (downstream pricing resolvers reference service.duration/price).
  - Public services endpoints are consumed in many places:
    - @/components/home/services-section.tsx (marketing cards)
    - @/app/admin/{bookings, service-requests}/new/pages (lists available services)
    - @/components/booking/BookingWizard.tsx (portal booking flow loads `/api/services`)
- Analytics
  - Uses `/api/admin/analytics` to render trends and totals in the services page.
- Multi-tenancy
  - Listing endpoints leverage @/lib/tenant (getTenantFromRequest, tenantFilter); create/update do not attach tenant explicitly via admin endpoints (public POST optionally sets tenant in collection route based on request — see code path). Admin UI does not set tenant.
- Currencies
  - Uses `/api/currencies/convert` preview; applies converted prices via multiple PUTs to `/api/services/[slug]`.

## Known Issues & Improvements (Audit Findings)
1. Security gaps on public endpoints
   - POST /api/services and PUT/DELETE /api/services/[slug] perform administrative mutations without any auth/permission checks. The Admin UI relies on these public endpoints for all mutations.
   - Risk: unauthenticated clients could create/update/delete services if routes are exposed.
2. Permission mismatch on admin list
   - /api/admin/services GET requires PERMISSIONS.TEAM_VIEW, which does not semantically match “services.manage” capability. Consider a dedicated SERVICES_* permission set.
3. Missing dedicated admin CRUD endpoints
   - No /api/admin/services POST/PUT/DELETE; public endpoints are overloaded for admin operations.
4. Absent schema validation
   - No zod or server-side schema for POST/PUT payloads; potential type coercion issues.
5. Inconsistent tenant handling
   - Admin UI does not set tenant; public POST path conditionally attaches tenant via @/lib/tenant in collection API, but [slug] routes don’t guard tenant or enforce scoping.
6. Inline chart components and complex page
   - Chart helpers are inline; page.tsx combines analytics, list, edit, bulk ops. High cognitive load; hard to test.
7. Tests
   - No unit/integration tests found for services APIs or Admin UI.
8. Error handling and UX
   - Bulk ops fire many requests without transactional feedback; failures partially update state; no retry/undo.
9. Caching strategy
   - Only GET by slug has cache headers; list endpoints are fully dynamic. Consider SWR or tag-based revalidation strategy.

## Recommendations
1. Introduce explicit Services permissions
   - Add to @/lib/permissions: SERVICES_VIEW, SERVICES_MANAGE, SERVICES_WRITE (as needed);
   - Map ADMIN/TEAM_LEAD appropriately. Update Admin endpoints to use these.
2. Lock down mutations
   - Move create/update/delete to /api/admin/services and enforce session + permission checks.
   - Keep public GET endpoints read-only for portal/marketing.
3. Add server-side schema validation
   - Define zod schemas for ServiceCreate/ServiceUpdate; validate payloads and coerce numbers safely; return consistent error shapes (@/lib/api-response helpers if available).
4. Tenant safety
   - On admin CRUD, always set tenantId using getTenantFromRequest; enforce tenantFilter on updates/deletes; add compound unique constraints if needed (tenantId+slug).
5. Refactor Admin page
   - Split into subcomponents: ServicesToolbar, ServicesGrid, ServicesTable, ServiceForm, CurrencyConverterModal, AnalyticsPanel.
   - Consider hooks: useServicesList, useServiceMutations, useCurrencyConversion, useServicesAnalytics to encapsulate side-effects and API contracts.
6. Create admin services API surface
   - /api/admin/services: GET (list), POST (create)
   - /api/admin/services/[id|slug]: GET (detail), PUT (update), DELETE (soft-delete)
   - Update Admin UI to call only admin endpoints.
7. Add tests
   - API route tests (auth guard, schema validation, tenant scoping, CRUD); UI tests for create/edit/bulk flows.
8. Improve analytics data contract
   - Provide typed responses and consistent keys for charts; document contract in a types module.
9. Performance & UX
   - Debounce search; show optimistic UI on toggle/feature; batch bulk requests server-side.
10. Documentation
   - Add README in src/app/admin/services/ with data flow diagram, endpoint references, and extension points.

## Appendix: Current Endpoints Summary
- Admin
  - GET @/app/api/admin/services/route.ts → /api/admin/services
- Public
  - GET @/app/api/services/route.ts → /api/services
  - POST @/app/api/services/route.ts → /api/services (no auth; risky)
  - GET @/app/api/services/[slug]/route.ts → /api/services/[slug]
  - PUT @/app/api/services/[slug]/route.ts → /api/services/[slug] (no auth; risky)
  - DELETE @/app/api/services/[slug]/route.ts → /api/services/[slug] (no auth; risky)
