import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role as string | undefined
  if (!session?.user || !hasPermission(role, PERMISSIONS.ANALYTICS_MANAGE)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const mod = await import('@/app/api/cron/reminders/route')
    const secret = process.env.CRON_SECRET || process.env.NEXT_CRON_SECRET || ''
    const internalReq = new Request('https://internal/cron/reminders', { method: 'POST', headers: secret ? { 'x-cron-secret': secret } : {} as any })
    const resp: any = await mod.POST(internalReq as any)
    const json = await resp.json().catch(() => null)
    return NextResponse.json(json, { status: 200 })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to trigger reminders' }, { status: 500 })
  }
}
