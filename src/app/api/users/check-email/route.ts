import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getResolvedTenantId, userByTenantEmail } from '@/lib/tenant'

const _api_GET = async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')?.toLowerCase().trim()
    if (!email) {
      return NextResponse.json({ error: 'Missing email' }, { status: 400 })
    }

    const hasDb = !!process.env.NETLIFY_DATABASE_URL
    if (!hasDb) {
      return NextResponse.json({ exists: false })
    }

    const tenantId = await getResolvedTenantId(request)
    const user = await prisma.user.findUnique({ where: userByTenantEmail(tenantId, email) })
    return NextResponse.json({ exists: !!user })
  } catch {
    return NextResponse.json({ exists: false })
  }
}

import { withTenantContext } from '@/lib/api-wrapper'
export const GET = withTenantContext(_api_GET, { requireAuth: false })
