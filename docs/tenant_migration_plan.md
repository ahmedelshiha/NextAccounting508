Tenant System Migration Plan - Professional Edition

Document Version: 4.0
Last Updated: 2025-10-04
Status: Phase 1 Active (65% Complete)
Classification: P0 Security Critical
Owner: Platform Security Team


Executive Summary
This document provides a comprehensive, AI-agent-ready migration plan for implementing zero-trust tenant isolation across a Next.js/Prisma multi-tenant application. The plan addresses critical security vulnerabilities including header spoofing, cross-tenant data leakage, and insufficient database-level enforcement.
Current State: 65% complete with foundational infrastructure in place
Risk Level: HIGH - 43 routes remain vulnerable to header spoofing
Target Completion: 14 weeks (phased rollout)

Table of Contents

Migration Status Dashboard
Phase Execution Plan
AI Agent Implementation Guide
Validation & Testing Procedures
Rollback & Emergency Procedures
Reference Documentation


Migration Status Dashboard
Overall Progress: 65%
████████████████░░░░ 65%
Phase Completion Status
PhaseDescriptionStatusProgressPriorityBlockers0Planning & GovernanceComplete100%P0None1Security HardeningActive65%P0None2Data IntegrityPending0%P1Phase 13Database Security (RLS)Pending0%P1Phase 24ObservabilityPending0%P2Phase 35Testing & QAPartial10%P1Phase 16Repository LayerPending0%P2Phase 37Client UpdatesPartial50%P2Phase 18DocumentationPending0%P2Phase 39DeploymentPending0%P0Phase 110Post-Rollout OperationsPending0%P2Phase 9
Critical Metrics
MetricCurrentTargetStatusRoutes Migrated38/101101/101REDSecurity Vulnerabilities430REDTest Coverage10%90%REDModels with Nullable tenantId90YELLOWRLS Enabled Tables018+RED
Route Migration Progress

Portal Routes: 18/18 (100%) - COMPLETE
Admin Routes: 20/58 (34%) - IN PROGRESS
Public Routes: 0/25 (0%) - NOT STARTED
Total: 38/101 (38%)


Phase Execution Plan
## Phase 0: Planning and Governance - COMPLETE
Status: 100% Complete
Duration: Completed
Owner: Platform Security Team
Completed Tasks

 Confirm executive sponsorship and security requirements for zero-trust tenant isolation
 Define tenant identifier canonical source (tenant table schema, slug, domain mapping)
 Catalog all tenant-owned models, cross-tenant relationships, and singleton tables
 Establish rollout environments (dev, staging, production) and change-management approvals
 Context reload and alignment with existing audit and enhancement plan

Impact: Stateful continuity established, staged low-risk execution aligned with prior findings

## Phase 1: Security Hardening (P0) - ACTIVE
Status: 65% Complete
Duration: Weeks 1-3
Priority: P0 (Security Critical)
Owner: Platform Security Team
Goal
Eliminate all header spoofing vectors and enforce cryptographically verified tenant context across all API routes.
Task 1.1: Complete Middleware Hardening - COMPLETE
Status: COMPLETE
Priority: P0

 Strip incoming x-tenant-id and x-tenant-slug from requests
 Set server-verified headers only
 Issue HMAC-signed tenant cookie (tenant_sig) using NEXTAUTH_SECRET
 Verify signed cookie and reject mismatches
 Extend matcher to include /api/:path* and exclude only static assets
 PENDING: Log requestId, userId, tenantId for every request

Completed Files:

src/app/middleware.ts (updated)
src/lib/tenant-cookie.ts (HMAC sign/verify added)
src/lib/api-wrapper.ts (cryptographic verification added)

Validation:
bash# Verify middleware strips untrusted headers
curl -H "x-tenant-id: spoofed" https://app.example.com/api/admin/services
# Should return 403 if tenant mismatch detected

# Verify signed cookie requirement
curl -b "tenant_sig=invalid" https://app.example.com/api/admin/services
# Should return 403 for invalid signature

Task 1.2: Remove Client-Side Tenant Injection - COMPLETE
Status: COMPLETE
Priority: P0

 Update src/lib/api.ts to stop setting x-tenant-id from cookie/LS in production
 Replace TenantSwitcher with secure tenant-switch endpoint
 Implement src/app/api/tenant/switch/route.ts with membership validation
 Update JWT after tenant switch
 Update TenantSwitcher UI to call secure endpoint

Impact: Client-side header spoofing attack vectors closed

Task 1.3: Migrate Routes to withTenantContext - IN PROGRESS
Status: 38/101 routes complete (38%)
Priority: P0
Deadline: Week 1-3
Already Completed Routes (38 total)
Portal Routes (18/18 - 100%):

 src/app/api/portal/realtime/route.ts
 src/app/api/portal/settings/booking-preferences/route.ts
 src/app/api/portal/chat/route.ts
 src/app/api/portal/service-requests/route.ts
 src/app/api/portal/service-requests/availability/route.ts
 src/app/api/portal/service-requests/recurring/preview/route.ts
 src/app/api/portal/service-requests/export/route.ts
 src/app/api/portal/service-requests/[id]/comments/route.ts
 src/app/api/portal/service-requests/[id]/confirm/route.ts
 src/app/api/portal/service-requests/[id]/reschedule/route.ts

