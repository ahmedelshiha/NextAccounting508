(async function(){
  try{
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { spawnSync } = require('child_process')
    const fetch = globalThis.fetch || (async (...args) => {
      const nodeFetch = await import('node-fetch')
      return nodeFetch.default(...args)
    })
    const loginRes = await fetch('http://localhost:3000/api/dev-login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'staff@accountingfirm.com' }) })
    const json = await loginRes.json().catch(()=>null)
    if (!loginRes.ok || !json) {
      console.error('dev login failed', loginRes.status, json)
      process.exit(1)
    }
    const token = json.token
    if (!token) {
      console.error('no token returned', json)
      process.exit(1)
    }
    console.log('got token, running smoke tests')
    const result = spawnSync('node', ['scripts/smoke_smoke_tests.js', token], { stdio: 'inherit', env: process.env })
    process.exit(result.status ?? 0)
  }catch(e){
    console.error('error', e)
    process.exit(1)
  }
})()
