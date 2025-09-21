import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { chatSchema, createChatMessage, broadcastChatMessage, chatBacklog } from '@/lib/chat'
import { getTenantFromRequest } from '@/lib/tenant'
import { getClientIp, rateLimit } from '@/lib/rate-limit'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

export const runtime = 'nodejs'

// POST /api/admin/chat - send a message as admin/agent
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role as string | undefined
  if (!session?.user || !hasPermission(role, PERMISSIONS.SERVICE_REQUESTS_UPDATE)) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const ip = getClientIp(request as unknown as Request)
  if (!rateLimit(`admin:chat:post:${ip}`, 30, 10_000)) {
    return new NextResponse('Too Many Requests', { status: 429 })
  }

  let body: unknown
  try { body = await request.json() } catch { return new NextResponse('Invalid JSON', { status: 400 }) }
  const parsed = chatSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid message', details: parsed.error.flatten() }, { status: 400 })
  }

  const tenantId = getTenantFromRequest(request as unknown as Request)
  const userId = String((session.user as any).id || '')
  const userName = String(session.user.name || session.user.email || 'Agent')
  const room = parsed.data.room ?? null

  const msg = createChatMessage({ text: parsed.data.message, userId, userName, role: role || 'ADMIN', tenantId, room })
  await broadcastChatMessage(msg)
  return NextResponse.json({ ok: true, message: msg })
}

// GET /api/admin/chat - list recent messages (optionally filter by room)
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role as string | undefined
  if (!session?.user || !hasPermission(role, PERMISSIONS.SERVICE_REQUESTS_READ_ALL)) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const tenantId = getTenantFromRequest(request as unknown as Request)
  const { searchParams } = new URL(request.url)
  const limit = Math.max(1, Math.min(500, Number(searchParams.get('limit') || '100')))
  const room = (searchParams.get('room') || '').trim() || null
  const list = chatBacklog.list(tenantId, limit, room)
  return NextResponse.json({ messages: list })
}
