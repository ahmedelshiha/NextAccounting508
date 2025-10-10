# Tenant Context Implementation - Automated Task List

# 🧠 Tenant Context Tasks Memory

## ✅ Completed Tasks
- Created tests/helpers/tenant-context.ts
- Created tests/helpers/request.ts
- Added tests/setup.ts and included in vitest.config.ts
- Added ETag and 304 handling to admin services GET
- Created docs/TENANT_CONTEXT.md
- Created docs/DEPLOYMENT_CHECKLIST.md

## 🚧 In Progress Tasks
- Audit all API routes to ensure withTenantContext wrapping and tenant validation

## 💡 Next Suggestions / Ideas
- Review services for getTenantId() helper and tenant scoping; add where missing
- Update failing tests to use new helpers; migrate existing tests incrementally
- Implement admin service-clone duplicate-name 409 and status transition tests per plan
- Run full test suite; add 404-on-cross-tenant checks where needed

**Project:** NextAccounting403  
**Issue:** Test failures due to missing tenant context system  
**Priority:** Critical  
**Estimated Duration:** 24-30 hours  
**Last Updated:** October 10, 2025

---

## 🎯 Executive Summary

**Problem:** 93 test failures caused by incomplete tenant context implementation across the application.

**Solution:** Systematic implementation of tenant context system across test infrastructure, route handlers, service layer, and security components.

**Success Criteria:** All 315 tests passing with proper tenant isolation and security enforcement.

## Progress Log
- [2025-10-10] Completed Task 1.1: Created tests/helpers/tenant-context.ts
- [2025-10-10] Completed Task 1.2: Created tests/helpers/request.ts
- [2025-10-10] Completed Task 1.3: Added tests/setup.ts; updated vitest.config.ts setupFiles to include it
- [2025-10-10] Completed Task 5.5: Added ETag and 304 handling to admin services GET
- [2025-10-10] Completed Task 6.4: Created docs/TENANT_CONTEXT.md
- [2025-10-10] Completed Task 6.5: Created docs/DEPLOYMENT_CHECKLIST.md

---

## Phase 1: Test Infrastructure Setup

**Duration:** 4 hours  
**Priority:** Critical - Must complete before other phases  
**Dependencies:** None

### Task 1.1: Create Tenant Context Test Helper

**File:** `tests/helpers/tenant-context.ts`

**Action:** Create new file with the following implementation:

```typescript
import { vi } from 'vitest';
import type { TenantContext } from '@/lib/tenant-context';

export const DEFAULT_TEST_TENANT = 'test-tenant';
export const DEFAULT_TEST_USER = 'test-user';

export function createMockTenantContext(overrides?: Partial<TenantContext>): TenantContext {
  return {
    tenantId: DEFAULT_TEST_TENANT,
    userId: DEFAULT_TEST_USER,
    userRole: 'ADMIN',
    permissions: ['*'],
    organizationId: 'test-org',
    ...overrides,
  };
}

export function mockTenantContextModule() {
  vi.mock('@/lib/tenant-context', () => ({
    getTenantContext: vi.fn(() => createMockTenantContext()),
    withTenantContext: vi.fn((handler) => handler),
    setTenantContext: vi.fn(),
    clearTenantContext: vi.fn(),
  }));
}

export function setupTestTenantContext(context?: Partial<TenantContext>) {
  const { getTenantContext } = require('@/lib/tenant-context');
  getTenantContext.mockReturnValue(createMockTenantContext(context));
}
```

**Verification:**
- File exists at `tests/helpers/tenant-context.ts`
- All exports are properly typed
- No TypeScript errors

---

### Task 1.2: Create Test Request Helper

**File:** `tests/helpers/request.ts`

**Action:** Create new file with the following implementation:

```typescript
import { NextRequest } from 'next/server';
import { createMockTenantContext } from './tenant-context';

export function createTestRequest(
  url: string,
  options: {
    method?: string;
    body?: any;
    headers?: Record<string, string>;
    tenantId?: string;
    userId?: string;
    cookies?: Record<string, string>;
  } = {}
): NextRequest {
  const {
    method = 'GET',
    body,
    headers = {},
    tenantId = 'test-tenant',
    userId = 'test-user',
    cookies = {},
  } = options;

  const requestHeaders = new Headers({
    'Content-Type': 'application/json',
    'x-tenant-id': tenantId,
    'x-user-id': userId,
    ...headers,
  });

  if (Object.keys(cookies).length > 0) {
    const cookieString = Object.entries(cookies)
      .map(([key, value]) => `${key}=${value}`)
      .join('; ');
    requestHeaders.set('Cookie', cookieString);
  }

  const request = new NextRequest(url, {
    method,
    headers: requestHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });

  return request;
}

export async function callRoute(
  handler: Function,
  request: NextRequest,
  params?: any
) {
  try {
    const response = await handler(request, params);
    const data = await response.json();
    return {
      status: response.status,
      data,
      headers: response.headers,
    };
  } catch (error) {
    console.error('Route call error:', error);
    throw error;
  }
}
```

**Verification:**
- File exists at `tests/helpers/request.ts`
- Both functions are exported
- No TypeScript errors

---

### Task 1.3: Create Global Test Setup

**File:** `tests/setup.ts`

**Action:** Create new file with the following implementation:

```typescript
import { vi } from 'vitest';
import { mockTenantContextModule } from './helpers/tenant-context';

mockTenantContextModule();

vi.mock('@/lib/prisma', () => {
  const mockPrisma = {
    user: {
      findMany: vi.fn(() => Promise.resolve([])),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(() => Promise.resolve(0)),
    },
    service: {
      findMany: vi.fn(() => Promise.resolve([])),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(() => Promise.resolve(0)),
    },
    booking: {
      findMany: vi.fn(() => Promise.resolve([])),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(() => Promise.resolve(0)),
    },
    serviceRequest: {
      findMany: vi.fn(() => Promise.resolve([])),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(() => Promise.resolve(0)),
    },
  };

  return {
    default: mockPrisma,
    __esModule: true,
  };
});

vi.mock('@/lib/rate-limit', async () => {
  const actual = await vi.importActual('@/lib/rate-limit');
  return {
    ...actual,
    applyRateLimit: vi.fn(() => Promise.resolve(true)),
    checkRateLimit: vi.fn(() => Promise.resolve({ allowed: true })),
  };
});

if (typeof window !== 'undefined') {
  global.localStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn(),
  };
}
```

**Verification:**
- File exists at `tests/setup.ts`
- All mocks are configured
- No runtime errors

---

### Task 1.4: Update Vitest Configuration

**File:** `vitest.config.ts`

**Action:** Update file with the following configuration:

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**Verification:**
- `environment` is set to `'jsdom'`
- `setupFiles` points to `'./tests/setup.ts'`
- `globals` is `true`
- Configuration compiles without errors

---

## Phase 2: Route Handler Updates

**Duration:** 8 hours  
**Priority:** High  
**Dependencies:** Phase 1 complete

### Task 2.1: Update Admin Services Route

**File:** `src/app/api/admin/services/route.ts`

**Action:** Wrap all exported handlers with `withTenantContext` and add tenant validation:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { withTenantContext, getTenantContext } from '@/lib/tenant-context';
import { ServicesService } from '@/services/services.service';
import { requireAuth } from '@/lib/auth-helpers';

