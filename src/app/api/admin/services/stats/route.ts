import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import * as Sentry from '@sentry/nextjs'
import { authOptions } from '@/lib/auth';
import { ServicesService } from '@/services/services.service';
import { PERMISSIONS, hasPermission } from '@/lib/permissions';
import { getTenantFromRequest } from '@/lib/tenant';
import { makeErrorBody, mapPrismaError, mapZodError, isApiError } from '@/lib/api/error-responses';

const svc = new ServicesService();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!hasPermission(session.user.role, PERMISSIONS.SERVICES_ANALYTICS)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });


    const sp = new URL(request.url).searchParams;
    const range = sp.get('range') || '30d';

    const tenantId = getTenantFromRequest(request);
    const stats = await svc.getServiceStats(tenantId, range);
    return NextResponse.json(stats, { headers: { 'Cache-Control': 'private, max-age=300' } });
  } catch (e: any) {
    const prismaMapped = mapPrismaError(e);
    if (prismaMapped) return NextResponse.json(makeErrorBody(prismaMapped), { status: prismaMapped.status });
    if (e?.name === 'ZodError') {
      const apiErr = mapZodError(e);
      return NextResponse.json(makeErrorBody(apiErr), { status: apiErr.status });
    }
    if (isApiError(e)) return NextResponse.json(makeErrorBody(e), { status: e.status });
    Sentry.captureException(e);
    console.error('stats error', e);
    return NextResponse.json(makeErrorBody(e), { status: 500 });
  }
}
