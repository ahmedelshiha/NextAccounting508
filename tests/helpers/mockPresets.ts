import { setModelMethod, resetPrismaMock } from '../../__mocks__/prisma'

export function resetMocks() {
  try { resetPrismaMock() } catch {}
}

export function mockTeamMembers(members: any[] = []) {
  // teamMember.findMany should return array of members
  setModelMethod('teamMember', 'findMany', async () => members)
  // teamMember.findUnique -> find by id if provided
  setModelMethod('teamMember', 'findUnique', async ({ where }: any) => members.find(m => m.id === where.id) ?? null)
}

export function mockServices(services: any[] = []) {
  setModelMethod('service', 'findMany', async () => services)
  setModelMethod('service', 'findUnique', async ({ where }: any) => services.find(s => s.id === where.id) ?? null)
  setModelMethod('service', 'count', async () => services.length)
}

export function mockBookings(bookings: any[] = []) {
  setModelMethod('booking', 'findMany', async ({ where }: any) => {
    // naive filter by id or serviceId
    if (!where) return bookings
    if (where.id) return bookings.filter(b => b.id === where.id)
    if (where.serviceId) return bookings.filter(b => b.serviceId === where.serviceId)
    return bookings
  })
  setModelMethod('booking', 'findUnique', async ({ where }: any) => bookings.find(b => b.id === where.id) ?? null)
  setModelMethod('booking', 'update', async ({ where, data }: any) => ({ ...bookings.find(b => b.id === where.id), ...data }))
}

export function mockServiceRequests(requests: any[] = []) {
  setModelMethod('serviceRequest', 'findMany', async ({ where }: any) => {
    if (!where) return requests
    // simple filtering by status
    if (where.status) return requests.filter(r => r.status === where.status)
    return requests
  })
  setModelMethod('serviceRequest', 'findUnique', async ({ where }: any) => requests.find(r => r.id === where.id) ?? null)
}
