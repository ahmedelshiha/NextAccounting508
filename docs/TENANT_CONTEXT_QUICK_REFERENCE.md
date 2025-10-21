# Tenant Context - Quick Reference Guide

## Quick Start

### For Components
```typescript
import { useTenantId, useTenantContext } from '@/hooks/useTenantContext'

export function MyComponent() {
  // Get just the ID
  const tenantId = useTenantId()
  
  // Or get full context
  const { tenantId, tenantRole, availableTenants } = useTenantContext()
  
  return <div>Tenant: {tenantId}</div>
}
```

### For API Routes
```typescript
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'

export const GET = withTenantContext(async (request) => {
  const { tenantId, userId, role } = requireTenantContext()
  
  // Fetch data for this tenant
  const data = await prisma.items.findMany({
    where: { tenantId }
  })
  
  return NextResponse.json(data)
})
```

## Common Patterns

### Check if User is Admin
```typescript
import { useTenantAdmin } from '@/hooks/useTenantContext'

if (useTenantAdmin()) {
  // Show admin features
}
```

### Get All Accessible Tenants
```typescript
import { useAvailableTenants } from '@/hooks/useTenantContext'

const tenants = useAvailableTenants()
console.log(tenants) // Array of { id, slug, name, role }
```

### Check Access to Specific Tenant
```typescript
import { useCanAccessTenant } from '@/hooks/useTenantContext'

const hasAccess = useCanAccessTenant('tenant-123')
if (!hasAccess) {
  return <div>Access Denied</div>
}
```

### Listen to Tenant Changes
```typescript
import { useEffect } from 'react'
import { onTenantChanged } from '@/hooks/useTenantSync'

useEffect(() => {
  const unsubscribe = onTenantChanged(({ tenantId }) => {
    console.log('Switched to tenant:', tenantId)
    // Refetch data for new tenant
  })
  
  return unsubscribe
}, [])
```

### Fetch Data for Current Tenant
```typescript
import { useTenantId } from '@/hooks/useTenantContext'
import useSWR from 'swr'

export function DataList() {
  const tenantId = useTenantId()
  
  const { data } = useSWR(
    tenantId ? `/api/items?tenantId=${tenantId}` : null,
    fetcher
  )
  
  return <div>{/* render data */}</div>
}
```

### Manual API Call with Tenant
```typescript
const tenantId = useTenantId()

const response = await fetch('/api/data', {
  headers: {
    'x-tenant-id': tenantId || ''
  }
})
```

## Available Hooks

### `useTenantContext()`
Returns: `TenantContextData`
- `tenantId` - Current tenant ID
- `tenantSlug` - Tenant slug
- `tenantRole` - User's role in tenant
- `tenantName` - Human-friendly tenant name
- `availableTenants` - List of accessible tenants

### `useTenantId()`
Returns: `string | null`
- Current tenant ID only

### `useTenantRole()`
Returns: `string | null`
- User's role in current tenant

### `useTenantAdmin()`
Returns: `boolean`
- True if user is OWNER or ADMIN

### `useAvailableTenants()`
Returns: Array of tenant objects
- List of all tenants user can access

### `useCanAccessTenant(tenantId)`
Returns: `boolean`
- True if user has access to specific tenant

### `useTenantSync()`
Returns: `void`
- Initializes background tenant sync
- Call once in root component or provider

## Server-Side Utilities

### `requireTenantContext()`
```typescript
import { requireTenantContext } from '@/lib/tenant-utils'

const { tenantId, userId, role, tenantRole } = requireTenantContext()
```
Throws error if context not available.

### `getTenantFilter(field?)`
```typescript
import { getTenantFilter } from '@/lib/tenant-utils'

const filter = getTenantFilter('tenantId')
// Returns: { tenantId: 'current-tenant-id' }
```

### `withTenantContext(handler, options?)`
```typescript
export const GET = withTenantContext(
  async (request) => { /* handler */ },
  { requireAuth: true, requireTenantAdmin: false }
)
```

## API Wrapper Options

```typescript
interface ApiWrapperOptions {
  requireAuth?: boolean           // Default: true
  requireSuperAdmin?: boolean     // Default: false
  requireTenantAdmin?: boolean    // Default: false
  allowedRoles?: string[]         // Default: []
}
```

