# Admin → Services Module Audit

Last updated: 2025-09-22

## 1. Overview
- Purpose: Manage the firm’s service catalog (create, edit, list, filter/sort, bulk-edit, export) and expose service analytics that inform pricing and portfolio decisions.
- Placement within the platform:
  - Admin UI: `@/app/admin/services/page.tsx` orchestrates the management experience.
  - Reusable UI: `@/components/admin/services/*` provides form, card, filters, header, analytics, and bulk panels.
  - API: `@/app/api/admin/services/*` implements server operations with auth, permissions, rate limits, validation, and multitenancy.
  - Service layer: `@/services/services.service.ts` centralizes Prisma CRUD, bulk operations, analytics, export, and cache/notification side-effects.
  - Schemas/Types: `@/schemas/services.ts` (Zod), `@/types/services.ts` (TS types).
  - Shared utils: `@/lib/services/utils.ts` (slugging, sanitization, formatting, filtering/sorting, demo helpers).
- Current workflows supported:
  - Browse, filter, sort, and paginate services (server-driven via query params; limit/offset).
  - Create, update, soft-delete (implemented as `active=false`).
  - Toggle `active` and `featured` per item and via bulk actions.
  - Export to CSV or JSON.
  - View stats and analytics derived from bookings.

## 2. Complete Current Directory Structure

- `@/app/admin/services/`
  - `page.tsx` — Admin Services page (client component): manages filters, selection, pagination, tabs, modals; calls API; renders table/card views and a simple analytics section.

- `@/app/api/admin/services/`
  - `route.ts` — [GET] list with filters/pagination/sort and ETag; [POST] create with Zod validation and audit logging; permission + rate-limit checks.
  - `[id]/route.ts` — [GET] by id; [PATCH] partial update with conflict handling (slug 409); [DELETE] soft-delete; permission checks and audit logging.
  - `bulk/route.ts` — [POST] bulk operations (activate/deactivate/feature/unfeature/delete/category/price-update) with Zod validation and audit logging.
  - `export/route.ts` — [GET] export CSV/JSON; content-disposition for CSV.
  - `stats/route.ts` — [GET] aggregate stats + analytics; cache headers.

- `@/components/admin/services/`
  - `ServicesHeader.tsx` — Header bar with stats badges, search, and action buttons (permission-aware).
  - `ServicesFilters.tsx` — Stateless filter dropdowns and chips; emits `ServiceFilters`.
  - `ServiceCard.tsx` — Presentational card; shows pricing/duration/category/features; permission-aware actions.
  - `ServiceForm.tsx` — React Hook Form + Zod resolver for create/update; auto slugging; features editor.
  - `BulkActionsPanel.tsx` — Bulk action selector with client validation (uses `validateBulkAction`).
  - `ServicesAnalytics.tsx` — Presentational analytics widgets consuming normalized analytics shape.

- `@/services/services.service.ts`
  - Service layer class handling Prisma CRUD, caching, notifications, bulk ops, analytics, and exports.

- `@/schemas/services.ts`
  - Zod schemas for service create/update, filters, bulk actions, and response shapes.

- `@/types/services.ts`
  - TypeScript types (`Service`, `ServiceFormData`, `ServiceFilters`, `ServiceStats`, `ServiceAnalytics`, `BulkAction`).

- `@/lib/services/utils.ts`
  - Helpers: `generateSlug`, `sanitizeServiceData`, `formatPrice`, `formatDuration`, `filterServices`, `sortServices`, `extractCategories`, `validateBulkAction`, plus demo data helpers.

- Shared dependencies directly referenced:
  - `@/lib/api`, `@/lib/auth`, `@/lib/permissions`, `@/lib/tenant`, `@/lib/rate-limit`, `@/lib/audit`, `@/lib/cache.service`, `@/lib/notification.service`, `@/lib/prisma`.
  - Hooks: `@/hooks/useServicesPermissions`, `@/hooks/useServicesData` (optional utility hook; Admin page fetches inline).

## 3. Component Architecture Details

- `@/components/admin/services/ServicesHeader`
  - Props: `{ stats: ServiceStats|null, searchTerm: string, onSearchChange: (v:string)=>void, onRefresh: ()=>void, onExport: ()=>void, onCreateNew: ()=>void, loading: boolean }`
  - State: none; derives permissions via `useServicesPermissions`.
  - Dependencies: UI primitives, lucide icons, `@/types/services`.
  - Reusability: Yes (header pattern for list pages).

