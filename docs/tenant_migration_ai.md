# Tenant Migration - AI Agent TODO System

**Version:** 5.0 | **Last Updated:** 2025-10-04  
**Mission:** Eliminate all tenant isolation vulnerabilities across 101 API routes  
**Timeline:** 14 weeks | **Current Phase:** 1 (65% complete)

---

## CRITICAL METRICS

```
Routes Migrated:     38/101 (38%)  ❌ TARGET: 101/101
Security Vulns:      43 routes     ❌ TARGET: 0
Test Coverage:       10%           ❌ TARGET: 90%
Nullable tenantId:   9 models      ⚠️  TARGET: 0
RLS Tables:          0/18          ❌ TARGET: 18/18
```

---

## PHASE 0: PLANNING & GOVERNANCE ✅

**Status:** COMPLETE (100%) | **Owner:** Platform Security Team

### ✅ Task 0.1: Executive Sponsorship
- [x] Confirm zero-trust security requirements
- [x] Define tenant identifier canonical source
- [x] Establish rollout environments (dev/staging/prod)
- [x] Set up change management approvals
- [x] Context reload with audit findings

**Completed:** 2025-09-20 | **No blockers**

---

## PHASE 1: SECURITY HARDENING (ACTIVE) 🔥

**Status:** 65% | **Priority:** P0 | **Owner:** Platform Security Team  
**Deadline:** Week 3 | **Blockers:** None

### ✅ Task 1.1: Middleware Hardening (COMPLETE)

**Status:** COMPLETE | **Effort:** 8h | **Completed:** 2025-09-25

- [x] Strip incoming x-tenant-id and x-tenant-slug headers
- [x] Set server-verified headers only
- [x] Issue HMAC-signed tenant cookie (tenant_sig)
- [x] Verify signed cookie and reject mismatches
- [x] Extend matcher to /api/:path*
- [ ] Log requestId, userId, tenantId for every request (→ Task 1.4)

**Files Updated:**
- [x] src/app/middleware.ts
- [x] src/lib/tenant-cookie.ts
- [x] src/lib/api-wrapper.ts

**Validation:**
```bash
# Test header spoofing protection
curl -H "x-tenant-id: spoofed" https://app.example.com/api/admin/services
# Expected: 403

# Test invalid signature
curl -b "tenant_sig=invalid" https://app.example.com/api/admin/services
# Expected: 403
```

---

### ✅ Task 1.2: Remove Client-Side Tenant Injection (COMPLETE)

**Status:** COMPLETE | **Effort:** 4h | **Completed:** 2025-09-26

- [x] Update src/lib/api.ts to stop setting x-tenant-id in production
- [x] Replace TenantSwitcher with secure endpoint
- [x] Implement src/app/api/tenant/switch/route.ts
- [x] Update JWT after tenant switch
- [x] Update TenantSwitcher UI component

**Impact:** Client-side header spoofing vectors closed

---

### 🔥 Task 1.3: Migrate Routes to withTenantContext (IN PROGRESS)

**Status:** 38/101 (38%) | **Priority:** P0 | **Deadline:** Week 1-3

#### ✅ COMPLETED ROUTES (38 total)

**Portal Routes (18/18 - 100%):**
- [x] src/app/api/portal/realtime/route.ts
- [x] src/app/api/portal/settings/booking-preferences/route.ts
- [x] src/app/api/portal/chat/route.ts
- [x] src/app/api/portal/service-requests/route.ts
- [x] src/app/api/portal/service-requests/availability/route.ts
- [x] src/app/api/portal/service-requests/recurring/preview/route.ts
- [x] src/app/api/portal/service-requests/export/route.ts
- [x] src/app/api/portal/service-requests/[id]/comments/route.ts
- [x] src/app/api/portal/service-requests/[id]/confirm/route.ts
- [x] src/app/api/portal/service-requests/[id]/reschedule/route.ts
- [x] (8 more portal routes completed)

**Admin Routes (20/58 - 34%):**
- [x] src/app/api/admin/services/route.ts
- [x] src/app/api/admin/services/[id]/route.ts
- [x] src/app/api/admin/tasks/route.ts
- [x] src/app/api/admin/tasks/[id]/route.ts
- [x] src/app/api/admin/service-requests/route.ts
- [x] src/app/api/admin/integration-hub/route.ts
- [x] src/app/api/admin/client-settings/route.ts
- [x] src/app/api/admin/client-settings/import/route.ts
- [x] src/app/api/admin/client-settings/export/route.ts
- [x] src/app/api/admin/analytics-settings/route.ts
- [x] src/app/api/admin/analytics-settings/import/route.ts
- [x] src/app/api/admin/analytics-settings/export/route.ts
- [x] src/app/api/admin/tasks/templates/** (all subroutes)
- [x] src/app/api/admin/tasks/notifications/route.ts
- [x] src/app/api/admin/availability-slots/route.ts
- [x] src/app/api/admin/export/route.ts
- [x] src/app/api/admin/task-settings/route.ts
- [x] src/app/api/admin/task-settings/export/route.ts
- [x] src/app/api/admin/task-settings/import/route.ts
- [x] src/app/api/admin/services/[id]/route.ts

**Public Routes (0/25 - 0%):**
- [ ] All pending

---

#### 🚨 HIGH PRIORITY - Admin Stats (10 routes) - WEEK 1

**Risk:** HIGH - Statistics aggregate cross-tenant data  
**Effort:** 2h total (12 min/route) | **Deadline:** End of Week 1

- [ ] src/app/api/admin/stats/clients/route.ts
- [ ] src/app/api/admin/stats/posts/route.ts
- [ ] src/app/api/admin/stats/counts/route.ts
- [ ] src/app/api/admin/stats/bookings/route.ts
- [ ] src/app/api/admin/stats/users/route.ts
- [ ] src/app/api/admin/analytics/route.ts
- [ ] src/app/api/admin/realtime/route.ts
- [ ] src/app/api/admin/system/health/route.ts
- [ ] src/app/api/admin/uploads/quarantine/route.ts
- [ ] src/app/api/admin/security-settings/route.ts

**AI Agent Action:**
```bash
# Execute batch migration
./scripts/migrate-batch.sh admin-stats

# Validation per file
for file in src/app/api/admin/stats/*.ts; do
  grep -q "withTenantContext" "$file" && echo "✅ $file" || echo "❌ $file"
  npm test -- "${file/.ts/.test.ts}"
done
```

**Migration Template:**
```typescript
// BEFORE (UNSAFE)
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const tenantId = getTenantFromRequest(req); // ❌ VULNERABLE
  const stats = await prisma.booking.aggregate({
    where: { tenantId },
    _count: true
  });
  return NextResponse.json(stats);
}

// AFTER (SAFE)
export const GET = withTenantContext(
  async (req, { user, tenant, params }) => {
    const stats = await prisma.booking.aggregate({
      where: { tenantId: tenant.id }, // ✅ Cryptographically verified
      _count: true
    });
    return NextResponse.json(stats);
  },
  { requireRole: ["ADMIN"] }
);
```

**Per-Route Checklist:**
- [ ] Replace `getServerSession` with `withTenantContext`
- [ ] Use `tenant.id` instead of header/cookie
- [ ] Add `requireRole` if needed
- [ ] Add integration test
- [ ] Run `npm test`
- [ ] Validate with curl (test 403 on spoofed header)
- [ ] Commit with message: `refactor: migrate [route] to withTenantContext (P0)`

---

#### ⚠️ MEDIUM PRIORITY - Services (8 routes) - WEEK 2

**Risk:** MEDIUM | **Effort:** 1.5h | **Deadline:** End of Week 2

- [ ] src/app/api/admin/services/stats/route.ts
- [ ] src/app/api/admin/services/export/route.ts
- [ ] src/app/api/admin/services/bulk/route.ts
- [ ] src/app/api/admin/services/[id]/versions/route.ts
- [ ] src/app/api/admin/services/[id]/clone/route.ts
- [ ] src/app/api/admin/services/[id]/settings/route.ts
- [ ] src/app/api/admin/services/slug-check/[slug]/route.ts
- [ ] src/app/api/admin/service-requests/analytics/route.ts

**AI Agent Action:**
```bash
./scripts/migrate-batch.sh services-batch
```

---

#### ⚠️ MEDIUM PRIORITY - Service Requests (6 routes) - WEEK 2

**Risk:** MEDIUM | **Effort:** 1h | **Deadline:** End of Week 2

- [ ] src/app/api/admin/service-requests/recurring/preview/route.ts
- [ ] src/app/api/admin/service-requests/export/route.ts
- [ ] src/app/api/admin/service-requests/bulk/route.ts
- [ ] src/app/api/admin/service-requests/availability/route.ts
- [ ] src/app/api/admin/service-requests/[id]/route.ts
- [ ] src/app/api/admin/service-requests/[id]/** (subroutes - 2 routes)

**AI Agent Action:**
```bash
./scripts/migrate-batch.sh service-requests-batch
```

---

#### 🟢 LOWER PRIORITY - Team & Expenses (6 routes) - WEEK 3

**Risk:** LOW | **Effort:** 1h | **Deadline:** End of Week 3

- [ ] src/app/api/admin/team-management/** (5 subroutes)
- [ ] src/app/api/admin/expenses/route.ts

**AI Agent Action:**
```bash
./scripts/migrate-batch.sh team-expenses-batch
```

---

#### 🟢 LOWER PRIORITY - Public/Payments (25 routes) - WEEK 3

**Risk:** LOW | **Effort:** 3h | **Deadline:** End of Week 3

- [ ] src/app/api/payments/checkout/route.ts
- [ ] src/app/api/auth/register/route.ts
- [ ] src/app/api/email/test/route.ts
- [ ] src/app/api/users/me/route.ts
- [ ] src/app/api/bookings/route.ts
- [ ] src/app/api/bookings/[id]/route.ts
- [ ] src/app/api/bookings/[id]/cancel/route.ts
- [ ] src/app/api/bookings/[id]/reschedule/route.ts
- [ ] src/app/api/bookings/availability/route.ts
- [ ] src/app/api/bookings/slots/route.ts
- [ ] src/app/api/bookings/confirm/route.ts
- [ ] src/app/api/bookings/recurring/route.ts
- [ ] src/app/api/bookings/export/route.ts
- [ ] src/app/api/bookings/stats/route.ts
- [ ] src/app/api/bookings/calendar/route.ts
- [ ] (10 more booking subroutes)

**AI Agent Action:**
```bash
./scripts/migrate-batch.sh public-routes-batch
```

---

**Task 1.3 Validation Commands:**
```bash
# Find remaining unsafe routes
grep -r "getServerSession" src/app/api --include="*.ts" | grep -v withTenantContext | wc -l
# Target: 0

# Find unsafe tenant resolution
grep -r "getTenantFromRequest" src/app/api --include="*.ts" | wc -l
# Target: 0

# Full validation
npm run build && npm run test:integration
```

---

### ❌ Task 1.4: Middleware Request Logging (NOT STARTED)

**Status:** NOT STARTED | **Priority:** P0 | **Deadline:** Week 1 | **Effort:** 2h

- [ ] Install winston and nanoid
- [ ] Create src/lib/logger.ts with structured logging
- [ ] Add requestId generation (nanoid) to middleware
- [ ] Log requestId, tenantId, userId on every request
- [ ] Propagate x-request-id header to responses
- [ ] Update logger in api-wrapper.ts to use requestId
- [ ] Configure Sentry to tag events with tenant context
- [ ] Add structured logs for tenant context establishment

**AI Agent Steps:**

**1. Install dependencies:**
```bash
npm install winston nanoid
```

**2. Create logger:**
```typescript
// src/lib/logger.ts
import winston from 'winston';
import { nanoid } from 'nanoid';

export const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/app.log' })
  ]
});

export const generateRequestId = () => nanoid();

export function logRequest(data: {
  requestId: string;
  tenantId?: string;
  userId?: string;
  method: string;
  path: string;
}) {
  logger.info('Request', data);
}
```

**3. Update middleware:**
```typescript
// src/app/middleware.ts
import { generateRequestId, logRequest } from '@/lib/logger';

export async function middleware(req: NextRequest) {
  const requestId = generateRequestId();
  const tenant = await getVerifiedTenant(req);
  
  logRequest({
    requestId,
    tenantId: tenant?.id,
    userId: req.headers.get('x-user-id'),
    method: req.method,
    path: req.nextUrl.pathname
  });
  
  const response = NextResponse.next();
  response.headers.set('x-request-id', requestId);
  return response;
}
```

**4. Update api-wrapper.ts:**
```typescript
// src/lib/api-wrapper.ts
import { logger } from './logger';

export function withTenantContext<T>(/* ... */) {
  return async (req, res) => {
    const requestId = req.headers.get('x-request-id');
    logger.info('Processing request', {
      requestId,
      tenantId: tenant.id,
      userId: user.id,
      path: req.nextUrl.pathname
    });
    // ... rest of handler
  };
}
```

**5. Configure Sentry:**
```typescript
// src/lib/sentry.ts
import * as Sentry from '@sentry/nextjs';
import { getTenantContext } from './tenant-context';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  beforeSend(event) {
    const context = getTenantContext();
    if (context) {
      event.tags = {
        ...event.tags,
        tenant_id: context.id,
        tenant_slug: context.slug
      };
    }
    return event;
  }
});
```

**Validation:**
```bash
# Check logs include context
grep -c "requestId" logs/app.log
grep -c "tenantId" logs/app.log

