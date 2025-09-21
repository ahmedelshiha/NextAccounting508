import { realtimeService } from '@/lib/realtime-enhanced'
import { z } from 'zod'

export type ChatMessage = {
  id: string
  text: string
  userId: string
  userName: string
  role: string
  tenantId?: string | null
  createdAt: string
}

// Very small, in-memory backlog per tenant to keep last N messages
class ChatBacklog {
  private messagesByTenant = new Map<string, ChatMessage[]>()
  private maxPerTenant = 100

  getTenantKey(tenantId?: string | null) {
    return tenantId || 'default'
  }

  add(msg: ChatMessage) {
    const key = this.getTenantKey(msg.tenantId)
    const list = this.messagesByTenant.get(key) || []
    list.push(msg)
    if (list.length > this.maxPerTenant) list.splice(0, list.length - this.maxPerTenant)
    this.messagesByTenant.set(key, list)
  }

  list(tenantId?: string | null, limit = 50) {
    const key = this.getTenantKey(tenantId)
    const list = this.messagesByTenant.get(key) || []
    return list.slice(Math.max(0, list.length - limit))
  }
}

export const chatBacklog = new ChatBacklog()

export const chatSchema = z.object({
  message: z.string().trim().min(1).max(1000),
})

export function createChatMessage({
  text,
  userId,
  userName,
  role,
  tenantId,
}: { text: string; userId: string; userName: string; role: string; tenantId?: string | null }): ChatMessage {
  return {
    id: Math.random().toString(36).slice(2),
    text,
    userId,
    userName,
    role,
    tenantId: tenantId ?? null,
    createdAt: new Date().toISOString(),
  }
}

export async function broadcastChatMessage(msg: ChatMessage) {
  chatBacklog.add(msg)
  realtimeService.broadcast({
    type: 'chat-message',
    data: msg,
    timestamp: msg.createdAt,
  })
}
