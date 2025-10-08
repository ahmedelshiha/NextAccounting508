import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

async function resolveTenantIdForLogs(req: NextRequest): Promise<string | null> {
  try {
    const headerTid = req.headers.get('x-tenant-id')
    if (headerTid) return String(headerTid)
  } catch {}
  try {
    const primary = await prisma.tenant.findUnique({ where: { slug: 'primary' }, select: { id: true } })
    if (primary?.id) return primary.id
  } catch {}
  try {
    const first = await prisma.tenant.findFirst({ select: { id: true } })
    if (first?.id) return first.id
  } catch {}
  return null
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const limit = Math.max(1, Math.min(200, Number(searchParams.get('limit') || 50)))
  try {
    const logs = await prisma.healthLog.findMany({
      orderBy: { checkedAt: 'desc' },
      take: limit,
      select: { id: true, service: true, status: true, message: true, checkedAt: true },
    })
    return NextResponse.json(logs)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to load logs' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const service = typeof body.service === 'string' ? body.service : 'system'
    const status = typeof body.status === 'string' ? body.status : 'ok'
    const message = typeof body.message === 'string' ? body.message : null

    const tenantId = await resolveTenantIdForLogs(request)
    if (!tenantId) return NextResponse.json({ error: 'No tenant available for logging' }, { status: 503 })

    await prisma.healthLog.create({ data: { tenantId, service, status, message } })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to write log' }, { status: 500 })
  }
}
