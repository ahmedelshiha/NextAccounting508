import { NextRequest, NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { chatSchema, createChatMessage, broadcastChatMessage, chatBacklog } from '@/lib/chat'
import { getClientIp, rateLimit } from '@/lib/rate-limit'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

export const runtime = 'nodejs'

// POST /api/admin/chat - send a message as admin/agent
export const POST = withTenantContext(async (request: NextRequest) => {
  const ctx = requireTenantContext()
  const role = ctx.role ?? undefined
  if (!hasPermission(role, PERMISSIONS.SERVICE_REQUESTS_UPDATE) || !ctx.userId) {
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

  const tenantId = ctx.tenantId ?? null
  const userId = String(ctx.userId || '')
  const userName = String(ctx.userName || ctx.userEmail || 'Agent')
  const room = parsed.data.room ?? null

  const msg = createChatMessage({ text: parsed.data.message, userId, userName, role: role || 'ADMIN', tenantId, room })
  await broadcastChatMessage(msg)
  return NextResponse.json({ ok: true, message: msg })
})

// GET /api/admin/chat - list recent messages (optionally filter by room)
export const GET = withTenantContext(async (request: NextRequest) => {
  const ctx = requireTenantContext()
  const role = ctx.role ?? undefined
  if (!hasPermission(role, PERMISSIONS.SERVICE_REQUESTS_READ_ALL) || !ctx.userId) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const tenantId = ctx.tenantId ?? null
  const { searchParams } = new URL(request.url)
  const limit = Math.max(1, Math.min(500, Number(searchParams.get('limit') || '100')))
  const room = (searchParams.get('room') || '').trim() || null
  const list = chatBacklog.list(tenantId, limit, room)
  return NextResponse.json({ messages: list })
})
