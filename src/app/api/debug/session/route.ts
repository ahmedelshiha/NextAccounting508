import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const session = await Promise.race([
      // attempt to get server session but don't block too long
      (getServerSession as any)(authOptions),
      new Promise((resolve) => setTimeout(() => resolve(null), 500)),
    ]) as any

    let dbOk = false
    let dbError: string | null = null
    try {
      // quick lightweight DB check
      // use a minimal call to avoid heavy load
      const c = await prisma.user.count({ take: 1 } as any)
      dbOk = true
    } catch (err: any) {
      dbOk = false
      dbError = err?.message || String(err)
      console.error('Debug DB check failed', dbError)
    }

    return NextResponse.json({
      hasSession: !!session?.user,
      user: session?.user ? { id: session.user.id, email: session.user.email, tenantId: session.user.tenantId } : null,
      dbOk,
      dbError,
    })
  } catch (err: any) {
    console.error('Debug session route error', err)
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 })
  }
}
