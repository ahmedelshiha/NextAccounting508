import prisma from '@/lib/prisma'
import type { Prisma } from '@prisma/client'
import * as Sentry from '@sentry/nextjs'

/**
 * Helper to persist setting changes with audit trail
 * Captures before/after state and emits audit event
 */
export async function persistSettingChangeDiff({
  tenantId,
  category,
  resource,
  userId,
  before,
  after,
}: {
  tenantId: string
  category: string
  resource: string
  userId?: string | null
  before?: any
  after: any
}): Promise<void> {
  if (!tenantId || !resource) {
    console.warn('persistSettingChangeDiff: missing required fields')
    return
  }

  try {
    const actorUserId = userId ? String(userId) : undefined

    // Persist change diff
    const diffPayload: Prisma.SettingChangeDiffUncheckedCreateInput = {
      tenantId,
      category,
      resource,
      ...(actorUserId ? { userId: actorUserId } : {}),
      ...(before !== undefined ? { before: before as Prisma.InputJsonValue } : {}),
      after: after as Prisma.InputJsonValue,
    }

    // Persist audit event
    const auditPayload: Prisma.AuditEventUncheckedCreateInput = {
      tenantId,
      type: 'settings.update',
      resource,
      details: { category } as Prisma.InputJsonValue,
      ...(actorUserId ? { userId: actorUserId } : {}),
    }

    // Execute both, but don't fail the main operation if they fail
    await Promise.all([
      prisma.settingChangeDiff.create({ data: diffPayload }).catch((e) => {
        console.error(`Failed to create SettingChangeDiff for ${resource}:`, e)
      }),
      prisma.auditEvent.create({ data: auditPayload }).catch((e) => {
        console.error(`Failed to create AuditEvent for ${resource}:`, e)
      }),
    ])
  } catch (error) {
    console.error('persistSettingChangeDiff error:', error)
    try {
      Sentry.captureException(error)
    } catch {}
  }
}

/**
 * Extract changed fields between before and after objects
 */
export function getChangedFields(before: any, after: any): string[] {
  if (!before || !after) return Object.keys(after || {})

  const changed: string[] = []
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)])

  allKeys.forEach((key) => {
    const beforeVal = JSON.stringify(before[key])
    const afterVal = JSON.stringify(after[key])
    if (beforeVal !== afterVal) {
      changed.push(key)
    }
  })

  return changed
}
