import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import SettingsNavigation from '@/components/admin/SettingsNavigation'

let mockPath = '/admin/settings/booking'
vi.mock('next/navigation', () => ({ usePathname: () => mockPath }))
vi.mock('next-auth/react', () => ({ useSession: () => ({ data: { user: { role: 'ADMIN' } } }) }))

describe('SettingsNavigation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPath = '/admin/settings/booking'
  })

  it('renders group headings from registry and items', () => {
    render(<SettingsNavigation />)
    expect(screen.getByText('Platform')).toBeInTheDocument()
    expect(screen.getByText('Business')).toBeInTheDocument()
    expect(screen.getByText('Security')).toBeInTheDocument()

    // Some registry items should be present
    expect(screen.getByText('Organization Settings')).toBeInTheDocument()
    expect(screen.getByText('Booking Configuration')).toBeInTheDocument()
  })

  it('marks the active route with aria-current', () => {
    render(<SettingsNavigation />)
    const active = screen.getByText('Booking Configuration').closest('a')
    expect(active).toHaveAttribute('aria-current', 'page')
  })
})