- `@/components/admin/services/ServicesFilters`
  - Props: `{ filters: ServiceFilters, onFiltersChange: (f:ServiceFilters)=>void, categories: string[], className?: string }`
  - State: none; computes active filter count.
  - Dependencies: UI primitives; `@/types/services`.
  - Reusability: Yes (stateless filter control cluster).

- `@/components/admin/services/ServiceCard`
  - Props: `{ service: Service, isSelected?: boolean, onSelect?: (b:boolean)=>void, onEdit: (s:Service)=>void, onDuplicate: (s:Service)=>void, onDelete: (s:Service)=>void, onToggleActive: (s:Service)=>void, onToggleFeatured: (s:Service)=>void }`
  - State: none.
  - Dependencies: `formatPrice/formatDuration` from `@/lib/services/utils`, `useServicesPermissions`.
  - Reusability: Yes (presentational card for services listing elsewhere).

- `@/components/admin/services/ServiceForm`
  - Props: `{ initialData?: Service|null, onSubmit: (d:ServiceFormData)=>Promise<void>, onCancel: ()=>void, loading?: boolean, categories?: string[] }`
  - State: form state via RHF; controlled features array.
  - Dependencies: `ServiceSchema` (Zod), `generateSlug` util, UI primitives.
  - Reusability: Yes (create/edit modal body).

- `@/components/admin/services/BulkActionsPanel`
  - Props: `{ selectedIds: string[], onClearSelection: ()=>void, onBulkAction: (a:BulkAction)=>Promise<void>, categories: string[], loading?: boolean }`
  - State: local `selectedAction`, `categoryValue`, `priceValue`, `isProcessing`.
  - Dependencies: `validateBulkAction` util; UI primitives.
  - Reusability: Yes (works with any services selection list).

- `@/components/admin/services/ServicesAnalytics`
  - Props: `{ analytics: ServiceAnalytics|null, loading?: boolean, className?: string }`
  - State: none; pure presentational widgets.
  - Reusability: Yes.

- `@/app/admin/services/page.tsx`
  - Local types: duplicates `Service`/`ServiceStats` shapes inline (not imported from `@/types/services`).
  - State: services array, stats, analytics, filters, selection, pagination, tab state, auto-refresh, modal state, form loading.
  - Data actions:
    - GET list: `/api/admin/services?search&category&featured&status&limit&offset&sortBy&sortOrder`.
    - GET stats: `/api/admin/services/stats`.
    - POST create: `/api/admin/services`.
    - PATCH update/toggles: `/api/admin/services/:id`.
    - DELETE soft-delete: `/api/admin/services/:id`.
    - POST bulk: `/api/admin/services/bulk`.
    - GET export: `/api/admin/services/export?format=csv`.
  - Notes: Implements optimistic toggles and auto-refresh; renders table or cards; includes its own filter controls (overlaps with `ServicesFilters`).

## 4. Data Flow Architecture

- Flow overview:
  - Prisma DB ⇄ `@/services/services.service.ts` ⇄ API routes (`@/app/api/admin/services/*`) ⇄ `apiFetch` (`@/lib/api`) ⇄ UI (page + components).
- DB query locations:
  - `@/services/services.service.ts` uses Prisma `service.findMany/findFirst/create/update/updateMany/count/groupBy/aggregate` and `booking.findMany/count` for analytics. Falls back to a raw query + in-memory filter/sort/paginate inside `getServicesList` if the typed query fails.
- Validation layers:
  - Zod request validation in API: `ServiceSchema`, `ServiceUpdateSchema`, `ServiceFiltersSchema`, `BulkActionSchema`.
  - Transform/sanitization: `sanitizeServiceData` (transform-only, includes image URL validation), `generateSlug`, `validateSlugUniqueness` (Prisma check).
- Permissions & auth:
  - `getServerSession(authOptions)` and `hasPermission` enforced per route; granular permissions for list/create/edit/delete/bulk/export/view.
- Rate limiting & auditing:
  - `rateLimit` + `getClientIp` on list/create; `logAudit` events for list/create/update/delete/bulk.
