

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
