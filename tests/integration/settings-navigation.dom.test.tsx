import { describe, it, expect, vi } from 'vitest'

// Mock Next.js navigation and auth before importing components
vi.mock('next/navigation', () => ({
  usePathname: () => '/admin/settings',
}))
vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: { user: { role: 'ADMIN' } } }),
}))

import { render, screen } from '@testing-library/react'
import SettingsNavigation from '@/components/admin/SettingsNavigation'
import SETTINGS_REGISTRY from '@/lib/settings/registry'

describe('SettingsNavigation integration (jsdom)', () => {
  it('renders nav items with correct hrefs', () => {
    render(<SettingsNavigation />)

    for (const item of SETTINGS_REGISTRY) {
      const linkText = item.label
      const el = screen.getByText(linkText)
      expect(el).toBeTruthy()
      const anchor = el.closest('a')
      expect(anchor).toBeTruthy()
      expect(anchor!.getAttribute('href')!.endsWith(item.route)).toBe(true)
    }
  })
})
