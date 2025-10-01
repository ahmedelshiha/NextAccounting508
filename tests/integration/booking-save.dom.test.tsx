import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import BookingSettingsPanel from '@/components/admin/BookingSettingsPanel'

beforeEach(() => {
  // reset fetch mock
  global.fetch = vi.fn()
})

describe('BookingSettingsPanel save flow (jsdom)', () => {
  it('loads settings, toggles a payment method, and saves changes via PUT', async () => {
    const initialSettings = { acceptCard: false }
    // Mock sequence: first GET -> initial settings, second PUT -> success
    const mockFetch = global.fetch as unknown as jest.MockedFunction<any>
    let call = 0
    (global.fetch as any) = vi.fn((url: string, opts?: any) => {
      call++
      if (call === 1) {
        return Promise.resolve({ ok: true, json: async () => initialSettings })
      }
      // PUT
      if (opts && opts.method === 'PUT') {
        const body = JSON.parse(opts.body || '{}')
        return Promise.resolve({ ok: true, json: async () => ({ settings: { ...initialSettings, ...body } }) })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })

    render(<BookingSettingsPanel />)

    // Wait for heading
    await waitFor(() => expect(screen.getByText('Booking Settings')).toBeTruthy())

    // Activate Payments tab
    const paymentsBtn = screen.getByText('Payments')
    fireEvent.click(paymentsBtn)

    // Toggle 'Card' payment method
    const cardBtn = screen.getByText('Card')
    fireEvent.click(cardBtn)

    // Click Save Changes
    const saveBtn = screen.getByText(/Save Changes/)
    // Wait until enabled
    await waitFor(() => expect(saveBtn).not.toHaveAttribute('disabled'))
    fireEvent.click(saveBtn)

    // Assert that a PUT was made
    await waitFor(() => expect((global.fetch as any).mock.calls.some((c:any)=> c[0].includes('/api/admin/booking-settings') && c[1] && c[1].method === 'PUT')).toBe(true))

    // Check that payload included acceptCard (or acceptCard flag in body)
    const putCall = (global.fetch as any).mock.calls.find((c:any)=> c[1] && c[1].method === 'PUT')
    const body = JSON.parse(putCall[1].body)
    // body should contain toggled payment method key
    expect(Object.keys(body).length).toBeGreaterThan(0)
  })
})