# Sample log entry
tail -n 1 logs/app.log | jq '.'
# Expected: { "timestamp": "...", "requestId": "...", "tenantId": "...", "userId": "..." }
```

**Completion Criteria:**
- [ ] All requests logged with requestId, tenantId, userId
- [ ] x-request-id header present in all responses
- [ ] Sentry events tagged with tenant_id
- [ ] Log file created and rotating
- [ ] No performance degradation (< 5ms overhead)

---

### ❌ Task 1.5: Integration Tests for Tenant Isolation (NOT STARTED)

**Status:** NOT STARTED | **Priority:** P0 | **Deadline:** Week 2 | **Effort:** 4h

- [ ] Create tests/integration/tenant-isolation.test.ts
- [ ] Test: JWT tenant != header tenant → 403
- [ ] Test: Cross-tenant service access → 404
- [ ] Test: Cross-tenant user data → 403
- [ ] Test: Bulk operations respect tenant filter
- [ ] Test: Subdomain mismatch → 403
- [ ] Test: 403 on tenant mismatch for high-risk admin route
- [ ] Test: Tenant cookie expiry handling
- [ ] Test: Invalid signature rejection
- [ ] Add tests to CI pipeline (.github/workflows/ci.yml)

**AI Agent Steps:**

**1. Create test file:**
```typescript
// tests/integration/tenant-isolation.test.ts
import { describe, it, expect } from '@jest/globals';
import { signJWT } from '@/lib/jwt-helper';

