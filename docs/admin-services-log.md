
## [2025-09-25] Service events, list caching, and cache warming
What I changed:
- Implemented typed service events bus at src/lib/events/service-events.ts with EventEmitter wrapper.
- Registered default listeners to invalidate caches and asynchronously warm hot paths (services lists and stats) per tenant.
- Emitted events from ServicesService on create/update/delete/clone/bulk operations.
- Added short-lived (60s) caching for getServicesList keyed by tenant+filters; integrated invalidation.

Why:
- Decouple side effects (cache invalidation/warming) from service mutations and enable future observers.
- Reduce list load latency and stabilize response times under burst by caching and warming common queries.

Next steps:
- Add unit/integration tests for events emission and cache behavior.
- Consider expanding warmed combinations based on real traffic and add observability around hit ratios.
