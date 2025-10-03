import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getTenantFromRequest } from '@/lib/tenant'
import { resolveTenantId } from '@/lib/default-tenant'

export async function GET(request: NextRequest) {
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

    const tenantHint = getTenantFromRequest(request as any)
    const tenantId = await resolveTenantId(tenantHint)
    const user = await prisma.user.findUnique({ where: { tenantId_email: { tenantId, email } } })
    return NextResponse.json({ exists: !!user })
  } catch {
    return NextResponse.json({ exists: false })
  }
}
