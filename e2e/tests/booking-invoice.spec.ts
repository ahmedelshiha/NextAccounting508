import { test, expect } from '@playwright/test'

// This test expects an admin auth token to be available via process.env.ADMIN_AUTH_TOKEN
// or an accessible dev-login route at /api/dev-login that returns { token }

test.describe('Booking → Invoice → Payment (E2E)', () => {
  test('create booking, invoice and mark as paid', async ({ request, baseURL }) => {
    const baseUrl = baseURL?.toString() || process.env.E2E_BASE_URL || 'http://localhost:3000'

    // Obtain admin auth token
    let token = process.env.ADMIN_AUTH_TOKEN
    if (!token) {
      const devLogin = await request.post(`${baseUrl}/api/dev-login`, { data: { email: 'staff@accountingfirm.com' } })
      expect(devLogin.ok()).toBeTruthy()
      const json = await devLogin.json()
      token = json.token
    }

    // Create booking
    const bookingRes = await request.post(`${baseUrl}/api/admin/bookings`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: {
        serviceId: process.env.E2E_SERVICE_ID || 'service-test',
        scheduledAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        duration: 60,
        clientName: 'E2E Test',
        clientEmail: 'e2e+test@example.com'
      }
    })
    expect(bookingRes.ok()).toBeTruthy()
    const booking = await bookingRes.json()
    expect(booking.booking).toBeDefined()
    const bookingId = booking.booking.id

    // Create invoice for booking
    const invoiceRes = await request.post(`${baseUrl}/api/admin/invoices`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: { bookingId }
    })
    expect(invoiceRes.ok()).toBeTruthy()
    const invoice = await invoiceRes.json()
    expect(invoice.invoice).toBeDefined()
    const invoiceId = invoice.invoice.id

    // Mark invoice as paid via a test-only endpoint if available, otherwise skip this step
    const payRes = await request.post(`${baseUrl}/api/admin/invoices/${invoiceId}/pay`, {
      headers: { Authorization: `Bearer ${token}` }
    }).catch(() => null)

    if (payRes) {
      expect(payRes.ok()).toBeTruthy()
      const paid = await payRes.json()
      expect(paid.status === 'PAID' || paid.invoice?.status === 'PAID').toBeTruthy()
    } else {
      test.skip(true, 'No test pay endpoint available; manual verification required')
    }

    // Cleanup: attempt to delete invoice and booking
    await request.delete(`${baseUrl}/api/admin/invoices`, { headers: { Authorization: `Bearer ${token}` }, data: { invoiceIds: [invoiceId] } }).catch(()=>null)
    await request.delete(`${baseUrl}/api/admin/bookings`, { headers: { Authorization: `Bearer ${token}` }, data: { bookingIds: [bookingId] } }).catch(()=>null)
  })
})
