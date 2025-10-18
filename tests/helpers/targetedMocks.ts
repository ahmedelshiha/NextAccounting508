import { mockTeamMembers, mockServices, mockBookings, mockServiceRequests, resetMocks } from './mockPresets'

export function setupTeamManagementMocks(overrides: { members?: any[] } = {}) {
  resetMocks()
  const members = overrides.members ?? [
    { id: 'tm-1', name: 'Test Member', email: 'tm1@example.com', title: 'Accountant', role: 'TEAM_MEMBER', department: 'general', isAvailable: true, status: 'active', userId: 'u1' },
  ]
  mockTeamMembers(members)
  return { members }
}

export function setupServicesMocks(overrides: { services?: any[] } = {}) {
  resetMocks()
  const services = overrides.services ?? [
    { id: 's1', name: 'Bookkeeping', slug: 'bookkeeping', price: 100, duration: 60, category: 'Accounting', featured: false, active: true, status: 'ACTIVE', tenantId: 't1' },
    { id: 's2', name: 'Tax Preparation', slug: 'tax-prep', price: 300, duration: 120, category: 'Taxes', featured: true, active: true, status: 'ACTIVE', tenantId: 't1' },
  ]
  mockServices(services)
  return { services }
}

export function setupBookingsMocks(overrides: { bookings?: any[] } = {}) {
  resetMocks()
  const bookings = overrides.bookings ?? [
    { id: 'b1', clientId: 'client1', serviceId: 's1', status: 'CONFIRMED', scheduledAt: new Date('2025-01-01T09:00:00Z'), tenantId: 't1' },
  ]
  mockBookings(bookings)
  return { bookings }
}

export function setupServiceRequestsMocks(overrides: { requests?: any[] } = {}) {
  resetMocks()
  const requests = overrides.requests ?? [
    { id: 'sr1', title: 'Need help', status: 'SUBMITTED', priority: 'MEDIUM', clientId: 'client1', serviceId: 's1', createdAt: new Date('2025-01-01T00:00:00Z'), scheduledAt: null, bookingType: '', tenantId: 't1' }
  ]
  mockServiceRequests(requests)
  return { requests }
}
