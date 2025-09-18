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
