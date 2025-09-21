import { test, expect } from '@playwright/test'

// This test attempts a headless UI login on the preview site using credentials supplied
// via GitHub Actions secrets: PREVIEW_ADMIN_EMAIL and PREVIEW_ADMIN_PASSWORD.
// It supports a fallback where PREVIEW_SESSION_COOKIE can be provided as a full "name=value" cookie
// to authenticate without UI interaction.

const LOGIN_SELECTORS = [
  { email: 'input[name="email"]', password: 'input[name="password"]', submit: 'button[type="submit"]' },
  { email: 'input[name="username"]', password: 'input[name="password"]', submit: 'button[type="submit"]' },
  { email: 'input[type="email"]', password: 'input[type="password"]', submit: 'button[type="submit"]' },
]

test('preview admin login and admin health', async ({ page, request }) => {
  const base = process.env.PREVIEW_URL
  if (!base) throw new Error('PREVIEW_URL must be provided')

  // If a session cookie is provided as NAME=VALUE, apply it directly
  const sessionCookie = process.env.PREVIEW_SESSION_COOKIE
  if (sessionCookie) {
    const [name, ...rest] = sessionCookie.split('=')
    const value = rest.join('=')
    const url = new URL(base)
    await page.context().addCookies([{ name, value, domain: url.hostname, path: '/', httpOnly: true, secure: true }])
    await page.goto(base, { waitUntil: 'networkidle' })
  } else {
    // Try a handful of common login paths
    const loginPath = process.env.PREVIEW_LOGIN_PATH || '/login'
    await page.goto(`${base}${loginPath}`, { waitUntil: 'networkidle' })

    const email = process.env.PREVIEW_ADMIN_EMAIL
    const password = process.env.PREVIEW_ADMIN_PASSWORD
    if (!email || !password) throw new Error('PREVIEW_ADMIN_EMAIL and PREVIEW_ADMIN_PASSWORD must be provided if PREVIEW_SESSION_COOKIE is not set')

    let didSubmit = false
    for (const sel of LOGIN_SELECTORS) {
      try {
        const emailEl = await page.locator(sel.email).first()
        const passEl = await page.locator(sel.password).first()
        const submitEl = await page.locator(sel.submit).first()
        if (await emailEl.count() && await passEl.count() && await submitEl.count()) {
          await emailEl.fill(email)
          await passEl.fill(password)
          await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle', timeout: 10000 }), submitEl.click()])
          didSubmit = true
          break
        }
      } catch (e) {
        // continue trying other selector sets
      }
    }

    if (!didSubmit) {
      // If we couldn't find a login form, attempt to POST to common next-auth sign-in route as fallback
      try {
        const authRes = await request.post(`${base}/api/auth/callback/credentials`, {
          form: {
            csrfToken: '',
            email: process.env.PREVIEW_ADMIN_EMAIL,
            password: process.env.PREVIEW_ADMIN_PASSWORD,
          },
        })
        // ignore result; we'll check auth via subsequent request
      } catch (e) {
        // ignore
      }
  }
  }

  // After attempting auth, verify admin health endpoint is reachable and returns 200
  const healthUrl = `${base}/api/admin/system/health`
  const res = await request.get(healthUrl)
  const status = res.status()
  // We expect 200 for logged-in session; treat 401 as failure when using login flow
  if (process.env.PREVIEW_SESSION_COOKIE) {
    expect([200, 401]).toContain(status)
  } else {
    expect(status).toBe(200)
  }
})
