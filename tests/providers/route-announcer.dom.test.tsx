import { describe, it, expect, vi } from 'vitest'
import { renderDOM } from '../../test-mocks/dom'
import AccessibleRouteAnnouncer from '@/components/providers/RouteAnnouncer'

vi.mock('next/navigation', () => ({ usePathname: () => '/services' }))

describe('AccessibleRouteAnnouncer', () => {
  it('renders a polite live region with navigation message', () => {
    const { container, unmount } = renderDOM(<AccessibleRouteAnnouncer />)
    try {
      const region = container.querySelector('[aria-live="polite"][role="status"]') as HTMLElement
      expect(region).toBeTruthy()
      expect(region.textContent || '').toMatch(/Navigated to/i)
    } finally {
      unmount()
    }
  })
})
