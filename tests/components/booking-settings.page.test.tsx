import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('next-auth/react', () => ({ useSession: () => ({ data: { user: { role: 'ADMIN' } }, status: 'authenticated' }) }))
vi.mock('@/components/admin/BookingSettingsPanel', () => ({ default: () => <div data-testid="booking-panel">booking-panel</div> }))
vi.mock('next/navigation', () => ({ usePathname: () => '/admin/settings/booking' }))

import AdminBookingSettingsPage from '@/app/admin/settings/booking/page'

describe('AdminBookingSettingsPage', () => {
  it('renders booking panel inside settings shell', () => {
    render(<AdminBookingSettingsPage />)
    expect(screen.getByTestId('booking-panel')).toBeInTheDocument()
    expect(screen.getByText('Booking Settings')).toBeInTheDocument()
  })
})
