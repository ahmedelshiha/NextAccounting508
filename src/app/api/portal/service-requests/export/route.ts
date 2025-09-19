import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { getTenantFromRequest, tenantFilter } from '@/lib/tenant'
import { getClientIp, rateLimit } from '@/lib/rate-limit'

export const runtime = 'nodejs'

function toCsvValue(v: unknown): string {
  const s = v == null ? '' : String(v)
  return '"' + s.replace(/"/g, '""') + '"'
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const ip = getClientIp(req as any)
  if (!rateLimit(`portal:service-requests:export:${ip}`, 3, 60_000)) {
    return new NextResponse('Too many requests', { status: 429 })
  }

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || undefined
  const priority = searchParams.get('priority') || undefined
  const q = searchParams.get('q')?.trim() || undefined

  const tenantId = getTenantFromRequest(req as any)
  const where: any = {
    clientId: session.user.id,
    ...(status && { status }),
    ...(priority && { priority }),
    ...(q && {
      OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ],
    }),
    ...tenantFilter(tenantId),
  }

  try {
    const items = await prisma.serviceRequest.findMany({
      where,
      include: { service: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5000,
    })

    const header = ['id','title','service','priority','status','createdAt']
    const rows = items.map((r: any) => [
      r.id,
      r.title,
      r.service?.name || '',
      r.priority,
      r.status,
      r.createdAt?.toISOString?.() || r.createdAt,
    ])

    const csv = [header.map(toCsvValue).join(','), ...rows.map((row) => row.map(toCsvValue).join(','))].join('\n')
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="service-requests-${new Date().toISOString().slice(0,10)}.csv"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (e: any) {
    if (String(e?.code || '').startsWith('P20')) {
      try {
        const { getAllRequests } = await import('@/lib/dev-fallbacks')
        const all = getAllRequests()
        const filtered = all.filter((r: any) => r.clientId === session.user.id && (!tenantId || r.tenantId === tenantId))
        const header = ['id','title','service','priority','status','createdAt']
        const rows = filtered.map((r: any) => [
          r.id,
          r.title,
          r.service?.name || '',
          r.priority,
          r.status,
          r.createdAt,
        ])
        const csv = [header.map(toCsvValue).join(','), ...rows.map((row) => row.map(toCsvValue).join(','))].join('\n')
        return new NextResponse(csv, {
          status: 200,
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="service-requests-${new Date().toISOString().slice(0,10)}.csv"`,
            'Cache-Control': 'no-store',
          },
        })
      } catch {}
    }
    throw e
  }
}
