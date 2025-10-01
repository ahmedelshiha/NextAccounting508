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
    expect(screen.getByText('Platform')).toBeTruthy()
    expect(screen.getByText('Business')).toBeTruthy()
    expect(screen.getByText('Security')).toBeTruthy()

    // Some registry items should be present
    expect(screen.getByText('Organization Settings')).toBeTruthy()
    expect(screen.getByText('Booking Configuration')).toBeTruthy()
  })

  it('renders booking item when pathname targets booking route', () => {
    render(<SettingsNavigation />)
    expect(screen.getByText('Booking Configuration')).toBeTruthy()
  })
})
