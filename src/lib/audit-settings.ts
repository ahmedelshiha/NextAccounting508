import * as Sentry from '@sentry/nextjs'
import { logAudit } from './audit'

export async function auditSettingsChange(actorId: string | undefined | null, key: string, before: any, after: any) {
  try {
    const details = { before: before ?? null, after: after ?? null }
    await logAudit({ action: `${key}:update`, actorId: actorId ?? null, details })
  } catch (e) {
    try { Sentry.captureException(e as any) } catch {}
  }
}

export default auditSettingsChange
