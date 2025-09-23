# Cache Invalidation Strategy

This app uses a layered cache approach:

- Application-level CacheService with Redis backend when `REDIS_URL` is set; in-memory fallback otherwise.
- Key spaces:
  - `service-stats:{tenantId}:*` – computed analytics snapshots
  - `services-list:{tenantId}:*` – list queries with filters
  - `service:{serviceId}:{tenantId}` – single-resource cache

## Invalidation Triggers

The `serviceEvents` bus emits events on create/update/delete/bulk actions. Default listeners:

- On `service:created|updated|deleted|bulk`: delete patterns above and specific `service:{id}:{tenantId}` when applicable.
- Warming: schedule non-blocking warm-up of hot queries after invalidation to reduce cold-start latency.

## Safe Patterns

- Pattern deletes use Redis `SCAN` (via `scanStream`) to avoid blocking.
- In-memory fallback uses regex matching on keys.
- All cache operations are best-effort; failures never block core flows.

## TTLs and Consistency

- Short TTLs for list/stat caches (30–120s) are recommended where applied.
- Single resource (`service:*`) may be written-through on updates to reduce misses.
- Event-driven invalidation ensures near-real-time consistency after mutations.

## Fallback Behavior

- If Redis is unavailable or not configured, `CacheService` logs a warning and transparently falls back to in-memory cache for this instance.
- In-memory cache is per-process and non-shared; consistency across instances relies on event-driven misses.

## Operational Notes

- Set `REDIS_URL` to enable shared cache across instances.
- Monitor cache hit rate and Redis errors via APM (Sentry breadcrumbs + logs).
- Keys include `tenantId` to avoid cross-tenant leakage.