describe('Tenant Isolation - Phase 1', () => {
  it('returns 403 when JWT tenant != header tenant', async () => {
    const jwt = signJWT({ tenantId: 'tenant-A' });
    
    const res = await fetch('/api/admin/services', {
      headers: {
        Authorization: `Bearer ${jwt}`,
        'x-tenant-id': 'tenant-B' // spoofed
      }
    });
    
    expect(res.status).toBe(403);
  });
  
  it('blocks cross-tenant service request access', async () => {
    const jwtA = signJWT({ tenantId: 'tenant-A', userId: 'user-A' });
    const jwtB = signJWT({ tenantId: 'tenant-B', userId: 'user-B' });
    
    // Create SR as tenant-A
    const createRes = await fetch('/api/portal/service-requests', {
      method: 'POST',
      headers: { Authorization: `Bearer ${jwtA}` },
      body: JSON.stringify({ serviceId: 'service-1' })
    });
    const { id } = await createRes.json();
    
    // Try to access as tenant-B
    const accessRes = await fetch(`/api/portal/service-requests/${id}`, {
      headers: { Authorization: `Bearer ${jwtB}` }
    });
    
    expect(accessRes.status).toBe(404);
  });

  it('enforces tenant filter on bulk operations', async () => {
    const jwt = signJWT({ tenantId: 'tenant-A' });
    
    const res = await fetch('/api/admin/services/bulk', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${jwt}` },
      body: JSON.stringify({
        where: { status: 'DRAFT' }, // Missing tenantId filter
        data: { status: 'PUBLISHED' }
      })
    });
    
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({
      error: expect.stringContaining('tenant filter required')
    });
  });
  
  it('rejects invalid tenant cookie signature', async () => {
    const res = await fetch('/api/admin/services', {
      headers: {
        Cookie: 'tenant_sig=tenant-A.invalidsignature'
      }
    });
    
    expect(res.status).toBe(403);
  });
  
  it('blocks subdomain mismatch', async () => {
    const jwt = signJWT({ tenantId: 'tenant-A' });
    
    // Access tenant-B subdomain with tenant-A JWT
    const res = await fetch('https://tenant-b.example.com/api/services', {
      headers: { Authorization: `Bearer ${jwt}` }
    });
    
    expect(res.status).toBe(403);
  });
});
```

**2. Add to CI:**
```yaml
# .github/workflows/ci.yml
- name: Run tenant isolation tests
  run: npm run test:integration -- tenant-isolation
  
- name: Check test coverage
  run: |
    npm run test:coverage -- --collectCoverageFrom="**/api/**"
    # Fail if coverage < 90%
```

**Validation:**
```bash
npm run test:integration -- tenant-isolation
npm run test:coverage
```

**Completion Criteria:**
- [ ] All 9 tests passing
- [ ] Tests run in CI on every PR
- [ ] Coverage report generated
- [ ] No false positives/negatives

---

### ❌ Task 1.6: Verify Middleware Matcher Configuration (NOT STARTED)

**Status:** NOT STARTED | **Priority:** P0 | **Deadline:** Week 1 | **Effort:** 30min

- [ ] Verify middleware matcher includes /api/:path*
- [ ] Verify middleware excludes only static assets
- [ ] Test middleware applies to all authenticated routes
- [ ] Document matcher configuration in README

**AI Agent Steps:**

**1. Check current config:**
```typescript
// src/app/middleware.ts
export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ]
};
```

**2. Validation tests:**
```bash
# Should apply middleware
curl -I https://app.example.com/api/admin/services
# Check for x-request-id header

# Should NOT apply middleware
curl -I https://app.example.com/_next/static/chunks/main.js
# No x-request-id header
```

**3. Document:**
```markdown
## Middleware Configuration

The middleware applies to:
- All API routes (/api/*)
- All authenticated pages (excluding static assets)

Exclusions:
- /_next/static/* (Next.js static assets)
- /_next/image/* (Next.js image optimization)
- /favicon.ico
```

**Completion Criteria:**
- [ ] Matcher configuration verified
- [ ] Test requests confirm proper application
- [ ] Documentation updated
- [ ] No performance impact on static assets

---

## PHASE 2: DATA INTEGRITY 🔒

**Status:** 0% | **Priority:** P1 | **Owner:** Database Team  
**Deadline:** Week 3-5 | **Blocker:** Phase 1 must be 100% complete

**Prerequisites:**
- ✅ All 101 routes migrated to withTenantContext (Task 1.3)
- ✅ Integration tests passing (Task 1.5)
- ✅ 48 hours production monitoring with no incidents

---

### ❌ Task 2.1: Schema Tightening - Remove Nullable tenantId (BLOCKED)

**Status:** NOT STARTED | **Priority:** P1 | **Deadline:** Week 3-5 | **Effort:** 8h  
**Blocker:** Task 1.3 must be 100%

**Target Models (9 critical):**
- [ ] ServiceRequest - make tenantId NOT NULL
- [ ] Booking - make tenantId NOT NULL
- [ ] Expense - make tenantId NOT NULL
- [ ] Invoice - make tenantId NOT NULL
- [ ] Payment - make tenantId NOT NULL
- [ ] Task - make tenantId NOT NULL
- [ ] ComplianceRecord - make tenantId NOT NULL
- [ ] HealthLog - make tenantId NOT NULL
- [ ] AuditLog - make tenantId NOT NULL

**Additional Tasks:**
- [ ] Service: Review tenantId? with @@unique([tenantId, slug])
- [ ] Add defaults/backfill migrations
- [ ] Remove temporary NULL allowances post-backfill

**AI Agent Steps:**

**Step 1: Run Audit**
```bash
node scripts/check_prisma_tenant_columns.js
```

**Step 2: Generate Backfill SQL**
```sql
-- Check orphaned records
SELECT 'ServiceRequest' as table, COUNT(*) as null_count
FROM "ServiceRequest" WHERE "tenantId" IS NULL
UNION ALL
SELECT 'Booking', COUNT(*) FROM "Booking" WHERE "tenantId" IS NULL
UNION ALL
SELECT 'Expense', COUNT(*) FROM "Expense" WHERE "tenantId" IS NULL
UNION ALL
SELECT 'Invoice', COUNT(*) FROM "Invoice" WHERE "tenantId" IS NULL
UNION ALL
SELECT 'Payment', COUNT(*) FROM "Payment" WHERE "tenantId" IS NULL
UNION ALL
SELECT 'Task', COUNT(*) FROM "Task" WHERE "tenantId" IS NULL
UNION ALL
SELECT 'ComplianceRecord', COUNT(*) FROM "ComplianceRecord" WHERE "tenantId" IS NULL
UNION ALL
SELECT 'HealthLog', COUNT(*) FROM "HealthLog" WHERE "tenantId" IS NULL
UNION ALL
SELECT 'AuditLog', COUNT(*) FROM "AuditLog" WHERE "tenantId" IS NULL;

-- Backfill ServiceRequest from User relationship
UPDATE "ServiceRequest" sr
SET "tenantId" = u."tenantId"
FROM "User" u
WHERE sr."userId" = u.id AND sr."tenantId" IS NULL;

-- Backfill Booking from Service relationship
UPDATE "Booking" b
SET "tenantId" = s."tenantId"
FROM "Service" s
WHERE b."serviceId" = s.id AND b."tenantId" IS NULL;

-- Verify zero NULLs
SELECT COUNT(*) FROM "ServiceRequest" WHERE "tenantId" IS NULL; -- Should be 0
```

**Step 3: Test on Staging**
```bash
# Export staging database
pg_dump $STAGING_DATABASE_URL > staging_backup.sql

# Run backfill
psql $STAGING_DATABASE_URL < backfill.sql

# Verify
psql $STAGING_DATABASE_URL -c "
  SELECT table_name, null_count FROM (
    SELECT 'ServiceRequest' as table_name, COUNT(*) as null_count
    FROM \"ServiceRequest\" WHERE \"tenantId\" IS NULL
    UNION ALL
    SELECT 'Booking', COUNT(*) FROM \"Booking\" WHERE \"tenantId\" IS NULL
  ) t WHERE null_count > 0;
"
# Expected: 0 rows
```

**Step 4: Schedule Maintenance Window**
- [ ] Duration: 2 hours
- [ ] Notification: 48 hours advance
- [ ] Stakeholders: All tenants
- [ ] Communication: Email + in-app banner

**Step 5: Execute Production Backfill**
```bash
# Backup
pg_dump $PROD_DATABASE_URL > prod_backup_$(date +%Y%m%d_%H%M%S).sql

# Run backfill with monitoring
psql $PROD_DATABASE_URL < backfill.sql 2>&1 | tee backfill.log

# Verify
psql $PROD_DATABASE_URL < verify.sql
```

**Step 6: Update Prisma Schema**
```prisma
model ServiceRequest {
  id        String   @id @default(cuid())
  tenantId  String   // Remove '?' to make NOT NULL
  tenant    Tenant   @relation(fields: [tenantId], references: [id])
  
  @@index([tenantId])
}

model Booking {
  id        String   @id @default(cuid())
  tenantId  String   // Remove '?'
  tenant    Tenant   @relation(fields: [tenantId], references: [id])
  
  @@index([tenantId])
}

// Repeat for all 9 models
```

**Step 7: Generate Migration**
```bash
npx prisma migrate dev --name enforce_tenant_not_null
```

**Step 8: Deploy to Production**
```bash
npx prisma migrate deploy
```

**Step 9: Verify**
```sql
SELECT 
  table_name,
  column_name,
  is_nullable
FROM information_schema.columns
WHERE column_name = 'tenantId'
  AND table_schema = 'public'
ORDER BY table_name;
-- Expected: is_nullable = 'NO' for all
```

**Rollback Procedure:**
```sql
ALTER TABLE "ServiceRequest" ALTER COLUMN "tenantId" DROP NOT NULL;
ALTER TABLE "Booking" ALTER COLUMN "tenantId" DROP NOT NULL;
ALTER TABLE "Expense" ALTER COLUMN "tenantId" DROP NOT NULL;
ALTER TABLE "Invoice" ALTER COLUMN "tenantId" DROP NOT NULL;
ALTER TABLE "Payment" ALTER COLUMN "tenantId" DROP NOT NULL;
ALTER TABLE "Task" ALTER COLUMN "tenantId" DROP NOT NULL;
ALTER TABLE "ComplianceRecord" ALTER COLUMN "tenantId" DROP NOT NULL;
ALTER TABLE "HealthLog" ALTER COLUMN "tenantId" DROP NOT NULL;
ALTER TABLE "AuditLog" ALTER COLUMN "tenantId" DROP NOT NULL;
```

**Completion Criteria:**
- [ ] 0 NULL tenantId values in all 9 tables
- [ ] Prisma schema updated and deployed
- [ ] Migrations successful
- [ ] Application functioning normally
- [ ] Rollback procedure tested

---

### ❌ Task 2.2: Add Compound Foreign Keys (BLOCKED)

**Status:** NOT STARTED | **Priority:** P1 | **Deadline:** Week 5 | **Effort:** 6h  
**Blocker:** Task 2.1

**Target Relationships (12 critical):**
- [ ] Booking → Service (via tenantId + serviceId)
- [ ] Task → User (via tenantId + assigneeId)
- [ ] ServiceRequest → Service (via tenantId + serviceId)
- [ ] ServiceRequest → User (via tenantId + userId)
- [ ] Invoice → Booking (via tenantId + bookingId)
- [ ] Payment → Invoice (via tenantId + invoiceId)
- [ ] Expense → User (via tenantId + userId)
- [ ] ComplianceRecord → User (via tenantId + userId)
- [ ] HealthLog → User (via tenantId + userId)
- [ ] AuditLog → User (via tenantId + userId)
- [ ] Comment → ServiceRequest (via tenantId + serviceRequestId)
- [ ] Attachment → ServiceRequest (via tenantId + serviceRequestId)

**AI Agent Steps:**

**Step 1: Update Prisma Schema**
```prisma
model Service {
  id          String  @id @default(cuid())
  tenantId    String
  slug        String
  
  tenant      Tenant  @relation(fields: [tenantId], references: [id])
  bookings    Booking[]
  
  @@unique([id, tenantId]) // Compound key for FK references
  @@unique([tenantId, slug])
  @@index([tenantId])
}

model Booking {
  id          String  @id @default(cuid())
  tenantId    String
  serviceId   String
  
  tenant      Tenant  @relation(fields: [tenantId], references: [id])
  service     Service @relation(
    fields: [serviceId, tenantId],
    references: [id, tenantId]
  )
  
  @@index([tenantId, serviceId])
}

model Task {
  id          String  @id @default(cuid())
  tenantId    String
  assigneeId  String?
  
  tenant      Tenant  @relation(fields: [tenantId], references: [id])
  assignee    User?   @relation(
    fields: [assigneeId, tenantId],
    references: [id, tenantId]
  )
  
  @@unique([id, tenantId])
  @@index([tenantId, assigneeId])
}

// Repeat pattern for all 12 relationships
```

**Step 2: Generate Migration**
```bash
npx prisma migrate dev --name add_compound_fks
```

**Step 3: Test on Staging**
```bash
# Deploy to staging
npx prisma migrate deploy

# Test FK violations (should fail)
psql $STAGING_DATABASE_URL -c "
  INSERT INTO \"Booking\" (id, \"tenantId\", \"serviceId\")
  VALUES ('test-1', 'tenant-A', 'service-from-tenant-B');
"
# Expected: FK constraint violation
```

**Step 4: Fix Data Inconsistencies**
```sql
-- Find mismatched relationships
SELECT 
  b.id as booking_id,
  b."tenantId" as booking_tenant,
  s."tenantId" as service_tenant
FROM "Booking" b
JOIN "Service" s ON b."serviceId" = s.id
WHERE b."tenantId" != s."tenantId";

-- Resolution: Update booking tenant to match service
UPDATE "Booking" b
SET "tenantId" = s."tenantId"
FROM "Service" s
WHERE b."serviceId" = s.id AND b."tenantId" != s."tenantId";
```

**Step 5: Deploy to Production**
```bash
npx prisma migrate deploy
```

**Step 6: Verify**
```sql
SELECT 
  conname as constraint_name,
  conrelid::regclass as table_name,
  confrelid::regclass as references_table,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE contype = 'f' 
  AND conname LIKE '%tenant%'
ORDER BY conname;
```

**Completion Criteria:**
- [ ] All 12 compound FKs created
- [ ] No data inconsistencies remain
- [ ] FK violations properly blocked
- [ ] Application functioning normally

---

### ❌ Task 2.3: Add Partial Unique Indexes (BLOCKED)

**Status:** NOT STARTED | **Priority:** P1 | **Deadline:** Week 5 | **Effort:** 2h  
**Blocker:** Task 2.1

**Target Models (5 settings tables):**
- [ ] OrganizationSettings - partial index
- [ ] BookingSettings - partial index
- [ ] IntegrationSettings - partial index
- [ ] SecuritySettings - partial index
- [ ] CommunicationSettings - partial index

**AI Agent Steps:**

**Step 1: Update Prisma Schema**
```prisma
model OrganizationSettings {
  id        String  @id @default(cuid())
  tenantId  String?
  
  tenant    Tenant? @relation(fields: [tenantId], references: [id])
  
  @@unique([tenantId], where: { tenantId: { not: null } })
  @@index([tenantId])
}

// Repeat for all 5 settings models
```

**Step 2: Generate SQL Migration**
```sql
CREATE UNIQUE INDEX "OrganizationSettings_tenantId_key" 
ON "OrganizationSettings"("tenantId") 
WHERE "tenantId" IS NOT NULL;

CREATE UNIQUE INDEX "BookingSettings_tenantId_key" 
ON "BookingSettings"("tenantId") 
WHERE "tenantId" IS NOT NULL;

-- Repeat for all settings tables
```

**Step 3: Deploy**
```bash
npx prisma migrate dev --name add_partial_unique_indexes
npx prisma migrate deploy
```

**Completion Criteria:**
- [ ] Partial indexes created on all 5 tables
- [ ] Global settings (tenantId=NULL) remain unique
- [ ] Tenant-scoped settings enforced unique per tenant

---

### ❌ Task 2.4: Run Backfill Scripts and Verification (BLOCKED)

**Status:** NOT STARTED | **Priority:** P1 | **Deadline:** Week 5 | **Effort:** 4h  
**Blocker:** Task 2.1

**Deliverables:**
- [ ] Create backfill script for each model
- [ ] Run verification queries post-backfill
- [ ] Document orphaned record resolution strategy
- [ ] Archive or delete orphaned records per business rules

**AI Agent Steps:**

**Step 1: Orphaned Record Resolution**
```sql
-- Identify orphaned records
SELECT 
  'ServiceRequest' as table_name,
  COUNT(*) as orphaned_count
FROM "ServiceRequest" sr
LEFT JOIN "User" u ON sr."userId" = u.id
WHERE sr."tenantId" IS NULL AND u."tenantId" IS NULL

UNION ALL

SELECT 'Booking', COUNT(*)
FROM "Booking" b
LEFT JOIN "Service" s ON b."serviceId" = s.id
WHERE b."tenantId" IS NULL AND s."tenantId" IS NULL;

-- Option 1: Assign to system tenant
UPDATE "ServiceRequest"
SET "tenantId" = (SELECT id FROM "Tenant" WHERE slug = 'system' LIMIT 1)
WHERE "tenantId" IS NULL;

-- Option 2: Delete old orphaned records
DELETE FROM "ServiceRequest"
WHERE "tenantId" IS NULL 
  AND "createdAt" < NOW() - INTERVAL '90 days';

-- Option 3: Archive for manual review
CREATE TABLE "OrphanedServiceRequests" AS
SELECT * FROM "ServiceRequest" WHERE "tenantId" IS NULL;

DELETE FROM "ServiceRequest" WHERE "tenantId" IS NULL;
```

**Step 2: Post-Backfill Verification**
```sql
-- 1. Verify zero NULL tenantId
SELECT 
  table_name,
  null_count
FROM (
  SELECT 'ServiceRequest' as table_name, COUNT(*) as null_count
  FROM "ServiceRequest" WHERE "tenantId" IS NULL
  UNION ALL
  SELECT 'Booking', COUNT(*) FROM "Booking" WHERE "tenantId" IS NULL
  UNION ALL
  SELECT 'Expense', COUNT(*) FROM "Expense" WHERE "tenantId" IS NULL
) t WHERE null_count > 0;
-- Expected: 0 rows

-- 2. Check for cross-tenant references
SELECT 
  'Booking-Service mismatch' as issue,
  COUNT(*) as count
FROM "Booking" b
JOIN "Service" s ON b."serviceId" = s.id
WHERE b."tenantId" != s."tenantId"

UNION ALL

SELECT 'Task-User mismatch', COUNT(*)
FROM "Task" t
JOIN "User" u ON t."assigneeId" = u.id
WHERE t."tenantId" != u."tenantId";
-- Expected: all counts = 0
```

**Completion Criteria:**
- [ ] 0 NULL tenantId in all tables
- [ ] 0 cross-tenant references
- [ ] Orphaned records resolved (archived/deleted)
- [ ] Verification queries passing

---

## PHASE 3: DATABASE-LEVEL SECURITY (RLS) 🛡️

**Status:** 0% | **Priority:** P1 | **Owner:** Database Team  
**Deadline:** Week 6-7 | **Blocker:** Phase 2 must be 100%

**Prerequisites:**
- ✅ All tenantId columns NOT NULL (Task 2.1)
- ✅ All compound FKs in place (Task 2.2)
- ✅ Data integrity verified (Task 2.4)

---

### ❌ Task 3.1: Enable Row-Level Security Policies (BLOCKED)

**Status:** NOT STARTED | **Priority:** P1 | **Deadline:** Week 6-7 | **Effort:** 8h  
**Blocker:** Task 2.4

**RLS-Enabled Tables (18 total):**
- [ ] User
- [ ] ServiceRequest
- [ ] Booking
- [ ] Service
- [ ] Task
- [ ] Expense
- [ ] Invoice
- [ ] Payment
- [ ] ComplianceRecord
- [ ] HealthLog
- [ ] AuditLog
- [ ] Comment
- [ ] Attachment
- [ ] OrganizationSettings
- [ ] IntegrationSettings
- [ ] CommunicationSettings
- [ ] SecuritySettings
- [ ] BookingSettings

**AI Agent Steps:**

**Step 1: Create RLS Migration SQL**
```sql
-- migration_rls_enable.sql

-- Enable RLS on all tenant-scoped tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ServiceRequest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Booking" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Service" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Task" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Expense" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Invoice" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Payment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ComplianceRecord" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "HealthLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Comment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Attachment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrganizationSettings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "IntegrationSettings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CommunicationSettings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SecuritySettings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BookingSettings" ENABLE ROW LEVEL SECURITY;

-- Create tenant isolation policy for User
CREATE POLICY tenant_isolation ON "User"
  USING ("tenantId" = current_setting('app.current_tenant_id', TRUE)::text);

CREATE POLICY admin_bypass ON "User"
  USING (current_setting('app.is_superadmin', TRUE)::boolean = TRUE);

-- Create policies for all other tables (template for Service)
CREATE POLICY tenant_isolation ON "Service"
  USING ("tenantId" = current_setting('app.current_tenant_id', TRUE)::text);

CREATE POLICY admin_bypass ON "Service"
  USING (current_setting('app.is_superadmin', TRUE)::boolean = TRUE);

-- Special handling for settings tables with nullable tenantId
CREATE POLICY tenant_isolation ON "OrganizationSettings"
  USING (
    "tenantId" IS NULL OR 
    "tenantId" = current_setting('app.current_tenant_id', TRUE)::text
  );

CREATE POLICY admin_bypass ON "OrganizationSettings"
  USING (current_setting('app.is_superadmin', TRUE)::boolean = TRUE);

-- Repeat for all 18 tables
```

**Step 2: Test on Staging**
```bash
psql $STAGING_DATABASE_URL < migration_rls_enable.sql

# Test isolation
psql $STAGING_DATABASE_URL <<EOF
SET app.current_tenant_id = 'tenant-A';
SELECT COUNT(*) FROM "User"; -- Should only return tenant-A users

SET app.current_tenant_id = 'tenant-B';
SELECT COUNT(*) FROM "User"; -- Should only return tenant-B users

RESET app.current_tenant_id;
SELECT COUNT(*) FROM "User"; -- Should return 0 or error
EOF
```

**Step 3: Create Prisma RLS Helper**
```typescript
// src/lib/prisma-rls.ts
import { prisma } from './prisma';

export async function withRLS<T>(
  tenantId: string,
  fn: () => Promise<T>
): Promise<T> {
  try {
    await prisma.$executeRawUnsafe(
      `SET LOCAL app.current_tenant_id = '${tenantId}'`
    );
    return await fn();
  } finally {
    await prisma.$executeRawUnsafe(`RESET app.current_tenant_id`);
  }
}

export async function withSuperAdmin<T>(
  fn: () => Promise<T>
): Promise<T> {
  try {
    await prisma.$executeRawUnsafe(`SET LOCAL app.is_superadmin = TRUE`);
    return await fn();
  } finally {
    await prisma.$executeRawUnsafe(`RESET app.is_superadmin`);
  }
}

export async function tenantRawQuery<T = unknown>(
  tenantId: string,
  query: string,
  ...params: unknown[]
): Promise<T> {
  return withRLS(tenantId, async () => {
    return prisma.$queryRawUnsafe<T>(query, ...params);
  });
}
```

**Step 4: Update API Wrapper**
```typescript
// src/lib/api-wrapper.ts
import { withRLS } from './prisma-rls';

export function withTenantContext<T>(
  handler: RouteHandler<T>,
  options: RouteOptions = {}
): NextApiHandler {
  return async (req, res) => {
    // ... existing auth logic ...
    
    // Execute handler within RLS context
    return withRLS(tenant.id, async () => {
      return handler(req, { user, tenant, params });
    });
  };
}
```

**Step 5: Deploy to Production**
```bash
# Backup
pg_dump $PROD_DATABASE_URL > prod_backup_before_rls_$(date +%Y%m%d).sql

# Deploy
psql $PROD_DATABASE_URL < migration_rls_enable.sql

# Verify
psql $PROD_DATABASE_URL -c "
  SELECT schemaname, tablename, rowsecurity
  FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY tablename;
"
```

**Step 6: Monitor**
```bash
# Watch for RLS errors
tail -f logs/app.log | grep -i "row-level security"

# Check Sentry
curl https://sentry.io/api/0/projects/{project}/events/?query=rls
```

**Rollback Procedure:**
```sql
-- EMERGENCY: Disable RLS
ALTER TABLE "User" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "ServiceRequest" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Booking" DISABLE ROW LEVEL SECURITY;
-- Repeat for all 18 tables

-- Drop policies
DROP POLICY IF EXISTS tenant_isolation ON "User";
DROP POLICY IF EXISTS admin_bypass ON "User";
-- Repeat for all tables
```

**Completion Criteria:**
- [ ] RLS enabled on all 18 tables
- [ ] Tenant isolation policies active
- [ ] Super-admin bypass working
- [ ] Performance impact < 5%
- [ ] Application functioning normally

---

### ❌ Task 3.2: Add Prisma Helpers for Session Variables (BLOCKED)

**Status:** NOT STARTED | **Priority:** P1 | **Deadline:** Week 7 | **Effort:** 2h  
**Blocker:** Task 3.1

**Already covered in Task 3.1 - Additional helpers:**

```typescript
// src/lib/prisma-rls.ts (extended)

export async function withTenantTransaction<T>(
  tenantId: string,
  fn: (tx: PrismaClient) => Promise<T>
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(
      `SET LOCAL app.current_tenant_id = '${tenantId}'`
    );
    
    try {
      return await fn(tx);
    } finally {
      await tx.$executeRawUnsafe(`RESET app.current_tenant_id`);
    }
  });
}

export function registerRLSMiddleware() {
  prisma.$use(async (params, next) => {
    const tenantId = getTenantContext()?.id;
    
    if (!tenantId) {
      console.warn('RLS middleware: No tenant context');
      return next(params);
    }
    
    await prisma.$executeRawUnsafe(
      `SET LOCAL app.current_tenant_id = '${tenantId}'`
    );
    
    try {
      return await next(params);
    } finally {
      await prisma.$executeRawUnsafe(`RESET app.current_tenant_id`);
    }
  });
}
```

**Tasks:**
- [ ] Create extended RLS helpers
- [ ] Add transaction support
- [ ] Register Prisma middleware
- [ ] Test transaction isolation
- [ ] Document usage patterns

**Completion Criteria:**
- [ ] All helpers implemented
- [ ] Transaction support working
- [ ] Middleware registered
- [ ] Tests passing

---

### ❌ Task 3.3: Wrap Raw Queries with RLS Helper (BLOCKED)

**Status:** NOT STARTED | **Priority:** P1 | **Deadline:** Week 7 | **Effort:** 6h  
**Blocker:** Task 3.2

**AI Agent Steps:**

**Step 1: Find Raw Queries**
```bash
# Find all raw query usage
grep -r "\$queryRaw" src --include="*.ts" -n > raw_queries.txt
grep -r "\$executeRaw" src --include="*.ts" -n >> raw_queries.txt
grep -r "\$queryRawUnsafe" src --include="*.ts" -n >> raw_queries.txt

# Count total
wc -l raw_queries.txt
```

**Step 2: Create Tracking Sheet**
```csv
File,Line,Query Type,Status,Notes
src/app/api/admin/stats/bookings/route.ts,45,$queryRaw,Pending,Analytics query
src/app/api/admin/analytics/route.ts,120,$queryRaw,Pending,Dashboard stats
```

**Step 3: Wrap Each Query**
```typescript
// BEFORE
const stats = await prisma.$queryRaw`
  SELECT 
    DATE_TRUNC('day', "createdAt") as date,
    COUNT(*) as count
  FROM "Booking"
  WHERE "createdAt" >= ${startDate}
  GROUP BY date
`;

// AFTER
import { withRLS } from '@/lib/prisma-rls';

const stats = await withRLS(tenant.id, async () => {
  return prisma.$queryRaw`
    SELECT 
      DATE_TRUNC('day', "createdAt") as date,
      COUNT(*) as count
    FROM "Booking"
    WHERE "createdAt" >= ${startDate}
    GROUP BY date
  `;
});
```

**Step 4: Batch Process**
```bash
# Process 5 files at a time
while read -r file; do
  echo "Wrapping raw queries in: $file"
  node scripts/wrap-raw-queries.js "$file"
  npm test -- "${file/.ts/.test.ts}"
  
  if [ $? -eq 0 ]; then
    git add "$file"
  else
    git checkout "$file"
  fi
done < raw_queries_list.txt
```

**Completion Criteria:**
- [ ] All raw queries wrapped with RLS helper
- [ ] Tests passing for all files
- [ ] Tracking sheet complete
- [ ] No unwrapped queries remain

---

## PHASE 4: OBSERVABILITY & MONITORING 📊

**Status:** 0% | **Priority:** P2 | **Owner:** Platform Team  
**Deadline:** Week 8 | **Blocker:** Phase 3 must be 100%

---

### ❌ Task 4.1: Enhanced Structured Logging (BLOCKED)

**Status:** NOT STARTED | **Priority:** P2 | **Deadline:** Week 8 | **Effort:** 4h  
**Blocker:** Phase 3

**Tasks:**
- [ ] Create src/lib/logger.ts with winston/pino
- [ ] Add tenant context to all logs
- [ ] Integrate with Prisma middleware for query logging
- [ ] Configure log rotation and retention
- [ ] Tag logs and Sentry with tenant_id
- [ ] Set up log aggregation (DataDog/CloudWatch/ELK)

**Already partially covered in Task 1.4 - Extended implementation:**

```typescript
// src/lib/logger.ts (production-ready)
import winston from 'winston';
import { getTenantContext } from './tenant-context';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'tenant-api',
    environment: process.env.NODE_ENV
  },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5
    }),
    new winston.transports.File({ 
      filename: 'logs/app.log',
      maxsize: 10485760,
      maxFiles: 10
    })
  ]
});

export function logWithContext(
  level: 'info' | 'warn' | 'error' | 'debug',
  message: string,
  meta: Record<string, unknown> = {}
) {
  const context = getTenantContext();
  
  logger.log(level, message, {
    ...meta,
    tenantId: context?.id,
    tenantSlug: context?.slug,
    userId: context?.userId,
    requestId: context?.requestId
  });
}

export const log = {
  info: (msg: string, meta?: Record<string, unknown>) => 
    logWithContext('info', msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => 
    logWithContext('warn', msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => 
    logWithContext('error', msg, meta),
  debug: (msg: string, meta?: Record<string, unknown>) => 
    logWithContext('debug', msg, meta)
};
```

**Prisma Query Logging:**
```typescript
// src/lib/prisma.ts
import { logger } from './logger';

prisma.$use(async (params, next) => {
  const start = Date.now();
  const context = getTenantContext();
  
  try {
    const result = await next(params);
    const duration = Date.now() - start;
    
    logger.debug('Prisma query', {
      model: params.model,
      action: params.action,
      duration,
      tenantId: context?.id
    });
    
    return result;
  } catch (error) {
    logger.error('Prisma query failed', {
      model: params.model,
      action: params.action,
      error: error instanceof Error ? error.message : 'Unknown',
      tenantId: context?.id
    });
    throw error;
  }
});
```

**Completion Criteria:**
- [ ] Logger implemented with context
- [ ] Prisma queries logged
- [ ] Log rotation configured
- [ ] Sentry integration complete
- [ ] Log aggregation set up

---

### ❌ Task 4.2: Monitoring Dashboards and Alerts (BLOCKED)

**Status:** NOT STARTED | **Priority:** P2 | **Deadline:** Week 8 | **Effort:** 6h  
**Blocker:** Phase 3

**Dashboards to Create:**
- [ ] Tenant isolation metrics dashboard
- [ ] Tenant-specific request volume
- [ ] Tenant-specific error rates
- [ ] Cross-tenant access attempts (should be 0)
- [ ] RLS policy violations
- [ ] Tenant context establishment success rate

**Grafana Dashboard (JSON template):**
```json
{
  "dashboard": {
    "title": "Tenant Isolation Metrics",
    "panels": [
      {
        "title": "Requests by Tenant",
        "targets": [{
          "expr": "sum(rate(http_requests_total{job=\"api\"}[5m])) by (tenant_id)"
        }]
      },
      {
        "title": "Cross-Tenant Access Attempts",
        "targets": [{
          "expr": "sum(rate(tenant_mismatch_errors_total[5m]))"
        }],
        "alert": {
          "conditions": [{
            "evaluator": { "type": "gt", "params": [0] }
          }]
        }
      }
    ]
  }
}
```

**Alert Rules (YAML):**
```yaml
groups:
  - name: tenant_isolation
    interval: 1m
    rules:
      - alert: CrossTenantAccessAttempt
        expr: rate(tenant_mismatch_errors_total[5m]) > 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Cross-tenant access detected"
      
      - alert: RLSViolation
        expr: rate(rls_violation_errors_total[5m]) > 0
        for: 1m
        labels:
          severity: critical
```

**Tasks:**
- [ ] Create Grafana dashboard
- [ ] Configure alert rules
- [ ] Set up PagerDuty/Slack integration
- [ ] Create weekly health report script
- [ ] Test alert firing

**Completion Criteria:**
- [ ] Dashboard deployed
- [ ] Alerts configured
- [ ] Notifications working
- [ ] Weekly reports automated

---

### ❌ Task 4.3: CI Integration for Tenant Checks (BLOCKED)

**Status:** NOT STARTED | **Priority:** P2 | **Deadline:** Week 8 | **Effort:** 3h  
**Blocker:** Phase 3

**CI Workflow:**
```yaml
# .github/workflows/tenant-checks.yml
name: Tenant Security Checks

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main]

jobs:
  tenant-security-audit:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Check Prisma tenant columns
        run: node scripts/check_prisma_tenant_columns.js
      
      - name: Detect unsafe route patterns
        run: |
          UNSAFE_ROUTES=$(grep -r "getServerSession" src/app/api --include="*.ts" | grep -v withTenantContext | wc -l)
          
          if [ $UNSAFE_ROUTES -gt 0 ]; then
            echo "ERROR: Found routes without withTenantContext"
            exit 1
          fi
      
      - name: Run tenant isolation tests
        run: npm run test:integration -- tenant-isolation
      
      - name: Type check
        run: npm run type-check
```

**PR Template:**
```markdown
## Tenant Security Checklist
- [ ] All new API routes use `withTenantContext`
- [ ] No direct `getServerSession` usage
- [ ] All Prisma queries include tenant scoping
- [ ] New models include `tenantId` with indexing
- [ ] Tests include tenant isolation validation
- [ ] No client-side tenant header injection
```

**Tasks:**
- [ ] Create CI workflow file
- [ ] Add security checks
- [ ] Configure PR template
- [ ] Test workflow on PR
- [ ] Document CI requirements

**Completion Criteria:**
- [ ] CI workflow active
- [ ] All checks passing
- [ ] PR template in use
- [ ] Failed PRs blocked from merge

---

## PHASE 5: TESTING & QA ✅

**Status:** 10% | **Priority:** P1 | **Owner:** QA Team  
**Deadline:** Week 2-6 (parallel) | **No blockers**

---

### ❌ Task 5.1: Unit Tests for Tenant Utilities (NOT STARTED)

**Status:** NOT STARTED | **Priority:** P1 | **Deadline:** Week 2-3 | **Effort:** 4h

**Test Files to Create:**
- [ ] tests/unit/tenant-utils.test.ts
- [ ] tests/unit/tenant-context.test.ts
- [ ] tests/unit/tenant-cookie.test.ts
- [ ] tests/unit/api-wrapper.test.ts
- [ ] tests/unit/prisma-tenant-guard.test.ts

**Example Test File:**
```typescript
// tests/unit/tenant-cookie.test.ts
import { describe, it, expect } from '@jest/globals';
import { signTenantCookie, verifyTenantCookie } from '@/lib/tenant-cookie';

describe('Tenant Cookie', () => {
  const secret = 'test-secret';

  it('should sign tenant data', () => {
    const signed = signTenantCookie('tenant-123', secret);
    expect(signed).toMatch(/^tenant-123\.[a-f0-9]{64}$/);
  });

  it('should verify valid signature', () => {
    const signed = signTenantCookie('tenant-123', secret);
    const verified = verifyTenantCookie(signed, secret);
    expect(verified).toBe('tenant-123');
  });

  it('should reject invalid signature', () => {
    const verified = verifyTenantCookie('tenant-123.invalidsig', secret);
    expect(verified).toBeNull();
  });

  it('should reject tampered tenant ID', () => {
    const signed = signTenantCookie('tenant-123', secret);
    const tampered = signed.replace('tenant-123', 'tenant-456');
    const verified = verifyTenantCookie(tampered, secret);
    expect(verified).toBeNull();
  });
});
```

**Validation:**
```bash
npm run test:unit
npm run test:coverage -- tests/unit/

# Target coverage: > 90%
```

**Completion Criteria:**
- [ ] All 5 test files created
- [ ] > 90% statement coverage
- [ ] > 85% branch coverage
- [ ] All tests passing in CI

---

### Task 5.2: Integration Tests for Prisma Middleware (10% COMPLETE)

**Status:** 10% (basic tests exist) | **Priority:** P1 | **Deadline:** Week 3 | **Effort:** 3h

**Already Completed:**
- [x] tests/integration/prisma-tenant-guard.test.ts (basic)

**Additional Tests Needed:**
- [ ] Extended read operations tests
- [ ] Write operations tenant validation
- [ ] Bulk operations tenant filter requirements
- [ ] Transaction support tests
- [ ] Cross-tenant reference blocking

**Example Extended Test:**
```typescript
describe('Prisma Tenant Guard - Extended', () => {
  describe('Write Operations', () => {
    it('should reject create without tenantId', async () => {
      await runWithTenantContext({ id: 'tenant-A', slug: 'a' }, async () => {
        await expect(
          prisma.user.create({
            data: {
              email: 'test@example.com',
              name: 'Test User'
              // Missing tenantId
            }
          })
        ).rejects.toThrow('tenantId required');
      });
    });

    it('should reject create with mismatched tenantId', async () => {
      await runWithTenantContext({ id: 'tenant-A', slug: 'a' }, async () => {
        await expect(
          prisma.user.create({
            data: {
              email: 'test@example.com',
              name: 'Test User',
              tenantId: 'tenant-B' // Wrong tenant
            }
          })
        ).rejects.toThrow('tenant mismatch');
      });
    });
  });

  describe('Bulk Operations', () => {
    it('should require tenant filter for updateMany', async () => {
      await runWithTenantContext({ id: 'tenant-A', slug: 'a' }, async () => {
        await expect(
          prisma.user.updateMany({
            where: { status: 'ACTIVE' }, // Missing tenantId
            data: { status: 'INACTIVE' }
          })
        ).rejects.toThrow('bulk operations require tenant filter');
      });
    });
  });
});
```

**Validation:**
```bash
npm run test:integration -- prisma-tenant-guard
```

**Completion Criteria:**
- [ ] All extended tests passing
- [ ] Coverage > 85%
- [ ] Transaction tests included
- [ ] Bulk operation tests included

---

### ❌ Task 5.3: E2E Tests for Subdomain and Tenant Switching (NOT STARTED)

**Status:** NOT STARTED | **Priority:** P2 | **Deadline:** Week 4 | **Effort:** 6h

**Test Files to Create:**
- [ ] tests/e2e/subdomain-routing.spec.ts
- [ ] tests/e2e/tenant-switching.spec.ts

**Playwright Test Example:**
```typescript
// tests/e2e/subdomain-routing.spec.ts
import { test, expect } from '@playwright/test';

test('should route to correct tenant based on subdomain', async ({ page }) => {
  await page.goto('https://tenant-a.localhost:3000/dashboard');
  
  const tenantSlug = await page.locator('[data-testid="tenant-slug"]').textContent();
  expect(tenantSlug).toBe('tenant-a');
});

test('should deny access to cross-tenant resources', async ({ page }) => {
  await page.goto('https://tenant-a.localhost:3000/login');
  await page.fill('[name="email"]', 'admin@tenant-a.com');
  await page.fill('[name="password"]', 'password');
  await page.click('button[type="submit"]');

  const response = await page.goto('https://tenant-b.localhost:3000/api/services');
  expect(response?.status()).toBe(403);
});
```

**Playwright Config:**
```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
  },
});
```

**Validation:**
```bash
npx playwright test
npx playwright test --ui
```

**Completion Criteria:**
- [ ] Subdomain routing tests passing
- [ ] Tenant switching tests passing
- [ ] Cross-tenant access blocked in tests
- [ ] Tests run in CI

---

### ❌ Task 5.4: Migration Tests (NOT STARTED)

**Status:** NOT STARTED | **Priority:** P1 | **Deadline:** Week 5 | **Effort:** 4h

**Test Files to Create:**
- [ ] tests/migrations/schema-changes.test.ts
- [ ] tests/migrations/data-backfill.test.ts
- [ ] tests/migrations/rls-policies.test.ts

**Example Migration Test:**
```typescript
describe('Schema Migrations', () => {
  it('should have NOT NULL constraint on tenantId', async () => {
    const result = await prisma.$queryRawUnsafe<any[]>(`
      SELECT column_name, is_nullable
      FROM information_schema.columns
      WHERE column_name = 'tenantId'
        AND table_name IN ('ServiceRequest', 'Booking', 'Expense')
    `);

    for (const row of result) {
      expect(row.is_nullable).toBe('NO');
    }
  });

  it('should have compound unique constraints', async () => {
    const result = await prisma.$queryRawUnsafe<any[]>(`
      SELECT conname
      FROM pg_constraint
      WHERE conname LIKE '%tenantId%' AND contype = 'u'
    `);

    expect(result.length).toBeGreaterThan(0);
  });
});
```

**Completion Criteria:**
- [ ] Schema validation tests passing
- [ ] Data backfill tests passing
- [ ] RLS policy tests passing
- [ ] Tests run before migrations

---

### ❌ Task 5.5: Regression Tests for Analytics (NOT STARTED)

**Status:** NOT STARTED | **Priority:** P2 | **Deadline:** Week 6 | **Effort:** 3h

**Test File:**
```typescript
// tests/integration/analytics-isolation.test.ts
describe('Analytics Tenant Isolation', () => {
  it('should return tenant-specific booking stats', async () => {
    const jwtA = signJWT({ tenantId: 'tenant-A', userId: 'admin-A' });
    
    const res = await fetch('/api/admin/stats/bookings', {
      headers: { Authorization: `Bearer ${jwtA}` }
    });

    const stats = await res.json();
    expect(stats.total).toBeGreaterThan(0);
  });

  it('should not leak cross-tenant aggregates', async () => {
    await createTestBooking('tenant-A', { amount: 100 });
    await createTestBooking('tenant-B', { amount: 200 });

    const jwtA = signJWT({ tenantId: 'tenant-A' });
    const res = await fetch('/api/admin/stats/bookings', {
      headers: { Authorization: `Bearer ${jwtA}` }
    });

    const stats = await res.json();
    expect(stats.totalRevenue).toBe(100); // Only tenant-A's data
  });
});
```

**Completion Criteria:**
- [ ] Analytics isolation tests passing
- [ ] No cross-tenant data leakage detected
- [ ] Time-series data properly isolated

---

## PHASE 6: REPOSITORY LAYER

**Status:** 0% | **Priority:** P2 | **Owner:** Backend Team  
**Deadline:** Week 9 | **Blocker:** Phase 3 must be 100%

---

### ❌ Task 6.1: Create Tenant-Scoped Repository Abstractions (BLOCKED)

**Status:** NOT STARTED | **Priority:** P1 | **Deadline:** Week 9 | **Effort:** 8h  
**Blocker:** Phase 3

**Repositories to Create:**
- [ ] UserRepository
- [ ] ServiceRepository
- [ ] ServiceRequestRepository
- [ ] BookingRepository
- [ ] TaskRepository

**Base Repository Template:**
```typescript
// src/repositories/base.repository.ts
import { PrismaClient } from '@prisma/client';
import { getTenantContext } from '@/lib/tenant-context';

export abstract class BaseRepository<T> {
  constructor(protected prisma: PrismaClient) {}

  protected getTenantId(): string {
    const context = getTenantContext();
    if (!context) {
      throw new Error('Tenant context required');
    }
    return context.id;
  }

  protected getTenantFilter() {
    return { tenantId: this.getTenantId() };
  }
}
```

**Service Repository Example:**
```typescript
// src/repositories/service.repository.ts
import { Prisma, Service } from '@prisma/client';
import { BaseRepository } from './base.repository';

export class ServiceRepository extends BaseRepository<Service> {
  async findById(id: string): Promise<Service | null> {
    return this.prisma.service.findFirst({
      where: {
        id,
        ...this.getTenantFilter()
      }
    });
  }

  async findBySlug(slug: string): Promise<Service | null> {
    return this.prisma.service.findUnique({
      where: {
        tenantId_slug: {
          tenantId: this.getTenantId(),
          slug
        }
      }
    });
  }

  async findMany(where?: Prisma.ServiceWhereInput): Promise<Service[]> {
    return this.prisma.service.findMany({
      where: {
        ...where,
        ...this.getTenantFilter()
      }
    });
  }

  async create(data: Omit<Prisma.ServiceCreateInput, 'tenant'>): Promise<Service> {
    return this.prisma.service.create({
      data: {
        ...data,
        tenant: {
          connect: { id: this.getTenantId() }
        }
      }
    });
  }
}
```

**Repository Factory:**
```typescript
// src/repositories/index.ts
import { PrismaClient } from '@prisma/client';
import { UserRepository } from './user.repository';
import { ServiceRepository } from './service.repository';
import { prisma } from '@/lib/prisma';

export class RepositoryFactory {
  constructor(private prisma: PrismaClient = prisma) {}

  get users(): UserRepository {
    return new UserRepository(this.prisma);
  }

  get services(): ServiceRepository {
    return new ServiceRepository(this.prisma);
  }
}

export const repositories = new RepositoryFactory();
export const userRepository = repositories.users;
export const serviceRepository = repositories.services;
```

**Completion Criteria:**
- [ ] All 5 repositories implemented
- [ ] Factory pattern in place
- [ ] All CRUD operations supported
- [ ] Tests passing
- [ ] Documentation updated

---

### ❌ Task 6.2: Refactor Service Modules (BLOCKED)

**Status:** NOT STARTED | **Priority:** P2 | **Deadline:** Week 10 | **Effort:** 6h  
**Blocker:** Task 6.1

**Service Layer Example:**
```typescript
// src/services/booking.service.ts
import { bookingRepository, serviceRepository } from '@/repositories';

export class BookingService {
  async createBooking(data: {
    serviceId: string;
    userId: string;
    startTime: Date;
    endTime: Date;
  }) {
    // Validate service exists
    const service = await serviceRepository.findById(data.serviceId);
    if (!service) {
      throw new Error('Service not found');
    }

    // Check conflicts
    const conflicts = await bookingRepository.findMany({
      serviceId: data.serviceId,
      status: { in: ['CONFIRMED', 'PENDING'] },
      OR: [
        { startTime: { lte: data.startTime }, endTime: { gt: data.startTime } },
        { startTime: { lt: data.endTime }, endTime: { gte: data.endTime } }
      ]
    });

    if (conflicts.length > 0) {
      throw new Error('Time slot not available');
    }

    return bookingRepository.create({
      service: { connect: { id: data.serviceId } },
      user: { connect: { id: data.userId } },
      startTime: data.startTime,
      endTime: data.endTime,
      status: 'PENDING'
    });
  }
}

export const bookingService = new BookingService();
```

**Tasks:**
- [ ] Create BookingService
- [ ] Create ServiceService
- [ ] Create UserService
- [ ] Add business logic layer
- [ ] Add caching layer
- [ ] Refactor routes to use services

**Completion Criteria:**
- [ ] All service modules created
- [ ] Business logic centralized
- [ ] Routes use service layer
- [ ] Tests passing

---

### ❌ Task 6.3: Background Jobs and Cron Scripts (BLOCKED)

**Status:** NOT STARTED | **Priority:** P2 | **Deadline:** Week 10 | **Effort:** 4h  
**Blocker:** Task 6.1

**Job Pattern:**
```typescript
// src/jobs/send-booking-reminders.ts
import { prisma } from '@/lib/prisma';
import { runWithTenantContext } from '@/lib/tenant-context';
import { bookingRepository } from '@/repositories';

export async function sendBookingReminders() {
  console.log('Starting booking reminder job');

  const tenants = await prisma.tenant.findMany({
    where: { status: 'ACTIVE' }
  });

  for (const tenant of tenants) {
    try {
      await runWithTenantContext(
        { id: tenant.id, slug: tenant.slug },
        async () => {
          const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
          const dayAfter = new Date(Date.now() + 25 * 60 * 60 * 1000);

          const bookings = await bookingRepository.findMany({
            startTime: { gte: tomorrow, lt: dayAfter },
            status: 'CONFIRMED',
            reminderSent: false
          });

          for (const booking of bookings) {
            await sendReminderEmail(booking);
            await bookingRepository.update(booking.id, {
              reminderSent: true
            });
          }
        }
      );
    } catch (error) {
      console.error(`Error for tenant ${tenant.slug}:`, error);
    }
  }
}
```

**Cron Configuration:**
```typescript
// src/jobs/index.ts
import cron from 'node-cron';

export function initializeJobs() {
  cron.schedule('0 * * * *', async () => {
    await sendBookingReminders();
  });

  cron.schedule('0 2 * * *', async () => {
    await cleanupExpiredSessions();
  });
}
```

**Tasks:**
- [ ] Create booking reminder job
- [ ] Create session cleanup job
- [ ] Create daily report job
- [ ] Configure cron schedules
- [ ] Add job monitoring

**Completion Criteria:**
- [ ] All jobs implemented
- [ ] Cron schedules configured
- [ ] Jobs run in tenant context
- [ ] Error handling in place

---

## PHASE 7: CLIENT UPDATES

**Status:** 50% | **Priority:** P2 | **Owner:** Frontend Team  
**Deadline:** Week 11 | **No blockers**

---

### Task 7.1: Frontend Data-Fetching Updates (50% COMPLETE)

**Status:** 50% | **Priority:** P2 | **Deadline:** Week 11 | **Effort:** 4h

**Already Completed:**
- [x] src/lib/api.ts updated (no x-tenant-id in production)
- [x] TenantSwitcher uses secure endpoint

**Remaining Tasks:**
- [ ] Update src/hooks/use-api.ts to remove manual tenant headers
- [ ] Audit custom fetch wrappers
- [ ] Update SWR configuration
- [ ] Remove localStorage tenant injection
- [ ] Scope offline storage by tenant

**Updated Hook:**
```typescript
// src/hooks/use-api.ts
import useSWR from 'swr';
import { useSession } from 'next-auth/react';

const fetcher = async (url: string) => {
  const res = await fetch(url, {
    credentials: 'include'
    // NO manual x-tenant-id header
  });

  if (!res.ok) {
    throw new Error('API request failed');
  }

  return res.json();
};

export function useApi<T>(endpoint: string) {
  const { data: session } = useSession();

  const { data, error, mutate } = useSWR<T>(
    session ? endpoint : null,
    fetcher
  );

  return { data, error, isLoading: !data && !error, mutate };
}
```

**Audit Commands:**
```bash
# Find custom fetch implementations
grep -r "new Headers" src/components --include="*.tsx" -n

# Check for manual tenant headers
grep -r "x-tenant-id" src/components --include="*.tsx" -n

# Should return 0 results
```

**Completion Criteria:**
- [ ] No manual tenant header injection
- [ ] All fetch wrappers updated
- [ ] SWR config updated
- [ ] Offline storage scoped by tenant

---

### ❌ Task 7.2: Portal Route Display Verification (NOT STARTED)

**Status:** NOT STARTED | **Priority:** P2 | **Deadline:** Week 11 | **Effort:** 3h

**Client-Side Tenant Guard:**
```typescript
// src/components/TenantGuard.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function TenantGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/login');
      return;
    }

    if (!session.user.tenant) {
      router.push('/select-tenant');
      return;
    }

    // Verify subdomain matches session tenant
    const hostname = window.location.hostname;
    const subdomain = hostname.split('.')[0];
    
    if (subdomain !== 'www' && subdomain !== session.user.tenant.slug) {
      window.location.href = `https://${session.user.tenant.slug}.${process.env.NEXT_PUBLIC_BASE_DOMAIN}${window.location.pathname}`;
    }
  }, [session, status, router]);

  if (!session?.user.tenant) return null;

  return <>{children}</>;
}
```

**Offline Storage Scoping:**
```typescript
// src/lib/offline-storage.ts
import { getTenantFromSession } from './tenant';

export class OfflineStorage {
  private getKey(key: string): string {
    const tenantSlug = getTenantFromSession();
    if (!tenantSlug) {
      throw new Error('Tenant context required');
    }
    return `${tenantSlug}:${key}`;
  }

  set(key: string, value: any): void {
    const scopedKey = this.getKey(key);
    localStorage.setItem(scopedKey, JSON.stringify(value));
  }

  get<T>(key: string): T | null {
    const scopedKey = this.getKey(key);
    const data = localStorage.getItem(scopedKey);
    return data ? JSON.parse(data) : null;
  }

  clear(): void {
    const tenantSlug = getTenantFromSession();
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(`${tenantSlug}:`)) {
        localStorage.removeItem(key);
      }
    });
  }
}
```

**Tasks:**
- [ ] Implement TenantGuard component
- [ ] Add subdomain verification
- [ ] Scope offline storage
- [ ] Test tenant mismatch redirects

**Completion Criteria:**
- [ ] TenantGuard active on all protected routes
- [ ] Subdomain mismatches redirect correctly
- [ ] Offline storage properly scoped
- [ ] No cross-tenant data leakage in UI

---

## PHASE 8: DOCUMENTATION

**Status:** 0% | **Priority:** P2 | **Owner:** Platform Team  
**Deadline:** Week 12 | **No blockers**

---

### ❌ Task 8.1: Developer Documentation (NOT STARTED)

**Status:** NOT STARTED | **Priority:** P2 | **Deadline:** Week 12 | **Effort:** 6h

**Documents to Create:**
- [ ] docs/developer/tenant-context-guide.md
- [ ] docs/developer/prisma-patterns.md
- [ ] docs/developer/testing-guide.md
- [ ] docs/developer/migration-checklist.md

**Example Document Structure:**
```markdown
# Tenant Context Usage Guide

