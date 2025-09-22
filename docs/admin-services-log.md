## [2025-09-22] Phase 1 verification – Typecheck passed
What I changed:
- Fixed Service filters type narrowing for Select components (status/featured unions).
- Resolved RHF + Zod resolver typing by simplifying resolver typing and adding React import.
- Ensured ServiceForm handler and defaults align with shared ServiceFormData.

Why:
- Remove TS errors introduced by type unification and ensure shared types are the single source of truth.

Next steps:
- Begin Phase 2.1 Prisma schema prep: composite unique (tenantId, slug), JSONB serviceSettings with default {}, status enum and code updates.

