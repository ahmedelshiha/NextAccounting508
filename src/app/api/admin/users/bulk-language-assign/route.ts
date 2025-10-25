import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { logAudit } from '@/lib/audit'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export interface BulkLanguageAssignRequest {
  userIds: string[]
  targetLanguage: string
}

export interface BulkLanguageAssignResponse {
  success: boolean
  updated: number
  failed: number
  errors: string[]
}

export const POST = async (request: Request) => {
  try {
    const ctx = requireTenantContext()
    
    if (!ctx.userId || !hasPermission(ctx.role, PERMISSIONS.USERS_MANAGE)) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = ctx.tenantId
    if (!tenantId) {
      return Response.json({ error: 'Tenant context required' }, { status: 400 })
    }

    const body: BulkLanguageAssignRequest = await request.json()
    const { userIds, targetLanguage } = body

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return Response.json(
        { error: 'userIds must be a non-empty array' },
        { status: 400 }
      )
    }

    if (!targetLanguage || typeof targetLanguage !== 'string' || !targetLanguage.trim()) {
      return Response.json(
        { error: 'targetLanguage must be a non-empty string' },
        { status: 400 }
      )
    }

    let updated = 0
    let failed = 0
    const errors: string[] = []

    for (const userId of userIds) {
      try {
        const userProfile = await prisma.userProfile.findUnique({
          where: { userId },
          include: { user: true },
        })

        if (!userProfile) {
          errors.push(`User ${userId} not found`)
          failed++
          continue
        }

        if (userProfile.user.tenantId !== tenantId) {
          errors.push(`User ${userId} not in current tenant`)
          failed++
          continue
        }

        await prisma.userProfile.update({
          where: { userId },
          data: { preferredLanguage: targetLanguage },
        })

        await logAudit({
          action: 'user_language_assignment_bulk',
          actorId: ctx.userId,
          targetId: userId,
          details: {
            resourceType: 'user',
            targetLanguage,
            tenantId,
          },
        })

        updated++
      } catch (err: any) {
        errors.push(`Failed to update user ${userId}: ${err?.message || 'Unknown error'}`)
        failed++
      }
    }

    const response: BulkLanguageAssignResponse = {
      success: failed === 0,
      updated,
      failed,
      errors,
    }

    return Response.json({ success: true, data: response }, { status: 200 })
  } catch (error: any) {
    console.error('Failed to bulk assign user languages:', error)
    return Response.json(
      { error: error.message || 'Failed to assign languages' },
      { status: 500 }
    )
  }
}
