# Admin → Services Module Audit

Last updated: {{DATE}}

## 1. Overview
- Purpose: Centralize creation, management, analytics, and export of the firm’s service offerings.
- Placement: Admin UI at `src/app/admin/services/page.tsx` with reusable UI in `@/components/admin/services/*` and REST API in `src/app/api/admin/services/*`. Business logic lives in `@/services/services.service.ts`. Shared types/schemas/utils under `@/types/services`, `@/schemas/services`, `@/lib/services/utils`.
- Workflows supported:
  - List, filter, paginate services
  - Create/edit/delete (soft-delete via active=false)
  - Bulk actions (activate/deactivate, feature/unfeature, category update, price update, delete)
  - Export (CSV/JSON)
  - View high-level analytics (counts/averages; placeholder for trends)

How it fits overall:
- Admin: Full CRUD + analytics and exports.
- Portal/Client: Consumes services for bookings and service requests (pricing, availability, selection).
- API: Validates with Zod; uses Prisma to query `Service` model; handles multitenancy via `tenantId`.

## 2. Complete Current Directory Structure
Annotated file tree related to Services.

- src/app/admin/services/
  - page.tsx — Admin Services page (client component): list/filter/paginate; CRUD via API; bulk actions; analytics panel modal for create/edit.

- src/components/admin/services/
  - ServicesHeader.tsx — Header with stats, search, actions; permission-gated buttons via `useServicesPermissions`.
  - ServicesFilters.tsx — Dropdown-based filter controls; emits `ServiceFilters` changes.
  - ServiceCard.tsx — Card view for one service; action buttons (edit/copy/toggle active/featured/delete).
  - ServiceForm.tsx — RHF + Zod form for create/edit; features editor; auto slug generation.
  - BulkActionsPanel.tsx — Applies bulk operations on selected service IDs with client-side validation.
  - ServicesAnalytics.tsx — Summary analytics tiles and simple charts fed by `/api/admin/services/stats`.

- src/app/api/admin/services/
  - route.ts — GET list with filters and demo fallback; POST create (Zod validate; 501 if DB missing).
  - [id]/route.ts — GET one; PATCH update (Zod validate); DELETE soft-delete.
  - bulk/route.ts — POST bulk actions (Zod validate) delegated to service layer.
  - export/route.ts — GET CSV/JSON export; content-disposition for CSV.
  - stats/route.ts — GET aggregated stats.

- src/lib/services/
  - utils.ts — Slug generation; form sanitization; price/duration formatting; filter/sort helpers; bulk-action validator; Prisma-backed slug uniqueness check.

- src/services/
  - services.service.ts — Business service layer: Prisma CRUD, bulk ops, stats, export; cache + notifications hooks.

- src/schemas/services.ts — Zod schemas: ServiceSchema/ServiceUpdateSchema/BulkActionSchema/ServiceFiltersSchema and response shapes.
- src/types/services.ts — TypeScript types for Service, ServiceFormData, filters, stats, analytics, bulk actions.
- prisma/schema.prisma — Service model definition and relations (Bookings, ServiceRequest, AvailabilitySlot).

Related hooks/utilities used:
- src/hooks/useServicesPermissions.ts — Permission derivation from NextAuth session.
- src/hooks/useServicesData.ts — Fetches list + stats with debounce and optional auto-refresh.
- Shared libs frequently integrating services: `@/lib/booking/*` (availability, pricing, conflict detection), `@/lib/audit`, `@/lib/rate-limit`, `@/lib/tenant`.

## 3. Component Architecture Details

Components under `@/components/admin/services`:
- ServicesHeader
  - Props: `{ stats: ServiceStats|null, searchTerm: string, onSearchChange, onRefresh, onExport, onCreateNew, loading }`.
  - Dependencies: `useServicesPermissions`, `@/components/ui/*`, lucide icons.
  - Notes: Reusable across admin dashboards that need similar header pattern; shows analytics button behind permission.

- ServicesFilters
  - Props: `{ filters: ServiceFilters, onFiltersChange, categories: string[], className? }`.
  - Behavior: Maintains no internal state; emits filter updates; shows active filter badges and quick clear.
  - Reusability: Can be reused in list/table contexts that operate on `ServiceFilters`.

- ServiceCard
  - Props: `{ service, isSelected?, onSelect?, onEdit, onDuplicate, onDelete, onToggleActive, onToggleFeatured }`.
  - Dependencies: `useServicesPermissions`, `formatPrice`, `formatDuration`.
  - Notes: Stateless UI; selection checkbox optional.

- ServiceForm
  - Props: `{ initialData?, onSubmit, onCancel, loading?, categories? }`.
  - State: Uses react-hook-form with `ServiceSchema`; dynamic features list editing; auto-generate slug from name for create mode.
  - Notes: Validates strictly via Zod; serializes clean `ServiceFormData` back to caller.

- BulkActionsPanel
  - Props: `{ selectedIds: string[], onClearSelection, onBulkAction, categories: string[], loading? }`.
  - State: Local selected action and value fields; client-side validation via `validateBulkAction`.
  - Notes: Delegates execution to parent; previews effect.