## Overview
All API routes must operate within tenant context.

## API Routes
```typescript
export const GET = withTenantContext(
  async (req, { user, tenant, params }) => {
    // tenant.id is cryptographically verified
    const services = await serviceRepository.findMany();
    return NextResponse.json(services);
  },
  { requireRole: ['ADMIN'] }
);
```

## Background Jobs
```typescript
await runWithTenantContext(
  { id: tenant.id, slug: tenant.slug },
  async () => {
    // Tenant-scoped operations
  }
);
```
```

**Tasks:**
- [ ] Write tenant context guide
- [ ] Write Prisma patterns guide
- [ ] Write testing guide
- [ ] Create migration checklist
- [ ] Add code examples

**Completion Criteria:**
- [ ] All 4 documents created
- [ ] Code examples tested
- [ ] Reviewed by team
- [ ] Published to docs site

---

### ❌ Task 8.2: Operational Documentation (NOT STARTED)

**Status:** NOT STARTED | **Priority:** P2 | **Deadline:** Week 12 | **Effort:** 4h

**Documents to Create:**
- [ ] docs/operations/runbook-tenant-isolation.md
- [ ] docs/operations/deployment-checklist.md
- [ ] docs/operations/monitoring-guide.md

**Runbook Structure:**
```markdown
# Tenant Isolation Incident Runbook

