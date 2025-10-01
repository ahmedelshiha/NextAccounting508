import { describe, it, expect, vi, beforeEach, afterEach, waitFor, fireEvent, render } from 'vitest'
import TaskWorkflowSettingsPage from '@/app/admin/settings/tasks/page'

vi.mock('next-auth/next', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'admin1', role: 'ADMIN' } })) }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))

const originalFetch = global.fetch as any

beforeEach(() => {
  global.fetch = vi.fn(async (url: any, opts: any) => {
    const u = String(url)
    if (u.endsWith('/api/admin/task-settings') && (!opts || opts.method === 'GET')) {
      return { ok: true, json: async () => ({ templates: [], statuses: [], automation: [], board: {}, dependenciesEnabled: true }) }
    }
    if (u.endsWith('/api/admin/task-settings') && opts && opts.method === 'PUT') {
      return { ok: true, json: async () => JSON.parse(opts.body || '{}') }
    }
    if (u.endsWith('/api/admin/task-settings/export')) {
      return { ok: true, json: async () => ({ settings: { templates: [] } }) }
    }
    if (u.endsWith('/api/admin/task-settings/import') && opts && opts.method === 'POST') {
      return { ok: true, json: async () => ({ ok: true }) }
    }
    return { ok: false, json: async () => ({}) }
  }) as any
})

afterEach(() => { global.fetch = originalFetch })

describe('Task & Workflow Settings Export/Import UI', () => {
  it('shows Export/Import and posts import', async () => {
    const { getByText, container } = render(<TaskWorkflowSettingsPage />)
    await waitFor(() => expect((global.fetch as any).mock.calls.length).toBeGreaterThan(0))

    fireEvent.click(getByText('Export') as any)
    await waitFor(() => expect((global.fetch as any).mock.calls.some((c: any[]) => String(c[0]).endsWith('/api/admin/task-settings/export'))).toBe(true))

    fireEvent.click(getByText('Import') as any)
    await waitFor(() => getByText('Import Task & Workflow Settings'))

    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File([JSON.stringify({ settings: { templates: [] } })], 'task.json', { type: 'application/json' })
    const dt = { files: [file] } as any
    fireEvent.change(input, dt)

    fireEvent.click(getByText('Import') as any)
    await waitFor(() => expect((global.fetch as any).mock.calls.some((c: any[]) => String(c[0]).endsWith('/api/admin/task-settings/import'))).toBe(true))
  })
})
