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
    const url = new URL(req.url)
    const serviceRequestId = url.searchParams.get('serviceRequestId') || undefined
    const q = url.searchParams.get('q') || undefined

    // Fetch DB attachments flagged as infected/quarantined with optional filters
    const { default: prisma } = await import('@/lib/prisma')
    const where: any = { OR: [{ avStatus: 'infected' }, { avStatus: 'error' }] }
    if (serviceRequestId) where.serviceRequestId = serviceRequestId
    if (q) {
      where.OR = [
        ...(where.OR || []),
        { name: { contains: q, mode: 'insensitive' } },
        { key: { contains: q, mode: 'insensitive' } },
      ]
    }
    const dbItems = await prisma.attachment.findMany({ where, orderBy: { uploadedAt: 'desc' }, take: 200 })

    // Try provider listing as well (optional)
    const dynamicImport = (s: string) => (Function('x', 'return import(x)'))(s) as Promise<any>
    const mod = await dynamicImport('@netlify/blobs').catch(() => null as any)
    let providerItems: any[] = []
    if (mod) {
      try {
        const Blobs = mod.Blobs || mod.default || mod
        const token = process.env.NETLIFY_BLOBS_TOKEN
        if (token) {
          const store = new Blobs({ token })
          if (typeof store.list === 'function') {
            providerItems = await store.list({ prefix: 'quarantine/' }).catch(() => [])
          }
        }
      } catch (e) {
        await captureErrorIfAvailable(e, { route: 'admin/uploads/quarantine', step: 'provider-list' })
      }
    }

    return NextResponse.json({ success: true, data: { db: dbItems, provider: providerItems } })
  } catch (e) {
    await captureErrorIfAvailable(e, { route: 'admin/uploads/quarantine' })
    return NextResponse.json({ error: 'Failed to list quarantine' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await requireAdmin(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body || !body.action || (!body.key && !Array.isArray(body.keys))) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })

  const { action } = body as any
  const keys: string[] = Array.isArray((body as any).keys)
    ? (body as any).keys
    : typeof (body as any).key === 'string'
      ? [(body as any).key]
      : []
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
      const results: any[] = []
      for (const k of keys) {
        await store.remove(k).catch((e: any) => { throw e })
        try { await logAuditSafe({ action: 'upload:quarantine:delete', actorId: (session.user as any).id ?? null, details: { key: k } }) } catch {}
        results.push({ key: k, ok: true })
      }
      return NextResponse.json({ success: true, results })
    }

    if (action === 'release') {
      // move from quarantine/ to public/ (best-effort)
      const results: any[] = []
      for (const k of keys) {
        const publicKey = k.replace(/^quarantine\//, 'uploads/')
        try {
          const data = await store.get(k).catch(() => null)
          if (!data) { results.push({ key: k, ok: false, error: 'Source not found' }); continue }
          await store.set(publicKey, data, {})
          if (typeof store.remove === 'function') {
            try { await store.remove(k) } catch {}
          }
          try { await logAuditSafe({ action: 'upload:quarantine:release', actorId: (session.user as any).id ?? null, details: { from: k, to: publicKey } }) } catch {}
          results.push({ key: k, ok: true, to: publicKey })
        } catch (e) {
          await captureErrorIfAvailable(e, { route: 'admin/uploads/quarantine', action: 'release' })
          results.push({ key: k, ok: false, error: 'Release failed' })
        }
      }
      return NextResponse.json({ success: true, results })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e) {
    await captureErrorIfAvailable(e, { route: 'admin/uploads/quarantine' })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
