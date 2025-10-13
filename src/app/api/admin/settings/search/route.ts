import { NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import SETTINGS_REGISTRY from '@/lib/settings/registry'
import { applyRateLimit, getClientIp } from '@/lib/rate-limit'
import { hasPermission } from '@/lib/permissions'
import Fuse from 'fuse.js'

type SearchItem = {
  id: string
  key: string
  label: string
  route: string
  category: string
}

let cachedFuse: Fuse<SearchItem> | null = null
let cachedItems: SearchItem[] | null = null

function buildIndex() {
  const items: SearchItem[] = []
  for (const cat of SETTINGS_REGISTRY) {
    if (!cat) continue
    items.push({ id: cat.key, key: cat.key, label: cat.label, route: cat.route, category: cat.key })
    const tabs = cat.tabs ?? []
    for (const tab of tabs) {
      if (!tab) continue
      const tabLabel = tab.label || tab.key
      const tabRoute = (tab as any).route || `${cat.route}?tab=${tab.key}`
      items.push({ id: `${cat.key}:${tab.key}`, key: `${cat.key}:${tab.key}`, label: `${cat.label} — ${tabLabel}`, route: tabRoute, category: cat.key })
    }
  }

  const fuse = new Fuse(items, {
    keys: ['label', 'key', 'category', 'route'],
    includeScore: true,
    threshold: 0.4,
    ignoreLocation: true,
    minMatchCharLength: 1,
  })
  cachedFuse = fuse
  cachedItems = items
  return { fuse, items }
}

function ensureIndex() {
  if (!cachedFuse || !cachedItems) {
    return buildIndex()
  }
  return { fuse: cachedFuse, items: cachedItems }
}

export const GET = withTenantContext(async (request: Request) => {
  try {
    const ctx = requireTenantContext()
    const url = new URL(request.url)
    const q = (url.searchParams.get('q') || '').trim()
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10))
    const perPage = Math.min(100, Math.max(1, parseInt(url.searchParams.get('perPage') || '20', 10)))
    const categoryFilter = url.searchParams.get('category') || undefined

    if (!q) {
      return NextResponse.json({ ok: false, error: 'query_required' }, { status: 400 })
    }

    // Rate limit per-tenant or by IP if tenant missing
    const clientId = ctx.tenantId ?? getClientIp(request)
    const rateKey = `settings-search:${clientId}`
    const limit = 60
    const windowMs = 60_000 // 1 minute
    const decision = await applyRateLimit(rateKey, limit, windowMs)
    if (!decision.allowed) {
      const retryAfter = Math.ceil((decision.resetAt - Date.now()) / 1000)
      return NextResponse.json(
        { ok: false, error: 'rate_limited', retryAfter },
        { status: 429, headers: { 'X-RateLimit-Limit': String(decision.limit), 'X-RateLimit-Remaining': String(decision.remaining), 'X-RateLimit-Reset': String(decision.resetAt) } },
      )
    }

    // Build or reuse index
    const { fuse, items } = ensureIndex()

    // Filter items by permission and category first to reduce search space
    const visibleItems = items.filter((it) => {
      const cat = SETTINGS_REGISTRY.find((c) => c && c.key === it.category)
      if (!cat) return false
      const catPerm = (cat as any).permission as string | string[] | undefined
      if (catPerm) {
        if (Array.isArray(catPerm)) {
          const ok = catPerm.some((p) => hasPermission(ctx.role ?? undefined, p as any))
          if (!ok) return false
        } else {
          if (!hasPermission(ctx.role ?? undefined, catPerm as any)) return false
        }
      }
      // If this is a tab item, check tab permission
      if (it.key.includes(':')) {
        const parts = it.key.split(':')
        const catKey = parts[0]
        const tabKey = parts[1]
        const catObj = SETTINGS_REGISTRY.find((c) => c && c.key === catKey)
        const tabObj = catObj?.tabs?.find((t: any) => t.key === tabKey)
        if (tabObj) {
          const tabPerm = (tabObj as any).permission as string | string[] | undefined
          if (tabPerm) {
            if (Array.isArray(tabPerm)) {
              const ok = tabPerm.some((p) => hasPermission(ctx.role ?? undefined, p as any))
              if (!ok) return false
            } else {
              if (!hasPermission(ctx.role ?? undefined, tabPerm as any)) return false
            }
          }
        }
      }
      if (categoryFilter && it.category !== categoryFilter) return false
      return true
    })

    // If nothing visible, return empty
    if (visibleItems.length === 0) {
      return NextResponse.json({ ok: true, data: { items: [], total: 0, page, perPage } })
    }

    // Run Fuse search on the visible items (create a transient fuse instance for subset)
    const fuseSubset = new Fuse(visibleItems, {
      keys: ['label', 'key', 'category', 'route'],
      includeScore: true,
      threshold: 0.45,
      ignoreLocation: true,
      minMatchCharLength: 1,
    })

    const results = fuseSubset.search(q)
    const mapped = results.map(r => ({ item: r.item, score: r.score ?? 0 }))
    const total = mapped.length
    const start = (page - 1) * perPage
    const slice = mapped.slice(start, start + perPage).map(m => m.item)

    return NextResponse.json({ ok: true, data: { items: slice, total, page, perPage } })
  } catch (error: any) {
    console.error('settings search error', error)
    return NextResponse.json({ ok: false, error: 'internal' }, { status: 500 })
  }
})
