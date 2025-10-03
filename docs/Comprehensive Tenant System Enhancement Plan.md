Comprehensive Tenant System Enhancement Plan
Executive Overview
This document provides a production-ready, enterprise-grade solution to transform the current tenant system from a manual, header-based approach into a fully automated, secure, and professionally architected multi-tenant system. The solution addresses all critical vulnerabilities identified in the audit while establishing robust architectural patterns for long-term maintainability.

Table of Contents

Architecture Philosophy
Database Schema Overhaul
Authentication & Tenant Binding
Automated Tenant Context Management
Prisma Client Enhancement
Middleware & Request Pipeline
API Layer Transformation
Migration Strategy
Testing Framework
Monitoring & Observability
Implementation Roadmap


Architecture Philosophy
Core Principles

Zero-Trust Tenant Isolation: Never trust client-provided tenant identifiers
Database-Enforced Security: Use constraints, RLS policies, and foreign keys
Automatic Context Propagation: Tenant context flows through the entire request lifecycle without manual intervention
Defense in Depth: Multiple layers of validation (DB, ORM, API, middleware)
Fail-Secure Defaults: Operations fail unless tenant context is explicitly established

Architectural Layers
┌─────────────────────────────────────────────────────────────┐
│                    Client Request                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Middleware: Auth + Tenant Binding + Context Injection      │
│  - Validates JWT/Session                                    │
│  - Extracts tenant from user membership                     │
│  - Sets AsyncLocalStorage context                           │
│  - Rejects mismatched headers                               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  API Routes: Tenant-Aware Handlers                          │
│  - Access tenant via context helper                         │
│  - Use tenant-scoped repositories                           │
│  - Never accept raw tenant parameters                       │
└─────────────────────────────────────────────────────────────┐
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Service Layer: Business Logic                              │
│  - Operates on tenant-scoped data                           │
│  - Uses repository pattern                                  │
│  - Validates cross-entity tenant consistency                │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Data Access: Enhanced Prisma Client                        │
│  - Auto-injects tenant filters via middleware               │
│  - Enforces tenant on all operations                        │
│  - Validates tenant context presence                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Database: PostgreSQL with RLS                              │
│  - Row-level security policies                              │
│  - Compound foreign keys                                    │
│  - Partial unique indexes                                   │
└─────────────────────────────────────────────────────────────┘

Database Schema Overhaul
Phase 1: Add Tenant Columns to All Entities
Migration Script: 001_add_tenant_columns.sql
sql-- Add tenantId to all tenant-owned entities
ALTER TABLE "User" 
  ADD COLUMN "tenantId" TEXT NOT NULL DEFAULT 'SYSTEM',
  ADD COLUMN "isPrimaryTenant" BOOLEAN DEFAULT true;

ALTER TABLE "Task" 
  ADD COLUMN "tenantId" TEXT NOT NULL DEFAULT 'SYSTEM';

ALTER TABLE "ComplianceRecord" 
  ADD COLUMN "tenantId" TEXT NOT NULL DEFAULT 'SYSTEM';

ALTER TABLE "HealthLog" 
  ADD COLUMN "tenantId" TEXT NOT NULL DEFAULT 'SYSTEM';

ALTER TABLE "AuditLog" 
  ADD COLUMN "tenantId" TEXT NOT NULL DEFAULT 'SYSTEM';

-- Create indexes for performance
CREATE INDEX "idx_user_tenant" ON "User"("tenantId");
CREATE INDEX "idx_task_tenant" ON "Task"("tenantId");
CREATE INDEX "idx_task_tenant_status" ON "Task"("tenantId", "status");
CREATE INDEX "idx_compliance_tenant" ON "ComplianceRecord"("tenantId");
CREATE INDEX "idx_healthlog_tenant" ON "HealthLog"("tenantId");
CREATE INDEX "idx_auditlog_tenant" ON "AuditLog"("tenantId");

-- Add foreign key constraints
ALTER TABLE "User" 
  ADD CONSTRAINT "fk_user_tenant" 
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") 
  ON DELETE CASCADE;

ALTER TABLE "Task" 
  ADD CONSTRAINT "fk_task_tenant" 
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") 
  ON DELETE CASCADE;

-- Repeat for all tenant-owned tables
Migration Script: 002_backfill_tenant_data.sql
sql-- Backfill existing data with tenant associations
-- This assumes you have a mapping strategy (e.g., via user relationships)

-- Example: Backfill tasks through assignee relationship
UPDATE "Task" t
SET "tenantId" = u."tenantId"
FROM "User" u
WHERE t."assigneeId" = u."id"
  AND t."tenantId" = 'SYSTEM';

-- Example: Backfill orphaned records to a default tenant
UPDATE "Task"
SET "tenantId" = (SELECT id FROM "Tenant" WHERE "isDefault" = true LIMIT 1)
WHERE "tenantId" = 'SYSTEM';

-- Remove default constraint after backfill
ALTER TABLE "Task" 
  ALTER COLUMN "tenantId" DROP DEFAULT;
Phase 2: Enforce Compound Constraints
Migration Script: 003_add_compound_constraints.sql
sql-- Add compound unique constraints for tenant-scoped uniqueness
ALTER TABLE "Service" 
  DROP CONSTRAINT IF EXISTS "Service_slug_key",
  ADD CONSTRAINT "uq_service_tenant_slug" 
  UNIQUE ("tenantId", "slug");

ALTER TABLE "User" 
  DROP CONSTRAINT IF EXISTS "User_email_key",
  ADD CONSTRAINT "uq_user_tenant_email" 
  UNIQUE ("tenantId", "email");

-- Add compound foreign keys for referential integrity
ALTER TABLE "Booking" 
  ADD CONSTRAINT "fk_booking_service_tenant" 
  FOREIGN KEY ("serviceId", "tenantId") 
  REFERENCES "Service"("id", "tenantId")
  ON DELETE CASCADE;

ALTER TABLE "ServiceRequest" 
  ADD CONSTRAINT "fk_request_service_tenant" 
  FOREIGN KEY ("serviceId", "tenantId") 
  REFERENCES "Service"("id", "tenantId")
  ON DELETE CASCADE;

-- Add check constraints for tenant consistency
ALTER TABLE "Task"
  ADD CONSTRAINT "chk_task_assignee_tenant"
  CHECK (
    "assigneeId" IS NULL OR 
    EXISTS (
      SELECT 1 FROM "User" u 
      WHERE u."id" = "assigneeId" 
      AND u."tenantId" = "Task"."tenantId"
    )
  );
Phase 3: Implement Partial Unique Indexes for Singletons
Migration Script: 004_singleton_constraints.sql
sql-- Create partial unique indexes for global defaults
CREATE UNIQUE INDEX "idx_organization_settings_global_unique"
  ON "OrganizationSettings" ((1))
  WHERE "tenantId" IS NULL;

CREATE UNIQUE INDEX "idx_booking_settings_global_unique"
  ON "BookingSettings" ((1))
  WHERE "tenantId" IS NULL;

CREATE UNIQUE INDEX "idx_integration_settings_global_unique"
  ON "IntegrationSettings" ((1))
  WHERE "tenantId" IS NULL;

-- Ensure tenant-specific settings are also unique
CREATE UNIQUE INDEX "idx_organization_settings_tenant_unique"
  ON "OrganizationSettings" ("tenantId")
  WHERE "tenantId" IS NOT NULL;

CREATE UNIQUE INDEX "idx_booking_settings_tenant_unique"
  ON "BookingSettings" ("tenantId")
  WHERE "tenantId" IS NOT NULL;
Phase 4: Postgres Row-Level Security
Migration Script: 005_enable_rls.sql
sql-- Enable RLS on all tenant-scoped tables
ALTER TABLE "Task" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Service" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ServiceRequest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Booking" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ComplianceRecord" ENABLE ROW LEVEL SECURITY;

-- Create policies (requires app to set session variable)
CREATE POLICY "tenant_isolation_policy" ON "Task"
  USING ("tenantId" = current_setting('app.current_tenant_id', TRUE)::TEXT);

CREATE POLICY "tenant_isolation_policy" ON "Service"
  USING ("tenantId" = current_setting('app.current_tenant_id', TRUE)::TEXT);

CREATE POLICY "tenant_isolation_policy" ON "ServiceRequest"
  USING ("tenantId" = current_setting('app.current_tenant_id', TRUE)::TEXT);

CREATE POLICY "tenant_isolation_policy" ON "Booking"
  USING ("tenantId" = current_setting('app.current_tenant_id', TRUE)::TEXT);

CREATE POLICY "tenant_isolation_policy" ON "ComplianceRecord"
  USING ("tenantId" = current_setting('app.current_tenant_id', TRUE)::TEXT);

-- Super admin bypass policy (optional, for system operations)
CREATE POLICY "superadmin_bypass" ON "Task"
  USING (current_setting('app.is_superadmin', TRUE)::BOOLEAN = TRUE);
Updated Prisma Schema
prisma// prisma/schema.prisma

model Tenant {
  id          String   @id @default(cuid())
  slug        String   @unique
  name        String
  domain      String?  @unique
  isActive    Boolean  @default(true)
  isDefault   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  users               User[]
  services            Service[]
  tasks               Task[]
  bookings            Booking[]
  serviceRequests     ServiceRequest[]
  complianceRecords   ComplianceRecord[]
  healthLogs          HealthLog[]
  auditLogs           AuditLog[]
  organizationSettings OrganizationSettings[]
  bookingSettings     BookingSettings[]
  
  @@index([slug])
  @@index([domain])
}

model User {
  id              String   @id @default(cuid())
  email           String
  tenantId        String
  isPrimaryTenant Boolean  @default(true)
  role            Role     @default(USER)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relations
  tenant          Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  tenantMemberships TenantMembership[]
  assignedTasks   Task[]   @relation("TaskAssignee")

  @@unique([tenantId, email])
  @@index([tenantId])
  @@index([email])
}

model TenantMembership {
  id        String   @id @default(cuid())
  userId    String
  tenantId  String
  role      TenantRole @default(MEMBER)
  isDefault Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  tenant    Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@unique([userId, tenantId])
  @@index([userId])
  @@index([tenantId])
}

model Task {
  id          String      @id @default(cuid())
  tenantId    String
  title       String
  description String?
  status      TaskStatus  @default(PENDING)
  assigneeId  String?
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  tenant      Tenant      @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  assignee    User?       @relation("TaskAssignee", fields: [assigneeId], references: [id])

  @@index([tenantId, status])
  @@index([assigneeId])
}

model Service {
  id          String   @id @default(cuid())
  tenantId    String
  slug        String
  name        String
  description String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  bookings    Booking[]
  requests    ServiceRequest[]

  @@unique([tenantId, slug])
  @@index([tenantId])
}

model OrganizationSettings {
  id        String   @id @default(cuid())
  tenantId  String?  @unique
  name      String
  logo      String?
  timezone  String   @default("UTC")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  tenant    Tenant?  @relation(fields: [tenantId], references: [id], onDelete: Cascade)
}

enum Role {
  SUPER_ADMIN
  ADMIN
  STAFF
  USER
}

enum TenantRole {
  OWNER
  ADMIN
  MEMBER
  VIEWER
}

Authentication & Tenant Binding
Enhanced NextAuth Configuration
typescript// src/lib/auth.ts

