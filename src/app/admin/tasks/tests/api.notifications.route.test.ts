import { describe, it, expect, vi, beforeEach } from 'vitest'

const mem = { data: '' as string }

vi.mock('fs', async () => {
  const actual = await vi.importActual('fs')
  return {
    default: actual,
    ...actual,
    readFileSync: vi.fn(() => JSON.stringify({ emailEnabled: false, emailFrom: '', webhookUrl: '', templates: [] })),
    writeFileSync: vi.fn((_p: string, content: string) => { mem.data = content }),
    mkdirSync: vi.fn(() => {})
  }
})

// Ensure DB fallback is used
process.env.NETLIFY_DATABASE_URL = ''

describe('api/admin/tasks/notifications route', () => {
  beforeEach(() => { mem.data = '' })

  it('reads and updates notification settings', async () => {
    const mod: any = await import('@/app/api/admin/tasks/notifications/route')

    const getRes: any = await mod.GET()
    const settings = await getRes.json()
    expect(settings.emailEnabled).toBe(false)

    const patchRes: any = await mod.PATCH(new Request('https://x', { method: 'PATCH', body: JSON.stringify({ emailEnabled: true, emailFrom: 'noreply@example.com' }) }))
    expect(patchRes.status).toBe(200)
    const updated = await patchRes.json()
    expect(updated.emailEnabled).toBe(true)
    expect(updated.emailFrom).toBe('noreply@example.com')
  })
})
