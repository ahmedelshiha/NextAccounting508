import { renderHook, act, waitFor } from '@testing-library/react'
import { useLanguages } from '../hooks/useLanguages'
import { useRegionalFormats } from '../hooks/useRegionalFormats'
import { useCrowdinIntegration } from '../hooks/useCrowdinIntegration'
import { useTranslationStatus } from '../hooks/useTranslationStatus'
import { useLanguageAnalytics } from '../hooks/useLanguageAnalytics'
import { vi } from 'vitest'

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('useLanguages hook', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  test('fetches languages on mount', async () => {
    const mockLanguages = [
      { code: 'en', name: 'English', nativeName: 'English', direction: 'ltr' as const, bcp47Locale: 'en-US', enabled: true, featured: true },
    ]

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: mockLanguages }),
      } as Response)
    )

    const { result } = renderHook(() => useLanguages())

    await waitFor(() => {
      expect(result.current.languages).toEqual(mockLanguages)
    })
  })

  test('adds new language', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      } as Response)
    )

    const { result } = renderHook(() => useLanguages())

    const newLang = { code: 'fr', name: 'French', nativeName: 'Français', direction: 'ltr' as const, bcp47Locale: 'fr-FR', enabled: true, featured: false }

    await act(async () => {
      await result.current.addLanguage(newLang)
    })

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/admin/languages',
      expect.objectContaining({
        method: 'POST',
      })
    )
  })

  test('updates language', async () => {
    const mockLanguages = [
      { code: 'en', name: 'English', nativeName: 'English', direction: 'ltr' as const, bcp47Locale: 'en-US', enabled: true, featured: true },
    ]

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: mockLanguages }),
      } as Response)
    )

    const { result } = renderHook(() => useLanguages())

    await waitFor(() => {
      expect(result.current.languages).toHaveLength(1)
    })

    const updatedLang = { ...mockLanguages[0], name: 'English (Updated)' }

    await act(async () => {
      await result.current.updateLanguage('en', updatedLang)
    })

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/admin/languages/en',
      expect.objectContaining({
        method: 'PUT',
      })
    )
  })

  test('deletes language', async () => {
    const mockLanguages = [
      { code: 'en', name: 'English', nativeName: 'English', direction: 'ltr' as const, bcp47Locale: 'en-US', enabled: true, featured: true },
    ]

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: mockLanguages }),
      } as Response)
    )

    const { result } = renderHook(() => useLanguages())

    await act(async () => {
      await result.current.deleteLanguage('en')
    })

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/admin/languages/en',
      expect.objectContaining({
        method: 'DELETE',
      })
    )
  })

  test('toggles language enabled status', async () => {
    const mockLanguages = [
      { code: 'en', name: 'English', nativeName: 'English', direction: 'ltr' as const, bcp47Locale: 'en-US', enabled: true, featured: true },
    ]

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: mockLanguages }),
      } as Response)
    )

    const { result } = renderHook(() => useLanguages())

    await waitFor(() => {
      expect(result.current.languages).toHaveLength(1)
    })

    await act(async () => {
      await result.current.toggleLanguage('en')
    })

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/admin/languages/en/toggle',
      expect.objectContaining({
        method: 'PATCH',
      })
    )
  })

  test('handles API errors', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Failed to fetch' }),
      } as Response)
    )

    const { result } = renderHook(() => useLanguages())

    await waitFor(() => {
      expect(result.current.error).toBeDefined()
    })
  })
})

describe('useRegionalFormats hook', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  test('fetches regional formats on mount', async () => {
    const mockFormats = {
      en: {
        language: 'en',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12:34 PM',
        currencyCode: 'USD',
        currencySymbol: '$',
        numberFormat: '#,##0.00',
        decimalSeparator: '.',
        thousandsSeparator: ',',
      },
    }

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: mockFormats }),
      } as Response)
    )

    const { result } = renderHook(() => useRegionalFormats())

    await waitFor(() => {
      expect(result.current.formats).toEqual(mockFormats)
    })
  })

  test('updates format for language', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: {} }),
      } as Response)
    )

    const { result } = renderHook(() => useRegionalFormats())

    const format = {
      language: 'fr',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '14:35',
      currencyCode: 'EUR',
      currencySymbol: '€',
      numberFormat: '#,##0.00',
      decimalSeparator: ',',
      thousandsSeparator: '.',
    }

    await act(async () => {
      await result.current.updateFormat('fr', format)
    })

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/admin/regional-formats',
      expect.objectContaining({
        method: 'PUT',
      })
    )
  })

  test('validates format before saving', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ valid: true }),
      } as Response)
    )

    const { result } = renderHook(() => useRegionalFormats())

    const format = {
      language: 'en',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12:34 PM',
      currencyCode: 'USD',
      currencySymbol: '$',
      numberFormat: '#,##0.00',
      decimalSeparator: '.',
      thousandsSeparator: ',',
    }

    await act(async () => {
      await result.current.validateFormat(format)
    })

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/admin/regional-formats/validate',
      expect.any(Object)
    )
  })
})

