import { render, screen, waitFor } from '@testing-library/react'
import { UserPreferencesTab } from '../tabs/UserPreferencesTab'
import { LocalizationProvider } from '../LocalizationProvider'
import { vi } from 'vitest'

describe('UserPreferencesTab', () => {
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
        <UserPreferencesTab />
      </LocalizationProvider>
    )

    expect(screen.getByText(/Loading analytics/i)).toBeInTheDocument()
  })

  test('displays analytics data when loaded', async () => {
    const mockAnalytics = {
      totalUsers: 5432,
      languagesInUse: ['en', 'ar', 'hi'],
      mostUsedLanguage: 'en',
      distribution: [
        { language: 'English', count: 2443, percentage: '45%' },
        { language: 'Arabic', count: 1901, percentage: '35%' },
        { language: 'Hindi', count: 815, percentage: '15%' },
        { language: 'Other', count: 273, percentage: '5%' },
      ],
    }

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: mockAnalytics }),
      } as Response)
    )

    render(
      <LocalizationProvider>
        <UserPreferencesTab />
      </LocalizationProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('5432')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
    })
  })

  test('displays summary stats cards', async () => {
    const mockAnalytics = {
      totalUsers: 5432,
      languagesInUse: ['en', 'ar', 'hi'],
      mostUsedLanguage: 'en',
      distribution: [],
    }

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: mockAnalytics }),
      } as Response)
    )

    render(
      <LocalizationProvider>
        <UserPreferencesTab />
      </LocalizationProvider>
    )

    await waitFor(() => {
      expect(screen.getByText(/Total Users/i)).toBeInTheDocument()
      expect(screen.getByText(/Languages in Use/i)).toBeInTheDocument()
      expect(screen.getByText(/Most Used/i)).toBeInTheDocument()
    })
  })

  test('handles empty analytics data gracefully', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: null }),
      } as Response)
    )

    render(
      <LocalizationProvider>
        <UserPreferencesTab />
      </LocalizationProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('0')).toBeInTheDocument()
    })
  })

  test('fetches analytics from correct endpoint', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: { totalUsers: 0, distribution: [] } }),
      } as Response)
    )

    render(
      <LocalizationProvider>
        <UserPreferencesTab />
      </LocalizationProvider>
    )

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/admin/user-language-analytics')
    })
  })

  test('handles API errors gracefully', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Failed to load' }),
      } as Response)
    )

    render(
      <LocalizationProvider>
        <UserPreferencesTab />
      </LocalizationProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('0')).toBeInTheDocument()
    })
  })

  test('calculates percentage distribution correctly', async () => {
    const mockAnalytics = {
      totalUsers: 100,
      languagesInUse: ['en', 'ar'],
      mostUsedLanguage: 'en',
      distribution: [
        { language: 'English', count: 75, percentage: '75%' },
        { language: 'Arabic', count: 25, percentage: '25%' },
      ],
    }

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: mockAnalytics }),
      } as Response)
    )

    render(
      <LocalizationProvider>
        <UserPreferencesTab />
      </LocalizationProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('75%')).toBeInTheDocument()
      expect(screen.getByText('25%')).toBeInTheDocument()
    })
  })
})