import { NextAuthOptions, Session, User as NextAuthUser } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        tenantSlug: { label: 'Tenant', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Missing credentials');
        }

        // Find user with tenant membership
        const user = await prisma.user.findFirst({
          where: {
            email: credentials.email,
            tenant: credentials.tenantSlug 
              ? { slug: credentials.tenantSlug }
              : { isDefault: true },
          },
          include: {
            tenant: true,
            tenantMemberships: {
              include: { tenant: true },
              where: { tenant: { isActive: true } },
            },
          },
        });

        if (!user) {
          throw new Error('Invalid credentials');
        }

        // Verify password (use bcrypt in production)
        const isValid = await verifyPassword(credentials.password, user.passwordHash);
        if (!isValid) {
          throw new Error('Invalid credentials');
        }

        // Determine active tenant
        const activeTenant = credentials.tenantSlug
          ? user.tenantMemberships.find(m => m.tenant.slug === credentials.tenantSlug)
          : user.tenantMemberships.find(m => m.isDefault) || user.tenantMemberships[0];

        if (!activeTenant) {
          throw new Error('No accessible tenant');
        }

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          tenantId: activeTenant.tenantId,
          tenantSlug: activeTenant.tenant.slug,
          tenantRole: activeTenant.role,
          availableTenants: user.tenantMemberships.map(m => ({
            id: m.tenantId,
            slug: m.tenant.slug,
            name: m.tenant.name,
            role: m.role,
          })),
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger, session }): Promise<JWT> {
      // Initial sign in
      if (user) {
        token.userId = user.id;
        token.role = user.role;
        token.tenantId = user.tenantId;
        token.tenantSlug = user.tenantSlug;
        token.tenantRole = user.tenantRole;
        token.availableTenants = user.availableTenants;
        token.version = 1; // For token invalidation
      }

      // Tenant switching via session update
      if (trigger === 'update' && session?.tenantId) {
        const membership = token.availableTenants?.find(
          (t: any) => t.id === session.tenantId
        );
        
        if (!membership) {
          throw new Error('Unauthorized tenant access');
        }

        token.tenantId = membership.id;
        token.tenantSlug = membership.slug;
        token.tenantRole = membership.role;
        token.version = (token.version as number) + 1;
      }

      return token;
    },

    async session({ session, token }): Promise<Session> {
      if (token) {
        session.user.id = token.userId as string;
        session.user.role = token.role as string;
        session.user.tenantId = token.tenantId as string;
        session.user.tenantSlug = token.tenantSlug as string;
        session.user.tenantRole = token.tenantRole as string;
        session.user.availableTenants = token.availableTenants as any[];
        session.user.tokenVersion = token.version as number;
      }
      return session;
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },

  secret: process.env.NEXTAUTH_SECRET,
};
Enhanced Type Definitions
typescript// src/types/next-auth.d.ts

import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface User {
    id: string;
    email: string;
    role: string;
    tenantId: string;
    tenantSlug: string;
    tenantRole: string;
    availableTenants: Array<{
      id: string;
      slug: string;
      name: string;
      role: string;
    }>;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      role: string;
      tenantId: string;
      tenantSlug: string;
      tenantRole: string;
      availableTenants: Array<{
        id: string;
        slug: string;
        name: string;
        role: string;
      }>;
      tokenVersion: number;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId: string;
    role: string;
    tenantId: string;
    tenantSlug: string;
    tenantRole: string;
    availableTenants: Array<{
      id: string;
      slug: string;
      name: string;
      role: string;
    }>;
    version: number;
  }
}

Automated Tenant Context Management
AsyncLocalStorage Implementation
typescript// src/lib/tenant-context.ts

import { AsyncLocalStorage } from 'async_hooks';

export interface TenantContext {
  tenantId: string;
  tenantSlug: string;
  userId: string;
  role: string;
  tenantRole: string;
  isSuperAdmin: boolean;
  requestId: string;
  timestamp: Date;
}

class TenantContextManager {
  private als = new AsyncLocalStorage<TenantContext>();

  /**
   * Run a function with tenant context
   */
  run<T>(context: TenantContext, fn: () => T): T {
    return this.als.run(context, fn);
  }

  /**
   * Get current tenant context
   * @throws Error if context is not set
   */
  getContext(): TenantContext {
    const context = this.als.getStore();
    if (!context) {
      throw new Error(
        'Tenant context not found. Ensure middleware has set the context.'
      );
    }
    return context;
  }

  /**
   * Get tenant ID from context
   */
  getTenantId(): string {
    return this.getContext().tenantId;
  }

  /**
   * Get tenant slug from context
   */
  getTenantSlug(): string {
    return this.getContext().tenantSlug;
  }

  /**
   * Get user ID from context
   */
  getUserId(): string {
    return this.getContext().userId;
  }

  /**
   * Check if current user is super admin
   */
  isSuperAdmin(): boolean {
    return this.getContext().isSuperAdmin;
  }

  /**
   * Check if context exists (for optional operations)
   */
  hasContext(): boolean {
    return this.als.getStore() !== undefined;
  }

  /**
   * Get context or null (for graceful handling)
   */
  getContextOrNull(): TenantContext | null {
    return this.als.getStore() || null;
  }
}

export const tenantContext = new TenantContextManager();
Context Helper Utilities
typescript// src/lib/tenant-utils.ts

import { tenantContext } from './tenant-context';
import { logger } from './logger';

/**
 * Require tenant context or throw
 */
export function requireTenantContext() {
  try {
    return tenantContext.getContext();
  } catch (error) {
    logger.error('Tenant context required but not found', { error });
    throw new Error('Operation requires tenant context');
  }
}

/**
 * Get tenant filter for Prisma queries
 */
export function getTenantFilter() {
  const { tenantId, isSuperAdmin } = tenantContext.getContext();
  
  // Super admins can optionally bypass tenant filtering
  if (isSuperAdmin && process.env.ALLOW_SUPERADMIN_BYPASS === 'true') {
    return {};
  }
  
  return { tenantId };
}

/**
 * Validate tenant ownership of a resource
 */
export async function validateTenantOwnership(
  resourceTenantId: string,
  resourceType: string,
  resourceId: string
): Promise<void> {
  const { tenantId, isSuperAdmin } = tenantContext.getContext();
  
  if (isSuperAdmin && process.env.ALLOW_SUPERADMIN_BYPASS === 'true') {
    return;
  }
  
  if (resourceTenantId !== tenantId) {
    logger.warn('Tenant ownership violation detected', {
      resourceType,
      resourceId,
      resourceTenantId,
      requestingTenantId: tenantId,
    });
    throw new Error('Forbidden: Resource belongs to another tenant');
  }
}

/**
 * Create tenant-aware audit log entry
 */
export function createAuditEntry(action: string, details: Record<string, any>) {
  const context = tenantContext.getContextOrNull();
  
  return {
    action,
    tenantId: context?.tenantId || 'SYSTEM',
    userId: context?.userId || 'SYSTEM',
    requestId: context?.requestId || 'unknown',
    timestamp: new Date(),
    details,
  };
}

Prisma Client Enhancement
Enhanced Prisma Client with Automatic Tenant Scoping
typescript// src/lib/prisma.ts

import { PrismaClient, Prisma } from '@prisma/client';
import { tenantContext } from './tenant-context';
import { logger } from './logger';

// Models that require tenant scoping
const TENANT_SCOPED_MODELS = new Set([
  'Task',
  'Service',
  'ServiceRequest',
  'Booking',
  'ComplianceRecord',
  'HealthLog',
  'AuditLog',
  'User',
]);

// Models that allow global queries (e.g., settings with null tenantId)
const ALLOW_GLOBAL_QUERIES = new Set([
  'OrganizationSettings',
  'BookingSettings',
  'IntegrationSettings',
]);

class EnhancedPrismaClient extends PrismaClient {
  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
      ],
    });

    // Log slow queries
    this.$on('query' as never, (e: any) => {
      if (e.duration > 1000) {
        logger.warn('Slow query detected', {
          query: e.query,
          duration: e.duration,
          params: e.params,
        });
      }
    });

    // Set up middleware for automatic tenant scoping
    this.$use(this.tenantScopingMiddleware.bind(this));
  }

  /**
   * Middleware to automatically inject tenant filters
   */
  private async tenantScopingMiddleware(
    params: Prisma.MiddlewareParams,
    next: (params: Prisma.MiddlewareParams) => Promise<any>
  ) {
    const model = params.model;
    const action = params.action;

    // Skip if not a tenant-scoped model
    if (!model || !TENANT_SCOPED_MODELS.has(model)) {
      return next(params);
    }

    // Get tenant context
    const context = tenantContext.getContextOrNull();
    
    // Allow operations without context only for system operations
    if (!context) {
      if (process.env.NODE_ENV === 'production') {
        logger.error('Prisma operation attempted without tenant context', {
          model,
          action,
        });
        throw new Error(
          `Operation on ${model} requires tenant context. This is a security violation.`
        );
      }
      // In development/test, allow for seeding/migrations
      return next(params);
    }

    const { tenantId, isSuperAdmin } = context;
    const allowBypass = isSuperAdmin && process.env.ALLOW_SUPERADMIN_BYPASS === 'true';

    // Inject tenant filter for read operations
    if (
      action === 'findUnique' ||
      action === 'findFirst' ||
      action === 'findMany' ||
      action === 'count' ||
      action === 'aggregate'
    ) {
      if (!allowBypass) {
        params.args = params.args || {};
        params.args.where = params.args.where || {};
        
        // Don't override if tenantId is explicitly set
        if (!('tenantId' in params.args.where)) {
          params.args.where.tenantId = tenantId;
        } else if (params.args.where.tenantId !== tenantId && !allowBypass) {
          // Prevent tenant ID tampering
          logger.warn('Attempt to query different tenant detected', {
            model,
            requestedTenantId: params.args.where.tenantId,
            contextTenantId: tenantId,
          });
          params.args.where.tenantId = tenantId;
        }
      }
    }

    // Inject tenant for write operations
    if (action === 'create') {
      if (!allowBypass) {
        params.args = params.args || {};
        params.args.data = params.args.data || {};
        
        if (!params.args.data.tenantId) {
          params.args.data.tenantId = tenantId;
        } else if (params.args.data.tenantId !== tenantId && !allowBypass) {
          logger.warn('Attempt to create resource for different tenant', {
            model,
            requestedTenantId: params.args.data.tenantId,
            contextTenantId: tenantId,
          });
          throw new Error('Cannot create resources for other tenants');
        }
      }
    }

    // Scope update/delete operations
    if (action === 'update' || action === 'updateMany' || action === 'delete' || action === 'deleteMany') {
      if (!allowBypass) {
        params.args = params.args || {};
        params.args.where = params.args.where || {};
        
        if (!('tenantId' in params.args.where)) {
          params.args.where.tenantId = tenantId;
        } else if (params.args.where.tenantId !== tenantId && !allowBypass) {
          throw new Error('Cannot modify resources of other tenants');
        }
      }
    }

    return next(params);
  }

  /**
   * Execute raw query with tenant context
   */
  async $executeRawWithTenant<T = unknown>(
    query: TemplateStringsArray | Prisma.Sql,
    ...values: any[]
  ): Promise<number> {
    const context = tenantContext.getContext();
    
    // Set session variable for RLS
    await this.$executeRawUnsafe(
      `SET LOCAL app.current_tenant_id = '${context.tenantId}'`
    );
    await this.$executeRawUnsafe(
      `SET LOCAL app.is_superadmin = '${context.isSuperAdmin}'`
    );
    
    return this.$executeRaw(query, ...values);
  }

  /**
   * Execute query with tenant context
   */
  async $queryRawWithTenant<T = unknown>(
    query: TemplateStringsArray | Prisma.Sql,
    ...values: any[]
  ): Promise<T> {
    const context = tenantContext.getContext();
    
    // Set session variable for RLS
    await this.$executeRawUnsafe(
      `SET LOCAL app.current_tenant_id = '${context.tenantId}'`
    );
    await this.$executeRawUnsafe(
      `SET LOCAL app.is_superadmin = '${context.isSuperAdmin}'`
    );
    
    return this.$queryRaw(query, ...values);
  }
}

