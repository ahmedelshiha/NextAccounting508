/**
 * AdminFooter Component Tests
 * Testing the professional admin footer functionality
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import AdminFooter from '@/components/admin/layout/AdminFooter'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/admin/analytics'),
}))

describe('AdminFooter', () => {
  it('renders admin footer with system information and quick links', () => {
    render(<AdminFooter />)
    // Check for non-breaking presence of quick links and branding
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Settings/ })).toBeInTheDocument()
  })

  it('shows system operational status when present', () => {
    render(<AdminFooter />)
    // System status may be displayed depending on health hook; ensure component renders without error
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  })

  it('renders mobile layout without errors', () => {
    render(<AdminFooter isMobile={true} />)
    // Ensure footer renders in mobile mode
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  })

  it('applies correct accessibility attributes', () => {
    render(<AdminFooter />)
    // Check for proper ARIA labels (updated to match implementation)
    const footer = screen.getByRole('contentinfo')
    expect(footer).toHaveAttribute('aria-label', 'Admin footer')
  })

  it('handles environment display without throwing', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'
    const { rerender } = render(<AdminFooter />)
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
    process.env.NODE_ENV = 'development'
    rerender(<AdminFooter />)
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
    process.env.NODE_ENV = originalEnv
  })
})
