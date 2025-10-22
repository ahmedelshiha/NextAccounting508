# Tenant Context System

## Overview
The tenant context system ensures complete data isolation between tenants in the multi-tenant application.

## Architecture

### Middleware
All API routes are wrapped with `withTenantContext()` which:
- Extracts tenant information from session
- Validates tenant signature
- Sets tenant context for the request
- Ensures tenant context is available to all downstream code

### Service Layer
All services use the `getTenantId()` helper pattern:
```typescript
private getTenantId(providedTenantId?: string): string {
  if (providedTenantId) return providedTenantId;
  const { tenantContext } = require('@/lib/tenant-context') as any
  const ctx = tenantContext.getContextOrNull?.() ?? null
  if (!ctx?.tenantId) throw new Error('Tenant context required');
  return ctx.tenantId;
}
```

### Database Queries
All Prisma queries MUST include tenant filter:
```typescript
const ctx = requireTenantContext()
const users = await prisma.user.findMany({
  where: { tenantId: ctx.tenantId },
});
```

### Testing
Tests use helper functions from `tests/helpers/`:
- `setupTestTenantContext()` - Set tenant context for tests
- `createTestRequest()` - Create test requests with tenant headers
- `callRoute()` - Call route handlers in tests

## Security Considerations
1. Never trust client headers – always use session-based tenant context
2. Return 404 for cross-tenant access – don't leak resource existence
3. Verify ownership before updates – check tenant before any write
4. Filter all queries – every database query must include tenantId

## Common Patterns

### Route Handler
```typescript
export const GET = withTenantContext(async (req: NextRequest) => {
  const ctx = requireTenantContext()
  if (!ctx?.tenantId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  // ...
})
```

### Service Method
```typescript
async getResource(id: string, tenantId?: string) {
  const actualTenantId = this.getTenantId(tenantId);
  const resource = await prisma.resource.findUnique({ where: { id } });
  if (!resource || (resource as any).tenantId !== actualTenantId) return null;
  return resource;
}
```

### Test Setup
```typescript
beforeEach(() => {
  vi.clearAllMocks();
  setupTestTenantContext({ tenantId: 'test-tenant', userId: 'test-user', userRole: 'ADMIN' });
});
```

## Troubleshooting

### "Tenant context required" error
- Ensure route is wrapped with `withTenantContext()`
- Verify session contains tenant information
- Check middleware is executing

### Cross-tenant data leak
- Add `tenantId` filter to all queries
- Verify ownership before updates/deletes
- Use a `getTenantId()` helper in services

### Tests failing
- Call `setupTestTenantContext()` in `beforeEach()`
- Use `createTestRequest()` for all test requests
- Clear mocks between tests with `vi.clearAllMocks()`
