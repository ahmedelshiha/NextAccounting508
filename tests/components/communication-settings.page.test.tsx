import { render, waitFor, fireEvent, screen } from '@/test-mocks/testing-library-react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import CommunicationSettingsPage from '@/app/admin/settings/communication/page'

vi.mock('next-auth/next', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'admin1', role: 'ADMIN' } })) }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))

// Mock fetch globally
const originalFetch = global.fetch as any

beforeEach(() => {
  global.fetch = vi.fn(async (url: any, opts: any) => {
    if (String(url).endsWith('/api/admin/communication-settings') && (!opts || opts.method === 'GET')) {
      return { ok: true, json: async () => ({
        email: { senderName: '', senderEmail: '', replyTo: '', signatureHtml: '', transactionalEnabled: true, marketingEnabled: false, complianceBcc: false, templates: [] },
        sms: { provider: 'none', senderId: '', transactionalEnabled: false, marketingEnabled: false, fallbackToEmail: true, routes: [] },
        chat: { enabled: false, provider: 'none', routing: 'roundRobin', offlineMessage: '', workingHours: { timezone: 'UTC', start: '09:00', end: '17:00' }, escalationEmails: [] },
        notifications: { preferences: [], digestTime: '08:00', timezone: 'UTC' },
        newsletters: { enabled: false, doubleOptIn: true, defaultSenderName: '', defaultSenderEmail: '', archiveUrl: '', topics: [] },
        reminders: { bookings: { enabled: true, offsetHours: 24, channels: ['email'], templateId: '' }, invoices: { enabled: true, offsetHours: 72, channels: ['email'], templateId: '' }, tasks: { enabled: false, offsetHours: 12, channels: ['email'], templateId: '' } }
      }) }
    }
    if (String(url).endsWith('/api/admin/communication-settings') && opts && opts.method === 'PUT') {
      return { ok: true, json: async () => ({ ...JSON.parse(opts.body || '{}') }) }
    }
    return { ok: false }
  }) as any
})

afterEach(() => { global.fetch = originalFetch })

describe('Communication Settings Page', () => {
  it('loads and saves', async () => {
    const { getByLabelText, getByText } = render(<CommunicationSettingsPage />)
    await waitFor(() => expect(global.fetch).toHaveBeenCalled())

    const nameInput = getByLabelText('Sender Name') as HTMLInputElement
    expect(nameInput.value).toBe('')

    fireEvent.change(nameInput, { target: { value: 'Acme' } })
    const btn = getByText('Save Changes')
    fireEvent.click(btn)

    await waitFor(() => expect((global.fetch as any).mock.calls.some((c: any[]) => String(c[0]).endsWith('/api/admin/communication-settings') && c[1]?.method === 'PUT')).toBe(true))
  })
})
