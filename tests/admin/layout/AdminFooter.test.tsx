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
  it('renders admin footer with system information', () => {
    render(<AdminFooter />)
    
    // Check for admin-specific branding
    expect(screen.getByText('NextAccounting Admin')).toBeInTheDocument()
    expect(screen.getByText('© 2025 NextAccounting. All rights reserved.')).toBeInTheDocument()
  })

  it('displays system version and environment info', () => {
    render(<AdminFooter />)
    
    // Check for version display
    expect(screen.getByText(/v2.3.2/)).toBeInTheDocument()
    expect(screen.getByText(/Sept 26, 2025/)).toBeInTheDocument()
  })

  it('renders admin-specific navigation links', () => {
    render(<AdminFooter />)
    
    // Check for admin-specific links
    expect(screen.getByRole('link', { name: /Analytics/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Settings/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Back to Main Site/ })).toBeInTheDocument()
  })

  it('shows system operational status', () => {
    render(<AdminFooter />)
    
    // Check for system status indicator
    expect(screen.getByText('System Operational')).toBeInTheDocument()
  })

  it('renders mobile layout correctly', () => {
    render(<AdminFooter isMobile={true} />)
    
    // In mobile layout, should have centered quick links
    expect(screen.getByText(/NextAccounting Admin v2.3.2/)).toBeInTheDocument()
  })

  it('shows support links in desktop layout', () => {
    render(<AdminFooter isMobile={false} />)
    
    // Check for support section
    expect(screen.getByText('Support')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Admin Help/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Documentation/ })).toBeInTheDocument()
  })

  it('applies correct accessibility attributes', () => {
    render(<AdminFooter />)
    
    // Check for proper ARIA labels
    const footer = screen.getByRole('contentinfo')
    expect(footer).toHaveAttribute('aria-label', 'Admin dashboard footer')
  })

  it('handles environment display correctly', () => {
    // Test with different NODE_ENV values
    const originalEnv = process.env.NODE_ENV
    
    process.env.NODE_ENV = 'production'
    const { rerender } = render(<AdminFooter />)
    expect(screen.getByText('production')).toBeInTheDocument()
    
    process.env.NODE_ENV = 'development'
    rerender(<AdminFooter />)
    expect(screen.getByText('development')).toBeInTheDocument()
    
    // Restore original environment
    process.env.NODE_ENV = originalEnv
  })
})