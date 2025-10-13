import { NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import SETTINGS_REGISTRY from '@/lib/settings/registry'
import { applyRateLimit, getClientIp } from '@/lib/rate-limit'
import { hasPermission } from '@/lib/permissions'

type SearchItem = {
  key: string
  label: string
  route: string
  category: string
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

    const qLower = q.toLowerCase()
    const items: SearchItem[] = []

    for (const cat of SETTINGS_REGISTRY) {
      if (!cat) continue
      // category-level permission check
      const catPerm = (cat as any).permission as string | string[] | undefined
      if (catPerm) {
        if (Array.isArray(catPerm)) {
          const ok = catPerm.some((p) => hasPermission(ctx.role ?? undefined, p as any))
          if (!ok) continue
        } else {
          if (!hasPermission(ctx.role ?? undefined, catPerm as any)) continue
        }
      }

      // include category as an item
      items.push({ key: cat.key, label: cat.label, route: cat.route, category: cat.key })

      // include tabs if present and visible
      const tabs = cat.tabs ?? []
      for (const tab of tabs) {
        if (!tab) continue
        const tabPerm = (tab as any).permission as string | string[] | undefined
        if (tabPerm) {
          if (Array.isArray(tabPerm)) {
            const ok = tabPerm.some((p) => hasPermission(ctx.role ?? undefined, p as any))
            if (!ok) continue
          } else {
            if (!hasPermission(ctx.role ?? undefined, tabPerm as any)) continue
          }
        }
        const tabLabel = tab.label || tab.key
        // prefer tab.route if provided, otherwise compose
        const tabRoute = (tab as any).route || `${cat.route}?tab=${tab.key}`
        items.push({ key: `${cat.key}:${tab.key}`, label: `${cat.label} — ${tabLabel}`, route: tabRoute, category: cat.key })
      }
    }

    // Optional category filter
    const filteredByCategory = typeof categoryFilter === 'string' ? items.filter(i => i.category === categoryFilter) : items

    // Simple scoring: exact startsWith > includes > fuzzy by index. For now, use includes.
    const scored = filteredByCategory
      .map((it) => ({
        item: it,
        score: (() => {
          const l = it.label.toLowerCase()
          if (l === qLower) return 0
          const idx = l.indexOf(qLower)
          if (idx === 0) return 1
          if (idx > 0) return 2 + idx
          return 1000
        })(),
      }))
      .filter(s => s.score < 1000)
      .sort((a, b) => a.score - b.score)

    const total = scored.length
    const start = (page - 1) * perPage
    const slice = scored.slice(start, start + perPage).map(s => s.item)

    return NextResponse.json({ ok: true, data: { items: slice, total, page, perPage } })
  } catch (error: any) {
    console.error('settings search error', error)
    return NextResponse.json({ ok: false, error: 'internal' }, { status: 500 })
  }
})
