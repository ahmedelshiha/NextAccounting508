import React from 'react'
import { render, screen, fireEvent, waitFor } from '../../test-mocks/testing-library-react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

import FavoriteToggle from '@/components/admin/settings/FavoriteToggle'
import SettingsOverview from '@/components/admin/settings/SettingsOverview'

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

  it('FavoriteToggle pins and dispatches update event', async () => {
    // initial GET in useEffect will return one favorite (booking) — simulate initiallyPinned false
    (global as any).fetch = vi.fn((url, init) => {
      if (!init || !init.method) return Promise.resolve({ ok: true, json: async () => ({ data: [] }) })
      if (init.method === 'POST') return Promise.resolve({ ok: true, json: async () => ({ data: { id: 'fav-1', settingKey: 'test', route: '/r', label: 'L' } }) })
      if (init.method === 'DELETE') return Promise.resolve({ ok: true })
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })

    render(<FavoriteToggle settingKey="booking" route="/admin/settings/booking" label="Booking Configuration" />)

    const btn = await screen.findByRole('button')
    expect(btn).toBeTruthy()

    fireEvent.click(btn)

    await waitFor(() => {
      expect((global as any).fetch).toHaveBeenCalled()
      // ensure POST was called
      expect((global as any).fetch.mock.calls.some((c: any) => c[1] && c[1].method === 'POST')).toBe(true)
    })

    // event dispatched
    expect(dispatchSpy).toHaveBeenCalled()
  })

  it('SettingsOverview shows pinned settings list', async () => {
    // Mock GET to return one favorite
    (global as any).fetch = vi.fn((url, init) => {
      if (!init || !init.method) return Promise.resolve({ ok: true, json: async () => ({ data: [{ id: 'fav-1', settingKey: 'booking', route: '/admin/settings/booking', label: 'Booking Configuration' }] }) })
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })

    render(<SettingsOverview />)

    // The Pinned Settings heading should be present
    expect(screen.getByText('Pinned Settings')).toBeInTheDocument()

    // Wait for the pinned item to render
    const item = await screen.findByText('Booking Configuration')
    expect(item).toBeInTheDocument()
  })
})
