import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { ServicesService } from '@/services/services.service';
import { PERMISSIONS, hasPermission } from '@/lib/permissions';
import { ServiceFiltersSchema, ServiceSchema } from '@/schemas/services';
import { getTenantFromRequest } from '@/lib/tenant';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { logAudit } from '@/lib/audit';
import { getDemoServicesList } from '@/lib/services/utils';
import { createHash } from 'crypto';

const svc = new ServicesService();

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request as any);
    if (!rateLimit(`services-list:${ip}`, 100, 60_000)) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!hasPermission(session.user.role, PERMISSIONS.SERVICES_VIEW)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const sp = new URL(request.url).searchParams;
    const filters = ServiceFiltersSchema.parse({
      search: sp.get('search') || undefined,
      category: sp.get('category') || 'all',
      featured: (sp.get('featured') as any) || 'all',
      status: (sp.get('status') as any) || 'all',
      limit: sp.get('limit') ? Number(sp.get('limit')) : 20,
      offset: sp.get('offset') ? Number(sp.get('offset')) : 0,
      sortBy: (sp.get('sortBy') as any) || 'updatedAt',
      sortOrder: (sp.get('sortOrder') as any) || 'desc',
    });

    const tenantId = getTenantFromRequest(request);

    // Graceful fallback when DB isn't configured (demo mode)
    if (!process.env.NETLIFY_DATABASE_URL) {
      const result = getDemoServicesList(filters as any)
      await logAudit({ action: 'SERVICES_LIST_VIEW', actorId: session.user.id, details: { filters, demo: true } });
      const etag = '"' + createHash('sha1').update(JSON.stringify({ t: result.total, ids: (result.services||[]).map((s:any)=>s.id), up: (result.services||[]).map((s:any)=>s.updatedAt) })).digest('hex') + '"'
      const ifNoneMatch = request.headers.get('if-none-match')
      if (ifNoneMatch && ifNoneMatch === etag) {
        return new NextResponse(null, { status: 304, headers: { ETag: etag } })
      }
      return NextResponse.json(result, { headers: { 'Cache-Control': 'private, max-age=60', 'X-Total-Count': String(result.total), ETag: etag } });
    }

    const result = await svc.getServicesList(tenantId, filters as any);

    await logAudit({ action: 'SERVICES_LIST_VIEW', actorId: session.user.id, details: { filters } });

    return NextResponse.json(result, { headers: { 'Cache-Control': 'private, max-age=60', 'X-Total-Count': String(result.total) } });
  } catch (e: any) {
    console.error('services GET error', e);
    const code = String(e?.code || '')
    const msg = String(e?.message || '')
    const isSchemaErr = code.startsWith('P10') || code.startsWith('P20') || /relation|table|column|does not exist|schema/i.test(msg)
    if (isSchemaErr) {
      const result = getDemoServicesList({ ...Object.fromEntries(new URL(request.url).searchParams.entries()) } as any)
      return NextResponse.json(result, { headers: { 'Cache-Control': 'private, max-age=60', 'X-Total-Count': String(result.total) } })
    }
    return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request as any);
    if (!rateLimit(`services-create:${ip}`, 10, 60_000)) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!hasPermission(session.user.role, PERMISSIONS.SERVICES_CREATE)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    if (!process.env.NETLIFY_DATABASE_URL) {
      return NextResponse.json({ error: 'Database is not configured. Connect a database to create services.' }, { status: 501 });
    }

    const body = await request.json();
    const validated = ServiceSchema.parse(body);

    const tenantId = getTenantFromRequest(request);
    const service = await svc.createService(tenantId, validated as any, session.user.id);

    await logAudit({ action: 'SERVICE_CREATED', actorId: session.user.id, targetId: service.id, details: { slug: service.slug } });

    return NextResponse.json({ service }, { status: 201 });
  } catch (e: any) {
    const code = String(e?.code || '')
    const rawMsg = String(e?.message || 'Failed to create service')
    const isUnique = code === 'P2002' || /Unique constraint failed|already exists/i.test(rawMsg)
    const msg = isUnique ? 'Slug already exists. Please choose a different slug.' : rawMsg
    const status = isUnique ? 409 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}
