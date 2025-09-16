import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { respond } from '@/lib/api-response'

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return respond.ok({ status: 'ok' })
  } catch (error) {
    console.error('DB health check failed:', error)
    return respond.serverError('Database health check failed')
  }
}
