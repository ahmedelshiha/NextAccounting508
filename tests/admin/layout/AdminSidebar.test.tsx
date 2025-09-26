/**
 * AdminSidebar Component Tests
 * Unit tests for the fixed sidebar navigation component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import AdminSidebar from '@/components/admin/layout/AdminSidebar'
import { hasRole } from '@/lib/permissions'

// Mock dependencies
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}))

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}))

vi.mock('@/stores/adminLayoutStore', () => ({
  useAdminLayout: vi.fn(() => ({
    navigation: {},
  })),
}))

vi.mock('@/lib/permissions', () => ({
  hasRole: vi.fn(),
}))

describe('AdminSidebar', () => {
  const mockUsePathname = usePathname as any
  const mockUseSession = useSession as any
  const mockHasRole = hasRole as any

  const defaultProps = {
    collapsed: false,
    isOpen: false,
    isMobile: false,
    onToggle: vi.fn(),
    onClose: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    mockUsePathname.mockReturnValue('/admin')
    mockUseSession.mockReturnValue({
      data: {
        user: { 
          name: 'Test User', 
          email: 'test@example.com', 
          role: 'ADMIN' 
        }
      }
    })
    mockHasRole.mockReturnValue(true)
  })

  it('renders sidebar with brand section', () => {
    render(<AdminSidebar {...defaultProps} />)
    
    expect(screen.getByText('Admin')).toBeInTheDocument()
    expect(screen.getByText('Accounting Dashboard')).toBeInTheDocument()
    expect(screen.getByText('AF')).toBeInTheDocument() // Brand logo
  })

  it('renders navigation items correctly', () => {
    render(<AdminSidebar {...defaultProps} />)
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Bookings')).toBeInTheDocument()
    expect(screen.getByText('Clients')).toBeInTheDocument()
    expect(screen.getByText('Service Requests')).toBeInTheDocument()
    expect(screen.getByText('Analytics')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('highlights active navigation item', () => {
    mockUsePathname.mockReturnValue('/admin/bookings')
    
    render(<AdminSidebar {...defaultProps} />)
    
    const bookingsLink = screen.getByText('Bookings').closest('a')
    expect(bookingsLink).toHaveClass('bg-blue-50', 'text-blue-700')
    expect(bookingsLink).toHaveAttribute('aria-current', 'page')
  })

  it('shows correct active state for dashboard route', () => {
    mockUsePathname.mockReturnValue('/admin')
    
    render(<AdminSidebar {...defaultProps} />)
    
    const dashboardLink = screen.getByText('Dashboard').closest('a')
    expect(dashboardLink).toHaveClass('bg-blue-50', 'text-blue-700')
    expect(dashboardLink).toHaveAttribute('aria-current', 'page')
  })

  it('displays badges for items with counts', () => {
    render(<AdminSidebar {...defaultProps} />)
    
    // Bookings should have badge "12"
    expect(screen.getByText('12')).toBeInTheDocument()
    
    // Service Requests should have badge "3"
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('filters navigation items by permissions', () => {
    // Mock hasRole to deny settings access
    mockHasRole.mockImplementation((role, allowedRoles) => {
      if (allowedRoles && allowedRoles.includes('ADMIN')) {
        return role === 'ADMIN'
      }
      return true
    })

    mockUseSession.mockReturnValue({
      data: { user: { role: 'TEAM_MEMBER' } }
    })

    render(<AdminSidebar {...defaultProps} />)
    
    // Settings should be hidden for TEAM_MEMBER
    expect(screen.queryByText('Settings')).not.toBeInTheDocument()
    
    // Other items should still be visible
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Bookings')).toBeInTheDocument()
  })

  it('handles collapsed state correctly', () => {
    render(<AdminSidebar {...defaultProps} collapsed={true} />)
    
    // Brand text should be hidden when collapsed
    expect(screen.queryByText('Admin')).not.toBeInTheDocument()
    expect(screen.queryByText('Accounting Dashboard')).not.toBeInTheDocument()
    
    // Navigation text should be hidden
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument()
    
    // But icons should still be present (via titles)
    const dashboardLink = screen.getByTitle('Dashboard')
    expect(dashboardLink).toBeInTheDocument()
  })

  it('shows quick actions button when not collapsed', () => {
    render(<AdminSidebar {...defaultProps} />)
    
    const newButton = screen.getByText('New')
    expect(newButton).toBeInTheDocument()
    expect(newButton).toHaveAttribute('aria-label', 'Create new item')
  })

  it('hides quick actions button when collapsed', () => {
    render(<AdminSidebar {...defaultProps} collapsed={true} />)
    
    expect(screen.queryByText('New')).not.toBeInTheDocument()
  })

  it('displays user profile section', () => {
    render(<AdminSidebar {...defaultProps} />)
    
    expect(screen.getByText('Test User')).toBeInTheDocument()
    expect(screen.getByText('ADMIN')).toBeInTheDocument()
    expect(screen.getByText('Operational')).toBeInTheDocument()
  })

  it('handles mobile behavior correctly', () => {
    const onCloseMock = vi.fn()
    
    render(
      <AdminSidebar 
        {...defaultProps} 
        isMobile={true} 
        isOpen={true}
        onClose={onCloseMock}
      />
    )
    
    // Should show mobile-specific close button
    const closeButton = screen.getByLabelText('Close sidebar')
    expect(closeButton).toBeInTheDocument()
    
    fireEvent.click(closeButton)
    expect(onCloseMock).toHaveBeenCalledTimes(1)
  })

  it('handles navigation item clicks on mobile', () => {
    const onCloseMock = vi.fn()
    
    render(
      <AdminSidebar 
        {...defaultProps} 
        isMobile={true} 
        isOpen={true}
        onClose={onCloseMock}
      />
    )
    
    const dashboardLink = screen.getByText('Dashboard')
    fireEvent.click(dashboardLink)
    
    // Should close sidebar on mobile when navigation item is clicked
    expect(onCloseMock).toHaveBeenCalledTimes(1)
  })

  it('handles toggle button correctly', () => {
    const onToggleMock = vi.fn()
    
    render(<AdminSidebar {...defaultProps} onToggle={onToggleMock} />)
    
    const toggleButton = screen.getByLabelText('Collapse sidebar')
    fireEvent.click(toggleButton)
    
    expect(onToggleMock).toHaveBeenCalledTimes(1)
  })

  it('applies correct ARIA attributes', () => {
    render(<AdminSidebar {...defaultProps} />)
    
    const sidebar = screen.getByRole('navigation', { name: 'Admin sidebar' })
    expect(sidebar).toHaveAttribute('aria-expanded', 'true')
    expect(sidebar).toHaveAttribute('aria-label', 'Admin sidebar')
  })

  it('applies correct CSS classes for positioning', () => {
    render(<AdminSidebar {...defaultProps} />)
    
    const sidebar = screen.getByRole('navigation', { name: 'Admin sidebar' })
    expect(sidebar).toHaveClass(
      'fixed',
      'left-0',
      'top-0',
      'h-full',
      'bg-white',
      'border-r',
      'z-50'
    )
  })

  it('shows mobile width when isMobile is true', () => {
    render(<AdminSidebar {...defaultProps} isMobile={true} isOpen={true} />)
    
    const sidebar = screen.getByRole('navigation', { name: 'Admin sidebar' })
    expect(sidebar).toHaveClass('w-72', 'translate-x-0')
  })

  it('shows collapsed width when collapsed on desktop', () => {
    render(<AdminSidebar {...defaultProps} collapsed={true} />)
    
    const sidebar = screen.getByRole('navigation', { name: 'Admin sidebar' })
    expect(sidebar).toHaveClass('w-16', 'translate-x-0')
  })

  it('hides sidebar on mobile when not open', () => {
    render(<AdminSidebar {...defaultProps} isMobile={true} isOpen={false} />)
    
    const sidebar = screen.getByRole('navigation', { name: 'Admin sidebar' })
    expect(sidebar).toHaveClass('-translate-x-full')
  })

  it('handles missing user session gracefully', () => {
    mockUseSession.mockReturnValue({ data: null })
    
    render(<AdminSidebar {...defaultProps} />)
    
    expect(screen.getByText('User')).toBeInTheDocument()
    expect(screen.getByText('Admin')).toBeInTheDocument()
  })

  it('handles missing user role gracefully', () => {
    mockUseSession.mockReturnValue({
      data: { user: { name: 'Test User' } } // No role
    })
    
    render(<AdminSidebar {...defaultProps} />)
    
    expect(screen.getByText('Test User')).toBeInTheDocument()
    expect(screen.getByText('Admin')).toBeInTheDocument() // Default role
  })

  it('displays correct toggle button label based on collapsed state', () => {
    const { rerender } = render(<AdminSidebar {...defaultProps} collapsed={false} />)
    
    expect(screen.getByLabelText('Collapse sidebar')).toBeInTheDocument()
    
    rerender(<AdminSidebar {...defaultProps} collapsed={true} />)
    
    expect(screen.getByLabelText('Expand sidebar')).toBeInTheDocument()
  })
})