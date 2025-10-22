import { describe, it, expect, beforeEach } from 'vitest'
import { chatBacklog } from '@/lib/chat'

describe('chat offline enqueue/flush', () => {
  beforeEach(() => {
    // simple localStorage mock
    let store: Record<string, string> = {}
    globalThis.localStorage = {
      getItem(key: string) { return store[key] ?? null },
      setItem(key: string, value: string) { store[key] = String(value) },
      removeItem(key: string) { delete store[key] },
      clear() { store = {} },
      key() { return null as any },
      length: 0,
    } as any
    // clear backlog
    ;(chatBacklog as any).messagesByTenant = new Map()
  })

  it('flushes queued messages by calling POST handler and populating backlog', async () => {
    const messages = ['hello from offline', 'second message']
    globalThis.localStorage.setItem('af_pending_chat', JSON.stringify(messages))

    const mod = await import('@/app/api/portal/chat/route')
    const { POST } = mod as any

    // Simulate client flush by reading localStorage and invoking POST per message
    const raw = globalThis.localStorage.getItem('af_pending_chat')
    expect(raw).not.toBeNull()
    const items: string[] = JSON.parse(String(raw))
    expect(items).toEqual(messages)

    for (const msg of items) {
      const req = new Request('https://example.com/api/portal/chat', { method: 'POST', body: JSON.stringify({ message: msg }), headers: { 'Content-Type': 'application/json' } })
      const res: any = await POST(req)
      expect(res.status).toBe(200)
      const json = await res.json().catch(() => null)
      expect(json?.ok).toBe(true)
    }

    // Verify backlog contains the messages for tenant (test environment uses tenant from context)
    const list = chatBacklog.list('test-tenant', 50)
    const texts = list.map((m: any) => m.text)
    expect(texts).toEqual(expect.arrayContaining(messages))

    // cleanup
    globalThis.localStorage.removeItem('af_pending_chat')
  })
})
