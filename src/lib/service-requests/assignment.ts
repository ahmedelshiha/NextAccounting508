import prisma from '@/lib/prisma'
import { CacheService } from '@/lib/cache.service'
import { realtimeService } from '@/lib/realtime-enhanced'
import { tenantFilter, isMultiTenancyEnabled } from '@/lib/tenant'
import servicesSettingsService, { DEFAULT_SERVICES_SETTINGS } from '@/services/services-settings.service'
import type { ServiceRequestSettings } from '@/schemas/settings/services'

const ACTIVE_STATUSES = ['ASSIGNED', 'IN_PROGRESS'] as const
const ROTATION_CACHE_TTL_SECONDS = 3600
const ROTATION_CACHE_KEY_PREFIX = 'service-requests:auto-assign:last-member'

const rotationCache = new CacheService()

type ActiveStatus = (typeof ACTIVE_STATUSES)[number]

type CandidateWorkload = {
  tm: {
    id: string
    name: string
    email: string | null
    specialties: string[] | null
  }
  count: number
  skillMatch: boolean
}

function rotationKey(tenantId: string | null) {
  return `${ROTATION_CACHE_KEY_PREFIX}:${tenantId ?? 'default'}`
}

function selectLoadBased(candidates: CandidateWorkload[]) {
  if (!candidates.length) return null
  return [...candidates].sort((a, b) => (a.count - b.count) || a.tm.id.localeCompare(b.tm.id))[0]
}

function selectSkillBased(candidates: CandidateWorkload[]) {
  if (!candidates.length) return null
  const skillMatches = candidates.filter((entry) => entry.skillMatch)
  if (skillMatches.length) return selectLoadBased(skillMatches)
  return selectLoadBased(candidates)
}

async function selectRoundRobin(candidates: CandidateWorkload[], tenantId: string | null) {
  if (!candidates.length) return null
  const ordered = [...candidates].sort((a, b) => a.tm.id.localeCompare(b.tm.id))
  const key = rotationKey(tenantId)
  const last = await rotationCache.get<string>(key)
  const currentIndex = last ? ordered.findIndex((entry) => entry.tm.id === last) : -1
  const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % ordered.length : 0
  const chosen = ordered[nextIndex]
  await rotationCache.set(key, chosen.tm.id, ROTATION_CACHE_TTL_SECONDS)
  return chosen
}

async function resolveAssignee(
  candidates: CandidateWorkload[],
  settings: ServiceRequestSettings,
  tenantId: string | null,
) {
  switch (settings.autoAssignStrategy) {
    case 'skill_based':
      return selectSkillBased(candidates)
    case 'round_robin':
      return selectRoundRobin(candidates, tenantId)
    case 'load_based':
    default:
      return selectLoadBased(candidates)
  }
}

function resolveAssignmentStatus(settings: ServiceRequestSettings) {
  const preferred = settings.defaultRequestStatus
  return preferred === 'ASSIGNED' || preferred === 'IN_PROGRESS' ? preferred : 'ASSIGNED'
}

export async function autoAssignServiceRequest(serviceRequestId: string) {
  const request = await prisma.serviceRequest.findUnique({
    where: { id: serviceRequestId },
    include: { service: { select: { category: true, name: true } } },
  })
  if (!request) return null
  if (request.assignedTeamMemberId) return request

  const tenantId = (request as any)?.tenantId ? String((request as any).tenantId) : null

  let settings: ServiceRequestSettings
  try {
    settings = (await servicesSettingsService.get(tenantId)).serviceRequests
  } catch {
    settings = DEFAULT_SERVICES_SETTINGS.serviceRequests
  }

  if (!settings.autoAssign) {
    return request
  }

  const teamMembers = await prisma.teamMember
    .findMany({
      where: {
        status: 'active',
        isAvailable: true,
        ...(isMultiTenancyEnabled() && tenantId ? (tenantFilter(tenantId) as any) : {}),
      },
      select: { id: true, name: true, email: true, specialties: true },
    })
    .catch(async () => {
      return prisma.teamMember.findMany({
        where: { status: 'active', isAvailable: true },
        select: { id: true, name: true, email: true, specialties: true },
      })
    })
  if (!teamMembers.length) return request

  const workloads: CandidateWorkload[] = await Promise.all(
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
    }),
  )

  const candidate = await resolveAssignee(workloads, settings, tenantId)
  if (!candidate) return request

  const statusForAssignment = resolveAssignmentStatus(settings)

  const updated = await prisma.serviceRequest.update({
    where: { id: request.id },
    data: {
      assignedTeamMemberId: candidate.tm.id,
      assignedAt: new Date(),
      status: statusForAssignment as any,
    },
  })

  realtimeService.emitTeamAssignment({
    serviceRequestId: updated.id,
    assignedTeamMemberId: candidate.tm.id,
  })

  return updated
}