export const prisma = new EnhancedPrismaClient();

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
Tenant-Scoped Repository Pattern
typescript// src/repositories/base.repository.ts

import { prisma } from '@/lib/prisma';
import { tenantContext } from '@/lib/tenant-context';
import { Prisma } from '@prisma/client';

export abstract class TenantScopedRepository<T> {
  protected abstract modelName: Prisma.ModelName;

  protected getTenantFilter() {
    const { tenantId } = tenantContext.getContext();RetryAEContinueEdittypescript    return { tenantId };
  }

  /**
   * Find by ID with automatic tenant scoping
   */
  async findById(id: string): Promise<T | null> {
    const filter = this.getTenantFilter();
    return (prisma[this.modelName as any] as any).findFirst({
      where: { id, ...filter },
    });
  }

  /**
   * Find by ID or throw
   */
  async findByIdOrThrow(id: string): Promise<T> {
    const result = await this.findById(id);
    if (!result) {
      throw new Error(`${this.modelName} with id ${id} not found`);
    }
    return result;
  }

  /**
   * Find many with tenant filter
   */
  async findMany(where?: any, options?: any): Promise<T[]> {
    const filter = this.getTenantFilter();
    return (prisma[this.modelName as any] as any).findMany({
      where: { ...where, ...filter },
      ...options,
    });
  }

  /**
   * Create with automatic tenant assignment
   */
  async create(data: any): Promise<T> {
    const { tenantId } = tenantContext.getContext();
    return (prisma[this.modelName as any] as any).create({
      data: { ...data, tenantId },
    });
  }

  /**
   * Update with tenant validation
   */
  async update(id: string, data: any): Promise<T> {
    const filter = this.getTenantFilter();
    return (prisma[this.modelName as any] as any).updateMany({
      where: { id, ...filter },
      data,
    });
  }

  /**
   * Delete with tenant validation
   */
  async delete(id: string): Promise<void> {
    const filter = this.getTenantFilter();
    await (prisma[this.modelName as any] as any).deleteMany({
      where: { id, ...filter },
    });
  }

  /**
   * Count with tenant filter
   */
  async count(where?: any): Promise<number> {
    const filter = this.getTenantFilter();
    return (prisma[this.modelName as any] as any).count({
      where: { ...where, ...filter },
    });
  }

  /**
   * Check existence
   */
  async exists(where: any): Promise<boolean> {
    const count = await this.count(where);
    return count > 0;
  }
}
Concrete Repository Examples
typescript// src/repositories/task.repository.ts

import { Task, Prisma } from '@prisma/client';
import { TenantScopedRepository } from './base.repository';
import { prisma } from '@/lib/prisma';

export class TaskRepository extends TenantScopedRepository<Task> {
  protected modelName = Prisma.ModelName.Task;

  /**
   * Find tasks by status with tenant scoping
   */
  async findByStatus(status: string, options?: { skip?: number; take?: number }) {
    return this.findMany({ status }, options);
  }

  /**
   * Find tasks assigned to user
   */
  async findByAssignee(assigneeId: string) {
    return this.findMany({ assigneeId });
  }

  /**
   * Get task analytics for current tenant
   */
  async getAnalytics() {
    const filter = this.getTenantFilter();
    
    const [total, completed, pending, inProgress] = await Promise.all([
      prisma.task.count({ where: filter }),
      prisma.task.count({ where: { ...filter, status: 'COMPLETED' } }),
      prisma.task.count({ where: { ...filter, status: 'PENDING' } }),
      prisma.task.count({ where: { ...filter, status: 'IN_PROGRESS' } }),
    ]);

    return { total, completed, pending, inProgress };
  }

  /**
   * Bulk update tasks
   */
  async bulkUpdateStatus(taskIds: string[], status: string) {
    const filter = this.getTenantFilter();
    
    return prisma.task.updateMany({
      where: {
        id: { in: taskIds },
        ...filter,
      },
      data: { status, updatedAt: new Date() },
    });
  }
}

export const taskRepository = new TaskRepository();
typescript// src/repositories/service.repository.ts

import { Service, Prisma } from '@prisma/client';
import { TenantScopedRepository } from './base.repository';
import { prisma } from '@/lib/prisma';

export class ServiceRepository extends TenantScopedRepository<Service> {
  protected modelName = Prisma.ModelName.Service;

  /**
   * Find service by slug
   */
  async findBySlug(slug: string) {
    const filter = this.getTenantFilter();
    return prisma.service.findFirst({
      where: { slug, ...filter },
      include: {
        bookings: true,
        requests: true,
      },
    });
  }

  /**
   * Find active services
   */
  async findActive() {
    return this.findMany({ isActive: true });
  }

  /**
   * Create service with slug uniqueness check
   */
  async createService(data: Omit<Service, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>) {
    const existing = await this.findBySlug(data.slug);
    if (existing) {
      throw new Error(`Service with slug '${data.slug}' already exists`);
    }
    return this.create(data);
  }
}

export const serviceRepository = new ServiceRepository();

Middleware & Request Pipeline
Enhanced Middleware with Automatic Tenant Context
typescript// src/middleware.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { tenantContext, TenantContext } from '@/lib/tenant-context';
import { logger } from '@/lib/logger';
import { nanoid } from 'nanoid';

