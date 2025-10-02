import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import React from 'react'
import { renderDOM } from '@/test-mocks/dom'
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
    const { container, unmount, getByText } = renderDOM(
      <SettingsProvider initialSettings={{ name: 'Acme Co', logoUrl: null, contactEmail: null, contactPhone: null, legalLinks: null, defaultLocale: 'en' }}>
        <Consumer />
      </SettingsProvider>
    )
    try {
      const el = getByText('Acme Co')
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

    const { container, unmount, getByText } = renderDOM(
      <SettingsProvider>
        <Consumer />
      </SettingsProvider>
    )

    try {
      // wait for effect to fetch and update
      await new Promise((r) => setTimeout(r, 0))
      const el = getByText('Fetched Org')
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

    const { container, unmount, getByText } = renderDOM(
      <SettingsProvider>
        <Consumer />
      </SettingsProvider>
    )

    try {
      await new Promise((r) => setTimeout(r, 0))
      expect(getByText('Old Org').textContent).toBe('Old Org')

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
      await new Promise((r) => setTimeout(r, 0))
      expect(getByText('New Org').textContent).toBe('New Org')

      // now test custom event path
      ;(global.fetch as any).mockImplementationOnce(async (url: any) => {
        if (String(url).endsWith('/api/public/org-settings')) {
          return { ok: true, json: async () => ({ name: 'Newest Org', logoUrl: null, contactEmail: null, contactPhone: null, legalLinks: null, defaultLocale: 'en' }) }
        }
        return { ok: false }
      })

      window.dispatchEvent(new Event('org-settings-updated'))
      await new Promise((r) => setTimeout(r, 0))
      expect(getByText('Newest Org').textContent).toBe('Newest Org')
    } finally {
      unmount()
    }
  })
})
