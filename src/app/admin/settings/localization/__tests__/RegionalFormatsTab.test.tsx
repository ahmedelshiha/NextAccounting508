import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RegionalFormatsTab } from '../tabs/RegionalFormatsTab'
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
  TextField: ({ label, value, onChange }: any) => (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      aria-label={label}
      type="text"
    />
  ),
  SelectField: ({ label, value, onChange, options }: any) => (
    <select value={value} onChange={e => onChange(e.target.value)} aria-label={label}>
      {options.map((opt: any) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  ),
}))

let mutateMock = vi.fn(() => Promise.resolve({ ok: true, data: {} }))
vi.mock('../hooks/useFormMutation', () => ({
  useFormMutation: () => ({
    saving: false,
    mutate: (...args: any[]) => mutateMock(...args),
  }),
}))

describe('RegionalFormatsTab', () => {
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
        <RegionalFormatsTab />
      </LocalizationProvider>
    )

    expect(screen.getByText(/Loading formats/i)).toBeInTheDocument()
  })

  test('loads and displays regional formats', async () => {
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
      ar: {
        language: 'ar',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '14:35',
        currencyCode: 'AED',
        currencySymbol: 'د.إ',
        numberFormat: '#,##0.00',
        decimalSeparator: ',',
        thousandsSeparator: '.',
      },
    }

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: mockFormats }),
      } as Response)
    )

    render(
      <LocalizationProvider>
        <RegionalFormatsTab />
      </LocalizationProvider>
    )

    await waitFor(() => {
      expect(screen.queryByText(/Loading formats/i)).not.toBeInTheDocument()
    })

    expect(screen.getByText('USD')).toBeInTheDocument()
    expect(screen.getByText('AED')).toBeInTheDocument()
  })

  test('saves format changes', async () => {
    const user = userEvent.setup()
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

    global.fetch = vi.fn()
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: mockFormats }),
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
        <RegionalFormatsTab />
      </LocalizationProvider>
    )

    await waitFor(() => {
      expect(screen.queryByText(/Loading formats/i)).not.toBeInTheDocument()
    })

    const saveButton = screen.getByRole('button', { name: /Save/i })
    await user.click(saveButton)

    await waitFor(() => {
      expect(mutateMock).toHaveBeenCalledWith(
        '/api/admin/regional-formats',
        'PUT',
        expect.objectContaining({ language: 'en' }),
        expect.objectContaining({ invalidate: expect.any(Array) })
      )
    })
  })

  test('validates format inputs', async () => {
    const mockFormats = { en: {
      language: 'en',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12:34 PM',
      currencyCode: 'USD',
      currencySymbol: '$',
      numberFormat: '#,##0.00',
      decimalSeparator: '.',
      thousandsSeparator: ',',
    } }

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: mockFormats }),
      } as Response)
    )

    render(
      <LocalizationProvider>
        <RegionalFormatsTab />
      </LocalizationProvider>
    )

    await waitFor(() => {
      expect(screen.queryByText(/Loading formats/i)).not.toBeInTheDocument()
    })

    const inputs = screen.getAllByDisplayValue('MM/DD/YYYY')
    expect(inputs.length).toBeGreaterThan(0)
  })

  test('handles save errors gracefully', async () => {
    const user = userEvent.setup()
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

    global.fetch = vi.fn()
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: mockFormats }),
        } as Response)
      )
    // simulate failing mutate
    mutateMock = vi.fn(() => Promise.resolve({ ok: false, error: 'Failed to save formats' }))

    // keep fetch fallback
    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Failed to save formats' }),
      } as Response)
    )

    render(
      <LocalizationProvider>
        <RegionalFormatsTab />
      </LocalizationProvider>
    )

    await waitFor(() => {
      expect(screen.queryByText(/Loading formats/i)).not.toBeInTheDocument()
    })

    const saveButton = screen.getByRole('button', { name: /Save/i })
    await user.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText(/Failed to save formats/i)).toBeInTheDocument()
    })
  })

  test('allows selecting different languages via dropdown', async () => {
    const user = userEvent.setup()
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
      ar: {
        language: 'ar',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '14:35',
        currencyCode: 'AED',
        currencySymbol: 'د.إ',
        numberFormat: '#,##0.00',
        decimalSeparator: ',',
        thousandsSeparator: '.',
      },
    }

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: [mockFormats.en, mockFormats.ar] }),
      } as Response)
    )

    render(
      <LocalizationProvider>
        <RegionalFormatsTab />
      </LocalizationProvider>
    )

    await waitFor(() => {
      expect(screen.queryByText(/Loading formats/i)).not.toBeInTheDocument()
    })

    const selectDropdown = screen.getByDisplayValue(/English/)
    expect(selectDropdown).toBeInTheDocument()

    await user.selectOption(selectDropdown, 'ar')

    await waitFor(() => {
      expect(screen.getByDisplayValue('AED')).toBeInTheDocument()
    })
  })

  test('validates currency code length', async () => {
    const user = userEvent.setup()
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
        json: () => Promise.resolve({ data: [mockFormats.en] }),
      } as Response)
    )

    render(
      <LocalizationProvider>
        <RegionalFormatsTab />
      </LocalizationProvider>
    )

    await waitFor(() => {
      expect(screen.queryByText(/Loading formats/i)).not.toBeInTheDocument()
    })

    const currencyInput = screen.getByDisplayValue('USD')
    await user.clear(currencyInput)
    await user.type(currencyInput, 'TOOLONG')

    const saveButton = screen.getByRole('button', { name: /Save/i })
    await user.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText(/Currency code must be 3 letters/i)).toBeInTheDocument()
    })
  })
})
