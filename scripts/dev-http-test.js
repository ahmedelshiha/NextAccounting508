import fetch from 'node-fetch';

async function run(){
  try{
    // dev login
    const loginRes = await fetch('http://localhost:3000/api/dev-login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'staff@accountingfirm.com' }) })
    const loginText = await loginRes.text()
    console.log('login status', loginRes.status)
    console.log(loginText)
    const cookie = loginRes.headers.get('set-cookie')
    console.log('cookie', cookie)
    if (!cookie) { console.error('No cookie from dev-login'); process.exit(1) }

    // find a service
    const svcRes = await fetch('http://localhost:3000/api/services')
    const svcs = await svcRes.json()
    const svc = Array.isArray(svcs) ? svcs[0] : (svcs?.data ? svcs.data[0] : null)
    if(!svc){ console.error('no service'); process.exit(1) }

    const payload = { serviceId: svc.id, description: 'Dev test request', priority: 'MEDIUM' }
    const res = await fetch('http://localhost:3000/api/portal/service-requests', { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie }, body: JSON.stringify(payload) })
    console.log('create status', res.status)
    const text = await res.text()
    console.log(text)
  } catch(e){ console.error(e); process.exit(2) }
}
run()
