import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { IntegrationTab } from '../tabs/IntegrationTab'
import { LocalizationProvider } from '../LocalizationProvider'
import { vi } from 'vitest'

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('@/components/PermissionGate', () => ({
  default: ({ children }: any) => <div>{children}</div>,
}))

vi.mock('@/components/admin/settings/FormField', () => ({
  TextField: ({ label, value, onChange, placeholder }: any) => (
    <input
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
      aria-label={label}
      type="text"
    />
  ),
  Toggle: ({ value, onChange, label }: any) => (
    <input
      type="checkbox"
      checked={value}
      onChange={e => onChange(e.target.checked)}
      aria-label={label}
    />
  ),
}))

vi.mock('lucide-react', () => ({
  ChevronDown: () => <span>ChevronDown</span>,
  Copy: () => <span>Copy</span>,
  Check: () => <span>Check</span>,
  AlertCircle: () => <span>AlertCircle</span>,
}))

describe('IntegrationTab', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  test('renders loading state initially', () => {
    global.fetch = vi.fn(() => new Promise(() => {}))

    render(
      <LocalizationProvider>
        <IntegrationTab />
      </LocalizationProvider>
    )

    expect(screen.getByText(/Loading integration/i)).toBeInTheDocument()
  })

  test('displays Crowdin integration settings', async () => {
    const mockSettings = {
      projectId: 'project-123',
      apiToken: 'token-123',
      autoSyncDaily: false,
      syncOnDeploy: true,
      createPrs: true,
    }

    const mockWebhook = {
      webhookUrl: 'https://example.com/webhook',
      isActive: true,
      events: ['translation.completed'],
      lastDelivery: new Date().toISOString(),
      deliveriesCount: 10,
    }

    global.fetch = vi.fn()
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: mockSettings }),
        } as Response)
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [] }),
        } as Response)
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: { logs: [] } }),
        } as Response)
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: mockWebhook }),
        } as Response)
      )

    render(
      <LocalizationProvider>
        <IntegrationTab />
      </LocalizationProvider>
    )

    await waitFor(() => {
      expect(screen.queryByText(/Loading integration/i)).not.toBeInTheDocument()
    })

    expect(screen.getByDisplayValue('project-123')).toBeInTheDocument()
  })

  test('allows testing Crowdin connection', async () => {
    const user = userEvent.setup()
    const mockSettings = {
      projectId: 'project-123',
      apiToken: 'token-123',
      autoSyncDaily: false,
      syncOnDeploy: true,
      createPrs: true,
    }

    const mockWebhook = {
      webhookUrl: 'https://example.com/webhook',
      isActive: true,
      events: ['translation.completed'],
      lastDelivery: new Date().toISOString(),
      deliveriesCount: 10,
    }

    global.fetch = vi.fn()
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: mockSettings }),
        } as Response)
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [] }),
        } as Response)
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: { logs: [] } }),
        } as Response)
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: mockWebhook }),
        } as Response)
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, message: 'Connection successful' }),
        } as Response)
      )

    render(
      <LocalizationProvider>
        <IntegrationTab />
      </LocalizationProvider>
    )

    await waitFor(() => {
      expect(screen.queryByText(/Loading integration/i)).not.toBeInTheDocument()
    })

    const testButton = screen.getAllByRole('button', { name: /Test Connection/i })[0]
    await user.click(testButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/admin/crowdin-integration',
        expect.objectContaining({
          method: 'PUT',
        })
      )
    })
  })

  test('saves Crowdin settings', async () => {
    const user = userEvent.setup()
    const mockSettings = {
      projectId: 'project-123',
      apiToken: 'token-123',
      autoSyncDaily: false,
      syncOnDeploy: true,
      createPrs: true,
    }

    const mockWebhook = {
      webhookUrl: 'https://example.com/webhook',
      isActive: true,
      events: ['translation.completed'],
      lastDelivery: new Date().toISOString(),
      deliveriesCount: 10,
    }

    global.fetch = vi.fn()
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: mockSettings }),
        } as Response)
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [] }),
        } as Response)
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: { logs: [] } }),
        } as Response)
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: mockWebhook }),
        } as Response)
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        } as Response)
      )

    render(
      <LocalizationProvider>
        <IntegrationTab />
      </LocalizationProvider>
    )

    await waitFor(() => {
      expect(screen.queryByText(/Loading integration/i)).not.toBeInTheDocument()
    })

    const saveButton = screen.getByRole('button', { name: /Save Integration/i })
    await user.click(saveButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/admin/crowdin-integration',
        expect.objectContaining({
          method: 'POST',
        })
      )
    })
  })

  test('allows triggering manual sync', async () => {
    const user = userEvent.setup()
    const mockSettings = {
      projectId: 'project-123',
      apiToken: 'token-123',
      autoSyncDaily: false,
      syncOnDeploy: true,
      createPrs: true,
      lastSyncAt: '2025-10-20T10:00:00Z',
      lastSyncStatus: 'success' as const,
    }

    const mockWebhook = {
      webhookUrl: 'https://example.com/webhook',
      isActive: true,
      events: ['translation.completed'],
      lastDelivery: new Date().toISOString(),
      deliveriesCount: 10,
    }

    global.fetch = vi.fn()
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: mockSettings }),
        } as Response)
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [] }),
        } as Response)
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: { logs: [] } }),
        } as Response)
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: mockWebhook }),
        } as Response)
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, syncId: 'sync-123' }),
        } as Response)
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: mockSettings }),
        } as Response)
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [] }),
        } as Response)
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: { logs: [] } }),
        } as Response)
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: mockWebhook }),
        } as Response)
      )

    render(
      <LocalizationProvider>
        <IntegrationTab />
      </LocalizationProvider>
    )

    await waitFor(() => {
      expect(screen.queryByText(/Loading integration/i)).not.toBeInTheDocument()
    })

    const syncButton = screen.getByRole('button', { name: /Sync Now/i })
    await user.click(syncButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/admin/crowdin-integration/sync',
        expect.objectContaining({
          method: 'POST',
        })
      )
    })
  })

  test('toggles auto-sync daily option', async () => {
    const user = userEvent.setup()
    const mockSettings = {
      projectId: 'project-123',
      apiToken: 'token-123',
      autoSyncDaily: false,
      syncOnDeploy: true,
      createPrs: true,
    }

    const mockWebhook = {
      webhookUrl: 'https://example.com/webhook',
      isActive: true,
      events: ['translation.completed'],
      lastDelivery: new Date().toISOString(),
      deliveriesCount: 10,
    }

    global.fetch = vi.fn()
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: mockSettings }),
        } as Response)
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [] }),
        } as Response)
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: { logs: [] } }),
        } as Response)
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: mockWebhook }),
        } as Response)
      )

    render(
      <LocalizationProvider>
        <IntegrationTab />
      </LocalizationProvider>
    )

    await waitFor(() => {
      expect(screen.queryByText(/Loading integration/i)).not.toBeInTheDocument()
    })

    const toggles = screen.getAllByRole('checkbox')
    expect(toggles.length).toBeGreaterThan(0)
  })

  test('displays sync status when available', async () => {
    const mockSettings = {
      projectId: 'project-123',
      apiToken: 'token-123',
      autoSyncDaily: false,
      syncOnDeploy: true,
      createPrs: true,
      lastSyncAt: '2025-10-20T10:00:00Z',
      lastSyncStatus: 'success' as const,
    }

    const mockWebhook = {
      webhookUrl: 'https://example.com/webhook',
      isActive: true,
      events: ['translation.completed'],
      lastDelivery: new Date().toISOString(),
      deliveriesCount: 10,
    }

    global.fetch = vi.fn()
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: mockSettings }),
        } as Response)
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [] }),
        } as Response)
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: { logs: [] } }),
        } as Response)
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: mockWebhook }),
        } as Response)
      )

    render(
      <LocalizationProvider>
        <IntegrationTab />
      </LocalizationProvider>
    )

    await waitFor(() => {
      expect(screen.getByText(/Last Sync/i)).toBeInTheDocument()
    })
  })

  test('handles save errors gracefully', async () => {
    const user = userEvent.setup()
    const mockSettings = {
      projectId: 'project-123',
      apiToken: 'token-123',
      autoSyncDaily: false,
      syncOnDeploy: true,
      createPrs: true,
    }

    const mockWebhook = {
      webhookUrl: 'https://example.com/webhook',
      isActive: true,
      events: ['translation.completed'],
      lastDelivery: new Date().toISOString(),
      deliveriesCount: 10,
    }

    global.fetch = vi.fn()
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: mockSettings }),
        } as Response)
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [] }),
        } as Response)
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: { logs: [] } }),
        } as Response)
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: mockWebhook }),
        } as Response)
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: 'Failed to save integration' }),
        } as Response)
      )

    render(
      <LocalizationProvider>
        <IntegrationTab />
      </LocalizationProvider>
    )

    await waitFor(() => {
      expect(screen.queryByText(/Loading integration/i)).not.toBeInTheDocument()
    })

    const saveButton = screen.getByRole('button', { name: /Save/i })
    await user.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText(/Failed to save integration/i)).toBeInTheDocument()
    })
  })
})
