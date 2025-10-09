import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { SettingsProvider, useOrgSettings } from '@/components/providers/SettingsProvider'

function Consumer() {
  const { settings } = useOrgSettings()
  return <div>{settings?.name ?? 'no-name'}</div>
}

describe('SettingsProvider integration', () => {
  let originalFetch: any

  beforeEach(() => {
    originalFetch = global.fetch
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.restoreAllMocks()
  })

  it('hydrates from initialSettings prop', () => {
    const { container, unmount } = render(
      <SettingsProvider initialSettings={{ name: 'Acme Co', logoUrl: null, contactEmail: null, contactPhone: null, legalLinks: null, defaultLocale: 'en' }}>
        <Consumer />
      </SettingsProvider>
    )
    try {
      const el = screen.getByText('Acme Co')
      expect(el.textContent).toBe('Acme Co')
    } finally {
      unmount()
    }
  })

  it('fetches public org settings when no initialSettings provided', async () => {
    global.fetch = vi.fn(async (url: any) => {
      if (String(url).endsWith('/api/public/org-settings')) {
        return { ok: true, json: async () => ({ name: 'Fetched Org', logoUrl: null, contactEmail: null, contactPhone: null, legalLinks: null, defaultLocale: 'en' }) }
      }
      return { ok: false }
    }) as any

    const { container, unmount } = render(
      <SettingsProvider>
        <Consumer />
      </SettingsProvider>
    )

    try {
      await waitFor(() => expect(screen.getByText('Fetched Org')).toBeInTheDocument())
      const el = screen.getByText('Fetched Org')
      expect(el.textContent).toBe('Fetched Org')
    } finally {
      unmount()
    }
  })

  it('refreshes when cross-tab storage event or custom event is dispatched', async () => {
    // initial fetch returns Old Org
    global.fetch = vi.fn(async (url: any) => {
      if (String(url).endsWith('/api/public/org-settings')) {
        return { ok: true, json: async () => ({ name: 'Old Org', logoUrl: null, contactEmail: null, contactPhone: null, legalLinks: null, defaultLocale: 'en' }) }
      }
      return { ok: false }
    }) as any

    const { container, unmount } = render(
      <SettingsProvider>
        <Consumer />
      </SettingsProvider>
    )

    try {
      await waitFor(() => expect(screen.getByText('Old Org')).toBeInTheDocument())
      expect(screen.getByText('Old Org').textContent).toBe('Old Org')

      // change fetch to return New Org on refresh
      ;(global.fetch as any).mockImplementationOnce(async (url: any) => {
        if (String(url).endsWith('/api/public/org-settings')) {
          return { ok: true, json: async () => ({ name: 'New Org', logoUrl: null, contactEmail: null, contactPhone: null, legalLinks: null, defaultLocale: 'en' }) }
        }
        return { ok: false }
      })

      // simulate localStorage cross-tab event
      try {
        localStorage.setItem('org-settings-updated', String(Date.now()))
      } catch {}
      const storageEvent = new StorageEvent('storage', { key: 'org-settings-updated', newValue: String(Date.now()) })
      window.dispatchEvent(storageEvent)

      // allow handler to run
      await waitFor(() => expect(screen.getByText('New Org')).toBeInTheDocument())
      expect(screen.getByText('New Org').textContent).toBe('New Org')

      // now test custom event path
      ;(global.fetch as any).mockImplementationOnce(async (url: any) => {
        if (String(url).endsWith('/api/public/org-settings')) {
          return { ok: true, json: async () => ({ name: 'Newest Org', logoUrl: null, contactEmail: null, contactPhone: null, legalLinks: null, defaultLocale: 'en' }) }
        }
        return { ok: false }
      })

      window.dispatchEvent(new Event('org-settings-updated'))
      await waitFor(() => expect(screen.getByText('Newest Org')).toBeInTheDocument())
      expect(screen.getByText('Newest Org').textContent).toBe('Newest Org')
    } finally {
      unmount()
    }
  })
})
