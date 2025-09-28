# API Caching Implementation Documentation

## Overview

This document describes the comprehensive API caching middleware implementation for the NextAccounting235 admin dashboard. The caching system includes stale-while-revalidate patterns, tenant-aware caching, intelligent cache invalidation, and configurable TTL per endpoint type.

## Implementation Details

### Core Caching Infrastructure

**File**: `src/lib/api-cache.ts`

The caching middleware provides:
- **Stale-while-revalidate pattern**: Serves stale data while refreshing in the background
- **Tenant-aware caching**: Isolates cache keys by tenant to prevent data leakage  
- **Intelligent invalidation**: Event-driven cache clearing based on data mutations
- **Configurable TTL**: Different cache lifetimes per endpoint type

### Cached Endpoints

#### 1. Analytics Dashboard (`/api/admin/analytics`)
- **Cache Key**: `analytics-dashboard`
- **TTL**: 180 seconds (3 minutes)
- **Stale TTL**: 360 seconds (6 minutes)
- **Invalidation Events**: `ANALYTICS_CHANGED`

```typescript
const getCachedAnalytics = withCache<AnalyticsData>(
  {
    key: 'analytics-dashboard',
    ttl: 180,
    staleWhileRevalidate: 360,
    tenantAware: true
  },
  async (request: NextRequest): Promise<AnalyticsData> => {
    // Analytics data generation logic
  }
)
```

#### 2. Admin Bookings (`/api/admin/bookings`)
- **Cache Key**: `admin-bookings`
- **TTL**: 120 seconds (2 minutes)
- **Stale TTL**: 240 seconds (4 minutes)
- **Invalidation Events**: `BOOKING_CHANGED`

```typescript
const getCachedBookings = withCache<BookingsResponse>(
  {
    key: 'admin-bookings',
    ttl: 120,
    staleWhileRevalidate: 240,
    tenantAware: true
  },
  async (request: NextRequest): Promise<BookingsResponse> => {
    // Bookings query with filters, pagination, sorting
  }
)
```

#### 3. Admin Services (`/api/admin/services`)
- **Cache Key**: `admin-services`
- **TTL**: 300 seconds (5 minutes)
- **Stale TTL**: 600 seconds (10 minutes)
- **Invalidation Events**: `SERVICE_CHANGED`

```typescript
const getCachedServices = withCache<any>(
  {
    key: 'admin-services',
    ttl: 300,
    staleWhileRevalidate: 600,
    tenantAware: true
  },
  async (request: NextRequest): Promise<any> => {
    // Services list with filters and pagination
  }
)
```

#### 4. Admin Calendar (`/api/admin/calendar`)
- **Cache Key**: `admin-calendar`
- **TTL**: 60 seconds (1 minute)
- **Stale TTL**: 120 seconds (2 minutes)
- **Invalidation Events**: `BOOKING_CHANGED`, `TASK_CHANGED`, `AVAILABILITY_CHANGED`

```typescript
const getCachedCalendar = withCache<any>(
  {
    key: 'admin-calendar',
    ttl: 60,
    staleWhileRevalidate: 120,
    tenantAware: true
  },
  async (request: NextRequest): Promise<any> => {
    // Calendar data aggregation
  }
)
```

### Cache Invalidation Strategy

Cache invalidation is implemented through event-driven patterns. When data mutations occur, specific invalidation events are triggered:

#### Invalidation Events Map

```typescript
const CACHE_INVALIDATION_EVENTS = {
  // Booking events
  BOOKING_CHANGED: ['admin-bookings', 'admin-calendar', 'analytics-dashboard'],
  
  // Service events  
  SERVICE_CHANGED: ['admin-services', 'analytics-dashboard'],
  
  // Task events
  TASK_CHANGED: ['admin-calendar', 'analytics-dashboard'],
  
  // Availability events
  AVAILABILITY_CHANGED: ['admin-calendar'],
  
  // Analytics events
  ANALYTICS_CHANGED: ['analytics-dashboard'],
  
  // User events
  USER_CHANGED: ['analytics-dashboard'],
  
  // Global cache clear
  CACHE_CLEAR_ALL: ['*']
}
```

#### Mutation Endpoints with Cache Invalidation

**Bookings Mutations**:
- `POST /api/admin/bookings` - Creates booking, triggers `BOOKING_CHANGED`
- `PATCH /api/admin/bookings` - Bulk updates, triggers `BOOKING_CHANGED`
- `DELETE /api/admin/bookings` - Bulk deletes, triggers `BOOKING_CHANGED`

**Services Mutations**:
- `POST /api/admin/services` - Creates service, triggers `SERVICE_CHANGED`
- `PATCH /api/admin/services/[id]` - Updates service, triggers `SERVICE_CHANGED`
- `DELETE /api/admin/services/[id]` - Deletes service, triggers `SERVICE_CHANGED`

