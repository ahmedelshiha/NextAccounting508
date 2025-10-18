import { setupBookingsMocks } from '../helpers/targetedMocks'
import { beforeEach } from 'vitest'

export function setupBookings(overrides: { bookings?: any[] } = {}) {
  return setupBookingsMocks(overrides)
}

export default function autoSetupBookings(overrides: { bookings?: any[] } = {}) {
  const data = setupBookings(overrides)
  beforeEach(() => {
    setupBookingsMocks(overrides)
  })
  return data
}
