(async function(){
  try{
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaClient } = require('@prisma/client')
    const { encode } = require('next-auth/jwt')
    const prisma = new PrismaClient()
    const secret = process.env.NEXTAUTH_SECRET
    if (!secret) { console.error('NEXTAUTH_SECRET not set'); process.exit(1) }
    const user = await prisma.user.findUnique({ where: { email: 'staff@accountingfirm.com' } })
    if (!user) { console.error('user not found'); process.exit(1) }
    const token = {
      name: user.name,
      email: user.email,
      picture: user.image || null,
      sub: user.id,
      role: user.role,
      iat: Math.floor(Date.now()/1000),
      sessionVersion: user.sessionVersion ?? 0
    }
    const encoded = await encode({ token, secret })
    const cookieName = '__Secure-next-auth.session-token'
    const cookie = `${cookieName}=${encoded}; Path=/; HttpOnly; Secure; SameSite=Lax`
    console.log(cookie)
    process.exit(0)
  }catch(e){
    console.error('error', e)
    process.exit(1)
  }
})()
