import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { ServicesService } from '@/services/services.service';
import { PERMISSIONS, hasPermission } from '@/lib/permissions';
import { BulkActionSchema } from '@/schemas/services';
import { getTenantFromRequest } from '@/lib/tenant';
import { logAudit } from '@/lib/audit';

const svc = new ServicesService();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!hasPermission(session.user.role, PERMISSIONS.SERVICES_BULK_EDIT)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    if (!process.env.NETLIFY_DATABASE_URL) {
      return NextResponse.json({ error: 'Database is not configured. Connect a database to perform bulk actions.' }, { status: 501 });
    }

    const body = await request.json();
    const data = BulkActionSchema.parse(body);

    const tenantId = getTenantFromRequest(request);
    const result = await svc.performBulkAction(tenantId, data as any, session.user.id);

    await logAudit({ action: 'SERVICES_BULK_ACTION', actorId: session.user.id, details: { action: data.action, count: result.updatedCount } });

    return NextResponse.json({ message: `Successfully ${data.action} ${result.updatedCount} services`, result });
  } catch (e) {
    console.error('bulk error', e);
    return NextResponse.json({ error: 'Failed to perform bulk action' }, { status: 500 });
  }
}
