import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test-mocks/testing-library-react'
import AccessibleRouteAnnouncer from '@/components/providers/RouteAnnouncer'

vi.mock('next/navigation', () => ({ usePathname: () => '/services' }))

describe('AccessibleRouteAnnouncer', () => {
  it('renders a polite live region with navigation message', () => {
    render(<AccessibleRouteAnnouncer />)

    const region = screen.getByRole('status')
    expect(region).toBeTruthy()
    expect(region.textContent || '').toMatch(/Navigated to/i)
  })
})
