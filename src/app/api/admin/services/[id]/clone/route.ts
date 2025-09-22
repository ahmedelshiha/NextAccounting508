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

export async function POST(request: NextRequest, context: Ctx) {
  try {
    const id = await resolveId(context);
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json(makeErrorBody({ code: 'UNAUTHORIZED', message: 'Unauthorized' } as any), { status: 401 });
    if (!hasPermission(session.user.role, PERMISSIONS.SERVICES_CREATE)) return NextResponse.json(makeErrorBody({ code: 'FORBIDDEN', message: 'Forbidden' } as any), { status: 403 });

    if (!id) return NextResponse.json(makeErrorBody({ code: 'INVALID_ID', message: 'Invalid id' } as any), { status: 400 });

    const body = await request.json().catch(() => ({}));
    const name = body?.name ? String(body.name).trim() : undefined;

    // Fetch original to provide sensible default name
    const tenantId = getTenantFromRequest(request);
    const original = await svc.getServiceById(tenantId, id);
    if (!original) return NextResponse.json(makeErrorBody({ code: 'NOT_FOUND', message: 'Source service not found' } as any), { status: 404 });

    const cloneName = name || `${original.name} (copy)`;
    const created = await svc.cloneService(cloneName, id);

    return NextResponse.json({ service: created }, { status: 201 });
  } catch (e: any) {
    const prismaMapped = mapPrismaError(e);
    if (prismaMapped) return NextResponse.json(makeErrorBody(prismaMapped), { status: prismaMapped.status });
    if (e?.name === 'ZodError') {
      const apiErr = mapZodError(e);
      return NextResponse.json(makeErrorBody(apiErr), { status: apiErr.status });
    }
    if (isApiError(e)) return NextResponse.json(makeErrorBody(e), { status: e.status });
    console.error('clone service error', e);
    return NextResponse.json(makeErrorBody(e), { status: 500 });
  }
}