## Severity Classification
- P0: Cross-tenant data leak (< 15 min response)
- P1: Potential security gap (< 1 hour)
- P2: Configuration issues (< 4 hours)

## Detection
```bash
# Find cross-tenant attempts
grep "tenant_mismatch" logs/app.log
```

## Response Steps
1. Assess scope (5 min)
2. Contain (10 min)
3. Investigate (30 min)
4. Remediate (variable)
5. Notify (15 min)
```

**Tasks:**
- [ ] Write incident runbook
- [ ] Write deployment checklist
- [ ] Write monitoring guide
- [ ] Add escalation procedures

**Completion Criteria:**
- [ ] All 3 documents created
- [ ] Runbook tested with drill
- [ ] Team trained on procedures

---

### ❌ Task 8.3: Code Review and Linting (NOT STARTED)

**Status:** NOT STARTED | **Priority:** P2 | **Deadline:** Ongoing | **Effort:** 4h

**ESLint Rules:**
```javascript
// .eslintrc.js
module.exports = {
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [{
          group: ['next-auth'],
          importNames: ['getServerSession'],
          message: 'Use withTenantContext instead'
        }]
      }
    ]
  },
  overrides: [{
    files: ['src/app/api/**/*.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'CallExpression[callee.name="getServerSession"]',
          message: 'Use withTenantContext wrapper'
        }
      ]
    }
  }]
};
```

**Tasks:**
- [ ] Create ESLint rules
- [ ] Add custom lint plugin
- [ ] Update PR template
- [ ] Configure pre-commit hooks

**Completion Criteria:**
- [ ] ESLint rules active
- [ ] PR template in use
- [ ] Pre-commit hooks working
- [ ] Team trained on guidelines

---

## PHASE 9: DEPLOYMENT

**Status:** 0% | **Priority:** P0 | **Owner:** DevOps Team  
**Deadline:** Week 13 | **Blocker:** All previous phases

---

### ❌ Task 9.1: Feature Flag Configuration (BLOCKED)

**Status:** NOT STARTED | **Priority:** P0 | **Deadline:** Before each phase  
**Blocker:** Previous phases

**Feature Flags:**
```bash
# .env.production
MULTI_TENANCY_ENABLED=true
TENANT_MIGRATION_PHASE_1=true
TENANT_MIGRATION_PHASE_2=false
TENANT_MIGRATION_PHASE_3=false
ENFORCE_RLS=false
```

**Flag Management:**
```typescript
// src/lib/feature-flags.ts
export const featureFlags = {
  phase1Complete: process.env.TENANT_MIGRATION_PHASE_1 === 'true',
  phase2Complete: process.env.TENANT_MIGRATION_PHASE_2 === 'true',
  phase3Complete: process.env.TENANT_MIGRATION_PHASE_3 === 'true',
  enforceRLS: process.env.ENFORCE_RLS === 'true'
};
```

**Tasks:**
- [ ] Define all feature flags
- [ ] Implement flag management
- [ ] Document flag usage
- [ ] Test flag toggling

**Completion Criteria:**
- [ ] Flags defined and documented
- [ ] Safe to toggle without code changes
- [ ] Monitoring in place

---

### ❌ Task 9.2: Staged Deployment Strategy (BLOCKED)

**Status:** NOT STARTED | **Priority:** P0 | **Deadline:** Week 13  
**Blocker:** All phases

**Deployment Sequence:**

**Week 1-2: Phase 1 (Routes)**
- [ ] Deploy to dev
- [ ] Run integration tests
- [ ] Manual QA (24h monitoring)
- [ ] Deploy to staging
- [ ] Load testing
- [ ] Deploy to production (canary 5% → 100%)
- [ ] Monitor 48 hours

**Week 3-5: Phase 2 (Schema)**
- [ ] Test migrations on dev
- [ ] Clone production to staging
- [ ] Run backfill on staging
- [ ] Schedule maintenance (2-4h)
- [ ] Execute production migration
- [ ] Verify data integrity
- [ ] Monitor 48 hours

**Week 6-7: Phase 3 (RLS)**
- [ ] Enable RLS on staging (Week 6)
- [ ] Performance testing
- [ ] Enable RLS on production (Week 7)
- [ ] Monitor query performance
- [ ] Keep disable script ready

**Completion Criteria:**
- [ ] All phases deployed successfully
- [ ] No rollbacks needed
- [ ] Performance within targets
- [ ] 30 days stable operation

---

### ❌ Task 9.3: Post-Rollout Monitoring (BLOCKED)

**Status:** NOT STARTED | **Priority:** P0 | **Deadline:** Ongoing  
**Blocker:** Deployment

**Health Check Endpoint:**
```typescript
// src/app/api/health/tenant-isolation/route.ts
export async function GET() {
  const checks = {
    middleware: await checkMiddleware(),
    rlsEnabled: await checkRLS(),
    routesMigrated: await checkRoutes(),
    tenantGuard: await checkPrismaGuard()
  };

  const allHealthy = Object.values(checks).every(c => c.healthy);

  return NextResponse.json({
    status: allHealthy ? 'healthy' : 'degraded',
    checks
  }, { status: allHealthy ? 200 : 503 });
}
```

**Tasks:**
- [ ] Create health check endpoint
- [ ] Monitor error rates
- [ ] Track performance metrics
- [ ] Set up alerts
- [ ] Generate daily reports

**Completion Criteria:**
- [ ] Health checks passing
- [ ] Dashboards showing green
- [ ] Alerts configured
- [ ] No incidents for 30 days

---

## PHASE 10: POST-ROLLOUT OPERATIONS

**Status:** 0% | **Priority:** P2 | **Owner:** Platform Team  
**Deadline:** Week 13+ | **Blocker:** Phase 9

---

### ❌ Task 10.1: Incident Response Updates (BLOCKED)

**Status:** NOT STARTED | **Priority:** P2 | **Deadline:** Week 13

**Tasks:**
- [ ] Update incident response playbooks
- [ ] Add tenant ID to triage checklist
- [ ] Document investigation procedures
- [ ] Create data breach response plan
- [ ] Train on-call team

**Covered in Task 8.2**

---

### ❌ Task 10.2: Periodic Audits (BLOCKED)

**Status:** NOT STARTED | **Priority:** P2 | **Deadline:** Quarterly

**Quarterly Audit Script:**
```bash
#!/bin/bash
# scripts/quarterly-tenant-audit.sh

