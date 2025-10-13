import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as favorites from '@/services/favorites.service'

// Provide a simple jsdom sessionStorage mock (vitest provides jsdom environment)
beforeEach(() => {
  // Clear any cached sessionStorage between tests
  sessionStorage.clear()
  vi.resetAllMocks()
})

describe('favorites.service', () => {
  it('reads and writes cache correctly', () => {
    const items: favorites.FavoriteSettingItem[] = [
      { id: '1', tenantId: 't', userId: 'u', settingKey: 'foo', route: '/a', label: 'Foo', createdAt: new Date().toISOString() },
    ]
    // call internal write via getFavorites mock: simulate writeFavoritesCache
    // emulate cached write by calling sessionStorage directly
    sessionStorage.setItem('settings:favorites', JSON.stringify({ foo: true }))
    const map = favorites.readFavoritesCachedMap()
    expect(map).toEqual({ foo: true })
  })

  it('getFavorites handles non-ok response gracefully', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, json: async () => ({}) })))
    const res = await favorites.getFavorites()
    expect(Array.isArray(res)).toBe(true)
    expect(res.length).toBe(0)
  })

  it('addFavorite updates cache when created', async () => {
    const created = { id: '2', tenantId: 't', userId: 'u', settingKey: 'bar', route: '/b', label: 'Bar', createdAt: new Date().toISOString() }
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ data: created }) })))

    const out = await favorites.addFavorite({ settingKey: 'bar', route: '/b', label: 'Bar' })
    expect(out).toEqual(created)
    const map = favorites.readFavoritesCachedMap()
    expect(map).toHaveProperty('bar')
  })

  it('removeFavorite removes from cache when ok', async () => {
    sessionStorage.setItem('settings:favorites', JSON.stringify({ baz: true }))
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true })))
    const ok = await favorites.removeFavorite('baz')
    expect(ok).toBe(true)
    const map = favorites.readFavoritesCachedMap()
    expect(map && map.baz).toBe(undefined)
  })
})