- ServicesAnalytics
  - Props: `{ analytics: ServiceAnalytics|null, loading?, className? }`.
  - Behavior: Skeleton while loading; simple computed summaries.
  - Notes: Purely presentational; expects normalized analytics structure.

Admin Page `@/app/admin/services/page.tsx`:
- Manages local state for list, filters, selection, pagination, analytics modal, and form modal.
- Fetches via `apiFetch` from `/api/admin/services` and `/api/admin/services/stats` (fallback to `/api/admin/analytics`).
- Performs CRUD + bulk operations directly via API; includes client-side filtering and pagination over fetched list.

## 4. Data Flow Architecture

Flow:
- Database (Prisma) ⇄ Service layer (`@/services/services.service.ts`) ⇄ API routes (`/api/admin/services/*`) ⇄ Fetch (`@/lib/api`) ⇄ Hooks/components ⇄ UI.

Where DB queries occur:
- `@/services/services.service.ts` using Prisma models: `service.findMany/findFirst/create/update/updateMany/count/groupBy/aggregate`.
- Utilities occasionally use Prisma (slug uniqueness) in `@/lib/services/utils`.

Validation and error handling:
- Request validation: Zod schemas in `@/schemas/services` applied in API handlers (list filters, create, update, bulk).
- Server-side sanitization: `sanitizeServiceData` enforces constraints, length limits, numeric ranges; `validateSlugUniqueness` ensures uniqueness per tenant.
- Rate limiting: `@/lib/rate-limit` on list/create endpoints (IP-scoped keys).
- Audit logging: `@/lib/audit` on list/create/update/delete/bulk.
- Fallbacks: List endpoint returns demo data if `NETLIFY_DATABASE_URL` missing or schema errors; create returns 501 without DB.

Caching:
- `CacheService` used in service layer for `getServiceById` and stats; `clearCaches` is currently a stub pattern (no real invalidation driver implemented).

Custom hooks related to Services:
- `useServicesPermissions` — Maps session role to booleans (view/create/edit/delete/bulk/export/analytics/featured management).
- `useServicesData` — Debounced filtered list and stats fetcher with optional auto-refresh; maintains `{ services, stats, loading, error, filters }` and `refresh` function.

## 5. API Architecture

Base: `/api/admin/services` (all require authenticated session and role/permission checks via `@/lib/permissions`). Multitenancy via `getTenantFromRequest`.

- GET `/api/admin/services`
  - Query: `ServiceFiltersSchema` (`search, category, featured, status, limit, offset, sortBy, sortOrder`).
  - Response: `{ services, total, page, limit, totalPages }` (see `ServiceListResponseSchema`).
  - Errors: 401/403/429; 500; demo fallback when DB missing or schema errors.

- POST `/api/admin/services`
  - Body: `ServiceSchema` (Zod) then `sanitizeServiceData` + slug uniqueness.
  - Response: `{ service }` with 201; 501 if DB missing; 409 on unique slug violation; 500 otherwise.

- GET `/api/admin/services/[id]`
  - Response: `{ service }` or 404 if not found.

- PATCH `/api/admin/services/[id]`
  - Body: `ServiceUpdateSchema` (partial; includes id in schema) sanitized; slug uniqueness if changed.
  - Response: `{ service }`; 404 if not found.

- DELETE `/api/admin/services/[id]`
  - Behavior: Soft-delete by setting `active=false`.
  - Response: `{ message }`; 404 if not found.

- POST `/api/admin/services/bulk`
  - Body: `BulkActionSchema` with `action` in `['activate','deactivate','feature','unfeature','delete','category','price-update']`.
  - Response: `{ message, result: { updatedCount, errors } }`.

- GET `/api/admin/services/export`
  - Query: `format=csv|json`, `includeInactive=true|false`.
  - Response: CSV stream with content-disposition or JSON body.

- GET `/api/admin/services/stats`
  - Query: `range=30d|...` (currently unused in service layer; cache key fixed to 30d).
  - Response: `ServiceStats & { analytics: ServiceAnalytics }` (analytics lists are placeholders currently empty from DB).

Permissions:
- Enforced per route with `hasPermission(session.user.role, PERMISSIONS.*)`.

## 6. Integration Points

Downstream consumers and shared libs referencing Services:
- Bookings
  - Availability: `@/lib/booking/availability.ts` loads `prisma.service` and `AvailabilitySlot` by `serviceId`.
  - Conflict detection: `@/lib/booking/conflict-detection.ts` validates `service.active`/`bookingEnabled`.
  - Pricing: `@/lib/booking/pricing.ts` reads service to compute price breakdown; promo resolvers dereference `serviceId`.
  - UI: `@/components/booking/BookingWizard.tsx` loads services and threads `serviceId` through steps (TeamMemberSelection/RecurrenceStep/PaymentStep).