echo "=== Quarterly Tenant Security Audit ==="

# Check unsafe patterns
UNSAFE_ROUTES=$(grep -r "getServerSession" src/app/api --include="*.ts" | grep -v withTenantContext | wc -l)
echo "Unsafe routes: $UNSAFE_ROUTES (Target: 0)"

# Check schema
node scripts/check_prisma_tenant_columns.js

# Check RLS
psql $DATABASE_URL -c "
  SELECT COUNT(*) FILTER (WHERE rowsecurity = true) as rls_enabled
  FROM pg_tables WHERE schemaname = 'public'
"

# Check NULL tenantIds
psql $DATABASE_URL -c "
  SELECT 'ServiceRequest' as table, COUNT(*) as nulls
  FROM \"ServiceRequest\" WHERE \"tenantId\" IS NULL
"
```

**Tasks:**
- [ ] Create audit script
- [ ] Schedule quarterly runs
- [ ] Review audit results
- [ ] Address findings

**Completion Criteria:**
- [ ] Audit script automated
- [ ] Quarterly schedule in place
- [ ] Results reviewed by security team

---

### ❌ Task 10.3: Performance Optimization (BLOCKED)

**Status:** NOT STARTED | **Priority:** P2 | **Deadline:** Week 14

**Performance Queries:**
```sql
-- Identify slow tenant-scoped queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
WHERE query LIKE '%tenantId%'
ORDER BY mean_exec_time DESC
LIMIT 20;

