import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { captureErrorIfAvailable, logAuditSafe } from '@/lib/observability-helpers'
import { getTenantFromRequest, tenantFilter } from '@/lib/tenant'

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
    const tenantId = getTenantFromRequest(req as any)
    const serviceRequestId = url.searchParams.get('serviceRequestId') || undefined
    const q = url.searchParams.get('q') || undefined

    // Optional pagination params for DB list
    const dbPage = Math.max(1, parseInt(url.searchParams.get('dbPage') || url.searchParams.get('page') || '1', 10))
    const dbLimit = Math.min(200, Math.max(1, parseInt(url.searchParams.get('dbLimit') || url.searchParams.get('limit') || '25', 10)))
    const dbSort = (url.searchParams.get('dbSort') || 'uploadedAt_desc').toLowerCase()

    // Optional pagination params for provider list (client-side slice)
    const providerPage = Math.max(1, parseInt(url.searchParams.get('providerPage') || '1', 10))
    const providerLimit = Math.min(200, Math.max(1, parseInt(url.searchParams.get('providerLimit') || '25', 10)))
    const providerSort = (url.searchParams.get('providerSort') || 'created_desc').toLowerCase()

    // Fetch DB attachments flagged as infected/quarantined with optional filters
    const { default: prisma } = await import('@/lib/prisma')
    const where: any = { OR: [{ avStatus: 'infected' }, { avStatus: 'error' }], ...tenantFilter(tenantId) }
    if (serviceRequestId) where.serviceRequestId = serviceRequestId
    if (q) {
      where.OR = [
        ...(where.OR || []),
        { name: { contains: q, mode: 'insensitive' } },
        { key: { contains: q, mode: 'insensitive' } },
      ]
    }

    // Map dbSort to Prisma orderBy
    let orderBy: any = { uploadedAt: 'desc' }
    if (dbSort === 'uploadedat_asc') orderBy = { uploadedAt: 'asc' }
    else if (dbSort === 'name_asc') orderBy = { name: 'asc' }
    else if (dbSort === 'name_desc') orderBy = { name: 'desc' }
    else if (dbSort === 'size_asc') orderBy = { size: 'asc' }
    else if (dbSort === 'size_desc') orderBy = { size: 'desc' }

    const [dbTotal, dbItems] = await Promise.all([
      prisma.attachment.count({ where }),
      prisma.attachment.findMany({ where, orderBy, skip: (dbPage - 1) * dbLimit, take: dbLimit }),
    ])

    // Try provider listing as well (optional) using uploads-provider helper
    let providerItems: any[] = []
    try {
      const { listQuarantine } = await import('@/lib/uploads-provider')
      providerItems = await listQuarantine('quarantine/')
    } catch (e) {
      await captureErrorIfAvailable(e, { route: 'admin/uploads/quarantine', step: 'provider-list' })
    }

    // Apply simple server-side filtering for provider list (by key) and paginate in-memory
    const providerFilter = (serviceRequestId || q || '').toLowerCase()
    const filteredProvider = providerFilter
      ? providerItems.filter((p: any) => String(p?.key || '').toLowerCase().includes(providerFilter))
      : providerItems
    // Sort provider list in-memory
    const sortedProvider = (() => {
      const arr = [...filteredProvider]
      const cmp = (a: any, b: any) => 0
      if (providerSort === 'created_desc') {
        arr.sort((a, b) => new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime())
      } else if (providerSort === 'created_asc') {
        arr.sort((a, b) => new Date(a?.createdAt || 0).getTime() - new Date(b?.createdAt || 0).getTime())
      } else if (providerSort === 'key_asc') {
        arr.sort((a, b) => String(a?.key || '').localeCompare(String(b?.key || '')))
      } else if (providerSort === 'key_desc') {
        arr.sort((a, b) => String(b?.key || '').localeCompare(String(a?.key || '')))
      } else if (providerSort === 'size_asc') {
        arr.sort((a, b) => (a?.size || 0) - (b?.size || 0))
      } else if (providerSort === 'size_desc') {
        arr.sort((a, b) => (b?.size || 0) - (a?.size || 0))
      }
      return arr
    })()

    const providerTotal = sortedProvider.length
    const providerPaged = sortedProvider.slice((providerPage - 1) * providerLimit, (providerPage - 1) * providerLimit + providerLimit)

    return NextResponse.json({
      success: true,
      data: { db: dbItems, provider: providerPaged },
      meta: {
        db: { total: dbTotal, page: dbPage, limit: dbLimit, totalPages: Math.ceil(dbTotal / dbLimit) },
        provider: { total: providerTotal, page: providerPage, limit: providerLimit, totalPages: Math.ceil(providerTotal / providerLimit) },
      },
    })
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
    const { removeObject, releaseFromQuarantine } = await import('@/lib/uploads-provider')

    if (action === 'delete') {
      const results: any[] = []
      for (const k of keys) {
        try {
          await removeObject(k)
          try { await logAuditSafe({ action: 'upload:quarantine:delete', actorId: (session.user as any).id ?? null, details: { key: k } }) } catch {}
          results.push({ key: k, ok: true })
        } catch (e) {
          await captureErrorIfAvailable(e, { route: 'admin/uploads/quarantine', action: 'delete', key: k })
          results.push({ key: k, ok: false, error: String(e) })
        }
      }
      return NextResponse.json({ success: true, results })
    }

    if (action === 'release') {
      const results: any[] = []
      for (const k of keys) {
        try {
          const res = await releaseFromQuarantine(k)
          if (res.ok) {
            try { await logAuditSafe({ action: 'upload:quarantine:release', actorId: (session.user as any).id ?? null, details: { from: k, to: res.key } }) } catch {}
            results.push({ key: k, ok: true, to: res.key })
          } else {
            results.push({ key: k, ok: false, error: res.error })
          }
        } catch (e) {
          await captureErrorIfAvailable(e, { route: 'admin/uploads/quarantine', action: 'release', key: k })
          results.push({ key: k, ok: false, error: String(e) })
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
