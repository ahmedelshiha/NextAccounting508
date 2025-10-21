import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { tenantFilter } from '@/lib/tenant'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { respond } from '@/lib/api-response'

const hasDb = !!process.env.NETLIFY_DATABASE_URL

export const GET = withTenantContext(async (request?: Request) => {
  const ctx = requireTenantContext()
  const role = ctx.role ?? undefined
  if (!hasPermission(role, PERMISSIONS.TASKS_READ_ALL)) {
    return respond.forbidden('Forbidden')
  }
  try {
    if (!hasDb) {
      const categories = ['General','Onboarding','Compliance','Accounting']
      return NextResponse.json(categories)
    }

    const tenantId = ctx.tenantId
    const rows = await prisma.taskTemplate.findMany({
      where: tenantFilter(tenantId),
      select: { category: true },
      distinct: ['category']
    })
    const categories = Array.from(new Set(rows.map(r => (r as any).category).filter(Boolean)))
    return NextResponse.json(categories)
  } catch (e) {
    console.error('GET template categories error', e)
    return NextResponse.json({ error: 'Failed to load template categories' }, { status: 500 })
  }
})
