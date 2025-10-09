import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, waitFor, fireEvent } from '@testing-library/react'
import CommunicationSettingsPage from '@/app/admin/settings/communication/page'

vi.mock('next-auth/next', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'admin1', role: 'ADMIN' } })) }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))

const originalFetch = global.fetch as any

beforeEach(() => {
  global.fetch = vi.fn(async (url: any, opts: any) => {
    const u = String(url)
    if (u.endsWith('/api/admin/communication-settings') && (!opts || opts.method === 'GET')) {
      return { ok: true, json: async () => ({
        email: { senderName: '', senderEmail: '', replyTo: '', signatureHtml: '', transactionalEnabled: true, marketingEnabled: false, complianceBcc: false, templates: [] },
        sms: { provider: 'none', senderId: '', transactionalEnabled: false, marketingEnabled: false, fallbackToEmail: true, routes: [] },
        chat: { enabled: false, provider: 'none', routing: 'roundRobin', offlineMessage: '', workingHours: { timezone: 'UTC', start: '09:00', end: '17:00' }, escalationEmails: [] },
        notifications: { preferences: [], digestTime: '08:00', timezone: 'UTC' },
        newsletters: { enabled: false, doubleOptIn: true, defaultSenderName: '', defaultSenderEmail: '', archiveUrl: '', topics: [] },
        reminders: { bookings: { enabled: true, offsetHours: 24, channels: ['email'], templateId: '' }, invoices: { enabled: true, offsetHours: 72, channels: ['email'], templateId: '' }, tasks: { enabled: false, offsetHours: 12, channels: ['email'], templateId: '' } }
      }) }
    }
    if (u.endsWith('/api/admin/communication-settings') && opts && opts.method === 'PUT') {
      return { ok: true, json: async () => JSON.parse(opts.body || '{}') }
    }
    if (u.endsWith('/api/admin/communication-settings/export')) {
      return { ok: true, json: async () => ({ settings: { email: {} } }) }
    }
    if (u.endsWith('/api/admin/communication-settings/import') && opts && opts.method === 'POST') {
      return { ok: true, json: async () => ({ ok: true }) }
    }
    return { ok: false, json: async () => ({}) }
  }) as any
})

afterEach(() => { global.fetch = originalFetch })

describe('Communication Settings Export/Import UI', () => {
  it('shows Export/Import and posts import', async () => {
    const { getByText, container } = render(<CommunicationSettingsPage />)
    await waitFor(() => expect((global.fetch as any).mock.calls.length).toBeGreaterThan(0))

    fireEvent.click(getByText('Export') as any)
    await waitFor(() => expect((global.fetch as any).mock.calls.some((c: any[]) => String(c[0]).endsWith('/api/admin/communication-settings/export'))).toBe(true))

    const importButtons = container.querySelectorAll('button')
    const importButton = Array.from(importButtons).find(btn => btn.textContent === 'Import' && !btn.disabled)
    fireEvent.click(importButton as any)
    await waitFor(() => getByText('Import Communication Settings'))

    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File([JSON.stringify({ settings: { email: {} } })], 'communication.json', { type: 'application/json' })
    const dt = { files: [file] } as any
    fireEvent.change(input, dt)

    // Find the confirm Import button (should be in the modal/dialog)
    const confirmButtons = container.querySelectorAll('button')
    const confirmImport = Array.from(confirmButtons).find(btn => btn.textContent === 'Import' && !btn.hasAttribute('disabled'))
    fireEvent.click(confirmImport as any)
    await waitFor(() => expect((global.fetch as any).mock.calls.some((c: any[]) => String(c[0]).endsWith('/api/admin/communication-settings/import'))).toBe(true))
  })
})
