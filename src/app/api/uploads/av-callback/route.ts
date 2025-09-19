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
                return { ...a, avStatus: clean ? 'clean' : 'infected', avDetails: result }
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

    // Infected -> attempt to move to quarantine if provider supports it
    const provider = (process.env.UPLOADS_PROVIDER || '').toLowerCase()
    if (provider === 'netlify') {
      try {
        const dynamicImport = (s: string) => (Function('x', 'return import(x)'))(s) as Promise<any>
        const mod = await dynamicImport('@netlify/blobs').catch(() => null as any)
        if (mod) {
          const Blobs = mod.Blobs || mod.default || mod
          const token = process.env.NETLIFY_BLOBS_TOKEN
          if (token) {
            const store = new Blobs({ token })
            const quarantineKey = `quarantine/${key}`
            // Try to read original and write to quarantine
            try {
              // some SDKs may expose get as Buffer or stream
              const data = await store.get(key).catch(() => null)
              if (data) {
                await store.set(quarantineKey, data, {})
                // remove original if supported
                if (typeof store.remove === 'function') {
                  try { await store.remove(key) } catch {}
                }
                try { await logAuditSafe({ action: 'upload:quarantine', details: { original: key, quarantineKey } }) } catch {}
                return NextResponse.json({ success: true, quarantined: true })
              }
            } catch (e) {
              await captureErrorIfAvailable(e, { route: 'av-callback', provider: 'netlify' })
            }
          }
        }
      } catch (e) {
        await captureErrorIfAvailable(e, { route: 'av-callback', provider: 'netlify' })
      }
    }

    // Fallback: record audit and return OK
    return NextResponse.json({ success: true, quarantined: false, note: 'Quarantine not performed automatically; inspect provider or audit logs' })
  } catch (e) {
    await captureErrorIfAvailable(e, { route: 'av-callback' })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