- Caching:
  - `CacheService` used in `getServiceById` (per-item TTL) and `getServiceStats` (tenant-scoped TTL). `clearCaches` invalidates `service-stats:${tenantId}:*`, `services-list:${tenantId}:*`, and per-service key.

### Custom Hooks
- `@/hooks/useServicesPermissions`
  - Returns: `{ canView, canCreate, canEdit, canDelete, canBulkEdit, canExport, canViewAnalytics, canManageFeatured }` based on session role.
  - Caching/memoization via `useMemo`.
- `@/hooks/useServicesData`
  - Manages `{ services, stats, loading, error, filters }`, debounces search, and exposes `refresh()`; uses `/api/admin/services` and `/api/admin/services/stats`.
  - Optional; the Admin page currently performs similar logic inline.

## 5. API Architecture

Base path: `/api/admin/services` (auth required; permission-gated; tenant-scoped via `getTenantFromRequest`).

- GET `/api/admin/services`
  - Query: `ServiceFiltersSchema` fields: `search`, `category`, `featured`, `status`, `limit`, `offset`, `sortBy` (`name|createdAt|updatedAt|price`), `sortOrder` (`asc|desc`).
  - Response: `{ services, total, page, limit, totalPages }` (matches `ServiceListResponseSchema`). Sends `X-Total-Count` and `ETag` (304 respected) with `Cache-Control: private, max-age=60`.
  - Errors: `401|403|429`; `500` on unexpected errors. If Prisma typed query fails, the service layer attempts raw query + in-memory filtering/sorting as a resilience fallback.

- POST `/api/admin/services`
  - Body: `ServiceSchema`; applies `sanitizeServiceData`; ensures slug uniqueness (409 on conflict); emits audit `SERVICE_CREATED`.
  - Response: `{ service }` with `201` on success.
  - Errors: `401|403|429`; `409` slug conflict; `500` otherwise.

- GET `/api/admin/services/[id]`
  - Params: `{ id }` (string).
  - Response: `{ service }` or `404` if not found (cache-backed GET by id).
  - Errors: `401|403|500`.

- PATCH `/api/admin/services/[id]`
  - Body: partial `ServiceUpdateSchema` (with `id`); validates; ensures new slug uniqueness; emits audit `SERVICE_UPDATED`.
  - Response: `{ service }`.
  - Errors: `401|403|404|409|500`.

- DELETE `/api/admin/services/[id]`
  - Behavior: soft-delete (sets `active=false`); emits audit `SERVICE_DELETED`.
  - Response: `{ message: 'Service deleted successfully' }`.
  - Errors: `401|403|404|500`.

- POST `/api/admin/services/bulk`
  - Body: `BulkActionSchema` with `action in ['activate','deactivate','feature','unfeature','delete','category','price-update']` and `serviceIds`.
  - Response: `{ message, result: { updatedCount, errors: string[] } }` with audit `SERVICES_BULK_ACTION`.
  - Errors: `401|403|500`.

- GET `/api/admin/services/export`
  - Query: `format=csv|json`, `includeInactive=true|false`.
  - Response: CSV stream with `Content-Disposition` or JSON body. Errors: `401|403|500`.

- GET `/api/admin/services/stats`
  - Query: `range` (currently normalized internally to last ~6 months for analytics and 30d cache key).
  - Response: `ServiceStats & { analytics: ServiceAnalytics }`. Errors: `401|403|500`.

Missing/optional endpoints detected: none strictly necessary; consider a `HEAD`/`GET /slug-availability` endpoint for client-side slug checks if UX requires.

## 6. Integration Points

- Bookings (`@/lib/booking/*`, Prisma `Booking`):
  - `getServiceStats` joins bookings to compute `monthlyBookings`, `revenueByService`, `popularServices`, and monthly conversion rates; filters by tenant and status in (`COMPLETED`, `CONFIRMED`).
  - Downstream booking flows rely on service `active`, `price`, `duration`, and `category` fields.

- Service Requests (`@/app/api/admin/service-requests/*`, Portal SR flows):
  - Not directly coupled here but commonly reference `serviceId` and service state. Changes to `active/price/category` should propagate to SR validations and UI options.

- Availability & Team (`@/components/admin/AvailabilitySlotsManager`, team assignment):
  - Slots and workload may be keyed by `serviceId`; deactivating services should hide slots or prevent new bookings.

