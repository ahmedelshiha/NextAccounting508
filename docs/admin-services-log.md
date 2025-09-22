## [2025-09-22] Phase 1 verification – Typecheck passed
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
