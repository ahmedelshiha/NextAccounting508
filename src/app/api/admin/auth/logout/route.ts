import { NextResponse } from 'next/server'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { logAudit } from '@/lib/audit'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions as any)
    const actorId = (session?.user as any)?.id ?? null
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null
    try { await logAudit({ action: 'auth:logout', actorId, targetId: actorId, details: { ip } }) } catch {}
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
