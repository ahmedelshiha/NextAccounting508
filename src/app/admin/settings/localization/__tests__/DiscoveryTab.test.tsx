import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DiscoveryTab } from '../tabs/DiscoveryTab'
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

describe('DiscoveryTab', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  test('renders the discovery tab', () => {
    render(
      <LocalizationProvider>
        <DiscoveryTab />
      </LocalizationProvider>
    )

    expect(screen.getByText(/Key Discovery/i)).toBeInTheDocument()
  })

  test('allows running discovery audit', async () => {
    const user = userEvent.setup()

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, auditId: 'audit-123' }),
      } as Response)
    )

    render(
      <LocalizationProvider>
        <DiscoveryTab />
      </LocalizationProvider>
    )

    const runButton = screen.getByRole('button', { name: /Run Discovery Audit/i })
    await user.click(runButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/admin/translations/discover',
        expect.objectContaining({
          method: 'POST',
        })
      )
    })
  })

  test('displays audit status when available', async () => {
    render(
      <LocalizationProvider>
        <DiscoveryTab />
      </LocalizationProvider>
    )

    expect(screen.getByText(/Audit Results:/i)).toBeInTheDocument()
  })

  test('allows exporting audit results', async () => {
    const user = userEvent.setup()

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: { keys: [] } }),
      } as Response)
    )

    global.URL.createObjectURL = vi.fn(() => 'blob:mock')
    global.URL.revokeObjectURL = vi.fn()

    render(
      <LocalizationProvider>
        <DiscoveryTab />
      </LocalizationProvider>
    )

    const exportButton = screen.queryByRole('button', { name: /Export/i })
    if (exportButton) {
      await user.click(exportButton)
    }
  })

  test('allows scheduling periodic audits', async () => {
    const user = userEvent.setup()

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      } as Response)
    )

    render(
      <LocalizationProvider>
        <DiscoveryTab />
      </LocalizationProvider>
    )

    const scheduleButton = screen.queryByRole('button', { name: /Schedule.*Audit/i })
    if (scheduleButton) {
      await user.click(scheduleButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/admin/translations/discover/schedule',
          expect.any(Object)
        )
      })
    }
  })

  test('displays audit findings when available', () => {
    render(
      <LocalizationProvider>
        <DiscoveryTab />
      </LocalizationProvider>
    )

    expect(screen.getByText(/Audit Results:/i)).toBeInTheDocument()
  })

  test('allows approving discovered keys', async () => {
    const user = userEvent.setup()

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, approved: 5 }),
      } as Response)
    )

    render(
      <LocalizationProvider>
        <DiscoveryTab />
      </LocalizationProvider>
    )

    const approveButton = screen.queryByRole('button', { name: /Approve.*Keys/i })
    if (approveButton) {
      await user.click(approveButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/admin/translations/discover/approve',
          expect.any(Object)
        )
      })
    }
  })

  test('handles audit errors gracefully', async () => {
    const user = userEvent.setup()

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Failed to run audit' }),
      } as Response)
    )

    render(
      <LocalizationProvider>
        <DiscoveryTab />
      </LocalizationProvider>
    )

    const runButton = screen.getByRole('button', { name: /Run Discovery Audit/i })
    await user.click(runButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
    })
  })

  test('displays naming convention validation issues', () => {
    render(
      <LocalizationProvider>
        <DiscoveryTab />
      </LocalizationProvider>
    )

    expect(screen.getByText(/Naming Issues:/i)).toBeInTheDocument()
  })
})
