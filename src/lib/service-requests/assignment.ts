import prisma from '@/lib/prisma'
import { realtimeService } from '@/lib/realtime-enhanced'
import { tenantFilter, isMultiTenancyEnabled } from '@/lib/tenant'

const ACTIVE_STATUSES = ['ASSIGNED','IN_PROGRESS'] as const

type ActiveStatus = typeof ACTIVE_STATUSES[number]

export async function autoAssignServiceRequest(serviceRequestId: string) {
  const request = await prisma.serviceRequest.findUnique({
    where: { id: serviceRequestId },
    include: { service: { select: { category: true, name: true } } },
  })
  if (!request) return null
  if (request.assignedTeamMemberId) return request

  const tenantId = (request as any)?.tenantId as string | undefined
  const teamMembers = await prisma.teamMember.findMany({
    where: { status: 'active', isAvailable: true, ...(isMultiTenancyEnabled() && tenantId ? (tenantFilter(tenantId) as any) : {}) },
    select: { id: true, name: true, email: true, specialties: true },
  }).catch(async () => {
    return prisma.teamMember.findMany({
      where: { status: 'active', isAvailable: true },
      select: { id: true, name: true, email: true, specialties: true },
    })
  })
  if (!teamMembers.length) return request

  const workloads = await Promise.all(
    teamMembers.map(async (tm) => {
      const count = await prisma.serviceRequest.count({
        where: {
          assignedTeamMemberId: tm.id,
          status: { in: ACTIVE_STATUSES as unknown as ActiveStatus[] },
          ...(isMultiTenancyEnabled() && tenantId ? (tenantFilter(tenantId) as any) : {}),
        },
      })
      const skillMatch = request.service?.category
        ? (tm.specialties ?? []).includes(request.service.category)
        : false
      return { tm, count, skillMatch }
    })
  )

  // Prefer skill matches; then by least workload
  const chosen = workloads
    .sort((a, b) => (Number(b.skillMatch) - Number(a.skillMatch)) || (a.count - b.count))
    [0]

  if (!chosen) return request

  const updated = await prisma.serviceRequest.update({
    where: { id: request.id },
    data: {
      assignedTeamMemberId: chosen.tm.id,
      assignedAt: new Date(),
      status: 'ASSIGNED' as any,
    },
  })

  realtimeService.emitTeamAssignment({
    serviceRequestId: updated.id,
    assignedTeamMemberId: chosen.tm.id,
  })

  return updated
}