export const POST = withTenantContext(async (req: NextRequest) => {
  try {
    const session = await requireAuth(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const context = getTenantContext();
    if (!context?.tenantId) {
      return NextResponse.json({ error: 'Tenant context required' }, { status: 400 });
    }

    const body = await req.json();
    const servicesService = new ServicesService();
    const service = await servicesService.createService({
      ...body,
      tenantId: context.tenantId,
    });

    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    console.error('services POST error', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    );
  }
});

export const GET = withTenantContext(async (req: NextRequest) => {
  const context = getTenantContext();
  if (!context?.tenantId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const servicesService = new ServicesService();
  const services = await servicesService.listServices({
    tenantId: context.tenantId,
  });

  const response = NextResponse.json(services);
  response.headers.set('X-Total-Count', services.length.toString());
  
  return response;
});
```

**Verification:**
- Import statement for `withTenantContext` and `getTenantContext` added
- All exports (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`) wrapped with `withTenantContext`
- Tenant context validation added to each handler
- `tenantId` explicitly passed to service methods

---

### Task 2.2: Update Admin Users Route

**File:** `src/app/api/admin/users/route.ts`

**Action:** Apply tenant context wrapper pattern:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { withTenantContext, getTenantContext } from '@/lib/tenant-context';
import { requireAuth, requirePermission } from '@/lib/auth-helpers';
import prisma from '@/lib/prisma';

export const GET = withTenantContext(async (req: NextRequest) => {
  try {
    const session = await requireAuth(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const context = getTenantContext();
    if (!context?.tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const hasPermission = await requirePermission(context, 'users:read');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const role = searchParams.get('role');

    const where: any = {
      tenantId: context.tenantId,
    };

    if (role) {
      where.role = role;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          active: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    const response = NextResponse.json(users, { status: 200 });
    response.headers.set('X-Total-Count', total.toString());
    response.headers.set('X-Limit', limit.toString());
    response.headers.set('X-Offset', offset.toString());

    return response;
  } catch (error) {
    console.error('GET /api/admin/users error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    );
  }
});

export const POST = withTenantContext(async (req: NextRequest) => {
  try {
    const session = await requireAuth(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const context = getTenantContext();
    if (!context?.tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const hasPermission = await requirePermission(context, 'users:create');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();

    if (!body.email || !body.name) {
      return NextResponse.json(
        { error: 'Email and name are required' },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findFirst({
      where: {
        email: body.email,
        tenantId: context.tenantId,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    const user = await prisma.user.create({
      data: {
        ...body,
        tenantId: context.tenantId,
        createdBy: context.userId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        createdAt: true,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('POST /api/admin/users error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    );
  }
});
```

**Verification:**
- All handlers wrapped with `withTenantContext`
- Tenant context validated before database operations
- All Prisma queries include `tenantId` filter
- Proper status codes returned (401, 403, 400, 409)

---

### Task 2.3: Update Admin Bookings Route

**File:** `src/app/api/admin/bookings/route.ts`

**Action:** Apply tenant context wrapper and add conflict detection:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { withTenantContext, getTenantContext } from '@/lib/tenant-context';
import { requireAuth } from '@/lib/auth-helpers';
import prisma from '@/lib/prisma';

export const GET = withTenantContext(async (req: NextRequest) => {
  try {
    const session = await requireAuth(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const context = getTenantContext();
    if (!context?.tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');
    const sortBy = searchParams.get('sortBy') || 'scheduledAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const where: any = {
      tenantId: context.tenantId,
    };

    if (status) {
      where.status = status;
    }

    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy,
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          service: {
            select: {
              id: true,
              name: true,
              duration: true,
            },
          },
        },
      }),
      prisma.booking.count({ where }),
    ]);

    const response = NextResponse.json(bookings, { status: 200 });
    response.headers.set('X-Total-Count', total.toString());

    return response;
  } catch (error) {
    console.error('GET /api/admin/bookings error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    );
  }
});

export const POST = withTenantContext(async (req: NextRequest) => {
  try {
    const session = await requireAuth(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const context = getTenantContext();
    if (!context?.tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();

    if (!body.clientId || !body.serviceId || !body.scheduledAt) {
      return NextResponse.json(
        { error: 'clientId, serviceId, and scheduledAt are required' },
        { status: 400 }
      );
    }

    const client = await prisma.user.findFirst({
      where: {
        id: body.clientId,
        tenantId: context.tenantId,
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found in this tenant' },
        { status: 404 }
      );
    }

    const service = await prisma.service.findFirst({
      where: {
        id: body.serviceId,
        tenantId: context.tenantId,
        active: true,
      },
    });

    if (!service) {
      return NextResponse.json(
        { error: 'Service not found or inactive' },
        { status: 404 }
      );
    }

    const conflict = await prisma.booking.findFirst({
      where: {
        tenantId: context.tenantId,
        serviceId: body.serviceId,
        scheduledAt: new Date(body.scheduledAt),
        status: { not: 'CANCELLED' },
      },
    });

    if (conflict) {
      return NextResponse.json(
        { 
          error: 'Booking conflict',
          message: 'This time slot is already booked',
          conflictingBookingId: conflict.id,
        },
        { status: 409 }
      );
    }

    const booking = await prisma.booking.create({
      data: {
        clientId: body.clientId,
        serviceId: body.serviceId,
        scheduledAt: new Date(body.scheduledAt),
        notes: body.notes,
        tenantId: context.tenantId,
        status: 'PENDING',
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            duration: true,
            price: true,
          },
        },
      },
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error('POST /api/admin/bookings error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    );
  }
});
```

**Verification:**
- Conflict detection returns 409 status
- Client and service ownership verified before booking creation
- All queries scoped to tenant
- Proper error messages returned

---

### Task 2.4: Update Admin Service Requests Route

**File:** `src/app/api/admin/service-requests/route.ts`

**Action:** Apply tenant context wrapper:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { withTenantContext, getTenantContext } from '@/lib/tenant-context';
import { requireAuth } from '@/lib/auth-helpers';
import prisma from '@/lib/prisma';

export const GET = withTenantContext(async (req: NextRequest) => {
  const context = getTenantContext();
  if (!context?.tenantId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');
  const status = searchParams.get('status');

  const where: any = {
    tenantId: context.tenantId,
  };

  if (status) {
    where.status = status;
  }

  const [requests, total] = await Promise.all([
    prisma.serviceRequest.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.serviceRequest.count({ where }),
  ]);

  const response = NextResponse.json(requests);
  response.headers.set('X-Total-Count', total.toString());
  
  return response;
});

export const POST = withTenantContext(async (req: NextRequest) => {
  const context = getTenantContext();
  if (!context?.tenantId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();

  const request = await prisma.serviceRequest.create({
    data: {
      ...body,
      tenantId: context.tenantId,
      status: 'PENDING',
    },
  });

  return NextResponse.json(request, { status: 201 });
});
```

**Verification:**
- All handlers wrapped
- Tenant context validated
- All queries filtered by tenant

---

### Task 2.5: Update Admin Service Request Detail Route

**File:** `src/app/api/admin/service-requests/[id]/route.ts`

**Action:** Add tenant ownership verification:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { withTenantContext, getTenantContext } from '@/lib/tenant-context';
import prisma from '@/lib/prisma';

export const GET = withTenantContext(async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  const context = getTenantContext();
  if (!context?.tenantId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const request = await prisma.serviceRequest.findUnique({
    where: { id: params.id },
  });

  if (!request || request.tenantId !== context.tenantId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(request);
});

export const PATCH = withTenantContext(async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  const context = getTenantContext();
  if (!context?.tenantId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const existing = await prisma.serviceRequest.findUnique({
    where: { id: params.id },
  });

  if (!existing || existing.tenantId !== context.tenantId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await req.json();

  const updated = await prisma.serviceRequest.update({
    where: { id: params.id },
    data: body,
  });

  return NextResponse.json(updated);
});

export const DELETE = withTenantContext(async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  const context = getTenantContext();
  if (!context?.tenantId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const existing = await prisma.serviceRequest.findUnique({
    where: { id: params.id },
  });

  if (!existing || existing.tenantId !== context.tenantId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await prisma.serviceRequest.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ success: true }, { status: 200 });
});
```

**Verification:**
- Ownership verified before update/delete
- Returns 404 (not 400) for cross-tenant access
- All handlers wrapped

---

### Task 2.6: Update Portal Service Requests Route

**File:** `src/app/api/portal/service-requests/route.ts`

**Action:** Ensure session tenant used, not forged headers:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { withTenantContext, getTenantContext } from '@/lib/tenant-context';
import prisma from '@/lib/prisma';

export const GET = withTenantContext(async (req: NextRequest) => {
  const context = getTenantContext();
  if (!context?.tenantId || !context?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const requests = await prisma.serviceRequest.findMany({
    where: {
      tenantId: context.tenantId,
      clientId: context.userId,
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(requests);
});

export const POST = withTenantContext(async (req: NextRequest) => {
  const context = getTenantContext();
  if (!context?.tenantId || !context?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();

  const request = await prisma.serviceRequest.create({
    data: {
      ...body,
      tenantId: context.tenantId,
      clientId: context.userId,
      status: 'PENDING',
    },
  });

  return NextResponse.json(request, { status: 201 });
});
```

**Verification:**
- Uses `context.tenantId` from session, not headers
- User can only see their own requests
- Forged headers ignored

---

### Task 2.7: Update Team Management Route

**File:** `src/app/api/admin/team-management/route.ts`

**Action:** Add tenant context wrapper:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { withTenantContext, getTenantContext } from '@/lib/tenant-context';
import prisma from '@/lib/prisma';

export const GET = withTenantContext(async (req: NextRequest) => {
  const context = getTenantContext();
  if (!context?.tenantId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const teamMembers = await prisma.user.findMany({
    where: {
      tenantId: context.tenantId,
      role: { in: ['TEAM_MEMBER', 'TEAM_LEAD'] },
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
    },
  });

  return NextResponse.json(teamMembers);
});
```

**Verification:**
- Handler wrapped with `withTenantContext`
- Query filtered by tenant
- Only returns team members for current tenant

---

## Phase 3: Service Layer Updates

**Duration:** 6 hours  
**Priority:** High  
**Dependencies:** Phase 2 complete

### Task 3.1: Update Services Service

**File:** `src/services/services.service.ts`

**Action:** Add tenant context support:

```typescript
import prisma from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenant-context';

export class ServicesService {
  private getTenantId(providedTenantId?: string): string {
    if (providedTenantId) {
      return providedTenantId;
    }

    const context = getTenantContext();
    if (!context?.tenantId) {
      throw new Error('Tenant context required to create service');
    }

    return context.tenantId;
  }

  async createService(data: any) {
    const tenantId = this.getTenantId(data.tenantId);

    return await prisma.service.create({
      data: {
        ...data,
        tenantId,
      },
    });
  }

  async listServices(options: { tenantId?: string } = {}) {
    const tenantId = this.getTenantId(options.tenantId);

    return await prisma.service.findMany({
      where: {
        tenantId,
        active: true,
      },
    });
  }

  async getService(id: string, tenantId?: string) {
    const actualTenantId = this.getTenantId(tenantId);

    const service = await prisma.service.findUnique({
      where: { id },
    });

    if (service && service.tenantId !== actualTenantId) {
      throw new Error('Service not found');
    }

    return service;
  }

  async updateService(id: string, data: any, tenantId?: string) {
    const actualTenantId = this.getTenantId(tenantId);

    await this.getService(id, actualTenantId);

    return await prisma.service.update({
      where: { id },
      data,
    });
  }

  async deleteService(id: string, tenantId?: string) {
    const actualTenantId = this.getTenantId(tenantId);

    await this.getService(id, actualTenantId);

    return await prisma.service.delete({
      where: { id },
    });
  }
}
```

**Verification:**
- `getTenantId()` helper method added
- All methods accept optional `tenantId` parameter
- Falls back to context if not provided
- Ownership verification before updates/deletes

---

### Task 3.2: Update Bookings Service

**File:** `src/services/bookings.service.ts`

**Action:** Add tenant context and conflict detection:

```typescript
import prisma from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenant-context';

export class BookingsService {
  private getTenantId(providedTenantId?: string): string {
    if (providedTenantId) {
      return providedTenantId;
    }

    const context = getTenantContext();
    if (!context?.tenantId) {
      throw new Error('Tenant context required for bookings operations');
    }

    return context.tenantId;
  }

  async checkConflict(params: {
    serviceId: string;
    scheduledAt: Date;
    tenantId?: string;
    excludeBookingId?: string;
  }): Promise<boolean> {
    const tenantId = this.getTenantId(params.tenantId);

    const conflict = await prisma.booking.findFirst({
      where: {
        tenantId,
        serviceId: params.serviceId,
        scheduledAt: params.scheduledAt,
        status: { not: 'CANCELLED' },
        ...(params.excludeBookingId && {
          id: { not: params.excludeBookingId },
        }),
      },
    });

    return !!conflict;
  }

  async createBooking(data: {
    clientId: string;
    serviceId: string;
    scheduledAt: Date;
    notes?: string;
    tenantId?: string;
  }) {
    const tenantId = this.getTenantId(data.tenantId);

    const hasConflict = await this.checkConflict({
      serviceId: data.serviceId,
      scheduledAt: data.scheduledAt,
      tenantId,
    });

    if (hasConflict) {
      throw new Error('BOOKING_CONFLICT');
    }

    const client = await prisma.user.findFirst({
      where: {
        id: data.clientId,
        tenantId,
      },
    });

    if (!client) {
      throw new Error('Client not found in this tenant');
    }

    const service = await prisma.service.findFirst({
      where: {
        id: data.serviceId,
        tenantId,
        active: true,
      },
    });

    if (!service) {
      throw new Error('Service not found or inactive');
    }

    return await prisma.booking.create({
      data: {
        clientId: data.clientId,
        serviceId: data.serviceId,
        scheduledAt: data.scheduledAt,
        notes: data.notes,
        tenantId,
        status: 'PENDING',
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            duration: true,
            price: true,
          },
        },
      },
    });
  }

  async getBooking(id: string, tenantId?: string) {
    const actualTenantId = this.getTenantId(tenantId);

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        client: true,
        service: true,
      },
    });

    if (!booking || booking.tenantId !== actualTenantId) {
      return null;
    }

    return booking;
  }

  async listBookings(params: {
    tenantId?: string;
    clientId?: string;
    status?: string;
    from?: Date;
    to?: Date;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const tenantId = this.getTenantId(params.tenantId);

    const where: any = {
      tenantId,
    };

    if (params.clientId) {
      where.clientId = params.clientId;
    }

    if (params.status) {
      where.status = params.status;
    }

    if (params.from || params.to) {
      where.scheduledAt = {};
      if (params.from) where.scheduledAt.gte = params.from;
      if (params.to) where.scheduledAt.lte = params.to;
    }

    const orderBy: any = {};
    if (params.sortBy) {
      orderBy[params.sortBy] = params.sortOrder || 'desc';
    } else {
      orderBy.scheduledAt = 'desc';
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        take: params.limit || 50,
        skip: params.offset || 0,
        orderBy,
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          service: {
            select: {
              id: true,
              name: true,
              duration: true,
            },
          },
        },
      }),
      prisma.booking.count({ where }),
    ]);

    return { bookings, total };
  }

  async updateBooking(
    id: string,
    data: {
      scheduledAt?: Date;
      status?: string;
      notes?: string;
      tenantId?: string;
    }
  ) {
    const tenantId = this.getTenantId(data.tenantId);

    const existing = await this.getBooking(id, tenantId);
    if (!existing) {
      throw new Error('Booking not found');
    }

    if (data.scheduledAt && data.scheduledAt.getTime() !== existing.scheduledAt.getTime()) {
      const hasConflict = await this.checkConflict({
        serviceId: existing.serviceId,
        scheduledAt: data.scheduledAt,
        tenantId,
        excludeBookingId: id,
      });

      if (hasConflict) {
        throw new Error('BOOKING_CONFLICT');
      }
    }

    return await prisma.booking.update({
      where: { id },
      data: {
        scheduledAt: data.scheduledAt,
        status: data.status,
        notes: data.notes,
      },
      include: {
        client: true,
        service: true,
      },
    });
  }

  async cancelBooking(id: string, tenantId?: string) {
    const actualTenantId = this.getTenantId(tenantId);

    const existing = await this.getBooking(id, actualTenantId);
    if (!existing) {
      throw new Error('Booking not found');
    }

    if (existing.status === 'CANCELLED') {
      throw new Error('Booking already cancelled');
    }

    return await prisma.booking.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    });
  }
}
```

**Verification:**
- Conflict detection method added
- Client and service ownership verified
- All methods filter by tenant
- Rescheduling checks for conflicts

---

### Task 3.3: Update Service Requests Service

**File:** `src/services/service-requests.service.ts`

**Action:** Add tenant context support:

```typescript
import prisma from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenant-context';

export class ServiceRequestsService {
  private getTenantId(providedTenantId?: string): string {
    if (providedTenantId) {
      return providedTenantId;
    }

    const context = getTenantContext();
    if (!context?.tenantId) {
      throw new Error('Tenant context required for service request operations');
    }

    return context.tenantId;
  }

  async createServiceRequest(data: {
    clientId: string;
    serviceId: string;
    description: string;
    priority?: string;
    tenantId?: string;
  }) {
    const tenantId = this.getTenantId(data.tenantId);

    const client = await prisma.user.findFirst({
      where: {
        id: data.clientId,
        tenantId,
      },
    });

    if (!client) {
      throw new Error('Client not found in this tenant');
    }

    const service = await prisma.service.findFirst({
      where: {
        id: data.serviceId,
        tenantId,
        active: true,
      },
    });

    if (!service) {
      throw new Error('Service not found or inactive');
    }

    return await prisma.serviceRequest.create({
      data: {
        clientId: data.clientId,
        serviceId: data.serviceId,
        description: data.description,
        priority: data.priority || 'MEDIUM',
        tenantId,
        status: 'PENDING',
      },
    });
  }

  async getServiceRequest(id: string, tenantId?: string) {
    const actualTenantId = this.getTenantId(tenantId);

    const request = await prisma.serviceRequest.findUnique({
      where: { id },
    });

    if (!request || request.tenantId !== actualTenantId) {
      return null;
    }

    return request;
  }

  async listServiceRequests(params: {
    tenantId?: string;
    clientId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }) {
    const tenantId = this.getTenantId(params.tenantId);

    const where: any = {
      tenantId,
    };

    if (params.clientId) {
      where.clientId = params.clientId;
    }

    if (params.status) {
      where.status = params.status;
    }

    const [requests, total] = await Promise.all([
      prisma.serviceRequest.findMany({
        where,
        take: params.limit || 50,
        skip: params.offset || 0,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.serviceRequest.count({ where }),
    ]);

    return { requests, total };
  }

  async updateServiceRequest(id: string, data: any, tenantId?: string) {
    const actualTenantId = this.getTenantId(tenantId);

    const existing = await this.getServiceRequest(id, actualTenantId);
    if (!existing) {
      throw new Error('Service request not found');
    }

    return await prisma.serviceRequest.update({
      where: { id },
      data,
    });
  }

  async deleteServiceRequest(id: string, tenantId?: string) {
    const actualTenantId = this.getTenantId(tenantId);

    const existing = await this.getServiceRequest(id, actualTenantId);
    if (!existing) {
      throw new Error('Service request not found');
    }

    return await prisma.serviceRequest.delete({
      where: { id },
    });
  }
}
```

**Verification:**
- `getTenantId()` helper added
- All methods verify tenant ownership
- Client and service validation included

---

### Task 3.4: Update Users Service

**File:** `src/services/users.service.ts`

**Action:** Add tenant context support:

```typescript
import prisma from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenant-context';

export class UsersService {
  private getTenantId(providedTenantId?: string): string {
    if (providedTenantId) {
      return providedTenantId;
    }

    const context = getTenantContext();
    if (!context?.tenantId) {
      throw new Error('Tenant context required for user operations');
    }

    return context.tenantId;
  }

  async createUser(data: {
    email: string;
    name: string;
    role: string;
    password?: string;
    tenantId?: string;
  }) {
    const tenantId = this.getTenantId(data.tenantId);

    const existing = await prisma.user.findFirst({
      where: {
        email: data.email,
        tenantId,
      },
    });

    if (existing) {
      throw new Error('User with this email already exists in this tenant');
    }

    return await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        role: data.role,
        password: data.password,
        tenantId,
        active: true,
      },
    });
  }

  async getUser(id: string, tenantId?: string) {
    const actualTenantId = this.getTenantId(tenantId);

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user || user.tenantId !== actualTenantId) {
      return null;
    }

    return user;
  }

  async listUsers(params: {
    tenantId?: string;
    role?: string;
    active?: boolean;
    limit?: number;
    offset?: number;
  }) {
    const tenantId = this.getTenantId(params.tenantId);

    const where: any = {
      tenantId,
    };

    if (params.role) {
      where.role = params.role;
    }

    if (params.active !== undefined) {
      where.active = params.active;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        take: params.limit || 50,
        skip: params.offset || 0,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          active: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total };
  }

  async updateUser(id: string, data: any, tenantId?: string) {
    const actualTenantId = this.getTenantId(tenantId);

    const existing = await this.getUser(id, actualTenantId);
    if (!existing) {
      throw new Error('User not found');
    }

    return await prisma.user.update({
      where: { id },
      data,
    });
  }

  async deleteUser(id: string, tenantId?: string) {
    const actualTenantId = this.getTenantId(tenantId);

    const existing = await this.getUser(id, actualTenantId);
    if (!existing) {
      throw new Error('User not found');
    }

    return await prisma.user.delete({
      where: { id },
    });
  }
}
```

**Verification:**
- Duplicate email check scoped to tenant
- All methods verify tenant ownership
- Password field handled securely

---

## Phase 4: Test File Updates

**Duration:** 8 hours  
**Priority:** Medium  
**Dependencies:** Phase 1, 2, 3 complete

### Task 4.1: Update Admin Services Route Tests

**File:** `tests/admin-services.route.test.ts`

**Action:** Update to use new test helpers:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST, GET } from '@/app/api/admin/services/route';
import { createTestRequest, callRoute } from './helpers/request';
import { setupTestTenantContext } from './helpers/tenant-context';
import prisma from '@/lib/prisma';

describe('api/admin/services routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    setupTestTenantContext({
      tenantId: 'test-tenant',
      userId: 'admin1',
      userRole: 'ADMIN',
    });
  });

  it('POST creates a new service', async () => {
    const mockService = {
      id: 'svc1',
      name: 'Tax Filing',
      tenantId: 'test-tenant',
      active: true,
    };

    prisma.service.create.mockResolvedValue(mockService);

    const request = createTestRequest('http://localhost/api/admin/services', {
      method: 'POST',
      body: {
        name: 'Tax Filing',
        description: 'Tax filing service',
      },
      tenantId: 'test-tenant',
      userId: 'admin1',
    });

    const response = await callRoute(POST, request);

    expect(response.status).toBe(201);
    expect(response.data).toMatchObject({ name: 'Tax Filing' });
    expect(prisma.service.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tenantId: 'test-tenant',
        }),
      })
    );
  });

  it('GET returns list with counts and header', async () => {
    const mockServices = [
      { id: 'svc1', name: 'Service 1', tenantId: 'test-tenant' },
      { id: 'svc2', name: 'Service 2', tenantId: 'test-tenant' },
    ];

    prisma.service.findMany.mockResolvedValue(mockServices);

    const request = createTestRequest('http://localhost/api/admin/services', {
      tenantId: 'test-tenant',
    });

    const response = await callRoute(GET, request);

    expect(response.status).toBe(200);
    expect(response.data).toHaveLength(2);
    expect(response.headers.get('X-Total-Count')).toBe('2');
  });

  it('GET returns 403 when tenant context missing', async () => {
    setupTestTenantContext(null);

    const request = createTestRequest('http://localhost/api/admin/services');

    const response = await callRoute(GET, request);

    expect(response.status).toBe(403);
  });
});
```

**Verification:**
- All tests import new helpers
- `setupTestTenantContext()` called in `beforeEach`
- `createTestRequest()` used for all requests
- Tenant context validated in tests

---

### Task 4.2: Update RBAC Tests

**File:** `tests/admin-rbac-comprehensive.test.ts`

**Action:** Update to use tenant context:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setupTestTenantContext } from './helpers/tenant-context';
import { createTestRequest, callRoute } from './helpers/request';
import prisma from '@/lib/prisma';

describe('Admin API RBAC Enforcement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('/api/admin/users', () => {
    it('should allow GET access for TEAM_LEAD role', async () => {
      setupTestTenantContext({
        tenantId: 't1',
        userId: 'lead1',
        userRole: 'TEAM_LEAD',
        permissions: ['users:read'],
      });

      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);

      const { GET } = await import('@/app/api/admin/users/route');
      
      const request = createTestRequest('http://localhost/api/admin/users', {
        tenantId: 't1',
        userId: 'lead1',
      });

      const response = await callRoute(GET, request);
      
      expect(response.status).toBe(200);
    });

    it('should deny GET access for CLIENT role', async () => {
      setupTestTenantContext({
        tenantId: 't1',
        userId: 'client1',
        userRole: 'CLIENT',
        permissions: [],
      });

      const { GET } = await import('@/app/api/admin/users/route');
      
      const request = createTestRequest('http://localhost/api/admin/users', {
        tenantId: 't1',
        userId: 'client1',
      });

      const response = await callRoute(GET, request);
      
      expect(response.status).toBe(403);
    });
  });

  describe('/api/admin/services', () => {
    it('should allow POST for ADMIN role', async () => {
      setupTestTenantContext({
        tenantId: 't1',
        userId: 'admin1',
        userRole: 'ADMIN',
        permissions: ['services:create'],
      });

      prisma.service.create.mockResolvedValue({
        id: 'svc1',
        name: 'Test Service',
        tenantId: 't1',
      });

      const { POST } = await import('@/app/api/admin/services/route');
      
      const request = createTestRequest('http://localhost/api/admin/services', {
        method: 'POST',
        body: { name: 'Test Service' },
        tenantId: 't1',
        userId: 'admin1',
      });

      const response = await callRoute(POST, request);
      
      expect(response.status).toBe(201);
    });
  });
});
```

**Verification:**
- Different roles tested properly
- Tenant context set per test
- Permissions validated

---

### Task 4.3: Update Tenant Isolation Tests

**File:** `tests/integration/tenant-mismatch.portal.security.test.ts`

**Action:** Ensure cross-tenant access is blocked:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setupTestTenantContext } from '../helpers/tenant-context';
import { createTestRequest, callRoute } from '../helpers/request';
import prisma from '@/lib/prisma';

describe('Tenant security - portal and admin routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('portal service-requests GET ignores forged x-tenant-id', async () => {
    setupTestTenantContext({
      tenantId: 'tenant-a',
      userId: 'user1',
    });

    const mockRequests = [
      { id: 'req1', tenantId: 'tenant-a', clientId: 'user1' },
      { id: 'req2', tenantId: 'tenant-a', clientId: 'user1' },
    ];

    prisma.serviceRequest.findMany.mockResolvedValue(mockRequests);

    const { GET } = await import('@/app/api/portal/service-requests/route');

    const request = createTestRequest('http://localhost/api/portal/service-requests', {
      tenantId: 'tenant-b',
      userId: 'user1',
      cookies: {
        'tenant_id': 'tenant-a',
        'tenant_sig': 'valid-signature',
      },
    });

    const response = await callRoute(GET, request);

    expect(response.status).toBe(200);
    expect(response.data).toHaveLength(2);
    
    expect(prisma.serviceRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: 'tenant-a',
        }),
      })
    );
  });

  it('admin service-requests [id] PATCH returns 404 for cross-tenant access', async () => {
    setupTestTenantContext({
      tenantId: 'tenant-a',
      userId: 'admin1',
    });

    prisma.serviceRequest.findUnique.mockResolvedValue({
      id: 'req1',
      tenantId: 'tenant-b',
    });

    const { PATCH } = await import('@/app/api/admin/service-requests/[id]/route');

    const request = createTestRequest(
      'http://localhost/api/admin/service-requests/req1',
      {
        method: 'PATCH',
        body: { status: 'COMPLETED' },
        tenantId: 'tenant-a',
        userId: 'admin1',
      }
    );

    const response = await callRoute(PATCH, request, { params: { id: 'req1' } });

    expect(response.status).toBe(404);
  });

  it('admin bookings GET returns only current tenant bookings', async () => {
    setupTestTenantContext({
      tenantId: 'tenant-a',
      userId: 'admin1',
    });

    const mockBookings = [
      { id: 'b1', tenantId: 'tenant-a' },
      { id: 'b2', tenantId: 'tenant-a' },
    ];

    prisma.booking.findMany.mockResolvedValue(mockBookings);
    prisma.booking.count.mockResolvedValue(2);

    const { GET } = await import('@/app/api/admin/bookings/route');

    const request = createTestRequest('http://localhost/api/admin/bookings', {
      tenantId: 'tenant-a',
    });

    const response = await callRoute(GET, request);

    expect(response.status).toBe(200);
    expect(prisma.booking.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: 'tenant-a',
        }),
      })
    );
  });
});
```

**Verification:**
- Forged headers ignored
- Cross-tenant access returns 404
- Queries always filtered by session tenant

---

### Task 4.4: Update Status Transitions Tests

**File:** `tests/status-transitions.test.ts`

**Action:** Add tenant context to status transition tests:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setupTestTenantContext } from './helpers/tenant-context';
import { createTestRequest, callRoute } from './helpers/request';
import prisma from '@/lib/prisma';

describe('Service Request Status Transitions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    setupTestTenantContext({
      tenantId: 't1',
      userId: 'admin1',
      userRole: 'ADMIN',
      permissions: ['service-requests:update'],
    });
  });

  it('allows PENDING to IN_PROGRESS transition', async () => {
    prisma.serviceRequest.findUnique.mockResolvedValue({
      id: 'req1',
      status: 'PENDING',
      tenantId: 't1',
    });

    prisma.serviceRequest.update.mockResolvedValue({
      id: 'req1',
      status: 'IN_PROGRESS',
      tenantId: 't1',
    });

    const { PATCH } = await import('@/app/api/admin/service-requests/[id]/status/route');

    const request = createTestRequest(
      'http://localhost/api/admin/service-requests/req1/status',
      {
        method: 'PATCH',
        body: { status: 'IN_PROGRESS' },
        tenantId: 't1',
      }
    );

    const response = await callRoute(PATCH, request, { params: { id: 'req1' } });

    expect(response.status).toBe(200);
    expect(response.data.status).toBe('IN_PROGRESS');
  });

  it('returns 401 when no tenant context', async () => {
    setupTestTenantContext(null);

    const { PATCH } = await import('@/app/api/admin/service-requests/[id]/status/route');

    const request = createTestRequest(
      'http://localhost/api/admin/service-requests/req1/status',
      {
        method: 'PATCH',
        body: { status: 'IN_PROGRESS' },
      }
    );

    const response = await callRoute(PATCH, request, { params: { id: 'req1' } });

    expect(response.status).toBe(401);
    expect(response.data.allowed).toBe(false);
  });

  it('returns 403 when user lacks permission', async () => {
    setupTestTenantContext({
      tenantId: 't1',
      userId: 'user1',
      userRole: 'CLIENT',
      permissions: [],
    });

    const { PATCH } = await import('@/app/api/admin/service-requests/[id]/status/route');

    const request = createTestRequest(
      'http://localhost/api/admin/service-requests/req1/status',
      {
        method: 'PATCH',
        body: { status: 'IN_PROGRESS' },
        tenantId: 't1',
      }
    );

    const response = await callRoute(PATCH, request, { params: { id: 'req1' } });

    expect(response.status).toBe(403);
  });
});
```

**Verification:**
- Status transitions work with tenant context
- Returns 401 without context
- Returns 403 without permission

---

### Task 4.5: Update Component Tests

**File:** `tests/integration/settings-provider.integration.test.tsx`

**Action:** Fix DOM environment setup:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { SettingsProvider } from '@/components/providers/settings-provider';
import React from 'react';

describe('SettingsProvider integration', () => {
  beforeEach(() => {
    if (!global.document) {
      const { JSDOM } = require('jsdom');
      const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
      global.document = dom.window.document;
      global.window = dom.window as any;
    }
  });

  it('hydrates from initialSettings prop', async () => {
    const initialSettings = {
      organizationName: 'Test Org',
      currency: 'USD',
    };

    render(
      <SettingsProvider initialSettings={initialSettings}>
        <div data-testid="child">Content</div>
      </SettingsProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('child')).toBeInTheDocument();
    });
  });

  it('provides settings context to children', async () => {
    const TestComponent = () => {
      const { settings } = useSettings();
      return <div data-testid="org-name">{settings.organizationName}</div>;
    };

    const initialSettings = {
      organizationName: 'Test Company',
    };

    render(
      <SettingsProvider initialSettings={initialSettings}>
        <TestComponent />
      </SettingsProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('org-name')).toHaveTextContent('Test Company');
    });
  });
});
```

**Verification:**
- DOM environment properly initialized
- Component renders without errors
- Tests pass with jsdom environment

---

## Phase 5: Specific Issue Fixes

**Duration:** 4 hours  
**Priority:** Medium  
**Dependencies:** Phases 1-4 complete

### Task 5.1: Fix Auto-Assignment Service

**File:** `src/services/auto-assignment.service.ts`

**Action:** Add tenant context to auto-assignment:

```typescript
import prisma from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenant-context';

