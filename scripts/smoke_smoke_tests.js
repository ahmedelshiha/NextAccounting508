(async function(){
  try{
    const cookie = `__Secure-next-auth.session-token=${process.argv[2]}`
    if (!process.argv[2]) { console.error('Provide token as first arg'); process.exit(1) }
    const headers = { cookie, 'content-type': 'application/json' }
    console.log('Fetching services...')
    const servicesRes = await fetch('http://localhost:3000/api/services')
    const servicesJson = await servicesRes.json()
    const services = Array.isArray(servicesJson?.data) ? servicesJson.data : servicesJson
    console.log('services count', services.length)
    const svc = services[0]
    if (!svc) { console.error('no service'); process.exit(1) }
    console.log('using service', svc.id || svc)

    console.log('GET portal list')
    const listRes = await fetch('http://localhost:3000/api/portal/service-requests', { headers })
    console.log('list status', listRes.status)
    const listJson = await listRes.json().catch(()=>null)
    console.log('list body', listJson)

    console.log('POST create request')
    const body = { serviceId: svc.id || svc, title: 'Smoke test request', description: 'Created by smoke test', priority: 'MEDIUM' }
    const createRes = await fetch('http://localhost:3000/api/portal/service-requests', { method: 'POST', headers, body: JSON.stringify(body) })
    console.log('create status', createRes.status)
    const createJson = await createRes.json().catch(()=>null)
    console.log('create body', createJson)

    if (createRes.ok) {
      const id = createJson?.data?.id
      console.log('GET detail', id)
      const detailRes = await fetch(`http://localhost:3000/api/portal/service-requests/${encodeURIComponent(id)}`, { headers })
      console.log('detail status', detailRes.status)
      const detailJson = await detailRes.json().catch(()=>null)
      console.log('detail body', detailJson)
    }
  }catch(e){
    console.error('error', e)
    process.exit(1)
  }
})()
