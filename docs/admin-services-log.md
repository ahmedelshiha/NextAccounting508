## [2025-09-22] Phase 1.3 – Schema Validation Consolidation completed
What I changed:
- Moved image URL validation into Zod using `z.preprocess` and protocol refinement in `@/schemas/services.ts`.
- Updated `sanitizeServiceData` to be transform-only, removing duplicate URL validations.

Why:
- Establish a single source of truth for validation, reduce drift, and simplify maintenance.

Next steps:
- Phase 2.1 – Database schema enhancements (tenant-scoped slug uniqueness, serviceSettings JSONB, status enum) and query updates.
