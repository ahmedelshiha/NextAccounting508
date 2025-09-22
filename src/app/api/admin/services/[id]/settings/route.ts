import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { ServicesService } from '@/services/services.service';
import { PERMISSIONS, hasPermission } from '@/lib/permissions';
import { getTenantFromRequest } from '@/lib/tenant';
import { makeErrorBody, mapPrismaError, mapZodError, isApiError } from '@/lib/api/error-responses';

const svc = new ServicesService();

type Ctx = { params: { id: string } } | { params: Promise<{ id: string }> } | any;

async function resolveId(ctx: any): Promise<string | undefined> {
  try {
    const p = ctx?.params;
    const v = p && typeof p.then === 'function' ? await p : p;
    return v?.id;
  } catch { return undefined }
}

export async function PATCH(request: NextRequest, context: Ctx) {
  try {
    const id = await resolveId(context);
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json(makeErrorBody({ code: 'UNAUTHORIZED', message: 'Unauthorized' } as any), { status: 401 });
    if (!hasPermission(session.user.role, PERMISSIONS.SERVICES_EDIT)) return NextResponse.json(makeErrorBody({ code: 'FORBIDDEN', message: 'Forbidden' } as any), { status: 403 });

    if (!id) return NextResponse.json(makeErrorBody({ code: 'INVALID_ID', message: 'Invalid id' } as any), { status: 400 });

    const body = await request.json().catch(() => ({}));
    const settings = body?.settings ?? null;
    if (!settings || typeof settings !== 'object') return NextResponse.json(makeErrorBody({ code: 'INVALID_PAYLOAD', message: 'settings object required' } as any), { status: 400 });

    const tenantId = getTenantFromRequest(request);
    const result = await svc.bulkUpdateServiceSettings(tenantId, [{ id, settings }]);

    if (result.errors && result.errors.length) {
      return NextResponse.json({ updated: result.updated, errors: result.errors }, { status: 207 });
    }

    await svc.getServiceById(tenantId, id); // prime cache
    return NextResponse.json({ updated: result.updated });
  } catch (e: any) {
    const prismaMapped = mapPrismaError(e);
    if (prismaMapped) return NextResponse.json(makeErrorBody(prismaMapped), { status: prismaMapped.status });
    if (e?.name === 'ZodError') {
      const apiErr = mapZodError(e);
      return NextResponse.json(makeErrorBody(apiErr), { status: apiErr.status });
    }
    if (isApiError(e)) return NextResponse.json(makeErrorBody(e), { status: e.status });
    console.error('settings PATCH error', e);
    return NextResponse.json(makeErrorBody(e), { status: 500 });
  }
}
