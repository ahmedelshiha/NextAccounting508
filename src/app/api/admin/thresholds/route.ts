import type { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'

export const revalidate = 0
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const threshold = await prisma.healthThreshold.findFirst({ orderBy: { id: 'desc' } as any })
    if (!threshold) {
      return new Response(JSON.stringify({ responseTime: 100, errorRate: 1.0, storageGrowth: 20.0 }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    }
    return new Response(JSON.stringify({ responseTime: threshold.responseTime, errorRate: threshold.errorRate, storageGrowth: threshold.storageGrowth }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    console.error('Thresholds GET error', err)
    return new Response(JSON.stringify({ error: 'Failed to read thresholds' }), { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { responseTime, errorRate, storageGrowth } = body
    if (typeof responseTime !== 'number' || typeof errorRate !== 'number' || typeof storageGrowth !== 'number') {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400 })
    }

    const existing = await prisma.healthThreshold.findFirst({ orderBy: { id: 'desc' } as any })
    let upserted
    if (existing) {
      upserted = await prisma.healthThreshold.update({ where: { id: existing.id }, data: { responseTime, errorRate, storageGrowth } })
    } else {
      upserted = await prisma.healthThreshold.create({ data: { responseTime, errorRate, storageGrowth } })
    }

    return new Response(JSON.stringify({ responseTime: upserted.responseTime, errorRate: upserted.errorRate, storageGrowth: upserted.storageGrowth }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    console.error('Thresholds POST error', err)
    return new Response(JSON.stringify({ error: 'Failed to save thresholds' }), { status: 500 })
  }
}
