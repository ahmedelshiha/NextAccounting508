import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { ServicesService } from '@/services/services.service';
import { PERMISSIONS, hasPermission } from '@/lib/permissions';
import { ServiceUpdateSchema } from '@/schemas/services';
import { getTenantFromRequest } from '@/lib/tenant';
import { logAudit } from '@/lib/audit';

const svc = new ServicesService();

type Ctx = { params: { id: string } } | { params: Promise<{ id: string }> } | any;

async function resolveId(ctx: any): Promise<string | undefined> {
  try {
    const p = ctx?.params;
    const v = p && typeof p.then === 'function' ? await p : p;
    return v?.id;
  } catch { return undefined }
}

export async function GET(request: NextRequest, context: Ctx) {
  try {
    const id = await resolveId(context);
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

export async function PATCH(request: NextRequest, context: Ctx) {
  try {
    const id = await resolveId(context);
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!hasPermission(session.user.role, PERMISSIONS.SERVICES_EDIT)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });


    const body = await request.json();
    ServiceUpdateSchema.parse({ ...body, id: String(id || '') });

    const tenantId = getTenantFromRequest(request);
    if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    const original = await svc.getServiceById(tenantId, id);
    if (!original) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    try {
      const updated = await svc.updateService(tenantId, id, body, session.user.id);
      await logAudit({ action: 'SERVICE_UPDATED', actorId: session.user.id, targetId: id, details: { fields: Object.keys(body) } });
      return NextResponse.json({ service: updated });
    } catch (err: any) {
      const code = String(err?.code || '')
      const msg = String(err?.message || '')
      const isUnique = code === 'P2002' || /Unique constraint failed|already exists|slug.*exists/i.test(msg)
      if (isUnique) return NextResponse.json({ error: 'Slug already exists. Please choose a different slug.' }, { status: 409 })
      throw err
    }
  } catch (e) {
    console.error('service PATCH error', e);
    return NextResponse.json({ error: 'Failed to update service' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: Ctx) {
  try {
    const id = await resolveId(context);
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!hasPermission(session.user.role, PERMISSIONS.SERVICES_DELETE)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });


    const tenantId = getTenantFromRequest(request);
    if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    const original = await svc.getServiceById(tenantId, id);
    if (!original) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await svc.deleteService(tenantId, id, session.user.id);
    await logAudit({ action: 'SERVICE_DELETED', actorId: session.user.id, targetId: id });

    return NextResponse.json({ message: 'Service deleted successfully' });
  } catch {
    return NextResponse.json({ error: 'Failed to delete service' }, { status: 500 });
  }
}
