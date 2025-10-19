# Automatic Tenant Context System

## Overview

The application uses an automatic tenant context resolution system that works systematically in the background without requiring manual tenant selection or switching. The tenant context is established automatically from multiple sources and maintained throughout the user's session.

## Architecture

### 1. Server-Side Tenant Resolution (API Wrapper)

The `withTenantContext` middleware in `src/lib/api-wrapper.ts` automatically:

1. **Extracts session from next-auth**
   - Uses JWT-based session strategy
   - Persists tenant information in the token

2. **Resolves tenant ID from multiple sources** (in priority order):
   - Session user's `tenantId` (primary - from auth flow)
   - Request headers: `x-tenant-id`, `x-tenant-slug`
   - Subdomain extraction (multi-tenancy mode)
   - User's default tenant membership

3. **Establishes AsyncLocal context**
   - Uses Node.js `AsyncLocalStorage` for request-scoped context
   - Available to all downstream code without passing context through function parameters
   - Automatically cleared after request completion

4. **Validates tenant access**
   - Verifies tenant cookie signature if present
   - Ensures user has access to the resolved tenant
   - Enforces role-based access (OWNER, ADMIN, MEMBER)

### 2. Client-Side Tenant Context

The client-side tenant information comes from the next-auth session:

```typescript
// Session contains tenant data
const { data: session } = useSession()
session.user.tenantId          // Current tenant ID
session.user.tenantSlug        // Tenant slug
session.user.tenantRole        // User's role in tenant
session.user.availableTenants  // List of accessible tenants
```

### 3. Authentication Flow

```
Login Request
    ↓
Auth Provider validates credentials
    ↓
Resolve tenant (from request or defaults)
    ↓
Fetch user from database (tenant-scoped)
    ↓
Check MFA if required
    ↓
Load tenant memberships
    ↓
Return user with tenant metadata
    ↓
JWT token includes: tenantId, tenantSlug, tenantRole, availableTenants
    ↓
Session callback populates session with tenant data
    ↓
Client receives authenticated session with tenant context
```

## Usage

### Using Tenant Context in Components

#### Get Current Tenant ID

```typescript
import { useTenantContext, useTenantId } from '@/hooks/useTenantContext'

export function MyComponent() {
  const tenantId = useTenantId()
  
  return <div>Current Tenant: {tenantId}</div>
}
```

#### Access All Tenant Information

```typescript
const tenant = useTenantContext()
console.log(tenant.tenantId)       // Current tenant
console.log(tenant.tenantSlug)     // Tenant slug
console.log(tenant.tenantRole)     // User's role in tenant
console.log(tenant.availableTenants) // List of accessible tenants
```

#### Check Tenant Admin Status

```typescript
const isAdmin = useTenantAdmin()
if (isAdmin) {
  // Show admin features
}
```

### Using Tenant Context in API Routes

The tenant context is automatically available via `requireTenantContext()`:

```typescript
import { requireTenantContext } from '@/lib/tenant-utils'

export const GET = withTenantContext(async (request, context) => {
  const { tenantId, userId, role } = requireTenantContext()
  
  // Database queries automatically filtered by tenant
  const data = await prisma.items.findMany({
    where: { tenantId }
  })
  
  return NextResponse.json(data)
})
```

### Tenant Synchronization

The `useTenantSync` hook automatically:

1. Monitors session changes
2. Detects tenant context updates
3. Emits `tenantChanged` events
4. Refreshes on tab visibility changes

```typescript
import { useTenantSync } from '@/hooks/useTenantSync'

export function AppLayout() {
  // Automatically syncs tenant context
  useTenantSync()
  
  return <div>App content</div>
}
```

### Listening to Tenant Changes

```typescript
import { onTenantChanged } from '@/hooks/useTenantSync'

useEffect(() => {
  const unsubscribe = onTenantChanged(({ tenantId, tenantSlug, tenantRole }) => {
    console.log('Tenant changed to:', tenantId)
    // Refetch data for new tenant
  })
  
  return unsubscribe
}, [])
```

## Tenant Resolution Precedence

### Server-Side API Requests

1. Session `user.tenantId` (primary)
2. `x-tenant-id` header
3. `x-tenant-slug` header
4. Subdomain extraction (multi-tenancy enabled)
5. User's first available tenant membership

### Client-Side Requests

Must include tenant context in API calls:

```typescript
import { useTenantId } from '@/hooks/useTenantContext'

function MyComponent() {
  const tenantId = useTenantId()
  
  const fetchData = async () => {
    const response = await fetch('/api/data', {
      headers: {
        'x-tenant-id': tenantId || ''
      }
    })
  }
}
```

## Multi-Tenancy Support

### Environment Variables

- `MULTI_TENANCY_ENABLED=true` - Enable multi-tenancy mode
- `MULTI_TENANCY_STRICT=true` - Enforce strict tenant isolation
- `MULTI_TENANCY_SUFFIXES=example.com,app.com` - Tenant subdomain suffixes

### Subdomain Extraction

When multi-tenancy is enabled, the system automatically extracts tenant from subdomain:

- `tenant-name.example.com` → tenant ID: `tenant-name`
- `www.example.com` → no tenant (apex)
- `myapp.netlify.app` → subdomain extraction based on suffix

### Tenant Identification Strategies

1. **Session-Based** (Recommended)
   - User logs in with tenant-scoped credentials
   - Tenant ID stored in JWT token
   - Most secure and reliable