export class AutoAssignmentService {
  private getTenantId(): string {
    const context = getTenantContext();
    if (!context?.tenantId) {
      throw new Error('Tenant context required for auto-assignment');
    }
    return context.tenantId;
  }

  async autoAssignServiceRequest(requestId: string, tenantId?: string): Promise<string | null> {
    const actualTenantId = tenantId || this.getTenantId();

    const request = await prisma.serviceRequest.findUnique({
      where: { id: requestId },
    });

    if (!request || request.tenantId !== actualTenantId) {
      throw new Error('Service request not found');
    }

    const teamMembers = await prisma.user.findMany({
      where: {
        tenantId: actualTenantId,
        role: { in: ['TEAM_MEMBER', 'TEAM_LEAD'] },
        active: true,
      },
      include: {
        assignedRequests: {
          where: {
            status: { in: ['PENDING', 'IN_PROGRESS'] },
          },
        },
      },
    });

    if (teamMembers.length === 0) {
      return null;
    }

    const leastBusyMember = teamMembers.reduce((prev, current) => {
      return (prev.assignedRequests?.length || 0) < (current.assignedRequests?.length || 0)
        ? prev
        : current;
    });

    await prisma.serviceRequest.update({
      where: { id: requestId },
      data: {
        assignedTo: leastBusyMember.id,
      },
    });

    return leastBusyMember.id;
  }

