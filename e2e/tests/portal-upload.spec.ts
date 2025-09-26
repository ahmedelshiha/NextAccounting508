import { test, expect } from '@playwright/test'

async function devLoginAndSetCookie(page, request, baseURL: string, email: string) {
  const base = baseURL || process.env.E2E_BASE_URL || 'http://localhost:3000'
  const res = await request.post(`${base}/api/dev-login`, { data: { email } })
  expect(res.ok()).toBeTruthy()
  const json = await res.json()
  const token = json.token as string
  const url = new URL(base)
  await page.context().addCookies([
    {
      name: '__Secure-next-auth.session-token',
      value: token,
      domain: url.hostname,
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'Lax',
    },
  ])
}

test.describe('Portal Uploads', () => {
  test('happy path upload succeeds and shows Uploaded status', async ({ page, request, baseURL }) => {
    await devLoginAndSetCookie(page, request, baseURL!, 'client1@example.com')

    // Intercept uploads API with success
    await page.route('**/api/uploads', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { key: 'portal/receipts/test.pdf', url: 'https://example.com/test.pdf', contentType: 'application/pdf', size: 12345 } })
      })
    })

    await page.goto('/portal')
    await expect(page.getByText('Secure Document Upload')).toBeVisible()

    // Choose file
    const fileInput = page.getByLabel('Choose file')
    await fileInput.setInputFiles({ name: 'test.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4') })

    // Click Upload
    await page.getByRole('button', { name: 'Upload' }).click()

    // Verify recent uploads shows success
    await expect(page.getByText('Recent uploads')).toBeVisible()
    await expect(page.getByText('test.pdf')).toBeVisible()
    await expect(page.getByLabel('Uploaded')).toBeVisible()
  })

  test('AV rejection shows Rejected status and message', async ({ page, request, baseURL }) => {
    await devLoginAndSetCookie(page, request, baseURL!, 'client1@example.com')

    // Intercept uploads API with AV rejection
    await page.route('**/api/uploads', async (route) => {
      await route.fulfill({
        status: 422,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'File failed antivirus scan' })
      })
    })

    await page.goto('/portal')
    await expect(page.getByText('Secure Document Upload')).toBeVisible()

    const fileInput = page.getByLabel('Choose file')
    await fileInput.setInputFiles({ name: 'infected.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 BAD') })

    await page.getByRole('button', { name: 'Upload' }).click()

    await expect(page.getByText('infected.pdf')).toBeVisible()
    await expect(page.getByLabel('Rejected')).toBeVisible()
    await expect(page.getByText('File failed antivirus scan')).toBeVisible()
  })
})
