import { renderToStaticMarkup } from 'react-dom/server'

vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('next-auth', () => ({ getServerSession: async () => ({ user: { id: 'u1', role: 'ADMIN' } }) }))
vi.mock('@/lib/permissions', () => ({ hasPermission: () => true, PERMISSIONS: { ANALYTICS_VIEW: 'ANALYTICS_VIEW' } }))
vi.mock('@/lib/prisma', () => ({ default: {
  scheduledReminder: {
    findMany: async () => ([{
      id: 'r1', channel: 'email', sent: false, scheduledAt: new Date('2025-01-01T10:00:00Z'),
      serviceRequest: { id: 'sr1', clientId: 'c1', clientName: 'Jane Doe', clientEmail: 'jane@example.com', scheduledAt: new Date('2025-01-01T10:00:00Z'), service: { name: 'Bookkeeping' } }
    }])
  }
} }))

import AdminRemindersPage from '@/app/admin/reminders/page'

describe('Admin Reminders a11y', () => {
  it('exposes accessible table with caption and aria-label', async () => {
    const html = renderToStaticMarkup(await AdminRemindersPage())
    expect(/<table[^>]*aria-label="Pending reminders table"/i.test(html)).toBe(true)
    expect(/<caption[^>]*>Pending reminders<\/caption>/i.test(html)).toBe(true)
    // verify column headers have scope
    expect(/<th scope="col"/i.test(html)).toBe(true)
  })
})
