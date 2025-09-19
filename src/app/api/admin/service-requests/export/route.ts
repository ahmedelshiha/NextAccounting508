import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { getTenantFromRequest, tenantFilter } from '@/lib/tenant'

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role as string | undefined
  if (!session?.user || !hasPermission(role, PERMISSIONS.ANALYTICS_EXPORT)) return new NextResponse('Unauthorized', { status: 401 })

  const tenantId = getTenantFromRequest(request as any)

  const items = await prisma.serviceRequest.findMany({
    where: { ...tenantFilter(tenantId) },
    include: {
      client: { select: { id: true, name: true, email: true } },
      service: { select: { id: true, name: true, slug: true } },
      assignedTeamMember: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const header = ['id','uuid','title','status','priority','clientName','clientEmail','serviceName','assignedTo','budgetMin','budgetMax','deadline','createdAt']
  const rows = items.map((i) => [
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
  ].join(','))

  const csv = [header.join(','), ...rows].join('\n')
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="service-requests.csv"',
    }
  })
}
