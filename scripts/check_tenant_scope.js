/*
Simple smoke test to verify multi-tenancy scoping for service-requests and users.
Usage:
  TARGET_URL=https://your-staging.example.com AUTH_TOKEN=ey... node scripts/check_tenant_scope.js

It will call /api/admin/service-requests and /api/admin/users with two different x-tenant-id headers and compare results to ensure isolation.
Note: AUTH_TOKEN should be a valid admin bearer token or session cookie header replacement.
*/

 
const fetch = globalThis.fetch || require('node-fetch')

const TARGET_URL = process.env.TARGET_URL
const AUTH_TOKEN = process.env.AUTH_TOKEN

if (!TARGET_URL) {
  console.error('TARGET_URL is required. Set TARGET_URL environment variable to your staging site URL.')
  process.exit(2)
}

if (!AUTH_TOKEN) {
  console.warn('No AUTH_TOKEN provided. If your staging requires auth, set AUTH_TOKEN env var. Proceeding unauthenticated may result in 401 responses.')
}

const tenants = ['tenant-alpha', 'tenant-beta']

async function call(path, tenant) {
  const url = new URL(path, TARGET_URL).toString()
  const headers = {
    'x-tenant-id': tenant,
    'accept': 'application/json'
  }
  if (AUTH_TOKEN) headers['authorization'] = `Bearer ${AUTH_TOKEN}`
  const res = await fetch(url, { headers })
  const text = await res.text()
  let json = null
  try { json = JSON.parse(text) } catch (e) { json = { raw: text } }
  return { status: res.status, data: json }
}

async function main(){
  console.log('Starting tenant scope smoke test against', TARGET_URL)

  const results = {}

  for (const t of tenants) {
    console.log('\nCalling /api/admin/service-requests for', t)
    const sr = await call('/api/admin/service-requests', t)
    console.log('status', sr.status)
    results[`${t}:service-requests`] = sr

    console.log('\nCalling /api/admin/users for', t)
    const users = await call('/api/admin/users', t)
    console.log('status', users.status)
    results[`${t}:users`] = users
  }

  // Basic isolation check: compare counts
  const aSR = results[`${tenants[0]}:service-requests`]
  const bSR = results[`${tenants[1]}:service-requests`]
  const aUsers = results[`${tenants[0]}:users`]
  const bUsers = results[`${tenants[1]}:users`]

  function safeCount(res){
    if (!res || !res.data) return null
    if (Array.isArray(res.data)) return res.data.length
    if (res.data?.pagination && typeof res.data.pagination.total === 'number') return res.data.pagination.total
    if (res.data?.data && Array.isArray(res.data.data)) return res.data.data.length
    return null
  }

  const aSRCount = safeCount(aSR)
  const bSRCount = safeCount(bSR)
  const aUsersCount = safeCount(aUsers)
  const bUsersCount = safeCount(bUsers)

  console.log('\nSummary:')
  console.log(`${tenants[0]} service-requests count:`, aSRCount)
  console.log(`${tenants[1]} service-requests count:`, bSRCount)
  console.log(`${tenants[0]} users count:`, aUsersCount)
  console.log(`${tenants[1]} users count:`, bUsersCount)

  if (aSRCount == null || bSRCount == null) {
    console.warn('Could not determine service-requests counts; inspect raw responses.')
  } else if (aSRCount === bSRCount) {
    console.warn('Service-requests counts are equal between tenants — this might be expected (no data), or indicates insufficient isolation. Please inspect payloads.')
  } else {
    console.log('Service-requests counts differ between tenants — scoping appears to be in effect.')
  }

  if (aUsersCount == null || bUsersCount == null) {
    console.warn('Could not determine users counts; inspect raw responses.')
  } else if (aUsersCount === bUsersCount) {
    console.warn('Users counts are equal between tenants — this might be expected or indicates lack of isolation. Inspect payloads.')
  } else {
    console.log('Users counts differ between tenants — scoping appears to be in effect.')
  }

  console.log('\nRaw outputs for inspection:')
  console.log('---', tenants[0], 'service-requests ---')
  console.log(JSON.stringify(results[`${tenants[0]}:service-requests`], null, 2))
  console.log('---', tenants[1], 'service-requests ---')
  console.log(JSON.stringify(results[`${tenants[1]}:service-requests`], null, 2))

  process.exit(0)
}

main().catch(err => { console.error(err); process.exit(1) })