```typescript
// Example implementation in booking creation
await logAudit({ action: 'booking.create', actorId: session.user.id, targetId: booking.id })

// Invalidate related caches
await invalidateCache('BOOKING_CHANGED')

return NextResponse.json({ message: 'Booking created successfully', booking })
```

## Cache Configuration

### TTL Guidelines

- **Real-time data** (calendar, bookings): 1-2 minutes
- **Frequently updated** (analytics): 3-5 minutes  
- **Moderately stable** (services): 5-10 minutes
- **Static data** (configurations): 15-30 minutes

### Stale-While-Revalidate Strategy

All cached endpoints use stale-while-revalidate with the following pattern:
- **Stale TTL = 2x Fresh TTL**: Allows serving stale data while refreshing
- **Background refresh**: Updates cache without blocking requests
- **Graceful degradation**: Falls back to database if cache fails

### Tenant Isolation

Cache keys are automatically scoped by tenant:
```typescript
// Actual cache key format
`cache:${tenantId}:${baseKey}:${queryHash}`

// Example
`cache:tenant_123:admin-bookings:a1b2c3d4`
```

## Performance Benefits

### Expected Performance Gains

1. **Response Time Reduction**: 
   - Fresh cache hits: ~5-10ms (vs 100-500ms database queries)
   - Stale cache hits: ~5-10ms with background refresh
   
2. **Database Load Reduction**:
   - Analytics endpoint: ~70% fewer database queries
   - Bookings list: ~60% fewer complex queries
   - Services list: ~80% fewer queries (stable data)

3. **Concurrent Request Handling**:
   - Cache prevents duplicate expensive queries
   - Improves response under high load
   - Reduces database connection pressure

### Cache Hit Metrics

The system tracks cache performance:
- **Hit rate**: Percentage of requests served from cache
- **Miss rate**: Percentage requiring database queries
- **Stale rate**: Percentage served stale data during refresh
- **Invalidation frequency**: How often caches are cleared

## Usage Examples

### Reading Cached Data

```typescript
// The cached handlers are automatically used in GET endpoints
export async function GET(request: NextRequest) {
  // Authentication and authorization...
  
  // Use cached handler - automatically handles cache logic
  return getCachedBookings(request)
}
```

### Cache Invalidation in Mutations

```typescript
export async function POST(request: NextRequest) {
  // Create/update data...
  const booking = await prisma.booking.create({ data: bookingData })
  
  // Audit logging...
  await logAudit({ action: 'booking.create', actorId: userId })
  
  // Invalidate related caches
  await invalidateCache('BOOKING_CHANGED')
  
  return NextResponse.json({ booking })
}
```

### Custom Cache Configuration

```typescript
const customCachedHandler = withCache<ResponseType>(
  {
    key: 'custom-endpoint',
    ttl: 300,                    // 5 minutes fresh
    staleWhileRevalidate: 600,   // 10 minutes stale
    tenantAware: true,           // Isolate by tenant
    tags: ['tag1', 'tag2']       // Additional invalidation tags
  },
  async (request): Promise<ResponseType> => {
    // Data fetching logic
  }
)
```

## Monitoring and Debugging

### Cache Headers

Cached responses include diagnostic headers:
```
X-Cache-Status: HIT|MISS|STALE
X-Cache-Key: cache:tenant:key:hash
X-Cache-TTL: 180
X-Cache-Age: 45
```

### Development Mode

In development, caching can be disabled via environment:
```env
DISABLE_API_CACHE=true
```

### Cache Statistics

The system exposes cache metrics:
- Hit/miss ratios per endpoint
- Average response times
- Cache size and memory usage
- Invalidation event frequency

## Security Considerations

### Tenant Isolation

- Cache keys include tenant ID to prevent cross-tenant data leakage
- Authorization is enforced before cache lookup
- Tenant-aware invalidation prevents unauthorized access

### Sensitive Data

- No sensitive data (passwords, tokens) is cached
- Cache entries respect user permissions
- Automatic cache expiration prevents stale security contexts

### Rate Limiting

- Cache hits don't count against rate limits
- Prevents cache flooding attacks
- Graceful degradation under DoS conditions

## Future Enhancements

### Planned Improvements

1. **Redis Backend**: Replace in-memory cache with Redis for scalability
2. **Cache Warming**: Proactive cache population for critical endpoints
3. **Smart Prefetching**: Predictive cache loading based on usage patterns
4. **Distributed Invalidation**: Cross-instance cache invalidation
5. **Advanced Metrics**: Detailed performance analytics and alerting

### Configuration Management

1. **Dynamic TTL**: Adjust cache durations based on data volatility
2. **Circuit Breaker**: Automatic cache bypass under high error rates
3. **A/B Testing**: Cache strategy experimentation framework

This caching implementation provides significant performance improvements while maintaining data consistency and security. The stale-while-revalidate pattern ensures optimal user experience with minimal latency impact.