  async getAvailableTeamMembers(tenantId?: string): Promise<any[]> {
    const actualTenantId = tenantId || this.getTenantId();

    return await prisma.user.findMany({
      where: {
        tenantId: actualTenantId,
        role: { in: ['TEAM_MEMBER', 'TEAM_LEAD'] },
        active: true,
      },
      include: {
        assignedRequests: {
          where: {
            status: { in: ['PENDING', 'IN_PROGRESS'] },
          },
        },
      },
    });
  }
}
```

**Verification:**
- Returns `null` when no team members available
- Only assigns within tenant
- Considers workload when assigning

---

### Task 5.2: Fix Status Transition Route

**File:** `src/app/api/admin/service-requests/[id]/status/route.ts`

**Action:** Create or update status transition endpoint:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { withTenantContext, getTenantContext } from '@/lib/tenant-context';
import { requirePermission } from '@/lib/auth-helpers';
import prisma from '@/lib/prisma';

const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'ON_HOLD', 'CANCELLED'],
  ON_HOLD: ['IN_PROGRESS', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

export const PATCH = withTenantContext(async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const context = getTenantContext();
    
    if (!context) {
      return NextResponse.json(
        { error: 'Unauthorized', allowed: false },
        { status: 401 }
      );
    }

    const body = await req.json();
    
    if (!body.status) {
      return NextResponse.json(
        { error: 'Status required' },
        { status: 400 }
      );
    }

    const hasPermission = context.permissions?.includes('service-requests:update');
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const existing = await prisma.serviceRequest.findUnique({
      where: { id: params.id },
    });

    if (!existing || existing.tenantId !== context.tenantId) {
      return NextResponse.json(
        { error: 'Not found' },
        { status: 404 }
      );
    }

    const allowedTransitions = VALID_TRANSITIONS[existing.status] || [];
    if (!allowedTransitions.includes(body.status)) {
      return NextResponse.json(
        { 
          error: 'Invalid status transition',
          currentStatus: existing.status,
          requestedStatus: body.status,
          allowedTransitions,
        },
        { status: 400 }
      );
    }

    const updated = await prisma.serviceRequest.update({
      where: { id: params.id },
      data: {
        status: body.status,
        updatedAt: new Date(),
        updatedBy: context.userId,
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error('Status transition error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    );
  }
});
```