Admin Routes (20/58 - 34%):

 src/app/api/admin/services/route.ts
 src/app/api/admin/services/[id]/route.ts
 src/app/api/admin/tasks/route.ts
 src/app/api/admin/tasks/[id]/route.ts
 src/app/api/admin/service-requests/route.ts
 src/app/api/admin/integration-hub/route.ts
 src/app/api/admin/client-settings/route.ts
 src/app/api/admin/client-settings/import/route.ts
 src/app/api/admin/client-settings/export/route.ts
 src/app/api/admin/analytics-settings/route.ts
 src/app/api/admin/analytics-settings/import/route.ts
 src/app/api/admin/analytics-settings/export/route.ts
 src/app/api/admin/tasks/templates/**
 src/app/api/admin/tasks/notifications/route.ts
 src/app/api/admin/availability-slots/route.ts
 src/app/api/admin/export/route.ts
 src/app/api/admin/task-settings/route.ts
 src/app/api/admin/task-settings/export/route.ts
 src/app/api/admin/task-settings/import/route.ts
 src/app/api/admin/services/[id]/route.ts

Pending Routes by Priority
HIGH PRIORITY - Admin Stats (10 routes) - RED:
Priority: P0
Risk: HIGH - Statistics endpoints vulnerable to cross-tenant data aggregation
Deadline: Week 1
Estimated Effort: 2 hours

 src/app/api/admin/stats/clients/route.ts
 src/app/api/admin/stats/posts/route.ts
 src/app/api/admin/stats/counts/route.ts
 src/app/api/admin/stats/bookings/route.ts
 src/app/api/admin/stats/users/route.ts
 src/app/api/admin/analytics/route.ts
 src/app/api/admin/realtime/route.ts
 src/app/api/admin/system/health/route.ts
 src/app/api/admin/uploads/quarantine/route.ts
 src/app/api/admin/security-settings/route.ts

MEDIUM PRIORITY - Services (8 routes) - YELLOW:
Priority: P1
Risk: MEDIUM - Service management operations
Deadline: Week 2
Estimated Effort: 1.5 hours

 src/app/api/admin/services/stats/route.ts
 src/app/api/admin/services/export/route.ts
 src/app/api/admin/services/bulk/route.ts
 src/app/api/admin/services/[id]/versions/route.ts
 src/app/api/admin/services/[id]/clone/route.ts
 src/app/api/admin/services/[id]/settings/route.ts
 src/app/api/admin/services/slug-check/[slug]/route.ts
 src/app/api/admin/service-requests/analytics/route.ts

MEDIUM PRIORITY - Service Requests (6 routes) - YELLOW:
Priority: P1
Risk: MEDIUM - Service request operations
Deadline: Week 2
Estimated Effort: 1 hour

 src/app/api/admin/service-requests/recurring/preview/route.ts
 src/app/api/admin/service-requests/export/route.ts
 src/app/api/admin/service-requests/bulk/route.ts
 src/app/api/admin/service-requests/availability/route.ts
 src/app/api/admin/service-requests/[id]/route.ts
 src/app/api/admin/service-requests/[id]/** (subroutes)

LOWER PRIORITY - Team & Expenses (6 routes) - GREEN:
Priority: P2
Risk: LOW - Team management and expense tracking
Deadline: Week 3
Estimated Effort: 1 hour

 src/app/api/admin/team-management/** (all subroutes - estimated 5 routes)
 src/app/api/admin/expenses/route.ts

LOWER PRIORITY - Public/Payments (25 routes) - GREEN:
Priority: P2
Risk: LOW - Public-facing endpoints with limited tenant data
Deadline: Week 3
Estimated Effort: 3 hours

 src/app/api/payments/checkout/route.ts
 src/app/api/auth/register/register/route.ts
 src/app/api/email/test/route.ts
 src/app/api/users/me/route.ts
 src/app/api/bookings/route.ts
 src/app/api/bookings/[id]/route.ts
 src/app/api/bookings/[id]/cancel/route.ts
 src/app/api/bookings/[id]/reschedule/route.ts
 src/app/api/bookings/availability/route.ts
 src/app/api/bookings/slots/route.ts
 src/app/api/bookings/confirm/route.ts
 src/app/api/bookings/recurring/route.ts
 src/app/api/bookings/export/route.ts
 src/app/api/bookings/stats/route.ts
 src/app/api/bookings/calendar/route.ts
 (Additional booking subroutes as discovered)

Migration Pattern Reference
BEFORE (UNSAFE - Remove this pattern):
typescriptexport async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const tenantId = getTenantFromRequest(req); // VULNERABLE
  // handler logic
}
AFTER (SAFE - Use this pattern):
typescriptexport const GET = withTenantContext(
  async (req, { user, tenant, params }) => {
    // tenant.id is cryptographically verified
    // handler logic
  },
  { requireRole: ["ADMIN"] }
);
Commands for Route Detection
bash# Find remaining unsafe routes
grep -r "getServerSession" src/app/api --include="*.ts" | grep -v withTenantContext

# Find unsafe tenant resolution
grep -r "getTenantFromRequest" src/app/api --include="*.ts"

# Count remaining routes to migrate
find src/app/api -name "route.ts" -exec grep -l "getServerSession" {} \; | wc -l

# Validate migration
npm run build && npm run test:integration

Task 1.4: Add Middleware Request Logging - PENDING
Status: NOT STARTED
Priority: P0
Deadline: Week 1
Estimated Effort: 2 hours
Requirements:

 Add requestId generation (nanoid) to middleware
 Log requestId, tenantId, userId on every request
 Propagate x-request-id header to responses and across stack
 Update logger in api-wrapper.ts to use requestId
 Configure Sentry to tag events with tenant context
 Add structured logs for tenant context establishment

Files to Update:

 src/app/middleware.ts
 src/lib/api-wrapper.ts
 src/lib/logger.ts (create if needed)

Implementation Template:
typescript// src/lib/logger.ts
import { nanoid } from 'nanoid';
import winston from 'winston';

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

export function generateRequestId(): string {
  return nanoid();
}

export function logRequest(data: {
  requestId: string;
  tenantId?: string;
  userId?: string;
  method: string;
  path: string;
}) {
  logger.info('Request', data);
}
Validation:
bash# Check logs include tenant context
grep -c "requestId" logs/app.log
grep -c "tenantId" logs/app.log

# Verify Sentry tags
curl https://sentry.io/api/0/projects/{project}/events/ | jq '.[] | .tags.tenantId'

Task 1.5: Integration Tests for Tenant Isolation - PENDING
Status: NOT STARTED
Priority: P0
Deadline: Week 2
Estimated Effort: 4 hours
Test Requirements:

 Create tests/integration/tenant-isolation.test.ts
 Test: JWT tenant != header tenant → 403
 Test: Cross-tenant service access → 404
 Test: Cross-tenant user data → 403
 Test: Bulk operations respect tenant filter
 Test: Subdomain mismatch → 403
 Test: 403 on tenant mismatch for high-risk admin route
 Test: Tenant cookie expiry handling
 Test: Invalid signature rejection
 Add tests to CI pipeline (.github/workflows/ci.yml)

Test Template:
typescriptdescribe('Tenant Isolation', () => {
  it('returns 403 when JWT tenant != header tenant', async () => {
    const jwt = signJWT({ tenantId: 'tenant-A' });
    const res = await fetch('/api/admin/services', {
      headers: {
        Authorization: `Bearer ${jwt}`,
        'x-tenant-id': 'tenant-B', // spoofed
      },
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
    expect(accessRes.status).toBe(404); // Should not exist in tenant-B context
  });

  it('enforces tenant filter on bulk operations', async () => {
    const jwt = signJWT({ tenantId: 'tenant-A' });
    
    // Attempt bulk update without tenant filter should be blocked by Prisma guard
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
});
Validation:
bashnpm run test:integration -- tenant-isolation
npm run test:coverage -- --collectCoverageFrom="**/api/**"

Task 1.6: Verify Middleware Matcher Configuration - PENDING
Status: NOT STARTED
Priority: P0
Deadline: Week 1
Estimated Effort: 30 minutes
Checklist:

 Verify middleware matcher includes /api/:path*
 Verify middleware excludes only static assets
 Test middleware applies to all authenticated routes
 Document matcher configuration

Current Matcher (to verify):
typescriptexport const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ]
};

## Phase 2: Data Integrity (P1) - BLOCKED
Status: 0% Complete
Duration: Weeks 3-5
Priority: P1
Owner: Database Team
Blocked By: Phase 1 completion
Goal
Enforce tenant constraints at database level through schema tightening and relationship validation.
Task 2.1: Schema Tightening - Remove Nullable tenantId
Status: NOT STARTED
Priority: P1
Deadline: Week 3-5
Blocked By: Task 1.3 (route migration must be 100%)
Target Models (9 critical):

 ServiceRequest - make tenantId NOT NULL
 Booking - make tenantId NOT NULL
 Expense - make tenantId NOT NULL
 Invoice - make tenantId NOT NULL
 Payment - make tenantId NOT NULL
 Task - make tenantId NOT NULL (if still nullable)
 ComplianceRecord - make tenantId NOT NULL
 HealthLog - make tenantId NOT NULL
 AuditLog - make tenantId NOT NULL

Additional Schema Tasks:

 Service: Review tenantId? with @@unique([tenantId, slug]) for nullable ambiguity
 Add defaults/backfill migrations where needed
 Remove temporary NULL allowances post-backfill

Implementation Steps:

Run Audit:

bashnode scripts/check_prisma_tenant_columns.js

Generate Backfill SQL:

sql-- Check orphaned records
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

-- Backfill from related tenant (ServiceRequest example)
UPDATE "ServiceRequest" sr
SET "tenantId" = u."tenantId"
FROM "User" u
WHERE sr."userId" = u.id AND sr."tenantId" IS NULL;

-- Backfill from service relationship (Booking example)
UPDATE "Booking" b
SET "tenantId" = s."tenantId"
FROM "Service" s
WHERE b."serviceId" = s.id AND b."tenantId" IS NULL;

-- Verify
SELECT COUNT(*) FROM "ServiceRequest" WHERE "tenantId" IS NULL; -- Should be 0

Test Backfill on Staging:

bash# Export staging database
pg_dump $STAGING_DATABASE_URL > staging_backup.sql

# Run backfill
psql $STAGING_DATABASE_URL < backfill.sql

# Verify results
psql $STAGING_DATABASE_URL -c "
  SELECT table_name, null_count FROM (
    SELECT 'ServiceRequest' as table_name, COUNT(*) as null_count
    FROM \"ServiceRequest\" WHERE \"tenantId\" IS NULL
    UNION ALL
    SELECT 'Booking', COUNT(*) FROM \"Booking\" WHERE \"tenantId\" IS NULL
  ) t WHERE null_count > 0;
"

Schedule Maintenance Window:

Duration: 2 hours
Notification: 48 hours advance
Stakeholders: All tenants
Communication: Email + in-app banner

Execute Production Backfill:

bash# Backup production database
pg_dump $PROD_DATABASE_URL > prod_backup_$(date +%Y%m%d_%H%M%S).sql

# Run backfill with monitoring
psql $PROD_DATABASE_URL < backfill.sql 2>&1 | tee backfill.log

# Verify
psql $PROD_DATABASE_URL < verify.sql

Update Prisma Schema:

prismamodel ServiceRequest {
  id        String   @id @default(cuid())
  tenantId  String   // Remove '?' to make NOT NULL
  // ... other fields
  
  tenant    Tenant   @relation(fields: [tenantId], references: [id])
  
  @@index([tenantId])
}

Generate Migration:

bashnpx prisma migrate dev --name enforce_tenant_not_null

Deploy to Production:

bashnpx prisma migrate deploy

Verification Queries:

sql-- Verify NOT NULL constraints
SELECT 
  table_name,
  column_name,
  is_nullable
FROM information_schema.columns
WHERE column_name = 'tenantId'
  AND table_schema = 'public'
ORDER BY table_name;

-- Should show is_nullable = 'NO' for all tenant-owned tables
Rollback Procedure:
sql-- Revert NOT NULL constraint
ALTER TABLE "ServiceRequest" ALTER COLUMN "tenantId" DROP NOT NULL;
ALTER TABLE "Booking" ALTER COLUMN "tenantId" DROP NOT NULL;
-- Repeat for all tables

-- Verify rollback
SELECT column_name, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'ServiceRequest' AND column_name = 'tenantId';

Task 2.2: Add Compound Foreign Keys
Status: NOT STARTED
Priority: P1
Deadline: Week 5
Blocked By: Task 2.1
Purpose: Enforce same-tenant relationships at database level
Target Relationships (12+ critical):

 Booking → Service (via tenantId + serviceId)
 Task → User (via tenantId + assigneeId)
 ServiceRequest → Service (via tenantId + serviceId)
 ServiceRequest → User (via tenantId + userId)
 Invoice → Booking (via tenantId + bookingId)
 Payment → Invoice (via tenantId + invoiceId)
 Expense → User (via tenantId + userId)
 ComplianceRecord → User (via tenantId + userId)
 HealthLog → User (via tenantId + userId)
 AuditLog → User (via tenantId + userId)
 Comment → ServiceRequest (via tenantId + serviceRequestId)
 Attachment → ServiceRequest (via tenantId + serviceRequestId)

Prisma Schema Update Pattern:
prismamodel Service {
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
Implementation Steps:

Update Prisma Schema:

bash# Edit prisma/schema.prisma with compound FK patterns above
nano prisma/schema.prisma

Generate Migration:

bashnpx prisma migrate dev --name add_compound_fks

Test on Staging:

bash# Deploy to staging
npx prisma migrate deploy --preview-feature

# Test FK violations (should fail)
psql $STAGING_DATABASE_URL -c "
  -- Try to create booking with mismatched tenant
  INSERT INTO \"Booking\" (id, \"tenantId\", \"serviceId\")
  VALUES ('test-1', 'tenant-A', 'service-from-tenant-B');
"
# Expected: FK constraint violation

Fix Data Inconsistencies:

sql-- Find mismatched relationships
SELECT 
  b.id as booking_id,
  b."tenantId" as booking_tenant,
  s."tenantId" as service_tenant
FROM "Booking" b
JOIN "Service" s ON b."serviceId" = s.id
WHERE b."tenantId" != s."tenantId";

-- Manual resolution required based on business rules
-- Option 1: Update booking tenant to match service
-- Option 2: Delete invalid bookings
-- Option 3: Reassign to correct service

Deploy to Production:

bashnpx prisma migrate deploy

Monitor for FK Violations:

bash# Check PostgreSQL logs for FK errors
tail -f /var/log/postgresql/postgresql-14-main.log | grep "foreign key"
Validation:
sql-- Verify compound FKs exist
SELECT 
  conname as constraint_name,
  conrelid::regclass as table_name,
  confrelid::regclass as references_table,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE contype = 'f' 
  AND conname LIKE '%tenant%'
ORDER BY conname;

Task 2.3: Add Partial Unique Indexes
Status: NOT STARTED
Priority: P1
Deadline: Week 5
Blocked By: Task 2.1
Purpose: Separate global vs tenant-specific rows in singleton tables
Target Models:

 OrganizationSettings - add partial index for tenant-scoped uniqueness
 BookingSettings - add partial index
 IntegrationSettings - add partial index
 SecuritySettings - add partial index
 CommunicationSettings - add partial index

Implementation:
prismamodel OrganizationSettings {
  id        String  @id @default(cuid())
  tenantId  String?
  
  tenant    Tenant? @relation(fields: [tenantId], references: [id])
  
  @@unique([tenantId], where: { tenantId: { not: null } })
  @@index([tenantId])
}
Migration:
sql-- Add partial unique index
CREATE UNIQUE INDEX "OrganizationSettings_tenantId_key" 
ON "OrganizationSettings"("tenantId") 
WHERE "tenantId" IS NOT NULL;

Task 2.4: Run Backfill Scripts and Verification
Status: NOT STARTED
Priority: P1
Deadline: Week 5
Blocked By: Task 2.1
Deliverables:

 Create backfill scripts for each model
 Run verification queries post-backfill
 Document orphaned record resolution strategy
 Archive or delete orphaned records per business rules

Orphaned Record Resolution Strategy:
sql-- Identify orphaned records (no valid tenant relationship)
SELECT 
  'ServiceRequest' as table_name,
  COUNT(*) as orphaned_count
FROM "ServiceRequest" sr
LEFT JOIN "User" u ON sr."userId" = u.id
WHERE sr."tenantId" IS NULL AND u."tenantId" IS NULL

UNION ALL

SELECT 
  'Booking',
  COUNT(*)
FROM "Booking" b
LEFT JOIN "Service" s ON b."serviceId" = s.id
WHERE b."tenantId" IS NULL AND s."tenantId" IS NULL;

-- Resolution options:
-- 1. Assign to default "system"RetryClaude does not have the ability to run the code it generates yet.AContinueEditTenant System Migration Plan - Professional Edition (Continued)

Phase 2: Data Integrity (P1) - BLOCKED (Continued)
Task 2.4: Run Backfill Scripts and Verification (Continued)
Orphaned Record Resolution Strategy:
sql-- Resolution Option 1: Assign to default "system" tenant
UPDATE "ServiceRequest"
SET "tenantId" = (SELECT id FROM "Tenant" WHERE slug = 'system' LIMIT 1)
WHERE "tenantId" IS NULL;

-- Resolution Option 2: Delete orphaned records older than 90 days
DELETE FROM "ServiceRequest"
WHERE "tenantId" IS NULL 
  AND "createdAt" < NOW() - INTERVAL '90 days';

-- Resolution Option 3: Archive to separate table for manual review
CREATE TABLE "OrphanedServiceRequests" AS
SELECT * FROM "ServiceRequest" WHERE "tenantId" IS NULL;

DELETE FROM "ServiceRequest" WHERE "tenantId" IS NULL;
Post-Backfill Verification Checklist:
sql-- 1. Verify zero NULL tenantId values
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.tables t 
   WHERE t.table_name = c.table_name AND c.column_name = 'tenantId') as has_column,
  (SELECT COUNT(*) FROM pg_class WHERE relname = c.table_name) as row_count
FROM information_schema.columns c
WHERE c.column_name = 'tenantId' 
  AND c.table_schema = 'public'
  AND c.is_nullable = 'YES';

-- 2. Verify referential integrity
SELECT 
  t1.relname as child_table,
  t2.relname as parent_table,
  c.conname as constraint_name
FROM pg_constraint c
JOIN pg_class t1 ON c.conrelid = t1.oid
JOIN pg_class t2 ON c.confrelid = t2.oid
WHERE c.contype = 'f'
ORDER BY t1.relname;

-- 3. Check for cross-tenant references
SELECT 
  'Booking-Service mismatch' as issue,
  COUNT(*) as count
FROM "Booking" b
JOIN "Service" s ON b."serviceId" = s.id
WHERE b."tenantId" != s."tenantId"

UNION ALL

SELECT 
  'Task-User mismatch',
  COUNT(*)
FROM "Task" t
JOIN "User" u ON t."assigneeId" = u.id
WHERE t."tenantId" != u."tenantId";

## Phase 3: Database-Level Security (P1) - BLOCKED
Status: 0% Complete
Duration: Weeks 6-7
Priority: P1
Owner: Database Team
Blocked By: Phase 2 completion
Goal
Enable PostgreSQL Row-Level Security (RLS) as final defense layer against cross-tenant data access.
Task 3.1: Enable Row-Level Security Policies
Status: NOT STARTED
Priority: P1
Deadline: Week 6-7
Blocked By: Task 2.4 (data integrity must be 100%)
RLS-Enabled Tables (18+ tables):

 User
 ServiceRequest
 Booking
 Service
 Task
 Expense
 Invoice
 Payment
 ComplianceRecord
 HealthLog
 AuditLog
 Comment
 Attachment
 OrganizationSettings
 IntegrationSettings
 CommunicationSettings
 SecuritySettings
 BookingSettings

Implementation Steps:

Create RLS Migration SQL:

sql-- migration_rls_enable.sql

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

-- Create tenant isolation policy for User table
CREATE POLICY tenant_isolation ON "User"
  USING ("tenantId" = current_setting('app.current_tenant_id', TRUE)::text);

-- Create super-admin bypass policy
CREATE POLICY admin_bypass ON "User"
  USING (
    current_setting('app.is_superadmin', TRUE)::boolean = TRUE
  );

-- Repeat for all tables (template shown for Service)
CREATE POLICY tenant_isolation ON "Service"
  USING ("tenantId" = current_setting('app.current_tenant_id', TRUE)::text);

CREATE POLICY admin_bypass ON "Service"
  USING (
    current_setting('app.is_superadmin', TRUE)::boolean = TRUE
  );

-- Special handling for settings tables with nullable tenantId
CREATE POLICY tenant_isolation ON "OrganizationSettings"
  USING (
    "tenantId" IS NULL OR 
    "tenantId" = current_setting('app.current_tenant_id', TRUE)::text
  );

CREATE POLICY admin_bypass ON "OrganizationSettings"
  USING (
    current_setting('app.is_superadmin', TRUE)::boolean = TRUE
  );

Test on Staging:

bash# Apply RLS migration
psql $STAGING_DATABASE_URL < migration_rls_enable.sql

# Test isolation
psql $STAGING_DATABASE_URL <<EOF
-- Set tenant context
SET app.current_tenant_id = 'tenant-A';

-- Should only return tenant-A users
SELECT COUNT(*) FROM "User";

-- Change tenant context
SET app.current_tenant_id = 'tenant-B';

-- Should only return tenant-B users
SELECT COUNT(*) FROM "User";

-- Test without context (should fail)
RESET app.current_tenant_id;
SELECT COUNT(*) FROM "User";
-- Expected: Error or 0 rows depending on policy
EOF

Update Prisma Client:

Create src/lib/prisma-rls.ts:
typescriptimport { prisma } from './prisma';

/**
 * Execute a function with RLS tenant context
 */
