// Programmatic NextAuth sign-in based test
// Run with: ADMIN_EMAIL=admin@accountingfirm.com ADMIN_PASSWORD=admin123 tsx scripts/test-thresholds.ts

const base = process.env.BASE_URL || 'http://localhost:3000'
const adminEmail = process.env.ADMIN_EMAIL || 'admin@accountingfirm.com'
const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'

function parseSetCookie(res: Response) {
  const header = res.headers.get('set-cookie')
  if (!header) return undefined
  return header.split(/,(?=[^ ;]+=)/).map(s => s.split(';')[0]).join('; ')
}

async function request(path: string, opts: any = {}, cookie?: string) {
  const headers = opts.headers ? { ...opts.headers } : {}
  if (cookie) headers['cookie'] = cookie
  const res = await fetch(`${base}${path}`, { ...opts, headers })
  const text = await res.text().catch(() => '')
  let json = null
  try { json = text ? JSON.parse(text) : null } catch {}
  return { status: res.status, ok: res.ok, json, text, raw: res }
}

async function signIn() {
  // get csrf token
  const csrfRes = await fetch(`${base}/api/auth/csrf`)
  const csrfJson = await csrfRes.json()
  const csrfToken = csrfJson.csrfToken

  const form = new URLSearchParams()
  form.append('csrfToken', csrfToken)
  form.append('callbackUrl', '/')
  form.append('json', 'true')
  form.append('email', adminEmail)
  form.append('password', adminPassword)

  const res = await fetch(`${base}/api/auth/callback/credentials`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: form.toString(), redirect: 'manual' })
  // NextAuth returns cookies on sign-in; capture them
  const setCookie = res.headers.get('set-cookie') || res.headers.get('Set-Cookie')
  if (!setCookie) throw new Error('No set-cookie header received during sign-in')
  // Build cookie string for subsequent requests
  const cookie = setCookie.split(/,(?=[^ ;]+=)/).map(s => s.split(';')[0]).join('; ')
  return cookie
}

async function run() {
  console.log('Testing thresholds route against', base)

  console.log('1) GET without auth -> expect 401')
  const res1 = await request('/api/admin/thresholds')
  console.log('  status=', res1.status)
  if (res1.status !== 401) process.exitCode = 2

  console.log('2) POST without auth -> expect 401')
  const res2 = await request('/api/admin/thresholds', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ responseTime: 123, errorRate: 2.2, storageGrowth: 10 }) })
  console.log('  status=', res2.status)
  if (res2.status !== 401) process.exitCode = 2

  console.log('3) Sign in programmatically with credentials')
  const cookie = await signIn()
  console.log('  obtained cookie length=', cookie.length)

  console.log('4) GET with session cookie -> expect 200')
  const res3 = await request('/api/admin/thresholds', { method: 'GET' }, cookie)
  console.log('  status=', res3.status, 'body=', res3.json)
  if (res3.status !== 200) process.exitCode = 2

  console.log('5) POST with session cookie -> expect 200 and persisted values')
  const payload = { responseTime: 555, errorRate: 5.5, storageGrowth: 12.5 }
  const res4 = await request('/api/admin/thresholds', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }, cookie)
  console.log('  status=', res4.status, 'body=', res4.json)
  if (res4.status !== 200) process.exitCode = 2

  console.log('6) Confirm GET returns updated values')
  const res5 = await request('/api/admin/thresholds', { method: 'GET' }, cookie)
  console.log('  status=', res5.status, 'body=', res5.json)
  if (res5.status !== 200) process.exitCode = 2
  const got = res5.json || {}
  if (got.responseTime !== payload.responseTime) {
    console.error('responseTime mismatch', got.responseTime, payload.responseTime)
    process.exitCode = 2
  }

  if (!process.exitCode) console.log('All threshold route tests passed')
}

run().catch((err) => { console.error(err); process.exitCode = 1 })