2. **Subdomain-Based**
   - Tenant identified by subdomain
   - Requires DNS wild-card configuration
   - Useful for white-label multi-tenancy

3. **Header-Based**
   - Tenant ID passed via `x-tenant-id` header
   - Used for API clients and integrations
   - Should be used with authentication

## Testing

### Mocking Tenant Context in Tests

```typescript
import { tenantContext } from '@/lib/tenant-context'

const mockContext = {
  tenantId: 'test-tenant-123',
  userId: 'test-user',
  role: 'ADMIN',
  timestamp: new Date(),
}

await tenantContext.run(mockContext, () => {
  // Code here has access to tenant context
})
```

### Testing API Routes with Tenant Context

```typescript
vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn().mockResolvedValue({
    user: {
      id: 'user-1',
      tenantId: 'tenant-1',
      tenantRole: 'ADMIN',
      email: 'admin@example.com'
    }
  })
}))
```

## Database Considerations

### Tenant Filtering

All database queries should filter by tenant:

```typescript
// Good - filters by tenant
const items = await prisma.item.findMany({
  where: { tenantId }
})

// Bad - no tenant filtering
const items = await prisma.item.findMany()
```

### Tenant Hooks in Prisma

Use tenant utilities to automatically apply filters:

```typescript
import { getTenantFilter } from '@/lib/tenant-utils'

const filter = getTenantFilter('tenantId')
const items = await prisma.item.findMany({ where: filter })
```

## Debugging

### Enable Debug Logging

Set environment variable: `DEBUG=tenant:*`

### Check Tenant Context at Runtime

```typescript
import { tenantContext } from '@/lib/tenant-context'

try {
  const ctx = tenantContext.getContext()
  console.log('Current tenant:', ctx.tenantId)
} catch (err) {
  console.log('No tenant context available')
}
```

### Inspect Session Tenant Data

```typescript
const { data: session } = useSession()
console.log('Session tenant:', {
  tenantId: (session?.user as any)?.tenantId,
  tenantSlug: (session?.user as any)?.tenantSlug,
  tenantRole: (session?.user as any)?.tenantRole,
})
```

## Common Patterns

### Tenant-Aware API Client

```typescript
import { useTenantId } from '@/hooks/useTenantContext'

export function useApiClient() {
  const tenantId = useTenantId()
  
  return {
    fetch: async (path: string, options = {}) => {
      const headers = {
        ...options.headers,
        'x-tenant-id': tenantId || ''
      }
      return fetch(path, { ...options, headers })
    }
  }
}
```

### Tenant-Scoped Data Fetching

```typescript
import { useTenantId } from '@/hooks/useTenantContext'
import useSWR from 'swr'

function MyComponent() {
  const tenantId = useTenantId()
  
  const { data } = useSWR(
    tenantId ? `/api/items?tenantId=${tenantId}` : null,
    fetcher
  )
  
  return <div>{/* render data */}</div>
}
```

### Tenant Validation in Forms

```typescript
import { useTenantAdmin } from '@/hooks/useTenantContext'

function AdminPanel() {
  const isAdmin = useTenantAdmin()
  
  if (!isAdmin) {
    return <div>You don't have permission to access this panel</div>
  }
  
  return <div>Admin controls</div>
}
```

## Migration Guide

### From Manual Tenant Switching to Automatic

**Before (Manual Switching):**
```typescript
const [selectedTenant, setSelectedTenant] = useState<string | null>(null)

// User manually selects tenant
<TenantSwitcher onChange={setSelectedTenant} />
```

**After (Automatic):**
```typescript
// Tenant is automatically determined from session
const tenantId = useTenantId()
```

### Removing Manual Tenant Selection

1. Remove `TenantSwitcher` component from layouts
2. Use `useTenantContext()` hook for tenant access
3. Ensure API calls include tenant in headers
4. Update database queries to use tenant filters

## Troubleshooting

### Issue: Tenant Context Not Available

**Cause:** Code is not running within a request handler wrapped with `withTenantContext`

**Solution:**
```typescript
// ✅ Correct - inside API route wrapped with withTenantContext
export const GET = withTenantContext(async (request) => {
  const { tenantId } = requireTenantContext()
})

// ❌ Wrong - outside of wrapped context
const { tenantId } = requireTenantContext() // Error!
```

### Issue: User Has No Tenant

**Cause:** User created without tenant membership

**Solution:**
1. Check `tenantMemberships` table
2. Ensure user has at least one membership
3. Set `isDefault: true` for the default tenant

### Issue: Wrong Tenant Data in Session

**Cause:** Session token not refreshed after tenant update

**Solution:**
```typescript
// Force session refresh
await update() // from useSession
```

## Performance Considerations

1. **Tenant context is request-scoped** - No memory leaks
2. **Session caching** - Tenant data cached in JWT token
3. **Header-based resolution** - Fast subdomain/header extraction
4. **No database calls** for tenant resolution in most cases

## Security

1. **Tenant cookie signature validation** - Prevents tampering
2. **Session version checking** - Detects invalidated sessions
3. **Role-based access** - Enforces tenant membership roles
4. **Subdomain isolation** - Prevents cross-tenant access via DNS
5. **Header validation** - Prevents header-based tenant bypass

## Future Enhancements

1. Tenant-aware caching strategies
2. Cross-tenant data sync (with proper isolation)
3. Tenant-specific configurations
4. Advanced tenant membership rules
5. Audit logging for tenant changes