**Verification:**
- Returns 401 without context
- Returns 403 without permission
- Returns 404 for cross-tenant access
- Validates status transitions
- Returns 400 for invalid transitions

---

### Task 5.3: Fix Booking Conflict Detection

**File:** `src/app/api/admin/bookings/route.ts` (POST handler update)

**Action:** Ensure conflict detection returns 409:

```typescript
// Update the POST handler conflict detection section:

export const POST = withTenantContext(async (req: NextRequest) => {
  try {
    const session = await requireAuth(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const context = getTenantContext();
    if (!context?.tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();

    if (!body.clientId || !body.serviceId || !body.scheduledAt) {
      return NextResponse.json(
        { error: 'clientId, serviceId, and scheduledAt are required' },
        { status: 400 }
      );
    }

    // Verify client ownership
    const client = await prisma.user.findFirst({
      where: {
        id: body.clientId,
        tenantId: context.tenantId,
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found in this tenant' },
        { status: 404 }
      );
    }

    // Verify service ownership
    const service = await prisma.service.findFirst({
      where: {
        id: body.serviceId,
        tenantId: context.tenantId,
        active: true,
      },
    });

    if (!service) {
      return NextResponse.json(
        { error: 'Service not found or inactive' },
        { status: 404 }
      );
    }

    // Check for conflicts - THIS IS THE KEY FIX
    const conflict = await prisma.booking.findFirst({
      where: {
        tenantId: context.tenantId,
        serviceId: body.serviceId,
        scheduledAt: new Date(body.scheduledAt),
        status: { not: 'CANCELLED' },
      },
    });

    if (conflict) {
      return NextResponse.json(
        { 
          error: 'Booking conflict',
          message: 'This time slot is already booked',
          conflictingBookingId: conflict.id,
        },
        { status: 409 } // MUST be 409, not 400
      );
    }

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        clientId: body.clientId,
        serviceId: body.serviceId,
        scheduledAt: new Date(body.scheduledAt),
        notes: body.notes,
        tenantId: context.tenantId,
        status: 'PENDING',
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            duration: true,
            price: true,
          },
        },
      },
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error('Booking creation error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    );
  }
});
```

