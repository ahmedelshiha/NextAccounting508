import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { ServicesService } from '@/services/services.service';
import { PERMISSIONS, hasPermission } from '@/lib/permissions';
import { getTenantFromRequest } from '@/lib/tenant';

const svc = new ServicesService();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!hasPermission(session.user.role, PERMISSIONS.SERVICES_VIEW)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    if (!process.env.NETLIFY_DATABASE_URL) {
      return NextResponse.json({ error: 'Database is not configured. Connect a database to view service statistics.' }, { status: 501 });
    }

    const sp = new URL(request.url).searchParams;
    const range = sp.get('range') || '30d';

    const tenantId = getTenantFromRequest(request);
    const stats = await svc.getServiceStats(tenantId, range);
    return NextResponse.json(stats, { headers: { 'Cache-Control': 'private, max-age=300' } });
  } catch (e) {
    console.error('stats error', e);
    return NextResponse.json({ error: 'Failed to fetch service statistics' }, { status: 500 });
  }
}
