import { NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { jsonDiff } from '@/lib/diff'
import { rateLimitAsync, getClientIp } from '@/lib/rate-limit'

export const POST = withTenantContext(async (req: Request) => {
  const ctx = requireTenantContext()
  if (!ctx.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Rate limit: 10 requests per minute per user+tenant
  const allowed = await rateLimitAsync(`diff-preview:${ctx.tenantId}:${ctx.userId ?? getClientIp(req)}`, 10, 60_000)
  if (!allowed) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })

  const body = await req.json().catch(() => null as any)
  const category = body?.category as string
  const before = body?.before
  const after = body?.after
  if (!category || typeof before === 'undefined' || typeof after === 'undefined') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const changes = jsonDiff(before, after)
  return NextResponse.json({ ok: true, data: { category, count: changes.length, changes } })
})
