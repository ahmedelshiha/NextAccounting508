
## [2025-09-25] ServiceLite DTO and BookingWizard integration
What I changed:
- Added ServiceLite type to src/types/services.ts.
- Created GET /api/services/lite with minimal fields, tenant-scoped, ETag and Cache-Control.
- Updated BookingWizard to use /api/services/lite and map shortDesc to displayed description.

Why:
- Reduce payload size and coupling for client flows; faster booking UX and clearer contracts.

Next steps:
- Consider migrating other simple selectors to use the lite endpoint where appropriate.