## Environment Variables

```bash
# Enable multi-tenancy
MULTI_TENANCY_ENABLED=true

# Strict tenant isolation
MULTI_TENANCY_STRICT=true

# Subdomain suffixes for multi-tenancy
MULTI_TENANCY_SUFFIXES=example.com,app.com
```

## Session Structure

```typescript
session.user = {
  id: 'user-id',
  email: 'user@example.com',
  name: 'User Name',
  role: 'ADMIN',
  image: 'https://...',
  tenantId: 'tenant-id',
  tenantSlug: 'tenant-slug',
  tenantRole: 'OWNER',  // Role in this specific tenant
  availableTenants: [
    {
      id: 'tenant-1',
      slug: 'tenant-1-slug',
      name: 'Tenant 1',
      role: 'OWNER'
    },
    // ... more tenants
  ]
}
```

## Database Queries

### Always filter by tenant
```typescript
// ✅ Good
const items = await prisma.item.findMany({
  where: { tenantId }
})

// ❌ Bad
const items = await prisma.item.findMany()
```

### Use tenant filter utility
```typescript
import { getTenantFilter } from '@/lib/tenant-utils'

const filter = getTenantFilter()
const items = await prisma.item.findMany({
  where: { ...filter, status: 'active' }
})
```

## Testing

### Mock Tenant in Tests
```typescript
import { tenantContext } from '@/lib/tenant-context'

await tenantContext.run(
  {
    tenantId: 'test-tenant',
    userId: 'test-user',
    role: 'ADMIN',
    timestamp: new Date(),
  },
  async () => {
    // Code here has tenant context
  }
)
```

### Mock Session in Components
```typescript
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => ({
    data: {
      user: {
        tenantId: 'test-tenant',
        tenantRole: 'ADMIN'
      }
    }
  }))
}))
```

## Debugging

### Log Tenant Context
```typescript
import { tenantContext } from '@/lib/tenant-context'

try {
  const ctx = tenantContext.getContext()
  console.log('Tenant:', ctx.tenantId)
} catch (err) {
  console.log('No tenant context')
}
```

### Check Session Tenant
```typescript
const { data: session } = useSession()
console.log('Session tenant:', (session?.user as any)?.tenantId)
```

### Enable Debug Mode
```bash
DEBUG=tenant:* npm run dev
```

## Common Issues

### Issue: useTenantId() returns null
**Solution:** 
- Check if component is wrapped in SessionProvider
- Verify user is authenticated
- Check user has tenant membership

### Issue: API call doesn't include tenant
**Solution:**
- Manually add header: `'x-tenant-id': tenantId`
- Or use API wrapper with tenant support
- Check TenantSyncProvider is in component tree

### Issue: Tenant changes don't reflect in UI
**Solution:**
- Call `useTenantSync()` in root component
- Check useSession() is returning updated data
- May need to call `update()` from useSession

## File Locations

| Purpose | Location |
|---------|----------|
| Hooks | `src/hooks/useTenantContext.ts` |
| Sync Hook | `src/hooks/useTenantSync.ts` |
| Provider | `src/components/providers/TenantSyncProvider.tsx` |
| API Wrapper | `src/lib/api-wrapper.ts` |
| Utilities | `src/lib/tenant-utils.ts` |
| Context | `src/lib/tenant-context.ts` |
| Tenant Resolution | `src/lib/tenant.ts` |
| Auth Config | `src/lib/auth.ts` |

## Documentation

| Document | Purpose |
|----------|---------|
| `docs/TENANT_CONTEXT_SYSTEM.md` | Complete system documentation |
| `docs/TENANT_CONTEXT_IMPLEMENTATION.md` | Implementation summary |
| `docs/TENANT_CONTEXT_QUICK_REFERENCE.md` | This file - quick reference |

## Next Steps

1. ✅ Use `useTenantId()` in components
2. ✅ Access tenant via hooks instead of props
3. ✅ Let TenantSyncProvider handle background sync
4. ✅ API wrapper auto-includes tenant context
5. ✅ No manual tenant selection needed

That's it! The system handles everything automatically.
