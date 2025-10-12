import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getFavorites, addFavorite, removeFavorite } from '@/services/favorites.service'

declare const global: any

describe('favorites.service', () => {
  const origFetch = global.fetch

  beforeEach(() => {
    global.fetch = vi.fn()
  })

  afterEach(() => {
    global.fetch = origFetch
    vi.restoreAllMocks()
  })

  it('getFavorites returns [] on non-ok', async () => {
    ;(global.fetch as any).mockResolvedValue({ ok: false })
    const out = await getFavorites()
    expect(out).toEqual([])
    expect(global.fetch).toHaveBeenCalledWith('/api/admin/settings/favorites', { cache: 'no-store' })
  })

  it('getFavorites returns data array', async () => {
    const payload = { ok: true, data: [ { id: '1', tenantId: 't1', userId: 'u1', settingKey: 'organization', route: '/admin/settings/company', label: 'Organization', createdAt: new Date().toISOString() } ] }
    ;(global.fetch as any).mockResolvedValue({ ok: true, json: () => Promise.resolve(payload) })
    const out = await getFavorites()
    expect(out.length).toBe(1)
    expect(out[0].settingKey).toBe('organization')
  })

  it('addFavorite posts payload and returns item or null', async () => {
    const input = { settingKey: 'security', route: '/admin/settings/security', label: 'Security' }
    ;(global.fetch as any).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ ok: true, data: { id: '2', tenantId: 't1', userId: 'u1', ...input, createdAt: new Date().toISOString() } }) })
    const created = await addFavorite(input)
    expect(created?.settingKey).toBe('security')
    expect(global.fetch).toHaveBeenCalledWith('/api/admin/settings/favorites', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) })

    ;(global.fetch as any).mockResolvedValueOnce({ ok: false })
    const none = await addFavorite(input)
    expect(none).toBeNull()
  })

  it('removeFavorite calls DELETE and returns ok boolean', async () => {
    ;(global.fetch as any).mockResolvedValue({ ok: true })
    const ok = await removeFavorite('organization')
    expect(ok).toBe(true)
    expect(global.fetch).toHaveBeenCalledWith('/api/admin/settings/favorites?settingKey=organization', { method: 'DELETE' })
  })
})
