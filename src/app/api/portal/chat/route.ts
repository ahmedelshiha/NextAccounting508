import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { chatSchema, createChatMessage, broadcastChatMessage, chatBacklog } from '@/lib/chat'
import { getTenantFromRequest } from '@/lib/tenant'
import { getClientIp, rateLimit } from '@/lib/rate-limit'

export const runtime = 'nodejs'

// POST /api/portal/chat - send a chat message (authenticated portal users)
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 })

  const ip = getClientIp(request as unknown as Request)
  if (!rateLimit(`chat:post:${ip}`, 10, 10_000)) {
    return new NextResponse('Too Many Requests', { status: 429 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return new NextResponse('Invalid JSON', { status: 400 })
  }

  const parsed = chatSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid message', details: parsed.error.flatten() }, { status: 400 })
  }

  const tenantId = getTenantFromRequest(request as unknown as Request)
  const userId = String((session.user as any).id || '')
  const userName = String(session.user.name || session.user.email || 'User')
  const role = String((session.user as any).role || 'user')

  const msg = createChatMessage({ text: parsed.data.message, userId, userName, role, tenantId })
  await broadcastChatMessage(msg)

  return NextResponse.json({ ok: true, message: msg })
}

// GET /api/portal/chat - list recent messages (authenticated)
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 })

  const tenantId = getTenantFromRequest(request as unknown as Request)
  const { searchParams } = new URL(request.url)
  const limit = Math.max(1, Math.min(200, Number(searchParams.get('limit') || '50')))
  const list = chatBacklog.list(tenantId, limit)
  return NextResponse.json({ messages: list })
}
