import prisma from '@/lib/prisma'

export type IdempotencyRecord = {
  id: number
  key: string
  userId?: string | null
  tenantId: string
  entityType?: string | null
  entityId?: string | null
  status: 'RESERVED' | 'COMPLETED'
  createdAt: Date
  updatedAt: Date
  expiresAt?: Date | null
}

export async function reserveIdempotencyKey(key: string, userId?: string | null, tenantId?: string) {
  if (!tenantId) {
    throw new Error('tenantId is required to reserve an idempotency key')
  }

  try {
    const rec = await prisma.idempotencyKey.create({
      data: {
        key,
        tenantId,
        userId: userId ?? undefined,
        status: 'RESERVED' as any,
      },
    })
    return rec as unknown as IdempotencyRecord
  } catch (e: any) {
    if (String(e?.code) === 'P2002') {
      const existing = await prisma.idempotencyKey.findUnique({ where: { key } })
      if (existing && existing.tenantId !== tenantId) {
        throw new Error('Idempotency key belongs to a different tenant')
      }
      return existing as unknown as IdempotencyRecord
    }
    throw e
  }
}

export async function finalizeIdempotencyKey(key: string, entityType: string, entityId: string) {
  try {
    const rec = await prisma.idempotencyKey.update({ where: { key }, data: { entityType, entityId, status: 'COMPLETED' as any } })
    return rec as unknown as IdempotencyRecord
  } catch (e) {
    // swallow
    return null
  }
}

export async function findIdempotentResult(key: string, tenantId?: string) {
  const rec = await prisma.idempotencyKey.findUnique({ where: { key } })
  if (!rec) {
    return null
  }
  if (tenantId && rec.tenantId !== tenantId) {
    return null
  }
  return rec as unknown as IdempotencyRecord | null
}
