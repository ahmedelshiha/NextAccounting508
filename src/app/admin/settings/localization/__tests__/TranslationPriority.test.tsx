import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { LocalizationProvider } from '../LocalizationProvider'
import { TranslationPriorityPanel } from '../components/TranslationPriorityPanel'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

describe('TranslationPriorityPanel', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  test('renders empty state and opens modal', async () => {
    ;(global.fetch as any) = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: [] }) }))

    render(
      <LocalizationProvider>
        <TranslationPriorityPanel />
      </LocalizationProvider>
    )

    await waitFor(() => expect(screen.getByText(/No priorities set yet/i)).toBeInTheDocument())

    const user = userEvent.setup()
    const button = screen.getByRole('button', { name: /Set Priority/i })
    await user.click(button)

    expect(screen.getByText(/Set Priority/i)).toBeInTheDocument()
  })
})
