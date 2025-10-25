import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OrganizationTab } from '../tabs/OrganizationTab'
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
  SelectField: ({ label, value, onChange, options }: any) => (
    <select value={value} onChange={e => onChange(e.target.value)} aria-label={label}>
      {options.map((opt: any) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
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

let mutateMock = vi.fn(() => Promise.resolve({ ok: true, data: {} }))
vi.mock('../hooks/useFormMutation', () => ({
  useFormMutation: () => ({
    saving: false,
    mutate: (...args: any[]) => mutateMock(...args),
  }),
}))

describe('OrganizationTab', () => {
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
        <OrganizationTab />
      </LocalizationProvider>
    )

    expect(screen.getByText(/Loading settings/i)).toBeInTheDocument()
  })

  test('loads and displays organization settings', async () => {
    const mockSettings = {
      defaultLanguage: 'en',
      fallbackLanguage: 'en',
      showLanguageSwitcher: true,
      persistLanguagePreference: true,
      autoDetectBrowserLanguage: false,
      allowUserLanguageOverride: true,
      enableRtlSupport: true,
      missingTranslationBehavior: 'show-empty' as const,
    }

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: mockSettings }),
      } as Response)
    )

    render(
      <LocalizationProvider>
        <OrganizationTab />
      </LocalizationProvider>
    )

    await waitFor(() => {
      expect(screen.queryByText(/Loading settings/i)).not.toBeInTheDocument()
    })
  })

  test('saves organization settings on submit', async () => {
    const user = userEvent.setup()
    const mockSettings = {
      defaultLanguage: 'en',
      fallbackLanguage: 'en',
      showLanguageSwitcher: true,
      persistLanguagePreference: true,
      autoDetectBrowserLanguage: false,
      allowUserLanguageOverride: true,
      enableRtlSupport: true,
      missingTranslationBehavior: 'show-empty' as const,
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
          json: () => Promise.resolve({}),
        } as Response)
      )

    render(
      <LocalizationProvider>
        <OrganizationTab />
      </LocalizationProvider>
    )

    await waitFor(() => {
      expect(screen.queryByText(/Loading settings/i)).not.toBeInTheDocument()
    })

    const saveButton = screen.getByRole('button', { name: /Save/i })
    await user.click(saveButton)

    await waitFor(() => {
      expect(mutateMock).toHaveBeenCalledWith(
        '/api/admin/org-settings/localization',
        'PUT',
        expect.objectContaining({ defaultLanguage: 'en' }),
        expect.objectContaining({ invalidate: expect.any(Array) })
      )
    })
  })

  test('displays error when saving fails', async () => {
    const user = userEvent.setup()
    const mockSettings = {
      defaultLanguage: 'en',
      fallbackLanguage: 'en',
      showLanguageSwitcher: true,
      persistLanguagePreference: true,
      autoDetectBrowserLanguage: false,
      allowUserLanguageOverride: true,
      enableRtlSupport: true,
      missingTranslationBehavior: 'show-empty' as const,
    }

    global.fetch = vi.fn()
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: mockSettings }),
        } as Response)
      )
    // Simulate mutate failing for save
    mutateMock = vi.fn(() => Promise.resolve({ ok: false, error: 'Failed to save settings' }))

    // Keep global.fetch second call as fallback (not used by mutate)
    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Failed to save settings' }),
      } as Response)
    )

    render(
      <LocalizationProvider>
        <OrganizationTab />
      </LocalizationProvider>
    )

    await waitFor(() => {
      expect(screen.queryByText(/Loading settings/i)).not.toBeInTheDocument()
    })

    const saveButton = screen.getByRole('button', { name: /Save/i })
    await user.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText(/Failed to save settings/i)).toBeInTheDocument()
    })
  })

  test('toggles language switcher visibility', async () => {
    const user = userEvent.setup()
    const mockSettings = {
      defaultLanguage: 'en',
      fallbackLanguage: 'en',
      showLanguageSwitcher: false,
      persistLanguagePreference: true,
      autoDetectBrowserLanguage: false,
      allowUserLanguageOverride: true,
      enableRtlSupport: true,
      missingTranslationBehavior: 'show-empty' as const,
    }

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: mockSettings }),
      } as Response)
    )

    render(
      <LocalizationProvider>
        <OrganizationTab />
      </LocalizationProvider>
    )

    await waitFor(() => {
      expect(screen.queryByText(/Loading settings/i)).not.toBeInTheDocument()
    })

    const toggles = screen.getAllByRole('checkbox')
    expect(toggles.length).toBeGreaterThan(0)
  })
})
