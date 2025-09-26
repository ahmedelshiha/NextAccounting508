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

test('Portal chat: send message and see it appear via realtime', async ({ page, request, baseURL }) => {
  await devLoginAndSetCookie(page, request, baseURL!, 'client1@example.com')

  // Ensure initial backlog is empty
  await page.route('**/api/portal/chat?limit=50', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ messages: [] }) })
  })

  await page.goto('/portal')
  await expect(page.getByText('Message Center')).toBeVisible()

  const msg = `Hello from E2E ${Date.now()}`
  const input = page.getByLabel('Type your message')
  await input.fill(msg)
  await page.getByRole('button', { name: 'Send' }).click()

  // Expect to see the message appear (via SSE broadcast)
  await expect(page.getByText(msg)).toBeVisible({ timeout: 10000 })
})
