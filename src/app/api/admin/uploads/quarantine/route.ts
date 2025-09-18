import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { captureErrorIfAvailable, logAuditSafe } from '@/lib/observability-helpers'

export const runtime = 'nodejs'

async function requireAdmin(req: Request) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role as string | undefined
  if (!session?.user || !hasPermission(role, PERMISSIONS.ANALYTICS_VIEW)) return null
  return session
}

export async function GET(req: Request) {
  const session = await requireAdmin(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const provider = (process.env.UPLOADS_PROVIDER || '').toLowerCase()
  if (provider !== 'netlify') return NextResponse.json({ error: 'Quarantine listing not supported for provider' }, { status: 501 })

  try {
    const dynamicImport = (s: string) => (Function('x', 'return import(x)'))(s) as Promise<any>
    const mod = await dynamicImport('@netlify/blobs').catch(() => null as any)
    if (!mod) return NextResponse.json({ error: 'Netlify Blobs SDK not available' }, { status: 501 })
    const Blobs = mod.Blobs || mod.default || mod
    const token = process.env.NETLIFY_BLOBS_TOKEN
    if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 501 })
    const store = new Blobs({ token })

    if (typeof store.list !== 'function') return NextResponse.json({ error: 'Provider list not supported' }, { status: 501 })

    const items = await store.list({ prefix: 'quarantine/' }).catch((e: any) => { throw e })
    return NextResponse.json({ success: true, data: items })
  } catch (e) {
    await captureErrorIfAvailable(e, { route: 'admin/uploads/quarantine' })
    return NextResponse.json({ error: 'Failed to list quarantine' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await requireAdmin(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body || !body.action || !body.key) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })

  const { action, key } = body as any
  const provider = (process.env.UPLOADS_PROVIDER || '').toLowerCase()
  if (provider !== 'netlify') return NextResponse.json({ error: 'Action not supported for provider' }, { status: 501 })

  try {
    const dynamicImport = (s: string) => (Function('x', 'return import(x)'))(s) as Promise<any>
    const mod = await dynamicImport('@netlify/blobs').catch(() => null as any)
    if (!mod) return NextResponse.json({ error: 'Netlify Blobs SDK not available' }, { status: 501 })
    const Blobs = mod.Blobs || mod.default || mod
    const token = process.env.NETLIFY_BLOBS_TOKEN
    if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 501 })
    const store = new Blobs({ token })

    if (action === 'delete') {
      if (typeof store.remove !== 'function') return NextResponse.json({ error: 'Delete not supported' }, { status: 501 })
      await store.remove(key).catch((e: any) => { throw e })
      try { await logAuditSafe({ action: 'upload:quarantine:delete', actorId: (session.user as any).id ?? null, details: { key } }) } catch {}
      return NextResponse.json({ success: true })
    }

    if (action === 'release') {
      // move from quarantine/ to public/ (best-effort)
      const publicKey = key.replace(/^quarantine\//, 'uploads/')
      try {
        const data = await store.get(key).catch(() => null)
        if (!data) return NextResponse.json({ error: 'Source not found' }, { status: 404 })
        await store.set(publicKey, data, {})
        if (typeof store.remove === 'function') {
          try { await store.remove(key) } catch {}
        }
        try { await logAuditSafe({ action: 'upload:quarantine:release', actorId: (session.user as any).id ?? null, details: { from: key, to: publicKey } }) } catch {}
        return NextResponse.json({ success: true, key: publicKey })
      } catch (e) {
        await captureErrorIfAvailable(e, { route: 'admin/uploads/quarantine', action: 'release' })
        return NextResponse.json({ error: 'Release failed' }, { status: 500 })
      }
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e) {
    await captureErrorIfAvailable(e, { route: 'admin/uploads/quarantine' })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
