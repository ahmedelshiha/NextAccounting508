import { test, expect } from '@playwright/test'

async function devLoginAndSetCookie(page, request, baseURL: string, email: string) {
  const base = baseURL || process.env.E2E_BASE_URL || 'http://localhost:3000'
  const res = await request.post(`${base}/api/dev-login`, { data: { email } })
  expect(res.ok()).toBeTruthy()
  const json = await res.json()
  const token = json.token as string
  const url = new URL(base)
  await page.context().addCookies([
    { name: '__Secure-next-auth.session-token', value: token, domain: url.hostname, path: '/', httpOnly: false, secure: false, sameSite: 'Lax' },
  ])
}

test('Portal Financial KPIs render based on /api/bookings data', async ({ page, request, baseURL }) => {
  await devLoginAndSetCookie(page, request, baseURL!, 'client1@example.com')

  // Mock bookings API to control metrics
  await page.route('**/api/bookings', async (route) => {
    const now = new Date()
    const iso = (d: Date) => d.toISOString()
    const data = [
      { id: 'b1', scheduledAt: iso(new Date(now.getTime() + 24*3600*1000)), status: 'CONFIRMED', service: { name: 'Tax Preparation', price: 200 } },
      { id: 'b2', scheduledAt: iso(new Date(now.getTime() + 48*3600*1000)), status: 'PENDING', service: { name: 'Bookkeeping', price: 300 } },
      { id: 'b3', scheduledAt: iso(new Date(now.getTime() - 10*24*3600*1000)), status: 'COMPLETED', service: { name: 'Payroll', price: 150 } },
    ]
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data }) })
  })

  await page.goto('/portal')
  await expect(page.getByText('Financial Overview')).toBeVisible()

  // Upcoming Bookings = 2
  await expect(page.getByText('Upcoming Bookings')).toBeVisible()
  await expect(page.getByText('2')).toBeVisible()

  // Upcoming Value = $500
  await expect(page.getByText('Upcoming Value')).toBeVisible()
  await expect(page.getByText('$500.00')).toBeVisible()

  // Last 30 Days = $150
  await expect(page.getByText('Last 30 Days')).toBeVisible()
  await expect(page.getByText('$150.00')).toBeVisible()

  // Chart title present
  await expect(page.getByText('Monthly Booked Value')).toBeVisible()
})