export async function withRLS<T>(
  tenantId: string,
  fn: () => Promise<T>
): Promise<T> {
  try {
    // Set tenant context for this connection
    await prisma.$executeRawUnsafe(
      `SET LOCAL app.current_tenant_id = '${tenantId}'`
    );
    
    // Execute function
    return await fn();
  } finally {
    // Reset tenant context
    await prisma.$executeRawUnsafe(
      `RESET app.current_tenant_id`
    );
  }
}

/**
 * Execute a function with super-admin privileges
 */
export async function withSuperAdmin<T>(
  fn: () => Promise<T>
): Promise<T> {
  try {
    await prisma.$executeRawUnsafe(
      `SET LOCAL app.is_superadmin = TRUE`
    );
    
    return await fn();
  } finally {
    await prisma.$executeRawUnsafe(
      `RESET app.is_superadmin`
    );
  }
}

/**
 * Raw query helper that automatically sets tenant context
 */
export async function tenantRawQuery<T = unknown>(
  tenantId: string,
  query: string,
  ...params: unknown[]
): Promise<T> {
  return withRLS(tenantId, async () => {
    return prisma.$queryRawUnsafe<T>(query, ...params);
  });
}

Wrap Raw Queries:

typescript// BEFORE (unsafe)
const results = await prisma.$queryRaw`
  SELECT * FROM "User" WHERE email LIKE ${pattern}
`;

// AFTER (safe with RLS)
import { withRLS } from '@/lib/prisma-rls';

const results = await withRLS(tenant.id, async () => {
  return prisma.$queryRaw`
    SELECT * FROM "User" WHERE email LIKE ${pattern}
  `;
});

Update API Wrapper:

Update src/lib/api-wrapper.ts:
typescriptimport { withRLS } from './prisma-rls';

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

Deploy to Production:

bash# Backup database
pg_dump $PROD_DATABASE_URL > prod_backup_before_rls_$(date +%Y%m%d).sql

# Deploy RLS migration
psql $PROD_DATABASE_URL < migration_rls_enable.sql

# Verify RLS enabled
psql $PROD_DATABASE_URL -c "
  SELECT 
    schemaname,
    tablename,
    rowsecurity
  FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY tablename;
"

Monitor for Issues:

bash# Watch for RLS-related errors
tail -f logs/app.log | grep -i "row-level security"

# Check Sentry for RLS violations
curl https://sentry.io/api/0/projects/{project}/events/?query=rls
Validation Queries:
sql-- Verify RLS enabled on all tables
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- List all RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
ORDER BY tablename, policyname;

-- Test isolation manually
SET app.current_tenant_id = 'tenant-A';
SELECT COUNT(*) FROM "User"; -- Should return tenant-A count only

SET app.current_tenant_id = 'tenant-B';
SELECT COUNT(*) FROM "User"; -- Should return tenant-B count only
Rollback Procedure:
sql-- EMERGENCY: Disable RLS (fallback to app-level enforcement)
ALTER TABLE "User" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "ServiceRequest" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Booking" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Service" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Task" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Expense" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Invoice" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Payment" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "ComplianceRecord" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "HealthLog" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Comment" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Attachment" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "OrganizationSettings" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "IntegrationSettings" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "CommunicationSettings" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "SecuritySettings" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "BookingSettings" DISABLE ROW LEVEL SECURITY;

-- Drop policies
DROP POLICY IF EXISTS tenant_isolation ON "User";
DROP POLICY IF EXISTS admin_bypass ON "User";
-- Repeat for all tables

-- Verify RLS disabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true;
-- Should return no rows

Task 3.2: Add Prisma Helpers for Session Variables
Status: NOT STARTED
Priority: P1
Deadline: Week 7
Blocked By: Task 3.1
Already covered in Task 3.1 implementation - see src/lib/prisma-rls.ts above.
Additional helpers to create:
typescript// src/lib/prisma-rls.ts (extended)

/**
 * Execute multiple operations in same tenant context
 */
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

/**
 * Middleware to automatically set RLS context
 */
export function registerRLSMiddleware() {
  prisma.$use(async (params, next) => {
    // Get tenant from context
    const tenantId = getTenantContext()?.id;
    
    if (!tenantId) {
      console.warn('RLS middleware: No tenant context found');
      return next(params);
    }
    
    // Set RLS context before query
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
Validation:
typescript// Test RLS helper
import { withRLS } from '@/lib/prisma-rls';

const users = await withRLS('tenant-A', async () => {
  return prisma.user.findMany(); // Should only return tenant-A users
});

console.log(users.every(u => u.tenantId === 'tenant-A')); // Should be true

Task 3.3: Wrap Raw Queries with RLS Helper
Status: NOT STARTED
Priority: P1
Deadline: Week 7
Blocked By: Task 3.2
Audit Process:

Find all raw queries:

bash# Find $queryRaw usage
grep -r "\$queryRaw" src --include="*.ts" -n

# Find $executeRaw usage
grep -r "\$executeRaw" src --include="*.ts" -n

# Find $queryRawUnsafe usage
grep -r "\$queryRawUnsafe" src --include="*.ts" -n

Wrap each occurrence:

typescript// BEFORE
const stats = await prisma.$queryRaw`
  SELECT 
    DATE_TRUNC('day', "createdAt") as date,
    COUNT(*) as count
  FROM "Booking"
  WHERE "createdAt" >= ${startDate}
  GROUP BY date
  ORDER BY date
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
    ORDER BY date
  `;
});

Create tracking spreadsheet:

FileLineQuery TypeStatusNotessrc/app/api/admin/stats/bookings/route.ts45$queryRawWrappedAnalytics querysrc/app/api/admin/analytics/route.ts120$queryRawWrappedDashboard stats...............

## Phase 4: Observability & Monitoring (P2) - BLOCKED
Status: 0% Complete
Duration: Week 8
Priority: P2
Owner: Platform Team
Blocked By: Phase 3 completion
Goal
Monitor tenant isolation in production with comprehensive logging and alerting.
Task 4.1: Enhanced Structured Logging
Status: NOT STARTED
Priority: P2
Deadline: Week 8
Blocked By: Phase 3 completion
Requirements:

 Create src/lib/logger.ts with winston or pino
 Add tenant context to all logs (tenantId, userId, requestId)
 Integrate with Prisma middleware for query logging
 Configure log rotation and retention policies
 Tag logs and Sentry with tenant_id and tenant_slug
 Set up log aggregation (DataDog/CloudWatch/ELK)

Implementation:
Create src/lib/logger.ts:
typescriptimport winston from 'winston';
import { getTenantContext } from './tenant-context';

// Create logger instance
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

/**
 * Log with automatic tenant context
 */
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

// Convenience methods
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
Update src/lib/prisma.ts for query logging:
typescriptimport { logger } from './logger';

// Add query logging middleware
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
      error: error instanceof Error ? error.message : 'Unknown error',
      tenantId: context?.id
    });
    throw error;
  }
});
Update Sentry configuration:
typescript// src/lib/sentry.ts
import * as Sentry from '@sentry/nextjs';
import { getTenantContext } from './tenant-context';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  beforeSend(event) {
    const context = getTenantContext();
    
    if (context) {
      event.tags = {
        ...event.tags,
        tenant_id: context.id,
        tenant_slug: context.slug
      };
      
      event.user = {
        ...event.user,
        id: context.userId,
        tenant: context.slug
      };
    }
    
    return event;
  }
});
Validation:
bash# Check logs include tenant context
grep -c "tenantId" logs/app.log
grep -c "requestId" logs/app.log

# Sample log entry
tail -n 1 logs/app.log | jq '.'
# Expected output:
# {
#   "timestamp": "2025-10-04T10:30:00.000Z",
#   "level": "info",
#   "message": "Request processed",
#   "tenantId": "tenant-123",
#   "userId": "user-456",
#   "requestId": "req-789",
#   "duration": 45
# }

# Verify Sentry tags
curl https://sentry.io/api/0/projects/{project}/events/ \
  -H "Authorization: Bearer $SENTRY_TOKEN" | jq '.[] | .tags'

Task 4.2: Monitoring Dashboards and Alerts
Status: NOT STARTED
Priority: P2
Deadline: Week 8
Dashboard Creation:

 Create Grafana/Datadog dashboard for tenant isolation metrics
 Add panels for tenant-specific request volume
 Add panels for tenant-specific error rates
 Track cross-tenant access attempts (should be 0)
 Monitor RLS policy violations
 Track tenant context establishment success rate

Grafana Dashboard JSON (example):
json{
  "dashboard": {
    "title": "Tenant Isolation Metrics",
    "panels": [
      {
        "title": "Requests by Tenant",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total{job=\"api\"}[5m])) by (tenant_id)"
          }
        ]
      },
      {
        "title": "Cross-Tenant Access Attempts",
        "targets": [
          {
            "expr": "sum(rate(tenant_mismatch_errors_total[5m]))"
          }
        ],
        "alert": {
          "conditions": [
            {
              "evaluator": { "type": "gt", "params": [0] },
              "query": { "params": ["A", "5m", "now"] }
            }
          ]
        }
      },
      {
        "title": "RLS Policy Violations",
        "targets": [
          {
            "expr": "sum(rate(rls_violation_errors_total[5m]))"
          }
        ]
      },
      {
        "title": "Tenant Context Establishment Success Rate",
        "targets": [
          {
            "expr": "sum(rate(tenant_context_success_total[5m])) / sum(rate(tenant_context_attempts_total[5m]))"
          }
        ]
      }
    ]
  }
}
Alerting Rules:
yaml# alerts.yml
groups:
  - name: tenant_isolation
    interval: 1m
    rules:
      - alert: CrossTenantAccessAttempt
        expr: rate(tenant_mismatch_errors_total[5m]) > 0
        for: 1m
        labels:
          severity: critical
          team: security
        annotations:
          summary: "Cross-tenant access attempt detected"
          description: "{{ $value }} cross-tenant access attempts in the last 5 minutes"
      
      - alert: MissingTenantContext
        expr: rate(missing_tenant_context_errors_total[5m]) > 10
        for: 5m
        labels:
          severity: warning
          team: platform
        annotations:
          summary: "High rate of missing tenant context"
          description: "{{ $value }} requests missing tenant context per second"
      
      - alert: RLSViolation
        expr: rate(rls_violation_errors_total[5m]) > 0
        for: 1m
        labels:
          severity: critical
          team: security
        annotations:
          summary: "RLS policy violation detected"
          description: "{{ $value }} RLS violations in the last 5 minutes"
      
      - alert: TenantCookieFailure
        expr: rate(tenant_cookie_signature_failures_total[5m]) > 50
        for: 5m
        labels:
          severity: warning
          team: security
        annotations:
          summary: "High rate of tenant cookie signature failures"
          description: "{{ $value }} signature failures per second - possible attack"
Weekly Health Report (automated):
typescript// scripts/weekly-tenant-health-report.ts
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

async function generateWeeklyReport() {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  // Tenant activity
  const tenantActivity = await prisma.$queryRaw`
    SELECT 
      t.slug,
      COUNT(DISTINCT al."userId") as active_users,
      COUNT(*) as total_requests
    FROM "AuditLog" al
    JOIN "Tenant" t ON al."tenantId" = t.id
    WHERE al."createdAt" >= ${weekAgo}
    GROUP BY t.slug
    ORDER BY total_requests DESC
  `;
  
  // Cross-tenant attempt count (should be 0)
  const crossTenantAttempts = await prisma.auditLog.count({
    where: {
      action: 'CROSS_TENANT_ACCESS_ATTEMPT',
      createdAt: { gte: weekAgo }
    }
  });
  
  // RLS violations (should be 0)
  const rlsViolations = await prisma.auditLog.count({
    where: {
      action: 'RLS_VIOLATION',
      createdAt: { gte: weekAgo }
    }
  });
  
  const report = {
    period: { start: weekAgo, end: new Date() },
    tenantActivity,
    security: {
      crossTenantAttempts,
      rlsViolations,
      status: crossTenantAttempts === 0 && rlsViolations === 0 ? 'HEALTHY' : 'AT_RISK'
    }
  };
  
  logger.info('Weekly tenant health report', report);
  
  // Send to Slack/email
  await sendReportToSlack(report);
  
  return report;
}

Task 4.3: CI Integration for Tenant Checks
Status: NOT STARTED
Priority: P2
Deadline: Week 8
CI Workflow (.github/workflows/tenant-checks.yml):
yamlname: Tenant Security Checks

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
          echo "Checking for unsafe patterns..."
          
          # Find routes without withTenantContext
          UNSAFE_ROUTES=$(grep -r "getServerSession" src/app/api --include="*.ts" | grep -v withTenantContext | wc -l)
          echo "Unsafe routes found: $UNSAFE_ROUTES"
          
          if [ $UNSAFE_ROUTES -gt 0 ]; then
            echo "ERROR: Found routes without withTenantContext wrapper"
            grep -r "getServerSession" src/app/api --include="*.ts" | grep -v withTenantContext
            exit 1
          fi
          
          # Find unsafe tenant resolution
          UNSAFE_TENANT=$(grep -r "getTenantFromRequest" src/app/api --include="*.ts" | wc -l)
          echo "Unsafe tenant resolution found: $UNSAFE_TENANT"
          
          if [ $UNSAFE_TENANT -gt 0 ]; then
            echo "ERROR: Found unsafe tenant resolution patterns"
            grep -r "getTenantFromRequest" src/app/api --include="*.ts"
            exit 1
          fi
      
      - name: Run tenant isolation tests
        run: npm run test:integration -- tenant-isolation
      
      - name: Check for nullable tenantId
        run: |
          NULLABLE_COUNT=$(grep -c "tenantId?" prisma/schema.prisma || echo "0")
          echo "Nullable tenantId fields: $NULLABLE_COUNT"
          
          if [ $NULLABLE_COUNT -gt 5 ]; then
            echo "WARNING: High number of nullable tenantId fields"
            grep -n "tenantId?" prisma/schema.prisma
          fi
      
      - name: Type check
        run: npm run type-check
      
      - name: Upload audit results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: tenant-audit-results
          path: |
            logs/
            test-results/
