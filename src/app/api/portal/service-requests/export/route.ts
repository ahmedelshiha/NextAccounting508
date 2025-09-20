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
  const type = searchParams.get('type') || undefined
  const bookingType = searchParams.get('bookingType') || undefined
  const dateFrom = searchParams.get('dateFrom') || undefined
  const dateTo = searchParams.get('dateTo') || undefined

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
    ...(type === 'appointments' ? { isBooking: true } : {}),
    ...(bookingType ? { bookingType } : {}),
    ...((dateFrom || dateTo) ? (
      type === 'appointments'
        ? { scheduledAt: {
            ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
            ...(dateTo ? { lte: new Date(new Date(dateTo).setHours(23,59,59,999)) } : {}),
          } }
        : { createdAt: {
            ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
            ...(dateTo ? { lte: new Date(new Date(dateTo).setHours(23,59,59,999)) } : {}),
          } }
    ) : {}),
    ...tenantFilter(tenantId),
  }

  try {
    const items = await prisma.serviceRequest.findMany({
      where,
      include: { service: { select: { name: true } } },
      orderBy: type === 'appointments' ? { scheduledAt: 'desc' } : { createdAt: 'desc' },
      take: 5000,
    })

    const header = ['id','title','service','priority','status','createdAt','scheduledAt','bookingType']
    const rows = items.map((r: any) => [
      r.id,
      r.title,
      r.service?.name || '',
      r.priority,
      r.status,
      r.createdAt?.toISOString?.() || r.createdAt,
      r.scheduledAt?.toISOString?.() || r.scheduledAt || '',
      r.bookingType || '',
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
        let all = getAllRequests()
        all = all.filter((r: any) => r.clientId === session.user.id && (!tenantId || r.tenantId === tenantId))
        if (type === 'appointments') all = all.filter((r: any) => !!((r as any).scheduledAt || r.deadline))
        if (status) all = all.filter((r: any) => String(r.status) === String(status))
        if (priority) all = all.filter((r: any) => String(r.priority) === String(priority))
        if (bookingType) all = all.filter((r: any) => String((r as any).bookingType || '') === String(bookingType))
        if (q) {
          const qq = String(q).toLowerCase()
          all = all.filter((r: any) => String(r.title || '').toLowerCase().includes(qq) || String(r.description || '').toLowerCase().includes(qq))
        }
        if (dateFrom) {
          const from = new Date(dateFrom).getTime()
          all = all.filter((r: any) => new Date((r as any).scheduledAt || r.createdAt || 0).getTime() >= from)
        }
        if (dateTo) {
          const to = new Date(new Date(dateTo).setHours(23,59,59,999)).getTime()
          all = all.filter((r: any) => new Date((r as any).scheduledAt || r.createdAt || 0).getTime() <= to)
        }
        const header = ['id','title','service','priority','status','createdAt','scheduledAt','bookingType']
        const rows = all.map((r: any) => [
          r.id,
          r.title,
          r.service?.name || '',
          r.priority,
          r.status,
          r.createdAt,
          (r as any).scheduledAt || '',
          (r as any).bookingType || '',
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
