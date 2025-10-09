import prisma from '@/lib/prisma'
import { scanBuffer } from '@/lib/clamav'
import { captureErrorIfAvailable, logAuditSafe } from '@/lib/observability-helpers'

export type RescanItemResult = { id: string; key: string | null; status: 'clean' | 'infected' | 'no-source' | 'scan-error' }
export type RescanResult = { success: boolean; processed: number; results: RescanItemResult[] }

export async function rescanErroredAttachments(): Promise<RescanResult> {
  const scanUrl = process.env.UPLOADS_AV_SCAN_URL
  if (!scanUrl) {
    try { await logAuditSafe({ action: 'cron:rescan:skipped', details: { reason: 'no_av_config' } }) } catch {}
    return { success: true, processed: 0, results: [] }
  }

  const items = await prisma.attachment.findMany({ where: { avStatus: 'error' }, take: 100 })
  const results: RescanItemResult[] = []

  for (const it of items) {
    try {
      let buf: Buffer | null = null
      try {
        const { getObject } = await import('@/lib/uploads-provider')
        const obj = await getObject(it.key!)
        if (obj) {
          if (Buffer.isBuffer(obj)) buf = obj as Buffer
          else if ((obj as any).arrayBuffer) buf = Buffer.from(await (obj as any).arrayBuffer())
        }
      } catch (e) {
        await captureErrorIfAvailable(e, { route: 'cron:rescan:getObject', key: it.key })
      }

      if (!buf && it.url) {
        try {
          const r = await fetch(it.url)
          if (r.ok) {
            const ab = await r.arrayBuffer()
            buf = Buffer.from(ab)
          }
        } catch (e) {
          await captureErrorIfAvailable(e, { route: 'cron:rescan:fetchUrl', url: it.url })
        }
      }

      if (!buf) {
        results.push({ id: it.id, key: it.key, status: 'no-source' })
        continue
      }

      try {
        const { clean, details } = await scanBuffer(buf)
        await prisma.attachment.update({
          where: { id: it.id },
          data: {
            avStatus: clean ? 'clean' : 'infected',
            avDetails: details,
            avScanAt: new Date(),
            avThreatName: (details as any)?.threat_name || (details as any)?.threatName || null,
            avScanTime: typeof (details as any)?.scan_time === 'number' ? (details as any).scan_time : (typeof (details as any)?.scanTime === 'number' ? (details as any).scanTime : null)
          }
        })
        results.push({ id: it.id, key: it.key, status: clean ? 'clean' : 'infected' })
        try { await logAuditSafe({ action: 'upload:rescan', details: { id: it.id, key: it.key, status: clean ? 'clean' : 'infected' } }) } catch {}

        if (!clean) {
          try {
            const { moveToQuarantine } = await import('@/lib/uploads-provider')
            const moved = await moveToQuarantine(it.key!)
            if (moved && (moved as any).ok) {
              await prisma.attachment.update({ where: { id: it.id }, data: { key: (moved as any).key } })
              try { await logAuditSafe({ action: 'upload:quarantine', details: { attachmentId: it.id, from: it.key, to: (moved as any).key } }) } catch {}
            }
          } catch (e) {
            await captureErrorIfAvailable(e, { route: 'cron:rescan:quarantine', id: it.id })
          }
        }
      } catch (e) {
        results.push({ id: it.id, key: it.key, status: 'scan-error' })
        await captureErrorIfAvailable(e, { route: 'cron:rescan:scan', id: it.id })
      }
    } catch (e) {
      await captureErrorIfAvailable(e, { route: 'cron:rescan', id: it.id })
    }
  }

  return { success: true, processed: results.length, results }
}
