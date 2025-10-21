import React from 'react'
import { render, screen, fireEvent, waitFor } from '../../test-mocks/testing-library-react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

import FavoriteToggle from '@/components/admin/settings/FavoriteToggle'
import SettingsOverview, { PinnedSettingsList } from '@/components/admin/settings/SettingsOverview'

describe('Favorites pinning', () => {
  let fetchMock: any
  let dispatchSpy: any

  beforeEach(() => {
    fetchMock = vi.fn((url, init) => {
      // GET favorites
      if (!init || !init.method) {
        return Promise.resolve({ ok: true, json: async () => ({ data: [{ id: 'fav-1', settingKey: 'booking', route: '/admin/settings/booking', label: 'Booking Configuration' }] }) })
      }
      if (init.method === 'POST') {
        return Promise.resolve({ ok: true, json: async () => ({ data: { id: 'fav-new', settingKey: 'booking', route: '/admin/settings/booking', label: 'Booking Configuration' } }) })
      }
      if (init.method === 'DELETE') {
        return Promise.resolve({ ok: true, json: async () => ({ ok: true }) })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })
    ;(global as any).fetch = fetchMock
    dispatchSpy = vi.spyOn(window, 'dispatchEvent')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('FavoriteToggle renders pinned state when already favorited', async () => {
    // Mock GET to return favorite (booking)
    (global as any).fetch = vi.fn((url, init) => {
      if (!init || !init.method) return Promise.resolve({ ok: true, json: async () => ({ data: [{ id: 'fav-1', settingKey: 'booking', route: '/admin/settings/booking', label: 'Booking Configuration' }] }) })
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })

    render(<FavoriteToggle initiallyPinned={true} settingKey="booking" route="/admin/settings/booking" label="Booking Configuration" />)

    // Since renderToStaticMarkup is used, pass initiallyPinned to show pinned state synchronously
    const pinnedText = await screen.findByText('Pinned')
    expect(pinnedText).toBeTruthy()
  })

  it('favorites.service functions work with fetch', async () => {
    (global as any).fetch = vi.fn((url, init) => {
      if (!init || !init.method) return Promise.resolve({ ok: true, json: async () => ({ data: [{ id: 'fav-1', settingKey: 'booking', route: '/admin/settings/booking', label: 'Booking Configuration' }] }) })
      if (init.method === 'POST') return Promise.resolve({ ok: true, json: async () => ({ data: { id: 'fav-new', settingKey: 'x', route: '/r', label: 'L' } }) })
      if (init.method === 'DELETE') return Promise.resolve({ ok: true })
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })

    const { getFavorites, addFavorite, removeFavorite } = await import('@/services/favorites.service')

    const list = await getFavorites()
    expect(Array.isArray(list)).toBe(true)
    const added = await addFavorite({ settingKey: 'x', route: '/r', label: 'L' })
    expect(added && added.settingKey).toBe('x')
    const removed = await removeFavorite('x')
    expect(removed).toBe(true)
  })
})
