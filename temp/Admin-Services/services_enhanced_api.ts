// src/app/api/admin/services/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { ServicesService } from '@/services/services.service';
import { hasPermission } from '@/lib/permissions';
import { ServiceFiltersSchema, ServiceSchema } from '@/schemas/services';
import { AuditLogger } from '@/lib/audit';
import { RateLimiter } from '@/lib/rate-limit';
import { getTenantFromRequest } from '@/lib/tenant';

const servicesService = new ServicesService();
const auditLogger = new AuditLogger();
const rateLimiter = new RateLimiter();

/**
 * GET /api/admin/services
 * Retrieve services list with filtering, sorting, and pagination
 * Requires: SERVICES_VIEW permission
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    await rateLimiter.check(request, 'services-list', { max: 100, window: '1m' });

    // Authentication & Authorization
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user, 'SERVICES_VIEW')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Extract and validate query parameters
    const searchParams = new URL(request.url).searchParams;
    const filters = ServiceFiltersSchema.parse({
      search: searchParams.get('search') || undefined,
      category: searchParams.get('category') || 'all',
      featured: searchParams.get('featured') || 'all',
      status: searchParams.get('status') || 'all',
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
      sortBy: searchParams.get('sortBy') || 'updatedAt',
      sortOrder: searchParams.get('sortOrder') || 'desc',
    });

    // Get tenant context for multi-tenancy
    const tenantId = getTenantFromRequest(request);

    // Fetch services
    const result = await servicesService.getServicesList(tenantId, filters);

    // Log audit trail
    await auditLogger.log({
      userId: session.user.id,
      action: 'SERVICES_LIST_VIEW',
      resourceType: 'SERVICE',
      metadata: { filters, resultCount: result.services.length },
    });

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'private, max-age=60',
        'X-Total-Count': result.total.toString(),
      },
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json(
      { error: 'Failed to fetch services', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/services
 * Create a new service
 * Requires: SERVICES_CREATE permission
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting for creation
    await rateLimiter.check(request, 'services-create', { max: 10, window: '1m' });

    // Authentication & Authorization
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user, 'SERVICES_CREATE')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = ServiceSchema.parse(body);

    // Get tenant context
    const tenantId = getTenantFromRequest(request);

    // Create service
    const service = await servicesService.createService(tenantId, validatedData, session.user.id);

    // Log audit trail
    await auditLogger.log({
      userId: session.user.id,
      action: 'SERVICE_CREATED',
      resourceType: 'SERVICE',
      resourceId: service.id,
      metadata: { serviceName: service.name, slug: service.slug },
    });

    return NextResponse.json({ service }, { status: 201 });
  } catch (error) {
    console.error('Error creating service:', error);
    
    if (error instanceof Error && error.message.includes('slug already exists')) {
      return NextResponse.json(
        { error: 'A service with this slug already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create service', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// src/app/api/admin/services/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { ServicesService } from '@/services/services.service';
import { hasPermission } from '@/lib/permissions';
import { ServiceUpdateSchema } from '@/schemas/services';
import { AuditLogger } from '@/lib/audit';
import { getTenantFromRequest } from '@/lib/tenant';

const servicesService = new ServicesService();
const auditLogger = new AuditLogger();

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/services/[id]
 * Retrieve a single service by ID
 * Requires: SERVICES_VIEW permission
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user, 'SERVICES_VIEW')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const tenantId = getTenantFromRequest(request);
    const service = await servicesService.getServiceById(tenantId, id);

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    return NextResponse.json({ service });
  } catch (error) {
    console.error('Error fetching service:', error);
    return NextResponse.json(
      { error: 'Failed to fetch service' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/services/[id]
 * Update a service
 * Requires: SERVICES_EDIT permission
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user, 'SERVICES_EDIT')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = ServiceUpdateSchema.parse({ ...body, id });

    const tenantId = getTenantFromRequest(request);
    const originalService = await servicesService.getServiceById(tenantId, id);
    
    if (!originalService) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    const updatedService = await servicesService.updateService(tenantId, id, validatedData, session.user.id);

    // Log audit trail with changes
    await auditLogger.log({
      userId: session.user.id,
      action: 'SERVICE_UPDATED',
      resourceType: 'SERVICE',
      resourceId: id,
      metadata: {
        changes: Object.keys(body).reduce((acc, key) => {
          if (originalService[key] !== body[key]) {
            acc[key] = { from: originalService[key], to: body[key] };
          }
          return acc;
        }, {} as Record<string, { from: any; to: any }>),
      },
    });

    return NextResponse.json({ service: updatedService });
  } catch (error) {
    console.error('Error updating service:', error);
    return NextResponse.json(
      { error: 'Failed to update service' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/services/[id]
 * Soft delete a service (set active: false)
 * Requires: SERVICES_DELETE permission
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user, 'SERVICES_DELETE')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const tenantId = getTenantFromRequest(request);
    const service = await servicesService.getServiceById(tenantId, id);
    
    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    await servicesService.deleteService(tenantId, id, session.user.id);

    // Log audit trail
    await auditLogger.log({
      userId: session.user.id,
      action: 'SERVICE_DELETED',
      resourceType: 'SERVICE',
      resourceId: id,
      metadata: { serviceName: service.name, slug: service.slug },
    });

    return NextResponse.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Error deleting service:', error);
    return NextResponse.json(
      { error: 'Failed to delete service' },
      { status: 500 }
    );
  }
}

// src/app/api/admin/services/bulk/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { ServicesService } from '@/services/services.service';
import { hasPermission } from '@/lib/permissions';
import { BulkActionSchema } from '@/schemas/services';
import { AuditLogger } from '@/lib/audit';
import { getTenantFromRequest } from '@/lib/tenant';

const servicesService = new ServicesService();
const auditLogger = new AuditLogger();

/**
 * POST /api/admin/services/bulk
 * Perform bulk actions on multiple services
 * Requires: SERVICES_BULK_EDIT permission
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user, 'SERVICES_BULK_EDIT')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = BulkActionSchema.parse(body);

    const tenantId = getTenantFromRequest(request);
    const result = await servicesService.performBulkAction(tenantId, validatedData, session.user.id);

    // Log audit trail
    await auditLogger.log({
      userId: session.user.id,
      action: 'SERVICES_BULK_ACTION',
      resourceType: 'SERVICE',
      metadata: {
        action: validatedData.action,
        affectedServices: validatedData.serviceIds.length,
        serviceIds: validatedData.serviceIds,
        value: validatedData.value,
      },
    });

    return NextResponse.json({
      message: `Successfully ${validatedData.action} ${result.updatedCount} services`,
      result,
    });
  } catch (error) {
    console.error('Error performing bulk action:', error);
    return NextResponse.json(
      { error: 'Failed to perform bulk action' },
      { status: 500 }
    );
  }
}

// src/app/api/admin/services/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { ServicesService } from '@/services/services.service';
import { hasPermission } from '@/lib/permissions';
import { getTenantFromRequest } from '@/lib/tenant';

const servicesService = new ServicesService();

/**
 * GET /api/admin/services/stats
 * Retrieve service statistics and analytics
 * Requires: SERVICES_VIEW permission
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user, 'SERVICES_VIEW')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const searchParams = new URL(request.url).searchParams;
    const timeRange = searchParams.get('range') || '30d';

    const tenantId = getTenantFromRequest(request);
    const stats = await servicesService.getServiceStats(tenantId, timeRange);

    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': 'private, max-age=300', // Cache for 5 minutes
      },
    });
  } catch (error) {
    console.error('Error fetching service stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch service statistics' },
      { status: 500 }
    );
  }
}

// src/app/api/admin/services/export/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { ServicesService } from '@/services/services.service';
import { hasPermission } from '@/lib/permissions';
import { getTenantFromRequest } from '@/lib/tenant';

const servicesService = new ServicesService();

/**
 * GET /api/admin/services/export
 * Export services data as CSV
 * Requires: SERVICES_EXPORT permission
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user, 'SERVICES_EXPORT')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const searchParams = new URL(request.url).searchParams;
    const format = searchParams.get('format') || 'csv';
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const tenantId = getTenantFromRequest(request);
    const csvData = await servicesService.exportServices(tenantId, { format, includeInactive });

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `services-export-${timestamp}.${format}`;

    return new NextResponse(csvData, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting services:', error);
    return NextResponse.json(
      { error: 'Failed to export services' },
      { status: 500 }
    );
  }
}