- Service Requests
  - API creation/guest endpoints validate `serviceId` and `service.active` in multiple routes under `/api/portal/service-requests/*` and `/api/public/service-requests`.
  - Admin pages for SR creation (`@/app/admin/service-requests/new/page.tsx`) select service by `id` and hydrate selection details.
- Admin Availability
  - `@/components/admin/AvailabilitySlotsManager.tsx` uses `serviceId` to create/manage slots.
- Prisma relations
  - `Service` relates to `Booking`, `ServiceRequest`, and `AvailabilitySlot` (see `prisma/schema.prisma`).

Shared utilities
- `@/types/services` used across UI and service layer.
- `@/schemas/services` used in API, paired with `@/lib/services/utils` sanitization.

## 7. Known Issues & Improvements (Audit Findings)

- Inconsistent DB fallback behavior
  - List endpoint has robust demo fallback (no DB or schema errors). Create returns 501 if DB missing. Other endpoints (`stats`, `export`, `bulk`, `[id]`) return 500 on missing DB; consider consistent 501 + helpful message.

- Client-side filtering/pagination duplication
  - Admin page performs additional client-side filtering and paginates locally after fetching up to 100 items, while API supports server filtering/sorting/pagination. Risk of divergence and heavy payloads for large datasets.

- Mixed validation layers
  - Zod validation (API) + `sanitizeServiceData` (service layer). Some constraints duplicated (lengths, ranges). Centralize to avoid drift.

- Cache invalidation is a stub
  - `clearCaches` composes patterns but performs no real cache delete operations; caching may not reflect updates.

- Analytics placeholders
  - `getServiceStats` returns counts and averages; `analytics` arrays are empty. Admin page fakes shape by normalizing any admin analytics endpoint when stats missing.

- Code duplication
  - Fallback service list duplicated in two places within `GET /api/admin/services` (normal path and error path). Extract to utility.

- Param typing smell
  - `[id]/route.ts` uses `interface Ctx { params: Promise<{ id: string }> }`; typical Next.js App Router uses synchronous `params` object. Not harmful but inconsistent.

- Missing comprehensive tests
  - No targeted tests for Services API, service layer, or components. Hooks like `useServicesData` and permission gating lack coverage.

- Multitenancy edge cases
  - `validateSlugUniqueness` scopes by `tenantId` but does not enforce unique composite `(tenantId, slug)` at DB level (DB has global unique on `slug`). Consider tenant-aware uniqueness if multi-tenant DB is required.

## 8. Recommendations

Architecture & Consistency
- Consolidate validation by driving from Zod schemas and deriving sanitization or vice versa; ensure single source of truth.
- Prefer server-side pagination/filtering exclusively. Update Admin page to depend on API paging (remove client filtering/pagination), or explicitly cap lists.
- Normalize analytics: have `getServiceStats` return a consistent analytics payload and let UI consume it directly (drop fallback to `/api/admin/analytics`).

Caching & Performance
- Implement real cache keys and deletion in `CacheService` (e.g., Redis) and wire into `clearCaches` to invalidate `service:*`, `services-list:*`, and `service-stats:*` after mutations.
- Add ETag/If-None-Match for list endpoints or cache-control for stable filters; consider SWR in Admin page via `useServicesData`.

API Hardening
- Harmonize DB-missing behavior: respond 501 with helpful messages consistently across all services endpoints when DB unavailable; optionally provide demo data for `stats/export` similar to list fallback.
- Add explicit 409 handling for slug conflicts on update as well (not only create), surfaced with user-friendly messages.
- Enforce tenant-scoped unique slug at DB (composite index) if multi-tenant is truly required; or document global uniqueness.

UI/UX
- Replace custom fetch logic in Admin page with `useServicesData` to reduce duplication; wire paging and server filters.
- Add optimistic UI for toggles and bulk actions where safe; show per-item error reporting in bulk operations.
- Extract fallback dataset into a shared client util to keep demo mode consistent.

Testing
- Add unit tests for:
  - `sanitizeServiceData`, `generateSlug`, `validateBulkAction`, `formatPrice/formatDuration`.
  - Service layer CRUD and bulk (with Prisma test DB or mocking).
  - API route handlers (happy/error paths, permissions, DB-missing behavior).
  - Component snapshot/interactions (ServiceForm validation, BulkActionsPanel logic).

Integrations
- Bookings/Service Requests: publish service changes (status/price/category) to downstream consumers via a lightweight event bus or invalidate caches where used (availability/pricing calculators).
- Define a shared DTO for "ServiceLite" used by BookingWizard and SR creation to avoid repeated ad-hoc projections.

Security & DX
- CSV export already escapes quotes; consider prefixing cells with apostrophe if you anticipate CSV injection scenarios in Excel.
- Rate limits: evaluate per-tenant keys in addition to IP.

---

References (aliases)
- UI: `@/app/admin/services/page.tsx`, `@/components/admin/services/*`
- API: `@/app/api/admin/services/*`
- Service layer: `@/services/services.service.ts`
- Schemas/Types: `@/schemas/services`, `@/types/services`
- Utils: `@/lib/services/utils`
- Prisma Model: `prisma/schema.prisma` (Service)