PR Template (.github/pull_request_template.md):
markdown## Description
<!-- Describe your changes -->

## Tenant Security Checklist
- [ ] All new API routes use `withTenantContext` wrapper
- [ ] No direct usage of `getServerSession` without wrapper
- [ ] No usage of `getTenantFromRequest` for tenant resolution
- [ ] All Prisma queries include tenant scoping
- [ ] New models include `tenantId` column with proper indexing
- [ ] Tests include tenant isolation validation
- [ ] No client-side tenant header injection added

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Tenant isolation tests pass
- [ ] Manually tested cross-tenant access prevention

## Related Issues
<!-- Link to related issues -->

## Phase 5: Testing & Quality Assurance (P1-P2)
Status: 10% Complete
Duration: Weeks 2-6 (parallel with other phases)
Priority: P1
Owner: QA Team
Task 5.1: Unit Tests for Tenant Utilities
Status: NOT STARTED
Priority: PRetryClaude does not have the ability to run the code it generates yet.AContinueEditTenant System Migration Plan - Professional Edition (Continued)

Phase 5: Testing & Quality Assurance (P1-P2) (Continued)
Task 5.1: Unit Tests for Tenant Utilities
Status: NOT STARTED
Priority: P1
Deadline: Week 2-3
Estimated Effort: 4 hours
Test Files to Create:

 tests/unit/tenant-utils.test.ts
 tests/unit/tenant-context.test.ts
 tests/unit/tenant-cookie.test.ts
 tests/unit/api-wrapper.test.ts
 tests/unit/prisma-tenant-guard.test.ts

Implementation:
tests/unit/tenant-utils.test.ts:
typescriptimport { describe, it, expect, beforeEach } from '@jest/globals';
import { resolveTenant, withTenant, getTenantFilter } from '@/lib/tenant';

describe('Tenant Utilities', () => {
  describe('resolveTenant', () => {
    it('should extract tenant from subdomain', () => {
      const req = new Request('https://acme.example.com/api/users');
      const tenant = resolveTenant(req);
      expect(tenant?.slug).toBe('acme');
    });

    it('should fallback to default tenant for apex domain', () => {
      const req = new Request('https://example.com/api/users');
      const tenant = resolveTenant(req);
      expect(tenant?.slug).toBe('default');
    });

    it('should ignore www subdomain', () => {
      const req = new Request('https://www.example.com/api/users');
      const tenant = resolveTenant(req);
      expect(tenant?.slug).toBe('default');
    });
  });

  describe('withTenant', () => {
    it('should add tenantId to object', () => {
      const result = withTenant({ name: 'Test' }, 'tenant-123');
      expect(result).toEqual({
        name: 'Test',
        tenantId: 'tenant-123'
      });
    });

    it('should override existing tenantId', () => {
      const result = withTenant(
        { name: 'Test', tenantId: 'wrong' }, 
        'tenant-123'
      );
      expect(result.tenantId).toBe('tenant-123');
    });

    it('should handle nested objects', () => {
      const result = withTenant({
        name: 'Test',
        metadata: { key: 'value' }
      }, 'tenant-123');
      expect(result.tenantId).toBe('tenant-123');
      expect(result.metadata).toEqual({ key: 'value' });
    });
  });

  describe('getTenantFilter', () => {
    it('should return simple tenant filter', () => {
      const filter = getTenantFilter('tenant-123');
      expect(filter).toEqual({ tenantId: 'tenant-123' });
    });

    it('should merge with existing where clause', () => {
      const filter = getTenantFilter('tenant-123', {
        status: 'ACTIVE'
      });
      expect(filter).toEqual({
        tenantId: 'tenant-123',
        status: 'ACTIVE'
      });
    });

    it('should override tenantId in where clause', () => {
      const filter = getTenantFilter('tenant-123', {
        tenantId: 'wrong',
        status: 'ACTIVE'
      });
      expect(filter.tenantId).toBe('tenant-123');
    });
  });
});
tests/unit/tenant-context.test.ts:
typescriptimport { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { runWithTenantContext, getTenantContext, clearTenantContext } from '@/lib/tenant-context';

describe('Tenant Context', () => {
  afterEach(() => {
    clearTenantContext();
  });

  it('should store and retrieve tenant context', async () => {
    await runWithTenantContext(
      { id: 'tenant-123', slug: 'acme' },
      async () => {
        const context = getTenantContext();
        expect(context?.id).toBe('tenant-123');
        expect(context?.slug).toBe('acme');
      }
    );
  });

  it('should isolate context between async operations', async () => {
    const promises = [
      runWithTenantContext({ id: 'tenant-A', slug: 'a' }, async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return getTenantContext()?.id;
      }),
      runWithTenantContext({ id: 'tenant-B', slug: 'b' }, async () => {
        await new Promise(resolve => setTimeout(resolve, 5));
        return getTenantContext()?.id;
      })
    ];

    const results = await Promise.all(promises);
    expect(results).toEqual(['tenant-A', 'tenant-B']);
  });

  it('should clear context after execution', async () => {
    await runWithTenantContext(
      { id: 'tenant-123', slug: 'acme' },
      async () => {
        expect(getTenantContext()).toBeDefined();
      }
    );

    expect(getTenantContext()).toBeUndefined();
  });

  it('should handle errors without leaking context', async () => {
    await expect(
      runWithTenantContext(
        { id: 'tenant-123', slug: 'acme' },
        async () => {
          throw new Error('Test error');
        }
      )
    ).rejects.toThrow('Test error');

    expect(getTenantContext()).toBeUndefined();
  });
});
tests/unit/tenant-cookie.test.ts:
typescriptimport { describe, it, expect } from '@jest/globals';
import { signTenantCookie, verifyTenantCookie } from '@/lib/tenant-cookie';

describe('Tenant Cookie', () => {
  const secret = 'test-secret-key';

  describe('signTenantCookie', () => {
    it('should sign tenant data', () => {
      const signed = signTenantCookie('tenant-123', secret);
      expect(signed).toMatch(/^tenant-123\.[a-f0-9]{64}$/);
    });

    it('should produce different signatures for different tenants', () => {
      const sig1 = signTenantCookie('tenant-A', secret);
      const sig2 = signTenantCookie('tenant-B', secret);
      expect(sig1).not.toBe(sig2);
    });

    it('should produce different signatures with different secrets', () => {
      const sig1 = signTenantCookie('tenant-123', secret);
      const sig2 = signTenantCookie('tenant-123', 'different-secret');
      expect(sig1).not.toBe(sig2);
    });
  });

  describe('verifyTenantCookie', () => {
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

    it('should reject malformed cookie', () => {
      expect(verifyTenantCookie('invalid', secret)).toBeNull();
      expect(verifyTenantCookie('', secret)).toBeNull();
      expect(verifyTenantCookie('no-signature', secret)).toBeNull();
    });
  });
});
Validation:
bash# Run unit tests
npm run test:unit

# Run with coverage
npm run test:coverage -- tests/unit/

# Expected coverage targets
# - Statements: > 90%
# - Branches: > 85%
# - Functions: > 90%
# - Lines: > 90%

Task 5.2: Integration Tests for Prisma Middleware
Status: 10% Complete (basic tests exist)
Priority: P1
Deadline: Week 3
Estimated Effort: 3 hours
Already Completed:

 tests/integration/prisma-tenant-guard.test.ts (basic tests)

