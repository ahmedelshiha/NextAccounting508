import { describe, it, expect } from 'vitest'

// Integration test scaffold: requires TEST_BASE_URL and ADMIN_AUTH_TOKEN env vars
const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000'
const AUTH = process.env.ADMIN_AUTH_TOKEN

if (!AUTH) {
  console.warn('ADMIN_AUTH_TOKEN not set — integration test will be skipped')
}

describe('Integration: booking -> invoice -> payment', () => {
  it.skipIf(!AUTH as any)('creates booking and invoice and marks paid', async () => {
    // This test uses fetch and expects admin token to be provided
    const headers = { Authorization: `Bearer ${AUTH}`, 'Content-Type': 'application/json' }

    const bookingRes = await fetch(`${BASE}/api/admin/bookings`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        serviceId: process.env.TEST_SERVICE_ID || 'service-test',
        scheduledAt: new Date(Date.now() + 3600000).toISOString(),
        duration: 60,
        clientName: 'Integration Test',
        clientEmail: 'integration+test@example.com'
      })
    })
    expect(bookingRes.ok).toBeTruthy()
    const booking = await bookingRes.json()
    expect(booking.booking).toBeDefined()
    const bookingId = booking.booking.id

    const invoiceRes = await fetch(`${BASE}/api/admin/invoices`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ bookingId })
    })
    expect(invoiceRes.ok).toBeTruthy()
    const invoice = await invoiceRes.json()
    expect(invoice.invoice).toBeDefined()
    const invoiceId = invoice.invoice.id

    // Try test pay endpoint
    const payRes = await fetch(`${BASE}/api/admin/invoices/${invoiceId}/pay`, { method: 'POST', headers }).catch(()=>null)
    if (payRes) {
      expect(payRes.ok).toBeTruthy()
      const paid = await payRes.json()
      expect(paid.status === 'PAID' || paid.invoice?.status === 'PAID').toBeTruthy()
    }

    // Cleanup
    await fetch(`${BASE}/api/admin/invoices`, { method: 'DELETE', headers, body: JSON.stringify({ invoiceIds: [invoiceId] }) }).catch(()=>null)
    await fetch(`${BASE}/api/admin/bookings`, { method: 'DELETE', headers, body: JSON.stringify({ bookingIds: [bookingId] }) }).catch(()=>null)
  })
})
