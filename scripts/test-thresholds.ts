// Run with: ADMIN_TEST_SECRET=dev_secret_please_change tsx scripts/test-thresholds.ts

const base = process.env.BASE_URL || 'http://localhost:3000'
const secret = process.env.ADMIN_TEST_SECRET || 'dev_secret_please_change'

async function request(path: string, opts: any = {}) {
  const res = await fetch(`${base}${path}`, opts)
  const text = await res.text().catch(() => '')
  let json = null
  try { json = text ? JSON.parse(text) : null } catch {}
  return { status: res.status, ok: res.ok, json, text }
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

  console.log('3) GET with dev header -> expect 200')
  const res3 = await request('/api/admin/thresholds', { headers: { 'x-admin-secret': secret } })
  console.log('  status=', res3.status, 'body=', res3.json)
  if (res3.status !== 200) process.exitCode = 2

  console.log('4) POST with dev header -> expect 200 and persisted values')
  const payload = { responseTime: 555, errorRate: 5.5, storageGrowth: 12.5 }
  const res4 = await request('/api/admin/thresholds', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret }, body: JSON.stringify(payload) })
  console.log('  status=', res4.status, 'body=', res4.json)
  if (res4.status !== 200) process.exitCode = 2

  console.log('5) Confirm GET returns updated values')
  const res5 = await request('/api/admin/thresholds', { headers: { 'x-admin-secret': secret } })
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
