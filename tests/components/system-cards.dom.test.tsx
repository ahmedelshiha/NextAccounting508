import { describe, it, expect, beforeEach } from 'vitest'

// Use actual testing-library react (bypass test alias) in jsdom tests
let render: any, screen: any, fireEvent: any
beforeEach(async () => {
  const path = require.resolve('@testing-library/react')
  const rtl = await vi.importActual(path)
  render = rtl.render
  screen = rtl.screen
  fireEvent = rtl.fireEvent
})

import SystemCardsClient from '@/components/admin/settings/SystemCardsClient'

describe('SystemCardsClient (jsdom)', () => {
  it('renders cards and responds to Test buttons', async () => {
    const status = {
      database: true,
      authentication: { url: true, secret: true },
      environment: { nodeEnv: 'production', databaseConfigured: true }
    }

    render(<SystemCardsClient status={status} />)

    const dbBtn = await screen.findByTestId('test-db')
    expect(dbBtn).toBeTruthy()
    await fireEvent.click(dbBtn)
    await waitFor(() => {
      const dbMessage = screen.getByTestId('db-message')
      expect(dbMessage.textContent).toMatch(/Connection OK/)
    })

    const authBtn = await screen.findByTestId('test-auth')
    expect(authBtn).toBeTruthy()
    await fireEvent.click(authBtn)
    await waitFor(() => {
      const authMessage = screen.getByTestId('auth-message')
      expect(authMessage.textContent).toMatch(/Auth OK/)
    })
  })

  it('shows failure messages when status missing', async () => {
    const status = {
      database: false,
      authentication: { url: false, secret: false },
      environment: { nodeEnv: 'development', databaseConfigured: false }
    }
    render(<SystemCardsClient status={status} />)

    const dbBtn = await screen.findByTestId('test-db')
    await fireEvent.click(dbBtn)
    await waitFor(() => {
      const dbMessage = screen.getByTestId('db-message')
      expect(dbMessage.textContent).toMatch(/Connection Failed/)
    })

    const authBtn = await screen.findByTestId('test-auth')
    await fireEvent.click(authBtn)
    await waitFor(() => {
      const authMessage = screen.getByTestId('auth-message')
      expect(authMessage.textContent).toMatch(/Auth Incomplete/)
    })
  })
})
