import { NextRequest, NextResponse } from 'next/server';
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

export async function GET(request: NextRequest, context: Ctx) {
  try {
    const id = await resolveId(context);
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json(makeErrorBody({ code: 'UNAUTHORIZED', message: 'Unauthorized' } as any), { status: 401 });
    if (!hasPermission(session.user.role, PERMISSIONS.SERVICES_VIEW)) return NextResponse.json(makeErrorBody({ code: 'FORBIDDEN', message: 'Forbidden' } as any), { status: 403 });

    if (!id) return NextResponse.json(makeErrorBody({ code: 'INVALID_ID', message: 'Invalid id' } as any), { status: 400 });

    const tenantId = getTenantFromRequest(request);
    const versions = await svc.getServiceVersionHistory(id);

    return NextResponse.json({ versions });
  } catch (e: any) {
    const prismaMapped = mapPrismaError(e);
    if (prismaMapped) return NextResponse.json(makeErrorBody(prismaMapped), { status: prismaMapped.status });
    if (e?.name === 'ZodError') {
      const apiErr = mapZodError(e);
      return NextResponse.json(makeErrorBody(apiErr), { status: apiErr.status });
    }
    if (isApiError(e)) return NextResponse.json(makeErrorBody(e), { status: e.status });
    console.error('versions error', e);
    return NextResponse.json(makeErrorBody(e), { status: 500 });
  }
}