const PUBLIC_ROUTES = ['/login', '/register', '/api/health', '/api/auth'];
const STATIC_EXTENSIONS = ['.css', '.js', '.ico', '.png', '.jpg', '.svg', '.woff', '.woff2'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestId = nanoid();

  // Skip static files
  if (STATIC_EXTENSIONS.some(ext => pathname.endsWith(ext))) {
    return NextResponse.next();
  }

  // Skip public routes
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  try {
    // Get authenticated session
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      return redirectToLogin(request);
    }

    // Extract tenant information from token
    const tenantId = token.tenantId as string;
    const tenantSlug = token.tenantSlug as string;
    const userId = token.userId as string;
    const role = token.role as string;
    const tenantRole = token.tenantRole as string;

    if (!tenantId || !tenantSlug) {
      logger.error('Token missing tenant information', { userId, pathname });
      return redirectToLogin(request);
    }

    // Validate incoming tenant header (if present)
    const incomingTenantHeader = request.headers.get('x-tenant-id');
    if (incomingTenantHeader && incomingTenantHeader !== tenantId) {
      logger.warn('Tenant header mismatch detected', {
        userId,
        sessionTenant: tenantId,
        headerTenant: incomingTenantHeader,
        pathname,
        requestId,
      });

      // Reject mismatched tenant attempts
      return new NextResponse(
        JSON.stringify({
          error: 'Forbidden',
          message: 'Tenant mismatch detected',
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate subdomain (if using subdomain routing)
    const hostname = request.headers.get('host') || '';
    const subdomain = extractSubdomain(hostname);
    
    if (subdomain && subdomain !== tenantSlug && subdomain !== 'www') {
      logger.warn('Subdomain mismatch detected', {
        userId,
        sessionTenantSlug: tenantSlug,
        subdomain,
        pathname,
        requestId,
      });

      return new NextResponse(
        JSON.stringify({
          error: 'Forbidden',
          message: 'Subdomain does not match authenticated tenant',
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Create tenant context
    const context: TenantContext = {
      tenantId,
      tenantSlug,
      userId,
      role,
      tenantRole,
      isSuperAdmin: role === 'SUPER_ADMIN',
      requestId,
      timestamp: new Date(),
    };

    // Create response with injected headers
    const response = NextResponse.next();
    
    // Set verified tenant headers (server-side only)
    response.headers.set('x-tenant-id', tenantId);
    response.headers.set('x-tenant-slug', tenantSlug);
    response.headers.set('x-user-id', userId);
    response.headers.set('x-request-id', requestId);

    // Set signed tenant cookie for additional verification
    const signedTenantCookie = await signTenantCookie(tenantId, userId);
    response.cookies.set('tenant_sig', signedTenantCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    // Log request
    logger.info('Request processed', {
      requestId,
      userId,
      tenantId,
      pathname,
      method: request.method,
    });

    return response;
  } catch (error) {
    logger.error('Middleware error', {
      error,
      pathname,
      requestId,
    });

    return new NextResponse(
      JSON.stringify({
        error: 'Internal Server Error',
        message: 'Failed to process request',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Extract subdomain from hostname
 */
function extractSubdomain(hostname: string): string | null {
  const parts = hostname.split('.');
  
  // localhost or IP address
  if (parts.length < 3 || hostname === 'localhost') {
    return null;
  }

  // Extract subdomain (first part)
  return parts[0];
}

/**
 * Redirect to login page
 */
function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('callbackUrl', request.url);
  return NextResponse.redirect(loginUrl);
}

/**
 * Sign tenant cookie with HMAC
 */
async function signTenantCookie(tenantId: string, userId: string): Promise<string> {
  const crypto = require('crypto');
  const secret = process.env.NEXTAUTH_SECRET || '';
  const payload = `${tenantId}:${userId}:${Date.now()}`;
  
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  
  return `${payload}.${hmac.digest('hex')}`;
}

/**
 * Verify signed tenant cookie
 */
export async function verifyTenantCookie(
  signedCookie: string,
  expectedTenantId: string,
  expectedUserId: string
): Promise<boolean> {
  try {
    const [payload, signature] = signedCookie.split('.');
    const [tenantId, userId, timestamp] = payload.split(':');
    
    // Verify tenant and user match
    if (tenantId !== expectedTenantId || userId !== expectedUserId) {
      return false;
    }

    // Verify signature
    const crypto = require('crypto');
    const secret = process.env.NEXTAUTH_SECRET || '';
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    const expectedSignature = hmac.digest('hex');
    
    if (signature !== expectedSignature) {
      return false;
    }

    // Verify not expired (24 hours)
    const age = Date.now() - parseInt(timestamp);
    if (age > 24 * 60 * 60 * 1000) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/portal/:path*',
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
API Route Wrapper with Tenant Context
typescript// src/lib/api-wrapper.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { tenantContext, TenantContext } from '@/lib/tenant-context';
import { logger } from '@/lib/logger';
import { verifyTenantCookie } from '@/middleware';

export type ApiHandler<T = any> = (
  request: NextRequest,
  context: { params: any }
) => Promise<NextResponse<T>>;

export interface ApiWrapperOptions {
  requireAuth?: boolean;
  requireSuperAdmin?: boolean;
  requireTenantAdmin?: boolean;
  allowedRoles?: string[];
}

/**
 * Wrap API route handlers with automatic tenant context
 */
export function withTenantContext(
  handler: ApiHandler,
  options: ApiWrapperOptions = {}
) {
  return async (request: NextRequest, routeContext: { params: any }) => {
    const {
      requireAuth = true,
      requireSuperAdmin = false,
      requireTenantAdmin = false,
      allowedRoles = [],
    } = options;

    try {
      // Get session
      const session = await getServerSession(authOptions);

      if (requireAuth && !session) {
        return NextResponse.json(
          { error: 'Unauthorized', message: 'Authentication required' },
          { status: 401 }
        );
      }

      if (!session) {
        // Allow unauthenticated requests if not required
        return handler(request, routeContext);
      }

      const { user } = session;

      // Verify tenant cookie signature
      const tenantCookie = request.cookies.get('tenant_sig')?.value;
      if (tenantCookie) {
        const isValid = await verifyTenantCookie(
          tenantCookie,
          user.tenantId,
          user.id
        );
        
        if (!isValid) {
          logger.error('Invalid tenant cookie signature', {
            userId: user.id,
            tenantId: user.tenantId,
          });
          
          return NextResponse.json(
            { error: 'Forbidden', message: 'Invalid tenant signature' },
            { status: 403 }
          );
        }
      }

      // Check super admin requirement
      if (requireSuperAdmin && user.role !== 'SUPER_ADMIN') {
        return NextResponse.json(
          { error: 'Forbidden', message: 'Super admin access required' },
          { status: 403 }
        );
      }

      // Check tenant admin requirement
      if (requireTenantAdmin && !['OWNER', 'ADMIN'].includes(user.tenantRole)) {
        return NextResponse.json(
          { error: 'Forbidden', message: 'Tenant admin access required' },
          { status: 403 }
        );
      }

      // Check allowed roles
      if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        return NextResponse.json(
          { error: 'Forbidden', message: 'Insufficient permissions' },
          { status: 403 }
        );
      }

      // Create tenant context
      const context: TenantContext = {
        tenantId: user.tenantId,
        tenantSlug: user.tenantSlug,
        userId: user.id,
        role: user.role,
        tenantRole: user.tenantRole,
        isSuperAdmin: user.role === 'SUPER_ADMIN',
        requestId: request.headers.get('x-request-id') || 'unknown',
        timestamp: new Date(),
      };

      // Run handler with context
      return await tenantContext.run(context, () =>
        handler(request, routeContext)
      );
    } catch (error) {
      logger.error('API wrapper error', { error });
      
      return NextResponse.json(
        { error: 'Internal Server Error', message: 'Failed to process request' },
        { status: 500 }
      );
    }
  };
}

API Layer Transformation
Refactored Task API Routes
typescript// src/app/api/admin/tasks/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { withTenantContext } from '@/lib/api-wrapper';
import { taskRepository } from '@/repositories/task.repository';
import { validateTenantOwnership } from '@/lib/tenant-utils';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const updateTaskSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  assigneeId: z.string().optional(),
});

/**
 * GET /api/admin/tasks/[id]
 * Retrieve a single task with automatic tenant scoping
 */
export const GET = withTenantContext(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const task = await taskRepository.findById(params.id);

      if (!task) {
        return NextResponse.json(
          { error: 'Not Found', message: 'Task not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ task });
    } catch (error) {
      logger.error('Failed to fetch task', { error, taskId: params.id });
      
      return NextResponse.json(
        { error: 'Internal Server Error', message: 'Failed to fetch task' },
        { status: 500 }
      );
    }
  },
  { requireAuth: true, allowedRoles: ['ADMIN', 'STAFF', 'SUPER_ADMIN'] }
);

/**
 * PATCH /api/admin/tasks/[id]
 * Update a task with tenant validation
 */
export const PATCH = withTenantContext(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const body = await request.json();
      const validatedData = updateTaskSchema.parse(body);

      // Fetch existing task to validate ownership
      const existingTask = await taskRepository.findById(params.id);

      if (!existingTask) {
        return NextResponse.json(
          { error: 'Not Found', message: 'Task not found' },
          { status: 404 }
        );
      }

      // Update task (repository automatically scopes to tenant)
      const updatedTask = await taskRepository.update(params.id, validatedData);

      logger.info('Task updated', {
        taskId: params.id,
        changes: validatedData,
      });

      return NextResponse.json({ task: updatedTask });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation Error', details: error.errors },
          { status: 400 }
        );
      }

      logger.error('Failed to update task', { error, taskId: params.id });
      
      return NextResponse.json(
        { error: 'Internal Server Error', message: 'Failed to update task' },
        { status: 500 }
      );
    }
  },
  { requireAuth: true, allowedRoles: ['ADMIN', 'STAFF', 'SUPER_ADMIN'] }
);

/**
 * DELETE /api/admin/tasks/[id]
 * Delete a task with tenant validation
 */
export const DELETE = withTenantContext(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      // Verify task exists and belongs to tenant
      const task = await taskRepository.findById(params.id);

      if (!task) {
        return NextResponse.json(
          { error: 'Not Found', message: 'Task not found' },
          { status: 404 }
        );
      }

      await taskRepository.delete(params.id);

      logger.info('Task deleted', { taskId: params.id });

      return NextResponse.json({ success: true });
    } catch (error) {
      logger.error('Failed to delete task', { error, taskId: params.id });
      
      return NextResponse.json(
        { error: 'Internal Server Error', message: 'Failed to delete task' },
        { status: 500 }
      );
    }
  },
  { requireAuth: true, requireTenantAdmin: true }
);
typescript// src/app/api/admin/tasks/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { withTenantContext } from '@/lib/api-wrapper';
import { taskRepository } from '@/repositories/task.repository';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const createTaskSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).default('PENDING'),
  assigneeId: z.string().optional(),
});

const querySchema = z.object({
  status: z.string().optional(),
  assigneeId: z.string().optional(),
  skip: z.coerce.number().min(0).default(0),
  take: z.coerce.number().min(1).max(100).default(20),
});

/**
 * GET /api/admin/tasks
 * List tasks with automatic tenant scoping
 */
export const GET = withTenantContext(
  async (request: NextRequest) => {
    try {
      const { searchParams } = new URL(request.url);
      const query = querySchema.parse(Object.fromEntries(searchParams));

      const where: any = {};
      if (query.status) where.status = query.status;
      if (query.assigneeId) where.assigneeId = query.assigneeId;

      const [tasks, total] = await Promise.all([
        taskRepository.findMany(where, {
          skip: query.skip,
          take: query.take,
          orderBy: { createdAt: 'desc' },
          include: {
            assignee: {
              select: { id: true, email: true },
            },
          },
        }),
        taskRepository.count(where),
      ]);

      return NextResponse.json({
        tasks,
        pagination: {
          total,
          skip: query.skip,
          take: query.take,
          hasMore: query.skip + query.take < total,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation Error', details: error.errors },
          { status: 400 }
        );
      }

      logger.error('Failed to fetch tasks', { error });
      
      return NextResponse.json(
        { error: 'Internal Server Error', message: 'Failed to fetch tasks' },
        { status: 500 }
      );
    }
  },
  { requireAuth: true }
);

/**
 * POST /api/admin/tasks
 * Create a new task with automatic tenant assignment
 */
export const POST = withTenantContext(
  async (request: NextRequest) => {
    try {
      const body = await request.json();
      const validatedData = createTaskSchema.parse(body);

      // Repository automatically assigns tenantId from context
      const task = await taskRepository.create(validatedData);

      logger.info('Task created', { taskId: task.id });

      return NextResponse.json({ task }, { status: 201 });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation Error', details: error.errors },
          { status: 400 }
        );
      }

      logger.error('Failed to create task', { error });
      
      return NextResponse.json(
        { error: 'Internal Server Error', message: 'Failed to create task' },
        { status: 500 }
      );
    }
  },
  { requireAuth: true, allowedRoles: ['ADMIN', 'STAFF', 'SUPER_ADMIN'] }
);
Refactored Analytics API
typescript// src/app/api/admin/tasks/analytics/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { withTenantContext } from '@/lib/api-wrapper';
import { taskRepository } from '@/repositories/task.repository';
import { prisma } from '@/lib/prisma';
import { getTenantFilter } from '@/lib/tenant-utils';
import { logger } from '@/lib/logger';

/**
 * GET /api/admin/tasks/analytics
 * Get task analytics scoped to current tenant
 */
export const GET = withTenantContext(
  async (request: NextRequest) => {
    try {
      const tenantFilter = getTenantFilter();

      // Get task analytics
      const taskAnalytics = await taskRepository.getAnalytics();

      // Get compliance analytics (now tenant-scoped)
      const [
        complianceTotal,
        complianceCompleted,
        compliancePending,
      ] = await Promise.all([
        prisma.complianceRecord.count({ where: tenantFilter }),
        prisma.complianceRecord.count({
          where: { ...tenantFilter, status: 'COMPLETED' },
        }),
        prisma.complianceRecord.count({
          where: { ...tenantFilter, status: 'PENDING' },
        }),
      ]);

      // Get time-series data (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const taskTrends = await prisma.task.groupBy({
        by: ['status'],
        where: {
          ...tenantFilter,
          createdAt: { gte: thirtyDaysAgo },
        },
        _count: true,
      });

      return NextResponse.json({
        tasks: taskAnalytics,
        compliance: {
          total: complianceTotal,
          completed: complianceCompleted,
          pending: compliancePending,
        },
        trends: taskTrends,
      });
    } catch (error) {
      logger.error('Failed to fetch analytics', { error });
      
      return NextResponse.json(
        { error: 'Internal Server Error', message: 'Failed to fetch analytics' },
        { status: 500 }
      );
    }
  },
  { requireAuth: true, allowedRoles: ['ADMIN', 'SUPER_ADMIN'] }
);

Migration Strategy
Phase-Based Rollout Plan
markdown# Migration Execution Plan

## Phase 0: Pre-Migration (Week 1)
- [ ] Create full database backup
- [ ] Set up staging environment matching production
- [ ] Deploy code changes to staging
- [ ] Run all migration scripts on staging
- [ ] Perform comprehensive testing on staging
- [ ] Document rollback procedures

## Phase 1: Schema Changes (Week 2)
- [ ] Deploy migration 001: Add tenant columns
- [ ] Deploy migration 002: Backfill tenant data
- [ ] Verify data integrity
- [ ] Monitor database performance
- [ ] Create indexes for new columns

## Phase 2: Constraints & Security (Week 3)
- [ ] Deploy migration 003: Compound constraints
- [ ] Deploy migration 004: Singleton constraints
- [ ] Deploy migration 005: Row-level security
- [ ] Test RLS policies
- [ ] Verify no cross-tenant leaks

## Phase 3: Application Layer (Week 4)
- [ ] Deploy enhanced Prisma client
- [ ] Deploy middleware changes
- [ ] Deploy API wrapper
- [ ] Update all API routes
- [ ] Deploy repository pattern

## Phase 4: Testing & Validation (Week 5)
- [ ] Run integration test suite
- [ ] Perform penetration testing
- [ ] Load testing with tenant isolation
- [ ] Security audit
- [ ] Performance benchmarking