**Verification:**
- Conflict detection returns 409 status code
- Includes `conflictingBookingId` in response
- Proper error message provided

---

### Task 5.4: Fix Service Cloning

**File:** `src/app/api/admin/services/[id]/clone/route.ts`

**Action:** Create service cloning endpoint with tenant context:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { withTenantContext, getTenantContext } from '@/lib/tenant-context';
import { requireAuth, requirePermission } from '@/lib/auth-helpers';
import prisma from '@/lib/prisma';

export const POST = withTenantContext(async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const session = await requireAuth(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const context = getTenantContext();
    if (!context?.tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const hasPermission = await requirePermission(context, 'services:create');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Find original service
    const original = await prisma.service.findUnique({
      where: { id: params.id },
    });

    if (!original || original.tenantId !== context.tenantId) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const newName = body.name || `${original.name} (Copy)`;

    // Check if name already exists
    const existing = await prisma.service.findFirst({
      where: {
        name: newName,
        tenantId: context.tenantId,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Service with this name already exists' },
        { status: 409 }
      );
    }

    // Clone the service
    const cloned = await prisma.service.create({
      data: {
        name: newName,
        description: original.description,
        price: original.price,
        duration: original.duration,
        category: original.category,
        tenantId: context.tenantId,
        active: body.active !== undefined ? body.active : true,
        createdBy: context.userId,
      },
    });

    return NextResponse.json(cloned, { status: 201 });
  } catch (error) {
    console.error('Service cloning error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    );
  }
});
```

**Verification:**
- Original service ownership verified
- Cloned service created in same tenant
- Name uniqueness checked within tenant
- Returns 409 for duplicate names

---

### Task 5.5: Fix ETag Caching

**File:** `src/app/api/admin/services/route.ts` (GET handler update)

**Action:** Add ETag support to GET handler:

```typescript
import crypto from 'crypto';

export const GET = withTenantContext(async (req: NextRequest) => {
  const context = getTenantContext();
  if (!context?.tenantId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const servicesService = new ServicesService();
  const services = await servicesService.listServices({
    tenantId: context.tenantId,
  });

  // Generate ETag based on content
  const content = JSON.stringify(services);
  const etag = crypto.createHash('md5').update(content).digest('hex');

  // Check if client has cached version
  const clientETag = req.headers.get('if-none-match');
  if (clientETag === etag) {
    return new NextResponse(null, { status: 304 }); // Not Modified
  }

  const response = NextResponse.json(services);
  response.headers.set('X-Total-Count', services.length.toString());
  response.headers.set('ETag', etag);
  response.headers.set('Cache-Control', 'private, max-age=60');
  
  return response;
});
```

**Verification:**
- ETag header set on responses
- Returns 304 when content unchanged
- Cache-Control header set appropriately

---

## Phase 6: Final Verification & Cleanup

**Duration:** 2 hours  
**Priority:** High  
**Dependencies:** All previous phases complete

### Task 6.1: Run Full Test Suite

**Action:** Execute complete test suite and verify results:

```bash
npm test
```

**Expected Output:**
```
Test Files  81 passed (81)
Tests  315 passed (315)
Start at  HH:MM:SS
Duration  ~30s
```

**Verification:**
- All 315 tests pass
- No skipped tests
- No console errors during test execution
- Test coverage meets requirements (>80%)

---

### Task 6.2: Verify Manual Testing Checklist

**Action:** Perform manual verification of key functionality:

**Test Scenario 1: Service Creation with Tenant Isolation**
1. Login as admin for tenant A
2. Create service "Service A1"
3. Verify service appears in tenant A's service list
4. Login as admin for tenant B
5. Verify "Service A1" does NOT appear in tenant B's service list
6. Create service "Service B1"
7. Switch back to tenant A
8. Verify "Service B1" does NOT appear in tenant A's service list

**Test Scenario 2: Booking Conflict Detection**
1. Login as admin for tenant A
2. Create booking for Service S1 at 10:00 AM
3. Attempt to create another booking for Service S1 at 10:00 AM
4. Verify 409 status returned with conflict message
5. Create booking for Service S1 at 11:00 AM
6. Verify booking succeeds (201 status)

**Test Scenario 3: Cross-Tenant Access Prevention**
1. Login as admin for tenant A
2. Note a service request ID from tenant A (e.g., "req-A-123")
3. Login as admin for tenant B
4. Attempt to access /api/admin/service-requests/req-A-123
5. Verify 404 status returned (not 403 or 400)
6. Attempt to update the service request
7. Verify 404 status returned

**Test Scenario 4: Permission Enforcement**
1. Login as CLIENT role user for tenant A
2. Attempt to access /api/admin/users
3. Verify 403 status returned
4. Login as TEAM_LEAD role user for tenant A
5. Access /api/admin/users
6. Verify 200 status with user list

**Test Scenario 5: Status Transitions**
1. Create service request with PENDING status
2. Transition to IN_PROGRESS - verify success
3. Attempt to transition directly to CANCELLED from IN_PROGRESS
4. Verify it fails with invalid transition error
5. Transition to COMPLETED - verify success
6. Attempt to transition from COMPLETED to any other status
7. Verify it fails

**Verification:**
- All scenarios pass without errors
- Status codes are correct
- Data isolation is maintained
- Permissions are enforced

---

### Task 6.3: Code Quality Review

**Action:** Review all modified code for quality standards:

**Checklist:**
- [ ] All route handlers wrapped with `withTenantContext`
- [ ] All database queries include `tenantId` filter
- [ ] All ownership checks return 404 (not 400/403) for cross-tenant access
- [ ] All error messages are user-friendly
- [ ] No sensitive data leaked in error responses
- [ ] All service methods have `getTenantId()` helper
- [ ] All test files use new test helpers
- [ ] No console.log statements left in code (console.error is OK)
- [ ] TypeScript has no errors
- [ ] ESLint has no warnings
- [ ] Code follows project conventions

**Verification:**
- Code review checklist completed
- No linting errors
- No TypeScript errors
- Code is production-ready

---

### Task 6.4: Update Documentation

**Action:** Update project documentation to reflect tenant context implementation:

**File:** `docs/TENANT_CONTEXT.md`

**Content:**
```markdown
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
  if (providedTenantId) {
    return providedTenantId;
  }
  
  const context = getTenantContext();
  if (!context?.tenantId) {
    throw new Error('Tenant context required');
  }
  
  return context.tenantId;
}
```

### Database Queries
All Prisma queries MUST include tenant filter:
```typescript
const users = await prisma.user.findMany({
  where: {
    tenantId: context.tenantId, // REQUIRED
    // ... other filters
  },
});
```

### Testing
Tests use helper functions from `tests/helpers/`:
- `setupTestTenantContext()` - Set tenant context for tests
- `createTestRequest()` - Create test requests with tenant headers
- `callRoute()` - Call route handlers in tests

## Security Considerations

1. **Never trust client headers** - Always use session-based tenant context
2. **Return 404 for cross-tenant access** - Don't leak resource existence
3. **Verify ownership before updates** - Check tenant before any write operation
4. **Filter all queries** - Every database query must include tenantId

## Common Patterns

### Route Handler
```typescript
export const GET = withTenantContext(async (req: NextRequest) => {
  const context = getTenantContext();
  if (!context?.tenantId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  // Your logic here
});
```

### Service Method
```typescript
async getResource(id: string, tenantId?: string) {
  const actualTenantId = this.getTenantId(tenantId);
  
  const resource = await prisma.resource.findUnique({
    where: { id },
  });
  
  if (!resource || resource.tenantId !== actualTenantId) {
    return null; // or throw error
  }
  
  return resource;
}
```

### Test Setup
```typescript
beforeEach(() => {
  vi.clearAllMocks();
  
  setupTestTenantContext({
    tenantId: 'test-tenant',
    userId: 'test-user',
    userRole: 'ADMIN',
  });
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
- Use `getTenantId()` helper in services

### Tests failing
- Call `setupTestTenantContext()` in `beforeEach()`
- Use `createTestRequest()` for all test requests
- Clear mocks between tests with `vi.clearAllMocks()`
```

**Verification:**
- Documentation is complete and accurate
- Examples are up-to-date
- Troubleshooting section is helpful

---

### Task 6.5: Create Deployment Checklist

**Action:** Create deployment checklist for production:

**File:** `docs/DEPLOYMENT_CHECKLIST.md`

**Content:**
```markdown
# Tenant Context Deployment Checklist

## Pre-Deployment

- [ ] All tests passing (315/315)
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Manual testing completed
- [ ] Code review approved
- [ ] Documentation updated

## Database

- [ ] All models have `tenantId` field
- [ ] Indexes include `tenantId` where appropriate
- [ ] Migration scripts tested
- [ ] Rollback plan prepared

## Security

- [ ] Tenant signature validation enabled
- [ ] Session configuration verified
- [ ] CORS settings appropriate
- [ ] Rate limiting configured per tenant
- [ ] Audit logging enabled

## Monitoring

- [ ] Error tracking configured (Sentry, etc.)
- [ ] Performance monitoring enabled
- [ ] Tenant isolation metrics tracked
- [ ] Cross-tenant access attempts logged
- [ ] Alert thresholds configured

## Testing in Staging

- [ ] Create test tenants
- [ ] Verify data isolation
- [ ] Test cross-tenant access prevention
- [ ] Verify performance with load testing
- [ ] Test all user roles
- [ ] Verify all API endpoints

## Deployment Steps

1. [ ] Deploy database migrations
2. [ ] Deploy application code
3. [ ] Verify health checks pass
4. [ ] Smoke test critical paths
5. [ ] Monitor error rates
6. [ ] Verify tenant isolation
7. [ ] Check performance metrics

## Post-Deployment

- [ ] Monitor for 24 hours
- [ ] Review error logs
- [ ] Check tenant isolation metrics
- [ ] Verify no cross-tenant access
- [ ] User acceptance testing
- [ ] Documentation review

## Rollback Plan

If issues detected:
1. [ ] Revert application deployment
2. [ ] Restore database if necessary
3. [ ] Notify stakeholders
4. [ ] Document issues
5. [ ] Plan remediation
```

**Verification:**
- Checklist is comprehensive
- All critical items included
- Rollback plan is clear

---

## Summary & Completion Criteria

### Implementation Summary

**Total Tasks:** 35 tasks across 6 phases  
**Estimated Duration:** 28-32 hours  
**Critical Path:** Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6

### Completion Criteria

**Phase 1 Complete When:**
- ✅ All test helper files created
- ✅ Vitest configuration updated
- ✅ Global test setup working
- ✅ Basic infrastructure tests pass

**Phase 2 Complete When:**
- ✅ All route handlers wrapped with `withTenantContext`
- ✅ Tenant context validated in all routes
- ✅ All queries filtered by tenant
- ✅ Proper status codes returned

**Phase 3 Complete When:**
- ✅ All services have `getTenantId()` helper
- ✅ All service methods support tenant context
- ✅ Ownership verification implemented
- ✅ Service tests pass

**Phase 4 Complete When:**
- ✅ All test files updated with new helpers
- ✅ RBAC tests passing
- ✅ Tenant isolation tests passing
- ✅ Component tests working

**Phase 5 Complete When:**
- ✅ Auto-assignment working
- ✅ Status transitions correct
- ✅ Booking conflicts return 409
- ✅ Service cloning working
- ✅ ETag caching implemented

**Phase 6 Complete When:**
- ✅ Full test suite passing (315/315)
- ✅ Manual testing completed
- ✅ Code quality review passed
- ✅ Documentation updated
- ✅ Deployment checklist prepared

### Success Metrics

**Before Implementation:**
- ❌ 222 tests passing, 93 failing (70% pass rate)
- ❌ Tenant context errors throughout
- ❌ Security vulnerabilities present

**After Implementation:**
- ✅ 315 tests passing, 0 failing (100% pass rate)
- ✅ Complete tenant isolation
- ✅ All security issues resolved
- ✅ Production-ready code

### Risk Mitigation

**High Risk Items:**
1. Cross-tenant data access - **Mitigated by**: Comprehensive tenant isolation tests
2. Status code inconsistencies - **Mitigated by**: Explicit status code verification
3. Test infrastructure failures - **Mitigated by**: Phase 1 foundation
4. Performance degradation - **Mitigated by**: ETag caching and query optimization

**Rollback Strategy:**
- Each phase is independent and can be rolled back
- Git commits per task enable granular rollback
- Test suite catches regressions immediately

---

## Task Execution Guidelines for Builder.io

### Automated Execution Parameters

**Execution Mode:** Sequential, task-by-task  
**Confirmation Required:** No (proceed automatically)  
**Error Handling:** Stop phase on critical error, log and continue on warnings  
**Testing:** Run relevant tests after each task  
**Rollback:** Automatic on test failure

### Task Format

Each task follows this structure:
1. **File:** Exact file path
2. **Action:** Specific action to perform
3. **Code:** Complete code block to implement
4. **Verification:** Automated checks to perform

### Builder.io Should:

1. **Execute tasks sequentially** within each phase
2. **Run verification checks** after each task
3. **Proceed to next task** if verification passes
4. **Log progress** for monitoring
5. **Stop phase** if critical verification fails
6. **Generate summary report** after each phase

### Example Execution Flow

```
START Phase 1
├── Task 1.1: Create tenant-context.ts
│   ├── Create file
│   ├── Write code
│   ├── Verify: File exists, no TS errors
│   └── ✅ PASS
├── Task 1.2: Create request.ts
│   ├── Create file
│   ├── Write code
│   ├── Verify: File exists, no TS errors
│   └── ✅ PASS
├── Task 1.3: Create setup.ts
│   ├── Create file
│   ├── Write code
│   ├── Verify: File exists, no TS errors
│   └── ✅ PASS
├── Task 1.4: Update vitest.config.ts
│   ├── Modify file
│   ├── Verify: Config valid, no errors
│   └── ✅ PASS
└── Phase 1 Complete: ✅ 4/4 tasks passed

START Phase 2
...
```

### Progress Reporting

Builder.io should report after each phase:
```markdown
## Phase N Complete

**Tasks Completed:** X/Y
**Tests Passing:** XXX/315 (+XX from previous phase)
**Duration:** HH:MM:SS
**Status:** ✅ SUCCESS / ⚠️ WARNINGS / ❌ FAILED

### Next Steps
- Proceed to Phase N+1
- Review warnings (if any)
```

---

## Emergency Contacts & Support

**Project Owner:** [Name]  
**Technical Lead:** [Name]  
**DevOps Contact:** [Name]  

**Escalation Path:**
1. Check error logs
2. Review documentation
3. Consult technical lead
4. Escalate to project owner

---

**Document Version:** 1.0  
**Last Updated:** October 10, 2025  
**Status:** Ready for Automated Execution  
**Approved By:** [Pending]
