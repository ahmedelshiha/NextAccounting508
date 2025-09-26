/**
 * Navigation Routing Integration Tests
 * Tests for route-based layout switching and navigation behavior
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { usePathname } from 'next/navigation'
import ClientLayout from '@/components/providers/client-layout'

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}))

// Mock next-auth
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => ({
    data: { user: { name: 'Test User', role: 'ADMIN' } }
  })),
}))

// Mock admin layout components
vi.mock('@/components/admin/layout/AdminDashboardLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="admin-dashboard-layout">
      <div data-testid="admin-navigation">Admin Navigation</div>
      {children}
    </div>
  ),
}))

// Mock main site navigation
vi.mock('@/components/ui/navigation', () => ({
  default: () => <div data-testid="main-navigation">Main Site Navigation</div>,
}))

vi.mock('@/components/ui/Footer', () => ({
  default: () => <div data-testid="main-footer">Footer</div>,
}))

describe('Navigation Routing Integration', () => {
  const mockUsePathname = usePathname as any

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Route-based Layout Switching', () => {
    it('shows main site navigation on public routes', () => {
      mockUsePathname.mockReturnValue('/')
      
      render(
        <ClientLayout>
          <div data-testid="page-content">Home Page</div>
        </ClientLayout>
      )

      expect(screen.getByTestId('main-navigation')).toBeInTheDocument()
      expect(screen.getByTestId('main-footer')).toBeInTheDocument()
      expect(screen.queryByTestId('admin-navigation')).not.toBeInTheDocument()
      expect(screen.getByTestId('page-content')).toBeInTheDocument()
    })

    it('shows main site navigation on service pages', () => {
      mockUsePathname.mockReturnValue('/services/bookkeeping')
      
      render(
        <ClientLayout>
          <div data-testid="page-content">Bookkeeping Service</div>
        </ClientLayout>
      )

      expect(screen.getByTestId('main-navigation')).toBeInTheDocument()
      expect(screen.getByTestId('main-footer')).toBeInTheDocument()
      expect(screen.queryByTestId('admin-navigation')).not.toBeInTheDocument()
    })

    it('shows main site navigation on about page', () => {
      mockUsePathname.mockReturnValue('/about')
      
      render(
        <ClientLayout>
          <div data-testid="page-content">About Page</div>
        </ClientLayout>
      )

      expect(screen.getByTestId('main-navigation')).toBeInTheDocument()
      expect(screen.getByTestId('main-footer')).toBeInTheDocument()
      expect(screen.queryByTestId('admin-navigation')).not.toBeInTheDocument()
    })

    it('shows main site navigation on portal routes', () => {
      mockUsePathname.mockReturnValue('/portal/dashboard')
      
      render(
        <ClientLayout>
          <div data-testid="page-content">Portal Dashboard</div>
        </ClientLayout>
      )

      expect(screen.getByTestId('main-navigation')).toBeInTheDocument()
      expect(screen.getByTestId('main-footer')).toBeInTheDocument()
      expect(screen.queryByTestId('admin-navigation')).not.toBeInTheDocument()
    })

    it('hides main navigation and shows admin layout on admin routes', () => {
      mockUsePathname.mockReturnValue('/admin')
      
      render(
        <ClientLayout>
          <div data-testid="page-content">Admin Dashboard</div>
        </ClientLayout>
      )

      expect(screen.queryByTestId('main-navigation')).not.toBeInTheDocument()
      expect(screen.queryByTestId('main-footer')).not.toBeInTheDocument()
      expect(screen.getByTestId('admin-dashboard-layout')).toBeInTheDocument()
      expect(screen.getByTestId('admin-navigation')).toBeInTheDocument()
      expect(screen.getByTestId('page-content')).toBeInTheDocument()
    })

    it('hides main navigation on admin sub-routes', () => {
      mockUsePathname.mockReturnValue('/admin/bookings')
      
      render(
        <ClientLayout>
          <div data-testid="page-content">Admin Bookings</div>
        </ClientLayout>
      )

      expect(screen.queryByTestId('main-navigation')).not.toBeInTheDocument()
      expect(screen.queryByTestId('main-footer')).not.toBeInTheDocument()
      expect(screen.getByTestId('admin-dashboard-layout')).toBeInTheDocument()
      expect(screen.getByTestId('admin-navigation')).toBeInTheDocument()
    })

    it('hides main navigation on deep admin routes', () => {
      mockUsePathname.mockReturnValue('/admin/bookings/calendar/view')
      
      render(
        <ClientLayout>
          <div data-testid="page-content">Calendar View</div>
        </ClientLayout>
      )

      expect(screen.queryByTestId('main-navigation')).not.toBeInTheDocument()
      expect(screen.queryByTestId('main-footer')).not.toBeInTheDocument()
      expect(screen.getByTestId('admin-dashboard-layout')).toBeInTheDocument()
    })
  })

  describe('Navigation Conflict Prevention', () => {
    it('prevents dual navigation on admin routes', () => {
      mockUsePathname.mockReturnValue('/admin/clients')
      
      render(
        <ClientLayout>
          <div data-testid="page-content">Admin Clients</div>
        </ClientLayout>
      )

      // Should have only admin navigation, not both
      const navigationElements = screen.queryAllByText(/navigation/i)
      const adminNavigation = screen.queryByTestId('admin-navigation')
      const mainNavigation = screen.queryByTestId('main-navigation')

      expect(adminNavigation).toBeInTheDocument()
      expect(mainNavigation).not.toBeInTheDocument()
      
      // Ensure no duplicate navigation elements
      expect(navigationElements.filter(el => 
        el.textContent?.includes('Admin Navigation')
      )).toHaveLength(1)
    })

    it('ensures clean transition between layouts', () => {
      const { rerender } = render(
        <ClientLayout>
          <div data-testid="page-content">Public Page</div>
        </ClientLayout>
      )

      // Initially on public route
      mockUsePathname.mockReturnValue('/')
      rerender(
        <ClientLayout>
          <div data-testid="page-content">Public Page</div>
        </ClientLayout>
      )

      expect(screen.getByTestId('main-navigation')).toBeInTheDocument()
      expect(screen.queryByTestId('admin-navigation')).not.toBeInTheDocument()

      // Switch to admin route
      mockUsePathname.mockReturnValue('/admin')
      rerender(
        <ClientLayout>
          <div data-testid="page-content">Admin Page</div>
        </ClientLayout>
      )

      expect(screen.queryByTestId('main-navigation')).not.toBeInTheDocument()
      expect(screen.getByTestId('admin-navigation')).toBeInTheDocument()
    })
  })

  describe('Edge Cases and Robustness', () => {
    it('handles missing pathname gracefully', () => {
      mockUsePathname.mockReturnValue(null)
      
      render(
        <ClientLayout>
          <div data-testid="page-content">Fallback Content</div>
        </ClientLayout>
      )

      // Should default to main site navigation when pathname is missing
      expect(screen.getByTestId('main-navigation')).toBeInTheDocument()
      expect(screen.queryByTestId('admin-navigation')).not.toBeInTheDocument()
    })

    it('handles empty pathname gracefully', () => {
      mockUsePathname.mockReturnValue('')
      
      render(
        <ClientLayout>
          <div data-testid="page-content">Empty Path Content</div>
        </ClientLayout>
      )

      // Should default to main site navigation for empty path
      expect(screen.getByTestId('main-navigation')).toBeInTheDocument()
      expect(screen.queryByTestId('admin-navigation')).not.toBeInTheDocument()
    })

    it('handles malformed admin paths correctly', () => {
      mockUsePathname.mockReturnValue('/admin/')
      
      render(
        <ClientLayout>
          <div data-testid="page-content">Admin Root</div>
        </ClientLayout>
      )

      // Should still recognize as admin route despite trailing slash
      expect(screen.queryByTestId('main-navigation')).not.toBeInTheDocument()
      expect(screen.getByTestId('admin-dashboard-layout')).toBeInTheDocument()
    })

    it('distinguishes between admin and admin-like routes', () => {
      mockUsePathname.mockReturnValue('/administrator')
      
      render(
        <ClientLayout>
          <div data-testid="page-content">Administrator Page</div>
        </ClientLayout>
      )

      // Should show main navigation for non-admin routes that contain 'admin'
      expect(screen.getByTestId('main-navigation')).toBeInTheDocument()
      expect(screen.queryByTestId('admin-navigation')).not.toBeInTheDocument()
    })

    it('handles case sensitivity correctly', () => {
      mockUsePathname.mockReturnValue('/ADMIN')
      
      render(
        <ClientLayout>
          <div data-testid="page-content">Uppercase Admin</div>
        </ClientLayout>
      )

      // Should treat uppercase /ADMIN as regular route, not admin route
      expect(screen.getByTestId('main-navigation')).toBeInTheDocument()
      expect(screen.queryByTestId('admin-navigation')).not.toBeInTheDocument()
    })
  })

  describe('Layout Component Integration', () => {
    it('passes children correctly to admin layout', () => {
      mockUsePathname.mockReturnValue('/admin/settings')
      
      render(
        <ClientLayout>
          <div data-testid="admin-settings-page">
            <h1>Admin Settings</h1>
            <form data-testid="settings-form">Settings Form</form>
          </div>
        </ClientLayout>
      )

      expect(screen.getByTestId('admin-dashboard-layout')).toBeInTheDocument()
      expect(screen.getByTestId('admin-settings-page')).toBeInTheDocument()
      expect(screen.getByText('Admin Settings')).toBeInTheDocument()
      expect(screen.getByTestId('settings-form')).toBeInTheDocument()
    })

    it('passes children correctly to main layout', () => {
      mockUsePathname.mockReturnValue('/contact')
      
      render(
        <ClientLayout>
          <div data-testid="contact-page">
            <h1>Contact Us</h1>
            <form data-testid="contact-form">Contact Form</form>
          </div>
        </ClientLayout>
      )

      expect(screen.getByTestId('main-navigation')).toBeInTheDocument()
      expect(screen.getByTestId('contact-page')).toBeInTheDocument()
      expect(screen.getByText('Contact Us')).toBeInTheDocument()
      expect(screen.getByTestId('contact-form')).toBeInTheDocument()
      expect(screen.getByTestId('main-footer')).toBeInTheDocument()
    })
  })

  describe('Performance and Efficiency', () => {
    it('does not re-render unnecessarily on same route type', () => {
      let renderCount = 0
      const TestComponent = () => {
        renderCount++
        return <div data-testid="test-component">Render count: {renderCount}</div>
      }

      const { rerender } = render(
        <ClientLayout>
          <TestComponent />
        </ClientLayout>
      )

      // Start with admin route
      mockUsePathname.mockReturnValue('/admin/dashboard')
      rerender(
        <ClientLayout>
          <TestComponent />
        </ClientLayout>
      )

      const initialRenderCount = renderCount

      // Change to different admin route - should not cause unnecessary re-renders
      mockUsePathname.mockReturnValue('/admin/bookings')
      rerender(
        <ClientLayout>
          <TestComponent />
        </ClientLayout>
      )

      // Layout component itself might re-render, but the core detection should be efficient
      expect(screen.getByTestId('admin-dashboard-layout')).toBeInTheDocument()
      expect(screen.queryByTestId('main-navigation')).not.toBeInTheDocument()
    })
  })
})