import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'
export const runtime = 'nodejs'
import type { Prisma } from '@prisma/client'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { getTenantFromRequest, tenantFilter } from '@/lib/tenant'
import { getClientIp, rateLimit } from '@/lib/rate-limit'

type ServiceRequestWithRelations = Prisma.ServiceRequestGetPayload<{
  include: {
    client: { select: { id: true; name: true; email: true } };
    service: { select: { id: true; name: true; slug: true } };
    assignedTeamMember: { select: { id: true; name: true; email: true } };
  };
}>;

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role as string | undefined
  if (!session?.user || !hasPermission(role, PERMISSIONS.ANALYTICS_EXPORT)) return new NextResponse('Unauthorized', { status: 401 })

  // Basic IP rate limit to prevent abuse
  const ip = getClientIp(request)
  if (!rateLimit(`admin:service-requests:export:${ip}`, 3, 60_000)) {
    return new NextResponse('Too Many Requests', { status: 429 })
  }

  const { searchParams } = new URL(request.url)
  const type = (searchParams.get('type') || '').toLowerCase()
  const filters = {
    status: searchParams.get('status'),
    priority: searchParams.get('priority'),
    assignedTo: searchParams.get('assignedTo'),
    clientId: searchParams.get('clientId'),
    serviceId: searchParams.get('serviceId'),
    q: searchParams.get('q'),
    bookingType: searchParams.get('bookingType'),
    dateFrom: searchParams.get('dateFrom'),
    dateTo: searchParams.get('dateTo'),
  }

  const tenantId = getTenantFromRequest(request as any)
  const where: any = {
    ...(filters.status && { status: filters.status }),
    ...(filters.priority && { priority: filters.priority }),
    ...(filters.assignedTo && { assignedTeamMemberId: filters.assignedTo }),
    ...(filters.clientId && { clientId: filters.clientId }),
    ...(filters.serviceId && { serviceId: filters.serviceId }),
    ...(filters.q && { OR: [
      { title: { contains: filters.q, mode: 'insensitive' } },
      { description: { contains: filters.q, mode: 'insensitive' } },
    ] }),
    ...(filters.bookingType && { bookingType: filters.bookingType as any }),
    ...(type === 'appointments' ? { isBooking: true } : {}),
    ...(type === 'requests' ? { OR: [{ isBooking: false }, { isBooking: null }] } : {}),
    ...(filters.dateFrom || filters.dateTo ? (
      type === 'appointments'
        ? {
            scheduledAt: {
              ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
              ...(filters.dateTo ? { lte: new Date(new Date(filters.dateTo).setHours(23,59,59,999)) } : {}),
            },
          }
        : {
            createdAt: {
              ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
              ...(filters.dateTo ? { lte: new Date(new Date(filters.dateTo).setHours(23,59,59,999)) } : {}),
            },
          }
    ) : {}),
    ...tenantFilter(tenantId),
  }

  const header = ['id','uuid','title','status','priority','clientName','clientEmail','serviceName','assignedTo','budgetMin','budgetMax','deadline','createdAt','scheduledAt','isBooking','bookingType']

  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const write = (line: string) => controller.enqueue(encoder.encode(line + '\n'))
      write(header.join(','))

      const pageSize = 500
      let cursor: string | null = null

      try {
        for (;;) {
          const batch: ServiceRequestWithRelations[] = await prisma.serviceRequest.findMany({
            where,
            include: {
              client: { select: { id: true, name: true, email: true } },
              service: { select: { id: true, name: true, slug: true } },
              assignedTeamMember: { select: { id: true, name: true, email: true } },
            },
            orderBy: type === 'appointments' ? { scheduledAt: 'desc' } : { createdAt: 'desc' },
            take: pageSize,
            ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
          })
          if (batch.length === 0) break
          for (const i of batch) {
            const row = [
              i.id,
              i.uuid,
              JSON.stringify(i.title).slice(1,-1),
              i.status,
              i.priority,
              JSON.stringify(i.client?.name ?? '').slice(1,-1),
              i.client?.email ?? '',
              JSON.stringify(i.service?.name ?? '').slice(1,-1),
              JSON.stringify(i.assignedTeamMember?.name ?? '').slice(1,-1),
              i.budgetMin ?? '',
              i.budgetMax ?? '',
              i.deadline ? i.deadline.toISOString() : '',
              i.createdAt.toISOString(),
              (i as any).scheduledAt ? new Date((i as any).scheduledAt as any).toISOString() : '',
              String((i as any).isBooking ?? ''),
              String((i as any).bookingType ?? ''),
            ].join(',')
            write(row)
          }
          cursor = batch[batch.length - 1]?.id ?? null
          if (!cursor) break
        }
      } catch (e: any) {
        const msg = String(e?.message || '')
        const code = String((e as any)?.code || '')
        // Legacy fallback when columns (isBooking/scheduledAt/bookingType) are missing
        if (code === 'P2022' || /column .*does not exist/i.test(msg)) {
          const whereLegacy: any = {
            ...(filters.status && { status: filters.status }),
            ...(filters.priority && { priority: filters.priority }),
            ...(filters.assignedTo && { assignedTeamMemberId: filters.assignedTo }),
            ...(filters.clientId && { clientId: filters.clientId }),
            ...(filters.serviceId && { serviceId: filters.serviceId }),
            ...(filters.q && { OR: [
              { title: { contains: filters.q, mode: 'insensitive' } },
              { description: { contains: filters.q, mode: 'insensitive' } },
            ] }),
            ...(type === 'appointments' ? { deadline: { not: null } } : {}),
            ...tenantFilter(tenantId),
          }
          cursor = null
          for (;;) {
            const batch: ServiceRequestWithRelations[] = await prisma.serviceRequest.findMany({
              where: whereLegacy,
              include: {
                client: { select: { id: true, name: true, email: true } },
                service: { select: { id: true, name: true, slug: true } },
                assignedTeamMember: { select: { id: true, name: true, email: true } },
              },
              orderBy: { createdAt: 'desc' },
              take: pageSize,
              ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
            })
            if (batch.length === 0) break
            for (const i of batch) {
              const row = [
                i.id,
                i.uuid,
                JSON.stringify(i.title).slice(1,-1),
                i.status,
                i.priority,
                JSON.stringify(i.client?.name ?? '').slice(1,-1),
                i.client?.email ?? '',
                JSON.stringify(i.service?.name ?? '').slice(1,-1),
                JSON.stringify(i.assignedTeamMember?.name ?? '').slice(1,-1),
                i.budgetMin ?? '',
                i.budgetMax ?? '',
                i.deadline ? i.deadline.toISOString() : '',
                i.createdAt.toISOString(),
                '', // scheduledAt not available
                '', // isBooking not available
                '', // bookingType not available
              ].join(',')
              write(row)
            }
            cursor = batch[batch.length - 1]?.id ?? null
            if (!cursor) break
          }
        } else {
          // Re-throw to surface 500 to client
          throw e
        }
      }

      controller.close()
    },
    cancel() {}
  })

  return new NextResponse(stream as any, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Content-Disposition': 'attachment; filename="service-requests.csv"',
      'Transfer-Encoding': 'chunked',
    }
  })
}
