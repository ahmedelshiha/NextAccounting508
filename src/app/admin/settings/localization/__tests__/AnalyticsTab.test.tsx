import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AnalyticsTab } from '../tabs/AnalyticsTab'
import { LocalizationProvider } from '../LocalizationProvider'
import { vi } from 'vitest'

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('AnalyticsTab', () => {
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
        <AnalyticsTab />
      </LocalizationProvider>
    )

    expect(screen.getByText(/Loading analytics/i)).toBeInTheDocument()
  })

  test('displays language distribution data', async () => {
    const mockAnalytics = {
      totalUsers: 5432,
      distribution: [
        { language: 'English', count: 2443, percentage: '45%' },
        { language: 'Arabic', count: 1901, percentage: '35%' },
      ],
    }

    global.fetch = vi.fn()
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: mockAnalytics }),
        } as Response)
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: { trends: [] } }),
        } as Response)
      )

    render(
      <LocalizationProvider>
        <AnalyticsTab />
      </LocalizationProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('5432')).toBeInTheDocument()
    })
  })

  test('loads analytics from correct endpoints', async () => {
    const mockAnalytics = {
      totalUsers: 5432,
      distribution: [],
    }

    global.fetch = vi.fn()
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: mockAnalytics }),
        } as Response)
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: { trends: [] } }),
        } as Response)
      )

    render(
      <LocalizationProvider>
        <AnalyticsTab />
      </LocalizationProvider>
    )

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/admin/user-language-analytics')
    })
  })

  test('displays adoption trend data when available', async () => {
    const mockAnalytics = {
      totalUsers: 5432,
      distribution: [],
    }

    const mockTrends = {
      data: {
        trends: [
          { language: 'en', users: 2400, date: '2025-10-01' },
          { language: 'en', users: 2450, date: '2025-10-02' },
        ],
      },
    }

    global.fetch = vi.fn()
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: mockAnalytics }),
        } as Response)
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockTrends),
        } as Response)
      )

    render(
      <LocalizationProvider>
        <AnalyticsTab />
      </LocalizationProvider>
    )

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/admin/user-language-analytics/trends')
    })
  })

  test('handles missing analytics data gracefully', async () => {
    global.fetch = vi.fn()
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: null }),
        } as Response)
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: { trends: [] } }),
        } as Response)
      )

    render(
      <LocalizationProvider>
        <AnalyticsTab />
      </LocalizationProvider>
    )

    await waitFor(() => {
      expect(screen.queryByText(/Loading analytics/i)).not.toBeInTheDocument()
    })
  })

  test('allows exporting analytics data', async () => {
    const user = userEvent.setup()
    const mockAnalytics = {
      totalUsers: 5432,
      distribution: [
        { language: 'English', count: 2443, percentage: '45%' },
      ],
    }

    global.fetch = vi.fn()
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: mockAnalytics }),
        } as Response)
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: { trends: [] } }),
        } as Response)
      )

    global.URL.createObjectURL = vi.fn(() => 'blob:mock')
    global.URL.revokeObjectURL = vi.fn()

    render(
      <LocalizationProvider>
        <AnalyticsTab />
      </LocalizationProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('5432')).toBeInTheDocument()
    })

    const exportButton = screen.queryByRole('button', { name: /Export/i })
    if (exportButton) {
      await user.click(exportButton)
    }
  })

  test('displays percentage distribution correctly', async () => {
    const mockAnalytics = {
      totalUsers: 100,
      distribution: [
        { language: 'English', count: 45, percentage: '45%' },
        { language: 'Arabic', count: 35, percentage: '35%' },
      ],
    }

    global.fetch = vi.fn()
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: mockAnalytics }),
        } as Response)
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: { trends: [] } }),
        } as Response)
      )

    render(
      <LocalizationProvider>
        <AnalyticsTab />
      </LocalizationProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('45%')).toBeInTheDocument()
      expect(screen.getByText('35%')).toBeInTheDocument()
    })
  })

  test('handles API errors gracefully', async () => {
    global.fetch = vi.fn()
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: 'Failed to load analytics' }),
        } as Response)
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: 'Failed to load trends' }),
        } as Response)
      )

    render(
      <LocalizationProvider>
        <AnalyticsTab />
      </LocalizationProvider>
    )

    await waitFor(() => {
      expect(screen.queryByText(/Loading analytics/i)).not.toBeInTheDocument()
    })
  })
})
