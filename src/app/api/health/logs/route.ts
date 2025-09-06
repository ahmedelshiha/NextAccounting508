import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get('limit')
    const service = searchParams.get('service') || undefined
    const take = limitParam ? Math.min(parseInt(limitParam, 10) || 50, 200) : 50

    const where = service ? { service } : undefined

    const logs = await prisma.healthLog.findMany({
      where,
      orderBy: { checkedAt: 'desc' },
      take,
    })

    return NextResponse.json(logs)
  } catch (error) {
    console.error('Error fetching health logs:', error)
    return NextResponse.json({ error: 'Failed to fetch health logs' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { service, status, message } = body || {}

    if (!service || !status) {
      return NextResponse.json({ error: 'service and status are required' }, { status: 400 })
    }

    const log = await prisma.healthLog.create({
      data: {
        service: String(service),
        status: String(status),
        message: message ? String(message) : null,
      },
    })

    return NextResponse.json(log, { status: 201 })
  } catch (error) {
    console.error('Error creating health log:', error)
    return NextResponse.json({ error: 'Failed to create health log' }, { status: 500 })
  }
}
