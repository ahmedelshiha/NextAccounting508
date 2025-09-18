(async function(){
  try{
    const email = 'staff@accountingfirm.com'
    const password = 'staff123'
    const csrfRes = await fetch('http://localhost:3000/api/auth/csrf')
    const csrfSet = csrfRes.headers.get('set-cookie') || csrfRes.headers.get('Set-Cookie') || ''
    const csrfJson = await csrfRes.json()
    const csrfToken = csrfJson.csrfToken || ''
    console.log('got csrfToken', Boolean(csrfToken))

    const form = new URLSearchParams()
    form.append('csrfToken', csrfToken)
    form.append('callbackUrl','/')
    form.append('email', email)
    form.append('password', password)

    const res = await fetch('http://localhost:3000/api/auth/callback/credentials', { method: 'POST', body: form, redirect: 'manual', headers: { cookie: csrfSet } })
    const setCookie = res.headers.get('set-cookie') || res.headers.get('Set-Cookie')
    console.log('signin status', res.status)
    console.log('set-cookie:', setCookie)

    // Try to get session using returned cookies (combine csrfSet and setCookie)
    let cookieHeader = [csrfSet, setCookie].filter(Boolean).join('; ')
    if (!cookieHeader) cookieHeader = setCookie || csrfSet || ''
    const sess = await fetch('http://localhost:3000/api/auth/session', { headers: { cookie: cookieHeader } })
    const sessJson = await sess.json().catch(() => null)
    console.log('session status', sess.status)
    console.log('session body', sessJson)
  }catch(e){
    console.error('error', e)
    process.exit(1)
  }
})()
