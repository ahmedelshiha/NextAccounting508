import { NextRequest, NextResponse } from 'next/server'
import { authorizeCron } from '@/lib/cron/scheduler'
import { rescanErroredAttachments } from '@/lib/cron/rescan'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const auth = authorizeCron(request)
  if (auth) return auth
  try {
    const result = await rescanErroredAttachments()
    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
