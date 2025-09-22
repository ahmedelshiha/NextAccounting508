# Admin → Services Module Audit

Last updated: 2025-09-22

## 1. Overview
- Purpose: Centralize creation, management, analytics, and export of the firm’s service offerings.
- Placement: Admin UI at `@/app/admin/services/page.tsx`; reusable UI in `@/components/admin/services/*`; REST API in `@/app/api/admin/services/*`; business logic in `@/services/services.service.ts`; schemas/types in `@/schemas/services` and `@/types/services`; shared utils in `@/lib/services/utils`.
- Workflows supported:
  - List, filter, sort, paginate services (server-driven)
  - Create, update, soft-delete (active=false)
  - Toggle active/featured
  - Bulk actions (activate/deactivate, feature/unfeature, category update, price update, delete)
  - Export (CSV/JSON)
  - View analytics and stats (bookings-derived)

How it fits overall:
- Admin: Full CRUD + bulk + analytics/exports.
- Portal/Client: Consumes services for bookings and service requests.
- API: Validates via Zod; uses Prisma; multitenancy via `getTenantFromRequest`.

## 2. Complete Current Directory Structure

- `@/app/admin/services/`
  - `page.tsx` — Admin Services page (client). Manages filters, pagination, selection, tabs, modals; calls API; renders table/cards + analytics.

- `@/app/api/admin/services/`
  - `route.ts` — GET list (filters, paging, rate limit, demo fallback); POST create (Zod validate; 501 if DB missing).
  - `[id]/route.ts` — GET one; PATCH update (Zod validate, 409 on slug conflict); DELETE soft-delete; 501 if DB missing. Uses standard synchronous `params`.
  - `bulk/route.ts` — POST bulk actions (Zod validate) -> service layer. 501 if DB missing.
  - `export/route.ts` — GET CSV/JSON export. 501 if DB missing.
  - `stats/route.ts` — GET aggregated stats + analytics; 501 if DB missing.

- `@/components/admin/services/`
  - `ServicesHeader.tsx` — Header with stats, search, actions; permission-gated.
  - `ServicesFilters.tsx` — Stateless filters UI; emits filter changes.
  - `ServiceCard.tsx` — Presentational card for a service; action controls; uses permissions.
  - `ServiceForm.tsx` — RHF + Zod form for create/edit; auto slug; strict validation.
  - `BulkActionsPanel.tsx` — Client-side validator + dispatch to API; supports all bulk actions.
  - `ServicesAnalytics.tsx` — Presentational analytics block (consumes normalized analytics shape).

- `@/services/services.service.ts`
  - Business logic: Prisma CRUD, bulk ops, stats/analytics, export, caching hooks, notifications, change detection.

- `@/schemas/services.ts` — Zod schemas: `ServiceSchema`, `ServiceUpdateSchema`, `BulkActionSchema`, `ServiceFiltersSchema`, response schemas.
- `@/types/services.ts` — Types for `Service`, `ServiceFormData`, `ServiceFilters`, `ServiceStats`, `ServiceAnalytics`, `BulkAction`.
- `@/lib/services/utils.ts` — Slugging, sanitization, formatting, filtering/sorting, categories, demo data + demo list helper.
- `@/lib/cache.service.ts` — In-memory cache with TTL and `deletePattern` (dev-ready; swap for Redis in prod).

Related hooks/utils used:
- `@/hooks/useServicesPermissions.ts` — Derives permissions from NextAuth session.
- `@/hooks/useServicesData.ts` — Optional data hook (debounced fetch, manages `{ services, stats, error, refresh }`). Admin page currently fetches inline.
- Shared libs integrating services: `@/lib/booking/*` (availability, pricing, conflict detection); `@/lib/tenant`; `@/lib/audit`; `@/lib/rate-limit`.

## 3. Component Architecture Details

- ServicesHeader
  - Props: `{ stats: ServiceStats|null, searchTerm: string, onSearchChange, onRefresh, onExport, onCreateNew, loading }`
  - Depends on `useServicesPermissions`, button/input components, lucide icons.
  - Reusable header pattern across admin pages.

- ServicesFilters
  - Props: `{ filters, onFiltersChange, categories, className? }`
  - Stateless; renders status/featured/category/sort; clear filters; advanced panel.

- ServiceCard
  - Props: `{ service, isSelected?, onSelect?, onEdit, onDuplicate?, onDelete, onToggleActive, onToggleFeatured }`
  - Uses `formatPrice`, `formatDuration`; permission-aware actions; presentational.

- ServiceForm
  - Props: `{ initialData?, onSubmit, onCancel, loading?, categories? }`
  - RHF + `ServiceSchema` resolver; slug auto-generation on create; trims/sanitizes; returns `ServiceFormData`.

