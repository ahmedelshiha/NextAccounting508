import { parseEventMessage } from '@/components/dashboard/realtime/RealtimeProvider'

describe('parseEventMessage', () => {
  it('parses valid JSON event with type', () => {
    const raw = JSON.stringify({ type: 'service-request-updated', data: { id: '1' }, timestamp: '2025-01-01T00:00:00Z' })
    const evt = parseEventMessage(raw)
    expect(evt && evt.type).toBe('service-request-updated')
    expect((evt as any).data.id).toBe('1')
  })

  it('returns null for invalid JSON', () => {
    const evt = parseEventMessage('{not-json}')
    expect(evt).toBeNull()
  })

  it('returns null when missing type', () => {
    const raw = JSON.stringify({ data: { ok: true } })
    const evt = parseEventMessage(raw)
    expect(evt).toBeNull()
  })
})
