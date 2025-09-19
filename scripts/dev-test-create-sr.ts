import fs from 'fs'
import path from 'path'
import prisma from '../src/lib/prisma'
import { encode } from 'next-auth/jwt'

async function run() {
  try {
    const email = process.argv[2] || 'staff@accountingfirm.com'
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      console.error('User not found:', email)
      process.exit(1)
    }
    const tokenPayload = {
      name: user.name,
      email: user.email,
      picture: user.image || null,
      sub: user.id,
      role: user.role,
      sessionVersion: user.sessionVersion ?? 0,
      iat: Math.floor(Date.now() / 1000),
    }
    const secret = process.env.NEXTAUTH_SECRET
    if (!secret) {
      console.error('NEXTAUTH_SECRET not set')
      process.exit(1)
    }
    const encoded = await encode({ token: tokenPayload as any, secret })
    const Cookie = `__Secure-next-auth.session-token=${encoded}`

    // Build payload
    const services = await prisma.service.findMany({ take: 1 })
    if (!services || services.length === 0) {
      console.error('No services found to test')
      process.exit(1)
    }
    const svc = services[0]
    const body = {
      serviceId: svc.id,
      description: 'Test request from dev-test script',
      priority: 'MEDIUM',
      budgetMin: 100,
      budgetMax: 500,
    }

    // Import the route handler and call it
    const modPath = path.resolve(__dirname, '../src/app/api/portal/service-requests/route.ts')
    const mod = await import(modPath)
    // Build a Request-like object
    const req = new Request('http://localhost/api/portal/service-requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: Cookie,
      },
      body: JSON.stringify(body),
    })

    const res = await mod.POST(req)
    // response could be NextResponse; convert to text/json
    try {
      const text = await res.text()
      console.log('Response status:', res.status)
      console.log(text)
    } catch (e) {
      console.error('Could not read response body', e)
    }
    process.exit(0)
  } catch (e) {
    console.error('Error in dev-test script', e)
    process.exit(2)
  }
}

run()
