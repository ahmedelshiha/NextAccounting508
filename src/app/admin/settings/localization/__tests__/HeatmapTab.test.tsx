import { render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { LocalizationProvider } from '../LocalizationProvider'
import { HeatmapTab } from '../tabs/HeatmapTab'

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('@/components/PermissionGate', () => ({
  default: ({ children }: any) => <div>{children}</div>,
}))

describe('HeatmapTab', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  test('renders loading state initially', async () => {
    // Leave fetch unresolved to simulate loading
    ;(global.fetch as any) = vi.fn(() => new Promise(() => {}))

    render(
      <LocalizationProvider>
        <HeatmapTab />
      </LocalizationProvider>
    )

    expect(screen.getByText(/Loading activity heatmap/i)).toBeInTheDocument()
  })

  test('renders heatmap with summary when data is returned', async () => {
    const now = new Date().toISOString()
    const mockResponse = {
      success: true,
      periods: [
        {
          period: 'Last 7 days (hourly)',
          data: [
            { timestamp: now, language: 'en', sessionCount: 3, uniqueUsers: 2, averageSessionDuration: 40 },
            { timestamp: now, language: 'ar', sessionCount: 1, uniqueUsers: 1, averageSessionDuration: 30 },
          ],
        },
      ],
      dateRange: { start: now, end: now },
      summary: { totalSessions: 4, totalUsers: 3, languagesTracked: 2 },
      meta: { availableDevices: ['desktop','mobile'], availableRegions: ['us','eg'], availableLanguages: ['en','ar'] },
    }

    ;(global.fetch as any) = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockResponse }),
      } as Response)
    )

    render(
      <LocalizationProvider>
        <HeatmapTab />
      </LocalizationProvider>
    )

    await waitFor(() => {
      expect(screen.queryByText(/Loading activity heatmap/i)).not.toBeInTheDocument()
    })

    expect(screen.getByText(/Language Activity Heatmap/i)).toBeInTheDocument()
    expect(screen.getByText('Total Sessions')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
  })

  test('handles empty data gracefully', async () => {
    const mockResponse = {
      success: true,
      periods: [],
      dateRange: { start: new Date().toISOString(), end: new Date().toISOString() },
      summary: { totalSessions: 0, totalUsers: 0, languagesTracked: 0 },
      meta: { availableDevices: [], availableRegions: [], availableLanguages: [] },
    }

    ;(global.fetch as any) = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockResponse }),
      } as Response)
    )

    render(
      <LocalizationProvider>
        <HeatmapTab />
      </LocalizationProvider>
    )

    await waitFor(() => {
      expect(screen.getByText(/No language activity data available yet/i)).toBeInTheDocument()
    })
  })
})
