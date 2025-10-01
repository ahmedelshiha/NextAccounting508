import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import SettingsNavigation from '@/components/admin/SettingsNavigation'
import SETTINGS_REGISTRY from '@/lib/settings/registry'

beforeEach(() => {
  // mock pathname to root of settings so active link logic can run
  vi.mocked(require('next/navigation'), true)
})

describe('SettingsNavigation integration (jsdom)', () => {
  it('renders nav items with correct hrefs', () => {
    render(<SettingsNavigation />)

    for (const item of SETTINGS_REGISTRY) {
      const linkText = item.label
      const el = screen.getByText(linkText)
      expect(el).toBeTruthy()
      // anchor is the closest ancestor
      const anchor = el.closest('a')
      expect(anchor).toBeTruthy()
      // href should end with the route
      expect(anchor!.getAttribute('href')!.endsWith(item.route)).toBe(true)
    }
  })
})
