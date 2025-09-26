/**
 * AdminDashboardLayout Component Tests
 * Unit tests for the main admin dashboard layout wrapper
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import AdminDashboardLayout from '@/components/admin/layout/AdminDashboardLayout'
import { useResponsive } from '@/hooks/admin/useResponsive'
import { useAdminLayout } from '@/stores/adminLayoutStore'

// Mock dependencies
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}))

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}))

vi.mock('@/hooks/admin/useResponsive', () => ({
  useResponsive: vi.fn(),
}))

vi.mock('@/stores/adminLayoutStore', () => ({
  useAdminLayout: vi.fn(),
}))

vi.mock('@/components/admin/layout/AdminSidebar', () => ({
  default: ({ collapsed, isOpen, onToggle, onClose }: any) => (
    <div data-testid="admin-sidebar">
      <button onClick={onToggle} data-testid="sidebar-toggle">
        Toggle
      </button>
      <div data-testid="sidebar-state">
        {collapsed ? 'collapsed' : 'expanded'} - {isOpen ? 'open' : 'closed'}
      </div>
    </div>
  ),
}))

vi.mock('@/components/admin/layout/AdminHeader', () => ({
  default: ({ onToggleSidebar, sidebarCollapsed, isMobile }: any) => (
    <div data-testid="admin-header">
      <button onClick={onToggleSidebar} data-testid="header-toggle">
        Header Toggle
      </button>
      <div data-testid="header-state">
        {sidebarCollapsed ? 'collapsed' : 'expanded'} - {isMobile ? 'mobile' : 'desktop'}
      </div>
    </div>
  ),
}))

describe('AdminDashboardLayout', () => {
  const mockUsePathname = usePathname as any
  const mockUseSession = useSession as any
  const mockUseResponsive = useResponsive as any
  const mockUseAdminLayout = useAdminLayout as any

  const defaultMockData = {
    responsive: {
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      breakpoint: 'desktop' as const,
      layoutVariant: 'desktop' as const,
    },
    sidebar: {
      collapsed: false,
      open: false,
      toggle: vi.fn(),
      setCollapsed: vi.fn(),
      setOpen: vi.fn(),
    },
    navigation: {
      setActiveItem: vi.fn(),
    },
    ui: {
      isLoading: false,
      error: null,
      setError: vi.fn(),
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    mockUsePathname.mockReturnValue('/admin/dashboard')
    mockUseSession.mockReturnValue({
      data: {
        user: { name: 'Test User', email: 'test@example.com', role: 'ADMIN' }
      }
    })
    mockUseResponsive.mockReturnValue(defaultMockData.responsive)
    mockUseAdminLayout.mockReturnValue({
      sidebar: defaultMockData.sidebar,
      navigation: defaultMockData.navigation,
      ui: defaultMockData.ui,
    })
  })

  it('renders admin dashboard layout with main components', () => {
    render(
      <AdminDashboardLayout>
        <div data-testid="test-content">Test Content</div>
      </AdminDashboardLayout>
    )

    expect(screen.getByTestId('admin-sidebar')).toBeInTheDocument()
    expect(screen.getByTestId('admin-header')).toBeInTheDocument()
    expect(screen.getByTestId('test-content')).toBeInTheDocument()
  })

  it('renders skip link for accessibility', () => {
    render(
      <AdminDashboardLayout>
        <div>Content</div>
      </AdminDashboardLayout>
    )

    const skipLink = screen.getByText('Skip to main content')
    expect(skipLink).toBeInTheDocument()
    expect(skipLink).toHaveAttribute('href', '#admin-main-content')
  })

  it('handles sidebar toggle correctly', () => {
    const mockToggle = vi.fn()
    mockUseAdminLayout.mockReturnValue({
      ...defaultMockData,
      sidebar: { ...defaultMockData.sidebar, toggle: mockToggle },
    })

    render(
      <AdminDashboardLayout>
        <div>Content</div>
      </AdminDashboardLayout>
    )

    const toggleButton = screen.getByTestId('sidebar-toggle')
    fireEvent.click(toggleButton)
    
    expect(mockToggle).toHaveBeenCalledTimes(1)
  })

  it('displays mobile backdrop when sidebar is open on mobile', () => {
    mockUseResponsive.mockReturnValue({
      ...defaultMockData.responsive,
      isMobile: true,
    })

    mockUseAdminLayout.mockReturnValue({
      ...defaultMockData,
      sidebar: { ...defaultMockData.sidebar, open: true },
    })

    render(
      <AdminDashboardLayout>
        <div>Content</div>
      </AdminDashboardLayout>
    )

    const backdrop = screen.getByRole('presentation', { hidden: true })
    expect(backdrop).toBeInTheDocument()
    expect(backdrop).toHaveClass('bg-black', 'bg-opacity-50')
  })

  it('does not display backdrop on desktop', () => {
    mockUseResponsive.mockReturnValue({
      ...defaultMockData.responsive,
      isMobile: false,
    })

    render(
      <AdminDashboardLayout>
        <div>Content</div>
      </AdminDashboardLayout>
    )

    const backdrop = screen.queryByRole('presentation', { hidden: true })
    expect(backdrop).not.toBeInTheDocument()
  })

  it('displays loading state when isLoading is true', () => {
    mockUseAdminLayout.mockReturnValue({
      ...defaultMockData,
      ui: { ...defaultMockData.ui, isLoading: true },
    })

    render(
      <AdminDashboardLayout>
        <div>Content</div>
      </AdminDashboardLayout>
    )

    expect(screen.getByText('Loading...')).toBeInTheDocument()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('displays error state when error exists', () => {
    const errorMessage = 'Something went wrong'
    mockUseAdminLayout.mockReturnValue({
      ...defaultMockData,
      ui: { ...defaultMockData.ui, error: errorMessage },
    })

    render(
      <AdminDashboardLayout>
        <div>Content</div>
      </AdminDashboardLayout>
    )

    expect(screen.getByText('Error')).toBeInTheDocument()
    expect(screen.getByText(errorMessage)).toBeInTheDocument()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('dismisses error when close button is clicked', () => {
    const mockSetError = vi.fn()
    mockUseAdminLayout.mockReturnValue({
      ...defaultMockData,
      ui: { 
        ...defaultMockData.ui, 
        error: 'Test error',
        setError: mockSetError,
      },
    })

    render(
      <AdminDashboardLayout>
        <div>Content</div>
      </AdminDashboardLayout>
    )

    const dismissButton = screen.getByLabelText('Dismiss error')
    fireEvent.click(dismissButton)
    
    expect(mockSetError).toHaveBeenCalledWith(null)
  })

  it('sets active navigation item based on pathname', async () => {
    const mockSetActiveItem = vi.fn()
    mockUsePathname.mockReturnValue('/admin/bookings/calendar')
    mockUseAdminLayout.mockReturnValue({
      ...defaultMockData,
      navigation: { setActiveItem: mockSetActiveItem },
    })

    render(
      <AdminDashboardLayout>
        <div>Content</div>
      </AdminDashboardLayout>
    )

    await waitFor(() => {
      expect(mockSetActiveItem).toHaveBeenCalledWith('bookings')
    })
  })

  it('applies correct content margin classes based on sidebar state', () => {
    const { rerender } = render(
      <AdminDashboardLayout>
        <div data-testid="content">Content</div>
      </AdminDashboardLayout>
    )

    // Initially expanded sidebar (ml-64)
    const contentArea = screen.getByTestId('content').closest('.min-h-full')
    expect(contentArea).toHaveClass('ml-64')

    // Collapsed sidebar (ml-16)
    mockUseAdminLayout.mockReturnValue({
      ...defaultMockData,
      sidebar: { ...defaultMockData.sidebar, collapsed: true },
    })

    rerender(
      <AdminDashboardLayout>
        <div data-testid="content">Content</div>
      </AdminDashboardLayout>
    )

    expect(contentArea).toHaveClass('ml-16')
  })

  it('handles mobile sidebar behavior correctly', () => {
    const mockSetOpen = vi.fn()
    mockUseResponsive.mockReturnValue({
      ...defaultMockData.responsive,
      isMobile: true,
    })

    mockUseAdminLayout.mockReturnValue({
      ...defaultMockData,
      sidebar: { 
        ...defaultMockData.sidebar,
        setOpen: mockSetOpen,
        open: true,
      },
    })

    render(
      <AdminDashboardLayout>
        <div>Content</div>
      </AdminDashboardLayout>
    )

    // On mobile, content should have ml-0 (no margin)
    const contentArea = screen.getByText('Content').closest('.min-h-full')
    expect(contentArea).toHaveClass('ml-0')

    // Clicking backdrop should close mobile sidebar
    const backdrop = screen.getByRole('presentation', { hidden: true })
    fireEvent.click(backdrop)
    
    expect(mockSetOpen).toHaveBeenCalledWith(false)
  })

  it('focuses main content when skip link is clicked', () => {
    render(
      <AdminDashboardLayout>
        <div>Content</div>
      </AdminDashboardLayout>
    )

    const skipLink = screen.getByText('Skip to main content')
    const mainContent = screen.getByRole('main')
    
    // Mock the focus method
    const focusMock = vi.fn()
    mainContent.focus = focusMock

    fireEvent.click(skipLink)
    
    expect(focusMock).toHaveBeenCalledWith({ preventScroll: false })
  })

  it('shows debug info in development mode', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'

    render(
      <AdminDashboardLayout>
        <div>Content</div>
      </AdminDashboardLayout>
    )

    expect(screen.getByText(/Breakpoint:/)).toBeInTheDocument()
    expect(screen.getByText(/Sidebar:/)).toBeInTheDocument()
    expect(screen.getByText(/Mobile:/)).toBeInTheDocument()

    process.env.NODE_ENV = originalEnv
  })

  it('hides debug info in production mode', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'

    render(
      <AdminDashboardLayout>
        <div>Content</div>
      </AdminDashboardLayout>
    )

    expect(screen.queryByText(/Breakpoint:/)).not.toBeInTheDocument()
    
    process.env.NODE_ENV = originalEnv
  })
})