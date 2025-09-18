(async function(){
  try{
    const email = 'staff@accountingfirm.com'
    const password = 'staff123'
    const url = 'http://localhost:3000/api/auth/callback/credentials'
    const form = new URLSearchParams()
    form.append('csrfToken','')
    form.append('email', email)
    form.append('password', password)

    const res = await fetch(url, { method: 'POST', body: form, redirect: 'manual' })
    // NextAuth returns a redirect and sets cookies on auth
    const setCookie = res.headers.get('set-cookie') || res.headers.get('Set-Cookie')
    console.log('status', res.status)
    console.log('set-cookie:', setCookie)
    // Also attempt to follow redirect and get session via /api/auth/session
    if (setCookie) {
      const sess = await fetch('http://localhost:3000/api/auth/session', { headers: { cookie: setCookie } })
      const text = await sess.text()
      console.log('session status', sess.status)
      console.log(text)
    }
  }catch(e){
    console.error('error', e)
    process.exit(1)
  }
})()