Additional Tests Needed:
tests/integration/prisma-tenant-guard.test.ts (extended):
typescriptdescribe('Prisma Tenant Guard - Extended', () => {
  describe('Read Operations', () => {
    it('should auto-inject tenant filter for findMany', async () => {
      await runWithTenantContext({ id: 'tenant-A', slug: 'a' }, async () => {
        const users = await prisma.user.findMany();
        expect(users.every(u => u.tenantId === 'tenant-A')).toBe(true);
      });
    });

    it('should allow explicit tenant filter override', async () => {
      await runWithTenantContext({ id: 'tenant-A', slug: 'a' }, async () => {
        // Should still respect explicit filter
        const users = await prisma.user.findMany({
          where: { tenantId: 'tenant-A' }
        });
        expect(users.every(u => u.tenantId === 'tenant-A')).toBe(true);
      });
    });

    it('should warn on reads without tenant filter', async () => {
      const consoleSpy = jest.spyOn(console, 'warn');
      
      // No tenant context
      await prisma.user.findMany();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('tenant filter')
      );
    });
  });

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

    it('should allow create with correct tenantId', async () => {
      await runWithTenantContext({ id: 'tenant-A', slug: 'a' }, async () => {
        const user = await prisma.user.create({
          data: {
            email: 'test@example.com',
            name: 'Test User',
            tenantId: 'tenant-A'
          }
        });
        expect(user.tenantId).toBe('tenant-A');
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

    it('should require tenant filter for deleteMany', async () => {
      await runWithTenantContext({ id: 'tenant-A', slug: 'a' }, async () => {
        await expect(
          prisma.user.deleteMany({
            where: { status: 'DELETED' } // Missing tenantId
          })
        ).rejects.toThrow('bulk operations require tenant filter');
      });
    });

    it('should allow bulk operations with tenant filter', async () => {
      await runWithTenantContext({ id: 'tenant-A', slug: 'a' }, async () => {
        const result = await prisma.user.updateMany({
          where: { 
            tenantId: 'tenant-A',
            status: 'ACTIVE'
          },
          data: { lastActiveAt: new Date() }
        });
        expect(result.count).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Transaction Support', () => {
    it('should maintain tenant context across transaction', async () => {
      await runWithTenantContext({ id: 'tenant-A', slug: 'a' }, async () => {
        await prisma.$transaction(async (tx) => {
          const user = await tx.user.create({
            data: {
              email: 'tx@example.com',
              name: 'TX User',
              tenantId: 'tenant-A'
            }
          });

          const service = await tx.service.create({
            data: {
              name: 'TX Service',
              tenantId: 'tenant-A'
            }
          });

          expect(user.tenantId).toBe('tenant-A');
          expect(service.tenantId).toBe('tenant-A');
        });
      });
    });
  });
});
Validation:
bashnpm run test:integration -- prisma-tenant-guard

Task 5.3: E2E Tests for Subdomain and Tenant Switching
Status: NOT STARTED
Priority: P2
Deadline: Week 4
Estimated Effort: 6 hours
Test Files to Create:

 tests/e2e/subdomain-routing.spec.ts
 tests/e2e/tenant-switching.spec.ts

Implementation:
tests/e2e/subdomain-routing.spec.ts:
typescriptimport { test, expect } from '@playwright/test';

test.describe('Subdomain Routing', () => {
  test('should route to correct tenant based on subdomain', async ({ page }) => {
    // Visit tenant-A subdomain
    await page.goto('https://tenant-a.localhost:3000/dashboard');
    
    // Verify tenant context
    const tenantSlug = await page.locator('[data-testid="tenant-slug"]').textContent();
    expect(tenantSlug).toBe('tenant-a');
    
    // Verify data isolation
    const services = await page.locator('[data-testid="service-item"]').count();
    // Should only show tenant-A services
  });

  test('should deny access to cross-tenant resources', async ({ page, context }) => {
    // Login to tenant-A
    await page.goto('https://tenant-a.localhost:3000/login');
    await page.fill('[name="email"]', 'admin@tenant-a.com');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');

    // Try to access tenant-B resource by URL
    const response = await page.goto('https://tenant-b.localhost:3000/api/services');
    expect(response?.status()).toBe(403);
  });

  test('should handle apex domain correctly', async ({ page }) => {
    await page.goto('https://localhost:3000');
    
    // Should redirect to default tenant or show tenant selector
    await expect(page).toHaveURL(/tenant|select/);
  });

  test('should ignore www prefix', async ({ page }) => {
    await page.goto('https://www.localhost:3000');
    
    // Should behave same as apex domain
    await expect(page).toHaveURL(/localhost:3000/);
  });
});
tests/e2e/tenant-switching.spec.ts:
typescriptimport { test, expect } from '@playwright/test';

test.describe('Tenant Switching', () => {
  test('should switch tenant with valid membership', async ({ page }) => {
    // Login as multi-tenant user
    await page.goto('https://tenant-a.localhost:3000/login');
    await page.fill('[name="email"]', 'multi@example.com');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');

    // Verify current tenant
    let tenantSlug = await page.locator('[data-testid="tenant-slug"]').textContent();
    expect(tenantSlug).toBe('tenant-a');

    // Switch tenant
    await page.click('[data-testid="tenant-switcher"]');
    await page.click('[data-testid="tenant-option-tenant-b"]');

    // Wait for switch to complete
    await page.waitForURL('https://tenant-b.localhost:3000/**');

    // Verify switched tenant
    tenantSlug = await page.locator('[data-testid="tenant-slug"]').textContent();
    expect(tenantSlug).toBe('tenant-b');

    // Verify session updated
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find(c => c.name === 'next-auth.session-token');
    expect(sessionCookie).toBeDefined();
  });

  test('should reject switch to non-member tenant', async ({ page }) => {
    // Login to tenant-A only
    await page.goto('https://tenant-a.localhost:3000/login');
    await page.fill('[name="email"]', 'single@example.com');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');

    // Try to switch to tenant-B (no membership)
    const response = await page.request.post(
      'https://tenant-a.localhost:3000/api/tenant/switch',
      {
        data: { tenantId: 'tenant-B' }
      }
    );

    expect(response.status()).toBe(403);
    expect(await response.json()).toMatchObject({
      error: expect.stringContaining('membership')
    });
  });

  test('should persist tenant across navigation', async ({ page }) => {
    await page.goto('https://tenant-a.localhost:3000/login');
    await page.fill('[name="email"]', 'admin@tenant-a.com');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');

    // Navigate to different pages
    await page.goto('https://tenant-a.localhost:3000/services');
    let tenantSlug = await page.locator('[data-testid="tenant-slug"]').textContent();
    expect(tenantSlug).toBe('tenant-a');

    await page.goto('https://tenant-a.localhost:3000/bookings');
    tenantSlug = await page.locator('[data-testid="tenant-slug"]').textContent();
    expect(tenantSlug).toBe('tenant-a');
  });

  test('should update tenant cookie signature on switch', async ({ page }) => {
    await page.goto('https://tenant-a.localhost:3000/login');
    await page.fill('[name="email"]', 'multi@example.com');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');

    const cookiesBefore = await page.context().cookies();
    const tenantCookieBefore = cookiesBefore.find(c => c.name === 'tenant_sig');

    // Switch tenant
    await page.click('[data-testid="tenant-switcher"]');
    await page.click('[data-testid="tenant-option-tenant-b"]');
    await page.waitForURL('https://tenant-b.localhost:3000/**');

    const cookiesAfter = await page.context().cookies();
    const tenantCookieAfter = cookiesAfter.find(c => c.name === 'tenant_sig');

    // Signature should have changed
    expect(tenantCookieAfter?.value).not.toBe(tenantCookieBefore?.value);
  });
});
Playwright Configuration:
playwright.config.ts:
typescriptimport { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
Validation:
bash# Run E2E tests
npx playwright test

# Run with UI
npx playwright test --ui

# Run specific test
npx playwright test subdomain-routing

Task 5.4: Migration Tests
Status: NOT STARTED
Priority: P1
Deadline: Week 5
Estimated Effort: 4 hours
Test Files to Create:

 tests/migrations/schema-changes.test.ts
 tests/migrations/data-backfill.test.ts
 tests/migrations/rls-policies.test.ts

Implementation:
tests/migrations/schema-changes.test.ts:
typescriptimport { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';

describe('Schema Migrations', () => {
  let prisma: PrismaClient;
  let testDbUrl: string;

  beforeAll(async () => {
    // Create test database
    testDbUrl = process.env.TEST_DATABASE_URL!;
    prisma = new PrismaClient({ datasources: { db: { url: testDbUrl } } });

    // Apply migrations
    execSync('npx prisma migrate deploy', {
      env: { ...process.env, DATABASE_URL: testDbUrl }
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should have tenantId column on all tenant-scoped tables', async () => {
    const tables = [
      'User', 'Service', 'ServiceRequest', 'Booking',
      'Task', 'Expense', 'Invoice', 'Payment'
    ];

    for (const table of tables) {
      const result = await prisma.$queryRawUnsafe<any[]>(`
        SELECT column_name, is_nullable
        FROM information_schema.columns
        WHERE table_name = '${table}' AND column_name = 'tenantId'
      `);

      expect(result.length).toBe(1);
      expect(result[0].column_name).toBe('tenantId');
    }
  });

  it('should have NOT NULL constraint on tenantId after migration', async () => {
    const result = await prisma.$queryRawUnsafe<any[]>(`
      SELECT table_name, column_name, is_nullable
      FROM information_schema.columns
      WHERE column_name = 'tenantId'
        AND table_schema = 'public'
        AND table_name IN ('ServiceRequest', 'Booking', 'Expense')
    `);

    for (const row of result) {
      expect(row.is_nullable).toBe('NO');
    }
  });

  it('should have compound unique constraints', async () => {
    const result = await prisma.$queryRawUnsafe<any[]>(`
      SELECT conname, conrelid::regclass as table_name
      FROM pg_constraint
      WHERE conname LIKE '%tenantId%'
        AND contype = 'u'
    `);

    expect(result.length).toBeGreaterThan(0);
  });

  it('should have compound foreign keys', async () => {
    const result = await prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        conname as constraint_name,
        conrelid::regclass as table_name,
        confrelid::regclass as referenced_table
      FROM pg_constraint
      WHERE contype = 'f'
        AND conname LIKE '%tenant%'
    `);

    expect(result.length).toBeGreaterThan(0);
  });
});
tests/migrations/data-backfill.test.ts:
typescriptdescribe('Data Backfill', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = new PrismaClient({
      datasources: { db: { url: process.env.TEST_DATABASE_URL } }
    });

    // Create test data with NULL tenantId
    await prisma.$executeRawUnsafe(`
      INSERT INTO "Tenant" (id, slug, name)
      VALUES ('test-tenant', 'test', 'Test Tenant');
    `);

    await prisma.$executeRawUnsafe(`
      INSERT INTO "User" (id, email, name, "tenantId")
      VALUES ('user-1', 'test@example.com', 'Test User', 'test-tenant');
    `);

    // Insert booking without tenantId (simulating old data)
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Booking" ALTER COLUMN "tenantId" DROP NOT NULL;
      
      INSERT INTO "Booking" (id, "userId", "serviceId", "tenantId")
      VALUES ('booking-1', 'user-1', 'service-1', NULL);
    `);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should backfill NULL tenantId from user relationship', async () => {
    // Run backfill script
    await prisma.$executeRawUnsafe(`
      UPDATE "Booking" b
      SET "tenantId" = u."tenantId"
      FROM "User" u
      WHERE b."userId" = u.id AND b."tenantId" IS NULL;
    `);

    // Verify backfill
    const result = await prisma.$queryRawUnsafe<any[]>(`
      SELECT COUNT(*) as count
      FROM "Booking"
      WHERE "tenantId" IS NULL
    `);

    expect(Number(result[0].count)).toBe(0);
  });

  it('should handle orphaned records correctly', async () => {
    // Create orphaned booking (user deleted)
    await prisma.$executeRawUnsafe(`
      INSERT INTO "Booking" (id, "userId", "serviceId", "tenantId")
      VALUES ('orphaned-1', 'deleted-user', 'service-1', NULL);
    `);

    // Archive orphaned records
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "OrphanedBookings" AS
      SELECT * FROM "Booking" WHERE "tenantId" IS NULL;

      DELETE FROM "Booking" WHERE "tenantId" IS NULL;
    `);

    const orphaned = await prisma.$queryRawUnsafe<any[]>(`
      SELECT COUNT(*) as count FROM "OrphanedBookings"
    `);

    expect(Number(orphaned[0].count)).toBeGreaterThan(0);
  });
});
tests/migrations/rls-policies.test.ts:
typescriptdescribe('RLS Policies', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = new PrismaClient({
      datasources: { db: { url: process.env.TEST_DATABASE_URL } }
    });

    // Enable RLS
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
      
      CREATE POLICY tenant_isolation ON "User"
        USING ("tenantId" = current_setting('app.current_tenant_id', TRUE)::text);
    `);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should enforce tenant isolation via RLS', async () => {
    // Set tenant context
    await prisma.$executeRawUnsafe(`
      SET app.current_tenant_id = 'tenant-A';
    `);

    // Query should only return tenant-A users
    const users = await prisma.user.findMany();
    expect(users.every(u => u.tenantId === 'tenant-A')).toBe(true);
  });

  it('should block access without tenant context', async () => {
    // Reset tenant context
    await prisma.$executeRawUnsafe(`
      RESET app.current_tenant_id;
    `);

    // Query should return no results or fail
    const users = await prisma.user.findMany();
    expect(users.length).toBe(0);
  });

  it('should allow super-admin bypass', async () => {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "User" DISABLE ROW LEVEL SECURITY;
      ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
      
      CREATE POLICY admin_bypass ON "User"
        USING (current_setting('app.is_superadmin', TRUE)::boolean = TRUE);
    `);

    // Set super-admin flag
    await prisma.$executeRawUnsafe(`
      SET app.is_superadmin = TRUE;
    `);

    // Should access all tenants
    const users = await prisma.user.findMany();
    expect(users.length).toBeGreaterThan(0);
  });
});
Validation:
bash# Run migration tests
npm run test:migrations

# Run in CI
npm run test:migrations -- --ci --coverage

Task 5.5: Regression Tests for Analytics
Status: NOT STARTED
Priority: P2
Deadline: Week 6
Estimated Effort: 3 hours
tests/integration/analytics-isolation.test.ts:
typescriptdescribe('Analytics Tenant Isolation', () => {
  it('should return tenant-specific booking stats', async () => {
    const jwtA = signJWT({ tenantId: 'tenant-A', userId: 'admin-A' });
    
    const res = await fetch('/api/admin/stats/bookings', {
      headers: { Authorization: `Bearer ${jwtA}` }
    });

    const stats = await res.json();
    
    // Verify all data belongs to tenant-A
    expect(stats.total).toBeGreaterThan(0);
    // Additional assertions...
  });

  it('should not leak cross-tenant aggregates', async () => {
    // Create bookings for tenant-A and tenant-B
    await createTestBooking('tenant-A', { amount: 100 });
    await createTestBooking('tenant-B', { amount: 200 });

    const jwtA = signJWT({ tenantId: 'tenant-A' });
    const res = await fetch('/api/admin/stats/bookings', {
      headers: { Authorization: `Bearer ${jwtA}` }
    });

    const stats = await res.json();
    
    // Should only include tenant-A's 100, not tenant-B's 200
    expect(stats.totalRetryClaude does not have the ability to run the code it generates yet.AContinueEditTenant System Migration Plan - Professional Edition (Continued)

Phase 5: Testing & Quality Assurance (P1-P2) (Continued)
Task 5.5: Regression Tests for Analytics (Continued)
tests/integration/analytics-isolation.test.ts:
typescriptdescribe('Analytics Tenant Isolation', () => {
  it('should return tenant-specific booking stats', async () => {
    const jwtA = signJWT({ tenantId: 'tenant-A', userId: 'admin-A' });
    
    const res = await fetch('/api/admin/stats/bookings', {
      headers: { Authorization: `Bearer ${jwtA}` }
    });

    const stats = await res.json();
    
    // Verify all data belongs to tenant-A
    expect(stats.total).toBeGreaterThan(0);
    expect(stats.totalRevenue).toBeDefined();
  });

  it('should not leak cross-tenant aggregates', async () => {
    // Create bookings for tenant-A and tenant-B
    await createTestBooking('tenant-A', { amount: 100 });
    await createTestBooking('tenant-B', { amount: 200 });

    const jwtA = signJWT({ tenantId: 'tenant-A' });
    const res = await fetch('/api/admin/stats/bookings', {
      headers: { Authorization: `Bearer ${jwtA}` }
    });

    const stats = await res.json();
    
    // Should only include tenant-A's 100, not tenant-B's 200
    expect(stats.totalRevenue).toBe(100);
  });

  it('should isolate user count statistics', async () => {
    const jwtA = signJWT({ tenantId: 'tenant-A' });
    
    const res = await fetch('/api/admin/stats/users', {
      headers: { Authorization: `Bearer ${jwtA}` }
    });

    const stats = await res.json();
    
    // Verify no cross-tenant user data
    expect(stats.users.every(u => u.tenantId === 'tenant-A')).toBe(true);
  });

  it('should isolate time-series analytics', async () => {
    const jwtA = signJWT({ tenantId: 'tenant-A' });
    
    const res = await fetch('/api/admin/analytics?range=30d', {
      headers: { Authorization: `Bearer ${jwtA}` }
    });

    const data = await res.json();
    
    // Verify time series data isolation
    expect(data.series).toBeDefined();
    expect(data.series.length).toBeGreaterThan(0);
  });
});
Validation:
bashnpm run test:integration -- analytics-isolation

## Phase 6: Repository and Service Layer (P2)
Status: 0% Complete
Duration: Week 9
Priority: P2
Owner: Backend Team
Blocked By: Phase 3 completion
Goal
Create tenant-scoped repository abstractions to centralize data access and eliminate direct Prisma usage.
Task 6.1: Create Tenant-Scoped Repository Abstractions
Status: NOT STARTED
Priority: P1
Deadline: Week 9
Estimated Effort: 8 hours
Repositories to Create:

 UserRepository
 ServiceRepository
 ServiceRequestRepository
 BookingRepository
 TaskRepository

Implementation Template:
src/repositories/base.repository.ts:
typescriptimport { PrismaClient } from '@prisma/client';
import { getTenantContext } from '@/lib/tenant-context';

export abstract class BaseRepository<T> {
  constructor(protected prisma: PrismaClient) {}

  protected getTenantId(): string {
    const context = getTenantContext();
    if (!context) {
      throw new Error('Tenant context required for repository operations');
    }
    return context.id;
  }

  protected getTenantFilter() {
    return { tenantId: this.getTenantId() };
  }
}
src/repositories/user.repository.ts:
typescriptimport { Prisma, User } from '@prisma/client';
import { BaseRepository } from './base.repository';

export class UserRepository extends BaseRepository<User> {
  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        id,
        ...this.getTenantFilter()
      }
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: {
        tenantId_email: {
          tenantId: this.getTenantId(),
          email
        }
      }
    });
  }

  async findMany(where?: Prisma.UserWhereInput): Promise<User[]> {
    return this.prisma.user.findMany({
      where: {
        ...where,
        ...this.getTenantFilter()
      }
    });
  }

  async create(data: Omit<Prisma.UserCreateInput, 'tenant'>): Promise<User> {
    return this.prisma.user.create({
      data: {
        ...data,
        tenant: {
          connect: { id: this.getTenantId() }
        }
      }
    });
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    // Verify ownership before update
    const user = await this.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    return this.prisma.user.update({
      where: { id },
      data
    });
  }

  async delete(id: string): Promise<User> {
    // Verify ownership before delete
    const user = await this.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    return this.prisma.user.delete({
      where: { id }
    });
  }

  async count(where?: Prisma.UserWhereInput): Promise<number> {
    return this.prisma.user.count({
      where: {
        ...where,
        ...this.getTenantFilter()
      }
    });
  }
}
src/repositories/service.repository.ts:
typescriptimport { Prisma, Service } from '@prisma/client';
import { BaseRepository } from './base.repository';

export class ServiceRepository extends BaseRepository<Service> {
  async findById(id: string): Promise<Service | null> {
    return this.prisma.service.findFirst({
      where: {
        id,
        ...this.getTenantFilter()
      },
      include: {
        bookings: true
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
      },
      orderBy: { name: 'asc' }
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

  async update(id: string, data: Prisma.ServiceUpdateInput): Promise<Service> {
    const service = await this.findById(id);
    if (!service) {
      throw new Error('Service not found');
    }

    return this.prisma.service.update({
      where: { id },
      data
    });
  }

  async getActiveServices(): Promise<Service[]> {
    return this.findMany({
      status: 'ACTIVE'
    });
  }
}
src/repositories/booking.repository.ts:
typescriptimport { Prisma, Booking } from '@prisma/client';
import { BaseRepository } from './base.repository';

export class BookingRepository extends BaseRepository<Booking> {
  async findById(id: string): Promise<Booking | null> {
    return this.prisma.booking.findFirst({
      where: {
        id,
        ...this.getTenantFilter()
      },
      include: {
        service: true,
        user: true
      }
    });
  }

  async findMany(where?: Prisma.BookingWhereInput): Promise<Booking[]> {
    return this.prisma.booking.findMany({
      where: {
        ...where,
        ...this.getTenantFilter()
      },
      include: {
        service: true,
        user: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findUpcoming(userId?: string): Promise<Booking[]> {
    const now = new Date();
    
    return this.findMany({
      startTime: { gte: now },
      status: { in: ['CONFIRMED', 'PENDING'] },
      ...(userId ? { userId } : {})
    });
  }

  async create(data: Omit<Prisma.BookingCreateInput, 'tenant'>): Promise<Booking> {
    return this.prisma.booking.create({
      data: {
        ...data,
        tenant: {
          connect: { id: this.getTenantId() }
        }
      }
    });
  }

  async getStats(startDate: Date, endDate: Date) {
    const tenantId = this.getTenantId();
    
    return this.prisma.$queryRaw`
      SELECT 
        COUNT(*) as total,
        SUM(amount) as revenue,
        COUNT(CASE WHEN status = 'CONFIRMED' THEN 1 END) as confirmed,
        COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END) as cancelled
      FROM "Booking"
      WHERE "tenantId" = ${tenantId}
        AND "createdAt" >= ${startDate}
        AND "createdAt" <= ${endDate}
    `;
  }
}
Repository Factory:
src/repositories/index.ts:
typescriptimport { PrismaClient } from '@prisma/client';
import { UserRepository } from './user.repository';
import { ServiceRepository } from './service.repository';
import { BookingRepository } from './booking.repository';
import { prisma } from '@/lib/prisma';

export class RepositoryFactory {
  constructor(private prisma: PrismaClient = prisma) {}

  get users(): UserRepository {
    return new UserRepository(this.prisma);
  }

  get services(): ServiceRepository {
    return new ServiceRepository(this.prisma);
  }

  get bookings(): BookingRepository {
    return new BookingRepository(this.prisma);
  }
}

// Singleton instance
export const repositories = new RepositoryFactory();

// Convenience exports
export const userRepository = repositories.users;
export const serviceRepository = repositories.services;
export const bookingRepository = repositories.bookings;
Usage Example:
typescript// In API route
export const GET = withTenantContext(
  async (req, { user, tenant }) => {
    // Use repository instead of direct Prisma
    const services = await serviceRepository.findMany({
      status: 'ACTIVE'
    });
    
    return NextResponse.json(services);
  },
  { requireRole: ['ADMIN'] }
);
Validation:
bash# Test repositories
npm run test:unit -- repositories

# Check no direct Prisma usage in routes
grep -r "prisma\." src/app/api --include="*.ts" | grep -v "// OK" | wc -l
# Should be 0 after refactor

Task 6.2: Refactor Service Modules
Status: NOT STARTED
Priority: P2
Deadline: Week 10
Estimated Effort: 6 hours
Service Layer Pattern:
src/services/booking.service.ts:
typescriptimport { bookingRepository, serviceRepository } from '@/repositories';
import { Prisma } from '@prisma/client';

export class BookingService {
  async createBooking(data: {
    serviceId: string;
    userId: string;
    startTime: Date;
    endTime: Date;
    notes?: string;
  }) {
    // Validate service exists and is active
    const service = await serviceRepository.findById(data.serviceId);
    if (!service) {
      throw new Error('Service not found');
    }
    if (service.status !== 'ACTIVE') {
      throw new Error('Service is not available for booking');
    }

    // Check for conflicts
    const conflicts = await bookingRepository.findMany({
      serviceId: data.serviceId,
      status: { in: ['CONFIRMED', 'PENDING'] },
      OR: [
        {
          startTime: { lte: data.startTime },
          endTime: { gt: data.startTime }
        },
        {
          startTime: { lt: data.endTime },
          endTime: { gte: data.endTime }
        }
      ]
    });

    if (conflicts.length > 0) {
      throw new Error('Time slot not available');
    }

    // Create booking
    return bookingRepository.create({
      service: { connect: { id: data.serviceId } },
      user: { connect: { id: data.userId } },
      startTime: data.startTime,
      endTime: data.endTime,
      notes: data.notes,
      status: 'PENDING'
    });
  }

  async cancelBooking(bookingId: string, reason?: string) {
    const booking = await bookingRepository.findById(bookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.status === 'CANCELLED') {
      throw new Error('Booking already cancelled');
    }

    return bookingRepository.update(bookingId, {
      status: 'CANCELLED',
      cancellationReason: reason,
      cancelledAt: new Date()
    });
  }

  async getUpcomingBookings(userId?: string) {
    return bookingRepository.findUpcoming(userId);
  }

  async getBookingStats(startDate: Date, endDate: Date) {
    return bookingRepository.getStats(startDate, endDate);
  }
}

export const bookingService = new BookingService();
Update API Routes:
typescript// src/app/api/bookings/route.ts
import { bookingService } from '@/services/booking.service';

export const POST = withTenantContext(
  async (req, { user, tenant }) => {
    const body = await req.json();
    
    try {
      const booking = await bookingService.createBooking({
        ...body,
        userId: user.id
      });
      
      return NextResponse.json(booking, { status: 201 });
    } catch (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
  }
);
Cache Integration:
src/services/cache.service.ts:
typescriptimport { Redis } from 'ioredis';
import { getTenantContext } from '@/lib/tenant-context';

const redis = new Redis(process.env.REDIS_URL);

export class CacheService {
  private getKey(key: string): string {
    const context = getTenantContext();
    if (!context) {
      throw new Error('Tenant context required for cache operations');
    }
    return `tenant:${context.id}:${key}`;
  }

  async get<T>(key: string): Promise<T | null> {
    const data = await redis.get(this.getKey(key));
    return data ? JSON.parse(data) : null;
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    if (ttlSeconds) {
      await redis.setex(this.getKey(key), ttlSeconds, serialized);
    } else {
      await redis.set(this.getKey(key), serialized);
    }
  }

  async del(key: string): Promise<void> {
    await redis.del(this.getKey(key));
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const context = getTenantContext();
    const keys = await redis.keys(`tenant:${context?.id}:${pattern}`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }
}

export const cacheService = new CacheService();
Service with Caching:
typescriptexport class ServiceService {
  async getActiveServices() {
    const cacheKey = 'services:active';
    
    // Try cache first
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from database
    const services = await serviceRepository.getActiveServices();
    
    // Cache for 5 minutes
    await cacheService.set(cacheKey, services, 300);
    
    return services;
  }

  async updateService(id: string, data: any) {
    const service = await serviceRepository.update(id, data);
    
    // Invalidate related caches
    await cacheService.invalidatePattern('services:*');
    
    return service;
  }
}

Task 6.3: Background Jobs and Cron Scripts
Status: NOT STARTED
Priority: P2
Deadline: Week 10
Estimated Effort: 4 hours
Job Pattern with Tenant Context:
src/jobs/send-booking-reminders.ts:
typescriptimport { prisma } from '@/lib/prisma';
import { runWithTenantContext } from '@/lib/tenant-context';
import { bookingRepository } from '@/repositories';

export async function sendBookingReminders() {
  console.log('Starting booking reminder job');

  // Get all active tenants
  const tenants = await prisma.tenant.findMany({
    where: { status: 'ACTIVE' }
  });

  // Process each tenant
  for (const tenant of tenants) {
    try {
      await runWithTenantContext(
        { id: tenant.id, slug: tenant.slug },
        async () => {
          console.log(`Processing reminders for tenant: ${tenant.slug}`);

          // Get bookings starting in 24 hours
          const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
          const dayAfter = new Date(Date.now() + 25 * 60 * 60 * 1000);

          const bookings = await bookingRepository.findMany({
            startTime: {
              gte: tomorrow,
              lt: dayAfter
            },
            status: 'CONFIRMED',
            reminderSent: false
          });

          console.log(`Found ${bookings.length} bookings to remind`);

          for (const booking of bookings) {
            await sendReminderEmail(booking);
            await bookingRepository.update(booking.id, {
              reminderSent: true
            });
          }
        }
      );
    } catch (error) {
      console.error(`Error processing tenant ${tenant.slug}:`, error);
      // Continue with other tenants
    }
  }

  console.log('Booking reminder job completed');
}
Cron Configuration:
src/jobs/index.ts:
typescriptimport cron from 'node-cron';
import { sendBookingReminders } from './send-booking-reminders';
import { cleanupExpiredSessions } from './cleanup-sessions';
import { generateDailyReports } from './generate-reports';

export function initializeJobs() {
  // Run booking reminders every hour
  cron.schedule('0 * * * *', async () => {
    console.log('Running booking reminders job');
    try {
      await sendBookingReminders();
    } catch (error) {
      console.error('Booking reminders job failed:', error);
    }
  });

  // Cleanup expired sessions daily at 2 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('Running session cleanup job');
    try {
      await cleanupExpiredSessions();
    } catch (error) {
      console.error('Session cleanup job failed:', error);
    }
  });

  // Generate daily reports at 6 AM
  cron.schedule('0 6 * * *', async () => {
    console.log('Running daily reports job');
    try {
      await generateDailyReports();
    } catch (error) {
      console.error('Daily reports job failed:', error);
    }
  });

  console.log('All cron jobs initialized');
}
Add to Server Start:
src/server.ts:
typescriptimport { initializeJobs } from './jobs';

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Initialize background jobs
  if (process.env.ENABLE_CRON_JOBS === 'true') {
    initializeJobs();
  }
});

## Phase 7: Client and Portal Adjustments (P2)
Status: 50% Complete
Duration: Week 11
Priority: P2
Owner: Frontend Team
Task 7.1: Frontend Data-Fetching Updates
Status: 50% Complete
Priority: P2
Deadline: Week 11
Already Completed:

 src/lib/api.ts updated to remove x-tenant-id injection in production
 TenantSwitcher updated to call secure endpoint

Additional Work Needed:
src/hooks/use-api.ts (update):
typescriptimport useSWR from 'swr';
import { useSession } from 'next-auth/react';

// Remove manual tenant header injection
const fetcher = async (url: string) => {
  const res = await fetch(url, {
    credentials: 'include'
    // Do NOT add x-tenant-id header here
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'API request failed');
  }

  return res.json();
};

export function useApi<T>(endpoint: string) {
  const { data: session } = useSession();

  const { data, error, mutate } = useSWR<T>(
    session ? endpoint : null,
    fetcher
  );

  return {
    data,
    error,
    isLoading: !data && !error,
    mutate
  };
}
Audit Custom Fetch Wrappers:
bash# Find custom fetch implementations
grep -r "new Headers" src/components --include="*.tsx" --include="*.ts"
grep -r "fetch(" src/components --include="*.tsx" --include="*.ts" | grep -v "node_modules"

# Check for manual tenant header addition
grep -r "x-tenant-id" src/components --include="*.tsx" --include="*.ts"
Update SWR Configuration:
src/lib/swr-config.ts:
typescriptimport { SWRConfig } from 'swr';

export const swrConfig = {
  fetcher: (url: string) => fetch(url, {
    credentials: 'include'
  }).then(res => {
    if (!res.ok) throw new Error('API Error');
    return res.json();
  }),
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  // Tenant-specific cache keys automatically handled by URL
  dedupingInterval: 2000
};

Task 7.2: Portal Route Display Verification
Status: NOT STARTED
Priority: P2
Deadline: Week 11
Estimated Effort: 3 hours
Client-Side Tenant Verification:
src/components/TenantGuard.tsx:
typescript'use client';

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

    // Verify tenant context
    if (!session.user.tenant) {
      console.error('Missing tenant context in session');
      router.push('/select-tenant');
      return;
    }

    // Verify tenant matches current subdomain
    const hostname = window.location.hostname;
    const subdomain = hostname.split('.')[0];
    
    if (subdomain !== 'www' && subdomain !== session.user.tenant.slug) {
      console.warn('Tenant mismatch detected', {
        subdomain,
        sessionTenant: session.user.tenant.slug
      });
      // Redirect to correct subdomain
      window.location.href = `https://${session.user.tenant.slug}.${process.env.NEXT_PUBLIC_BASE_DOMAIN}${window.location.pathname}`;
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (!session?.user.tenant) {
    return null;
  }

  return <>{children}</>;
}
Review Offline Storage:
typescript// src/lib/offline-storage.ts
import { getTenantFromSession } from './tenant';

export class OfflineStorage {
  private getKey(key: string): string {
    const tenantSlug = getTenantFromSession();
    if (!tenantSlug) {
      throw new Error('Tenant context required for offline storage');
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

  remove(key: string): void {
    const scopedKey = this.getKey(key);
    localStorage.removeItem(scopedKey);
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

export const offlineStorage = new OfflineStorage();

## Phase 8: Documentation and Governance (P2)
Status: 0% Complete
Duration: Week 12
Priority: P2
Owner: Platform Team
Task 8.1: Developer Documentation
Status: NOT STARTED
Priority: P2
Deadline: Week 12
Estimated Effort: 6 hours
Documents to Create:
docs/developer/tenant-context-guide.md:
markdown# Tenant Context Usage Guide

## Overview
All API routes and background jobs must operate within a tenant context to ensure data isolation.

## API Routes

### Using withTenantContext
```typescript
export const GET = withTenantContext(
  async (req, { user, tenant, params }) => {
    // tenant.id is available here
    const services = await serviceRepository.findMany();
    return NextResponse.json(services);
  },
  { requireRole: ['ADMIN'] }
);
Options

requireRole: Array of roles required
requireAuth: Boolean (default: true)
skipTenantVerification: Boolean (default: false) - use with caution

Background Jobs
Running with Tenant Context
typescriptawait runWithTenantContext(
  { id: tenant.id, slug: tenant.slug },
  async () => {
    // Tenant-scoped operations
  }
);
Repositories
Using Repositories
typescriptimport { userRepository } from '@/repositories';

// Automatically tenant-scoped
const users = await userRepository.findMany({ status: 'ACTIVE' });
Common Pitfalls

Never trust client headers: Use withTenantContext wrapper
Never bypass repositories: Always use repository layer
Always test tenant isolation: Include tenant mismatch tests
Cache keys must include tenant: Use cacheService

Migration Checklist

 Route uses withTenantContext
 No direct Prisma usage
 Tests include tenant isolation
 Documentation updated


`docs/developer/prisma-patterns.md`:
```markdown
# Tenant-Aware Prisma Patterns

## DO: Use Repositories
```typescript
// CORRECT
const users = await userRepository.findMany();
DON'T: Direct Prisma Access
typescript// WRONG
const users = await prisma.user.findMany();
DO: Include Tenant in Where Clauses
typescript// CORRECT (when raw query necessary)
const result = await prisma.user.findMany({
  where: {
    tenantId: tenant.id,
    status: 'ACTIVE'
  }
});
DO: Use RLS Helper for Raw Queries
typescript// CORRECT
import { withRLS } from '@/lib/prisma-rls';

const stats = await withRLS(tenant.id, async () => {
  return prisma.$queryRaw`SELECT COUNT(*) FROM "User"`;
});
Compound Foreign Keys
prismamodel Booking {
  service Service @relation(
    fields: [serviceId, tenantId],
    references: [id, tenantId]
  )
}

`docs/developer/testing-guide.md`:
```markdown
# Tenant Isolation Testing Guide

## Unit Tests
```typescript
it('should filter by tenant', async () => {
  await runWithTenantContext({ id: 'tenant-A' }, async () => {
    const users = await userRepository.findMany();
    expect(users.every(u => u.tenantId === 'tenant-A')).toBe(true);
  });
});
Integration Tests
typescriptit('should return 403 on tenant mismatch', async () => {
  const jwt = signJWT({ tenantId: 'tenant-A' });
  const res = await fetch('/api/services', {
    headers: {
      Authorization: `Bearer ${jwt}`,
      'x-tenant-id': 'tenant-B' // spoofed
    }
  });
  expect(res.status).toBe(403);
});
E2E Tests
typescripttest('should isolate tenant data', async ({ page }) => {
  await page.goto('https://tenant-a.localhost:3000/services');
  const services = await page.locator('[data-service]').count();
  // Assert tenant-A services only
});

---

#### Task 8.2: Operational Documentation

**Status**: NOT STARTED  
**Priority**: P2  
**Deadline**: Week 12  
**Estimated Effort**: 4 hours

`docs/operations/runbook-tenant-isolation.md`:
```markdown
# Tenant Isolation Incident Runbook

## Severity Classification

### P0RetryClaude does not have the ability to run the code it generates yet.AContinueEditTenant System Migration Plan - Professional Edition (Continued)

Phase 8: Documentation and Governance (P2) (Continued)
Task 8.2: Operational Documentation (Continued)
docs/operations/runbook-tenant-isolation.md:
markdown# Tenant Isolation Incident Runbook

## Severity Classification

### P0 - Critical (Cross-Tenant Data Leak)
- Cross-tenant data visible to users
- Data modification across tenant boundaries
- Authentication bypass allowing tenant impersonation
- Response time: Immediate (< 15 minutes)

### P1 - High (Potential Security Gap)
- Tenant context missing in logs
- RLS policy violations detected
- Suspicious cross-tenant access attempts
- Response time: < 1 hour

### P2 - Medium (Configuration Issues)
- Incorrect tenant routing
- Cache key collisions
- Performance degradation
- Response time: < 4 hours

## Detection

### Alerts
- **Cross-tenant access attempt**: Sentry/DataDog alert
- **RLS violation**: Database logs
- **Missing tenant context**: Application logs
- **Cookie signature failure spike**: WAF logs

### Log Queries
```bash
# Find cross-tenant access attempts
grep "tenant_mismatch" logs/app.log | tail -n 100

# Check Sentry
curl https://sentry.io/api/0/projects/{project}/events/?query=tenant

# Database audit
psql $DATABASE_URL -c "
  SELECT * FROM \"AuditLog\"
  WHERE action = 'CROSS_TENANT_ACCESS_ATTEMPT'
  AND \"createdAt\" > NOW() - INTERVAL '1 hour'
"
Response Procedures
Step 1: Assess Scope (5 minutes)
bash# Identify affected tenants
psql $DATABASE_URL -c "
  SELECT DISTINCT \"tenantId\"
  FROM \"AuditLog\"
  WHERE action LIKE '%CROSS_TENANT%'
  AND \"createdAt\" > NOW() - INTERVAL '1 hour'
"

# Count affected users
psql $DATABASE_URL -c "
  SELECT COUNT(DISTINCT \"userId\")
  FROM \"AuditLog\"
  WHERE \"tenantId\" IN (SELECT DISTINCT \"tenantId\" FROM \"AuditLog\" WHERE action LIKE '%CROSS_TENANT%')
"
Step 2: Contain (10 minutes)
bash# Option A: Disable affected route
# Edit middleware to block specific endpoints
curl -X POST https://api.cloudflare.com/client/v4/zones/{zone}/firewall/rules \
  -H "Authorization: Bearer $CF_TOKEN" \
  -d '{
    "filter": {"expression": "http.request.uri.path contains \"/api/admin/stats\""},
    "action": "block"
  }'

# Option B: Enable maintenance mode
echo "MAINTENANCE_MODE=true" >> .env.production
npm run deploy

# Option C: Rollback to previous version
git revert HEAD
npm run deploy
Step 3: Investigate (30 minutes)
bash# Review affected routes
grep -r "getServerSession" src/app/api/admin/stats --include="*.ts"

# Check middleware logs
grep "tenant_mismatch" logs/middleware.log | jq '.'

# Review database for data exposure
psql $DATABASE_URL -c "
  SELECT 
    u.email,
    u.\"tenantId\",
    al.action,
    al.metadata
  FROM \"AuditLog\" al
  JOIN \"User\" u ON al.\"userId\" = u.id
  WHERE al.action LIKE '%CROSS_TENANT%'
  ORDER BY al.\"createdAt\" DESC
  LIMIT 50
"
Step 4: Remediate (variable)
bash# Apply hotfix
git checkout -b hotfix/tenant-isolation
# Edit affected files
git commit -m "fix: enforce tenant isolation on stats endpoints"
git push origin hotfix/tenant-isolation

# Deploy
npm run build
npm run deploy:production

# Verify fix
curl -H "x-tenant-id: spoofed" https://app.example.com/api/admin/stats/users
# Should return 403
Step 5: Notify (15 minutes)
markdownSubject: Security Incident Notification - Tenant Isolation

Dear [Affected Tenant],

We are writing to inform you of a security incident that occurred on [DATE] at [TIME].

**What Happened:**
A configuration error in our application temporarily allowed [DESCRIPTION].

**What Data Was Affected:**
[LIST AFFECTED DATA TYPES]

**What We Did:**
- Detected the issue at [TIME]
- Disabled affected functionality at [TIME]
- Applied fix at [TIME]
- Verified resolution at [TIME]

**What You Should Do:**
[RECOMMENDED ACTIONS]

We sincerely apologize for this incident. We take security seriously and have implemented additional safeguards.

If you have questions, contact security@company.com

Regards,
Security Team
Step 6: Post-Incident Review (24-48 hours)
markdown# Incident Report Template

## Incident Summary
- **Date/Time**: 
- **Duration**: 
- **Severity**: 
- **Affected Tenants**: 
- **Root Cause**: 

## Timeline
- **Detection**: 
- **Containment**: 
- **Investigation**: 
- **Resolution**: 
- **Notification**: 

## Root Cause Analysis
[5 WHYs or similar]

## Impact Assessment
- **Data Exposed**: 
- **Users Affected**: 
- **Revenue Impact**: 

## Preventive Measures
1. [ ] Code review process enhancement
2. [ ] Additional automated tests
3. [ ] Monitoring improvements
4. [ ] Training for team

## Action Items
- [ ] Update runbook
- [ ] Add new tests
- [ ] Deploy additional safeguards
- [ ] Schedule team retrospective
Emergency Contacts

On-Call Engineer: +1-xxx-xxx-xxxx
Security Lead: security@company.com
CTO: cto@company.com
Legal: legal@company.com

Rollback Procedures
See Rollback & Emergency Procedures section

---

#### Task 8.3: Code Review and Linting

**Status**: NOT STARTED  
**Priority**: P2  
**Deadline**: Ongoing  
**Estimated Effort**: 4 hours setup

**ESLint Custom Rules**:

`.eslintrc.js`:
```javascript
module.exports = {
  extends: ['next/core-web-vitals'],
  rules: {
    // Enforce withTenantContext usage
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['next-auth'],
            importNames: ['getServerSession'],
            message: 'Use withTenantContext instead of direct getServerSession'
          }
        ]
      }
    ]
  },
  overrides: [
    {
      files: ['src/app/api/**/*.ts'],
      rules: {
        'no-restricted-syntax': [
          'error',
          {
            selector: 'CallExpression[callee.name="getServerSession"]',
            message: 'Direct getServerSession usage not allowed in API routes. Use withTenantContext wrapper.'
          },
          {
            selector: 'CallExpression[callee.name="getTenantFromRequest"]',
            message: 'getTenantFromRequest is deprecated. Tenant context is provided by withTenantContext.'
          }
        ]
      }
    }
  ]
};
Custom ESLint Plugin:
.eslint/rules/enforce-tenant-context.js:
javascriptmodule.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce tenant context in API routes',
      category: 'Security',
      recommended: true
    },
    messages: {
      missingWrapper: 'API route must use withTenantContext wrapper',
      directPrisma: 'Direct Prisma usage not allowed. Use repository pattern.',
      missingTenantId: 'Prisma query missing tenantId filter'
    }
  },
  create(context) {
    return {
      // Check for export without withTenantContext
      ExportNamedDeclaration(node) {
        const isApiRoute = context.getFilename().includes('/api/');
        if (!isApiRoute) return;

        const hasWrapper = node.declaration?.init?.callee?.name === 'withTenantContext';
        if (!hasWrapper) {
          context.report({
            node,
            messageId: 'missingWrapper'
          });
        }
      },
      
      // Check for direct Prisma usage
      MemberExpression(node) {
        if (node.object.name === 'prisma') {
          const isInRepository = context.getFilename().includes('/repositories/');
          if (!isInRepository) {
            context.report({
              node,
              messageId: 'directPrisma'
            });
          }
        }
      }
    };
  }
};
PR Template:
.github/pull_request_template.md:
markdown## Description
<!-- Describe your changes -->

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Tenant Security Checklist
- [ ] All new API routes use `withTenantContext` wrapper
- [ ] No direct usage of `getServerSession` without wrapper
- [ ] No usage of `getTenantFromRequest` for tenant resolution
- [ ] All Prisma queries use repository pattern
- [ ] New models include `tenantId` column with proper indexing
- [ ] No client-side tenant header injection added
- [ ] Tests include tenant isolation validation

## Testing Checklist
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Tenant isolation tests pass
- [ ] Manual testing completed
- [ ] Cross-tenant access blocked

## Database Changes
- [ ] Migration generated and tested
- [ ] Rollback plan documented
- [ ] Data backfill script included (if applicable)

## Related Issues
Closes #

## Screenshots (if applicable)
<!-- Add screenshots here -->

## Additional Notes
<!-- Any additional context -->

## Phase 9: Deployment and Rollout (P0)
Status: 0% Complete
Duration: Week 13
Priority: P0
Owner: DevOps Team
Task 9.1: Feature Flag Configuration
Status: NOT STARTED
Priority: P0
Deadline: Before each phase
Feature Flags:
bash# .env.production
MULTI_TENANCY_ENABLED=true
TENANT_MIGRATION_PHASE_1=true  # Route migration
TENANT_MIGRATION_PHASE_2=false # Schema changes
TENANT_MIGRATION_PHASE_3=false # RLS
ENFORCE_RLS=false
ENABLE_TENANT_SWITCHING=true
Flag Management:
src/lib/feature-flags.ts:
typescriptexport const featureFlags = {
  multiTenancyEnabled: process.env.MULTI_TENANCY_ENABLED === 'true',
  phase1Complete: process.env.TENANT_MIGRATION_PHASE_1 === 'true',
  phase2Complete: process.env.TENANT_MIGRATION_PHASE_2 === 'true',
  phase3Complete: process.env.TENANT_MIGRATION_PHASE_3 === 'true',
  enforceRLS: process.env.ENFORCE_RLS === 'true',
  enableTenantSwitching: process.env.ENABLE_TENANT_SWITCHING === 'true'
} as const;

export function requirePhase(phase: 1 | 2 | 3) {
  const flags = featureFlags;
  
  switch (phase) {
    case 1:
      return flags.phase1Complete;
    case 2:
      return flags.phase1Complete && flags.phase2Complete;
    case 3:
      return flags.phase1Complete && flags.phase2Complete && flags.phase3Complete;
  }
}

Task 9.2: Staged Deployment Strategy
Status: NOT STARTED
Priority: P0
Deadline: Before production rollout
Deployment Sequence:
markdown## Week 1-2: Route Migration (Phase 1)

### Dev Environment
1. Deploy route migrations
2. Run integration tests
3. Manual QA testing
4. Monitor logs for 24 hours

### Staging Environment
1. Deploy same changes
2. Run full test suite
3. Load testing with production-like data
4. Security penetration testing
5. Monitor for 48 hours

### Production Deployment
1. Schedule maintenance window (low-traffic period)
2. Deploy in canary mode (5% traffic)
3. Monitor for 1 hour
4. Gradually increase to 25%, 50%, 100%
5. Post-deployment monitoring (48 hours)

## Week 3-5: Schema Changes (Phase 2)

### Dev Environment
1. Test migrations
2. Verify data integrity
3. Test rollback procedures

### Staging Environment
1. Clone production data (anonymized)
2. Run backfill scripts
3. Measure migration duration
4. Test application with new schema

### Production Deployment
1. Announce maintenance window (2-4 hours)
2. Backup database
3. Enable read-only mode
4. Run migrations
5. Verify data integrity
6. Enable write mode
7. Monitor for issues

## Week 6-7: RLS Enablement (Phase 3)

### Staging Only (Week 6)
1. Enable RLS on staging
2. Test all critical paths
3. Performance testing
4. Identify slow queries

### Production (Week 7)
1. Schedule maintenance window
2. Enable RLS during low-traffic
3. Monitor query performance
4. Have disable script ready
Deployment Checklist:
docs/operations/deployment-checklist.md:
markdown# Deployment Checklist

## Pre-Deployment
- [ ] All tests passing in CI
- [ ] Code review completed
- [ ] Security review completed
- [ ] Database backup completed
- [ ] Rollback plan documented
- [ ] Stakeholders notified
- [ ] Maintenance window scheduled

## Deployment
- [ ] Set feature flags
- [ ] Deploy code changes
- [ ] Run database migrations
- [ ] Verify health checks
- [ ] Smoke test critical paths
- [ ] Check error rates
- [ ] Monitor performance metrics

## Post-Deployment
- [ ] Verify all features working
- [ ] Check logs for errors
- [ ] Monitor for 48 hours
- [ ] Update documentation
- [ ] Close deployment ticket
- [ ] Retrospective scheduled

## Rollback Triggers
- Error rate > 5%
- P0 bug discovered
- Performance degradation > 50%
- Customer complaints > threshold
- Security vulnerability discovered

Task 9.3: Post-Rollout Monitoring
Status: NOT STARTED
Priority: P0
Deadline: Ongoing after each phase
Monitoring Dashboard (Grafana/DataDog):
json{
  "dashboard": {
    "title": "Tenant Migration Rollout",
    "panels": [
      {
        "title": "Error Rate by Phase",
        "targets": [{
          "expr": "rate(http_errors_total{phase=~\"1|2|3\"}[5m])"
        }]
      },
      {
        "title": "Cross-Tenant Access Attempts",
        "targets": [{
          "expr": "sum(rate(tenant_mismatch_total[5m]))"
        }],
        "alert": {
          "conditions": [{"evaluator": {"type": "gt", "params": [0]}}]
        }
      },
      {
        "title": "RLS Performance Impact",
        "targets": [{
          "expr": "histogram_quantile(0.95, rate(query_duration_seconds_bucket[5m]))"
        }]
      },
      {
        "title": "Migration Progress",
        "targets": [{
          "expr": "tenant_migration_routes_migrated / tenant_migration_total_routes * 100"
        }]
      }
    ]
  }
}
Health Check Endpoint:
src/app/api/health/tenant-isolation/route.ts:
typescriptexport async function GET() {
  const checks = {
    middleware: await checkMiddleware(),
    rlsEnabled: await checkRLS(),
    routesMigrated: await checkRoutes(),
    tenantGuard: await checkPrismaGuard()
  };

  const allHealthy = Object.values(checks).every(c => c.healthy);

  return NextResponse.json(
    {
      status: allHealthy ? 'healthy' : 'degraded',
      checks,
      timestamp: new Date().toISOString()
    },
    { status: allHealthy ? 200 : 503 }
  );
}

async function checkMiddleware() {
  // Verify middleware is active
  return { healthy: true, message: 'Middleware active' };
}

async function checkRLS() {
  try {
    const result = await prisma.$queryRaw`
      SELECT tablename, rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public' AND rowsecurity = true
    `;
    return {
      healthy: Array.isArray(result) && result.length > 0,
      tablesWithRLS: Array.isArray(result) ? result.length : 0
    };
  } catch (error) {
    return { healthy: false, error: error.message };
  }
}

Phase 10: Post-Rollout Operations (P2)
Status: 0% Complete
Duration: Week 13+
Priority: P2
Owner: Platform Team
Task 10.1: Incident Response Updates
Status: NOT STARTED
Priority: P2
Deadline: Week 13

 Update incident response playbooks with tenant context
 Add tenant ID to incident triage checklist
 Document tenant-specific incident investigation procedures
 Create tenant data breach response plan
 Add tenant isolation verification to incident resolution

(Already covered in Task 8.2 above)

Task 10.2: Periodic Audits
Status: NOT STARTED
Priority: P2
Deadline: Quarterly
Quarterly Audit Script:
scripts/quarterly-tenant-audit.sh:
bash#!/bin/bash

echo "=== Quarterly Tenant Security Audit ==="
echo "Date: $(date)"
echo ""

# Check for unsafe patterns
echo "1. Checking for unsafe route patterns..."
UNSAFE_ROUTES=$(grep -r "getServerSession" src/app/api --include="*.ts" | grep -v withTenantContext | wc -l)
echo "   Unsafe routes found: $UNSAFE_ROUTES"
if [ $UNSAFE_ROUTES -gt 0 ]; then
  echo "   ⚠️  WARNING: Unsafe patterns detected"
  grep -r "getServerSession" src/app/api --include="*.ts" | grep -v withTenantContext
fi

# Check schema
echo ""
echo "2. Checking Prisma schema..."
node scripts/check_prisma_tenant_columns.js

# Check RLS
echo ""
echo "3. Checking RLS status..."
psql $DATABASE_URL -c "
  SELECT 
    COUNT(*) FILTER (WHERE rowsecurity = true) as rls_enabled,
    COUNT(*) FILTER (WHERE rowsecurity = false) as rls_disabled
  FROM pg_tables
  WHERE schemaname = 'public'
"

# Check test coverage
echo ""
echo "4. Checking test coverage..."
npm run test:coverage --silent | grep "All files"

# Check for NULL tenantIds
echo ""
echo "5. Checking for NULL tenantIds..."
psql $DATABASE_URL -c "
  SELECT 
    'ServiceRequest' as table_name,
    COUNT(*) as null_count
  FROM \"ServiceRequest\" WHERE \"tenantId\" IS NULL
  UNION ALL
  SELECT 'Booking', COUNT(*) FROM \"Booking\" WHERE \"tenantId\" IS NULL
  UNION ALL
  SELECT 'Expense', COUNT(*) FROM \"Expense\" WHERE \"tenantId\" IS NULL
"

# Review access logs
echo ""
echo "6. Reviewing access logs..."
psql $DATABASE_URL -c "
  SELECT 
    action,
    COUNT(*) as count
  FROM \"AuditLog\"
  WHERE \"createdAt\" > NOW() - INTERVAL '90 days'
    AND action LIKE '%CROSS_TENANT%'
  GROUP BY action
"

echo ""
echo "=== Audit Complete ==="

Task 10.3: Performance Optimization
Status: NOT STARTED
Priority: P2
Deadline: Week 14
Performance Monitoring:
sql-- Identify slow tenant-scoped queries
SELECT 
  query,
  mean_exec_time,
  calls
FROM pg_stat_statements
WHERE query LIKE '%tenantId%'
ORDER BY mean_exec_time DESC
LIMIT 20;

-- Check index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE indexname LIKE '%tenant%'
ORDER BY idx_scan DESC;
Optimization Checklist:

 Profile RLS policy performance impact
 Optimize slow tenant-scoped queries
 Add composite indexes where needed
 Review and optimize tenant context establishment overhead
 Monitor database connection pool usage
 Tune Prisma query performance


AI Agent Implementation Guide
Pattern Recognition Rules
typescript// AI Agent Pattern Detector
interface UnsafePattern {
  type: 'ROUTE_WITHOUT_WRAPPER' | 'DIRECT_TENANT_RESOLUTION' | 'MISSING_TENANT_FILTER' | 'NULLABLE_TENANT_ID';
  file: string;
  line: number;
  severity: 'P0' | 'P1' | 'P2';
  autoFixable: boolean;
}

function detectUnsafePatterns(codebase: string[]): UnsafePattern[] {
  const patterns: UnsafePattern[] = [];
  
  for (const file of codebase) {
    // Pattern 1: getServerSession without withTenantContext
    if (file.includes('getServerSession') && !file.includes('withTenantContext')) {
      patterns.push({
        type: 'ROUTE_WITHOUT_WRAPPER',
        file: file,
        severity: 'P0',
        autoFixable: true
      });
    }
    
    // Pattern 2: getTenantFromRequest usage
    if (file.includes('getTenantFromRequest')) {
      patterns.push({
        type: 'DIRECT_TENANT_RESOLUTION',
        file: file,
        severity: 'P0',
        autoFixable: true
      });
    }
    
    // Pattern 3: Prisma query without tenantId
    if (file.includes('prisma.') && !file.includes('tenantId')) {
      patterns.push({
        type: 'MISSING_TENANT_FILTER',
        file: file,
        severity: 'P1',
        autoFixable: false // Requires context
      });
    }
  }
  
  return patterns;
}
Auto-Fix Templates
typescript// Template Generator
function generateRouteMigration(originalCode: string): string {
  const template = `
export const GET = withTenantContext(
  async (req, { user, tenant, params }) => {
    ${extractHandlerLogic(originalCode)}
  },
  { requireRole: ['ADMIN'] }
);
  `.trim();
  
  return template;
}

function extractHandlerLogic(code: string): string {
  // Remove session/tenant resolution
  // Keep business logic
  // Add tenant.id references
  return code
    .replace(/const session = await getServerSession.*\n/, '')
    .replace(/const tenantId = getTenantFromRequest.*\n/, '')
    .replace(/tenantId/g, 'tenant.id');
}
Batch Processing Strategy
bash#!/bin/bash
# AI Agent Batch Migration Script

BATCH_SIZE=5
CURRENT_BATCH=1

# Get list of unsafe routes
UNSAFE_FILES=$(grep -r "getServerSession" src/app/api --include="*.ts" -l | grep -v withTenantContext)

for file in $UNSAFE_FILES; do
  if [ $((CURRENT_BATCH % BATCH_SIZE)) -eq 0 ]; then
    echo "Completed batch $(($CURRENT_BATCH / $BATCH_SIZE))"
    echo "Running tests..."
    npm run test:integration
    
    if [ $? -ne 0 ]; then
      echo "Tests failed! Halting migration."
      exit 1
    fi
    
    echo "Committing batch..."
    git add .
    git commit -m "refactor: migrate batch $(($CURRENT_BATCH / $BATCH_SIZE)) to withTenantContext"
  fi
  
  echo "Processing: $file"
  # Apply transformation
  node scripts/migrate-route.js "$file"
  
  CURRENT_BATCH=$((CURRENT_BATCH + 1))
done

echo "Migration complete!"

Validation & Testing Procedures
Quick Validation Commands
bash# Full validation suite
npm run validate:tenant-security

# Individual checks
npm run validate:routes
npm run validate:schema
npm run validate:rls
npm run validate:tests
package.json:
json{
  "scripts": {
    "validate:tenant-security": "bash scripts/validate-all.sh",
    "validate:routes": "bash scripts/validate-routes.sh",
    "validate:schema": "node scripts/check_prisma_tenant_columns.js",
    "validate:rls": "bash scripts/validate-rls.sh",
    "validate:tests": "npm run test:integration -- tenant-isolation"
  }
}

Success Criteria
Phase 1 Complete When:

 0 routes using getServerSession without withTenantContext
 0 routes using getTenantFromRequest
 100% of routes have integration tests
 Middleware logs include tenantId, userId, requestId
 All tests passing in CI

Phase 2 Complete When:

 0 NULL tenantId values in production
 All compound FKs in place
 Data integrity verification passing
 Rollback procedures tested

Phase 3 Complete When:

 RLS enabled on all 18+ tables
 All raw queries use RLS helper
 Performance impact < 5%
 Zero RLS violations in logs

Overall Migration Complete When:

 All 10 phases at 100%
 Zero P0/P1 security issues
 Test coverage > 90%
 Documentation complete
 Team trained on new patterns
 30 days post-deployment with no incidents


END OF DOCUMENT