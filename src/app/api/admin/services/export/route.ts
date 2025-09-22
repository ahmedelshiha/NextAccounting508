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
    if (!hasPermission(session.user.role, PERMISSIONS.SERVICES_EXPORT)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });


    const sp = new URL(request.url).searchParams;
    const format = sp.get('format') || 'csv';
    const includeInactive = sp.get('includeInactive') === 'true';

    const tenantId = getTenantFromRequest(request);
    const data = await svc.exportServices(tenantId, { format, includeInactive });

    const ts = new Date().toISOString().split('T')[0];
    const filename = `services-export-${ts}.${format}`;

    if (format === 'csv') {
      return new NextResponse(data, { headers: { 'Content-Type': 'text/csv', 'Content-Disposition': `attachment; filename="${filename}"` } });
    }

    return NextResponse.json(JSON.parse(data));
  } catch (e) {
    console.error('export error', e);
    return NextResponse.json({ error: 'Failed to export services' }, { status: 500 });
  }
}
