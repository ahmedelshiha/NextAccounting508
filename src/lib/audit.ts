import prisma from '@/lib/prisma'

interface AuditEntry {
  action: string
  actorId?: string | null
  targetId?: string | null
  details?: Record<string, unknown> | null
}

export async function logAudit(entry: AuditEntry) {
  const hasDb = Boolean(process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL)
  const message = JSON.stringify({
    action: entry.action,
    actorId: entry.actorId ?? null,
    targetId: entry.targetId ?? null,
    details: entry.details ?? null,
    at: new Date().toISOString(),
  })

  if (!hasDb) {
    console.info('[AUDIT]', message)
    return { ok: true, stored: false }
  }

  try {
    const target: any = (prisma as any)
    if (!target?.healthLog || typeof target.healthLog.create !== 'function') {
      console.info('[AUDIT]', message)
      return { ok: true, stored: false }
    }
    await target.healthLog.create({
      data: {
        service: 'AUDIT',
        status: 'INFO',
        message,
      },
    })
    return { ok: true, stored: true }
  } catch (e) {
    console.error('Failed to persist audit log', e)
    return { ok: false, stored: false }
  }
}