- BulkActionsPanel
  - Props: `{ selectedIds, onClearSelection, onBulkAction, categories, loading? }`
  - Local state for selected action/value; client validation (`validateBulkAction`); calls API.

- ServicesAnalytics
  - Props: `{ analytics: ServiceAnalytics|null, loading?, className? }`
  - Purely presentational; expects normalized analytics from `/api/admin/services/stats`.

Admin Page `@/app/admin/services/page.tsx`:
- Manages list/filters/selection/pagination/tabs/modals.
- Server-driven filtering/sorting/pagination via `/api/admin/services` (limit/offset/sortBy/sortOrder).
- Calls `/api/admin/services/stats` for stats/analytics.
- Optimistic UX hooks for toggles/bulk are basic; toast feedback; auto-refresh option.

## 4. Data Flow Architecture

Flow:
- Database (Prisma) ⇄ Service layer (`@/services/services.service.ts`) ⇄ API routes (`@/app/api/admin/services/*`) ⇄ Fetch (`@/lib/api`) ⇄ Hooks/components ⇄ UI.

Where DB queries occur:
- In service layer via Prisma: `service.findMany/findFirst/create/update/updateMany/count/groupBy/aggregate`; `booking.findMany/count` for analytics.

Validation & error handling:
- API request validation: Zod (`ServiceSchema`, `ServiceUpdateSchema`, `BulkActionSchema`, `ServiceFiltersSchema`).
- Server sanitization: `sanitizeServiceData` (transform-only), image URL validation; uniqueness via `validateSlugUniqueness`.
- Rate limiting: `@/lib/rate-limit` on list/create.
- Permissions: `hasPermission` per route.
- Audit logging: `@/lib/audit` on list, create, update, delete, bulk.
- Fallbacks: Demo mode for list using `getDemoServicesList` when DB missing or schema errors; other endpoints return 501 (consistent).

Caching:
- `CacheService` (in-memory) used for `getServiceById` (per-service key with TTL) and `getServiceStats` (tenant-scoped stats key with TTL).
- Invalidation via `clearCaches`: deletes `service-stats:${tenantId}:*`, `services-list:${tenantId}:*`, and the per-service key.

### Custom Hooks
- `useServicesPermissions` — returns booleans for view/create/edit/delete/bulk/export/analytics/featured based on session role.
- `useServicesData` — optional hook performing debounced fetch of list + stats; manages `{ services, stats, loading, error, filters }` and `refresh`.

## 5. API Architecture

Base: `/api/admin/services` (requires authenticated session and permissions; multitenancy via `getTenantFromRequest`).

- GET `/api/admin/services`
  - Query: `ServiceFiltersSchema` (`search, category, featured, status, limit, offset, sortBy, sortOrder`).
  - Response: `ServiceListResponseSchema` (`{ services, total, page, limit, totalPages }`).
  - Errors: 401/403/429; 500 on unexpected; Demo fallback with paging/sorting if DB missing or schema errors.

- POST `/api/admin/services`
  - Body: `ServiceSchema`; `sanitizeServiceData` + slug uniqueness.
  - Response: `{ service }` 201; 409 on slug conflict; 501 when DB missing.

- GET `/api/admin/services/[id]`
  - Response: `{ service }` or 404 if not found; 501 when DB missing.

- PATCH `/api/admin/services/[id]`
  - Body: `ServiceUpdateSchema` (partial; includes `id`).
  - Response: `{ service }`; 404 if not found; 409 on slug conflict; 501 when DB missing.

- DELETE `/api/admin/services/[id]`
  - Behavior: Soft-delete (`active=false`).
  - Response: `{ message }`; 404 if not found; 501 when DB missing.

- POST `/api/admin/services/bulk`
  - Body: `BulkActionSchema` with `action in ['activate','deactivate','feature','unfeature','delete','category','price-update']`.
  - Response: `{ message, result: { updatedCount, errors } }`; 501 when DB missing.

- GET `/api/admin/services/export`
  - Query: `format=csv|json`, `includeInactive=true|false`.
  - Response: CSV stream (content-disposition) or JSON; 501 when DB missing.

- GET `/api/admin/services/stats`
  - Query: `range=30d|...` (currently normalized to a 30d key).
  - Response: `ServiceStats & { analytics: ServiceAnalytics }`.

## 6. Integration Points

- Bookings (`@/lib/booking/*`, Prisma `Booking`):
  - Analytics compute `monthlyBookings`, `revenueByService`, `popularServices`, `conversionRates` from `Booking` records (status COMPLETED/CONFIRMED; last months window; tenant-scoped where applicable).
  - Booking UI (e.g., `@/components/booking/BookingWizard.tsx`) consumes services list downstream.

- Service Requests (APIs under `/api/portal/service-requests/*`):
  - Validation of `serviceId` and active status; downstream consumers affected by service state changes.