## Phase 5: Production Deployment (Week 6)
- [ ] Deploy to production during maintenance window
- [ ] Monitor logs for errors
- [ ] Validate tenant isolation
- [ ] Check performance metrics
- [ ] User acceptance testing
Migration Scripts
typescript// scripts/migrate-tenant-system.ts

import { PrismaClient } from '@prisma/client';
import { logger } from '../src/lib/logger';

const prisma = new PrismaClient();

async function migrateTenantSystem() {
  logger.info('Starting tenant system migration');

  try {
    // Step 1: Create default tenant if none exists
    let defaultTenant = await prisma.tenant.findFirst({
      where: { isDefault: true },
    });

    if (!defaultTenant) {
      logger.info('Creating default tenant');
      defaultTenant = await prisma.tenant.create({
        data: {
          slug: 'default',
          name: 'Default Organization',
          isDefault: true,
          isActive: true,
        },
      });
    }

    // Step 2: Backfill tasks through assignee relationships
    logger.info('Backfilling task tenant IDs');
    const tasksWithoutTenant = await prisma.task.findMany({
      where: { tenantId: 'SYSTEM' },
      include: { assignee: true },
    });

    for (const task of tasksWithoutTenant) {
      const tenantId = task.assignee?.tenantId || defaultTenant.id;
      await prisma.task.update({
        where: { id: task.id },
        data: { tenantId },
      });
    }
    logger.info(`Backfilled ${tasksWithoutTenant.length} tasks`);

    // Step 3: Backfill compliance records
    logger.info('Backfilling compliance record tenant IDs');
    await prisma.$executeRaw`
      UPDATE "ComplianceRecord"
      SET "tenantId" = ${defaultTenant.id}
      WHERE "tenantId" = 'SYSTEM'
    `;

    // Step 4: Backfill health logs
    logger.info('Backfilling health log tenant IDs');
    await prisma.$executeRaw`
      UPDATE "HealthLog"
      SET "tenantId" = ${defaultTenant.id}
      WHERE "tenantId" = 'SYSTEM'RetryAEContinueEdittypescript    `;

    // Step 5: Backfill audit logs
    logger.info('Backfilling audit log tenant IDs');
    await prisma.$executeRaw`
      UPDATE "AuditLog"
      SET "tenantId" = ${defaultTenant.id}
      WHERE "tenantId" = 'SYSTEM'
    `;

    // Step 6: Create tenant memberships for existing users
    logger.info('Creating tenant memberships for existing users');
    const usersWithoutMembership = await prisma.user.findMany({
      where: {
        tenantMemberships: { none: {} },
      },
    });

    for (const user of usersWithoutMembership) {
      await prisma.tenantMembership.create({
        data: {
          userId: user.id,
          tenantId: user.tenantId,
          role: user.role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
          isDefault: true,
        },
      });
    }
    logger.info(`Created memberships for ${usersWithoutMembership.length} users`);

    // Step 7: Validate data integrity
    logger.info('Validating data integrity');
    const orphanedTasks = await prisma.task.count({
      where: { tenantId: 'SYSTEM' },
    });

    if (orphanedTasks > 0) {
      throw new Error(`Found ${orphanedTasks} orphaned tasks after migration`);
    }

    // Step 8: Create indexes
    logger.info('Creating performance indexes');
    await prisma.$executeRaw`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_task_tenant_status" 
      ON "Task"("tenantId", "status")
    `;

    logger.info('Tenant system migration completed successfully');
  } catch (error) {
    logger.error('Migration failed', { error });
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateTenantSystem()
  .then(() => {
    console.log('Migration completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
Rollback Script
typescript// scripts/rollback-tenant-migration.ts

import { PrismaClient } from '@prisma/client';
import { logger } from '../src/lib/logger';

const prisma = new PrismaClient();

async function rollbackTenantMigration() {
  logger.warn('Starting tenant system rollback');

  try {
    // Step 1: Drop RLS policies
    logger.info('Dropping RLS policies');
    await prisma.$executeRaw`
      DROP POLICY IF EXISTS "tenant_isolation_policy" ON "Task";
      DROP POLICY IF EXISTS "tenant_isolation_policy" ON "Service";
      DROP POLICY IF EXISTS "tenant_isolation_policy" ON "ServiceRequest";
      DROP POLICY IF EXISTS "superadmin_bypass" ON "Task";
      ALTER TABLE "Task" DISABLE ROW LEVEL SECURITY;
      ALTER TABLE "Service" DISABLE ROW LEVEL SECURITY;
      ALTER TABLE "ServiceRequest" DISABLE ROW LEVEL SECURITY;
    `;

    // Step 2: Drop compound constraints
    logger.info('Dropping compound constraints');
    await prisma.$executeRaw`
      ALTER TABLE "Booking" DROP CONSTRAINT IF EXISTS "fk_booking_service_tenant";
      ALTER TABLE "ServiceRequest" DROP CONSTRAINT IF EXISTS "fk_request_service_tenant";
      ALTER TABLE "Task" DROP CONSTRAINT IF EXISTS "chk_task_assignee_tenant";
    `;

    // Step 3: Restore original unique constraints
    logger.info('Restoring original constraints');
    await prisma.$executeRaw`
      ALTER TABLE "Service" DROP CONSTRAINT IF EXISTS "uq_service_tenant_slug";
      ALTER TABLE "Service" ADD CONSTRAINT "Service_slug_key" UNIQUE ("slug");
      
      ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "uq_user_tenant_email";
      ALTER TABLE "User" ADD CONSTRAINT "User_email_key" UNIQUE ("email");
    `;

    // Step 4: Drop partial unique indexes
    logger.info('Dropping partial unique indexes');
    await prisma.$executeRaw`
      DROP INDEX IF EXISTS "idx_organization_settings_global_unique";
      DROP INDEX IF EXISTS "idx_booking_settings_global_unique";
      DROP INDEX IF EXISTS "idx_integration_settings_global_unique";
    `;

    // Step 5: Remove foreign key constraints
    logger.info('Removing foreign key constraints');
    await prisma.$executeRaw`
      ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "fk_user_tenant";
      ALTER TABLE "Task" DROP CONSTRAINT IF EXISTS "fk_task_tenant";
    `;

    // Step 6: Drop tenant indexes
    logger.info('Dropping tenant indexes');
    await prisma.$executeRaw`
      DROP INDEX IF EXISTS "idx_user_tenant";
      DROP INDEX IF EXISTS "idx_task_tenant";
      DROP INDEX IF EXISTS "idx_task_tenant_status";
      DROP INDEX IF EXISTS "idx_compliance_tenant";
      DROP INDEX IF EXISTS "idx_healthlog_tenant";
      DROP INDEX IF EXISTS "idx_auditlog_tenant";
    `;

    // Step 7: Reset tenant columns to SYSTEM
    logger.info('Resetting tenant columns');
    await prisma.$executeRaw`
      UPDATE "Task" SET "tenantId" = 'SYSTEM';
      UPDATE "ComplianceRecord" SET "tenantId" = 'SYSTEM';
      UPDATE "HealthLog" SET "tenantId" = 'SYSTEM';
      UPDATE "AuditLog" SET "tenantId" = 'SYSTEM';
    `;

    logger.warn('Tenant system rollback completed');
  } catch (error) {
    logger.error('Rollback failed', { error });
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run rollback
rollbackTenantMigration()
  .then(() => {
    console.log('Rollback completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Rollback failed:', error);
    process.exit(1);
  });

Testing Framework
Integration Tests for Tenant Isolation
typescript// tests/integration/tenant-isolation.test.ts

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { tenantContext } from '@/lib/tenant-context';
import { taskRepository } from '@/repositories/task.repository';

const prisma = new PrismaClient();

describe('Tenant Isolation', () => {
  let tenant1Id: string;
  let tenant2Id: string;
  let user1Id: string;
  let user2Id: string;
  let task1Id: string;
  let task2Id: string;

  beforeAll(async () => {
    // Create test tenants
    const tenant1 = await prisma.tenant.create({
      data: { slug: 'test-tenant-1', name: 'Test Tenant 1' },
    });
    tenant1Id = tenant1.id;

    const tenant2 = await prisma.tenant.create({
      data: { slug: 'test-tenant-2', name: 'Test Tenant 2' },
    });
    tenant2Id = tenant2.id;

    // Create test users
    const user1 = await prisma.user.create({
      data: {
        email: 'user1@test.com',
        tenantId: tenant1Id,
        role: 'ADMIN',
      },
    });
    user1Id = user1.id;

    const user2 = await prisma.user.create({
      data: {
        email: 'user2@test.com',
        tenantId: tenant2Id,
        role: 'ADMIN',
      },
    });
    user2Id = user2.id;

    // Create test tasks
    const task1 = await prisma.task.create({
      data: {
        title: 'Task for Tenant 1',
        tenantId: tenant1Id,
        status: 'PENDING',
      },
    });
    task1Id = task1.id;

    const task2 = await prisma.task.create({
      data: {
        title: 'Task for Tenant 2',
        tenantId: tenant2Id,
        status: 'PENDING',
      },
    });
    task2Id = task2.id;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.task.deleteMany({
      where: { tenantId: { in: [tenant1Id, tenant2Id] } },
    });
    await prisma.user.deleteMany({
      where: { tenantId: { in: [tenant1Id, tenant2Id] } },
    });
    await prisma.tenant.deleteMany({
      where: { id: { in: [tenant1Id, tenant2Id] } },
    });
    await prisma.$disconnect();
  });

  describe('Repository-level isolation', () => {
    it('should only return tasks for tenant 1 when context is set to tenant 1', async () => {
      const context = {
        tenantId: tenant1Id,
        tenantSlug: 'test-tenant-1',
        userId: user1Id,
        role: 'ADMIN',
        tenantRole: 'ADMIN',
        isSuperAdmin: false,
        requestId: 'test-1',
        timestamp: new Date(),
      };

      const tasks = await tenantContext.run(context, () =>
        taskRepository.findMany()
      );

      expect(tasks).toHaveLength(1);
      expect(tasks[0].id).toBe(task1Id);
      expect(tasks[0].tenantId).toBe(tenant1Id);
    });

    it('should only return tasks for tenant 2 when context is set to tenant 2', async () => {
      const context = {
        tenantId: tenant2Id,
        tenantSlug: 'test-tenant-2',
        userId: user2Id,
        role: 'ADMIN',
        tenantRole: 'ADMIN',
        isSuperAdmin: false,
        requestId: 'test-2',
        timestamp: new Date(),
      };

      const tasks = await tenantContext.run(context, () =>
        taskRepository.findMany()
      );

      expect(tasks).toHaveLength(1);
      expect(tasks[0].id).toBe(task2Id);
      expect(tasks[0].tenantId).toBe(tenant2Id);
    });

    it('should not find task from different tenant by ID', async () => {
      const context = {
        tenantId: tenant1Id,
        tenantSlug: 'test-tenant-1',
        userId: user1Id,
        role: 'ADMIN',
        tenantRole: 'ADMIN',
        isSuperAdmin: false,
        requestId: 'test-3',
        timestamp: new Date(),
      };

      const task = await tenantContext.run(context, () =>
        taskRepository.findById(task2Id) // Try to find tenant 2's task
      );

      expect(task).toBeNull();
    });

    it('should throw error when trying to create task without context', async () => {
      await expect(async () => {
        await taskRepository.create({
          title: 'Unauthorized task',
          status: 'PENDING',
        });
      }).rejects.toThrow();
    });

    it('should automatically assign tenant when creating task with context', async () => {
      const context = {
        tenantId: tenant1Id,
        tenantSlug: 'test-tenant-1',
        userId: user1Id,
        role: 'ADMIN',
        tenantRole: 'ADMIN',
        isSuperAdmin: false,
        requestId: 'test-4',
        timestamp: new Date(),
      };

      const task = await tenantContext.run(context, () =>
        taskRepository.create({
          title: 'Auto-assigned task',
          status: 'PENDING',
        })
      );

      expect(task.tenantId).toBe(tenant1Id);

      // Cleanup
      await prisma.task.delete({ where: { id: task.id } });
    });
  });

  describe('Prisma middleware isolation', () => {
    it('should inject tenant filter in findMany operations', async () => {
      const context = {
        tenantId: tenant1Id,
        tenantSlug: 'test-tenant-1',
        userId: user1Id,
        role: 'ADMIN',
        tenantRole: 'ADMIN',
        isSuperAdmin: false,
        requestId: 'test-5',
        timestamp: new Date(),
      };

      const tasks = await tenantContext.run(context, () =>
        prisma.task.findMany()
      );

      // Should only find tenant 1's task
      expect(tasks.every(t => t.tenantId === tenant1Id)).toBe(true);
    });

    it('should inject tenant filter in count operations', async () => {
      const context = {
        tenantId: tenant1Id,
        tenantSlug: 'test-tenant-1',
        userId: user1Id,
        role: 'ADMIN',
        tenantRole: 'ADMIN',
        isSuperAdmin: false,
        requestId: 'test-6',
        timestamp: new Date(),
      };

      const count = await tenantContext.run(context, () =>
        prisma.task.count()
      );

      expect(count).toBe(1); // Only tenant 1's task
    });

    it('should prevent updating tasks from other tenants', async () => {
      const context = {
        tenantId: tenant1Id,
        tenantSlug: 'test-tenant-1',
        userId: user1Id,
        role: 'ADMIN',
        tenantRole: 'ADMIN',
        isSuperAdmin: false,
        requestId: 'test-7',
        timestamp: new Date(),
      };

      await tenantContext.run(context, async () => {
        const result = await prisma.task.updateMany({
          where: { id: task2Id }, // Try to update tenant 2's task
          data: { title: 'Hacked' },
        });

        expect(result.count).toBe(0); // Should not update
      });

      // Verify task was not modified
      const task = await prisma.task.findUnique({ where: { id: task2Id } });
      expect(task?.title).not.toBe('Hacked');
    });
  });

  describe('Cross-tenant attack prevention', () => {
    it('should reject forged tenant ID in query', async () => {
      const context = {
        tenantId: tenant1Id,
        tenantSlug: 'test-tenant-1',
        userId: user1Id,
        role: 'ADMIN',
        tenantRole: 'ADMIN',
        isSuperAdmin: false,
        requestId: 'test-8',
        timestamp: new Date(),
      };

      const tasks = await tenantContext.run(context, () =>
        prisma.task.findMany({
          where: { tenantId: tenant2Id }, // Try to forge tenant ID
        })
      );

      // Middleware should override forged tenant ID
      expect(tasks.every(t => t.tenantId === tenant1Id)).toBe(true);
    });

    it('should prevent creating resource for another tenant', async () => {
      const context = {
        tenantId: tenant1Id,
        tenantSlug: 'test-tenant-1',
        userId: user1Id,
        role: 'ADMIN',
        tenantRole: 'ADMIN',
        isSuperAdmin: false,
        requestId: 'test-9',
        timestamp: new Date(),
      };

      await expect(async () => {
        await tenantContext.run(context, () =>
          prisma.task.create({
            data: {
              title: 'Malicious task',
              status: 'PENDING',
              tenantId: tenant2Id, // Try to create for tenant 2
            },
          })
        );
      }).rejects.toThrow();
    });
  });

  describe('Super admin bypass', () => {
    it('should allow super admin to access all tenants when bypass enabled', async () => {
      process.env.ALLOW_SUPERADMIN_BYPASS = 'true';

      const context = {
        tenantId: tenant1Id,
        tenantSlug: 'test-tenant-1',
        userId: user1Id,
        role: 'SUPER_ADMIN',
        tenantRole: 'OWNER',
        isSuperAdmin: true,
        requestId: 'test-10',
        timestamp: new Date(),
      };

      const tasks = await tenantContext.run(context, () =>
        prisma.task.findMany()
      );

      // Super admin should see tasks from all tenants
      expect(tasks.length).toBeGreaterThanOrEqual(2);

      delete process.env.ALLOW_SUPERADMIN_BYPASS;
    });

    it('should enforce tenant isolation for super admin when bypass disabled', async () => {
      const context = {
        tenantId: tenant1Id,
        tenantSlug: 'test-tenant-1',
        userId: user1Id,
        role: 'SUPER_ADMIN',
        tenantRole: 'OWNER',
        isSuperAdmin: true,
        requestId: 'test-11',
        timestamp: new Date(),
      };

      const tasks = await tenantContext.run(context, () =>
        prisma.task.findMany()
      );

      // Even super admin should only see their tenant's tasks
      expect(tasks).toHaveLength(1);
      expect(tasks[0].tenantId).toBe(tenant1Id);
    });
  });
});
API Route Tests
typescript// tests/integration/api-tenant-isolation.test.ts

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { createMocks } from 'node-mocks-http';
import { GET as getTask, PATCH as updateTask } from '@/app/api/admin/tasks/[id]/route';
import { NextRequest } from 'next/server';

const prisma = new PrismaClient();

// Mock NextAuth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

describe('API Tenant Isolation', () => {
  let tenant1Id: string;
  let tenant2Id: string;
  let task1Id: string;
  let task2Id: string;

  beforeAll(async () => {
    const { getServerSession } = require('next-auth');

    // Setup test data
    const tenant1 = await prisma.tenant.create({
      data: { slug: 'api-test-1', name: 'API Test 1' },
    });
    tenant1Id = tenant1.id;

    const tenant2 = await prisma.tenant.create({
      data: { slug: 'api-test-2', name: 'API Test 2' },
    });
    tenant2Id = tenant2.id;

    const task1 = await prisma.task.create({
      data: {
        title: 'API Task 1',
        tenantId: tenant1Id,
        status: 'PENDING',
      },
    });
    task1Id = task1.id;

    const task2 = await prisma.task.create({
      data: {
        title: 'API Task 2',
        tenantId: tenant2Id,
        status: 'PENDING',
      },
    });
    task2Id = task2.id;
  });

  afterAll(async () => {
    await prisma.task.deleteMany({
      where: { tenantId: { in: [tenant1Id, tenant2Id] } },
    });
    await prisma.tenant.deleteMany({
      where: { id: { in: [tenant1Id, tenant2Id] } },
    });
    await prisma.$disconnect();
  });

  it('should not allow tenant 1 user to access tenant 2 task', async () => {
    const { getServerSession } = require('next-auth');
    
    getServerSession.mockResolvedValue({
      user: {
        id: 'user1',
        tenantId: tenant1Id,
        tenantSlug: 'api-test-1',
        role: 'ADMIN',
        tenantRole: 'ADMIN',
      },
    });

    const request = new NextRequest(
      new Request(`http://localhost/api/admin/tasks/${task2Id}`)
    );

    const response = await getTask(request, { params: { id: task2Id } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Not Found');
  });

  it('should allow tenant user to access their own task', async () => {
    const { getServerSession } = require('next-auth');
    
    getServerSession.mockResolvedValue({
      user: {
        id: 'user1',
        tenantId: tenant1Id,
        tenantSlug: 'api-test-1',
        role: 'ADMIN',
        tenantRole: 'ADMIN',
      },
    });

    const request = new NextRequest(
      new Request(`http://localhost/api/admin/tasks/${task1Id}`)
    );

    const response = await getTask(request, { params: { id: task1Id } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.task.id).toBe(task1Id);
    expect(data.task.tenantId).toBe(tenant1Id);
  });

  it('should not allow updating another tenant\'s task', async () => {
    const { getServerSession } = require('next-auth');
    
    getServerSession.mockResolvedValue({
      user: {
        id: 'user1',
        tenantId: tenant1Id,
        tenantSlug: 'api-test-1',
        role: 'ADMIN',
        tenantRole: 'ADMIN',
      },
    });

    const request = new NextRequest(
      new Request(`http://localhost/api/admin/tasks/${task2Id}`, {
        method: 'PATCH',
        body: JSON.stringify({ title: 'Hacked title' }),
      })
    );

    const response = await updateTask(request, { params: { id: task2Id } });
    const data = await response.json();

    expect(response.status).toBe(404);

    // Verify original task unchanged
    const task = await prisma.task.findUnique({ where: { id: task2Id } });
    expect(task?.title).toBe('API Task 2');
  });
});

Monitoring & Observability
Enhanced Logger with Tenant Context
typescript// src/lib/logger.ts

import pino from 'pino';
import { tenantContext } from './tenant-context';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

/**
 * Create tenant-aware logger that automatically includes context
 */
export function createTenantLogger() {
  return {
    info: (message: string, meta?: Record<string, any>) => {
      const context = tenantContext.getContextOrNull();
      logger.info({
        message,
        ...meta,
        tenantId: context?.tenantId,
        tenantSlug: context?.tenantSlug,
        userId: context?.userId,
        requestId: context?.requestId,
      });
    },

    warn: (message: string, meta?: Record<string, any>) => {
      const context = tenantContext.getContextOrNull();
      logger.warn({
        message,
        ...meta,
        tenantId: context?.tenantId,
        tenantSlug: context?.tenantSlug,
        userId: context?.userId,
        requestId: context?.requestId,
      });
    },

    error: (message: string, meta?: Record<string, any>) => {
      const context = tenantContext.getContextOrNull();
      logger.error({
        message,
        ...meta,
        tenantId: context?.tenantId,
        tenantSlug: context?.tenantSlug,
        userId: context?.userId,
        requestId: context?.requestId,
      });
    },

    debug: (message: string, meta?: Record<string, any>) => {
      const context = tenantContext.getContextOrNull();
      logger.debug({
        message,
        ...meta,
        tenantId: context?.tenantId,
        tenantSlug: context?.tenantSlug,
        userId: context?.userId,
        requestId: context?.requestId,
      });
    },
  };
}

export { logger };
export default createTenantLogger();
Sentry Integration with Tenant Tagging
typescript// src/lib/observability.ts

import * as Sentry from '@sentry/nextjs';
import { tenantContext } from './tenant-context';

/**
 * Initialize Sentry with tenant context
 */
export function initSentry() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 1.0,
    
    beforeSend(event, hint) {
      // Add tenant context to all events
      const context = tenantContext.getContextOrNull();
      
      if (context) {
        event.tags = {
          ...event.tags,
          tenant_id: context.tenantId,
          tenant_slug: context.tenantSlug,
        };
        
        event.user = {
          ...event.user,
          id: context.userId,
          tenant: context.tenantSlug,
        };
        
        event.contexts = {
          ...event.contexts,
          tenant: {
            id: context.tenantId,
            slug: context.tenantSlug,
            role: context.tenantRole,
          },
        };
      }
      
      return event;
    },
  });
}

/**
 * Capture error with tenant context
 */
export function captureException(error: Error, context?: Record<string, any>) {
  const tenantCtx = tenantContext.getContextOrNull();
  
  Sentry.captureException(error, {
    tags: {
      tenant_id: tenantCtx?.tenantId,
      tenant_slug: tenantCtx?.tenantSlug,
    },
    contexts: {
      tenant: tenantCtx ? {
        id: tenantCtx.tenantId,
        slug: tenantCtx.tenantSlug,
        userId: tenantCtx.userId,
      } : undefined,
      ...context,
    },
  });
}

/**
 * Create performance transaction with tenant context
 */
export function startTransaction(name: string, op: string) {
  const context = tenantContext.getContextOrNull();
  
  const transaction = Sentry.startTransaction({
    name,
    op,
    tags: context ? {
      tenant_id: context.tenantId,
      tenant_slug: context.tenantSlug,
    } : undefined,
  });
  
  return transaction;
}
Tenant-Aware Audit Logging
typescript// src/services/audit.service.ts

import { prisma } from '@/lib/prisma';
import { tenantContext } from '@/lib/tenant-context';
import { createTenantLogger } from '@/lib/logger';

const logger = createTenantLogger();

export interface AuditEntry {
  action: string;
  resource: string;
  resourceId: string;
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
}

export class AuditService {
  /**
   * Create audit log entry
   */
  async log(entry: AuditEntry): Promise<void> {
    try {
      const context = tenantContext.getContext();

      await prisma.auditLog.create({
        data: {
          tenantId: context.tenantId,
          userId: context.userId,
          action: entry.action,
          resource: entry.resource,
          resourceId: entry.resourceId,
          changes: entry.changes,
          metadata: {
            ...entry.metadata,
            requestId: context.requestId,
            userRole: context.role,
            tenantRole: context.tenantRole,
          },
          createdAt: new Date(),
        },
      });

      logger.info('Audit log created', {
        action: entry.action,
        resource: entry.resource,
        resourceId: entry.resourceId,
      });
    } catch (error) {
      logger.error('Failed to create audit log', { error, entry });
      // Don't throw - audit logging should not break operations
    }
  }

  /**
   * Query audit logs for current tenant
   */
  async queryLogs(filters: {
    startDate?: Date;
    endDate?: Date;
    action?: string;
    resource?: string;
    userId?: string;
    limit?: number;
  }) {
    const context = tenantContext.getContext();

    return prisma.auditLog.findMany({
      where: {
        tenantId: context.tenantId,
        createdAt: {
          gte: filters.startDate,
          lte: filters.endDate,
        },
        action: filters.action,
        resource: filters.resource,
        userId: filters.userId,
      },
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 100,
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Export audit logs (admin only)
   */
  async exportLogs(startDate: Date, endDate: Date) {
    const context = tenantContext.getContext();

    if (!['OWNER', 'ADMIN'].includes(context.tenantRole)) {
      throw new Error('Insufficient permissions to export audit logs');
    }

    const logs = await prisma.auditLog.findMany({
      where: {
        tenantId: context.tenantId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { createdAt: 'asc' },
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    return logs.map(log => ({
      timestamp: log.createdAt.toISOString(),
      user: log.user?.email || 'System',
      action: log.action,
      resource: log.resource,
      resourceId: log.resourceId,
      changes: log.changes,
      metadata: log.metadata,
    }));
  }
}

export const auditService = new AuditService();

Implementation Roadmap
Week 1-2: Foundation & Database
markdown## Sprint 1: Database Foundation

### Day 1-2: Schema Design
- [ ] Review and finalize Prisma schema changes
- [ ] Create migration scripts (001-005)
- [ ] Set up rollback scripts
- [ ] Document schema changes

### Day 3-4: Staging Deployment
- [ ] Deploy schema changes to staging
- [ ] Run backfill scripts
- [ ] Verify data integrity
- [ ] Performance testing

### Day 5-7: RLS Implementation
- [ ] Enable Row Level Security
- [ ] Create and test policies
- [ ] Benchmark query performance
- [ ] Document RLS behavior

### Day 8-10: Validation
- [ ] Run comprehensive data validation
- [ ] Test all foreign key constraints
- [ ] Verify indexesRetryAEContinueEditmarkdown- [ ] Check for orphaned records
- [ ] Generate database health report

### Deliverables
- ✅ All tenant columns added to schema
- ✅ Data backfilled and validated
- ✅ RLS policies active and tested
- ✅ Performance benchmarks documented
Week 3-4: Application Layer
markdown## Sprint 2: Application Layer Transformation

### Day 1-3: Core Infrastructure
- [ ] Implement AsyncLocalStorage tenant context
- [ ] Create enhanced Prisma client with middleware
- [ ] Build base repository pattern
- [ ] Add tenant utility functions
- [ ] Write unit tests for context management

### Day 4-6: Authentication Enhancement
- [ ] Update NextAuth configuration
- [ ] Add tenant binding to JWT
- [ ] Implement tenant membership system
- [ ] Create tenant switching mechanism
- [ ] Update session types

### Day 7-10: Middleware & Security
- [ ] Enhance middleware with tenant validation
- [ ] Implement signed tenant cookies
- [ ] Add header sanitization
- [ ] Create API wrapper with context injection
- [ ] Add tenant mismatch detection

### Day 11-14: Repository Implementation
- [ ] Create concrete repositories (Task, Service, etc.)
- [ ] Migrate existing services to repositories
- [ ] Add bulk operation support
- [ ] Implement analytics methods
- [ ] Write repository integration tests

### Deliverables
- ✅ Tenant context flows automatically through requests
- ✅ All API routes use wrapper with context
- ✅ Repositories enforce tenant scoping
- ✅ Authentication includes tenant binding
- ✅ >90% test coverage on new components
Week 5-6: API Migration
markdown## Sprint 3: API Routes Refactoring

### Day 1-4: Admin Routes
- [ ] Refactor /api/admin/tasks routes
- [ ] Refactor /api/admin/services routes
- [ ] Refactor /api/admin/bookings routes
- [ ] Refactor /api/admin/users routes
- [ ] Add validation schemas with Zod

### Day 5-8: Portal Routes
- [ ] Refactor /api/portal routes
- [ ] Update settings endpoints
- [ ] Migrate dashboard APIs
- [ ] Update profile endpoints

### Day 9-12: Analytics & Reporting
- [ ] Refactor analytics endpoints
- [ ] Update reporting queries
- [ ] Add tenant-scoped aggregations
- [ ] Implement export functionality

### Day 13-14: Integration Testing
- [ ] Create API isolation test suite
- [ ] Test cross-tenant attack scenarios
- [ ] Validate role-based access
- [ ] Test bulk operations
- [ ] Performance testing

### Deliverables
- ✅ All API routes use tenant-aware wrappers
- ✅ No direct Prisma access in routes
- ✅ Comprehensive API test coverage
- ✅ All routes validated against tenant isolation
Week 7: Testing & Security Audit
markdown## Sprint 4: Testing & Security Validation

### Day 1-2: Integration Testing
- [ ] Run full integration test suite
- [ ] Test tenant switching flows
- [ ] Validate session management
- [ ] Test concurrent requests
- [ ] Load testing with multiple tenants

### Day 3-4: Security Audit
- [ ] Perform penetration testing
- [ ] Test header forgery scenarios
- [ ] Validate cookie signatures
- [ ] Test subdomain isolation
- [ ] Review RLS policy effectiveness

### Day 5-6: Performance Optimization
- [ ] Identify slow queries
- [ ] Add missing indexes
- [ ] Optimize repository methods
- [ ] Review connection pooling
- [ ] Cache strategy review

### Day 7: Documentation
- [ ] Update API documentation
- [ ] Create tenant admin guide
- [ ] Document repository patterns
- [ ] Write troubleshooting guide
- [ ] Create security best practices doc

### Deliverables
- ✅ Security audit report with 0 critical issues
- ✅ Performance benchmarks meet targets
- ✅ Complete test suite with >85% coverage
- ✅ Documentation published
Week 8: Production Deployment
markdown## Sprint 5: Production Rollout

### Day 1: Pre-Deployment
- [ ] Final staging validation
- [ ] Create deployment checklist
- [ ] Schedule maintenance window
- [ ] Prepare rollback procedures
- [ ] Alert stakeholders

### Day 2: Database Migration
- [ ] Take production backup
- [ ] Run schema migrations
- [ ] Execute backfill scripts
- [ ] Verify data integrity
- [ ] Enable RLS policies

### Day 3: Application Deployment
- [ ] Deploy enhanced Prisma client
- [ ] Deploy middleware changes
- [ ] Deploy API wrapper
- [ ] Deploy refactored routes
- [ ] Update environment variables

### Day 4-5: Monitoring & Validation
- [ ] Monitor error rates
- [ ] Check tenant isolation
- [ ] Validate analytics accuracy
- [ ] Test user workflows
- [ ] Review audit logs

### Day 6-7: Post-Deployment
- [ ] Gather user feedback
- [ ] Fix any critical issues
- [ ] Performance tuning
- [ ] Update monitoring dashboards
- [ ] Conduct retrospective

### Deliverables
- ✅ Production deployment successful
- ✅ Zero security incidents
- ✅ Performance within acceptable range
- ✅ User workflows functioning correctly
- ✅ Comprehensive monitoring in place

Monitoring & Observability Setup
Grafana Dashboard Configuration
typescript// monitoring/grafana-dashboard.json

{
  "dashboard": {
    "title": "Multi-Tenant System Monitoring",
    "panels": [
      {
        "title": "Requests by Tenant",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total[5m])) by (tenant_id)"
          }
        ]
      },
      {
        "title": "Cross-Tenant Access Attempts",
        "targets": [
          {
            "expr": "sum(rate(tenant_mismatch_total[5m])) by (tenant_id)"
          }
        ]
      },
      {
        "title": "Database Query Performance by Tenant",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(prisma_query_duration_seconds_bucket[5m])) by (tenant_id)"
          }
        ]
      },
      {
        "title": "Tenant Context Errors",
        "targets": [
          {
            "expr": "sum(rate(tenant_context_error_total[5m]))"
          }
        ]
      },
      {
        "title": "Active Tenants",
        "targets": [
          {
            "expr": "count(count(http_requests_total) by (tenant_id))"
          }
        ]
      }
    ]
  }
}
Prometheus Metrics
typescript// src/lib/metrics.ts

import { Counter, Histogram, Gauge, register } from 'prom-client';
import { tenantContext } from './tenant-context';

// Request counter
export const requestCounter = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status', 'tenant_id'],
});

// Tenant mismatch counter
export const tenantMismatchCounter = new Counter({
  name: 'tenant_mismatch_total',
  help: 'Number of tenant mismatch attempts',
  labelNames: ['tenant_id', 'requested_tenant_id'],
});

// Query duration histogram
export const queryDurationHistogram = new Histogram({
  name: 'prisma_query_duration_seconds',
  help: 'Prisma query duration in seconds',
  labelNames: ['model', 'operation', 'tenant_id'],
  buckets: [0.001, 0.01, 0.1, 0.5, 1, 2, 5],
});

// Tenant context errors
export const contextErrorCounter = new Counter({
  name: 'tenant_context_error_total',
  help: 'Number of tenant context errors',
  labelNames: ['error_type'],
});

// Active tenants gauge
export const activeTenantsGauge = new Gauge({
  name: 'active_tenants',
  help: 'Number of active tenants',
});

/**
 * Record HTTP request with tenant context
 */
export function recordRequest(
  method: string,
  route: string,
  status: number
) {
  const context = tenantContext.getContextOrNull();
  
  requestCounter.inc({
    method,
    route,
    status: status.toString(),
    tenant_id: context?.tenantId || 'unknown',
  });
}

/**
 * Record tenant mismatch attempt
 */
export function recordTenantMismatch(
  actualTenantId: string,
  requestedTenantId: string
) {
  tenantMismatchCounter.inc({
    tenant_id: actualTenantId,
    requested_tenant_id: requestedTenantId,
  });
}

/**
 * Record query duration
 */
export function recordQueryDuration(
  model: string,
  operation: string,
  duration: number
) {
  const context = tenantContext.getContextOrNull();
  
  queryDurationHistogram.observe(
    {
      model,
      operation,
      tenant_id: context?.tenantId || 'unknown',
    },
    duration
  );
}

/**
 * Record context error
 */
export function recordContextError(errorType: string) {
  contextErrorCounter.inc({ error_type: errorType });
}

/**
 * Update active tenants count
 */
export async function updateActiveTenantsCount(count: number) {
  activeTenantsGauge.set(count);
}

/**
 * Expose metrics endpoint
 */
export async function getMetrics(): Promise<string> {
  return register.metrics();
}
Health Check Endpoint
typescript// src/app/api/health/tenant/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updateActiveTenantsCount } from '@/lib/metrics';

export async function GET(request: NextRequest) {
  try {
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`;

    // Count active tenants
    const activeTenants = await prisma.tenant.count({
      where: { isActive: true },
    });

    // Update metrics
    await updateActiveTenantsCount(activeTenants);

    // Check RLS policies
    const rlsEnabled = await prisma.$queryRaw<Array<{ enabled: boolean }>>`
      SELECT tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename IN ('Task', 'Service', 'ServiceRequest')
    `;

    // Validate tenant isolation
    const isolationCheck = await validateTenantIsolation();

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'ok',
        activeTenants,
        rowLevelSecurity: rlsEnabled.every(t => t.enabled),
        tenantIsolation: isolationCheck,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}

async function validateTenantIsolation(): Promise<boolean> {
  try {
    // Query without tenant context should fail
    const tasksWithoutContext = await prisma.task.findMany();
    
    // If we got here in production, isolation is broken
    if (process.env.NODE_ENV === 'production' && tasksWithoutContext.length > 0) {
      return false;
    }

    return true;
  } catch (error) {
    // Error expected when no context is set
    return true;
  }
}

Additional Enhancements
Tenant Switching UI Component
typescript// src/components/TenantSwitcher.tsx

'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export function TenantSwitcher() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  if (!session?.user?.availableTenants || session.user.availableTenants.length <= 1) {
    return null;
  }

  const handleTenantSwitch = async (tenantId: string) => {
    setIsLoading(true);
    
    try {
      // Update session with new tenant
      await update({ tenantId });
      
      // Refresh the page to reload with new tenant context
      router.refresh();
    } catch (error) {
      console.error('Failed to switch tenant:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      <select
        value={session.user.tenantId}
        onChange={(e) => handleTenantSwitch(e.target.value)}
        disabled={isLoading}
        className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
      >
        {session.user.availableTenants.map((tenant) => (
          <option key={tenant.id} value={tenant.id}>
            {tenant.name} ({tenant.role})
          </option>
        ))}
      </select>
    </div>
  );
}
Tenant Isolation Validator CLI
typescript// scripts/validate-tenant-isolation.ts

import { PrismaClient } from '@prisma/client';
import { logger } from '../src/lib/logger';

const prisma = new PrismaClient();

interface ValidationResult {
  model: string;
  passed: boolean;
  issues: string[];
}

async function validateTenantIsolation(): Promise<void> {
  console.log('🔍 Starting tenant isolation validation...\n');

  const results: ValidationResult[] = [];

  // Test 1: Check all tenant-scoped models have tenantId
  results.push(await validateTenantColumns());

  // Test 2: Check for orphaned records
  results.push(await validateNoOrphanedRecords());

  // Test 3: Validate RLS policies
  results.push(await validateRLSPolicies());

  // Test 4: Check foreign key constraints
  results.push(await validateForeignKeys());

  // Test 5: Validate unique constraints
  results.push(await validateUniqueConstraints());

  // Print results
  console.log('\n📊 Validation Results:\n');
  
  let totalPassed = 0;
  let totalFailed = 0;

  for (const result of results) {
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} ${result.model}`);
    
    if (result.issues.length > 0) {
      result.issues.forEach(issue => {
        console.log(`   ⚠️  ${issue}`);
      });
    }
    
    result.passed ? totalPassed++ : totalFailed++;
  }

  console.log(`\n📈 Summary: ${totalPassed} passed, ${totalFailed} failed\n`);

  if (totalFailed > 0) {
    console.error('❌ Validation failed. Please fix the issues above.');
    process.exit(1);
  }

  console.log('✅ All validation checks passed!');
  process.exit(0);
}

async function validateTenantColumns(): Promise<ValidationResult> {
  const issues: string[] = [];
  
  const modelsToCheck = [
    'Task',
    'Service',
    'ServiceRequest',
    'Booking',
    'ComplianceRecord',
    'User',
  ];

  for (const model of modelsToCheck) {
    try {
      const result = await prisma.$queryRawUnsafe(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = '${model}' 
        AND column_name = 'tenantId'
      `);

      if (Array.isArray(result) && result.length === 0) {
        issues.push(`Model ${model} missing tenantId column`);
      }
    } catch (error) {
      issues.push(`Failed to check ${model}: ${error}`);
    }
  }

  return {
    model: 'Tenant Columns',
    passed: issues.length === 0,
    issues,
  };
}

async function validateNoOrphanedRecords(): Promise<ValidationResult> {
  const issues: string[] = [];

  try {
    const orphanedTasks = await prisma.task.count({
      where: { tenantId: 'SYSTEM' },
    });

    if (orphanedTasks > 0) {
      issues.push(`Found ${orphanedTasks} tasks with SYSTEM tenant`);
    }

    const orphanedServices = await prisma.service.count({
      where: { tenantId: 'SYSTEM' },
    });

    if (orphanedServices > 0) {
      issues.push(`Found ${orphanedServices} services with SYSTEM tenant`);
    }
  } catch (error) {
    issues.push(`Failed to check orphaned records: ${error}`);
  }

  return {
    model: 'Orphaned Records',
    passed: issues.length === 0,
    issues,
  };
}

async function validateRLSPolicies(): Promise<ValidationResult> {
  const issues: string[] = [];

  try {
    const rlsStatus = await prisma.$queryRaw<Array<{ tablename: string; rowsecurity: boolean }>>`
      SELECT tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename IN ('Task', 'Service', 'ServiceRequest', 'Booking')
    `;

    for (const table of rlsStatus) {
      if (!table.rowsecurity) {
        issues.push(`RLS not enabled on ${table.tablename}`);
      }
    }
  } catch (error) {
    issues.push(`Failed to check RLS policies: ${error}`);
  }

  return {
    model: 'Row Level Security',
    passed: issues.length === 0,
    issues,
  };
}

async function validateForeignKeys(): Promise<ValidationResult> {
  const issues: string[] = [];

  try {
    // Check that all tenant-scoped models have FK to Tenant
    const fkCheck = await prisma.$queryRaw<Array<{ table_name: string; constraint_name: string }>>`
      SELECT 
        tc.table_name, 
        tc.constraint_name
      FROM information_schema.table_constraints tc
      WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name IN ('Task', 'Service', 'User', 'Booking')
      AND tc.constraint_name LIKE '%tenant%'
    `;

    const expectedTables = ['Task', 'Service', 'User', 'Booking'];
    const tablesWithFK = new Set(fkCheck.map(r => r.table_name));

    for (const table of expectedTables) {
      if (!tablesWithFK.has(table)) {
        issues.push(`Missing tenant foreign key on ${table}`);
      }
    }
  } catch (error) {
    issues.push(`Failed to check foreign keys: ${error}`);
  }

  return {
    model: 'Foreign Key Constraints',
    passed: issues.length === 0,
    issues,
  };
}

async function validateUniqueConstraints(): Promise<ValidationResult> {
  const issues: string[] = [];

  try {
    // Check for proper unique constraints
    const uniqueConstraints = await prisma.$queryRaw<Array<{ table_name: string; constraint_name: string }>>`
      SELECT 
        tc.table_name,
        tc.constraint_name
      FROM information_schema.table_constraints tc
      WHERE tc.constraint_type = 'UNIQUE'
      AND tc.table_name IN ('Service', 'User')
    `;

    // Verify Service has tenant+slug unique constraint
    const serviceConstraints = uniqueConstraints.filter(c => c.table_name === 'Service');
    if (!serviceConstraints.some(c => c.constraint_name.includes('tenant'))) {
      issues.push('Service missing tenant-scoped unique constraint');
    }

    // Verify User has tenant+email unique constraint
    const userConstraints = uniqueConstraints.filter(c => c.table_name === 'User');
    if (!userConstraints.some(c => c.constraint_name.includes('tenant'))) {
      issues.push('User missing tenant-scoped unique constraint');
    }
  } catch (error) {
    issues.push(`Failed to check unique constraints: ${error}`);
  }

  return {
    model: 'Unique Constraints',
    passed: issues.length === 0,
    issues,
  };
}

// Run validation
validateTenantIsolation().catch((error) => {
  console.error('Validation script failed:', error);
  process.exit(1);
});

Summary & Next Steps
Key Achievements
This comprehensive enhancement plan transforms your tenant system from a manual, header-based approach to a professional, enterprise-grade multi-tenant architecture with:

Zero-Trust Security: Automatic tenant validation at every layer
Database-Level Isolation: RLS policies + compound constraints
Automatic Context Propagation: AsyncLocalStorage ensures tenant context flows seamlessly
Defense in Depth: Multiple validation layers (DB, ORM, middleware, API)
Production-Ready Monitoring: Comprehensive observability with tenant-aware logging and metrics

Critical Success Factors
✅ No Manual Tenant Selection: Tenant is automatically derived from authenticated session
✅ Header Forgery Prevention: Signed cookies + middleware validation
✅ Automatic Scoping: Prisma middleware injects tenant filters automatically
✅ Repository Pattern: All data access goes through tenant-aware repositories
✅ Comprehensive Testing: 85%+ test coverage with isolation tests
✅ Production Monitoring: Real-time tenant isolation validation
Immediate Next Steps

Review this document with your team and adjust timelines
Set up staging environment matching production exactly
Begin Sprint 1 (Database Foundation) immediately
Schedule security audit for Week 7
Plan maintenance window for production deployment

Long-Term Maintenance

Run validate-tenant-isolation.ts script weekly in CI/CD
Monitor tenant mismatch metrics daily
Quarterly security audits
Keep dependencies updated (especially Prisma and NextAuth)
Regular performance reviews per tenant


This solution provides a complete, production-ready transformation of your tenant system. Every component is designed to work together automatically, eliminating manual intervention while maintaining the highest security standards.