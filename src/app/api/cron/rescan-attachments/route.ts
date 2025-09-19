import { NextResponse } from 'next/server'
import { captureErrorIfAvailable, logAuditSafe } from '@/lib/observability-helpers'
import { scanBuffer } from '@/lib/clamav'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const secret = process.env.CRON_SECRET || process.env.NEXT_CRON_SECRET
    const header = req.headers.get('x-cron-secret') || ''
    if (secret && header !== secret) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { default: prisma } = await import('@/lib/prisma')
    const scanUrl = process.env.UPLOADS_AV_SCAN_URL
    if (!scanUrl) {
      try { await logAuditSafe({ action: 'cron:rescan:skipped', details: { reason: 'no_av_config' } }) } catch {}
      return NextResponse.json({ success: true, processed: 0, note: 'No AV scan URL configured; skipping rescan' })
    }

    const provider = (process.env.UPLOADS_PROVIDER || '').toLowerCase()

    const items = await prisma.attachment.findMany({ where: { avStatus: 'error' }, take: 100 })
    const results: any[] = []

    for (const it of items) {
      try {
        // Fetch object bytes from provider
        let buf: Buffer | null = null
        if (provider === 'netlify') {
          try {
            const dynamicImport = (s: string) => (Function('x', 'return import(x)'))(s) as Promise<any>
            const mod = await dynamicImport('@netlify/blobs').catch(() => null as any)
            if (mod) {
              const Blobs = mod.Blobs || mod.default || mod
              const token = process.env.NETLIFY_BLOBS_TOKEN
              if (token) {
                const store = new Blobs({ token })
                const data = await store.get(it.key!).catch(() => null)
                if (data) {
                  if (Buffer.isBuffer(data)) buf = data as Buffer
                  else if (data.arrayBuffer) buf = Buffer.from(await data.arrayBuffer())
                }
              }
            }
          } catch (e) {
            await captureErrorIfAvailable(e, { route: 'cron:rescan', key: it.key })
          }
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

        // Call AV scan
        try {
          const { clean, details } = await scanBuffer(buf)
          await prisma.attachment.update({
            where: { id: it.id },
            data: {
              avStatus: clean ? 'clean' : 'infected',
              avDetails: details,
              avScanAt: new Date(),
              avThreatName: details?.threat_name || details?.threatName || null,
              avScanTime: typeof details?.scan_time === 'number' ? details.scan_time : (typeof details?.scanTime === 'number' ? details.scanTime : null)
            }
          })
          results.push({ id: it.id, key: it.key, status: clean ? 'clean' : 'infected' })
          try { await logAuditSafe({ action: 'upload:rescan', details: { id: it.id, key: it.key, status: clean ? 'clean' : 'infected' } }) } catch {}

          if (!clean) {
            // attempt quarantine for netlify
            if (provider === 'netlify') {
              try {
                const dynamicImport = (s: string) => (Function('x', 'return import(x)'))(s) as Promise<any>
                const mod = await dynamicImport('@netlify/blobs').catch(() => null as any)
                if (mod) {
                  const Blobs = mod.Blobs || mod.default || mod
                  const token = process.env.NETLIFY_BLOBS_TOKEN
                  if (token) {
                    const store = new Blobs({ token })
                    const data = await store.get(it.key!).catch(() => null)
                    if (data) {
                      const quarantineKey = `quarantine/${it.key}`
                      await store.set(quarantineKey, data, {})
                      if (typeof store.remove === 'function') {
                        try { await store.remove(it.key!) } catch {}
                      }
                      await prisma.attachment.update({ where: { id: it.id }, data: { key: quarantineKey } })
                      try { await logAuditSafe({ action: 'upload:quarantine', details: { attachmentId: it.id, from: it.key, to: quarantineKey } }) } catch {}
                    }
                  }
                }
              } catch (e) {
                await captureErrorIfAvailable(e, { route: 'cron:rescan:quarantine', id: it.id })
              }
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

    return NextResponse.json({ success: true, processed: results.length, results })
  } catch (e) {
    await captureErrorIfAvailable(e, { route: 'cron:rescan' })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
