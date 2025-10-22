import { render, fireEvent, waitFor } from '@/test-mocks/testing-library-react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import GeneralTab from '@/components/admin/settings/groups/Organization/GeneralTab'

vi.mock('next-auth/next', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'admin1', role: 'ADMIN' } })) }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))

// Mock fetch globally
const originalFetch = global.fetch

beforeEach(() => {
  global.fetch = vi.fn(async (url: any, opts: any) => {
    if (String(url).endsWith('/api/admin/org-settings') && (!opts || opts.method === 'GET')) {
      return { ok: true, json: async () => ({ general: { name: 'Old Co', tagline: 'Old' } }) }
    }
    if (String(url).endsWith('/api/admin/org-settings') && opts && opts.method === 'PUT') {
      return { ok: true, json: async () => ({ ok: true }) }
    }
    return { ok: false }
  }) as any
})

afterEach(() => { global.fetch = originalFetch })

describe('Org GeneralTab', () => {
  it('loads data and saves on click', async () => {
    const { getByLabelText, getByText } = render(<GeneralTab />)
    await waitFor(() => expect(global.fetch).toHaveBeenCalled())

    const nameInput = getByLabelText('Company Name') as HTMLInputElement
    expect(nameInput.value).toBe('Old Co')

    fireEvent.change(nameInput, { target: { value: 'New Co' } })
    const btn = getByText('Save Changes')
    fireEvent.click(btn)

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2))
  })
})
