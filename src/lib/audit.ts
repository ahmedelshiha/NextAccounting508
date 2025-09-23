import prisma from '@/lib/prisma'

import prisma from '@/lib/prisma'

interface AuditEntry {
  action: string
  actorId?: string | null
  targetId?: string | null
  details?: Record<string, unknown> | null
}

export async function logAudit(entry: AuditEntry) {
  const hasDb = Boolean(process.env.NETLIFY_DATABASE_URL)
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
    await prisma.healthLog.create({
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
