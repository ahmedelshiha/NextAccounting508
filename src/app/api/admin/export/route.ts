import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

function toCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) return ''
  const headers = Object.keys(rows[0])
  const escape = (v: unknown) => {
    const s = v == null ? '' : String(v)
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
  }
  const lines = [headers.join(',')]
  for (const r of rows) lines.push(headers.map(h => escape((r as Record<string, unknown>)[h])).join(','))
  return lines.join('\n')
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const role = (session?.user as any)?.role as string | undefined
    if (!session?.user || !hasPermission(role, PERMISSIONS.ANALYTICS_EXPORT)) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const entity = (searchParams.get('entity') || '').toLowerCase()
    const format = (searchParams.get('format') || 'csv').toLowerCase()

    if (format !== 'csv') return new NextResponse('Only CSV is supported', { status: 400 })

    const hasDb = Boolean(process.env.NETLIFY_DATABASE_URL)
    if (!hasDb) return new NextResponse('Database not configured', { status: 501 })

    let rows: Record<string, unknown>[] = []

    if (entity === 'users') {
      const users = await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, createdAt: true } })
      rows = users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role, createdAt: u.createdAt.toISOString() }))
    } else if (entity === 'bookings') {
      const bookings = await prisma.booking.findMany({ include: { service: { select: { name: true } }, client: { select: { name: true, email: true } } } })
      rows = bookings.map(b => ({ id: b.id, clientName: b.client?.name, clientEmail: b.client?.email, service: b.service?.name, status: b.status, scheduledAt: b.scheduledAt.toISOString(), duration: b.duration }))
    } else if (entity === 'services') {
      const services = await prisma.service.findMany({ select: { id: true, name: true, slug: true, price: true, active: true, category: true } })
      rows = services.map(s => {
        const priceUnknown = s.price as unknown
        let priceStr = ''
        if (priceUnknown != null) {
          if (typeof priceUnknown === 'string' || typeof priceUnknown === 'number') {
            priceStr = String(priceUnknown)
          } else if (typeof (priceUnknown as { toString?: () => string }).toString === 'function') {
            priceStr = (priceUnknown as { toString: () => string }).toString()
          }
        }
        return { id: s.id, name: s.name, slug: s.slug, price: priceStr, active: s.active, category: s.category ?? '' }
      })
    } else if (entity === 'audits') {
      const logs = await prisma.healthLog.findMany({ where: { service: 'AUDIT' }, orderBy: { checkedAt: 'desc' }, take: 200 })
      rows = logs.map(l => ({ id: l.id, checkedAt: l.checkedAt.toISOString(), service: l.service, status: l.status, message: l.message ?? '' }))
    } else {
      return new NextResponse('Unknown entity', { status: 400 })
    }

    const csv = toCsv(rows)
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${entity}.csv"`
      }
    })
  } catch (error) {
    console.error('Export error:', error)
    return new NextResponse('Failed to export', { status: 500 })
  }
}