- Admin Availability (`@/components/admin/AvailabilitySlotsManager.tsx`):
  - Manages slots per `serviceId`.

- Shared libs/utils:
  - `@/lib/tenant` for scoping.
  - `@/lib/audit` for activity logging.
  - `@/lib/rate-limit` for throttling.

Potential overlaps/duplication:
- Demo fallback logic consolidated via `getDemoServicesList` (removes prior duplication between normal and error paths).

## 7. Known Issues & Improvements (Audit Findings)

Status legend: [Resolved], [Open], [Planned]

- Inconsistent DB fallback behavior — [Resolved]
  - List uses demo fallback; all others return 501 with helpful message.

- Client-side filtering/pagination duplication — [Resolved]
  - Admin page relies on server-side filters/pagination; no client-side duplication.

- Mixed validation layers — [Partially Open]
  - Zod + `sanitizeServiceData` still split; `sanitizeServiceData` is transform-only and URL validation. Consider deriving transform from Zod or consolidating to single source of truth.

- Cache invalidation is a stub — [Resolved for dev]; [Open for prod]
  - Implemented in-memory `CacheService` with TTL + `deletePattern`. Recommend Redis or equivalent for production, and broader key coverage across consumers.

- Analytics placeholders — [Resolved]
  - `getServiceStats` now computes real analytics from `Booking` data (monthly bookings, revenue by service, popular services, conversion rates).

- Code duplication (fallback data) — [Resolved]
  - Extracted `getDemoServicesList` utility and used in both demo and error fallbacks.

- Param typing smell in `[id]/route.ts` — [Resolved]
  - Uses synchronous `{ params: { id: string } }` shape.

- Missing comprehensive tests — [Partially Open]
  - Present: route tests for list/create/update/delete/bulk/export/stats and utils tests.
  - Missing: component tests (ServiceForm, BulkActionsPanel), service-layer unit tests with DB/mocks, hook tests, permission gating tests.

- Multitenancy edge cases — [Open]
  - DB enforces global unique slug. If multi-tenant uniqueness is required, add composite unique `(tenantId, slug)` and adjust code/validation accordingly.

- API caching headers — [Resolved]
  - Implemented ETag/If-None-Match on list endpoint; keeps Cache-Control headers.

## 8. Recommendations

Architecture & Consistency
- Consolidate validation: keep Zod as source of truth and generate transform/sanitizers (or co-locate derived transforms) to prevent drift.
- Continue to prefer server-side pagination/filtering exclusively (already in place).
- Keep analytics normalized in `getServiceStats`; ensure UI consumes directly (no client normalization).

Caching & Performance
- Swap `@/lib/cache.service.ts` with Redis/Upstash/Netlify KV in production; implement `get/set/delete/deletePattern` with proper key scanning.
- Extend invalidation to downstream caches (e.g., availability/pricing calculators) when service fields change.
- Evaluate ETag support and SWR usage (`useServicesData`) for smoother UX.

API Hardening
- Maintain consistent 501 messaging for DB-missing across endpoints.
- Keep 409 on slug conflicts for create/update with user-friendly messages.
- If adopting tenant-scoped slug uniqueness, migrate schema and adapt validation and queries.

UI/UX
- Consider optimistic UI for toggles/bulk where safe, with rollback on error.
- Ensure table/cards parity with booking page patterns; keep responsive behaviors.
- Keep demo dataset helper client-side as well if needed for offline preview.

Testing
- Add tests for:
  - `sanitizeServiceData`, `generateSlug`, filter/sort utilities (already partially present).
  - Service layer CRUD/bulk/stats with Prisma test DB or mocks (including analytics logic and cache invalidation calls).
  - API route handlers: permissions, rate limits, demo fallbacks, 501 behavior.
  - Component interaction tests: ServiceForm validation flows, BulkActionsPanel client validation, permissions gating in header/card actions.
  - Hook tests: `useServicesData` behaviors (debounce/refresh/error).

Integrations
- Bookings/Service Requests: emit events or invalidate relevant caches when service status/price/category changes; ensure consumers (pricing/availability) refresh accordingly.
- Define a shared DTO for lightweight service projections (e.g., `ServiceLite`) to avoid ad-hoc projections in downstream UIs.

Security & DX
- CSV export: escaping already present; if targeting Excel, consider prefixing risky cells.
- Rate limits: consider per-tenant keys in addition to IP.

---

References (aliases)
- UI: `@/app/admin/services/page.tsx`, `@/components/admin/services/*`
- API: `@/app/api/admin/services/*`
- Service layer: `@/services/services.service.ts`
- Schemas/Types: `@/schemas/services`, `@/types/services`
- Utils: `@/lib/services/utils`, `@/lib/cache.service`
- Prisma Models: `Service`, `Booking` (see `prisma/schema.prisma`)
