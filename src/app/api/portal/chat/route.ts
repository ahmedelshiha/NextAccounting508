import { NextRequest, NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { chatSchema, createChatMessage, broadcastChatMessage, chatBacklog } from '@/lib/chat'
import { requireTenantContext } from '@/lib/tenant-utils'
import { getClientIp, rateLimit } from '@/lib/rate-limit'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const runtime = 'nodejs'

// POST /api/portal/chat - send a chat message (authenticated portal users)
export const POST = withTenantContext(async (request: NextRequest) => {
  const ctx = requireTenantContext()
  if (!ctx.userId) return new NextResponse('Unauthorized', { status: 401 })

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

  const tenantId = ctx.tenantId
  const userId = String(ctx.userId || '')

  // Best-effort userName from session; fallback to userId
  let userName = 'User'
  try {
    const session = await getServerSession(authOptions)
    userName = String(session?.user?.name || session?.user?.email || userId || 'User')
  } catch {}

  const role = String(ctx.role || 'user')

  const msg = createChatMessage({ text: parsed.data.message, userId, userName, role, tenantId })
  await broadcastChatMessage(msg)

  return NextResponse.json({ ok: true, message: msg })
})

// GET /api/portal/chat - list recent messages (authenticated)
export const GET = withTenantContext(async (request: NextRequest) => {
  const ctx = requireTenantContext()
  if (!ctx.userId) return new NextResponse('Unauthorized', { status: 401 })

  const tenantId = ctx.tenantId
  const { searchParams } = new URL(request.url)
  const limit = Math.max(1, Math.min(200, Number(searchParams.get('limit') || '50')))
  const list = chatBacklog.list(tenantId, limit)
  return NextResponse.json({ messages: list })
})

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: { Allow: 'GET,POST,OPTIONS' } })
}
