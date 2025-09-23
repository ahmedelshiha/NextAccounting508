import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test-mocks/testing-library-react'
import BookingSettingsPanel from '@/src/components/admin/BookingSettingsPanel'

// Note: test renderer is static and does not execute effects/handlers.
// This test verifies basic static render output (title presence).

describe('BookingSettingsPanel (static render)', () => {
  it('renders heading and actions', () => {
    const { container } = render(<BookingSettingsPanel /> as any)
    expect(container).toBeTruthy()
    expect(() => screen.getByText('Booking Settings')).not.toThrow()
    expect(() => screen.getByText('Export')).not.toThrow()
    expect(() => screen.getByText('Reset')).not.toThrow()
    expect(() => screen.getByText('Save Changes')).not.toThrow()
  })
})