-- Check index usage
SELECT tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE indexname LIKE '%tenant%'
ORDER BY idx_scan DESC;
```

**Tasks:**
- [ ] Profile RLS impact
- [ ] Optimize slow queries
- [ ] Add composite indexes
- [ ] Tune connection pool
- [ ] Monitor query performance

**Completion Criteria:**
- [ ] RLS overhead < 5%
- [ ] No slow queries (> 1s)
- [ ] Indexes optimized
- [ ] Connection pool tuned

---

## AI AGENT EXECUTION PROTOCOL

### Daily Autonomous Workflow

```bash
#!/bin/bash
# AI Agent: Run this daily

echo "=== Tenant Migration Daily Run $(date) ==="

# 1. Sync repository
git pull origin main

# 2. Determine current phase
PHASE=$(grep "TENANT_MIGRATION_PHASE" .env | cut -d= -f2)
echo "Current Phase: $PHASE"

# 3. Get next batch of tasks based on phase
if [ "$PHASE" == "1" ]; then
  # Phase 1: Route migration
  echo "Phase 1: Migrating routes to withTenantContext"
  
  # Get next 5 unsafe routes
  UNSAFE_ROUTES=$(grep -r "getServerSession" src/app/api --include="*.ts" -l | \
                  grep -v withTenantContext | head -n 5)
  
  if [ -z "$UNSAFE_ROUTES" ]; then
    echo "✅ All routes migrated! Ready for Phase 2"
    exit 0
  fi
  
  # Process each route
  for route in $UNSAFE_ROUTES; do
    echo "Processing: $route"
    
    # Apply migration
    node scripts/migrate-route.js "$route"
    
    # Run tests
    TEST_FILE="${route/.ts/.test.ts}"
    npm test -- "$TEST_FILE"
    
    if [ $? -eq 0 ]; then
      echo "✅ $route migrated successfully"
      git add "$route" "$TEST_FILE"
      git commit -m "refactor: migrate $(basename $route) to withTenantContext"
    else
      echo "❌ $route failed tests - reverting"
      git checkout "$route"
    fi
  done
  
elif [ "$PHASE" == "2" ]; then
  # Phase 2: Schema tightening
  echo "Phase 2: Schema integrity checks"
  
  # Run NULL tenantId check
  psql $DATABASE_URL -c "
    SELECT 'ServiceRequest' as table, COUNT(*) as nulls
    FROM \"ServiceRequest\" WHERE \"tenantId\" IS NULL
  " | tee null_check.txt
  
  # Alert if any NULLs found
  if grep -q "0 rows" null_check.txt; then
    echo "✅ No NULL tenantIds found"
  else
    echo "⚠️  NULL tenantIds detected - backfill required"
    # Flag for human review
    node scripts/notify-slack.js "Phase 2: NULL tenantIds require backfill"
  fi
  
elif [ "$PHASE" == "3" ]; then
  # Phase 3: RLS verification
  echo "Phase 3: RLS policy checks"
  
  # Verify RLS enabled
  psql $DATABASE_URL -c "
    SELECT tablename, rowsecurity
    FROM pg_tables
    WHERE schemaname = 'public' AND rowsecurity = false
  " | tee rls_check.txt
  
  # Alert if RLS not enabled
  if grep -q "0 rows" rls_check.txt; then
    echo "✅ RLS enabled on all tables"
  else
    echo "⚠️  Some tables missing RLS"
  fi
fi

# 4. Run validation suite
echo "Running validation..."
npm run validate:tenant-security

# 5. Update progress tracking
node scripts/update-progress.js

# 6. Generate daily report
cat > daily_report_$(date +%Y%m%d).md <<EOF
# Tenant Migration Daily Report - $(date +%Y-%m-%d)

## Progress
- Phase: $PHASE
- Routes Migrated: $(grep -r "withTenantContext" src/app/api --include="*.ts" | wc -l)/101
- Test Coverage: $(npm run test:coverage --silent | grep "All files" | awk '{print $10}')

## Today's Work
- Processed $(echo "$UNSAFE_ROUTES" | wc -l) routes
- Tests: $(git log --oneline --since="1 day ago" | grep -c "test")
- Commits: $(git log --oneline --since="1 day ago" | wc -l)

## Blockers
$(grep "BLOCKED" TODO.md | head -n 5)

## Next Steps
- Continue Phase $PHASE tasks
- Address any test failures
EOF

echo "Daily report: daily_report_$(date +%Y%m%d).md"

# 7. Push changes if successful
if [ $(git status --porcelain | wc -l) -gt 0 ]; then
  git push origin main
  echo "✅ Changes pushed to main"
fi

echo "=== Daily Run Complete ===="
```

---

### AI Agent Decision Logic

```typescript
// AI Agent: Decision making algorithm
interface MigrationDecision {
  action: 'AUTO_FIX' | 'CREATE_PR' | 'ESCALATE';
  confidence: number;
  reasoning: string;
}

function decideMigrationAction(
  file: string,
  unsafePattern: UnsafePattern
): MigrationDecision {
  
  // HIGH CONFIDENCE: Auto-fix criteria
  if (
    unsafePattern.type === 'ROUTE_WITHOUT_WRAPPER' &&
    unsafePattern.autoFixable &&
    hasExistingTests(file) &&
    !hasComplexLogic(file) &&
    fileSize(file) < 200 // lines
  ) {
    return {
      action: 'AUTO_FIX',
      confidence: 0.95,
      reasoning: 'Simple route with tests, safe transformation'
    };
  }
  
  // MEDIUM CONFIDENCE: Create PR for review
  if (
    unsafePattern.severity === 'P1' &&
    hasPartialTests(file) &&
    fileSize(file) < 500
  ) {
    return {
      action: 'CREATE_PR',
      confidence: 0.75,
      reasoning: 'Moderate complexity, needs human review'
    };
  }
  
  // LOW CONFIDENCE: Escalate to human
  if (
    hasComplexBusinessLogic(file) ||
    hasExternalDependencies(file) ||
    fileSize(file) > 500 ||
    unsafePattern.severity === 'P0' && !hasTests(file)
  ) {
    return {
      action: 'ESCALATE',
      confidence: 0.40,
      reasoning: 'Complex logic or missing tests - requires manual review'
    };
  }
  
  // DEFAULT: Be conservative
  return {
    action: 'CREATE_PR',
    confidence: 0.60,
    reasoning: 'Default to human review for safety'
  };
}

