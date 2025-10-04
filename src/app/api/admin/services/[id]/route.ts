import { NextRequest, NextResponse } from 'next/server';
import { ServicesService } from '@/services/services.service';
import { PERMISSIONS, hasPermission } from '@/lib/permissions';
import { ServiceUpdateSchema } from '@/schemas/services';
import { withTenantContext } from '@/lib/api-wrapper';
import { requireTenantContext } from '@/lib/tenant-utils';
import { logAudit } from '@/lib/audit';
import { makeErrorBody, mapPrismaError, mapZodError, isApiError } from '@/lib/api/error-responses';
import { createHash } from 'crypto';

const svc = new ServicesService();

type Ctx = { params: { id: string } } | { params: Promise<{ id: string }> } | any;

async function resolveId(ctx: any): Promise<string | undefined> {
  try {
    const p = ctx?.params;
    const v = p && typeof p.then === 'function' ? await p : p;
    return v?.id;
  } catch { return undefined }
}

export const GET = withTenantContext(async (request: NextRequest, context: Ctx) => {
  try {
    const id = await resolveId(context);
    const ctx = requireTenantContext();
    if (!ctx || !ctx.role || !hasPermission(ctx.role, PERMISSIONS.SERVICES_VIEW)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const tenantId = ctx.tenantId;
    if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    const service = await svc.getServiceById(tenantId, String(id));
    if (!service) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const lastMod = new Date(service.updatedAt || service.createdAt || Date.now())
    const etag = '"' + createHash('sha1').update(String(service.id) + '|' + String(service.updatedAt)).digest('hex') + '"'

    const inm = request.headers.get('if-none-match')
    if (inm && inm === etag) {
      return new NextResponse(null, { status: 304, headers: { ETag: etag, 'Last-Modified': lastMod.toUTCString() } })
    }
    const ims = request.headers.get('if-modified-since')
    if (ims && new Date(ims).getTime() >= lastMod.getTime()) {
      return new NextResponse(null, { status: 304, headers: { ETag: etag, 'Last-Modified': lastMod.toUTCString() } })
    }

    return NextResponse.json({ service }, { headers: { 'Cache-Control': 'private, max-age=60', ETag: etag, 'Last-Modified': lastMod.toUTCString() } });
  } catch (e: any) {
    const prismaMapped = mapPrismaError(e);
    if (prismaMapped) return NextResponse.json(makeErrorBody(prismaMapped), { status: prismaMapped.status });
    if (e?.name === 'ZodError') {
      const apiErr = mapZodError(e);
      return NextResponse.json(makeErrorBody(apiErr), { status: apiErr.status });
    }
    if (isApiError(e)) return NextResponse.json(makeErrorBody(e), { status: e.status });
    console.error('service GET error', e);
    return NextResponse.json(makeErrorBody(e), { status: 500 });
  }
});

export const PATCH = withTenantContext(async (request: NextRequest, context: Ctx) => {
  try {
    const id = await resolveId(context);
    const ctx = requireTenantContext();
    if (!ctx || !ctx.role || !hasPermission(ctx.role, PERMISSIONS.SERVICES_EDIT)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    ServiceUpdateSchema.parse({ ...body, id: String(id || '') });

    // Enforce granular permission for changing 'featured'
    if (Object.prototype.hasOwnProperty.call(body, 'featured')) {
      if (!hasPermission(ctx.role, PERMISSIONS.SERVICES_MANAGE_FEATURED)) {
        return NextResponse.json({ error: 'Forbidden: missing permission to manage featured' }, { status: 403 })
      }
    }

    const tenantId = ctx.tenantId;
    if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    const original = await svc.getServiceById(tenantId, id);
    if (!original) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    try {
      const updated = await svc.updateService(tenantId, id, body, ctx.userId as string);
      await logAudit({ action: 'SERVICE_UPDATED', actorId: ctx.userId, targetId: id, details: { fields: Object.keys(body) } });
      return NextResponse.json({ service: updated });
    } catch (err: any) {
      const prismaMapped = mapPrismaError(err);
      if (prismaMapped) return NextResponse.json(makeErrorBody(prismaMapped), { status: prismaMapped.status });
      if (err?.name === 'ZodError') {
        const apiErr = mapZodError(err);
        return NextResponse.json(makeErrorBody(apiErr), { status: apiErr.status });
      }
      if (isApiError(err)) return NextResponse.json(makeErrorBody(err), { status: err.status });
      throw err;
    }
  } catch (e: any) {
    console.error('service PATCH error', e);
    const prismaMapped = mapPrismaError(e);
    if (prismaMapped) return NextResponse.json(makeErrorBody(prismaMapped), { status: prismaMapped.status });
    if (isApiError(e)) return NextResponse.json(makeErrorBody(e), { status: e.status });
    return NextResponse.json(makeErrorBody(e), { status: 500 });
  }
});

export const DELETE = withTenantContext(async (request: NextRequest, context: Ctx) => {
  try {
    const id = await resolveId(context);
    const ctx = requireTenantContext();
    if (!ctx || !ctx.role || !hasPermission(ctx.role, PERMISSIONS.SERVICES_DELETE)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const tenantId = ctx.tenantId;
    if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    const original = await svc.getServiceById(tenantId, id);
    if (!original) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await svc.deleteService(tenantId, id, ctx.userId as string);
    await logAudit({ action: 'SERVICE_DELETED', actorId: ctx.userId, targetId: id });

    return NextResponse.json({ message: 'Service deleted successfully' });
  } catch (e: any) {
    const prismaMapped = mapPrismaError(e);
    if (prismaMapped) return NextResponse.json(makeErrorBody(prismaMapped), { status: prismaMapped.status });
    if (isApiError(e)) return NextResponse.json(makeErrorBody(e), { status: e.status });
    console.error('service DELETE error', e);
    return NextResponse.json(makeErrorBody(e), { status: 500 });
  }
});
