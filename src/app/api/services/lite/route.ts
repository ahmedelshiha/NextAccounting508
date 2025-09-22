import { NextRequest, NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { getTenantFromRequest, tenantFilter } from '@/lib/tenant'
import { createHash } from 'crypto'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET /api/services/lite - minimal fields for client booking flows
export async function GET(request: NextRequest) {
  try {
    // Dev fallback if DB not configured
    if (!process.env.NETLIFY_DATABASE_URL) {
      const fallback = [
        { id: '1', name: 'Bookkeeping', shortDesc: 'Monthly bookkeeping and reconciliations', price: 299, duration: 60 },
        { id: '2', name: 'Tax Preparation', shortDesc: 'Personal and business tax filings', price: 450, duration: 60 },
        { id: '3', name: 'Payroll Management', shortDesc: 'Payroll processing and compliance', price: 199, duration: 45 },
      ]
      const etag = '"' + createHash('sha1').update(JSON.stringify(fallback.map(s=>s.id))).digest('hex') + '"'
      const inm = request.headers.get('if-none-match')
      if (inm && inm === etag) return new NextResponse(null, { status: 304, headers: { ETag: etag } })
      return NextResponse.json(fallback, { headers: { 'Cache-Control': 'private, max-age=60', ETag: etag } })
    }

    const tenantId = getTenantFromRequest(request as any)
    const { default: prisma } = await import('@/lib/prisma')

    const where: Prisma.ServiceWhereInput = { active: true, ...(tenantFilter(tenantId) as any) }

    const rows = await prisma.service.findMany({
      where,
      select: { id: true, name: true, shortDesc: true, price: true, duration: true, updatedAt: true },
      orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
    })

    const etag = '"' + createHash('sha1').update(JSON.stringify(rows.map(r=>r.id)) + '|' + JSON.stringify(rows.map(r=>r.updatedAt?.toISOString?.() || String(r.updatedAt)))).digest('hex') + '"'
    const inm = request.headers.get('if-none-match')
    if (inm && inm === etag) return new NextResponse(null, { status: 304, headers: { ETag: etag } })

    const body = rows.map(r => ({ id: r.id, name: r.name, shortDesc: r.shortDesc || null, price: r.price ?? null, duration: r.duration ?? null }))
    return NextResponse.json(body, { headers: { 'Cache-Control': 'private, max-age=60', ETag: etag } })
  } catch (error) {
    console.error('Error fetching services lite:', error)
    const fallback = [
      { id: '1', name: 'Bookkeeping', shortDesc: 'Monthly bookkeeping and reconciliations', price: 299, duration: 60 },
      { id: '2', name: 'Tax Preparation', shortDesc: 'Personal and business tax filings', price: 450, duration: 60 },
    ]
    const etag = '"' + createHash('sha1').update(JSON.stringify(fallback.map(s=>s.id))).digest('hex') + '"'
    return NextResponse.json(fallback, { headers: { 'Cache-Control': 'private, max-age=60', ETag: etag } })
  }
}
