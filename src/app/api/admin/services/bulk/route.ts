import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { ServicesService } from '@/services/services.service';
import { PERMISSIONS, hasPermission } from '@/lib/permissions';
import { BulkActionSchema } from '@/schemas/services';
import { getTenantFromRequest } from '@/lib/tenant';
import { logAudit } from '@/lib/audit';
import { makeErrorBody, mapPrismaError, mapZodError, isApiError } from '@/lib/api/error-responses';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

const svc = new ServicesService();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!hasPermission(session.user.role, PERMISSIONS.SERVICES_BULK_EDIT)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const ip = getClientIp(request as any)
    const tenantKey = getTenantFromRequest(request) || 'global'
    if (!rateLimit(`bulk:${tenantKey}:${ip}`, 10, 60_000)) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })


    const body = await request.json();
    const data = BulkActionSchema.parse(body);

    const tenantId = getTenantFromRequest(request);
    const result = await svc.performBulkAction(tenantId, data as any, session.user.id);

    await logAudit({ action: 'SERVICES_BULK_ACTION', actorId: session.user.id, details: { action: data.action, count: result.updatedCount } });

    // If partial errors exist, return 207 Multi-Status with details
    if (result.errors && result.errors.length) {
      return NextResponse.json({ message: `Completed with errors: ${result.updatedCount} succeeded, ${result.errors.length} failed`, result }, { status: 207 });
    }

    return NextResponse.json({ message: `Successfully ${data.action} ${result.updatedCount} services`, result });
  } catch (e: any) {
    const prismaMapped = mapPrismaError(e);
    if (prismaMapped) return NextResponse.json(makeErrorBody(prismaMapped), { status: prismaMapped.status });
    if (e?.name === 'ZodError') {
      const apiErr = mapZodError(e);
      return NextResponse.json(makeErrorBody(apiErr), { status: apiErr.status });
    }
    if (isApiError(e)) return NextResponse.json(makeErrorBody(e), { status: e.status });
    console.error('bulk error', e);
    return NextResponse.json(makeErrorBody(e), { status: 500 });
  }
}
