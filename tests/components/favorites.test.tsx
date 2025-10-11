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

    render(<FavoriteToggle settingKey="booking" route="/admin/settings/booking" label="Booking Configuration" />)

    // Since renderToStaticMarkup is used, component will hydrate initial state and show 'Pinned'
    const pinnedText = await screen.findByText('Pinned')
    expect(pinnedText).toBeTruthy()
  })

  it('PinnedSettingsList shows pinned settings list', async () => {
    // Mock GET to return one favorite
    (global as any).fetch = vi.fn((url, init) => {
      if (!init || !init.method) return Promise.resolve({ ok: true, json: async () => ({ data: [{ id: 'fav-1', settingKey: 'booking', route: '/admin/settings/booking', label: 'Booking Configuration' }] }) })
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })

    render(<PinnedSettingsList />)

    // Wait for the pinned item to render
    const item = await screen.findByText('Booking Configuration')
    expect(item).toBeInTheDocument()
  })
})
