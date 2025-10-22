// Lightweight adapter for tests: real app uses in-memory ChatBacklog in src/lib/chat.ts
// This file provides a stable import path for tests that expect '@/lib/chat-backlog'

const store: Record<string, any[]> = {}

export async function enqueue(tenantId: string | undefined, msg: any) {
  const key = tenantId || 'default'
  store[key] = store[key] || []
  store[key].push(msg)
  return true
}

export function list(tenantId?: string | undefined, limit = 50) {
  const key = tenantId || 'default'
  return (store[key] || []).slice(-limit)
}

export function _debug_reset() {
  for (const k of Object.keys(store)) delete store[k]
}

const chatBacklog = { enqueue, list, _debug_reset }

export default chatBacklog