- Shared libs
  - `@/lib/tenant` (tenant scoping), `@/lib/audit` (activity log), `@/lib/rate-limit` (throttling), `@/lib/cache.service` (TTL caches), `@/lib/notification.service` (emit events/notifications to stakeholders).

Potential duplication/conflicts:
- Admin page duplicates `Service`/`ServiceStats` interfaces locally and filter UI logic instead of using `@/types/services` and `ServicesFilters` component.
- Filtering/sorting logic appears in both server (authoritative) and client utils (for fallback/demo); ensure client utils are only used for fallback/testing.

## 7. Known Issues & Improvements (Audit Findings)

- Type duplication in Admin page — Open
  - `@/app/admin/services/page.tsx` defines local `Service` and `ServiceStats`. Risk of drift from `@/types/services`. Unify to shared types.

- UI duplication — Open
  - Admin page implements its own filter/search controls and analytics snippets while `ServicesFilters` and `ServicesAnalytics` exist. Consolidate to shared components.

- Validation split — Partially Open
  - Zod validates requests, while `sanitizeServiceData` performs transforms and URL validation. Co-locate transforms with Zod (e.g., `z.preprocess` or dedicated parser) to reduce drift.

- Fallback behavior clarity — Open
  - `getServicesList` has a raw-SQL + in-memory fallback if typed Prisma query fails. Document this operational mode and consider explicit feature flag or telemetry to surface when fallback is used.

- Caching backend — Open (prod hardening)
  - `CacheService` is in-memory; for horizontal scale use Redis/Upstash/Netlify KV and replace `deletePattern` with safe key scanning.

- Multitenancy uniqueness — Open
  - Slug uniqueness is global. If tenant-scoped uniqueness is desired, enforce composite unique `(tenantId, slug)` and update `validateSlugUniqueness` and queries.

- Tests coverage — Partially Open
  - Route tests exist (`tests/admin-services.route.test.ts`). Add: service-layer unit tests (CRUD/bulk/stats, cache invalidation), component tests (form, bulk panel, permission gating), and hook tests.

- CSV security — Open (if exporting to Excel)
  - Consider prefixing dangerous cells to avoid formula injection if CSV is opened in spreadsheet apps.

## 8. Recommendations

Architecture & Consistency
- Import `Service`, `ServiceStats`, and related types in Admin page from `@/types/services` and remove local duplicates.
- Replace ad-hoc filter/search UI in `page.tsx` with `@/components/admin/services/ServicesFilters` and the header with `ServicesHeader` for consistency and maintainability.
- Keep server-side filtering/sorting/pagination as the single source of truth; restrict client utils to demo/fallback/testing flows.

Performance & Caching
- Adopt a shared cache backend (Redis/Upstash/Netlify KV) for `CacheService`. Ensure `clearCaches` also clears any list projections consumed by other modules (e.g., booking wizards).
- Maintain ETag handling on lists; consider weak ETags or `Last-Modified` if payload hashing becomes expensive.

API Hardening
- Maintain 409 conflict handling for slug collisions on create/update with friendly messages.
- Add structured error payloads with codes to simplify client handling (e.g., `{ code: 'SLUG_CONFLICT', message: '...' }`).
- Consider `HEAD /api/admin/services` to allow cache validation without payload download.

Integrations
- Emit notifications or domain events when service `active`, `price`, or `category` changes to prompt cache refresh and UI updates in Bookings and Service Requests.
- Provide a light-weight `ServiceLite` DTO for downstream consumers that only need id/name/price/duration/active.

Testing
- Add contract tests for stats analytics (booking join and aggregation), bulk operations edge cases, and cache invalidation paths.
- Add component tests for `ServiceForm` validation and `BulkActionsPanel` guardrails.

References (aliases)
- UI: `@/app/admin/services/page.tsx`, `@/components/admin/services/*`
- API: `@/app/api/admin/services/*`
- Service layer: `@/services/services.service.ts`
- Schemas/Types: `@/schemas/services`, `@/types/services`
- Utils: `@/lib/services/utils`, `@/lib/cache.service`, `@/lib/notification.service`
- Prisma models: `Service`, `Booking` (see `prisma/schema.prisma`)
