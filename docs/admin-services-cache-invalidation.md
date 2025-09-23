# Admin Services — Cache Invalidation Strategy

This document explains how caching works for Admin Services and how to safely invalidate keys across Redis and in-memory backends.

Scope
- List queries: services list with filters and pagination
- Single service reads
- Aggregated analytics and stats

Cache backend
- Primary: Redis via ioredis when REDIS_URL or UPSTASH_REDIS_REST_URL is set
- Fallback: In-memory LRU-like cache (process-local) when Redis is not configured
- Implementation entry: src/lib/cache.service.ts

Key patterns and TTLs
- services-list:{tenantId}:{hash}
  - Purpose: paginated and filtered lists
  - TTL: 60s
- service:{serviceId}:{tenantId}
  - Purpose: single service fetch
  - TTL: 300s
- service-stats:{tenantId}:30d
  - Purpose: aggregate stats + analytics for admin dashboard
  - TTL: 600s

Invalidation rules
- On create/update/delete/clone/bulk operations, call ServicesService.clearCaches(tenantId, serviceId?)
- clearCaches deletes the following patterns:
  - service-stats:{tenantId}:*
  - services-list:{tenantId}:*
  - service:*:{tenantId}
- If a specific serviceId is provided, also deletes service:{serviceId}:{tenantId}

Behavior details
- Pattern deletion uses prefix matching with safe escape in memory (regex) and SCAN in Redis
- Deletions are rate-friendly and non-blocking in Redis via scanStream + pipeline
- Lists include ETag headers; unchanged responses return 304 for additional efficiency

Operational guidance
- Prefer invalidating patterns via ServicesService.clearCaches rather than deleting keys manually
- For mass updates, rely on bulk actions which already call clearCaches once at the end
- Avoid setting very long TTLs for hot keys; keep defaults above to balance freshness and cost

Local vs production
- In local/dev without Redis, cache is process-local and resets on restart
- In multi-instance deployments (e.g., Netlify’s background/edge), configure Redis to ensure cross-instance coherence

Netlify best practices
- Set REDIS_URL in site/environment variables to enable Redis-backed cache
- Monitor Redis metrics and memory utilization; adjust TTLs if necessary

Related code
- CacheService: src/lib/cache.service.ts
- Redis cache: src/lib/cache/redis.ts
- Invalidation: ServicesService.clearCaches in src/services/services.service.ts
