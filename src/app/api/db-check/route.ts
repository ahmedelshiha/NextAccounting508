import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { respond } from '@/lib/api-response'

const _api_GET = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`
    return respond.ok({ status: 'ok' })
  } catch (error) {
    console.error('DB health check failed:', error)
    return respond.serverError('Database health check failed')
  }
}

import { withTenantContext } from '@/lib/api-wrapper'
export const GET = withTenantContext(_api_GET, { requireAuth: false })
