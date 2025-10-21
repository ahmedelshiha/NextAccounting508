import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'

export const GET = withTenantContext(async (request: Request) => {
  try {
    // requireTenantContext reads tenant+user info initialized by withTenantContext
    const ctx = requireTenantContext()
    const userEmail = ctx?.userEmail ?? null
    const tenantId = ctx?.tenantId ?? null

    let dbOk = false
    let dbError: string | null = null
    try {
      // lightweight DB check
      // use a simple count scoped to tenant when possible
      const where: any = tenantId ? { tenantId } : {}
      await prisma.user.count({ where })
      dbOk = true
    } catch (err: any) {
      dbOk = false
      dbError = err?.message || String(err)
      console.error('Debug DB check failed', dbError)
    }

    return NextResponse.json({
      hasSession: !!userEmail,
      user: userEmail ? { email: userEmail, tenantId } : null,
      dbOk,
      dbError,
    })
  } catch (err: any) {
    console.error('Debug session route error', err)
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 })
  }
})