// Helper functions
function hasExistingTests(file: string): boolean {
  const testFile = file.replace('.ts', '.test.ts');
  return fs.existsSync(testFile);
}

function hasComplexLogic(file: string): boolean {
  const content = fs.readFileSync(file, 'utf8');
  
  // Check for complexity indicators
  const complexityMarkers = [
    /await.*await.*await/, // Multiple awaits
    /if.*if.*if/, // Nested conditions
    /try.*catch.*finally/, // Error handling
    /Promise\.all/, // Parallel operations
    /\$transaction/ // Database transactions
  ];
  
  return complexityMarkers.some(pattern => pattern.test(content));
}

function fileSize(file: string): number {
  const content = fs.readFileSync(file, 'utf8');
  return content.split('\n').length;
}
```

---

### Batch Processing Strategy

```bash
#!/bin/bash
# AI Agent: Batch migration with safety checks

BATCH_SIZE=5
CURRENT_BATCH=1
FAILED_FILES=()

echo "=== Starting Batch Migration ==="

# Get all unsafe routes
UNSAFE_FILES=$(grep -r "getServerSession" src/app/api --include="*.ts" -l | \
               grep -v withTenantContext)

TOTAL=$(echo "$UNSAFE_FILES" | wc -l)
echo "Total routes to migrate: $TOTAL"

for file in $UNSAFE_FILES; do
  echo ""
  echo "[$CURRENT_BATCH/$TOTAL] Processing: $file"
  
  # Check complexity
  COMPLEXITY=$(node scripts/check-complexity.js "$file")
  echo "Complexity score: $COMPLEXITY"
  
  if [ $COMPLEXITY -gt 50 ]; then
    echo "⚠️  High complexity - creating PR for review"
    node scripts/create-pr.js "$file" "High complexity route migration"
    continue
  fi
  
  # Create backup
  cp "$file" "$file.backup"
  
  # Apply transformation
  node scripts/migrate-route.js "$file"
  
  # Validate syntax
  npm run type-check -- "$file"
  if [ $? -ne 0 ]; then
    echo "❌ Type check failed - reverting"
    mv "$file.backup" "$file"
    FAILED_FILES+=("$file")
    continue
  fi
  
  # Run tests
  TEST_FILE="${file/.ts/.test.ts}"
  npm test -- "$TEST_FILE"
  
  if [ $? -eq 0 ]; then
    echo "✅ Migration successful"
    rm "$file.backup"
    git add "$file" "$TEST_FILE"
    git commit -m "refactor: migrate $(basename $file) to withTenantContext"
  else
    echo "❌ Tests failed - reverting"
    mv "$file.backup" "$file"
    FAILED_FILES+=("$file")
  fi
  
  # Batch checkpoint
  if [ $((CURRENT_BATCH % BATCH_SIZE)) -eq 0 ]; then
    echo ""
    echo "=== Batch Checkpoint ==="
    echo "Completed: $CURRENT_BATCH/$TOTAL"
    
    # Run full integration tests
    npm run test:integration
    
    if [ $? -ne 0 ]; then
      echo "❌ Integration tests failed - halting migration"
      echo "Failed files:" "${FAILED_FILES[@]}"
      exit 1
    fi
    
    # Push batch
    git push origin main
    echo "✅ Batch pushed successfully"
    
    # Brief pause
    sleep 5
  fi
  
  CURRENT_BATCH=$((CURRENT_BATCH + 1))
done

echo ""
echo "=== Migration Complete ==="
echo "Total processed: $TOTAL"
echo "Failed: ${#FAILED_FILES[@]}"

if [ ${#FAILED_FILES[@]} -gt 0 ]; then
  echo ""
  echo "Failed files:"
  printf '%s\n' "${FAILED_FILES[@]}"
  echo ""
  echo "Creating issues for manual review..."
  for file in "${FAILED_FILES[@]}"; do
    node scripts/create-issue.js "$file" "Migration failed - manual review needed"
  done
fi
```

---

## VALIDATION COMMANDS REFERENCE

### Quick Health Checks

```bash
# Full security audit
npm run validate:tenant-security

# Route migration status
echo "Routes migrated: $(grep -r "withTenantContext" src/app/api --include="*.ts" | wc -l)/101"

# Find remaining unsafe routes
grep -r "getServerSession" src/app/api --include="*.ts" | \
  grep -v withTenantContext | wc -l
# Target: 0

# Check nullable tenantId
grep -c "tenantId?" prisma/schema.prisma
# Target: <= 5 (settings tables only)

# RLS status
psql $DATABASE_URL -c "
  SELECT 
    COUNT(*) FILTER (WHERE rowsecurity = true) as enabled,
    COUNT(*) FILTER (WHERE rowsecurity = false) as disabled
  FROM pg_tables WHERE schemaname = 'public';
"
# Target: 18 enabled, 0 disabled

# Test coverage
npm run test:coverage | grep "All files"
# Target: > 90%

# NULL tenantId check
psql $DATABASE_URL -c "
  SELECT 'ServiceRequest' as table, COUNT(*) as nulls
  FROM \"ServiceRequest\" WHERE \"tenantId\" IS NULL
  UNION ALL
  SELECT 'Booking', COUNT(*) FROM \"Booking\" WHERE \"tenantId\" IS NULL;
"
# Target: 0 nulls for all tables

# Cross-tenant references
psql $DATABASE_URL -c "
  SELECT COUNT(*) as mismatches
  FROM \"Booking\" b
  JOIN \"Service\" s ON b.\"serviceId\" = s.id
  WHERE b.\"tenantId\" != s.\"tenantId\";
"
# Target: 0 mismatches

# Performance check
psql $DATABASE_URL -c "
  SELECT query, mean_exec_time
  FROM pg_stat_statements
  WHERE query LIKE '%tenantId%'
  ORDER BY mean_exec_time DESC
  LIMIT 5;
"
# Target: All < 1000ms
```

---

## SUCCESS CRITERIA CHECKLIST

### Phase 1 Complete ✅
```bash
# Automated validation
./scripts/validate-phase1.sh

# Manual checklist:
- [ ] 101/101 routes use withTenantContext
- [ ] 0 routes use getServerSession directly
- [ ] 0 routes use getTenantFromRequest
- [ ] All routes have integration tests
- [ ] Middleware logs tenantId, userId, requestId
- [ ] All CI tests passing
- [ ] 48h production monitoring clean
```

### Phase 2 Complete ✅
```bash
# Automated validation
./scripts/validate-phase2.sh

# Manual checklist:
- [ ] 0 NULL tenantId in production
- [ ] All compound FKs deployed
- [ ] 0 cross-tenant references
- [ ] Data integrity verification passing
- [ ] Rollback tested on staging
```

### Phase 3 Complete ✅
```bash
# Automated validation
./scripts/validate-phase3.sh

# Manual checklist:
- [ ] RLS enabled on 18 tables
- [ ] All raw queries wrapped with RLS helper
- [ ] Performance impact < 5%
- [ ] 0 RLS violations in logs (7 days)
- [ ] Rollback procedure documented
```

### Overall Migration Complete ✅
```bash
# Final validation
./scripts/validate-all-phases.sh

# Manual checklist:
- [ ] All 10 phases at 100%
- [ ] 0 P0/P1 security issues
- [ ] Test coverage > 90%
- [ ] All documentation complete
- [ ] Team trained on new patterns
- [ ] 30 days post-deployment, 0 incidents
- [ ] Performance within SLAs
- [ ] Monitoring dashboards green
- [ ] Weekly health reports show "HEALTHY"
```

---

## EMERGENCY PROCEDURES

### Rollback Phase 1
```bash
# Immediate rollback
git revert HEAD~10  # Last 10 commits
npm run build
npm run deploy

# Disable feature flag
export TENANT_MIGRATION_PHASE_1=false

# Verify rollback
curl https://app.example.com/api/admin/services
# Should work without errors
```

### Rollback Phase 2
```sql
-- Revert NOT NULL constraints
ALTER TABLE "ServiceRequest" ALTER COLUMN "tenantId" DROP NOT NULL;
ALTER TABLE "Booking" ALTER COLUMN "tenantId" DROP NOT NULL;
-- Repeat for all 9 tables

-- Verify
SELECT column_name, is_nullable 
FROM information_schema.columns 
WHERE column_name = 'tenantId';
-- Should show is_nullable = 'YES'
```

### Rollback Phase 3
```sql
-- EMERGENCY: Disable RLS immediately
ALTER TABLE "User" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "ServiceRequest" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Booking" DISABLE ROW LEVEL SECURITY;
-- Repeat for all 18 tables

-- Drop all policies
DROP POLICY IF EXISTS tenant_isolation ON "User";
DROP POLICY IF EXISTS admin_bypass ON "User";
-- Repeat for all tables

-- Verify
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true;
-- Should return 0 rows
```

### Incident Response
```bash
# 1. Assess (5 min)
psql $DATABASE_URL -c "
  SELECT DISTINCT \"tenantId\"
  FROM \"AuditLog\"
  WHERE action LIKE '%CROSS_TENANT%'
  AND \"createdAt\" > NOW() - INTERVAL '1 hour';
"

# 2. Contain (10 min)
# Option A: Block affected route at WAF
curl -X POST https://api.cloudflare.com/client/v4/zones/{zone}/firewall/rules \
  -d '{"filter":{"expression":"http.request.uri.path contains \"/api/admin/stats\""},"action":"block"}'

# Option B: Enable maintenance mode
echo "MAINTENANCE_MODE=true" >> .env.production
npm run deploy

# 3. Notify stakeholders
node scripts/send-incident-notification.js

# 4. Investigate root cause
grep "tenant_mismatch" logs/app.log | tail -n 100

# 5. Apply hotfix
git checkout -b hotfix/tenant-isolation-$(date +%Y%m%d)
# Make fixes
git commit -m "fix: resolve tenant isolation vulnerability"
npm run deploy

# 6. Verify fix
curl -H "x-tenant-id: spoofed" https://app.example.com/api/admin/stats
# Expected: 403
```

---

## CONTACTS & ESCALATION

**Immediate Response:**
- On-Call Engineer: Slack `@oncall` or +1-xxx-xxx-xxxx
- Security Lead: security@company.com
- Platform Team: #platform-team

**Escalation Path:**
1. On-Call Engineer (< 15 min)
2. Security Lead (< 30 min)
3. Engineering Manager (< 1 hour)
4. CTO (P0 only, < 2 hours)

**Escalation Triggers:**
- P0: Cross-tenant data exposure detected
- P1: Migration blocking all routes
- P1: Data integrity compromised
- P1: RLS causing > 10% performance drop
- P2: 48h deadline missed

---

## PROGRESS TRACKING

**Current Status:**
```
Overall Progress: 65%
Phase 1: 65% (38/101 routes)
Phase 2: 0% (blocked)
Phase 3: 0% (blocked)
Phase 4: 0% (blocked)
Phase 5: 10%
Phase 6: 0% (blocked)
Phase 7: 50%
Phase 8: 0%
Phase 9: 0% (blocked)
Phase 10: 0% (blocked)
```

**Next Milestone:**
Phase 1 completion - 63 routes remaining
ETA: 3 weeks at current pace (5 routes/day)

**Bottlenecks:**
1. High-priority admin stats routes (10 routes)
2. Service-related routes (8 routes)
3. Service request routes (6 routes)
4. Public/payment routes (25 routes)

**Resource Allocation:**
- AI Agent: Route migration (automated)
- Senior Dev: Complex route review
- QA Team: Test coverage
- DevOps: Monitoring setup

---

**END OF AI AGENT TODO SYSTEM**

Version: 5.0  
Last Updated: 2025-10-04  
Total Tasks: 150+  
Completed: 45 (30%)  
In Progress: 5  
Blocked: 85  
Not Started: 15