describe('useCrowdinIntegration hook', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  test('fetches Crowdin integration settings on mount', async () => {
    const mockSettings = {
      projectId: 'project-123',
      apiToken: 'token-123',
      autoSyncDaily: false,
      syncOnDeploy: true,
      createPrs: true,
    }

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: mockSettings }),
      } as Response)
    )

    const { result } = renderHook(() => useCrowdinIntegration())

    await waitFor(() => {
      expect(result.current.integration).toEqual(mockSettings)
    })
  })

  test('saves integration settings', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      } as Response)
    )

    const { result } = renderHook(() => useCrowdinIntegration())

    const settings = {
      projectId: 'project-123',
      apiToken: 'token-123',
      autoSyncDaily: true,
      syncOnDeploy: true,
      createPrs: true,
    }

    await act(async () => {
      await result.current.saveSettings(settings)
    })

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/admin/crowdin-integration',
      expect.objectContaining({
        method: 'POST',
      })
    )
  })

  test('tests Crowdin connection', async () => {
    const mockSettings = {
      projectId: 'project-123',
      apiToken: 'token-123',
      autoSyncDaily: false,
      syncOnDeploy: true,
      createPrs: true,
    }

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      } as Response)
    )

    const { result } = renderHook(() => useCrowdinIntegration())

    await act(async () => {
      await result.current.testConnection(mockSettings)
    })

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/admin/crowdin-integration',
      expect.objectContaining({
        method: 'PUT',
      })
    )
  })

  test('triggers manual sync', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, syncId: 'sync-123' }),
      } as Response)
    )

    const { result } = renderHook(() => useCrowdinIntegration())

    await act(async () => {
      await result.current.triggerSync()
    })

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/admin/crowdin-integration/sync',
      expect.objectContaining({
        method: 'POST',
      })
    )
  })
})

describe('useTranslationStatus hook', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  test('fetches translation status on mount', async () => {
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

    const { result } = renderHook(() => useTranslationStatus())

    await waitFor(() => {
      expect(result.current.status).toEqual(mockStatus)
    })
  })

  test('fetches missing keys', async () => {
    global.fetch = vi.fn()
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: { summary: { totalKeys: 1247, enCoveragePct: '100%', arCoveragePct: '94%', hiCoveragePct: '87%' } } }),
        } as Response)
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [{ key: 'payment.success', arTranslated: false }] }),
        } as Response)
      )

    const { result } = renderHook(() => useTranslationStatus())

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/admin/translations/missing')
    })
  })

  test('handles API errors gracefully', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Failed to fetch status' }),
      } as Response)
    )

    const { result } = renderHook(() => useTranslationStatus())

    await waitFor(() => {
      expect(result.current.error).toBeDefined()
    })
  })
})

describe('useLanguageAnalytics hook', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  test('fetches analytics data on mount', async () => {
    const mockAnalytics = {
      totalUsers: 5432,
      languagesInUse: ['en', 'ar', 'hi'],
      distribution: [
        { language: 'English', count: 2443, percentage: '45%' },
      ],
    }

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: mockAnalytics }),
      } as Response)
    )

    const { result } = renderHook(() => useLanguageAnalytics())

    await waitFor(() => {
      expect(result.current.analytics).toEqual(mockAnalytics)
    })
  })

  test('fetches trends data', async () => {
    global.fetch = vi.fn()
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: { totalUsers: 0, distribution: [] } }),
        } as Response)
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: { trends: [{ language: 'en', users: 100 }] } }),
        } as Response)
      )

    const { result } = renderHook(() => useLanguageAnalytics())

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/admin/user-language-analytics/trends')
    })
  })

  test('exports analytics data', async () => {
    const mockAnalytics = {
      totalUsers: 5432,
      languagesInUse: ['en'],
      distribution: [],
    }

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: mockAnalytics }),
      } as Response)
    )

    global.URL.createObjectURL = vi.fn(() => 'blob:mock')
    global.URL.revokeObjectURL = vi.fn()

    const { result } = renderHook(() => useLanguageAnalytics())

    await waitFor(() => {
      expect(result.current.analytics).toBeDefined()
    })

    await act(async () => {
      await result.current.exportData()
    })
  })

  test('handles API errors gracefully', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Failed to fetch analytics' }),
      } as Response)
    )

    const { result } = renderHook(() => useLanguageAnalytics())

    await waitFor(() => {
      expect(result.current.error).toBeDefined()
    })
  })
})
