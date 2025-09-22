
## [2025-09-25] Phase 6 — Security & Rate Limiting
What I changed:
- Enforced granular permission for featured updates on create/update routes.
- Required SERVICES_ANALYTICS for services stats endpoint.
- Added tenant-scoped rate limiting for bulk operations (10/min per tenant+IP).
- Throttled CSV export to 5/min per tenant+IP; confirmed CSV sanitization at source.

Why:
- Prevent privilege escalation on featured content; protect analytics and bulk endpoints; guard against abuse.

Next steps:
- Add tests for permission checks and throttling responses.
