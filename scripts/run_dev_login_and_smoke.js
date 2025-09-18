(async function(){
  try{
    const fetch = require('node-fetch')
    const { spawnSync } = require('child_process')
    const loginRes = await fetch('http://localhost:3000/api/_dev/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'staff@accountingfirm.com' }) })
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
