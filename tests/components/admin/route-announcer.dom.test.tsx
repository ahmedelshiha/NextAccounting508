import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test-mocks/testing-library-react'
import AccessibleRouteAnnouncer from '@/components/providers/RouteAnnouncer'

describe('AccessibleRouteAnnouncer', () => {
  it('renders a polite live region with role status', () => {
    render(<AccessibleRouteAnnouncer />)
    const region = screen.getByTestId('route-announcer')
    expect(region).toHaveAttribute('aria-live', 'polite')
    expect(region).toHaveAttribute('role', 'status')
  })
})
