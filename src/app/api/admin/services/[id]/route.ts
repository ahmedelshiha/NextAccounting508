import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { ServicesService } from '@/services/services.service';
import { PERMISSIONS, hasPermission } from '@/lib/permissions';
import { ServiceUpdateSchema } from '@/schemas/services';
import { getTenantFromRequest } from '@/lib/tenant';
import { logAudit } from '@/lib/audit';

const svc = new ServicesService();

interface Ctx { params: Promise<{ id: string }>; }

export async function GET(request: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!hasPermission(session.user.role, PERMISSIONS.SERVICES_VIEW)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const tenantId = getTenantFromRequest(request);
    const service = await svc.getServiceById(tenantId, id);
    if (!service) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ service });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch service' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!hasPermission(session.user.role, PERMISSIONS.SERVICES_EDIT)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    ServiceUpdateSchema.parse({ ...body, id });

    const tenantId = getTenantFromRequest(request);
    const original = await svc.getServiceById(tenantId, id);
    if (!original) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const updated = await svc.updateService(tenantId, id, body, session.user.id);

    await logAudit({ action: 'SERVICE_UPDATED', actorId: session.user.id, targetId: id, details: { fields: Object.keys(body) } });

    return NextResponse.json({ service: updated });
  } catch (e) {
    console.error('service PATCH error', e);
    return NextResponse.json({ error: 'Failed to update service' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!hasPermission(session.user.role, PERMISSIONS.SERVICES_DELETE)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const tenantId = getTenantFromRequest(request);
    const original = await svc.getServiceById(tenantId, id);
    if (!original) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await svc.deleteService(tenantId, id, session.user.id);
    await logAudit({ action: 'SERVICE_DELETED', actorId: session.user.id, targetId: id });

    return NextResponse.json({ message: 'Service deleted successfully' });
  } catch {
    return NextResponse.json({ error: 'Failed to delete service' }, { status: 500 });
  }
}
