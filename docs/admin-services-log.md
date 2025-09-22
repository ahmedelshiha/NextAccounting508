What I changed:
- Fixed Service filters type narrowing for Select components (status/featured unions).
- Resolved RHF + Zod resolver typing by simplifying resolver typing and adding React import.
- Ensured ServiceForm handler and defaults align with shared ServiceFormData.

Why:
- Remove TS errors introduced by type unification and ensure shared types are the single source of truth.

Next steps:
- Begin Phase 2.1 Prisma schema prep: composite unique (tenantId, slug), JSONB serviceSettings with default {}, status enum and code updates.

## [2025-09-22] Phase 2.1 – Schema prep and tenant-scoped slug
What I changed:
- Prisma: removed global unique on Service.slug; added @@unique([tenantId, slug]); added serviceSettings Json?; extended ServiceStatus with DRAFT/RETIRED.
- Updated seed and public service endpoints to work without unique slug (findFirst and id-based updates).
- Tenant-scoped slug uniqueness checks in API create route.

Why:
- Enforce per-tenant slugs and prepare for richer service configuration via JSONB.

Next steps:
- Migrate server filters/toggles from boolean active to enum status, and update bulk actions and analytics accordingly.

## [2025-09-22] Phase 2.1 – Begin migration from active→status
What I changed:
- Core service layer now filters, counts, and exports using Service.status ('ACTIVE') instead of active boolean.
- Kept active boolean in sync for backward compatibility on create/update/bulk/delete.
- Fallback raw SELECT includes status; Service DTO derives active from status when missing.
- Public SR API validates service status via enum (ACTIVE) instead of active bool.

Why:
- Prepare for richer lifecycle states (DRAFT, RETIRED) and remove ambiguity around "inactive".

Next steps:
- Update booking/pricing/payment endpoints to read status instead of active.
- Migrate UI toggle/actions to call status-aware endpoints (no behavior change required).
- Remove remaining direct active checks post-QA, then deprecate active field in a future migration.

## [2025-09-22] Phase 2.1 – Booking/Pricing/Payment endpoints migrated
What I changed:
- Availability API now requires Service.status = ACTIVE (findFirst).
- Domain availability/conflict/pricing use status enum checks.
- Pricing API and Payments Checkout validate status via enum.
- Services page static params query uses status = ACTIVE for slug generation.

Why:
- Ensure end-user flows (availability, pricing, checkout) honor lifecycle states consistently.

Next steps:
- Typecheck and QA paths; audit remaining direct `active` checks and migrate gradually.

## [2025-09-22] Phase 2.1 – Admin UI toggles aligned
What I changed:
- PATCH /api/admin/services/[id] maps active->status in ServicesService.updateService.
- Bulk actions already synchronize both fields for activate/deactivate.

Why:
- Ensure UI toggles keep enum status in sync without UI changes.

Next steps:
- Run typecheck; address any fallout. Continue migrating remaining endpoints away from direct active checks.

## [2025-09-22] Phase 2.2 – Service Layer Business Logic
What I changed:
- Implemented cloneService(name, fromId) with tenant-scoped slug dedup; clones as DRAFT, not active.
- Added getServiceVersionHistory(id) stub returning [].
- Added validateServiceDependencies(service) for basic booking/duration/buffer checks.
- Implemented bulkUpdateServiceSettings(updates) with shallow JSON merge per service.
- Strengthened cache invalidation to wipe service:*:tenant patterns.

Why:
- Prepares service module for future workflows (versions, dependency checks) and operational settings updates.

Next steps:
- Proceed to Phase 3.1: error handling standardization (structured error responses, codes, 409 on slug conflict).

## [2025-09-22] Phase 2.1 – DB migration in deployment pipeline
What I changed:
- Added prisma deploy/seed flow to netlify.toml build command and included scripts/prisma-deploy-retry.sh to retry migrations on advisory lock contention during CI (Netlify).

Why:
- Ensure DB schema changes are applied reliably during Netlify builds and reduce deployment failures caused by migration contention.

Next steps:
- Monitor Netlify deploy logs for migration success, validate migrations on staging, and plan phased production migration and alerting.

## [2025-09-23] Phase 3.1 – API error responses module
What I changed:
- Added `src/lib/api/error-responses.ts` which provides a typed ApiError class and helpers to normalize errors into the shape `{ code, message, details? }`.
- Included mappers for common error shapes: Prisma unique constraint (P2002 -> SLUG_CONFLICT/UNIQUE_CONSTRAINT) and Zod validation errors (VALIDATION_FAILED).

Why:
- Standardizing error shapes makes it straightforward for API routes and frontends to handle errors uniformly (status-aware rendering, consistent logging, localized messages).

Next steps:
- Refactor admin service routes to throw/use ApiError and to map Prisma/Zod errors using provided helpers.
- Ensure routes return appropriate HTTP statuses (e.g., 409 for slug conflicts, 400 for validation failures) and include the normalized JSON body.
- Add tests for error mapping and end-to-end route assertions.
