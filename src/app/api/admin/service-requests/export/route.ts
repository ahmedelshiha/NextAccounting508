import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
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
  const filters = {
    status: searchParams.get('status'),
    priority: searchParams.get('priority'),
    assignedTo: searchParams.get('assignedTo'),
    clientId: searchParams.get('clientId'),
    serviceId: searchParams.get('serviceId'),
    q: searchParams.get('q'),
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
    ...tenantFilter(tenantId),
  }

  const header = ['id','uuid','title','status','priority','clientName','clientEmail','serviceName','assignedTo','budgetMin','budgetMax','deadline','createdAt']

  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const write = (line: string) => controller.enqueue(encoder.encode(line + '\n'))
      write(header.join(','))

      const pageSize = 500
      let cursor: string | null = null
      // Page through results to avoid loading all in memory
      // Order by createdAt desc for deterministic pagination
      for (;;) {
        const batch: ServiceRequestWithRelations[] = await prisma.serviceRequest.findMany({
          where,
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
          ].join(',')
          write(row)
        }
        cursor = batch[batch.length - 1]?.id ?? null
        if (!cursor) break
      }

      controller.close()
    }
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
