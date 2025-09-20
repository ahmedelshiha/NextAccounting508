import { NextResponse } from 'next/server'
import { captureErrorIfAvailable, logAuditSafe } from '@/lib/observability-helpers'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const secret = process.env.UPLOADS_AV_CALLBACK_SECRET
    if (secret) {
      const header = req.headers.get('x-av-secret') || ''
      if (header !== secret) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => null)
    if (!body || !body.key || !body.result) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })

    const { key, result } = body as any
    const clean = !!result.clean

    // Log audit: av callback received
    try { await logAuditSafe({ action: 'upload:av_callback', details: { key, result } }) } catch {}

    if (clean) {
      // Nothing to do for clean files for now
      return NextResponse.json({ success: true })
    }

    // Update Attachment records if present
    try {
      const { default: prisma } = await import('@/lib/prisma')
      const attach = await prisma.attachment.findUnique({ where: { key } }).catch(() => null)
      if (attach) {
        await prisma.attachment.update({ where: { id: attach.id }, data: {
          avStatus: clean ? 'clean' : 'infected',
          avDetails: result,
          avScanAt: new Date(),
          avThreatName: result?.threat_name || result?.threatName || null,
          avScanTime: typeof result?.scan_time === 'number' ? result.scan_time : (typeof result?.scanTime === 'number' ? result.scanTime : null)
        } })
        try { await logAuditSafe({ action: 'upload:av_update', details: { key, attachmentId: attach.id, avStatus: clean ? 'clean' : 'infected' } }) } catch {}
      } else {
        // Fallback: try text-search on service_requests.attachments JSON
        const rows: any[] = await prisma.$queryRaw`
          SELECT id, attachments FROM service_requests WHERE attachments IS NOT NULL AND attachments::text LIKE ${'%' + key + '%'} LIMIT 50
        `
        for (const row of rows) {
          try {
            const attachments = Array.isArray(row.attachments) ? row.attachments : JSON.parse(row.attachments || '[]')
            let modified = false
            const updated = attachments.map((a: any) => {
              const matches = (a.key === key) || (a.url && String(a.url).includes(key)) || (a.name && String(a.name).includes(key))
              if (matches) {
                modified = true
                return {
                  ...a,
                  avStatus: clean ? 'clean' : 'infected',
                  avDetails: result,
                  avScanAt: new Date().toISOString(),
                  avThreatName: result?.threat_name || result?.threatName || null,
                  avScanTime: typeof result?.scan_time === 'number' ? result.scan_time : (typeof result?.scanTime === 'number' ? result.scanTime : null)
                }
              }
              return a
            })
            if (modified) {
              await prisma.serviceRequest.update({ where: { id: row.id }, data: { attachments: updated } })
              try { await logAuditSafe({ action: 'upload:av_update', details: { key, serviceRequestId: row.id, avStatus: clean ? 'clean' : 'infected' } }) } catch {}
            }
          } catch (e) {
            await captureErrorIfAvailable(e, { route: 'av-callback', step: 'persist-attachments', key })
          }
        }
      }
    } catch (e) {
      await captureErrorIfAvailable(e, { route: 'av-callback', step: 'find-requests' })
    }

    // Attempt to move infected object to quarantine via provider helper
    try {
      const { moveToQuarantine } = await import('@/lib/uploads-provider')
      const moved = await moveToQuarantine(key)
      if (moved && (moved as any).ok) {
        try { await logAuditSafe({ action: 'upload:quarantine', details: { original: key, quarantineKey: (moved as any).key } }) } catch {}
        return NextResponse.json({ success: true, quarantined: true })
      }
    } catch (e) {
      await captureErrorIfAvailable(e, { route: 'av-callback', step: 'move-to-quarantine' })
    }

    // Fallback: record audit and return OK
    return NextResponse.json({ success: true, quarantined: false, note: 'Quarantine not performed automatically; inspect provider or audit logs' })
  } catch (e) {
    await captureErrorIfAvailable(e, { route: 'av-callback' })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
