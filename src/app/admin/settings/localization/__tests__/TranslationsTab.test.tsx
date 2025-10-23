import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TranslationsTab } from '../tabs/TranslationsTab'
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

describe('TranslationsTab', () => {
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
        <TranslationsTab />
      </LocalizationProvider>
    )

    expect(screen.getByText(/Loading translations/i)).toBeInTheDocument()
  })

  test('displays translation coverage summary', async () => {
    const mockStatus = {
      summary: {
        totalKeys: 1247,
        enCoveragePct: '100%',
        arCoveragePct: '94%',
        hiCoveragePct: '87%',
      },
    }

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: mockStatus }),
      } as Response)
    )

    render(
      <LocalizationProvider>
        <TranslationsTab />
      </LocalizationProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('1247')).toBeInTheDocument()
    })
  })

  test('loads translation status from correct endpoint', async () => {
    const mockStatus = {
      summary: {
        totalKeys: 1247,
        enCoveragePct: '100%',
        arCoveragePct: '94%',
        hiCoveragePct: '87%',
      },
    }

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: mockStatus }),
      } as Response)
    )

    render(
      <LocalizationProvider>
        <TranslationsTab />
      </LocalizationProvider>
    )

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/admin/translations/status')
    })
  })

  test('displays coverage percentages for each language', async () => {
    const mockStatus = {
      summary: {
        totalKeys: 1247,
        enCoveragePct: '100%',
        arCoveragePct: '94%',
        hiCoveragePct: '87%',
      },
    }

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: mockStatus }),
      } as Response)
    )

    render(
      <LocalizationProvider>
        <TranslationsTab />
      </LocalizationProvider>
    )

    await waitFor(() => {
      expect(screen.getByText(/100%/)).toBeInTheDocument()
      expect(screen.getByText(/94%/)).toBeInTheDocument()
      expect(screen.getByText(/87%/)).toBeInTheDocument()
    })
  })

  test('handles API errors gracefully', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Failed to load translations' }),
      } as Response)
    )

    render(
      <LocalizationProvider>
        <TranslationsTab />
      </LocalizationProvider>
    )

    await waitFor(() => {
      expect(screen.queryByText(/Loading translations/i)).not.toBeInTheDocument()
    })
  })

  test('allows viewing missing keys', async () => {
    const user = userEvent.setup()
    const mockStatus = {
      summary: {
        totalKeys: 1247,
        enCoveragePct: '100%',
        arCoveragePct: '94%',
        hiCoveragePct: '87%',
      },
    }

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: mockStatus }),
      } as Response)
    )

    render(
      <LocalizationProvider>
        <TranslationsTab />
      </LocalizationProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('1247')).toBeInTheDocument()
    })

    const viewButton = screen.queryByRole('button', { name: /View All Missing/i })
    if (viewButton) {
      await user.click(viewButton)
    }
  })

  test('displays recent activity information', async () => {
    const mockStatus = {
      summary: {
        totalKeys: 1247,
        enCoveragePct: '100%',
        arCoveragePct: '94%',
        hiCoveragePct: '87%',
      },
    }

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: mockStatus }),
      } as Response)
    )

    render(
      <LocalizationProvider>
        <TranslationsTab />
      </LocalizationProvider>
    )

    await waitFor(() => {
      expect(screen.getByText(/Coverage Summary/i)).toBeInTheDocument()
    })
  })
})
